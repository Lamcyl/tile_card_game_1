# Tile Run prototype, seventh version (rules as built)

> **Fifth iteration (progression rework) comes first below; it replaces the sections on units, unit levels, the stage list and the home screen further down.** Everything else (board, tile model, sandwich, evaluate order, tile face, heroes, relics, puzzles, touch fixes) is as described in the older sections.

> **Balanced in the eighth pass: see `TILE_RUN_BALANCE.md`.** It holds the tile power metric, the score tables, the difficulty curve, the economy and the simulator (`prototype/tools/tile-run-balance/`). Every number in the tables below (unit tile numbers, effect sizes, level bonuses, enemy HP, coins, first-clear rewards, hero numbers and unlocks) is superseded by that document and by `CONFIG` in the page; the rules and the layout described here are unchanged. Save key is now `tileRunPrototype.v7`.
>
> *Older note, kept for history:* The fifth iteration is implemented and works end to end (bots clear the origin, a boosted team finishes far cells), but every number in it was a placeholder. The fourth iteration (fixes, hero button, relics, puzzle shrines) was implemented and made to work, but stage numbers, hero and relic strengths, costs and rewards are placeholders. The balance tables below were measured on the third version.

File: `prototype/samples/tile-run.html` (one file, inline CSS/JS, no network, no images, no build step). It replaces the second version (fixed shape list, never-ending runs). All tunables are in the `CONFIG` object at the top of the script. The rules code (CONFIG, tile model, units, `evaluate`, fight and run generation) sits between `/*RULES-START*/` and `/*RULES-END*/` with no DOM access, so the node balance and unit-test scripts load it directly.

# Seventh iteration: Mosaic map and Split team screen

> This section replaces "The map (home screen)" and the Team screen layout of the fifth iteration. The rules (fights, tiles, units, numbers) are untouched; the save key is now `tileRunPrototype.v6` (old saves are not migrated).

## Map: areas and stages

The world is one tiling, 6 units wide and 35 tall, drawn as an SVG on a navy slab (no terrain art any more; the art data was removed). It is cut into **20 areas** (plates). Each area holds **3 or 4 stages**, drawn as pieces of the plate (an L, a bar, a 2x2 block and so on; the piece shapes are the `rows` letter maps in `CONFIG.map.areas`, A = stage 1). 67 stages in all. **Every stage of an area has the same difficulty tier and run length**; the mid-boss rule is as before (runs of 6 or more). The boss trick of each stage is picked from the area's tier with the same seeded rule as the old cells. Regions keep their colour bias (`CONFIG.regions`, each now has a `col` for its piece colour).

The start area (Sunny Meadow) is a wide plate at the bottom. It opens two lanes: Frostreach (blue) on the left, Goldmarch (ochre) on the right, then Duskmoor (purple, left) and Emberfall (red, right) higher up, and the Gloaming Crown (difficulty 10) across the top. Two cross links: both tier 6 areas open from either tier 5 area.

| Area | Region | Tier | Run | Stages |
|---|---|---|---|---|
| Sunny Meadow (start) | Greenvale | 1 | 3 | 3 |
| Brookside | Greenvale | 2 | 4 | 3 |
| Old Mill | Greenvale | 2 | 4 | 4 |
| Rimegate, Silent Pass | Frostreach | 3 | 4 | 4, 3 |
| Saltwell | Goldmarch | 3 | 4 | 3 |
| Glass Ridge | Frostreach | 4 | 5 | 3 |
| Windy Dunes, Amber Mesa | Goldmarch | 4 | 5 | 3, 3 |
| Frozen Spire | Frostreach | 5 | 5 | 3 |
| Lone Terrace | Goldmarch | 5 | 5 | 4 |
| Misty Moor | Duskmoor | 6 | 6 | 4 |
| Cinder Gate | Emberfall | 6 | 6 | 3 |
| Drowned Mere | Duskmoor | 7 | 6 | 3 |
| Ashen Vents | Emberfall | 7 | 6 | 4 |
| Violet Barrow | Duskmoor | 8 | 7 | 4 |
| Molten Crater | Emberfall | 8 | 7 | 3 |
| Grey Fen | Duskmoor | 9 | 7 | 3 |
| Black Forge | Emberfall | 9 | 7 | 3 |
| Gloaming Crown | Duskmoor | 10 | 8 | 4 |

**Unlock rule** (`CONFIG.map`: `openNeed` 3, `endlessAreas` 2): an area is *done* when 3 of its stages are cleared (all of them in a 3-stage area). An area opens when any area in its `from` list is done (both of them for the Crown, `all: true`). Inside an open area the stages go in order: stage n is playable once stage n-1 is cleared (the 4th stage of a 4-stage area is an optional extra for the next areas). Areas next to an open area show as dim plates with a lock (tap one to read what opens it); areas beyond those show only as a faint dotted outline, so the slab grows as the world opens.

Other things that used the old cells, now on stages: starting a run (the run remembers the area and stage), the first-clear reward and marking cleared, tile and rarity odds by tier (`dropFor` with `tierDist(tier)`), the rainbow drop from tier 7, hero unlocks (`heroUnlock` is now 3, 7, 12, 19 stages of 67, the old 2, 5, 9, 14 of 49 rescaled), Endless (opens when 2 areas are done; board choice up to the highest tier cleared, as before). The test helper "Reveal whole map" opens every area and every stage. `window.TR` has `stageInfo`, `mapData`, `stageState`, `shownAreas`, `doneAreaCount`, `clearCell(key)` and `clearArea(id)` (keys are `areaId.index`, for example `l2.0`).

**Home screen:** the slab fills the space between the header and the stage card and scrolls vertically, opening centred on the selected stage. Stage pieces are 46 px or more on a 360 px wide screen. States: cleared (region colour with a tick), playable (region colour outline), selected (white inside, play arrow; plate outlined), locked (dim with a lock), the stage being played (gold ring). No difficulty number is on the pieces. The card shows region and area, "Stage n of m", difficulty (word, pips and number), fights, mid-boss/boss with its trick name (hold the chip's tooltip on desktop for the full text), the first-clear reward, and a big Play button (Replay for cleared, Continue while a run is saved, with Bank and leave). The dock is unchanged.

## Map: branches that rejoin

The world now splits and rejoins so nobody strays far down one branch: Sunny Meadow (d1) splits into two branches (Brookside / Old Mill d2, Rimegate / Saltwell d3), which meet at the join Fairmeet (d4, full width, `all: true`: opens only when BOTH d3 areas are done). Then again: Silent Pass / Windy Dunes (d5), Glass Ridge / Amber Mesa (d6), join Misty Moor (d7), Drowned Mere / Cinder Gate (d8), Violet Barrow / Molten Crater (d9), final join Gloaming Crown (d10). 57 stages (2 per early area, 4 in later branch areas, 5 and 6 in the joins). Lessons (d1 to d5) sit below the first area of each difficulty on each path, below a join for a join. `heroUnlock` is 15 / 25 / 36 stages (rescaled from 18 / 30 / 42 of 67). Old saves' cleared keys no longer match the new area ids.

The map is now light (pale grey-blue slab, white plates with soft shadows; dark mode keeps a dark slab). Each stage tile shows its number in the area and small icons: shield = mid-boss, crown = boss, gold gem = first-clear reward still to take (difficulty stays on the card only). The coin counter is a coin icon; tapping it (or the shard counter in Team) shows a speech bubble that closes on any other tap.

## Team screen: Split with the "A Badge" marker

Header (back, coins, shards), tabs Units / Recruit / Collected / Colourless, then for Units the five colour tabs (owned of 6) and the split: a left rail with the six units of the colour (name, rarity and level, slot dots, mini tiles; a cyan ring for Rare, magenta for Epic; unowned units are dashed, dim and locked) and one big card for the viewed unit (tinted, with a pointer from the rail). The unit in the team carries a solid TEAM badge in the rail and IN TEAM on the card (no star glyphs). The card shows the unit's 3 base tiles (the game's own tile faces), slot sockets (filled with the equipped collected tile, empty, or locked), the effect text and four buttons: Pick for the team, Level up, Loadout and Buy slot. Level up and Buy slot cost **shards** (`gacha.levelShards`, `slotCost`). Tapping a socket or Loadout opens the existing loadout picker (collected tiles of that colour and rainbow tiles, stacks, stars, the rainbow limit). The Units tab fits 360x740 without page scrolling; Recruit, Collected and Colourless are plain panels with the old content and may scroll.

## CONFIG changes

`CONFIG.map` is now `{ w, h, openNeed, endlessAreas, midFrom, areas: [...] }` (each area: `id, name, region, tier, len, x, y, w, h, from, all?, rows`); `radius`, `tiersByDist`, `lenByDist`, `endlessDist` are gone; `regions` lost their name lists and gained `col`; `heroUnlock` rescaled. `CONFIG.endlessUnlock` was already unused.

## Seventh iteration rough spots

- Numbers are not rebalanced: a stage's difficulty and run length are the old values for its tier; 57 stages must be cleared to open the whole world (3 per area), more than before, so progress feels slower than the 49-cell map.
- Area names and region placement are placeholders; the two lanes are mostly independent (two cross links).
- A stage piece is not labelled with its area name; the area name shows on the card after tapping.
- The Units tab card leaves some empty space in the middle on tall phones.

## Eighth iteration: slots, skills, level costs, colourless slots, drag

