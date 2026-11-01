# Greenvale: the starting region

A gentle, green, Japanese-flavoured countryside, drawn in round-3 design B (seamless watercolour ground, crisp 3/4-view props and creatures with soft painted shading and a soft drop shadow, no grid lines, no paths). Palette: moss and fresh greens, indigo water and roofs, ochre earth and pasture, faded rose blossoms, vermilion torii and accents. Eight sub-areas rise from a nearly harmless meadow to the region boss gate; each mockup is a 390x700 phone screen (7x12 tiles) with the hero, four lit step tiles, three enemies with skull pips, points of interest, fog at the unexplored edges and the sub-area boss standing beside (never in front of) its gate. Generator: `/tmp/gen3/gv.mjs` + `gv_lib.mjs`.

Enemy skulls per sub-area: 1/1/1, 1/1/2, 1/2/2, 2/2/2, 2/2/3, 2/3/3, 3/3/3, 3/3/4. Boss skulls: 2, 3, 3, 4, 4, 4, 5, 5.

| # | Sub-area (file) | Landmark and gate | Terrain | Enemies (unit art) | Boss | Points of interest |
|---|---|---|---|---|---|---|
| 1 | Sunny Meadows (`greenvale-1-sunny-meadows`) | Lone blossom tree; wooden farm gate with a flower arch | Rolling wildflower grass, small pond, round oaks and blossom trees | kamaitachi, hitotsume-kozo, domovoi | tanuki | chest, shop |
| 2 | Old Oak Wood (`greenvale-2-old-oak-wood`) | Giant sacred oak with shimenawa rope; door in a hollow trunk | Dense oak forest, dappled light, mossy rocks | kodama, leshy, jangsan-beom | tengu | torii waypoint, chest |
| 3 | Bamboo Valley (`greenvale-3-bamboo-valley`) | Plank bridge over the stream; thatched hut gate | Bamboo groves on both banks, a stream band across the map | yutu, kasa-obake, dalgyal-gwisin | jorogumo | event stone lantern, chest |
| 4 | Mirror Lake (`greenvale-4-mirror-lake`) | Vermilion torii standing in the lake with its reflection; jetty; boathouse gate | Large lake with lilies and reeds, willows and oaks on the shore | kappa, siren, rusalka | imugi | chest at the jetty end, shop |
| 5 | Rice Terraces (`greenvale-5-rice-terraces`) | Waterwheel and flume; white storehouse (kura) gate | Stepped flooded paddies, earth banks, a water channel, maple accents | kitsune, dokkaebi, shanxiao | bulgasari | torii waypoint, shop |
| 6 | Mossy Ruins (`greenvale-6-mossy-ruins`) | Broken moss-covered torii and glowing stone lanterns; ruined archway gate | Crumbled shrine walls, pillars, cedars and pines, low mist | chochin-obake, jiangshi, ushabti | gashadokuro | event lantern, chest |
| 7 | Firefly Marsh (`greenvale-7-firefly-marsh`) | Boardwalk islands with fireflies at dusk; stilt-hut gate | Murky wetland, lily pads, reeds, willows, indigo-rose dusk light | rokurokubi, mul-gwisin, kikimora | orochi | jizo shrine, event lantern, chest |
| 8 | Misty Highlands (`greenvale-8-misty-highlands`) | Standing stones with shimenawa; grey stone mountain gate (region exit) | Ochre rocky pasture, grey cliffs, cedars, drifting mist | oni, qiongqi, haetae | raijin | torii waypoint, chest |

Preview all eight: `node art-samples/build-boards.mjs greenvale` writes `art-samples/greenvale-gallery.html`.

## Region map (stitched draft)

`maps/greenvale-region.svg` (2006 x 3231 px) joins the eight sub-areas on one shared 36 x 58 tile grid (tiles about 55.7 px, so a 390 px phone screen shows 7 tiles across and about 12.5 down). Each sub-area is an organic, irregular patch of roughly 190-270 tiles (1.5-3 screens), with wobbly borders that follow terrain. Terrain is painted as one seamless wash; the dashed outlines and brushed name labels are review aids only. Viewer with pan/zoom and a jump button per sub-area: `art-samples/greenvale-region.html`. Generator (not committed): `/tmp/gen3/gvr.mjs` plus `gvr_core.mjs`, `gvr_contour.mjs`, reusing `gv_lib.mjs`. Mockup only, not wired into `prototype/`.

