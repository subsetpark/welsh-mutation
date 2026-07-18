/**
 * Apertium monodix (.dix) parser and paradigm expander, scoped to building a
 * RADICAL-form lexicon from apertium-cym.
 *
 * The dictionary models mutation as leading `initial-*` paradigms whose
 * analysis-direction (r="LR") alternatives map mutated surfaces onto the
 * radical initial. We expand those paradigms through their IDENTITY
 * alternatives only (l == r), so every emitted surface form is radical —
 * mutated variants are M2's inverse-map problem, not lexicon rows.
 *
 * Multiword surfaces (<b/> blanks), <re> regex entries, and the standalone
 * `mutations` entry are skipped: the lexicon is single-token and MWE triggers
 * are owned by data/triggers.json.
 */

import type { Cat } from '../theory/types.ts'
import type { LexEntry } from './lexentry.ts'
import { VOWEL, initClassOf } from '../theory/orthography.ts'

// ─── minimal XML ───

export interface XmlEl {
  tag: string
  attrs: Record<string, string>
  children: (XmlEl | string)[]
}

const TOKEN = /<\?[^>]*\?>|<!--[\s\S]*?-->|<\/[^>]+>|<[^>]+>|[^<]+/g
const ATTR = /([\w:-]+)\s*=\s*"([^"]*)"/g

export function parseXml(text: string): XmlEl {
  const root: XmlEl = { tag: '#root', attrs: {}, children: [] }
  const stack: XmlEl[] = [root]
  for (const tok of text.match(TOKEN) ?? []) {
    const top = stack[stack.length - 1]!
    if (tok.startsWith('<?') || tok.startsWith('<!--')) continue
    if (tok.startsWith('</')) {
      stack.pop()
      continue
    }
    if (tok.startsWith('<')) {
      const selfClosing = tok.endsWith('/>')
      const inner = tok.slice(1, selfClosing ? -2 : -1)
      const tag = inner.match(/^[\w:-]+/)?.[0] ?? ''
      const attrs: Record<string, string> = {}
      for (const m of inner.matchAll(ATTR)) attrs[m[1]!] = m[2]!
      const el: XmlEl = { tag, attrs, children: [] }
      top.children.push(el)
      if (!selfClosing) stack.push(el)
      continue
    }
    if (tok.trim() !== '') top.children.push(tok)
  }
  return root
}

const els = (n: XmlEl, tag: string): XmlEl[] =>
  n.children.filter((c): c is XmlEl => typeof c !== 'string' && c.tag === tag)

function find(n: XmlEl, tag: string): XmlEl | undefined {
  for (const c of n.children) {
    if (typeof c === 'string') continue
    if (c.tag === tag) return c
    const deep = find(c, tag)
    if (deep) return deep
  }
  return undefined
}

// ─── expansion ───

/** One expanded alternative: surface fragment, lemma-side fragment, tags. */
interface Alt {
  l: string
  r: string
  tags: string[]
}

/** Flatten an <l> or <r> side: text plus <b/> → space; <s n=…> collect tags;
 *  <g>/<j/> (multiword grouping) render as markers that disqualify later. */
function side(el: XmlEl | undefined): { text: string; tags: string[] } {
  if (!el) return { text: '', tags: [] }
  let text = ''
  const tags: string[] = []
  for (const c of el.children) {
    if (typeof c === 'string') text += c
    else if (c.tag === 'b') text += ' '
    else if (c.tag === 's') tags.push(c.attrs['n'] ?? '')
    else if (c.tag === 'g' || c.tag === 'j') text += ' '
  }
  return { text, tags }
}

function combine(a: Alt, b: Alt): Alt {
  return { l: a.l + b.l, r: a.r + b.r, tags: [...a.tags, ...b.tags] }
}

export class DixExpander {
  private pardefs = new Map<string, XmlEl>()
  private cache = new Map<string, Alt[]>()

  constructor(private root: XmlEl) {
    const defs = find(root, 'pardefs')
    if (!defs) throw new Error('no <pardefs> in dictionary')
    for (const pd of els(defs, 'pardef')) {
      this.pardefs.set(pd.attrs['n'] ?? '', pd)
    }
  }

  /** Alternatives contributed by one <e>: the sequence product of its items. */
  private expandE(e: XmlEl): Alt[] {
    let acc: Alt[] = [{ l: '', r: '', tags: [] }]
    for (const item of e.children) {
      if (typeof item === 'string') continue
      let alts: Alt[]
      if (item.tag === 'i') {
        const { text } = side(item)
        alts = [{ l: text, r: text, tags: [] }]
      } else if (item.tag === 'p') {
        const l = side(els(item, 'l')[0])
        const r = side(els(item, 'r')[0])
        alts = [{ l: l.text, r: r.text, tags: r.tags }]
      } else if (item.tag === 'par') {
        alts = this.pardefAlts(item.attrs['n'] ?? '')
      } else if (item.tag === 're') {
        return [] // regex entries have no enumerable surface
      } else {
        continue
      }
      if (alts.length === 0) return []
      acc = acc.flatMap(a => alts.map(b => combine(a, b)))
    }
    return acc
  }

