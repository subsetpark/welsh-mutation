import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clause, environmentFor, gap, leaf, phrase } from '../src/tree.ts'
import { sm } from '../src/predicate.ts'
import { renderSurface } from '../src/surface.ts'
import { LEXICON as L } from '../src/lexicon.ts'
import type { Lexeme, Register } from '../src/types.ts'
import { analyze } from '../pipeline/analyze.ts'
import { tag } from '../pipeline/tagger.ts'
import { chunk } from '../pipeline/chunk.ts'
import { LEX } from './fixture-lexicon.ts'

function verdict(root: ReturnType<typeof clause>, path: number[], lexeme: Lexeme, reg: Register) {
  return sm(lexeme, environmentFor(root, path, reg))
}

test('DoD-9 shape: dom-basic judged both ways — only the v1 verdict differs', () => {
  const dom = () =>
    clause('S', [
      leaf(L.gweld, undefined, 'gwelodd'),
      phrase('NP', [leaf(L.Mair)]),
      phrase('NP', [leaf(L.ty)]),
    ])
  const t = dom()

  const collV = verdict(t, [0], L.gweld, 'colloquial')
  assert.deepEqual(collV, { mutates: true, licensedBy: ['synt:v1-aff'] })
  const litV = verdict(t, [0], L.gweld, 'literary')
  assert.deepEqual(litV, { mutates: false, reason: 'no-license' })

  // object mutation identical in both registers
  for (const reg of ['colloquial', 'literary'] as const) {
    assert.deepEqual(verdict(t, [2, 0], L.ty, reg), {
      mutates: true, licensedBy: ['synt:xp-edge'],
    })
  }

  assert.equal(renderSurface(dom()), '°welodd Mair °dŷ')
  assert.equal(renderSurface(dom(), 'literary'), 'gwelodd Mair °dŷ')
})

test('amended M5 DoD: hand-authored pro-drop tree judged literary', () => {
  const t = clause('S', [
    leaf(L.gweld, undefined, 'gwelais'),
    gap('NP', 'pro'),
    phrase('NP', [leaf(L.draig)]),
  ])
  assert.deepEqual(verdict(t, [0], L.gweld, 'literary'), {
    mutates: false, reason: 'no-license', // radical verb: no v1 in literary
  })
  assert.deepEqual(verdict(t, [2, 0], L.draig, 'literary'), {
    mutates: true, licensedBy: ['synt:xp-edge'], // the PRO gap's edge
  })
  assert.equal(renderSurface(t, 'literary'), 'gwelais °ddraig')
})

test('literary mode suppresses v1-neg (mixed) too; other positions survive', () => {
  const neg = clause('S', [leaf(L.dylu, undefined, 'dylset'), phrase('NP', [leaf(L.ti)])], 'neg')
  assert.deepEqual(verdict(neg, [0], L.dylu, 'colloquial'), {
    mutates: true, licensedBy: ['synt:v1-neg-mixed'],
  })
  assert.deepEqual(verdict(neg, [0], L.dylu, 'literary'), {
    mutates: false, reason: 'no-license',
  })

  // vocative and adv-np are register-independent
  const voc = clause('S', [
    phrase('NP', [leaf(L.cath)]),
    phrase('NP', [leaf(L.Dafydd)], 'vocative'),
  ])
  const v = verdict(voc, [1, 0], L.Dafydd, 'literary')
  assert.ok(!v.mutates && v.reason === 'veto:immutable' && v.suppressed?.includes('synt:vocative'))
})

test('M5 audit: a.int (SM, literary interrogative) and oni (mixed) frames', () => {
  const aInt: Lexeme = { id: 'a', cat: 'Other', initClass: 'other' }
  const q = clause('S', [
    leaf(aInt, 'a.int'),
    leaf(L.dod, undefined, 'daw'),
    phrase('NP', [leaf(L.e)]),
  ])
  for (const reg of ['colloquial', 'literary'] as const) {
    assert.deepEqual(verdict(q, [1], L.dod, reg), {
      mutates: true, licensedBy: ['lex:a.int'], // particle present ⇒ no v1
    })
  }

  const oni: Lexeme = { id: 'oni', cat: 'Other', initClass: 'other' }
  const oq = clause('S', [leaf(oni), leaf(L.dod, undefined, 'daw')], 'neg')
  assert.deepEqual(verdict(oq, [1], L.dod, 'literary'), {
    mutates: true, licensedBy: ['lex:oni'], // mixed: SM on d-
  })
  const oc = clause('S', [leaf(oni), leaf(L.colli, undefined, 'collith')], 'neg')
  assert.equal(verdict(oc, [1], L.colli, 'literary').mutates, false) // mixed: AM claims c-
})

test('full pipeline, literary question: A welodd hi ddraig?', () => {
  const { root, leaves } = chunk(tag(analyze('A welodd hi ddraig?', LEX), LEX))
  assert.equal(leaves[0]!.leaf.lemma, 'a.int')

  const draigPath = [3, 0] // S[a.int gwelodd NP[hi] NP[draig]]
  const gwelodd = leaves[1]!.leaf
  assert.deepEqual(sm(gwelodd.lexeme, environmentFor(root, [1], 'literary')), {
    mutates: true, licensedBy: ['lex:a.int'],
  })
  assert.deepEqual(sm(leaves[3]!.leaf.lexeme, environmentFor(root, draigPath, 'literary')), {
    mutates: true, licensedBy: ['synt:xp-edge'],
  })
  assert.equal(renderSurface(root, 'literary'), 'a °welodd hi °ddraig')
})
