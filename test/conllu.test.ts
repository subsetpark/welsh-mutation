import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseConllu } from '../pipeline/conllu.ts'

const SAMPLE = [
  '# sent_id = demo-1',
  '# text = Aeth hi i\'r dre.',
  '1\tAeth\tmynd\tVERB\tverb\tMood=Ind|Person=3|Tense=Past|VerbForm=Fin\t0\troot\t_\t_',
  '2\thi\thi\tPRON\tpron\tGender=Fem|Number=Sing|Person=3|PronType=Prs\t1\tnsubj\t_\t_',
  '3-4\ti\'r\t_\t_\t_\t_\t_\t_\t_\tSpaceAfter=No',
  '3\ti\ti\tADP\tprep\t_\t5\tcase\t_\t_',
  '4\t\'r\ty\tDET\tdet\tDefinite=Def|PronType=Art\t5\tdet\t_\t_',
  '5\tdre\ttref\tNOUN\tnoun\tGender=Fem|Mutation=SM|Number=Sing\t1\tobl\t_\tSpaceAfter=No',
  '5.1\t_\t_\t_\t_\t_\t_\t_\t_\t_',
  '6\t.\t.\tPUNCT\tpunct\t_\t1\tpunct\t_\t_',
  '',
  '# sent_id = demo-2',
  '1\tci\tci\tNOUN\tnoun\tGender=Masc|Number=Sing\t0\troot\t_\t_',
  '',
].join('\n')

test('parseConllu: comments, words, FEATS, MWT ranges, empty nodes dropped', () => {
  const sents = parseConllu(SAMPLE)
  assert.equal(sents.length, 2)

  const [s1, s2] = sents
  assert.deepEqual(s1!.comments, ['# sent_id = demo-1', "# text = Aeth hi i'r dre."])
  assert.equal(s1!.words.length, 6) // empty node 5.1 dropped
  assert.deepEqual(s1!.mwts, [{ from: 3, to: 4, form: "i'r", misc: { SpaceAfter: 'No' } }])

  const dre = s1!.words[4]!
  assert.equal(dre.form, 'dre')
  assert.equal(dre.lemma, 'tref')
  assert.deepEqual(dre.feats, { Gender: 'Fem', Mutation: 'SM', Number: 'Sing' })
  assert.equal(dre.head, 1)
  assert.equal(dre.deprel, 'obl')

  assert.equal(s2!.words.length, 1)
  assert.equal(s2!.words[0]!.feats['Gender'], 'Masc')
})

test('parseConllu: malformed row throws', () => {
  assert.throws(() => parseConllu('1\tonly\tthree'), /malformed/)
})
