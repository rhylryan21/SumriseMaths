'use client'
import { useState } from 'react'

export default function DemoPage() {
  const [expr, setExpr] = useState('3^2 + 4^2')
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const callApi = async () => {
    setLoading(true); setError(''); setResult('')
    try {
      const res = await fetch('http://127.0.0.1:8001/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expr })
      })

      // Define the shape we expect from the API
      type EvaluateResponse =
        | { ok: true; value: number }
        | { ok: false; error?: string }

      const json: EvaluateResponse = await res.json()

      if (json.ok) {
        setResult(String(json.value))
      } else {
        setError(json.error ?? 'Unknown error')
      }
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message)
      else setError('Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold">Sumrise Maths · Demo</h1>
        <p>Type a maths expression (e.g., <code>3^2 + 4^2</code>) and click Evaluate.</p>
        <div className="flex gap-2">
          <input
            className="border rounded p-2 flex-1"
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            placeholder="Enter expression"
          />
          <button onClick={callApi} className="px-4 py-2 rounded bg-black text-white" disabled={loading}>
            {loading ? 'Working…' : 'Evaluate'}
          </button>
        </div>
        {result && <div className="p-3 rounded border">Result: {result}</div>}
        {error && <div className="p-3 rounded border border-red-500 text-red-700">Error: {error}</div>}
        <p className="text-sm text-gray-500">The API must be running locally on port 8001.</p>
      </div>
    </main>
  )
}
