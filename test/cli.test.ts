import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { judgeText, segment } from '../pipeline/judge.ts'
import { LEX } from './fixture-lexicon.ts'

/** Acceptance suite (WORKSTREAM DoD-1..12). Deterministic assertions run on
 *  the fixture lexicon via judgeText; end-to-end cmd assertions spawn the
 *  real binary with the real layered lexicon (words chosen to resolve from
 *  the COMMITTED layers, so absence of the gitignored Apertium file cannot
 *  fail them). DoD-13 is the suite you are reading plus the report build. */

const cli = (args: string[], input: string): { out: string; code: number } => {
  try {
    const out = execFileSync(process.execPath, ['bin/welsh-sm.ts', ...args], {
      input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'],
    })
    return { out, code: 0 }
  } catch (e) {
    const err = e as { status?: number; stdout?: string }
    return { out: err.stdout ?? '', code: err.status ?? -1 }
  }
}

test('segment: lines and sentence-final punctuation', () => {
  assert.deepEqual(segment('Un. Dau?\nTri'), ['Un.', 'Dau?', 'Tri'])
})

test('DoD-8: ei gath — ambiguity fans out onto the target verdicts', () => {
  const [s] = judgeText('ei gath', LEX)
  const gath = s!.tokens[1]!
  assert.equal(gath.ambiguous, true)
  assert.equal(gath.readings.length, 2)
  const byPrev = new Map(gath.readings.map(r => [r.prevLemma, r]))
  assert.deepEqual(new Set(byPrev.keys()), new Set(['ei.3sgm', 'ei.3sgf']))
  const masc = byPrev.get('ei.3sgm')!
  const fem = byPrev.get('ei.3sgf')!
  assert.equal(masc.verdict.grade, 'SM') // SM predicted, observed SM
  assert.equal(masc.agrees, true)
  assert.equal(fem.verdict.grade, 'AM') // full grade: AM predicted here
  assert.equal(fem.agrees, false) // observed SM anomalous under 3sgf
})

test('prev fan-out only fires on DISTINCT predecessor lemmas', () => {
  // prynu is ambiguous (V vs Vnoun) but both readings share one lemma —
  // the following token must get one unconditional verdict, not a vacuous
  // `if prev=prynu` variant.
  const [s] = judgeText('Rhaid i fi prynu dy gath', LEX)
  const dy = s!.tokens.find(t => t.surface === 'dy')!
  assert.equal(dy.readings.length, 1)
  assert.equal(dy.readings[0]!.prevLemma, undefined)
  // …while genuinely distinct prev lemmas still fan out (DoD-8 unchanged)
  const [ei] = judgeText('ei gath', LEX)
  assert.equal(ei!.tokens[1]!.readings.length, 2)
})

test('full-grade agreement: observed AM/NM confirmed by matching predictions', () => {
  const [s] = judgeText('Gwelodd hi ei chath hi', LEX)
  const chath = s!.tokens[3]!
  assert.equal(chath.readings[0]!.observed, 'AM')
  assert.equal(chath.readings[0]!.verdict.grade, 'AM')
  assert.equal(chath.readings[0]!.predicted, 'chath')
  assert.equal(chath.readings[0]!.agrees, true)
  const [f] = judgeText('fy nghath i', LEX)
  const nghath = f!.tokens[1]!.readings[0]!
  assert.equal(nghath.verdict.grade, 'NM')
  assert.equal(nghath.predicted, 'nghath') // regenerable Welsh, not *fy cath
  assert.equal(nghath.agrees, true)
})

test('DoD-7 shape: yn resolved by context, never by target mutation', () => {
  const [loc] = judgeText('mae hi yn yr ardd', LEX)
  assert.equal(loc!.tokens[2]!.readings[0]!.lemma, 'yn.loc')
  const [pred] = judgeText('mae hi yn dal', LEX)
  assert.equal(pred!.tokens[2]!.readings[0]!.lemma, 'yn.pred')
  // the structural guard is grep-able and type-enforced (tagger.test.ts)
  const src = readFileSync('pipeline/tagger.ts', 'utf8')
  assert.ok(src.includes('STRUCTURAL GUARD'))
  assert.ok(!/interface TargetReadingView \{[^}]*grade/s.test(src))
})

