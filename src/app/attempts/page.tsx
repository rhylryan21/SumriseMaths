'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { listRecentAttempts, type AttemptSummary } from '@/lib/api'

export default function AttemptsPage() {
  const [items, setItems] = React.useState<AttemptSummary[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string>('')

  React.useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await listRecentAttempts(20)
        if (!alive) return
        setItems(data)
      } catch (e) {
        if (!alive) return
        const msg = e instanceof Error ? e.message : 'Failed to load attempts.'
        setError(msg)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Recent attempts</h1>

      <Card className="p-4">
        {loading ? (
          <p>Loading…</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground">No attempts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-left">Score</th>
                  <th className="px-3 py-2 text-left">Duration</th>
                  <th className="px-3 py-2 text-left" />
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const created = row.created_at ? new Date(row.created_at).toLocaleString() : '—'
                  const score = `${row.correct}/${row.total}`
                  const duration =
                    typeof row.duration_ms === 'number' ? `${row.duration_ms} ms` : '—'

                  return (
                    <tr key={row.id} className="border-b">
                      <td className="px-3 py-2">
                        <Link className="underline" href={`/attempts/${row.id}`}>
                          {row.id}
                        </Link>
                      </td>
                      <td className="px-3 py-2">{created}</td>
                      <td className="px-3 py-2">{score}</td>
                      <td className="px-3 py-2">{duration}</td>
                      <td className="px-3 py-2">
                        <Link href={`/attempts/${row.id}`}>
                          <Button>View</Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </main>
  )
}
