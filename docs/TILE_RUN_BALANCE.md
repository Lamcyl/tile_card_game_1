# Tile Run balance pass (eighth version)

Status: balanced draft for you to try. File: `prototype/samples/tile-run.html` (save key now `tileRunPrototype.v7`, old saves are not migrated). Simulator and scripts: `prototype/tools/tile-run-balance/`. Nothing in the rules was changed; only numbers and the data tables (units, effects, enemy and economy numbers). The few places where a number was hard-coded in the rules were moved into `CONFIG` so they can be tuned (listed under "What changed").

## 1. How tile power is scored (the metric)

**Score = how much of a skilled player's damage disappears when the tile is missing, scaled so that 20 % of the damage is 100.**

In detail (`tools/tile-run-balance/marginal.js`):

1. A reference endgame team: five Rare units at level 5 (Brand, Mist, Thorn, Spark, Hex), every slot filled with a one-star Rare collected tile, three one-star Rare colourless tiles, and five tiles a run would have picked up by the end (one upgraded, one two-colour).
2. Twenty-four fixed, seeded fights from the final area (difficulty 10): six final-boss bodies, four mid-bosses, eight elites, six normals, enemy HP x 1.25 so that the team is not able to overkill everything. A skilled bot (greedy placement + local search + sandwich templates, see section 8) places the team's tiles for the first attack of each fight.
3. On each board the damage that counts is the sum over enemies of min(damage, HP).
4. The tile's **share** is 1 - V'/V, where V' is the same board with that tile taken off (cells left empty). The share is a geometric mean over the 24 fights. A unit effect's share is the same board evaluated without the effect.
5. **Score = min(100, 100 x share / 0.20).** 0.20 is 1 - 1/1.25: a well-built endgame team is designed to have about 25 % more damage than the toughest battle needs, so a tile that carries 20 % of the damage is one the toughest battle cannot be cleared without. 100 = necessary. 0 = never changes a board. Collected, colourless and rainbow tiles are scored the same way with the tile added to a spare slot of the reference team.
6. Heroes: the extra damage share the ability adds in a two-attack window (Rally: +momentum on one attack, Prism / Overcharge: the best single target, Second Wind: the second attack uses the whole bag again). Guard does no damage; it saves one enemy volley per fight, so it is scored by the share of the hero's survivable damage (HP plus two boss heals plus two heal picks) that one tier 10 volley costs.

How to read it: a plain Common attack tile in a full bag is 10 to 35, a Rare 20 to 50, an Epic signature 50 to 80. Boosts, multipliers and big shapes are higher because they multiply other tiles, and that is why they are placed in the higher rarities. Scores above 80 are kept free for future content (section 7).

Limits of the metric are in section 9. Re-run: `node prototype/tools/tile-run-balance/score.js <label> all` (about 15 minutes on 4 cores), then `node tables.js before after`.

## 2. Score tables (before > after)

Scores 0-100 as defined above, reference endgame team, tier 10 fights. "Before" is the page as it was, "after" the page now (both re-measured with the same simulator). Level 1 = a level 1 copy inside the endgame team (so low by construction); level 5 is the figure to compare with the bands. The three numbers per cell are the unit's three base tiles in the order of its card (two attackers, then the signature tile).

Bands reached (mean over the 3 tiles at level 5): Common 28 > 34 (target 20-45), Rare 51 > 46 (35-60), Epic 75 > 74 (50-75). Unit effects: Common 5 > 26, Rare 26 > 34, Epic 44 > 83 (see "known soft spots").