- **Slots.** Max slots Common 2, Rare 3, Epic 4; every unit starts with 1 open slot. Opening the next slot costs shards (`CONFIG.slotCost` = [0, 8, 16, 30], indexed by the slot being opened). The Loadout and Buy slot buttons are gone: on the big card tap a locked slot (lock + cost) for a confirmation dialog (cost and what you get), tap an open slot to open the slot popup: the unit's slots on top, your collected tiles of that colour plus rainbow below (rainbow limit, stacks and stars unchanged). Drag a tile into a slot, drag a slotted tile back onto the list to take it out; tapping still works as a fallback. Changing the team unit of a colour moves the equipped tiles over in order into the new unit's open slots (the rest return to the collection; the new unit's previous tiles are unequipped when tiles are carried).
- **Skills replace the single effect.** `UNITS[i].skills = [[effectId, unlockLevel], ...]`: 3 for Common and Rare, 4 for Epic. `F.fx` / `run.fx` is now `{ colour: [effect ids] }` (a lone id string is still read as a one-item list, so puzzles keep working) and all active skills of a colour stack in `evaluate`. `CONFIG.fxTier` and the "Works from difficulty 5" text are removed: unlock is by unit level only. Three simple colour-scoped damage skills were added (Sharpened +1, Honed +2, Masterwork +3 on attack tiles); Common units end on Sharpened (level 6), Rare on Honed (level 6), Epic on Masterwork (level 8). Rarer units get the stronger existing effects (Pressure, Heavy Frame, Triple Bread, Rear Guard, Rare-tile and multiplier effects). Each skill has a small inline SVG icon (`skillIcon`, a 3x3 mini board with marks); the big card shows them below the slots (unlocked in colour, locked dim with "Lv N"); tapping one shows its name and text. The fight's unit strip shows the active skills of the selected colour tab. Numbers are placeholders (`CONFIG.fx`), not balanced.
- **Levels** now go to 8 (`CONFIG.lvlMax`, `CONFIG.lvl` tables extended) and cost **coins** (`CONFIG.levelCoins` = 2:10, 3:16, 4:25, 5:38, 6:55, 7:80, 8:115; placeholders). Level up opens a dialog: each base tile before, an arrow, after (real tile faces), any skill unlocked at the new level, the cost and a confirm button. Slots stay on shards.
- **Colourless tiles.** Three slots above the list of owned colourless tiles: drag a tile in to choose it, drag it out to remove it (`CONFIG.maxColourless`); tapping a stack still works. `store.bag` is now an array of up to 3 ids with 0 for an empty slot.
- **Drag animation** (fight board, slot popup, colourless): a lifted copy (scale, shadow) follows the finger offset above it, the target cell or slot highlights under the copy, on drop the copy glides into place and fades, on cancel it glides back. The drop target is still the cell under the drawn copy.
- **Save** key bumped to `tileRunPrototype.v8` (version 8, no migration).

### Skills per unit (unlock level in brackets)

**Common** (max 2 slots)

| Unit | Skills (unit level) |
|---|---|
| Ember | Front Rank (3), Pack Hunter (5), Sharpened (7) |
| Tide | Back Rank (3), Huddle (5), Sharpened (7) |
| Moss | Lone Wolf (3), Flock (5), Sharpened (7) |
| Glint | Good Fuel (3), Front Rank (5), Sharpened (7) |
| Dusk | Wide Reach (3), Palette (5), Sharpened (7) |
| Flare | Edge Guard (3), Underdog (5), Sharpened (7) |
| Scorch | Underdog (3), Front Rank (5), Sharpened (7) |
| Ripple | Huddle (3), Crowded Row (5), Sharpened (7) |
| Brine | True Colours (3), Back Rank (5), Sharpened (7) |
| Fern | Crowded Row (3), Column Strength (5), Sharpened (7) |
| Bramble | Squeeze Play (3), Pressure (5), Sharpened (7) |
| Gleam | Cornerstone (3), Edge Guard (5), Sharpened (7) |
| Amber | Pack Hunter (3), Lone Wolf (5), Sharpened (7) |
| Shade | Charged (3), Good Fuel (5), Sharpened (7) |
| Veil | Tempered (3), Primed (5), Sharpened (7) |

**Rare** (max 3 slots)

| Unit | Skills (unit level) |
|---|---|
| Brand | Heavy Frame (3), Wide Reach (5), Honed (7) |
| Mist | Mixed Company (3), Overdrive (5), Honed (7) |
| Thorn | Palette (3), Heavy Frame (5), Honed (7) |
| Spark | Overdrive (3), Edge Guard (5), Honed (7) |
| Hex | Pressure (3), Squeeze Play (5), Honed (7) |
| Pyre | Line Drive (3), Good Fuel (5), Honed (7) |
| Fjord | Loud Echo (3), Back Rank (5), Honed (7) |
| Willow | Primed (3), Overdrive (5), Honed (7) |
| Sunbeam | Fine Steel (3), Good Fuel (5), Honed (7) |
| Gloom | Column Strength (3), Heavy Frame (5), Honed (7) |

**Epic** (max 4 slots)

| Unit | Skills (unit level) |
|---|---|
| Cinder | Heavy Frame (3), Extra Line (5), Crowded Row (7), Masterwork (8) |
| Drift | Wide Reach (3), Long Arm (5), Loud Echo (7), Masterwork (8) |
| Vale | Mixed Company (3), Flock (5), Huddle (7), Masterwork (8) |
| Dune | Front Rank (3), Triple Bread (5), Good Fuel (7), Masterwork (8) |
| Wisp | Back Rank (3), Rear Guard (5), Pressure (7), Masterwork (8) |

### Eighth iteration rough spots

- Skills and level costs are not balanced; the node tools (`tile-run-balance`) still work but their recipes assume the old level 5 cap and slot counts (journey.js was patched to read coins and 1 starting slot).
- Dragging in lists uses `touch-action:none` on tiles, so a long list scrolls only by touching the gaps between tiles.
- Skill icons are simple placeholders.

# Fifth iteration: progression rework (collectable tiles, units, rainbow, gacha, map)

Implements `TILE_PUZZLE_DESIGN.md` section 14. Save key `tileRunPrototype.v5` (sixth round; old saves are not migrated: a fresh save has the five starter Commons, 60 coins, 0 shards and the origin cell available). New CONFIG keys are listed at the end of this section.

## Units (30): rarity, base tiles, effect, slots

Six units per colour (3 Common, 2 Rare, 1 Epic). One unit per colour is in the team (the colours in play grow with the tier). Each unit has exactly **3 base tiles** (two attackers and a signature tile: boost, multiplier, copy or a big shape), **one passive effect** (one sentence, scoped to the unit's colour, also to a rainbow tile sitting in its slot) and **slots** for collected tiles. Rarity changes the kind of base tiles and the strength of the effect, not just the numbers. Unit level 1 to 5 only raises the numbers of the 3 base tiles (attacks +1 per level, boosts and copies +1 at levels 3 and 5, multipliers +1 at level 5). The old level 5 branches A/B were **dropped** (kept simple). The old stage level cap and the 40 coin unlock were dropped.

| Colour | Unit | Rarity | Base tiles at level 1 (level 5) | Effect | Max slots |
|---|---|---|---|---|---|
| Red | Ember | Common | `a^4 a^3 a<>2` (`a^8 a^7 a<>6`) | Front-row attack tiles of this colour get +1. | 1 |
| Red | Brand | Rare | `a^4 a<>3 a^6#h2` (`a^8 a<>7 a^10#h2`) | Sandwiches on this colour's tiles count one extra line. | 2 |
| Red | Cinder | Epic | `a^7#v2 a<^>4#h2 pudlr2` (`a^11#v2 a<^>8#h2 pudlr4`) | Multi-cell tiles of this colour get +2 per cell. | 3 |
| Blue | Tide | Common | `a^3 a^3 pudlr1` (`a^7 a^7 pudlr3`) | Back-row attack tiles of this colour get +2. | 1 |
| Blue | Mist | Rare | `a^3 a<>3 xu2` (`a^7 a<>7 xu3`) | Attack tiles of this colour get +1 for each differently coloured tile next to them. | 2 |
| Blue | Drift | Epic | `a^6 a<>4#h2 eu2` (`a^10 a<>8#h2 eu4`) | Attack tiles of this colour also hit the column to their right. | 3 |
| Green | Moss | Common | `a^4 a^3 pu2` (`a^8 a^7 pu4`) | Single-cell attack tiles of this colour get +1. | 1 |
| Green | Thorn | Rare | `a^4 a<>3 a^7#v2` (`a^8 a<>7 a^11#v2`) | Attack tiles of this colour get +1 for every colour on the board. | 2 |
| Green | Vale | Epic | `a^5 a<^>3 xudlr2` (`a^9 a<^>7 xudlr3`) | Attack tiles of this colour get +1 for each other tile of this colour on the board. | 3 |
| Yellow | Glint | Common | `a^4 a^3 pR1` (`a^8 a^7 pR3`) | Boost tiles of this colour are +1 stronger. | 1 |
| Yellow | Spark | Rare | `a^4 a<>3 xlr2` (`a^8 a<>7 xlr3`) | Multiplier tiles of this colour are +1 stronger (x2 becomes x3). | 2 |
| Yellow | Dune | Epic | `a^5 a<^>4#h2 pB1` (`a^9 a<^>8#h2 pB3`) | Sandwiches between this colour's tiles triple instead of double. | 3 |
| Purple | Dusk | Common | `a<>3 a^4 a<^>2` (`a<>7 a^8 a<^>6`) | Attack tiles of this colour that hit 2 or more columns get +1. | 1 |
| Purple | Hex | Rare | `a^4 a<>3 eu1` (`a^8 a<>7 eu3`) | Attack tiles of this colour get +3 while they are sandwiched. | 2 |
| Purple | Wisp | Epic | `a^6 a<^>3#h2 pR2` (`a^10 a<^>7#h2 pR4`) | Back-row attack tiles of this colour deal double. | 3 |
Sixth round: 15 units added (rows marked new). Starter team (`CONFIG.starters`): Ember, Tide, Moss, Glint, Dusk. The gacha pool grew with the units (15 Common, 10 Rare, 5 Epic; odds unchanged).

| Colour | Unit (new) | Rarity | Base tiles at level 1 | Effect | Max slots |
|---|---|---|---|---|---|
| Red | Flare | Common | `a^4 a>3 pl2` | Attack tiles in the left or right edge column get +2. | 1 |
| Red | Scorch | Common | `a^3 a^3 pr1` | Attack tiles with a number of 3 or less get +2. | 1 |
| Red | Pyre | Rare | `a^4 a<>3 pR2` | Row, column and cross boost tiles are doubled. | 2 |
| Blue | Ripple | Common | `a^4 a^3 plr1` | Attack tiles get +1 for each tile of this colour touching them. | 1 |
| Blue | Brine | Common | `a<>3 a^4 pd1` | Attack tiles get +2 while no tile of another colour touches them. | 1 |
| Blue | Fjord | Rare | `a^4 a<>3 el2` | Copy tiles get +2. | 2 |
| Green | Fern | Common | `a^4 a<3 pr2` | Attack tiles get +1 for each other tile in their row. | 1 |
| Green | Bramble | Common | `a^4 a^3 pd2` | Attack tiles get +1 for each sandwiched tile on the board. | 1 |
| Green | Willow | Rare | `a^4 a<>3 xd2` | Attack tiles that are multiplied (multiplier tile or x2 cell) get +2 first. | 2 |
| Yellow | Gleam | Common | `a>4 a<3 pu1` | Attack tiles in a corner of the board get +3. | 1 |
| Yellow | Amber | Common | `a^3 a^3 a<>2` | Attack tiles get +1 for every enemy still standing. | 1 |
| Yellow | Sunbeam | Rare | `a^4 a<>3 pC2` | Rare and Epic attack tiles get +3. | 2 |
| Purple | Shade | Common | `a^5 a^2 pd2` | Attack tiles that receive a boost get +2. | 1 |
| Purple | Veil | Common | `a^4 a^3 pr1` | Attack tiles upgraded in the run (number or second colour) get +2 more. | 1 |
| Purple | Gloom | Rare | `a^3 a<^>3 a^5#v2` | Attack tiles get +1 for each other tile in their column. | 2 |

All effects are scoped to the unit's colour (a slotted rainbow tile takes the host colour). Slots start closed and are bought with **shards** (`CONFIG.slotCost` 8, 16, 30; maximum Common 1, Rare 2, Epic 3). Tiles in slots join the bag at run start with the 3 base tiles (bag at most 5 x (3 + 3), plus 3 colourless). Effects are implemented in `evaluate` through `F.fx = { colour: effect id }` (set from the team at fight start), the same way relics use `F.relics`; they show in the live totals and in the card breakdown ("relics and effects"). The effect is shown on the unit card, on the effect line under the fight board for the active colour tab, and in a hold-card on the colour tab. Unit tiles are not gated by the tier any more (the player owns them); only generated loot and picks are.

## Recruiting (gacha), shards, levels

Single pull, `CONFIG.gacha.cost` 30 coins (a new save has 60). Odds: Common 70 %, Rare 24 %, Epic 6 %, each pool shared evenly by its units (shown in Team). Pity: an Epic at the latest on every 20th pull since the last Epic (counter shown). **Shards are one shared pool** (`store.shards`, shown next to coins on Team). A duplicate pull gives shards by rarity (`CONFIG.gacha.shards` 3 / 6 / 12). Shards pay unit levels (any unit; 2: 3, 3: 6, 4: 9, 5: 15) and unit slots (8, 16, 30). **Coins are not used on units** except recruit pulls. Unowned units cannot be picked. Starter team: Ember, Tide, Moss, Glint, Dusk (the Commons).

## Tile families

| Family | Rule |
|---|---|
| Coloured | Normal value; can be bread and filling. Collectable. |
| Colourless | Never part of a sandwich (neither bread nor filling). Numbers are `CONFIG.colourlessFactor` (2) times a coloured tile's (multipliers are not changed since the eighth pass). Max 3 in the bag, as before. |
| Rainbow | "A rainbow tile counts as every colour." Applied literally to the sandwich rule: as bread it matches any colour; as filling between two tiles sharing a colour it is doubled; between two rainbows it is **not** doubled (explicit exception in `sandX`); a two-colour tile between two rainbows is doubled. It also satisfies "2 colours" boss rules. Low numbers, single cell, attack or boost only. It fits any unit's slot (it takes the unit's colour for the colour tab and the unit effect), at most 2 in a team. Source: a rare **boss drop** on far cells (tier 7 or more, 10 to 30 % by distance); it appears as an extra candidate on the keep screen. Look: five hard colour arcs around a navy face, white number, one transform-only sheen (static with `prefers-reduced-motion`). |

## Collecting: keep one after a boss

In-run picks are unchanged (new tile, upgrade, heal) but the new tiles now come from the cell's **drop table** (colour weights, rarity odds, shape odds). After beating a boss (the final boss and the mid-boss of long runs; not Endless) the player may keep **one** coloured tile that was new in this run (or the boss's rainbow drop). Upgrades made in the run are not kept: candidates are shown at base value and the screen says so. Defeat or leaving keeps no tile (coins as before; an earlier mid-boss keep stays). Kept tiles go to a coloured-tile inventory bound to the colour (rainbow: any unit); **three identical tiles merge into one tile of the next star level** (see Stars), like colourless ones. The keep screen shows identical candidates once with a count (x2). Team, "Loadout" per unit puts owned tiles into open slots (tap to put in or take out; a tile sits in one slot only).

