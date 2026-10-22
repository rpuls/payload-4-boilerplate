/** Run against a disposable development instance: node tests/integration/submissions.mjs */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000'
const title = `Submission check ${Date.now()}`
const data = {
  title,
  monthlyRent: '1200',
  deposit: '1200',
  availableFrom: '2027-01-01',
  streetAddress: '1 Test Street',
  city: 'Bristol',
  size: '70',
  rooms: '3',
  description: 'A bright and honest apartment.',
  landlordName: 'Private Name',
  landlordEmail: 'private@example.com',
  landlordPhone: '01234567890',
  status: 'approved',
  internalNotes: 'Visitor must not set this',
}
function form(extra = {}) {
  const f = new FormData()
  for (const [key, value] of Object.entries({ ...data, ...extra })) f.set(key, value)
  return f
}
async function post(body) {
  return fetch(`${base}/api/listing-submissions`, { method: 'POST', body })
}
assert.equal((await post(form({ website: 'bot' }))).status, 400)
assert.equal((await post(form({ rooms: '1.5' }))).status, 400)
const invalid = form()
invalid.append('photos', new Blob(['not an image'], { type: 'image/jpeg' }), 'fake.jpg')
assert.equal((await post(invalid)).status, 400)
const image = await readFile(
  new URL('../../src/endpoints/seed/assets/payload-cover.webp', import.meta.url),
)
const tooMany = form()
for (let i = 0; i < 7; i++)
  tooMany.append('photos', new Blob([image], { type: 'image/webp' }), `${i}.webp`)
assert.equal((await post(tooMany)).status, 400)
const tooLarge = form()
tooLarge.append(
  'photos',
  new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: 'image/png' }),
  'large.png',
)
assert.equal((await post(tooLarge)).status, 400)
const valid = form()
valid.append('photos', new Blob([image], { type: 'image/webp' }), 'apartment.webp')
const response = await post(valid)
assert.equal(response.status, 201, await response.text())
const result = await (
  await fetch(`${base}/api/listings?where[title][equals]=${encodeURIComponent(title)}`)
).json()
assert.equal(result.totalDocs, 0, 'Anonymous visitor must not see their pending submission')
console.log(
  'PASS: submission with real photo, honeypot, file signatures, count and size limits, numeric validation and public invisibility',
)
