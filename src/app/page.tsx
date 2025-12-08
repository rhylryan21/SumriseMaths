'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <section className="vcenter">
      <div>
        <h1 className="hero-title">Sumrise Maths</h1>
        <p className="muted">Personalised, step-aware maths practice for KS3 & GCSE.</p>

        <div className="controls" style={{ justifyContent: 'center' }}>
          <Link href="/demo" className="btn btn-primary">
            Try a demo
          </Link>
          <Link href="#" className="btn">
            For teachers
          </Link>
          <Link href="/practice" className="btn">
            Practice
          </Link>
          <Link href="/set" className="btn">
            Go to the Practice Set
          </Link>
        </div>

        <p className="small muted">© {new Date().getFullYear()} Sumrise Maths</p>
      </div>
    </section>
  )
}
