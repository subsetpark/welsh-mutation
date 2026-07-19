<!-- Generated file: edit report/report.ts and report/examples.ts, then npm run report. -->
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

## 1. The heterogeneity thesis

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

1. **Contact triggers** (`lex:*`) — a closed class of words governing a
   mutation grade on the immediately following dependent.
2. **Gender marking** (`gend:*`) — feminine singular nouns after the article
   and *un*; modifiers agreeing with a feminine singular controller.
3. **Syntactic/positional mutation** (`synt:*`) — the XP Trigger Hypothesis
   plus a small set of designated positions.

One constraint spans all three — the **Trigger Constraint** (Breit 2019): every
mutation is licensed by the immediately preceding string element or by a
feature borne by the target itself. Nothing acts at a distance. This is the
strongest cross-cutting invariant in the literature, and every rule below
respects it: each conditions only on the immediately preceding element and on
the word's own resolved features.

## 2. Reading the analyses

Each example shows a constituent analysis; numbers on the branches index a
node's daughters. Every word is annotated with its outcome: `→ SM`/`→ AM`/
`→ NM` names the surface grade and the licensing rule; `→ radical` names
the reason — `no-license` (no rule is in force at that position),
`veto:no-reflex blocks …` (a rule is in force, but the word's initial has no
reflex under the grade it governs; the blocked rule is named), or
`veto:immutable blocks …` (the word is lexically immutable; the blocked rule
is named). `⟨N f sg⟩` gives category and features; `lemma=` distinguishes
homographs (the two *yn*, the two *ei*); `gap:NP` is an extraction site. In
the Welsh text, `°` marks a soft-mutated word; aspirate and nasal shapes
(*nghath*, *cheffyl*) are written plain — every mutated form on the line,
whatever its grade, is derived from the verdict and asserted at build time,
never authored. Annotations appear on *every*
word, so incidental facts (the colloquial mutation of the clause-initial verb,
exemptions on function words) are visible alongside each example's point.

## 3. Contact triggers

The majority case (Willis 2007). Each trigger is a lexical entry governing a
grade: full SM; *limited* SM sparing *ll-/rh-* (the article, *un*, predicative
*yn*, *mor* — King §9); AM; NM; the *mixed* grade (AM on *c/p/t*, SM elsewhere —
King §10); or nothing (absence is data: *pob*, *mewn*, *rhwng*, *efo*, *tair*
are recorded as non-triggers rather than omitted). AM and NM triggers matter
to an account of soft mutation because they *pre-empt*: a word governed by an
AM trigger does not soft-mutate. Blocking (King §5d) requires no separate
statement — a trigger acts only on the immediately following word, so an
intervener simply *is* the preceding element.

**i °dŷ**  
'to a house' — the preposition i° governs SM on its dependent (King §460)

```text
PP
├─0 i ⟨Other⟩ → radical (no-license)
└─1 NP
   └─0 tŷ ⟨N m sg⟩ → SM (lex:i)
```

**dy °gath**  
'your cat' — 2sg possessive dy° (King §111)

```text
NP
├─0 dy ⟨Other⟩ immutable → radical (no-license)
└─1 cath ⟨N f sg⟩ → SM (lex:dy)
```

**ei °gath e — ei chath hi**  
'his cat' (SM) vs 'her cat' (AM — outside soft mutation) — one orthographic word, two lemmas, two grades (King §112)

```text
NP
├─0 ei ⟨Other⟩ lemma=ei.3sgm → radical (no-license)
├─1 cath ⟨N f sg⟩ → SM (lex:ei.3sgm)
└─2 e ⟨Other⟩ → radical (no-license)
```

> As `ei.3sgf` the governed grade is AM: the same position shows `AM (lex:ei.3sgf)` — 'her' never soft-mutates.

**fy nghath**  
'my cat' — fy governs NM (King §110); the nasal shape nghath is derived from the verdict, and soft mutation is correctly withheld

```text
NP
├─0 fy ⟨Other⟩ → radical (no-license)
└─1 cath ⟨N f sg⟩ → NM (lex:fy)
```

**mor °fach — mor llawn**  
'so small' vs 'so full' — mor° is limited SM: it spares ll-/rh- (King §105e)

```text
AP
├─0 mor ⟨Adv⟩ immutable → radical (no-license)
└─1 bach ⟨Adj⟩ → SM (lex:mor)
```

