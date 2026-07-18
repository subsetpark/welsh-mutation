import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildReport } from '../theory/report/report.ts'

test('report builds with every example verdict asserted', () => {
  const md = buildReport()
  assert.match(md, /# Soft Mutation in Colloquial Welsh/)
  assert.match(md, /## 10\. Bibliography/)
  assert.match(md, /synt:xp-edge/)
  assert.match(md, /gend:agr-mod/)
  assert.match(md, /\| `y` \| SM-ltd \|/)
})
