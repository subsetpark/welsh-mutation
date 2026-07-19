/**
 * §2 — THE SHAPE OF THE THEORY: what a predictive account must look like
 * ======================================================================
 *
 * A theory of mutation owes, for every token of every sentence, a
 * verdict — the surface grade the environment imposes, or none — and a
 * REASON. The empirical landscape it must cover is, by research
 * consensus, heterogeneous. Three subsystems share the exponents
 * described in §1:
 *
 *   1. CONTACT TRIGGERS (King §9): a closed, arbitrary list of words that
 *      mutate the word immediately following them — the preposition i, the
 *      possessive dy, the numeral dau, some ninety others. Arbitrary means
 *      arbitrary: no phonology or semantics predicts membership, so the
 *      list is data (§3), and each member carries a small FRAME saying
 *      what grade it governs and under what target conditions.
 *
 *   2. GENDER (King §§28, 102): feminine singular nouns mutate after the
 *      article (y gath), and their modifiers mutate after them — even
 *      non-adjacent ones, y ferch fach WEN — so this subsystem cannot ride
 *      on string adjacency and needs resolved agreement facts instead.
 *
 *   3. SYNTAX (King §§10–11): mutation with no visible trigger word at
 *      all. A dragon mutates in Gwelodd y dyn DDRAIG 'the man saw a
 *      dragon' because the subject phrase ENDS right before it. The theory
 *      of this residue — the XP Trigger Hypothesis — and the handful of
 *      designated positions that escape even it are the subject of §6.
 *
 * What disciplines all three is the TRIGGER CONSTRAINT (Breit 2019): every
 * mutation is licensed by the immediately preceding string element, or by
 * a feature borne by the target itself. Nothing further away ever matters
 * at judgment time. The constraint is the keystone of this formalization,
 * because it fixes the type of the evidence: the predicate (§5) consumes a
 * small, fixed-size ENVIRONMENT record — one preceding element, the
 * target's own features, one position tag — and never a tree. All the
 * syntactic sophistication of §6 lives in PRODUCING that record; none of
 * it survives into the record itself. That asymmetry is what makes the
 * theory testable one token at a time.
 */

/**
 * The grade vocabulary a trigger frame may govern. §1 gave three surface
 * grades; frames need six values, and the extras are not decoration:
 *
 * - 'SM-ltd' is soft mutation that SPARES ll- and rh- — the article, un,
 *   yn.pred and mor govern this narrower grade (King §9): y LLONG stays
 *   radical where y GATH softens.
 * - 'mixed' (King §10) splits by initial: aspirate on c/p/t, soft on the
 *   rest. The negative markers ni/na/oni govern it. It cannot be
 *   collapsed into AM or SM, because it realizes AM on some initials and
 *   SM on others — collapsing would misclassify every negative clause.
 * - 'none' marks words POSITIVELY known not to trigger (pob, mewn, os…).
 *   Absence is data: a lemma with a none-frame was considered and
 *   rejected, not overlooked.
 */
export type Grade = 'SM' | 'SM-ltd' | 'AM' | 'NM' | 'mixed' | 'none'

/** King §4's column structure, stated as a subtype chain: AM touches the
 *  voiceless stops; NM those plus the voiced stops; SM all six stops plus
 *  the sonorants m/ll/rh (ll/rh being the pair the SM-ltd triggers spare).
 *  §1's GRADE_ORTH rows are TOTAL Records over exactly these unions, so
 *  the table's shape is compiler-enforced: a row missing one of its
 *  column's initials, growing a key outside it, or violating
 *  AM ⊆ NM ⊆ SM cannot typecheck. */
export type AMTarget = 'c' | 'p' | 't'
export type NMTarget = AMTarget | 'g' | 'b' | 'd'
export type SMTarget = NMTarget | 'm' | 'll' | 'rh'

/** Equivalence class of a lexeme's initial segment — everything the
 *  predicate ever knows about a word's shape (the letters live in §1).
 *  Vowels are their own class: they have no soft-mutation reflex, but
 *  aspirate-mutation contexts prefix h- to them (prothesis, §1), so the
 *  full-grade predicate must tell them apart from the truly inert
 *  initials. `other` = no reflex under ANY grade: s-, n-, h-, f-, and the
 *  radical digraphs ch-/ff-/th- (King §5a). */
export type InitClass = SMTarget | 'v' | 'other'

/** Category matters to mutation in specific, attested ways: trigger frames
 *  restrict by it (neu° spares finite verbs), the v1 positions apply only
 *  to inflected verbs, and imperatives are a category of their OWN because
 *  they resist both v1 mutation and neu° (Dewch!, never °Ddewch — King
 *  §512). V = finite inflected verb; Vnoun = verbal noun (the nonfinite
 *  citation form Welsh uses where English uses infinitives). */
export type Cat = 'N' | 'Adj' | 'V' | 'Vimp' | 'Vnoun' | 'Num' | 'Adv' | 'Prt' | 'Other'

