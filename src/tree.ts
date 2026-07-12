/**
 * Tree layer: the author constructs a c-structure; we derive the Environment.
 *
 * The author is responsible for structure and FUNCTION labels (role,
 * polarity), never for evaluating mutation-relevant predicates. Everything
 * in Environment — prev.lemma, relationToTarget, isXPRightEdge, agreement,
 * position — is computed here from tree geometry plus leaf features.
 *
 * Conventions the author must follow (see ARCHITECTURE.md):
 * - Subordinators/conjunctions/preverbal particles are leaf children of the
 *   clause they introduce (so `os daw e` does not present daw as clause-
 *   initial, while root `Golles i…` does).
 * - Extraction gaps are explicit Gap nodes with a phrasal category.
 * - Lemma normalization: orthographic variants share a lemma (y/yr/'r → 'y').
 */

import type { Environment, Lexeme, PositionTag, PrevRelation } from './types.ts'

export type PhraseCat = 'NP' | 'PP' | 'AP' | 'AdvP' | 'NumP' | 'VNP'
export type ClauseCat = 'S' | 'CP'
export type Role = 'subject' | 'object' | 'possessor' | 'adverbial' | 'vocative'

export interface Phrase {
  kind: 'phrase'
  cat: PhraseCat
  role?: Role
  children: TreeNode[]
}
export interface Clause {
  kind: 'clause'
  cat: ClauseCat
  polarity?: 'aff' | 'neg'
  children: TreeNode[]
}
export interface Leaf {
  kind: 'leaf'
  lexeme: Lexeme
  /** Trigger-lexicon key when it differs from lexeme.id (yn.pred, ei.3sgm, y for 'r…). */
  lemma?: string
}
/** Extraction gap (wh-trace, relative gap). Occupies a string position but no
 *  surface form. Counts as a phrase for XP-edge purposes; blocks contact
 *  adjacency (its sentinel lemma matches no trigger frame). */
export interface Gap {
  kind: 'gap'
  cat: PhraseCat
}
export type TreeNode = Phrase | Clause | Leaf | Gap

const GAP_LEMMA = '#gap'

type Terminal = Leaf | Gap
const isTerminal = (n: TreeNode): n is Terminal => n.kind === 'leaf' || n.kind === 'gap'

function buildParents(root: TreeNode): Map<TreeNode, TreeNode> {
  const parents = new Map<TreeNode, TreeNode>()
  const walk = (node: TreeNode) => {
    if (isTerminal(node)) return
    for (const child of node.children) {
      parents.set(child, node)
      walk(child)
    }
  }
  walk(root)
  return parents
}

function terminalsInOrder(root: TreeNode): Terminal[] {
  const out: Terminal[] = []
  const walk = (node: TreeNode) => {
    if (isTerminal(node)) out.push(node)
    else node.children.forEach(walk)
  }
  walk(root)
  return out
}

function rightmostTerminal(node: TreeNode): Terminal | null {
  if (isTerminal(node)) return node
  for (let i = node.children.length - 1; i >= 0; i--) {
    const t = rightmostTerminal(node.children[i]!)
    if (t) return t
  }
  return null
}

function dominates(ancestor: TreeNode, node: TreeNode, parents: Map<TreeNode, TreeNode>): boolean {
  for (let cur = parents.get(node); cur; cur = parents.get(cur)) {
    if (cur === ancestor) return true
  }
  return false
}

function ancestors(node: TreeNode, parents: Map<TreeNode, TreeNode>): TreeNode[] {
  const out: TreeNode[] = []
  for (let cur = parents.get(node); cur; cur = parents.get(cur)) out.push(cur)
  return out
}

/** XPTH, geometrically: some phrasal (never clausal) node X whose rightmost
 *  terminal is `prev` c-commands `target`. A Gap is its own one-node phrase.
 *
 *  NP-internal exclusion: a candidate whose parent (the node where trigger
 *  and target join) is an NP never licenses. Forcing datum: masculine
 *  adjective chains (ci mawr coch — AP(mawr) ends before coch and c-commands
 *  it, yet coch is radical). NP-internal mutation is the gender subsystem's
 *  job (Breit 2019); this is Tallerman's 'complement' condition
 *  operationalized. Green's VNP case (prynu [PP…] feic) still fires: the
 *  join node there is VNP, not NP. */
function xpRightEdge(prev: Terminal, target: Leaf, parents: Map<TreeNode, TreeNode>): boolean {
  const candidates: TreeNode[] = prev.kind === 'gap' ? [prev] : []
  for (const anc of ancestors(prev, parents)) {
    if (rightmostTerminal(anc) !== prev) break // higher nodes extend further right
    if (anc.kind === 'phrase') candidates.push(anc)
  }
  return candidates.some(x => {
    const parent = parents.get(x)
    if (!parent || (parent.kind === 'phrase' && parent.cat === 'NP')) return false
    return dominates(parent, target, parents) && !dominates(x, target, parents)
  })
}

