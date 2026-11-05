# World spec (v4: tile-map overworld, WP20)

Status: steps 1 to 3 (data + generator, atlases, tile renderer and navigation modules with a standalone viewer) are implemented; the game wiring follows in step 4 (docs/WP20_PLAN.md). The v3 free-roam contract is kept at the end of this file until step 4 replaces it.

## Model

- 1 tile = 64 world units. The world is a sparse grid of **region slots**, each 112 x 112 tiles (a 96 x 96 region box plus a 16-tile margin; the camp box is 48 x 48). A region has `slot {dir, ring}`; its box origin is `dir * ring * 112 + 8` tiles from the camp slot (0,0). Coordinates in `world-gen.js` are world tiles (y is negative north of the camp), node positions are tile centres in world units.
- Camp Grounds (`camp.json`) has eight gate stubs, one per compass direction. Ring-1 regions link to the stub of their direction; a ring k region links to the exit of the ring k-1 region in the same direction. Cardinal chains get a 3-wide `walk` causeway through the margin (stored as cells); diagonal ones are kind `portal`.
- Data, schema and field list: `prototype/data/regions/_schema.md`. Adding a region is a JSON file plus a tileset; nothing in the generator or the game is region specific.

## Generator (`node tools/build-world.mjs [--check] [--preview]`)

1. **Land mask**: superellipse with rim noise (`landLimit`), disks around the seeds, 3-wide corridors for entry and exit, detached islands dropped.
2. **Sub-areas**: weighted anisotropic voronoi (`dist_i(warp(p)) / weight_i`, two noise octaves of domain warp), clean-up (largest component per label, orphan reassignment, majority smoothing). The label graph must contain every `from -> unlocks` link with at least 16 shared edge cells; otherwise the two seeds are nudged together and it retries (max 20, deterministic).
3. **Borders**: cells within one tile of another label form a 3-wide band, styled per pair (`cliff`, `water`, `forest`, `wall`, `hedge`, ...) with 47-blob or connect-4 masks. Bands and the rim are blocked.
4. **Gates**: for a link the band cell nearest the seed midpoint whose both ends reach the main bodies of the two sub-areas gets a 3-wide cut along the local border normal and a 128 x 128 gate prop. The region exit is a gate in the rim.
5. **Layers**: ground families by noise patches, ground-detail, per-sub `sets` (blocking ones keep a 3-tile walkway to the borders), hand stamps (landmark), scatter props (avoid lanes, nodes, gate footprints; `tags: obstacle` footprints are blocked).
6. **Nodes** per sub-area on walkable cells with clearance >= 3: boss beside the outgoing gate, spots and elites by best-candidate sampling (4.5 tiles apart), then waypoint (near the entry), poi, shop, event and the hidden secret (farthest from the route), all >= 3 tiles from any node. Spots are sorted by BFS distance from the entry.

## Outputs

- `prototype/js/world-gen.js` (UMD, `WorldGen`): regions with `origin`, `size`, `entry`, `exit`, `links`, `gates`, `subareas` (`bounds`, `entry`, `boss`, `elites`, `spots`, `poi`, `shop`, `event`, `wp`, `secret`, `landmark`, `from`, `unlocks`, content fields), `blocked` and `subId` grids (run-length, `[value, count, ...]`, row-major, size x size).
- `prototype/assets/world/<region>.json`: `tiles` (manifest paths), run-length layers `ground`, `detail`, per autotile set masks (`mask + 1`, 0 = absent), `props {k,x,y,w,h,t}` (x,y = bottom-left cell of the footprint), overlays per sub-area.
- `docs/world-preview/<region>.svg`: review picture (areas, borders, gates, nodes).

`--check` asserts: 6-7 enemies per sub-area, spacing, every node and gate reachable from the entry with all gates open and every outgoing gate reachable from its own sub-area, link adjacency, identical hash on two runs, every tile key and autotile piece present in the manifest.

## Render and navigation (WP20 step 3)

`js/tilemap.js` (`window.TileMap`) and `js/world-nav.js` (`window.WorldNav`) need `window.WorldGen` (set it from `import('./js/world-gen.js').default`, the UMD file is bundled as CommonJS). Try them in `tiles.html?r=greenvale&unlocked=meadow` (query list in `docs/WP20_PLAN.md` step 3 notes).
- Values in `assets/world/<region>.json`: `ground`, `detail`, `props[].t` are tile index + 1 (frame `atlas.frames[v - 1]`), set grids hold canonical mask + 1 (0 = empty; 256 = blob mask 255). Prop x,y = bottom-left cell, tall and large props extend upwards, gates have `t = [closed, open]`.
- Terrain: 16 x 16 tile chunks with a 2 px bleed, composed once (ground, detail, sets in `setOrder`), LRU 20. Per frame: visible chunks, then props and caller sprites y-sorted by foot row, then fog (`fog-full` on fogged cells, `fog-edge-<mask>` next to fog). `TileMap.render(ctx, {x0,y0,x1,y1}, sprites)` expects the world transform on `ctx`.
- Navigation: `WorldNav.blocked(x, y)`, `subAt(x, y)` in world units (tile = 64, negative coordinates allowed), `blockedTile`, `gateAtTile`, `findPath(sx, sy, tx, ty, walkable)`; gate cut cells are not in the blocked grid, the caller blocks them while the target sub-area is closed this run.

## Legacy v3 contract (still used by the game until WP20 step 4)

