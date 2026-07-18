# Workstream: welsh-sm Pipeline

## Vision

Ship a `welsh-sm` CLI that reads natural (attested, mutated) Welsh text and annotates
every token with the account's soft-mutation verdict: the recovered radical, whether SM
is predicted, the licensing rule or veto (with suppressed licenses), and how the
prediction compares to the observed surface form — in both colloquial and literary
registers. The pipeline manufactures the (Lexeme, Environment) pairs the existing
predicate consumes; the theory layer (predicate, tree, surface, report) is a frozen
contract that the pipeline authors trees FOR, never modifies. Corpus-scale evaluation
(per-rule precision/recall against CorCenCC) is deliberately deferred to a future
workstream; this one ends at a trustworthy, explainable annotator.

## Current State

Verified in the checkout (all committed, 86 tests green):

- `src/predicate.ts` — `sm(Lexeme, Environment)` with potentials, counterfactual
  vetoes, and rule provenance. `src/tree.ts` — the c-structure contract
  (`environmentFor(root, path)`): phrases NP/PP/AP/AdvP/NumP/VNP, clauses S/CP,
  leaves (Lexeme + lemma override + surface `form`), Gap nodes, roles
  adverbial/vocative, polarity. `src/surface.ts` + `src/mutate.ts` — SM orthography
  (forward direction ONLY; no AM/NM maps, no inverse maps exist anywhere) and
  `renderSurface`. `src/pretty.ts` — diagram rendering.
- `data/triggers.json` — 151 contact frames (78 SM, 4 SM-ltd, 11 AM, 14 NM, 4 mixed,
  40 deliberate `none`), each with King § references. Includes multiword lemmas
  (`ar ôl`, `o dan`, `hanner can`…). No interrogative particle frame (`a.int` absent;
  `a.rel`, `na.rel`, `ni` present) — relevant to the literary register.
- `src/lexicon.ts` — 69 hand-curated lexemes. `data/immutables.json` — King §12
  lexeme list plus class rules (personal names, non-Welsh placenames) not yet
  consumable by any code. `data/contested.json` — 12 catalogued unstable contexts.
- Register: the account is colloquial-only. `positionFor` emits v1 tags
  unconditionally; no register parameter exists anywhere.
- No `bin/`, no tokenizer, no de-mutation, no tagger, no chunker, no CLI.
- `REPORT.md`/`REPORT.pdf` — literate report; every example's verdicts AND surface
  line are asserted at build time.

## Key Challenges

- **De-mutation is one-to-many** (*fan* ← *man/ban/fan*; *welodd* ← *gwelodd*) and
  requires AM/NM inverses too, since attested text shows those grades. Lexicon
  membership prunes candidates; a broad lexicon is therefore the first dependency.
- **Homograph disambiguation without circularity**: CyTag disambiguates *yn* by
  looking at whether the next word is soft-mutated — consuming the answer we predict.
  Our tagger must not condition on the mutation state of the token being judged.
- **Shallow structure is enough, but gaps and roles are not free**: the Trigger
  Constraint means only local structure matters, yet relative/wh clauses need Gap
  insertion, literary pro-drop needs a subject gap after person-inflected verbs
  lacking an overt subject (*Gwelais °ddraig*) — but never after impersonal forms
  (*Gwelwyd dyn* is radical) — and the adverbial/vocative roles are irreducibly
  lexical/punctuational. The person/impersonal distinction means verb inflection
  features must survive M1 extraction and M2 tokenization.
- **Register**: the abundant clean text (Wikipedia, UD treebank) is written Welsh;
  the account is colloquial. The literary mode must exist for the CLI to be honest
  on such input.
- **OOV robustness**: real text contains names, borrowings, and typos; the pipeline
  must degrade to orthography-derived initClass + unknown cat, never crash.

## Established Precedents

