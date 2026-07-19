import { test } from 'node:test'
import assert from 'node:assert/strict'
import { analyze } from '../pipeline/analyze.ts'
import { tag } from '../pipeline/tagger.ts'
import { chunk } from '../pipeline/chunk.ts'
import { LEX } from './fixture-lexicon.ts'
import { environmentFor, type Leaf, type TreeNode, type TreePath } from '../theory/tree.ts'
import { mutation } from '../theory/predicate.ts'
import { renderSurface } from '../theory/surface.ts'
import type { MutationResult } from '../theory/types.ts'

const parse = (text: string) => chunk(tag(analyze(text, LEX), LEX))

/** Path-exact serialization: leaf = trigger key (lemma) or citation id;
 *  GAP/PRO for gaps; CAT:role[…] / S:neg[…] for phrases and clauses. */
const ser = (n: TreeNode): string => {
  switch (n.kind) {
    case 'leaf':
      // trigger key > radical display form (clitics revert to the lemma id)
      return n.lemma ?? (n.form !== undefined && !n.form.startsWith("'") ? n.form : n.lexeme.id)
    case 'gap':
      return n.reason === 'pro' ? 'PRO' : 'GAP'
    case 'phrase': {
      const role = n.role ? (n.role === 'adverbial' ? ':adv' : ':voc') : ''
      return `${n.cat}${role}[${n.children.map(ser).join(' ')}]`
    }
    case 'clause':
      return `${n.cat}${n.polarity === 'neg' ? ':neg' : ''}[${n.children.map(ser).join(' ')}]`
  }
}

/** mutation() verdict for the nth leaf satisfying pred (default: by lexeme id). */
function judge(root: TreeNode, id: string, nth = 0): MutationResult {
  const hits: { leaf: Leaf; path: TreePath }[] = []
  const walk = (node: TreeNode, path: TreePath) => {
    if (node.kind === 'leaf') {
      if (node.lexeme.id === id) hits.push({ leaf: node, path })
      return
    }
    if (node.kind === 'gap') return
    node.children.forEach((c, i) => walk(c, [...path, i]))
  }
  walk(root, [])
  const hit = hits[nth]
  assert.ok(hit, `no leaf ${id}#${nth}`)
  return mutation(hit.leaf.lexeme, environmentFor(root, hit.path))
}

