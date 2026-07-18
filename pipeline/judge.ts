/**
 * The judge (WORKSTREAM M6): compose analyze → tag → chunk → sm() into
 * per-token verdicts with observed-vs-predicted agreement. Pure module; the
 * CLI formats what this returns.
 *
 * Agreement is SM-scoped, matching the predicate's contract: a mutating
 * verdict agrees iff the observed grade is SM; a non-mutating verdict
 * agrees iff the observed grade is NOT SM (radical, AM and NM are all
 * consistent with "soft mutation did not apply" — AM/NM correctness is the
 * trigger lexicon's business, not this predicate's).
 *
 * Ambiguity propagates two ways (ratified policy):
 * - a token's own retained readings are each judged (fan → fan/man/ban);
 * - an ambiguous PRECEDING token fans out the target's verdicts per
 *   distinct prev lemma (DoD-8: ei gath — gath agrees under ei.3sgm, is
 *   anomalous under ei.3sgf). Implemented by swapping env.prev.lemma; the
 *   tree itself is never mutated.
 */

import type { Cat, Register, SMResult } from '../src/types.ts'
import { environmentFor, type Clause, type Leaf, type TreeNode, type TreePath } from '../src/tree.ts'
import { sm } from '../src/predicate.ts'
import { softMutate } from '../src/mutate.ts'
import { analyze } from './analyze.ts'
import { tag, type TaggedToken } from './tagger.ts'
import { chunk } from './chunk.ts'
import { toLexeme, type Lexicon } from './lexicon.ts'
import type { MutationGrade } from './radical.ts'
import type { RawKind } from './tokenize.ts'

export interface ReadingVerdict {
  radical: string
  lemma: string
  cat: Cat
  /** Observed-mutation hypothesis of this reading (null = radical). */
  observed: MutationGrade | null
  person?: '0' | '1' | '2' | '3'
  /** Set when the verdict assumes one reading of an ambiguous predecessor. */
  prevLemma?: string
  verdict: SMResult
  /** Surface form the SM system predicts under this verdict. */
  predicted: string
  agrees: boolean
}

export interface JudgedToken {
  surface: string
  kind: RawKind
  /** Clitic expansion or multiword-trigger lemma. */
  lemma?: string
  unknown?: boolean
  ambiguous?: boolean
  /** Trigger-lexicon key of the immediately preceding element, if any. */
  prev?: string
  readings: ReadingVerdict[]
}

export interface JudgedSentence {
  text: string
  tokens: JudgedToken[]
  tree: Clause
}

/** Sentence segmentation: line breaks and sentence-final punctuation. */
export function segment(text: string): string[] {
  return text
    .split('\n')
    .flatMap(line => line.split(/(?<=[.!?])\s+/))
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

function leafPaths(root: TreeNode): Map<Leaf, TreePath> {
  const out = new Map<Leaf, TreePath>()
  const walk = (n: TreeNode, path: TreePath) => {
    if (n.kind === 'leaf') {
      out.set(n, path)
      return
    }
    if (n.kind === 'gap') return
    n.children.forEach((c, i) => walk(c, [...path, i]))
  }
  walk(root, [])
  return out
}

function judgeSentence(text: string, lexicon: Lexicon, register: Register): JudgedSentence {
  const tagged = tag(analyze(text, lexicon), lexicon)
  const { root, leaves } = chunk(tagged)
  const paths = leafPaths(root)
  const leafOf = new Map<TaggedToken, Leaf>(leaves.map(l => [l.token, l.leaf]))
  // the token whose leaf precedes a given leaf in tree order — env.prev's
  // supplier when it is not a gap
  const prevTokenOfLeaf = new Map<Leaf, TaggedToken>()
  for (let i = 1; i < leaves.length; i++) {
    prevTokenOfLeaf.set(leaves[i]!.leaf, leaves[i - 1]!.token)
  }

  const tokens: JudgedToken[] = tagged.map(t => {
    const base: JudgedToken = {
      surface: t.surface,
      kind: t.kind,
      ...(t.lemma ? { lemma: t.lemma } : {}),
      ...(t.unknown ? { unknown: true } : {}),
      readings: [],
    }
    const leaf = leafOf.get(t)
    const path = leaf === undefined ? undefined : paths.get(leaf)
    if (leaf === undefined || path === undefined) return base // punct

    const env = environmentFor(root, path, register)
    if (env.prev) base.prev = env.prev.lemma

    // fan out over an ambiguous predecessor's distinct lemma keys (never
    // across a gap: its sentinel lemma is not a token's)
    const prevToken = prevTokenOfLeaf.get(leaf)
    const prevLemmas: (string | undefined)[] =
      env.prev !== null && env.prev.lemma !== '#gap' && prevToken?.ambiguous
        ? [...new Set(prevToken.readings.map(r => r.entry.lemma))]
        : [undefined]

    // near-duplicate lexicon entries (UD + Apertium differing only in
    // features the verdict never consults) must not fake ambiguity
    const seen = new Set<string>()
    for (const r of t.readings) {
      const lexeme = toLexeme(r.entry)
      for (const pl of prevLemmas) {
        const envV = pl === undefined || env.prev === null
          ? env
          : { ...env, prev: { ...env.prev, lemma: pl } }
        const verdict = sm(lexeme, envV)
        const radical = t.kind === 'clitic' ? t.surface : r.radical
        const predicted =
          verdict.mutates && t.kind !== 'clitic'
            ? softMutate(radical, lexeme.initClass)
            : radical
        const agrees = verdict.mutates ? r.grade === 'SM' : r.grade !== 'SM'
        const key = [
          r.radical.toLowerCase(), r.entry.lemma, r.entry.cat, r.grade ?? '',
          r.entry.person ?? '', pl ?? '', JSON.stringify(verdict),
        ].join('|')
        if (seen.has(key)) continue
        seen.add(key)
        base.readings.push({
          radical: r.radical,
          lemma: r.entry.lemma,
          cat: r.entry.cat,
          observed: r.grade,
          ...(r.entry.person ? { person: r.entry.person } : {}),
          ...(pl !== undefined ? { prevLemma: pl } : {}),
          verdict,
          predicted,
          agrees: t.kind === 'clitic' ? true : agrees,
        })
      }
    }
    if (base.readings.length > 1) base.ambiguous = true
    return base
  })

  return { text, tokens, tree: root }
}

export function judgeText(text: string, lexicon: Lexicon, register: Register = 'colloquial'): JudgedSentence[] {
  return segment(text).map(s => judgeSentence(s, lexicon, register))
}
