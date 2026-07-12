/**
 * The report's example corpus. Every target's expected verdict is asserted
 * at build time (report.ts), so the generated document cannot drift from the
 * analysis it presents. (Build machinery is invisible in the document itself.)
 */

import { clause, gap, leaf, phrase, type TreeNode, type TreePath } from '../src/tree.ts'
import type { NoMutationReason, RuleId } from '../src/types.ts'

export interface ExampleTarget {
  path: TreePath
  /** RuleId[] = must mutate with exactly this provenance; otherwise the
   *  expected no-mutation reason. */
  expect: RuleId[] | NoMutationReason
}
export interface Example {
  id: string
  /** Welsh surface form, mutations marked with ° on the mutated word. */
  welsh: string
  gloss: string
  tree: TreeNode
  targets: ExampleTarget[]
  note?: string
}

import { LEXICON as L } from '../src/lexicon.ts'

export const CONTACT: Example[] = [
  {
    id: 'prep-i',
    welsh: 'i °dŷ',
    gloss: "'to a house' — the preposition i° governs SM on its dependent (King §460)",
    tree: phrase('PP', [leaf(L.i), phrase('NP', [leaf(L.ty)])]),
    targets: [{ path: [1, 0], expect: ['lex:i'] }],
  },
  {
    id: 'poss-dy',
    welsh: 'dy °gath',
    gloss: "'your cat' — 2sg possessive dy° (King §111)",
    tree: phrase('NP', [leaf(L.dy), leaf(L.cath)]),
    targets: [{ path: [1], expect: ['lex:dy'] }],
  },
  {
    id: 'poss-ei-contrast',
    welsh: 'ei °gath e — ei chath hi',
    gloss: "'his cat' (SM) vs 'her cat' (AM — outside soft mutation) — one orthographic word, two lemmas, two grades (King §112)",
    tree: phrase('NP', [leaf(L.ei, 'ei.3sgm'), leaf(L.cath), leaf(L.e)]),
    targets: [{ path: [1], expect: ['lex:ei.3sgm'] }],
    note: "As `ei.3sgf` the governed grade is AM: the same position shows `radical (no-license)` — 'her' never soft-mutates.",
  },
  {
    id: 'poss-fy',
    welsh: 'fy nghath',
    gloss: "'my cat' — fy governs NM, so soft mutation is correctly withheld (King §110)",
    tree: phrase('NP', [leaf(L.fy), leaf(L.cath, undefined, 'nghath')]),
    targets: [{ path: [1], expect: 'no-license' }],
  },
  {
    id: 'mor-limited',
    welsh: 'mor °fach — mor llawn',
    gloss: "'so small' vs 'so full' — mor° is limited SM: it spares ll-/rh- (King §105e)",
    tree: phrase('AP', [leaf(L.mor), leaf(L.bach)]),
    targets: [{ path: [1], expect: ['lex:mor'] }],
    note: 'Substituting llawn (ll-) at the same position yields `radical (no-license)`: the SM-ltd grade has no reflex for ll-/rh-.',
  },
  {
    id: 'mor-ll',
    welsh: 'mor llawn',
    gloss: "'so full' — the ll- target resists the limited-SM trigger",
    tree: phrase('AP', [leaf(L.mor), leaf(L.llawn)]),
    targets: [{ path: [1], expect: 'no-license' }],
  },
  {
    id: 'num-dwy-tair',
    welsh: 'dwy °gath — tair cath',
    gloss: "'two cats' vs 'three cats' — dwy° governs SM, tair governs nothing (King §162)",
    tree: phrase('NP', [leaf(L.dwy), leaf(L.cath)]),
    targets: [{ path: [1], expect: ['lex:dwy'] }],
  },
  {
    id: 'num-tair',
    welsh: 'tair cath',
    gloss: "'three cats' — feminine tair is always followed by the radical (King §162c)",
    tree: phrase('NP', [leaf(L.tair), leaf(L.cath)]),
    targets: [{ path: [1], expect: 'no-license' }],
  },
  {
    id: 'chwe-am',
    welsh: 'chwe cheffyl',
    gloss: "'six horses' — chwe governs AM, never SM (King §162e)",
    tree: phrase('NP', [leaf(L.chwe), leaf(L.ceffyl, undefined, 'cheffyl')]),
    targets: [{ path: [1], expect: 'no-license' }],
  },
  {
    id: 'chwe-nm',
    welsh: 'chwe mlynedd — dwy °flynedd',
    gloss: "'six years' (NM via the year-word frame) vs 'two years' (plain SM) — one lemma, two frames (King §176)",
    tree: phrase('NP', [leaf(L.chwe), leaf(L.blynedd, undefined, 'mlynedd')]),
    targets: [{ path: [1], expect: 'no-license' }],
    note: 'chwe governs two distinct conditions: AM generally, NM restricted to blwydd/blynedd/diwrnod. Neither yields SM. dwy °flynedd (example above) shows the same noun soft-mutating after a genuine SM trigger.',
  },
  {
    id: 'hen-prenominal',
    welsh: 'hen °ddyn',
    gloss: "'an old man' — prenominal adjectives govern SM (King §96)",
    tree: phrase('NP', [leaf(L.hen), leaf(L.dyn)]),
    targets: [{ path: [1], expect: ['lex:hen'] }],
  },
  {
    id: 'pob-nontrigger',
    welsh: 'pob dyn',
    gloss: "'every man' — pob is the one prenominal adjective that governs nothing (King §97)",
    tree: phrase('NP', [leaf(L.pob), leaf(L.dyn)]),
    targets: [{ path: [1], expect: 'no-license' }],
  },
  {
    id: 'neu-sm',
    welsh: 'cath neu °gi',
    gloss: "'a cat or a dog' — neu° governs SM on the second conjunct (King §512)",
    tree: phrase('NP', [phrase('NP', [leaf(L.cath)]), leaf(L.neu), phrase('NP', [leaf(L.ci)])]),
    targets: [{ path: [2, 0], expect: ['lex:neu'] }],
  },
  {
    id: 'neu-blocked',
    welsh: "y °gath neu'r ci",
    gloss: "'the cat or the dog' — the article 'r intervenes and blocking follows from string adjacency (King §5d)",
    tree: phrase('NP', [
      phrase('NP', [leaf(L.y), leaf(L.cath)]),
      leaf(L.neu),
      phrase('NP', [leaf(L.y, 'y', "'r"), leaf(L.ci)]),
    ]),
    targets: [
      { path: [0, 1], expect: ['gend:art-fem-sg'] },
      { path: [2, 1], expect: 'no-license' },
    ],
    note: "No blocking statement is needed: 'r simply IS the preceding element, and the condition it governs (feminine singular nouns) does not extend to masculine ci.",
  },
]

