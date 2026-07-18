import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initClassOf } from '../theory/orthography.ts'
import { recoverRadical } from '../pipeline/radical.ts'
import { extractEntries } from '../pipeline/extract.ts'
import { parseConllu } from '../pipeline/conllu.ts'
import { softMutate } from '../theory/orthography.ts'
import type { InitClass } from '../theory/types.ts'

test('initClassOf: digraph-aware', () => {
  assert.equal(initClassOf('llong'), 'll')
  assert.equal(initClassOf('rhaid'), 'rh')
  assert.equal(initClassOf('chwech'), 'other') // ch- is not c-
  assert.equal(initClassOf('ffenest'), 'other') // ff- is not f-
  assert.equal(initClassOf('thema'), 'other') // th- is not t-
  assert.equal(initClassOf('tŷ'), 't')
  assert.equal(initClassOf('Gaerdydd'), 'g')
  assert.equal(initClassOf('ysgol'), 'v')
  assert.equal(initClassOf('mam'), 'm')
})

test('recoverRadical: SM/AM/NM via lemma initial, case preserved', () => {
  assert.equal(recoverRadical('welodd', 'gweld', 'SM'), 'gwelodd') // g-deletion
  assert.equal(recoverRadical('fam', 'mam', 'SM'), 'mam') // f ← m, not b
  assert.equal(recoverRadical('feic', 'beic', 'SM'), 'beic') // f ← b
  assert.equal(recoverRadical('reidrwydd', 'rheidrwydd', 'SM'), 'rheidrwydd')
  assert.equal(recoverRadical('Gaerdydd', 'Caerdydd', 'SM'), 'Caerdydd')
  assert.equal(recoverRadical('chath', 'cath', 'AM'), 'cath')
  assert.equal(recoverRadical('hiaith', 'iaith', 'AM'), 'iaith') // h-prothesis
  assert.equal(recoverRadical('nhad', 'tad', 'NM'), 'tad')
  assert.equal(recoverRadical('ngardd', 'gardd', 'NM'), 'gardd')
  // inconsistent: form does not start with the expected mutated segment
  assert.equal(recoverRadical('aeth', 'mynd', 'SM'), null)
  // grade has no reflex for the lemma initial
  assert.equal(recoverRadical('ardd', 'gardd', 'AM'), null)
})

test('recoverRadical round-trips src/mutate.softMutate for every SM class', () => {
  const radicals: [string, InitClass][] = [
    ['cath', 'c'], ['pen', 'p'], ['tref', 't'], ['gardd', 'g'],
    ['beic', 'b'], ['dyn', 'd'], ['llong', 'll'], ['mam', 'm'], ['rhaid', 'rh'],
  ]
  for (const [w, cls] of radicals) {
    assert.equal(recoverRadical(softMutate(w, cls), w, 'SM'), w, `round-trip ${w}`)
  }
})

const FIXTURE = [
  '1\tWelwyd\tgweld\tVERB\tverb\tMood=Ind|Mutation=SM|Person=0|Tense=Past|VerbForm=Fin\t0\troot\t_\t_',
  '2\tgath\tcath\tNOUN\tnoun\tGender=Fem|Mutation=SM|Number=Sing\t1\tobj\t_\t_',
  '3\tddoe\tddoe\tADV\tadv\t_\t1\tadvmod\t_\t_',
  '4\tfynd\tmynd\tNOUN\tnoun\tMutation=SM|VerbForm=Vnoun\t1\txcomp\t_\t_',
  '5\ti\ti\tADP\tprep\t_\t6\tcase\t_\t_',
  '6\tFangor\tBangor\tPROPN\tprop\tMutation=SM\t4\tobl\t_\t_',
  '7\tDewch\tdod\tVERB\tverb\tMood=Imp|Number=Plur|Person=2\t1\tparataxis\t_\t_',
  '8\tgath\tcath\tNOUN\tnoun\tGender=Fem|Mutation=SM|Number=Sing\t1\tobj\t_\t_',
  '9\t3\t3\tNUM\tnum\tNumForm=Digit\t1\tnummod\t_\t_',
  '10\taeth\tmynd\tVERB\tverb\tMood=Ind|Mutation=SM|Person=3|VerbForm=Fin\t1\tconj\t_\t_',
  '',
].join('\n')

test('extractEntries: cat mapping, radical recovery, dedupe, skips', () => {
  const { entries, unrecoverable } = extractEntries(parseConllu(FIXTURE))

  const byForm = (f: string) => entries.filter(e => e.form === f)

  // impersonal finite verb, recovered radical, Person=0 preserved
  const gwelwyd = byForm('gwelwyd')[0]
  assert.ok(gwelwyd)
  assert.deepEqual(
    { lemma: gwelwyd.lemma, cat: gwelwyd.cat, person: gwelwyd.person, initClass: gwelwyd.initClass },
    { lemma: 'gweld', cat: 'V', person: '0', initClass: 'g' },
  )

  // mutated fem noun, twice → freq 2, single entry
  const cath = byForm('cath')
  assert.equal(cath.length, 1)
  assert.deepEqual(
    { gender: cath[0]!.gender, number: cath[0]!.number, freq: cath[0]!.freq, cat: cath[0]!.cat },
    { gender: 'f', number: 'sg', freq: 2, cat: 'N' },
  )

  // Vnoun under UPOS NOUN via VerbForm
  assert.equal(byForm('mynd')[0]?.cat, 'Vnoun')

  // imperative via Mood=Imp; person kept ('2')
  const dewch = byForm('dewch')[0]
  assert.equal(dewch?.cat, 'Vimp')
  assert.equal(dewch?.person, '2')

  // PROPN: radical recovered, capitalization kept, proper flag
  const bangor = byForm('Bangor')[0]
  assert.ok(bangor?.proper)
  assert.equal(bangor?.initClass, 'b')

  // ADV kept; ADP skipped; digit NUM skipped
  assert.equal(byForm('ddoe')[0]?.cat, 'Adv')
  assert.equal(entries.some(e => e.form === 'i'), false)
  assert.equal(entries.some(e => e.form === '3'), false)

  // suppletive aeth (lemma mynd) is unrecoverable under SM — skipped, counted
  assert.equal(entries.some(e => e.form === 'aeth' || e.form === 'maeth'), false)
  assert.deepEqual(unrecoverable, [{ form: 'aeth', lemma: 'mynd', grade: 'SM' }])
})
