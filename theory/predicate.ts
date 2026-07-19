/**
 * §5 — THE LICENSING CALCULUS: mutation(Lexeme, Environment) → verdict
 * ====================================================================
 *
 * With the evidence record fixed (§2), the trigger lexicon stated (§3) and the
 * exceptions listed (§4), the predicate itself is small. It works in two
 * phases:
 *
 *   COLLECT.  Each subsystem contributes POTENTIALS — (rule, grade) pairs
 *   whose ENVIRONMENTAL conditions hold, with no attention yet to the
 *   target's initial. Three collectors, one per subsystem: P_lex reads the
 *   trigger lexicon off env.prev; P_gend reads the agreement record;
 *   P_synt reads the XP-edge flag and the position tag.
 *
 *   RESOLVE.  Only then is the target's InitClass consulted: each
 *   potential's governed grade is resolved through the reflex table into
 *   the surface grade it realizes on THIS initial, or into nothing
 *   (SM-ltd has no reflex on ll-/rh-; mixed realizes AM on c/p/t and SM
 *   elsewhere; AM touches the voiceless stops and, as h-prothesis, the
 *   vowels). Everything that resolves has fired; the vetoes then have the
 *   last word.
 *
 * The two-phase split is not an implementation nicety — it is what makes
 * the vetoes COUNTERFACTUAL, and the counterfactual is the interesting
 * part of a negative verdict. Because potentials are collected before
 * resolution, a veto can report exactly which rules it silenced:
 * "i Dafydd: radical, but lex:i would have fired were the name not
 * immutable" is a stronger, more falsifiable claim than "radical".
 * A veto with nothing to block is not reported at all — removing it would
 * change nothing, and a theory should not claim credit for idle machinery.
 *
 * Order among subsystems carries no weight: all fired rules are collected,
 * and a token can be multiply licensed (a fem sg noun after y inside an
 * adverbial, say) — rules resolving to the same surface grade are all
 * reported. Where fired rules resolve to DIFFERENT grades, the more
 * specific wins: NM > AM > SM. The non-soft grades only ever come from
 * contact triggers and mixed — the positional subsystem is SM-only — so
 * precedence encodes "a specific lexical requirement beats the general
 * configurational one". Conflicts are rare; the policy makes them
 * deterministic and reportable.
 */

import type {
  Environment, Grade, InitClass, Lexeme, MutationResult, RuleId, TriggerFrame,
} from './types.ts'
import { GRADE_ORTH, type MutationGrade } from './orthography.ts'
import triggersData from './triggers.json' with { type: 'json' }

// A lemma may carry several frames (y: fem-sg nouns vs. the numerals dau/dwy;
// chwe: AM generally vs. NM on blwydd/blynedd/diwrnod).
const FRAMES = new Map<string, TriggerFrame[]>()
for (const f of triggersData.frames as TriggerFrame[]) {
  const list = FRAMES.get(f.lemma)
  if (list) list.push(f)
  else FRAMES.set(f.lemma, [f])
}

/** One reflex row: each target initial maps to the SURFACE grade it
 *  realizes; an initial absent from the row has no reflex. */
type Reflexes = Partial<Record<InitClass, MutationGrade>>

// §1's GRADE_ORTH is the single statement of the mutation alternations.
// The licensing calculus needs only each map's DOMAIN — which initials
// respond — never the letters, and derives it from there rather than
// restating it. Object.keys erases the row's key union; domainOf reasserts
// it, soundly, because each row is a TOTAL Record over exactly that union
// (§2's target chain) — the compiler, not a test, holds the two statements
// of King §4's table together.
const domainOf = <K extends InitClass>(orth: Record<K, string>): K[] =>
  Object.keys(orth) as K[]
const row = (inits: InitClass[], surface: MutationGrade): Reflexes =>
  Object.fromEntries(inits.map(i => [i, surface]))

/**
 * THE REFLEX TABLE: what each governable grade (§2) does to each initial.
 * A governed grade is a function from initials to surface grades; each row
 * here is that function stated as data, with its domain derived from §1 so
 * the two statements of King §4's table cannot drift apart.
 */
