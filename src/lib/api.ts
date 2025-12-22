// src/lib/api.ts
import type {
  EvaluateResponse,
  MarkBatchResponse,
  MarkBatchItemResult,
  Question,
} from '@/lib/types'

const API_URL = process.env.NEXT_PUBLIC_GRADING_URL ?? 'http://127.0.0.1:8001'

// ---------- raw response shapes ----------
// Raw item can be nested (response: {...}) or already flat
type RawNestedItem = {
  id: string
  response: {
    ok: boolean
    correct: boolean
    score: number
    feedback: string
    expected?: string | null
    expected_str?: string | null
    duration_ms?: number | null
  }
}
type RawFlatItem = {
  id: string
  ok: boolean
  correct: boolean
  score: number
  feedback: string
  expected?: string | null
  expected_str?: string | null
  duration_ms?: number | null
}
type RawMarkItem = RawNestedItem | RawFlatItem

type RawBatchResponse = {
  ok?: boolean
  total?: number
  correct?: number
  results?: RawMarkItem[]
  items?: RawMarkItem[]
  attempt_id?: number | string | null
  duration_ms?: number | null
} | null

// ---------- helpers ----------
function mergeHeaders(base: HeadersInit, extra?: HeadersInit): HeadersInit {
  if (!extra) return base
  const merged = new Headers(base)
  new Headers(extra).forEach((value, key) => merged.set(key, value))
  return merged
}

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
    const str = (k: string) => (typeof obj[k] === 'string' ? (obj[k] as string) : '')
    const arrFirst = () => {
      const v = obj['errors']
      if (Array.isArray(v) && v.length) {
        const first = v[0] as unknown
        if (typeof first === 'string') return first
        if (first && typeof first === 'object' && 'message' in (first as Record<string, unknown>)) {
          const msg = (first as Record<string, unknown>).message
          if (typeof msg === 'string') return msg
        }
      }
      return ''
    }
    const msg = str('error') || str('feedback') || str('detail') || arrFirst()
    if (msg) return msg
  }
  return fallback
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: mergeHeaders({ 'Content-Type': 'application/json' }, init?.headers),
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

// ---------- adapters ----------
function adaptItem(raw: RawMarkItem): MarkBatchItemResult {
  // If the server already sent { id, response: {...} }, just coerce/normalize fields.
  if ('response' in raw) {
    const r = raw.response
    return {
      id: raw.id,
      response: {
        ok: r.ok,
        correct: r.correct,
        score: r.score,
        feedback: r.feedback,
        // prefer `expected`, fall back to `expected_str`
        expected: r.expected ?? r.expected_str ?? null,
        // keep `expected_str` if present for UI that wants the raw string
        expected_str: r.expected_str ?? r.expected ?? null,
      },
    }
  }
  // Otherwise the server sent a flat shape; convert it to nested.
  return {
    id: raw.id,
    response: {
      ok: (raw as RawFlatItem).ok,
      correct: (raw as RawFlatItem).correct,
      score: (raw as RawFlatItem).score,
      feedback: (raw as RawFlatItem).feedback,
      expected: (raw as RawFlatItem).expected ?? (raw as RawFlatItem).expected_str ?? null,
      expected_str: (raw as RawFlatItem).expected_str ?? (raw as RawFlatItem).expected ?? null,
    },
  }
}

function normalizeAttemptId(x: unknown): number | null {
  if (typeof x === 'number' && Number.isFinite(x)) return x
  if (typeof x === 'string' && x.trim() !== '' && !Number.isNaN(Number(x))) return Number(x)
  return null
}

function adaptBatchResponse(raw: RawBatchResponse): MarkBatchResponse {
  const list = (raw?.results ?? raw?.items ?? []) as RawMarkItem[]
  const results = Array.isArray(list) ? list.map(adaptItem) : []

  const total = typeof raw?.total === 'number' ? raw!.total : results.length
  const correct =
    typeof raw?.correct === 'number'
      ? raw!.correct
      : results.reduce((acc, it) => acc + (it.response?.correct ? 1 : 0), 0)

  return {
    ok: Boolean(raw?.ok),
    total,
    correct,
    results,
    attempt_id: normalizeAttemptId(raw?.attempt_id),
    // keep nullable duration at the batch level if present; else null
    duration_ms: typeof raw?.duration_ms === 'number' ? raw!.duration_ms! : null,
  }
}

function assertNormalizedBatch(value: unknown): void {
  // Dev-only runtime guard: validate the *shape* without relying on compile-time types.
  const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object'
  const isString = (v: unknown): v is string => typeof v === 'string'
  const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
  const isBoolean = (v: unknown): v is boolean => typeof v === 'boolean'

  if (!isObject(value)) {
    throw new Error('MarkBatchResponse must be an object')
  }

  const r = value as Record<string, unknown>

  const ok = r.ok
  if (!isBoolean(ok)) {
    throw new Error('MarkBatchResponse.ok missing/invalid')
  }

  const results = r.results
  if (!Array.isArray(results)) {
    throw new Error('MarkBatchResponse.results missing')
  }

  for (const itRaw of results as unknown[]) {
    if (!isObject(itRaw)) {
      throw new Error('results[] invalid')
    }
    const it = itRaw as Record<string, unknown>

    // id must be a string
    if (!isString(it.id)) {
      throw new Error('results[].id missing/invalid')
    }

    // response must be an object with typed fields
    if (!isObject(it.response)) {
      throw new Error(`results[${String(it.id)}].response missing/invalid`)
    }
    const resp = it.response as Record<string, unknown>

    if (!isBoolean(resp.ok)) {
      throw new Error(`results[${String(it.id)}].response.ok invalid`)
    }
    if (!isBoolean(resp.correct)) {
      throw new Error(`results[${String(it.id)}].response.correct invalid`)
    }
    if (!isNumber(resp.score)) {
      throw new Error(`results[${String(it.id)}].response.score invalid`)
    }
    if (!isString(resp.feedback)) {
      throw new Error(`results[${String(it.id)}].response.feedback invalid`)
    }
    // expected/expected_str can be string or null; skip strict check here
  }
}

// ---------- public api ----------
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
  const adapted = adaptBatchResponse(raw)
  if (process.env.NODE_ENV !== 'production') assertNormalizedBatch(adapted)
  return adapted
}

// Alias for clarity
export async function listQuestions(): Promise<Question[]> {
  return getQuestions()
}
