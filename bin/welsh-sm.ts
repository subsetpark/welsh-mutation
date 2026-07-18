#!/usr/bin/env node
/**
 * welsh-sm (WORKSTREAM M6): read natural (attested, mutated) Welsh, annotate
 * every token with the account's soft-mutation verdict.
 *
 *   welsh-sm [file] [--json | --explain] [--register colloquial|literary]
 *
 * stdin is read when no file is given. Exit 0 on success (OOV input
 * included), 1 on usage error; arbitrary UTF-8 never crashes — a sentence
 * that fails internally is reported as an error record and processing
 * continues.
 */

import { readFileSync } from 'node:fs'
import { loadLexicon } from '../pipeline/lexicon.ts'
import { judgeText, segment, type JudgedSentence, type JudgedToken } from '../pipeline/judge.ts'
import type { Register } from '../theory/types.ts'

// ─── args ───

function usage(msg?: string): never {
  if (msg) process.stderr.write(`welsh-sm: ${msg}\n`)
  process.stderr.write('usage: welsh-sm [file] [--json | --explain] [--register colloquial|literary]\n')
  process.exit(1)
}

let mode: 'default' | 'json' | 'explain' = 'default'
let register: Register = 'colloquial'
let file: string | undefined

const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]!
  if (a === '--json') mode = 'json'
  else if (a === '--explain') mode = 'explain'
  else if (a === '--register') {
    const v = argv[++i]
    if (v !== 'colloquial' && v !== 'literary') usage(`--register expects colloquial|literary, got ${v ?? 'nothing'}`)
    register = v
  } else if (a.startsWith('--')) usage(`unknown flag ${a}`)
  else if (file === undefined) file = a
  else usage(`unexpected argument ${a}`)
}

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
  r.verdict.mutates
    ? `SM (${r.verdict.licensedBy.join(', ')})`
    : `radical (${r.verdict.reason}${r.verdict.suppressed ? ` blocks ${r.verdict.suppressed.join(', ')}` : ''})`

function defaultToken(t: JudgedToken): string {
  if (t.kind === 'punct' || t.readings.length === 0) return t.surface
  const r = t.readings[0]!
  const marked = r.verdict.mutates ? `°${t.surface}` : t.surface
  const out = r.agrees ? marked : `${t.surface}⟨pred ${r.verdict.mutates ? '°' : ''}${r.predicted}⟩`
  return t.ambiguous ? `${out}‽` : out
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

function renderExplain(rec: SentenceRecord): string {
  if (!rec.sentence) return `!! ${rec.text} (${rec.error})`
  const lines: string[] = [rec.sentence.text]
  for (const t of rec.sentence.tokens) {
    if (t.kind === 'punct') continue
    const head = `  ${t.surface}${t.lemma ? ` [${t.lemma}]` : ''}${t.unknown ? ' UNKNOWN' : ''}${t.ambiguous ? ' AMBIGUOUS' : ''}${t.prev ? `  (prev: ${t.prev})` : ''}`
    lines.push(head)
    for (const r of t.readings) {
      const bits = [
        `${r.radical} ⟨${r.cat}${r.person !== undefined ? ` p${r.person}` : ''}⟩`,
        r.lemma !== r.radical.toLowerCase() ? `lemma=${r.lemma}` : null,
        r.prevLemma !== undefined ? `if prev=${r.prevLemma}` : null,
        r.observed !== null ? `observed ${r.observed}` : null,
        `→ ${verdictStr(r)}`,
        r.agrees ? '✓' : '✗ DISAGREES',
      ].filter(b => b !== null)
      lines.push(`    ${bits.join('  ')}`)
    }
  }
  return lines.join('\n')
}

switch (mode) {
  case 'json':
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
    break
  case 'explain':
    process.stdout.write(records.map(renderExplain).join('\n\n') + '\n')
    break
  default:
    process.stdout.write(records.map(renderDefault).join('\n') + '\n')
}
