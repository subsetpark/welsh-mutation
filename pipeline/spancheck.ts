/**
 * Script: NP/PP span agreement between the chunker and UD_Welsh-CCG
 * dependency yields, over the held-out test split. A DASHBOARD, not a gate
 * (M4 DoD): the chunker is built from King's grammar, the treebank from UD
 * conventions — divergence is signal for a human, not a build failure.
 *
 * Method: run the real pipeline (analyze → tag → chunk, full lexicon) on
 * each sentence's `# text`; align our word tokens to UD words by lowercase
 * form (skip on mismatch); compare span sets. UD NP = the contiguous yield
 * of a NOUN/PROPN head's subtree, verb-free, det/case function words
 * included; UD PP = a case-ADP plus its head's yield.
 */

import { readFileSync } from 'node:fs'
import { parseConllu, type ConlluWord } from './conllu.ts'
import { analyze } from './analyze.ts'
import { tag } from './tagger.ts'
import { chunk } from './chunk.ts'
import { loadLexicon } from './lexicon.ts'
import type { TreeNode } from '../src/tree.ts'

const MAX_SENTENCES = 200
const MAX_TOKENS = 25

type Span = string // "start-end" over aligned word indices

function udSubtreeYield(words: ConlluWord[], head: ConlluWord): number[] {
  const inSubtree = (w: ConlluWord): boolean => {
    for (let cur: ConlluWord | undefined = w; cur; ) {
      if (cur.id === head.id) return true
      cur = words.find(x => x.id === cur!.head)
    }
    return false
  }
  return words.filter(inSubtree).map(w => w.id)
}

/** Spans in ALIGNED coordinates (punct-free word indices via `idx`). */
function udSpans(words: ConlluWord[], idx: Map<number, number>): { np: Set<Span>; pp: Set<Span> } {
  const np = new Set<Span>()
  const pp = new Set<Span>()
  const spanOf = (ids: number[]): Span | null => {
    const mapped = [...new Set(ids.filter(id => idx.has(id)).map(id => idx.get(id)!))]
    if (mapped.length === 0) return null
    const lo = Math.min(...mapped)
    const hi = Math.max(...mapped)
    return hi - lo + 1 === mapped.length ? `${lo}-${hi}` : null // contiguous only
  }
  const BASE_DEPRELS = new Set(['det', 'amod', 'nummod', 'flat', 'fixed', 'compound'])
  for (const w of words) {
    if (w.upos === 'NOUN' || w.upos === 'PROPN') {
      // full yield (maximal NP) …
      const ids = udSubtreeYield(words, w)
      const hasVerb = words.some(
        x => ids.includes(x.id) && (x.upos === 'VERB' || x.upos === 'AUX'),
      )
      const span = hasVerb ? null : spanOf(ids)
      if (span) np.add(span)
      // … and the base NP (head + det/amod/nummod-type children), which is
      // closer to the chunker's deliberately flat brackets
      const baseIds = [
        w.id,
        ...words
          .filter(x => x.head === w.id && BASE_DEPRELS.has(x.deprel))
          .flatMap(x => udSubtreeYield(words, x)),
      ]
      const baseSpan = spanOf(baseIds)
      if (baseSpan) np.add(baseSpan)
    }
    if (w.upos === 'ADP' && w.deprel === 'case' && w.head !== null) {
      const h = words.find(x => x.id === w.head)
      if (!h) continue
      const span = spanOf([...udSubtreeYield(words, h), w.id])
      if (span) pp.add(span)
    }
  }
  return { np, pp }
}

function chunkSpans(root: TreeNode, leafIndex: Map<unknown, number>): { np: Set<Span>; pp: Set<Span> } {
  const np = new Set<Span>()
  const pp = new Set<Span>()
  const leafIdxs = (n: TreeNode): number[] => {
    if (n.kind === 'leaf') {
      const i = leafIndex.get(n)
      return i === undefined ? [] : [i]
    }
    if (n.kind === 'gap') return []
    return n.children.flatMap(leafIdxs)
  }
  const walk = (n: TreeNode) => {
    if (n.kind === 'leaf' || n.kind === 'gap') return
    if (n.kind === 'phrase' && (n.cat === 'NP' || n.cat === 'PP')) {
      const idxs = leafIdxs(n)
      if (idxs.length > 0) {
        const span = `${Math.min(...idxs)}-${Math.max(...idxs)}`
        if (n.cat === 'NP') np.add(span)
        else pp.add(span)
      }
    }
    n.children.forEach(walk)
  }
  walk(root)
  return { np, pp }
}

// ─── main ───

const lexicon = loadLexicon()
const url = new URL('../data/ud/cy_ccg-ud-test.conllu', import.meta.url)
const sentences = parseConllu(readFileSync(url, 'utf8'))

let used = 0
let skippedAlign = 0
const totals = { np: { match: 0, chunk: 0, gold: 0 }, pp: { match: 0, chunk: 0, gold: 0 } }

for (const s of sentences) {
  if (used >= MAX_SENTENCES) break
  const text = s.comments.find(c => c.startsWith('# text ='))?.slice(9).trim()
  if (!text || s.words.length > MAX_TOKENS) continue

  const tagged = tag(analyze(text, lexicon), lexicon)
  const result = chunk(tagged)

  // Alignment: our leaves (surface order, MWEs split back) vs UD word forms.
  const ourForms: string[] = []
  const leafIndex = new Map<unknown, number>()
  for (const { token, leaf } of result.leaves) {
    leafIndex.set(leaf, ourForms.length)
    for (const part of token.surface.split(' ')) ourForms.push(part.toLowerCase())
  }
  const nonPunct = s.words.filter(w => w.upos !== 'PUNCT')
  const idx = new Map(nonPunct.map((w, i) => [w.id, i] as const))
  const udForms = nonPunct.map(w => w.form.toLowerCase().replace(/’/g, "'"))
  if (ourForms.join(' ') !== udForms.join(' ')) {
    skippedAlign++
    continue
  }
  used++

  const gold = udSpans(s.words, idx)
  const ours = chunkSpans(result.root, leafIndex)
  for (const cat of ['np', 'pp'] as const) {
    totals[cat].chunk += ours[cat].size
    totals[cat].gold += gold[cat].size
    for (const span of ours[cat]) if (gold[cat].has(span)) totals[cat].match++
  }
}

const pct = (a: number, b: number) => (b === 0 ? '—' : ((100 * a) / b).toFixed(1) + '%')
console.log(`sentences compared: ${used} (alignment-skipped: ${skippedAlign})`)
for (const cat of ['np', 'pp'] as const) {
  const t = totals[cat]
  console.log(
    `${cat.toUpperCase()} spans — chunker ${t.chunk}, UD ${t.gold}, agree ${t.match} ` +
    `(precision ${pct(t.match, t.chunk)}, recall ${pct(t.match, t.gold)})`,
  )
}
