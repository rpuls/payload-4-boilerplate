import type { Endpoint } from 'payload'

import { validateClientMetadata } from '../clientMetadata'
import { registerDynamicClient } from '../clients'
import { RATE_LIMITS } from '../constants'
import { oauthError, oauthJSON, rateLimited, readBodyText } from '../http'
import { checkRateLimit, getClientIP } from '../rateLimit'

/**
 * Dynamic client registration (RFC 7591). Open to anyone, like every OAuth registration
 * endpoint: a registration grants nothing until a user signs in and allows the client.
 */
export const registerEndpoint: Endpoint = {
  handler: async (req) => {
    const limit = checkRateLimit(`register:${getClientIP(req.headers)}`, RATE_LIMITS.register)
    if (!limit.allowed) return rateLimited(limit.retryAfterSeconds)

    let body: unknown
    try {
      body = JSON.parse(await readBodyText(req))
    } catch {
      return oauthError('invalid_client_metadata', 'The request body must be a JSON object')
    }

    const validated = validateClientMetadata(body, 'dynamic')
    if (!validated.ok) return oauthError(validated.error, validated.description)

    const { client, clientSecret } = await registerDynamicClient({
      metadata: validated.metadata,
      payload: req.payload,
    })

    req.payload.logger.info({
      clientId: client.clientId,
      clientName: client.clientName,
      msg: 'OAuth client registered',
      redirectUris: validated.metadata.redirectUris,
    })

    return oauthJSON(
      {
        client_id: client.clientId,
        client_id_issued_at: Math.floor(new Date(client.createdAt).getTime() / 1000),
        ...(clientSecret ? { client_secret: clientSecret, client_secret_expires_at: 0 } : {}),
        ...validated.metadata.registered,
      },
      201,
    )
  },
  method: 'post',
  path: '/oauth/register',
}