/** Relation between the immediately preceding terminal and the target:
 *  'dependent' when prev is a head word of the lowest node containing both
 *  (i dŷ, y gath); 'possessor' when the target's branch under that node is a
 *  possessor phrase (cath merch); 'other' otherwise (subjects, gaps). */
function relationToTarget(prev: Terminal, target: Leaf, parents: Map<TreeNode, TreeNode>): PrevRelation {
  if (prev.kind === 'gap') return 'other'
  const prevChain = new Set<TreeNode>([prev, ...ancestors(prev, parents)])
  let branch: TreeNode = target
  for (let cur = parents.get(target); cur; branch = cur, cur = parents.get(cur)) {
    if (!prevChain.has(cur)) continue
    // cur = lowest common ancestor (never a terminal — it has descendants on
    // two branches); prev must be its direct leaf child
    if (isTerminal(cur) || !cur.children.includes(prev)) return 'other'
    return branch.kind === 'phrase' && branch.role === 'possessor' ? 'possessor' : 'dependent'
  }
  return 'other'
}

/** Adjective modifiers: controller features come from the head noun of the
 *  containing NP (first leaf child with cat N), regardless of adjacency —
 *  this is what carries chains like `y ferch fach wen`. */
function agreementFor(target: Leaf, parents: Map<TreeNode, TreeNode>): Environment['agreement'] {
  if (target.lexeme.cat !== 'Adj') return null
  let np: TreeNode | undefined
  for (let cur = parents.get(target); cur; cur = parents.get(cur)) {
    if (cur.kind === 'phrase' && cur.cat === 'AP') continue
    np = cur.kind === 'phrase' && cur.cat === 'NP' ? cur : undefined
    break
  }
  if (!np || np.kind !== 'phrase') return null
  const head = np.children.find(
    (c): c is Leaf => c.kind === 'leaf' && c.lexeme.cat === 'N',
  )
  if (!head?.lexeme.gender || !head.lexeme.number) return null
  if (head === target) return null
  return {
    controllerGender: head.lexeme.gender,
    controllerNumber: head.lexeme.number,
    relation: 'modifier',
  }
}

function firstOvertLeaf(node: TreeNode): Leaf | null {
  return terminalsInOrder(node).find((t): t is Leaf => t.kind === 'leaf') ?? null
}

function positionFor(target: Leaf, parents: Map<TreeNode, TreeNode>): PositionTag | null {
  for (const anc of ancestors(target, parents)) {
    if (firstOvertLeaf(anc) !== target) break
    if (anc.kind === 'phrase' && anc.role === 'vocative') return 'vocative'
    if (anc.kind === 'phrase' && anc.role === 'adverbial' && (anc.cat === 'NP' || anc.cat === 'NumP')) {
      return 'adv-np'
    }
    if (anc.kind === 'clause' && anc.cat === 'S' && target.lexeme.cat === 'V') {
      return anc.polarity === 'neg' ? 'v1-finite-neg' : 'v1-finite-aff'
    }
  }
  return null
}

export function environmentFor(root: TreeNode, target: Leaf): Environment {
  const parents = buildParents(root)
  const terminals = terminalsInOrder(root)
  const idx = terminals.indexOf(target)
  if (idx < 0) throw new Error('target leaf is not in the tree')

  const prev = idx > 0 ? terminals[idx - 1]! : null
  return {
    prev: prev === null ? null : {
      lemma: prev.kind === 'gap' ? GAP_LEMMA : (prev.lemma ?? prev.lexeme.id),
      relationToTarget: relationToTarget(prev, target, parents),
      isXPRightEdge: xpRightEdge(prev, target, parents),
    },
    agreement: agreementFor(target, parents),
    position: positionFor(target, parents),
  }
}

/** Convenience constructors for tests and authoring. */
export const phrase = (cat: PhraseCat, children: TreeNode[], role?: Role): Phrase =>
  ({ kind: 'phrase', cat, children, ...(role ? { role } : {}) })
export const clause = (cat: ClauseCat, children: TreeNode[], polarity?: 'aff' | 'neg'): Clause =>
  ({ kind: 'clause', cat, children, ...(polarity ? { polarity } : {}) })
export const leaf = (lexeme: Lexeme, lemma?: string): Leaf =>
  ({ kind: 'leaf', lexeme, ...(lemma ? { lemma } : {}) })
export const gap = (cat: PhraseCat = 'NP'): Gap => ({ kind: 'gap', cat })