| Unit | Rar | Tiles at level 1 (before > after) | Tiles at level 5 (before > after) | Mean L5 | Effect (before > after) |
|---|---|---|---|---|---|
| Ember | C | 4, 4, 11 > 13, 7, 41 | 25, 7, 22 > 54, 18, 72 | 18 > 48 | 2 > 47 |
| Flare | C | 4, 7, 17 > 14, 9, 28 | 27, 10, 25 > 42, 15, 30 | 21 > 29 | 2 > 20 |
| Scorch | C | 7, 4, 15 > 8, 100, 2 | 15, 33, 27 > 29, 100, 27 | 25 > 52 | 0 > 21 |
| Tide | C | 2, 1, 6 > 12, 8, 29 | 11, 64, 100 > 22, 21, 87 | 58 > 43 | 1 > 48 |
| Ripple | C | 3, 1, 6 > 8, 7, 13 | 15, 3, 51 > 34, 14, 33 | 23 > 27 | 1 > 16 |
| Brine | C | 2, 1, 0 > 11, 6, 13 | 16, 17, 27 > 15, 13, 16 | 20 > 15 | 0 > 17 |
| Moss | C | 1, 0, 1 > 12, 10, 21 | 7, 1, 47 > 28, 20, 34 | 18 > 27 | 1 > 16 |
| Fern | C | 2, 1, 5 > 19, 20, 36 | 24, 15, 27 > 33, 29, 21 | 22 > 28 | 6 > 38 |
| Bramble | C | 15, 4, 12 > 28, 17, 14 | 14, 11, 27 > 58, 34, 27 | 17 > 40 | 13 > 60 |
| Glint | C | 9, 5, 66 > 13, 14, 43 | 39, 9, 100 > 36, 16, 58 | 49 > 37 | 24 > 9 |
| Gleam | C | 6, 6, 3 > 12, 13, 6 | 18, 8, 25 > 30, 26, 20 | 17 > 25 | 1 > 15 |
| Amber | C | 12, 7, 17 > 10, 10, 46 | 20, 91, 42 > 27, 61, 58 | 51 > 49 | 15 > 30 |
| Dusk | C | 8, 3, 11 > 30, 2, 46 | 10, 9, 100 > 48, 30, 80 | 40 > 53 | 9 > 35 |
| Shade | C | 3, 2, 16 > 10, 0, 17 | 30, 2, 52 > 20, 5, 31 | 28 > 19 | 0 > 9 |
| Veil | C | 2, 0, 3 > 7, 0, 19 | 22, 6, 27 > 11, 13, 29 | 18 > 18 | 0 > 13 |
| Brand | R | 4, 14, 74 > 2, 6, 100 | 11, 89, 100 > 25, 13, 100 | 67 > 46 | 74 > 21 |
| Pyre | R | 18, 8, 100 > 11, 13, 72 | 28, 36, 100 > 17, 13, 100 | 55 > 43 | 66 > 48 |
| Mist | R | 4, 1, 94 > 13, 19, 99 | 24, 33, 100 > 29, 56, 92 | 52 > 59 | 5 > 36 |
| Fjord | R | 6, 1, 68 > 9, 6, 75 | 13, 24, 51 > 13, 11, 74 | 29 > 33 | 1 > 11 |
| Thorn | R | 5, 18, 15 > 7, 55, 17 | 26, 99, 39 > 23, 62, 35 | 55 > 40 | 40 > 48 |
| Willow | R | 16, 9, 40 > 3, 9, 66 | 30, 100, 100 > 30, 34, 82 | 77 > 49 | 7 > 17 |
| Spark | R | 8, 15, 100 > 6, 18, 100 | 61, 56, 100 > 35, 24, 100 | 72 > 53 | 35 > 43 |
| Sunbeam | R | 8, 10, 59 > 7, 8, 46 | 3, 14, 70 > 11, 14, 77 | 29 > 34 | 6 > 38 |
| Hex | R | 4, 3, 86 > 2, 38, 100 | 6, 11, 87 > 25, 58, 100 | 35 > 61 | 4 > 48 |
| Gloom | R | 3, 26, 2 > 9, 52, 16 | 3, 100, 11 > 21, 55, 49 | 38 > 42 | 21 > 30 |
| Cinder | E | 35, 100, 25 > 11, 100, 43 | 51, 100, 87 > 30, 100, 100 | 79 > 77 | 29 > 100 |
| Drift | E | 24, 39, 81 > 30, 37, 100 | 33, 100, 62 > 62, 67, 100 | 65 > 76 | 30 > 100 |
| Vale | E | 17, 48, 100 > 18, 62, 100 | 24, 100, 100 > 41, 64, 100 | 75 > 68 | 31 > 39 |
| Dune | E | 38, 100, 87 > 60, 82, 43 | 53, 100, 100 > 100, 80, 89 | 84 > 90 | 81 > 100 |
| Wisp | E | 8, 100, 100 > 15, 85, 30 | 12, 100, 100 > 30, 100, 48 | 71 > 59 | 47 > 76 |


### Heroes (share of damage added in a two-attack window; score = share / 20 %)

| Hero | Before | After | Unlock (stages cleared, before > after) |
|---|---|---|---|
| Kiri, Rally (+2 momentum, was +1) | 13 | 27 | free |
| Lumi, Prism | 13 | 19 | 7 > 6 |
| Brak, Overcharge (x3, was x2) | 18 | 48 | 12 > 18 |
| Sora, Second Wind | 17 | 100 | 3 > 30 |
| Tove, Guard | 3 by damage; 100 by survival (one tier 10 volley costs 45 % of what a run lets you take) | same | 19 > 42 |

Second Wind became the strongest damage hero once fights were made tight (a second full attack is about a fifth of the damage), so it and Guard now unlock last. The journey bots do not use Wind or Guard (they prefer Overcharge), so the win rates below do not include them; the effect of Wind on a tight tier 10 fight is estimated, not simulated per run.

### Colourless, collected and rainbow tiles (score of one tile in a spare slot of the reference team; name = kind | rarity 0 Common 1 Rare 2 Epic | stars)

Kinds: strike a^N, fork, bar (2 cells), plus boost, row boost, multiplier. Colourless numbers are 2x a coloured tile's (multipliers no longer +1).