> Substituting llawn (ll-) at the same position yields `radical (veto:no-reflex blocks lex:mor)`: the SM-ltd grade has no reflex for ll-/rh-.

**mor llawn**  
'so full' — the ll- target resists the limited-SM trigger; the veto reports the silenced rule counterfactually

```text
AP
├─0 mor ⟨Adv⟩ immutable → radical (no-license)
└─1 llawn ⟨Adj⟩ → radical (veto:no-reflex blocks lex:mor)
```

**dwy °gath — tair cath**  
'two cats' vs 'three cats' — dwy° governs SM, tair governs nothing (King §162)

```text
NP
├─0 dwy ⟨Num⟩ → radical (no-license)
└─1 cath ⟨N f sg⟩ → SM (lex:dwy)
```

**tair cath**  
'three cats' — feminine tair is always followed by the radical (King §162c)

```text
NP
├─0 tair ⟨Num⟩ → radical (no-license)
└─1 cath ⟨N f sg⟩ → radical (no-license)
```

**chwe cheffyl**  
'six horses' — chwe governs AM, never SM (King §162e); cheffyl is derived from the verdict

```text
NP
├─0 chwe ⟨Num⟩ → radical (no-license)
└─1 ceffyl ⟨N m sg⟩ → AM (lex:chwe)
```

**chwe mlynedd — dwy °flynedd**  
'six years' (NM via the year-word frame) vs 'two years' (plain SM) — one lemma, two frames (King §176)

```text
NP
├─0 chwe ⟨Num⟩ → radical (no-license)
└─1 blynedd ⟨N f sg⟩ → NM (lex:chwe)
```

> chwe governs two distinct conditions: AM generally, NM restricted to blwydd/blynedd/diwrnod. On blynedd only the NM frame has a reflex. Neither yields SM. dwy °flynedd (example above) shows the same noun soft-mutating after a genuine SM trigger.

**hen °ddyn**  
'an old man' — prenominal adjectives govern SM (King §96)

```text
NP
├─0 hen ⟨Adj⟩ → radical (no-license)
└─1 dyn ⟨N m sg⟩ → SM (lex:hen)
```

**pob dyn**  
'every man' — pob is the one prenominal adjective that governs nothing (King §97)

```text
NP
├─0 pob ⟨Other⟩ → radical (no-license)
└─1 dyn ⟨N m sg⟩ → radical (no-license)
```

**cath neu °gi**  
'a cat or a dog' — neu° governs SM on the second conjunct (King §512)

```text
NP
├─0 NP
│  └─0 cath ⟨N f sg⟩ → radical (no-license)
├─1 neu ⟨Other⟩ → radical (no-license)
└─2 NP
   └─0 ci ⟨N m sg⟩ → SM (lex:neu)
```

**y °gath neu'r ci**  
'the cat or the dog' — the article 'r intervenes and blocking follows from string adjacency (King §5d)

```text
NP
├─0 NP
│  ├─0 y ⟨Other⟩ → radical (no-license)
│  └─1 cath ⟨N f sg⟩ → SM (gend:art-fem-sg)
├─1 neu ⟨Other⟩ → radical (no-license)
└─2 NP
   ├─0 'r ⟨Other⟩ → radical (veto:no-reflex blocks lex:neu)
   └─1 ci ⟨N m sg⟩ → radical (no-license)
```

> No blocking statement is needed: 'r simply IS the preceding element, and the condition it governs (feminine singular nouns) does not extend to masculine ci.

## 4. The gender subsystem

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

**y °gath — y llong — y plant**  
'the cat / the ship / the children' — the article mutates feminine singulars only, sparing ll-/rh- (King §28)

```text
NP
├─0 y ⟨Other⟩ → radical (no-license)
└─1 cath ⟨N f sg⟩ → SM (gend:art-fem-sg)
```

**y llong**  
'the ship' — feminine singular in ll- resists the article (King §28 note b): the frame fires, ll- has no reflex under its limited grade

```text
NP
├─0 y ⟨Other⟩ → radical (no-license)
└─1 llong ⟨N f sg⟩ → radical (veto:no-reflex blocks gend:art-fem-sg)
```

**y cathod**  
'the cats' — feminine plurals pattern with masculines: no mutation (King §28)

