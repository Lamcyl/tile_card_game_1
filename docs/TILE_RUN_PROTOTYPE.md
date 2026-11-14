# Tile Run prototype, third version (rules as built)

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

"A tile between two tiles of one other colour is doubled, once for its row and once for its column."

- A row sandwich and a column sandwich on the same tile multiply: x4 (chip shows x2 or x4; gold brackets on the outer tiles).
- A tile is sandwiched along an axis if the two outer tiles share a colour X and the tile has at least one colour that is not X. A two-colour tile counts as both colours (a blue/green tile between two greens is doubled). A colourless tile is never a colour.
- Multi-cell tiles: for each axis it is enough that ONE line through the tile on that axis has matching outer tiles at both ends of the tile's span in that line (so a wide tile can be sandwiched from above and below through either of its columns, as well as from its left and right ends). Each axis counts at most once: max x4.
- Applies to attack, copy and boost tiles; multipliers are not sandwiched.

## Tile model

A tile = cells (shape), number, kind, direction string. Rotations are separate tiles; there is no rotate control. Everything is evaluated simultaneously and deterministically in this order: multipliers and sandwiches are fixed, boosters get their power, boosts are added to attack tiles, attack values are computed, then copies (which never copy another copy).

| Kind | Direction options | Effect |
|---|---|---|
| Attack (a) | lanes: own `^`, left `<`, right `>`; any non-empty combination (7) | Hits those columns relative to each column it covers; a column is hit once, at the full number. |
| Boost (p, +N) | any non-empty subset of the four adjacent directions (u front, d back, l, r), or `R` whole row, `C` whole column, `B` both | Adds N to every attacking tile (attack or copy) in those places, once per tile. |
| Multiplier (x, xN) | same direction options | Multiplies the attacking tiles and boosters there by N. Multipliers do not multiply other multipliers; several multipliers on one tile multiply together. |
| Copy (e, =) | one direction u d l r | Takes the shown (final) number of the tile there (attack value, or booster power; never another copy or a multiplier), adds its own number, hits its own column. |

Value of an attack tile = (number + bonus cell + momentum + boosts) x multipliers x bonus-cell x2 x sandwich. Old names are special cases (Strike = own lane, Fork = left+right, Plus = adjacent boost in all four directions, Row/Pillar = row/column boost, Double = front multiplier x2, Echo = copy). Multi-cell tiles are polyominoes: 2 cells (h2, v2), 3 cells (bars and the four L-trominoes) and 4 cells (square, bars, four T, S and Z shapes); an attack polyomino hits the lanes of the columns it covers (each top cell contributes its lanes, each column once). Names are in the cards only.

Token notation used in `UNITS` (kit strings): `a^4` attack own-lane 4; `a<>3` fork; `a<^>2` all three lanes; `pudlr2` boost all four neighbours; `pR1` row boost; `xu2` multiplier of the tile in front; `eu1` copy the tile in front plus 1; `#h2`, `#v3`, `#sq`, `#Tu` ... shape suffix.

### Number budget (CONFIG.budget)

Rare, Epic loot and run picks draw from the whole combination space allowed in the stage, with the number set by a budget so wider reach is weaker: attack = base[rarity] (4, 6, 8) x lanePen (1 lane 1.0, 2 lanes 0.72, 3 lanes 0.55) x cellBonus (1, 2, 3, 4 cells: 1.0, 1.35, 1.7, 2.1) x 0.85..1.15; boost = boostBase (1, 2, 3) x dirPen (1 direction 1.0, 2 0.85, 3 0.72, 4 0.62, row/column 0.75, both 0.55); multipliers are x2 (x3 only for a single-direction Epic); copy own number 0 to 2. Multi-cell shapes appear on Rare (45 percent) and Epic (70 percent) loot and on 25 percent of run picks, only once the stage has them.

## Tile face: edge marks (legend)

What a tile does is drawn on its edges, pointing where it acts, so the face is the diagram. Colour symbol bottom right (two symbols for a two-colour tile, split body); big number in the middle.

- **Attack lanes:** bold white arrowheads on the top edge, one per lane it hits: up-left, up, up-right. Multi-cell tiles show them on each top cell.
- **Boost (+N):** solid coloured outline body with "+" dots on each edge facing a tile it boosts; a bar across the tile with "+" dots at both ends means the whole row, a vertical bar the whole column, both bars both.
- **Multiplier (xN):** dashed outline body with "x" dots (dashed circles), bars dashed.
- **Copy (=):** filled body, an "=" dot on the edge of the tile it copies from, plus the up arrow (it attacks its own column).
- **Multi-cell tiles** are drawn as one piece in their true shape.
- Badges: small boxed number = the tile's base number when the live value differs (big number is the current value); x2 / x4 chip = sandwich; gold brackets on the outer tiles; gem = Rare (cyan) or Epic (magenta, glowing); stars; triangle = upgraded this run; gold dotted ring = added this run.
- **While a tile is selected, held or dragged**, the board also shows the footprint (dark outline), the cells it would boost, multiply or copy (green), and the enemy columns it would hit (gold frame), in addition to the damage preview and glowing finish cells.

Alternatives considered: (1) the old corner 3x3 mini-grid (rejected by the owner: its lit squares read as size and attack at once and do not scale to polyominoes); (2) text labels such as "STRIKE" or "FORK" (they need memorising, take space at 34 px, and do not describe 7 lane x 4 direction x 11 shape combinations); (3) edge arrows (chosen: the mark sits exactly where the effect goes, it scales with the tile, works for any shape and reads at 34 px for single-cell tiles; the compact hand and kit tiles draw big pieces scaled into one slot); (4) a reach overlay only on hold (kept as a complement, not a replacement: it shows the exact cells but only while holding, and a placed or resting tile would be unreadable).

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