```
CL
strike|0|0     0 > 0
strike|0|3     1 > 2
strike|1|0     1 > 2
strike|1|3     5 > 2
strike|2|0     9 > 2
strike|2|3     14 > 2
fork|0|0       0 > 1
fork|0|3       0 > 7
fork|1|0       0 > 1
fork|1|3       57 > 13
fork|2|0       41 > 53
fork|2|3       94 > 75
bar|0|0        4 > 9
bar|0|3        100 > 60
bar|1|0        100 > 78
bar|1|3        100 > 93
bar|2|0        100 > 100
bar|2|3        100 > 100
plus|0|0       6 > 1
plus|0|3       35 > 28
plus|1|0       6 > 1
plus|1|3       35 > 28
plus|2|0       25 > 14
plus|2|3       97 > 78
rowboost|0|0   58 > 21
rowboost|0|3   100 > 91
rowboost|1|0   100 > 75
rowboost|1|3   100 > 100
rowboost|2|0   100 > 75
rowboost|2|3   100 > 100
mult|0|0       76 > 40
mult|0|3       77 > 100
mult|1|0       76 > 40
mult|1|3       77 > 100
mult|2|0       78 > 80
mult|2|3       81 > 100

CT
strike|0|0     2 > 3
strike|0|3     5 > 5
strike|1|0     3 > 4
strike|1|3     32 > 23
strike|2|0     9 > 6
strike|2|3     32 > 37
fork|0|0       6 > 3
fork|0|3       39 > 41
fork|1|0       7 > 5
fork|1|3       50 > 46
fork|2|0       39 > 41
fork|2|3       100 > 83
bar|0|0        15 > 67
bar|0|3        63 > 100
bar|1|0        63 > 100
bar|1|3        100 > 100
bar|2|0        100 > 100
bar|2|3        100 > 100
plus|0|0       44 > 16
plus|0|3       100 > 100
plus|1|0       44 > 16
plus|1|3       100 > 100
plus|2|0       69 > 65
plus|2|3       100 > 100
rowboost|0|0   90 > 46
rowboost|0|3   100 > 100
rowboost|1|0   100 > 100
rowboost|1|3   100 > 100
rowboost|2|0   100 > 100
rowboost|2|3   100 > 100
mult|0|0       48 > 73
mult|0|3       93 > 100
mult|1|0       55 > 73
mult|1|3       100 > 100
mult|2|0       87 > 100
mult|2|3       100 > 100

RB
strike|0       56 > 48
strike|3       75 > 67
fork|0         61 > 56
fork|3         67 > 85
plus|0         100 > 100
plus|3         100 > 100

```

Reading: plain strikes and forks of any rarity are replaceable (0-40 even at 3 stars); boosts, multipliers and 2-cell bars are 40-100 even as Commons, because they multiply other tiles. They are therefore kept out of the early tiers (boost from tier 3, line boosts tier 5, multipliers tier 6, 2-cell shapes tier 7) and made rarer (see section 6). Three stars add roughly 10-40 points to a small tile. Rainbow: strike 48, fork 56, plus boost was 100, so the plus-shaped rainbow boost was removed from the drops. Colourless strikes are close to 0 in the endgame (they cannot be sandwiched); they are an early and mid game crutch, by design.

## 3. Difficulty curve (simulated: 12 skilled and 10 casual full-world journeys from a fresh save)

Win % is per run at the moment the player actually met that tier (first tries and retries). Enemy atk, hero HP, run lengths, boss tricks and boards are unchanged; only HP per column and coins changed.

| Tier | Board | HP / column | Enemy atk | Hero HP | Run | Boss | Skilled win % | Casual win % | Attacks per fight (skilled / casual) | Minutes per run (skilled / casual) |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 3x2 | 11 | 3 | 20 | 3 | plain | 100 | 100 | 1.01 / 1.21 | 7.0 / 7.8 |
| 2 | 3x3 | 17 | 3 | 24 | 4 | twin | 100 | 95 | 1.01 / 1.23 | 8.5 / 9.6 |
| 3 | 4x3 | 25 | 4 | 28 | 4 | block | 99 | 76 | 1.06 / 1.52 | 7.1 / 9.5 |
| 4 | 4x3 | 34 | 4 | 30 | 5 | aegis | 97 | 54 | 1.15 / 1.75 | 7.8 / 11.6 |
| 5 | 5x3 | 45 | 6 | 32 | 5 | plate | 83 | 34 | 1.25 / 1.75 | 8.1 / 10.0 |
| 6 | 5x3 | 54 | 5 | 34 | 6 | sealed | 79 | 30 | 1.31 / 1.69 | 10.6 / 12.5 |
| 7 | 5x4 | 110 | 7 | 36 | 6 | shield | 90 | 26 | 1.28 / 1.86 | 10.4 / 11.3 |
| 8 | 5x4 | 134 | 8 | 38 | 7 | deadrow | 96 | 29 | 1.07 / 1.78 | 10.1 / 11.5 |
| 9 | 6x4 | 138 | 9 | 40 | 7 | colours2 | 78 | 22 | 1.27 / 1.94 | 10.6 / 10.6 |
| 10 | 6x4 | 90 | 7 | 44 | 8 | final | 78 | 6 | 1.44 / 1.77 | 13.6 / 15.6 |


Expected team at the time (means over the runs played at that tier):

