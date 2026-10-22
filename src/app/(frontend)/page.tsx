import config from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import { ListingCard } from '@/components/Listings/ListingCard'

export const metadata = {
  title: 'Nestwell | Find your next home',
  description:
    'Find your next apartment with Nestwell. Explore homes and submit your apartment for review.',
}
export default async function Home() {
  const payload = await getPayload({ config })
  const listings = await payload.find({
    collection: 'listings',
    overrideAccess: false,
    user: null,
    where: { status: { equals: 'approved' } },
    depth: 1,
    limit: 12,
    sort: '-createdAt',
  })
  return (
    <main className="bg-[#faf9f6] text-stone-900">
      <section className="container py-20 md:py-28">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-emerald-800">
          Welcome to Nestwell
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
          Find your next home
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-600">
          A fresh start begins with a place that feels right. Discover apartments with clear
          details, honest descriptions and room for your everyday life.
        </p>
        <div className="mt-9 flex flex-wrap gap-4">
          <Link
            href="/listings"
            className="rounded-full bg-emerald-900 px-7 py-4 font-medium text-white"
          >
            Explore listings
          </Link>
          <Link
            href="/list-your-apartment"
            className="rounded-full border border-stone-400 px-7 py-4 font-medium"
          >
            List your apartment
          </Link>
        </div>
      </section>
      <section className="container pb-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm text-stone-500">A place to make your own</p>
            <h2 className="text-3xl font-semibold">Available apartments</h2>
          </div>
          <Link href="/listings" className="underline underline-offset-4">
            View all
          </Link>
        </div>
        {listings.docs.length ? (
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {listings.docs.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
            <h3 className="text-xl font-medium">Your next chapter is on its way</h3>
            <p className="mt-3 text-stone-600">
              New apartments will appear here once our team has reviewed them.
            </p>
            <Link
              href="/list-your-apartment"
              className="mt-6 inline-block text-emerald-800 underline"
            >
              Have an apartment to share?
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
