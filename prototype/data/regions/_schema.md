# Region data (WP20)

One JSON file per region in this folder (files starting with `_` are ignored). `node tools/build-world.mjs` turns them into `js/world-gen.js` and `assets/world/<region>.json`. Tile keys are `category/name` and are checked against `art-samples/tiles/manifest.json` at build time (a typo fails the build). Coordinates are region-local tiles, x right, y down, in the **unrotated** frame (`orient` rotates them).

## Region

| Field | Meaning |
|---|---|
| `id`, `name`, `tileset` | tileset = manifest region (`greenvale`, `ashkara`) |
| `kind` | omit for a chain region, `camp` for the hub |
| `slot` | `{dir: N NE E SE S SW W NW, ring: 1..n}`; origin = dir x ring x 112 tiles from the Camp slot; `null` for the camp |
| `size` | box edge in tiles (96 for regions, 48 for the camp); the box is centred in its 112 slot |
| `orient`, `mirror` | 0/90/180/270 and optional mirror; rotates the layout (seeds, entry, exit, anchors) only |
| `landLimit` | land mask threshold (default 0.86, smaller = smaller land) |
| `warp` | domain-warp amplitude in tiles (default 13) |
| `requires` | sub-area id whose boss opens the region (informational; the entry link is what the map uses) |
| `startSub`, `defaultBiome` | first sub-area, fallback battle biome |
| `entry` | `[x,y]` where the hero arrives (inside land, 3-wide corridor to the nearest box edge) |
| `exit` | `{at:[x,y], to: regionId or null, gate: tile key}`; the gate stands in the rim |
| `rim` | style name of the outer rim (non-land cells) |
| `styles` | `name -> {set: "edges/x", deep?: "edges/y"}` (47-blob) or `{connect: "fences/x"}` (connect-4) |
| `border` / `borders` | default border style / `"a|b": style` per sub-area pair (either order) |
| `stubGate` | camp only: gate tile for the 8 compass stubs |
| `subareas` | list, see below |

## Sub-area

| Field | Meaning |
|---|---|
| `id`, `name`, `biome`, `lm` (landmark kind), `lv: [lo,hi]`, `bossLv`, `final` (region exit sub), `poi` (`shrine`/`treasure`/null), `shop` (bool) | content, copied to `world-gen.js`; `from` and `unlocks` are derived from the links |
| `seed`, `weight`, `angle`, `stretch` | weighted anisotropic voronoi seed: bigger weight = bigger area, `stretch` > 1 elongates along `angle` (degrees) |
| `unlocks` | `[{to, gate, at?}]`: gate tile key, optional `at` = hand-set gate position (border cell) |
| `ground` | ground families (patches picked by noise), `detail` + `detailRate` ground-detail tiles |
| `sets` | `{k, thr, scale}` noise patches or `{k, blob:[rx,ry], at, wobble}` ellipses of an autotile set; `blocks: true` = not walkable; `deep` adds an inner set |
| `scatter` | `{k:[keys], d: density per tile, where: ground (default) | border | set:<edges key>}` |
| `stamps` | `{k, at, landmark?, force?}` hand-placed props (`at` is a hint, moved to the nearest free cell unless `force`) |
| `overlays` | overlay tile keys for the renderer |

Generator rules (see docs/WORLD_SPEC.md): 6-7 enemies per sub-area (spots 4 or 5 by land size, 1-2 elites, boss), nodes 4.5 tiles apart, other nodes >= 3 tiles from any node, boss within 4 tiles of the outgoing gate, every gate reachable.
