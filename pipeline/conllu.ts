/**
 * CoNLL-U parser (https://universaldependencies.org/format.html), scoped to
 * what the pipeline consumes: comments, word rows, MWT ranges, FEATS/MISC as
 * key=value maps. Empty nodes (id 1.1) are parsed and dropped — enhanced
 * dependencies carry nothing mutation-relevant.
 */

export interface ConlluWord {
  /** 1-based position within the sentence. */
  id: number
  form: string
  lemma: string
  upos: string
  xpos: string
  feats: Record<string, string>
  head: number | null
  deprel: string
  misc: Record<string, string>
}

/** Multiword-token range: surface `form` spans word ids from..to. */
export interface ConlluMwt {
  from: number
  to: number
  form: string
  misc: Record<string, string>
}

export interface ConlluSentence {
  comments: string[]
  words: ConlluWord[]
  mwts: ConlluMwt[]
}

function pairs(field: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (field === '_') return out
  for (const kv of field.split('|')) {
    const eq = kv.indexOf('=')
    if (eq > 0) out[kv.slice(0, eq)] = kv.slice(eq + 1)
  }
  return out
}

export function parseConllu(text: string): ConlluSentence[] {
  const sentences: ConlluSentence[] = []
  let cur: ConlluSentence = { comments: [], words: [], mwts: [] }

  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\r$/, '')
    if (line === '') {
      if (cur.words.length > 0 || cur.comments.length > 0) sentences.push(cur)
      cur = { comments: [], words: [], mwts: [] }
      continue
    }
    if (line.startsWith('#')) {
      cur.comments.push(line)
      continue
    }
    const cols = line.split('\t')
    if (cols.length !== 10) throw new Error(`malformed CoNLL-U row (${cols.length} cols): ${line}`)
    const [id, form, lemma, upos, xpos, feats, head, deprel, , misc] = cols

    const mwt = id!.match(/^(\d+)-(\d+)$/)
    if (mwt) {
      cur.mwts.push({ from: Number(mwt[1]), to: Number(mwt[2]), form: form!, misc: pairs(misc!) })
      continue
    }
    if (id!.includes('.')) continue // empty node
    cur.words.push({
      id: Number(id),
      form: form!,
      lemma: lemma!,
      upos: upos!,
      xpos: xpos!,
      feats: pairs(feats!),
      head: head === '_' ? null : Number(head),
      deprel: deprel!,
      misc: pairs(misc!),
    })
  }
  if (cur.words.length > 0 || cur.comments.length > 0) sentences.push(cur)
  return sentences
}