## Stars (sixth round)

For both inventories (colourless `store.inv`, collected `store.ct`): `CONFIG.stars = { on, cap: 5, need: 3, bonus: 1 }`. Three identical tiles of one star level merge into one tile of the next (3 copies = 1 star, 9 = 2, 27 = 3, 81 = 4, 243 = 5; 244 = one 5-star plus a spare). Identical = same colour, kind, directions, shape, base number and rarity. So up to 2 spare copies per star level exist; identical entries show as one stack with a "x2" count (inventory, loadout, keep screen, loot lists). Each star adds `bonus` to the number. A copy in a slot or in the colourless bag still counts; the merged tile takes the slot (or bag place) of a consumed slotted copy, a second slotted copy frees its slot. The tile card says "2 of 3 for ★". Rules code: `mergeStars`, `starN`, `starKey`, `starCount`, `groupCands`. In the loadout, tapping a stack slots one copy per tap (taking one out when all copies are already in the unit); in the colourless bag a tap cycles 0 to all copies.

## Heroes (sixth round)

Heroes are not bought. `CONFIG.heroUnlock`: Sora 2, Lumi 5, Brak 9, Tove 14 map cells cleared (Kiri is free). Checked when a stage is cleared for the first time; the cleared screen shows "New hero: Sora (Second Wind)" and locked heroes in the hero panel show "Clear 5 stages (3 / 5)". `heroCost` was removed.

## The map (home screen)

The home screen is a square map around the origin (0,0), 7x7 (`CONFIG.map.radius` 3), x east, y south. Cleared cells are filled, cells adjacent to a cleared one (and the origin at the start) are revealed (dashed until cleared), everything else is blank. The grid shown grows with the revealed area; it scrolls inside its box (centred on the selected cell, no pinch). Cells show **only their art** (no number): cleared = full art with the tick, available = dimmed art with a dashed border, selected = raised; the gold origin marker and the gold current-run outline stay. Difficulty and area appear only on the selected cell's card below the map (name, region, "Difficulty N", distance, board, colours, steps, boss trick, drop table) and a big Play / Replay / Continue button; a quiet row has Puzzles (daily inside), Endless, Hero, Team (units, recruiting, loadouts, collected tiles) and More (settings, help, test helpers). Coins top right.

* **Tier by distance** d = |x| + |y|: d0 tier 1, d1 tier 2, d2 tier 3, d3 tier 4 or 5, d4 tier 6 or 7, d5 tier 8 or 9, d6 tier 10 (the two options at a distance are picked per cell by a position hash). The ten old stage definitions (board, enemy numbers, boss trick, introduced tile kinds) are the ten tiers.
* **Run length** (path choices before the final boss) by distance, with a mid-boss (a weaker boss with a trick from an earlier tier) on runs of 6 or more; each boss gives a keep. Elites at step 2 and, on runs of 6 or more, at length - 2.

| d | tier(s) | steps | cells |
|---|---|---|---|
| 0 | 1 | 3 | 1 |
| 1 | 2 | 4 | 4 |
| 2 | 3 | 4 | 8 |
| 3 | 4, 5 | 5 | 12 |
| 4 | 6, 7 | 6 (mid-boss after step 3) | 12 |
| 5 | 9, 8 | 7 (mid-boss after step 3) | 8 |
| 6 | 10 | 8 (mid-boss after step 4) | 4 |
* **Regions:** Greenvale heartland (d <= 1, green bias) and four directions by the larger of |x|, |y| (ties vertical): Frostreach (north, blue +3, green +1), Goldmarch (east, yellow +3, red +1), Emberfall (south, red +3, purple +1), Duskmoor (west, purple +3, blue +1). Weights are 1 + bias for the colours in play at that tier (so far colours appear only as the board grows). Rarity of picks (Rare / Epic chance by distance): d3 6 %/0, d4 12 %/3 %, d5 20 %/7 %, d6 30 %/12 %, capped by the tier (Rare from tier 5, Epic from tier 8), shape chance 20 % to 45 %. Colourless loot rarity is as before.
* **Seeded:** names (adjective + noun per region, unique on the map), tier choice and boss trick (half the time the tier's own boss, else one of the last four tiers' bosses; the corners are the two-phase final boss) are hashed from the position, so the map is identical every time.
* **Unlocks:** Endless after clearing any cell at distance 2 or more (board choice: any tier up to the highest cleared); puzzles unlock by the highest cleared tier (+1) as before; first clear of each cell pays coins (by tier) and a colourless tile. There is **no** "sandwich on the map" bonus.
* **Art:** each revealed cell shows a 3x3 mosaic of terrain tiles from `art-samples/tiles` (Greenvale grass for the heartland, lake for the north, Ashkara dunes for the east, red wadi clay for the south, firefly marsh for the west; 4 tiles per region, 32 px PNGs inline, about 43 KB). Battle screens stay abstract.

## CONFIG additions

`stars` (`on`, `cap`, `need`, `bonus`), `heroUnlock`, `starters`, `startCoins` (60), `colourlessFactor` (2), `gacha` (`cost`, `odds`, `pity`, `shards` by rarity, `levelShards`), `slotCost` (shards), `slotMax`, `rainbow` (`tier`, `chance`, `maxTeam`), `midBoss` (hp, atk, coin factors), `drop` (`rare`, `epic`, `rainbow`, `shape` arrays by distance), `map` (`radius`, `tiersByDist`, `lenByDist`, `midFrom`, `endlessDist`), `regions` (name, colour bias, name words). Removed: `levelCost`, `unlockCost`, stage `cap`, `heroCost`. `CONFIG.stages` are now the tiers. Rules code additions: `EFFECTS`, `UNITS` (`base`, `rar`, `fx`), `unitBase`, `dropFor`, `genRainbow`, `keepCands` / `applyKeep`, `gachaRoll`, `mapCells` / `cellInfo` / `availableCells`.

## Test helpers (Settings, More)

+100 coins, own all units, +10 shards (shared pool), open all slots, Duplicate a tile (one more copy of the newest colourless and collected tile), +4 coloured tiles, +1 rainbow tile, unlock heroes, reveal the whole map, colourless helpers, per-unit level selectors (0 = not owned), abandon run, reset. `window.TR` adds `keep`, `pull`, `buySlot`, `toggleSlot`, `levelUp`, `addCT`, `cellInfo`, `playCell`, `clearCell`, `revealed`.

## Verification (fifth iteration)

Node checks of the rules block (`evaluate`): 162 checks pass, covering the plain sandwich, a rainbow as bread with each of the five colours (and not doubling a same-colour filling), rainbow filling between same-colour tiles, between rainbow and red, between two rainbows (not doubled), two-colour fillings, rainbow row plus column (x4), a two-wide tile with rainbow row bread and red column bread (x8), colourless never bread or filling, each of the 15 unit effects (with positive and negative cases, host colour for a rainbow in a slot, no effect on colourless), unit levels changing only numbers, 3 tiles per unit, C/R/E per colour, 15 distinct effects. All 15 puzzles and 80 generated daily puzzles still win with their stored solutions. Bot (greedy layout search on the real rules, 20 seeds): starter Commons at level 1 clear the origin cell 19 of 20 times (6.5 attacks per run); a boosted Epic team (level 5 plus slotted tiles) finishes tier 10 (8 steps with a mid-boss) 4 of 6 and tier 7 6 of 6; Rares at level 3 clear tier 5 6 of 6; Commons at level 1 do not clear tier 5 or tier 10 (0 of 6), Commons at level 3 clear tier 3 5 of 6. Playwright at 390x844 and 360x740, light and dark: no console or page errors, no horizontal overflow on map, team, fight, results, puzzles, endless; full touch flow map, select cell, run, picks, mid-boss and boss keep, back on the map with the neighbours revealed, Team, buy slot, loadout, pull (new and duplicate), run showing the slotted tile in the hand; puzzle 1 and the daily solve; Endless starts.

## Sixth round verification

Node (`evaluate` and rules): 4673 checks pass: star merging for 1, 2, 3, 8, 9, 26, 27, 81, 243, 244, 486, 729 copies (cap 5, copy conservation 1 to 243, at most 2 spares per level, identity fields, slotted copy keeps its slot), 30 units (6 per colour, 3/2/1 rarity, 3 base tiles, 30 distinct effects, names and base sets, level-ups change only numbers, starters), every new effect with a positive and a negative case, Long Arm reach lanes, hero unlock table, rainbow cases, all 15 puzzles and 80 dailies. Bot: starters clear the origin 19 of 20; each of the 30 units swapped in still plays. Playwright 390x844 and 360x740 light (home, run with killable enemies and hold previews, keep with grouped candidates, cleared screen with hero line, hero panel, Team with shards, level, slot and pulls incl. a duplicate, loadout with stacks, Long Arm fight) and dark (home, Team): no console or page errors, no horizontal overflow.