/** The target of a judgment. Identity (`id`) is load-bearing: exception
 *  facts are per-lexeme — gêm resists mutation while gem-initial words in
 *  general do not — so a theory quantifying only over shapes could not
 *  state them. Gender/number feed the gender subsystem; `immutable` is the
 *  per-word veto (King §12; see immutables.json, §4). */
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
 *  The three-way split encodes a theoretical decision: POSSESSOR IMMUNITY.
 *  In cath merch 'a girl's cat', merch stands right after a noun yet stays
 *  radical — because the genitive relation licenses nothing. Immunity is
 *  the ABSENCE of a license, not a veto (Dowle 2024; Mittendorf & Sadler
 *  2006): no rule fires, so nothing needs suppressing. Contact frames
 *  require 'dependent'; subjects and gaps are 'other'. */
export type PrevRelation = 'dependent' | 'possessor' | 'other'

/** The register switch. The difference between colloquial and literary
 *  Welsh is, for this theory, the presence or absence of the v1 designated
 *  positions — NOT a different theory. Formal literary Welsh keeps its
 *  preverbal particles (or writes none and stays radical, King §11d);
 *  colloquial Welsh dropped them and kept their mutations (§6 on
 *  particle-drop residue). Every other subsystem is register-shared. */
export type Register = 'colloquial' | 'literary'

/** Designated positions (Dowle 2024; King §§10, 11b, 11c, 11d): the
 *  contexts where mutation attaches to a POSITION rather than to any
 *  preceding element. A word is judged against at most one. */
export type PositionTag =
  // NP as time/manner adverbial (King §11b, §403)
  | 'adv-np'
  // King §11c
  | 'vocative'
  // clause-initial inflected verb, colloquial (King §11d)
  | 'v1-finite-aff'
  // negative inflected verb: mixed mutation (King §10)
  | 'v1-finite-neg'

/**
 * THE EVIDENCE RECORD. The Trigger Constraint bounds what may appear here,
 * and this type is that bound made machine-checkable: (a) the immediately
 * preceding string element, (b) features the target bears, (c) a
 * designated-position tag. Never a tree, never a second word back, never
 * anything to the right (with one principled exception: agreement, which
 * is a feature ON the target resolved from its controller — carried
 * separately from `prev` precisely because adjective chains break
 * adjacency).
 */
export interface Environment {
  /** The immediately preceding string element, or null (utterance-initial). */
  prev: null | {
    /** Lemma key into the trigger lexicon (frames are data, not code). */
    lemma: string
    relationToTarget: PrevRelation
    /** XPTH: a c-commanding, non-CP phrase ends immediately before the
     *  target. Covers post-subject (DOM) and post-intrusive contexts.
     *  Computed upstream (§6; hand-authored in tests). */
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

/** A contact-trigger frame (lexicon data, §3; King §9): one licensing
 *  behavior of one trigger lemma. A lemma may carry several frames — the
 *  article y governs SM-ltd on feminine singular nouns AND plain SM on the
 *  numerals dau/dwy — and a frame may restrict its targets by category,
 *  gender, number, or even specific lexemes (the measure-words blwydd/
 *  blynedd/diwrnod nasalize after certain numerals and nothing else,
 *  King p.13). */
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

/** Rule identifiers, namespaced by subsystem — lex: contact triggers,
 *  gend: the gender system, synt: the syntactic residue. These appear in
 *  every verdict: provenance is the theory's falsifiability apparatus,
 *  letting a test assert not merely THAT a word mutates but that it
 *  mutates for the claimed reason. */
export type RuleId =
  // contact trigger, by lemma (King §9; per-frame refs in triggers.json)
  | `lex:${string}`
  // y/yr/'r + fem sg noun (King §28)
  | 'gend:art-fem-sg'
  // un + fem sg noun (King §162a)
  | 'gend:un-fem-sg'
  // modifier agreeing with fem sg controller (King §102)
  | 'gend:agr-mod'
  // XPTH (Harlow 1989; Borsley 1997; Tallerman 2006); King §11a/e, §14
  | 'synt:xp-edge'
  // King §11b, §403
  | 'synt:adv-np'
  // King §11c
  | 'synt:vocative'
  // King §11d
  | 'synt:v1-aff'
  // King §10
  | 'synt:v1-neg-mixed'

export type NoMutationReason =
  | 'veto:immutable'     // King §12
  | 'veto:no-reflex'     // initClass has no SM reflex (King §5a)
  | 'no-license'

/** The verdict. The licensing calculus (§5) resolves each fired rule's
 *  governed grade against the target's initial and reports the surface
 *  grade that results: fy + cath is grade NM, ei(f) + cath grade AM,
 *  ei(f) + iaith grade AM realized as h-prothesis. A mutating result
 *  names every rule that licensed the winning grade (a token can be
 *  multiply licensed). A grade-none result distinguishes three situations
 *  a bare 'none' would conflate: nothing fired (no-license — the
 *  possessor-immunity case), something fired but the word is exempt
 *  (veto:immutable), or something fired but this initial has no reflex
 *  under the governed grade (veto:no-reflex). Both vetoes report
 *  counterfactually: `suppressed` lists the rules the veto actually
 *  blocked, and an idle veto reports plain `no-license`, since removing
 *  it would change nothing. */
export type MutationResult =
  | { grade: 'SM' | 'AM' | 'NM'; licensedBy: RuleId[] }
  | { grade: 'none'; reason: NoMutationReason; suppressed?: RuleId[] }
