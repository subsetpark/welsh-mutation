/**
 * §11 — THE LITERATE REPORT: the exposition, rendered and asserted
 * ================================================================
 *
 * The final chapter assembles everything before it into REPORT.md: prose,
 * worked examples with their trees (§9's view), surface lines (§8's), the
 * full trigger inventory (§3) and the contested registry (§10), plus
 * bibliography. It is not documentation ABOUT the theory but the theory's
 * own output: every example tree is rendered by prettyTree and every
 * declared verdict is asserted against mutation() — the full-grade
 * licensing calculus, so AM/NM claims are checked as positively as SM
 * ones — and generation FAILS if the document disagrees with the program,
 * so REPORT.md cannot drift.
 *
 * Build: npm run report
 */

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { mutation } from '../predicate.ts'
import { environmentFor, resolveLeaf } from '../tree.ts'
import { renderSurface } from '../surface.ts'
import { prettyTree } from '../pretty.ts'
import { SECTIONS, type Example } from './examples.ts'
import triggersData from '../triggers.json' with { type: 'json' }
import contestedData from '../contested.json' with { type: 'json' }

function assertAndRender(ex: Example): string {
  for (const t of ex.targets) {
    const lexeme = resolveLeaf(ex.tree, t.path).lexeme
    const r = mutation(lexeme, environmentFor(ex.tree, t.path))
    const actual = r.grade !== 'none'
      ? `${r.grade} (${[...r.licensedBy].sort().join(',')})`
      : r.reason
    const expected = Array.isArray(t.expect)
      ? `${t.grade ?? 'SM'} (${[...t.expect].sort().join(',')})`
      : t.expect
    if (actual !== expected) {
      throw new Error(
        `report assertion failed [${ex.id} @ ${JSON.stringify(t.path)}]: expected ${expected}, program says ${actual}`,
      )
    }
  }
  // The Welsh line is the one part of an example prose could silently get
  // wrong; verify its first variant (before any ' — ') against the rendered
  // surface, ignoring punctuation and case.
  const normalize = (t: string) =>
    t.split(' \u2014 ')[0]!.replace(/[,!?]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
  const rendered = normalize(renderSurface(ex.tree))
  const authored = normalize(ex.welsh)
  if (rendered !== authored) {
    throw new Error(
      `surface mismatch [${ex.id}]: authored "${authored}" but the analysis renders "${rendered}"`,
    )
  }
  const lines = [
    `**${ex.welsh}**  `,
    `${ex.gloss}`,
    '',
    '```text',
    prettyTree(ex.tree, { verdicts: true }),
    '```',
  ]
  if (ex.note) lines.push('', `> ${ex.note}`)
  return lines.join('\n')
}

function triggerTable(): string {
  const rows = (triggersData.frames as {
    lemma: string; grade: string; targetCat?: string[]; targetGender?: string
    targetNumber?: string; targetLexemes?: string[]; _ref?: string
  }[]).map(f => {
    const conds = [
      f.targetCat && `cat ∈ {${f.targetCat.join(', ')}}`,
      f.targetGender && `gender=${f.targetGender}`,
      f.targetNumber && `number=${f.targetNumber}`,
      f.targetLexemes && `lexemes: ${f.targetLexemes.join('/')}`,
    ].filter(Boolean).join('; ') || '—'
    return `| \`${f.lemma}\` | ${f.grade} | ${conds} | ${f._ref ?? ''} |`
  })
  return [
    '| Lemma | Grade | Target conditions | Source |',
    '|---|---|---|---|',
    ...rows,
  ].join('\n')
}

function contestedTable(): string {
  return (contestedData.entries as { id: string; note: string }[])
    .map(e => `- **${e.id}** — ${e.note}`)
    .join('\n')
}

export function buildReport(): string {
  const S = (n: number, title: string) => `\n## ${n}. ${title}\n`
  const examples = (exs: Example[]) => exs.map(assertAndRender).join('\n\n')

  return `<!-- Generated file: edit report/report.ts and report/examples.ts, then npm run report. -->
# Soft Mutation in Colloquial Welsh: A Predictive Account

**Scope.** Prescriptive standard modern **colloquial** Welsh, with Gareth King's
*Modern Welsh: A Comprehensive Grammar* (3rd ed., 2016) as the normative
reference. The account is strictly **predictive**: given a word and its
grammatical context, does it exhibit soft mutation (SM)? The licensing
calculus resolves the full grade system, so aspirate (AM) and nasal (NM)
outcomes — which pre-empt SM — are predicted and asserted alongside it in
every example below. Real spoken usage is
not categorical (Jones, n.d.; Knight et al. 2020) — §7 records where prescription
and usage genuinely diverge. The phonological *content* of mutation (t→d, p→b,
c→g, …) is taken as opaque throughout; only the *trigger conditions* are at
issue. Word-internal mutation under derivational prefixes is out of scope:
prefixed forms are radical lexemes in their own right.
${S(1, 'The heterogeneity thesis')}
Every current theoretical account, whatever its framework, starts from the same
premise: soft mutation has no single cause. Most instances have a lexical or
morphosyntactic trigger, while a distinct residue arises under specifically
syntactic conditions (Tallerman 2006). Green (2003) states the consensus most
bluntly: trigger environments split into proclitic-triggered and
syntax-triggered classes, and *no single generalization covers both* — the full
set is arbitrary, partly item-specific, and dialectally variable. Historically
this arbitrariness is the residue of reanalysis: mutation was once predictable
from pure phonology (the final segment of the preceding word), but by Middle
Welsh it could be predicted only from a list of triggering environments, the
overwhelming majority being individual lexical items acting on the immediately
following word (Willis 2007).

Soft mutation accordingly decomposes into three subsystems, plus two general
exemptions; every mutation below is attributed to exactly the rule that
licenses it (rule labels in parentheses):

1. **Contact triggers** (\`lex:*\`) — a closed class of words governing a
   mutation grade on the immediately following dependent.
2. **Gender marking** (\`gend:*\`) — feminine singular nouns after the article
   and *un*; modifiers agreeing with a feminine singular controller.
3. **Syntactic/positional mutation** (\`synt:*\`) — the XP Trigger Hypothesis
   plus a small set of designated positions.

One constraint spans all three — the **Trigger Constraint** (Breit 2019): every
mutation is licensed by the immediately preceding string element or by a
feature borne by the target itself. Nothing acts at a distance. This is the
strongest cross-cutting invariant in the literature, and every rule below
respects it: each conditions only on the immediately preceding element and on
the word's own resolved features.
${S(2, 'Reading the analyses')}
Each example shows a constituent analysis; numbers on the branches index a
node's daughters. Every word is annotated with its outcome: \`→ SM\`/\`→ AM\`/
\`→ NM\` names the surface grade and the licensing rule; \`→ radical\` names
the reason — \`no-license\` (no rule is in force at that position),
\`veto:no-reflex blocks …\` (a rule is in force, but the word's initial has no
reflex under the grade it governs; the blocked rule is named), or
\`veto:immutable blocks …\` (the word is lexically immutable; the blocked rule
is named). \`⟨N f sg⟩\` gives category and features; \`lemma=\` distinguishes
homographs (the two *yn*, the two *ei*); \`gap:NP\` is an extraction site. In
the Welsh text, \`°\` marks a soft-mutated word; aspirate and nasal shapes
(*nghath*, *cheffyl*) are written plain — every mutated form on the line,
whatever its grade, is derived from the verdict and asserted at build time,
never authored. Annotations appear on *every*
word, so incidental facts (the colloquial mutation of the clause-initial verb,
exemptions on function words) are visible alongside each example's point.
${S(3, 'Contact triggers')}
The majority case (Willis 2007). Each trigger is a lexical entry governing a
grade: full SM; *limited* SM sparing *ll-/rh-* (the article, *un*, predicative
*yn*, *mor* — King §9); AM; NM; the *mixed* grade (AM on *c/p/t*, SM elsewhere —
King §10); or nothing (absence is data: *pob*, *mewn*, *rhwng*, *efo*, *tair*
are recorded as non-triggers rather than omitted). AM and NM triggers matter
to an account of soft mutation because they *pre-empt*: a word governed by an
AM trigger does not soft-mutate. Blocking (King §5d) requires no separate
statement — a trigger acts only on the immediately following word, so an
intervener simply *is* the preceding element.

${examples(SECTIONS[0]!.examples)}
${S(4, 'The gender subsystem')}
Welsh marks gender by mutation rather than affixation. Two environments: the
definite article (and *un*) mutates feminine singular nouns, sparing *ll-/rh-*
(King §28); and modifiers of a feminine singular controller mutate — with *no*
*ll-/rh-* sparing (King §100: *profedigaeth °lem*), so the carve-out is
category-sensitive, not phonological (Green 2003). Agreement is analysed as a
feature borne by the target (Breit 2019), not as adjacency to the noun: that
is what carries adjective chains, and what lets a *prenominal* adjective agree
with a head that follows it. Possessor phrases are systematically immune
despite string adjacency (Mittendorf & Sadler 2006; Dowle 2024) — the
immunity is the *absence of any licensing relation*, a consequence of the
genitive configuration, not an exemption.

${examples(SECTIONS[1]!.examples)}
${S(5, 'Syntactic and positional mutation')}
The theoretically contested residue. Two families competed: Case-based
accounts, on which direct object mutation (DOM) realizes accusative Case
(Zwicky 1984; Roberts 1997, 2005), and the configurational **XP Trigger
Hypothesis** (Harlow 1989; Borsley 1997; Tallerman 2006), on which any phrasal
category triggers SM on the word immediately following its right edge. The
Case account is generally judged to both overgenerate and undergenerate
(Borsley 1997; Tallerman 2006): mutation after subjects hits non-accusative
material (*dim*, adverbs), and objects of nonfinite verbs mutate exactly when
a phrase intervenes (Green 2003) — facts the XPTH derives for free. Stated
geometrically: a phrasal constituent (never a clause) whose right edge
immediately precedes the target and c-commands it licenses \`synt:xp-edge\`.
Extraction gaps count as phrases (Willis 2007 documents the transparency
lineage); following Dowle (2024), no other empty categories are posited.

Two refinements are forced by the data. First, the raw geometry overgenerates
**NP-internally**: in a masculine chain like *ci mawr coch*, AP(*mawr*) ends
immediately before *coch* and c-commands it, yet *coch* is radical. The rule
therefore does not operate between sisters within a noun phrase — Tallerman's
'complement' condition stated configurationally, and exactly Breit's (2019)
division of labor: NP-internal mutation belongs to the gender subsystem alone.
Second, clause-initial finite-verb mutation (\`synt:v1-*\`) is **not
XPTH-derivable even in principle**: nothing precedes a clause-initial verb,
and the negative variant surfaces as *mixed* mutation (AM on *c/p/t*) where
the XPTH only ever produces SM. It is particle-drop residue — affirmative
*fe°/mi°*, interrogative *a°*, negative *ni* (mixed) were deleted, and their
mutations remained (King §481 note; Green 2003 on *ni*). The grade tracks the
vanished particle exactly. In formal literary Welsh the affirmative default is
particle-less and radical, so this entire rule is register-specific (King
§11d): stated as designated clause positions, the difference between registers
is the presence or absence of those positions, not a different theory.
Imperatives resist both v1 mutation and *neu°* (King §512), and so constitute
a category of their own.

${examples(SECTIONS[2]!.examples)}
${S(6, 'Vetoes')}
Two ways a word can be exempt no matter what licenses it: a per-lexeme
immutability flag (King §12: fixed mutations like *beth*; personal names;
g-initial loanwords; miscellaneous grammatical words), and the absence of any
reflex for the word's initial under the governed grade (vowels, *n-*, *s-*,
*ch-*, *ff-* … under SM, King §5a; *ll-/rh-* under the limited-SM grade).
The two are distinguished throughout because they are different theoretical
claims: one is lexical listing, the other phonological vacuity.

${examples(SECTIONS[3]!.examples)}
${S(7, 'Contested territory')}
A predictive account must say where prescription itself is unstable. The
contexts below are catalogued as *contested*: the rules above state the
prescriptive norm, and predictions in these environments should be read with
that caveat. Corpus context: overall prescriptive
application in spontaneous speech runs near 74%, no speaker is categorical,
gender agreement on adjectives applies barely above chance (54%), and the
particle-less finite-verb SM is the most categorical trigger measured (95%) —
consistent with relexicalization of the mutated verb forms (Jones, n.d.;
Knight et al. 2020).

${contestedTable()}
${S(8, 'The full trigger lexicon')}
The complete inventory of contact-trigger conditions, with King references. A
single word may govern several distinct conditions (*y*, *chwe*); grade
\`none\` entries record deliberate non-triggers.

${triggerTable()}
${S(9, 'Known limits')}
- **Adverbial and vocative status must be given, not derived.** Constituent
  geometry provably underdetermines them: sentence-initial adverbial NPs
  mutate while structurally identical fronted objects do not. The distinction
  is adjunct versus argument — a valence/lexical fact every formal account
  takes as input (Dowle 2024 reads it from f-structure); none derives it
  configurationally.
- **Common-noun apposition** shares the genitive configuration [NP N NP] and
  is therefore predicted, wrongly, to pattern with possessors; appositive NPs
  are overwhelmingly personal names (immutable regardless), so the exposure is
  minimal.
- **Coordination** is a known soft spot for the XPTH generally; Welsh
  coordinators happen to begin with mutation-immune segments (*a*, *neu*,
  *ond*, *na*), which masks most of the exposure.
- **Usage variability** (§7) is outside predictive scope by design; a usage
  model would attach per-trigger application rates to the same rule inventory.
- The mixed-mutation grade of the negative relative particle *na* follows
  prescriptive tradition; King's own examples (§481) are grade-ambiguous
  (all on *b/d/g*-initials, where mixed and SM coincide).
${S(10, 'Bibliography')}
- Borsley, R. D. (1997). Mutation and Case in Welsh. *Canadian Journal of
  Linguistics* 42(1–2). <https://www.cambridge.org/core/journals/canadian-journal-of-linguistics-revue-canadienne-de-linguistique/article/abs/mutation-and-case-in-welsh/0E72D77DD54054EC98DE4520A75A1702>
- Borsley, R. D., Tallerman, M. & Willis, D. (2007). *The Syntax of Welsh*.
  Cambridge University Press.
- Breit, F. (2019). *Welsh Mutation and Strict Modularity*. PhD thesis, UCL.
  <https://discovery.ucl.ac.uk/id/eprint/10087726/1/Thesis%20(colour).pdf>
- Dowle, F. (2024). Mutation in Welsh: Syntactic mutation without empty
  categories. *Proceedings of the LFG'24 Conference*, 165–183.
  <https://lfg-proceedings.org/lfg/index.php/main/article/download/53/44/409>
- Green, A. D. (2003). The Celtic Mutations. *ZAS Papers in Linguistics* 32,
  47–86. Rutgers Optimality Archive 652.
  <https://roa.rutgers.edu/files/652-0404/652-GREEN-0-0.PDF>
- Harlow, S. (1989). The syntax of Welsh soft mutation.
  <https://www.academia.edu/21165107/The_syntax_of_Welsh_soft_mutation>
- Jones, B. M. (n.d., post-2022). The soft mutation in spontaneous spoken
  Welsh. Working paper, Aberystwyth University.
  <https://users.aber.ac.uk/bmj/Ymchwil/mutations2.pdf>
- King, G. (2016). *Modern Welsh: A Comprehensive Grammar*, 3rd ed. Routledge.
  [Normative reference for the colloquial standard throughout.]
- Knight, D. et al. (2020). CorCenCC: Corpws Cenedlaethol Cymraeg Cyfoes — the
  National Corpus of Contemporary Welsh. <https://arxiv.org/pdf/2010.05542>
- Mittendorf, I. & Sadler, L. (2006). A Treatment of Welsh Initial Mutation.
  *Proceedings of the LFG06 Conference*, 343–364. CSLI.
  <https://web.stanford.edu/group/cslipublications/cslipublications/LFG/11/pdfs/lfg06mittendorfsadler.pdf>
- Poibeau, T. (2014). Processing Mutations in Breton with Finite-State
  Transducers. *Proceedings of CLTW at COLING 2014*.
  <https://aclanthology.org/W14-4604.pdf> [Sibling-system precedent for the
  finite-state implementability of contact triggers.]
- Roberts, I. (1997). The syntax of direct object mutation in Welsh. *Canadian
  Journal of Linguistics* 42(1–2).
  <https://www.cambridge.org/core/journals/canadian-journal-of-linguistics-revue-canadienne-de-linguistique/article/syntax-of-direct-object-mutation-in-welsh/86DF062A0739CAA8490F281B75593D60>
- Roberts, I. (2005). *Principles and Parameters in a VSO Language: A Case
  Study in Welsh*. Oxford University Press.
- Tallerman, M. (2006). The syntax of Welsh "direct object mutation"
  revisited. *Lingua* 116(11).
  <https://www.sciencedirect.com/science/article/abs/pii/S0024384105000859>
- Willis, D. (2007). Syntactic change: the diachrony chapter of Borsley,
  Tallerman & Willis (2007). Draft: <https://davidwillis.net/diachrony.pdf>
- Zwicky, A. (1984). Welsh Soft Mutation and the Case of Object NPs.
  *Proceedings of CLS 20*, 387–402.
  <https://web.stanford.edu/~zwicky/welsh-soft-mutation.pdf>
`
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href
if (isMain || process.argv[1]?.endsWith('report/report.ts')) {
  const md = buildReport()
  const out = new URL('../../REPORT.md', import.meta.url) // repo root
  writeFileSync(fileURLToPath(out), md)
  console.log(`REPORT.md written (${md.length} chars)`)
}
