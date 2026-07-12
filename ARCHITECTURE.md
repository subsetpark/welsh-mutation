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

## Tree layer (src/tree.ts)

The author constructs a c-structure; `environmentFor(root, targetLeaf)` derives the
whole Environment. The author supplies structure and the two irreducibly
non-geometric FUNCTION labels (role: adverbial/vocative; clause polarity) — never
mutation judgments. Subject/object labels are unnecessary (the XPTH consumes phrase
edges, not grammatical functions — the configurational theory's payoff made
concrete). Possessors are derived from the genitive configuration [NP N NP]: an NP
following the head noun within an NP is the possessor (cath merch, canol y dre);
Welsh gives that geometry no other reading. Known edge: common-noun apposition
shares the configuration, but appositive NPs are overwhelmingly personal names,
which are immutable regardless. Adverbial/vocative stay author-supplied because
geometry provably underdetermines them: sentence-initial adverbial NPs mutate
(°Ddwy flynedd yn ôl…) while geometrically identical fronted objects do not (Beic
prynodd y ddynes) — the difference is adjunct-vs-argument status, a lexical/valence
fact the future pipeline must decide. Node vocabulary: phrases (NP, PP, AP, AdvP, NumP, VNP), clauses (S, CP —
never XPTH triggers), leaves (Lexeme + optional trigger-lemma override), and Gap
nodes (extraction sites; count as phrases for XP-edge, block contact adjacency via a
sentinel lemma).

isXPRightEdge, geometrically: some phrasal node X whose rightmost terminal
immediately precedes the target c-commands the target — with the **NP-internal
exclusion**: a candidate whose join node with the target is an NP never licenses.
Forcing datum: masculine adjective chains (ci mawr coch — coch is radical although
AP(mawr) ends before it and c-commands it). This operationalizes Tallerman's
'complement' condition and Breit's division of labor (NP-internal mutation belongs
exclusively to the gender subsystem). Green's decisive VNP case (prynu [PP yn y dre]
°feic) still fires because the join node is VNP.

Targets are addressed by TreePath (child indices from the root), not node
references: trees are plain serializable data — the pipeline will hand us JSON — and
two tokens of the same word are distinguished positionally, never by object
identity. Aliasing one node object into two positions throws (geometry is only
well-defined over a genuine tree). The full tree is required, not a prefix: the
target's ancestor spine carries c-command/domination, and agreement looks rightward
within the target's NP (prenominal adjectives agree with a FOLLOWING head noun:
y °brif °ddinas). Nothing after the target's containing clause is ever consulted —
near-prefix computability that bodes well for incremental pipeline tagging.

Authoring conventions:
- Subordinators/conjunctions/preverbal particles are leaf children of the clause they
  introduce (so `os daw e` does not present daw as clause-initial; root `Golles i…`
  does → v1).
- Lemma normalization: orthographic variants share a trigger lemma (y/yr/'r → y);
  homographs disambiguate (yn.loc/yn.pred, ei.3sgm/ei.3sgf, a.conj/a.rel).
- relationToTarget is derived: 'dependent' when prev is a head-word child of the
  lowest node containing both (i °dŷ, y °gath); 'possessor' when the target's branch
  under that node is role:possessor (cath merch); 'other' otherwise (subjects, gaps).
- agreement is derived for Adj targets from the head noun of the containing NP,
  regardless of adjacency (carries chains: y °ferch °fach °wen).
- position is derived: vocative/adv-np from role labels where the target is the
  phrase's first overt leaf; v1-finite-aff/neg from clause-initial V + polarity.

A satisfying consequence of the geometry: in `Golles i'r tocyn` the subject's XP edge
lands on 'r (no SM reflex), so the definite object noun correctly stays radical — DOM
mutates the first WORD of the following constituent, not the constituent's head.

## Evaluation order

1. P_lex: prev lemma has a frame; relation is `dependent`; frame's grade yields SM for
   this initClass; target-feature conditions (gender/number/cat) satisfied.
2. P_gend: agreement-based modifier rule.
3. P_synt: `isXPRightEdge` or designated position.
4. Vetoes, applied to the collected potentials. Licensers return POTENTIALS —
   (rule, grade) pairs whose environmental conditions hold — and sm() applies the
   initial-class filter, so BOTH vetoes report counterfactually:
   - `veto:immutable` (King §12) reports the rules that fired on this initial
     (`suppressed: [...]`, e.g. i Dafydd blocks lex:i);
   - `veto:no-reflex` (King §5a) reports the SM-yielding rules (grade ∈ SM/SM-ltd/
     mixed) that would fire on some mutable initial (i ysgol blocks lex:i) — an AM/NM
     frame would soft-mutate no initial, so ei ysgol 'her school' is plain no-license;
   - an idle veto (nothing to block) reports plain `no-license`, because removing it
     would change nothing.
All fired rules are collected (a token can be multiply licensed); any (unvetoed) → true.

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
- 2026-07-12: Cat gains 'Vimp' — imperatives resist v1 mutation (Dewch!, not °Ddewch)
  and neu° SM (King §512). Discovered composing the report: the vocative example's
  verdict rendering exposed a wrong v1 judgment on the imperative.
- 2026-07-12: literate report (report/report.ts → REPORT.md, `npm run report`). Every
  example tree is rendered by prettyTree and every declared verdict asserted at build
  time; test/report.test.ts runs the build, so the document cannot drift from the
  program. Prose + examples in report/, bibliography from research.md sources.
- 2026-07-12: surface layer (src/mutate.ts + src/surface.ts). SM's orthographic
  content is un-opaqued for RENDERING only (the predicate never consults it):
  softMutate maps radical forms by initClass (incl. g-deletion, digraphs, case).
  Leaf gains `form` — the token's surface shape absent SM (inflected verbs,
  'r-contraction, feminine adjective forms, and authored AM/NM spellings like
  nghath/cheffyl, which stay surface facts since the predicate is SM-only by
  charter). renderSurface derives each example's Welsh line from tree + verdicts,
  and report.ts fails on mismatch with the authored line (first variant, ignoring
  punctuation/case) — closing the one unverified channel, after two prose/analysis
  drift bugs (Gwelodd-for-°Welodd; adre missing from the adv-np analysis).
