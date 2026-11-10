import { episodes, episodeThumb, studios, titles, upcoming, type Studio, type Title } from './catalog'

/* Catalog search: titles, episodes and studios. Accent- and case-insensitive ("ijogbon" finds
   Ìjọ̀gbọ̀n), word-prefix matching, and one typo allowed on longer words. Ranked: title starts
   with the query, then a title word does, then studio / genre, then the description. */

export type Hit =
  | { kind: 'title'; t: Title; score: number }
  | { kind: 'episode'; t: Title; n: number; name: string; thumb: string; score: number }
  | { kind: 'studio'; s: Studio; count: number; score: number }

export const norm = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const words = (s: string) => norm(s).split(' ').filter(Boolean)

// Levenshtein distance capped at 2 (enough to allow one slip).
function close(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    prev = cur
  }
  return prev[b.length] <= 1
}

/* How well one query word matches a field's words: 3 exact/prefix, 2 inside a word, 1 typo. */
function wordScore(q: string, field: string[]) {
  let best = 0
  for (const w of field) {
    if (w.startsWith(q)) return 3
    // Matching inside a word only once the query is long enough to mean something.
    if (q.length >= 3 && w.includes(q)) best = Math.max(best, 2)
    else if (q.length >= 4 && close(q, w.slice(0, q.length + 1)) ) best = Math.max(best, 1)
  }
  return best
}

function scoreTitle(q: string, qWords: string[], t: Title) {
  const name = norm(t.name)
  if (name === q) return 100
  if (name.startsWith(q)) return 90
  const studio = studios[t.studioId]?.name ?? ''
  const fields = { name: words(t.name), meta: words(`${t.genre} ${studio} ${t.year} ${t.kind === 'series' ? 'series' : 'show film movie'} ${t.origin === 'ng' ? 'nollywood nigerian' : ''}`), blurb: words(t.blurb) }
  let total = 0
  for (const w of qWords) {
    const n = wordScore(w, fields.name)
    const m = wordScore(w, fields.meta)
    const b = wordScore(w, fields.blurb)
    if (!n && !m && !b) return 0 // every query word has to match something
    total += n * 10 + m * 6 + b * 2
  }
  return total
}

export function search(raw: string): Hit[] {
  const q = norm(raw)
  if (!q) return []
  const qWords = q.split(' ')
  const hits: Hit[] = []

  for (const t of Object.values(titles)) {
    const score = scoreTitle(q, qWords, t)
    if (score) hits.push({ kind: 'title', t, score })
  }

  for (const [id, eps] of Object.entries(episodes)) {
    const t = titles[id]
    eps.forEach((e, i) => {
      const name = norm(e.title)
      const score = name.startsWith(q) ? 80 : qWords.every((w) => wordScore(w, words(e.title)) >= 2) ? 50 : 0
      if (score) hits.push({ kind: 'episode', t, n: i + 1, name: e.title, thumb: episodeThumb(e.videoId), score })
    })
  }

  for (const s of Object.values(studios)) {
    const score = norm(s.name).startsWith(q) ? 85 : qWords.every((w) => wordScore(w, words(s.name)) >= 2) ? 60 : 0
    if (score) hits.push({ kind: 'studio', s, count: Object.values(titles).filter((t) => t.studioId === s.id).length, score })
  }

  return hits.sort((a, b) => b.score - a.score)
}

/* Nothing found: the closest title name, for "Did you mean". */
export function didYouMean(raw: string) {
  const q = norm(raw)
  if (q.length < 3) return null
  let best: { t: Title; d: number } | null = null
  for (const t of Object.values(titles)) {
    const n = norm(t.name)
    for (const cand of [n, ...n.split(' ')]) {
      const d = distance(q, cand.slice(0, q.length + 2))
      if (d <= Math.max(2, Math.floor(q.length / 3)) && (!best || d < best.d)) best = { t, d }
    }
  }
  return best?.t ?? null
}

function distance(a: string, b: string) {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    prev = cur
  }
  return prev[b.length]
}

export const isUpcoming = (id: string) => upcoming(id)
