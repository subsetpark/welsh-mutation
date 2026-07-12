# welsh-sm: Architecture

A predicate over `(Lexeme, Environment)` answering: does this token exhibit Soft Mutation (SM)?

## Scope and stance

- **Register**: prescriptive standard modern *colloquial* Welsh. Ground truth: Gareth King,
  *Modern Welsh: A Comprehensive Grammar*, 3rd ed. (2016) ("King"). Where King and the
  literary standard diverge, King wins; divergences are noted in test annotations.
- **Deterministic**: predictive/prescriptive level only. No usage probabilities.
- **SM only** in the public API. Internally, trigger frames carry the full grade vocabulary
  (`SM | SM-ltd | AM | NM | mixed | none`) because mixed mutation (King §10) licenses SM
  for some initial classes and AM for others — collapsing grades would misclassify every
  *ni/na*-context.
- **Mutation content is opaque.** We never compute mutated forms; we only need the
  equivalence class of a lexeme's initial segment (`InitClass`) to know whether a given
  grade has an SM reflex for it.
- The program consumes already-populated `Environment` records. No parsing, no generation.
  A future pipeline (POS tagger → Environment) automates what tests hand-author; the
  `Environment` type is that pipeline's output contract.

## The theory being implemented

Explicitly heterogeneous, per the research consensus (see `research.md`):

1. **Lexical/contact triggers** (King §§8a, 9): closed class of words mutating their
   immediately following dependent. Arbitrary list; per-item frames. Blockable by an
   intervening word (King §5d) — which falls out of string adjacency automatically.
2. **Gender marking**: fem. sg. noun after article/*un* (encoded as conditioned lexical
   frames with `gend:` provenance), and modifiers agreeing with a fem. sg. controller
   (encoded via the `agreement` field — NOT via adjacency, because adjective chains
   (*y ferch fach wen*) break adjacency; per Breit 2019 this is a feature borne by the
   target).
3. **Syntactic/positional mutation** (King §§8b, 11): unblockable (King §5e).
   - `xp-edge`: the XP Trigger Hypothesis (Harlow/Borsley/Tallerman), committed to as the
     theory of DOM: a c-commanding, non-CP phrase ends immediately before the target.
     Covers King 11(a) post-subject and 11(e) post-intrusive-word.
   - Designated positions (Dowle 2024): `adv-np` (King 11b), `vocative` (King 11c),
     `v1-finite-aff` (King 11d — colloquial clause-initial inflected verb),
     `v1-finite-neg` (King §10 — mixed mutation on negative inflected verbs).

## Keystone constraint

**The Trigger Constraint** (Breit 2019): every mutation is licensed by the immediately
preceding string element or by a feature borne by the target itself. Therefore
`Environment` is a fixed-size record about ONE preceding position plus target-side
features — never a tree. All syntactic complexity lives in *producing* the record.

## Data types (see src/types.ts)

- `Lexeme`: id, cat, gender/number (nouns), `initClass`, `immutable?`.
  Identity is required because exception lists are per-lexeme.
- `Environment`:
  - `prev`: `null` or `{ lemma, relationToTarget, isXPRightEdge }`. Trigger frames are
    looked up in the lexicon by lemma. `relationToTarget: 'dependent' | 'possessor' |
    'other'` — possessor immunity (*cath merch*) is the ABSENCE of the licensing relation,
    not a veto (Dowle 2024 / Mittendorf & Sadler 2006).
  - `agreement`: `null` or `{ controllerGender, controllerNumber, relation }` — resolved
    agreement facts for modifiers/predicates.
  - `position`: designated-position tag or `null`.
- Result: `{ mutates: true, licensedBy: RuleId[] } | { mutates: false, reason }`.
  Provenance is the falsifiability apparatus: it lets tests check the *theory*
  (right rule fired), not just the extension.

## Evaluation order

1. Vetoes: `lexeme.immutable` (King §12), or initClass has no SM reflex → false.
2. P_lex: prev lemma has a frame; relation is `dependent`; frame's grade yields SM for
   this initClass; target-feature conditions (gender/number/cat) satisfied.
3. P_gend: agreement-based modifier rule.
4. P_synt: `isXPRightEdge` or designated position.
All licensers are collected (a token can be multiply licensed); any → true.

## Grade → SM-reflex logic

- `SM`: yes for initClass ∈ {c p t g b d ll m rh}.
- `SM-ltd`: as SM but excluding ll, rh (King §9 marks *mor, un(f), y(f), yn(pred)*).
- `mixed`: SM iff initClass ∈ {g b d ll m rh} (AM claims c p t) (King §10).
- `AM`, `NM`, `none`: never SM.

## Contested registry

Genuinely disputed/variable contexts are listed in `data/contested.json` and flagged in
tests as CONTESTED, not wrong. Seed entries: euphonic non-mutation after -s (*nos da*,
King §12e note); colloquial SM-for-AM after *â/gyda/tri*; *lle/byth* immutability
variation (King §12b).

## Decisions log

- 2026-07-11: bool+provenance output; hand-authored Environments in tests; XPTH committed
  as the syntactic theory (`isXPRightEdge` is the interface; switching to Breit-style
  ACC-on-target later would change only the pipeline, not the predicate). TypeScript,
  zero runtime deps, lexicon and tests as JSON data.
- 2026-07-11: register = colloquial standard (King), which pulls §11(d) v1-verb mutation
  into scope.
- 2026-07-11: word-internal SM (derivational prefixes af-, di-, cyd-, gwrth-, hunan-,
  rhag-, ym-; compound formation — King §9 end) is OUT OF SCOPE. The predicate ranges
  over tokens, not word-formation; prefixed forms are radical lexemes in their own right
  (King makes the same move for internal NM after an-, p.13).
- 2026-07-11: removed `agreement.relation: 'predicate'` — predicate position is mediated
  by the contact trigger yn.pred (King §9), so the relation had no licensing rule.
- 2026-07-11: King-complete lexicon pass (App A, §§22-33, 93-118, 160-197, 443-476,
  479-513). Consequences:
  - A lemma may carry SEVERAL frames (y: fem-sg-noun frame + dau/dwy Num frame, §29;
    chwe: AM generally + NM on blwydd/blynedd/diwrnod, §176). FRAMES is now
    Map<lemma, TriggerFrame[]>; first applicable SM-yielding frame licenses.
  - na.rel (negative relative particle) encoded as `mixed`: King §481 shows only
    SM-ambiguous examples (b/d/g-initials); prescriptive tradition + §10 give AM on
    c/p/t. Mixed is consistent with all of King's data.
  - neu° SM is cancelled before an imperative (King §512) — encoded as a targetCat
    restriction (V excluded; Vnoun retained: aros neu °ddod).
  - gend:agr-mod is FULL SM, not SM-ltd: King §100 mutates ll- adjectives after fem sg
    nouns (profedigaeth °lem). Only the article/un/yn.pred/mor spare ll-/rh-.
  - grade-`none` frames are stored deliberately (pob, mewn, rhwng, os, compound preps):
    absence is data, and the pipeline needs to know a lemma was considered and rejected
    rather than missing.
  - data/immutables.json added (King §12 lexemes + class-level rules: personal names,
    non-Welsh placenames, already-mutated forms). Feeds Lexeme.immutable in the pipeline.
