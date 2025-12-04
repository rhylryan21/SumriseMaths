'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-2xl space-y-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">Sumrise Maths</h1>
        <p className="text-lg text-gray-600 md:text-xl">
          Personalised, step-aware maths practice for KS3 & GCSE.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/demo" className="rounded-2xl bg-black px-5 py-3 text-white">
            Try a demo
          </Link>
          <Link href="#" className="rounded-2xl border px-5 py-3">
            For teachers
          </Link>
          <Link href="/practice" className="rounded-2xl border px-5 py-3">
            Practice
          </Link>
        </div>
        <p className="text-sm text-gray-400">© {new Date().getFullYear()} Sumrise Maths</p>
      </div>
    </main>
  )
}
