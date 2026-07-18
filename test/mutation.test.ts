import { test } from 'node:test'
import assert from 'node:assert/strict'
import { agreesWithObservedGrade, mutation, sm } from '../theory/predicate.ts'
import { applyGrade } from '../theory/orthography.ts'
import { LEXICON as L } from '../theory/lexicon.ts'
import type { Environment, Lexeme } from '../theory/types.ts'
import { judgeText } from '../pipeline/judge.ts'
import { LEX } from './fixture-lexicon.ts'

const after = (lemma: string, isXPRightEdge = false): Environment => ({
  prev: { lemma, relationToTarget: 'dependent', isXPRightEdge },
  agreement: null,
  position: null,
})
const at = (position: Environment['position']): Environment => ({
  prev: null,
  agreement: null,
  position,
})

test('mutation(): full-grade verdicts across the trigger lexicon', () => {
  assert.deepEqual(mutation(L.cath, after('fy')), { grade: 'NM', licensedBy: ['lex:fy'] })
  assert.deepEqual(mutation(L.cath, after('ei.3sgf')), { grade: 'AM', licensedBy: ['lex:ei.3sgf'] })
  assert.deepEqual(mutation(L.cath, after('ei.3sgm')), { grade: 'SM', licensedBy: ['lex:ei.3sgm'] })
  // h-prothesis: AM's reflex on the vowel class
  assert.deepEqual(mutation(L.ysgol, after('ei.3sgf')), { grade: 'AM', licensedBy: ['lex:ei.3sgf'] })
  assert.equal(applyGrade('ysgol', 'AM'), 'hysgol')
})

test('mutation(): mixed splits by initial; vetoes report counterfactually', () => {
  assert.deepEqual(mutation(L.colli, at('v1-finite-neg')), {
    grade: 'AM', licensedBy: ['synt:v1-neg-mixed'], // c- takes mixed's AM half
  })
  assert.deepEqual(mutation(L.dylu, at('v1-finite-neg')), {
    grade: 'SM', licensedBy: ['synt:v1-neg-mixed'], // d- takes the SM half
  })
  // immutable veto suppresses whatever resolved
  const gem = mutation(L.gem, after('y'))
  assert.deepEqual(gem, { grade: 'none', reason: 'veto:immutable', suppressed: ['gend:art-fem-sg'] })
  // SM-ltd sparing of ll- is a counterfactual no-reflex, not silence
  assert.deepEqual(mutation(L.llong, after('y')), {
    grade: 'none', reason: 'veto:no-reflex', suppressed: ['gend:art-fem-sg'],
  })
})

test('mutation() vs sm(): projections agree on SM; divergence is documented', () => {
  // consistency: sm().mutates ⟺ mutation().grade === 'SM'
  const cases: [Lexeme, Environment][] = [
    [L.cath, after('y')], [L.cath, after('fy')], [L.cath, after('ei.3sgm')],
    [L.dyn, after('i')], [L.merch, { prev: { lemma: 'cath', relationToTarget: 'possessor', isXPRightEdge: false }, agreement: null, position: null }],
  ]
  for (const [lex, env] of cases) {
    assert.equal(sm(lex, env).mutates, mutation(lex, env).grade === 'SM')
  }
  // the documented semantic difference: an AM frame over a g-initial is
  // no-license for the SM question, no-reflex for the full-grade one
  assert.deepEqual(sm(L.gorsaf, after('ei.3sgf')), { mutates: false, reason: 'no-license' })
  assert.deepEqual(mutation(L.gorsaf, after('ei.3sgf')), {
    grade: 'none', reason: 'veto:no-reflex', suppressed: ['lex:ei.3sgf'],
  })
})

test('conflict policy: specific contact grade beats configurational SM', () => {
  // artificial but type-legal: an NM contact license and an XP edge at once
  const both = after('fy', true)
  assert.deepEqual(mutation(L.cath, both), { grade: 'NM', licensedBy: ['lex:fy'] })
  // agreement helper is plain grade equality
  assert.equal(agreesWithObservedGrade(mutation(L.cath, both), 'NM'), true)
  assert.equal(agreesWithObservedGrade(mutation(L.cath, both), 'SM'), false)
  assert.equal(agreesWithObservedGrade({ grade: 'none', reason: 'no-license' }, null), true)
})

test('end to end: predictions are regenerable Welsh across all grades', () => {
  const [nm] = judgeText('fy nghath i', LEX)
  assert.equal(nm!.tokens[1]!.readings[0]!.predicted, 'nghath')
  const [am] = judgeText('Gwelodd hi ei chath hi', LEX)
  assert.equal(am!.tokens[3]!.readings[0]!.predicted, 'chath')
  const [h] = judgeText('Gwelodd hi ei hysgol hi', LEX)
  assert.equal(h!.tokens[3]!.readings[0]!.predicted, 'hysgol')
  assert.equal(h!.tokens[3]!.readings[0]!.agrees, true)
})
