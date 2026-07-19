/**
 * §8 — REALIZATION: from verdicts back to the printed line
 * ========================================================
 *
 * The licensing calculus (§5) answers WHICH GRADE; the orthography (§1)
 * states WHAT-IT-LOOKS-LIKE; this chapter composes the two, deriving a
 * sentence's written Welsh from a tree. Each leaf is judged in its
 * derived Environment and its display form realized under the verdict's
 * grade. Soft-mutated forms carry a ° prefix (King §7b's
 * º-before-mutated-form notation, used throughout the report: °ddraig
 * reads "ddraig, softened from draig"); aspirate and nasal forms are
 * written plain (fy nghath, chwe cheffyl) — soft mutation is the
 * account's primary subject, and ° marks exactly that.
 *
 * The renderer exists for falsifiability as much as for display: the
 * report build asserts every example's rendered line against its authored
 * Welsh, closing the one channel where analysis and prose could silently
 * drift apart — a wrong verdict anywhere makes the line come out visibly
 * wrong. Because every grade is derived from the verdict, the AM/NM
 * spellings on the line (nghath, mlynedd) are themselves assertions, not
 * authored surface facts.
 *
 * One orthographic joining rule: a form beginning with an apostrophe
 * attaches to the previous token (neu + 'r → neu'r) — the written shape
 * of Welsh cliticization.
 */

import { mutation } from './predicate.ts'
import { environmentFor, type Leaf, type TreeNode, type TreePath } from './tree.ts'
import { applyGrade } from './orthography.ts'
import type { Register } from './types.ts'

function leavesWithPaths(root: TreeNode): { leaf: Leaf; path: TreePath }[] {
  const out: { leaf: Leaf; path: TreePath }[] = []
  const walk = (node: TreeNode, path: TreePath) => {
    if (node.kind === 'leaf') out.push({ leaf: node, path })
    else if (node.kind === 'gap') return
    else node.children.forEach((c, i) => walk(c, [...path, i]))
  }
  walk(root, [])
  return out
}

export function renderSurface(root: TreeNode, register: Register = 'colloquial'): string {
  const tokens = leavesWithPaths(root).map(({ leaf, path }) => {
    const form = leaf.form ?? leaf.lexeme.id
    const r = mutation(leaf.lexeme, environmentFor(root, path, register))
    if (r.grade === 'none') return form
    const shaped = applyGrade(form, r.grade)
    return r.grade === 'SM' ? `°${shaped}` : shaped
  })
  return tokens.reduce((acc, t) => (t.startsWith("'") ? acc + t : acc === '' ? t : `${acc} ${t}`), '')
}
