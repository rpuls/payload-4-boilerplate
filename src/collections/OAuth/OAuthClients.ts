import type { CollectionConfig } from 'payload'

import { oauthCollectionDefaults } from './shared'

/**
 * OAuth clients that may ask users for access to /api/mcp. A client is either registered
 * dynamically (RFC 7591, e.g. by the MCP Inspector) or identified by the HTTPS URL of its
 * client ID metadata document (e.g. ChatGPT), in which case this row caches that document.
 */
export const OAuthClients: CollectionConfig = {
  slug: 'oauth-clients',
  ...oauthCollectionDefaults,
  admin: {
    ...oauthCollectionDefaults.admin,
    useAsTitle: 'clientName',
  },
  fields: [
    {
      // Random `mcp_...` id for dynamic clients, or the metadata document URL
      name: 'clientId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'clientName',
      type: 'text',
      required: true,
    },
    {
      name: 'registrationType',
      type: 'select',
      required: true,
      options: [
        { label: 'Dynamic client registration', value: 'dynamic' },
        { label: 'Client ID metadata document', value: 'metadata_document' },
      ],
    },
    {
      name: 'tokenEndpointAuthMethod',
      type: 'select',
      required: true,
      options: ['none', 'client_secret_basic', 'client_secret_post'],
    },
    {
      // SHA-256 of the secret handed out at registration; only confidential clients have one
      name: 'clientSecretHash',
      type: 'text',
    },
    {
      name: 'redirectUris',
      type: 'json',
      required: true,
      jsonSchema: {
        uri: 'payload://oauth-redirect-uris.json',
        fileMatch: ['payload://oauth-redirect-uris.json'],
        schema: { type: 'array', items: { type: 'string' } },
      },
    },
    {
      name: 'clientUri',
      type: 'text',
    },
    {
      name: 'logoUri',
      type: 'text',
    },
    {
      // The metadata as registered or fetched, for reference and debugging
      name: 'metadata',
      type: 'json',
    },
    {
      // Client ID metadata documents are cached until this moment, then fetched again
      name: 'metadataExpiresAt',
      type: 'date',
    },
    {
      name: 'lastUsedAt',
      type: 'date',
    },
  ],
}
