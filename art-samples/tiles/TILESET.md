# Greenvale tileset: library spec (step 1)

Art-only asset library for the tile RPG, in the chosen map style: round-3 design B (`maps/tilemap3-b-painted-soft-shadow.svg`). Seamless Japanese-watercolour terrain (stacked translucent washes, pigment rims, no grid lines, no baked paths) under crisp 3/4-view props with soft painted gradient shading and a soft drop shadow. This step ships the **shared Greenvale set** (`common/`); later steps add the eight sub-area folders using the same helpers.

Regenerate everything: `node art-samples/tiles/_gen/gen-all.mjs` (writes all SVGs and `manifest.json`), then `node art-samples/tiles/build-tileset.mjs` (writes `art-samples/tileset-gallery.html`). Tiles are hand-written SVG from generator scripts; no filters, only flat shapes, opacity and linear/radial gradients.

## Canvases and conventions

| Canvas | Size | Use | Ground contact |
|---|---|---|---|
| cell | 64x64 | terrain, autotile, small props, decals, overlays | prop base at about (32,52) |
| tall | 64x128 | trees, lanterns, signs, standing stones, scarecrow | footprint is the **bottom cell** (y 64-128), base at (32,112); the top cell may overlap what is north of it |
| large | 128x128 | great trees, torii, shop stalls, gates, tents, big boulders | footprint is the **bottom row** (two cells, y 64-128) |

- `viewBox="0 0 W H"` with `width`/`height` equal to the viewBox (1 unit = 1 px at 1x). Origin top-left. The game scales by integers (2x for the gallery, 55.7 px on the phone mockups is a plain resample).
- Terrain tiles are opaque and fill the whole cell. Everything else is transparent outside its drawing.
- Draw order in the engine: ground, ground-detail, edges/autotile, decals, water overlays, props and tall props sorted by foot row (y of the bottom cell, ties by x), overlays last. Bosses and units stand beside gates, never in front of the gate footprint.
- Gradient/clip ids inside a tile are prefixed with a hash of the tile path (`g<hash>N`), so tiles can be inlined into one page without id clashes.

## Layers and categories

`ground` seamless terrain; `ground-detail` grass with flowers/clover/pebbles baked in (still seamless); `decals` transparent stamps; `edges` autotile sets (shore, deep water, dirt, sand, cliff, forest); `trees` (also bushes); `rocks`; `grass` (tall grass, reeds, lily pads); `fences` (connecting fences and hedges); `props` (stumps, mushrooms, signs, lanterns, barrels, crates, village dressing); `interest` (chests, torii waypoint, jizo, shop stalls, secret cache, gates, camp); `overlays` (fog, mist, fireflies, dapple, sunbeam, petals/leaves).

## Naming and manifest

`<region>/<subarea|common>/<category>/<name>-<variant>.svg`, e.g. `greenvale/common/trees/oak-b.svg`. Variants are `a`, `b`, `c`, `d`..., or a state word (`open`, `closed-a`, `lit`, `unlit`, `hidden`, `revealed`). Autotile pieces use the mask as the variant: `edges/water-shore-017.svg` (3-digit canonical blob mask), `fences/fence-wood-06.svg` (2-digit connect mask), `overlays/fog-edge-04.svg`.

Sub-area slugs (reserved folders): `sunny-meadows`, `old-oak-wood`, `bamboo-valley`, `mirror-lake`, `rice-terraces`, `mossy-ruins`, `firefly-marsh`, `misty-highlands`.

`manifest.json` lists every tile: `path`, `region`, `sub`, `category`, `name`, `variant`, `size [w,h]`, `cells [w,h]`, `tags`, plus the autotile bit definitions, per-category counts and the sub-area list. Tags worth filtering on: `seamless`, `autotile`, `blob47`, `connect4`, `mask:<n>`, `obstacle`, `tall`, `large`, `interest`, `loot`, `gate`, `waypoint`, `shop`, `lit`/`unlit`, `open`/`closed`, and sub-area hints (`old-oak-wood`, `mirror-lake`...).

## Palette (Greenvale)

Moss and fresh greens, indigo water and roofs, ochre earth, faded rose blossoms, vermilion accents. Values live in `_gen/lib.mjs` (`P`).

