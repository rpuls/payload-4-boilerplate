import Link from 'next/link'
import { House } from 'lucide-react'
import type { Listing, Media } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'

export const rentLabel = (rent: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  }).format(rent)

export function ListingPhoto({
  photo,
  title,
  className = '',
}: {
  photo?: number | Media | null
  title: string
  className?: string
}) {
  const media = typeof photo === 'object' ? photo : null
  return media?.url ? (
    // Native images support local and S3 URLs without requiring a remote image host allowlist.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getMediaUrl(media.url, media.updatedAt)}
      alt={media.alt || title}
      className={`h-full w-full object-cover ${className}`}
      loading="lazy"
    />
  ) : (
    <div
      className={`flex h-full min-h-52 items-center justify-center bg-stone-100 text-stone-400 ${className}`}
      role="img"
      aria-label="Apartment photo coming soon"
    >
      <House size={52} strokeWidth={1} />
    </div>
  )
}

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group overflow-hidden rounded-2xl border border-stone-200 bg-white text-stone-900 transition-shadow hover:shadow-lg"
    >
      <div className="h-64 overflow-hidden">
        <ListingPhoto
          photo={listing.photos?.[0]}
          title={listing.title}
          className="transition-transform group-hover:scale-105"
        />
      </div>
      <div className="space-y-3 p-6">
        <p className="text-sm text-stone-500">{listing.city}</p>
        <h3 className="text-xl font-semibold">{listing.title}</h3>
        <p>
          <strong className="text-2xl">{rentLabel(listing.monthlyRent)}</strong>{' '}
          <span className="text-stone-500">/ month</span>
        </p>
        <p className="border-t border-stone-100 pt-3 text-sm text-stone-600">
          {listing.rooms} rooms <span aria-hidden="true"> · </span> {listing.size} m²
        </p>
      </div>
    </Link>
  )
}
