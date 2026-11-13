# Tile Run prototype (rules as built)

File: `prototype/samples/tile-run.html` (one file, inline CSS/JS, no network, no images, no build step). Built on the look and interaction of `tile-puzzle.html`. All tunables are in the `CONFIG` object at the top of the script. The rules code (CONFIG, units, `evaluate`, fight generation, run state) sits between `/*RULES-START*/` and `/*RULES-END*/` and has no DOM access, so a node script can load it (see "Balance").

## Core rules

- **Board.** 3 rows of player cells, 3 / 4 / 5 columns in Area 1 / 2 / 3. Row 0 is the front (nearest the enemies). Some cells are blocked; some are bonus cells (+1, +2, x2) that boost the Strike, Fork or booster placed there. Bonus cells and blocks are level design, generated per fight and shown on the choice card.
- **Tiles.** Number, shape, colour. Strike: its own column. Fork: both neighbouring columns. Plus: adds its number to each touching Strike/Fork. Row: adds its number to every Strike/Fork in its row. Double: doubles the tile in front of it (row above). Everything resolves at once; no order dependence. No Exact enemies, no negative tiles, no tiles that move or steal.
- **Units are colours.** Five colours (red circle, blue triangle, green square, yellow diamond, purple hexagon). A team is exactly one unit per colour. Units differ only by their tile kit, which grows with unit level (1 to 3): level 1 is Strikes only, level 2 adds Forks/Plus/Row, level 3 adds Double, Row and more.
- **Colourless tiles** (grey ring) are universal inventory tiles, persisted. Before a run the player puts up to `CONFIG.maxColourless` (3) of them in the bag. They are earned as loot. Boss replenish can add bonus ones for the rest of the run.
- **The bag.** All kit tiles of the five units plus the chosen colourless tiles. The hand is paged by colour (one tab per colour plus colourless). Every unspent tile is available in every fight. A tile on the board when Attack is pressed is spent for the rest of the run (this replaces rations).
- **Fights.** Enemies sit above columns with HP and an attack value. Place any number of tiles, press Attack: each enemy takes the total of its column(s), HP persists between attacks, placed tiles are spent, surviving enemies hit the hero for their attack. Repeat until all enemies are dead (win), hero HP is 0 or the bag is empty (run over). Enemy kinds: plain; Guard (takes damage only if hit by at least 2 separate tiles in one attack, shown dashed); wide (spans 2 columns, one HP pool); boss (wide, more HP, rises once with a second HP bar).
- **Live feedback.** While a tile is held (tap-selected or dragged), every empty cell shows the enemy total it would produce, and cells that would finish an enemy glow green. The enemies show predicted damage (gold on the HP bar, pill below). Placed tiles show their live value; long-press a placed tile for the breakdown.
- **Run structure.** A path of `CONFIG.bossEvery` (4) steps: 3 fights, then a boss. Each fight step offers 2 or 3 fights (sometimes one is an elite) with enemies, HP, attack, bonus/blocked cells and reward visible before choosing. Beating a boss returns all spent tiles, adds 0 to 2 bonus colourless tiles (so the bag can exceed its starting size), heals 40 percent of max HP, and the run goes deeper (harder boards, better rewards). Bank and leave is available on the map at any time and keeps everything; defeat keeps `CONFIG.deathKeep` (50 percent) of the run's coins and loot tiles. Fights give coins and sometimes a colourless tile (to inventory at the end of the run); a small heal per fight.
- **Momentum (experimental, tunable).** Winning a fight in one attack gives +`CONFIG.momentum.bonus` to every Strike/Fork/booster for the first attack of the next fight. Settings toggle and value; shown as a gold badge in the header, on the map, on the result screen and in the hint line.
- **Progression.** Coins level units (30 for level 2, 70 for level 3) and unlock extra units (40 each). One unit per colour is unlocked at the start. Save is in `localStorage` in try/catch; the page works without it (run state is not persisted).

## Reaction rule (universal, one at a time)

