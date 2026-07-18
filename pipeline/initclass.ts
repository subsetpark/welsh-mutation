/**
 * Orthography-derived InitClass for a RADICAL form. Digraph-aware: ll-/rh-
 * are their own classes; ch-/ff-/th-/ph-/ng- are radical digraphs with no SM
 * reflex and must not be misread as c-/f-/t-/p-/g- (WORKSTREAM M1).
 */

import type { InitClass } from '../src/types.ts'

const DIGRAPH_OTHER = ['ch', 'ff', 'th', 'ph', 'ng']
const SINGLES = new Set(['c', 'p', 't', 'g', 'b', 'd', 'm'])

export function initClassOf(form: string): InitClass {
  const f = form.toLowerCase()
  if (f.startsWith('ll')) return 'll'
  if (f.startsWith('rh')) return 'rh'
  if (DIGRAPH_OTHER.some(d => f.startsWith(d))) return 'other'
  const c = f[0]
  return c !== undefined && SINGLES.has(c) ? (c as InitClass) : 'other'
}

/** The mutation-relevant initial segment of a radical form ('ll', 'rh', or
 *  one character) — what the grade maps in radical.ts rewrite. */
export function initialSegment(form: string): string {
  const f = form.toLowerCase()
  if (f.startsWith('ll')) return 'll'
  if (f.startsWith('rh')) return 'rh'
  return f.slice(0, 1)
}