| Tier | Skilled: unit level (mean of 5) | slots open | units owned | collected tiles | stars | pulls so far | hours so far | Casual: unit level | slots | units | pulls | hours |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1.2 | 0.0 | 6.6 | 1.5 | 0.0 | 2.3 | 0.2 | 1.1 | 0.0 | 6.6 | 2.3 | 0.3 |
| 2 | 1.4 | 0.0 | 8.8 | 5.6 | 0.1 | 5.7 | 0.9 | 1.5 | 0.0 | 9.2 | 6.6 | 1.4 |
| 3 | 1.7 | 0.0 | 13.2 | 12.2 | 0.5 | 13.0 | 2.0 | 2.0 | 0.1 | 14.5 | 17.3 | 4.7 |
| 4 | 2.2 | 0.2 | 16.8 | 18.6 | 1.0 | 21.5 | 3.3 | 2.5 | 0.9 | 19.9 | 31.7 | 10.5 |
| 5 | 2.5 | 0.7 | 19.9 | 24.4 | 1.4 | 29.9 | 4.7 | 2.9 | 2.8 | 23.6 | 45.1 | 15.6 |
| 6 | 2.8 | 1.9 | 22.5 | 32.7 | 1.8 | 38.7 | 6.2 | 3.8 | 6.3 | 26.9 | 71.0 | 25.1 |
| 7 | 2.9 | 3.9 | 24.8 | 45.2 | 1.9 | 50.0 | 7.6 | 4.5 | 9.4 | 28.2 | 96.3 | 34.4 |
| 8 | 3.4 | 5.2 | 26.2 | 58.8 | 2.3 | 61.7 | 8.8 | 4.8 | 11.5 | 28.6 | 115.2 | 37.8 |
| 9 | 3.9 | 6.6 | 27.3 | 72.2 | 2.7 | 74.0 | 10.5 | 5.0 | 12.3 | 29.8 | 140.8 | 42.7 |
| 10 | 4.1 | 8.1 | 27.9 | 80.3 | 3.0 | 83.2 | 11.4 | 5.0 | 12.5 | 29.8 | 146.1 | 44.2 |


Shape: tiers 1-2 are comfortable for both bots (100 / 95 %). The skilled bot stays at 80-100 % until tier 9-10 where it drops to about 78 %; the casual bot falls from 76 % (tier 3) to 6 % (tier 10). The casual bot is deliberately weak (single noisy greedy pass, random picks), so a human sits between the columns. Tier 7 to 10 HP per column look high next to tier 6 because those boards have 4 rows (20-24 cells): a full board of sandwiches multiplies damage, so HP had to follow it. The casual bot did not finish the world within 300 runs in 6 of 10 journeys; that is the "hard for casual" end of the range, but it may be too hard (see rough spots).

## 4. Economy

| Item | Before | After |
|---|---|---|
| Coins per fight | 5 x tier factor (1,1,2,2,3,3,4,4,5,6) | 2 x tier factor (1,1,1.2,1.2,1.4,1.4,1.6,1.6,1.8,2) |
| First clear coins by tier | 20,25,30,40,50,60,75,90,110,150 | 5,6,7,8,9,10,11,12,14,20 |
| Recruit pull | 30 coins, 60 at start, Epic pity 20, odds 70/24/6 | unchanged |
| Duplicate shards | 3 / 6 / 12 | unchanged |
| Level costs (shards) | 3, 6, 9, 15 | unchanged |
| Slot costs (shards) | 8, 16, 30 (max 1 / 2 / 3) | unchanged |
| Death keeps | 50 % | unchanged |
| Hero unlocks | 3, 7, 12, 19 | 6, 18, 30, 42 |

