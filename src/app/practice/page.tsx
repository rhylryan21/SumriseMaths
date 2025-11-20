'use client'
import { useEffect, useState } from 'react'

type Question = { id: string; topic: string; prompt: string; type: string }
type MarkResponse = { ok: boolean; correct: boolean; score: number; feedback: string; expected?: number }

const API_URL = process.env.NEXT_PUBLIC_GRADING_URL ?? 'http://127.0.0.1:8001'

export default function PracticePage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [mark, setMark] = useState<MarkResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const q = questions[idx]

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API_URL}/questions`)
      const data = (await res.json()) as Question[]
      setQuestions(data)
    }
    load().catch(console.error)
  }, [])

  const submit = async () => {
    if (!q) return
    setLoading(true)
    setMark(null)
    try {
      const res = await fetch(`${API_URL}/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: q.id, answer })
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

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold">Practice</h1>

        {!q && <div>Loading questions…</div>}

        {q && (
          <div className="space-y-3">
            <div className="text-sm text-gray-500">Topic: {q.topic}</div>
            <div className="text-lg">{q.prompt}</div>
            <div className="flex gap-2">
              <input
                className="border rounded p-2 flex-1"
                placeholder="Your answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <button
                className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
                disabled={loading || !answer.trim()}
                onClick={submit}
              >
                {loading ? 'Checking…' : 'Check'}
              </button>
            </div>

            {mark && (
              <div className={`p-3 rounded border ${mark.correct ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'}`}>
                {mark.feedback} {mark.ok && typeof mark.expected === 'number' && !mark.correct && (
                  <span className="text-gray-500"> (Expected ≈ {mark.expected})</span>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded border"
                onClick={next}
                disabled={!questions.length}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
