// web/src/hooks/useQuestions.ts
'use client'

import { useEffect, useState } from 'react'
import { getQuestions } from '@/lib/api'
import type { Question } from '@/lib/types'

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setErr] = useState<string>('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const qs = await getQuestions()
        if (active) setQuestions(qs)
      } catch (e: unknown) {
        const message = e instanceof Error && e.message ? e.message : 'Failed to load questions.'
        if (active) setErr(message)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  return { questions, loading, error }
}
