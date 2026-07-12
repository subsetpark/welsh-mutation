/**
 * Orthographic content of soft mutation — un-opaqued only for rendering
 * surface forms. The predicate never consults this; when it fires, this is
 * what the mutation looks like (King §4).
 */

import type { InitClass } from './types.ts'

const SM_ORTH: Record<Exclude<InitClass, 'other'>, { strip: number; repl: string }> = {
  c: { strip: 1, repl: 'g' },
  p: { strip: 1, repl: 'b' },
  t: { strip: 1, repl: 'd' },
  g: { strip: 1, repl: '' },   // g- deletes: gwelodd → welodd
  b: { strip: 1, repl: 'f' },
  d: { strip: 1, repl: 'dd' },
  ll: { strip: 2, repl: 'l' },
  m: { strip: 1, repl: 'f' },
  rh: { strip: 2, repl: 'r' },
}

/** Apply SM to a radical surface form. Case of the initial is preserved
 *  (Colles → Golles; Gwelodd → Welodd across the g-deletion). */
export function softMutate(form: string, initClass: InitClass): string {
  if (initClass === 'other') return form
  const { strip, repl } = SM_ORTH[initClass]
  const wasUpper = form[0] !== undefined && form[0] !== form[0].toLowerCase()
  const out = repl + form.slice(strip)
  if (!wasUpper || out.length === 0) return out
  return out[0]!.toUpperCase() + out.slice(1)
}
