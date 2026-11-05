# WP20 plan: tile-map overworld from the Greenvale and Ashkara tilesets

Status: steps 1 and 2 implemented (see Step notes); steps 3 to 6 open. Replaces the painted free-roam map (`prototype/js/world-layout.js`, 733 lines; the painter in `prototype/js/map.js`, 2727 lines) with a tile map, re-spreads the WP19 progression (GAME_DESIGN 24.7 / 24.8) over 16 organic sub-areas, and makes a new region "mostly a data and tileset addition". Related: IMPLEMENTATION_PLAN "Future: long-term world expansion", `art-samples/tiles/TILESET.md`, `art-samples/maps/GREENVALE.md`, `DESERT.md`.

## 1. World model

**Units.** 1 tile = 64 world units (the art's native cell), so `World.nodes` x/y, `sightRadius` (430 + 150/level), `secretRadius` and hero speed keep working. Spots 4.5 tiles apart reproduces today's 285-unit spacing (about 2 enemies per phone screen at zoom 0.8, 8 tiles across).

**One sparse world grid made of region slots.**
- A slot is 112 x 112 tiles: a 96 x 96 region box plus a 16-tile margin. A region has `slot: {dir, ring}`, `dir` in N NE E SE S SW W NW, `ring` 1..n. Slot origin = `(dx*ring, dy*ring) * 112` tiles from the Camp slot (0,0), with `dir` vectors like `NE = (1,-1)`. Everything is in world coordinates, so fog, scouting and a world minimap work across regions.
- **Camp slot (0,0)**: a small hand-made "Camp Grounds" map (48 x 48, `data/regions/camp.json`) with eight gate stubs, one per compass direction. A ring-1 region unlocks when its `requires` boss has been beaten (default: none for Greenvale).
- **Greenvale** = `{dir: N, ring: 1}`, entered through the Camp's north gate. **Ashkara** = `{dir: N, ring: 2}`: the Greenvale exit (Misty Highlands) is the north edge and Ashkara's caravan camp is its south edge, as DESERT.md already assumes. Both are authored "south to north" (entry south, exit north).
- **Future regions** are one JSON file each: 7 more ring-1 slots (NE..NW) and ring-2+ slots form chains outward, so 10+ regions fit with no change to code. Each region sets `orient` (0/90/180/270, plus an optional mirror) which rotates the **layout** (seeds, entry, exit), not the art, so the generator always produces the final grid and the autotile masks are computed after rotation. Light stays upper-left.
- **Region links.** `exit.to: <regionId>` joins the exit gate to the next region's entry. If the exit side faces the next slot (cardinal chains), the margin gets a walkable causeway, kind `walk`. Diagonal chains use kind `portal` (walk into the gate, fade, appear at the entry). v1 ships only `walk` (the N chain) and `portal` as tested code.

**Organic, unequal sub-areas** (build-time, per region, in `tools/world/gen-region.mjs`):
1. Each sub-area has a hand-set seed `{id, x, y, weight, angle, stretch}` in region-local tiles (`data/regions/<id>.json`). Weights differ, so sizes differ: 350 to 900 land tiles, about 19 x 19 to 30 x 30. Nothing sits on a grid.
2. **Weighted Voronoi with domain warp.** Label every cell by `min_i( dist_i(warp(x,y)) / weight_i )`. `dist_i` is anisotropic (angle/stretch makes oblong or crescent-ish areas). `warp` adds two octaves of seeded value noise (amplitude about 6 tiles). A rim noise term shapes the outer coastline of the region box (irregular, not square).
3. **Clean-up.** Flood-fill each label, keep the largest component, reassign orphan cells to the neighbour with the longest shared edge, then 2 passes of majority smoothing.
4. **Adjacency rule.** The label graph must contain every `from -> unlocks` link and may contain extra neighbours. If a link is missing, the generator moves the seed toward its partner and retries (seed derived from `regionId`, so it is deterministic). Hard fail after 20 tries.
5. **Borders.** Cells within 1 tile of a different label become a 3-tile `border band`. Each ordered pair has a border style (`cliff`, `water`, `forest`, `wall`) in region data, defaulting by biome. Bands are cells of the matching 47-blob set (`cliff`, `water-shore` + `water-deep`, `forest`, or the connect-4 `wall-mudbrick` / `hedge`), so masks give clean corners. Outer rim cells use the region's `rim` style (sea, cliff or tree wall).
6. **Gates sit in borders.** For a link A -> B the generator picks the border cell nearest the midpoint of the two seeds (or a hand `gate: [x,y]` override), cuts a 3-wide gap, stamps the sub-area's gate prop (the 128 x 128 `interest/gate-*` tile, or a bespoke one named in data) and records `gates[{from,to,cells,face}]`. The cut cells are **blocked while B is closed** in this run (`run.open`); other border cells are always blocked. Non-linked neighbours get no gap. The region exit is a gate in the rim.

## 2. Map generation pipeline

**Build-time, deterministic, committed.** `node tools/build-world.mjs` reads `prototype/data/regions/*.json` and writes:

| Output | Content | Used by |
|---|---|---|
| `prototype/js/world-gen.js` | UMD (browser + node), small (< 200 kB): region list, slot origins, per sub-area `bounds`, entry, boss, elites, spots, poi, shop, event, wp, secret, landmark, gates, `blocked` bitset and `subId` grid (RLE) | `world-data.js`, `tools/*.js`, nav code |
| `prototype/assets/world/<region>.json` | per-layer tile grids (RLE): ground, ground-detail, autotile piece per set, decals, props `{k,x,y,foot}`, overlays, fog edge data | renderer only (lazy) |
| `prototype/assets/world/<region>-{cell,tall,large}.webp` + `atlas.json` | the used tiles, rasterised | renderer only |

Layer recipe per cell: ground family by sub-area (variant picked by noise or hash of cell), ground-detail at 15-25%, then per sub-area `sets` in priority order (e.g. dirt-patch, lake, forest) -> boolean grid -> 8-neighbour mask -> canonical 47 piece (`canon()` rule in `compose-sub.mjs`: diagonals count only when both sides are set; connect-4 for fences, hedges, walls). Props come from per-sub-area `scatter` recipes `{key, density, kind: one|tall|large, where: set|ground|border}` plus hand `stamps` (the landmark: Blossom Hill, torii in the lake, ruined arch ...). Footprints (`tags: obstacle`; tall/large = bottom cell/row) go into the blocked grid. Ramps (`ochre-moss-ramp` etc.) blend ground across sub-area borders where the data names one. Every key in region data is checked against `art-samples/tiles/manifest.json` at build time (typo = build failure).

**Nodes.** Per sub-area, on the walkable cells: Poisson-disk sampling (min 4.5 tiles apart and 3 from borders, seed `subId`), ordered by BFS distance from the entry. Counts: spots = 4 (< 500 tiles) or 5, plus 1 elite (2 if > 800 tiles), plus the boss = **6-7 enemies**. The boss stands within 4 tiles of the exit gate, off its footprint ("beside the gate"). Then poi, shop, event, wp (near the entry), secret (the dead end farthest from the path), all >= 3 tiles from every other node. The `--check` mode asserts that BFS reaches every node from the entry and every gate from its sub-area, spacing, counts per sub-area, and that two runs hash identically.

**Tiles to the game.** Raw numbers: the manifest has 8,136 SVGs, 122 MB, about 13 kB each. Inlining the used subset as SVG (about 1,000-1,200 tiles x 13 kB = 14 MB per region) would not fit the single file (today 2.86 MB). Recommendation: **rasterise only the used tiles into per-region atlases at build time** (`@resvg/resvg-js` as a devDependency; `/usr/bin/convert` exists but its SVG renderer mishandles gradients, so it is only a fallback).
- Sheets by canvas class (cell 64 x 64, tall 64 x 128, large 128 x 128), WebP. Terrain, autotile and ground-detail (soft watercolour, opaque) at 0.75x scale, lossy q80; props and decals (crisp ink) at 1x, q85 with alpha. Seam risk: terrain tiles are encoded in 48 px blocks and drawn with 1 px overdraw; the pilot must show no seams at zoom 0.8 and 1.5.
- Estimate: about 1,100 distinct tiles per region, about 1.5-2.2 MB WebP, so 2.0 MB / region is the budget. Base64 in the single file adds 33%.
- `npm run build` emits the sheets as hashed files, loaded lazily per region (open and adjacent ones). `npm run single` inlines them with the same `import.meta.glob(... ?url, eager)` pattern `art.js` uses for backdrops. The single-file build reads `WORLD_SINGLE_REGIONS` (default: camp, greenvale, ashkara) and omits other regions' sheets, so its size stays about 2.9 + 2 x 2.7 = **about 8.5 MB**; this is the cap and it is checked in step 2. If a pilot region exceeds the budget, drop terrain to 0.5x (about -35%).
- Rejected: pre-rasterised baked chunks (a 96 x 96 region at 24 px/tile is 5.3 MP, 1.5-2.5 MB each, no de-duplication, recolour and fog rebuilds need a re-bake) and runtime SVG (122 MB, slow).

**Runtime render** (new `prototype/js/tilemap.js`, replaces the painter in `map.js`):
- Chunks of 16 x 16 tiles (1024 px at 1x). On demand, a chunk canvas is composed once from ground, detail, autotile, decals, water overlays (256 `drawImage` calls), kept in an LRU (about 16 chunks, 64 MB). Each frame blits visible chunks with the camera transform.
- Props, tall props, large props, nodes, enemies, hero and gates are y-sorted by foot row (ties by x) per frame from a per-chunk spatial index, about 150 sprites on screen; overlays last. Bosses and units never overlap a gate footprint.
- **Fog** uses the existing `fog-edge` (15 pieces) and `fog-full` tiles per sub-area id: fog cells = cells of sub-areas not in `save.unlocked`; the fog layer is rebuilt for the chunks of the area that was just unlocked. Per-run closed gates are drawn as sealed gate sprites plus the "Defeat <boss> this run" note, as now. Scouting (`sight`/`secret` radii) is untouched.
- Navigation moves into `prototype/js/world-nav.js`, same API as today: `blocked(x,y)`, `subAt(x,y)`, `findPath` (A* on the tile grid, smoothed by the existing `smoothPath`/`simplifyLOS`), now backed by the tile bitsets.

## 3. Game data mapping

- **Contract.** `window.WorldLayout.subareas[id]` keeps its fields (WORLD_SPEC), now filled by `world-gen.js`, so `world-data.js` changes only in where `SUB_DEFS`/`THEMES` come from. Node ids stay `<sub>-<i>`, `-e<i>`, `-boss`, `-poi`, `-shop`, `-event`, `-wp`, `-secret`. `World.nodes` positions are tile centres in world units.
- **Data-driven content.** `SUB_DEFS`, `GUARDED`, `SHOPS`, `REGIONS` and `THEMES` move from `world-data.js` into the region files (`sub-areas[]`: id, name, biome, `lm`, `lv`, `bossLv`, `from`, `unlocks`, `poi`, `guarded`, `shop`, `theme{basic,tough,armored,barrel,boss}`, `bossDef` pointer). `world-data.js` merges the regions listed in `world-gen.js`, sets `regionIndex` = chain depth (`ring`, so rings give a monotonic tier; `GOLD_SCALE[]`, `bossCrystals(region)` and the rarity test `regionIndex >= 1` extrapolate instead of indexing a fixed array), and `CAMP.sub` = the first region's `startSub`.
- **The 5 x 4 old sub-areas -> 16 new.**
  - Greenvale keeps `meadow`, `forest`, `bamboo`, `lake` (same names, themes, `boss-defs.js` entries) and gains `rice` (Rice Terraces), `ruins` (Mossy Ruins), `marsh` (Firefly Marsh), `highlands` (Misty Highlands) with the enemy and boss lists of GREENVALE.md, mapped onto existing unit art and boss gimmicks (`boss-defs.js`: 4 new entries, reusing gimmicks of the retired bosses).
  - Ashkara: `dshallows`, `palms`, `erg`, `saltmirror`, `wadi`, `bazaar`, `tomb`, `citadel`, with the DESERT.md names, gates and unit lists (reusing the old Sunscorch themes `dunes/oasis/canyon/temple` as 4 of them, the rest from the retired Frost/Ember themes).
  - **Azure Coast, Sunscorch, Frostveil and Ember Peaks leave the map** (their tilesets do not exist). Their definitions move verbatim to `prototype/data/regions-reserve/*.json` (no slot) as ready content for later regions, so their levels, themes and boss defs are not lost; `progress.js` references (`need: 'temple'` for `ushabti1`, `FINAL_BOSSES = ['glacier','caldera']`) are remapped to `tomb` and `citadel` and the final-boss flag moves into data (`final: true`).
- **Graph and gates.** Greenvale: meadow -> forest -> bamboo -> lake, then a fork: lake -> rice -> marsh -> highlands, and lake -> ruins (optional side area). Ashkara: dshallows -> palms -> erg -> saltmirror -> wadi -> bazaar -> tomb -> citadel. `highlands` unlocks `dshallows` (region link). `run.open` is derived from `from`/`unlocks` exactly as now; `save.unlocked` still drives fog; a lit Wayshrine start opens its own sub-area (`app.js` start code uses `startSub` instead of the literal `'meadow'`).
- **Per sub-area content.** 6-7 enemies with a unique drop each (`items.js` builds per `World.SUBAREAS`, no change), one wp, one shop (data flag, about every second area), one event per area (`Events.pick(region)`: add Ashkara event text), one poi (`shrine`/`treasure`), one hidden secret (uses 1 Key), as in WP13/WP14. Journal and bestiary iterate `World.SUBAREAS`/`REGIONS`, no change (the region chips will scroll, noted under risks).
- **Battle backdrops.** `biome` per sub-area stays the key into `assets/battle/<biome>.svg`, with a per-region `defaultBiome`. Reuse: meadow, forest, coral (lake), dunes, temple (tomb). New painted SVGs (art, outside the code steps): `marsh`, `highlands`, `saltflat`, `canyon`; ruins -> `forest`, rice -> `meadow`, palms -> `dunes`, citadel -> `temple` until painted. `battle.js STREAM_BY_BIOME` moves into region data (`biome -> stream`) and falls back to the region default, so a new region never edits JS.
- **Save.** `SAVE_KEY` `tile-defense-world-v3` -> `tile-defense-world-v4`; no migration (sub-area ids and positions changed; `waypoints`, `startAt`, `seen`, `secrets`, `bossesBeaten`, `unlocked` all hold ids). Settings that do not hold ids may be copied in `load()`. Document in the progress header and GAME_DESIGN 24.

## 4. Progression

WP19 formulas stay as written (`w(L) = (L/5)^1.5`, Souls, Gold, run caps, boss Rations `round((2 + 1.3w) x 0.8^n)`, toll `floor(w/1.5)`, cap 60). Only the level table is re-spread (`lv` = ordinary range, `bossLv`, elite = `lv[1] + 1` from region index 1):

| Region | sub-area (bossLv) |
|---|---|
| Greenvale (ring 1) | meadow 4, forest 5, bamboo 5, lake 6, rice 7, ruins 8, marsh 8, highlands 9 |
| Ashkara (ring 2) | dshallows 10, palms 11, erg 11, saltmirror 12, wadi 13, bazaar 13, tomb 14, citadel 15 |

Ordinary spots span `[bossLv - 2, bossLv - 1]` (meadow stays `[1, 2]`). Greenvale uses the old Greenvale+Azure/Sunscorch pacing curve (Lv1-9 in 8 steps instead of 4+8); Ashkara uses the old Frost/Ember levels (10-15), so the validated POWER bands (up to Lv15) cover the whole shipped world, and Lv9 bosses stay at the validator ceiling as now. Expect more battles per run before the Lv9 gate than before; this is the intended lengthening.

**Extension for 10+ regions.** Rule of thumb in region data: `bossLv(k) = prevRegionLastBoss + 1 + round(i * 5 / 7)` for the 8 sub-areas of a chain region, `i = 0..7`, so each region adds about 5-6 levels (10 regions reach about Lv70). Ring-1 regions of the 7 other directions start near Lv 8-10 (`requires: 'rice'`), because depth is set by ring, not direction. Beyond Lv15 the enemy curves stay near-linear (HP 2.2 + 0.95L), rewards follow `w(L)`; `validate-gen.js` `POWER`/`BOSS_BAND` need new rows. Region files get an optional `powerBand` block so extending the validator is data (a region cannot ship until `validate-gen.js <region>` passes). Rations at Lv30 (w = 14.7) are 21 per new area; the 60 cap and the 0.8^n decay still bound a run.

**Tools.** `tools/sim-runs.js`: all `require` lines stay (the nodes come from `world-gen.js`); replace the literal `'meadow'` start (line 97, 203-204, profile saves), the `unlockRun` list `['forest','beach','dunes','snow','ash','glacier','caldera']` with region chain heads from `World`, and `save.farm` iterates `World.SUBAREAS`. Re-measure: fresh account 9-11 battles per run (still only the first sub-area open), Greenvale cleared run 3-8, Ashkara first boss run, longest boss chain (<= 60 battles), 8 seeds x 30 runs. `tools/validate-gen.js`: `EARLY_BOSSES` (`beach`, `dunes`) -> `rice` and `dshallows` (the first boss of each new level band), `SUB_FOR {1..5}` -> `forest, lake, ruins, tomb, citadel`, the tier mapping `World.danger` is unchanged, `40` (200 battles) and `bosses` (40 fights) must pass.

## 5. Work steps (sequential, one Sonnet agent each)

1. **Region data and the map generator (node only, no game change).**
   Files: new `prototype/data/regions/{camp,greenvale,ashkara}.json` (+ `_schema.md` field list), `tools/world/{noise,voronoi,autotile,nodes,gen-region}.mjs`, `tools/build-world.mjs` (with `--check`, `--preview`), `tools/world/preview.mjs` (one SVG per region: coloured sub-areas, borders, gates, nodes), output `prototype/js/world-gen.js` and `prototype/assets/world/<region>.json`.
   Done: `node tools/build-world.mjs --check` passes (connectivity, 6-7 enemies per sub-area, spacing, gates reachable, deterministic hash on two runs, every manifest key exists); preview SVGs show 8 unequal organic areas per region.
   Document: `docs/WORLD_SPEC.md` rewrite of the data schema and the algorithm (short).

2. **Atlas rasteriser and size pilot.**
   Files: `tools/world/raster.mjs` (devDependency `@resvg/resvg-js` in `prototype/package.json`), `prototype/scripts/` hook, outputs `prototype/assets/world/*.webp`, `atlas.json`, `--scale` flags.
   Done: Greenvale atlas <= 2.0 MB, Ashkara <= 2.0 MB, a 3 x 3 chunk visual seam test (screenshot at zoom 0.8 / 1.5) shows no seams. Report final sizes and the extrapolated single-file size (must be <= 9 MB). If over budget, apply the 0.5x terrain option.
   Document: TILESET.md "Runtime use" paragraph (atlas, scale, naming) and the size table.

3. **Tile renderer and navigation (map replaced, game data still old ids).**
   Files: new `prototype/js/tilemap.js`, `prototype/js/world-nav.js`; trim `prototype/js/map.js` to camera, hero token, nodes, taps, fog UI and the public `WorldMap` API (`focus`, `placeToken`, `heroAt`, ...; grep the callers in `app.js` first); `prototype/index.html`, `world.css`; keep `world-layout.js` loaded until step 4.
   Done: `npm run build` and `npm run single` succeed; Playwright (or headless Chromium) screenshots at the Camp, Greenvale start, a gate, a fog edge and Ashkara start at 390 x 844 show tiles, y-sorted props, gates closed/open, hero walking around cliffs and water (blocked) and through a gate; frame time < 16 ms on a mid desktop profile.
   Document: WORLD_SPEC render section.

4. **Game data wiring, 16 sub-areas, save v4.**
   Files: `prototype/js/world-data.js`, `boss-defs.js` (4 + 8 entries), `progress.js` (SAVE_KEY, `need:` ids, `FINAL_BOSSES`, `freshSave().unlocked`), `app.js` (start sub, region labels, fast-travel grouping, Journal chips), `items.js` and `events.js` (region tier extrapolation, Ashkara events), `battle.js` and `art.js` (biome table in data, new backdrop assets), `data/regions-reserve/*.json`; delete `world-layout.js`.
   Done: `node tools/validate-gen.js` and `node tools/sim-runs.js 1` run with the new ids (fix literals); the game starts from Camp, the first boss opens `forest`, a Wayshrine start works, fast travel respects closed gates; screenshots of node cards and a battle with each new biome.
   Document: GAME_DESIGN 24.7 note (per-run gates over the new graph), IMPLEMENTATION_PLAN WP20 entry.

5. **Progression pass and validators.**
   Files: region files (`lv`, `bossLv`), `tools/validate-gen.js` (EARLY_BOSSES, SUB_FOR, POWER if a boss band moves), `tools/sim-runs.js` (as in section 4), `docs/GAME_DESIGN.md` 24.8 (new level table, 16 rows).
   Done: `node tools/validate-gen.js 40` and `node tools/validate-gen.js bosses` pass; `SEED=1..8 node tools/sim-runs.js 1 campaign 30` and a fresh-account run give 9-11 battles per run, first Greenvale boss run 1-2, Ashkara reached in a plausible run range, chain runs <= 60 battles. Record the numbers like the WP18 note.
   Document: "WP20 final pacing numbers" in IMPLEMENTATION_PLAN.

6. **Data-only region dry run, cleanup, docs.**
   Files: a temporary `data/regions/test.json` (copy of Ashkara at `{NE, ring 1}` with `requires: 'rice'`), then removed; `docs/WORLD_SPEC.md`, `docs/IMPLEMENTATION_PLAN.md` ("Add a region" checklist: tileset + manifest, region JSON with seeds/borders/recipes/themes, enemy art, backdrop, validate bands, run build-world, sim), `README.md`, delete dead painter code in `map.js`.
   Done: the test region appears with no JS edits (`build-world --check`, `npm run build`, screenshot of the NE slot via `?debug=region`), `npm run single` size reported, `npm run android` still builds, test region removed.

## 6. Risks and open choices

| Risk / choice | Recommendation |
|---|---|
| Single file grows to about 8.5 MB (from 2.86 MB) | Cap at 3 regions via `WORLD_SINGLE_REGIONS`; keep the 2.0 MB per region budget with 0.5x terrain as the fallback. The normal build and Capacitor have no such limit. Confirm 9 MB is still acceptable for the artifact host. |
| Lossy WebP seams in tiling terrain | Test in step 2 first; use 1 px overdraw, then lossless for ground tiles only if needed. |
| Hand seeds still produce a poor shape or a missing adjacency | The generator retries with seed nudges and fails loudly; the preview SVG is part of every review; allow per-sub `polygonMask` override for one-off shapes. |
| Greenvale 8 areas are a long chain before Ashkara | Fork at the lake (rice/ruins) keeps a choice; Rations from boss repeats stay as in WP19. Accept. |
| Retired regions' content loses its home | Kept verbatim in `regions-reserve/`; reuse themes and boss defs when new tilesets arrive. |
| Save break (v4) | Accept, prototype stage; no migration. |
| Diagonal chains (`portal` links) are untested at scale | Only the N chain ships; the `portal` code is covered by the step-6 dry run in the NE slot. |
| Interior "structure" regions (pyramid, castle) | Out of scope: they fit the same model (a region whose rim is wall and borders are `wall`/`door`), needing only an interior tileset; list under Future. |
| `map.js` has 2.7 kLoC of tangled UI + painting | Step 3 first lists its public API with grep and keeps behaviour, instead of rewriting the UI. |
| Battle backdrops (4 missing) | Reuse for now, paint later as an art task; no code depends on it. |

## Step notes

**Step 1 (region data and generator), done.** Decisions where the plan was unclear:
- Enemy counts: below 500 land tiles 4 spots + 1 elite + boss (6), 500 to 800 5 + 1 + boss (7), above 800 4 + 2 elites + boss (7), so every sub-area has 6 or 7 enemies (the plan's "5 spots + 2 elites" would make 8).
- Sizes: the hand seeds plus a one-off weight tuning give 437 to 898 land tiles in Greenvale and 496 to 923 in Ashkara (plan: 350 to 900); the land mask is about 5,600 tiles per region. Weights are plain data in the region files.
- Seeds and weights are tuned against the generator as it is (domain warp 13): changing `warp`, `landLimit` or a seed changes every area, re-tune the weights and look at the preview.
- Entry and exit: `entry` / `exit.at` are points inside the land (the generator carves a 3-wide corridor to the nearest box edge and a land line to the first/last sub-area's seed); the exit gate stands in the corridor 2 tiles from the box edge.
- Greenvale and Ashkara were authored south to north with the fork lake -> rice / lake -> ruins; `ruins` is a dead end whose boss stands at the farthest point. Greenvale uses a forest rim, Ashkara a sandstone cliff rim.
- Fog tiles (`overlays/fog-edge`, `fog-full`) exist only in the Greenvale tileset; every region uses them.
- Ground and autotile pieces are looked up by `category/name` in the manifest, ignoring the sub-area folder; the build fails on a missing key or a missing mask piece.
- The generator keeps blocking sets (lakes, pools) 3 tiles away from borders and gates so a walkway always remains; nodes are placed after the static terrain and scatter props avoid lanes, so props never cut a route.
- Camp: a single sub-area (no nodes) with eight 3-wide gate stubs at the box edge (N, E, S, W and the four corners). World y is negative north of the camp; step 3/4 must handle negative world coordinates (or add a global offset).
- Output sizes: world-gen.js about 32 kB, assets/world about 95 kB per region (before the atlas step).

**Step 2 (atlas rasteriser and size pilot), done.**
- Rasteriser is Playwright Chromium (`tools/world/raster.mjs`), not `@resvg/resvg-js`: Chromium renders the SVG gradients correctly and encodes WebP itself, so no new devDependency was added (Playwright is a tool-level dependency; npm script `world:atlas` in `prototype/package.json`). Outputs: `prototype/assets/world/<region>-<grp>-<cls>.webp` + `<region>-atlas.json` (format in TILESET.md "Runtime use").
- Sheets are split by group (terrain / prop / fx) and canvas class, not only by class, so quality can differ. fx = fog tiles plus the region's overlays (fog comes from Greenvale for every region).
- Sizes are far under budget, so everything stays at 1.0x (no 0.75x/0.5x terrain): Greenvale 0.62 MB, Ashkara 0.46 MB, Camp 0.07 MB; single file about 4.7 MB (cap 9). Renderer can keep 1x tiles; no downscale blur at zoom 1.5.
- Seam test (`tools/world/seam-test.mjs`, 3 x 3 chunks, zoom 0.8 / 1.5, 1 px overdraw): no visible seams; boundary gradient with q0.85 equals q1.0 (2.66 vs 2.67 at 0.8, 1.13 vs 1.13 at 1.5), so lossy WebP adds none.
- Observation for step 3: the composed test area shows hard-edged stone/pale tiles mixed into plain meadow in places (set pieces such as `fences/wall-stone-mossy` and detail tiles); atlas values `256` in set grids have no manifest piece (skipped in the test). Check set/mask semantics when writing `tilemap.js`.
- Re-run `node tools/world/raster.mjs` after every `node tools/build-world.mjs` (tile indices change).
