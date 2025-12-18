// src/lib/types.ts
export type Question = {
  id: string
  topic?: string
  /** Prefer `prompt` in new code; `text` is accepted for legacy data */
  prompt?: string
  text?: string
  /** Present for fraction questions; optional elsewhere */
  answer_expr?: string | null
}

export type MarkItem = { id: string; answer: string }

// Canonical item result shape used by the UI (always flattened)
export type MarkBatchItemResult = {
  id: string
  ok: boolean
  correct: boolean
  score: number
  feedback: string
  expected?: string | null
  duration_ms?: number | null
}

// Canonical batch response shape used by the UI
export type MarkBatchResponse = {
  ok: boolean
  total: number
  correct: number
  results: MarkBatchItemResult[]
  /** attempt id created server-side (used by /attempts/:id), or null */
  attempt_id: number | null
  /** server-measured duration if provided, else null */
  duration_ms: number | null
}

// Response from /evaluate
export type EvaluateResponse = {
  ok: boolean
  value: number | null
  error?: string
  feedback?: string
}
