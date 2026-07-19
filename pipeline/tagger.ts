/**
 * Closed-class tagger (WORKSTREAM M3): a Constraint-Grammar-style
 * reductionist engine. Every token starts with ALL candidate readings
 * (M2's, plus homograph expansion here); ordered contextual rules REMOVE
 * readings; a rule may never empty a token. Where no rule decides, the
 * token keeps multiple readings and is flagged `ambiguous` (ratified
 * ambiguity-propagation policy).
 *
 * STRUCTURAL GUARD (DoD-7, no-mutation-evidence constraint): rules see the
 * token they are pruning through TargetView / TargetReadingView, which have
 * NO `grade` field — the observed mutation state of the target is not a
 * readable field. Neighbors are exposed as full Tokens: THEIR mutation
 * state is permitted evidence. This is what breaks the CyTag circularity:
 * we never tag a word by the mutation we are trying to predict on it.
 */

import type { Cat } from '../theory/types.ts'
import type { Reading, Token } from './analyze.ts'
import type { LexEntry } from './lexentry.ts'
import { initClassOf } from '../theory/orthography.ts'
import { PREPOSITION_LEMMAS, type Lexicon } from './lexicon.ts'

export interface TaggedToken extends Token {
  /** Set when rules could not reduce the token to a single reading. */
  ambiguous?: true
}

// ─── the guard types: no `grade` here ───

export interface TargetReadingView {
  radical: string
  lemma: string
  cat: Cat
  gender?: 'm' | 'f'
  number?: 'sg' | 'pl'
  person?: LexEntry['person']
  proper?: boolean
}

export interface TargetView {
  surface: string
  kind: Token['kind']
  lemma?: string
  readings: TargetReadingView[]
}

export interface Ctx {
  /** Word/clitic neighbors leftward/rightward, clause-bounded (punctuation
   *  stops the walk). left[0] / right[0] are the nearest. */
  left: Token[]
  right: Token[]
}

interface Rule {
  id: string
  /** Predicate over target readings: true = REMOVE this reading. */
  prune(target: TargetView, ctx: Ctx): ((r: TargetReadingView) => boolean) | null
}

// ─── homograph expansion ───

/** Dotted keys per surface (words) or clitic surface; every key is either a
 *  trigger-lexicon lemma (yn.loc, ei.3sgm, a.rel, 'w.3pl, i, dy) or a
 *  deliberate non-trigger sentinel (yn.prog, i.pron) that matches no frame.
 *  `yr` normalizes to the article lemma y (tree-layer convention).
 *  Extensible: na.* (4-way) joins here when a milestone needs it. */
const HOMOGRAPHS: Record<string, string[]> = {
  yn: ['yn.loc', 'yn.pred', 'yn.prog'],
  ei: ['ei.3sgm', 'ei.3sgf'],
  a: ['a.rel', 'a.conj', 'a.int'],
  i: ['i', 'i.pron'],
  "'w": ["'w.3sgm", "'w.3sgf", "'w.3pl"],
  yr: ['y'],
}

const functionReading = (surface: string, lemma: string): Reading => ({
  radical: surface,
  grade: null,
  // prepositional homographs (yn.loc, i) carry the class immutability
  entry: {
    form: surface.toLowerCase(), lemma,
    cat: 'Other', initClass: initClassOf(surface), freq: 0,
    ...(PREPOSITION_LEMMAS.has(lemma) ? { immutable: true } : {}),
  },
})

/** Replace a token's function-word/OOV readings with its homograph set;
 *  genuine lexical readings (N/V/Adj/…) survive alongside. `dy` also gains
 *  the SM-of-tŷ lexical reading (King's homograph pair) — surface dy is
 *  t-SM'd tŷ when the circumflex is dropped in informal text. */
