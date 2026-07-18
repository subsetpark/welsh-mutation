/**
 * De-mutation: enumerate the candidate radicals of an attested surface form
 * (WORKSTREAM M2). One-to-many by nature — surface fan ⇐ {fan, man, ban} —
 * so this module NEVER decides: it enumerates, and the caller filters
 * candidates through the lexicon (FST-morphology precedent: enumerated
 * candidate sets, not search).
 *
 * The inverse tables are derived programmatically from radical.ts GRADE_MAP
 * (which mirrors the theory layer's SM_ORTH), so forward and inverse cannot
 * drift. Two non-tabular cases: SM's g-deletion means ANY surface admits a
 * 'g'-prepended candidate (welodd ⇐ gwelodd, ardd ⇐ gardd), and h-prothesis
 * (filed under AM, matching M1's forward reading) strips h- before a vowel
 * (hiaith ⇐ iaith).
 *
 * Bogus candidates (e.g. reading nghath's 'ng' as NM-of-g, yielding ghath)
 * are enumerated without prejudice — the lexicon filter kills them; the
 * round-trip property only requires the TRUE radical to be present.
 */

import { GRADE_MAP, VOWEL, type MutationGrade } from './radical.ts'
import { initialSegment } from './initclass.ts'

export interface Candidate {
  radical: string
  /** The observed-mutation hypothesis; null = surface is already radical. */
  grade: MutationGrade | null
}

const GRADES: MutationGrade[] = ['SM', 'AM', 'NM']

/** mutated segment → possible radical segments, per grade (inverted GRADE_MAP,
 *  longest mutated segments first so 'ngh' is tried before 'ng'). */
const INVERSE: Record<MutationGrade, [string, string[]][]> = { SM: [], AM: [], NM: [] }
for (const grade of GRADES) {
  const inv = new Map<string, string[]>()
  for (const [rad, mut] of Object.entries(GRADE_MAP[grade])) {
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

/** Forward application of a grade to a radical form; identity when the
 *  initial has no reflex under that grade. SM agrees with the theory layer's
 *  softMutate (asserted by test); AM on a vowel is h-prothesis. */
export function applyGrade(form: string, grade: MutationGrade): string {
  const lower = form.toLowerCase()
  const seg = initialSegment(form)
  if (grade === 'AM' && VOWEL.test(seg)) return matchCase(form, 'h' + lower)
  const repl = GRADE_MAP[grade][seg]
  if (repl === undefined) return form
  return matchCase(form, repl + lower.slice(seg.length))
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
  if (lower.startsWith('h') && VOWEL.test(lower.slice(1))) {
    push(lower.slice(1), 'AM') // h-prothesis
  }
  return out
}
