/**
 * Radical-form recovery for treebank tokens carrying a Mutation feature.
 *
 * This is NOT a general inverse map (that is M2's one-to-many problem): here
 * the treebank hands us the answer's initial — the LEMMA is citation-level
 * and Welsh inflection is suffixal, so the radical form shares the lemma's
 * initial segment. We rewrite that segment forward under the annotated grade
 * and require the mutated FORM to start with the result; the radical form is
 * then lemma-initial + remainder. Tokens failing the consistency check
 * (suppletive initials, annotation noise) return null and are skipped.
 */

import { initialSegment } from './initclass.ts'

export type MutationGrade = 'SM' | 'AM' | 'NM'

/** Forward per-grade rewrites of a radical initial segment (King §4, §8, §7).
 *  SM mirrors src/mutate.ts SM_ORTH; AM/NM cover only their target initials. */
const GRADE_MAP: Record<MutationGrade, Record<string, string>> = {
  SM: { c: 'g', p: 'b', t: 'd', g: '', b: 'f', d: 'dd', ll: 'l', m: 'f', rh: 'r' },
  AM: { c: 'ch', p: 'ph', t: 'th' },
  NM: { c: 'ngh', p: 'mh', t: 'nh', g: 'ng', b: 'm', d: 'n' },
}

const VOWEL = /^[aeiouwyâêîôûŵŷáéíóúàèìòù]/

/** Recover the radical surface form of a mutated token, or null if the form
 *  is inconsistent with (lemma initial, grade). Capitalization follows the
 *  mutated form (Gaerdydd → Caerdydd). UD_Welsh-CCG files h-prothesis
 *  (ei hiaith ← iaith) under Mutation=AM; on a vowel initial that is the
 *  reading we take. */
export function recoverRadical(form: string, lemma: string, grade: MutationGrade): string | null {
  const seg = initialSegment(lemma)
  const mutated = grade === 'AM' && VOWEL.test(seg) ? 'h' + seg : GRADE_MAP[grade][seg]
  if (mutated === undefined) return null
  const lower = form.toLowerCase()
  if (!lower.startsWith(mutated)) return null
  const radical = seg + lower.slice(mutated.length)
  const wasUpper = form[0] !== undefined && form[0] !== form[0].toLowerCase()
  return wasUpper ? radical[0]!.toUpperCase() + radical.slice(1) : radical
}