## Sixth round rough spots

- New effect numbers are first guesses (Amber's per-enemy bonus and Scorch's +2 on small numbers are probably strong early). Shard prices and amounts are placeholders.
- Heroes unlock only through first clears; the test helper `clearCell` also syncs them.
- The Team screen is long with 30 unit cards (sorted by rarity inside each colour); it is not collapsed.
- Five stars on a small tile are drawn small.

## Fifth iteration rough spots

- Not balanced: unit effects, shard and coin prices, drop rates, run lengths and colourless doubling are first guesses. Commons without levels cannot clear tier 5 or later (by design, to be tuned).
- Level 5 branches and the coin route to levels were removed; slot prices and shard values are flat.
- (fixed in the sixth round) Long Arm now shows in the reach glyph and the board highlight during fights.
- Rainbow tiles are single cell attack or boost only, and only come from boss drops (and the test helper); no Endless keeps.
- Map art is a flat terrain mosaic (no props); the map scrolls inside its box on small phones (no pinch).
- (fixed in the sixth round) identical keep candidates are grouped.

---


# Fourth version reference (superseded where noted above)

## Modes

- **Campaign (main mode): ten short stages.** A stage is 4 path choices (fights, one elite from stage 2, and from stage 3 sometimes a Rest, Treasure or from stage 4 a Forge) then the stage boss. After every won fight you still pick one of three (new tile, upgrade, heal). Beating the boss ends the run: "Stage cleared", loot is banked, the next stage unlocks, and a one-time first-clear reward is paid (coins plus a guaranteed colourless tile, Rare or better from stage 5). Defeat ends the attempt and keeps half the loot. Stages can be replayed (fights are generated). About 5 steps and 6 to 9 attacks per stage for the bots.
- **Endless (separate mode, unlocks after stage 3):** the older never-ending structure on the board, colours, tile types and unit cap of any cleared stage: a boss every 3 steps, enemies grow 10 percent per fight, picks after bosses, banking at any time, best depth recorded.
- Home is the stage list (cleared, current, locked, each with board size, colours, unit cap and what it introduces), Endless, Team, Inventory, Settings. The run is saved (including the current fight and board), so a reload resumes it. Save key `tileRunPrototype.v3`.

## Core rules (unchanged where not mentioned)

- Board: columns x 3 or 4 rows by stage; row 0 is the front (nearest the enemies). Blocked cells and bonus cells (+1, +2, x2) from stage 2. Everything resolves at once.
- Colours are units: one unit per colour, 15 units (3 per colour), five colours, the team uses the first 3 / 4 / 5 colours (red blue green yellow purple) depending on the stage. Units differ only by their kit. Unit level 1 to 5, capped by the stage (a stage uses `min(unit level, stage cap)`); the highest level you may buy is the cap of your furthest unlocked stage (Settings can override).
- Colourless tiles: persisted inventory with rarity and stars, up to 3 in the bag. Tile types a stage has not introduced do not appear in its kits, loot or picks; the team screen shows locked kit tiles with the stage that unlocks them.
- Tiles never run out: a tile used in an attack rests until the fight ends (Settings: every attack). Only hero HP ends a run.
- Fights, Guard (needs 2 different tiles), wide enemies, Runner (leaves after your first attack, kill it for a bonus tile), momentum (win in one attack: +1 to every tile on the next first attack), tile stars (identical looted colourless tile becomes a star, +1, cap 3), rarity (Common, Rare, Epic with a gem), new-tile / upgrade (+2 or a second colour) / heal picks, the Bag view: as in the second version.

## Sandwich (one sentence for the player)

"A tile between two tiles of one other colour is doubled, once for every row and column line it is squeezed on."

- Every bracketed line multiplies by 2 (3 with the Triple Bread relic): a single-cell tile has one row line and one column line, so x2 or x4 at most; a wide tile has one row line and one column line per column, so a two-wide tile can reach x8 (row + two columns) and larger pieces more. The chip shows the total (x2, x4, x8 ...); one pair of gold clamps per bracketed line, centred on that line in the gaps.
- A tile is sandwiched along an axis if the two outer tiles share a colour X and the tile has at least one colour that is not X. A two-colour tile counts as both colours (a blue/green tile between two greens is doubled). A colourless tile is never a colour.
- Multi-cell tiles: each row the tile occupies is a row line and each column it occupies is a column line; a line counts when the cells just beyond both ends of the tile's span on that line belong to two tiles sharing a colour X while the tile has a colour that is not X (rule changed from "once per axis"; no puzzle changed: all 15 stored solutions still win and the number of winning layouts is unchanged).
- Applies to attack, copy and boost tiles; multipliers are not sandwiched.

## Tile model

A tile = cells (shape), number, kind, direction string. Rotations are separate tiles; there is no rotate control. Everything is evaluated simultaneously and deterministically in this order: multipliers and sandwiches are fixed, boosters get their power, boosts are added to attack tiles, attack values are computed, then copies (which never copy another copy).

| Kind | Direction options | Effect |
|---|---|---|
| Attack (a) | lanes: own `^`, left `<`, right `>`; any non-empty combination (7) | Hits those columns relative to each column it covers; a column is hit once, at the full number. |
| Boost (p, +N) | any non-empty subset of the four adjacent directions (u front, d back, l, r), or `R` whole row, `C` whole column, `B` both | Adds N to every attacking tile (attack or copy) in those places, once per tile. |
| Multiplier (x, xN) | same direction options | Multiplies the attacking tiles and boosters there by N. Multipliers do not multiply other multipliers; several multipliers on one tile multiply together. |
| Copy (e, =) | one direction u d l r | Takes the shown (final) number of the tile there (attack value, or booster power; never another copy or a multiplier), adds its own number, hits its own column. |

Value of an attack tile = (number + bonus cell + momentum + boosts) x multipliers x bonus-cell x2 (no cap any more) x sandwich. Old names are special cases (Strike = own lane, Fork = left+right, Plus = adjacent boost in all four directions, Row/Pillar = row/column boost, Double = front multiplier x2, Echo = copy). Multi-cell tiles are polyominoes: 2 cells (h2, v2), 3 cells (bars and the four L-trominoes) and 4 cells (square, bars, four T, S and Z shapes); an attack polyomino hits the lanes of the columns it covers (each top cell contributes its lanes, each column once). Names are in the cards only.

Token notation used in `UNITS` (kit strings): `a^4` attack own-lane 4; `a<>3` fork; `a<^>2` all three lanes; `pudlr2` boost all four neighbours; `pR1` row boost; `xu2` multiplier of the tile in front; `eu1` copy the tile in front plus 1; `#h2`, `#v3`, `#sq`, `#Tu` ... shape suffix.

### Number budget (CONFIG.budget)

Rare, Epic loot and run picks draw from the whole combination space allowed in the stage, with the number set by a budget so wider reach is weaker: attack = base[rarity] (4, 6, 8) x lanePen (1 lane 1.0, 2 lanes 0.72, 3 lanes 0.55) x cellBonus (1, 2, 3, 4 cells: 1.0, 1.35, 1.7, 2.1) x 0.85..1.15; boost = boostBase (1, 2, 3) x dirPen (1 direction 1.0, 2 0.85, 3 0.72, 4 0.62, row/column 0.75, both 0.55); multipliers are x2 (x3 only for a single-direction Epic); copy own number 0 to 2. Multi-cell shapes appear on Rare (45 percent) and Epic (70 percent) loot and on 25 percent of run picks, only once the stage has them.

## Tile face (legend)

Chosen look ("Round five", see TILE_RUN_STYLES.md). The old edge marks (arrowheads, "+"/"x"/"=" pips, bars, brackets, colour symbols in the corner, struck-through value badges) were replaced.

- **Body:** solid rounded tile in the unit colour (five colours plus slate for colourless) with a soft darker bottom edge. Big white number = the CURRENT value; small uppercase name at the bottom (STRIKE, FORK, TRIDENT, BAR, LINE, BLOCK, PLUS, ROW, COL, CROSS, DOUBLE, ECHO; omitted on non-rectangular shapes and under 48 px). Two-colour tile: diagonal split, lower right in the second colour.
- **Boost (+N):** white face, solid colour outline, coloured "+N". **Multiplier (xN):** white face, dashed colour outline, coloured "xN". **Copy:** solid slate (or unit colour), name ECHO.
- **Reach glyph (top left of every tile):** a mini grid of (w+2) x (h+2) cells, the tile's bounding box plus one margin cell all round. Own cells outlined, reached cells lit, the rest faint. Attack: cells in front of the tile's top cells for each lane (forward, left, right). Boost/multiplier: neighbours on the acting sides; row/column/cross variants light the whole row/column edge to edge. Copy: its own attack lane lit plus the copied cell as a ring.
- **Base chip (top right):** a small quiet chip with the base number ("+2" for boosts) shown only when the current value differs. Nothing when unchanged.
- **Sandwich:** gold clamps drawn in the gaps between the sandwiched tile and each squeezing neighbour (left+right for a row, top+bottom for a column, four for x4), plus a navy chip with gold "x2"/"x4" where the name was. Clamps are slim capsules (gap minus 2 px thick, 42 % of a cell long) with a thin navy outline, centred on the shared edge of the bracketed row/column, drawn in a layer above the tiles from board geometry (so no tile can paint over them), de-duplicated when two sandwiched tiles share a gap. The board gap is 8 px.
- Other marks: cyan edge = Rare, magenta glowing edge = Epic; stars (gold) replace the name on merged tiles; small triangle = upgraded this run; gold dotted ring = added this run.
- **Enemies:** navy rounded slab with a small uppercase label (HP, HP . WIDE, GUARD n/need, AEGIS, TWIN, RUNNER, BOSS, 2 COLOURS), big white number (current HP) and the attack value under it. Below it a bar-pill: a red fill (like the hero HP bar) shows the predicted damage against HP, text "19 / 25" (wide enemies show the total only; guard not met: "needs 2"), one text colour. Kill = green pill, green slab outline, check badge; zero damage = empty grey pill.
- **Hero row:** heart, HP bar-pill ("18 / 24"), ability button. The Attack button shows the predicted total. The hand keeps dashed slots where tiles were placed.
- **While a tile is selected, held or dragged**, the board still shows the footprint, the cells it would boost, the columns it hits and the glowing cells that would finish an enemy.

## Stages as built

