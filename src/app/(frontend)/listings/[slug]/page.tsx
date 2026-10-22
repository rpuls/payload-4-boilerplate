import config from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RichText from '@/components/RichText'
import { ListingPhoto, rentLabel } from '@/components/Listings/ListingCard'

export const metadata = { title: 'Apartment details | Nestwell' }
export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'listings',
    overrideAccess: false,
    user: null,
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })
  const listing = docs[0]
  if (!listing) notFound()
  return (
    <main className="container py-12">
      <Link href="/listings" className="text-sm underline">
        Back to listings
      </Link>
      <div className="mb-8 mt-8 flex flex-wrap justify-between gap-5">
        <div>
          <p className="mb-2 text-muted-foreground">{listing.city}</p>
          <h1 className="text-4xl font-semibold">{listing.title}</h1>
          <p className="mt-3">{listing.streetAddress}</p>
        </div>
        <p className="text-3xl font-semibold">
          {rentLabel(listing.monthlyRent)} <span className="text-base font-normal">/ month</span>
        </p>
      </div>
      {listing.status === 'rented' && (
        <p className="mb-6 rounded-xl bg-stone-100 p-4 text-stone-700">
          This apartment has been rented and is no longer available.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {listing.photos?.length ? (
          listing.photos.map((photo, index) => (
            <div
              key={typeof photo === 'object' ? photo.id : photo}
              className={`h-80 overflow-hidden rounded-2xl ${index === 0 ? 'md:col-span-2 md:h-[480px]' : ''}`}
            >
              <ListingPhoto photo={photo} title={`${listing.title} — photo ${index + 1}`} />
            </div>
          ))
        ) : (
          <div className="h-80 overflow-hidden rounded-2xl md:col-span-2">
            <ListingPhoto title={listing.title} />
          </div>
        )}
      </div>
      <dl className="my-10 grid grid-cols-2 gap-6 rounded-2xl border p-7 md:grid-cols-3">
        {[
          ['Rooms', listing.rooms],
          ['Size', `${listing.size} m²`],
          ['Deposit', rentLabel(listing.deposit)],
          [
            'Available from',
            new Date(listing.availableFrom).toLocaleDateString('en-GB', { timeZone: 'UTC' }),
          ],
          ['Furnished', listing.furnished ? 'Yes' : 'No'],
          ['Pets allowed', listing.petsAllowed ? 'Yes' : 'No'],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <section className="max-w-3xl pb-12">
        <h2 className="mb-5 text-2xl font-semibold">About this apartment</h2>
        <RichText data={listing.description} enableGutter={false} />
      </section>
    </main>
  )
}
