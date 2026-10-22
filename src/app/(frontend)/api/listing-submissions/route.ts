import { randomUUID } from 'node:crypto'
import { getPayload, ValidationError } from 'payload'
import config from '@payload-config'

export const runtime = 'nodejs'
const maxPhotoSize = 10 * 1024 * 1024
const maxBodySize = 6 * maxPhotoSize + 1024 * 1024

/** Bound the stream before multipart parsing, including requests without Content-Length. */
async function readForm(request: Request) {
  const reader = request.body?.getReader()
  if (!reader) throw new Error('Missing form')
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBodySize) {
      await reader.cancel()
      throw new Error('Form too large')
    }
    chunks.push(value)
  }
  return new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': request.headers.get('content-type') || '' },
    body: Buffer.concat(chunks),
  }).formData()
}

export async function POST(request: Request) {
  let form: FormData
  try {
    form = await readForm(request)
  } catch {
    return Response.json(
      { error: 'Please submit a form with at most 6 photos of 10 MB each.' },
      { status: 400 },
    )
  }
  if (form.get('website'))
    return Response.json({ error: 'Your listing could not be submitted.' }, { status: 400 })
  const text = (key: string) => String(form.get(key) ?? '').trim()
  const numeric = (key: string) => (text(key) === '' ? NaN : Number(text(key)))
  const required = [
    'title',
    'streetAddress',
    'city',
    'description',
    'landlordName',
    'landlordEmail',
    'landlordPhone',
  ]
  if (
    required.some((key) => !text(key)) ||
    text('description').length > 20000 ||
    !/^\S+@\S+\.\S+$/.test(text('landlordEmail')) ||
    !['monthlyRent', 'deposit', 'size', 'rooms'].every((key) => Number.isFinite(numeric(key))) ||
    numeric('monthlyRent') < 0 ||
    numeric('deposit') < 0 ||
    numeric('size') < 1 ||
    !Number.isInteger(numeric('rooms')) ||
    numeric('rooms') < 1 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(text('availableFrom')) ||
    Number.isNaN(Date.parse(text('availableFrom')))
  ) {
    return Response.json(
      { error: 'Please complete all required fields with valid details.' },
      { status: 400 },
    )
  }
  const entries = form
    .getAll('photos')
    .filter((entry) => !(entry instanceof File && entry.size === 0 && !entry.name))
  if (entries.length > 6)
    return Response.json({ error: 'You can upload up to 6 photos.' }, { status: 400 })
  const photos: { data: Buffer; mimetype: string; name: string; size: number }[] = []
  for (const entry of entries) {
    if (
      !(entry instanceof File) ||
      entry.size > maxPhotoSize ||
      entry.size === 0 ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(entry.type)
    ) {
      return Response.json(
        { error: 'Photos must be JPEG, PNG or WebP, at most 10 MB each.' },
        { status: 400 },
      )
    }
    const data = Buffer.from(await entry.arrayBuffer())
    const detected = data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
      ? 'image/jpeg'
      : data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        ? 'image/png'
        : data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP'
          ? 'image/webp'
          : null
    if (detected !== entry.type)
      return Response.json(
        { error: 'A photo is not a valid JPEG, PNG or WebP image.' },
        { status: 400 },
      )
    const ext = detected === 'image/jpeg' ? 'jpg' : detected === 'image/png' ? 'png' : 'webp'
    photos.push({
      data,
      mimetype: detected,
      name: `nestwell-${randomUUID()}.${ext}`,
      size: data.length,
    })
  }
  const payload = await getPayload({ config })
  const mediaIDs: number[] = []
  try {
    // This is the only anonymous write path. Construct every value ourselves; never spread form data.
    for (const file of photos) {
      const media = await payload.create({
        collection: 'media',
        overrideAccess: true,
        data: { alt: text('title').slice(0, 160) },
        file,
      })
      mediaIDs.push(media.id)
    }
    await payload.create({
      collection: 'listings',
      overrideAccess: true,
      data: {
        title: text('title'),
        slug: `${
          text('title')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 100) || 'apartment'
        }-${randomUUID()}`,
        status: 'pending',
        monthlyRent: numeric('monthlyRent'),
        deposit: numeric('deposit'),
        availableFrom: new Date(text('availableFrom')).toISOString(),
        streetAddress: text('streetAddress'),
        city: text('city'),
        size: numeric('size'),
        rooms: numeric('rooms'),
        furnished: text('furnished') === 'on',
        petsAllowed: text('petsAllowed') === 'on',
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
                    text: text('description'),
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
        photos: mediaIDs,
        landlordName: text('landlordName'),
        landlordEmail: text('landlordEmail'),
        landlordPhone: text('landlordPhone'),
      },
    })
    return Response.json(
      {
        message:
          'Thank you! Your apartment has been submitted. Our team will review it before it appears on Nestwell.',
      },
      { status: 201 },
    )
  } catch (error) {
    for (const id of mediaIDs) {
      try {
        await payload.delete({ collection: 'media', id, overrideAccess: true })
      } catch (cleanupError) {
        payload.logger.error({
          err: cleanupError,
          msg: 'Failed to clean up a submission photo',
          mediaID: id,
        })
      }
    }
    payload.logger.error({ err: error, msg: 'Listing submission failed' })
    return Response.json(
      {
        error:
          error instanceof ValidationError
            ? 'Please check your listing details and photos.'
            : 'We could not save your listing. Please try again.',
      },
      { status: error instanceof ValidationError ? 400 : 500 },
    )
  }
}