| # | Name | Board | Colours | Unit cap | Introduces | Boss (trick) |
|---|---|---|---|---|---|---|
| 1 | Dawn Gate | 3x2 | 3 | 1 | forward attacks, Sandwich | plain big body (all three columns) |
| 2 | Meadow | 3x3 | 3 | 1 | side-lane attacks, bonus cells | twin bodies: both must fall in one attack |
| 3 | Grove | 4x3 | 4 (yellow) | 2 | adjacent boosts, Guard, Rest and Treasure | a blocked back cell that moves each turn, next one telegraphed |
| 4 | Marsh | 4x3 | 4 | 2 | multi-lane attacks, Runner, Forge | armoured: needs 3 different tiles |
| 5 | Ridge | 5x3 | 5 (purple) | 3 | row and column boosts, Rare tiles | armour plate: the middle column counts half |
| 6 | Mesa | 5x3 | 5 | 3 | adjacent multipliers | sealed: the whole back row cannot be used |
| 7 | Cavern | 5x4 | 5 | 4 | two-cell tiles | shield: one column is lost each turn, next one telegraphed |
| 8 | Spire | 5x4 | 5 | 4 | copy tiles, three-cell tiles, Epic tiles | back row deals no damage (still boosts) |
| 9 | Vault | 6x4 | 5 | 5 | line multipliers, row+column boosts, four-cell tiles, level 5 branches | needs tiles of 2 or more colours |
| 10 | Crown | 6x4 | 5 | 5 | everything | final boss in two phases: twin bodies, then an armoured body with a moving blocked cell |

First-clear coins 20, 25, 30, 40, 50, 60, 75, 90, 110, 150. Rare loot allowed from stage 5, Epic from stage 8. Tile types unlock by the table; each unit's kit tile is built only when the stage has introduced its type.

## Units (15)

Kit groups are added at unit levels 1, 2, 3 and 4; the two branches are alternatives at level 5. Level 1 is always three forward attackers so a level 1 unit works on stage 1. 3 / 5 / 7 / 9 / 11 tiles per unit.

| Colour | Unit | Style | L1 | adds L2 | adds L3 | adds L4 | Level 5 branches |
|---|---|---|---|---|---|---|---|
| Red | Ember | Wide lanes | `a^4 a^4 a^3` | `a<>3 a^5` | `a<^2 a<^>2` | `a<^>3#h2 a<>4` | A Heavy: `a<^>5#h2 a<^>4`; B Support: `pudlr2 a<^>3#h3` |
| Red | Brand | Big blocks | `a^3 a^4 a^5` | `a^6 a^5` | `xu2 a^6` | `a^6#v2 a^7#h2` | A Heavy: `a^8#sq a^8#v3`; B Support: `a^6#h3 xud2` |
| Red | Cinder | Boosters | `a^3 a^3 a^4` | `pudlr1 pu2` | `pR1 pC1` | `pudlr2 eu1` | A Heavy: `pB1 a^6`; B Support: `pB2 xlr2` |
| Blue | Tide | Side lanes | `a^3 a^3 a^4` | `a<>3 a<>2` | `a<^>2 a<>4` | `a<>3#h2 a^>3` | A Heavy: `a<>5#h2 a<>5`; B Support: `pudlr2 a<>4#h2` |
| Blue | Mist | Multipliers | `a^4 a^3 a^3` | `pudlr1 a<>2` | `xu2 xd2` | `xudlr2 a^6#h2` | A Heavy: `xR2 a^7`; B Support: `xC2 pC2` |
| Blue | Drift | Copies | `a^3 a^4 a^2` | `a<>3 pu1` | `pudlr1 a^5` | `eu1 ed1` | A Heavy: `eu3 el2`; B Support: `eu2 pR2` |
| Green | Moss | Copycat | `a^2 a^3 a^5` | `a<>3 pu1` | `pC1 a^4` | `eu2 ed2` | A Heavy: `eu3 a^7`; B Support: `el2 er2` |
| Green | Thorn | Tall blocks | `a^3 a^3 a^4` | `a^5 a^5` | `pC1 a<>3` | `a^7#v2 a^5#v3` | A Heavy: `a^9#v4 a^6`; B Support: `pC2 a^7#v2` |
| Green | Vale | Neighbours | `a^3 a^4 a^3` | `pu2 pd1` | `xu2 pl1` | `xudlr2 a^6#h2` | A Heavy: `xlr2 xud2`; B Support: `pudlr3 a<^>4` |
| Yellow | Glint | Wide blocks | `a^3 a^4 a^4` | `a<>3 a^6` | `a<^>3 xu2` | `a<^>4#h2 a^8#v2` | A Heavy: `a<^>6#h3 a^6`; B Support: `pR2 a<^>4#h2` |
| Yellow | Spark | Line boosts | `a^3 a^3 a^4` | `pu1 pd1` | `pR1 pC1` | `pR2 pC2` | A Heavy: `pB1 pB2`; B Support: `xR2 a^5` |
| Yellow | Dune | Trident | `a^4 a^3 a^3` | `a<>3 a<>2` | `a<^>3 a<^2` | `a<^>4 a<^>3#h2` | A Heavy: `a<^>5 a<^>5#h2`; B Support: `pudlr2 a<^>4` |
| Purple | Dusk | Left-right | `a^3 a^4 a^3` | `a<>4 pr1` | `xl2 a<^>2` | `xud2 a<>5#h2` | A Heavy: `a<>7 a<^>5#h2`; B Support: `pudlr2 xlr2` |
| Purple | Hex | Blocks | `a^4 a^4 a^2` | `a^6 pu1` | `a<>4 xu2` | `a^7#v2 a^6#h2` | A Heavy: `a^10#sq a<^>5`; B Support: `xudlr2 a^8#h2` |
| Purple | Wisp | Echoes | `a^3 a^3 a^3` | `pu2 a<>3` | `pR1 pC1` | `eu2 pudlr2` | A Heavy: `eu4 el3`; B Support: `er3 pB1` |

Identity per colour: red = wide-lane attackers (Ember), big multi-cell blocks (Brand), boosters (Cinder); blue = side lanes (Tide), multipliers (Mist), copies (Drift); green = copycat (Moss), tall blocks (Thorn), neighbour boosts and multipliers (Vale); yellow = wide blocks (Glint), line boosts (Spark), tridents (Dune); purple = left-right and multipliers (Dusk), blocks (Hex), echoes (Wisp). Units cost 40 coins to unlock (the first of each colour is free); levels cost 30, 70, 120, 200.

## Rarity

Common colourless loot: basic tile types. Rare and Epic: any tile type the stage allows, bigger numbers (budget above), more often multi-cell. Odds [common, rare, epic] (`CONFIG.rarity`, depth shift +3 percent rare per depth): normal fight drop (20 percent of fights) 92 / 7.5 / 0.5; elite (60 percent) 50 / 40 / 10; boss (always) 0 / 75 / 25 (Rare or better); treasure 50 / 38 / 12; runner kill 60 / 34 / 6. Capped by stage (none above Common before stage 5, no Epic before stage 8).

## CONFIG tunables (top of the script)

`maxColourless`, `tileReturn`, `stageSteps`, `endlessEvery`, `endlessUnlock`, `offerTwoChance`, `nodeChance`, `eliteStep`, `eliteChance`, `wideChance`, `guardChance`, `runnerChance`, `blockChance`, `bonusCount`, `bonusTypes`, `growth` (enemy HP x1.10 per fight won), `jitter`, `normal`/`elite`/`boss` multipliers, `coinBase`, `growHeal`, `restHeal`, `deathKeep`, `momentum`, `levelCost`, `unlockCost`, `stars`, `rarity`, `budget`, `pick`, `stages` (name, cols, rows, colours, cap, `hp` per enemy column, `atk`, `heroHp`, coin, boss trick, intro), `firstClear`.

## Balance (node bots on the shared rules block; 40 runs per cell, random teams, units at the stage cap)

Careful (greedy) bot: grows a layout cell by cell choosing the placement with the best gain in useful damage and kills, with randomised restarts and pruning; understands guards, twins, blocked cells, sealed rows and column rules through the real `evaluate`; takes the cheapest fight, rests when hurt, forges, prefers special tiles in picks. Careless bot: 2 to 5 random tiles on random cells, random path and picks. "Cap-1" = the same bot with units one level below the stage cap (not available on stages 1 and 2, cap 1).

| Stage | Hp / atk per column | Careful win at cap | Careful, cap-1 | Careless | Attacks per fight (normal / boss) | HP lost per fight (normal / boss) | Sandwich share of damage | x4 per attack |
|---|---|---|---|---|---|---|---|---|
| 1 | 8 / 3 | 83% | n/a | 0% | 1.2 / 2.9 | 0.8 / 14.0 | 16% | 0.00 |
| 2 | 10 / 3 | 88% | n/a | 0% | 1.1 / 2.3 | 0.2 / 11.8 | 16% | 0.02 |
| 3 | 16 / 4 | 90% | 3% | 0% | 1.1 / 2.1 | 0.4 / 9.9 | 36% | 0.29 |
| 4 | 18 / 4 | 88% | 3% | 0% | 1.2 / 2.0 | 0.8 / 9.3 | 38% | 0.33 |
| 5 | 25 / 6 | 90% | 43% | 0% | 1.2 / 1.8 | 1.4 / 8.8 | 44% | 0.56 |
| 6 | 22 / 5 | 93% | 13% | 0% | 1.0 / 2.3 | 0.3 / 11.8 | 38% | 0.09 |
| 7 | 68 / 7 | 88% | 8% | 0% | 1.2 / 1.8 | 1.7 / 7.6 | 48% | 0.51 |
| 8 | 90 / 8 | 75% | 3% | 0% | 1.4 / 1.5 | 4.4 / 9.5 | 49% | 0.60 |
| 9 | 110 / 9 | 93% | 43% | 0% | 1.2 / 1.2 | 2.7 / 1.4 | 47% | 0.55 |
| 10 | 62 / 7 | 78% | 0% | 0% | 1.0 / 2.9 | 0.1 / 17.5 | 45% | 0.68 |

Steps per attempt: 5 (4 choices and the boss) for nearly every run. Target was about 80 to 90 percent for the careful bot at the cap, clearly lower one cap below, careless clearly lower: met except stage 1 (83), stage 8 (75) and stage 10 (78) are slightly low and stages 5 and 9 cap-1 are still 43 percent (the bot gets strong picks). The careless bot never clears a stage: it dies in the first fights (it loses 10 to 40 HP per fight).

Layout variety (hill-climbed best layout from the whole bag against four 9999-HP dummies, 24 random teams per stage): stage 3, 5, 8 and 10 each give 24 different layouts out of 24 (most common 4 percent). Best layouts hold 10 to 12 sandwiches (51 to 61 percent horizontal), 1.6 to 1.8 x4 tiles, sandwiches are 57 to 62 percent of their damage; from stage 7 on 96 percent of best layouts use a multi-cell tile and 4.6 different tile kinds; the all-attack front row appears in 46 percent of stage 3 layouts and only 4 percent of stage 10 layouts. A naive "fill in order" layout reaches only 24 to 29 percent of the best on early boards and 1 to 5 percent on stages 8 to 10 (multipliers and boosts compound). No single arrangement dominates.

Unit tests (`tests.js`, 34 checks, all pass): row and column sandwich, x4, same-colour/different-outer/colourless cases, two-colour middle and outer cases (including the blue/green between greens bug), multi-cell sandwiches across both axes and the short side, per-axis cap of x4, multiplier stacking and multiplier-not-multiplied, boost then multiply order, copy order (copies sandwiched value, never copies a copy), lane geometry and union of lanes for polyominoes, row/column/cross boosts, Guard sources, dead back row.

