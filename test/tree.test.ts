import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sm } from '../src/predicate.ts'
import { clause, environmentFor, gap, leaf, phrase, type TreeNode, type Leaf } from '../src/tree.ts'
import type { Lexeme, RuleId } from '../src/types.ts'

const LEX = {
  gwelodd: { id: 'gweld', cat: 'V', initClass: 'g' },
  golles: { id: 'colli', cat: 'V', initClass: 'c' },
  dylset: { id: 'dylu', cat: 'V', initClass: 'd' },
  roedd: { id: 'bod', cat: 'V', initClass: 'rh' },
  prynodd: { id: 'prynu', cat: 'V', initClass: 'p' },
  daw: { id: 'dod', cat: 'V', initClass: 'd' },
  Mair: { id: 'Mair', cat: 'N', initClass: 'm', immutable: true },
  Emrys: { id: 'Emrys', cat: 'N', initClass: 'other', immutable: true },
  pwy: { id: 'pwy', cat: 'Other', initClass: 'p' },
  ti: { id: 'ti', cat: 'Other', initClass: 't', immutable: true },
  i_pron: { id: 'i.pron', cat: 'Other', initClass: 'other' },
  e: { id: 'e', cat: 'Other', initClass: 'other' },
  ty: { id: 'tŷ', cat: 'N', gender: 'm', number: 'sg', initClass: 't' },
  beic: { id: 'beic', cat: 'N', gender: 'm', number: 'sg', initClass: 'b' },
  draig: { id: 'draig', cat: 'N', gender: 'f', number: 'sg', initClass: 'd' },
  cath: { id: 'cath', cat: 'N', gender: 'f', number: 'sg', initClass: 'c' },
  merch: { id: 'merch', cat: 'N', gender: 'f', number: 'sg', initClass: 'm' },
  dyn: { id: 'dyn', cat: 'N', gender: 'm', number: 'sg', initClass: 'd' },
  dynes: { id: 'dynes', cat: 'N', gender: 'f', number: 'sg', initClass: 'd' },
  tocyn: { id: 'tocyn', cat: 'N', gender: 'm', number: 'sg', initClass: 't' },
  tre: { id: 'tre', cat: 'N', gender: 'f', number: 'sg', initClass: 't' },
  bach: { id: 'bach', cat: 'Adj', initClass: 'b' },
  gwen: { id: 'gwyn', cat: 'Adj', initClass: 'g' },
  mynd: { id: 'mynd', cat: 'Vnoun', initClass: 'm' },
  prynu: { id: 'prynu', cat: 'Vnoun', initClass: 'p' },
  rhaid: { id: 'rhaid', cat: 'N', initClass: 'rh' },
  wedi: { id: 'wedi', cat: 'Prt', initClass: 'other' },
  dim: { id: 'dim', cat: 'Prt', initClass: 'd' },
  y: { id: 'y', cat: 'Other', initClass: 'other' },
  i_prep: { id: 'i', cat: 'Other', initClass: 'other' },
  yn_loc: { id: 'yn', cat: 'Other', initClass: 'other' },
  os: { id: 'os', cat: 'Other', initClass: 'other' },
} satisfies Record<string, Lexeme>

const check = (name: string, root: TreeNode, target: Leaf, expected: RuleId[] | 'radical') =>
  test(name, () => {
    const env = environmentFor(root, target)
    const r = sm(target.lexeme, env)
    if (expected === 'radical') {
      assert.equal(r.mutates, false, `expected radical, got ${JSON.stringify({ r, env })}`)
    } else {
      assert.equal(r.mutates, true, `expected SM, got ${JSON.stringify({ r, env })}`)
      if (r.mutates) assert.deepEqual(r.licensedBy.sort(), expected.sort())
    }
  })

