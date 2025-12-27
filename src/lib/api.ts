// web/src/lib/api.ts
import type { EvaluateResponse, MarkBatchResponse, Question } from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_GRADING_URL ?? 'http://127.0.0.1:8001'
const API_KEY = process.env.NEXT_PUBLIC_GRADING_API_KEY ?? ''

function safeParseJSON(text: string): unknown {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    const maybe = (key: string) => (typeof obj[key] === 'string' ? (obj[key] as string) : '')
    const fromArray = () => {
      const v = obj['errors']
      if (Array.isArray(v) && v.length) {
        const first = v[0]
        if (typeof first === 'string') return first
        if (first && typeof first === 'object' && 'message' in (first as Record<string, unknown>)) {
          const msg = (first as Record<string, unknown>).message
          if (typeof msg === 'string') return msg
        }
      }
      return ''
    }
    const msg = maybe('error') || maybe('feedback') || maybe('detail') || fromArray()
    if (msg) return msg
  }
  return fallback
}

function buildHeaders(extra?: HeadersInit): Headers {
  const h = new Headers({ 'Content-Type': 'application/json' })
  if (API_KEY) h.set('x-api-key', API_KEY)
  if (extra) new Headers(extra).forEach((v, k) => h.set(k, v))
  return h
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: buildHeaders(init?.headers),
    cache: 'no-store',
  })
  const text = await res.text()
  const data: unknown = safeParseJSON(text)
  if (!res.ok) {
    const message = getErrorMessage(data, `Request failed (${res.status})`)
    throw new Error(message)
  }
  return data as T
}

/* ===================== Batch Marking ===================== */

type RawBatchItem = {
  id: string
  response: {
    ok: boolean
    correct: boolean
    score: number
    feedback: string
    expected?: string | null
    expected_str?: string | null
  }
}

type RawBatchResponse = {
  ok: boolean
  total: number
  results: RawBatchItem[]
  attempt_id?: number | null
  duration_ms?: number | null
}

function adaptBatchResponse(raw: RawBatchResponse): MarkBatchResponse {
  const results = Array.isArray(raw.results) ? raw.results : []
  const correctCount = results.reduce((acc, it) => (it.response.correct ? acc + 1 : acc), 0)
  return {
    ok: Boolean(raw.ok),
    total: Number(raw.total ?? results.length),
    correct: Number.isFinite(correctCount) ? correctCount : 0,
    results,
    attempt_id: typeof raw.attempt_id === 'number' ? raw.attempt_id : null,
    duration_ms:
      typeof raw.duration_ms === 'number' || raw.duration_ms === null ? raw.duration_ms : null,
  }
}

/* ===================== Public API ===================== */

export async function evaluate(expr: string): Promise<EvaluateResponse> {
  return fetchJson<EvaluateResponse>(`${API_URL}/evaluate`, {
    method: 'POST',
    body: JSON.stringify({ expr }),
  })
}

export async function getQuestions(): Promise<Question[]> {
  return fetchJson<Question[]>(`${API_URL}/questions`, { method: 'GET' })
}

export async function getQuestion(id: string): Promise<Question> {
  return fetchJson<Question>(`${API_URL}/questions/${encodeURIComponent(id)}`, { method: 'GET' })
}

export async function markBatch(
  items: { id: string; answer: string }[],
  durationMs?: number,
): Promise<MarkBatchResponse> {
  const payload = typeof durationMs === 'number' ? { items, duration_ms: durationMs } : { items }
  const raw = await fetchJson<RawBatchResponse>(`${API_URL}/mark-batch`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return adaptBatchResponse(raw)
}

export async function listQuestions(): Promise<Question[]> {
  return getQuestions()
}

/* ===================== Attempts ===================== */

export type AttemptSummary = {
  id: number
  created_at: string | null
  total: number
  correct: number
  duration_ms: number | null
}

type RawAttempt = Partial<AttemptSummary> & { items?: unknown }

function adaptAttempt(a: RawAttempt | null | undefined): AttemptSummary | null {
  if (!a || typeof a !== 'object') return null
  const id = typeof a.id === 'number' ? a.id : NaN
  if (!Number.isFinite(id)) return null
  return {
    id,
    created_at:
      typeof a.created_at === 'string' || a.created_at === null ? (a.created_at ?? null) : null,
    total: Number.isFinite(a.total as number) ? Number(a.total) : 0,
    correct: Number.isFinite(a.correct as number) ? Number(a.correct) : 0,
    duration_ms:
      typeof a.duration_ms === 'number' || a.duration_ms === null
        ? (a.duration_ms as number | null)
        : null,
  }
}

function isRawAttemptArray(x: unknown): x is RawAttempt[] {
  return Array.isArray(x)
}

function hasItemsArray(x: unknown): x is { items: unknown[] } {
  return !!x && typeof x === 'object' && Array.isArray((x as { items?: unknown[] }).items)
}

export async function listRecentAttempts(limit = 20): Promise<AttemptSummary[]> {
  const res = await fetchJson<unknown>(
    `${API_URL}/attempts/recent-list?limit=${encodeURIComponent(limit)}`,
    { method: 'GET' },
  )

  let rawList: RawAttempt[] = []
  if (isRawAttemptArray(res)) {
    rawList = res
  } else if (hasItemsArray(res)) {
    // We still validate each entry via adaptAttempt, so unsafe elements are filtered out.
    rawList = (res.items as unknown[]).filter(
      (x): x is RawAttempt => typeof x === 'object' && x !== null,
    )
  }

  return rawList.map(adaptAttempt).filter((a): a is AttemptSummary => a !== null)
}
