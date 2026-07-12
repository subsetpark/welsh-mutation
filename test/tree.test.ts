import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sm } from '../src/predicate.ts'
import {
  clause, environmentFor, gap, leaf, phrase, resolveLeaf,
  type TreeNode, type TreePath,
} from '../src/tree.ts'
import { LEXICON as LEX } from '../src/lexicon.ts'
import type { RuleId } from '../src/types.ts'

const check = (name: string, root: TreeNode, path: TreePath, expected: RuleId[] | 'radical') =>
  test(name, () => {
    const target = resolveLeaf(root, path)
    const env = environmentFor(root, path)
    const r = sm(target.lexeme, env)
    if (expected === 'radical') {
      assert.equal(r.mutates, false, `expected radical, got ${JSON.stringify({ r, env })}`)
    } else {
      assert.equal(r.mutates, true, `expected SM, got ${JSON.stringify({ r, env })}`)
      if (r.mutates) assert.deepEqual(r.licensedBy.sort(), expected.sort())
    }
  })

// ─── DOM core (King §14; XPTH) ───
check('Gwelodd Mair DŶ — DOM from subject-NP edge',
  clause('S', [leaf(LEX.gweld), phrase('NP', [leaf(LEX.Mair)]), phrase('NP', [leaf(LEX.ty)])]),
  [2, 0], ['synt:xp-edge'])

check('Roedd dyn wedi prynu BEIC — nonfinite object stays radical',
  clause('S', [
    leaf(LEX.roedd),
    phrase('NP', [leaf(LEX.dyn)]),
    leaf(LEX.wedi),
    phrase('VNP', [leaf(LEX.prynu), phrase('NP', [leaf(LEX.beic)])]),
  ]),
  [3, 1, 0], 'radical')

// Green's decisive case: nonfinite object DOES mutate when a PP intervenes
check('prynu [yn y dre] FEIC — intervening PP licenses via its right edge',
  clause('S', [
    leaf(LEX.roedd),
    phrase('NP', [leaf(LEX.dyn)]),
    leaf(LEX.wedi),
    phrase('VNP', [
      leaf(LEX.prynu),
      phrase('PP', [leaf(LEX.yn, 'yn.loc'), phrase('NP', [leaf(LEX.y), leaf(LEX.tre)])]),
      phrase('NP', [leaf(LEX.beic)]),
    ]),
  ]),
  [3, 2, 0], ['synt:xp-edge'])

check('BEIC prynodd y ddynes — fronted object, nothing precedes',
  clause('S', [
    phrase('NP', [leaf(LEX.beic)]),
    leaf(LEX.prynodd),
    phrase('NP', [leaf(LEX.y), leaf(LEX.dynes)]),
  ]),
  [0, 0], 'radical')

// c-command must come from the MAXIMAL phrase ending at prev (PP, not the NP inside it)
check('Rhaid i Emrys FYND — PP right edge c-commands the VN',
  clause('S', [
    leaf(LEX.rhaid),
    phrase('PP', [leaf(LEX.i), phrase('NP', [leaf(LEX.Emrys)])]),
    phrase('VNP', [leaf(LEX.mynd)]),
  ]),
  [2, 0], ['synt:xp-edge'])

check('Pwy welodd _ DDRAIG — extraction gap counts as an XP',
  clause('S', [
    phrase('NP', [leaf(LEX.pwy)]),
    leaf(LEX.gweld),
    gap('NP'),
    phrase('NP', [leaf(LEX.draig)]),
  ]),
  [3, 0], ['synt:xp-edge'])

// ─── contact + gender through the tree ───
check('i DŶ — preposition head, relation=dependent',
  phrase('PP', [leaf(LEX.i), phrase('NP', [leaf(LEX.ty)])]),
  [1, 0], ['lex:i'])

check('y GATH — article frame via lemma y',
  phrase('NP', [leaf(LEX.y), leaf(LEX.cath)]),
  [1], ['gend:art-fem-sg'])

