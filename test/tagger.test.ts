import { test } from 'node:test'
import assert from 'node:assert/strict'
import { analyze } from '../pipeline/analyze.ts'
import { tag, type TaggedToken, type TargetReadingView } from '../pipeline/tagger.ts'
import { Lexicon } from '../pipeline/lexicon.ts'
import type { LexEntry } from '../pipeline/lexentry.ts'

// STRUCTURAL GUARD (DoD-7), compile-time: the target view must not expose
// the observed mutation. If someone adds `grade` to TargetReadingView, this
// line stops compiling.
const _guard: 'grade' extends keyof TargetReadingView ? never : true = true
void _guard

// Fixture lexicon: hand-curated src/lexicon.ts overlays automatically; these
// are the extra open-class forms the gold sentences need. Deterministic — no
// dependency on the gitignored Apertium layer.
const FIX: LexEntry[] = [
  { form: 'gwelodd', lemma: 'gweld', cat: 'V', person: '3', initClass: 'g', freq: 9 },
  { form: 'gweles', lemma: 'gweld', cat: 'V', person: '1', initClass: 'g', freq: 3 },
  { form: 'gwelwyd', lemma: 'gweld', cat: 'V', person: '0', initClass: 'g', freq: 2 },
  { form: 'aeth', lemma: 'mynd', cat: 'V', person: '3', initClass: 'other', freq: 8 },
  { form: 'es', lemma: 'mynd', cat: 'V', person: '1', initClass: 'other', freq: 2 },
  { form: 'gardd', lemma: 'gardd', cat: 'N', gender: 'f', number: 'sg', initClass: 'g', freq: 4 },
  { form: 'athro', lemma: 'athro', cat: 'N', gender: 'm', number: 'sg', initClass: 'other', freq: 3 },
  { form: 'caws', lemma: 'caws', cat: 'N', gender: 'm', number: 'sg', initClass: 'c', freq: 3 },
  { form: 'bara', lemma: 'bara', cat: 'N', gender: 'm', number: 'sg', initClass: 'b', freq: 3 },
  { form: 'te', lemma: 'te', cat: 'N', gender: 'm', number: 'sg', initClass: 't', freq: 3 },
  { form: 'coffi', lemma: 'coffi', cat: 'N', gender: 'm', number: 'sg', initClass: 'c', freq: 3 },
  { form: 'fan', lemma: 'fan', cat: 'N', gender: 'f', number: 'sg', initClass: 'other', freq: 3 },
  { form: 'man', lemma: 'man', cat: 'N', gender: 'm', number: 'sg', initClass: 'm', freq: 3 },
  { form: 'ban', lemma: 'ban', cat: 'N', gender: 'f', number: 'sg', initClass: 'b', freq: 1 },
  { form: 'cinio', lemma: 'cinio', cat: 'N', gender: 'm', number: 'sg', initClass: 'c', freq: 5 },
  { form: 'bwrdd', lemma: 'bwrdd', cat: 'N', gender: 'm', number: 'sg', initClass: 'b', freq: 3 },
  { form: 'Aberystwyth', lemma: 'Aberystwyth', cat: 'N', initClass: 'other', proper: true, freq: 4 },
  { form: 'dal', lemma: 'dal', cat: 'Adj', initClass: 'd', freq: 5 },
  { form: 'dal', lemma: 'dal', cat: 'Vnoun', initClass: 'd', freq: 5 },
  { form: 'nhw', lemma: 'nhw', cat: 'Other', initClass: 'other', freq: 5 },
]
const LEX = new Lexicon(FIX)

/** One line per token: dotted lemma for function words, radical for content
 *  words, `{a|b}` for retained ambiguity, `?` suffix for OOV. */
const repr = (t: TaggedToken): string => {
  if (t.kind === 'punct') return t.surface
  if (t.unknown) return t.surface.toLowerCase() + '?'
  const rs = [...new Set(
    t.readings.map(r => (r.entry.cat === 'Other' ? r.entry.lemma : r.radical.toLowerCase())),
  )].sort()
  return rs.length === 1 ? rs[0]! : `{${rs.join('|')}}`
}

const tagged = (text: string): TaggedToken[] => tag(analyze(text, LEX), LEX)
const gold = (text: string): string => tagged(text).map(repr).join(' ')

/** The gold mini-suite (M3 DoD): King-style examples + UD-style sentences,
 *  each asserting the final readings of every token. */
