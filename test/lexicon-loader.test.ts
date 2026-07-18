import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Lexicon, toLexeme } from '../pipeline/lexicon.ts'
import type { LexEntry } from '../pipeline/lexentry.ts'

const FULL: LexEntry[] = [
  // collides with hand entry gêm (N) — hand immutable flag must win
  { form: 'gêm', lemma: 'gêm', cat: 'N', gender: 'f', number: 'sg', initClass: 'g', freq: 7 },
  // same form, different cat — must survive the hand overlay
  { form: 'gêm', lemma: 'gêm', cat: 'Adj', initClass: 'g', freq: 1 },
  // in immutables.json lexeme list by lemma
  { form: 'ddoe', lemma: 'ddoe', cat: 'Adv', initClass: 'd', freq: 3 },
  // PROPN → personal-name class rule
  { form: 'Siân', lemma: 'Siân', cat: 'N', initClass: 'other', proper: true, freq: 2 },
  // plain broad entry, untouched by any layer
  { form: 'afal', lemma: 'afal', cat: 'N', gender: 'm', number: 'sg', initClass: 'other', freq: 5 },
]

test('layering: hand-curated entry wins per (form, cat); other cats survive', () => {
  const lex = new Lexicon(FULL)
  const gem = lex.lookup('gêm')
  const n = gem.filter(e => e.cat === 'N')
  assert.equal(n.length, 1)
  assert.equal(n[0]!.immutable, true) // from src/lexicon.ts (King §12e)
  assert.equal(n[0]!.freq, 0) // the hand entry, not the UD one
  assert.equal(gem.filter(e => e.cat === 'Adj').length, 1)
})

test('immutables lexeme list and personal-name class rule applied', () => {
  const lex = new Lexicon(FULL)
  assert.equal(lex.lookup('ddoe')[0]!.immutable, true) // fixed mutation of doe
  assert.equal(lex.lookup('siân')[0]!.immutable, true) // PROPN class rule
  assert.equal(lex.lookup('afal')[0]!.immutable, undefined)
})

test('lookup is case-insensitive; hand lexicon reachable by citation form', () => {
  const lex = new Lexicon([])
  const mair = lex.lookup('mair')
  assert.equal(mair.length, 1)
  assert.equal(mair[0]!.immutable, true)
  const ty = lex.lookup('tŷ')
  assert.equal(ty[0]!.cat, 'N')
  assert.equal(ty[0]!.gender, 'm')
})

test('toLexeme bridges to the theory-layer Lexeme shape', () => {
  const lex = new Lexicon(FULL)
  const lexeme = toLexeme(lex.lookup('afal')[0]!)
  assert.deepEqual(lexeme, { id: 'afal', cat: 'N', initClass: 'other', gender: 'm', number: 'sg' })
})
