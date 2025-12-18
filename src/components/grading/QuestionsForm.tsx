'use client'

import * as React from 'react'
import { useCallback } from 'react'
import type { Question } from '@/lib/types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type Props = {
  questions: Question[]
  answers: Record<string, string>
  /** Must end with "Action" to avoid Next’s function-prop warning */
  setAnswerAction: (id: string, value: string) => void
  /** Must end with "Action" to avoid Next’s function-prop warning */
  onSubmitAction: () => Promise<void> | void
  loading?: boolean
  /**
   * Optional client-side validator.
   * Return empty string ("") when valid, or a human message when invalid.
   */
  validate?: (value: string) => string
  attempted?: boolean
}

export default function QuestionsForm({
  questions,
  answers,
  setAnswerAction,
  onSubmitAction,
  loading = false,
  validate,
  attempted = false,
}: Props) {
  const onChange = useCallback(
    (id: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setAnswerAction(id, e.target.value)
    },
    [setAnswerAction],
  )

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      await onSubmitAction()
    },
    [onSubmitAction],
  )

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {questions.map((q) => {
        const value = answers[q.id] ?? ''
        const rawMsg = validate ? validate(value) : ''
        const hasTyped = value.trim().length > 0
        const showError = !!rawMsg && (attempted || hasTyped)
        const msg = showError ? rawMsg : ''

        return (
          <div key={q.id} className="space-y-1">
            <label className="block text-sm font-medium">{q.prompt ?? q.text ?? q.id}</label>
            <Input
              value={value}
              onChange={onChange(q.id)}
              aria-invalid={showError}
              aria-describedby={showError ? `${q.id}-error` : undefined}
              disabled={loading}
            />

            {showError ? (
              <p id={`${q.id}-error`} className="text-sm text-red-600">
                {msg}
              </p>
            ) : null}
          </div>
        )
      })}

      <div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Marking…' : 'Submit'}
        </Button>
      </div>
    </form>
  )
}
