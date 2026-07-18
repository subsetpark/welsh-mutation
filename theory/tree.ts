/**
 * §6 — SYNTAX: where Environments come from
 * =========================================
 *
 * The Trigger Constraint (§2) keeps trees out of the predicate; this
 * chapter is where the trees live. An author — a test, the report, or the
 * processing pipeline outside this directory — constructs a c-structure,
 * and environmentFor() derives the whole evidence record from geometry
 * plus leaf features. The author supplies STRUCTURE and two irreducibly
 * non-geometric function labels (role, polarity); the author never
 * supplies mutation-relevant judgments, so nothing here can be smuggled
 * in by hand.
 *
 * THE PROBLEM THIS CHAPTER SOLVES. §2's Environment contains one
 * genuinely theoretical flag, isXPRightEdge, and this is the place to earn
 * it. The datum is direct-object mutation (DOM): Gwelodd y dyn DDRAIG —
 * the object softens with no trigger word in sight. Two families of
 * explanation competed. Case-based accounts (Zwicky 1984; Roberts 1997,
 * 2005) tie the mutation to accusative Case; they both over- and
 * under-generate — mutation after subjects hits non-accusative material
 * (adverbs, the particle dim), and objects of NONFINITE verbs mutate
 * exactly when a phrase intervenes. The configurational account — the XP
 * TRIGGER HYPOTHESIS (Harlow 1989; Borsley 1997; Tallerman 2006) — says
 * instead: any phrasal constituent mutates the word immediately following
 * its right edge. The decisive data fall out at once:
 *
 *   Roedd dyn wedi prynu beic          — beic radical: no phrase ends
 *                                        before it (wedi is a bare particle)
 *   Roedd dyn wedi prynu yn y dre FEIC — the intervening PP's edge
 *                                        restores the mutation (Green 2003)
 *   Beic prynodd y ddynes              — the fronted object is radical:
 *                                        nothing precedes it; a Case account
 *                                        must stipulate this (Tallerman 2006)
 *
 * Stated geometrically, and implemented in xpRightEdge() below: some
 * PHRASAL node (never a clause — CPs do not trigger) whose rightmost
 * terminal immediately precedes the target c-commands the target. One
 * refinement is forced by the data — the NP-INTERNAL EXCLUSION, argued at
 * the function itself.
 *
 * EMPTY CATEGORIES. The classic XPTH literature needs silent phrases:
 * wh-traces (Pwy welodd __ DDRAIG? — the extraction gap occupies subject
 * position and its edge mutates the object) and literary null subjects
 * (Gwelais __ DDRAIG 'I saw a dragon' — the dropped pronoun still
 * licenses). This account posits exactly those two, as Gap nodes with a
 * recorded reason, and NOTHING else — following Dowle (2024), null
 * particles and null blocking elements are eliminated (particles are
 * handled as positions, below). The impersonal verb forms are the control
 * experiment for the whole inventory: Gwelwyd dyn 'a man was seen' has NO
 * subject, silent or otherwise, so no gap is inserted and the object
 * correctly stays radical. A theory that scattered pro everywhere would
 * get this wrong; one with no pro at all would fail Gwelais ddraig.
 *
 * DESIGNATED POSITIONS. What remains after the XPTH are the position-
 * keyed mutations of §2: adverbial NPs (Ddydd Sadwrn…), vocatives, and
 * the clause-initial finite verb. The v1 cases are PARTICLE-DROP RESIDUE:
 * colloquial Welsh deleted the preverbal particles (affirmative fe°/mi°,
 * interrogative a°, negative ni with its mixed grade) and kept their
 * mutations; the grade tracks the vanished particle exactly — which is
 * why v1-finite-neg is mixed where every true XP edge yields plain SM,
 * and why the whole v1 family is register-conditional (§2): literary
 * Welsh, which never dropped the particles, has no such positions. Note
 * the corollary, visible in positionFor(): a clause that RETAINS its
 * particle gives the verb no v1 tag — the particle is the first leaf, and
 * its lexical frame does the licensing instead. Imperatives resist both
 * v1 and neu° (King §512), hence their own category.
 *
 * WHY TREES ARE PLAIN DATA. Targets are addressed by path, not by node
 * reference: trees serialize, and two tokens of one word are distinguished
 * positionally. Aliasing a node object into two positions throws —
 * geometry is only well-defined over a genuine tree. And although the
 * full tree is required (the ancestor spine carries c-command; agreement
 * looks rightward within the target's NP), nothing after the target's
 * containing clause is ever consulted.
 *
 * Conventions the author must follow:
 * - Subordinators/conjunctions/preverbal particles are leaf children of
 *   the clause they introduce (so `os daw e` does not present daw as
 *   clause-initial, while root `Golles i…` does).
 * - Gaps are explicit Gap nodes with a phrasal category and a reason.
 * - Lemma normalization: orthographic variants share a trigger lemma
 *   (y/yr/'r → 'y'); homographs carry their disambiguated dotted keys
 *   (yn.loc/yn.pred, ei.3sgm/ei.3sgf, a.rel/a.conj/a.int).
 */

