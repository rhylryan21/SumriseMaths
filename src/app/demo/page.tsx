'use client'
import { useState, useMemo } from 'react'

type EvaluateResponse = { ok: true; value: number } | { ok: false; feedback?: string }

const API_URL = process.env.NEXT_PUBLIC_GRADING_URL ?? 'http://127.0.0.1:8001'
const ALLOWED = /^[0-9\s+\-*/^().]{1,100}$/

export default function DemoPage() {
  const [expr, setExpr] = useState('3^2 + 4^2')
  const [result, setResult] = useState<string>('') // current attempt
  const [lastGood, setLastGood] = useState<string>('') // persists last success
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const clientSideHint = useMemo(() => {
    if (!expr.trim()) return 'Enter something like 3^2 + 4^2'
    if (!ALLOWED.test(expr)) return 'Only digits, + - * / ^ ( ) . and spaces (max 100 chars).'
    return ''
  }, [expr])

  const callApi = async () => {
    setLoading(true)
    setError('')
    setResult('')
    try {
      const res = await fetch(`${API_URL}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expr }),
      })
      const json: EvaluateResponse = await res.json()
      if (json.ok) {
        const val = String(json.value)
        setResult(val)
        setLastGood(val)
      } else {
        setError(json.feedback ?? 'Unknown error')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold">Sumrise Maths · Demo</h1>
        <p className="text-sm text-gray-600">
          Tip: <code>^</code> means power here (e.g., <code>3^2</code>).
        </p>

        <div className="flex gap-2">
          <input
            className="flex-1 rounded border p-2"
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            placeholder="Enter expression (e.g., 3^2 + 4^2)"
          />
          <button
            onClick={callApi}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            disabled={loading || !!clientSideHint}
          >
            {loading ? 'Working…' : 'Evaluate'}
          </button>
        </div>

        {clientSideHint && (
          <div className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-700">
            {clientSideHint}
          </div>
        )}

        {result && <div className="rounded border p-3">Result: {result}</div>}

        {error && (
          <div className="rounded border border-red-500 p-3 text-red-700">Error: {error}</div>
        )}

        {lastGood && !result && !error && (
          <div className="text-sm text-gray-500">Last correct answer: {lastGood}</div>
        )}
      </div>
    </main>
  )
}
