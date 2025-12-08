'use client'

import { useEffect, useMemo, useState } from 'react'

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

type BatchItem = { id: string; answer: string }
type BatchResult = { id: string; response: MarkResponse }
type BatchResponse = { ok: boolean; total: number; correct: number; results: BatchResult[] }

const API_URL = process.env.NEXT_PUBLIC_GRADING_URL ?? 'http://127.0.0.1:8001'

export default function SetPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<BatchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [count, setCount] = useState<number>(5)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/questions`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as Question[]
        setQuestions(data)
        setAllQuestions(data)
        setCount(Math.min(5, data.length))
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Network error')
      }
    }
    load()
  }, [])

  const byId = useMemo(() => {
    const map = new Map<string, BatchResult>()
    if (result?.results) {
      for (const r of result.results) map.set(r.id, r)
    }
    return map
  }, [result])

  const topics = useMemo(
    () => Array.from(new Set(allQuestions.map((q) => q.topic))).sort(),
    [allQuestions],
  )

  const submit = async () => {
    setLoading(true)
    setResult(null)
    try {
      const items: BatchItem[] = questions.map((q) => ({
        id: q.id,
        answer: answers[q.id] ?? '',
      }))
      const res = await fetch(`${API_URL}/mark-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = (await res.json()) as BatchResponse
      setResult(data)
    } catch (e) {
      // surface a generic result error
      setResult({
        ok: false,
        total: 0,
        correct: 0,
        results: [],
      } as BatchResponse)
    } finally {
      setLoading(false)
    }
  }

  const retryIncorrect = () => {
    if (!result) return
    const incorrectIds = result.results.filter((r) => !r.response.correct).map((r) => r.id)
    const filtered = allQuestions.filter((q) => incorrectIds.includes(q.id))
    setQuestions(filtered)
    setAnswers({})
    setResult(null)
  }

  const resetSet = () => {
    setQuestions(allQuestions)
    setAnswers({})
    setResult(null)
  }

  const newSet = () => {
    if (!allQuestions.length) return
    const pool = selectedTopics.length
      ? allQuestions.filter((q) => selectedTopics.includes(q.topic))
      : allQuestions
    const n = Math.max(1, Math.min(count, pool.length || 1))
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    setQuestions(shuffled.slice(0, n))
    setAnswers({})
    setResult(null)
  }

  return (
    <main style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Practice set</h1>
        {topics.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 14, color: '#374151' }}>Topics:</span>
            {topics.map((t) => {
              const checked = selectedTopics.includes(t)
              return (
                <label
                  key={t}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedTopics((prev) =>
                        checked ? prev.filter((x) => x !== t) : [...prev, t],
                      )
                    }
                  />
                  {t}
                </label>
              )
            })}
            {/* quick clear */}
            {selectedTopics.length > 0 && (
              <button
                onClick={() => setSelectedTopics([])}
                style={{
                  padding: '4px 8px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                }}
              >
                Clear
              </button>
            )}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <label htmlFor="count" style={{ fontSize: 14, color: '#374151' }}>
            Number of questions:
          </label>
          <input
            id="count"
            type="number"
            min={1}
            max={Math.max(1, allQuestions.length)}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            style={{ width: 90, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 8 }}
          />
          <button
            onClick={newSet}
            disabled={!allQuestions.length}
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              background: '#fff',
              cursor: !allQuestions.length ? 'not-allowed' : 'pointer',
            }}
          >
            New set
          </button>
        </div>

        {loadError && (
          <div
            style={{
              padding: 12,
              border: '1px solid #ef4444',
              color: '#991b1b',
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            Failed to load questions: {loadError}
          </div>
        )}

        {!questions.length && !loadError && <div>Loading…</div>}

        {questions.map((q) => {
          const fb = byId.get(q.id)?.response
          return (
            <div
              key={q.id}
              style={{
                padding: 16,
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                [{q.topic}] {q.id}
              </div>
              <div style={{ fontSize: 18, marginBottom: 8 }}>{q.prompt}</div>

              <input
                value={answers[q.id] ?? ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                placeholder="Your answer"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              />

              {fb && (
                <div
                  style={{
                    padding: 10,
                    border: `1px solid ${fb.correct ? '#22c55e' : '#ef4444'}`,
                    color: fb.correct ? '#166534' : '#991b1b',
                    borderRadius: 8,
                    background: fb.correct ? '#f0fdf4' : '#fef2f2',
                  }}
                >
                  {fb.feedback}
                  {!fb.correct && (fb.expected_str || typeof fb.expected === 'number') && (
                    <span style={{ color: '#6b7280' }}>
                      {' '}
                      (Expected ≈ {fb.expected_str ?? fb.expected})
                    </span>
                  )}

                  {fb.steps?.length ? (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Worked steps</div>
                      <ol style={{ paddingLeft: 18, margin: 0 }}>
                        {fb.steps.map((s, i) => (
                          <li key={i} style={{ marginBottom: 4 }}>
                            {s}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )
        })}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={submit}
            disabled={loading || !questions.length}
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              background: '#111827',
              color: 'white',
              border: 'none',
              opacity: loading || !questions.length ? 0.6 : 1,
              cursor: loading || !questions.length ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Marking…' : 'Mark set'}
          </button>

          {result && (
            <div style={{ fontSize: 14, color: '#374151' }}>
              Score: <span style={{ fontWeight: 600 }}>{result.correct}</span> / {result.total}
            </div>
          )}
          {result && result.total > result.correct && (
            <button
              onClick={retryIncorrect}
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                background: '#fff',
              }}
            >
              Retry incorrect
            </button>
          )}

          {questions.length !== allQuestions.length && (
            <button
              onClick={resetSet}
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                background: '#fff',
              }}
            >
              Reset set
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