```text
NP
├─0 y ⟨Other⟩ → radical (no-license)
└─1 cathod ⟨N f pl⟩ → radical (no-license)
```

**y °ddau °gi**  
'the two dogs, both dogs' — the article's second frame mutates the numerals dau/dwy, which then trigger in turn (King §29)

```text
NP
├─0 y ⟨Other⟩ → radical (no-license)
├─1 dau ⟨Num⟩ → SM (lex:y)
└─2 ci ⟨N m sg⟩ → SM (lex:dau)
```

**cath °fach**  
'a little cat' — adjectives agree with a feminine singular controller (King §102)

```text
NP
├─0 cath ⟨N f sg⟩ → radical (no-license)
└─1 AP
   └─0 bach ⟨Adj⟩ → SM (gend:agr-mod)
```

**y °ferch °fach °wen**  
'the little white girl' — the second adjective is not adjacent to the noun, yet mutates: agreement is a feature borne by the target (Breit 2019), not a contact effect

```text
NP
├─0 y ⟨Other⟩ → radical (no-license)
├─1 merch ⟨N f sg⟩ → SM (gend:art-fem-sg)
├─2 AP
│  └─0 bach ⟨Adj⟩ → SM (gend:agr-mod)
└─3 AP
   └─0 gwen ⟨Adj⟩ → SM (gend:agr-mod)
```

**ci mawr coch**  
'a big red dog' — masculine chains show no mutation anywhere; this datum forces the NP-internal exclusion on the syntactic subsystem (see §5)

```text
NP
├─0 ci ⟨N m sg⟩ → radical (no-license)
├─1 AP
│  └─0 mawr ⟨Adj⟩ → radical (no-license)
└─2 AP
   └─0 coch ⟨Adj⟩ → radical (no-license)
```

**y °brif °ddinas**  
'the capital city' — the PREnominal adjective agrees with a FOLLOWING feminine head; agreement looks rightward within the NP

```text
NP
├─0 y ⟨Other⟩ → radical (no-license)
├─1 prif ⟨Adj⟩ → SM (gend:agr-mod)
└─2 dinas ⟨N f sg⟩ → SM (lex:prif)
```

**cath merch**  
'a girl's cat' — the possessor is immune despite string adjacency to a feminine noun (Mittendorf & Sadler 2006; Dowle 2024)

```text
NP
├─0 cath ⟨N f sg⟩ → radical (no-license)
└─1 NP
   └─0 merch ⟨N f sg⟩ → radical (no-license)
```

> Derived, not stipulated: in the genitive configuration [NP N NP] the second nominal stands in the possessor relation, and possessors fall outside every licensing relation.

**canol y °dre**  
'the town centre' — immunity applies to the possessor boundary, not to the possessor's inside: the article still fires within it

```text
NP
├─0 canol ⟨N m sg⟩ → radical (no-license)
└─1 NP
   ├─0 y ⟨Other⟩ → radical (no-license)
   └─1 tre ⟨N f sg⟩ → SM (gend:art-fem-sg)
```

## 5. Syntactic and positional mutation

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
immediately precedes the target and c-commands it licenses `synt:xp-edge`.
Extraction gaps count as phrases (Willis 2007 documents the transparency
lineage); following Dowle (2024), no other empty categories are posited.

Two refinements are forced by the data. First, the raw geometry overgenerates
**NP-internally**: in a masculine chain like *ci mawr coch*, AP(*mawr*) ends
immediately before *coch* and c-commands it, yet *coch* is radical. The rule
therefore does not operate between sisters within a noun phrase — Tallerman's
'complement' condition stated configurationally, and exactly Breit's (2019)
division of labor: NP-internal mutation belongs to the gender subsystem alone.
Second, clause-initial finite-verb mutation (`synt:v1-*`) is **not
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

**°Welodd Mair °dŷ**  
'Mair saw a house' — direct object mutation: the subject NP's right edge licenses the object, not the verb (Harlow 1989; Borsley 1997; Tallerman 2006)

```text
S
├─0 gwelodd ⟨V⟩ → SM (synt:v1-aff)
├─1 NP
│  └─0 Mair ⟨N⟩ immutable → radical (no-license)
└─2 NP
   └─0 tŷ ⟨N m sg⟩ → SM (synt:xp-edge)
```

