import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { applyGrade, demutate } from '../pipeline/demutate.ts'
import { softMutate } from '../src/mutate.ts'
import { LEXICON } from '../src/lexicon.ts'
import type { MutationGrade } from '../pipeline/radical.ts'
import type { LexiconFile } from '../pipeline/lexentry.ts'
import type { InitClass } from '../src/types.ts'

const radicals = (surface: string, grade: MutationGrade | null) =>
  demutate(surface).filter(c => c.grade === grade).map(c => c.radical)

test('demutate: table cases across all grades', () => {
  // fan: identity + SM of ban/man
  assert.deepEqual(radicals('fan', null), ['fan'])
  assert.deepEqual(new Set(radicals('fan', 'SM')), new Set(['ban', 'man', 'gfan']))
  // g-deletion inverse applies to anything
  assert.ok(radicals('welodd', 'SM').includes('gwelodd'))
  assert.ok(radicals('ardd', 'SM').includes('gardd'))
  // digraphs
  assert.ok(radicals('lan', 'SM').includes('llan'))
  assert.ok(radicals('resymau', 'SM').includes('rhesymau'))
  assert.ok(radicals('ddraig', 'SM').includes('draig'))
  // AM
  assert.ok(radicals('chath', 'AM').includes('cath'))
  assert.ok(radicals('thref', 'AM').includes('tref'))
  assert.ok(radicals('hiaith', 'AM').includes('iaith')) // h-prothesis
  // NM: ngh- read as c-, and mutated-m read as b-
  assert.ok(radicals('nghath', 'NM').includes('cath'))
  assert.ok(radicals('mam', 'NM').includes('bam'))
  // case preservation
  assert.ok(radicals('Gaerdydd', 'SM').includes('Caerdydd'))
  assert.ok(radicals('Welodd', 'SM').includes('Gwelodd'))
})

test('applyGrade agrees with the theory layer softMutate for every SM class', () => {
  const samples: [string, InitClass][] = [
    ['cath', 'c'], ['pen', 'p'], ['tref', 't'], ['gwelodd', 'g'],
    ['beic', 'b'], ['dyn', 'd'], ['llong', 'll'], ['mam', 'm'], ['rhaid', 'rh'],
    ['ysgol', 'other'], ['Cath', 'c'], ['Gwelodd', 'g'],
  ]
  for (const [w, cls] of samples) {
    assert.equal(applyGrade(w, 'SM'), softMutate(w, cls), `SM of ${w}`)
  }
})

test('DoD round-trip: demutate(applyGrade(w, g)) contains w, all grades, whole lexicon', () => {
  const file = JSON.parse(
    readFileSync(new URL('../data/lexicon-full.json', import.meta.url), 'utf8'),
  ) as LexiconFile
  const forms = new Set<string>(Object.values(LEXICON).map(l => l.id))
  for (let i = 0; i < file.entries.length; i += 25) forms.add(file.entries[i]!.form)

  for (const w of forms) {
    for (const g of ['SM', 'AM', 'NM'] as const) {
      const mutated = applyGrade(w, g)
      const hit = demutate(mutated).some(
        c => c.radical === w && (mutated === w ? c.grade === null : c.grade === g),
      )
      assert.ok(hit, `round-trip ${w} under ${g} (surface ${mutated})`)
    }
  }
})
