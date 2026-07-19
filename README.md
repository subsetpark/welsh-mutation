# welsh-sm — a predictive theory of Welsh soft mutation, executable

A formalization of initial-consonant mutation in Welsh, written as a linear,
readable exposition (`theory/` — start at [`theory/README.md`](theory/README.md)),
plus a text-processing pipeline that turns the theory into an annotator:
read attested Welsh, recover each token's radical, judge every mutation, and
report where the theory and the text disagree. Verdicts are full-grade —
each names the surface grade the environment imposes (soft, aspirate, nasal,
or none) and the rules that license it, so predicted lines are regenerable
Welsh (*fy nghath*, never \**fy cath*).

The theory's claims are rendered and *asserted* in the literate report,
[`REPORT.md`](REPORT.md) — every worked example's verdicts and surface line
are checked at build time, so the document cannot drift from the program.
[`ARCHITECTURE.md`](ARCHITECTURE.md) records the design and its decision log.

## Quickstart

```sh
npm install
npm run ud:fetch && npm run ud:extract     # build the broad lexicon (CC BY-SA 4.0)

echo "Welodd y dyn ddraig" | npm run -s cli
# °Welodd y dyn °ddraig

echo "mae rhaid i fi prynu dy cath" | npm run -s cli -- --predict
# mae rhaid i fi °brynu dy °gath

echo "fy nghath i" | npm run -s cli -- --predict   # King §7 grade marks:
# fy ⁿnghath i                                     # ° soft, ʰ aspirate, ⁿ nasal

echo "ei cath hi" | npm run -s cli                 # disagreements are flagged
# ei cath⟨pred ʰchath⟩ hi

npm run -s cli -- --explain    # the constituent tree, each leaf carrying its
                               # verdict, provenance and observed-vs-predicted
npm run -s cli -- --json       # trees, readings, verdicts as data
npm run -s cli -- --register literary              # no colloquial v1 mutation
```

Optional: `npm run apertium:fetch && npm run apertium:extract` builds a much
larger supplementary lexicon from apertium-cym. Its output is **GPL-3.0** and
therefore deliberately gitignored — build it locally; never commit it.

`npm test` runs the full suite (theory contract, gold mini-suites, the
CLI acceptance suite, and the architecture guard that keeps `theory/`
self-contained). `npm run report` rebuilds REPORT.md, failing on any
disagreement between prose and program.

## Layout

| Path | What | License |
|------|------|---------|
| `theory/` | The account itself: code, trigger/exception data, literate report source | MIT |
| `pipeline/`, `bin/`, `test/` | Tokenizer, de-mutation, tagger, chunker, judge, CLI, suites | MIT |
| `data/lexicon-full.json` | Broad lexicon derived from [UD_Welsh-CCG](https://github.com/UniversalDependencies/UD_Welsh-CCG) (Heinecke & Tyers 2019) | **CC BY-SA 4.0** |
| `data/ud/`, `data/apertium/`, `data/lexicon-apertium.json` | Local downloads / GPL-derived build artifact — not distributed | fetched per their own licenses |

## Licensing

Code and hand-authored content are **MIT** (see `LICENSE`). Two exceptions:

- `data/lexicon-full.json` is a ShareAlike derivative of the UD_Welsh-CCG
  treebank and is licensed **CC BY-SA 4.0**; the file self-declares this in
  its `_license`/`_source` fields, which the generator preserves.
- The optional Apertium-derived lexicon is **GPL-3.0** and is never part of
  this repository — the build fetches `apertium-cym` at a pinned commit and
  derives it locally.

The linguistic ground truth throughout is Gareth King, *Modern Welsh: A
Comprehensive Grammar*, 3rd ed. (2016), cited as "King §n"; theoretical
commitments and their sources are documented in `theory/README.md` and the
report's bibliography.