/** Every tagger-gold sentence, path-exact (M4 DoD), plus the classic set. */
const TREES: [string, string][] = [
  // — the tagger gold suite —
  ['Mae hi yn yr ardd', 'S[mae NP[hi] PP[yn.loc NP[yr gardd]]]'],
  ["Mae hi'n dal", 'S[mae NP[hi] yn.pred AP[tal]]'],
  ['Mae hi yn mynd', 'S[mae NP[hi] yn.prog VNP[mynd]]'],
  ["Mae'r plant yn yr ysgol", 'S[mae NP[y plant] PP[yn.loc NP[yr ysgol]]]'],
  ['Mae e yn athro', 'S[mae NP[e] yn.pred NP[athro]]'],
  ['Mae hi yn Aberystwyth', 'S[mae NP[hi] PP[yn.loc NP[Aberystwyth]]]'],
  ['Mae Mair yn dal', 'S[mae NP[Mair] yn.pred AP[tal]]'],
  ["Mae e'n mynd", 'S[mae NP[e] yn.prog VNP[mynd]]'],
  ["Mae'r gath yn yr ardd", 'S[mae NP[y cath] PP[yn.loc NP[yr gardd]]]'],
  ['yn', 'S[yn.loc]'],
  ['Gwelodd hi ei gath e', 'S[gwelodd NP[hi] NP[ei.3sgm cath e]]'],
  ['Gwelodd hi ei chath hi', 'S[gwelodd NP[hi] NP[ei.3sgf chath hi]]'],
  ['Dyma ei gath', 'S[dyma NP[ei.3sgm cath]]'], // ambiguous ei: first reading
  ['Gwelodd hi ei thŷ hi', 'S[gwelodd NP[hi] NP[ei.3sgf thŷ hi]]'],
  ['Gwelodd ei gath hi', 'S[gwelodd NP[ei.3sgf cath hi]]'],
  ["Aeth hi i'w dŷ e", "S[aeth NP[hi] PP[i NP['w.3sgm tŷ e]]]"],
  ["Aeth hi i'w tŷ nhw", "S[aeth NP[hi] PP[i NP['w.3pl tŷ nhw]]]"],
  ['y dyn a welodd y gath', 'S[NP[y dyn S[a.rel gwelodd GAP NP[y cath]]]]'],
  ['bara a chaws', 'S[NP[bara a.conj chaws]]'],
  ['te a choffi', 'S[NP[te a.conj choffi]]'],
  ['y gath a aeth adre', 'S[NP[y cath S[a.rel aeth GAP AdvP[adre]]]]'],
  ['cath a ci', 'S[NP[cath a.conj ci]]'],
  ['Pwy a welodd y gath?', 'S[NP[pwy] a.rel gwelodd GAP NP[y cath]]'],
  ['Gweles i gath', 'S[gweles NP[i.pron] NP[cath]]'],
  ['Rhaid i Emrys fynd', 'S[NP[rhaid] PP[i NP[Emrys]] VNP[mynd]]'],
  ["Aeth hi i'r dre", 'S[aeth NP[hi] PP[i NP[y tre]]]'],
  ['Es i adre', 'S[es NP[i.pron] AdvP[adre]]'],
  ['fy nghath i', 'S[NP[fy nghath i.pron]]'],
  ["Aeth y plant i'r ysgol", 'S[aeth NP[y plant] PP[i NP[y ysgol]]]'],
  ['Dyma dy gath di', 'S[dyma NP[dy cath ti]]'],
  ['Gwelodd hi ei dy e', 'S[gwelodd NP[hi] NP[ei.3sgm tŷ e]]'],
  ['Gwelodd Mair dy dŷ di', 'S[gwelodd NP[Mair] NP[dy tŷ ti]]'],
  ['y gath', 'S[NP[y cath]]'],
  ['y fan', 'S[NP[y fan]]'],
  ['Gwelodd y dyn ddyn', 'S[gwelodd NP[y dyn] NP[dyn]]'],
  ['Gwelwyd dyn', 'S[gwelwyd NP[dyn]]'],
  ['ar ôl cinio', 'S[PP[ar ôl NP[cinio]]]'],
  ['o dan y bwrdd', 'S[PP[o dan NP[y bwrdd]]]'],
  ['Gwelodd zeb gath', 'S[gwelodd NP[zeb] NP[cath]]'],
  ["Aeth hi i'r dre ar ôl cinio", 'S[aeth NP[hi] PP[i NP[y tre]] PP[ar ôl NP[cinio]]]'],
  // — the classic set —
  ['Gwelodd Mair ddraig', 'S[gwelodd NP[Mair] NP[draig]]'], // DOM
  ['Roedd dyn wedi prynu beic', 'S[roedd NP[dyn] wedi VNP[prynu NP[beic]]]'], // periphrastic
  ['Roedd dyn wedi prynu yn y dre feic',
    'S[roedd NP[dyn] wedi VNP[prynu PP[yn.loc NP[y tre]] NP[beic]]]'], // intervening PP
  ['Beic brynodd y ddynes', 'S[NP[beic] prynodd NP[y dynes]]'], // fronted object
  ['Pwy welodd ddraig?', 'S[NP[pwy] gwelodd GAP NP[draig]]'], // wh question
  ['Gwelais ddraig', 'S[gwelais PRO NP[draig]]'], // literary pro-drop
  ['cath merch', 'S[NP[cath NP[merch]]]'], // possessor immunity
  ['canol y dre', 'S[NP[canol NP[y tre]]]'], // possessor's inside still fires
  ['ci mawr coch', 'S[NP[ci AP[mawr] AP[coch]]]'], // masc adjective chain
  ['y ferch fach wen', 'S[NP[y merch AP[bach] AP[gwen]]]'], // fem adjective chain
  ['Bore da, Mair', 'S[NP[bore AP[da]] NP:voc[Mair]]'], // vocative
  ['Ddydd Sadwrn aeth hi adre', 'S[NP:adv[dydd NP[Sadwrn]] aeth NP[hi] AdvP[adre]]'], // adv-np
  ['Os daw e', 'S[os daw NP[e]]'], // subordinator shields v1
  ['Dyw hi ddim yn mynd', 'S:neg[dyw NP[hi] dim yn.prog VNP[mynd]]'], // polarity
]

test(`chunker gold trees: ${TREES.length} sentences, path-exact`, () => {
  for (const [text, expected] of TREES) {
    assert.equal(ser(parse(text).root), expected, `«${text}»`)
  }
})

