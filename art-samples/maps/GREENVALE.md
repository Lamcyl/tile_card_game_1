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
