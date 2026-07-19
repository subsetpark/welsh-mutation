#!/usr/bin/env node
/**
 * welsh-sm (WORKSTREAM M6): read natural (attested, mutated) Welsh, annotate
 * every token with the account's mutation verdict — a surface grade
 * (SM/AM/NM) with its licensing rules, or radical with its reason.
 *
 *   welsh-sm [file] [--json | [--predict] [--explain]] [--register colloquial|literary]
 *
 * stdin is read when no file is given. Exit 0 on success (OOV input
 * included), 1 on usage error; arbitrary UTF-8 never crashes — a sentence
 * that fails internally is reported as an error record and processing
 * continues.
 *
 * --predict swaps the sentence line from the comparison view to the pure
 * predicted line — full-grade (SM/AM/NM/prothesis), well-formed Welsh
 * regenerated from the recovered radicals. --explain appends §9's
 * constituent tree beneath whichever line view is active, each leaf
 * annotated with its judged reading — observed grade, verdict with
 * provenance, agreement — and a token's alternative readings as sub-lines;
 * the two flags compose. --json is the machine format and already
 * contains everything, so it combines with neither.
 *
 * Mutated tokens carry King §7's grade marks: ° soft, ʰ aspirate, ⁿ nasal.
 */

import { readFileSync } from 'node:fs'
import { loadLexicon } from '../pipeline/lexicon.ts'
import { judgeText, segment, type JudgedSentence, type JudgedToken } from '../pipeline/judge.ts'
import { prettyTree } from '../theory/pretty.ts'
import type { TreeNode, TreePath } from '../theory/tree.ts'
import type { MutationGrade } from '../theory/orthography.ts'
import type { Register } from '../theory/types.ts'

// ─── args ───

function usage(msg?: string): never {
  if (msg) process.stderr.write(`welsh-sm: ${msg}\n`)
  process.stderr.write('usage: welsh-sm [file] [--json | --explain | --predict] [--register colloquial|literary]\n')
  process.exit(1)
}

let json = false
let explain = false
let predict = false
let register: Register = 'colloquial'
let file: string | undefined

const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]!
  if (a === '--json') json = true
  else if (a === '--explain') explain = true
  else if (a === '--predict') predict = true
  else if (a === '--register') {
    const v = argv[++i]
    if (v !== 'colloquial' && v !== 'literary') usage(`--register expects colloquial|literary, got ${v ?? 'nothing'}`)
    register = v
  } else if (a.startsWith('--')) usage(`unknown flag ${a}`)
  else if (file === undefined) file = a
  else usage(`unexpected argument ${a}`)
}
if (json && (explain || predict)) usage('--json already carries everything; it does not combine')

const input = file !== undefined ? readFileSync(file, 'utf8') : readFileSync(0, 'utf8')

// ─── judge, never crash ───

interface SentenceRecord {
  sentence: JudgedSentence | null
  error?: string
  text: string
}

const lexicon = loadLexicon()
const records: SentenceRecord[] = segment(input).map(text => {
  try {
    return { text, sentence: judgeText(text, lexicon, register)[0] ?? null }
  } catch (e) {
    return { text, sentence: null, error: e instanceof Error ? e.message : String(e) }
  }
})

// ─── formatting ───

const verdictStr = (r: JudgedToken['readings'][number]): string =>
  r.verdict.grade !== 'none'
    ? `${r.verdict.grade} (${r.verdict.licensedBy.join(', ')})`
    : `radical (${r.verdict.reason}${r.verdict.suppressed ? ` blocks ${r.verdict.suppressed.join(', ')}` : ''})`

// King §7's mutation marks: ° soft, ʰ aspirate, ⁿ nasal.
const GRADE_MARK: Record<MutationGrade, string> = { SM: '°', AM: 'ʰ', NM: 'ⁿ' }
const markOf = (grade: MutationGrade | 'none'): string =>
  grade === 'none' ? '' : GRADE_MARK[grade]

function defaultToken(t: JudgedToken): string {
  if (t.kind === 'punct' || t.readings.length === 0) return t.surface
  const r = t.readings[0]!
  const mark = markOf(r.verdict.grade)
  const out = r.agrees ? `${mark}${t.surface}` : `${t.surface}⟨pred ${mark}${r.predicted}⟩`
  return t.ambiguous ? `${out}‽` : out
}

