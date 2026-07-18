/**
 * Core data types. See ARCHITECTURE.md.
 *
 * The Trigger Constraint bounds Environment: everything the predicate may
 * consult is (a) the immediately preceding string element, (b) features the
 * target token bears, (c) a designated-position tag. Never a tree.
 */

/** Mutation grades a trigger frame may govern. Public API is SM-only, but
 *  `mixed` licenses SM for a subset of initials, so grades can't collapse. */
export type Grade = 'SM' | 'SM-ltd' | 'AM' | 'NM' | 'mixed' | 'none'

/** Equivalence class of a lexeme's initial segment. `other` = no mutation
 *  reflex at all (vowels, s-, n-, ch-, etc.; King §5a). */
export type InitClass =
  | 'c' | 'p' | 't'          // SM + AM targets
  | 'g' | 'b' | 'd' | 'm'    // SM (b, d, m also NM targets)
  | 'll' | 'rh'              // SM only, spared by SM-ltd triggers
  | 'other'

/** V = finite inflected verb; Vimp = imperative (resists v1 mutation — Dewch!
 *  not °Ddewch — and neu° SM, King §512); Vnoun = verbal noun. */
export type Cat = 'N' | 'Adj' | 'V' | 'Vimp' | 'Vnoun' | 'Num' | 'Adv' | 'Prt' | 'Other'

export interface Lexeme {
  /** Citation form (radical). Needed: exception lists are per-lexeme. */
  id: string
  cat: Cat
  gender?: 'm' | 'f'
  number?: 'sg' | 'pl'
  initClass: InitClass
  /** King §12: beth, dy, pan, mae, gêm, personal names, … */
  immutable?: boolean
}

/** Grammatical relation between the preceding element and the target.
 *  `possessor` exists to make possessor immunity (cath merch) the absence
 *  of a license rather than a veto. */
export type PrevRelation = 'dependent' | 'possessor' | 'other'

/** Register parameter (M5): the difference between registers is the
 *  presence or absence of the v1 designated positions, not a different
 *  theory — formal literary Welsh is particle-less and radical clause-
 *  initially (King §11d), so literary mode simply does not emit v1 tags. */
export type Register = 'colloquial' | 'literary'

/** Dowle-style designated positions (King §§10, 11b, 11c, 11d). */
export type PositionTag =
  | 'adv-np'         // NP as time/manner adverbial (King 11b)
  | 'vocative'       // King 11c
  | 'v1-finite-aff'  // clause-initial inflected verb, colloquial (King 11d)
  | 'v1-finite-neg'  // negative inflected verb: mixed mutation (King §10)

export interface Environment {
  /** The immediately preceding string element, or null (utterance-initial). */
  prev: null | {
    /** Lemma key into the trigger lexicon (frames are data, not code). */
    lemma: string
    relationToTarget: PrevRelation
    /** XPTH: a c-commanding, non-CP phrase ends immediately before the
     *  target. Covers post-subject (DOM) and post-intrusive contexts.
     *  Computed upstream (future pipeline; hand-authored in tests). */
    isXPRightEdge: boolean
  }
  /** Resolved agreement facts when the target modifies/predicates a
   *  controller. Separate from `prev` because adjective chains break
   *  adjacency (y ferch fach wen). */
  agreement: null | {
    controllerGender: 'm' | 'f'
    controllerNumber: 'sg' | 'pl'
    relation: 'modifier'
  }
  position: PositionTag | null
}

/** A contact-trigger frame (lexicon data, King §9). */
export interface TriggerFrame {
  lemma: string
  grade: Grade
  /** Restrict to target categories (e.g. article frame applies to N). */
  targetCat?: Cat[]
  /** Restrict to target features (e.g. article/un: fem sg only). */
  targetGender?: 'm' | 'f'
  targetNumber?: 'sg' | 'pl'
  /** Restrict to specific target lexemes (e.g. NM of blwydd/blynedd/diwrnod
   *  after certain numerals — King p.13). */
  targetLexemes?: string[]
  /** Provenance override: gender-system frames report `gend:` ids. */
  ruleId?: RuleId
}

export type RuleId =
  | `lex:${string}`      // contact trigger, by lemma
  | 'gend:art-fem-sg'    // y/yr/'r + fem sg noun
  | 'gend:un-fem-sg'     // un + fem sg noun
  | 'gend:agr-mod'       // modifier agreeing with fem sg controller
  | 'synt:xp-edge'       // XPTH (DOM, post-intrusive)
  | 'synt:adv-np'
  | 'synt:vocative'
  | 'synt:v1-aff'
  | 'synt:v1-neg-mixed'

export type NoMutationReason =
  | 'veto:immutable'     // King §12
  | 'veto:no-reflex'     // initClass has no SM reflex (King §5a)
  | 'no-license'

export type SMResult =
  | { mutates: true; licensedBy: RuleId[] }
  /** Both vetoes report counterfactually: `suppressed` lists the rules the
   *  veto actually blocked (veto:immutable — rules that fired on this
   *  initial; veto:no-reflex — SM-yielding rules that would fire on some
   *  mutable initial). An idle veto reports plain `no-license`, since
   *  removing it would change nothing. */
  | { mutates: false; reason: NoMutationReason; suppressed?: RuleId[] }
