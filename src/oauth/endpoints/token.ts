import type { Endpoint, Payload } from 'payload'

import type { OauthClient } from '@/payload-types'

import { authenticateClient } from '../clients'
import { RATE_LIMITS } from '../constants'
import { verifyPKCE } from '../crypto'
import { oauthError, oauthJSON, rateLimited, readParams } from '../http'
import { checkRateLimit, getClientIP } from '../rateLimit'
import {
  claimSingleUse,
  cleanupExpired,
  findAuthorizationCode,
  findOrCreateGrant,
  findToken,
  issueTokens,
  relationId,
  revokeGrant,
  sameId,
} from '../tokens'
import { isThisMCPResource } from '../urls'

const invalidGrant = (description: string) => oauthError('invalid_grant', description)

const exchangeAuthorizationCode = async ({
  client,
  params,
  payload,
}: {
  client: OauthClient
  params: URLSearchParams
  payload: Payload
}): Promise<Response> => {
  const code = params.get('code')
  const codeVerifier = params.get('code_verifier')
  const redirectUri = params.get('redirect_uri')
  const resource = params.get('resource')

  if (!code) return oauthError('invalid_request', 'code is required')
  if (!codeVerifier) return oauthError('invalid_request', 'code_verifier is required')

  const record = await findAuthorizationCode(payload, code)
  if (!record) return invalidGrant('Unknown authorization code')

  if (record.usedAt) {
    // OAuth 2.1 §4.1.3: a replayed code revokes what the first exchange produced
    const grantId = relationId(record.grant)
    if (grantId !== null) await revokeGrant(payload, grantId)
    payload.logger.warn({ clientId: client.clientId, msg: 'OAuth: authorization code replayed' })
    return invalidGrant('Authorization code was already used')
  }
  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    return invalidGrant('Authorization code has expired')
  }
  if (!sameId(relationId(record.client), client.id)) {
    return invalidGrant('Authorization code was issued to another client')
  }
  if (redirectUri !== null && redirectUri !== record.redirectUri) {
    return invalidGrant('redirect_uri does not match the authorization request')
  }
  if (!verifyPKCE(codeVerifier, record.codeChallenge)) {
    return invalidGrant('code_verifier does not match code_challenge')
  }
  if (resource !== null && !isThisMCPResource(resource)) {
    return oauthError('invalid_target', 'The token can only be issued for this MCP server')
  }

  const userId = relationId(record.user)
  if (userId === null) return invalidGrant('Authorization code has no user')

  // Claim the code before issuing anything, so a concurrent duplicate request gets nothing
  if (!(await claimSingleUse(payload, 'oauth-authorization-codes', record.id))) {
    return invalidGrant('Authorization code was already used')
  }

  const grant = await findOrCreateGrant({
    clientRecordId: client.id,
    payload,
    resource: record.resource,
    scope: record.scope,
    userId,
  })
  // Remember what the code produced, so a later replay can revoke it
  await payload.update({
    id: record.id,
    collection: 'oauth-authorization-codes',
    data: { grant: grant.id },
    depth: 0,
    overrideAccess: true,
  })

  const tokens = await issueTokens({ grant, payload })
  payload.logger.info({
    clientId: client.clientId,
    msg: 'OAuth: issued tokens for authorization code',
    userId,
  })
  return oauthJSON(tokens)
}

const refreshAccessToken = async ({
  client,
  params,
  payload,
}: {
  client: OauthClient
  params: URLSearchParams
  payload: Payload
}): Promise<Response> => {
  const refreshToken = params.get('refresh_token')
  const resource = params.get('resource')
  const requestedScope = params.get('scope')

  if (!refreshToken) return oauthError('invalid_request', 'refresh_token is required')

  const record = await findToken(payload, 'refresh', refreshToken)
  if (!record) return invalidGrant('Unknown refresh token')
  if (!sameId(relationId(record.client), client.id)) {
    return invalidGrant('Refresh token was issued to another client')
  }

  const grantId = relationId(record.grant)
  if (record.usedAt) {
    // OAuth 2.1 §4.3.1: a spent refresh token showing up again means it leaked. Revoke everything.
    if (grantId !== null) await revokeGrant(payload, grantId)
    payload.logger.warn({ clientId: client.clientId, msg: 'OAuth: refresh token reuse detected' })
    return invalidGrant('Refresh token was already used')
  }
  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    return invalidGrant('Refresh token has expired')
  }
  if (resource !== null && !isThisMCPResource(resource)) {
    return oauthError('invalid_target', 'The token can only be issued for this MCP server')
  }

  const grant =
    grantId === null
      ? null
      : await payload.findByID({
          id: grantId,
          collection: 'oauth-grants',
          depth: 0,
          disableErrors: true,
          overrideAccess: true,
        })
  if (!grant || grant.revokedAt) return invalidGrant('Access has been revoked')

  if (requestedScope !== null) {
    const granted = new Set((grant.scope ?? '').split(' ').filter(Boolean))
    const requested = requestedScope.split(' ').filter(Boolean)
    if (requested.some((scope) => !granted.has(scope))) {
      return oauthError('invalid_scope', 'Requested scope exceeds the original grant')
    }
  }

  if (!(await claimSingleUse(payload, 'oauth-tokens', record.id))) {
    return invalidGrant('Refresh token was already used')
  }

  const tokens = await issueTokens({ grant, payload })
  return oauthJSON(tokens)
}

/** The token endpoint (OAuth 2.1 §3.2): authorization codes in, access and refresh tokens out */
export const tokenEndpoint: Endpoint = {
  handler: async (req) => {
    const limit = checkRateLimit(`token:${getClientIP(req.headers)}`, RATE_LIMITS.token)
    if (!limit.allowed) return rateLimited(limit.retryAfterSeconds)

    const params = await readParams(req)
    if (!params) return oauthError('invalid_request', 'The request body could not be parsed')

    const auth = await authenticateClient({ params, payload: req.payload, req })
    if (!auth.ok) {
      return oauthError(
        'invalid_client',
        auth.description,
        401,
        auth.usedBasicAuth ? { 'WWW-Authenticate': 'Basic realm="OAuth"' } : {},
      )
    }

    const grantType = params.get('grant_type')
    let response: Response
    if (grantType === 'authorization_code') {
      response = await exchangeAuthorizationCode({ client: auth.client, params, payload: req.payload })
    } else if (grantType === 'refresh_token') {
      response = await refreshAccessToken({ client: auth.client, params, payload: req.payload })
    } else {
      response = oauthError(
        'unsupported_grant_type',
        'Supported grant types: authorization_code, refresh_token',
      )
    }

    // Housekeeping rides along with real traffic, so no scheduler is needed
    await cleanupExpired(req.payload)

    return response
  },
  method: 'post',
  path: '/oauth/token',
}
