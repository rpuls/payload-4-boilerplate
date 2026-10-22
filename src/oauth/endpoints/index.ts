import type { Endpoint } from 'payload'

import { preflight } from '../http'
import { consentDecisionEndpoint, switchAccountEndpoint } from './consent'
import { revokeGrantEndpoint } from './grants'
import { registerEndpoint } from './register'
import { revokeEndpoint } from './revoke'
import { tokenEndpoint } from './token'

// Browser-based MCP clients (the MCP Inspector) call these cross-origin, so answer preflights
const preflightFor = (path: string): Endpoint => ({ handler: preflight, method: 'options', path })

/**
 * The OAuth authorization server for /api/mcp, mounted under Payload's REST prefix:
 * /api/oauth/register, /api/oauth/token, /api/oauth/revoke, plus the consent decision and the
 * admin's revocation action. Discovery documents live under /.well-known (see src/app/.well-known)
 * and the consent page at /oauth/authorize (see src/app/(frontend)/oauth).
 */
export const oauthEndpoints: Endpoint[] = [
  registerEndpoint,
  tokenEndpoint,
  revokeEndpoint,
  preflightFor('/oauth/register'),
  preflightFor('/oauth/token'),
  preflightFor('/oauth/revoke'),
  consentDecisionEndpoint,
  switchAccountEndpoint,
  revokeGrantEndpoint,
]
