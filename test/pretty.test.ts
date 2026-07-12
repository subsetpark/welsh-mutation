import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prettyTree } from '../src/pretty.ts'
import { clause, gap, leaf, phrase } from '../src/tree.ts'
import type { Lexeme } from '../src/types.ts'

const gwelodd: Lexeme = { id: 'gweld', cat: 'V', initClass: 'g' }
const Mair: Lexeme = { id: 'Mair', cat: 'N', initClass: 'm', immutable: true }
const ty: Lexeme = { id: 'tŷ', cat: 'N', gender: 'm', number: 'sg', initClass: 't' }
const dylset: Lexeme = { id: 'dylu', cat: 'V', initClass: 'd' }
const ti: Lexeme = { id: 'ti', cat: 'Other', initClass: 't', immutable: true }
const dim: Lexeme = { id: 'dim', cat: 'Prt', initClass: 'd' }
const yn: Lexeme = { id: 'yn', cat: 'Other', initClass: 'other' }
const draig: Lexeme = { id: 'draig', cat: 'N', gender: 'f', number: 'sg', initClass: 'd' }
const pwy: Lexeme = { id: 'pwy', cat: 'Other', initClass: 'p' }

test('plain rendering: indices on connectors, features, lemma override, gap', () => {
  const root = clause('S', [
    phrase('NP', [leaf(pwy)]),
    leaf(gwelodd),
    gap('NP'),
    phrase('PP', [leaf(yn, 'yn.loc'), phrase('NP', [leaf(draig)])]),
  ])
  assert.equal(prettyTree(root), [
    'S',
    '├─0 NP',
    '│  └─0 pwy ⟨Other⟩',
    '├─1 gweld ⟨V⟩',
    '├─2 gap:NP',
    '└─3 PP',
    '   ├─0 yn ⟨Other⟩ lemma=yn.loc',
    '   └─1 NP',
    '      └─0 draig ⟨N f sg⟩',
  ].join('\n'))
})

test('verdict rendering: every leaf judged with provenance', () => {
  const root = clause('S', [
    leaf(gwelodd),
    phrase('NP', [leaf(Mair)]),
    phrase('NP', [leaf(ty)]),
  ])
  assert.equal(prettyTree(root, { verdicts: true }), [
    'S',
    '├─0 gweld ⟨V⟩ → SM (synt:v1-aff)',
    '├─1 NP',
    '│  └─0 Mair ⟨N⟩ immutable → radical (veto:immutable)',
    '└─2 NP',
    '   └─0 tŷ ⟨N m sg⟩ → SM (synt:xp-edge)',
  ].join('\n'))
})

test('verdict rendering: polarity shown, mixed mutation provenance', () => {
  const root = clause('S', [
    leaf(dylset),
    phrase('NP', [leaf(ti)]),
    leaf(dim),
  ], 'neg')
  assert.equal(prettyTree(root, { verdicts: true }), [
    'S (neg)',
    '├─0 dylu ⟨V⟩ → SM (synt:v1-neg-mixed)',
    '├─1 NP',
    '│  └─0 ti ⟨Other⟩ immutable → radical (veto:immutable)',
    '└─2 dim ⟨Prt⟩ → SM (synt:xp-edge)',
  ].join('\n'))
})
