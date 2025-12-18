// src/lib/constants.ts
export const ANSWER_LEN_LIMIT = 100

// Build the regex using the limit above so it never diverges.
export const ANSWER_ALLOWED_RE = new RegExp(`^[0-9+\\-*/^().\\s]{1,${ANSWER_LEN_LIMIT}}$`)