| Role | Colours |
|---|---|
| Grass | base `#c6db98`; washes `#b3d283 #cfe1a0 #dfe8ae #bcd98d`; rim `#7fa862`; tufts `#5f8f4c` |
| Dirt | `#d6c08c`; washes `#c9ae7a #dfcb9a #c4a56e #e4d3a8`; rim `#a98a58` |
| Sand | `#ecdcae`; washes `#e4d29c #f3e8c4 #dccb92 #f0e2b4` |
| Forest floor | `#8fb26c`; washes `#7ea45f #9bbd78 #6f9658 #a8c884` |
| Shallow / deep water | `#9fd0dc` (rim `#4f8aa8`) / `#6fa6c6` (rim `#3f78a0`); ripples `#f6f3e6` |
| Cliff | top `#d3c6a8`, face `#a79480 > #8a7660 > #6e5c49`, ink `#5e4e3e` |
| Foliage light > dark | oak `#86cd7f #4a9a50 #2f6e3a`; pine `#6fb27a #3c7a47 #27583a`; blossom `#fbdde6 #f6c6d4 #e0a0b6`; maple `#f3a45a #d2622e #a03c22` |
| Wood / stone | bark `#8a6a44 #6b4a2c #4a3220`; stone `#e0d9c4 #b4ad98 #857d6c` |
| Accents | vermilion `#e0583f #c8352b #8e2118`, indigo `#7a8fc0 #4d639a #33456f`, gold `#f3c24f`, lantern glow `#ffe6a0 #ffc45a` |

Fog and paper tone: `#efe5cd` / `#f6efdc`, under-shade `#cfc6b0`.

Sub-area steps may shift hue per area (dusk indigo-rose for Firefly Marsh, ochre pasture and grey cliff for Misty Highlands) by passing a new family to the same helpers; keep base-tile lightness within about 10% of the grass so areas still blend at gates.

## Shading, shadow and ink

- Light comes from the **upper left**. Gradients run light (upper-left) to dark (lower-right); highlights are a small pale ellipse or sliver on the upper-left, a darker crescent sits lower-right.
- **Drop shadow**: three stacked translucent ellipses of `#3b3a24` (opacity about .09 / .15 / .12), centred slightly right of the base and about 5-6 px tall, via `shadow(cx,cy,rx,ry)`. Shadows never cross the tile edge for 1-cell props. Terrain has no cast shadow, except the strip under a cliff wall.
- **Ink edge**: 0.9 px stroke (1 to 1.2 px on large pieces) in a dark tint of the fill hue, 70-85% opacity (`inkG #1d4a26` greens, `inkW #4a3220` wood, `inkR #5e4e3e` stone, `inkB #2a4a63` indigo). Terrain has no ink, only a faint pigment rim (stroke 1.2 px at 13% of a darker wash colour) and, for water/cliff/dirt shores, a 1.3 px rim at about 50%.
- Canopy texture is small leaf dabs (short rotated ellipses), never arcs that read as faces.

## Seamless ground (how edges match)

Every terrain family (grass, dirt, sand, forest floor, rock top, shallow, deep) has one **edge-safe skeleton**: a flat base plus 9 stacked translucent wash ellipses with pigment rims, seeded by the family name and drawn **wrapped**, i.e. every ellipse is also drawn at +-64 px in x and y wherever it touches the cell (`wrapped()`), so the cell tiles with itself exactly. All variants of a family start by drawing that identical skeleton, then add variant detail only inside the **safe zone**: wash ellipses centred in [20,44] with radius <= 15, tufts/decals/pebbles/flowers with centres in [8,56] and radius <= 6, ripples as wrapped copies. Therefore any variant can sit next to any other, and next to every autotile piece of the same family, with no seam. A pixel test (all variant pairs, both axes) shows edge differences no larger than a tile against itself.

Rule for new ground: never put anything that touches the cell border outside the shared skeleton. Large features (a big boulder shadow, a log) are props or decals, not ground.

## Autotile schemes

**47-blob** (water shore, deep water, dirt patch, sand patch, cliff plateau, forest/tree line). The 8-neighbour mask uses bits N=1 NE=2 E=4 SE=8 S=16 SW=32 W=64 NW=128, where a bit means "that neighbour belongs to the set". A diagonal bit is ignored unless both adjacent orthogonal bits are set, which leaves 47 distinct pieces (`canon()` in `_gen/ground.mjs`). Mask 255 is the plain interior; mask 0 is the isolated pond/hill. Treat cells outside the map as members so edges do not appear on the map border.

Geometry is shared: the member shape is a rounded rectangle that reaches the cell border on sides with a neighbour and is inset by a margin (9 px water, 8 px patches, 4 px forest, 11 px deep water; cliff 8 / 6 south) on sides without; a corner is rounded (radius 14-24) only when both adjacent sides are open; a missing diagonal cuts a small concave notch. Because margins and the interior skeleton are identical in every piece, neighbouring pieces meet exactly.

