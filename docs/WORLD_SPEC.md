# World spec (v3: large, sparse free-exploration map)

Shared contract between the world **content** (js/world-data.js, items, enemies, balance) and the world **layout + painting** (js/world-layout.js, js/map.js).

## Regions and sub-areas

Five regions, four sub-areas each (20). Every sub-area has its own boss and **6–7 enemies including the boss** (typically 4–5 normal, 1 elite, 1 boss), plus 0–1 free point of interest (healing spring or supply cache). In each region the sub-areas unlock in the order listed (each boss unlocks the next). Lake's boss unlocks both Azure Coast (beach) and Sunscorch (dunes); Mist Isles' boss unlocks Frostveil (snow); Buried Temple's boss unlocks Ember Peaks (ash).

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

The map is **much larger and sparse**: at the default exploration zoom, one phone screen shows only **1–2 enemies**. Spots are spaced widely (roughly a screen apart), with terrain features in between: rivers with bridges and fords, lakes, cliffs and ridges, forests, roads and trails, ruins, shrines and other set dressing. Zooming out (the overview) shows the whole world.

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
    },
  },
  features: [ ... ],                    // painter-defined terrain features (rivers, lakes, cliffs, roads…), for map.js only
  blocked(x, y) -> bool,                // true where the hero can't walk (deep water, cliffs)
};
```

Content code builds `World.nodes` from these positions (ids like `meadow-0`, `meadow-e0`, `meadow-boss`, `meadow-poi`), assigns levels, roles, enemies and drops.
