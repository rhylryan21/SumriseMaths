'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { markBatch } from '@/lib/api'
import type { Question, MarkItem, MarkBatchResponse } from '@/lib/types'

/** Client-side validation (kept in parity with backend) */
const ALLOWED = /^[0-9+\-*/^().\s]{1,100}$/
const LEN_LIMIT = 100

export type AnswerValidator = (answer: string) => string | null

function defaultValidate(val: string): string | null {
  if (!val) return 'Answer required'
  if (val.length > LEN_LIMIT) return `Answer too long (> ${LEN_LIMIT})`
  if (!ALLOWED.test(val)) {
    return 'Only digits, + - * / ^ ( ) . and spaces allowed (max 100 chars).'
  }
  return null
}

/**
 * Hook for batch marking.
 * @param questions List of questions to render/mark (or null while loading)
 * @param validateAnswer Optional custom validator (defaults to numeric parity rules)
 */
export function useBatchMark(questions: Question[] | null, validateAnswer?: AnswerValidator) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MarkBatchResponse | null>(null)
  const [error, setError] = useState<string>('')

  // Track when the session started to compute duration_ms for backend
  const startedAt = useRef<number | null>(null)

  const setAnswer = useCallback((id: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [id]: val }))
  }, [])

  /** Per-question validation map */
  const validation = useMemo(() => {
    if (!questions) return {} as Record<string, string | null>
    const v: Record<string, string | null> = {}
    for (const q of questions) {
      const ans = answers[q.id] ?? ''
      v[q.id] = (validateAnswer ?? defaultValidate)(ans)
    }
    return v
  }, [answers, questions, validateAnswer])

  /** Can submit only if at least one answer and no validation errors */
  const canSubmit = useMemo(() => {
    if (!questions) return false
    const anyAnswered = questions.some((q) => (answers[q.id] ?? '').trim() !== '')
    const hasErrors = Object.values(validation).some((msg) => !!msg)
    return anyAnswered && !hasErrors
  }, [answers, questions, validation])

  const reset = useCallback(() => {
    setAnswers({})
    setResult(null)
    setError('')
    startedAt.current = null
  }, [])

  const submit = useCallback(async () => {
    if (!questions) return

    // Stop early if there are validation errors
    const hasErrors = Object.values(validation).some((msg) => !!msg)
    if (hasErrors) {
      setError('Please fix the highlighted answers.')
      setResult(null)
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    if (startedAt.current == null) {
      startedAt.current = typeof performance !== 'undefined' ? performance.now() : Date.now()
    }

    try {
      const items: MarkItem[] = questions.map((q) => ({
        id: q.id,
        answer: answers[q.id] ?? '',
      }))

      const duration =
        startedAt.current != null
          ? Math.round(
              (typeof performance !== 'undefined' ? performance.now() : Date.now()) -
                startedAt.current,
            )
          : undefined

      const data = await markBatch(items, duration)
      setResult(data)
    } catch (e: unknown) {
      let message = 'Failed to submit. Please try again.'
      if (e instanceof Error && e.message) {
        message = e.message
      } else if (typeof e === 'string' && e) {
        message = e
      }
      setError(message)
    } finally {
      setLoading(false)
      startedAt.current = null
    }
  }, [answers, questions, validation])

  const score = useMemo(() => {
    if (!result) return { total: 0, correct: 0 }
    return { total: result.total, correct: result.correct }
  }, [result])

  return {
    answers,
    setAnswer,
    submit,
    loading,
    error,
    result,
    score,
    validation,
    canSubmit,
    reset,
  }
}

export default useBatchMark
