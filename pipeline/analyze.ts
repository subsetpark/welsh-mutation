/**
 * Readings assembly (WORKSTREAM M2): compose tokenize → demutate → lexicon
 * filter into the Token[] the M3 tagger will prune. Every candidate that the
 * lexicon licenses is retained (ratified ambiguity-propagation policy);
 * nothing here decides between readings.
 *
 * Resolution order per token: lexicon readings via de-mutation candidates;
 * else a function-word reading when the form is a trigger lemma (i, o, am —
 * closed classes are deliberately absent from the extracted lexicons);
 * else the OOV policy — orthography-derived initClass, cat 'Other',
 * `unknown` flag, never a throw (DoD-10).
 */

import triggersData from '../theory/triggers.json' with { type: 'json' }
import type { LexEntry } from './lexentry.ts'
import type { MutationGrade } from '../theory/orthography.ts'
import { demutate } from './demutate.ts'
import { initClassOf } from '../theory/orthography.ts'
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
const TRIGGER_BASES = new Set(
  (triggersData.frames as { lemma: string }[]).map(f => f.lemma.split('.')[0]!),
)

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
  return tokenize(text).map((raw): Token => {
    if (raw.kind === 'punct') return { ...raw, readings: [] }

    // Clitics are looked up by their lemma; words by de-mutation candidates.
    const readings: Reading[] =
      raw.kind === 'clitic'
        ? lexicon.lookup(raw.lemma!).map(entry => ({ radical: raw.lemma!, grade: null, entry }))
        : demutate(raw.surface).flatMap(c =>
            lexicon.lookup(c.radical).map(entry => ({ radical: c.radical, grade: c.grade, entry })),
          )

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