check('cath MERCH — possessor derived from genitive configuration',
  phrase('NP', [leaf(LEX.cath), phrase('NP', [leaf(LEX.merch)])]),
  [1, 0], 'radical')

check('y ferch fach WEN — agreement from NP head across the chain',
  phrase('NP', [leaf(LEX.y), leaf(LEX.merch), phrase('AP', [leaf(LEX.bach)]), phrase('AP', [leaf(LEX.gwyn)])]),
  [3, 0], ['gend:agr-mod'])

// The datum forcing the NP-internal XPTH exclusion: masculine chains show
// no mutation, so AP(mawr)'s edge must not license coch.
check('ci mawr COCH — masc chain: no gender license, no NP-internal xp-edge',
  phrase('NP', [leaf(LEX.ci), phrase('AP', [leaf(LEX.mawr)]), phrase('AP', [leaf(LEX.coch)])]),
  [2, 0], 'radical')

// ─── positions from tree geometry ───
{
  const golles_ir_tocyn = () => clause('S', [
    leaf(LEX.colli),
    phrase('NP', [leaf(LEX.i_pron)]),
    phrase('NP', [leaf(LEX.y), leaf(LEX.tocyn)]),
  ])
  check("GOLLES i'r tocyn — clause-initial finite verb (colloquial v1)",
    golles_ir_tocyn(), [0], ['synt:v1-aff'])
  // …and in the same sentence the definite object stays radical: the
  // subject's XP edge lands on 'r (no SM reflex), not on tocyn.
  check("Golles i'r TOCYN — DOM lands on the article, noun stays radical",
    golles_ir_tocyn(), [2, 1], 'radical')
}

check('DDylset ti ddim — negative clause-initial verb takes mixed',
  clause('S', [leaf(LEX.dylu), phrase('NP', [leaf(LEX.ti)]), leaf(LEX.dim)], 'neg'),
  [0], ['synt:v1-neg-mixed'])

check('Ddylset ti DDIM — dim mutates off the subject XP edge (King §11a)',
  clause('S', [leaf(LEX.dylu), phrase('NP', [leaf(LEX.ti)]), leaf(LEX.dim)], 'neg'),
  [2], ['synt:xp-edge'])

check('os DAW e — subordinator inside the clause shields v1 (King §502)',
  clause('S', [leaf(LEX.os), leaf(LEX.dod), phrase('NP', [leaf(LEX.e)])]),
  [1], 'radical')

// ─── path addressing: soundness with repeated words ───
{
  // Gwelodd y dyn DDYN 'the man saw a man': same lexeme twice, opposite
  // verdicts, distinguished purely positionally.
  const tree = () => clause('S', [
    leaf(LEX.gweld),
    phrase('NP', [leaf(LEX.y), leaf(LEX.dyn)]),
    phrase('NP', [leaf(LEX.dyn)]),
  ])
  check('Gwelodd y DYN ddyn — first token radical (masc after article)',
    tree(), [1, 1], 'radical')
  check('Gwelodd y dyn DDYN — second token mutates (DOM)',
    tree(), [2, 0], ['synt:xp-edge'])
}

test('aliased node object is rejected — geometry requires a genuine tree', () => {
  const shared = leaf(LEX.dyn)
  const root = clause('S', [
    leaf(LEX.gweld),
    phrase('NP', [shared]),
    phrase('NP', [shared]),
  ])
  assert.throws(() => environmentFor(root, [2, 0]), /appears twice/)
})

test('path validation: non-leaf and out-of-range paths throw', () => {
  const root = phrase('NP', [leaf(LEX.y), leaf(LEX.cath)])
  assert.throws(() => environmentFor(root, []), /must address a Leaf/)
  assert.throws(() => environmentFor(root, [5]), /no child/)
  assert.throws(() => environmentFor(root, [1, 0]), /descends through a terminal/)
})