const GRADE_REFLEX: Record<Exclude<Grade, 'none'>, Reflexes> = {
  // King §4, SM column: the nine soft-mutable initials.
  SM: row(domainOf(GRADE_ORTH.SM), 'SM'),
  // King §9 marks y, un, mor, yn.pred 'not ll-, rh-'.
  'SM-ltd': row(domainOf(GRADE_ORTH.SM).filter(i => i !== 'll' && i !== 'rh'), 'SM'),
  // King §10: 'AM where possible (i.e. on c, p and t)', SM otherwise.
  mixed: { ...row(domainOf(GRADE_ORTH.SM), 'SM'), ...row(domainOf(GRADE_ORTH.AM), 'AM') },
  // King §4, AM column — plus the vowels, where AM contexts surface as
  // h-prothesis after ei(f)/ein/eu (King §109; §1 realizes the h-).
  AM: { ...row(domainOf(GRADE_ORTH.AM), 'AM'), v: 'AM' },
  // King §4, NM column: the six stops.
  NM: row(domainOf(GRADE_ORTH.NM), 'NM'),
}

/** Conflict policy: the more specific contact grade beats configurational
 *  soft mutation. See the header for the argument. */
const GRADE_PRECEDENCE: MutationGrade[] = ['NM', 'AM', 'SM']

/** The surface grade a GOVERNED grade realizes on a given initial, or null
 *  when that initial has no reflex under it. */
function gradeReflex(grade: Grade, init: InitClass): MutationGrade | null {
  if (grade === 'none') return null
  return GRADE_REFLEX[grade][init] ?? null
}

/** A frame's target-side conditions (§2: category, gender, number, or a
 *  closed lexeme list) — all must hold for the frame to apply. */
function frameApplies(frame: TriggerFrame, lexeme: Lexeme): boolean {
  if (frame.targetCat && !frame.targetCat.includes(lexeme.cat)) return false
  if (frame.targetGender && lexeme.gender !== frame.targetGender) return false
  if (frame.targetNumber && lexeme.number !== frame.targetNumber) return false
  if (frame.targetLexemes && !frame.targetLexemes.includes(lexeme.id)) return false
  return true
}

/** A rule whose ENVIRONMENTAL conditions hold, before any initial-class
 *  filtering. `grade` is the mutation the rule would impose; whether that
 *  surfaces as SM on this word is the caller's question. */
interface Potential {
  rule: RuleId
  grade: Grade
}

/** P_lex — contact triggers (King §9). The frame must exist for the
 *  preceding lemma AND the relation must be 'dependent' — which is where
 *  possessor immunity (§2) does its quiet work. Blocking by an intervening
 *  word (King §5d) needs no rule at all: the intervener simply IS `prev`,
 *  and the trigger it displaced is no longer visible evidence. */
function lexicalPotentials(lexeme: Lexeme, env: Environment): Potential[] {
  const prev = env.prev
  if (!prev || prev.relationToTarget !== 'dependent') return []
  const out: Potential[] = []
  for (const frame of FRAMES.get(prev.lemma) ?? []) {
    if (!frameApplies(frame, lexeme)) continue
    out.push({ rule: frame.ruleId ?? (`lex:${frame.lemma}` as RuleId), grade: frame.grade })
  }
  return out
}

/** P_gend — modifier agreeing with a fem sg controller (King §102:
 *  adjectives after a feminine singular noun take SM). Deliberately not
 *  adjacency-based: the agreement record was resolved upstream precisely
 *  because chains break adjacency (y ferch fach wen — wen agrees with
 *  ferch across fach). Full SM, no ll-/rh- sparing: King §100 mutates ll-
 *  adjectives after feminine nouns (profedigaeth °lem) even though the
 *  ARTICLE'S own frame spares them. The asymmetry is the datum. */
function genderPotentials(env: Environment): Potential[] {
  const agr = env.agreement
  if (!agr) return []
  if (agr.controllerGender !== 'f' || agr.controllerNumber !== 'sg') return []
  return [{ rule: 'gend:agr-mod', grade: 'SM' }]
}

