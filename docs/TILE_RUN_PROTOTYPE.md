# Tile Run prototype, second version (rules as built)

File: `prototype/samples/tile-run.html` (one file, inline CSS/JS, no network, no images, no build step). This replaces the first run prototype (per-unit reactions, depleting bag, boss replenish, Melds/Wheel/enemy colours). All tunables are in the `CONFIG` object at the top of the script. The rules code (CONFIG, shapes, units, `evaluate`, fight and run generation) sits between `/*RULES-START*/` and `/*RULES-END*/` with no DOM access, so a node script can load it (the balance scripts do).

## Core rules

- **Board.** 3 rows of player cells, 3 / 4 / 5 columns in Area 1 / 2 / 3. Row 0 is the front (nearest the enemies). Some cells are blocked, some are bonus cells (+1, +2, x2). Everything resolves at once.
- **Sandwich is the only reaction.** A tile directly between two tiles of one other colour, in a row or column, is doubled. Brackets on the two outer tiles, an outline and an "x2" chip on the doubled tile; included in the live totals and the card. A two-colour tile counts as both colours (as an outer tile either colour may match; as the middle tile both of its colours must differ from the outer colour). A colourless tile is never a colour. It applies to attacking tiles and boosters, not to Doubles. A Giant is sandwiched along its long side only. One sentence is always shown in a strip under the board.
- **Units are colours.** Five colours (red circle, blue triangle, green square, yellow diamond, purple hexagon), a team is one unit per colour. Units differ only by their kit (below). No unit effects, no reaction bar.
- **Colourless tiles** (grey ring) live in a persisted inventory with rarity and stars. Up to `CONFIG.maxColourless` (3) go into the bag before a run.
- **Tiles never run out.** `CONFIG.tileReturn = 'fight'` (default): a tile used in an attack rests (faded in the hand) until the fight ends, then the whole bag is back. `'turn'`: every tile is available every attack. Settings has a switch. If every tile is resting the whole bag returns at once ("regroup"). There is no bag-empty defeat, no replenish; a run ends by hero HP or by banking.
- **Fights.** Enemies sit above columns with HP and an attack. Place any number of tiles, press Attack: each enemy takes its column totals, HP persists between attacks, surviving enemies hit the hero. A fight is won when every enemy is dead or gone. Enemy kinds: plain, Guard (needs 2 different tiles to hit it in one attack), wide (2 columns, one HP pool), Runner (below), boss bodies (below).
- **Live feedback.** While a tile is held (tap-selected or dragged), every empty cell where it fits shows the enemy total it would produce and cells that would finish an enemy glow. Enemies show predicted damage on the HP bar and in a pill.
- **Runner.** Leaves after your first attack if still alive (it does not hit). Killing it gives a bonus colourless tile (rarity table "runner").
- **Momentum.** Winning a fight in one attack gives +`CONFIG.momentum.bonus` to every tile for the next fight's first attack. Toggle and value in Settings; gold badge in the fight header, map and result screen.
- **Save.** `localStorage` (key `tileRunPrototype.v2`) in try/catch; works without it. The run itself is saved (bag, upgrades, offers, pending choice, current fight and board), so a reload resumes it.

## Tile shapes

Each tile has a number, a shape (glyph on the tile shows the reach), a colour (symbol) and optionally a second colour (split tile).

| Shape | Kind | Effect |
|---|---|---|
| Strike | attack | its own column |
| Fork | attack | both neighbouring columns, not its own |
| Plus | booster | adds its number to each attacking tile touching it |
| Row | booster | adds its number to every attacking tile in its row |
| Double | modifier | doubles the tile in front of it (row above) |
| Diagonal (sig) | attack | diagonally ahead: front row = own column, one row back = columns one left and right, two back = two left and right |
| Sweep (sig) | attack | own column in full, both neighbouring columns for half (rounded up) |
| Pillar (sig) | booster | adds its number to every attacking tile in its column |
| Echo (sig) | attack | copies the shown number of the tile in front, adds its own number, hits its own column |
| Giant wide (sig) | attack | one tile on two cells side by side, hits both columns it covers, each for the full number |
| Giant tall (sig) | attack | one huge tile on two cells, one behind the other, hits its column once |

