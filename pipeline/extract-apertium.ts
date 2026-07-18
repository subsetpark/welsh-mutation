/**
 * Script: build data/lexicon-apertium.json from the apertium-cym monodix.
 *
 * LICENSING: apertium-cym is GPL-3.0; this derived file inherits that and is
 * therefore kept SEPARATE from the CC BY-SA-derived data/lexicon-full.json.
 * GPL import approved by the operator 2026-07-18 (WORKSTREAM M1 gate:
 * UD-only coverage was 86.2% < 90%).
 *
 * Usage: npm run apertium:fetch && npm run apertium:extract
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { DixExpander, dixToEntries, parseXml } from './dix.ts'
import type { LexiconFile } from './lexentry.ts'

const DIX = new URL('../data/apertium/apertium-cym.cym.dix', import.meta.url)
const OUT = new URL('../data/lexicon-apertium.json', import.meta.url)

const expander = new DixExpander(parseXml(readFileSync(DIX, 'utf8')))
const entries = dixToEntries(expander)

const file: LexiconFile = {
  _license: 'GPL-3.0-only',
  _source:
    'Expanded from apertium-cym (apertium-cym.cym.dix, commit caf86f27), GPL-3.0 — ' +
    'https://github.com/apertium/apertium-cym. This file is a derivative of GPL data; ' +
    'it is deliberately separate from the CC BY-SA-derived lexicon-full.json. ' +
    'Radical forms only (initial-* paradigms expanded through identity alternatives). ' +
    'Regenerate: npm run apertium:fetch && npm run apertium:extract.',
  entries,
}
writeFileSync(OUT, JSON.stringify(file) + '\n')
console.log(`entries: ${entries.length}`)
