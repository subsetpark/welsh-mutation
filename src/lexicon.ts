/**
 * Shared lexicon of target/incidental lexemes used by tests and the report.
 * Trigger FRAMES stay in data/triggers.json — this module is the other half:
 * the words mutation happens (or fails) TO.
 *
 * Keys are mnemonic handles, usually the citation form; where one citation
 * form serves two categories (mynd/aeth, prynu/prynodd) or a surface form is
 * the natural handle (dewch), the key is the surface form. The Lexeme itself
 * is citation-level: id is the radical dictionary form.
 *
 * Immutability flags carry their source: King §12 lists, or the spoken-Welsh
 * exception list (Jones corpus) where noted.
 */

import type { Lexeme } from './types.ts'

export const LEXICON = {
  // ─── finite verbs ───
  gweld: { id: 'gweld', cat: 'V', initClass: 'g' },
  colli: { id: 'colli', cat: 'V', initClass: 'c' },
  dylu: { id: 'dylu', cat: 'V', initClass: 'd' },
  para: { id: 'para', cat: 'V', initClass: 'p' },
  prynodd: { id: 'prynu', cat: 'V', initClass: 'p' },
  dod: { id: 'dod', cat: 'V', initClass: 'd' },
  roedd: { id: 'bod', cat: 'V', initClass: 'other' }, // r- is not rh-
  aeth: { id: 'mynd', cat: 'V', initClass: 'other' },
  mae: { id: 'mae', cat: 'V', initClass: 'other', immutable: true }, // King §12b

  // ─── imperatives (resist v1 and neu°, King §512) ───
  dewch: { id: 'dod', cat: 'Vimp', initClass: 'd' },

  // ─── verbal nouns ───
  mynd: { id: 'mynd', cat: 'Vnoun', initClass: 'm' },
  prynu: { id: 'prynu', cat: 'Vnoun', initClass: 'p' },

  // ─── nouns, masculine ───
  ty: { id: 'tŷ', cat: 'N', gender: 'm', number: 'sg', initClass: 't' },
  beic: { id: 'beic', cat: 'N', gender: 'm', number: 'sg', initClass: 'b' },
  dyn: { id: 'dyn', cat: 'N', gender: 'm', number: 'sg', initClass: 'd' },
  ci: { id: 'ci', cat: 'N', gender: 'm', number: 'sg', initClass: 'c' },
  ceffyl: { id: 'ceffyl', cat: 'N', gender: 'm', number: 'sg', initClass: 'c' },
  tocyn: { id: 'tocyn', cat: 'N', gender: 'm', number: 'sg', initClass: 't' },
  canol: { id: 'canol', cat: 'N', gender: 'm', number: 'sg', initClass: 'c' },
  dosbarth: { id: 'dosbarth', cat: 'N', gender: 'm', number: 'sg', initClass: 'd' },
  drws: { id: 'drws', cat: 'N', gender: 'm', number: 'sg', initClass: 'd' },
  car: { id: 'car', cat: 'N', gender: 'm', number: 'sg', initClass: 'c' },
  plant: { id: 'plant', cat: 'N', gender: 'm', number: 'pl', initClass: 'p' },

  // ─── nouns, feminine ───
  cath: { id: 'cath', cat: 'N', gender: 'f', number: 'sg', initClass: 'c' },
  cathod: { id: 'cathod', cat: 'N', gender: 'f', number: 'pl', initClass: 'c' },
  draig: { id: 'draig', cat: 'N', gender: 'f', number: 'sg', initClass: 'd' },
  merch: { id: 'merch', cat: 'N', gender: 'f', number: 'sg', initClass: 'm' },
  dynes: { id: 'dynes', cat: 'N', gender: 'f', number: 'sg', initClass: 'd' },
  dinas: { id: 'dinas', cat: 'N', gender: 'f', number: 'sg', initClass: 'd' },
  tre: { id: 'tre', cat: 'N', gender: 'f', number: 'sg', initClass: 't' },
  llong: { id: 'llong', cat: 'N', gender: 'f', number: 'sg', initClass: 'll' },
  gorsaf: { id: 'gorsaf', cat: 'N', gender: 'f', number: 'sg', initClass: 'g' },
  blynedd: { id: 'blynedd', cat: 'N', gender: 'f', number: 'sg', initClass: 'b' },
  gem: { id: 'gêm', cat: 'N', gender: 'f', number: 'sg', initClass: 'g', immutable: true }, // King §12e
  ysgol: { id: 'ysgol', cat: 'N', gender: 'f', number: 'sg', initClass: 'other' },

  // ─── other nominals ───
  rhaid: { id: 'rhaid', cat: 'N', initClass: 'rh' },
  Mair: { id: 'Mair', cat: 'N', initClass: 'm', immutable: true },     // personal name, King §12d
  Emrys: { id: 'Emrys', cat: 'N', initClass: 'other', immutable: true },
  Dafydd: { id: 'Dafydd', cat: 'N', initClass: 'd', immutable: true },

  // ─── adjectives ───
  bach: { id: 'bach', cat: 'Adj', initClass: 'b' },
  gwyn: { id: 'gwyn', cat: 'Adj', initClass: 'g' },
  mawr: { id: 'mawr', cat: 'Adj', initClass: 'm' },
  coch: { id: 'coch', cat: 'Adj', initClass: 'c' },
  llawn: { id: 'llawn', cat: 'Adj', initClass: 'll' },
  hen: { id: 'hen', cat: 'Adj', initClass: 'other' },
  prif: { id: 'prif', cat: 'Adj', initClass: 'p' },

  // ─── numerals ───
  dau: { id: 'dau', cat: 'Num', initClass: 'd' },
  dwy: { id: 'dwy', cat: 'Num', initClass: 'd' },
  tair: { id: 'tair', cat: 'Num', initClass: 't' },
  chwe: { id: 'chwe', cat: 'Num', initClass: 'other' },

  // ─── particles & function words ───
  wedi: { id: 'wedi', cat: 'Prt', initClass: 'other' },
  dim: { id: 'dim', cat: 'Prt', initClass: 'd' },
  y: { id: 'y', cat: 'Other', initClass: 'other' },
  i: { id: 'i', cat: 'Other', initClass: 'other' },
  i_pron: { id: 'i.pron', cat: 'Other', initClass: 'other' },
  dy: { id: 'dy', cat: 'Other', initClass: 'd', immutable: true },     // King §12b
  ei: { id: 'ei', cat: 'Other', initClass: 'other' },
  fy: { id: 'fy', cat: 'Other', initClass: 'other' },
  mor: { id: 'mor', cat: 'Adv', initClass: 'm', immutable: true },     // King §12b
  neu: { id: 'neu', cat: 'Other', initClass: 'other' },
  pob: { id: 'pob', cat: 'Other', initClass: 'p' },
  pwy: { id: 'pwy', cat: 'Other', initClass: 'p' },
  ti: { id: 'ti', cat: 'Other', initClass: 't', immutable: true },     // Jones corpus exception list
  hi: { id: 'hi', cat: 'Other', initClass: 'other' },
  e: { id: 'e', cat: 'Other', initClass: 'other' },
  os: { id: 'os', cat: 'Other', initClass: 'other' },
  yn: { id: 'yn', cat: 'Other', initClass: 'other' },
  yn_ol: { id: 'yn ôl', cat: 'Adv', initClass: 'other' },
  adre: { id: 'adre', cat: 'Adv', initClass: 'other' },
} satisfies Record<string, Lexeme>
