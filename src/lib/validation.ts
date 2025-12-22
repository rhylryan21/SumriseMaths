// src/lib/validation.ts

export type ValidationResult = { ok: true; value: string } | { ok: false; error: string }

const ALLOWED = /^[0-9+\-*/^().\s]{1,100}$/
const LEN_LIMIT = 100

export function validateAnswer(input: string): ValidationResult {
  if (!input) return { ok: false, error: 'Answer required' }
  if (input.length > LEN_LIMIT) return { ok: false, error: `Answer too long (> ${LEN_LIMIT})` }
  if (!ALLOWED.test(input)) {
    return { ok: false, error: 'Only digits, + - * / ^ ( ) . and spaces allowed (max 100 chars).' }
  }
  return { ok: true, value: input.trim() }
}
