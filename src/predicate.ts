import type {
  Environment, Grade, InitClass, Lexeme, RuleId, SMResult, TriggerFrame,
} from './types.ts'
import triggersData from '../data/triggers.json' with { type: 'json' }

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

/** Does `grade`, as governed by a trigger, surface as SM on this initial? */
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

/** P_lex — contact triggers (King §9). Blocking by an intervening word
 *  (King §5d) needs no rule: the intervener simply *is* `prev`. */
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
 *  adjacency-based: handles adjective chains (y ferch fach wen). Full SM —
 *  no ll-/rh- sparing (King §100: profedigaeth °lem). */
function genderPotentials(env: Environment): Potential[] {
  const agr = env.agreement
  if (!agr) return []
  if (agr.controllerGender !== 'f' || agr.controllerNumber !== 'sg') return []
  return [{ rule: 'gend:agr-mod', grade: 'SM' }]
}

/** P_synt — positional mutation (King §11, §10). Unblockable (King §5e). */
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
