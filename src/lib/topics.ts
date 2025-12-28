// src/lib/topics.ts
const MINOR_WORDS = new Set([
  'and',
  'or',
  'of',
  'the',
  'a',
  'an',
  'to',
  'in',
  'on',
  'for',
  'with',
  'by',
])

/** Optional explicit overrides for specific topic slugs */
export const TOPIC_LABELS: Record<string, string> = {
  'order-of-operations': 'Order of Operations',
  // add more overrides here as you add topics
}

export function topicLabel(slug?: string | null): string {
  if (!slug) return 'All topics'
  const override = TOPIC_LABELS[slug]
  if (override) return override

  const words = slug.replace(/[-_]+/g, ' ').trim().toLowerCase().split(/\s+/)
  return words
    .map((w, i) => (i > 0 && MINOR_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

export function toTopicOptions(slugs: string[]) {
  return slugs
    .map((s) => ({ value: s, label: topicLabel(s) }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
