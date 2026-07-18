/**
 * §1 — THE PHENOMENON: initial-consonant mutation and its orthography
 * ====================================================================
 *
 * Welsh words change their FIRST consonant under grammatical pressure.
 * One lexeme, cath 'cat', surfaces in four shapes depending on what stands
 * to its left:
 *
 *     y gath    'the cat'      (soft mutation:     c → g)
 *     ei chath  'her cat'      (aspirate mutation: c → ch)
 *     fy nghath 'my cat'       (nasal mutation:    c → ngh)
 *     cath      'cat'          (the RADICAL — citation shape)
 *
 * The alternation carries no meaning of its own; it is an exponent of the
 * LEFT CONTEXT, spelled on the following word. Which context selects which
 * grade is the business of the whole rest of this theory (§§2–6). This
 * chapter states only the surface facts: what each grade looks like, and
 * which initials participate at all.
 *
 * Three grades, one asymmetry. Soft mutation (SM, the traditional
 * 'lenition') touches nine initials; aspirate (AM, 'spirantization') only
 * the voiceless stops c/p/t; nasal (NM) six. Because SM has by far the
 * widest domain and the most intricate grammar, the predictive account in
 * this directory is SM-only in its public verdicts — but the orthography
 * of all three grades is stated here, once, because AM/NM shapes appear in
 * attested text and anything reading or writing Welsh must know them.
 * (King §4 soft, §7 nasal, §8 aspirate; §5a for the participating
 * initials.)
 *
 * Two orthographic subtleties recur everywhere downstream:
 *
 * - Welsh spelling has DIGRAPHS that are single consonants: ll and rh
 *   mutate (as units); ch, ff, th, ph, ng are radical consonants in their
 *   own right and never mutate. So chwech 'six' is NOT c-initial and
 *   ffenest 'window' is NOT f-initial — misreading digraphs corrupts every
 *   judgment that follows.
 *
 * - The SM row is not injective: both b- and m- soften to f-, and g-
 *   softens to NOTHING (gardd 'garden' → ardd). Reading mutation off a page
 *   therefore runs one-to-many in reverse — surface fan may be radical fan
 *   'van', softened man 'place', or softened ban 'peak' — which is exactly
 *   why the predictive direction (radical → surface) is the primitive here
 *   and any inverse must be a derived, candidate-generating operation.
 *
 * One rider: H-PROTHESIS. A few triggers (ei 'her', ein 'our', eu 'their')
 * prefix h- to a following vowel (ei hiaith 'her language' ← iaith). It is
 * not one of the three grades, but it patterns with aspirate-mutation
 * contexts, so this account files it as AM's reflex on vowels. It demands
 * a radical of at least two letters: the single-vowel words (i, o, y) are
 * function words that are never possessed, and *"ei hi" is not Welsh.
 *
 * This file is the SINGLE statement of these facts. The surface renderer
 * (§8) reads SM forward from here; the processing pipeline outside this
 * directory derives its de-mutation candidate maps from GRADE_ORTH rather
 * than stating inverses of its own. The predicate (§5) never consults this
 * file at all — deciding WHETHER a word mutates requires only the
 * equivalence class of its initial (InitClass, §2), never the letters.
 */

import type { InitClass } from './types.ts'

/** The three surface mutation grades. The richer vocabulary a trigger may
 *  govern (SM-ltd, mixed — §2) consists of restrictions over these three,
 *  not additional orthographies. */
export type MutationGrade = 'SM' | 'AM' | 'NM'

export const VOWEL = /^[aeiouwyâêîôûŵŷáéíóúàèìòù]/

/** Radical initial segment → its written form under each grade. SM's g-row
 *  is deletion (gardd → ardd); every segment absent from a grade's row has
 *  no reflex under that grade — AM touches only the voiceless stops, NM
 *  only the stops. Note the SM collisions (b→f, m→f) discussed above. */
export const GRADE_ORTH: Record<MutationGrade, Record<string, string>> = {
  SM: { c: 'g', p: 'b', t: 'd', g: '', b: 'f', d: 'dd', ll: 'l', m: 'f', rh: 'r' },
  AM: { c: 'ch', p: 'ph', t: 'th' },
  NM: { c: 'ngh', p: 'mh', t: 'nh', g: 'ng', b: 'm', d: 'n' },
}

/** The mutation-relevant initial segment of a radical form: 'll', 'rh', or
 *  a single character. (The digraphs that mutate; all others are handled
 *  one letter at a time by the tables above.) */
export function initialSegment(form: string): string {
  const f = form.toLowerCase()
  if (f.startsWith('ll')) return 'll'
  if (f.startsWith('rh')) return 'rh'
  return f.slice(0, 1)
}

/** Digraphs that are radical consonants in their own right — never misread
 *  as their first letter (chwech is not c-initial), and without SM reflex. */
const RADICAL_DIGRAPHS = ['ch', 'ff', 'th', 'ph', 'ng']
const MUTABLE_SINGLES = new Set(['c', 'p', 't', 'g', 'b', 'd', 'm'])

/** Orthography-derived InitClass of a RADICAL form (King §5a): the
 *  equivalence class that is ALL the predicate ever needs to know about a
 *  word's shape. Vowels, s-, n-, h-, f-, j- and the radical digraphs all
 *  fall together as 'other' — no SM reflex, no distinction worth drawing. */
export function initClassOf(form: string): InitClass {
  const f = form.toLowerCase()
  if (f.startsWith('ll')) return 'll'
  if (f.startsWith('rh')) return 'rh'
  if (RADICAL_DIGRAPHS.some(d => f.startsWith(d))) return 'other'
  if (VOWEL.test(f)) return 'v' // prothesis target under AM contexts
  const c = f[0]
  return c !== undefined && MUTABLE_SINGLES.has(c) ? (c as InitClass) : 'other'
}

/** Mutation rewrites the initial and leaves capitalization where it found
 *  it: Caerdydd → Gaerdydd, and across g-deletion Gwelodd → Welodd. */
function matchCase(model: string, out: string): string {
  const wasUpper = model[0] !== undefined && model[0] !== model[0].toLowerCase()
  if (!wasUpper || out.length === 0) return out
  return out[0]!.toUpperCase() + out.slice(1)
}

/** Forward application of a grade to a radical form; identity when the
 *  initial has no reflex under that grade (applying AM to gardd changes
 *  nothing — there is no such mutation to apply). */
export function applyGrade(form: string, grade: MutationGrade): string {
  const lower = form.toLowerCase()
  const seg = initialSegment(form)
  if (grade === 'AM' && VOWEL.test(seg) && lower.length >= 2) {
    return matchCase(form, 'h' + lower) // h-prothesis
  }
  const repl = GRADE_ORTH[grade][seg]
  if (repl === undefined) return form
  return matchCase(form, repl + lower.slice(seg.length))
}

/** Soft mutation keyed by the Lexeme's InitClass — the form the surface
 *  renderer (§8) writes when the predicate fires. Equivalent to
 *  applyGrade(form, 'SM') whenever the class matches the orthography; kept
 *  class-keyed because a Lexeme carries its class, not its letters. */
export function softMutate(form: string, initClass: InitClass): string {
  const repl = GRADE_ORTH.SM[initClass]
  if (repl === undefined) return form // 'v' and 'other': no soft reflex
  return matchCase(form, repl + form.slice(initClass.length))
}
