# A Predictive Theory of Welsh Soft Mutation

This directory is a formalization of initial-consonant mutation in Welsh —
specifically a *predictive* account of **soft mutation** in prescriptive
standard colloquial Welsh (with a literary-register switch). It is written
to be read: the files below form a linear exposition, each chapter building
only on the ones before it. The code is the theory; the test suite and the
generated report (`REPORT.md`, built from `report/`) are its empirical
apparatus — every example sentence in the report has its verdicts *and* its
surface line asserted at build time, so the exposition cannot drift from
what the program actually claims.

Nothing in this directory knows that a text-processing pipeline exists.
The dependency arrow points strictly inward (enforced by
`test/architecture.test.ts`): implementation derives from theory, never the
reverse, and never restates it.

## The claim, in one paragraph

Welsh soft mutation is not one phenomenon but three, sharing an exponent:
an arbitrary lexical list of **contact triggers** that mutate the next
word; a **gender** subsystem marking feminine singular nouns and their
modifiers; and a **syntactic** residue in which any phrase edge — including
a silent one — mutates what immediately follows it (the XP Trigger
Hypothesis), plus a handful of designated positions. What unifies them is a
bound on evidence, Breit's **Trigger Constraint**: every mutation is
licensed by the immediately preceding string element or by a feature borne
by the target itself. A theory respecting that bound needs no global
sentence representation at judgment time — only a small, fixed-size
`Environment` record per token — and all syntactic sophistication moves
into *producing* that record.

## Reading order

| § | File | What it establishes |
|---|------|---------------------|
| 1 | `orthography.ts` | The phenomenon itself: the three mutation grades, which initials participate, what each grade looks like on the page. |
| 2 | `types.ts` | The shape a theory must take: the Trigger Constraint, the `Environment` record, lexeme identity, the grade vocabulary, registers, and the verdict type with its provenance. |
| 3 | `triggers.json` | The lexical component: every contact-trigger frame, with King § references. Data, not code — the arbitrariness of the list is itself a theoretical claim. |
| 4 | `immutables.json` | The exception lexicon: words and word-classes that resist mutation. |
| 5 | `predicate.ts` | The licensing calculus: how the three subsystems propose, how grades filter through initial classes, how vetoes report counterfactually, and what counts as agreement with an observed form. |
| 6 | `tree.ts` | Syntax: where Environments come from. The XPTH made geometric, the NP-internal exclusion, the empty-category inventory (extraction gaps and pro), designated positions as particle-drop residue, and the register switch. |
| 7 | `lexicon.ts` | The worked lexemes used by the report and tests, carrying the per-word exception facts. |
| 8 | `surface.ts` | Realization: from verdicts back to the printed Welsh line. |
| 9 | `pretty.ts` | The inspection view: trees with per-leaf verdicts and provenance. |
| 10 | `contested.json` | Honesty box: contexts where usage is genuinely disputed; failures here are CONTESTED, not wrong. |
| 11 | `report/` | The literate report — prose, worked examples, bibliography — assembled from everything above and asserted against it. |

## Ground truth and sources

The normative reference throughout is Gareth King, *Modern Welsh: A
Comprehensive Grammar*, 3rd ed. (2016) — cited as "King §n". The
theoretical commitments draw on the research literature: Harlow (1989),
Borsley (1997), Green (2003), Tallerman (2006) and Willis (2007) for the
XP Trigger Hypothesis and its data; Roberts (1997, 2005) for the Case-based
rival it is argued against; Breit (2019) for the Trigger Constraint and the
gender/syntax division of labor; Dowle (2024) for designated positions and
the elimination of empty categories (this account retains exactly two,
both silent phrase edges: extraction gaps and literary null subjects).
Full bibliography in `REPORT.md`.
