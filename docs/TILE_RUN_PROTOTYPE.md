# Tile Run prototype, fourth version (rules as built)

> **Not balanced yet.** The fourth iteration (fixes, hero button, relics, puzzle shrines) was implemented and made to work, but stage numbers, hero and relic strengths, costs and rewards are placeholders. The balance tables below were measured on the third version.

File: `prototype/samples/tile-run.html` (one file, inline CSS/JS, no network, no images, no build step). It replaces the second version (fixed shape list, never-ending runs). All tunables are in the `CONFIG` object at the top of the script. The rules code (CONFIG, tile model, units, `evaluate`, fight and run generation) sits between `/*RULES-START*/` and `/*RULES-END*/` with no DOM access, so the node balance and unit-test scripts load it directly.

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
