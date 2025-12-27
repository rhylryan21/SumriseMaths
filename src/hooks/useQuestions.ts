// web/src/hooks/useQuestions.ts
'use client'

import { useEffect, useMemo, useState } from 'react'
import { getQuestions, type QuestionQuery } from '@/lib/api'
import type { Question } from '@/lib/types'

/**
 * Fetch questions from the API.
 * Accepts optional query params (topic/limit/random) and refetches when they change.
 */
export function useQuestions(params?: QuestionQuery) {
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  // Stable dependency key for params object so effect doesn't run on identity-only changes
  const paramKey = useMemo(() => JSON.stringify(params ?? {}), [params])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    ;(async () => {
      try {
        const qs = await getQuestions(params)
        if (active) setQuestions(qs)
      } catch (e: unknown) {
        const message = e instanceof Error && e.message ? e.message : 'Failed to load questions.'
        if (active) setError(message)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [paramKey, params])

  return { questions, loading, error }
}
