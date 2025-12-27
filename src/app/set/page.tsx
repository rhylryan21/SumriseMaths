'use client'

import * as React from 'react'
import QuestionsForm from '@/components/grading/QuestionsForm'
import type { Question, MarkBatchResponse } from '@/lib/types'
import ResultsSummary from '@/components/grading/ResultsSummary'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { markBatch, getQuestions } from '@/lib/api'
import { validateAnswer } from '@/lib/validation'

export default function SetPage() {
  // data + UX state
  const [questions, setQuestions] = React.useState<Question[]>([])
  const [answers, setAnswers] = React.useState<Record<string, string>>({})
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [result, setResult] = React.useState<MarkBatchResponse | null>(null)

  // controls
  const [topics, setTopics] = React.useState<string[]>([]) // discovered topics
  const [selectedTopic, setSelectedTopic] = React.useState<string>('all')
  const [count, setCount] = React.useState<number>(10)

  // initial fetch: load once without filters so we can build the topic dropdown
  React.useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setError('')
        const qs = await getQuestions({})
        if (!alive) return
        const discovered = Array.from(
          new Set(qs.map((q) => q.topic).filter(Boolean) as string[]),
        ).sort((a, b) => a.localeCompare(b))
        setTopics(discovered)
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

  // helper: pretty label from slug
  const labelFor = React.useCallback((t: string) => {
    return t
      .replace(/[_-]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }, [])

  // fetch a filtered set whenever controls change
  React.useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        setResult(null)
        const params = {
          topic: selectedTopic === 'all' ? undefined : selectedTopic,
          limit: Math.max(1, Math.min(50, count || 1)),
        }
        const qs = await getQuestions(params)
        if (!alive) return
        setQuestions(qs)
        // reset answers for just-returned ids
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
  }, [selectedTopic, count])

  // per-field validate
  const fieldValidate = React.useCallback((val: string) => {
    const r = validateAnswer(val)
    return r.ok ? '' : (r.error ?? 'Invalid input')
  }, [])

  // validate all before submit
  const validateAll = React.useCallback(() => {
    for (const q of questions) {
      const raw = answers[q.id] ?? ''
      const r = validateAnswer(raw)
      if (!r.ok) return false
    }
    return true
  }, [answers, questions])

  // answer setter (Client Components naming rule)
  const setAnswerAction = React.useCallback((id: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [id]: val }))
  }, [])

  const onSubmitAction = React.useCallback(async () => {
    if (!validateAll()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const items = questions.map((q) => ({
        id: q.id,
        answer: answers[q.id] ?? '',
      }))
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
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Set Practice</h1>

      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col">
            <label htmlFor="topic" className="text-sm font-medium">
              Topic
            </label>
            <select
              id="topic"
              className="mt-1 rounded-md border px-3 py-2"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <option value="all">All topics</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {labelFor(t)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label htmlFor="count" className="text-sm font-medium">
              Number of questions
            </label>
            <Input
              id="count"
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value || 1))}
              className="mt-1 w-32"
            />
          </div>
        </div>
      </Card>

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

      {result ? (
        <Card className="p-4">
          <ResultsSummary data={result} />
          <div className="mt-4 flex gap-2">
            <Button onClick={() => setResult(null)}>Try another set</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setAnswers((prev) => {
                  const next = { ...prev }
                  for (const q of questions) next[q.id] = ''
                  return next
                })
                setResult(null)
              }}
            >
              Clear answers
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