import type { Environment, Lexeme, PositionTag, PrevRelation, Register } from './types.ts'

export type PhraseCat = 'NP' | 'PP' | 'AP' | 'AdvP' | 'NumP' | 'VNP'
/** Clauses are never XPTH triggers (the CP exclusion); they exist so the
 *  geometry can tell clause boundaries from phrase boundaries. */
export type ClauseCat = 'S' | 'CP'
/** Only irreducibly non-geometric functions are author-supplied — geometry
 *  provably underdetermines them: sentence-initial adverbial NPs mutate
 *  (°Ddwy flynedd yn ôl…) while geometrically identical fronted objects do
 *  not (Beic prynodd y ddynes); the difference is adjunct-vs-argument
 *  status, a valence fact. Possessors, by contrast, ARE derived (from the
 *  genitive configuration), and subject/object labels are never needed at
 *  all: the XPTH consumes phrase edges, not grammatical functions — the
 *  configurational theory's payoff made concrete. */
export type Role = 'adverbial' | 'vocative'

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
  /** Surface form of the token ABSENT soft mutation, when it differs from
   *  the citation form: inflected verbs (gwelodd for gweld), contractions
   *  ('r for y), feminine adjective forms (gwen for gwyn), and authored
   *  AM/NM spellings (nghath, cheffyl) — the SM predicate does not model
   *  those grades, so their display forms are surface facts, not verdicts. */
  form?: string
}
/** The empty-category inventory (see the header): a silent XP-edge
 *  terminal. Occupies a string position but no surface form. Counts as a
 *  phrase for XP-edge purposes; blocks contact adjacency (its sentinel
 *  lemma matches no trigger frame — a gap between trigger and target
 *  starves the trigger of adjacency exactly as an overt intervener would).
 *  `reason` records why it exists: 'extraction' (wh-trace, relative gap)
 *  or 'pro' (literary null subject — inserted only after person-inflected
 *  subjectless verbs, NEVER impersonals). The geometry is identical either
 *  way; the reason is for honest reporting. */
export interface Gap {
  kind: 'gap'
  cat: PhraseCat
  reason?: 'extraction' | 'pro'
}
export type TreeNode = Phrase | Clause | Leaf | Gap

const GAP_LEMMA = '#gap'

type Terminal = Leaf | Gap
const isTerminal = (n: TreeNode): n is Terminal => n.kind === 'leaf' || n.kind === 'gap'

/** Node identity is OBJECT identity: two tokens of the same word must be two
 *  distinct Leaf objects, or neither is addressable as a target and the
 *  parent map silently corrupts. Enforced here: an aliased node throws. */