## Known rough spots

- Multipliers and boosts compound multiplicatively with sandwiches: the best layouts on stages 8 to 10 reach thousands of damage against 100 to 400 HP per column, so later stages are tuned to the careful bot's typical layouts, not the optimum. A cap or diminishing returns on stacked multipliers is the obvious next knob.
- Stage 9's boss (needs 2 colours) costs the bot almost nothing; stage 10 loses its HP mostly in the boss.
- The bot is not a human: it never fails to find the sandwiches; human clear rates will be lower on stages 5 to 10 and attacks per fight higher.
- Hand tiles for big shapes are scaled into a slot; their arrows are small (34 px kit tiles are readable for single-cell tiles, small for 4-cell pieces).
- Tiny notches appear where polyomino cells join (hairline seams of the border).
- The two-colour split tile text on yellow has low contrast. Enemy HP numbers can touch the attack value on 6-column boards at 360 px (a narrow style shrinks them).
- Endless uses the stage's boss tricks (final boss phases included) with simple scaling; it is not balanced.
- Reload during an attack animation resumes at the state before the attack. Drag on touch was tested with synthetic pointer events.


# Fourth iteration additions

## Fixes

- **Multiplier cap: removed.** Multiplier tiles and x2 bonus cells multiply without a limit (this replaced the `CONFIG.multCap` cap of 4 and its "max" mark); Sandwich multiplies on top. Puzzle 12 was renamed "Stacked Multipliers" (its stored solution still wins; winning layouts 52 -> 54; no other puzzle changed).
- **Big tiles readable everywhere:** multi-cell tiles are drawn at their true shape and proportion in the hand, bag, kit, pick cards and Forge (cell size shrinks only so a 4-long piece stays about 190 px). They wrap in the hand like other tiles and the hand scrolls.
- **Two-colour tile contrast:** white number with a heavy dark outline and shadowed symbols.
- **Enemy HP vs attack number on 6-column boards:** on narrow boards the attack badge sits at the top and the HP at the bottom of the enemy tile, and the label moves to the corner.
- Fixed: multiplier tiles showed "x0" on the board (their live value is not a damage number).
- Not touched: stage 9 boss and Endless balance.

## Heroes (one button)

One hero is chosen on the Home screen (persisted, `store.hero`), the first is owned, the others unlock for coins (`CONFIG.heroCost`: 0, 40, 60, 80, 100, placeholders) or with "Unlock all heroes" in the test panel. The ability is one full-width button under the board: ready, on (tap again to undo) or used. Everything shows in the live totals before attacking and is undone if cancelled.

| Hero | Ability | Notes |
|---|---|---|
| Kiri | Rally: every tile gets +1 on this attack. | toggles on and off |
| Sora | Second Wind: all resting tiles come back now. | undo puts them back to rest (and removes them from the board) |
| Lumi | Prism: tap one placed tile; it counts as every colour on this attack. | targeting state with Cancel; the target is outlined; removing the tile returns to targeting |
| Brak | Overcharge: tap one placed tile; its number is doubled on this attack. | same targeting |
| Tove | Guard: enemies deal no damage after this attack. | toggles on and off |

Once per fight (twice with the Second Chance relic). Hero state is saved with the fight, so a reload resumes it.

## Relics (run perks)

At most `CONFIG.relicMax` (3) per run, run-only. Offered as one of three **after each elite** (campaign stages 2 and up have one elite each) and **after each boss in Endless**; in the campaign the boss ends the stage, so no relic is offered there (an elite-only offer plays best with a 4-step stage). Listed under the board with one line each (long-press for the card) and on the run map. All are in the live totals (the heal one is reported in the info line after the attack).

| Relic | Effect |
|---|---|
| Triple Bread | Sandwiches triple instead of double. |
| Front Line | Attack tiles in the front row get +1. |
| Back Line | Attack tiles in the back row get +2. |
| Hearty | A tile sandwiched in both row and column heals you 2 HP. |
| Full Fork | Forks (left and right attacks) also hit their own column. |
| Palette | Every attack tile gets +1 per different colour on the board. |
| Heavy Hand | Tiles covering 2 or more cells get +3. |
| Lucky Cells | Bonus cells count twice. |
| Second Chance | Your hero ability can be used twice per fight. |
| Head Start | The first attack of each fight has momentum +1. |
| Bright Boost | Boost tiles are +1 stronger. |
| Echo Chamber | Copy tiles get +2. |

Dropped as unclear to show: "the first tile placed each fight is doubled" (order dependent), "boosts also boost boosts", "colourless counts as a colour of your choice".

## Puzzle shrines

A "Puzzles" list on Home (a list, no map): one attack on a fixed board with fixed enemies and a fixed hand, using this game's rules; no hero, relics or bag; every enemy must be defeated; retry is instant (also in the puzzle menu). First solve pays coins (some also a colourless tile), replays pay nothing. A puzzle unlocks when its stage is unlocked (`stage` in the table). Stored solutions (not shown to the player) are used by the tests. All 15 were produced by a script that builds a hidden solution first, sets each enemy's HP to the damage that solution deals to its column, then **brute-forces every placement** (identical tiles interchangeable, leaving tiles unplaced allowed) with the same rules code the game uses.

| # | Name | Stage | Teaches | Free cells, hand | Distinct winning layouts (solver) | Random fills that win (of 3000) |
|---|---|---|---|---|---|---|
| 1 | First Strike | 1 | numbers against HP | 6, 5 | 2 | 1 |
| 2 | Sandwich | 1 | doubling between two colours | 6, 5 | 18 | 34 |
| 3 | Both Ways | 2 | row and column sandwich, x4 | 9, 6 | 14 | 1 |
| 4 | Reach Sideways | 2 | side lanes | 8, 5 | 64 | 2 |
| 5 | Lucky Cells | 2 | bonus cells | 9, 5 | 32 | 3 |
| 6 | Neighbours | 3 | adjacent boosts | 9, 6 | 14 | 0 |
| 7 | Guard Duty | 3 | a guard needs 2 different tiles | 9, 5 | 40 | 4 |
| 8 | Three Lanes | 4 | multi-lane attacks | 9, 6 | 4 | 0 |
| 9 | Two Colours | 4 | a two-colour tile counts as both | 9, 5 | 8 | 2 |
| 10 | Whole Lines | 5 | row and column boosts | 9, 5 | 24 | 2 |
| 11 | Multiply | 6 | multipliers | 9, 5 | 36 | 4 |
| 12 | Stacked Multipliers | 6 | multipliers stack | 9, 5 | 60 | 3 |
| 13 | Two Cells | 7 | multi-cell tiles | 10, 5 | 48 | 7 |
| 14 | Copy That | 8 | copy tiles | 10, 5 | 48 | 0 |
| 15 | Short Side | 8 | sandwich across a big tile's short side | 10, 5 | 8 | 0 |

No puzzle is solved by more than 34 of 3000 random fills (puzzle 2, 1.1 percent), most by 0 to 7. The solution counts are layouts, so symmetric mirror images count separately; some of the counts are higher than "one clever answer" would suggest, which is a tuning task for later (tighter HP slack, decoy tiles, more blocked cells).

**Daily puzzle:** generated from the date (`year*10000+month*100+day`) as the seed with a hidden solution built first (4x3 board, 5 tiles drawn from the tile types of your furthest unlocked stage, minimum stage 3), so it is the same for everyone that day and always solvable; small reward (`CONFIG.dailyCoins`, 15) once per day. Checked by the solver for 5 stage settings x 4 dates (20 puzzles): all solvable (19 to 13 903 layouts), at most 48 of 1500 random fills win, the same seed gives the same puzzle and different days differ.

## CONFIG additions (placeholders)

`relicMax` (3), `heroCost` (0, 40, 60, 80, 100), `puzzleCoins` (10), `dailyCoins` (15). Hero and relic definitions are `HEROES` and `RELICS` in the rules block; puzzles are the `PUZZLES` array between `/*PUZ-START*/` and `/*PUZ-END*/`.

## Fourth iteration rough spots

- Not balanced: enemy numbers were not touched, so heroes, relics and the multiplier cap shift the stage clear rates measured in the third version.
- Relics only appear after elites in the campaign (stage 1 has no elite, so none there).
- Hero Second Wind undo removes the returned tiles from the board; Prism is only visible in totals when it creates or removes a sandwich.
- Puzzle HP is exactly the hidden solution's damage, so some boards accept several layouts; there are no decoy tiles except where the hand has more tiles than needed.
- The daily puzzle uses simple random hands, so some days are easier than others; the date is the device's local date.
- The hand area scrolls when big pieces fill it (4-cell shapes need up to about 190 px).
- Saves from the third version load (same key); new fields are filled with defaults.

## Touch placement (fix, second round)

Root cause of "the tile cannot be placed but the preview shows its value": `renderFight` threw `ReferenceError: CHK is not defined` (the check-badge markup from the mockup was never defined in the game) whenever the live preview predicted a kill. `place()` had already changed the board, then the render died halfway, so the screen kept the old state; it happened mostly on cluttered boards or after several sandwiches because those deal the damage that kills. `CHK` is defined now.

Hardening done at the same time: the drop target is the cell under the dragged piece's first (anchor) cell as drawn by the ghost, and the highlighted footprint is computed by the same `dropOrigin` the drop uses (free cells first; only if no free fit exists does a drop displace other tiles, and the touch log says so); with no footprint at release nothing is placed and the tile visibly returns; per-move work is throttled to one animation frame with cached cell rects; the per-cell previews (`showHold`) are computed a few at a time; the 450 ms long-press timer bails out if any movement was seen or input is pending; pointer capture is taken by the body once a drag starts; all pointer handlers catch exceptions and report them. Earlier snapping of taps and drops in gaps and rounded corners to the nearest cell stays.

Diagnostic: Settings, "Touch log" (off by default, kept in the save) shows the last six input events under the fight screen, e.g. "drag t12 → cell 9 placed", "drag t12 → no cell (x,y)", "cancel: pointercancel", "hold card", "error in pointerup: ...".

### Puzzles and the hero lesson (after the eighth iteration)
- Lesson puzzles live only on the map; each lesson is a small tile on the seam below its area ("?" to do, tick when learned).
- The Puzzles page lists ten new harder puzzles (q01–q10), each unlocked by the map lesson of its mechanic (`need`), plus the daily puzzle. They were generated by `prototype/tools/tile-run-balance/puzgen.js` (a random hidden solution sets the enemy HP; a puzzle is kept only if under about 0.3% of random placements win).
- Hero lesson `h1` "Meet Lumi" is the third lesson before difficulty 3: a one-attack puzzle that can only be won with Lumi's Prism (checked exhaustively). Solving it unlocks Lumi; the other heroes still unlock by stages cleared.

