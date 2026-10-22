'use client'

import { useState, type FormEvent } from 'react'

const inputClass =
  'mt-2 w-full rounded-lg border border-stone-300 bg-white p-3 text-stone-900 focus:outline-emerald-800'
export function SubmissionForm() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    const files = form
      .getAll('photos')
      .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    if (
      files.length > 6 ||
      files.some(
        (file) =>
          file.size > 10 * 1024 * 1024 ||
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      )
    ) {
      setError('Choose up to 6 JPEG, PNG or WebP photos, at most 10 MB each.')
      return
    }
    setBusy(true)
    try {
      const response = await fetch('/api/listing-submissions', { method: 'POST', body: form })
      const result = await response.json()
      if (!response.ok)
        setError(result.error || 'Your listing could not be submitted. Please try again.')
      else setConfirmation(result.message)
    } catch {
      setError('Connection interrupted. Please try again.')
    } finally {
      setBusy(false)
    }
  }
  if (confirmation)
    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-emerald-950"
      >
        <h2 className="mb-3 text-2xl font-semibold">Your apartment is in good hands</h2>
        <p>{confirmation}</p>
      </div>
    )
  return (
    <form onSubmit={submit} className="space-y-9">
      <fieldset disabled={busy} className="space-y-6">
        <legend className="mb-5 text-xl font-semibold">Tell us about your apartment</legend>
        <label className="block">
          Listing title
          <input
            name="title"
            required
            maxLength={160}
            className={inputClass}
            placeholder="A bright apartment in the heart of Bristol"
          />
        </label>
        <div className="grid gap-6 sm:grid-cols-2">
          {[
            ['monthlyRent', 'Monthly rent (GBP)', 'number', '0'],
            ['deposit', 'Deposit (GBP)', 'number', '0'],
            ['availableFrom', 'Available from', 'date', undefined],
            ['city', 'City', 'text', undefined],
            ['size', 'Size (m²)', 'number', '1'],
            ['rooms', 'Rooms', 'number', '1'],
          ].map(([name, label, type, min]) => (
            <label key={name} className="block">
              {label}
              <input
                name={name}
                type={type}
                min={min}
                step={type === 'number' ? (name === 'rooms' ? '1' : '0.01') : undefined}
                maxLength={name === 'city' ? 100 : undefined}
                required
                className={inputClass}
              />
            </label>
          ))}
        </div>
        <label className="block">
          Street address
          <input name="streetAddress" required maxLength={250} className={inputClass} />
        </label>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="furnished" /> Furnished
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="petsAllowed" /> Pets allowed
          </label>
        </div>
        <label className="block">
          Description
          <textarea
            name="description"
            required
            maxLength={20000}
            rows={7}
            className={inputClass}
            placeholder="Describe the space, amenities and anything a future tenant should know."
          />
        </label>
        <label className="block">
          Photos <span className="text-sm text-stone-500">(optional)</span>
          <input
            name="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className={inputClass}
            aria-describedby="photo-help"
          />
        </label>
        <p id="photo-help" className="text-sm text-stone-600">
          Up to 6 photos. JPEG, PNG or WebP, at most 10 MB each.
        </p>
      </fieldset>
      <fieldset disabled={busy} className="space-y-6">
        <legend className="mb-2 text-xl font-semibold">Your contact details</legend>
        <p className="text-sm text-stone-600">
          Only Nestwell staff can see these details. They will never appear on your public listing.
        </p>
        {[
          ['landlordName', 'Your name', 'text'],
          ['landlordEmail', 'Email address', 'email'],
          ['landlordPhone', 'Phone number', 'tel'],
        ].map(([name, label, type]) => (
          <label key={name} className="block">
            {label}
            <input name={name} type={type} required maxLength={200} className={inputClass} />
          </label>
        ))}
      </fieldset>
      <div aria-hidden="true" className="absolute -left-[10000px]">
        <label>
          Leave this field empty
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">
          {error}
        </p>
      )}
      <p className="text-sm text-stone-600">
        Our team reviews every submission. Your apartment will only appear on Nestwell after
        approval.
      </p>
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-emerald-900 px-8 py-4 font-medium text-white disabled:opacity-60"
      >
        {busy ? 'Submitting…' : 'Submit apartment for review'}
      </button>
    </form>
  )
}
