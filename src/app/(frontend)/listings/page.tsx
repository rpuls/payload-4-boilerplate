import config from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import { ListingCard } from '@/components/Listings/ListingCard'

export const metadata = { title: 'Apartments to rent | Nestwell' }
export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const raw = Number((await searchParams).page || 1)
  const page = Number.isInteger(raw) && raw > 0 ? raw : 1
  const payload = await getPayload({ config })
  const listings = await payload.find({
    collection: 'listings',
    overrideAccess: false,
    user: null,
    where: { status: { equals: 'approved' } },
    depth: 1,
    limit: 12,
    page,
    sort: '-createdAt',
  })
  return (
    <main className="container py-16">
      <h1 className="mb-4 text-4xl font-semibold">Find a place to call home</h1>
      <p className="mb-10 text-muted-foreground">
        Explore apartments available to rent with Nestwell.
      </p>
      <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
        {listings.docs.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
      {!listings.docs.length && <p>No apartments available right now. Please check back soon.</p>}
      <nav aria-label="Listing pages" className="mt-10 flex gap-6">
        {listings.hasPrevPage && <Link href={`/listings?page=${page - 1}`}>Previous</Link>}
        {listings.hasNextPage && <Link href={`/listings?page=${page + 1}`}>Next</Link>}
      </nav>
    </main>
  )
}
