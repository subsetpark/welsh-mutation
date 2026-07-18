/**
 * Shallow rule chunker (WORKSTREAM M4): TaggedToken[] → the frozen TreeNode
 * contract. The chunker AUTHORS trees for the theory layer; it never judges
 * mutation. Welsh VSO + rigid NP-internal order make a single greedy
 * left-to-right pass sufficient for the trigger-relevant local structure —
 * fronted-XP and fragment parses even share a shape (S[XP …]), so there is
 * no backtracking beyond NP-start rollback.
 *
 * Conventions honored (src/tree.ts header):
 * - subordinators/particles are leaf children of their clause;
 * - extraction gaps after relativizers/wh; PRO gaps after person-inflected
 *   subjectless verbs — NEVER after impersonals (person '0'): Gwelwyd dyn
 *   stays gap-free, which is what keeps its object radical;
 * - lemma normalization: dotted trigger keys ride Leaf.lemma.
 *
 * Structural knowledge the chunker owns (syntax, not mutation): preposition
 * and pronoun sets, time nouns, prenominal adjectives. Trigger BEHAVIOR
 * stays exclusively in data/triggers.json; the MWE preposition list is
 * derived from it, not duplicated.
 *
 * Ambiguous tokens contribute their FIRST reading (or the first matching a
 * positional preference) to the tree; alternatives stay on the token for
 * the M6 renderer.
 */

import triggersData from '../data/triggers.json' with { type: 'json' }
import type { Cat } from '../src/types.ts'
import { clause, gap, leaf, phrase } from '../src/tree.ts'
import type { Clause, Leaf, Phrase, TreeNode } from '../src/tree.ts'
import type { Reading } from './analyze.ts'
import type { TaggedToken } from './tagger.ts'
import { toLexeme } from './lexicon.ts'

export interface ChunkedLeaf {
  token: TaggedToken
  leaf: Leaf
}

export interface ChunkResult {
  root: Clause
  /** Token→Leaf correspondence in surface order (gaps and punct absent). */
  leaves: ChunkedLeaf[]
}

const MWE_PREPS = (triggersData.frames as { lemma: string }[])
  .map(f => f.lemma)
  .filter(l => l.includes(' ') && l !== 'hanner can')
const PREPS = new Set([
  'i', 'o', 'am', 'ar', 'at', 'gan', 'heb', 'dan', 'dros', 'drwy', 'trwy', 'wrth',
  'rhwng', 'ger', 'tan', 'hyd', 'efo', 'gyda', 'â', 'ag', 'mewn', 'yn.loc',
  ...MWE_PREPS,
])
const SUBORDINATORS = new Set(['os', 'pan'])
/** Clause-initial preverbal particles → their trigger-lexicon keys. */
const PARTICLES: Record<string, string> = { fe: 'fe.prt', mi: 'mi.prt', ni: 'ni', na: 'na.neg' }
const PRONOUNS = new Set(['fi', 'ti', 'di', 'e', 'fe', 'fo', 'ef', 'hi', 'ni', 'chi', 'nhw', 'hwy'])
const PRON_P1 = new Set(['i', 'fi', 'ni'])
const PRON_P2 = new Set(['ti', 'di', 'chi'])
const POSSESSIVES = new Set(['fy', 'dy', 'eu', 'eich', 'ein'])
const TIME_NOUNS = new Set(['dydd', 'bore', 'nos', 'prynhawn', 'wythnos', 'mis', 'blwyddyn'])
const PRENOM_ADJ = new Set(['hen', 'prif', 'unig'])
const WH = new Set(['pwy', 'beth'])
const RELATIVIZERS = new Set(['a.rel', 'na.rel', 'sy'])

class Chunker {
  private i = 0
  private leaves: ChunkedLeaf[] = []
  private polarity: 'neg' | undefined
  private toks: TaggedToken[]
  private vocativeToks: TaggedToken[]

