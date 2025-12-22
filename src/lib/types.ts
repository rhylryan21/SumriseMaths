// src/lib/types.ts

// --- OpenAPI-generated types (do not edit these imports) ---
import type { components } from '@/lib/api-types'

// Raw API shapes straight from the backend spec
export type ApiEvaluateResponse = components['schemas']['EvaluateResponse']
export type ApiMarkResponse = components['schemas']['MarkResponse']
export type ApiMarkRequest = components['schemas']['MarkRequest']
export type ApiMarkBatchItem = components['schemas']['MarkBatchItem']
export type ApiMarkBatchResponse = components['schemas']['MarkBatchResponse']
export type ApiQuestionOut = components['schemas']['QuestionOut']

// --- UI-friendly aliases / extensions ---

// What we POST in /mark and /mark-batch
export type BatchItem = ApiMarkRequest
export type MarkItem = BatchItem // backward-compat alias

// Question used in the UI.
// Backend returns { id, topic, prompt, type }. We allow legacy fields too.
export type Question = ApiQuestionOut & {
  /** legacy: some JSONL had `text` */
  text?: string
  /** optional: fraction questions in JSONL sometimes had this */
  answer_expr?: string | null
}

// Item within MarkBatchResponse.results (kept in API shape: { id, response })
export type MarkBatchItemResult = ApiMarkBatchItem

// UI-normalized batch response.
// Backend response does not include `correct` or `duration_ms`,
// so we compute/attach them in the adapter.
export type MarkBatchResponse = ApiMarkBatchResponse & {
  /** number of correct items (derived client-side) */
  correct: number
  /** client- or server-measured duration; null if unknown */
  duration_ms: number | null
}

// Single-item mark response (when calling /mark)
export type MarkResult = ApiMarkResponse

// Evaluate (/evaluate) response (kept as-is)
export type EvaluateResponse = ApiEvaluateResponse
