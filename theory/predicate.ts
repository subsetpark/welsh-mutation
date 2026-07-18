/**
 * §5 — THE LICENSING CALCULUS: sm(Lexeme, Environment) → verdict
 * ==============================================================
 *
 * With the evidence record fixed (§2), the trigger lexicon stated (§3) and
 * the exceptions listed (§4), the predicate itself is small — deliberately
 * so. It works in two phases:
 *
 *   COLLECT.  Each subsystem contributes POTENTIALS — (rule, grade) pairs
 *   whose ENVIRONMENTAL conditions hold, with no attention yet to the
 *   target's initial. Three collectors, one per subsystem: P_lex reads the
 *   trigger lexicon off env.prev; P_gend reads the agreement record;
 *   P_synt reads the XP-edge flag and the position tag.
 *
 *   FILTER.  Only then is the target's InitClass consulted: does each
 *   potential's grade actually surface as soft mutation on THIS initial?
 *   (SM-ltd spares ll/rh; mixed yields SM only off c/p/t; AM/NM never
 *   yield SM.) Everything that survives has fired; the vetoes then have
 *   the last word.
 *
 * The two-phase split is not an implementation nicety — it is what makes
 * the vetoes COUNTERFACTUAL, and the counterfactual is the interesting
 * part of a negative verdict. Because potentials are collected before
 * filtering, a veto can report exactly which rules it silenced:
 * "i Dafydd: radical, but lex:i would have fired were the name not
 * immutable" is a stronger, more falsifiable claim than "radical".
 * A veto with nothing to block is not reported at all — removing it would
 * change nothing, and a theory should not claim credit for idle machinery.
 *
 * Order among subsystems carries no weight: all fired rules are collected
 * (a token can be multiply licensed — a fem sg noun after y inside an
 * adverbial, say), and any unvetoed license mutates. There is no rule
 * competition to arbitrate because all roads lead to the same exponent.
 */

import type {
  Environment, Grade, InitClass, Lexeme, RuleId, SMResult, TriggerFrame,
} from './types.ts'
import type { MutationGrade } from './orthography.ts'
import triggersData from './triggers.json' with { type: 'json' }

// A lemma may carry several frames (y: fem-sg nouns vs. the numerals dau/dwy;
// chwe: AM generally vs. NM on blwydd/blynedd/diwrnod).
const FRAMES = new Map<string, TriggerFrame[]>()
for (const f of triggersData.frames as TriggerFrame[]) {
  const list = FRAMES.get(f.lemma)
  if (list) list.push(f)
  else FRAMES.set(f.lemma, [f])
}

const SM_TARGETS = new Set<InitClass>(['c', 'p', 't', 'g', 'b', 'd', 'll', 'm', 'rh'])
const SM_LTD_EXCLUDED = new Set<InitClass>(['ll', 'rh'])
const MIXED_SM = new Set<InitClass>(['g', 'b', 'd', 'll', 'm', 'rh']) // AM claims c/p/t (King §10)
/** Grades with an SM reflex for at least one initial — the counterfactual
 *  test for a no-reflex word: would this rule fire on any mutable initial? */
const SM_YIELDING = new Set<Grade>(['SM', 'SM-ltd', 'mixed'])

/** The grade → SM-reflex logic (§2 motivated the six-way vocabulary):
 *  does `grade`, as governed by a trigger, surface as SM on this initial? */
function gradeYieldsSM(grade: Grade, init: InitClass): boolean {
  switch (grade) {
    case 'SM': return SM_TARGETS.has(init)
    case 'SM-ltd': return SM_TARGETS.has(init) && !SM_LTD_EXCLUDED.has(init)
    case 'mixed': return MIXED_SM.has(init)
    case 'AM':
    case 'NM':
    case 'none': return false
    default: {
      const _exhaustive: never = grade
      return _exhaustive
    }
  }
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

/** P_gend — modifier agreeing with a fem sg controller. Deliberately not
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
  if (env.prev?.isXPRightEdge) out.push({ rule: 'synt:xp-edge', grade: 'SM' })
  switch (env.position) {
    case 'adv-np':
      out.push({ rule: 'synt:adv-np', grade: 'SM' })
      break
    case 'vocative':
      out.push({ rule: 'synt:vocative', grade: 'SM' })
      break
    case 'v1-finite-aff':
      out.push({ rule: 'synt:v1-aff', grade: 'SM' })
      break
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

export function sm(lexeme: Lexeme, env: Environment): SMResult {
  // Potentials are environmental only; the initial-class filter is applied
  // here, so BOTH vetoes report counterfactually: they name the rules that
  // would otherwise fire, and an idle veto (nothing to block) reports plain
  // no-license, because removing it would change nothing.
  const potentials = [
    ...lexicalPotentials(lexeme, env),
    ...genderPotentials(env),
    ...syntacticPotentials(env),
  ]

  const fired = potentials
    .filter(p => gradeYieldsSM(p.grade, lexeme.initClass))
    .map(p => p.rule)
  if (fired.length > 0) {
    return lexeme.immutable
      ? { mutates: false, reason: 'veto:immutable', suppressed: fired }
      : { mutates: true, licensedBy: fired }
  }

  if (!SM_TARGETS.has(lexeme.initClass)) {
    // Would any present rule fire on SOME mutable initial? (AM/NM frames
    // would not — a vowel word after ei 'her' is no-license, not no-reflex.)
    const wouldFire = potentials.filter(p => SM_YIELDING.has(p.grade)).map(p => p.rule)
    if (wouldFire.length > 0) {
      return { mutates: false, reason: 'veto:no-reflex', suppressed: wouldFire }
    }
  }
  return { mutates: false, reason: 'no-license' }
}

/** What counts as AGREEMENT between a verdict and an OBSERVED surface
 *  grade — part of this predicate's contract, because the account is
 *  SM-only by charter: a mutating verdict is confirmed only by observed
 *  SM, while a non-mutating verdict is consistent with radical, AM and NM
 *  alike — all three mean "soft mutation did not apply". Whether an
 *  observed AM/NM was itself correct is the trigger lexicon's business,
 *  outside this predicate's scope; conflating "predicted no SM" with
 *  "predicted radical" would count every ei chath as a failure. */
export function agreesWithObserved(result: SMResult, observed: MutationGrade | null): boolean {
  return result.mutates ? observed === 'SM' : observed !== 'SM'
}