  constructor(input: TaggedToken[]) {
    const words = input.filter(t => t.kind !== 'punct')
    // Vocative: comma-delimited trailing address of 1–2 nominal tokens.
    const commaAt = input.findIndex(t => t.kind === 'punct' && t.surface === ',')
    let voc: TaggedToken[] = []
    if (commaAt > 0) {
      const after = input.slice(commaAt + 1).filter(t => t.kind !== 'punct')
      const nominal = after.every(
        t => t.readings.some(r => r.entry.cat === 'N') || PRONOUNS.has(t.surface.toLowerCase()),
      )
      if (after.length >= 1 && after.length <= 2 && nominal) voc = after
    }
    this.vocativeToks = voc
    this.toks = voc.length > 0 ? words.slice(0, words.length - voc.length) : words
  }

  // ─── cursor & reading helpers ───

  private cur(k = 0): TaggedToken | undefined {
    return this.toks[this.i + k]
  }
  private sur(k = 0): string {
    return this.cur(k)?.surface.toLowerCase() ?? ''
  }
  private hasCat(t: TaggedToken | undefined, ...cats: Cat[]): boolean {
    return t !== undefined && t.readings.some(r => cats.includes(r.entry.cat))
  }
  private pick(t: TaggedToken, prefer: Cat[] = []): Reading {
    for (const cat of prefer) {
      const r = t.readings.find(rd => rd.entry.cat === cat)
      if (r) return r
    }
    return t.readings[0]!
  }
  private lemma(t: TaggedToken | undefined): string {
    return t === undefined ? '' : this.pick(t).entry.lemma
  }

  private take(prefer: Cat[] = [], lemmaOverride?: string): Leaf {
    const token = this.cur()!
    this.i++
    const r = this.pick(token, prefer)
    const key = lemmaOverride ?? r.entry.lemma
    const dotted = key.includes('.')
    const id = dotted ? key.split('.')[0]! : r.entry.lemma
    const lexeme = { ...toLexeme(r.entry), id }

    // Keep case for proper nouns AND capitalized lexicon entries (hand-
    // curated names carry immutable, not proper); fold sentence-initial caps.
    const keepCase = r.entry.proper === true || /^\p{Lu}/u.test(r.entry.form)
    const lower = (s: string) => (keepCase ? s : s.toLowerCase())
    let form: string | undefined
    if (token.kind === 'clitic') form = token.surface
    else if (r.grade === null || r.grade === 'SM') form = lower(r.radical)
    else form = lower(token.surface) // authored AM/NM spelling (tree.ts note)
    if (form === lexeme.id) form = undefined

    const l = leaf(lexeme, key !== lexeme.id ? key : undefined, form)
    this.leaves.push({ token, leaf: l })
    return l
  }

  // ─── NP ───

  private npStartable(t: TaggedToken | undefined): boolean {
    if (t === undefined) return false
    const s = t.surface.toLowerCase()
    const lem = this.lemma(t)
    return (
      lem === 'y' ||
      POSSESSIVES.has(s) || lem.startsWith('ei.') || lem.startsWith("'w.") ||
      PRONOUNS.has(s) || lem === 'i.pron' ||
      this.hasCat(t, 'N', 'Num') ||
      t.unknown === true
    )
  }

