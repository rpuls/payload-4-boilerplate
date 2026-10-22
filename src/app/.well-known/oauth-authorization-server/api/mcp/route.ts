import { metadataPreflight, metadataResponse } from '@/oauth/metadataResponse'
import { getAuthorizationServerMetadata } from '@/oauth/urls'

// Some MCP clients build the authorization server metadata URL from the MCP endpoint path
// instead of the issuer. Serve the same document there too.
export const dynamic = 'force-dynamic'

export const GET = () => metadataResponse(getAuthorizationServerMetadata())
export const OPTIONS = () => metadataPreflight()
