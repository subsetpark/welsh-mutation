/**
 * Script: build data/lexicon-full.json from the UD_Welsh-CCG train+dev
 * splits. The test split is HELD OUT for pipeline/coverage.ts — extracting
 * from it would make the coverage report circular.
 *
 * Usage: npm run ud:fetch && npm run ud:extract
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { parseConllu } from './conllu.ts'
import { extractEntries } from './extract.ts'
import type { LexiconFile } from './lexentry.ts'

const UD_DIR = new URL('../data/ud/', import.meta.url)
const OUT = new URL('../data/lexicon-full.json', import.meta.url)
const SPLITS = ['cy_ccg-ud-train.conllu', 'cy_ccg-ud-dev.conllu']

const sentences = SPLITS.flatMap(f => parseConllu(readFileSync(new URL(f, UD_DIR), 'utf8')))
const { entries, unrecoverable } = extractEntries(sentences)

const file: LexiconFile = {
  _license: 'CC-BY-SA-4.0',
  _source:
    'Extracted from UD_Welsh-CCG r2.18 (train+dev splits; test split held out for coverage), ' +
    'CC BY-SA 4.0, Heinecke & Tyers 2019 (https://github.com/UniversalDependencies/UD_Welsh-CCG). ' +
    'ShareAlike: this derived file is itself licensed CC BY-SA 4.0 (unlike the rest of this ' +
    'repository, which is MIT). ' +
    'Radical forms recovered via the Mutation feature + lemma initial (pipeline/radical.ts). ' +
    'Regenerate: npm run ud:fetch && npm run ud:extract.',
  entries,
}
writeFileSync(OUT, JSON.stringify(file, null, 1) + '\n')

console.log(`sentences: ${sentences.length}`)
console.log(`entries:   ${entries.length}`)
console.log(`unrecoverable mutated tokens skipped: ${unrecoverable.length}`)
for (const u of unrecoverable.slice(0, 10)) {
  console.log(`  ${u.grade}: ${u.form} (lemma ${u.lemma})`)
}