  private tryNP(allowGenitive: boolean): Phrase | null {
    if (!this.npStartable(this.cur())) return null
    const mark = this.i
    const leavesMark = this.leaves.length
    const children: TreeNode[] = []
    let hadDet = false
    let possessive = false

    // pronoun-only NP
    if (
      (PRONOUNS.has(this.sur()) || this.lemma(this.cur()) === 'i.pron') &&
      !this.hasCat(this.cur(), 'N')
    ) {
      return phrase('NP', [this.take()])
    }

    if (this.lemma(this.cur()) === 'y') {
      children.push(this.take())
      hadDet = true
    } else if (
      POSSESSIVES.has(this.sur()) ||
      this.lemma(this.cur()).startsWith('ei.') ||
      this.lemma(this.cur()).startsWith("'w.")
    ) {
      children.push(this.take())
      hadDet = true
      possessive = true
    }
    if (this.hasCat(this.cur(), 'Num') && this.npStartable(this.cur(1))) {
      children.push(this.take(['Num']))
    }
    if (PRENOM_ADJ.has(this.sur()) && this.hasCat(this.cur(), 'Adj') && this.hasCat(this.cur(1), 'N')) {
      children.push(this.take(['Adj']))
    }

    // head noun (unknown tokens default to nominal)
    if (this.hasCat(this.cur(), 'N') || this.cur()?.unknown === true) {
      children.push(this.take(['N']))
    } else {
      this.i = mark
      this.leaves.length = leavesMark
      return null
    }
    const head = children[children.length - 1] as Leaf
    const headProper = head.lexeme.immutable === true

    // post-head material
    for (;;) {
      if (this.hasCat(this.cur(), 'Adj') && this.lemma(this.cur()) !== 'a.conj') {
        children.push(phrase('AP', [this.take(['Adj'])]))
        continue
      }
      // flat coordination keeps a.conj string-adjacent to its conjunct
      if (this.lemma(this.cur()) === 'a.conj' && this.hasCat(this.cur(1), 'N')) {
        children.push(this.take())
        children.push(this.take(['N']))
        continue
      }
      if (RELATIVIZERS.has(this.lemma(this.cur())) && this.hasCat(this.cur(1), 'V')) {
        children.push(this.parseRelativeClause())
        continue
      }
      // genitive nesting: determiner-less, non-proper heads only (cath merch,
      // canol y dre — but never y dyn ddyn, never Mair ddraig)
      if (allowGenitive && !hadDet && !headProper && this.npStartable(this.cur())) {
        const nested = this.tryNP(true)
        if (nested) {
          children.push(nested)
          continue
        }
      }
      if (possessive && (PRONOUNS.has(this.sur()) || this.lemma(this.cur()) === 'i.pron')) {
        children.push(this.take()) // echo pronoun closes the possessive NP
      }
      break
    }
    return phrase('NP', children)
  }

  /** Clause-peripheral time-noun NPs are adverbial (King §11b) — but only
   *  in a clause with a verb to modify: the greeting fragment Bore da is
   *  NOT an adverbial (and must not attract adv-np mutation). */
  private assignTimeRoles(children: TreeNode[]): void {
    const hasVerb = children.some(
      c => c.kind === 'leaf' && (c.lexeme.cat === 'V' || c.lexeme.cat === 'Vimp'),
    )
    if (!hasVerb) return
    for (const at of [0, children.length - 1]) {
      const c = children[at]
      if (c === undefined || c.kind !== 'phrase' || c.cat !== 'NP' || c.role !== undefined) continue
      const head = c.children.find(k => k.kind === 'leaf' && k.lexeme.cat === 'N')
      if (head && head.kind === 'leaf' && TIME_NOUNS.has(head.lexeme.id)) {
        children[at] = phrase('NP', c.children, 'adverbial')
      }
    }
  }

  // ─── other constituents ───

  private parsePP(): TreeNode {
    const lem = this.lemma(this.cur())
    const p = this.take([], lem === 'yn.loc' ? 'yn.loc' : undefined)
    const np = this.tryNP(true)
    return np ? phrase('PP', [p, np]) : p // fragments degrade to a bare leaf
  }

  private parseVNP(): Phrase {
    const children: TreeNode[] = [this.take(['Vnoun'])]
    while (this.parseComplementInto(children)) { /* greedy */ }
    return phrase('VNP', children)
  }

  private parseRelativeClause(): Clause {
    const children: TreeNode[] = [this.take()] // relativizer inside its clause
    if (this.hasCat(this.cur(), 'V')) {
      children.push(this.take(['V']))
      children.push(gap('NP', 'extraction'))
      while (this.parseComplementInto(children)) { /* to clause end */ }
    }
    return clause('S', children)
  }

