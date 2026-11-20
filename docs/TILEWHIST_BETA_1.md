# Tilewhist beta round 1 (20 November)

Four beta-tester agents tested the game: UI and touch, balance and progression, a new player, and QA on edge cases and saves. Nothing below is implemented yet. Duplicates across testers are merged; the tags show who found each issue (UI, BAL, NEW, QA).

## Must fix before v1.0
1. **Reload breaks tutorials (NEW).**
   - Reloading on the path map, at fight start or on the stage-cleared screen throws errors and drops the tutorial popup.
   - The cause is that `TUTQ` and `TUT_BY_ID` are not defined yet when the resumed screen renders.
2. **Reload during the attack animation undoes the attack (QA).**
   - The run is saved only at fight start and on the result screen.
   - A player can reload to retry any bad attack, even a lethal one.
3. **A slightly broken save gives a permanent blank screen (QA).** Examples: `slots`, `set`, `puzDone`, `heroes` or `cleared` set to null; an unknown hero; a `run` with a stale stage key. The realistic trigger is a saved run from an older build. Fix: validate the save and fill in defaults, and drop a run that is no longer valid.
4. **Attack button unreachable on short screens (QA).**
   - The page cannot scroll, and the minimum cell size is 40px.
   - At 740x360 (landscape) the button is off-screen. At 360x560 and smaller it is cut off.
5. **"Bank and leave" has no confirm (NEW).** It sits right under the boss card, so one stray tap ends the run.
6. **Rally text is wrong (NEW).**
   - The skill says +1, but the code gives +2.
   - The breakdown shows momentum and rally together as "momentum +3".
7. **Some dev actions are reachable without `?dev=1` (QA).** Handlers like `coins`, `unlockall` and `shards` are not checked against DEV; only their buttons are hidden. `?dev=10` also counts as dev.

## Balance (BAL; 4 skilled and 4 casual journey bots, up to 300 runs each)
- **Length.**
  - The skilled bot finishes in a median of 168 runs (about 29 h). On 18 November this was about 61 runs.
  - The casual bot: 1 of 4 finished, at about 58 h. The other three stalled at tiers 6–7.
- **Tier 6→7 HP cliff (Misty Moor, from 96 to 215 per column, ×2.24).**
  - The skilled win rate drops to 29%.
  - Win rates by tier form a saw rather than a steady decline: 75, 29, 47, 74, 18.
  - Suggested: smooth the curve and re-run `tune.js` after the +20% change.
- **Coins can't keep up with level costs.**
  - Levelling one unit to 8 costs about 1,356 coins, while runs pay 12–38 coins.
  - Levels stall at 3–4 until tier 7, exactly where HP doubles.
  - Slots matter little.
- **Units unlock too late.**
  - The first unit beyond the starters unlocks around run 69.
  - Players end with 200–300 shards spread thin and own only about 15 of 30 units.
  - Suggested: lower the shard needs, or let daily, elite and Endless shards target a unit the player chooses.
- **Relics.**
  - Triple Bread dominates: 67% win rate at tier 7, against 17% with no relic.
  - Flat +N relics (Front Line, Heavy Hand and others) score 0% against 200-HP enemies, so they should scale with tier.
  - Only 6 runs per relic, so these numbers are indicative.
- **Tile supply.**
  - There are no rare tiles before tier 5 and no epic tiles before tier 8 (which bosses reach at tier 10).
  - Drops are about 60% attack tiles, so nothing forces a spread of tile types.
- **Puzzles.**
  - The skilled bot fails 11 of 37 puzzles: p04, p08, p10, p11, p14, p15, q01, q02, q05, q08 and q09.
  - Some of those are lessons that gate the map.
  - q01 and q02 unlock right after p03 but are among the hardest.
  - A human should check these. Suggested: add hints, accept other solutions, and raise the 10-coin reward.
- **Fairmeet (tier 4)** is the first casual wall at about 40 runs. It is farmable.
- **Gloaming Crown (tier 10).**
  - The skilled bot wins 18% there and the casual bot 6%.
  - Clearing it needs 6 stages.
- **Endless.**
  - It unlocks after only 2 areas.
  - The shard milestones are out of reach for casual players.
  - Enemies do not actually grow with depth, even though the text says they do. The bag also grows by about one tile per fight.