function expandHomographs(token: Token, lexicon: Lexicon): Token {
  if (token.kind === 'punct') return token
  const key = HOMOGRAPHS[token.surface.toLowerCase()]
    ? token.surface.toLowerCase()
    : token.kind === 'clitic' && token.lemma && HOMOGRAPHS[token.lemma]
      ? token.lemma
      : null

  const out: Token = { ...token }
  if (key) {
    const lexical = token.readings.filter(r => r.entry.cat !== 'Other')
    out.readings = [...HOMOGRAPHS[key]!.map(l => functionReading(token.surface, l)), ...lexical]
    delete out.unknown
  }
  if (token.surface.toLowerCase() === 'dy') {
    const ty = lexicon.lookup('tŷ').map((entry): Reading => ({ radical: 'tŷ', grade: 'SM', entry }))
    out.readings = [...out.readings, ...ty]
  }
  return out
}

// ─── reading predicates (over full neighbor Tokens) ───

const hasCat = (t: Token | undefined, ...cats: Cat[]) =>
  t !== undefined && t.readings.some(r => cats.includes(r.entry.cat))
const hasLemma = (t: Token | undefined, ...lemmas: string[]) =>
  t !== undefined && t.readings.some(r => lemmas.includes(r.entry.lemma))
const isArticle = (t: Token | undefined) => hasLemma(t, 'y')
const isProper = (t: Token | undefined) =>
  t !== undefined && t.readings.some(r => r.entry.proper === true)

/** Echo pronouns for ei/'w resolution. `o` ('he', N. Wales) is deliberately
 *  absent: it collides with the preposition o and would misfire. */
const ECHO_MASC = new Set(['e', 'fe', 'fo', 'ef'])
const ECHO_FEM = new Set(['hi'])
const ECHO_PL = new Set(['nhw', 'hwy'])
const PRONOUNS = new Set(['fi', 'ti', 'di', 'e', 'fe', 'fo', 'ef', 'hi', 'ni', 'chi', 'nhw', 'hwy'])

/** Simple prepositions that can head the phrase straight after a finite
 *  verb (mae gyda fi…, mae yn yr ardd…). Surface-keyed closed-class
 *  knowledge, like PRONOUNS above. */
const PREPOSITIONS = new Set([
  'am', 'ar', 'at', 'dan', 'dros', 'drwy', 'efo', 'gan', 'gen', 'ger',
  'gyda', 'gyn', 'heb', 'hyd', 'i', 'mewn', 'o', 'rhag', 'rhwng', 'tan',
  'trwy', 'tua', 'wrth', 'yn',
])

// ─── the rule sequence ───

/** Once context decides a homograph key, the token IS that function word:
 *  every other reading dies — sibling homographs and stray lexical readings
 *  alike (the broad lexicon contributes junk like a verbal yn). */
const keepOnly = (_prefix: string, keep: string) => (r: TargetReadingView) =>
  r.lemma !== keep