A booster touching a Giant (on either cell) adds once. Bonus cells under a Giant both apply. Values are (number + bonus cell + momentum + boosters) x Double x bonus-cell x2 x sandwich.

## Units (13), levels 1 to 5

Level 1 and 2: basic shapes. Level 3: the unit's signature shape (outlined in gold in the team screen, drawn on the glyph). Level 4: a stronger tile. Level 5: choose branch A (Heavy: big Strikes, and a bigger signature tile) or B (Support: boosters and a second signature tile or support tile). The choice is saved and can be changed in Settings. Tiles per unit: 3 / 5 / 7 / 8 / 10; a full level 1 team bag is 15 tiles, level 5 is 50.

S = Strike, F = Fork, P = Plus, R = Row, D = Double (x), X = Diagonal, W = Sweep, L = Pillar, E = Echo (own bonus), G = Giant wide, V = Giant tall.

| Colour | Unit | Signature | L1 | adds L2 | adds L3 | adds L4 | Level 5 branches |
|---|---|---|---|---|---|---|---|
| Red | Ember | Giant (wide) | S3 S4 S4 | F3 S5 | G5 P1 | S6 | A Heavy: S7 G7; B Support: P2 G6 |
| Red | Brand | Sweep | S2 S3 S4 | P1 P2 | W4 S4 | S5 | A Heavy: S6 W6; B Support: P2 W5 |
| Red | Cinder | Giant (tall) | S3 S4 S5 | F3 S6 | V8 F4 | S7 | A Heavy: S8 V11; B Support: P2 V9 |
| Blue | Tide | Diagonal | S2 S3 S3 | F2 P1 | X4 F3 | X5 | A Heavy: S5 X6; B Support: P2 X5 |
| Blue | Mist | Pillar | S3 S3 S4 | F3 R1 | L2 D2 | L3 | A Heavy: S6 S6; B Support: L2 R2 |
| Blue | Drift | Echo | S2 S3 S4 | F2 F3 | E0 P1 | E2 | A Heavy: S6 S6; B Support: E1 P2 |
| Green | Moss | Echo | S2 S3 S3 | P1 F2 | E0 R1 | S5 | A Heavy: S6 E2; B Support: P2 E1 |
| Green | Thorn | Sweep | S2 S2 S3 | P1 P1 | W4 R1 | W5 | A Heavy: S6 S6; B Support: L2 P2 |
| Green | Vale | Diagonal | S3 S3 S4 | F3 P1 | X4 X3 | R2 | A Heavy: S6 X6; B Support: P2 R2 |
| Yellow | Glint | Giant (wide) | S1 S3 S5 | F2 P1 | G5 R1 | G6 | A Heavy: S6 S7; B Support: P2 R2 |
| Yellow | Spark | Pillar | S3 S3 S4 | F3 F2 | L2 P1 | L3 | A Heavy: S6 S6; B Support: L2 R2 |
| Purple | Dusk | Diagonal | S2 S3 S4 | F3 P1 | X4 R1 | X5 | A Heavy: S6 X6; B Support: P2 D2 |
| Purple | Hex | Giant (tall) | S3 S4 S4 | P1 R1 | V8 D2 | V9 | A Heavy: S7 V11; B Support: P2 D2 |

Within one colour the units differ by signature (red: wide Giant, Sweep, tall Giant; blue: Diagonal, Pillar, Echo; green: Echo, Sweep, Diagonal; yellow: wide Giant, Pillar; purple: Diagonal, tall Giant) and by their basic kit. Coins: level 2 costs 30, level 3 70, level 4 120, level 5 200; unlocking a second or third unit of a colour costs 40.

## Rarity and loot (colourless tiles)

Common colourless tiles are basic shapes (Strike 2 to 4, Fork 2 to 3, Plus 1 to 2, Row 1, Double). Rare and Epic ones carry signature shapes with bigger numbers. Shown by a gem (cyan for Rare, magenta with a glow for Epic) and a coloured inner border; the inventory sorts by rarity.

| Signature shape | Common (unit kits, run tiles) | Rare | Epic |
|---|---|---|---|
| Diagonal | 4 | 5 | 7 |
| Sweep | 4 | 6 | 8 |
| Pillar | 2 | 3 | 4 |
| Echo | +0 | +2 | +4 |
| Giant wide | 5 | 7 | 9 |
| Giant tall | 8 | 11 | 14 |