test('DoD-11/12 (fixture): literary pro-drop licenses; impersonal does not', () => {
  const [pro] = judgeText('Gwelais ddraig.', LEX, 'literary')
  const [verb, draig] = pro!.tokens
  assert.equal(verb!.readings[0]!.agrees, true) // radical predicted, radical observed
  assert.deepEqual(draig!.readings[0]!.verdict, { grade: 'SM', licensedBy: ['synt:xp-edge'] })
  assert.equal(draig!.readings[0]!.agrees, true)

  const [imp] = judgeText('Gwelwyd dyn.', LEX, 'literary')
  assert.equal(imp!.tokens[0]!.readings[0]!.person, '0')
  assert.deepEqual(imp!.tokens[1]!.readings[0]!.verdict, { grade: 'none', reason: 'no-license' })
})

test('cmd: DoD-1/3/4/6/10 in one colloquial --json run', () => {
  const input = "i'r dre\nWelodd Mair ddraig.\nPwy welodd ddraig?\ny llong\ny gath\nGwelodd hi zeb."
  const { out, code } = cli(['--json'], input)
  assert.equal(code, 0)
  const doc = JSON.parse(out)
  const [dre, dom, wh, llong, gath, zeb] = doc.sentences

  // DoD-1: clitic tokenization + de-mutation round trip
  assert.deepEqual(dre.tokens.map((t: { surface: string }) => t.surface), ['i', "'r", 'dre'])
  const dreR = dre.tokens[2].readings.find((r: { radical: string }) => r.radical === 'tre')
  assert.equal(dreR.observed, 'SM')
  assert.deepEqual(dreR.verdict, { grade: 'SM', licensedBy: ['gend:art-fem-sg'] })

  // DoD-3: DOM end to end
  const welodd = dom.tokens[0].readings.find((r: { radical: string }) => r.radical === 'Gwelodd')
  assert.deepEqual(welodd.verdict.licensedBy, ['synt:v1-aff'])
  const ddraig = dom.tokens[2].readings.find((r: { radical: string }) => r.radical === 'draig')
  assert.deepEqual(ddraig.verdict.licensedBy, ['synt:xp-edge'])

  // DoD-4: gap inserted between verb and object
  assert.equal(wh.tree.children[2].kind, 'gap')
  assert.equal(wh.tree.children[2].reason, 'extraction')
  const whDraig = wh.tokens[2].readings.find((r: { radical: string }) => r.radical === 'draig')
  assert.deepEqual(whDraig.verdict.licensedBy, ['synt:xp-edge'])

  // DoD-6: gender system gated by lexicon features
  const llongR = llong.tokens[1].readings.find((r: { radical: string }) => r.radical === 'llong')
  // ll- spared by the SM-ltd article frame: full-grade reports the sparing
  // counterfactually (the rule fired; this initial has no shape under it)
  assert.deepEqual(llongR.verdict, { grade: 'none', reason: 'veto:no-reflex', suppressed: ['gend:art-fem-sg'] })
  const gathR = gath.tokens[1].readings.find((r: { radical: string }) => r.radical === 'cath')
  assert.deepEqual(gathR.verdict, { grade: 'SM', licensedBy: ['gend:art-fem-sg'] })

  // DoD-10: OOV flagged, never crashes, exit 0
  const zebT = zeb.tokens.find((t: { surface: string }) => t.surface === 'zeb')
  assert.equal(zebT.unknown, true)
  assert.equal(zebT.readings[0].verdict.grade, 'none')
})