> The verb carries its own, independent mutation: colloquial clause-initial SM (§5 below). In the literary register the verb stands radical — Gwelodd Mair °dŷ — which is how the classic examples are cited in the theoretical literature; the object mutation is identical in both registers.

**Roedd dyn wedi prynu beic**  
'A man had bought a bike' — the object of a NON-finite verb stays radical: no phrase edge precedes it

```text
S
├─0 roedd ⟨V⟩ → radical (veto:no-reflex blocks synt:v1-aff)
├─1 NP
│  └─0 dyn ⟨N m sg⟩ → radical (no-license)
├─2 wedi ⟨Prt⟩ → radical (veto:no-reflex blocks synt:xp-edge)
└─3 VNP
   ├─0 prynu ⟨Vnoun⟩ → radical (no-license)
   └─1 NP
      └─0 beic ⟨N m sg⟩ → radical (no-license)
```

**Roedd dyn wedi prynu yn y °dre °feic**  
'A man had bought, in town, a bike' — the decisive datum for the configurational account: an intervening PP restores mutation on the nonfinite object (Green 2003)

```text
S
├─0 roedd ⟨V⟩ → radical (veto:no-reflex blocks synt:v1-aff)
├─1 NP
│  └─0 dyn ⟨N m sg⟩ → radical (no-license)
├─2 wedi ⟨Prt⟩ → radical (veto:no-reflex blocks synt:xp-edge)
└─3 VNP
   ├─0 prynu ⟨Vnoun⟩ → radical (no-license)
   ├─1 PP
   │  ├─0 yn ⟨Other⟩ lemma=yn.loc → radical (no-license)
   │  └─1 NP
   │     ├─0 y ⟨Other⟩ → radical (veto:no-reflex blocks lex:yn.loc)
   │     └─1 tre ⟨N f sg⟩ → SM (gend:art-fem-sg)
   └─2 NP
      └─0 beic ⟨N m sg⟩ → SM (synt:xp-edge)
```

**Beic °brynodd y °ddynes**  
'It was a bike the woman bought' — the fronted object has nothing before it and stays radical; a Case-based account must stipulate this (Tallerman 2006 contra Roberts 1997)

```text
S
├─0 NP
│  └─0 beic ⟨N m sg⟩ → radical (no-license)
├─1 prynodd ⟨V⟩ → SM (synt:xp-edge)
└─2 NP
   ├─0 y ⟨Other⟩ → radical (no-license)
   └─1 dynes ⟨N f sg⟩ → SM (gend:art-fem-sg)
```

**Pwy °welodd °ddraig?**  
'Who saw a dragon?' — the extraction gap occupies the subject position and counts as a phrase edge; the verb's own SM (°welodd < gwelodd) comes from the fronted wh-phrase's edge

```text
S
├─0 NP
│  └─0 pwy ⟨Other⟩ → radical (no-license)
├─1 gwelodd ⟨V⟩ → SM (synt:xp-edge)
├─2 gap:NP
└─3 NP
   └─0 draig ⟨N f sg⟩ → SM (synt:xp-edge)
```

**Rhaid i Emrys °fynd**  
'Emrys must go' — the PP's right edge c-commands and licenses the verbal noun; King files this under 'sentence construction' (§5e: unblockable), for the XPTH it is the same rule as DOM

```text
S
├─0 rhaid ⟨N⟩ → radical (no-license)
├─1 PP
│  ├─0 i ⟨Other⟩ → radical (no-license)
│  └─1 NP
│     └─0 Emrys ⟨N⟩ immutable → radical (veto:no-reflex blocks lex:i)
└─2 VNP
   └─0 mynd ⟨Vnoun⟩ → SM (synt:xp-edge)
```

**°Golles i'r tocyn**  
'I lost the ticket' — DOM lands on the first WORD of the object; here that is the article (no SM reflex), so the noun stays radical

```text
S
├─0 colles ⟨V⟩ → SM (synt:v1-aff)
├─1 NP
│  └─0 i ⟨Other⟩ → radical (no-license)
└─2 NP
   ├─0 'r ⟨Other⟩ → radical (veto:no-reflex blocks synt:xp-edge)
   └─1 tocyn ⟨N m sg⟩ → radical (no-license)
```

**°Ddylset ti °ddim**  
'You shouldn't' — two mutations, two subsystems: mixed particle-residue on the negative verb, subject-edge SM on dim (King §§10, 11a)

