import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

/**
 * The theory/implementation split, enforced mechanically:
 *
 * - theory/ is self-contained: it is the account of Welsh soft mutation and
 *   may not know the pipeline exists. Every import in theory/ must resolve
 *   WITHIN theory/.
 * - orthographic facts are stated exactly once (theory/orthography.ts);
 *   implementation derives, never restates.
 *
 * pipeline/, bin/ and test/ may import theory freely — the dependency
 * arrow points one way.
 */

const ROOT = resolve(import.meta.dirname, '..')
const THEORY = join(ROOT, 'theory')

function tsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter(e => e.isFile() && e.name.endsWith('.ts'))
    .map(e => join(e.parentPath, e.name))
}

const importSpecifiers = (file: string): string[] =>
  [...readFileSync(file, 'utf8').matchAll(/from '([^']+)'/g)].map(m => m[1]!)

test('theory/ is self-contained: no import leaves the theory directory', () => {
  for (const file of tsFiles(THEORY)) {
    for (const spec of importSpecifiers(file)) {
      if (spec.startsWith('node:')) continue // platform builtins, not a domain
      assert.ok(spec.startsWith('.'), `${file}: non-relative import ${spec}`)
      const target = resolve(dirname(file), spec)
      assert.ok(
        target.startsWith(THEORY + '/'),
        `${file} imports outside theory/: ${spec}`,
      )
    }
  }
})

test('orthography is stated once; implementation derives from it', () => {
  const defining: string[] = []
  for (const dir of ['theory', 'pipeline', 'bin']) {
    for (const file of tsFiles(join(ROOT, dir))) {
      const src = readFileSync(file, 'utf8')
      if (/GRADE_ORTH\s*(:[^=]+)?=/.test(src)) defining.push(file)
      assert.ok(!src.includes('SM_ORTH'), `${file}: legacy SM_ORTH table`)
    }
  }
  assert.deepEqual(defining, [join(THEORY, 'orthography.ts')])
})

test('implementation never imports removed theory-internal modules', () => {
  for (const dir of ['pipeline', 'bin']) {
    for (const file of tsFiles(join(ROOT, dir))) {
      for (const spec of importSpecifiers(file)) {
        assert.ok(!spec.includes('/mutate.ts'), `${file}: stale import ${spec}`)
        assert.ok(!spec.includes('initclass'), `${file}: stale import ${spec}`)
      }
    }
  }
})
