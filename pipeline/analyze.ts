/**
 * Readings assembly (WORKSTREAM M2): compose tokenize → demutate → lexicon
 * filter → licensing filter into the Token[] the M3 tagger will prune.
 * Every candidate the lexicon carries AND the theory could license is
 * retained (ratified ambiguity-propagation policy); nothing here decides
 * between viable readings.
 *
 * THE LICENSING FILTER (generation-side Trigger Constraint): an observed-
 * mutation hypothesis is viable only where a licenser for its grade could
 * exist. SM has configurational and positional sources in every position,
 * so SM hypotheses always stand (fan ⇐ man/ban stays three-way). NM has
 * ONLY contact sources — frames with grade NM — so an NM hypothesis needs
 * the immediately preceding token to be a possible NM trigger: mae ⇐
 * NM-of-bae dies utterance-initially, in any sentence shape, while ym Mae
 * Caerdydd keeps it. AM likewise needs an adjacent AM/mixed trigger,
 * except on finite-verb readings, where mixed's AM half arrives
 * positionally via the dropped negative particle (chlywais i ddim);
 * h-prothesis candidates need one of the h-prefixing possessives (King
 * §109). This is hypothesis GENERATION, not tagging by mutation — the
 * filter applies necessary conditions the theory itself states, exactly
 * as demutate() generates only what the orthography permits, and the
 * judge still derives every verdict independently from tree evidence:
 * disagreement stays possible wherever a hypothesis survives. Known
 * exclusion: colloquial fy-drop leaves bare NM with no overt licenser
 * (King §110: mhlant, nhad for fy mhlant, fy nhad) — a phenomenon the
 * theory does not model; if it gains a designated position, this filter
 * consults that inventory too.
 *
 * Resolution order per token: lexicon readings via de-mutation candidates,
 * licensing-filtered; a function-word reading merged when the surface
 * spells a trigger lemma at face value and no radical reading exists
 * (closed classes are deliberately absent from the extracted lexicons);
 * else the OOV policy — orthography-derived initClass, cat 'Other',
 * `unknown` flag, never a throw (DoD-10).
 */

import triggersData from '../theory/triggers.json' with { type: 'json' }
import type { LexEntry } from './lexentry.ts'
import type { MutationGrade } from '../theory/orthography.ts'
import { demutate } from './demutate.ts'
import { VOWEL, initClassOf } from '../theory/orthography.ts'
import { Lexicon, PREPOSITION_LEMMAS, loadLexicon } from './lexicon.ts'
import { tokenize, type RawKind } from './tokenize.ts'

export interface Reading {
  /** Candidate radical surface form (what the lexicon was consulted with). */
  radical: string
  /** Observed-mutation hypothesis; null = form is radical as written. */
  grade: MutationGrade | null
  /** Carries person ('0' = impersonal) through to M4's pro-drop exclusion. */
  entry: LexEntry
}

export interface Token {
  surface: string
  kind: RawKind
  /** Clitic expansion or multiword-trigger lemma, from the tokenizer. */
  lemma?: string
  readings: Reading[]
  /** OOV: no lexicon entry and not a trigger lemma. */
  unknown?: true
}

/** Trigger lemmas by their surface base — homograph keys like yn.pred and
 *  ei.3sgm all license the bare form; picking between them is M3's job. */
const FRAMES = triggersData.frames as { lemma: string; grade: string }[]
const baseOf = (lemma: string): string => lemma.split('.')[0]!
const TRIGGER_BASES = new Set(FRAMES.map(f => baseOf(f.lemma)))

// Contact licensers per non-SM grade, derived from the trigger lexicon —
// the licensing filter's data. NM and AM have no configurational sources,
// so these sets are exhaustive for non-verb targets.
const NM_BASES = new Set(FRAMES.filter(f => f.grade === 'NM').map(f => baseOf(f.lemma)))
const AM_BASES = new Set(
  FRAMES.filter(f => f.grade === 'AM' || f.grade === 'mixed').map(f => baseOf(f.lemma)),
)
/** h-prothesis licensers (King §109). Stated, not derived: ein/eu govern
 *  no consonant grade (their frames are 'none') yet prefix the h-. */
