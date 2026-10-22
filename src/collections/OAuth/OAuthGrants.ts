import type { CollectionConfig } from 'payload'

import { oauthCollectionDefaults } from './shared'

/**
 * One grant per client and user: "ChatGPT may act as Maria". This is what the "Connected apps"
 * views list and what gets revoked. Access and refresh tokens hang off it, so revoking the grant
 * kills every token at once.
 */
export const OAuthGrants: CollectionConfig = {
  slug: 'oauth-grants',
  ...oauthCollectionDefaults,
  fields: [
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
      name: 'resource',
      type: 'text',
      required: true,
    },
    {
      name: 'scope',
      type: 'text',
    },
    {
      name: 'lastUsedAt',
      type: 'date',
    },
    {
      name: 'revokedAt',
      type: 'date',
      index: true,
    },
  ],
}