export const GENDER: Example[] = [
  {
    id: 'art-fem',
    welsh: 'y °gath — y llong — y plant',
    gloss: "'the cat / the ship / the children' — the article mutates feminine singulars only, sparing ll-/rh- (King §28)",
    tree: phrase('NP', [leaf(L.y), leaf(L.cath)]),
    targets: [{ path: [1], expect: ['gend:art-fem-sg'] }],
  },
  {
    id: 'art-ll',
    welsh: 'y llong',
    gloss: "'the ship' — feminine singular in ll- resists the article (King §28 note b)",
    tree: phrase('NP', [leaf(L.y), leaf(L.llong)]),
    targets: [{ path: [1], expect: 'no-license' }],
  },
  {
    id: 'art-pl',
    welsh: 'y cathod',
    gloss: "'the cats' — feminine plurals pattern with masculines: no mutation (King §28)",
    tree: phrase('NP', [leaf(L.y), leaf(L.cathod)]),
    targets: [{ path: [1], expect: 'no-license' }],
  },
  {
    id: 'art-dau',
    welsh: 'y °ddau °gi',
    gloss: "'the two dogs, both dogs' — the article's second frame mutates the numerals dau/dwy, which then trigger in turn (King §29)",
    tree: phrase('NP', [leaf(L.y), leaf(L.dau), leaf(L.ci)]),
    targets: [
      { path: [1], expect: ['lex:y'] },
      { path: [2], expect: ['lex:dau'] },
    ],
  },
  {
    id: 'adj-agr',
    welsh: 'cath °fach',
    gloss: "'a little cat' — adjectives agree with a feminine singular controller (King §102)",
    tree: phrase('NP', [leaf(L.cath), phrase('AP', [leaf(L.bach)])]),
    targets: [{ path: [1, 0], expect: ['gend:agr-mod'] }],
  },
  {
    id: 'adj-chain',
    welsh: 'y °ferch °fach °wen',
    gloss: "'the little white girl' — the second adjective is not adjacent to the noun, yet mutates: agreement is a feature borne by the target (Breit 2019), not a contact effect",
    tree: phrase('NP', [leaf(L.y), leaf(L.merch), phrase('AP', [leaf(L.bach)]), phrase('AP', [leaf(L.gwyn, undefined, 'gwen')])]),
    targets: [
      { path: [1], expect: ['gend:art-fem-sg'] },
      { path: [2, 0], expect: ['gend:agr-mod'] },
      { path: [3, 0], expect: ['gend:agr-mod'] },
    ],
  },
  {
    id: 'masc-chain',
    welsh: 'ci mawr coch',
    gloss: "'a big red dog' — masculine chains show no mutation anywhere; this datum forces the NP-internal exclusion on the syntactic subsystem (see §5)",
    tree: phrase('NP', [leaf(L.ci), phrase('AP', [leaf(L.mawr)]), phrase('AP', [leaf(L.coch)])]),
    targets: [
      { path: [1, 0], expect: 'no-license' },
      { path: [2, 0], expect: 'no-license' },
    ],
  },
  {
    id: 'prenominal-agr',
    welsh: 'y °brif °ddinas',
    gloss: "'the capital city' — the PREnominal adjective agrees with a FOLLOWING feminine head; agreement looks rightward within the NP",
    tree: phrase('NP', [leaf(L.y), leaf(L.prif), leaf(L.dinas)]),
    targets: [
      { path: [1], expect: ['gend:agr-mod'] },
      { path: [2], expect: ['lex:prif'] },
    ],
  },
  {
    id: 'possessor-immune',
    welsh: 'cath merch',
    gloss: "'a girl's cat' — the possessor is immune despite string adjacency to a feminine noun (Mittendorf & Sadler 2006; Dowle 2024)",
    tree: phrase('NP', [leaf(L.cath), phrase('NP', [leaf(L.merch)])]),
    targets: [{ path: [1, 0], expect: 'no-license' }],
    note: 'Derived, not stipulated: in the genitive configuration [NP N NP] the second nominal stands in the possessor relation, and possessors fall outside every licensing relation.',
  },
  {
    id: 'genitive-internal',
    welsh: 'canol y °dre',
    gloss: "'the town centre' — immunity applies to the possessor boundary, not to the possessor's inside: the article still fires within it",
    tree: phrase('NP', [leaf(L.canol), phrase('NP', [leaf(L.y), leaf(L.tre)])]),
    targets: [{ path: [1, 1], expect: ['gend:art-fem-sg'] }],
  },
]