test('the contract holds: environmentFor + sm consume chunker output', () => {
  // DOM: object licensed by the subject NP's right edge
  const dom = parse('Gwelodd y dyn ddyn').root
  assert.deepEqual(judge(dom, 'dyn', 1), { grade: 'SM', licensedBy: ['synt:xp-edge'] })
  assert.deepEqual(judge(dom, 'dyn', 0).grade, 'none')

  // pro-drop: the PRO gap's edge licenses the object (amended DoD-11)
  const pro = parse('Gwelais ddraig').root
  assert.deepEqual(judge(pro, 'draig'), { grade: 'SM', licensedBy: ['synt:xp-edge'] })

  // impersonal: no gap, object radical with NO license (amended DoD-12)
  const imp = parse('Gwelwyd dyn').root
  assert.deepEqual(judge(imp, 'dyn'), { grade: 'none', reason: 'no-license' })

  // wh: fronted wh-phrase licenses the verb; the gap licenses the object
  const wh = parse('Pwy welodd ddraig?').root
  assert.deepEqual(judge(wh, 'gweld'), { grade: 'SM', licensedBy: ['synt:xp-edge'] })
  assert.deepEqual(judge(wh, 'draig'), { grade: 'SM', licensedBy: ['synt:xp-edge'] })

  // fronted object: radical (nothing precedes); verb takes the XP edge
  const fr = parse('Beic brynodd y ddynes').root
  assert.equal(judge(fr, 'beic').grade, 'none')
  assert.deepEqual(judge(fr, 'prynu'), { grade: 'SM', licensedBy: ['synt:xp-edge'] })

  // possessor immunity vs the possessor's inside
  assert.deepEqual(judge(parse('cath merch').root, 'merch'), {
    grade: 'none', reason: 'no-license',
  })
  assert.deepEqual(judge(parse('canol y dre').root, 'tre'), {
    grade: 'SM', licensedBy: ['gend:art-fem-sg'],
  })

  // adjective chains: masc radical via NP-internal exclusion; fem agreement
  assert.deepEqual(judge(parse('ci mawr coch').root, 'coch'), {
    grade: 'none', reason: 'no-license',
  })
  const fem = parse('y ferch fach wen').root
  assert.deepEqual(judge(fem, 'bach'), { grade: 'SM', licensedBy: ['gend:agr-mod'] })
  assert.deepEqual(judge(fem, 'gwyn'), { grade: 'SM', licensedBy: ['gend:agr-mod'] })

  // vocative on an immutable name: veto reports the suppressed license
  const voc = judge(parse('Bore da, Mair').root, 'Mair')
  assert.ok(voc.grade === 'none' && voc.reason === 'veto:immutable')
  assert.ok(voc.grade === 'none' && voc.suppressed?.includes('synt:vocative'))

  // adverbial time-NP
  assert.deepEqual(judge(parse('Ddydd Sadwrn aeth hi adre').root, 'dydd'), {
    grade: 'SM', licensedBy: ['synt:adv-np'],
  })

  // subordinator shields clause-initial v1
  assert.equal(judge(parse('Os daw e').root, 'dod').grade, 'none')

  // ddim mutates off the subject XP edge; clause is negative
  const neg = parse('Dyw hi ddim yn mynd')
  assert.equal(neg.root.polarity, 'neg')
  assert.deepEqual(judge(neg.root, 'dim'), { grade: 'SM', licensedBy: ['synt:xp-edge'] })
})

test('displaced subject after a PP head: no pro gap in mae gyda fi …', () => {
  // the possession construction — the subject follows its PP, so the verb
  // is not subjectless and no gap edge may license SM on the PP head
  const { root } = parse('Mae gyda fi rywbeth arall')
  assert.ok(!JSON.stringify(root).includes('"gap"'), 'no gap in the tree')
  assert.deepEqual(judge(root, 'gyda'), { grade: 'none', reason: 'no-license' })
  assert.deepEqual(judge(root, 'rhywbeth'), { grade: 'SM', licensedBy: ['synt:xp-edge'] })
})

test('renderSurface round-trips chunker trees across all grades', () => {
  assert.equal(renderSurface(parse('Roedd dyn wedi prynu beic').root),
    'roedd dyn wedi prynu beic')
  assert.equal(renderSurface(parse('Roedd dyn wedi prynu yn y dre feic').root),
    'roedd dyn wedi prynu yn y °dre °feic')
  assert.equal(renderSurface(parse('cath merch').root), 'cath merch')
  // AM/NM shapes are derived from the verdict and written plain
  assert.equal(renderSurface(parse('fy nghath i').root), 'fy nghath i')
})

test('token↔leaf correspondence covers every non-punct token in order', () => {
  const { leaves } = parse("Aeth hi i'r dre ar ôl cinio")
  assert.deepEqual(
    leaves.map(l => l.token.surface),
    ['Aeth', 'hi', 'i', "'r", 'dre', 'ar ôl', 'cinio'],
  )
  assert.deepEqual(
    leaves.map(l => l.leaf.form ?? l.leaf.lexeme.id),
    ['aeth', 'hi', 'i', "'r", 'tre', 'ar ôl', 'cinio'],
  )
})
