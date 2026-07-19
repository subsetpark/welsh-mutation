/**
 * §9 — THE INSPECTION VIEW: trees with verdicts and provenance
 * ============================================================
 *
 * Where §8 renders the sentence as Welsh, this chapter renders the
 * ANALYSIS: the tree itself, with child indices on the connectors so a
 * leaf's TreePath can be read straight off the drawing, and — with
 * { verdicts: true } — every leaf annotated with its full-grade
 * mutation() judgment and full provenance, counterfactual vetoes
 * included. This is the form the report's worked examples take, and the
 * debugging view of the whole system: a claim like
 *
 *     └─2 NP
 *        └─0 draig ⟨N f sg⟩ → SM (synt:xp-edge)
 *
 * shows at one glance the structure, the target's features, the verdict,
 * and WHICH rule carried it. `register` selects the §2 register for the
 * judgments (default colloquial).
 */

import { mutation } from './predicate.ts'
import { environmentFor, type Leaf, type TreeNode, type TreePath } from './tree.ts'
import type { Register } from './types.ts'

export interface PrettyOptions {
  verdicts?: boolean
  register?: Register
  /** Per-leaf annotation, replacing the built-in verdict rendering: element
   *  [0] is appended to the leaf's own line, and any further elements render
   *  as aligned sub-lines beneath it (a token's alternative readings, say).
   *  This is how a caller with richer per-token knowledge — the CLI's judged
   *  readings, with observed grades and agreement — folds it into the one
   *  tree view instead of printing a second, parallel listing. */
  annotate?: (leaf: Leaf, path: TreePath) => string[]
}

export function prettyTree(root: TreeNode, opts: PrettyOptions = {}): string {
  const lines: string[] = []

  const leafBase = (node: Leaf): string => {
    const l = node.lexeme
    const feats = [l.cat, l.gender, l.number].filter(Boolean).join(' ')
    let s = `${node.form ?? l.id} ⟨${feats}⟩`
    if (node.lemma && node.lemma !== l.id) s += ` lemma=${node.lemma}`
    if (l.immutable) s += ' immutable'
    return s
  }

  const label = (node: TreeNode, path: TreePath): string => {
    switch (node.kind) {
      case 'clause':
        return node.cat + (node.polarity ? ` (${node.polarity})` : '')
      case 'phrase':
        return node.cat + (node.role ? ` (${node.role})` : '')
      case 'gap':
        return `gap:${node.cat}` + (node.reason ? ` (${node.reason})` : '')
      case 'leaf': {
        let s = leafBase(node)
        if (opts.verdicts) {
          const r = mutation(node.lexeme, environmentFor(root, path, opts.register))
          s += r.grade !== 'none'
            ? ` → ${r.grade} (${r.licensedBy.join(', ')})`
            : ` → radical (${r.reason}${r.suppressed ? ` blocks ${r.suppressed.join(', ')}` : ''})`
        }
        return s
      }
    }
  }

  const walk = (node: TreeNode, path: TreePath, prefix: string, childIndent: string) => {
    if (node.kind === 'leaf' && opts.annotate) {
      const [head, ...rest] = opts.annotate(node, path)
      lines.push(prefix + leafBase(node) + (head ? ` ${head}` : ''))
      for (const extra of rest) lines.push(`${childIndent}  ${extra}`)
      return
    }
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