- **pattern — Constraint Grammar (Karlsson)** — https://visl.sdu.dk/constraint_grammar.html
  Reductionist disambiguation: each token starts with all lexicon readings; ordered
  contextual rules REMOVE readings. The tagger (M3) implements this shape as a small
  TS rule engine over our Reading type — consciously reimplemented rather than
  binding the CG-3 C++ runtime. CyTag (https://github.com/CorCenCC/CyTag, CC-BY-SA)
  is the Welsh exemplar: mine its rules and word lists as reference, do not run it.
- **documentation — UD_Welsh-CCG treebank** — https://github.com/UniversalDependencies/UD_Welsh-CCG
  The only public Welsh treebank (written register: Wikipedia, Senedd, news;
  CC BY-SA 4.0). Two uses: FEATS columns (Gender/Number, lemma, UPOS) as the broad
  lexicon source (M1), and dependency structures as gold data to spot-check the
  chunker (M4). Never used to build the chunker.
- **rfc-spec — CoNLL-U format** — https://universaldependencies.org/format.html
  The interchange format both M1 (lexicon extraction) and M4 (gold spot-checks)
  parse: 10 tab-separated columns, `#` comment lines, MWT ranges (`1-2`), FEATS as
  `|`-separated key=value pairs.
- **pattern — Finite-state morphology (Beesley & Karttunen; Mittendorf & Sadler 2006;
  Poibeau 2014)** — https://aclanthology.org/W14-4604.pdf
  Grounds the claim that T0–T1 are pure local string maps: tokenization, clitic
  splitting, and (de-)mutation are all bounded-context, invertible-by-enumeration
  operations. Design inverse maps as enumerated candidate sets, not search.

## Milestones

### Milestone 1: broad-lexicon

**Definition of Done**:
- A CoNLL-U parser (comments, MWT ranges, FEATS) and an extraction script that
  builds `data/lexicon-full.json` from UD_Welsh-CCG: nouns with gender/number,
  verbs/adjectives/numerals with cat, lemma, and orthography-derived `initClass`
  (digraph-aware: ll-, rh-, ch-, ff-, th- are not l-, r-, c-, f-, t-). Inflected
  verbs additionally carry person/number and impersonal marking as encoded in
  FEATS — consumed by M4's pro-drop gap insertion.
- A lexicon loader that layers `data/lexicon-full.json` under the hand-curated
  `src/lexicon.ts` (hand entries win) and applies `data/immutables.json` — including
  the class rules (PROPN ⇒ personal-name immutability) which today no code consumes.
- A coverage report script: % of tokens in a held-out UD sample resolvable to at
  least one lexicon entry.
- All 86 existing tests green; the report builds unchanged.

**Why this is a safe pause point**: purely additive data + loader modules; nothing
downstream consumes them yet, and the theory layer is untouched.

**Unlocks**: candidate pruning for de-mutation (M2); gender/number features for
tagging (M3); verb inflection features for pro-drop gap insertion (M4).

**Operator Actions Before Next Milestone**:
- Read the coverage report. If token coverage on the UD sample is ≥ 90%, proceed
  directly to M2. If below, decide whether to approve importing `apertium-cym`
  dictionary data as a supplementary source — this is a licensing decision (Apertium
  data is GPL; UD_Welsh-CCG is CC BY-SA 4.0) that only you can make. Abort criterion:
  none; worst case M2 proceeds with reduced coverage and more OOV tokens.

**Established Precedents** (milestone-scoped):
- **library — apertium-cym** — https://github.com/apertium/apertium-cym — conditional
  supplementary lexicon source (`.dix` monolingual dictionary with gender), pending
  the operator's licensing call above.

### Milestone 2: tokenizer-demutation

**Definition of Done**:
- Welsh tokenizer: punctuation, clitic splitting ('r/'n/'w/'m/'th with lemma
  assignment), multiword-trigger grouping driven by the multiword lemmas already in
  `data/triggers.json` (`ar ôl`, `o dan`, `yn lle`, …) — not a second hand-kept list.
- Inverse mutation maps for all three grades (SM/AM/NM inverses; e.g. surface f- ⇒
  {b-, m-, f-}, ngh- ⇒ {c-}), producing candidate radicals filtered by the M1
  lexicon. Round-trip property test: for every lexicon radical w and grade g,
  demutate(applyGrade(w, g)) contains w.
- OOV policy implemented: unresolvable tokens get orthography-derived initClass,
  cat 'Other', an `unknown` flag, and never throw.
- Output type: `Token[]` where each token carries surface form, candidate readings
  (radical + lexeme), and observed-mutation hypotheses; verb readings preserve the
  M1 inflection features (person vs impersonal).

**Why this is a safe pause point**: pure modules with property tests; no consumer
wired yet.

**Unlocks**: tagging (M3).

### Milestone 3: closed-class-tagger

**Definition of Done**:
- A CG-style rule engine over readings (start with all candidates, ordered rules
  remove) resolving: homograph lemma keys (`yn.loc`/`yn.pred`/yn+VN,
  `ei.3sgm`/`ei.3sgf` via echo pronoun, `a.rel`/`a.conj`, i preposition vs pronoun,
  dy possessive vs SM-of-tŷ), cat/gender/number from the lexicon, and
  observed-mutation selection among de-mutation candidates.
- The no-mutation-evidence constraint enforced structurally: rules cannot read the
  mutation state of the token whose readings they are pruning (neighbors' mutation
  state is permitted evidence).
- Ambiguity propagation per the ratified policy: where rules cannot decide, the
  token retains multiple readings, flagged.
- A gold mini-suite: ~40 hand-tagged sentences (King examples + UD samples)
  asserting final readings.

**Why this is a safe pause point**: tokenize→tag runs standalone with its own gold
suite; trees and CLI still absent.

**Unlocks**: chunking (M4).

### Milestone 4: shallow-chunker

**Definition of Done**:
- A rule chunker building the existing `TreeNode` contract from tagged tokens:
  clause segmentation with the subordinator-inside-clause convention; NP (Det, Num,
  prenominal Adj, N head, AP chain, genitive NP nesting), PP, VNP brackets; Gap
  insertion after relativizers/wh (a°, sy, na, pwy/beth questions) AND in subject
  position after person-inflected verbs with no overt subject NP (literary
  pro-drop) — never after impersonal forms (*Gwelwyd dyn* stays radical); Gaps
  record `reason: 'extraction' | 'pro'` (optional field, the one backward-compatible
  addition M4 makes to the tree contract, keeping `--explain` and the report
  honest); role assignment
  (adverbial via a time-noun list + clause-peripheral position; vocative via
  comma-delimited address); polarity from ddim/ni/na cues.
- Trees for every sentence in the tagger's gold suite match hand-authored trees
  (path-exact), including the classic set: DOM, periphrastic, intervening-PP,
  fronted object, gap questions, pro-drop (*Gwelais ddraig*), impersonal
  (*Gwelwyd dyn*), possessor immunity, adjective chains.
- A spot-check script comparing chunker NP/PP spans against a converted
  UD_Welsh-CCG sample (dependency yields → brackets), reporting agreement — a
  dashboard, not a gate.

**Why this is a safe pause point**: text→tree runs end to end; `environmentFor` +
`sm` consume the output in tests, proving the contract holds; no user-facing surface
yet.

**Unlocks**: the CLI (M6).

### Milestone 5: register-toggle

**Definition of Done**:
- A `Register` parameter (`'colloquial' | 'literary'`, default colloquial) threaded
  through environment derivation: in literary mode the v1 position tags are not
  emitted; everything else is shared.
- The literary trigger inventory audited and completed: interrogative `a.int`
  (mixed? SM — resolve from King §§) added to `data/triggers.json` (`ni`, `na.rel`,
  `a.rel` already present, verified); any further literary-only frames from King's
  §6 register notes added with references.
- Tests: dom-basic tree judged both ways (°Welodd colloquial / Gwelodd literary,
  object mutation identical); a hand-authored pro-drop tree (subject gap) judged
  literary — radical verb, SM object (M5 is parallel to M4, so the tree is
  hand-authored here; chunker-built coverage arrives with M4's gold suite);
  existing 86 tests and the report (colloquial default) unchanged.

**Why this is a safe pause point**: the theory layer gains a parameter with a
backward-compatible default; nothing else changes.

**Unlocks**: honest CLI output on written-register input (M6). Independent of
M1–M4 and can run in parallel with any of them.

### Milestone 6: welsh-sm-cli

**Definition of Done**:
- A `welsh-sm` binary (npm bin, stdin or file input) composing tokenize → demutate →
  tag → chunk → judge. Output modes: default annotated text (predicted °-marking
  with per-token agreement against observed forms); `--explain` (per-token rule
  provenance including suppressed licenses and ambiguity readings); `--json` (full
  trees, readings, verdicts, serializable); `--register colloquial|literary`.
- Ambiguous tokens render all readings with their respective verdicts, visibly
  flagged.
- Exit codes: 0 on success (including OOV-containing input), 1 on usage error;
  never a crash on arbitrary UTF-8 input.
- The terminal acceptance suite below passes.

**Why this is a safe pause point**: it is the terminal milestone.

**Unlocks**: the deferred corpus-evaluation workstream (CorCenCC), which needs
exactly this binary plus a scorer.

## Dependency Graph

```text
1 (broad-lexicon)        → []
2 (tokenizer-demutation) → [1]
3 (closed-class-tagger)  → [2]
4 (shallow-chunker)      → [3]
5 (register-toggle)      → []        (parallel track)
6 (welsh-sm-cli)         → [4, 5]
```

## Open Questions

| Question | Notes | Resolve By |
|----------|-------|------------|
| ~~Lexicon coverage threshold & Apertium GPL import~~ | RESOLVED 2026-07-18: UD-only coverage 86.2% < 90%; operator approved the GPL import (see Decisions). Combined coverage 93.8%. | ~~After M1~~ |
| ~~FEATS encoding of impersonal verb forms in UD_Welsh-CCG~~ | RESOLVED during M1: `Person=0` marks impersonals (Gwelwyd, Dylid); apertium-cym tags them `impers`. Both map to LexEntry `person: '0'`. | ~~M1~~ |
| ~~Grade of literary interrogative a°~~ | RESOLVED M5: SM (prescriptive tradition; King §481 note), added as `a.int` targeting V, with tagger 3-way resolution (int/rel/conj) and chunker particle handling. Audit bonus: `oni` (mixed, §10) was already present, contrary to this document's earlier claim. | ~~M5~~ |
| CLI ambiguity display format | UX detail; settle in the M6 gameplan, constrained by "all readings visible + flagged". | M6 |
| CorCenCC access mechanics and scoring design | Deliberately out of scope; first question of the successor evaluation workstream. | Post-workstream |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Terminal scope = CLI only; corpus evaluation deferred | User ruling. The scientific precision/recall report against CorCenCC becomes a successor workstream consuming this CLI. |
| Own shallow chunker; Stanza and CyTag rejected as runtime components | The Trigger Constraint means only local/shallow structure is consumed; Welsh VSO + rigid NP order suits rules; keeps the stack TS-only (no Python, no CG-3 binary). The TreeNode contract leaves room for a Stanza/UD adapter later without touching anything downstream. CyTag is mined for rules/lists as reference only. |
| Propagate ambiguous readings (no forced best guess) | User ruling. Disjunctive verdicts are honest; the flagged-readings shape is fixed in M3 and rendered in M6. |
| No-mutation-evidence tagging rule retained despite CLI-only scope | Costs little now; preserves the integrity of the future evaluation workstream, which would otherwise inherit contaminated tags (the CyTag circularity). |
| Theory layer frozen as contract | The pipeline authors trees; `sm`, `environmentFor`, the report, and the 86 tests are not modified by M1–M4 — sole exception: M4's optional Gap `reason` field, ratified below (M5 adds one backward-compatible parameter). Any pipeline pressure to change the theory layer is a finding, not a patch. |
| Literary pro-drop = Gap insertion, not a new empty category | Finding (ratified 2026-07-18): under the XPTH the dropped subject must still contribute an XP edge (*Gwelais °ddraig* — object mutates), while impersonals must not (*Gwelwyd dyn* — object radical). `Gap` already has exactly the required behavior (silent XP edge, blocks contact adjacency), so M4 inserts one after person-inflected subjectless verbs and never after impersonal forms, marking it `reason: 'pro'` vs `'extraction'` so `--explain` and REPORT.md's empty-category claim stay honest. Requires verb inflection features from M1/M2. |
| Register question resolved as: toggle in scope, evaluation not | Reconciles the user's "literary first" corpus answer with CLI-only scope: UD text serves as gold/acceptance data; the toggle (M5) makes the CLI honest on written input. |
| Lexicon primary source = UD_Welsh-CCG FEATS | CC BY-SA 4.0 (license-compatible with our CC-referenced data), register-adjacent, already needed for M4 gold. Apertium is a conditional backfill pending the operator's licensing call. |
| Apertium GPL import approved (operator, 2026-07-18) | UD-only held-out coverage was 86.2% (<90% gate). apertium-cym (pinned caf86f27) is expanded to RADICAL forms only (initial-* paradigms via identity alternatives — mutated variants stay M2's inverse-map problem). The GPL-derived data/lexicon-apertium.json is kept separate from the CC BY-SA lexicon-full.json and gitignored (17MB, regenerable: apertium:fetch + apertium:extract); the loader warns loudly when it is absent. Combined coverage: 93.8% (PROPN 72.6% is the residual tail — unbounded names fall to M2's OOV policy). |

## Definition of Done (Acceptance Suite)

The deliverable is a CLI over a filesystem repo — `api` and `db` do not apply; every
assertion is `cmd`. All commands assume the repo root; `welsh-sm` means the built bin
(`npx welsh-sm` or the installed binary). Default register is colloquial unless
flagged. Assertions trace to the milestone owning the distinguishing logic, which is
where a failure should be root-caused first, even though observability arrives with
M6's binary.

- **DoD-1 — Clitic tokenization and de-mutation round-trip**
  - **Assert**: `i'r dre` tokenizes as three tokens (i, 'r, dre), and *dre* is
    resolved to radical *tre* with observed mutation SM.
  - **Verify by** `cmd`: `echo "i'r dre" | welsh-sm --json`; inspect tokens.
  - **Expected**: tokens `["i","'r","dre"]`; the *dre* token has
    `radical: "tre"`, `observed: "SM"`, predicted mutation with
    `licensedBy: ["gend:art-fem-sg"]`.
  - **Traces to**: Milestone 2 — tokenizer clitic rules + inverse SM map.

- **DoD-2 — Multiword trigger grouping**
  - **Assert**: In `ar ôl cinio`, *cinio* is judged against the compound preposition
    frame (grade none), not against `ôl`.
  - **Verify by** `cmd`: `echo "ar ôl cinio" | welsh-sm --explain`.
  - **Expected**: *cinio* radical, reason `no-license`, with prev lemma `ar ôl`.
  - **Traces to**: Milestone 2 — MWE grouping driven by triggers.json lemmas.

- **DoD-3 — DOM end-to-end**
  - **Assert**: In `Welodd Mair ddraig.`, *ddraig* is predicted SM via the XP edge
    and *Welodd* via v1.
  - **Verify by** `cmd`: `echo "Welodd Mair ddraig." | welsh-sm --json`.
  - **Expected**: *ddraig*: `radical: "draig"`, `licensedBy: ["synt:xp-edge"]`,
    observed agrees; *Welodd*: `radical: "gwelodd"`, `licensedBy: ["synt:v1-aff"]`.
  - **Traces to**: Milestone 4 — clause/NP chunking feeding the existing
    `environmentFor`.

- **DoD-4 — Gap insertion**
  - **Assert**: `Pwy welodd ddraig?` receives a Gap in subject position and *ddraig*
    is licensed by the gap's edge.
  - **Verify by** `cmd`: `echo "Pwy welodd ddraig?" | welsh-sm --json`; inspect the
    tree for a gap node and *ddraig*'s provenance.
  - **Expected**: tree contains `gap:NP` between the verb and object;
    *ddraig* `licensedBy: ["synt:xp-edge"]`.
  - **Traces to**: Milestone 4 — relativizer/wh gap insertion.

- **DoD-5 — Possessor immunity (negative invariant)**
  - **Assert**: In `cath merch`, *merch* is predicted radical with reason
    `no-license` (not a veto), and no rule fires.
  - **Verify by** `cmd`: `echo "cath merch" | welsh-sm --explain`.
  - **Expected**: *merch* → `radical (no-license)`; observed form agrees.
  - **Traces to**: Milestone 4 — genitive-configuration NP nesting.

- **DoD-6 — Lexicon features gate the gender system**
  - **Assert**: `y llong` (fem sg, ll-) yields no SM prediction while `y gath`
    yields `gend:art-fem-sg` — distinguishing requires gender AND initClass from the
    broad lexicon.
  - **Verify by** `cmd`: `printf "y llong\ny gath\n" | welsh-sm --explain`.
  - **Expected**: *llong* → `no-license`; *gath* → SM, `gend:art-fem-sg`,
    radical *cath*.
  - **Traces to**: Milestone 1 — lexicon-full gender/initClass extraction.

- **DoD-7 — Homograph yn resolved without mutation evidence**
  - **Assert**: *yn* before a place NP tags as `yn.loc` and before a predicate
    adjective as `yn.pred`, decided by context rules that never read the following
    token's mutation state.
  - **Verify by** `cmd`: `printf "mae hi yn yr ardd\nmae hi yn dal\n" | welsh-sm --json`
    (inspect lemma per reading); plus `grep` the tagger rule file for the structural
    guard (rules declare readable context, and target-mutation is not a readable field).
  - **Expected**: first *yn* → `yn.loc`; second → `yn.pred`; guard present.
  - **Traces to**: Milestone 3 — tagger rule engine + evidence constraint.

- **DoD-8 — Ambiguity propagates**
  - **Assert**: `ei gath` with no echo pronoun yields two readings on *gath*
    (`ei.3sgm` → SM predicted, agrees; `ei.3sgf` → AM expected, observed SM
    anomalous), flagged ambiguous.
  - **Verify by** `cmd`: `echo "ei gath" | welsh-sm --json`.
  - **Expected**: *gath* token has `ambiguous: true` and exactly two readings with
    distinct lemma keys and verdicts.
  - **Traces to**: Milestone 3 — n-best reading retention.

- **DoD-9 — Register toggle changes exactly the v1 verdict**
  - **Assert**: `Gwelodd Mair ddraig.` under `--register literary` predicts radical
    *Gwelodd* (agreeing with the input) and still predicts SM on *ddraig*; under
    colloquial the verb is flagged as predicted-mutated-but-observed-radical.
  - **Verify by** `cmd`: run the same echo through both `--register` values; diff.
  - **Expected**: only the verb's verdict/agreement differs between runs.
  - **Traces to**: Milestone 5 — register parameter suppressing v1 positions.

- **DoD-10 — OOV never crashes**
  - **Assert**: Input containing an out-of-lexicon token (e.g. `Gwelodd hi zeb.`)
    exits 0 with the unknown token flagged.
  - **Verify by** `cmd`: `echo "Gwelodd hi zeb." | welsh-sm --json; echo $?`.
  - **Expected**: exit 0; *zeb* token carries `unknown: true` and an
    orthography-derived initClass.
  - **Traces to**: Milestone 2 — OOV policy.

- **DoD-11 — Literary pro-drop licenses the object**
  - **Assert**: `Gwelais ddraig.` under `--register literary` predicts SM on
    *ddraig* via a subject gap's XP edge, and radical *Gwelais* (v1 suppressed),
    both agreeing with the input.
  - **Verify by** `cmd`: `echo "Gwelais ddraig." | welsh-sm --json --register literary`.
  - **Expected**: tree contains a subject `gap:NP` (reason `pro`) between verb and
    object; *ddraig*: `radical: "draig"`, `licensedBy: ["synt:xp-edge"]`;
    *Gwelais* radical, agrees.
  - **Traces to**: Milestone 4 — pro-drop gap insertion (register suppression:
    Milestone 5; inflection features: Milestones 1–2).

- **DoD-12 — Impersonal takes no subject gap (negative invariant)**
  - **Assert**: `Gwelwyd dyn.` predicts radical *dyn* with reason `no-license`;
    no gap is inserted after the impersonal verb.
  - **Verify by** `cmd`: `echo "Gwelwyd dyn." | welsh-sm --explain --register literary`.
  - **Expected**: no `gap:NP` in the tree; *dyn* → `radical (no-license)`;
    observed form agrees.
  - **Traces to**: Milestone 4 — impersonal exclusion in gap insertion, gated on
    the M1/M2 inflection features.

- **DoD-13 — Theory layer unbroken**
  - **Assert**: The full pre-existing suite (predicate, tree, pretty, surface,
    report build with verdict and surface assertions) passes at workstream end.
  - **Verify by** `cmd`: `npm test && npm run report`; exit 0 both.
  - **Expected**: ≥ 86 passing tests, zero failures; REPORT.md regenerates.
  - **Traces to**: Milestone 6 — final integration (any earlier milestone breaking
    this fails its own DoD first).