function buildParents(root: TreeNode): Map<TreeNode, TreeNode> {
  const parents = new Map<TreeNode, TreeNode>()
  const walk = (node: TreeNode) => {
    if (isTerminal(node)) return
    for (const child of node.children) {
      if (child === root || parents.has(child)) {
        throw new Error(
          'node object appears twice in the tree — construct a fresh Leaf/Phrase per token position',
        )
      }
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

/** The XPTH, geometrically: some phrasal (never clausal) node X whose
 *  rightmost terminal is `prev` c-commands `target`. A Gap is its own
 *  one-node phrase.
 *
 *  NP-INTERNAL EXCLUSION: a candidate whose parent (the node where trigger
 *  and target join) is an NP never licenses. The forcing datum is the
 *  masculine adjective chain: in ci mawr coch, AP(mawr) ends immediately
 *  before coch and c-commands it, yet coch is radical — raw geometry
 *  overgenerates inside the noun phrase. The exclusion operationalizes
 *  Tallerman's 'complement' condition and enacts Breit's division of
 *  labor: NP-internal mutation belongs to the gender subsystem ALONE
 *  (which is why y ferch fach WEN mutates — by agreement, §5 — while
 *  ci mawr COCH does not). Green's decisive case still fires: in prynu
 *  [PP yn y dre] °feic the join node is VNP, not NP.
 *
 *  A satisfying consequence of edge-based licensing: in Golles i'r tocyn
 *  the subject's XP edge lands on 'r (no SM reflex), so the definite
 *  object NOUN correctly stays radical — DOM mutates the first WORD of
 *  the following constituent, not the constituent's head. */
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

/** Relation between the immediately preceding terminal and the target
 *  (§2 motivated the three-way split): 'dependent' when prev is a head
 *  word of the lowest node containing both (i dŷ, y gath); 'possessor'
 *  when the target sits in the GENITIVE CONFIGURATION [NP N NP] — an NP
 *  following the head noun within an NP is the possessor (cath merch,
 *  canol y dre), derived rather than authored because Welsh gives that
 *  geometry no other reading; 'other' otherwise (subjects, gaps). Known
 *  edge: common-noun apposition shares the configuration, but appositive
 *  NPs are overwhelmingly personal names, which are immutable regardless.
 *  Note that immunity attaches to the possessor BOUNDARY only — the
 *  possessor's inside is normal territory (canol y DRE mutates, by the
 *  article's own frame). */
function relationToTarget(prev: Terminal, target: Leaf, parents: Map<TreeNode, TreeNode>): PrevRelation {
  if (prev.kind === 'gap') return 'other'
  const prevChain = new Set<TreeNode>([prev, ...ancestors(prev, parents)])
  let branch: TreeNode = target
  for (let cur = parents.get(target); cur; branch = cur, cur = parents.get(cur)) {
    if (!prevChain.has(cur)) continue
    // cur = lowest common ancestor (never a terminal — it has descendants on
    // two branches); prev must be its direct leaf child
    if (isTerminal(cur) || !cur.children.includes(prev)) return 'other'
    const isGenitive =
      cur.kind === 'phrase' && cur.cat === 'NP' &&
      prev.lexeme.cat === 'N' &&
      branch.kind === 'phrase' && branch.cat === 'NP'
    return isGenitive ? 'possessor' : 'dependent'
  }
  return 'other'
}

/** Adjective modifiers: controller features come from the head noun of the
 *  containing NP (first leaf child with cat N), REGARDLESS of adjacency —
 *  this is what carries chains like y ferch fach wen, and it looks
 *  rightward too: prenominal adjectives agree with a FOLLOWING head
 *  (y °brif °ddinas). The adjacency-independence is the §2 argument for
 *  keeping agreement out of `prev`. */
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

/** Designated positions read off geometry: a tag applies only while the
 *  target is the FIRST OVERT LEAF of the ancestor in question — which is
 *  how a retained particle shields its verb from v1 (os daw e: the first
 *  leaf of S is os, not daw), and why only the first word of an adverbial
 *  NP mutates (Ddydd Sadwrn: dydd, not Sadwrn). */
function positionFor(
  target: Leaf,
  parents: Map<TreeNode, TreeNode>,
  register: Register,
): PositionTag | null {
  for (const anc of ancestors(target, parents)) {
    if (firstOvertLeaf(anc) !== target) break
    if (anc.kind === 'phrase' && anc.role === 'vocative') return 'vocative'
    if (anc.kind === 'phrase' && anc.role === 'adverbial' && (anc.cat === 'NP' || anc.cat === 'NumP')) {
      return 'adv-np'
    }
    // v1 positions are particle-drop residue and exist only in the
    // colloquial register (King §11d); literary mode does not emit them.
    if (
      register === 'colloquial' &&
      anc.kind === 'clause' && anc.cat === 'S' && target.lexeme.cat === 'V'
    ) {
      return anc.polarity === 'neg' ? 'v1-finite-neg' : 'v1-finite-aff'
    }
  }
  return null
}

/** Address of a node: child indices from the root. Paths — not node
 *  references — are the public addressing scheme, so trees are plain
 *  serializable data and two tokens of the same word are distinguished
 *  positionally, never by object identity. */
export type TreePath = number[]

export function resolveLeaf(root: TreeNode, path: TreePath): Leaf {
  let node: TreeNode = root
  for (const i of path) {
    if (isTerminal(node)) throw new Error(`path descends through a terminal at index ${i}`)
    const child: TreeNode | undefined = node.children[i]
    if (!child) throw new Error(`no child at index ${i}`)
    node = child
  }
  if (node.kind !== 'leaf') throw new Error(`path must address a Leaf, got ${node.kind}`)
  return node
}

/** The chapter's deliverable: derive the §2 evidence record for one leaf.
 *  Everything theoretical happens in the four helpers above; this
 *  function only locates the preceding terminal and assembles. */
export function environmentFor(
  root: TreeNode,
  path: TreePath,
  register: Register = 'colloquial',
): Environment {
  const parents = buildParents(root)
  const target = resolveLeaf(root, path)
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
    position: positionFor(target, parents, register),
  }
}

/** Convenience constructors for tests and authoring. */
export const phrase = (cat: PhraseCat, children: TreeNode[], role?: Role): Phrase =>
  ({ kind: 'phrase', cat, children, ...(role ? { role } : {}) })
export const clause = (cat: ClauseCat, children: TreeNode[], polarity?: 'aff' | 'neg'): Clause =>
  ({ kind: 'clause', cat, children, ...(polarity ? { polarity } : {}) })
export const leaf = (lexeme: Lexeme, lemma?: string, form?: string): Leaf =>
  ({ kind: 'leaf', lexeme, ...(lemma ? { lemma } : {}), ...(form ? { form } : {}) })
export const gap = (cat: PhraseCat = 'NP', reason?: Gap['reason']): Gap =>
  ({ kind: 'gap', cat, ...(reason ? { reason } : {}) })
