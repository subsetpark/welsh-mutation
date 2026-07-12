import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sm } from '../src/predicate.ts'
import { LEXICON as L } from '../src/lexicon.ts'
import type { Environment, Lexeme, RuleId } from '../src/types.ts'


const E = {
  none: { prev: null, agreement: null, position: null },
  after: (lemma: string, opts: Partial<NonNullable<Environment['prev']>> = {}): Environment => ({
    prev: { lemma, relationToTarget: 'dependent', isXPRightEdge: false, ...opts },
    agreement: null,
    position: null,
  }),
} as const

const expectSM = (name: string, lexeme: Lexeme, env: Environment, rules: RuleId[]) =>
  test(name, () => {
    const r = sm(lexeme, env)
    assert.equal(r.mutates, true, `expected SM, got ${JSON.stringify(r)}`)
    if (r.mutates) assert.deepEqual(r.licensedBy.sort(), rules.sort())
  })

const expectNoSM = (name: string, lexeme: Lexeme, env: Environment, reason?: string) =>
  test(name, () => {
    const r = sm(lexeme, env)
    assert.equal(r.mutates, false, `expected radical, got ${JSON.stringify(r)}`)
    if (!r.mutates && reason) assert.equal(r.reason, reason)
  })

// ─── P_lex: contact triggers (King §9) ───
expectSM('i dŷ — prep i° mutates dependent', L.ty, E.after('i'), ['lex:i'])
expectSM('dy gath — possessive dy°', L.cath, E.after('dy'), ['lex:dy'])
expectSM('ffenest neu ddrws — neu°', L.drws, E.after('neu'), ['lex:neu'])
expectNoSM("y ffenest neu'r drws — intervening 'r blocks neu (King §5d)",
  L.drws, E.after("'r"), 'no-license')
expectSM('mor + b: mor fach', L.bach, E.after('mor'), ['lex:mor'])
expectNoSM('mor + ll: mor llong (SM-ltd spares ll-)', L.llong, E.after('mor'))

// mixed mutation (King §10): SM for voiced/liquids, AM (⇒ no SM) for c/p/t
expectSM('ni ddylset — mixed yields SM on d-', L.dylu, E.after('ni'), ['lex:ni'])
expectNoSM('ni pharith — mixed yields AM on p-, not SM', L.para, E.after('ni'))

// AM/NM triggers never license SM
expectNoSM("ei chath (3sg f 'her') — AM, not SM", L.cath, E.after('ei.3sgf'))
expectNoSM('fy nghath — NM, not SM', L.cath, E.after('fy'))

// ─── gender subsystem ───
expectSM('y gath — article + fem sg noun', L.cath, E.after('y'), ['gend:art-fem-sg'])
expectNoSM('y llong — article + fem sg ll- noun resists (SM-ltd)', L.llong, E.after('y'))
expectNoSM('y plant — article + pl noun: no gender SM', L.plant, E.after('y'))
expectSM('cath fach — adjective after fem sg noun', L.bach, {
  prev: { lemma: 'cath', relationToTarget: 'dependent', isXPRightEdge: false },
  agreement: { controllerGender: 'f', controllerNumber: 'sg', relation: 'modifier' },
  position: null,
}, ['gend:agr-mod'])
expectSM('y ferch fach WEN — chain: 2nd adjective still mutates (agreement, not adjacency)',
  L.gwyn, {
    prev: { lemma: 'bach', relationToTarget: 'other', isXPRightEdge: false },
    agreement: { controllerGender: 'f', controllerNumber: 'sg', relation: 'modifier' },
    position: null,
  }, ['gend:agr-mod'])
expectNoSM('cath MERCH — possessor immune despite fem sg adjacency (Dowle/M&S)', L.merch, {
  prev: { lemma: 'cath', relationToTarget: 'possessor', isXPRightEdge: false },
  agreement: null,
  position: null,
})

// ─── P_synt: XPTH / positional (King §11) ───
expectSM('Gwelodd Mair DŶ — DOM: object after subject-XP edge', L.ty, {
  prev: { lemma: 'Mair', relationToTarget: 'other', isXPRightEdge: true },
  agreement: null,
  position: null,
}, ['synt:xp-edge'])
expectNoSM('Roedd dyn wedi prynu BEIC — nonfinite object, no XP edge', L.beic, E.after('prynu'))
expectNoSM('BEIC prynodd y ddynes — fronted object, nothing precedes', L.beic, E.none)
expectSM('Rhaid i Emrys FYND — SM after notional subject (King §5e: unblockable)', L.mynd, {
  prev: { lemma: 'Emrys', relationToTarget: 'other', isXPRightEdge: true },
  agreement: null,
  position: null,
}, ['synt:xp-edge'])
expectSM('DDWY flynedd yn ôl — adverbial NP (King 11b)', L.dwy, {
  prev: null, agreement: null, position: 'adv-np',
}, ['synt:adv-np'])
expectSM('Dewch fan hyn, BLANT! — vocative (King 11c)', L.plant, {
  prev: null, agreement: null, position: 'vocative',
}, ['synt:vocative'])
expectSM("GOLLES i'r tocyn — colloquial v1 inflected verb (King 11d)", L.colli, {
  prev: null, agreement: null, position: 'v1-finite-aff',
}, ['synt:v1-aff'])
expectSM('DDylset ti ddim — v1 neg: mixed yields SM on d- (King §10)', L.dylu, {
  prev: null, agreement: null, position: 'v1-finite-neg',
}, ['synt:v1-neg-mixed'])
expectNoSM('Pharith hi ddim — v1 neg: mixed yields AM on p-', L.para, {
  prev: null, agreement: null, position: 'v1-finite-neg',
})