const H_BASES = new Set(['ei', "'w", 'ein', 'eu'])
/** Nasal-assimilated allomorphs of yn 'in' (ym Mangor, yng Nghaerdydd). */
const YN_ALLOMORPHS = new Set(['ym', 'yng'])

const intersects = (a: ReadonlySet<string>, b: ReadonlySet<string>): boolean => {
  for (const x of a) if (b.has(x)) return true
  return false
}
const NO_BASES: ReadonlySet<string> = new Set()

/** Every trigger base a token could be resolved to — its lexicon lemmas
 *  plus its face-value trigger lemma. Deliberately permissive (any reading
 *  counts): the filter states a NECESSARY condition, and M3 owns choices. */
function licenserBases(raw: { surface: string; lemma?: string }, readings: Reading[]): Set<string> {
  const out = new Set<string>()
  for (const r of readings) out.add(baseOf(r.entry.lemma))
  const lemma = (raw.lemma ?? raw.surface).toLowerCase()
  if (TRIGGER_BASES.has(lemma)) out.add(lemma)
  if (YN_ALLOMORPHS.has(lemma)) out.add('yn')
  return out
}

/** The generation-side Trigger Constraint (see the header). */
function viable(r: Reading, contact: ReadonlySet<string>): boolean {
  if (r.grade === null || r.grade === 'SM') return true
  if (r.grade === 'NM') return intersects(contact, NM_BASES)
  // AM: h-prothesis candidates have vowel-initial radicals
  if (VOWEL.test(r.radical.toLowerCase())) return intersects(contact, H_BASES)
  return intersects(contact, AM_BASES) || r.entry.cat === 'V'
}

const functionReading = (form: string): Reading => {
  const lemma = form.toLowerCase()
  return {
    radical: form,
    grade: null,
    // form normalized: function words never keep sentence-initial caps;
    // prepositions carry the class immutability (theory/immutables.json)
    entry: {
      form: lemma, lemma,
      cat: 'Other', initClass: initClassOf(form), freq: 0,
      ...(PREPOSITION_LEMMAS.has(lemma) ? { immutable: true } : {}),
    },
  }
}

export function analyze(text: string, lexicon: Lexicon = loadLexicon()): Token[] {
  const raws = tokenize(text)

  // Clitics are looked up by their lemma; words by de-mutation candidates.
  const lexReadings = raws.map((raw): Reading[] =>
    raw.kind === 'punct'
      ? []
      : raw.kind === 'clitic'
        ? lexicon.lookup(raw.lemma!).map(entry => ({ radical: raw.lemma!, grade: null, entry }))
        : demutate(raw.surface).flatMap(c =>
            lexicon.lookup(c.radical).map(entry => ({ radical: c.radical, grade: c.grade, entry })),
          ),
  )

  return raws.map((raw, k): Token => {
    if (raw.kind === 'punct') return { ...raw, readings: [] }

    // A contact licenser can only be the IMMEDIATELY preceding token
    // (Trigger Constraint); punctuation or the utterance edge leaves none.
    const prev = raws[k - 1]
    const contact =
      prev !== undefined && prev.kind !== 'punct'
        ? licenserBases(prev, lexReadings[k - 1]!)
        : NO_BASES
    const readings = lexReadings[k]!.filter(r => viable(r, contact))

    // Closed classes are deliberately absent from the extracted lexicons, so
    // lexicon readings reached only through de-mutation hypotheses must not
    // preempt a function word the surface spells at face value: o is the SM
    // of the adverb go (g-deletion), and only the trigger lexicon knows the
    // preposition. A radical lexicon reading already carries the lemma.
    const base = (raw.lemma ?? raw.surface).toLowerCase()
    if (TRIGGER_BASES.has(base) && !readings.some(r => r.grade === null)) {
      readings.push(functionReading(raw.lemma ?? raw.surface))
    }
    if (readings.length > 0) return { ...raw, readings }

    return { ...raw, readings: [functionReading(raw.surface)], unknown: true }
  })
}
