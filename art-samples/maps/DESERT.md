# Ashkara: the desert region (second region)

Working name **Ashkara**, "the Sun-Scoured Reach" (slug `ashkara`, tiles in `tiles/ashkara/`). A wide, bright desert drawn in the same round-3 design B as Greenvale (seamless watercolour ground, crisp 3/4-view props with painted shading and a soft drop shadow, light from the upper left, no grid lines, no paths). The mood mixes Egyptian (pylons, obelisks, sphinx, papyrus, scarabs), North African (mud-brick kasbahs, tamarisk, dune seas, salt pans), Arabian (oases, shaduf, bedouin tents, djinn lamps) and Silk Road (caravans, bazaars, rock-cut facades, prayer-flag-free cairns) imagery. Eight sub-areas rise from a harmless dune shore to the region boss gate.

## Region palette (values in `tiles/_gen/desert-lib.mjs`)

| Role | Colours |
|---|---|
| Fine sand | base `#ecd6a0`; washes `#e4c88a #f3e2b4 #dcc080 #f0dca8`; rim `#c9a468` |
| Dune sand | `#e8c98c`; washes `#dcb676 #f1d9a2 #d2aa68 #f4e0b2`; ripple `#b98d52` |
| Hardpan | `#d9bf94`; washes `#cdb083 #e2cca4 #c2a475 #e8d6b4`; cracks `#8f6f48` |
| Reg gravel | `#cdb892`; washes `#bfa87e #d8c6a2 #b39b72 #dfd0b0` |
| Sandstone | slab `#d6b48a`; stone `#f4dcb0 #dcae7c #a97a52`; red `#e8b48a #c47e56 #8c4e36`; ink `#6b4528` |
| Oasis | grass `#b3c57a` (rim `#74914c`); water `#79d0c4`, foam `#f2fffa`, rim `#2f8a98`; palm `#b8d66e #74a84a #3e7a3a` |
| Mud brick / wood | brick `#e2b684 #c58f5c #8e6038`; wood `#b8905c #8a6238 #5a3c20` |
| Accents | linen `#fff6e0`, turquoise `#3fb0ac`, rug red `#d8503a #b02e2e`, gold `#f3c24f`, djinn violet `#a89ae8` |

All ground families share one wash geometry (seed `skel-desert`), so washes continue across family borders and the base tiles stay within about 10% lightness of fine sand (oasis grass is deliberately a little greener and has `oasis-fringe` ramps).

## Region layout

North is up. The route zig-zags up the map like Greenvale; every gate is a sandstone pylon gate or a regional variant of it.

```
        west column                 east column
 N   7 Tomb Approach  --E-->  8 Sun Citadel -> region exit (north edge)
          ^ (N gate)               ^ (borders 5 along a cliff band)
     6 Dust Bazaar   <--W--  5 Red Wadi
          ^ (borders 3 across a wadi)       ^ (N gate)
     3 Singing Erg   --E-->  4 Salt Mirror
          ^ (N gate)               (south shore borders 1 behind a dune wall)
     2 Seven Palms   <--W--  1 Dune Shallows
 S                                Caravan camp (start, south edge)
```

| Gate | From | To | Direction | Border it sits in |
|---|---|---|---|---|
| Caravan arch of bleached ribs | 1 | 2 | west | dune ridge thinning into the first palms |
| Palm-frond gate between two date palms | 2 | 3 | north | oasis grass fringing back into rippled dunes |
| Twin-pillar arch of the singing dune | 3 | 4 | east | last dune slope falling onto the salt crust |
| Salt-block gate | 4 | 5 | north | pan edge rising into red sandstone shelves |
| Rock-cut canyon door | 5 | 6 | west | wadi mouth opening into mud-brick outskirts |
| Bazaar city gate (sandstone pylon gate) | 6 | 7 | north | market streets ending at a ruined avenue |
| Sealed tomb door (pylon gate) | 7 | 8 | east | sphinx avenue leading into the glass desert |
| Golden citadel gate (region exit) | 8 | next region | north | scorched ground at the top edge, in haze |

## Sub-areas

Enemy skull counts rise like Greenvale (1/1/1 up to 3/3/4). Only sub-area 7 is partly inside a structure.

