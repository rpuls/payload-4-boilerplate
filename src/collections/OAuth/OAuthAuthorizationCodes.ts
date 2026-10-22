import type { CollectionConfig } from 'payload'

import { oauthCollectionDefaults } from './shared'

/**
 * Single-use authorization codes, alive for a few minutes between the consent page and the
 * token endpoint. The code itself is never stored, only its hash.
 */
export const OAuthAuthorizationCodes: CollectionConfig = {
  slug: 'oauth-authorization-codes',
  ...oauthCollectionDefaults,
  fields: [
    {
      name: 'codeHash',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'oauth-clients',
      required: true,
      index: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      // Set when the code is exchanged, so a replayed code can revoke what it produced
      name: 'grant',
      type: 'relationship',
      relationTo: 'oauth-grants',
    },
    {
      name: 'redirectUri',
      type: 'text',
      required: true,
    },
    {
      name: 'codeChallenge',
      type: 'text',
      required: true,
    },
    {
      name: 'codeChallengeMethod',
      type: 'select',
      required: true,
      options: ['S256'],
    },
    {
      // The MCP server URL the token will be bound to (RFC 8707)
      name: 'resource',
      type: 'text',
      required: true,
    },
    {
      name: 'scope',
      type: 'text',
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'usedAt',
      type: 'date',
    },
  ],
}
