#!/usr/bin/env node
/**
 * welsh-sm (WORKSTREAM M6): read natural (attested, mutated) Welsh, annotate
 * every token with the account's soft-mutation verdict.
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
 * regenerated from the recovered radicals. --explain appends per-token
 * provenance beneath whichever line view is active; the two compose.
 * --json is the machine format and already contains everything, so it
 * combines with neither.
 */

import { readFileSync } from 'node:fs'
import { loadLexicon } from '../pipeline/lexicon.ts'
import { judgeText, segment, type JudgedSentence, type JudgedToken } from '../pipeline/judge.ts'
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

function defaultToken(t: JudgedToken): string {
  if (t.kind === 'punct' || t.readings.length === 0) return t.surface
  const r = t.readings[0]!
  const mutated = r.verdict.grade !== 'none'
  const marked = mutated ? `°${t.surface}` : t.surface
  const out = r.agrees ? marked : `${t.surface}⟨pred ${mutated ? '°' : ''}${r.predicted}⟩`
  return t.ambiguous ? `${out}‽` : out
}

/** --predict: the pure generated line — full-grade Welsh from radicals. */
function predictToken(t: JudgedToken): string {
  if (t.kind === 'punct' || t.readings.length === 0) return t.surface
  const r = t.readings[0]!
  return r.verdict.grade !== 'none' ? `°${r.predicted}` : r.predicted
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

/** Per-token provenance detail, appended by --explain under the line view.
 *  In the prediction view the surface is discarded by design, so the
 *  observed grade and the agreement marks are omitted with it. */
function tokenDetails(rec: SentenceRecord, compare: boolean): string {
  if (!rec.sentence) return ''
  const lines: string[] = []
  for (const t of rec.sentence.tokens) {
    if (t.kind === 'punct') continue
    const head = `  ${t.surface}${t.lemma ? ` [${t.lemma}]` : ''}${t.unknown ? ' UNKNOWN' : ''}${t.ambiguous ? ' AMBIGUOUS' : ''}${t.prev ? `  (prev: ${t.prev})` : ''}`
    lines.push(head)
    for (const r of t.readings) {
      const bits = [
        `${r.radical} ⟨${r.cat}${r.person !== undefined ? ` p${r.person}` : ''}⟩`,
        r.lemma !== r.radical.toLowerCase() ? `lemma=${r.lemma}` : null,
        r.prevLemma !== undefined ? `if prev=${r.prevLemma}` : null,
        compare && r.observed !== null ? `observed ${r.observed}` : null,
        `→ ${verdictStr(r)}`,
        compare ? (r.agrees ? '✓' : '✗ DISAGREES') : null,
      ].filter(b => b !== null)
      lines.push(`    ${bits.join('  ')}`)
    }
  }
  return lines.join('\n')
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
    explain && rec.sentence ? `${line(rec)}\n${tokenDetails(rec, !predict)}` : line(rec)
  process.stdout.write(records.map(renderSentence).join(explain ? '\n\n' : '\n') + '\n')
}