/** --predict: the pure generated line — full-grade Welsh from radicals. */
function predictToken(t: JudgedToken): string {
  if (t.kind === 'punct' || t.readings.length === 0) return t.surface
  const r = t.readings[0]!
  return `${markOf(r.verdict.grade)}${r.predicted}`
}

function renderPredict(rec: SentenceRecord): string {
  if (!rec.sentence) return `!! ${rec.text} (${rec.error})`
  return joinTokens(rec.sentence.tokens.map(t => ({ text: predictToken(t), kind: t.kind, surface: t.surface })))
}

function joinTokens(parts: { text: string; kind: string; surface: string }[]): string {
  return parts.reduce((acc, p) => {
    const attach = p.surface.startsWith("'") || (p.kind === 'punct' && !'("«'.includes(p.surface))
    return acc === '' ? p.text : attach ? acc + p.text : `${acc} ${p.text}`
  }, '')
}

function renderDefault(rec: SentenceRecord): string {
  if (!rec.sentence) return `!! ${rec.text} (${rec.error})`
  return joinTokens(rec.sentence.tokens.map(t => ({ text: defaultToken(t), kind: t.kind, surface: t.surface })))
}

/** The unified --explain view: §9's tree, each leaf annotated with its
 *  judged reading — observed grade, verdict, agreement — and a token's
 *  alternative readings as aligned sub-lines beneath its leaf. Leaves pair
 *  with non-punct tokens positionally (the chunker guarantees the
 *  correspondence); the reading matching the leaf's lexeme leads, so the
 *  annotation explains the form the tree shows. In the prediction view the
 *  surface is discarded by design, so observed grades and agreement marks
 *  are omitted with it. */
function explainTree(s: JudgedSentence, compare: boolean): string {
  const tokens = s.tokens.filter(t => t.kind !== 'punct')
  const byPath = new Map<string, JudgedToken>()
  let i = 0
  const pair = (n: TreeNode, path: TreePath) => {
    if (n.kind === 'leaf') {
      const t = tokens[i++]
      if (t) byPath.set(JSON.stringify(path), t)
      return
    }
    if (n.kind === 'gap') return
    n.children.forEach((c, j) => pair(c, [...path, j]))
  }
  pair(s.tree, [])

  const bits = (t: JudgedToken, r: JudgedToken['readings'][number], main: boolean): string =>
    [
      main && t.unknown ? 'UNKNOWN' : null,
      main ? null : `${r.radical} ⟨${r.cat}${r.person !== undefined ? ` p${r.person}` : ''}⟩`,
      main || r.lemma === r.radical.toLowerCase() ? null : `lemma=${r.lemma}`,
      r.prevLemma !== undefined ? `if prev=${r.prevLemma}` : null,
      compare && r.observed !== null ? `observed ${r.observed}` : null,
      `→ ${verdictStr(r)}`,
      compare ? (r.agrees ? '✓' : '✗ DISAGREES') : null,
    ].filter(b => b !== null).join('  ')

  const rendered = prettyTree(s.tree, {
    register,
    annotate: (leaf, path) => {
      const t = byPath.get(JSON.stringify(path))
      if (!t || t.readings.length === 0) return [t?.unknown ? 'UNKNOWN' : '']
      const primary =
        t.readings.find(r => r.lemma === leaf.lexeme.id && r.cat === leaf.lexeme.cat) ??
        t.readings[0]!
      return [
        bits(t, primary, true),
        ...t.readings.filter(r => r !== primary).map(r => bits(t, r, false)),
      ]
    },
  })
  return rendered.split('\n').map(l => `  ${l}`).join('\n')
}

if (json) {
  process.stdout.write(
    JSON.stringify(
      {
        register,
        sentences: records.map(r =>
          r.sentence ?? { text: r.text, error: r.error, tokens: [], tree: null },
        ),
      },
      null,
      2,
    ) + '\n',
  )
} else {
  const line = predict ? renderPredict : renderDefault
  const renderSentence = (rec: SentenceRecord): string =>
    explain && rec.sentence
      ? `${line(rec)}\n${explainTree(rec.sentence, !predict)}`
      : line(rec)
  process.stdout.write(records.map(renderSentence).join(explain ? '\n\n' : '\n') + '\n')
}
