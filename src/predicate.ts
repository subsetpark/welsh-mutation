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

/** P_lex — contact triggers (King §9). Blocking by an intervening word
 *  (King §5d) needs no rule: the intervener simply *is* `prev`. */
function lexicalLicense(lexeme: Lexeme, env: Environment): RuleId | null {
  const prev = env.prev
  if (!prev || prev.relationToTarget !== 'dependent') return null
  for (const frame of FRAMES.get(prev.lemma) ?? []) {
    if (!frameApplies(frame, lexeme)) continue
    if (!gradeYieldsSM(frame.grade, lexeme.initClass)) continue
    return frame.ruleId ?? (`lex:${frame.lemma}` as RuleId)
  }
  return null
}

/** P_gend — modifier agreeing with a fem sg controller. Deliberately not
 *  adjacency-based: handles adjective chains (y ferch fach wen). */
function genderLicense(lexeme: Lexeme, env: Environment): RuleId | null {
  const agr = env.agreement
  if (!agr) return null
  if (agr.controllerGender !== 'f' || agr.controllerNumber !== 'sg') return null
  if (!SM_TARGETS.has(lexeme.initClass)) return null
  return 'gend:agr-mod'
}

/** P_synt — positional mutation (King §11, §10). Unblockable (King §5e). */
function syntacticLicenses(lexeme: Lexeme, env: Environment): RuleId[] {
  const out: RuleId[] = []
  if (env.prev?.isXPRightEdge && SM_TARGETS.has(lexeme.initClass)) {
    out.push('synt:xp-edge')
  }
  switch (env.position) {
    case 'adv-np':
      if (SM_TARGETS.has(lexeme.initClass)) out.push('synt:adv-np')
      break
    case 'vocative':
      if (SM_TARGETS.has(lexeme.initClass)) out.push('synt:vocative')
      break
    case 'v1-finite-aff':
      if (SM_TARGETS.has(lexeme.initClass)) out.push('synt:v1-aff')
      break
    case 'v1-finite-neg':
      if (gradeYieldsSM('mixed', lexeme.initClass)) out.push('synt:v1-neg-mixed')
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
  // Licenses are computed BEFORE the immutability veto so a suppressed
  // license is reportable ('i Dafydd' resists a live lex:i) and an idle veto
  // is distinguishable from a working one ('dy' utterance-initial has nothing
  // to veto; removing the flag would change nothing → plain no-license).
  // The grade/initClass checks inside the licensers make licenses inherently
  // empty for no-reflex initials, so that veto stays a plain fact.
  const licensedBy: RuleId[] = []
  const lex = lexicalLicense(lexeme, env)
  if (lex) licensedBy.push(lex)
  const gend = genderLicense(lexeme, env)
  if (gend) licensedBy.push(gend)
  licensedBy.push(...syntacticLicenses(lexeme, env))

  if (licensedBy.length > 0) {
    return lexeme.immutable
      ? { mutates: false, reason: 'veto:immutable', suppressed: licensedBy }
      : { mutates: true, licensedBy }
  }
  if (!SM_TARGETS.has(lexeme.initClass)) {
    return { mutates: false, reason: 'veto:no-reflex' }
  }
  return { mutates: false, reason: 'no-license' }
}