## Ninth iteration (fixes)
- **Final victory:** beating the last stage of the Gloaming Crown shows a gold crown screen, "The world is yours", with stages cleared, units and runs (`store.runs` counts finished runs). Other victories are unchanged (`isFinalCell`).
- **Keep:** choosing a tile to keep opens a Confirm / Back dialog showing the real tile. `CONFIG.keepCount = [1,1,1,2,2,2,2,3,3,3]` (placeholder) sets how many coloured tiles one boss lets you keep by difficulty; with more than one, tiles are toggled and one confirmation covers the set. `applyKeep` accepts an index or an array (the balance tools still pass one index). The count applies per boss reward screen, not once per whole run.
- **Stars:** boosts and multipliers gain `CONFIG.stars.sideBonus = {1:3, 2:2, 3:1, 4:1}` per star by marked sides (row/column/cross lines count as 1); attacks and copies keep +`stars.bonus` (`starBonus`, `starN(n, st, k, d)`).
- **Rainbow tiles** now use the numbers of a normal common coloured single-cell tile (`genRainbow` draws from `genSpec`).
- **Battle UI:** the Sandwich tip strip is gone (puzzle Idea strip stays); unit-skill strip icons are slightly larger; the hero button has a per-hero icon; a tile aimed with Prism is drawn as a rainbow tile.
- **Temporary tiles** carry a small hourglass badge in the top-left corner instead of the yellow dotted ring.
- **Detail popups** are pictorial: size with footprint, a mini board (attack lanes with the enemy row and `-N`, boosts/multipliers with `+N` / `×N` on the affected cells), one short line; enemies show an HP bar, attack and one icon line per trait.
- **Level-up dialog** stays open after a level up, showing the next level; Close returns to the unit screen.

## Tenth iteration (tutorials and feel)
- **Tutorial popups** (`TUTS` in `tile-run.html`, data-driven, 22 topics): a modal with a title, a small animated scene built from the game's real `tileHTML` tiles, one or two lines, "Next" / "Got it". A step engine plays the scene (a finger drags the last tile in, clamps appear, the number pulses and the `×2` chip pops in, enemy bars drop); tap the picture to replay. `prefers-reduced-motion` shows the end state at once. The scene root gets `data-state="end"` when it has finished.
- **Triggers** (seen ids in `store.tut`, one popup at a time, the rest queue): `hold` first fight or puzzle; `colourless` / `rainbow` first such tile in a bag at fight start; `hploss` first time enemies hit the hero; `elite` first elite fight; `keep` first keep screen; `stars` first merge of three tiles; `slots` opening Team with a kept tile and an open slot; `levelling` opening Team with an affordable level up; `endless` first open of Endless; lessons: p02 sandwich, p04 side, p05 bonus, p06 boost, p07 guard, p08 lanes, p11 mult, p13 wide, p14 copy, p15 wide sandwich, h1 hero, p16 skills.
- **Revisit:** Settings (gear) has a "Tutorials" list (seen normal, unseen dimmed, all openable) and a "Show tutorial popups" switch; `?tut=0` in the URL turns popups off for tests. `window.TR.tut(id)`, `TR.tutOpen(id)`, `TR.hints()` are test hooks.
- **Hint dots** (red): dock Team (kept tile fits an open slot, level up affordable, slot unlock affordable), Hero (newly unlocked hero not yet viewed), Puzzles (newly unlocked puzzle not yet opened). In Team the same dots show on colour tabs, rail entries, the empty slot, the locked slot and the Level up button. Dots clear when acted on (`store.ack`: level and slot dots when their dialog is opened, hero dots when the Hero panel opens, puzzle dots when it is started; the equip dot when the slot is filled). Old saves get every currently unlocked hero and puzzle pre-acknowledged.
- **Transitions:** screens fade and slide in (~180 ms), result screens pop in, modals and cards scale-and-fade in and out (a non-interactive fading copy is left behind on close, so nothing waits). All CSS or Web Animations; reduced motion switches them off.
- Rough: the Team dot is lit from the very start (60 starting coins can level a unit); tutorial scenes are stylised, not real rule evaluations; no tutorials yet for runners, boss tricks, shards and recruiting.

