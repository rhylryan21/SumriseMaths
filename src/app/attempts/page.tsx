'use client'

import { useEffect, useState } from 'react'
import { listRecentAttempts, type AttemptSummary } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function AttemptsPage() {
  const [rows, setRows] = useState<AttemptSummary[] | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await listRecentAttempts(20)
        if (mounted) setRows(data)
      } catch (e) {
        const msg = e instanceof Error && e.message ? e.message : 'Failed to load recent attempts.'
        if (mounted) setError(msg)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  if (error) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <Card className="border border-red-300 bg-red-50 p-4" role="alert">
          <p className="text-red-700">{error}</p>
        </Card>
      </main>
    )
  }

  if (!rows) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <p>Loading…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recent Attempts</h1>
        <div className="flex gap-2">
          <a href="/practice">
            <Button>Practice</Button>
          </a>
          <a href="/set">
            <Button variant="secondary">Set</Button>
          </a>
        </div>
      </header>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-900 dark:text-gray-100">
            <thead className="bg-gray-50 text-left text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2">Score</th>
                <th className="px-4 py-2">Duration (ms)</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-3" colSpan={4}>
                    No attempts yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 font-mono">{r.id}</td>
                    <td className="px-4 py-3">{r.created_at ?? '—'}</td>
                    <td className="px-4 py-3">
                      {r.correct}/{r.total}
                    </td>
                    <td className="px-4 py-3">
                      {typeof r.duration_ms === 'number' ? r.duration_ms : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  )
}