export const SYNTACTIC: Example[] = [
  {
    id: 'dom-basic',
    welsh: '°Welodd Mair °dŷ',
    gloss: "'Mair saw a house' — direct object mutation: the subject NP's right edge licenses the object, not the verb (Harlow 1989; Borsley 1997; Tallerman 2006)",
    tree: clause('S', [leaf(L.gweld, undefined, 'gwelodd'), phrase('NP', [leaf(L.Mair)]), phrase('NP', [leaf(L.ty)])]),
    targets: [
      { path: [0], expect: ['synt:v1-aff'] },
      { path: [2, 0], expect: ['synt:xp-edge'] },
    ],
    note: 'The verb carries its own, independent mutation: colloquial clause-initial SM (§5 below). In the literary register the verb stands radical — Gwelodd Mair °dŷ — which is how the classic examples are cited in the theoretical literature; the object mutation is identical in both registers.',
  },
  {
    id: 'dom-periphrastic',
    welsh: 'Roedd dyn wedi prynu beic',
    gloss: "'A man had bought a bike' — the object of a NON-finite verb stays radical: no phrase edge precedes it",
    tree: clause('S', [
      leaf(L.roedd, undefined, 'roedd'),
      phrase('NP', [leaf(L.dyn)]),
      leaf(L.wedi),
      phrase('VNP', [leaf(L.prynu), phrase('NP', [leaf(L.beic)])]),
    ]),
    targets: [{ path: [3, 1, 0], expect: 'no-license' }],
  },
  {
    id: 'dom-intervening-pp',
    welsh: 'Roedd dyn wedi prynu yn y °dre °feic',
    gloss: "'A man had bought, in town, a bike' — the decisive datum for the configurational account: an intervening PP restores mutation on the nonfinite object (Green 2003)",
    tree: clause('S', [
      leaf(L.roedd, undefined, 'roedd'),
      phrase('NP', [leaf(L.dyn)]),
      leaf(L.wedi),
      phrase('VNP', [
        leaf(L.prynu),
        phrase('PP', [leaf(L.yn, 'yn.loc'), phrase('NP', [leaf(L.y), leaf(L.tre)])]),
        phrase('NP', [leaf(L.beic)]),
      ]),
    ]),
    targets: [{ path: [3, 2, 0], expect: ['synt:xp-edge'] }],
  },
  {
    id: 'dom-fronted',
    welsh: 'Beic °brynodd y °ddynes',
    gloss: "'It was a bike the woman bought' — the fronted object has nothing before it and stays radical; a Case-based account must stipulate this (Tallerman 2006 contra Roberts 1997)",
    tree: clause('S', [
      phrase('NP', [leaf(L.beic)]),
      leaf(L.prynodd, undefined, 'prynodd'),
      phrase('NP', [leaf(L.y), leaf(L.dynes)]),
    ]),
    targets: [{ path: [0, 0], expect: 'no-license' }],
  },
  {
    id: 'dom-gap',
    welsh: 'Pwy °welodd °ddraig?',
    gloss: "'Who saw a dragon?' — the extraction gap occupies the subject position and counts as a phrase edge; the verb's own SM (°welodd < gwelodd) comes from the fronted wh-phrase's edge",
    tree: clause('S', [
      phrase('NP', [leaf(L.pwy)]),
      leaf(L.gweld, undefined, 'gwelodd'),
      gap('NP'),
      phrase('NP', [leaf(L.draig)]),
    ]),
    targets: [{ path: [3, 0], expect: ['synt:xp-edge'] }],
  },
  {
    id: 'xp-pp',
    welsh: 'Rhaid i Emrys °fynd',
    gloss: "'Emrys must go' — the PP's right edge c-commands and licenses the verbal noun; King files this under 'sentence construction' (§5e: unblockable), for the XPTH it is the same rule as DOM",
    tree: clause('S', [
      leaf(L.rhaid),
      phrase('PP', [leaf(L.i), phrase('NP', [leaf(L.Emrys)])]),
      phrase('VNP', [leaf(L.mynd)]),
    ]),
    targets: [{ path: [2, 0], expect: ['synt:xp-edge'] }],
  },
  {
    id: 'dom-article',
    welsh: "°Golles i'r tocyn",
    gloss: "'I lost the ticket' — DOM lands on the first WORD of the object; here that is the article (no SM reflex), so the noun stays radical",
    tree: clause('S', [
      leaf(L.colli, undefined, 'colles'),
      phrase('NP', [leaf(L.i_pron)]),
      phrase('NP', [leaf(L.y, 'y', "'r"), leaf(L.tocyn)]),
    ]),
    targets: [
      { path: [0], expect: ['synt:v1-aff'] },
      { path: [2, 1], expect: 'no-license' },
    ],
  },
  {
    id: 'post-subject-dim',
    welsh: '°Ddylset ti °ddim',
    gloss: "'You shouldn't' — two mutations, two subsystems: mixed particle-residue on the negative verb, subject-edge SM on dim (King §§10, 11a)",
    tree: clause('S', [leaf(L.dylu, undefined, 'dylset'), phrase('NP', [leaf(L.ti)]), leaf(L.dim)], 'neg'),
    targets: [
      { path: [0], expect: ['synt:v1-neg-mixed'] },
      { path: [2], expect: ['synt:xp-edge'] },
    ],
  },
  {
    id: 'v1-neg-am',
    welsh: 'Pharith hi °ddim',
    gloss: "'It won't last' — the negative v1 grade is MIXED: AM on p-, so no soft mutation; the grade tracks the dropped particle ni (King §10)",
    tree: clause('S', [leaf(L.para, undefined, 'pharith'), phrase('NP', [leaf(L.hi)]), leaf(L.dim)], 'neg'),
    targets: [{ path: [0], expect: 'no-license' }],
  },
  {
    id: 'v1-shielded',
    welsh: 'os daw e',
    gloss: "'if he comes' — the subordinator occupies clause-initial position, so the verb is not v1 and stays radical (King §502)",
    tree: clause('S', [leaf(L.os), leaf(L.dod, undefined, 'daw'), phrase('NP', [leaf(L.e)])]),
    targets: [{ path: [1], expect: 'no-license' }],
  },
  {
    id: 'adv-np',
    welsh: '°Ddwy °flynedd yn ôl aeth hi adre',
    gloss: "'Two years ago she went home' — adverbial NPs mutate at their first word (King §11b); note the structurally identical fronted object (dom-fronted) does NOT — the difference is adjunct-vs-argument status, not configuration",
    tree: clause('S', [
      phrase('NP', [leaf(L.dwy), leaf(L.blynedd), leaf(L.yn_ol)], 'adverbial'),
      leaf(L.aeth, undefined, 'aeth'),
      phrase('NP', [leaf(L.hi)]),
      leaf(L.adre),
    ]),
    targets: [
      { path: [0, 0], expect: ['synt:adv-np'] },
      { path: [0, 1], expect: ['lex:dwy'] },
    ],
  },
  {
    id: 'vocative',
    welsh: 'Dewch, °blant!',
    gloss: "'Come, children!' — vocative mutation (King §11c); the imperative verb itself stays radical: imperatives resist v1 mutation",
    tree: clause('S', [leaf(L.dewch, undefined, 'dewch'), phrase('NP', [leaf(L.plant)], 'vocative')]),
    targets: [
      { path: [0], expect: 'no-license' },
      { path: [1, 0], expect: ['synt:vocative'] },
    ],
  },
]

