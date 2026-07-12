/**
 * Pretty printer for authored trees. Child indices appear on the connectors,
 * so a leaf's TreePath can be read straight off the rendering. With
 * { verdicts: true } every leaf is annotated with its sm() judgment and
 * provenance — the debugging view of the whole system.
 */

import { sm } from './predicate.ts'
import { environmentFor, type TreeNode, type TreePath } from './tree.ts'

export interface PrettyOptions {
  verdicts?: boolean
}

export function prettyTree(root: TreeNode, opts: PrettyOptions = {}): string {
  const lines: string[] = []

  const label = (node: TreeNode, path: TreePath): string => {
    switch (node.kind) {
      case 'clause':
        return node.cat + (node.polarity ? ` (${node.polarity})` : '')
      case 'phrase':
        return node.cat + (node.role ? ` (${node.role})` : '')
      case 'gap':
        return `gap:${node.cat}`
      case 'leaf': {
        const l = node.lexeme
        const feats = [l.cat, l.gender, l.number].filter(Boolean).join(' ')
        let s = `${l.id} ⟨${feats}⟩`
        if (node.lemma && node.lemma !== l.id) s += ` lemma=${node.lemma}`
        if (l.immutable) s += ' immutable'
        if (opts.verdicts) {
          const r = sm(l, environmentFor(root, path))
          s += r.mutates
            ? ` → SM (${r.licensedBy.join(', ')})`
            : ` → radical (${r.reason}${r.suppressed ? ` blocks ${r.suppressed.join(', ')}` : ''})`
        }
        return s
      }
    }
  }

  const walk = (node: TreeNode, path: TreePath, prefix: string, childIndent: string) => {
    lines.push(prefix + label(node, path))
    if (node.kind === 'leaf' || node.kind === 'gap') return
    node.children.forEach((child, i) => {
      const last = i === node.children.length - 1
      walk(
        child,
        [...path, i],
        childIndent + (last ? '└─' : '├─') + i + ' ',
        childIndent + (last ? '   ' : '│  '),
      )
    })
  }

  walk(root, [], '', '')
  return lines.join('\n')
}