// ─── DOM core (King §14; XPTH) ───
{
  const ty = leaf(LEX.ty)
  check('Gwelodd Mair DŶ — DOM from subject-NP edge',
    clause('S', [leaf(LEX.gwelodd), phrase('NP', [leaf(LEX.Mair)]), phrase('NP', [ty])]),
    ty, ['synt:xp-edge'])
}
{
  const beic = leaf(LEX.beic)
  check('Roedd dyn wedi prynu BEIC — nonfinite object stays radical',
    clause('S', [
      leaf(LEX.roedd),
      phrase('NP', [leaf(LEX.dyn)]),
      leaf(LEX.wedi),
      phrase('VNP', [leaf(LEX.prynu), phrase('NP', [beic])]),
    ]),
    beic, 'radical')
}
{
  // Green's decisive case: nonfinite object DOES mutate when a PP intervenes
  const beic = leaf(LEX.beic)
  check('prynu [yn y dre] FEIC — intervening PP licenses via its right edge',
    clause('S', [
      leaf(LEX.roedd),
      phrase('NP', [leaf(LEX.dyn)]),
      leaf(LEX.wedi),
      phrase('VNP', [
        leaf(LEX.prynu),
        phrase('PP', [leaf(LEX.yn_loc, 'yn.loc'), phrase('NP', [leaf(LEX.y), leaf(LEX.tre)])]),
        phrase('NP', [beic]),
      ]),
    ]),
    beic, ['synt:xp-edge'])
}
{
  const beic = leaf(LEX.beic)
  check('BEIC prynodd y ddynes — fronted object, nothing precedes',
    clause('S', [
      phrase('NP', [beic]),
      leaf(LEX.prynodd),
      phrase('NP', [leaf(LEX.y), leaf(LEX.dynes)]),
    ]),
    beic, 'radical')
}
{
  // c-command must come from the MAXIMAL phrase ending at prev (PP, not the NP inside it)
  const mynd = leaf(LEX.mynd)
  check('Rhaid i Emrys FYND — PP right edge c-commands the VN',
    clause('S', [
      leaf(LEX.rhaid),
      phrase('PP', [leaf(LEX.i_prep), phrase('NP', [leaf(LEX.Emrys)])]),
      phrase('VNP', [mynd]),
    ]),
    mynd, ['synt:xp-edge'])
}
{
  const draig = leaf(LEX.draig)
  check('Pwy welodd _ DDRAIG — extraction gap counts as an XP',
    clause('S', [
      phrase('NP', [leaf(LEX.pwy)]),
      leaf(LEX.gwelodd),
      gap('NP'),
      phrase('NP', [draig]),
    ]),
    draig, ['synt:xp-edge'])
}

// ─── contact + gender through the tree ───
{
  const ty = leaf(LEX.ty)
  check('i DŶ — preposition head, relation=dependent',
    phrase('PP', [leaf(LEX.i_prep), phrase('NP', [ty])]),
    ty, ['lex:i'])
}
{
  const cath = leaf(LEX.cath)
  check('y GATH — article frame via lemma y',
    phrase('NP', [leaf(LEX.y), cath]),
    cath, ['gend:art-fem-sg'])
}
{
  const merch = leaf(LEX.merch)
  check('cath MERCH — possessor branch immune',
    phrase('NP', [leaf(LEX.cath), phrase('NP', [merch])]),
    merch, 'radical')
}
{
  const wen = leaf(LEX.gwen)
  check('y ferch fach WEN — agreement from NP head across the chain',
    phrase('NP', [leaf(LEX.y), leaf(LEX.merch), phrase('AP', [leaf(LEX.bach)]), phrase('AP', [wen])]),
    wen, ['gend:agr-mod'])
}
{
  // The datum forcing the NP-internal XPTH exclusion: masculine chains show
  // no mutation, so AP(mawr)'s edge must not license coch.
  const coch = leaf({ id: 'coch', cat: 'Adj', initClass: 'c' })
  const mawr = leaf({ id: 'mawr', cat: 'Adj', initClass: 'm' })
  check('ci mawr COCH — masc chain: no gender license, no NP-internal xp-edge',
    phrase('NP', [leaf({ id: 'ci', cat: 'N', gender: 'm', number: 'sg', initClass: 'c' }), phrase('AP', [mawr]), phrase('AP', [coch])]),
    coch, 'radical')
}

// ─── positions from tree geometry ───
{
  const golles = leaf(LEX.golles)
  check("GOLLES i'r tocyn — clause-initial finite verb (colloquial v1)",
    clause('S', [golles, phrase('NP', [leaf(LEX.i_pron)]), phrase('NP', [leaf(LEX.y), leaf(LEX.tocyn)])]),
    golles, ['synt:v1-aff'])
}
{
  // …and in the same sentence the definite object stays radical: the subject's
  // XP edge lands on 'r (immutable), not on tocyn.
  const tocyn = leaf(LEX.tocyn)
  check("Golles i'r TOCYN — DOM lands on the article, noun stays radical",
    clause('S', [leaf(LEX.golles), phrase('NP', [leaf(LEX.i_pron)]), phrase('NP', [leaf(LEX.y, 'y'), tocyn])]),
    tocyn, 'radical')
}
{
  const dylset = leaf(LEX.dylset)
  check('DDylset ti ddim — negative clause-initial verb takes mixed',
    clause('S', [dylset, phrase('NP', [leaf(LEX.ti)]), leaf(LEX.dim)], 'neg'),
    dylset, ['synt:v1-neg-mixed'])
}
{
  const dim = leaf(LEX.dim)
  check('Ddylset ti DDIM — dim mutates off the subject XP edge (King §11a)',
    clause('S', [leaf(LEX.dylset), phrase('NP', [leaf(LEX.ti)]), dim], 'neg'),
    dim, ['synt:xp-edge'])
}
{
  const daw = leaf(LEX.daw)
  check('os DAW e — subordinator inside the clause shields v1 (King §502)',
    clause('S', [leaf(LEX.os), daw, phrase('NP', [leaf(LEX.e)])]),
    daw, 'radical')
}
