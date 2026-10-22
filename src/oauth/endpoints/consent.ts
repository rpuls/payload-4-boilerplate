import type { Endpoint } from 'payload'

import { generateExpiredPayloadCookie } from 'payload'

import {
  buildAuthorizeURL,
  buildRedirectURL,
  issueAuthorizationCode,
  readConsentToken,
} from '../authorize'
import { getClientRedirectUris } from '../clients'
import { isSameOriginRequest, readParams, seeOther } from '../http'
import { redirectUriMatches } from '../redirectUris'
import { oauthPaths } from '../urls'

/**
 * Receives the consent form. The signed request token carries the full authorization request
 * and the id of the user who saw the page; the submission must come from that same, still
 * signed-in user. On "allow" an authorization code is issued and the browser is sent to the
 * client's redirect URI; on "deny" the client learns `access_denied`. The redirect URI is
 * checked against the client's registration once more, so a stale token can never redirect
 * anywhere the client no longer owns.
 */
export const consentDecisionEndpoint: Endpoint = {
  handler: async (req) => {
    if (!isSameOriginRequest(req)) {
      return Response.json({ error: 'Cross-site form submissions are not accepted' }, { status: 403 })
    }

    const form = await readParams(req)
    const consent = readConsentToken(req.payload.secret, form?.get('request'))
    if (!consent) return seeOther(`${oauthPaths.authorize}?reason=expired`)

    const authorizeURL = buildAuthorizeURL(consent.req)
    // Not signed in, or signed in as someone else since the page was rendered: start over there
    if (!req.user || String(req.user.id) !== String(consent.uid)) return seeOther(authorizeURL)

    const client = await req.payload.findByID({
      id: consent.cid,
      collection: 'oauth-clients',
      depth: 0,
      disableErrors: true,
      overrideAccess: true,
    })
    if (!client || client.clientId !== consent.req.clientId) {
      return seeOther(`${oauthPaths.authorize}?reason=unknown_client`)
    }
    if (!redirectUriMatches(getClientRedirectUris(client), consent.req.redirectUri)) {
      return Response.json(
        { error: 'The redirect URI is no longer registered for this client' },
        { status: 400 },
      )
    }

    const { redirectUri, state } = consent.req

    if (form?.get('decision') !== 'allow') {
      req.payload.logger.info({
        clientId: client.clientId,
        msg: 'OAuth: user denied the authorization request',
        userId: req.user.id,
      })
      return seeOther(
        buildRedirectURL(redirectUri, {
          error: 'access_denied',
          error_description: 'The user denied the request',
          state,
        }),
      )
    }

    const code = await issueAuthorizationCode({
      client,
      payload: req.payload,
      request: consent.req,
      userId: req.user.id,
    })
    req.payload.logger.info({
      clientId: client.clientId,
      msg: 'OAuth: user allowed the authorization request',
      userId: req.user.id,
    })

    return seeOther(buildRedirectURL(redirectUri, { code, state }))
  },
  method: 'post',
  path: '/oauth/authorize',
}

/**
 * "Not you?" on the consent page: signs the browser out and returns to the admin login with the
 * authorization request preserved, so the right person can sign in and continue.
 */
export const switchAccountEndpoint: Endpoint = {
  handler: (req) => {
    if (!isSameOriginRequest(req)) {
      return Response.json({ error: 'Cross-site requests are not accepted' }, { status: 403 })
    }

    const adminRoute = req.payload.config.routes.admin
    const consent = readConsentToken(req.payload.secret, req.searchParams.get('request'))
    const location = consent
      ? `${adminRoute}/login?redirect=${encodeURIComponent(buildAuthorizeURL(consent.req))}`
      : `${adminRoute}/login`

    const expiredCookie = generateExpiredPayloadCookie({
      collectionAuthConfig: req.payload.collections.users.config.auth,
      cookiePrefix: req.payload.config.cookiePrefix,
    })

    return new Response(null, {
      headers: { 'Cache-Control': 'no-store', Location: location, 'Set-Cookie': expiredCookie },
      status: 303,
    })
  },
  method: 'get',
  path: '/oauth/switch-account',
}
