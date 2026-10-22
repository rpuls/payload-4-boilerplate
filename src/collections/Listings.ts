import { APIError, type Access, type CollectionConfig, type FieldAccess } from 'payload'
import { hasRole } from '@/access/roles'

export const isListingStaff: Access = ({ req }) =>
  hasRole(req.user, 'admin') || hasRole(req.user, 'editor')
const staffField: FieldAccess = ({ req }) =>
  hasRole(req.user, 'admin') || hasRole(req.user, 'editor')

export const Listings: CollectionConfig = {
  slug: 'listings',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'city', 'monthlyRent', 'status'],
    group: 'Nestwell',
  },
  access: {
    create: isListingStaff,
    update: isListingStaff,
    delete: ({ req }) => req.payloadAPI !== 'MCP' && hasRole(req.user, 'admin'),
    read: ({ req }) =>
      hasRole(req.user, 'admin') || hasRole(req.user, 'editor')
        ? true
        : { status: { in: ['approved', 'rented'] } },
    readVersions: isListingStaff,
  },
  // Status is the rental moderation lifecycle; there is no separate draft/publish state.
  versions: false,
  llmInstructions:
    'Write clear, honest apartment listings using only verified landlord information. State monthly rent and deposit in GBP, size in square metres, rooms, availability and restrictions accurately. Never invent amenities, photos, location details or availability. Ask staff about missing information. Keep landlord contact details and internal notes private. New listings are pending; only human staff may approve a listing or mark it rented. Agents must never delete listings.',
  hooks: {
    beforeOperation: [
      ({ args, operation, req }) => {
        // Inspect the submitted patch before Payload merges unchanged document fields into data.
        const status = (args as { data?: { status?: unknown } }).data?.status
        if (
          req.payloadAPI === 'MCP' &&
          (operation === 'create' || operation === 'update') &&
          (status === 'approved' || status === 'rented')
        ) {
          throw new APIError('Only human staff can approve listings or mark them rented.', 403)
        }
        return args
      },
    ],
    beforeChange: [
      ({ data, req, operation }) => {
        if (!req.user) data.status = 'pending'
        if (operation === 'create' && !data.status) data.status = 'pending'
        return data
      },
    ],
    beforeDelete: [
      ({ req }) => {
        if (req.payloadAPI === 'MCP') throw new APIError('Agents cannot delete listings.', 403)
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 160 },
    { name: 'slug', type: 'slug', useAsSlug: 'title' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: ['pending', 'approved', 'rejected', 'rented'],
      admin: { position: 'sidebar' },
    },
    { name: 'monthlyRent', label: 'Monthly rent (GBP)', type: 'number', required: true, min: 0 },
    { name: 'deposit', label: 'Deposit (GBP)', type: 'number', required: true, min: 0 },
    { name: 'availableFrom', type: 'date', required: true },
    { name: 'streetAddress', type: 'text', required: true, maxLength: 250 },
    { name: 'city', type: 'text', required: true, index: true, maxLength: 100 },
    { name: 'size', label: 'Size (m²)', type: 'number', required: true, min: 1 },
    {
      name: 'rooms',
      type: 'number',
      required: true,
      min: 1,
      validate: (value: number | null | undefined) =>
        value != null && Number.isInteger(value) && value >= 1
          ? true
          : 'Enter a whole number of rooms.',
    },
    { name: 'furnished', type: 'checkbox', defaultValue: false },
    { name: 'petsAllowed', type: 'checkbox', defaultValue: false },
    { name: 'description', type: 'richText', required: true },
    { name: 'photos', type: 'upload', relationTo: 'media', hasMany: true, maxRows: 6 },
    {
      name: 'landlordName',
      type: 'text',
      required: true,
      maxLength: 200,
      access: { read: staffField, create: staffField, update: staffField },
    },
    {
      name: 'landlordEmail',
      type: 'email',
      required: true,
      access: { read: staffField, create: staffField, update: staffField },
    },
    {
      name: 'landlordPhone',
      type: 'text',
      required: true,
      maxLength: 200,
      access: { read: staffField, create: staffField, update: staffField },
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      access: { read: staffField, create: staffField, update: staffField },
    },
  ],
}