- **Encyclopedia scores are stale.** They predate the additive rules and the level-8 cap. Wide tridents and forks score about 100, while tall boosts and multipliers score 11–19. Re-run `score.js` before tuning units.
- **Skill (hero) unlocks** at 15, 25 and 36 stages cleared land around the tier 7–9 walls.

## New-player experience (NEW, UI)
- **No pointer to the next step after the two lessons.** The home card still says "First Strike – LEARNED – Replay". Add a "Play Greenvale" call to action.
- **The first run starts with no explanations.** Nothing explains Bag, Loot, the board size, "atk 3" or the enemy attack tag. The first fight is easy to lose: 20 HP against three enemies with attack 3.
- **The "Losing HP" tutorial shows only after the damage.**
- **Colourless tiles look sandwiched but are not.** Their tutorial arrives only in stage 2.
- **Things appear before they are taught.**
  - The daily puzzle is open from the start and uses Boost and side-strike tiles nobody has taught yet.
  - "Fern shards" appear in rewards with no introduction.
  - The hourglass ("run only") badge is not explained.
- **Confusing text.**
  - The upgrade "4 → 4, second colour: Purple" reads like nothing changes.
  - "Hits the marked column for 3 each" uses "each" for a single tile.
  - Lesson 2 does not say sandwiches run left and right.
  - The fight hint text is cut off with "…".
  - The Endless popup says an area needs 3 stages, but Sunny Meadow has 2.
- **Heal is offered at full HP.**

## UI polish (UI, NEW)
- **Screens with wasted or cramped space.**
  - The result, reward and stage-cleared cards sit at the top of a mostly blank page.
  - The puzzle "Solved" screen hides the solved board.
  - Selecting a map stage at 360x640 makes the info card grow, which clips the bottom of the map.
- **How to play** is very long, and its only Close button is at the bottom; it does not stay on screen.
- **Slot popup at 360x640.** The filter chips take half of it, so only one row of tiles is visible. A vertical swipe may also reorder the list (unconfirmed).
- **Small glitches.**
  - The Reset save confirm label wraps onto two lines.
  - The "Hold for details" demo shows a blue tile while the lesson uses red, and shows enemy numbers that don't match.
  - Escape does not close popups (desktop only).
- **Tablets (820x1180).** The game is a narrow column in the middle, and the Attack bar sits mid-page.
- **Unconfirmed.** A long-press title read "undefined Red Strike 4", and a red notch showed on the Collected tab. Both may come from the tester's hand-made data.

## Robustness, minor (QA)
- **Saving can fail without warning.** If storage is full or blocked, progress is lost silently.
- **Two open tabs overwrite each other's save.**
- **Saves from another version are overwritten** with no migration or backup.
- **Daily puzzle and the date.**
  - A daily finished after midnight pays the new day's reward.
  - Setting the clock back grants the daily again.
- **`commitRun` has no guard against running twice.** Only a scripted double click triggers it; a real double tap pays once.
- **Very large numbers are not formatted.** For example, 1e+21 coins. Normal play never reaches these.

## Working well
- **No errors in normal play.** There were zero console errors across all testers, and no horizontal overflow at 360, 390 or 412 px wide.
- **Drag and drop.** About 40 touch drags left no ghost tiles. Drops off-screen, on blocked cells, with two fingers and during animations were all handled.
- **Reloads.** Reloading mid-offer, mid-fight or on any result screen resumes correctly.
- **Rapid taps and rewards.** Rapid taps never double-spend or double-reward. First-clear and replay rewards, and all 37 puzzle rewards, pay out exactly once.
- **Board placement.** Every tile shape was placed at every cell across 300 generated runs, and every offer had a placeable tile.
- **Clarity and feel.**
  - The live damage preview, long-press cards, lessons, keep-a-tile flow and level-up popup are clear and satisfying.
  - Dark mode is consistent.
  - The new Guide button works everywhere.
- **Early pacing.** Tiers 1–4 pace well for skilled play.

Full tester reports, screenshots and scripts are in the session scratchpad under `beta/ui`, `beta/bal`, `beta/new` and `beta/qa`.
