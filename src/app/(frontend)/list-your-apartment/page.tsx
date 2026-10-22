import { SubmissionForm } from './SubmissionForm'
export const metadata = { title: 'List your apartment | Nestwell' }
export default function ListYourApartment() {
  return (
    <main className="bg-[#faf9f6] text-stone-900">
      <div className="container max-w-3xl py-16">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald-800">
          Make room for a new beginning
        </p>
        <h1 className="mb-5 text-4xl font-semibold">List your apartment</h1>
        <p className="mb-12 text-lg text-stone-600">
          Help someone find their next home. Share your apartment with Nestwell — no account needed.
        </p>
        <SubmissionForm />
      </div>
    </main>
  )
}
