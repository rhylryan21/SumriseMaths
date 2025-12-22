'use client'

import * as React from 'react'
import QuestionsForm from '@/components/grading/QuestionsForm'
import type { Question, MarkBatchResponse } from '@/lib/types'
import ResultsSummary from '@/components/grading/ResultsSummary'
import { Card } from '@/components/ui/Card'
import { markBatch, getQuestions } from '@/lib/api'
import { validateAnswer } from '@/lib/validation'

export default function SetPage() {
  const [questions, setQuestions] = React.useState<Question[]>([])
  const [answers, setAnswers] = React.useState<Record<string, string>>({})
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [result, setResult] = React.useState<MarkBatchResponse | null>(null)

  // Load questions client-side
  React.useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setError('')
        const qs = await getQuestions()
        if (!alive) return
        setQuestions(qs)
        setAnswers(Object.fromEntries(qs.map((q) => [q.id, ''])))
      } catch (e) {
        if (!alive) return
        const msg = e instanceof Error ? e.message : 'Failed to load questions.'
        setError(msg)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  // Next client entry rule: Action-suffixed names
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

      <Card>
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

      {result ? <ResultsSummary data={result} /> : null}
    </div>
  )
}