Shared contract between the world **content** (js/world-data.js, items, enemies, balance) and the world **layout + painting** (js/world-layout.js, js/map.js).

## Regions and sub-areas

Five regions, four sub-areas each (20). Every sub-area has its own boss and **6–7 enemies including the boss** (typically 4–5 normal, 1 elite, 1 boss), plus 0–1 free point of interest (healing spring or supply cache). In each region the sub-areas unlock in the order listed (each boss unlocks the next). Lake's boss unlocks both Azure Coast (beach) and Sunscorch (dunes); Mist Isles' boss unlocks Frostveil (snow); Buried Temple's boss unlocks Ember Peaks (ash).

**Gates (per run).** `World` only describes which area leads where (`from` / `unlocks`). Whether an area is *open* is run state (`run.open`, set by `app.js`): Sunny Meadows at a Camp start, the Wayshrine's own sub-area for a Wayshrine start, plus every area unlocked by a boss beaten in this run. `save.unlocked` only controls the fog (permanent). The map treats a fog-free but closed area as a walkable-no region (`lockedAt`) and paints it washed out with a seal at its entry.

| Region | id | Name | Landmark kind | Battle biome |
|---|---|---|---|---|
| Greenvale | meadow | Sunny Meadows | hill | meadow |
| Greenvale | forest | Old Oak Wood | oak-grove | forest |
| Greenvale | bamboo | Bamboo Valley | bamboo-grove | forest |
| Greenvale | lake | Mirror Lake | lake | coral |
| Azure Coast | beach | Shell Beach | lighthouse | beach |
| Azure Coast | coral | Coral Shallows | reef-arch | coral |
| Azure Coast | cove | Shipwreck Cove | shipwreck | beach |
| Azure Coast | isles | Mist Isles | sea-stacks | coral |
| Sunscorch | dunes | Dune Sea | giant-dune | dunes |
| Sunscorch | oasis | Palm Oasis | oasis | dunes |
| Sunscorch | canyon | Red Canyon | mesa | dunes |
| Sunscorch | temple | Buried Temple | pyramid | temple |
| Frostveil | snow | Snowdrift Plains | ice-peak | snow |
| Frostveil | frozen | Frozen Lake | frozen-lake | glacier |
| Frostveil | rime | Rime Forest | ice-forest | snow |
| Frostveil | glacier | Glacier Throne | ice-palace | glacier |
| Ember Peaks | ash | Ash Fields | burnt-grove | ash |
| Ember Peaks | ridge | Obsidian Ridge | obsidian-ridge | caldera |
| Ember Peaks | lavafall | Ember Falls | lava-falls | ash |
| Ember Peaks | caldera | Magma Caldera | volcano | caldera |

## Scale

The map is **structured and dense**: each sub-area is an enclosed room (about 1000 units across, walled by cliffs, tree lines, rivers or shorelines, with gates where routes leave). At the default exploration zoom a phone screen shows about **2 enemies** (spots ~285 units apart), with terrain features in between: rivers with bridges and fords, lakes, cliffs and ridges, forests, roads and trails, ruins, shrines and other set dressing. Zooming out (the overview) shows the whole world.

## Layout contract: `window.WorldLayout` (js/world-layout.js, loaded before world-data.js)

```js
window.WorldLayout = {
  MAP_W, MAP_H,                         // world units
  CAMP: { x, y },
  subareas: {
    [id]: {
      bounds: [x0, y0, x1, y1],         // bounding box
      shape: [[x, y], ...],             // outline polygon of the sub-area's land (for fog, hit tests, painting)
      landmark: { x, y, rx, ry },       // where the landmark is painted; spots stay clear of it
      entry: [x, y],                    // where the hero arrives from the previous sub-area
      boss: [x, y],                     // boss spot
      elites: [[x, y], ...],            // 1 position (2 allowed)
      spots: [[x, y], ...],             // ordinary enemy positions, nearest-to-entry first (4–5)
      poi: [x, y] | null,               // optional spring/cache position
      shop, event, wp, secret: [x, y] | null, // lazy getters (>= 105 from every other node, reachable from entry): Wayside Market, Event, Wayshrine (ring around entry), hidden Sealed Cache (off the trails). Mist Isles has no room for any of them.
    },
  },
  features: [ ... ],                    // painter-defined terrain features (rivers, lakes, cliffs, roads…), for map.js only
  blocked(x, y) -> bool,                // true where the hero can't walk (deep water, cliffs)
};
```

Content code builds `World.nodes` from these positions (ids like `meadow-0`, `meadow-e0`, `meadow-boss`, `meadow-poi`), assigns levels, roles, enemies and drops.

## WP14: waypoints, keys, secrets, scouting

New node types (ids `<sub>-wp`, `<sub>-secret`): `waypoint` (a Wayshrine: lit once via a free visit, then a start position and a fast-travel target) and `secret` (a Sealed Cache, **invisible and untappable until found**; opened with 1 Key). Constants on `World`: `sightRadius(scoutLevel)` = 430 + 150 per level, `secretRadius(scoutLevel)` = 130 + 50 per level, `FOGGED` = `['battle', 'elite']` (bosses, springs, caches, shops, events and shrines are landmarks and never fogged), `MAX_KEYS` = 3, `SCOUT_GOLD` = 6.
Save fields: `waypoints` (sub-area ids), `startAt` (`'camp'` or a sub-area id), `seen` (scouted spot ids), `secrets` (found cache ids), `secretsOpened`. Run field: `keys`.
