/**
 * Welsh tokenizer (WORKSTREAM M2): punctuation split, clitic splitting with
 * lemma assignment, and multiword-trigger grouping.
 *
 * Clitics keep their leading apostrophe — the exact inverse of the surface
 * renderer's join rule (src/surface.ts: a form beginning with an apostrophe
 * attaches left). Splitting happens ONLY on a table match; other internal
 * apostrophes (o'dd) leave the token whole.
 *
 * MWE grouping is driven by the multiword lemmas already present in
 * data/triggers.json — never a second hand-kept list (M2 DoD).
 */

import triggersData from '../data/triggers.json' with { type: 'json' }

export type RawKind = 'word' | 'clitic' | 'punct'

export interface RawToken {
  surface: string
  kind: RawKind
  /** Clitic expansion ('r → y) or multiword-trigger lemma (ar ôl). */
  lemma?: string
}

/** Clitic → lemma. The DoD five ('r 'n 'w 'm 'th) plus 'i 'u 'ch, which ride
 *  the same mechanism. Ambiguous hosts ('m as fy vs object-me) get their
 *  PRIMARY lemma here; refinement is the M3 tagger's job. */
const CLITICS: Record<string, string> = {
  "'r": 'y', "'n": 'yn', "'w": 'ei', "'m": 'fy', "'th": 'dy',
  "'i": 'ei', "'u": 'eu', "'ch": 'eich',
}
const CLITIC_SUFFIXES = Object.keys(CLITICS).sort((a, b) => b.length - a.length)

/** Multiword trigger lemmas from the trigger lexicon, longest first. */
const MWES: string[][] = [...new Set(
  (triggersData.frames as { lemma: string }[])
    .map(f => f.lemma)
    .filter(l => l.includes(' ')),
)].map(l => l.split(' ')).sort((a, b) => b.length - a.length)

const CHUNK = /[\p{L}\p{M}\p{N}'-]+|[^\s]/gu

function splitClitic(chunk: string): RawToken[] {
  for (const suffix of CLITIC_SUFFIXES) {
    if (!chunk.toLowerCase().endsWith(suffix)) continue
    const host = chunk.slice(0, chunk.length - suffix.length)
    const clitic: RawToken = {
      surface: chunk.slice(chunk.length - suffix.length),
      kind: 'clitic',
      lemma: CLITICS[suffix]!,
    }
    return host === '' ? [clitic] : [...splitClitic(host), clitic]
  }
  return [{ surface: chunk, kind: 'word' }]
}

function groupMwes(tokens: RawToken[]): RawToken[] {
  const out: RawToken[] = []
  let i = 0
  outer: while (i < tokens.length) {
    for (const words of MWES) {
      if (i + words.length > tokens.length) continue
      const slice = tokens.slice(i, i + words.length)
      const matches = slice.every(
        (t, j) => t.kind === 'word' && t.lemma === undefined && t.surface.toLowerCase() === words[j],
      )
      if (matches) {
        out.push({
          surface: slice.map(t => t.surface).join(' '),
          kind: 'word',
          lemma: words.join(' '),
        })
        i += words.length
        continue outer
      }
    }
    out.push(tokens[i]!)
    i++
  }
  return out
}

export function tokenize(text: string): RawToken[] {
  const normalized = text.replace(/’/g, "'")
  const tokens: RawToken[] = []
  for (const chunk of normalized.match(CHUNK) ?? []) {
    if (/[\p{L}\p{M}\p{N}]/u.test(chunk)) tokens.push(...splitClitic(chunk))
    else tokens.push({ surface: chunk, kind: 'punct' })
  }
  return groupMwes(tokens)
}
