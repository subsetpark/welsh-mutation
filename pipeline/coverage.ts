/**
 * Script: coverage of the layered lexicon over the HELD-OUT UD test split
 * (never fed to extraction). Headline: % of open-class word tokens whose
 * radical form resolves to ≥1 lexicon entry (M1 DoD). The stricter same-cat
 * rate and a per-UPOS table are printed alongside; closed-class/punct tokens
 * are excluded and counted.
 *
 * Operator gate (WORKSTREAM M1): ≥90% form coverage → proceed to M2;
 * below → decide on the Apertium GPL import.
 */

import { readFileSync } from 'node:fs'
import { parseConllu } from './conllu.ts'
import { loadLexicon } from './lexicon.ts'
import { recoverRadical } from './radical.ts'
import type { MutationGrade } from '../theory/orthography.ts'

const OPEN_CLASS = new Set(['NOUN', 'PROPN', 'VERB', 'AUX', 'ADJ', 'NUM', 'ADV'])
const GRADES = new Set<string>(['SM', 'AM', 'NM'])

const url = new URL('../data/ud/cy_ccg-ud-test.conllu', import.meta.url)
const sentences = parseConllu(readFileSync(url, 'utf8'))
const lexicon = loadLexicon()

let excluded = 0
let unrecoverable = 0
const perUpos = new Map<string, { total: number; covered: number }>()
const uncovered = new Map<string, number>()
let total = 0
let covered = 0

for (const s of sentences) {
  for (const w of s.words) {
    if (!OPEN_CLASS.has(w.upos) || !/^\p{L}/u.test(w.form)) {
      excluded++
      continue
    }
    total++
    const stat = perUpos.get(w.upos) ?? { total: 0, covered: 0 }
    stat.total++
    perUpos.set(w.upos, stat)

    const grade = w.feats['Mutation']
    let radical: string | null = w.form
    if (grade !== undefined) {
      radical = GRADES.has(grade) ? recoverRadical(w.form, w.lemma, grade as MutationGrade) : null
    }
    if (radical === null) {
      unrecoverable++
      uncovered.set(w.form, (uncovered.get(w.form) ?? 0) + 1)
      continue
    }
    if (lexicon.lookup(radical).length > 0) {
      covered++
      stat.covered++
    } else {
      uncovered.set(radical, (uncovered.get(radical) ?? 0) + 1)
    }
  }
}

const pct = (a: number, b: number) => (b === 0 ? '—' : ((100 * a) / b).toFixed(1) + '%')

console.log(`lexicon entries: ${lexicon.size}`)
console.log(`held-out open-class tokens: ${total} (excluded closed-class/punct/nonword: ${excluded})`)
console.log(`FORM COVERAGE: ${covered}/${total} = ${pct(covered, total)}`)
console.log(`unrecoverable mutated tokens (counted uncovered): ${unrecoverable}`)
console.log('\nper UPOS:')
for (const [upos, s] of [...perUpos.entries()].sort((a, b) => b[1].total - a[1].total)) {
  console.log(`  ${upos.padEnd(6)} ${String(s.total).padStart(5)}  ${pct(s.covered, s.total)}`)
}
console.log('\ntop uncovered radical forms:')
for (const [form, n] of [...uncovered.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
  console.log(`  ${String(n).padStart(4)}  ${form}`)
}
