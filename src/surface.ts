/**
 * Surface renderer: derive the Welsh line from a tree by judging every leaf
 * and applying soft mutation where licensed. `°` marks each mutated word.
 * Joining rule: a form beginning with an apostrophe attaches to the previous
 * token (neu + 'r → neu'r).
 */

import { sm } from './predicate.ts'
import { environmentFor, type Leaf, type TreeNode, type TreePath } from './tree.ts'
import { softMutate } from './mutate.ts'

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

export function renderSurface(root: TreeNode): string {
  const tokens = leavesWithPaths(root).map(({ leaf, path }) => {
    const form = leaf.form ?? leaf.lexeme.id
    const r = sm(leaf.lexeme, environmentFor(root, path))
    return r.mutates ? `°${softMutate(form, leaf.lexeme.initClass)}` : form
  })
  return tokens.reduce((acc, t) => (t.startsWith("'") ? acc + t : acc === '' ? t : `${acc} ${t}`), '')
}
