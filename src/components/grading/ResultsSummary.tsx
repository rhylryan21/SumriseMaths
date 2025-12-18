'use client'

import * as React from 'react'
import type { MarkBatchResponse } from '@/lib/types'

type Props = { data: MarkBatchResponse }

export default function ResultsSummary({ data }: Props) {
  if (!data) return null
  const { ok, total, correct, results, duration_ms } = data

  return (
    <div className="space-y-3">
      <p className="font-medium">{ok ? '✅ All done' : '⚠️ Completed with errors'}</p>
      <p>
        Score: {correct}/{total}
        {typeof duration_ms === 'number' ? ` • ${duration_ms} ms` : ''}
      </p>

      <ul className="space-y-2">
        {results.map((r) => (
          <li key={r.id} className="rounded border p-3">
            <div className="font-mono text-sm">Q: {r.id}</div>
            <div className="text-sm">
              {r.correct ? `✅ Correct — score ${r.score}` : `❌ Incorrect — score ${r.score}`}
            </div>
            {r.expected ? <div className="text-sm">Expected: {r.expected}</div> : null}
            {r.feedback ? <div className="text-sm">{r.feedback}</div> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
