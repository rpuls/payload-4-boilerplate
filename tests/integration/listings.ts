/** Run with `corepack pnpm payload run tests/integration/listings.ts` against a disposable *_test database. */
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createPayloadRequest, getPayload } from 'payload'
import config from '../../src/payload.config'

if (!new URL(process.env.DATABASE_URL!).pathname.endsWith('_test'))
  throw new Error('Use a disposable *_test database')
const payload = await getPayload({ config })
try {
  const admin = await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: {
      email: `admin-${randomUUID()}@nestwell.test`,
      password: randomUUID(),
      roles: ['admin'],
    },
  })
  const editor = await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: {
      email: `editor-${randomUUID()}@nestwell.test`,
      password: randomUUID(),
      roles: ['editor'],
    },
  })
  const req = await createPayloadRequest({
    payload,
    req: { user: { ...editor, collection: 'users' }, headers: new Headers() },
  })
  const listing = await payload.create({
    collection: 'listings',
    req,
    overrideAccess: false,
    data: {
      status: 'pending',
      title: 'Honest Bristol apartment',
      slug: 'honest-bristol-apartment',
      monthlyRent: 1250,
      deposit: 1250,
      availableFrom: '2027-01-01T00:00:00Z',
      streetAddress: '1 Test Street',
      city: 'Bristol',
      size: 65,
      rooms: 3,
      landlordName: 'Private Landlord',
      landlordEmail: 'private@example.com',
      landlordPhone: '01234567890',
      internalNotes: 'Staff only',
      description: {
        root: {
          type: 'root',
          version: 1,
          direction: null,
          format: '',
          indent: 0,
          children: [
            {
              type: 'paragraph',
              version: 1,
              direction: null,
              format: '',
              indent: 0,
              textFormat: 0,
              textStyle: '',
              children: [
                {
                  type: 'text',
                  version: 1,
                  text: 'An honest description.',
                  format: 0,
                  detail: 0,
                  mode: 'normal',
                  style: '',
                },
              ],
            },
          ],
        },
      },
    },
  })
  assert.equal(listing.status, 'pending')
  assert.equal(
    (await payload.find({ collection: 'listings', user: null, overrideAccess: false })).totalDocs,
    0,
  )
  await assert.rejects(
    payload.delete({ collection: 'listings', id: listing.id, req, overrideAccess: false }),
  )
  req.payloadAPI = 'MCP'
  for (const status of ['approved', 'rented'] as const) {
    await assert.rejects(
      payload.update({
        collection: 'listings',
        id: listing.id,
        data: { status },
        req,
        overrideAccess: false,
      }),
    )
    await assert.rejects(
      payload.create({
        collection: 'listings',
        data: { ...listing, slug: randomUUID(), status },
        req,
        overrideAccess: false,
      }),
    )
  }
  await payload.update({
    collection: 'listings',
    id: listing.id,
    data: { title: 'An honestly updated apartment' },
    req,
    overrideAccess: false,
  })
  req.payloadAPI = 'REST'
  await payload.update({
    collection: 'listings',
    id: listing.id,
    data: { status: 'approved' },
    req,
    overrideAccess: false,
  })
  const visible = await payload.findByID({
    collection: 'listings',
    id: listing.id,
    user: null,
    overrideAccess: false,
  })
  for (const field of ['landlordName', 'landlordEmail', 'landlordPhone', 'internalNotes'])
    assert.ok(!(field in visible), `${field} leaked`)
  req.payloadAPI = 'MCP'
  await payload.update({
    collection: 'listings',
    id: listing.id,
    data: { city: 'Bath' },
    req,
    overrideAccess: false,
  })
  const adminMCP = await createPayloadRequest({
    payload,
    req: { user: { ...admin, collection: 'users' }, headers: new Headers() },
  })
  adminMCP.payloadAPI = 'MCP'
  await assert.rejects(
    payload.delete({
      collection: 'listings',
      id: listing.id,
      req: adminMCP,
      overrideAccess: false,
    }),
  )
  req.payloadAPI = 'REST'
  await payload.update({
    collection: 'listings',
    id: listing.id,
    data: { status: 'rented' },
    req,
    overrideAccess: false,
  })
  assert.equal(
    (
      await payload.findByID({
        collection: 'listings',
        id: listing.id,
        user: null,
        overrideAccess: false,
      })
    ).status,
    'rented',
  )
  await payload.update({
    collection: 'listings',
    id: listing.id,
    data: { status: 'rejected' },
    req,
    overrideAccess: false,
  })
  assert.equal(
    (await payload.find({ collection: 'listings', user: null, overrideAccess: false })).totalDocs,
    0,
  )
  await assert.rejects(
    payload.create({
      collection: 'listings',
      data: { ...listing, slug: randomUUID() },
      user: null,
      overrideAccess: false,
    }),
  )
  adminMCP.payloadAPI = 'REST'
  await payload.delete({
    collection: 'listings',
    id: listing.id,
    req: adminMCP,
    overrideAccess: false,
  })
  console.log('PASS: listing privacy, moderation, staff roles and MCP collection guards')
} finally {
  await payload.destroy()
}
