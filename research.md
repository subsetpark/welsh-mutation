# When Welsh Soft Mutation Occurs: Research Survey

Research deliverable toward an algorithmic theory of soft-mutation (SM) trigger conditions. The phonological content of mutation (t→d, p→b, etc.) is taken as opaque; the question is exclusively *when* it fires. Compiled 2026-07-11 via multi-source verified research (18 sources fetched, 73 claims extracted, top 25 adversarially verified — all 25 survived, 24 unanimously).

## 0. The consensus architecture: the phenomenon is heterogeneous

Every serious account, across all frameworks, starts from the same premise (Tallerman 2006, Lingua): **most instances of mutation have a lexical or morphosyntactic trigger, while a distinct residue is triggered under specifically syntactic conditions.** The theories disagree only about the mechanism of the syntactic residue. Green (2003) states it most bluntly: trigger environments split into proclitic-triggered (lexical) and syntax-triggered classes, and *no single generalization covers both* — the full set is arbitrary, partly item-specific, and dialectally variable.

So the target theory has (at least) three subsystems, plus a locality constraint that spans all of them:

1. **Lexical (contact) triggers** — closed-class items mutating the immediately following word.
2. **Gender-marking mutation** — a morphosyntactic agreement subsystem.
3. **Syntactic soft mutation** — flagship case: direct object mutation (DOM).

**The Trigger Constraint** (Breit 2019, UCL PhD, Distributed Morphology): all Welsh mutation — lexical and grammatical alike — obeys strict locality: *the trigger must be string-adjacent to and precede the target at PF.* A trigger never mutates a non-adjacent word. This is the single strongest cross-cutting formal invariant in the literature and should be an invariant of the algorithm.

## 1. Lexical/contact triggers (the majority case)

- **Diachronic origin** (Willis, in Borsley/Tallerman/Willis 2007, ch. on diachrony): mutations were once predictable from pure phonology (the final segment of the preceding word). By Middle Welsh they had been reanalyzed: predictable only from **a list of arbitrary triggering environments**, the overwhelming majority being individual lexical items (prepositions *i, o, am, ar, at, dan, dros, trwy, wrth, heb, gan, hyd*; possessives *dy, ei*(masc); particles; numerals *dau/dwy, un*(fem); a closed class of prenominal adjectives, e.g. *hen*) acting on the initial consonant of the word immediately following.
- **Synchronic status**: arbitrary list; no productive phonological account survives. Green (2003, ROA-652) — an explicitly anti-phonological account — models this as **allomorph selection by government/subcategorization**: mutated forms are listed allomorphs, and triggers (determiners, prepositions, proclitics) subcategorize for the mutation grade they govern, exactly like German prepositions governing dative.
- **Closed-class generalization** (Breit 2019): contact-mutation triggers are function words (f-morphemes in DM terms) — prepositions, prefixes, numerals, and even the mutation-triggering prenominal adjectives form a closed class distinct from open-class postnominal adjectives.
- **Item-specific quirks the algorithm must store per-lexeme** (Green 2003):
  - *ni/na/oni* trigger a **mixed mutation**: aspirate on voiceless stops, soft on voiced stops/voiceless liquids/m. (In speech *ni* is often dropped, but its mutation remains — a null trigger.)
  - Target-side lexeme lists: only *blwydd, blynedd, diwrnod* nasal-mutate after *pum, saith, wyth, naw, deng, pymtheng, ugain, can*; all other words stay radical there.

## 2. Gender-marking mutation

Welsh marks grammatical gender by mutation, not affixes (Bangor thesis, 2001). Two canonical environments:

- **Feminine singular noun after the definite article** (*y gath* < *cath*). Also after *un* 'one'.
- **Adjective after a feminine singular noun** (*cath fach* < *bach*).