export const VETOES: Example[] = [
  {
    id: 'veto-loanword',
    welsh: 'dy gêm',
    gloss: "'your game' — g-initial loanwords are immutable even under a live trigger (King §12e)",
    tree: phrase('NP', [leaf(L.dy), leaf(L.gem)]),
    targets: [{ path: [1], expect: 'veto:immutable' }],
  },
  {
    id: 'veto-name',
    welsh: 'i Dafydd',
    gloss: "'to Dafydd' — personal names do not mutate in the modern language (King §12d, §36)",
    tree: phrase('PP', [leaf(L.i), phrase('NP', [leaf(L.Dafydd)])]),
    targets: [{ path: [1, 0], expect: 'veto:immutable' }],
  },
  {
    id: 'veto-no-reflex',
    welsh: 'i ysgol',
    gloss: "'to school' — vowel-initial words have no SM reflex; the question does not arise (King §5a)",
    tree: phrase('PP', [leaf(L.i), phrase('NP', [leaf(L.ysgol)])]),
    targets: [{ path: [1, 0], expect: 'veto:no-reflex' }],
  },
]

export const SECTIONS: { title: string; examples: Example[] }[] = [
  { title: 'Contact triggers', examples: CONTACT },
  { title: 'The gender subsystem', examples: GENDER },
  { title: 'Syntactic and positional mutation', examples: SYNTACTIC },
  { title: 'Vetoes', examples: VETOES },
]
