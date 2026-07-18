import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DixExpander, dixToEntries, parseXml } from '../pipeline/dix.ts'

const FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<dictionary>
  <sdefs>
    <sdef n="n"/><sdef n="f"/><sdef n="sg"/><sdef n="pl"/>
  </sdefs>
  <pardefs>
    <pardef n="initial-c">
      <e r="LR"><p><l>c</l><r>c</r></p></e>
      <e r="LR"><p><l>g</l><r>c</r></p></e>
      <e r="LR"><p><l>ngh</l><r>c</r></p></e>
      <e r="LR"><p><l>ch</l><r>c</r></p></e>
      <e r="RL"><p><l>c</l><r>c</r></p></e>
    </pardef>
    <pardef n="cath__n">
      <e><p><l/><r><s n="n"/><s n="f"/><s n="sg"/></r></p></e>
      <e><p><l>od</l><r><s n="n"/><s n="f"/><s n="pl"/></r></p></e>
    </pardef>
    <pardef n="tal/u__vblex">
      <e><p><l>u</l><r>u<s n="vblex"/><s n="inf"/></r></p></e>
      <e><p><l>odd</l><r>u<s n="vblex"/><s n="ifi"/><s n="p3"/><s n="sg"/></r></p></e>
      <e><p><l>wyd</l><r>u<s n="vblex"/><s n="ifi"/><s n="impers"/></r></p></e>
      <e><p><l>wch</l><r>u<s n="vblex"/><s n="imp"/><s n="p2"/><s n="pl"/></r></p></e>
    </pardef>
    <pardef n="Sion__np">
      <e><p><l/><r><s n="np"/><s n="ant"/><s n="m"/></r></p></e>
    </pardef>
  </pardefs>
  <section id="main" type="standard">
    <e lm="mutations"><i/><par n="initial-c"/></e>
    <e lm="cath"><par n="initial-c"/><i>ath</i><par n="cath__n"/></e>
    <e lm="talu"><i>tal</i><par n="tal/u__vblex"/></e>
    <e lm="Siôn"><i>Siôn</i><par n="Sion__np"/></e>
    <e lm="ar hyd"><i>ar<b/>hyd</i><p><l/><r><s n="n"/></r></p></e>
  </section>
</dictionary>`

test('dix expansion: radical-only initials, paradigm product, tag mapping', () => {
  const entries = dixToEntries(new DixExpander(parseXml(FIXTURE)))
  const byForm = (f: string) => entries.filter(e => e.form === f)

  // initial-c contributes ONLY the radical 'c' — no gath/nghath/chath rows
  assert.deepEqual(entries.map(e => e.form).filter(f => f.endsWith('ath')), ['cath'])
  const cath = byForm('cath')[0]!
  assert.deepEqual(
    { cat: cath.cat, gender: cath.gender, number: cath.number, initClass: cath.initClass },
    { cat: 'N', gender: 'f', number: 'sg', initClass: 'c' },
  )
  assert.equal(byForm('cathod')[0]?.number, 'pl')

  // verb paradigm: inf → Vnoun; preterite p3; impersonal '0'; imperative Vimp
  assert.equal(byForm('talu')[0]?.cat, 'Vnoun')
  const talodd = byForm('talodd')[0]!
  assert.deepEqual({ cat: talodd.cat, person: talodd.person }, { cat: 'V', person: '3' })
  assert.deepEqual(byForm('talwyd')[0]?.person, '0')
  assert.equal(byForm('talwch')[0]?.cat, 'Vimp')

  // np keeps case and the proper flag; lemma from lm attribute
  const sion = byForm('Siôn')[0]!
  assert.equal(sion.proper, true)
  assert.equal(sion.lemma, 'Siôn')

  // multiword and bare-mutations entries are skipped
  assert.equal(entries.some(e => e.form.includes(' ') || e.form.includes('hyd')), false)
})
