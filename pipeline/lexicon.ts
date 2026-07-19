/**
 * Layered lexicon loader (WORKSTREAM M1).
 *
 * Layer order, later wins:
 *   1. data/lexicon-full.json   — broad, extracted (UD_Welsh-CCG)
 *   2. theory/lexicon.ts        — hand-curated; wins on (form=id, cat)
 * then theory/immutables.json is applied to the merged result:
 *   - lexeme list: immutable on matching form or lemma
 *   - class rules, DATA-driven: 'personal-name' maps to PROPN-derived
 *     entries (the ratified M1 DoD reading; placename mutation variability
 *     is catalogued in theory/contested.json); 'preposition' maps by lemma
 *     through the class's member list (closed class, no data signal —
 *     extraction is open-class only). 'non-welsh-placename' and
 *     'already-mutated' have no implementable signal yet and are skipped —
 *     visibly, in UNIMPLEMENTED_CLASSES.
 */

import { existsSync, readFileSync } from 'node:fs'
import type { Lexeme } from '../theory/types.ts'
import { LEXICON } from '../theory/lexicon.ts'
import type { LexEntry, LexiconFile } from './lexentry.ts'
import immutablesData from '../theory/immutables.json' with { type: 'json' }

const dedupeKey = (e: LexEntry): string =>
  [e.form.toLowerCase(), e.lemma, e.cat, e.gender ?? '', e.number ?? '', e.person ?? '', e.proper ? 'P' : ''].join('|')

/** Theory classes the loader cannot yet act on: no NER distinguishes
 *  non-Welsh placenames, and 'already-mutated' needs the de-mutation
 *  context. A NEW class in immutables.json that is neither implemented nor
 *  listed here fails loudly instead of being silently ignored. */
const UNIMPLEMENTED_CLASSES = new Set(['non-welsh-placename', 'already-mutated'])
const IMPLEMENTED_CLASSES = new Set(['personal-name', 'preposition'])

/** The preposition class's member lemmas (theory/immutables.json):
 *  synchronically immutable mutation targets — Tallerman (2006 fn. 6),
 *  citing Ball & Müller (1992: 201). Exported because closed-class
 *  readings are synthesized outside the layered lexicon (analyze's
 *  trigger-lemma fallback, the tagger's homograph expansion) and must
 *  carry the flag too. */
export const PREPOSITION_LEMMAS: ReadonlySet<string> = new Set(
  (immutablesData.classes as { class: string; members?: string[] }[])
    .find(c => c.class === 'preposition')
    ?.members?.map(m => m.toLowerCase()) ?? [],
)

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
    const classRules = new Set(immutablesData.classes.map(c => c.class))
    const personalNames = classRules.has('personal-name')
    const prepositions = classRules.has('preposition')
    for (const entries of this.byForm.values()) {
      for (const e of entries) {
        if (immutableIds.has(e.form.toLowerCase()) || immutableIds.has(e.lemma.toLowerCase())) {
          e.immutable = true
        }
        if (personalNames && e.proper) e.immutable = true // King §12d, via theory data
        // Tallerman 2006 fn. 6; Ball & Müller 1992: 201 — via theory data
        if (prepositions && PREPOSITION_LEMMAS.has(e.lemma.toLowerCase())) e.immutable = true
      }
    }
    for (const c of classRules) {
      if (!IMPLEMENTED_CLASSES.has(c) && !UNIMPLEMENTED_CLASSES.has(c)) {
        throw new Error(`immutability class '${c}' is neither implemented nor declared unimplemented`)
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
