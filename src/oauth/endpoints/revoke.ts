import type { Endpoint } from 'payload'

import { authenticateClient } from '../clients'
import { RATE_LIMITS } from '../constants'
import { oauthError, publicCORSHeaders, rateLimited, readParams } from '../http'
import { checkRateLimit, getClientIP } from '../rateLimit'
import { findToken, relationId, revokeGrant, sameId } from '../tokens'

/**
 * Token revocation (RFC 7009), for clients that offer a "disconnect" action. Revoking either an
 * access or a refresh token revokes the whole grant, since the client is walking away from it.
 * Tokens that do not belong to the calling client are ignored silently, as the RFC requires.
 */
export const revokeEndpoint: Endpoint = {
  handler: async (req) => {
    const limit = checkRateLimit(`revoke:${getClientIP(req.headers)}`, RATE_LIMITS.revoke)
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

    const token = params.get('token')
    if (!token) return oauthError('invalid_request', 'token is required')

    const record = await findToken(req.payload, undefined, token)
    if (record && sameId(relationId(record.client), auth.client.id)) {
      const grantId = relationId(record.grant)
      if (grantId !== null) await revokeGrant(req.payload, grantId)
      req.payload.logger.info({ clientId: auth.client.clientId, msg: 'OAuth: client revoked its grant' })
    }

    return new Response(null, {
      headers: { ...publicCORSHeaders, 'Cache-Control': 'no-store' },
      status: 200,
    })
  },
  method: 'post',
  path: '/oauth/revoke',
}
