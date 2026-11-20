# Tilewhist balance pass (20 November, after beta 1)

Implements the "Balance" proposals of `TILEWHIST_BETA_1.md`. Numbers come from the journey bots (`prototype/tools/tile-run-balance/journeys.js`: skilled and casual bots play the whole campaign, 300-run cap). Bots are bounds, not people. The beta baseline ("before") is the tester's report on the 20 November build.

## What changed
- **Enemy HP per column (tiers 1-10).** Before: 8, 14, 22, 32, 56, 96, 215, 228, 265, 210 (a x2.24 cliff at tier 7, then flat). Proposal start: 56, 90, 140, 200, 250, 290. After tuning with `tune.js` and three more journey rounds (the skilled bot kept winning ~95-100% at the proposal curve from tier 7 on): 8, 14, 22, 32, **80, 160, 380, 640, 880, 360**. The region-boss wall multipliers (`bossHp`: Fairmeet 1.35, Misty Moor 1.5, Gloaming Crown 1.6) stay boss-only. Tier 10 is lower in raw HP because its boss carries x1.6 and a two-phase final.
- **Coins.** Per-fight coins scale x1.25 per tier (`stages[].coin` 1, 1.3, 1.6, 2, 2.4, 3, 3.8, 4.8, 6, 7.5). First-clear coins 5 to 40 (were 5 to 20). Replays pay 60% of first-clear coins (was 40%). Level 4-7 costs -30% (70, 106, 154, 224; level 8 stays 460). Puzzles pay 20-40 coins, the daily 20.
- **Shards.** Needs 10 / 20 / 35 (were 10 / 25 / 50). A wishlist unit (Tiles screen, unit card, "Add to wishlist", `store.wish`) receives daily, elite and Endless shards (and the 1 shard of each quest puzzle); without a wishlist the old "nearest to unlock" rule applies. Shards of an owned unit, and the surplus on unlock, become coins (3 / 5 / 8 per Common / Rare / Epic shard).
- **Relics.** Flat +N relics (Front Line, Back Line, Heavy Hand, Echo Chamber, Bright Boost) scale as N x (1 + 0.5 x (tier - 1)) (`CONFIG.relicTier`); Palette stays flat (scaled it gave +15 per tile and won 90% alone). Triple Bread is now "Golden Crust": only the most sandwiched tile counts one more.
- **Tile supply.** Rares from tier 3, epics from tier 6 (`rarity.rareStage/epicStage`), a boss tile is one rarity above its roll (`rarity.bossUp`), and drop kinds are weighted by 1 / (1 + 0.12 x owned of that kind) so the kind you own least turns up more (`supply.lean`, counts from collection, inventory and run loot).
- **Endless.** Opens after Fairmeet (`map.endlessArea`), enemies +7% HP per depth (`endlessGrowth`, plus the usual +10% per fight inside one depth), first shard milestone at depth 2 then every 2 (3 shards), and the bag keeps only the best 8 picked tiles (`endlessBagAdded`, weakest dropped). Campaign runs still grow +10% per fight won.
- **Skills** unlock at 8 / 18 / 30 stages cleared (were 15 / 25 / 36).
- **Puzzles.** The 11 puzzles the bot failed were checked by exhaustive search: all were solvable, but the lessons had only 16-64 winning placements (q01: 8 of 1M) and the quests were needle-in-a-haystack. `puzfix.js` re-generated them (same id, name, text, board, hand tile types, enemy columns): the skilled bot now solves all 37 (was 26), a lesson must still fail without its taught tile (exhaustive), and quests accept up to 3% random wins. `apply-puz.js` orders the quest puzzles by measured difficulty (random-win rate and tile count, plus a small lesson-order term so the unlock chain is gradual) and sets coins 20-40 by rank. Each puzzle has a once-only Hint button (selects the next solution tile and marks its cell; daily hints are per day). Casual bot: 9 of 37 (was 6).
- **Encyclopedia.** `encyclopedia.js` re-run (940 tiles, refHP 6754) and the rarity-star cut-offs moved from 45/51/56/64 to 45/52/60/66, giving 35 / 25 / 20 / 12 / 8 % of in-game tiles on 1 to 5 stars (was 35 / 22 / 13 / 19 / 11).

## Results (win % by tier at the time the tier was played)
| tier | HP before | HP after | skilled before | skilled after | casual before | casual after |
|---|---|---|---|---|---|---|
| 1 | 8 | 8 | 100 | 100 | 100 | 86 |
| 2 | 14 | 14 | 100 | 100 | 100 | 97 |
| 3 | 22 | 22 | 90 | 100 | 84 | 78 |
| 4 | 32 | 32 | 92 | 93 | 53 | 64 |
| 5 | 56 | 80 | 85 | 91 | 51 | 72 |
| 6 | 96 | 160 | 75 | 75 | 29 | 40 |
| 7 | 215 | 380 | 29 | 91 | 22 | 52 |
| 8 | 228 | 640 | 47 | 88 | 23 | 36 |
| 9 | 265 | 880 | 74 | 67 | 76 | 21 |
| 10 | 210 | 360  | 18 | see below | 6 | 16 |

After columns: final build (HP as listed), 8 skilled and 6 casual bots on fresh seeds, 300-run cap. Length: skilled 168 runs / 28.7 h before, 79 runs / 12.2 h after (the new coin economy shortens the skilled campaign; raise HP or lower coins for a longer one); casual 1 of 4 finished within 300 runs before, 2 of 6 after (median 57 h; tiers 5-8 are the long part and farm well: replay win rates 62-97%). The skilled curve is 100, 100, 100, 93, 91, 75, 91, 88, 67, 75 (earlier 8-bot rounds at the same HP gave 85, 84, 82, 72, 46 for tiers 6-10; seed noise is about +-8 points), with no tier-7 hole (was 29%). It is flatter than the 90 to 60 target in the middle and the final tier is nearer 60-75 than 60; raising tiers 7-9 further would push the casual bot (36% and 21% at tiers 8-9) out of reach. Endless: skilled median depth 14 bosses (range 0-25), casual 1.

Relics (`rel.js 6 20`, reference level-5 team, tier 6, n=20): Golden Crust 0%, Front Line 0%, Heavy Hand 0%, Bright Boost 25%, no relic 0%; Palette 90% when scaled (so it was left flat: 0%). The old Triple Bread dominance (67% at tier 7) is gone; the reference team is weak for tier 7 and HP 380 (all 0%), so only the ordering is informative.

## Tools
`journey.js` mirrors the new economy (wishlist pick, spare shards to coins, owned-kind weights). `puzfix.js` and `apply-puz.js` are new; `rel.js` (relic A/B) is now in the tools folder. Puzzle rewards are not part of the journey model (about 700 coins and 20 shards over the 37 puzzles, plus the daily).