Per-unit reactions were dropped (hard to remember). Instead one universal rule, chosen in Settings (`CONFIG.reactionMode`), is always shown in a strip under the board (tap/long-press for the details). All are pure damage, included in the live totals and the long-press card. Colourless tiles never count as a colour for Sandwich, Flush or the Wheel, but do count (by number) for Run and Set.

- **Sandwich (default).** A tile directly between two tiles of one other colour, in a row or column, is doubled. Brackets on the two outer tiles, an outline and an "x2" chip on the doubled tile. Applies to Strikes, Forks and boosters (not Doubles).
- **Melds.** Three tiles in a line (a column of three, or three adjacent cells in a row) score: Flush (one colour) +2, Run (three consecutive numbers, any order) +3, Set (three equal numbers) +3; Flush with Run or Set +5 (`CONFIG.meld`). A column line adds to that column; a row line adds round(bonus x 0.4) (at least 1) to each of its three columns. The printed number counts (boosters too, Double counts as 2). A gold line is drawn through the three tiles with a label.
- **Wheel.** Colours sit on a ring: red, blue, green, yellow, purple, back to red (small wheel in the strip). Each tile carries a small dot in the colour it powers, and gives +`CONFIG.wheel` (2) to each touching Strike/Fork of the next colour. Receiving tiles are outlined.
- **None.** Totals are just the numbers.

**Enemy colours (optional, default off).** Each enemy has a colour; tiles of the same colour deal double damage to it (colourless never does). When on, enemy colours show on the fight and the choice cards, and the pill shows "x2" when a double is in play.

## Units (13)

Number = tile number. Kits are cumulative: level 1 is the first group, level 2 adds the second, level 3 the third. S = Strike, F = Fork, P = Plus, R = Row, D = Double (x). Level 1 kit is 4 tiles, level 2 is 6, level 3 is 8 (a full team bag: 20 / 30 / 40 tiles plus colourless).

| Colour | Unit | Level 1 / adds at 2 / adds at 3 |
|---|---|---|
| Red | Ember | S2 S3 S3 S4 / F3 P1 / S5 D2 |
| Red | Brand | S2 S3 S4 S4 / P1 P2 / R1 D2 |
| Red | Cinder | S3 S4 S5 S5 / F3 S6 / F4 D2 |
| Blue | Tide | S2 S3 S3 S4 / F2 P1 / P2 D2 |
| Blue | Mist | S3 S3 S4 S4 / F3 R1 / D2 P1 |
| Blue | Drift | S2 S3 S4 S4 / F2 F3 / P1 D2 |
| Green | Moss | S1 S2 S3 S4 / P1 F2 / R1 D2 |
| Green | Thorn | S2 S2 S3 S5 / P1 P1 / R1 D2 |
| Green | Vale | S3 S3 S4 S4 / F3 P1 / R2 D2 |
| Yellow | Glint | S1 S3 S4 S5 / F2 P1 / R1 D2 |
| Yellow | Spark | S3 S3 S4 S4 / F3 F2 / P1 D2 |
| Purple | Dusk | S2 S3 S4 S5 / F3 P1 / R1 D2 |
| Purple | Hex | S3 S4 S4 S5 / P1 R1 / F3 D2 |

Numbers within a unit vary on purpose so Runs and Sets are possible across colours. Because units now differ only by kit, the 2 to 3 units per colour are rough variations (heavier Strikes, more Forks, more boosters), not strong identities.

## CONFIG tunables (top of the script)

`rows`, `maxColourless`, `heroHp` (30/40/50), `areas` (name, cols, `hp` per enemy column, `atk`, `coin`, suggested level), `bossEvery`, `offers`, `offerTwoChance`, `eliteChance`, `wideChance`, `guardChance` per area, `blockChance`, `bonusCount`, `bonusTypes`, `growth` (HP/attack growth per fight won in a run, 0.08), `jitter`, `normal`/`elite`/`boss` multipliers (hp, atk, coin, tile chance; boss phase2, bonusChance, bonusMax, heal), `coinBase`, `coinDepth`, `healPerFight`, `deathKeep`, `momentum` (on, bonus, values), `levelCost`, `unlockCost`, `startCoins`, `longPressMs`, `reactionMode`, `enemyColours`, `wheel`, `meld`.

