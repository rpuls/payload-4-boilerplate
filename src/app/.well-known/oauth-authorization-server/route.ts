import { metadataPreflight, metadataResponse } from '@/oauth/metadataResponse'
import { getAuthorizationServerMetadata } from '@/oauth/urls'

// RFC 8414 authorization server metadata. The issuer is the site origin, so this root location
// is the one clients derive from the protected resource metadata.
export const dynamic = 'force-dynamic'

export const GET = () => metadataResponse(getAuthorizationServerMetadata())
export const OPTIONS = () => metadataPreflight()