/** P_synt — the syntactic residue (§6 explains where these flags come
 *  from; King §11, §10). Unblockable in King's terms (§5e) — but note
 *  that unblockability needs no stipulation here: these licenses read the
 *  position tag and the XP-edge flag, not the identity of `prev`, so no
 *  intervening word can starve them of their evidence. */
function syntacticPotentials(env: Environment): Potential[] {
  const out: Potential[] = []
  // XPTH (Harlow 1989; Borsley 1997; Tallerman 2006; Green 2003 for the
  // intervening-phrase datum). King states the descriptive counterparts:
  // the [SUBJECT]° rule (§11a, §14) and the 'intrusive word' rule (§11e).
  if (env.prev?.isXPRightEdge) out.push({ rule: 'synt:xp-edge', grade: 'SM' })
  switch (env.position) {
    // King §11b, §403 (SM of time adverbs)
    case 'adv-np':
      out.push({ rule: 'synt:adv-np', grade: 'SM' })
      break
    // King §11c
    case 'vocative':
      out.push({ rule: 'synt:vocative', grade: 'SM' })
      break
    // King §11d
    case 'v1-finite-aff':
      out.push({ rule: 'synt:v1-aff', grade: 'SM' })
      break
    // King §10 (mixed mutation on NEG inflected verbs)
    case 'v1-finite-neg':
      out.push({ rule: 'synt:v1-neg-mixed', grade: 'mixed' })
      break
    case null:
      break
    default: {
      const _exhaustive: never = env.position
      return _exhaustive
    }
  }
  return out
}

/**
 * THE PREDICATE. Answers: which grade, if any, does the environment
 * impose here? Each fired rule's governed grade is resolved against the
 * target's initial into a surface grade (fy + cath ⇒ NM; ei(f) + cath ⇒
 * AM; ei(f) + iaith ⇒ AM realized as h-prothesis on the vowel class;
 * ni + collith ⇒ mixed's AM half); grade conflicts are arbitrated by
 * GRADE_PRECEDENCE (see the header).
 *
 * Both vetoes report counterfactually — they name the rules they
 * silenced, and an idle veto (nothing to block) reports plain no-license.
 * veto:no-reflex covers any governed grade: an AM frame over a g-initial
 * word is a fired rule whose grade has no shape on this initial, exactly
 * as an SM-ltd frame over ll- is.
 */
export function mutation(lexeme: Lexeme, env: Environment): MutationResult {
  const potentials = [
    ...lexicalPotentials(lexeme, env),
    ...genderPotentials(env),
    ...syntacticPotentials(env),
  ]

  const resolved: { rule: RuleId; surface: MutationGrade }[] = []
  for (const p of potentials) {
    const surface = gradeReflex(p.grade, lexeme.initClass)
    if (surface !== null) resolved.push({ rule: p.rule, surface })
  }

  if (resolved.length > 0) {
    if (lexeme.immutable) {
      return { grade: 'none', reason: 'veto:immutable', suppressed: resolved.map(r => r.rule) }
    }
    const winner = GRADE_PRECEDENCE.find(g => resolved.some(r => r.surface === g))!
    return { grade: winner, licensedBy: resolved.filter(r => r.surface === winner).map(r => r.rule) }
  }

  const wouldFire = potentials.filter(p => p.grade !== 'none').map(p => p.rule)
  if (wouldFire.length > 0) {
    return { grade: 'none', reason: 'veto:no-reflex', suppressed: wouldFire }
  }
  return { grade: 'none', reason: 'no-license' }
}

/** Full-grade agreement: the verdict names a surface grade (or 'none'),
 *  and confirmation is grade equality — ei cath 'her cat' left unmutated
 *  is a detectable miss (grade AM predicted, radical observed). Colloquial
 *  AM-erosion contexts disagree often; theory/contested.json absorbs
 *  them. */
export function agreesWithObservedGrade(
  result: MutationResult,
  observed: MutationGrade | null,
): boolean {
  return result.grade === (observed ?? 'none')
}
