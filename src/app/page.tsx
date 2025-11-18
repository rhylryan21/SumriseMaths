'use client'


import Link from "next/link";

export default function Home() {
return (
<main className="min-h-screen flex items-center justify-center p-8">
<div className="max-w-2xl text-center space-y-6">
<h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">Sumrise Maths</h1>
<p className="text-lg md:text-xl text-gray-600">Personalised, step-aware maths practice for KS3 & GCSE.</p>
<div className="flex gap-3 justify-center">
<Link href="/demo" className="px-5 py-3 rounded-2xl bg-black text-white">Try a demo</Link>
<Link href="#" className="px-5 py-3 rounded-2xl border">For teachers</Link>
</div>
<p className="text-sm text-gray-400">© {new Date().getFullYear()} Sumrise Maths</p>
</div>
</main>
)
}