// ─── vetoes (King §12) ───
expectNoSM('dy gêm — immutable loanword despite dy°', L.gem, E.after('dy'), 'veto:immutable')
expectNoSM('i Dafydd — personal name immune despite i°', L.Dafydd, E.after('i'), 'veto:immutable')
expectNoSM('i ysgol — vowel-initial: no SM reflex', L.ysgol, E.after('i'), 'veto:no-reflex')

// a working veto reports what it suppressed; an idle one reports no-license
test('i DY gath — veto:immutable suppressing a live lex:i', () => {
  const r = sm(L.dy, E.after('i'))
  assert.deepEqual(r, { mutates: false, reason: 'veto:immutable', suppressed: ['lex:i'] })
})
test('DY gath, utterance-initial — immutable flag idle, plain no-license', () => {
  const r = sm(L.dy, E.none)
  assert.deepEqual(r, { mutates: false, reason: 'no-license' })
})

// veto:no-reflex follows the same counterfactual logic
test('i YSGOL — no-reflex veto suppressing a live lex:i', () => {
  const r = sm(L.ysgol, E.after('i'))
  assert.deepEqual(r, { mutates: false, reason: 'veto:no-reflex', suppressed: ['lex:i'] })
})
test('YSGOL, utterance-initial — no rule would fire, plain no-license', () => {
  const r = sm(L.ysgol, E.none)
  assert.deepEqual(r, { mutates: false, reason: 'no-license' })
})
test("ei YSGOL hi — AM frame would not soft-mutate ANY initial: no-license, not no-reflex", () => {
  const r = sm(L.ysgol, E.after('ei.3sgf'))
  assert.deepEqual(r, { mutates: false, reason: 'no-license' })
})

// multiple licensers are all reported
expectSM('multiply licensed: trigger + XP edge', L.ty, {
  prev: { lemma: 'i', relationToTarget: 'dependent', isXPRightEdge: true },
  agreement: null,
  position: null,
}, ['lex:i', 'synt:xp-edge'])

// ─── King-complete lexicon: multi-frame lemmas ───

// y: one lemma, two frames
expectSM('y DDAU — article mutates dau (King §29, Num frame)', L.dau, E.after('y'), ['lex:y'])
expectNoSM('y DYN — masc noun: neither y-frame applies', L.dyn, E.after('y'))
// chwe: AM generally, NM on year-words — never SM
expectNoSM('chwe CHEFFYL — AM frame, no SM', L.ceffyl, E.after('chwe'))
expectNoSM('chwe MLYNEDD — NM lexeme-list frame, no SM', L.blynedd, E.after('chwe'))
// dwy° still plain SM on blynedd (dwy °flynedd, King §176)
expectSM('dwy FLYNEDD — dwy° SM', L.blynedd, E.after('dwy'), ['lex:dwy'])

// ─── prenominal adjectives (King §§96-99) ───
expectSM('hen DDYN', L.dyn, E.after('hen'), ['lex:hen'])
expectSM('unig BLENTYN — prenominal unig°', L.plant, E.after('unig'), ['lex:unig'])
expectNoSM('pob DYN — the one non-triggering prenominal (King §97)', L.dyn, E.after('pob'))
expectSM('rhyw DDYN (King §115)', L.dyn, E.after('rhyw'), ['lex:rhyw'])
expectNoSM('rhai DYNION — rhai does not trigger (King §115)', L.dyn, E.after('rhai'))

// ─── ordinals (King §170) ───
expectSM('ail DDESG — ail° both genders', L.cath, E.after('ail'), ['lex:ail'])
expectSM('y bumed ORSAF — pumed + fem noun', L.gorsaf, E.after('pumed'), ['lex:pumed'])
expectNoSM('y pumed DOSBARTH — pumed + masc noun radical', L.dosbarth, E.after('pumed'))
expectSM('y drydedd DREF — trydedd + fem', L.tre, E.after('trydedd'), ['lex:trydedd'])

// ─── prepositions: absence is data (King §§461-476) ───
expectNoSM('mewn TŶ — mewn triggers nothing', L.ty, E.after('mewn'))
expectNoSM('rhwng CAERDYDD... — rhwng triggers nothing (King §466)', L.car, E.after('rhwng'))
expectSM('oddiwrth DY rieni — oddiwrth° SM', L.dyn, E.after('oddiwrth'), ['lex:oddiwrth'])
expectSM('mo: weles i MOnot… — mo carries SM of dim o°', L.dyn, E.after('mo'), ['lex:mo'])
expectNoSM('ar ôl CINIO — compound prep, no mutation (King §475)', L.car, E.after('ar ôl'))

// ─── conjunctions & relatives ───
expectSM('sy DDIM — SM on dim after sy (King §479)', L.dim, E.after('sy'), ['lex:sy'])
expectSM('na DDAETH — neg relative, mixed yields SM on d-', L.dod, E.after('na.rel'), ['lex:na.rel'])
expectNoSM('na PHARITH — neg relative, mixed yields AM on p-', L.para, E.after('na.rel'))
expectNoSM('os DAW e — os triggers nothing (King §502)', L.dod, E.after('os'))
expectSM('siswrn neu GYLLELL — neu° on noun', L.cath, E.after('neu'), ['lex:neu'])
expectNoSM('Arhoswch neu DEWCH — neu SM cancelled before imperative (King §512)',
  L.dewch, E.after('neu'))
