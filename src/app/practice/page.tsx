'use client'
import { useEffect, useState } from 'react'
import { Button, PrimaryButton } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

type Question = { id: string; topic: string; prompt: string; type: string }
type MarkResponse = {
  ok: boolean
  correct: boolean
  score: number
  feedback: string
  expected?: number
  expected_str?: string
  steps?: string[]
}

const API_URL = process.env.NEXT_PUBLIC_GRADING_URL ?? 'http://127.0.0.1:8001'

export default function PracticePage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [mark, setMark] = useState<MarkResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const q = questions[idx]

  const submit = async () => {
    if (!q) return
    setLoading(true)
    setMark(null)
    try {
      const res = await fetch(`${API_URL}/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: q.id, answer }),
      })
      const data: MarkResponse = await res.json()
      setMark(data)
    } finally {
      setLoading(false)
    }
  }

  const next = () => {
    setAnswer('')
    setMark(null)
    setIdx((i) => (i + 1) % questions.length)
  }

  const [loadError, setLoadError] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/questions`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as Question[]
        setQuestions(data)
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Network error')
      }
    }
    load()
  }, [])

  return (
    <main className="container">
      <div className="wrapper space-y-4">
        <h1 className="h1">Practice</h1>

        {!q && <div>Loading questions…</div>}

        {q && (
          <div className="space-y-3">
            <div className="small muted">Topic: {q.topic}</div>
            <div className="title">{q.prompt}</div>
            <div className="controls">
              <Input
                className="flex-1"
                placeholder="Your answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <PrimaryButton disabled={loading || !answer.trim()} onClick={submit}>
                {loading ? 'Checking…' : 'Check'}
              </PrimaryButton>
            </div>

            {mark && (
              <div className={mark.correct ? 'feedback-success' : 'feedback-error'}>
                {mark.feedback}{' '}
                {mark.ok && typeof mark.expected === 'number' && !mark.correct && (
                  <span className="text-gray-500"> (Expected ≈ {mark.expected})</span>
                )}
              </div>
            )}
            {mark?.steps?.length ? (
              <Card>
                <div className="mb-1 font-medium">Worked steps</div>
                <ol className="ml-5 list-decimal space-y-1">
                  {mark.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </Card>
            ) : null}

            {loadError && (
              <div className="feedback-error">Failed to load questions: {loadError}</div>
            )}

            <div className="controls">
              <Button onClick={next} disabled={!questions.length}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
