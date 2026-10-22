import { metadataPreflight, metadataResponse } from '@/oauth/metadataResponse'
import { getProtectedResourceMetadata } from '@/oauth/urls'

// RFC 9728 protected resource metadata for /api/mcp, at the root well-known location.
// Read NEXT_PUBLIC_SERVER_URL per request rather than baking the build-time value in.
export const dynamic = 'force-dynamic'

export const GET = () => metadataResponse(getProtectedResourceMetadata())
export const OPTIONS = () => metadataPreflight()
