/**
 * §9 — THE INSPECTION VIEW: trees with verdicts and provenance
 * ============================================================
 *
 * Where §8 renders the sentence as Welsh, this chapter renders the
 * ANALYSIS: the tree itself, with child indices on the connectors so a
 * leaf's TreePath can be read straight off the drawing, and — with
 * { verdicts: true } — every leaf annotated with its sm() judgment and
 * full provenance, counterfactual vetoes included. This is the form the
 * report's worked examples take, and the debugging view of the whole
 * system: a claim like
 *
 *     └─2 NP
 *        └─0 draig ⟨N f sg⟩ → SM (synt:xp-edge)
 *
 * shows at one glance the structure, the target's features, the verdict,
 * and WHICH rule carried it. `register` selects the §2 register for the
 * judgments (default colloquial).
 */

import { sm } from './predicate.ts'
import { environmentFor, type TreeNode, type TreePath } from './tree.ts'
import type { Register } from './types.ts'

export interface PrettyOptions {
  verdicts?: boolean
  register?: Register
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
        return `gap:${node.cat}` + (node.reason ? ` (${node.reason})` : '')
      case 'leaf': {
        const l = node.lexeme
        const feats = [l.cat, l.gender, l.number].filter(Boolean).join(' ')
        let s = `${node.form ?? l.id} ⟨${feats}⟩`
        if (node.lemma && node.lemma !== l.id) s += ` lemma=${node.lemma}`
        if (l.immutable) s += ' immutable'
        if (opts.verdicts) {
          const r = sm(l, environmentFor(root, path, opts.register))
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
