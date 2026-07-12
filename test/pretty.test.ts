import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prettyTree } from '../src/pretty.ts'
import { clause, gap, leaf, phrase } from '../src/tree.ts'
import { LEXICON } from '../src/lexicon.ts'

const { gweld, Mair, ty, dylu, ti, dim, yn, draig, pwy } = LEXICON


test('plain rendering: indices on connectors, features, lemma override, gap', () => {
  const root = clause('S', [
    phrase('NP', [leaf(pwy)]),
    leaf(gweld),
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
    leaf(gweld),
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
    leaf(dylu),
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
