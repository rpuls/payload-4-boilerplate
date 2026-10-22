import { publicCORSHeaders } from './http'

/**
 * Discovery documents are public and change only with NEXT_PUBLIC_SERVER_URL. Browser-based MCP
 * clients (the MCP Inspector) fetch them cross-origin with an `MCP-Protocol-Version` header,
 * which needs a CORS preflight.
 */
export const metadataResponse = (document: Record<string, unknown>): Response =>
  Response.json(document, {
    headers: {
      ...publicCORSHeaders,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=300',
    },
  })

export const metadataPreflight = (): Response =>
  new Response(null, {
    status: 204,
    headers: { ...publicCORSHeaders, 'Access-Control-Allow-Methods': 'GET, OPTIONS' },
  })