## Eleventh iteration (fixes)
- **Skill unlock levels** are now 3, 5, 7 (the Epic's fourth skill stays at 8): `UNITS[].skills`, the Team skill row, the level-up dialog and the table above follow the data.
- **Bag between fights** shows every tile normally; resting (faded) only shows while a fight is on.
- **KO bar**: the enemy bar no longer steps up from zero after the preview; it drops once, smoothly, to its end state.
- **Enemy-type tutorials** fire on the path-choice screen when a type first appears in an offer (`tutOffers` / `enemyTypes`, at most 2 per visit, elite first): `elite`, `boss`, `runner`, `twin`, `aegis`, `boardtrick` (block, shield, plate, sealed, dead row), `colours2`, `guard`, `wideen`. The save keeps `store.seenEn[type] = 1` (seen in an offer); `store.tut[id]` says whether the tutorial was shown. New lesson tutorials: `sandwich2` (p03), `twocol` (p09), `lines` (p10), `multstack` (p12); every lesson in `CONFIG.lessons` now has one (p15 `widesand` already existed).
- **Tutorial scenes** lay out multi-cell tiles correctly (covered cells are hidden under the piece, the piece sits above the grid, the number shows).
- **p09 Two Colours** is redesigned (3x3): a blue/green tile is blue bread in one row sandwich and green bread in a column sandwich. Brute force over all placements: solvable, and not solvable if that tile is replaced by a plain blue or a plain green one.
- **Copy tiles** show an "=" before their number (`=4`), everywhere tiles are drawn.

## Twelfth iteration (phone fixes and test kit)
- **Ghost tiles**: one tracked lifted copy; every drag path (up, cancel, lost capture, new pointerdown, tab hidden / blur, errors, re-render) removes strays, and the glide-back uses `transitionend` with a 320 ms timeout. A 20-drag fast-touch repro left 20 ghosts before and 0 after.
- **Fight fits one screen**: the page does not scroll in a fight (`body.fightmode`). The hand is a fixed-height strip (`--hh`, 78-110 px) that scrolls sideways; tall tiles shrink to fit its height and the board sizes from what is left. A sideways swipe on the hand scrolls the row, an upward or downward move starts a drag; a swipe that moved is never a tap.
- **Slots**: drops outside the fight use the element under the finger, not the tile centre. On the board the anchor cell is now computed from the finger point, so the preview and the drop agree.
- **Test kit**: `prototype/tools/tr-test.js` (see `prototype/tools/README.md`); `node prototype/tools/tr-test.js smoke` is the quick regression pass.

## Tile rarity and collection

- **Rarity stars.** Every coloured tile type (colour + token, e.g. `r|a^4`) has a rarity of 1 to 5 stars from its encyclopedia `score`; cut-offs in `CONFIG.tileStars = [20, 40, 60, 80]` (under 20 = 1 star, 80 and up = 5). `tileStars(t)` / `tokenStars(tok)` (RULES block) read `ENCYC`; a token the encyclopedia lacks takes the nearest number of the same kind, directions and shape, else 1 star. `tools/tile-run-balance/lib.js` loads the ENC block before the rules so the node tools see the same stars. Stars show as a small gold "★3" at the bottom-left of a coloured tile face, in the collection, keep screen, slot popup, tile card and encyclopedia rows.
- **No star-up merging for coloured tiles.** Colourless tiles still merge by threes, but this is now a **level** ("Lv2" on the tile face, "level" in cards and tutorial text), never stars. Saved coloured tiles lose any old star-ups on load.
- **Stage cap.** `CONFIG.dropStarCap = [1,2,2,3,3,4,4,5,5,5]` (placeholder) is the highest rarity a difficulty drops, offers or lets you keep; `genRunTile` and `genRainbow` reroll above it.
- **Collection = owned types.** The collection holds one tile per colour + token (`addCT` ignores a type you own). The run gets the owned keys (`run.owned`); the end-of-run keep screen marks each candidate Owned or New and only New ones can be selected (`applyKeep` enforces it).
- **Unowned first.** The first post-fight tile pick of a run (`genPicks`, first option) is a tile type the player does not own, within the cap (random sampling, then a random unowned encyclopedia tile if sampling fails). Not applied when `run.owned` is absent (balance tools).
- **Filters.** Team > Collected and the slot popup have compact chips: colour (Collected only), kind (Attacks / Boosts / Multipliers / Copies), cells 1-4, rarity 1-5 stars, New (tiles from the last keep) / Equipped (in a slot), plus sort (rarity, name, default). State in `CTF`.

## Battle screen cleanup

- Reach glyph (`glyphSVG`): attack lanes are taken from `reachLanes`/`tileReach` (run on a virtual board the size of the glyph) and lit as an upward ray from every cell with no tile cell above it, so jabs (`a<`, `a>`, `a<^`, `a^>`) are right on 2-4 cell shapes. Row / column / cross boosts and multipliers draw a full line through the square (across the row, down the column, both for the cross) instead of single side cells.
- Battle status is one fixed-height row of small icons under the board (relics with their own icons, hero ability, unit skills, boss tricks). Tap or hold an icon for its card (name and text). The puzzle "Idea" strip stays in puzzles only. The row height is always reserved, so the hero HP bar, colour tabs, hand and buttons never move.
- Enemy slabs: the attack (sword icon) sits on the label line (`HP · sword 4`); slabs are shorter. The "Tap a tile, then a cell" hint is gone from stage fights (puzzles keep it).
- Path-choice and result screens are compacted (offer cards, victory loot / picks as rows, bag panel) to fit 360x740 without scrolling.

## Units from shards, economy and walls (thirteenth iteration)

Save key `tileRunPrototype.v9` (v8 saves are dropped).

**Lessons.** p01 "First Strike" is now one colour only (five red Strikes, a 3x2 board, enemies 5 / 4 / 3 HP = the sums per column), so no sandwich is possible. Teach text: bring every enemy's health to 0; a Strike hits the enemy above its column; tiles in the same column add up. `sol` = [[0,0],[1,3],[2,1],[3,2],[4,5]] (checked with `puzzleFight` / `placeCells` / `puzzleWin`). Sunny Meadow (tier 1) already only generates Strikes (`simpleSpec`, `genSpec`) and sandwiches; two-column "wide" enemies now start at tier 2.

**Fight clipping.** `#fhand` and `#rbar.icons` have inner padding (8/7/4 and 3/6 px) and the hand tiles are 8 px shorter, so the first icon, the selected tile's outline and the hourglass badge are no longer cut. The run-only hourglass is a 13 px badge in the top-right corner inside the tile (the reach glyph keeps the top-left).

**Slot popup drag.** `#modal` tiles have `touch-action:none` and the `pointerdown` handler arms a drag at once there (no 180 ms hold). Lists elsewhere (Team, Collected / Colourless) keep the hold-to-drag and pan scrolling. In the popup a swipe that starts on a tile drags it; scroll the popup by swiping on its empty parts.

**Economy.** `CONFIG.startCoins` 0; the default store has no colourless tiles (they come from runs and puzzles). `levelCoins` about 4x: 2:40, 3:64, 4:100, 5:152, 6:220, 7:320, 8:460. The shared "shards" currency is gone: slots cost coins (`slotCost` [0, 80, 160, 300]). A run pays about 14 to 36 coins, so a level takes 3 to 15 runs.

**Gacha removed** (Recruit tab, pulls, pity, duplicates). Units unlock with their own **unit shards**: `CONFIG.shards.need` = Common 10, Rare 25, Epic 50. The five starters stay owned. The Team rail shows a progress bar ("6 / 10 shards") on locked units; the card shows the bar, where the shards come from, and an Unlock button (enabled when complete; the Team dot lights when a unit is ready). Shards are stored in `store.ushards`.

Implemented sources:
- **Featured units per area** (`CONFIG.map.areas[].feat`, 1 or 2 units of the region's colour). First clear of a stage: 3 shards of its featured unit (stage `idx % feat.length`); a replay: 1 shard of a random featured unit.
- **Elite fights** (stage runs): 1 to 2 shards of a locked unit of a colour in the team (`eliteShards`); kept in full on a banked run, halved (rounded down) after a defeat, like coins.
- **Puzzles page**: each of q01 to q10 gives 5 to 6 shards of a named unit on the first solve (`reward.shards`).

Ideas, not implemented: a daily puzzle shard (rotating through locked units); Endless milestone shards (every 3rd boss depth); a coin "shard exchange" for units of a colour already in the team at a high price (for example 40 coins per Common shard, 100 per Rare, limited per day); guaranteed Rare or Epic shards from each region's final boss; first reaching a hero count; duplicate-free "wanted unit" pick (the player marks one locked unit and elites favour it).

**Relic choice** (after an elite): three cards, each with the relic's battle icon, its name and one line, and a "Take" button; fits 360x740.

**Walls.** `CONFIG.map.areas[].bossHp` multiplies the HP of the boss of every stage of an area: Fairmeet (difficulty 4 join) 1.15, Misty Moor (difficulty 7 join) 1.5, Gloaming Crown (final) 1.6. The mid-boss is not scaled. **Replays** pay the normal run loot plus a bonus (`CONFIG.replay`): 40 % of the stage's first-clear coins, a colourless tile (runner rarity odds) and a unit shard. Rules functions: `clearShards`, `replayReward`, `eliteShards`; `settle` returns `ushards`.

**Journey bots** (`journey.js`) now follow the new economy: no pulls; shards unlock units; coins buy levels and slots by value per coin; first clear and replay rewards as above; after two frontier losses in a row the bot farms 3 replays of cleared stages (nearest tier below), then tries the frontier again. `journeys.js` prints frontier and replay runs/win% per tier. Results, 3 players, 300 runs max, seeds 1 to 3:

skilled (3 of 3 finished, median 146 runs, 26 h):

| tier | frontier runs | frontier win % | replay runs | replay win % |
|---|---|---|---|---|
| 1 | 2 | 100 | 0 | - |
| 2 | 4 | 100 | 0 | - |
| 3 | 4 | 100 | 0 | - |
| 4 (wall x1.15) | 4 | 100 | 0 | - |
| 5 | 8 | 100 | 7 | 100 |
| 6 | 13.3 | 60 | 3 | 78 |
| 7 (wall x1.5) | 8 | 63 | 0 | - |
| 8 | 9 | 89 | 0 | - |
| 9 | 9 | 89 | 45 | 62 |
| 10 (wall x1.6) | 34 | 9 | 0 | - |

casual (1 of 3 finished within 300 runs, 54 h median):

| tier | frontier runs | frontier win % | replay runs | replay win % |
|---|---|---|---|---|
| 1 | 2 | 100 | 0 | - |
| 2 | 4.3 | 92 | 7 | 100 |
| 3 | 10.7 | 38 | 9 | 81 |
| 4 (wall x1.15) | 10.3 | 39 | 11 | 79 |
| 5 | 16.3 | 49 | 6 | 100 |
| 6 | 13.3 | 60 | 16 | 81 |
| 7 (wall x1.5) | 17.7 | 28 | 25 | 37 |
| 8 | 27 | 30 | 14.7 | 36 |
| 9 | 17 | 33 | 27.7 | 28 |
| 10 (wall x1.6) | 19.7 | 5 | 0 | - |

Reading: the x1.6 final wall is clear for both bots (skilled 9 %, casual 5 %); the skilled bot gets through only after about 45 replay runs on tier 9 (levels, slots and tiles bought with replay coins). The x1.5 wall at tier 7 shows as a drop for casual (28 %) and a mild one for skilled (63 %). The x1.15 wall at tier 4 is not visible (skilled 100 %); raise it if a wall is wanted there. The casual bot is weak from tier 3 on with the 4x level prices. Replay win rates are lower than frontier ones only in the late tiers.

**Test kit.** `tr-test.js smoke` now checks that a no-hold touch drag in the slot popup equips the tile and that a locked unit unlocks from shards. Fight screenshots (run-only tile selected, relic screen, Team rail with shard bars): `scratchpad/v18/`.

### More shard sources and fixes (19 November)
- Daily puzzle: first solve of the day gives `CONFIG.dailyShards` (2) shards of the locked unit nearest to its unlock.
- Endless: every `CONFIG.endlessMilestone.every` (3) depths beyond your best ever gives `shards` (4) shards of a locked unit, Rare and Epic first; shown on the run's result screen.
- Drop colours: region colour lean is now gentle (home region green +0.5, other regions +1 for their colour, +0.3 for the neighbour colour), so early drops are spread over the team's colours instead of mostly green.
- Hand strip: 22 px left inset so the first tile is away from the screen edge (the phone's back gesture lives there).
- Enemy HP per column: 8, 14, 22, 32, 47, 80, 180, 190, 220, 175 (a little harder from difficulty 3).
- UI pass (v19): "Team" is now "Tiles" (dock, screen title, hints); heroes are named by `CONFIG.heroWord` / `CONFIG.heroWords` ("Skill" / "Skills"), used for the dock, screen, tutorial, help and result texts (hero character names are no longer shown; the player's own HP reads "HP"). Dock: "More / help" is replaced by a player **Encyclopedia** (all in-game tile types as a collection: owned colours as dots, uncollected as dim silhouettes, filters kind / cells / rarity / Collected / Not collected, "N of M collected", tap for the tile card without scores); the advanced encyclopedia is "Encyclopedia (advanced)" in the gear menu, which also keeps How to play / Tutorials. Coloured tile cards no longer show merge text (colourless ones do). Filled unit slots have no frame. Collected tab uses a greedy cell packer (`packCT`) so mixed tile sizes leave no big gaps. Shard bar label on locked rail entries fits its bar.

## Puzzles page unlock and v1.0 options

- The Puzzles page now has q01..q20 (generated by `prototype/tools/tile-run-balance/puzgen.js`, fixed seeds; q11..q20 add bonus cells, enemy guards, wide tiles and blocked cells to the generator). Each puzzle needs its lesson (`need`) AND the previous puzzle in the list solved; locked rows say "Solve <name> first" or "Learn <lesson> on the map first".
- The top-right gear is gone for players. `?dev=1` in the URL shows it again (test helpers, momentum/tile-return settings, advanced encyclopedia). Players use "Help and options" under the main-screen dock: How to play, Tutorials, tutorial-popup toggle, Reset save (tap twice to confirm).

## Beta 1 must-fix batch (20 November)
- Wording: players see "tutorial" (map tutorial stages, `Tutorial 1 of 2`, "Play the X tutorial on the map first"), the map button says "Play" and a finished tutorial reads "Played". The Guide's old "Tutorials" list is now "Tips". `CONFIG.lessons` and the `L.<area>` keys keep their internal names. "How to play" (header button, run menu, Guide, modal) is gone.
- Boot: the first render now runs at the very end of the script inside a try/catch, so the tutorial queue and hints exist when a resumed screen draws; a run that cannot be drawn is dropped and the home screen shows.
- Attack commit: `attack()` saves the post-attack state before the animation (`run.atk` = `'win'` / `'lose'` / 0); `resume()` finishes a lethal or winning attack, so reloading cannot retry it.
- Save check: `sanitizeStore()` in `load()` validates every store field (fills defaults, drops bad tiles, unknown heroes and slots) and drops a run with missing fields, an unknown stage key or a broken fight.
- Short screens: the fight page scrolls vertically (`#app`), Attack/Clear are sticky at the bottom, cells shrink to 30-34 px when needed. Checked at 740x360, 360x560, 320x480.
- "Bank and leave" asks first (`bankask` dialog; the map button has extra top margin and is smaller).
- Rally: the skill text uses `CONFIG.hero.rally`; the tile breakdown has separate "momentum" and "Rally" rows (`opts.rally`).
- Dev: `DEV` is exactly `dev=1`; all dev `data-act`s (`DEV_ACTS`) and the test setting inputs are ignored without it.

## Beta 1 second batch: new player, polish, robustness (20 November)
- Text: single-column attack cards say "Hits the marked column for N."; second-colour upgrades read "adds a second colour: Purple (counts as Red and Purple for Sandwich)"; the "Both ways" tip describes the row and column.
- Heal pick is greyed out with "You're at full health" when HP is full and another pick exists. The Daily puzzle stays locked until 3 map stages are cleared.
- Fight hint line may use two lines. Result screens are centred vertically. Escape closes the card, popup or encyclopedia.
- Reset save has its own confirm dialog (`reset` then `resetgo`).
- Robustness: a failed save shows a one-time "Couldn't save" note; a `storage` event from another tab shows "changed in another tab" with a Reload button and stops this tab saving; the raw save is copied to `tileRunPrototype.v9.bak` on every page load; `commitRun` pays a run once (`run.committed`); the Daily puzzle pays only for a date newer than `store.dailyLast`; the coin pill shows 12.3k / 4.5M.
- Not done in this batch: after-tutorial "Next" home card, first-run tip strip and soft first fight, hourglass/shard tips, solved-board backdrop, map card cap on 360x640, slot-popup filter row, tablet scaling, old-save migration, Endless stage-count text.

## Beta 1 third batch: new-player flow and UI (20 November)
- After both tutorials of an area are played, the home card of its tutorial node reads "Next: <area> - Stage N" with a Play button (`lessonplay`); the node pulses three times once (`S.pulseKey`, class `npulse`).
- First run: a 3-step tip strip on the path screen (Your Bag, Loot after each fight, Bank to keep loot; `store.strip` 0..3, only with tutorials on). The very first fight of Sunny Meadow stage 1 is soft (enemy attack 1). The "Losing HP" tip now opens at fight start, before the first attack. New tips: `runonly` (hourglass tile in the bag) and `shards` (first `shardLine`). The colourless tip already fired from `tutHand`; colourless tiles never get clamps (`sandX` needs colours) - checked with a screenshot.
- Puzzle "Solved" shows the solved board shrunk (`.sbg`) behind the card. The home info card is capped (126 px) on screens under 680 px tall, its text scrolls. The slot popup filters are one sideways-scrolling chip row (`ctFilterHTML(false, true)`). Collected sort uses the id as the final tie-break. The tile card title guards against an unknown rarity (the "undefined Red Strike" title could only come from `RARITY[t.rar]` with an out-of-range `rar`).
- Tablet (width 600+): `#app` max 640 px, cells up to 110 px, the Attack bar stays at the bottom (checked at 820x1180).
- Save: `.bak` is now only replaced by a save with progress; a save of another version `v` is copied to `.old` before the fresh default replaces it. No migration (older keys are separate).
