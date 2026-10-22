import type { CollectionConfig } from 'payload'

import { oauthCollectionDefaults } from './shared'

/**
 * Access and refresh tokens, stored as hashes. Access tokens are short-lived bearer tokens for
 * /api/mcp. Refresh tokens rotate: each one is valid for a single refresh, after which a new
 * pair is issued. Reusing a spent refresh token revokes the whole grant.
 */
export const OAuthTokens: CollectionConfig = {
  slug: 'oauth-tokens',
  ...oauthCollectionDefaults,
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      index: true,
      options: ['access', 'refresh'],
    },
    {
      name: 'tokenHash',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'grant',
      type: 'relationship',
      relationTo: 'oauth-grants',
      required: true,
      index: true,
    },
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'oauth-clients',
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
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
      // Refresh tokens only: set when the token was exchanged for a new pair
      name: 'usedAt',
      type: 'date',
    },
  ],
}
