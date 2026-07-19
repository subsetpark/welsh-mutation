/**
 * Radical-form recovery for treebank tokens carrying a Mutation feature —
 * IMPLEMENTATION, not theory: the orthographic facts live in
 * theory/orthography.ts; this module only exploits a treebank invariant.
 *
 * This is NOT a general inverse map (that is demutate.ts's one-to-many
 * problem): the treebank hands us the answer's initial — the LEMMA is
 * citation-level and Welsh inflection is suffixal, so the radical form
 * shares the lemma's initial segment. We rewrite that segment forward
 * under the annotated grade and require the mutated FORM to start with the
 * result. Tokens failing the consistency check (suppletive initials,
 * annotation noise) return null and are skipped, never guessed.
 */

import { GRADE_ORTH, VOWEL, initialSegment, type MutationGrade } from '../theory/orthography.ts'

/** Recover the radical surface form of a mutated token, or null if the form
 *  is inconsistent with (lemma initial, grade). Capitalization follows the
 *  mutated form (Gaerdydd → Caerdydd). UD_Welsh-CCG files h-prothesis
 *  (ei hiaith ← iaith) under Mutation=AM; on a vowel initial that is the
 *  reading we take. */
export function recoverRadical(form: string, lemma: string, grade: MutationGrade): string | null {
  const seg = initialSegment(lemma)
  // Widened for lookup: seg is an arbitrary initial segment, and a key
  // absent from the row means no reflex under that grade.
  const orth: Partial<Record<string, string>> = GRADE_ORTH[grade]
  const mutated = grade === 'AM' && VOWEL.test(seg) ? 'h' + seg : orth[seg]
  if (mutated === undefined) return null
  const lower = form.toLowerCase()
  if (!lower.startsWith(mutated)) return null
  // SM of g- is deletion, which makes the startsWith check above vacuous:
  // a still-g-initial surface cannot be the SM of a g-lemma, and prepending
  // g would coin impossible gg- radicals (annotation noise: ggo, ggallaf).
  if (mutated === '' && lower.startsWith('g')) return null
  const radical = seg + lower.slice(mutated.length)
  const wasUpper = form[0] !== undefined && form[0] !== form[0].toLowerCase()
  return wasUpper ? radical[0]!.toUpperCase() + radical.slice(1) : radical
}