Odds [common, rare, epic] by source (`CONFIG.rarity`; `depthShift` adds 3 percent to Rare, a third of that to Epic, per boss depth): normal fight drop (20 percent of fights) 92 / 7.5 / 0.5; elite (60 percent of elites) 50 / 40 / 10; boss (always) 0 / 75 / 25, guaranteed Rare or better; treasure node 50 / 38 / 12; runner kill 60 / 34 / 6.

**Tile stars (experimental, Settings toggle, default on).** A looted colourless tile identical to one already owned (same shape, number, rarity) merges into it as a star: +1 to its number per star, cap 3 (`CONFIG.stars`). Stars are shown on the tile. At the cap, further duplicates are separate tiles. "Duplicate a tile" in Settings tests it.

## Runs that grow

- After every won fight (including bosses) the player picks one of three: a **new tile** for this run (random colour of the team, weighted by depth, may be a signature shape; shown with a gold dotted ring in the bag), an **upgrade** to one bag tile for this run (+2, +1 for boosters, or a **second colour**, drawn split; a colourless tile that gains a colour becomes that colour), or a **heal** (35 percent of max HP). Upgraded tiles carry an arrow.
- The **Bag** button (map and fight menu) lists every tile of the run with its marks.
- **Path.** Each step offers 2 or 3 choices: always at least two fights (the second may be an elite from step 2), plus with 55 percent chance a node instead of a third fight: **Forge** (choose one of three upgrades), **Rest** (heal 40 percent), **Treasure** (a colourless tile into the loot). A segment is 3 steps then the boss (`CONFIG.bossEvery` 4). Nodes also count as steps, so fights between bosses are fewer.
- Bank and leave is available at any time (keeps everything); defeat keeps 50 percent of coins and loot tiles (the best rarity first).

## Bosses (one visible, layout-based trick each)

All bosses give a guaranteed Rare-or-better colourless tile, a 40 percent heal, 4x coins and the normal pick of three.

- **Area 1, twin bodies.** Two linked bodies on the outer columns (purple outline and chain icon) with a plain body between. Both must die in the same attack; if only one falls it rises again at full HP.
- **Area 2, blocked back cell.** A wide boss plus two small bodies. Each turn one back-row cell is blocked (hatched); the next turn's cell is shown with a dotted frame and "next".
- **Area 3, aegis.** A wide 3-column boss that takes damage only if 3 or more different tiles hit it in one attack ("needs 3" on the pill), plus two small bodies.

Deeper bosses (after the first) repeat the area's trick with scaled HP.

## CONFIG tunables (top of the script)

`rows`, `maxColourless`, `tileReturn`, `heroHp` (30/40/50), `areas` (name, cols, `hp` per enemy column at step 0 = 11 / 34 / 48, `atk` 2 / 3 / 4, coin, suggested level 1 / 3 / 4), `bossEvery`, `offerTwoChance`, `nodeChance`, `nodeWeights`, `eliteChance`, `wideChance`, `guardChance`, `runnerChance`, `blockChance`, `bonusCount`, `bonusTypes`, `growth` (enemy HP x1.12 per fight won in a run, attack x1.06), `jitter`, `normal`/`elite`/`boss` multipliers (hp, atk, coin, tile chance; boss heal), `coinBase`, `coinDepth`, `growHeal`, `restHeal`, `deathKeep`, `momentum`, `levelCost`, `unlockCost`, `stars`, `rarity`, `sigNum`, `pick` (new-tile signature odds, upgrade type odds), `longPressMs`.

## Balance (node bots on the shared rules block)

Greedy bot: for each attack it grows a layout cell by cell, taking the placement with the best gain in useful damage and kills (weighted by enemy attack), with a few randomised restarts; it prunes tiles it does not need when it can kill everything; it understands guards, twins (a twin kill only counts if both fall) and the blocked cell; it picks the cheapest fight (rests below 60 percent HP, forges first), picks a signature tile, else an upgrade, else heals below 45 percent HP. Careless bot: 2 to 5 random tiles on random cells, random path and random picks. Random teams (one random unit per colour), every unit at the stated level (level 5 with a random branch), no colourless tiles. 40 runs per cell for the greedy bot, 80 for the careless bot; the bots play until the hero dies (cap 90 steps).

Greedy bot, tiles return after the fight:

