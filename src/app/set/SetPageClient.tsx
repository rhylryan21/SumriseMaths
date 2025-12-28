'use client'

import * as React from 'react'
import QuestionsForm from '@/components/grading/QuestionsForm'
import ResultsSummary from '@/components/grading/ResultsSummary'
import { Card } from '@/components/ui/Card'
import { getQuestions, markBatch } from '@/lib/api'
import { validateAnswer } from '@/lib/validation'
import { topicLabel } from '@/lib/topics'
import type { MarkBatchResponse, Question } from '@/lib/types'

type Filters = {
  topic?: string
  limit?: number
}

export default function SetClient() {
  const [topics, setTopics] = React.useState<string[]>([])
  const [filters, setFilters] = React.useState<Filters>({ topic: undefined, limit: 10 })

  const [questions, setQuestions] = React.useState<Question[]>([])
  const [answers, setAnswers] = React.useState<Record<string, string>>({})
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [result, setResult] = React.useState<MarkBatchResponse | null>(null)

  // one-time: fetch all topics to populate the dropdown (derive from questions)
  React.useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const all = await getQuestions() // no filters -> we just extract unique topics
        if (!alive) return
        const uniq = Array.from(new Set(all.map((q) => q.topic).filter(Boolean))) as string[]
        // Sort by human-friendly label
        uniq.sort((a, b) => topicLabel(a).localeCompare(topicLabel(b)))
        setTopics(uniq)
      } catch (e) {
        if (!alive) return
        const msg = e instanceof Error ? e.message : 'Failed to load topics.'
        setError(msg)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  // fetch questions whenever filters change
  React.useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setError('')
      setResult(null)
      try {
        const qs = await getQuestions({
          topic: filters.topic || undefined,
          limit: typeof filters.limit === 'number' && filters.limit > 0 ? filters.limit : undefined,
        })
        if (!alive) return
        setQuestions(qs)
        setAnswers(Object.fromEntries(qs.map((q) => [q.id, ''])))
      } catch (e) {
        if (!alive) return
        const msg = e instanceof Error ? e.message : 'Failed to load questions.'
        setError(msg)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [filters.topic, filters.limit])

  const setAnswerAction = React.useCallback((id: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [id]: val }))
  }, [])

  const fieldValidate = React.useCallback((val: string) => {
    const r = validateAnswer(val)
    return r.ok ? '' : (r.error ?? 'Invalid input')
  }, [])

  const validateAll = React.useCallback(() => {
    const v: Record<string, string | null> = {}
    for (const q of questions) {
      const raw = answers[q.id] ?? ''
      const r = validateAnswer(raw)
      v[q.id] = r.ok ? null : (r.error ?? 'Invalid input')
    }
    return !Object.values(v).some(Boolean)
  }, [answers, questions])

  const onSubmitAction = React.useCallback(async () => {
    if (!validateAll()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const items = questions.map((q) => ({ id: q.id, answer: answers[q.id] ?? '' }))
      const data = await markBatch(items)
      setResult(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to mark.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [answers, questions, validateAll])

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Set Practice</h1>

      {/* Filters */}
      <Card className="p-4">
        <form
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm">Topic</span>
            <select
              className="bg-background rounded border p-2"
              value={filters.topic ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, topic: e.target.value || undefined }))}
            >
              <option value="">All topics</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {topicLabel(t)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm">Number of questions</span>
            <input
              type="number"
              min={1}
              max={50}
              step={1}
              className="bg-background rounded border p-2"
              value={filters.limit ?? 10}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  limit: Number.isFinite(+e.target.value)
                    ? Math.max(1, Math.min(50, +e.target.value))
                    : 10,
                }))
              }
            />
          </label>
        </form>
      </Card>

      {/* Questions */}
      <Card className="p-4">
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <QuestionsForm
            questions={questions}
            answers={answers}
            setAnswerAction={setAnswerAction}
            onSubmitAction={onSubmitAction}
            loading={loading}
            validate={fieldValidate}
          />
        )}
      </Card>

      {/* Results */}
      {result ? (
        <Card className="p-4">
          <ResultsSummary data={result} />
        </Card>
      ) : null}
    </div>
  )
}