**1. Dune Shallows** (`dune-shallows`). Landmark: a half-buried caravan wagon and a waypoint cairn on the first dune crest. Gate: arch of bleached ribs. Terrain: fine sand, gentle dune ridges, scrub, a few dry pools. Palette shift: pale cream sand, bright sky tint, almost no shade. Signature tiles: dune-scrub clumps, shell and fossil sand, sand drift mounds, small ripple decals, cairn trail, tumbleweed, lizard decal, a bleached whale-rib arch, dry wadi puddle, windsock pole.

**2. Seven Palms** (`seven-palms`). Landmark: the oasis pool ringed by seven date palms with a shaduf. Gate: palm-frond gate. Terrain: oasis grass, turquoise pool, papyrus beds, tamarisk, sand fringe. Palette shift: lush yellow-green, cool turquoise water. Signature tiles: palm grove 2x2, fruiting date palms, pool lotus pads, papyrus stands, mud-brick irrigation ditch, date baskets, shaduf and well variants, wicker fish trap, oleander hedge.

**3. Singing Erg** (`singing-erg`). Landmark: the Singing Dune with wind-chime poles. Gate: twin pillar arch. Terrain: rippled dune sand dominates, tall slip-face ridges, rare dune grass. Palette shift: warm apricot sand with violet lee shadows. Signature tiles: high slip-face ridge autotile, chime poles, buried column tops, dune-shadow bands, sand devils, scarab swarms, bone drifts, half-buried statue head, dune crest cairns.

**4. Salt Mirror** (`salt-mirror`). Landmark: a blinding salt lake with a mirage island. Gate: salt-block gate. Terrain: cracked hardpan, salt crust, shallow brine, mirage shimmer. Palette shift: near-white bleached ground, pink brine, hard cold light. Signature tiles: salt crust ground, brine pools with pink edge, salt pillar formations, mirage reflection overlay, dead trees, sun-bleached skulls, salt-block cairns, abandoned mining carts, glass shards.

**5. Red Wadi** (`red-wadi`). Landmark: a rock-cut facade in the canyon wall (a Petra-like tomb front). Gate: rock-cut canyon door. Terrain: red sandstone shelves, dry river gravel (reg), rock arches, mesas. Palette shift: deep terracotta and ochre with blue shade. Signature tiles: red cliff and strata walls, wadi gravel bed, natural arches, hoodoo spires, rope ladders, cliff dwellings, cave mouths, flash-flood debris, rock-cut stairs.

**6. Dust Bazaar** (`dust-bazaar`). Landmark: a ruined caravanserai with a market court. Gate: bazaar city gate. Terrain: packed earth, mud-brick walls and alleys, shade cloths. Palette shift: dusty brown-rose with saturated cloth colours. Signature tiles: stalls (spice, rug, pottery, lamp), awnings, mud-brick houses and towers, hanging lamps, camel hitching posts, covered well court, caravan wagons, rug merchants, brazier and teapots.

**7. Tomb Approach** (`tomb-approach`; the one sub-area partly inside a structure). Landmark: a sphinx avenue that ends in a pylon entrance hall; the last third of the map is the open-roof entrance hall with columns and braziers. Gate: sealed tomb door. Terrain: paved avenue slabs, sandstone slabs, drifted sand in the hall, painted floor. Palette shift: golden sandstone, lapis and red paint. Signature tiles: sphinx and ram-statue avenues, pylons, papyrus-capital columns, hieroglyph walls, braziers (lit and unlit), sarcophagi, canopic jars, sand-choked stairs, scarab seals, hall roof beams (hanging overlay).

**8. Sun Citadel** (`sun-citadel`). Landmark: a golden citadel with an obelisk court rising out of a glass desert. Gate: the golden citadel gate (region exit). Terrain: scorched glass sand, black basalt, heat haze, bright gold. Palette shift: white-gold light, dark ink-blue shade, obsidian. Signature tiles: fused glass sand, obsidian slabs, gold obelisks, solar discs, mirror panels, heat-distortion overlays, fire bowls, sunfire altar, djinn statues, scorched skeletons.

Whole regions that sit inside structures (an underground tomb world, a ruined palace) are a separate future idea and are not part of this region.
