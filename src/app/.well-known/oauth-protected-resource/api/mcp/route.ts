import { metadataPreflight, metadataResponse } from '@/oauth/metadataResponse'
import { getProtectedResourceMetadata } from '@/oauth/urls'

// RFC 9728 protected resource metadata at the path-suffixed location MCP clients probe first
// for a server at /api/mcp. This is also the URL the 401 challenge points at.
export const dynamic = 'force-dynamic'

export const GET = () => metadataResponse(getProtectedResourceMetadata())
export const OPTIONS = () => metadataPreflight()
