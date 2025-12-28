'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { components } from '@/lib/api-types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type AttemptOut = components['schemas']['AttemptOut']

const API_URL = process.env.NEXT_PUBLIC_GRADING_URL ?? 'http://127.0.0.1:8001'
const API_KEY = process.env.NEXT_PUBLIC_GRADING_API_KEY ?? ''

async function fetchAttempt(id: number, signal?: AbortSignal): Promise<AttemptOut> {
  const res = await fetch(`${API_URL}/attempts/${id}`, {
    method: 'GET',
    headers: API_KEY ? { 'x-api-key': API_KEY } : undefined,
    signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Failed to fetch attempt ${id} (${res.status})`)
  }
  return (await res.json()) as AttemptOut
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function formatDateTime(input: string | null | undefined): string {
  if (!input) return '—'
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return String(input)
  const dd = pad2(d.getDate())
  const mm = pad2(d.getMonth() + 1)
  const yyyy = d.getFullYear()
  const hh = pad2(d.getHours())
  const mi = pad2(d.getMinutes())
  const ss = pad2(d.getSeconds())
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`
}

export default function AttemptDetailPage() {
  const params = useParams<{ id: string }>()
  const rawId =
    typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : ''
  const attemptId = Number(rawId)

  const hasInvalidId = Number.isNaN(attemptId) || !Number.isFinite(attemptId)

  const [data, setData] = useState<AttemptOut | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (hasInvalidId) return

    const ctrl = new AbortController()

    ;(async () => {
      try {
        const d = await fetchAttempt(attemptId, ctrl.signal)
        setData(d)
      } catch (e) {
        // Ignore abort errors
        if (e instanceof DOMException && e.name === 'AbortError') return
        const msg = e instanceof Error && e.message ? e.message : 'Failed to load attempt.'
        setError(msg)
      }
    })()

    return () => {
      ctrl.abort()
    }
  }, [attemptId, hasInvalidId])

  if (hasInvalidId) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <Card className="border border-red-300 bg-red-50 p-4" role="alert">
          <p className="text-red-700">Invalid attempt id.</p>
          <div className="mt-4">
            <Link href="/attempts">
              <Button variant="secondary">Back to list</Button>
            </Link>
          </div>
        </Card>
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <Card className="border border-red-300 bg-red-50 p-4" role="alert">
          <p className="text-red-700">{error}</p>
          <div className="mt-4">
            <Link href="/attempts">
              <Button variant="secondary">Back to list</Button>
            </Link>
          </div>
        </Card>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <p>Loading…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Attempt #{data.id}</h1>
        <Link href="/attempts">
          <Button variant="secondary">Back to list</Button>
        </Link>
      </header>

      <Card className="space-y-2 p-4">
        <div>
          <span className="font-medium">Created:</span> {formatDateTime(data.created_at)}
        </div>
        <div>
          <span className="font-medium">Score:</span> {data.correct}/{data.total}
        </div>
        <div>
          <span className="font-medium">Duration (ms):</span>{' '}
          {typeof data.duration_ms === 'number' ? data.duration_ms : '—'}
        </div>
      </Card>

      <Card className="p-4">
        <details>
          <summary className="cursor-pointer font-medium">Raw items</summary>
          <pre className="mt-3 overflow-auto rounded bg-black/5 p-3 text-xs dark:bg-white/5">
            {JSON.stringify(data.items, null, 2)}
          </pre>
        </details>
      </Card>
    </main>
  )
}