```text
S (neg)
├─0 dylset ⟨V⟩ → SM (synt:v1-neg-mixed)
├─1 NP
│  └─0 ti ⟨Other⟩ immutable → radical (no-license)
└─2 dim ⟨Prt⟩ → SM (synt:xp-edge)
```

**Pharith hi °ddim**  
'It won't last' — the negative v1 grade is MIXED: AM on p-, so no soft mutation; the grade tracks the dropped particle ni (King §10), and pharith is derived from the radical parith

```text
S (neg)
├─0 parith ⟨V⟩ → AM (synt:v1-neg-mixed)
├─1 NP
│  └─0 hi ⟨Other⟩ → radical (no-license)
└─2 dim ⟨Prt⟩ → SM (synt:xp-edge)
```

**os daw e**  
'if he comes' — the subordinator occupies clause-initial position, so the verb is not v1 and stays radical (King §502)

```text
S
├─0 os ⟨Other⟩ → radical (no-license)
├─1 daw ⟨V⟩ → radical (no-license)
└─2 NP
   └─0 e ⟨Other⟩ → radical (no-license)
```

**°Ddwy °flynedd yn ôl aeth hi adre**  
'Two years ago she went home' — adverbial NPs mutate at their first word (King §11b); note the structurally identical fronted object (dom-fronted) does NOT — the difference is adjunct-vs-argument status, not configuration

```text
S
├─0 NP (adverbial)
│  ├─0 dwy ⟨Num⟩ → SM (synt:adv-np)
│  ├─1 blynedd ⟨N f sg⟩ → SM (lex:dwy)
│  └─2 yn ôl ⟨Adv⟩ → radical (no-license)
├─1 aeth ⟨V⟩ → radical (veto:no-reflex blocks synt:xp-edge)
├─2 NP
│  └─0 hi ⟨Other⟩ → radical (no-license)
└─3 adre ⟨Adv⟩ → radical (veto:no-reflex blocks synt:xp-edge)
```

**Dewch, °blant!**  
'Come, children!' — vocative mutation (King §11c); the imperative verb itself stays radical: imperatives resist v1 mutation

```text
S
├─0 dewch ⟨Vimp⟩ → radical (no-license)
└─1 NP (vocative)
   └─0 plant ⟨N m pl⟩ → SM (synt:vocative)
```

## 6. Vetoes

Two ways a word can be exempt no matter what licenses it: a per-lexeme
immutability flag (King §12: fixed mutations like *beth*; personal names;
g-initial loanwords; miscellaneous grammatical words), and the absence of any
reflex for the word's initial under the governed grade (vowels, *n-*, *s-*,
*ch-*, *ff-* … under SM, King §5a; *ll-/rh-* under the limited-SM grade).
The two are distinguished throughout because they are different theoretical
claims: one is lexical listing, the other phonological vacuity.

**dy gêm**  
'your game' — g-initial loanwords are immutable even under a live trigger (King §12e)

```text
NP
├─0 dy ⟨Other⟩ immutable → radical (no-license)
└─1 gêm ⟨N f sg⟩ immutable → radical (veto:immutable blocks lex:dy)
```

**i Dafydd**  
'to Dafydd' — personal names do not mutate in the modern language (King §12d, §36)

```text
PP
├─0 i ⟨Other⟩ → radical (no-license)
└─1 NP
   └─0 Dafydd ⟨N⟩ immutable → radical (veto:immutable blocks lex:i)
```

**i ysgol**  
'to school' — vowel-initial words have no SM reflex; the question does not arise (King §5a)

```text
PP
├─0 i ⟨Other⟩ → radical (no-license)
└─1 NP
   └─0 ysgol ⟨N f sg⟩ → radical (veto:no-reflex blocks lex:i)
```

## 7. Contested territory

A predictive account must say where prescription itself is unstable. The
contexts below are catalogued as *contested*: the rules above state the
prescriptive norm, and predictions in these environments should be read with
that caveat. Corpus context: overall prescriptive
application in spontaneous speech runs near 74%, no speaker is categorical,
gender agreement on adjectives applies barely above chance (54%), and the
particle-less finite-verb SM is the most categorical trigger measured (95%) —
consistent with relexicalization of the mutated verb forms (Jones, n.d.;
Knight et al. 2020).