Conditions and exceptions:
- **Singular only** — feminine plurals trigger/undergo neither environment. Breit (2019) derives this via impoverishment: both gender agreement and mutation are lost in the plural.
- **The ll-/rh- carve-out is category-sensitive, not phonological** (Green 2003): feminine *nouns* in *ll-* [ɬ] and *rh-* [r̥] resist mutation after *y*/*un*, but feminine *adjectives* in the same position DO mutate (*y lwyd wawr* < *llwyd*). So the exception must be stated as target-category-sensitive subcategorization on the trigger, not as a property of the segments.
- **Adjective chains break trigger-adjacency** (Breit 2019): in *y ferch fach wen*, the second adjective *gwen* mutates without being adjacent to the noun. Breit's solution: adjective gender-mutation is not triggered by the preceding noun at all but is the **spellout of a [+feminine] feature percolated onto the adjective itself**. This preserves the Trigger Constraint and is a genuinely different mechanism from contact mutation — the "trigger" is a feature on the target.
- **Possessor immunity** (Mittendorf & Sadler 2006; Dowle 2024): possessor phrases, including adjuncts inside them, are immune to SM even when string-adjacent to a feminine singular noun: *cath merch* 'a girl's cat' (*merch* unmutated), *gweithred gwir ffrind*. **Linear adjacency to a trigger is therefore insufficient — the trigger relation must be conditioned on the grammatical relation between trigger and target** (Dowle states it f-structurally: the trigger template exempts possessors).

## 3. Syntactic soft mutation and the DOM debate

### The core datum
The direct object of a **finite** verb soft-mutates: *Gwelodd Mair dŷ* (*tŷ* → *dŷ*), *Prynodd dyn feic*. The object of a **non-finite** lexical verb in periphrastic constructions does not: *Roedd dyn wedi prynu beic* (radical *beic*). Because Welsh is VSO, the finite verb is not even adjacent to the mutating object — the subject intervenes. Roberts (1997) notes DOM is the *only* Celtic mutation not triggered by a specific lexical item, so it cannot be assimilated to class 1.

### Theory family A: Case-based accounts (losing)
- Lineage: Lieber (1983), Zwicky (1984), most influentially **Roberts (1997 CJL; 2005 OUP *Principles and Parameters in a VSO Language*)**: DOM is the PF-realization of accusative Case assigned by AgrO (later v), spelled out as a floating lenition feature **L**, linked to finite-verb raising. Roberts treats mutation as phonosyntactic sandhi parallel to Romance raddoppiamento and French liaison.
- Fronted objects do NOT mutate (*beic brynodd y ddynes* — actually *beic prynodd...*, radical). Roberts handles this by making L attach only to a string-adjacent object rather than being a case feature on the object DP.
- **The standing refutation** (Harlow 1989 vs. Lieber/Zwicky; Borsley 1997 CJL; Tallerman 2006 Lingua vs. Roberts): the Case hypothesis is **both too strong and too weak**. Too strong: it predicts mutation where none occurs. Too weak: a natural class of mutations patterns with DOM but cannot plausibly be accusative Case — mutation on non-NP categories, on the negative particle *dim* after a subject, on adverbial NPs, on predicates. Tallerman (2006) additionally argues Roberts's finite-verb-raising trigger is unworkable.

### Theory family B: the XP Trigger Hypothesis (XPTH) — the dominant configurational account
- First explicit statement: **Harlow (1989)**; developed by Tallerman (1987, 2006) and Borsley (1999). Canonical formulation: **"A complement bears SM if it is immediately preceded by a c-commanding phrase"** — informally, any phrasal category (XP) triggers SM on the word immediately following its right edge.
- DOM falls out: in VSO, the *subject XP* (not the verb) is what immediately precedes the object → object mutates. Non-finite periphrastics have no XP immediately before the object → radical.
- Decisive supporting evidence (Green 2003, summarizing): objects of *non-finite* verbs DO mutate when a PP or AdvP intervenes; subjects trigger SM on whatever follows, including non-accusative *dim*. Tallerman (2006): XPTH captures all of Roberts's generalizations *plus* every other instance of syntactic mutation in a single structural environment.
- Costs: null subjects (*pro*) and wh-traces must count as mutation-triggering XPs (Willis documents the Middle Welsh side: *pro* and wh-trace are *transparent* to a preceding verb's lexical mutation — the modern XPTH inverts this into null XPs as triggers); full formulations need c-command/sisterhood conditions and CP exclusions (CPs don't trigger).

### Post-XPTH formal refinements (most recent, most algorithm-ready)
- **Breit (2019, DM):** XPTH has excellent empirical coverage but is *architecturally incoherent* — an XP boundary is not a morphosyntactic object that can receive exponence, so it can't exist in a modular spellout architecture. Roberts's L-diacritic is likewise paradoxical (phonological when stranded, morphosyntactic in behavior). Breit's alternative: the ACC case feature is **exponed on the target itself** (like the [+fem] solution for adjectives). Under this view the "syntactic" class collapses into features-on-targets, and only contact mutation has genuine external triggers.
- **Dowle (2024, LFG proceedings — most recent formal treatment):** makes heterogeneity itself the architecture. XPTH effects arise from **two distinct mechanisms**: (i) lexically supplied trigger templates (@S-TRIGGER/@ALL) keyed to **f-structure relationships between adjacent s-string words** (this handles contact triggers, gender, and possessor immunity), and (ii) **phrase-structure rules annotating a MUT value on the left edge of designated XP positions** ((⇙ MUT)=s) — handling the positional/syntactic residue. Eliminates all empty categories (*pro*, wh-trace, null particles, null blocking elements). Operationally: **a word mutates iff (a) it stands in a specific f-structural relationship with the preceding string word, or (b) it occupies a designated sentence position.** This disjunction is essentially an algorithm specification.
- **Hewitt (conference paper, medium confidence):** syntactic mutation may be Case-based in origin but has evolved into a **configurational head-[trigger]-dependent rule**, claimed to be the same rule as the Arabic indefinite accusative. Supports the reanalysis trajectory (abstract Case → configuration) but is hedged and one-directional.

### Diachronic caution (Willis — verified verbatim)
Modern DOM is **historically recent**. In Middle Welsh, postverbal mutation was *lexically* conditioned by specific verb forms (imperfect/pluperfect in *-ai*, *bu/-fu* 'be') and hit whatever NP immediately followed, **subject or object alike**; *-odd/-s/-th* pasts triggered nothing. The modern rule (object mutates, subject doesn't) emerged only in the early modern period: subject mutation declined (for 'be', by the late 16th c., per D. Simon Evans), object mutation spread to all finite verbs. Any theory claiming deep synchronic motivation for DOM must reckon with its recency; this also independently motivates keeping the syntactic class architecturally separate.

## 4. Computational precedents

- **Mittendorf & Sadler (2006)** implemented Welsh initial mutations in the Xerox finite-state toolbox (XFST) — the direct precedent. Their position (endorsed by Poibeau's Breton FST work, ACL 2014): mutation is morphosyntactic/inflection-like, and **trigger conditions are strictly local (small bounded context window), so finite-state transducers suffice for an exact, compact formalization**. Dialect variation handled modularly (separate grammars per dialect).
- **CyTag / CorCenCC** (Welsh POS tagger, ~2020): operationalizes triggers as constraint-grammar disambiguation rules — e.g. *yn* is tagged predicative when followed by a soft-mutated noun, locative ('in') when followed by nasal mutation. Documented pain points: short mutated forms are ambiguous with radicals of other lexemes; proper-noun mutation is irregular; both needed dedicated handling.
- Breton FST work (Poibeau 2014) shows a sibling system where gender-marking mutation needs **lexical-semantic subclasses** (masculine person-denoting plurals mutate like feminine singulars) and can mix in **phonological conditions on the trigger** (noun-final segment) — a warning that trigger frames need arbitrary feature hooks.

## 5. Variation and usage: mutation is not categorical in speech

Corpus study of spontaneous spoken Welsh (Aberystwyth working paper, post-2022, citing White & Roberts 2022) — extracted, not fully adversarially verified:

- Overall, triggers produce the prescriptively expected mutation only **~74%** of the time; **no speaker is categorical** (reliable speakers range 60.6–75.8%).
- Application rates differ sharply by trigger class — evidence that the classes are psychologically real: particle-less finite verbs 95.2%; extraction contexts 82.6%; unified XPTH contexts 73.7%; **gender-marking on postnominal adjectives only 54.2%**.
- SM is **invading the other mutations' territory**: *yn* 'in' takes SM 109× vs. prescriptive NM 34× in the corpus; negative-clause finite verbs take SM instead of AM in 6/9 mutated cases. Aspirate triggers are dying: *a* 'and' 15.3%, *â* 'with' 4.4%, *gyda* 2.9%.
- **Variation lives on the trigger, not the target** (Breit 2019's DM prediction, corroborated by dialect data): individual triggers weaken, switch mutation type (*yn* → SM in Caernarfon, → nothing in New Quay), or drop out; non-triggers essentially never become triggers. Targets are simply mutable or immutable.
- **Immutable-target exception list**: *braf*, established g-initial borrowings (*gêm*, *garej*), *beth, ble, ti, mi, mo, pam*, personal names (place names CAN mutate), non-high-frequency foreign names. Breit analyzes these as beginning with an empty CV slot that blocks the floating feature; operationally it's a per-lexeme boolean.
- Conversely, **untriggered mutated forms** occur (*dipyn bach o ddŵr*; exclamative *bobl bach*) — mutated forms relexicalizing as radicals.

## 6. Implications for the algorithm (data-type sketch)

The literature converges on roughly this shape:

1. **Lexicon entries** carry: (a) *as trigger*: a mutation grade governed (S/N/A/mixed/none), possibly target-category-sensitive (the ll-/rh- noun-vs-adjective split), possibly target-lexeme-restricted (*blwydd/blynedd/diwrnod*); (b) *as target*: a mutability flag (immutable exception list); (c) gender/number for nouns.
2. **A contact rule**: trigger word Wᵢ mutates Wᵢ₊₁ iff Wᵢ governs a grade AND the grammatical relation between them is licit (possessors exempt — so the rule consults relations, not just adjacency).
3. **A feature-spellout rule** for gender agreement on targets ([+fem sg] on adjectives, however acquired), which handles chains without violating locality.
4. **A positional rule** for the syntactic residue: either XPTH-style ("word immediately after the right edge of a c-commanding XP mutates") over a parse, or Dowle-style designated-position annotations, or Breit-style ACC-on-target. All require syntactic structure as input; the choice is the main open design decision.
5. **The Trigger Constraint as a global invariant**: every mutation is licensed by the immediately preceding string element or by a feature on the target itself. Nothing acts at a distance.
6. **A variation layer**: per-trigger application probabilities by register/dialect if modeling usage rather than the prescriptive standard.

## 7. Known gaps and caveats

- The 25 adversarially verified claims cover the lexical/gender/syntactic core and diachrony. The DM (Breit), OT/allomorphy (Green), computational (Mittendorf & Sadler, CyTag), and variationist (Aberystwyth) material was extracted verbatim from primary sources but did **not** go through the 3-vote verification (only the top 25 of 73 claims were verified, all survived).
- Roberts's claim that his Case account "fully integrates" DOM with other mutation was the one 2-1 vote — verifiers judged it overstated since lexical triggers stay lexical even for Roberts.
- Published counterexamples to XPTH itself (beyond possessor immunity and empty-category bookkeeping) are underrepresented; the XPTH is reported largely through proponents. Breit's architectural objection is the strongest published critique found.
- No surviving claims on purely phonological/prosodic-phrasing accounts (e.g. Hannahs) for the syntactic subset; the field appears to have abandoned them, but this is absence of evidence in the sweep.
- Dowle (2024) is very recent; reception untested.

## Key sources

- Tallerman 2006, "The syntax of Welsh 'direct object mutation' revisited", *Lingua* — https://www.sciencedirect.com/science/article/abs/pii/S0024384105000859
- Willis, diachrony chapter (Borsley/Tallerman/Willis 2007, *The Syntax of Welsh*, CUP) — https://davidwillis.net/diachrony.pdf
- Borsley 1997, "Mutation and Case in Welsh", *CJL* 42 — https://www.cambridge.org/core/journals/canadian-journal-of-linguistics-revue-canadienne-de-linguistique/article/abs/mutation-and-case-in-welsh/0E72D77DD54054EC98DE4520A75A1702
- Roberts 1997, "The syntax of direct object mutation in Welsh", *CJL* 42 — https://www.cambridge.org/core/journals/canadian-journal-of-linguistics-revue-canadienne-de-linguistique/article/syntax-of-direct-object-mutation-in-welsh/86DF062A0739CAA8490F281B75593D60
- Roberts 2005, *Principles and Parameters in a VSO Language*, OUP
- Harlow 1989, "The syntax of Welsh soft mutation" — https://www.academia.edu/21165107/The_syntax_of_Welsh_soft_mutation
- Dowle 2024, LFG'24 Proceedings, pp. 165–183 — https://lfg-proceedings.org/lfg/index.php/main/article/download/53/44/409
- Green 2003, "The Celtic Mutations", ZAS Papers 32 / ROA-652 — https://roa.rutgers.edu/files/652-0404/652-GREEN-0-0.PDF
- Breit 2019, UCL PhD thesis (DM account) — https://discovery.ucl.ac.uk/id/eprint/10087726/1/Thesis%20(colour).pdf
- Zwicky 1984, "Welsh soft mutation and the case of object NPs", CLS 20 — https://web.stanford.edu/~zwicky/welsh-soft-mutation.pdf
- B.M. Jones, spoken-Welsh mutation corpus study — https://users.aber.ac.uk/bmj/Ymchwil/mutations2.pdf
- Poibeau 2014, Breton mutations with FSTs, ACL — https://aclanthology.org/W14-4604.pdf
- CorCenCC/CyTag — https://arxiv.org/pdf/2010.05542
- Hewitt, Welsh syntactic mutation & Arabic indefinite accusative — https://www.researchgate.net/publication/334415515_Welsh_syntactic_mutation_and_Arabic_indefinite_accusative_Case_or_configuration
- Gender mutation thesis, Bangor — https://research.bangor.ac.uk/en/studentTheses/aspects-of-gender-mutation-in-welsh/
