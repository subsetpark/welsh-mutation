import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tokenize } from '../pipeline/tokenize.ts'

test('clitic splitting: DoD five with lemma assignment, apostrophe kept', () => {
  assert.deepEqual(tokenize("i'r dre."), [
    { surface: 'i', kind: 'word' },
    { surface: "'r", kind: 'clitic', lemma: 'y' },
    { surface: 'dre', kind: 'word' },
    { surface: '.', kind: 'punct' },
  ])
  assert.deepEqual(tokenize("mae'n")[1], { surface: "'n", kind: 'clitic', lemma: 'yn' })
  assert.deepEqual(tokenize("i'w")[1], { surface: "'w", kind: 'clitic', lemma: 'ei' })
  assert.deepEqual(tokenize("a'm")[1], { surface: "'m", kind: 'clitic', lemma: 'fy' })
  assert.deepEqual(tokenize("a'th")[1], { surface: "'th", kind: 'clitic', lemma: 'dy' })
  assert.deepEqual(tokenize("i'ch")[1], { surface: "'ch", kind: 'clitic', lemma: 'eich' })
})

test('typographic apostrophe normalized; non-clitic apostrophes stay whole', () => {
  assert.equal(tokenize('mae’n')[1]!.surface, "'n")
  assert.deepEqual(tokenize("o'dd"), [{ surface: "o'dd", kind: 'word' }])
})

test('MWE grouping from triggers.json lemmas, longest match, case-insensitive', () => {
  const t = tokenize('Ar ôl cinio')
  assert.deepEqual(t[0], { surface: 'Ar ôl', kind: 'word', lemma: 'ar ôl' })
  assert.equal(t[1]!.surface, 'cinio')
  assert.deepEqual(tokenize('o dan y bwrdd')[0], { surface: 'o dan', kind: 'word', lemma: 'o dan' })
  // no false grouping when the words are separated
  assert.equal(tokenize('ar y ôl').every(tok => tok.lemma === undefined), true)
})

test('punctuation split, arbitrary input never throws', () => {
  assert.deepEqual(tokenize('Pwy welodd?').map(t => t.surface), ['Pwy', 'welodd', '?'])
  assert.deepEqual(tokenize('  '), [])
  assert.ok(tokenize('§±🐉 zeb—cath').length > 0)
})
