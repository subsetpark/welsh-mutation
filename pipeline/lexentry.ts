/**
 * Broad-lexicon entry shape (data/lexicon-full.json). Richer than the theory
 * layer's Lexeme: keyed by radical SURFACE form (cathod, gwelodd), carries
 * the citation lemma, and preserves verb inflection — person '0' is the
 * impersonal (UD Person=0), which M4's pro-drop gap insertion must exclude.
 */

import type { Cat, InitClass } from '../src/types.ts'

export interface LexEntry {
  /** Radical surface form (mutation stripped via the treebank's Mutation
   *  feature + lemma initial). Lowercased except proper nouns. */
  form: string
  /** Citation form (UD LEMMA) — becomes Lexeme.id. */
  lemma: string
  cat: Cat
  initClass: InitClass
  gender?: 'm' | 'f'
  number?: 'sg' | 'pl'
  /** Finite verbs only. '0' = impersonal (Gwelwyd), '1'|'2'|'3' personal. */
  person?: '0' | '1' | '2' | '3'
  /** UD PROPN — feeds the personal-name immutability class rule. */
  proper?: boolean
  /** Set by the loader (hand lexicon, immutables.json); never by extraction. */
  immutable?: boolean
  /** Occurrences across the extracted splits. */
  freq: number
}

export interface LexiconFile {
  _source: string
  entries: LexEntry[]
}