- **euphony:s-d** — d- often fails to mutate after preceding -s: nos da, wythnos diwetha (King §12e note). King treats this as a euphonic override of the gender-agreement rule.
- **am-erosion** — AM after â/gyda/tri frequently realized as SM or radical colloquially (King p.12; corpus: gyda 2.94% AM). The prescriptive rule (AM ⇒ no SM) is stated here; SM in these contexts is attested vernacular.
- **immutable-variation** — lle, byth: immutability 'usage varies' (King §12b).
- **v1-neg-sm** — Negative inflected verbs prescriptively take mixed mutation, but plain SM is common speech (King §10: 'more a feature of the literary language'). The mixed grade is stated here.
- **placenames** — Non-Welsh placenames prescriptively immutable (i Birmingham), but i Firmingham 'not uncommon' in speech (King §12c). After yn 'in', foreign names 'even more chaotic': yng Nghamden / yn Gamden / yn Camden all heard (King §472).
- **nm-blynedd** — NM of blynedd/blwydd after chwe and wyth 'sometimes followed by the radical': chwe blynedd, wyth blynedd (King §176 note a).
- **yn-loc-sm** — NM after yn 'in' is 'precarious at best' in speech; if any mutation heard it is usually SM (yn °Fangor, yn °Geredigion), though SM of G- names is resisted (yn Gogledd Cymru) and bare radical is common (yn Bangor). Formal written language allows none of these (King §472). Fixed exception either way: yn °Gymraeg takes SM even in the literary language (blocked NM from a lost article).
- **tan-conj** — tan as a conjunction (tan iddo ffonio) 'certainly used' in some areas but 'some speakers regard this as substandard'; standard is nes (King §467).
- **cyn-finite** — cyn + inflected verb (cyn daeth e adre) 'regarded as substandard' for cyn iddo °ddod adre (King §509).
- **tra-grade** — Degree adverb tra: King marks tra° (SM, §95); the literary tradition prescribes AM (tra chyflym). King's SM is stated here.
- **am-dialect-mn** — In some dialects AM extends to radical m-/n- (m > mh, n > nh), 'regarded as non-standard' (King App A p.488). Irrelevant to soft mutation itself, but a hazard for analysis: mh-/nh- surface forms are not always NM.

## 8. The full trigger lexicon

The complete inventory of contact-trigger conditions, with King references. A
single word may govern several distinct conditions (*y*, *chwe*); grade
`none` entries record deliberate non-triggers.