const GOLD: [string, string][] = [
  // — yn: locative / predicative / progressive —
  ['Mae hi yn yr ardd', 'mae hi yn.loc y gardd'],
  ["Mae hi'n dal", 'mae hi yn.pred dal'],
  ['Mae hi yn mynd', 'mae hi yn.prog mynd'],
  ["Mae'r plant yn yr ysgol", 'mae y plant yn.loc y ysgol'],
  ['Mae e yn athro', 'mae e yn.pred athro'],
  ['Mae hi yn Aberystwyth', 'mae hi yn.loc aberystwyth'],
  ['Mae Mair yn dal', 'mae mair yn.pred dal'],
  ["Mae e'n mynd", 'mae e yn.prog mynd'],
  ["Mae'r gath yn yr ardd", 'mae y cath yn.loc y gardd'],
  ['yn', '{yn.loc|yn.pred|yn.prog}'],
  // — ei / 'w: echo pronoun resolution —
  ['Gwelodd hi ei gath e', 'gwelodd hi ei.3sgm cath e'],
  ['Gwelodd hi ei chath hi', 'gwelodd hi ei.3sgf cath hi'],
  ['Dyma ei gath', 'dyma {ei.3sgf|ei.3sgm} cath'],
  ['Gwelodd hi ei thŷ hi', 'gwelodd hi ei.3sgf tŷ hi'],
  ['Gwelodd ei gath hi', 'gwelodd ei.3sgf cath hi'],
  ["Aeth hi i'w dŷ e", "aeth hi i 'w.3sgm tŷ e"],
  ["Aeth hi i'w tŷ nhw", "aeth hi i 'w.3pl tŷ nhw"],
  // — a: relative particle vs conjunction —
  ['y dyn a welodd y gath', 'y dyn a.rel gwelodd y cath'],
  ['bara a chaws', '{bara|para} a.conj caws'],
  ['te a choffi', 'te a.conj coffi'],
  ['y gath a aeth adre', 'y cath a.rel aeth adre'],
  ['cath a ci', 'cath a.conj ci'],
  ['Pwy a welodd y gath?', 'pwy a.rel gwelodd y cath ?'],
  // — i: preposition vs echo pronoun —
  ['Gweles i gath', 'gweles i.pron cath'],
  ['Rhaid i Emrys fynd', 'rhaid i emrys mynd'],
  ["Aeth hi i'r dre", 'aeth hi i y tre'],
  ['Es i adre', 'es i.pron adre'],
  ['fy nghath i', 'fy cath i.pron'],
  ['Aeth y plant i\'r ysgol', 'aeth y plant i y ysgol'],
  // — dy: possessive vs SM-of-tŷ —
  ['Dyma dy gath di', 'dyma dy cath ti'],
  ['Gwelodd hi ei dy e', 'gwelodd hi ei.3sgm tŷ e'],
  ['Gwelodd Mair dy dŷ di', 'gwelodd mair dy tŷ ti'],
  // — category selection & mutation-candidate retention —
  ['y gath', 'y cath'],
  ['y fan', 'y {ban|fan|man}'],
  ['Gwelodd y dyn ddyn', 'gwelodd y dyn dyn'],
  ['Gwelwyd dyn', 'gwelwyd dyn'],
  // — MWEs, clitics, OOV —
  ['ar ôl cinio', 'ar ôl cinio'],
  ['o dan y bwrdd', 'o dan y bwrdd'],
  ['Gwelodd zeb gath', 'gwelodd zeb? cath'],
  ["Aeth hi i'r dre ar ôl cinio", 'aeth hi i y tre ar ôl cinio'],
]

test(`gold mini-suite: ${GOLD.length} hand-tagged sentences`, () => {
  for (const [text, expected] of GOLD) {
    assert.equal(gold(text), expected, `«${text}»`)
  }
})

test('ambiguity flags: undecidable tokens flagged, decided ones not', () => {
  const dyma = tagged('Dyma ei gath')
  assert.equal(dyma[1]!.ambiguous, true) // ei without echo (DoD-8 shape)
  assert.deepEqual(
    new Set(dyma[1]!.readings.map(r => r.entry.lemma)),
    new Set(['ei.3sgm', 'ei.3sgf']),
  )
  const echo = tagged('Gwelodd hi ei gath e')
  assert.equal(echo[2]!.ambiguous, undefined) // echo decided it

  const fan = tagged('y fan')
  assert.equal(fan[1]!.ambiguous, true)
  assert.equal(fan[1]!.readings.length, 3) // fan/man/ban all retained
})

test('rules never empty a token; impersonal person survives tagging', () => {
  const [gwelwyd] = tagged('Gwelwyd dyn')
  assert.equal(gwelwyd!.readings.length, 1)
  assert.equal(gwelwyd!.readings[0]!.entry.person, '0')
  for (const t of tagged("Mae'r ddraig a'r zeb yn yr ardd i'w gweld")) {
    if (t.kind !== 'punct') assert.ok(t.readings.length > 0, `emptied: ${t.surface}`)
  }
})