- `water-shore`: grass underlay, wet bank, shallow-water interior with foam band and rim.
- `water-deep`: shallow-water underlay with a deep interior; place deep cells only where all 8 neighbours are shallow members.
- `dirt-patch`, `sand-patch`: grass to dirt/sand blends (no paths); circular patches grow organically as the mask changes.
- `cliff`: raised plateau; the south side (S missing) shows a 22 px stratified rock wall with a ground-contact shadow; other sides are a pale lip. Walls turn around concave corners.
- `forest`: grass to forest floor with crowns on a staggered lattice shared by all pieces. A crown that crosses a tile edge is drawn only if it fits inside the shape of every tile it touches, judged from the 3x3 neighbourhood both tiles share, so pieces always agree.

**Connect-4** (16 pieces, bits N=1 E=2 S=4 W=8): `fence-wood`, `hedge`, `hedge-blossom`. A post/hedge body sits at the cell centre and arms reach to the cell edge in each connected direction, so the next piece's arm continues exactly. Gates (`interest/gate-*`) are 128x128 and replace two fence cells; the fences either side use the mask bit towards the gate.

**Fog edge** (15 pieces, same bits, bit = fog hugs that side, union of rotated side bands) plus three seamless `fog-full` tiles.

## Tile counts (common)

See `manifest.json` (`counts`). At this step: ground 24 (grass 4, dirt 4, sand 3, forest floor 3, rock top 2, shallow 4, deep 4), ground-detail 24 (12 baked-decal kinds x 2), decals 22, edges 282 (6 sets x 47), trees and bushes 31, rocks 17, grass/reeds/lilies 9, fences/hedges 48, props 29, interest 22, overlays 29.

## Creativity guidance (open by design)

The checklist is a floor, not a ceiling. Add variants and new kinds freely (seasonal recolours, ruined or mossy versions, signature landmarks) as long as a tile: keeps its canvas class and footprint, follows the light/shadow/ink rules, uses palette colours or a clearly derived hue, reaches the manifest through `save()` so it appears in the gallery, and, for terrain, builds on the family skeleton. New sub-area tiles go in `greenvale/<sub-area>/<category>/` with `sub` set in the `save()` call. Helpers for reuse: `_gen/lib.mjs` (rng, `Tile` with `lg`/`rg`/`clip`, primitives, `shadow`, `wrapped`, `blobPath`, `save`), `_gen/ground.mjs` (skeletons, decals, `blobGeom`, `blobTile`, `crown`), `_gen/compose.mjs` (the sample-scene composer).

## Step 2: Sunny Meadows and Old Oak Wood

Folders `greenvale/sunny-meadows/` and `greenvale/old-oak-wood/`, generated by `_gen/gen-meadow.mjs` (+ `gen-meadow-objects.mjs`) and `_gen/gen-oakwood.mjs` (+ `gen-oakwood-objects.mjs`), shared helpers in `_gen/sub.mjs`, sample scenes in `_gen/compose-sub.mjs`. Same palette, canvases and rules as the common set; all ground variants are built on the common family skeletons, so they sit seamlessly beside the common tiles.

- **Sunny Meadows**: rolling-hill, lush, golden and dewy grass; field rows (cabbage, wheat, turnip, lavender, rapeseed, sprout, soil; periodic furrows, seamless); 9 wildflower carpet moods plus clover and hay; 3 flower-patch autotiles (47 each); farm rail fence, low stone wall and wildflower hedge (16 each); windmill, barn, hay cart, beehives, scarecrows, picnic, orchard trees, sunflowers, lily pond, the lone blossom tree landmark with petal-storm overlay, butterflies, bees, cloud shadows.
- **Old Oak Wood**: moss, dark, golden and root/litter/fern/acorn/mushroom/glow floors; oaks as sapling, young, mature, autumn, dead, hollow, ancient and sacred (shimenawa); the hollow-trunk door gate (closed/open); root arches; fungi and glowing mushrooms; logs, stumps, shrine stones, hokora, stone circle (dim/lit), woodcutter camp, owl perches, webs, ferns; wattle fence, mossy wall, shimenawa rope fence; dapple, light shafts, leaf fall, spores, mist.
- **Meadow to forest blend**: `edges/floor-patch` (forest floor growing out of grass, feathered), `edges/grass-clearing` (grass in the wood), `edges/oak-forest` (oak tree line on meadow grass), `edges/oak-grove` (oak thicket on forest floor), the ground ramps `ground/grass-leafy` and `ground/floor-grassy`, and `decals/blend-fringe`.
- Overlays in these sets stay inside their cell (no wrapped content), so they can be dropped on any subset of cells without seams.