| Lemma | Grade | Target conditions | Source |
|---|---|---|---|
| `am` | SM | — | §448 |
| `ar` | SM | — | §449 |
| `at` | SM | — | §450 |
| `cyn.prep` | none | — | §451 (no superscript; contrast cyn- prefix and cyn.equ) |
| `dan` | SM | — | §452 |
| `o dan` | SM | — | §452 |
| `oddidan` | SM | — | §452 |
| `dros` | SM | — | §453 |
| `tros` | SM | — | §453 (literary variant) |
| `drost` | SM | — | §453 (spoken variant) |
| `efo` | none | — | §454 (N 'with') |
| `gan` | SM | — | §455 |
| `gyn` | SM | — | §455 (spoken variant of gan) |
| `ger` | none | — | §456 |
| `gerbron` | none | — | §456 |
| `gyda` | AM | — | §457; erosion CONTESTED (am-erosion) |
| `heb` | SM | — | §458 |
| `hyd` | SM | — | §459 |
| `i` | SM | — | §460 |
| `o` | SM | — | §9 |
| `tan` | SM | — | §467 |
| `trwy` | SM | — | §9 |
| `drwy` | SM | — | §9 |
| `wrth` | SM | — | §9 |
| `â` | AM | — | §447 ('optionally causes AM') CONTESTED (am-erosion) |
| `tua` | AM | — | App A |
| `yn.loc` | NM | — | App A, §472 |
| `a.rel` | SM | — | §481 |
| `a.int` | SM | cat ∈ {V} | §481 note — interrogative particle, dropped colloquially with its SM left behind; retained in the literary register (M5 audit; prescriptive tradition: SM on the following verb) |
| `dacw` | SM | — | App A |
| `dyma` | SM | — | App A |
| `dyna` | SM | — | App A |
| `fe.prt` | SM | — | App A §213 |
| `mi.prt` | SM | — | App A §213 |
| `yma` | SM | — | App A |
| `yna` | SM | — | App A |
| `neu` | SM | cat ∈ {N, Adj, Vnoun, Num, Adv, Prt, Other} | §512; SM cancelled before an imperative (Arhoswch neu dewch) — hence V excluded |
| `pan` | SM | — | App A |
| `yn.pred` | SM-ltd | cat ∈ {N, Adj, Num} | App A ('not ll-, rh-'); numerals in age/time: yn °dair oed §176 |
| `go` | SM | — | §95 |
| `pur` | SM | — | §95 |
| `rhy` | SM | — | §95 |
| `tra` | SM | — | §95 (King marks tra°; literary AM tradition) CONTESTED |
| `reit` | SM | — | §95 |
| `mor` | SM-ltd | — | §105(e), App A |
| `cyn.equ` | SM | — | §105 (cyn °ddued) |
| `na.than` | AM | — | §103 (naʰ, nag before vowels) |
| `fatha` | AM | — | §105 (colloquial 'like') |
| `fawr` | SM | — | §105(d) (fawr °gallach) |
| `lawn` | SM | — | §105(a) (°lawn mor °grac) |
| `y` | SM-ltd | cat ∈ {N}; gender=f; number=sg | §28; note (b) ll-/rh- resist |
| `y` | SM | cat ∈ {Num}; lexemes: dau/dwy | §29 (y °ddau, y °ddwy) |
| `un` | SM-ltd | cat ∈ {N}; gender=f; number=sg | §162(a) |
| `fy` | NM | — | §110 |
| `dy` | SM | — | §111 |
| `ei.3sgm` | SM | — | §112 |
| `ei.3sgf` | AM | — | §112; colloquial omission CONTESTED (am-erosion) |
| `ein` | none | — | §113 (h- before vowels only) |
| `eich` | none | — | §113 |
| `eu` | none | — | §113 (h- before vowels only) |
| `'w.3sgm` | SM | — | §112 (i'w °frawd) |
| `'w.3sgf` | AM | — | §112 |
| `'w.3pl` | none | — | §112 |
| `hen` | SM | — | §96(a) |
| `prif` | SM | — | §96(a) |
| `ambell` | SM | — | §96(a), §116 |
| `holl` | SM | — | §96(a) |
| `pob` | none | — | §97 (the ONLY prenominal adjective that does not trigger SM) |
| `pa` | SM | — | §96(b) |
| `pwy.S` | SM | — | §96(b) (S variant of pa) |
| `cyn-` | SM | — | §96(c) (ex-; prefix written with hyphen but treated as trigger word) |
| `dirprwy` | SM | — | §96(c) |
| `uwch` | SM | — | §96(c) |
| `is-` | SM | — | §96(c) |
| `cryn` | SM | — | §96(d) |
| `unig` | SM | — | §99 (prenominal sense 'only'; postnominal 'lonely' does not trigger) |
| `rhyw` | SM | — | §115 |
| `unrhyw` | SM | — | §115 |
| `amryw` | SM | — | §116 |
| `cyfryw` | SM | — | §116 (y cyfryw °beth) |
| `fath` | SM | — | §116 (y fath °beth) |
| `ffasiwn` | SM | — | §116 |
| `rhai` | none | — | §115 (contrast rhyw°) |
| `sawl` | none | — | §187 |
| `peth` | none | — | §193 (directly precedes sg noun, no o°, no mutation) |
| `dau` | SM | — | §162(b) |
| `dwy` | SM | — | §162(b) |
| `tri` | AM | — | §162(c) 'erratically in the spoken language' CONTESTED (am-erosion) |
| `tair` | none | — | §162(c) (always radical) |
| `pedwar` | none | — | §162 |
| `pedair` | none | — | §162 |
| `chwe` | AM | — | §162(e) 'erratically in speech' CONTESTED (am-erosion) |
| `chwe` | NM | lexemes: blwydd/blynedd/diwrnod | §176; radical sometimes (chwe blynedd) CONTESTED (nm-blynedd) |
| `pum` | NM | lexemes: blwydd/blynedd/diwrnod | §176 |
| `saith` | NM | lexemes: blwydd/blynedd/diwrnod | §176 |
| `wyth` | NM | lexemes: blwydd/blynedd/diwrnod | §176; radical sometimes (wyth blynedd) CONTESTED (nm-blynedd) |
| `naw` | NM | lexemes: blwydd/blynedd/diwrnod | §176 |
| `deng` | NM | lexemes: blwydd/blynedd/diwrnod | §176 |
| `deuddeng` | NM | lexemes: blwydd/blynedd/diwrnod | §176 (12) |
| `pymtheng` | NM | lexemes: blwydd/blynedd/diwrnod | §176 (15) |
| `deunaw` | NM | lexemes: blwydd/blynedd/diwrnod | §176 (18) |
| `ugain` | NM | lexemes: blwydd/blynedd/diwrnod | §176 (20) |
| `can` | NM | lexemes: blwydd/blynedd/diwrnod | §176 (100: can °mlwydd oed) |
| `ail` | SM | — | §170(b) (both genders) |
| `trydedd` | SM | gender=f | §170(b) |
| `pedwaredd` | SM | gender=f | §170(b) |
| `trydydd` | none | — | §170(b) (masc: y Trydydd Byd) |
| `pedwerydd` | none | — | §170(b) |
| `pumed` | SM | gender=f | §170(b) (y °bumed °orsaf; masc radical) |
| `chweched` | SM | gender=f | §170(b) |
| `seithfed` | SM | gender=f | §170(b) |
| `wythfed` | SM | gender=f | §170(b) |
| `nawfed` | SM | gender=f | §170(b) |
| `degfed` | SM | gender=f | §170(b) |
| `ugeinfed` | SM | gender=f | §170(d) (yr ugeinfed °ganrif) |
| `nos` | SM | lexemes: Llun/Mawrth/Mercher/Iau/Gwener/Sadwrn/Sul/Calan | §180 (Nos °Fawrth, Nos °Galan) |
| `mewn` | none | — | §461 (non-specific 'in a'; contrast yn.loc) |
| `mo` | SM | — | §462, §295 (contraction of dim o°, carries o's SM) |
| `oddiar` | SM | — | §463 |
| `oddiwrth` | SM | — | §464 |
| `rhag` | none | — | §465 (rhag dod, rhag ofn — radical) |
| `rhwng` | none | — | §466 ('one of the few simple spatial prepositions which does not cause SM') |
| `trw` | SM | — | §468 (variant of trwy) |
| `wth` | SM | — | §470 (spoken variant of wrth) |
| `er` | none | — | §506 (er ei holl gyfoeth — no mutation from er itself) |
| `ers` | none | — | §503 |
| `erbyn` | none | — | §503 |
| `nes` | none | — | §503 (i-construction; no direct mutation) |
| `ar bwys` | none | — | §475 (compound preps cause no mutation on following noun) |
| `ar draws` | none | — | §475 |
| `ar gyfer` | none | — | §475 |
| `ar ôl` | none | — | §475 |
| `er mwyn` | none | — | §475 |
| `o flaen` | none | — | §475 |
| `o gwmpas` | none | — | §475 |
| `wrth ymyl` | none | — | §475 |
| `ymhlith` | none | — | §475-476 |
| `ymysg` | none | — | §475-476 |
| `yn lle` | none | — | §475 |
| `hanner can` | NM | lexemes: blwydd/blynedd/diwrnod | §176 (50) |
| `a.conj` | AM | — | §510; 'often disregarded in the spoken language, particularly for th-' CONTESTED (am-erosion) |
| `na.nor` | AM | — | §513 (nor; 'often disregarded in speech') CONTESTED (am-erosion) |
| `na.rel` | mixed | — | §481 (NEG relative; King's exx show SM on b/d/g-initials, consistent with mixed; AM on c/p/t per prescriptive tradition + §10) |
| `sy` | SM | lexemes: dim | §479 (sy °ddim) |
| `os` | none | — | §502 (os daw e) |
| `pe` | none | — | §502 |
| `hyd.conj` | none | — | §502 (hyd gwelwch chi — verb radical; contrast hyd° preposition) |
| `ta` | none | — | §512 (te 'ta coffi) |
| `ond` | none | — | §511 |
| `ni` | mixed | — | §10 |
| `na.neg` | mixed | — | §10 |
| `oni` | mixed | — | §10 |

## 9. Known limits

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

## 10. Bibliography

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
