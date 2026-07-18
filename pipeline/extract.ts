/**
 * Lexicon extraction from CoNLL-U sentences (WORKSTREAM M1).
 *
 * Open classes only — NOUN/PROPN/VERB/AUX/ADJ/NUM/ADV. Closed classes stay
 * hand-curated: their behavior lives in data/triggers.json and the M3 tagger,
 * and importing them here would shadow lemma-key conventions (yn.loc, ei.3sgm).
 *
 * Tokens with a Mutation feature are stored under their RECOVERED radical
 * form (see radical.ts); unrecoverable ones are counted and skipped, never
 * guessed.
 */

import type { Cat } from '../theory/types.ts'
import type { ConlluSentence, ConlluWord } from './conllu.ts'
import type { LexEntry } from './lexentry.ts'
import { initClassOf } from '../theory/orthography.ts'
import { recoverRadical } from './radical.ts'
import type { MutationGrade } from '../theory/orthography.ts'

const OPEN_CLASS = new Set(['NOUN', 'PROPN', 'VERB', 'AUX', 'ADJ', 'NUM', 'ADV'])
const GRADES = new Set<string>(['SM', 'AM', 'NM'])

function catOf(w: ConlluWord): Cat | null {
  if (w.feats['VerbForm'] === 'Vnoun') return 'Vnoun' // also under UPOS NOUN
  if ((w.upos === 'VERB' || w.upos === 'AUX') && w.feats['Mood'] === 'Imp') return 'Vimp'
  switch (w.upos) {
    case 'VERB': case 'AUX': return 'V'
    case 'NOUN': case 'PROPN': return 'N'
    case 'ADJ': return 'Adj'
    case 'NUM': return 'Num'
    case 'ADV': return 'Adv'
    default: return null
  }
}

export interface ExtractResult {
  entries: LexEntry[]
  /** Open-class tokens whose mutated form failed radical recovery. */
  unrecoverable: { form: string; lemma: string; grade: string }[]
}

export function extractEntries(sentences: ConlluSentence[]): ExtractResult {
  const acc = new Map<string, LexEntry>()
  const unrecoverable: ExtractResult['unrecoverable'] = []

  for (const s of sentences) {
    for (const w of s.words) {
      if (!OPEN_CLASS.has(w.upos)) continue
      if (!/^\p{L}/u.test(w.form)) continue // digits, symbols
      const cat = catOf(w)
      if (cat === null) continue

      const grade = w.feats['Mutation']
      let radical: string
      if (grade !== undefined) {
        if (!GRADES.has(grade)) continue
        const r = recoverRadical(w.form, w.lemma, grade as MutationGrade)
        if (r === null) {
          unrecoverable.push({ form: w.form, lemma: w.lemma, grade })
          continue
        }
        radical = r
      } else {
        radical = w.form
      }

      const proper = w.upos === 'PROPN'
      const form = proper ? radical : radical.toLowerCase()
      const lemma = w.lemma
      const gender =
        w.feats['Gender'] === 'Masc' ? 'm' : w.feats['Gender'] === 'Fem' ? 'f' : undefined
      const number =
        w.feats['Number'] === 'Sing' ? 'sg' : w.feats['Number'] === 'Plur' ? 'pl' : undefined
      const person =
        (cat === 'V' || cat === 'Vimp') && /^[0-3]$/.test(w.feats['Person'] ?? '')
          ? (w.feats['Person'] as LexEntry['person'])
          : undefined

      const key = [form, lemma, cat, gender ?? '', number ?? '', person ?? '', proper ? 'P' : ''].join('|')
      const prev = acc.get(key)
      if (prev) {
        prev.freq += 1
      } else {
        acc.set(key, {
          form, lemma, cat,
          initClass: initClassOf(form),
          ...(gender ? { gender } : {}),
          ...(number ? { number } : {}),
          ...(person ? { person } : {}),
          ...(proper ? { proper } : {}),
          freq: 1,
        })
      }
    }
  }

  const entries = [...acc.values()].sort((a, b) =>
    a.form.localeCompare(b.form, 'cy') || a.lemma.localeCompare(b.lemma, 'cy') || a.cat.localeCompare(b.cat),
  )
  return { entries, unrecoverable }
}
