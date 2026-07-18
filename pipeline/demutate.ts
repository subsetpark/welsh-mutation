/**
 * De-mutation: enumerate the candidate radicals of an attested surface form
 * — IMPLEMENTATION of the inverse direction. One-to-many by nature —
 * surface fan ⇐ {fan, man, ban} — so this module NEVER decides: it
 * enumerates, and the caller filters candidates through the lexicon
 * (FST-morphology precedent: enumerated candidate sets, not search).
 *
 * Every orthographic fact here is DERIVED from theory/orthography.ts
 * GRADE_ORTH — forward and inverse cannot drift. Two non-tabular cases
 * follow from the same source: SM's g-deletion means ANY surface admits a
 * 'g'-prepended candidate (welodd ⇐ gwelodd, ardd ⇐ gardd), and
 * h-prothesis strips h- before a vowel (hiaith ⇐ iaith), under the same
 * ≥2-letter-radical condition applyGrade imposes, so the round-trip
 * property demutate(applyGrade(w, g)) ∋ w is exact.
 *
 * Bogus candidates (e.g. reading nghath's 'ng' as NM-of-g, yielding ghath)
 * are enumerated without prejudice — the lexicon filter kills them.
 */

import { GRADE_ORTH, VOWEL, initialSegment, type MutationGrade } from '../theory/orthography.ts'

export interface Candidate {
  radical: string
  /** The observed-mutation hypothesis; null = surface is already radical. */
  grade: MutationGrade | null
}

const GRADES: MutationGrade[] = ['SM', 'AM', 'NM']

/** mutated segment → possible radical segments, per grade (inverted
 *  GRADE_ORTH, longest mutated segments first so 'ngh' precedes 'ng'). */
const INVERSE: Record<MutationGrade, [string, string[]][]> = { SM: [], AM: [], NM: [] }
for (const grade of GRADES) {
  const inv = new Map<string, string[]>()
  for (const [rad, mut] of Object.entries(GRADE_ORTH[grade])) {
    const list = inv.get(mut) ?? []
    list.push(rad)
    inv.set(mut, list)
  }
  INVERSE[grade] = [...inv.entries()].sort((a, b) => b[0].length - a[0].length)
}

function matchCase(model: string, out: string): string {
  const wasUpper = model[0] !== undefined && model[0] !== model[0].toLowerCase()
  if (!wasUpper || out.length === 0) return out
  return out[0]!.toUpperCase() + out.slice(1)
}

/** All candidate (radical, grade) readings of a surface form, unfiltered.
 *  The identity candidate comes first; duplicates are collapsed. */
export function demutate(surface: string): Candidate[] {
  const lower = surface.toLowerCase()
  const out: Candidate[] = [{ radical: surface, grade: null }]
  const seen = new Set<string>([`${lower}|`])

  const push = (radicalLower: string, grade: MutationGrade) => {
    const key = `${radicalLower}|${grade}`
    if (seen.has(key)) return
    seen.add(key)
    out.push({ radical: matchCase(surface, radicalLower), grade })
  }

  for (const grade of GRADES) {
    for (const [mut, rads] of INVERSE[grade]) {
      if (mut === '') {
        push('g' + lower, grade) // SM g-deletion: any surface
        continue
      }
      if (!lower.startsWith(mut)) continue
      for (const rad of rads) push(rad + lower.slice(mut.length), grade)
    }
  }
  if (lower.startsWith('h') && VOWEL.test(lower.slice(1)) && lower.length >= 3) {
    push(lower.slice(1), 'AM') // h-prothesis (radical ≥2 letters, see theory)
  }
  return out
}

