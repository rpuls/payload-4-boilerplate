import type { CollectionConfig } from 'payload'

const deny = () => false

/**
 * The OAuth collections back the sign-in flow for /api/mcp. They are internal bookkeeping:
 * hidden from the admin, unreachable over REST, GraphQL and MCP, and only ever read or written
 * by the OAuth code through the Local API with `overrideAccess: true`. Users manage what they
 * need through the "Connected apps" views instead.
 */
export const oauthCollectionDefaults = {
  access: {
    admin: deny,
    create: deny,
    delete: deny,
    read: deny,
    readVersions: deny,
    unlock: deny,
    update: deny,
  },
  admin: {
    group: false,
    hidden: true,
  },
  authorship: false,
  endpoints: false,
  graphQL: false,
  timestamps: true,
  versions: false,
} satisfies Partial<CollectionConfig>

export const oauthCollectionSlugs = [
  'oauth-clients',
  'oauth-authorization-codes',
  'oauth-grants',
  'oauth-tokens',
] as const

export type OAuthCollectionSlug = (typeof oauthCollectionSlugs)[number]
