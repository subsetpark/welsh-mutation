import { test } from 'node:test'
import assert from 'node:assert/strict'
import { softMutate } from '../theory/orthography.ts'
import { renderSurface } from '../theory/surface.ts'
import { clause, gap, leaf, phrase } from '../theory/tree.ts'
import { LEXICON as L } from '../theory/lexicon.ts'

test('softMutate: all nine mappings, digraphs, case, g-deletion', () => {
  assert.equal(softMutate('cath', 'c'), 'gath')
  assert.equal(softMutate('pen', 'p'), 'ben')
  assert.equal(softMutate('tŷ', 't'), 'dŷ')
  assert.equal(softMutate('gardd', 'g'), 'ardd')
  assert.equal(softMutate('beic', 'b'), 'feic')
  assert.equal(softMutate('drws', 'd'), 'ddrws')
  assert.equal(softMutate('llong', 'll'), 'long')
  assert.equal(softMutate('merch', 'm'), 'ferch')
  assert.equal(softMutate('rhaid', 'rh'), 'raid')
  // case preservation, including across g-deletion
  assert.equal(softMutate('Colles', 'c'), 'Golles')
  assert.equal(softMutate('Gwelodd', 'g'), 'Welodd')
  assert.equal(softMutate('Dwy', 'd'), 'Ddwy')
  assert.equal(softMutate('Llanelli', 'll'), 'Lanelli')
  // no-reflex forms pass through
  assert.equal(softMutate('ysgol', 'other'), 'ysgol')
})

test('renderSurface: mutations applied, ° marked, apostrophe attachment, gap silent', () => {
  const golles = clause('S', [
    leaf(L.colli, undefined, 'colles'),
    phrase('NP', [leaf(L.i_pron)]),
    phrase('NP', [leaf(L.y, 'y', "'r"), leaf(L.tocyn)]),
  ])
  assert.equal(renderSurface(golles), "°golles i'r tocyn")

  const pwy = clause('S', [
    phrase('NP', [leaf(L.pwy)]),
    leaf(L.gweld, undefined, 'gwelodd'),
    gap('NP'),
    phrase('NP', [leaf(L.draig)]),
  ])
  assert.equal(renderSurface(pwy), 'pwy °welodd °ddraig')
})

test('renderSurface: the failure class the verifier exists for — a wrongly radical verb', () => {
  // Authored prose said 'Gwelodd Mair °dŷ'; the analysis says °Welodd.
  const tree = clause('S', [
    leaf(L.gweld, undefined, 'gwelodd'),
    phrase('NP', [leaf(L.Mair)]),
    phrase('NP', [leaf(L.ty)]),
  ])
  assert.equal(renderSurface(tree), '°welodd Mair °dŷ')
})
