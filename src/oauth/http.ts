import type { PayloadRequest } from 'payload'

import { getIssuer } from './urls'

/**
 * Response helpers shared by the OAuth endpoints. Token-style endpoints are called by other
 * servers and by browser-based clients such as the MCP Inspector, so they answer with permissive
 * CORS; they never rely on cookies. Browser-facing endpoints (consent, revocation from the admin)
 * do the opposite and insist on same-origin requests.
 */

export const publicCORSHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Protocol-Version',
  'Access-Control-Max-Age': '86400',
}

const noStoreHeaders: Record<string, string> = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
}

export const oauthJSON = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response =>
  Response.json(body, { status, headers: { ...publicCORSHeaders, ...noStoreHeaders, ...headers } })

/** RFC 6749 §5.2 error body */
export const oauthError = (
  error: string,
  description: string,
  status = 400,
  headers: Record<string, string> = {},
): Response => oauthJSON({ error, error_description: description }, status, headers)

export const preflight = (): Response => new Response(null, { status: 204, headers: publicCORSHeaders })

export const rateLimited = (retryAfterSeconds: number): Response =>
  oauthError('too_many_requests', 'Too many requests. Try again later.', 429, {
    'Retry-After': String(retryAfterSeconds),
  })

/** 303 so a POSTed form never gets re-posted to the client's redirect URI */
export const seeOther = (location: string): Response =>
  new Response(null, { status: 303, headers: { Location: location, ...noStoreHeaders } })

/** The raw request body. Payload types the body readers as optional, so guard the call. */
export const readBodyText = async (req: PayloadRequest): Promise<string> =>
  typeof req.text === 'function' ? req.text() : ''

/**
 * Reads `application/x-www-form-urlencoded` (what OAuth specifies) or JSON bodies into one
 * shape. Returns null when the body cannot be parsed.
 */
export const readParams = async (req: PayloadRequest): Promise<null | URLSearchParams> => {
  const contentType = req.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? ''
  try {
    const text = await readBodyText(req)
    if (contentType === 'application/json') {
      const parsed: unknown = JSON.parse(text)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'string') params.set(key, value)
        else if (typeof value === 'number' || typeof value === 'boolean') params.set(key, String(value))
      }
      return params
    }
    return new URLSearchParams(text)
  } catch {
    return null
  }
}

/**
 * Browser-facing endpoints only accept requests that the browser marks as coming from this site.
 * Payload's cookie handling allows any Origin when `serverURL` is unset, so this is checked here.
 */
export const isSameOriginRequest = (req: PayloadRequest): boolean => {
  const origin = req.headers.get('origin')
  if (origin && origin !== getIssuer()) return false
  const site = req.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return false
  return true
}
