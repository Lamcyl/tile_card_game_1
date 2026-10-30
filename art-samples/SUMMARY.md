# Art exploration summary

Character art for the tile game's units: black-and-white ink, chibi proportions, one accent colour (vermilion `#c8352b` or gold `#c9a23a`), each creature drawn in a **cute** and a **fierce** version. Every drawing is a hand-written SVG (`viewBox 0 0 256 256`) made by Sonnet artist agents, checked at full size and at 64 px board-tile size.

The full collection of chosen designs is `collection.html` (built by `node art-samples/build-collection.mjs`).

## Chosen designs (45)

| Set | Picks | Count |
|---|---|---|
| Japanese yokai | Karasu-tengu, Kitsune, Tanuki, Chōchin-obake, Hitotsume-kozō, Nurikabe (cute + fierce), Yuki-onna, Raijin, Komainu, Kamaitachi, Yamata no Orochi — all fierce except Nurikabe cute | 12 |
| Egyptian | Anubis, Ra, Bes, Bennu, Wadjet (cute + fierce), Isis — fierce except Wadjet cute | 7 |
| Chinese | Kui, Sun Wukong, Lei Gong, Nezha — all fierce | 4 |
| Greek | Cerberus, Talos, Typhon, Hades (fierce); Siren (cute) | 5 |
| Norse | Jötunn (round 2), Huginn and Muninn — fierce | 2 |
| Slavic | Alkonost, Perun, Chernobog (cute); Veles, Chernobog (fierce) | 5 |
| Maya | Xtabay, Ix Chel (cute); Ah Puch (fierce) | 3 |
| Korean | Samjok-o (cute + fierce), Dalgyal Gwisin, Jeoseung Saja, Sansin, Jangseung (fierce); Jowangshin (cute) | 7 |

Refined picks use their newest `-vN` file (e.g. `kitsune-fierce-v4.svg`, `bes-fierce-v3.svg`, `dalgyal-gwisin-fierce-v2.svg`). Each set's `README.md` lists exact files and what was changed; `picks-data.mjs` is the machine-readable list.

**Dropped after failed refinements:** Bastet (arm stayed cut off through v4), the Chinese four guardian beasts (front-facing retry rejected), Norse Fenrir and Kraken (v3 tweaks and three from-scratch v4 options rejected), Slavic Vodyanoy (waterline v2 and simplified v3). All versions are kept in the repo as backups.

## What worked and what didn't

- **Loose briefs beat strict ones.** Norse round 1 used a long rule list and told artists to study earlier picks; everything came out as the same squat front-facing body and only 1 of 20 was kept. Round 2 and every set since use a short brief (palette, chibi, cute + fierce, readable at 64 px) and leave pose, angle and body shape to the artist. Pick rates and variety went up.
- **Showing 3–4 liked designs "for energy and finish only"** helps; telling artists to copy them doesn't.
- **Refinements must be small.** A redesign when a tweak was asked for (Kitsune v3) was rejected; keep the pose and change only the named part.
- **Fixes by adding detail make things worse; fixes by removing clutter work** (Vodyanoy v2 vs v3). Keep the bottom of each drawing clean — bodies, props and water tangling there was a repeated failure.
- **Weak spots that rarely get fixed:** cut-off or mismatched arms, limbs that look like tubes or beans, and animal heads that drift toward another animal.
- **Parallel artists must only touch their own files.** One Maya artist's cleanup script globbed the shared folder and rewrote 14 other files (stroke styling only; all checked and re-rendered). Briefs now require exact paths, regenerable sources in a private `/tmp` folder, and attribute-only strokes (a CSS class silently overrides stroke attributes).

## Folder layout and tools

- `<set>/` — the SVGs, `STYLE.md` (the brief the artists got) and `README.md` (picks). Sets: `yokai`, `egypt`, `chinese`, `greek`, `norse`, `slavic`, `maya`, `korean`.
- `node art-samples/build-gallery.mjs <set> [round]` → `<set>-gallery.html`, the numbered sketchbook of all 20 (with `v2` it shows a redraw round).
- `node art-samples/build-picks.mjs <set>` → `<set>-picks.html`, chosen designs with before/after for refinements.
- `node art-samples/build-options.mjs <set> <prefix>…` → `<set>-options.html`, side-by-side alternatives (A/B/C) for one pick.
- `node art-samples/build-collection.mjs` → `collection.html`, every chosen design across all sets.

## Not done yet

- Further sets suggested but not drawn: Celtic, Aztec, Hindu, Persian/Arabian, Mesopotamian, African, Polynesian, medieval bestiary, modern cryptids.
- Jeoseung Saja v2's pointing hand came out thin and may want one more small tweak.
- No art is in the game yet; the prototype still uses placeholder tiles. Design-doc section 24 (progression changes) is also still unimplemented.
