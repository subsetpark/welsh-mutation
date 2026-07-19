/**
 * Compile-time counterpart of architecture.test.ts — never executed (the
 * test glob is *.test.ts), only typechecked. The invariants of GRADE_ORTH's
 * shape are enforced by §2's target chain (AMTarget ⊆ NMTarget ⊆ SMTarget)
 * and the total-Record row types in §1; the probes below pin that
 * enforcement. If a loosened type ever lets one of them compile, tsc fails
 * on the now-unused @ts-expect-error directive.
 */

import type { AMTarget, InitClass, NMTarget, SMTarget } from '../theory/types.ts'

// The subset chain King §4's columns form: AM ⊆ NM ⊆ SM ⊆ InitClass.
const am: AMTarget = 'c'
const nm: NMTarget = am
const sm: SMTarget = nm
const init: InitClass = sm
void init

// @ts-expect-error m has no NM reflex (King §4)
const badNM: NMTarget = 'm'
void badNM

// @ts-expect-error ll is SM-only (King §4)
const badAM: AMTarget = 'll'
void badAM

// @ts-expect-error vowels take h-prothesis, not segment substitution — 'v' never keys a GRADE_ORTH row
const badSM: SMTarget = 'v'
void badSM

// Rows are TOTAL Records: dropping a column member cannot typecheck.
// @ts-expect-error rh missing from the SM row
const partialSM: Record<SMTarget, string> = {
  c: 'g', p: 'b', t: 'd', g: '', b: 'f', d: 'dd', ll: 'l', m: 'f',
}
void partialSM

// And they are exact: a key outside the column cannot typecheck either.
const extraNM: Record<NMTarget, string> = {
  c: 'ngh', p: 'mh', t: 'nh', g: 'ng', b: 'm', d: 'n',
  // @ts-expect-error ll has no NM reflex (King §4)
  ll: 'l',
}
void extraNM
