/**
 * Shared gold-suite fixture lexicon (M3 tagger + M4 chunker). The
 * hand-curated src/lexicon.ts overlays automatically inside `new Lexicon`;
 * these are the extra open-class forms the gold sentences need.
 * Deterministic — no dependency on the gitignored Apertium layer.
 */

import { Lexicon } from '../pipeline/lexicon.ts'
import type { LexEntry } from '../pipeline/lexentry.ts'

export const FIX: LexEntry[] = [
  // finite verbs (form-keyed; the hand lexicon keys by citation form only)
  { form: 'gwelodd', lemma: 'gweld', cat: 'V', person: '3', initClass: 'g', freq: 9 },
  { form: 'gweles', lemma: 'gweld', cat: 'V', person: '1', initClass: 'g', freq: 3 },
  { form: 'gwelais', lemma: 'gweld', cat: 'V', person: '1', initClass: 'g', freq: 2 },
  { form: 'gwelwyd', lemma: 'gweld', cat: 'V', person: '0', initClass: 'g', freq: 2 },
  { form: 'aeth', lemma: 'mynd', cat: 'V', person: '3', initClass: 'v', freq: 8 },
  { form: 'es', lemma: 'mynd', cat: 'V', person: '1', initClass: 'v', freq: 2 },
  { form: 'daw', lemma: 'dod', cat: 'V', person: '3', initClass: 'd', freq: 3 },
  { form: 'roedd', lemma: 'bod', cat: 'V', person: '3', initClass: 'other', freq: 9 },
  { form: 'dyw', lemma: 'bod', cat: 'V', person: '3', initClass: 'd', freq: 3 },
  { form: 'prynodd', lemma: 'prynu', cat: 'V', person: '3', initClass: 'p', freq: 4 },
  // nouns
  { form: 'gardd', lemma: 'gardd', cat: 'N', gender: 'f', number: 'sg', initClass: 'g', freq: 4 },
  { form: 'athro', lemma: 'athro', cat: 'N', gender: 'm', number: 'sg', initClass: 'v', freq: 3 },
  { form: 'caws', lemma: 'caws', cat: 'N', gender: 'm', number: 'sg', initClass: 'c', freq: 3 },
  { form: 'bara', lemma: 'bara', cat: 'N', gender: 'm', number: 'sg', initClass: 'b', freq: 3 },
  { form: 'te', lemma: 'te', cat: 'N', gender: 'm', number: 'sg', initClass: 't', freq: 3 },
  { form: 'coffi', lemma: 'coffi', cat: 'N', gender: 'm', number: 'sg', initClass: 'c', freq: 3 },
  { form: 'fan', lemma: 'fan', cat: 'N', gender: 'f', number: 'sg', initClass: 'other', freq: 3 },
  { form: 'man', lemma: 'man', cat: 'N', gender: 'm', number: 'sg', initClass: 'm', freq: 3 },
  { form: 'ban', lemma: 'ban', cat: 'N', gender: 'f', number: 'sg', initClass: 'b', freq: 1 },
  { form: 'cinio', lemma: 'cinio', cat: 'N', gender: 'm', number: 'sg', initClass: 'c', freq: 5 },
  { form: 'rhywbeth', lemma: 'rhywbeth', cat: 'N', gender: 'm', number: 'sg', initClass: 'rh', freq: 4 },
  { form: 'bwrdd', lemma: 'bwrdd', cat: 'N', gender: 'm', number: 'sg', initClass: 'b', freq: 3 },
  { form: 'dydd', lemma: 'dydd', cat: 'N', gender: 'm', number: 'sg', initClass: 'd', freq: 5 },
  { form: 'bore', lemma: 'bore', cat: 'N', gender: 'm', number: 'sg', initClass: 'b', freq: 4 },
  { form: 'Aberystwyth', lemma: 'Aberystwyth', cat: 'N', initClass: 'v', proper: true, freq: 4 },
  { form: 'Sadwrn', lemma: 'Sadwrn', cat: 'N', initClass: 'other', proper: true, freq: 2 },
  // adjectives — NB the Adj 'tall' is radical TAL; surface dal is its SM,
  // genuinely ambiguous with the verbal noun dal 'to catch'
  { form: 'tal', lemma: 'tal', cat: 'Adj', initClass: 't', freq: 5 },
  { form: 'dal', lemma: 'dal', cat: 'Vnoun', initClass: 'd', freq: 5 },
  { form: 'da', lemma: 'da', cat: 'Adj', initClass: 'd', freq: 6 },
  { form: 'arall', lemma: 'arall', cat: 'Adj', initClass: 'v', freq: 4 },
  { form: 'gwen', lemma: 'gwyn', cat: 'Adj', initClass: 'g', freq: 2 },
  // pronouns
  { form: 'nhw', lemma: 'nhw', cat: 'Other', initClass: 'other', freq: 5 },
]

export const LEX = new Lexicon(FIX)