| Area | Unit level | Reach 1st boss | Beat 1st boss | Avg bosses beaten | Attacks per fight (normal / boss) | HP lost per fight (normal / boss) | Sandwich share of damage | Signature share of damage |
|---|---|---|---|---|---|---|---|---|
| 1 | 1 | 1.00 | 0.78 | 1.3 | 1.3 / 3.9 | 1.1 / 13.5 | 19% | 6% (run tiles only) |
| 1 | 2 | 1.00 | 1.00 | 4.0 | 1.2 / 2.4 | 0.6 / 5.9 | 28% | 25% |
| 1 | 3 | 1.00 | 1.00 | 4.5 | 1.2 / 2.2 | 1.0 / 5.2 | 21% | 64% |
| 2 | 2 | 0.95 | 0.60 | 0.8 | 2.3 / 3.7 | 8.7 / 19.1 | 35% | 3% |
| 2 | 3 | 1.00 | 0.75 | 1.1 | 2.0 / 3.4 | 6.4 / 16.2 | 32% | 51% |
| 2 | 4 | 1.00 | 1.00 | 1.9 | 1.9 / 3.0 | 5.2 / 12.1 | 33% | 67% |
| 3 | 3 | 0.97 | 0.57 | 1.0 | 2.6 / 3.7 | 16.3 / 20.3 | 35% | 49% |
| 3 | 4 | 1.00 | 0.55 | 0.8 | 2.4 / 3.8 | 13.3 / 22.7 | 35% | 62% |
| 3 | 5 | 1.00 | 0.88 | 1.5 | 2.1 / 3.2 | 10.9 / 13.9 | 33% | 72% |

Careless bot: Area 1 reaches the first boss in about 40 percent of runs (by skipping fights via nodes), never beats it, loses about 13 HP per normal fight and 15 per boss; in Areas 2 and 3 it dies in the first fight or two (0 percent reach). A level 1 team with decent play (greedy, Area 1) usually beats the first boss (78 percent) but pays about 13 HP for it; levels 2 and above out-level Area 1 (and run deep until the growing enemies catch them, about 4 bosses). Area 2 wants level 3 to 4, Area 3 level 4 to 5.

Economy comparison (greedy, Area 1 level 1 / Area 2 level 3): tiles resting until the fight ends beat the first boss 78 percent / 75 percent; every tile every attack: 100 percent / 97 percent, with about 2.5 bosses deep instead of 1.2. So the "turn" setting is clearly easier.

Layout variety check (hill-climbed best layouts from the whole bag against four dummy enemies; 40 random teams, 4 columns): level 4 teams produced 40 different layouts out of 40 (shape pattern per cell), the most common appearing in 3 percent; level 2 teams 33 different out of 40 (most common 10 percent); 5-column level 5 teams 30 out of 30. Best layouts hold 6 to 9 sandwiches (64 to 69 percent horizontal, the rest vertical), sandwiches account for about 42 to 44 percent of their damage, signature tiles for about 72 to 76 percent at levels 4 to 5, and 2.8 to 3 different signature shapes are used; no layout has an all-attack front row at level 4. No single arrangement dominates; the signature share is high, so signature tiles are strong (a deliberate identity, tune with `sigNum`).

## Known rough spots

- The greedy bot is a strong optimiser and ignores several things a human uses; real play is likely slower (more attacks) but also more creative (Echo and Pillar chains are underplayed by the bot). Its numbers are indicative, not tuned to a human.
- Level gating is soft: Area 2 level 2 still beats the first boss 60 percent with the bot; difficulty growth (x1.12 per fight) is what ends runs. Sandwich is about a third of damage; signature tiles are strong, especially tall Giants at level 3 and Epic loot.
- Pillar contribution is estimated (number x targets), Echo and Pillar need hand play to shine.
- Narrow screens: the icon in an enemy's top-left corner can overlap its HP number in 5-column fights at 360 px.
- Reload while an attack animation is playing resumes at the state before that attack (the run is saved at rest points).
- Drag on touch was tested with synthetic pointer events; the second-colour tile text on yellow is low contrast.
- Rarity gems and the glow on Epic tiles are tiny at hand size.
- Boss tricks are not stacked with elite/guard variants; no shop/event nodes; run perks (section 9.2 of the design notes) are not built.
