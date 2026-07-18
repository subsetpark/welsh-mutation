/**
 * Layered lexicon loader (WORKSTREAM M1).
 *
 * Layer order, later wins:
 *   1. data/lexicon-full.json  — broad, extracted (UD_Welsh-CCG)
 *   2. src/lexicon.ts          — hand-curated; wins on (form=id, cat)
 * then data/immutables.json is applied to the merged result:
 *   - lexeme list: immutable on matching form or lemma
 *   - class 'personal-name': PROPN-derived entries become immutable (the
 *     ratified M1 DoD rule; placename mutation variability is catalogued in
 *     data/contested.json — 'non-welsh-placename' and 'already-mutated' are
 *     not actionable until the pipeline has NER-ish tagging / M2 demutation)
 */

import { existsSync, readFileSync } from 'node:fs'
import type { Lexeme } from '../src/types.ts'
import { LEXICON } from '../src/lexicon.ts'
import type { LexEntry, LexiconFile } from './lexentry.ts'
import immutablesData from '../data/immutables.json' with { type: 'json' }

const dedupeKey = (e: LexEntry): string =>
  [e.form.toLowerCase(), e.lemma, e.cat, e.gender ?? '', e.number ?? '', e.person ?? '', e.proper ? 'P' : ''].join('|')

export class Lexicon {
  private byForm = new Map<string, LexEntry[]>()

  /** `full` = UD-extracted (attested, carries freq); `apertium` = dictionary
   *  bottom layer, added only where the UD layer lacks the exact entry. */
  constructor(full: LexEntry[], apertium: LexEntry[] = []) {
    const udKeys = new Set<string>()
    for (const e of full) {
      udKeys.add(dedupeKey(e))
      this.push({ ...e })
    }
    for (const e of apertium) {
      if (!udKeys.has(dedupeKey(e))) this.push({ ...e })
    }

    // Hand layer: one entry per distinct Lexeme id+cat (handles like ty/gem
    // are mnemonic aliases of the same citation form; dedupe on id+cat).
    const seen = new Set<string>()
    for (const lex of Object.values(LEXICON) as Lexeme[]) {
      const key = `${lex.id.toLowerCase()}|${lex.cat}`
      if (seen.has(key)) continue
      seen.add(key)
      const formKey = lex.id.toLowerCase()
      const existing = this.byForm.get(formKey) ?? []
      this.byForm.set(formKey, existing.filter(e => e.cat !== lex.cat))
      this.push({
        form: lex.id, lemma: lex.id, cat: lex.cat, initClass: lex.initClass,
        ...(lex.gender ? { gender: lex.gender } : {}),
        ...(lex.number ? { number: lex.number } : {}),
        ...(lex.immutable ? { immutable: true } : {}),
        freq: 0,
      })
    }

    const immutableIds = new Set(immutablesData.lexemes.map(l => l.id.toLowerCase()))
    for (const entries of this.byForm.values()) {
      for (const e of entries) {
        if (immutableIds.has(e.form.toLowerCase()) || immutableIds.has(e.lemma.toLowerCase())) {
          e.immutable = true
        }
        if (e.proper) e.immutable = true // class: personal-name (King §12d)
      }
    }
  }

  private push(e: LexEntry): void {
    const key = e.form.toLowerCase()
    const list = this.byForm.get(key)
    if (list) list.push(e)
    else this.byForm.set(key, [e])
  }

  /** All entries whose radical form matches (case-insensitive). */
  lookup(form: string): LexEntry[] {
    return this.byForm.get(form.toLowerCase()) ?? []
  }

  get size(): number {
    let n = 0
    for (const l of this.byForm.values()) n += l.length
    return n
  }
}

/** Bridge to the theory layer: an entry as the Lexeme the predicate consumes. */
export function toLexeme(e: LexEntry): Lexeme {
  return {
    id: e.lemma, cat: e.cat, initClass: e.initClass,
    ...(e.gender ? { gender: e.gender } : {}),
    ...(e.number ? { number: e.number } : {}),
    ...(e.immutable ? { immutable: true } : {}),
  }
}

function readEntries(rel: string): LexEntry[] {
  const url = new URL(rel, import.meta.url)
  if (!existsSync(url)) return []
  return (JSON.parse(readFileSync(url, 'utf8')) as LexiconFile).entries
}

export function loadLexicon(): Lexicon {
  const apertium = readEntries('../data/lexicon-apertium.json')
  if (apertium.length === 0) {
    console.warn(
      'lexicon-apertium.json missing — running on the UD layer only (~86% coverage). ' +
      'Regenerate: npm run apertium:fetch && npm run apertium:extract',
    )
  }
  return new Lexicon(readEntries('../data/lexicon-full.json'), apertium)
}