Layout (north is up). The route snakes up the map in a zig-zag, west then east in turn:

```
        west column               east column
 N   7 Firefly Marsh  --E-->  8 Misty Highlands -> region exit (north edge)
          ^ (N gate)               ^ (borders 5 along a cliff line)
     6 Mossy Ruins   <--W--  5 Rice Terraces
          ^ (borders 3 along a cliff line)   ^ (N gate)
     3 Bamboo Valley  --E-->  4 Mirror Lake
          ^ (N gate)               (south shore borders 1 behind a tree line)
     2 Old Oak Wood   <--W--  1 Sunny Meadows
 S                                  Camp (start, south edge)
```

| Gate (boss beside it) | From | To | Direction | Border it sits in |
|---|---|---|---|---|
| Farm gate with flower arch (tanuki) | 1 Sunny Meadows | 2 Old Oak Wood | west | Tree line: meadow grass thins into oaks |
| Hollow-oak door (tengu) | 2 Old Oak Wood | 3 Bamboo Valley | north | Oak edge turning into bamboo groves |
| Hut gate past the plank bridge (jorogumo) | 3 Bamboo Valley | 4 Mirror Lake | east | Stream mouth; the stream from the valley feeds the lake |
| Boathouse gate (imugi) | 4 Mirror Lake | 5 Rice Terraces | north | Lake shore climbing into earth banks and paddies |
| Kura storehouse gate (bulgasari) | 5 Rice Terraces | 6 Mossy Ruins | west | Terrace banks turning into mossy shrine walls |
| Ruined archway (gashadokuro) | 6 Mossy Ruins | 7 Firefly Marsh | north | Wet edge: murky pools, reeds, dusk light begins |
| Stilt-hut gate (orochi) | 7 Firefly Marsh | 8 Misty Highlands | east | Boardwalk end; wet ground rising into rock and cliffs |
| Stone mountain gate (raijin) | 8 Misty Highlands | next region | north | Region exit at the top edge, in fog |

Neighbours that touch without a gate are walled off by terrain: 1/4 by a tree line along the lake's south shore, 3/6 and 5/8 by cliff bands, 7/8 by rock. The route inside each area is a 2-3 tile wide walkable lane (no painted path); enemies stand on or beside it, spread along the route in the order normal, normal, ..., elite, boss.

Per sub-area: 5 normal enemies, 1 elite (gold ring, one skull more than the strongest normal) and the boss (red ring, standing beside its gate), 7 each, 56 in total. The three creatures named in the table above are kept; the extra normals and the elites are new picks from existing unit art.

| # | Normals (skulls) | Elite | Boss |
|---|---|---|---|
| 1 | kamaitachi, hitotsume-kozo, domovoi, bakeneko, kamaitachi (1,1,1,1,1) | komainu (2) | tanuki (2) |
| 2 | kodama, leshy, jangsan-beom, jangseung, baku (1,1,1,1,2) | sansin (3) | tengu (3) |
| 3 | yutu, kasa-obake, dalgyal-gwisin, baize, nurikabe (1,1,2,2,2) | baihu (3) | jorogumo (3) |
| 4 | kappa, siren, rusalka, jingwei, cheonyeo-gwisin (2,2,2,2,2) | vodyanoy (3) | imugi (4) |
| 5 | kitsune, dokkaebi, shanxiao, bulgae, inmyeonjo (2,2,2,2,3) | gumiho (4) | bulgasari (4) |
| 6 | chochin-obake, jiangshi, ushabti, mummy, upyr (2,2,3,3,3) | anubis (4) | gashadokuro (4) |
| 7 | rokurokubi, mul-gwisin, kikimora, likho, strzyga (3,3,3,3,3) | hydra (4) | orochi (5) |
| 8 | oni, qiongqi, haetae, komainu, hundun (3,3,3,3,4) | taotie (5) | raijin (5) |

Points of interest: the camp (two tents, fire, hero) at the south edge; per area as in the table above, plus an event lantern and shop at Mirror Lake's north shore, and secret caches (a stone slab with a sparkle, in a tucked-away nook off the route) in Old Oak Wood, Firefly Marsh and Misty Highlands.