## Balance (node bots on the shared rules block)

Scripts (scratch, not in the repo): a greedy bot (hill-climbs placements to kill with few tiles, prunes unneeded tiles, picks the lowest-HP offer) and a careless bot (random 2 to 5 tiles on random cells, random offers). Random teams (one random unit per colour), all units at level 1, 2 or 3, no extra colourless tiles in the table. 60 runs per cell (120 for the careless bot).

Sandwich (default), share of runs that reach / beat the first boss:

| Area | Unit level | Greedy reach | Greedy beat | Careless reach | Careless beat |
|---|---|---|---|---|---|
| 1 | 1 | 0.93 | 0.73 | 0.22 | 0.00 |
| 1 | 2 | 0.97 | 0.97 | 0.57 | 0.00 |
| 1 | 3 | 0.95 | 0.93 | 0.49 | 0.00 |
| 2 | 1 | 0.32 | 0.00 | 0 | 0 |
| 2 | 2 | 0.78 | 0.15 | 0 | 0 |
| 2 | 3 | 0.70 | 0.57 | 0 | 0 |
| 3 | 1 | 0.00 | 0.00 | 0 | 0 |
| 3 | 2 | 0.32 | 0.00 | 0 | 0 |
| 3 | 3 | 0.32 | 0.12 | 0 | 0 |

Tile pressure: a level 1 greedy team arrives at the first boss with about 12 of 20 tiles left (full HP, since it usually kills in one attack); the usual end of a greedy run is an empty bag, not HP. Level 2 and 3 greedy teams arrive with 22 of 30 and 32 of 40 and survive 4 to 6 bosses before running out. The careless bot reaches the first boss in 22 percent of Area 1 level 1 runs with about 2 tiles left and never beats it; in Areas 2 and 3 it never reaches it. Area 2 needs level 2 to 3, Area 3 level 3 and good play (still 12 percent for the greedy bot).

Reaction mode effect (Area 1, level 1, greedy beat-first-boss rate): none 0.65, sandwich 0.73, melds 0.77, wheel 0.92; with enemy colours on (sandwich) 0.98. Mode strength is therefore not equal yet: the wheel is the easiest to use for a bot and enemy colours add a lot. Treat these as knobs (`wheel`, `meld`, `growth`).

Layout dominance check (hill-climbed best layouts for 8 random team tiles on a 4x3 board, 80 random teams, ideal-layout damage against no rule):

| Mode | Best-layout damage vs none | Distinct occupancy masks of the best layouts | Most common mask | Naive "fill the front" layout vs best |
|---|---|---|---|---|
| none | 0 percent | 52 | 6 percent | 84 percent |
| sandwich | +64 percent | 42 | 9 percent | 55 percent |
| melds | +35 percent | 44 | 9 percent | 70 percent |
| wheel | +50 percent | 31 | 9 percent | 70 percent |

No single arrangement pattern dominates in any mode: the best layouts are spread over 31 to 52 different shapes, none above 9 percent of teams. Honest caveats: Sandwich always puts different colours next to each other (that is its idea), but where is free: 71 percent of the sandwiches found were horizontal, 29 percent vertical. In Melds 61 percent of the melds found are rows, 39 percent columns, and about 60 percent of best layouts hold two full columns. Wheel best layouts use about 7 touching pairs. No mode produced one-colour-per-row layouts (under 3 percent).

## Known rough spots

- Bots are crude: the greedy bot does not plan boosters well (no multi-tile lookahead), so boosters and Doubles are probably under-used and real play may be stronger. Numbers are indicative, not tuned to a human.
- Mode strengths differ (see above); only Sandwich was tuned as the reference. Enemy colours are strong.
- With reactions gone, units within a colour are only mildly different (kit shapes and numbers).
- Run state is in memory only: a page reload mid-run abandons the run (save keeps coins, units, inventory, settings).
- Elite and boss HP use simple multipliers; boss extra row was not built (second HP bar only).
- Melds labels can sit over tile names; the Wheel has no arrows between tiles (the dot and the outline carry the meaning).
- Drag on touch tested with synthetic pointer events only.