const RULES: Rule[] = [
  {
    // Apertium's Roman-numeral reading of i is noise outside numeric context.
    id: 'i-not-numeral',
    prune(t, ctx) {
      if (t.surface.toLowerCase() !== 'i') return null
      const numeric = [ctx.left[0], ctx.right[0]].some(n => n && /\p{N}/u.test(n.surface))
      return numeric ? null : r => r.cat === 'Num'
    },
  },
  {
    // VSO: a clause-initial token with a verb reading followed by a nominal
    // or a PP head IS the verb — *bae rhaid and *bae gyda fi are not Welsh
    // clause shapes, while mae gyda fi… and mae yn yr ardd… are ordinary
    // bod-clauses. This is the guard-legal way to kill de-mutation
    // homographs like mae ⇐ NM-of-bae: the evidence is position and
    // category, never the reading's grade.
    id: 'vso-clause-initial-verb',
    prune(t, ctx) {
      if (ctx.left.length !== 0) return null
      if (!t.readings.some(r => r.cat === 'V')) return null
      const n = ctx.right[0]
      // An OOV neighbor is open-class (the closed classes are enumerable:
      // trigger lemmas, hand lexicon, homographs), so it patterns with the
      // nominal case.
      const continuesClause =
        hasCat(n, 'N', 'Num') || isArticle(n) ||
        (n !== undefined && PRONOUNS.has(n.surface.toLowerCase())) ||
        (n !== undefined && PREPOSITIONS.has(n.surface.toLowerCase())) ||
        n?.unknown === true
      if (!continuesClause) return null
      return r => r.cat === 'N'
    },
  },
  {
    // mi/fe as preverbal particles exist ONLY clause-initially before a
    // verb; anywhere else the reading (usually fi ⇐ SM-of-mi) is junk.
    id: 'preverbal-particle-position',
    prune(t, ctx) {
      if (!t.readings.some(r => (r.lemma === 'mi' || r.lemma === 'fe') && r.cat === 'Adv')) {
        return null
      }
      if (ctx.left.length === 0 && hasCat(ctx.right[0], 'V')) return null
      return r => (r.lemma === 'mi' || r.lemma === 'fe') && r.cat === 'Adv'
    },
  },
  {
    // yn + verbal-noun-only complement → progressive.
    id: 'yn-prog',
    prune(t, ctx) {
      if (!t.readings.some(r => r.lemma.startsWith('yn.'))) return null
      const n = ctx.right[0]
      if (!hasCat(n, 'Vnoun') || hasCat(n, 'Adj', 'N') || isArticle(n)) return null
      return keepOnly('yn.', 'yn.prog')
    },
  },
  {
    // yn + article / proper name → locative (King §472 context).
    id: 'yn-loc',
    prune(t, ctx) {
      if (!t.readings.some(r => r.lemma.startsWith('yn.'))) return null
      const n = ctx.right[0]
      if (!isArticle(n) && !isProper(n)) return null
      return keepOnly('yn.', 'yn.loc')
    },
  },
  {
    // yn + bare adjective or common noun → predicative.
    id: 'yn-pred',
    prune(t, ctx) {
      if (!t.readings.some(r => r.lemma.startsWith('yn.'))) return null
      const n = ctx.right[0]
      if (isArticle(n) || isProper(n) || !hasCat(n, 'Adj', 'N')) return null
      return keepOnly('yn.', 'yn.pred')
    },
  },
  {
    // ei/'w resolved by the first echo pronoun rightward in the clause.
    id: 'echo-pronoun',
    prune(t, ctx) {
      const prefix = t.readings.some(r => r.lemma.startsWith('ei.'))
        ? 'ei.'
        : t.readings.some(r => r.lemma.startsWith("'w."))
          ? "'w."
          : null
      if (!prefix) return null
      for (const n of ctx.right) {
        const s = n.surface.toLowerCase()
        if (ECHO_MASC.has(s)) return keepOnly(prefix, `${prefix}3sgm`)
        if (ECHO_FEM.has(s)) return keepOnly(prefix, `${prefix}3sgf`)
        if (ECHO_PL.has(s) && prefix === "'w.") return keepOnly(prefix, "'w.3pl")
      }
      return null
    },
  },
  {
    // a + finite verb → clause-initial interrogative, otherwise relative;
    // a + nominal-only → conjunction.
    id: 'a-int-vs-rel-vs-conj',
    prune(t, ctx) {
      if (!t.readings.some(r => r.lemma.startsWith('a.'))) return null
      const n = ctx.right[0]
      if (n === undefined) return null
      if (hasCat(n, 'V')) {
        return keepOnly('a.', ctx.left.length === 0 ? 'a.int' : 'a.rel')
      }
      if (hasCat(n, 'N', 'Adj', 'Num', 'Vnoun')) return keepOnly('a.', 'a.conj')
      return null
    },
  },
  {
    // i after a 1st-person finite verb, or clause-final after a nominal
    // (fy nghath i), is the echo pronoun; before a nominal it is the
    // preposition. Order matters: the pronoun contexts are checked first.
    id: 'i-pron-vs-prep',
    prune(t, ctx) {
      if (!t.readings.some(r => r.lemma === 'i' || r.lemma === 'i.pron')) return null
      const left = ctx.left[0]
      const right = ctx.right[0]
      const leftIsP1Verb =
        left !== undefined && left.readings.some(r => r.entry.cat === 'V' && r.entry.person === '1')
      if (leftIsP1Verb) return r => r.lemma === 'i'
      if (right === undefined && hasCat(left, 'N')) return r => r.lemma === 'i'
      // i'w is always prep + fused possessive; i before a nominal or a
      // pronoun (rhaid i fi) is the preposition
      if (hasLemma(right, "'w.3sgm", "'w.3sgf", "'w.3pl")) return r => r.lemma === 'i.pron'
      if (
        isArticle(right) || hasCat(right, 'N', 'Vnoun') || isProper(right) ||
        (right !== undefined && PRONOUNS.has(right.surface.toLowerCase()))
      ) {
        return r => r.lemma === 'i.pron'
      }
      return null
    },
  },
  {
    // dy: possessive needs a following nominal; SM-of-tŷ needs a preceding
    // possessor/preposition and no following nominal. Neighbor evidence
    // only — the target's own mutation is structurally unreadable here.
    // Decisions are strict (same philosophy as keepOnly): once context
    // picks a side, every other reading dies — including broad-lexicon
    // junk like Apertium's placename Ty, whose circumflex-less radical
    // would survive an exact 'tŷ' match and fake ambiguity downstream.
    id: 'dy-poss-vs-ty',
    prune(t, ctx) {
      if (t.surface.toLowerCase() !== 'dy') return null
      const possessorLeft = hasLemma(ctx.left[0], 'ei.3sgm', 'ei.3sgf', "'w.3sgm", 'i', 'fy')
      const nominalRight = hasCat(ctx.right[0], 'N', 'Vnoun')
      if (possessorLeft && !nominalRight) return r => r.radical !== 'tŷ'
      if (nominalRight && !possessorLeft) return r => r.cat !== 'Other'
      return null
    },
  },
  {
    // Observed-mutation selection at the CATEGORY level: after an article
    // or possessive, finite-verb readings die. (Never by predicted grade —
    // that would be the circularity the guard exists to prevent.)
    id: 'no-finite-verb-after-det',
    prune(t, ctx) {
      const left = ctx.left[0]
      const det =
        isArticle(left) ||
        hasLemma(left, 'ei.3sgm', 'ei.3sgf', "'w.3sgm", "'w.3sgf", "'w.3pl", 'fy', 'dy', 'eu', 'eich')
      if (!det) return null
      if (!t.readings.some(r => r.cat === 'V')) return null
      return r => r.cat === 'V'
    },
  },
]