Before: a skilled bot owned all 30 units after about 450 pulls (13 500 coins) in 66 runs and never lost (simulated, old numbers). After (simulated): about 86 pulls for the skilled player and 150 for the casual one by the end of the world, 28 of 30 units owned, shards almost fully spent (5 left on average for skilled), 8 slots open and unit level about 4 for skilled, level 5 with 12 slots for casual. Coins per won run: tier 1 14, tier 5 24, tier 10 52 (table in section 3's companion output, `curve.js`). Costs were not changed because the income now sets the pace: one pull per run on average, a Common duplicate worth 3 shards, so a level costs 1 to 5 pulls. Maxing all 30 units (levels 990 + slots 630 shards) needs roughly 380 more duplicate pulls: the full collection lasts well beyond the world.

## 5. Pacing

Assumption: 1 min per run, 0.5 min per fight, 1 min per attack (about 7 min for a tier 1 run, 14 min for the tier 10 run).

| Player | Runs to clear the world | Hours |
|---|---|---|
| Before (skilled and casual bots) | 66-71 | about 8 (simulated runs, old time constants; estimated hours) |
| After, skilled bot | 70 (67-85) | 10.6 (9.9-13.1) |
| After, casual bot | 300+ in 6 of 10 journeys (median hours 55) | 47-60 |
| Typical human (estimated, between the two) | about 120-150 | about 18-25 |

The skilled bot loses about 7.5 runs; 60 first clears are the minimum (3 stages in each of 20 areas). Endless with the final team (bosses beaten, tier 10 board, 3 tries per skilled player): median 4, range 0-10; the casual team usually dies at 0. Endless scaling (HP x1.1 per fight) was not changed; depth is a lasting goal but the median is low, so a gentler `growth` (0.07) is suggested but not simulated.

## 6. What changed and why

Rules code (numbers moved into `CONFIG`; behaviour identical except where stated):
- Effect sizes are `CONFIG.fx` (29 numbers) and effect lines on the cards are generated from them. Hero numbers are `CONFIG.hero` (Rally +2, Overcharge x3).
- Level bonus is the table `CONFIG.lvl`. Before every attack tile got +1 per level on every lane it hits, so a three-lane two-cell Epic block grew by 4 x 4 columns and carried up to 88 % of the damage. Now the bonus falls with the number of columns reached (1 column +1 per level; 2 columns 0,1,1,2,2; 3 columns 0,0,1,1,1; 4+ 0,0,0,1,1), local boosts 0,0,0,1,1, line boosts only +1 at level 5, multipliers none, copy 0,0,1,1,2.
- Colourless multipliers are x2 (were x3). The plus-shaped rainbow boost is no longer dropped. Generator: boost weight 0.25 > 0.20, multiplier 0.12 > 0.08, line-boost chance 0.3 > 0.2 (multiplier lines 0.5 > 0.4), multi-cell chance for Rare / Epic 0.45 / 0.7 > 0.3 / 0.5. Reason: kinds that multiply others scored 40-100 as Commons.
- Save key v7 (economy and hero unlock changes make old saves inconsistent).

Units (the tile numbers and signature tiles that changed; all other tiles unchanged):

| Unit | Base tiles | Style | Effect |
|---|---|---|---|
| Brand | a^4 a<>3 a^6#h2 > a^4 a<>3 a^5#h2 | Big block > Big block |
| Cinder | a^7#v2 a<^>4#h2 pudlr2 > a^5#v2 a<^>2#h2 pudlr2 | Giants > Giants |
| Tide | a^3 a^3 pudlr1 > a^4 a^3 pudlr1 | Plus boost > Plus boost |
| Drift | a^6 a<>4#h2 eu2 > a^5 a<>2#h2 eu2 | Copy and reach > Copy and reach |
| Vale | a^5 a<^>3 xudlr2 > a^5 a<^>2 xudlr2 | Neighbours > Neighbours |
| Glint | a^4 a^3 pR1 > a^4 a^3 pud1 | Row boost > Front-back boost |
| Spark | a^4 a<>3 xlr2 > a^4 a<>3 xr2 | Side multiplier > Side multiplier |
| Dune | a^5 a<^>4#h2 pB1 > a^5 a<^>2#h2 pu1 | Cross boost > Front boost |
| Dusk | a<>3 a^4 a<^>2 > a<>2 a^4 a<^>2 | Trident > Trident |
| Wisp | a^6 a<^>3#h2 pR2 > a^4 a<^>2#h2 pud1 | Block and row > Block and row |
| Pyre | a^4 a<>3 pR2 > a^4 a<>3 pC1 | Row boost > Column boost |
| Brine | a<>3 a^4 pd1 > a<>3 a^5 pd1 | Loners > Loners |
| Amber | a^3 a^3 a<>2 > a^3 a^3 a<>1 | Steady forks > Steady forks |
| Sunbeam | a^4 a<>3 pC2 > a^4 a<>3 pud2 | Column boost > Spine boost |
| Veil | a^4 a^3 pr1 > a^5 a^4 pr2 | Forge friend > Forge friend |
| Gloom | a^3 a<^>3 a^5#v2 > a^3 a<^>2 a^5#v2 | Tall block > Tall block |


Effect sizes (before > after): front 1 > 5, back 2 > 8, lone 1 > 5, wide 1 > 3, pressure 3 > 6, edge 2 > 8, huddle 1 > 6, true colours 2 > 14, charged 2 > 10, underdog +2 up to 3 > +6 up to 7, tempered 2 > 12, crowded row 1 > 2, cornerstone 3 > 12, loud echo 2 > 10, primed 2 > 4, fine steel 3 > 8. Unchanged: Good Fuel, Palette, Overdrive, Heavy Frame, Flock, Mixed Company, Squeeze Play, Pack Hunter, Long Arm, Rear Guard, Line Drive, Triple Bread, Column Strength 1. Reason: additive effects were worth 0-5 because they only touch the tiles of one colour; the big multipliers (Extra Line, Line Drive, Triple Bread, Rear Guard) were 40-90 and were moved to higher rarity or had their host tile cut. Extra Line moved from Brand (Rare) to Cinder (Epic); Brand got Heavy Frame.

Enemies (HP per column, before > after; atk, hero HP, run length, boss tricks unchanged): 8>11, 10>17, 16>25, 18>34, 25>45, 22>54, 68>110, 90>134, 110>138, 62>90. The old curve had a dip at tier 6 and 10 and a jump at 7; one skilled bot cleared tier 1-9 with no loss.

## 8. The simulator

`prototype/tools/tile-run-balance/` (node, loads the RULES block of the page, never a copy):

| File | Use |
|---|---|
| `lib.js` | rules loader, placement bot (greedy + local search + annealing + checkerboard templates = skilled; one noisy greedy pass = casual), run player. `TR_HTML=file` picks another page, `TR_OVERRIDE=json` merges numbers into `CONFIG` for tuning without editing the page |
| `marginal.js`, `score.js`, `catalog.js` | the tile scores: `node score.js <label> all` writes `results/<label>.json` (about 15 min on 4 cores) |
| `journey.js`, `journeys.js`, `curve.js` | whole-world journeys of a bot (`node journeys.js skilled 12 1 300 --json results/j-x-skilled.json`), then `node curve.js x` for the tables above |
| `tune.js` | moves each tier's HP until bot win rates hit targets |
| `tables.js`, `validate.js`, `verify-page.js` | score tables, bot check against the game's own puzzles, Playwright check of the page (360 x 740) |

## 10. Known soft spots (not fixed in this pass)

- Epic effects are strong (Drift, Cinder, Dune 100; Wisp 76) because they apply to up to 7 tiles of one colour and are multiplicative; lowering them needs a rule change, not a number. Second Wind (100) and Guard are the strongest heroes.
- Individual tile scores are noisy (+-20 per tile; the per-unit mean is steadier). Some Commons (Scorch, Tide) show a 100 on one tile.
- Casual bot too hard at tier 6-10 for a human casual player perhaps; a lower enemy atk or a heal after bosses would soften it (not simulated).
- Win rates were tuned with the previous hero unlock order; the final numbers were applied without a second tuning loop, so tier 5-6 skilled (83 / 79 %) and tier 9-10 (78 %) are a little lower than targeted (estimated effect: small).
## 7. Room for expansion (where to grow)

| What | Now | How to extend |
|---|---|---|
| Score headroom | no tile or effect above about 80; hero strongest is Guard | new Epic or Legendary units can sit at 80 to 100 without breaking the curve |
| Unit level cap | 5 (`CONFIG.lvl` rows have 5 entries; `levelShards` has 4 prices) | add a column to each `lvl` row and a price to `levelShards`; the `lvlBonus` table already scales by columns reached |
| Star cap | 5 (`CONFIG.stars.cap`), +1 per star | raise the cap; each star is worth 1 to 4 points of score, so 5 more stars stay under 100 |
| Difficulty | 10 tiers (`CONFIG.stages`) | tier 11+: add entries with hp about 1.25x the previous one, atk +1, hero HP +4; add areas in `CONFIG.map` above the Crown; `tierDist` and `dropFor` need one more entry each |
| Units | 30 (6 per colour) | a new unit is `base` (3 tiles) + one effect id; effect sizes are in `CONFIG.fx`; score it with `score.js <label> units <id>` before adding it |
| Effects | 29 rules, all sizes in `CONFIG.fx` | a new rule needs one line in `evaluate`; give it a size in `CONFIG.fx` and a line in `EFFECTS` |
| Heroes | 5 (the 4 unlocks are `CONFIG.heroUnlock`) | a hero is a rule plus a unlock count; Rally and Overcharge numbers are `CONFIG.hero` |
| Endless | HP x1.1 per fight won, boss every 3 | `CONFIG.growth` and `CONFIG.endlessEvery`; depth records are on the Home screen |
| Relics | 12, not rebalanced in this pass | they do not appear in the owner's list; the simulator uses them as the game does |

## 9. Limits of this simulation (a bot is not a person)

- The bots maximise damage on one board with a search. A person sees sandwiches and multiplier chains faster than the greedy casual bot and slower than the skilled bot in a hurry, so real win rates sit between the two columns.
- The skilled bot is not an optimum: its local search can miss a perfect checkerboard, so the scores are lower bounds for synergy tiles and the headroom is real. Puzzle check (`validate.js`): it solves 9 of the 15 hand-made puzzles and 37 of 40 daily puzzles; the casual bot 2 of 15 and 24 of 40.
- Scores are measured in one context (the reference endgame team on the tier 10 fights). A tile that is worth 80 there can be worth less in a different team, and a Common that scores 15 here can be the best option for a starter team. The level 1 columns are "a level 1 copy in the endgame team", not "in a starter team".
- Tile shares are removal shares on a fixed board, so a tile that is bread for many sandwiches can show a large share even though a spare tile could take its cell. The spread across kinds (boosts, multipliers, big shapes versus plain strikes) is real, but the absolute figure is the share on the best board, not a promise that the game cannot be won without it.
- Time is an assumption: 1 minute per run (map, setup, results), 0.5 minute per fight (choosing, picks), 1 minute per attack (placing 8 to 15 tiles, watching the result). A real player may be faster or slower by half.
- The journey bots always spend coins on pulls at once, level the cheapest upgrade first, slot the best collected tile and never grind more than one replay after two losses. Players who hoard, skip areas or replay more will differ.
- Relics, puzzles and the daily puzzle are outside this pass.
- The page was checked with Playwright (no console or page errors, a real fight with kills and sandwiches at low and high difficulty, recruit and level up); it was not play-tested by a human.

## Quick rebalance: lessons first (after owner feedback)

Feedback: the first stages taught unit skills instead of sandwiches; skill bonuses such as "+5 to the front row" made tile numbers meaningless, so every stage had the same layout (red front, blue back, green everywhere); side attackers appeared too early.

Changes:
- **Lessons gate each new difficulty.** `CONFIG.lessons` lists the puzzles that must be solved before the first stage of each difficulty. The stage card says "Lesson first (1 of 2): name. teach text" and the Play button becomes **Lesson**, which opens the puzzle. Order: 1 First Strike, Sandwich · 2 Both Ways, Lucky Cells, Neighbours (boosts) · 3 Reach Sideways, Guard Duty · 4 Three Lanes · 5 Unit Skills (new puzzle p16), Whole Lines · 6 Multiply, Stacked Multipliers · 7 Two Cells, Short Side, Two Colours · 8 Copy That.
- **Tiles appear only after their lesson.** Boosts from difficulty 2, side lanes from 3, three-lane attacks from 4, row/column boosts 5, multipliers 6, two-cell tiles 7, copies 8 (`specStage`, `genSpec`). A unit's base tile that is not taught yet plays as a plain tile (`simpleSpec`): side lanes become a Strike +1, boosts/multipliers/copies a Strike 3, big tiles shrink. So difficulty 1 is plain Strikes and sandwiches only.
- **Unit skills work from difficulty 5** (`CONFIG.fxTier`), after the Unit Skills lesson. The Team screen says "Works from difficulty 5". Skill sizes cut to small nudges (mostly +1 or +2: Front Rank +1, Back Rank +2, Lone Wolf +1, Edge Guard +2, True Colours +2, Charged +2, Underdog +2 up to 4, Tempered +2, Cornerstone +3, Loud Echo +2, Fine Steel +2).
- **Enemy health per column** retuned for the smaller skills: 8, 11, 16, 21, 28, 39, 85, 100, 105, 66 (was 11, 17, 25, 34, 45, 54, 110, 134, 138, 90).

Check (3 bot players each, 200-run cap; difficulty 5 health was eased from 32 to 28 after this run):

| Difficulty | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Skilled win % | 100 | 100 | 97 | 100 | 89 | 74 | 81 | 88 | 67 | 90 |
| Casual win % | 100 | 79 | 75 | 61 | 25 | 49 | 35 | 37 | 34 | 17 |

The skilled bot finishes in about 73 runs (about 11 h). The casual bot rarely finishes; real players learn, so treat it as a floor. The tile score table above was measured before this change; skill scores are now much lower.

**Update: lessons live on the map.** Each lesson is a small diamond ("?") on the seam below the first area of each new difficulty on each path, between the islands, not inside them. Tapping it shows the lesson card; Learn opens the next unsolved puzzle of that difficulty. The first stage of that area stays locked until all of its lessons are solved; then the diamond shows a tick. The puzzle menu now has "Leave puzzle" to go back to the map.

## Quick pass, 18 November 2026

- Early areas (difficulty 1–3) have 2 stages each, runs of 2 / 3 / 3 fights; the world has 59 stages.
- Enemy HP per column: 8, 11, 18, 24, 31, 42, 68, 80, 84, 62 (smooths the old jump from 39 to 85 at difficulty 7).
- Tile changes from the scores: three-lane tiles weaker (Cinder, Wisp, Dune wide tridents and Dusk, Gloom tridents at 1; generated three-lane penalty 0.55 → 0.4, two-lane 0.72 → 0.65); boosts stronger (unit boost tiles +1 or +2, generated boost budget 1/2/3 → 2/3/4).
- Scores (same metric as above, level 5 units, tier-10 reference fights; `results/v12u*.json` before, `v13u*.json` after). Mean of a unit's three tiles: Common 9 → 10, Rare 21 → 20, Epic 41 → 42.
- Still dominant: a wide (2-cell) trident scores 100 even with number 1, because it hits 4 columns and is sandwiched on several lines at once; its strength comes from its shape, not its number. Multipliers (Spark, Willow, Mist, Vale) score 50–58. Weakest: boost-heavy Commons (Gleam, Scorch, Flare, Glint, Veil 3–5).
- Bots (3 players each, 200-run cap): skilled finishes in about 61 runs (9 h), wins 100% up to difficulty 7, then 81 / 82 / 69%; casual finishes in about 158 runs, 48% at difficulty 4, 14% at 10.

## Encyclopedia

Options > Encyclopedia lists every tile the rules can express (940: attacks with all 7 lane sets, boosts and multipliers with every non-empty subset of u d l r plus R C B, copies u d l r, in all 20 shapes), 77 of them flagged "Not in game" because `genSpec` never produced them in a seeded sample of 60000 draws per tier and rarity (plus unit base tiles count as in game). Data is generated by `prototype/tools/tile-run-balance/encyclopedia.js` (about 90 s on 4 cores) and stored between the `ENC-START` / `ENC-END` markers in `tile-run.html`.

Method: the endgame number is the Epic budget at difficulty 10 without jitter. Column max and Total max come from a seeded search (random restarts with annealing; moves: cell colour, swaps, sandwich stamps, helper colour and direction, tile colour and anchor; cross-seeded between the two objectives) on a 6x4 board with one 1e9-HP enemy per column, the tile plus strikes of 6 in three colours, one Epic boost and one x2 multiplier. Value = damage(board) minus damage(board without the tile). Both are lower bounds (the search is heuristic). Score = min(100, 100 x Total max / (0.4 x 1177)); 1177 is the mean total HP of the first-attack enemies of 40 seeded tier-10 final-boss fights from `genFight` (won = 7). Score 100 means the tile alone could deal 40% of the toughest fight. Because the helper board is a best case, 691 of 940 tiles reach 100 (every multi-cell tile and most line tiles); the list is therefore most useful for the low and middle range and for Total max. "Team score" (unit base tiles) is the measured endgame marginal of `results/v13u*.json` at level 5.

Top 10 (ties at 100 ordered by Total max):

| Tile | Score | Column max | Total max | Status |
|---|---|---|---|---|
| Quad-cell Fork (`a<>11#Td`, 3×2) | 100 | 1734 | 8646 | in game |
| Quad-cell Right jab (`a>17#h4`, 4×1) | 100 | 2118 | 8454 | in game |
| Quad-cell Copy (`el2#Sh`, 3×2) | 100 | 2706 | 8094 | variant |
| Quad-cell Trident (`a<^>7#Tu`, 3×2) | 100 | 1490 | 7390 | in game |
| Quad-cell Trident (`a<^>7#Td`, 3×2) | 100 | 1472 | 7360 | in game |
| Quad-cell Copy (`er2#Sh`, 3×2) | 100 | 2450 | 7344 | variant |
| Quad-cell Left strike (`a<^11#Tu`, 3×2) | 100 | 1746 | 6930 | in game |
| Quad-cell Left strike (`a<^11#Sh`, 3×2) | 100 | 1740 | 6924 | in game |
| Quad-cell Left strike (`a<^11#Zh`, 3×2) | 100 | 1734 | 6924 | in game |
| Quad-cell Copy (`el2#h4`, 4×1) | 100 | 1670 | 6674 | variant |

Bottom 10:

| Tile | Score | Column max | Total max | Status |
|---|---|---|---|---|
| Triple-cell Column multiplier (`xC3#v3`, 1×3) | 19.5 | 56 | 92 | in game |
| Double-cell Multiplier (`xu3#v2`, 1×2) | 19.1 | 60 | 90 | in game |
| Strike (`a^8`, 1×1) | 17.4 | 70 | 82 | in game |
| Quad-cell Multiplier (`xd3#v4`, 1×4) | 16.1 | 76 | 76 | in game |
| Quad-cell Multiplier (`xu3#v4`, 1×4) | 15.3 | 66 | 72 | in game |
| Quad-cell Boost (`pud4#v4`, 1×4) | 15.3 | 48 | 72 | in game |
| Quad-cell Column multiplier (`xC3#v4`, 1×4) | 15.3 | 36 | 72 | in game |
| Quad-cell Boost (`pu5#v4`, 1×4) | 14.4 | 50 | 68 | in game |
| Quad-cell Multiplier (`xud3#v4`, 1×4) | 14 | 60 | 66 | in game |
| Quad-cell Boost (`pd5#v4`, 1×4) | 11.5 | 42 | 54 | in game |

**Score update.** The first score (100 = could deal 40% of the toughest fight alone) put 691 of 940 tiles at 100, so it could not tell them apart. The encyclopedia now uses score = 100 × Total max / (Total max + median Total max): 50 is a typical tile, the strongest approach 100 and nothing is capped. Top: four-cell forks, jabs and tridents (about 89–91). Bottom: tall 1×4 boosts and multipliers and the plain single Strike (6–9), since a vertical four-cell boost or multiplier touches few other tiles. The tables above show the old score; Column max and Total max are unchanged. Rerun `node prototype/tools/tile-run-balance/encyclopedia.js` after any rebalance.

## Additive rules pass, 19 November 2026

- Rules: multipliers add (x2 and x2 = x3); sandwich lines add (+1 per bracketed line); both share one pool, so an attack deals (number + boosts) x (1 + sandwich lines + multiplier bonuses).
- Tiles: multipliers x3 / x3 / x4 by rarity, +1 per two extra cells; boosts +3 / +5 / +7, +25% per extra cell; copies +0 / +0 / +1; unit multipliers x3.
- Encyclopedia stress test (up to four x2 multipliers and two boosts as helpers): median damage added, single / multi-cell: attacks 266 / 876, boosts 192 / 654, multipliers 222 / 541, copies 628 / -. Strongest in-game tile about 3,000, weakest about 45 (before the additive rules: 110,000 vs 150).
- Rarity star cut-offs on the encyclopedia score: 45 / 51 / 56 / 64 (298 / 190 / 118 / 161 / 96 tiles from 1 to 5 stars).
- Enemy HP per column: 8, 14, 22, 32, 47, 75, 170, 205, 235, 170 (between tuner rounds 2 and 3).
- Bots: the skilled bot still wins every tier in about one attack per fight (it finds strong boards); the casual bot needs about 20-30 h and wins 30-70% from difficulty 6. The gap between the bots is large, so real playtesting decides where a typical player sits.

## 20 November: tier 5+ difficulty and new name
- Game renamed Tilewhist (title and header).
- Enemy HP per column raised about 20% from tier 5 (Silent Pass, Windy Dunes) on: 56, 96, 215, 228, 265, 210 (was 47, 80, 180, 190, 220, 175). Tiers 1–4 unchanged.
- Copy-direction arrow drawn above the sandwich clamp.
