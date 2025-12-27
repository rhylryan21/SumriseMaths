'use client'

import { useState } from 'react'
import { useQuestions } from '@/hooks/useQuestions'
import { useBatchMark } from '@/hooks/useBatchMark'
import QuestionsForm from '@/components/grading/QuestionsForm'
import ResultsSummary from '@/components/grading/ResultsSummary'
import { Card } from '@/components/ui/Card'
import { validateAnswer } from '@/lib/validation'

/** Convert ValidationResult -> string message for the UI (empty string means no error) */
const adaptValidator = (raw: string) => {
  const r = validateAnswer(raw)
  return r.ok ? '' : (r.error ?? 'Invalid input')
}

export default function PracticePage() {
  const { questions, loading, error } = useQuestions({
    topic: 'fractions',
    limit: 10,
    random: true,
  })
  const [attempted, setAttempted] = useState(false)

  // Hook parity: pass a validator that returns string|null
  const {
    answers,
    setAnswer,
    submit,
    loading: marking,
    result,
    error: submitErr,
  } = useBatchMark(questions, (v) => adaptValidator(v) || null)

  // Handle submit: mark and then clear the attempted flag for the next round
  const onSubmitAction = async () => {
    setAttempted(true)
    await submit()
    setAttempted(false)
  }

  if (loading) return <main className="p-6">Loading…</main>
  if (error) return <main className="p-6 text-red-500">{error}</main>
  if (!questions?.length) return <main className="p-6">No questions.</main>

  const qKey = questions.map((q) => q.id).join(',')

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Practice</h1>

      <QuestionsForm
        key={qKey}
        questions={questions}
        answers={answers}
        setAnswerAction={setAnswer}
        onSubmitAction={onSubmitAction}
        loading={marking}
        validate={adaptValidator}
        attempted={attempted}
      />

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