test('cmd: DoD-9/11/12 — the register toggle changes exactly the v1 verdicts', () => {
  const input = 'Gwelodd Mair ddraig.\nGwelais ddraig.\nGwelwyd dyn.'
  const coll = JSON.parse(cli(['--json'], input).out)
  const lit = JSON.parse(cli(['--json', '--register', 'literary'], input).out)

  // DoD-9: colloquial flags the radical verb; literary agrees; object identical
  const collVerb = coll.sentences[0].tokens[0].readings[0]
  const litVerb = lit.sentences[0].tokens[0].readings[0]
  assert.equal(collVerb.verdict.grade, 'SM') // predicted °Welodd
  assert.equal(collVerb.agrees, false) // observed radical Gwelodd
  assert.equal(litVerb.verdict.grade, 'none')
  assert.equal(litVerb.agrees, true)
  assert.deepEqual(
    coll.sentences[0].tokens[2].readings[0].verdict,
    lit.sentences[0].tokens[2].readings[0].verdict,
  )

  // DoD-11: pro-drop through the real pipeline, literary
  const pro = lit.sentences[1]
  assert.equal(pro.tree.children[1].kind, 'gap')
  assert.equal(pro.tree.children[1].reason, 'pro')
  const proDraig = pro.tokens[1].readings.find((r: { radical: string }) => r.radical === 'draig')
  assert.deepEqual(proDraig.verdict, { grade: 'SM', licensedBy: ['synt:xp-edge'] })

  // DoD-12: impersonal takes no gap; object radical, no license
  const imp = lit.sentences[2]
  assert.equal(imp.tree.children.some((c: { kind: string }) => c.kind === 'gap'), false)
  assert.deepEqual(imp.tokens[1].readings[0].verdict, { grade: 'none', reason: 'no-license' })
})

test('cmd: DoD-2/5 — explain shows the MWE trigger and negative invariants', () => {
  const { out, code } = cli(['--explain'], 'ar ôl cinio\ncath merch')
  assert.equal(code, 0)
  assert.ok(out.includes('ar ôl ⟨')) // the MWE preposition is one leaf
  assert.ok(out.includes('radical (no-license)'))
  const merchBlock = out.split('\n\n')[1]!
  assert.ok(merchBlock.includes('merch'))
  assert.ok(!merchBlock.includes('DISAGREES'))
})

test('cmd: an already-mutated citation form dedups against its radical lexeme', () => {
  // the broad lexicon carries ddim as its own lemma; ddim ⟨Adv⟩ and
  // dim ⟨Adv⟩ + SM are ONE lexeme, so the mutated spelling never surfaces
  // as a reading — no face-value radical, no second mutation (*dddim)
  const { out, code } = cli(['--explain'], 'chlywais i ddim')
  assert.equal(code, 0)
  assert.ok(!out.includes('ddim ⟨'))
  assert.ok(!out.includes('DISAGREES'))
  assert.ok(!out.includes('dddim'))
})

test('cmd: explain renders the constituent tree with gaps and verdicts', () => {
  const { out, code } = cli(['--explain'], 'Pwy welodd ddraig?')
  assert.equal(code, 0)
  assert.ok(out.includes('└─'), 'tree connectors present')
  assert.ok(out.includes('gap:NP (extraction)'), 'extraction gap shown')
  assert.ok(out.includes('→ SM (synt:xp-edge)'), 'per-leaf verdicts shown')
})

test('cmd: --predict and --explain compose; --json combines with neither', () => {
  const { out, code } = cli(['--predict', '--explain'], 'fy nghath i')
  assert.equal(code, 0)
  const [head, ...detail] = out.trimEnd().split('\n')
  assert.equal(head, 'fy ⁿnghath i') // predicted line view, NM marked ⁿ (King §7)…
  assert.ok(detail.some(l => l.includes('NM (lex:fy)'))) // …with provenance under it
  // prediction view discards the surface: no observed grades, no agreement
  assert.ok(!out.includes('observed'))
  assert.ok(!out.includes('DISAGREES') && !out.includes('✓'))
  assert.equal(cli(['--json', '--predict'], 'x').code, 1)
  assert.equal(cli(['--json', '--explain'], 'x').code, 1)
})

test('cmd: usage errors exit 1; arbitrary UTF-8 exits 0', () => {
  assert.equal(cli(['--register', 'bogus'], 'x').code, 1)
  assert.equal(cli(['--frobnicate'], 'x').code, 1)
  assert.equal(cli([], '🐉 §± ""  zeb—cath\n\n???').code, 0)
})