  private pardefAlts(name: string): Alt[] {
    const cached = this.cache.get(name)
    if (cached) return cached
    const pd = this.pardefs.get(name)
    if (!pd) return []
    let all: { alt: Alt; dir?: string }[] = []
    for (const e of els(pd, 'e')) {
      for (const alt of this.expandE(e)) all.push({ alt, dir: e.attrs['r'] })
    }
    let out: Alt[]
    if (name.startsWith('initial-')) {
      // radical-only: identity alternatives; fall back to generation side
      const identity = all.filter(x => x.alt.l === x.alt.r)
      const pool = identity.length > 0 ? identity : all.filter(x => x.dir === 'RL')
      const seen = new Set<string>()
      out = pool
        .filter(x => !seen.has(x.alt.l) && (seen.add(x.alt.l), true))
        .map(x => x.alt)
    } else {
      out = all.map(x => x.alt)
    }
    this.cache.set(name, out)
    return out
  }

  /** Expand every main-section entry to (surface, lemma, tags) triples. */
  *entries(): Generator<{ surface: string; lemma: string; tags: string[] }> {
    for (const section of els(find(this.root, 'dictionary') ?? this.root, 'section')) {
      for (const e of els(section, 'e')) {
        const lemma = e.attrs['lm']
        if (!lemma || lemma === 'mutations') continue
        for (const alt of this.expandE(e)) {
          yield { surface: alt.l, lemma, tags: alt.tags }
        }
      }
    }
  }
}

// ─── tag mapping ───

const VERB_POS = new Set(['vblex', 'vbser', 'vaux', 'vbhaver', 'vbmod'])
const PERSON: Record<string, LexEntry['person']> = { p1: '1', p2: '2', p3: '3', impers: '0' }

function catFromTags(tags: Set<string>): Cat | null {
  if (VERB_POS.has([...tags][0] ?? '') || [...VERB_POS].some(t => tags.has(t))) {
    if (tags.has('inf') || tags.has('ger')) return 'Vnoun'
    if (tags.has('imp')) return 'Vimp'
    return 'V'
  }
  if (tags.has('np')) return 'N'
  if (tags.has('n')) return 'N'
  if (tags.has('adj')) return 'Adj'
  if (tags.has('adv') || tags.has('preadv')) return 'Adv'
  if (tags.has('num')) return 'Num'
  return null // closed classes stay hand-curated
}

/** Map expanded dictionary triples to lexicon entries (open classes only). */
export function dixToEntries(expander: DixExpander): LexEntry[] {
  const acc = new Map<string, LexEntry>()
  for (const { surface, lemma, tags: tagList } of expander.entries()) {
    if (surface === '' || surface.includes(' ') || !/^\p{L}/u.test(surface)) continue
    // h-prothesis variants are encoded as separate <l>hysgol</l><r>ysgol</r>
    // lines rather than initial-* paradigms: a surface in h- whose lemma
    // begins with the following vowel is a MUTATED shape, not a radical
    const s = surface.toLowerCase()
    const l = lemma.toLowerCase()
    if (s.startsWith('h') && !l.startsWith('h') && VOWEL.test(s.slice(1)) && l.startsWith(s[1]!)) {
      continue
    }
    const tags = new Set(tagList)
    const cat = catFromTags(tags)
    if (cat === null) continue

    const proper = tags.has('np')
    const form = proper ? surface : surface.toLowerCase()
    const gender = tags.has('m') && !tags.has('mf') ? 'm' : tags.has('f') && !tags.has('mf') ? 'f' : undefined
    const number = tags.has('sg') && !tags.has('sp') ? 'sg' : tags.has('pl') && !tags.has('sp') ? 'pl' : undefined
    const person = cat === 'V' || cat === 'Vimp'
      ? Object.entries(PERSON).find(([t]) => tags.has(t))?.[1]
      : undefined

    const key = [form, lemma, cat, gender ?? '', number ?? '', person ?? '', proper ? 'P' : ''].join('|')
    if (!acc.has(key)) {
      acc.set(key, {
        form, lemma, cat,
        initClass: initClassOf(form),
        ...(gender ? { gender } : {}),
        ...(number ? { number } : {}),
        ...(person ? { person } : {}),
        ...(proper ? { proper } : {}),
        freq: 0,
      })
    }
  }
  return [...acc.values()].sort((a, b) =>
    a.form.localeCompare(b.form, 'cy') || a.lemma.localeCompare(b.lemma, 'cy') || a.cat.localeCompare(b.cat),
  )
}
