'use client'

import * as React from 'react'
import { useQuestions } from '@/hooks/useQuestions'
import { useBatchMark } from '@/hooks/useBatchMark'
import QuestionsForm from '@/components/grading/QuestionsForm'
import ResultsSummary from '@/components/grading/ResultsSummary'
import { Card } from '@/components/ui/Card'
import { validateAnswer } from '@/lib/validation'

export default function PracticePage() {
  // Load questions client-side
  const { questions, loading, error } = useQuestions()

  // Stable adapter: ValidationResult -> string|null expected by useBatchMark
  const adaptValidator = React.useCallback((raw: string) => {
    const r = validateAnswer(raw)
    return r.ok ? null : (r.error ?? 'Invalid input')
  }, [])

  const {
    answers,
    setAnswer, // will be passed as setAnswerAction
    submit, // will be passed as onSubmitAction
    loading: marking,
    error: submitErr,
    result,
  } = useBatchMark(questions, adaptValidator)

  // Handlers are memoized to avoid prop identity churn
  const setAnswerAction = React.useCallback(
    (id: string, val: string) => {
      setAnswer(id, val)
    },
    [setAnswer],
  )

  const onSubmitAction = React.useCallback(async () => {
    await submit()
  }, [submit])

  if (loading) return <main className="p-6">Loading…</main>
  if (error) return <main className="p-6 text-red-600">{error}</main>
  if (!questions || !questions.length) return <main className="p-6">No questions.</main>

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Practice</h1>

      <Card className="p-4">
        <QuestionsForm
          questions={questions}
          answers={answers}
          setAnswerAction={setAnswerAction}
          onSubmitAction={onSubmitAction}
          loading={marking}
          // QuestionsForm expects a string; return '' when valid
          validate={(v) => adaptValidator(v) ?? ''}
        />
      </Card>

      {submitErr && (
        <Card className="border border-red-300 bg-red-50 p-4" role="alert" aria-live="assertive">
          <p className="text-red-700">{submitErr}</p>
        </Card>
      )}

      {result && (
        <Card className="p-4" role="status" aria-live="polite">
          <h2 className="mb-2 text-lg font-semibold">Results</h2>
          <ResultsSummary data={result} />
        </Card>
      )}
    </main>
  )
}
