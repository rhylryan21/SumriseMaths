'use client'
import { useState, type FormEvent } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { evaluate } from '@/lib/api'
import type { EvaluateResponse } from '@/lib/types'
import { validateAnswer } from '@/lib/validation'

export default function DemoPage() {
  const [expr, setExpr] = useState('3^2 + 4^2')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<EvaluateResponse | null>(null)
  const [error, setError] = useState('')

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const v = validateAnswer(expr)
    if (!v.ok) {
      setError(v.error || 'Invalid expression')
      setData(null)
      return
    }

    setLoading(true)
    try {
      const res = await evaluate(v.value)
      setData(res)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to evaluate.'
      setError(message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Evaluate (demo)</h1>
      <Card className="p-4">
        <form onSubmit={onSubmit} className="space-y-3">
          <label htmlFor="expr" className="sr-only">
            Expression
          </label>
          <Input
            id="expr"
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            placeholder="e.g. 3^2 + 4^2"
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Running…' : 'Run'}
          </Button>
        </form>
      </Card>

      {error && (
        <div className="text-red-500" role="status" aria-live="polite">
          {error}
        </div>
      )}

      {data && (
        <Card className="p-4">
          {data.ok ? (
            <div>Value: {data.value}</div>
          ) : (
            <div className="text-red-500">{data.feedback ?? 'Invalid expression'}</div>
          )}
        </Card>
      )}
    </main>
  )
}