  /** Parse one complement into `children`; false at a boundary. */
  private parseComplementInto(children: TreeNode[]): boolean {
    const t = this.cur()
    if (t === undefined) return false
    const lem = this.lemma(t)
    const s = this.sur()

    if (s === 'ddim' || s === 'dim') {
      this.polarity = 'neg'
      children.push(this.take())
      return true
    }
    if (lem === 'yn.prog' || s === 'wedi') {
      children.push(this.take([], lem === 'yn.prog' ? 'yn.prog' : undefined))
      if (this.hasCat(this.cur(), 'Vnoun')) children.push(this.parseVNP())
      return true
    }
    if (lem === 'yn.pred') {
      children.push(this.take([], 'yn.pred'))
      if (this.hasCat(this.cur(), 'Adj')) {
        children.push(phrase('AP', [this.take(['Adj'])]))
      } else {
        const np = this.tryNP(true)
        if (np) children.push(np)
      }
      return true
    }
    if (PREPS.has(lem)) {
      children.push(this.parsePP())
      return true
    }
    if (this.hasCat(t, 'Vnoun') && !this.hasCat(t, 'N')) {
      children.push(this.parseVNP())
      return true
    }
    if (this.hasCat(t, 'Adv')) {
      children.push(phrase('AdvP', [this.take(['Adv'])]))
      return true
    }
    const np = this.tryNP(true)
    if (np) {
      children.push(np)
      return true
    }
    if (this.hasCat(t, 'Adj')) {
      children.push(phrase('AP', [this.take(['Adj'])]))
      return true
    }
    children.push(this.take()) // safety: leftover word as bare leaf, no throw
    return true
  }

  // ─── clause ───

  parse(): ChunkResult {
    const children: TreeNode[] = []

    // initial subordinators / preverbal particles
    for (;;) {
      const s = this.sur()
      if (SUBORDINATORS.has(s)) {
        children.push(this.take())
        continue
      }
      if (PARTICLES[s] !== undefined && this.hasCat(this.cur(1), 'V')) {
        if (s === 'ni' || s === 'na') this.polarity = 'neg'
        children.push(this.take([], PARTICLES[s]))
        continue
      }
      // literary interrogative particle (M5 audit): a° + finite verb
      if (this.lemma(this.cur()) === 'a.int' && this.hasCat(this.cur(1), 'V')) {
        children.push(this.take())
        continue
      }
      break
    }

    // leading XP: wh word, or fronted/fragment NP
    let extraction = false
    if (WH.has(this.sur()) && !this.hasCat(this.cur(), 'N')) {
      children.push(phrase('NP', [this.take()]))
      extraction = true
    } else {
      const np = this.tryNP(true)
      if (np) children.push(np)
    }
    if (RELATIVIZERS.has(this.lemma(this.cur())) && this.hasCat(this.cur(1), 'V')) {
      children.push(this.take())
      extraction = true
    }

    // finite verb, then the subject position
    if (this.hasCat(this.cur(), 'V')) {
      const person = this.pick(this.cur()!, ['V']).entry.person
      children.push(this.take(['V']))
      if (extraction) {
        children.push(gap('NP', 'extraction'))
      } else if (person === '0') {
        // impersonal: no subject position exists — Gwelwyd dyn stays gap-free
      } else if (person === '1' || person === '2') {
        const echo = person === '1' ? PRON_P1 : PRON_P2
        if (echo.has(this.sur()) || (person === '1' && this.lemma(this.cur()) === 'i.pron')) {
          children.push(phrase('NP', [this.take()]))
        } else {
          children.push(gap('NP', 'pro')) // literary pro-drop
        }
      } else {
        const subj = this.tryNP(false)
        children.push(subj ?? gap('NP', 'pro'))
      }
    }

    while (this.parseComplementInto(children)) { /* complements to the end */ }

    this.assignTimeRoles(children)

    if (this.vocativeToks.length > 0) {
      this.toks = [...this.toks, ...this.vocativeToks]
      const voc: TreeNode[] = []
      while (this.cur() !== undefined) voc.push(this.take(['N']))
      children.push(phrase('NP', voc, 'vocative'))
    }

    return { root: clause('S', children, this.polarity), leaves: this.leaves }
  }
}

export function chunk(tokens: TaggedToken[]): ChunkResult {
  return new Chunker(tokens).parse()
}
