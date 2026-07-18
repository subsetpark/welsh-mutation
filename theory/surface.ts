/**
 * §8 — REALIZATION: from verdicts back to the printed line
 * ========================================================
 *
 * The predicate (§5) answers WHETHER; the orthography (§1) states
 * WHAT-IT-LOOKS-LIKE; this chapter composes the two, deriving a
 * sentence's written Welsh from a tree. Each leaf is judged in its
 * derived Environment and, where the verdict fires, its display form is
 * soft-mutated — with a ° prefix marking every mutated word, the
 * notational convention used throughout the report (°ddraig reads
 * "ddraig, softened from draig").
 *
 * The renderer exists for falsifiability as much as for display: the
 * report build asserts every example's rendered line against its authored
 * Welsh, closing the one channel where analysis and prose could silently
 * drift apart — a wrong verdict anywhere makes the line come out visibly
 * wrong. (It caught two such drifts the week it was introduced.)
 *
 * One orthographic joining rule: a form beginning with an apostrophe
 * attaches to the previous token (neu + 'r → neu'r) — the written shape
 * of Welsh cliticization.
 */

import { sm } from './predicate.ts'
import { environmentFor, type Leaf, type TreeNode, type TreePath } from './tree.ts'
import { softMutate } from './orthography.ts'
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
    const r = sm(leaf.lexeme, environmentFor(root, path, register))
    return r.mutates ? `°${softMutate(form, leaf.lexeme.initClass)}` : form
  })
  return tokens.reduce((acc, t) => (t.startsWith("'") ? acc + t : acc === '' ? t : `${acc} ${t}`), '')
}