// ─── engine ───

const toView = (t: Token): TargetView => ({
  surface: t.surface,
  kind: t.kind,
  ...(t.lemma ? { lemma: t.lemma } : {}),
  readings: t.readings.map(({ radical, entry }) => ({
    radical,
    lemma: entry.lemma,
    cat: entry.cat,
    ...(entry.gender ? { gender: entry.gender } : {}),
    ...(entry.number ? { number: entry.number } : {}),
    ...(entry.person ? { person: entry.person } : {}),
    ...(entry.proper ? { proper: entry.proper } : {}),
  })),
})

function contexts(tokens: Token[], i: number): Ctx {
  const left: Token[] = []
  for (let j = i - 1; j >= 0 && tokens[j]!.kind !== 'punct'; j--) left.push(tokens[j]!)
  const right: Token[] = []
  for (let j = i + 1; j < tokens.length && tokens[j]!.kind !== 'punct'; j++) right.push(tokens[j]!)
  return { left, right }
}

const MAX_PASSES = 4

export function tag(input: Token[], lexicon: Lexicon): TaggedToken[] {
  const tokens = input.map(t => expandHomographs(t, lexicon))

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let changed = false
    for (const rule of RULES) {
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]!
        if (token.readings.length < 2) continue
        const view = toView(token)
        const remove = rule.prune(view, contexts(tokens, i))
        if (!remove) continue
        // The view strips grade; index alignment maps verdicts back.
        const kept = token.readings.filter((_, k) => !remove(view.readings[k]!))
        if (kept.length > 0 && kept.length < token.readings.length) {
          tokens[i] = { ...token, readings: kept }
          changed = true
        }
      }
    }
    if (!changed) break
  }

  return tokens.map(t =>
    t.kind !== 'punct' && t.readings.length > 1 ? { ...t, ambiguous: true } : t,
  )
}
