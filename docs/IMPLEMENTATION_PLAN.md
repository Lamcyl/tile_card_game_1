# Implementation plan: closing the gap between GAME_DESIGN.md and the prototype

Audit of `docs/GAME_DESIGN.md` (v0.2) against `prototype/js/*` and `tools/sim-runs.js`.
Sizes: S = under half a session, M = one session, L = more than one (split already applied below).

## 1. Already implemented (no work needed)

Board, turn phases, all 3 patterns, supporter math, Shield stacking, Barrel chains, Knight armor, overkill (engine.js); 9 starter card types; world map with 20 sub-areas, fog, free exploration, Supplies, boss unlocks (world-*.js, map.js); 210 permanent items, 3 equip slots, first-run guaranteed drop (items.js); Souls/Fortune/Vitality/Command/Drill/Bulwark/Provisions, recruit-by-boss (progress.js); post-battle choice of 1 of 3 (heal / +1 ATK / +1 block / +1 boost, range from region 2); retreat 100% / defeat 75% Souls; live numbers, idle-supporter dimming, hover reach, threat forecast, playback with speed toggle, drag and tap placement (battle.js).

## 2. Missing or partial features

| # | Design section | What is missing | Files | Size | Depends on |
|---|---|---|---|---|---|
| M1 | 14.2, 10.2 step 1 | Heroes: hero choice at run start, passive + once-per-battle ability (Marshal, Pyromancer, Quartermaster) | engine.js (ability hooks), progress.js, app.js, battle.js, battle.css | L | none |
| M2 | 11, 14.1 | Relics (run-only rule-bending effects) as a third reward option; reward screen becomes heal / upgrade / relic | new relics.js, engine.js (rule hooks), app.js | L | none |
| M3 | 11 | Stage rating (3 stars no damage, 2 stars at most 3 damage, 1 star clear); a 3-star clear gives an extra loot roll; Souls scale with stars (17) | battle.js, app.js, items.js (extra roll), gen.js (soulsFor) | S | none |
| M4 | 20 | Text battle log in the world battle screen (exists only in the sandbox ui.js) | battle.js, index.html, battle.css | S | none |
| M5 | 10.3, 19 | Results screen: path taken, furthest reach with previous best drawn as a ghost line (bestPath is saved, never drawn); `bestPath` is never updated | app.js, map.js (draw path layer), progress.js | M | none |
| M6 | 24.1 | Guaranteed first-run upgrade: first run pays at least the cheapest Camp upgrade, results screen points to it | app.js, progress.js | S | M5 (same screen) |
| M7 | 24.1, 21 | Tuning: gentler first sub-area with more Lv1-2 spots for 8-10 battles; steeper costs and enemy growth from region 2; verify with sim | world-layout.js (spot counts), world-data.js, gen.js, progress.js, tools/sim-runs.js | M | none |
| M8 | 8.1, 10.1 | Danger rating shown as skulls (1-5) on nodes and sheets (only a Lv badge exists) | app.js, map.js, style.css | S | none |
| M9 | 8.2, 19 | Battle templates by danger tier (layout + barrel/armor placement rules), one mechanic per Learn battle, solver validation: 1-turn zero-damage solution for tiers 2-3, none for tier 4+; currently fully random counts | gen.js, tools/solve.js, new tools/validate-gen.js | L | M8 helps naming |
| M10 | 7.2 | Later enemies: Healer, Splitter, Summoner, Bulwark enemy (block overkill/pierce) | engine.js (state, resolveTurn), world-data.js (themes), gen.js, battle.js (render, events) | L | M9 (placement) |
| M11 | 7.2, 8.2 | Handcrafted bosses and elites with one gimmick each (moves a column per turn, immune below x2); bosses are currently generated | engine.js, new boss-defs.js, gen.js, battle.js | L | M10 |
| M12 | 10.6, 11, 17 | Gold currency (earned in battle, lost at run end) and Shop node (relics, heals, unit upgrades) | progress.js, world-data.js, world-layout.js (spots), app.js, map.js (icon) | M | M2 for relic stock |
| M13 | 10.6, 11 | Shrine becomes heal OR upgrade; Event node (text choice, risk/reward); Treasure "sometimes guarded" | world-data.js, app.js, new events.js, map.js (icons) | M | none |
| M14 | 10.5, 10.6, 14.3 | Waypoints (reach one, later runs start there), Keys from elites/bosses, Secret nodes and secret paths, run start position | world-data.js, world-layout.js, progress.js (save), app.js, map.js | L | M13 |
| M15 | 10.5, 14.1 | Scouting: fog reveal radius, see node contents before travelling; Map expansion by account milestones | map.js (fog), progress.js, app.js | M | M14 |
| M16 | 12.2 | Squad rules: Command Points by rarity (cap 8, grows), must include at least one supporter (code only checks for an attacker), trait tags and 2/4/6 squad bonuses | progress.js, engine.js (trait bonus), app.js (squad tab) | M | M17 for rarity data |
| M17 | 12.1 | Unit rarities (Rare/Epic/Legendary units with rule-changing effects: armor-ignore, chain, revive) and roster data | progress.js (ROSTER), engine.js (new unit abilities), art.js | L | none |
| M18 | 12.1, 17 | Gacha: Crystals currency, pulls, duplicates to stars 1-5 and perk at 5, pity (Epic every 30), Recruitment Office, Dust from duplicates | progress.js, app.js (new Gacha tab), style.css | L | M17, M20 |
| M19 | 12.1 | Unit mastery (XP when used, perks and skins) | progress.js, app.js | S-M | M17 |
| M20 | 17, 11, 14.3 | Crystals earned from bosses, bounties, achievements; Dust currency plumbing | progress.js, app.js | S | none |
| M21 | 11, 14.3 | Bounties: 1-3 optional per-run goals paying Crystals | new bounties.js, app.js, battle.js (stat tracking) | M | M20 |
| M22 | 14.3 | Achievements: milestones, feats, bestiary (themed small bonuses), codex | new achievements.js, progress.js, app.js | M | M20 |
| M23 | 13.1, 13.2 | Equipment model: named slots (Weapon, Armor, Banner, Ring x2) instead of 3 generic; substats by rarity; Legendary with unique rule effect; item level from node danger; salvage-only inventory | items.js, progress.js, app.js (Gear tab) | L | none |
| M24 | 13.3 | Item sets with 2/4-piece bonuses (Wolfpack) | items.js, engine.js (set rules), app.js | M | M23 |
| M25 | 13.4 | Forge: salvage to Dust, spend Dust to reroll a substat or level an item | items.js, progress.js, app.js | M | M23, M20 |
| M26 | 13.5, 24.3 | Boss farming: 2-3 signature Legendaries per boss, bad-luck protection, boss tokens; elites guarantee an item (currently 40% roll) | items.js (rollDrop), progress.js, app.js | M | M23 |
| M27 | 14.1 | Missing Camp tracks: start-of-battle barrier, revive once, 4 reward choices, reward re-roll, Scouting, Board (6th column / 4th row), more starting gold; Camp visuals that grow | progress.js, engine.js (barrier, board size), app.js, battle.js (dynamic board), map.js | L | M15 (scouting), M12 (gold) |
| M28 | 15 | Heat modifiers (6 listed) and Descend (new game plus); unlocked after final boss | engine.js, gen.js, progress.js, app.js | M | M10 (heal modifier) |
| M29 | 18 | Pacing check and unlock cadence (an unlock almost every run, equipment slots unlock, first Epic around run 4-8) | progress.js, tools/sim-runs.js | S | most others |

## 3. Out of scope or open (one line each)

- Open question 1: enemies moving between rows. 2: bonus for one-turn clear (partly covered by M3 stars). 3: Barrels attacking. 4: turn limit. 5: player-chosen fire order. 7: x10 number scale. 8: supply costs on map (already decided: Supplies exist). 9: re-fighting cleared nodes. 10: retreat vs defeat payout. 11: real-money gacha.
- 24.5 open: cheaper or smaller rewards in conquered sub-areas.
- 6.6 Future cards (Echo Bell, Sniper, Twin Banner, Golden Horn, Bulwark shield, Ballista): content ideas, not scheduled.
- 16 Extra modes (Daily expedition with leaderboard, Endless tower): far-future, need server or new mode.
- 14.1 Board track late-game (6th column / 4th row) is only partly planned in M27 and may slip.
- 12.3 Monetization, art and audio, and new regions beyond the five: explicitly not prototype scope.

## 4. Work packages (in order)

Each package targets a mostly distinct file set so they can run one after another. `app.js` is the hot file; packages that touch it are ordered so each leaves it consistent.

| WP | Name | Items | Main files | Size |
|---|---|---|---|---|
| 1 | Battle feedback: stars and log (DONE) | M3, M4 | battle.js, battle.css, index.html, small hook in app.js and gen.js | S |
| 2 | Danger skulls and results/ghost path (DONE) | M8, M5, M6 | app.js, map.js, style.css, progress.js | M |
| 3 | Pacing tuning of early game | M7 | world-layout.js, world-data.js, gen.js, tools/sim-runs.js | M |
| 4 | Battle templates and solver validation (DONE) | M9 | gen.js, tools/solve.js, tools/validate-gen.js | L |
| 5 | New enemy mechanics | M10 | engine.js, world-data.js, battle.js | L |
| 6 | Handcrafted bosses and elites | M11 | boss-defs.js, engine.js, gen.js | L |
| 7 | Currencies and bounties | M20, M21 | progress.js, bounties.js, app.js | M |
| 8 | Equipment slots, substats, legendaries | M23, M26 | items.js, progress.js, app.js (Gear tab) | L |
| 9 | Forge and sets | M24, M25 | items.js, engine.js, app.js | M |
| 10 | Unit rarity and squad rules | M17, M16 | progress.js, engine.js, art.js, app.js (Squad tab) | L |
| 11 | Gacha, stars, pity, mastery | M18, M19 | progress.js, app.js (Gacha tab) | L |
| 12 | Relics | M2 | relics.js, engine.js, app.js (reward modal) | L |
| 13 | Node types: shop, shrine choice, events | M12, M13 | world-data.js, world-layout.js, events.js, app.js, map.js | M |
| 14 | Map expansion: waypoints, keys, secrets, scouting | M14, M15 | world-data.js, world-layout.js, map.js, progress.js, app.js | L |
| 15 | Heroes | M1 | engine.js, progress.js, app.js, battle.js | L |
| 16 | Camp upgrade tracks and Camp visuals | M27 | progress.js, engine.js, app.js, battle.js, map.js | L |
| 17 | Achievements and bestiary | M22 | achievements.js, progress.js, app.js | M |
| 18 | Heat, Descend, pacing pass | M28, M29 | engine.js, gen.js, progress.js, app.js, sim-runs.js | M |

### Briefs

**WP1 Battle feedback.** In `battle.js` compute the rating on clear (3 stars if `damageTaken` is 0, 2 if at most 3, else 1) and show it in the victory banner. Pass `stars` back through `onEnd`; in `battleOver` (app.js, minimal edit) give 3-star clears one extra `Items.rollDrop` and scale `Gen.soulsFor` by stars. Add a scrolling text battle log panel to the world battle screen (port the sandbox `ui.js` log: shot, hit, overkill, explosion, strike, enrage lines) with a collapse toggle. No rules change.

*Done:* stars in the victory banner (`Gen.starsFor`), 3 stars gives a second `rollDrop` and Souls x1 / x1.15 / x1.3 for 1 / 2 / 3 stars; collapsible battle log under the controls (collapsed by default on screens under 900px high).

**WP2 Danger skulls and results screen.** Add a `danger(level)` helper (Lv1-3 = 1 skull, 4-6 = 2, 7-9 = 3, 10-12 = 4, 13+ = 5) and show skulls on node sheets and map markers alongside Lv. Rebuild the end-of-run modal: show the route, furthest reach vs previous best, update `bestPath` (never written today), and draw `lastPath` and `bestPath` as a faint ghost polyline on the map when back at Camp. Add the first-run guarantee: if `save.runs === 0` top Souls up to the cheapest Camp upgrade cost, and add a button on the results screen that jumps to the Upgrades tab.

*Done:* `World.danger(level)` drives skulls on sheets and map pips (`map.js` `lvlDifficulty` now uses it); results modal with route, reach vs previous best, `bestPath`/`prevBestPath` saved, ghost lines drawn at Camp by `drawGhostPaths` in `map.js`; first run tops Souls up to the cheapest upgrade (`Progress.cheapestUpgrade`) with a "Go to Upgrades" button that pulses the buy button.

**WP3 Early pacing.** Using `tools/sim-runs.js`, retune the first sub-area to get 8-10 battles on a fresh account: add Lv1-2 spots to Sunny Meadows in `world-layout.js` (the contract allows 4-5 ordinary spots, so extend only if the spec is updated), soften early curves in `gen.js`, and make upgrade costs and enemy ramp steeper from region 2. Update the numbers quoted in design section 23 after measuring.

*Done (WP3):* no layout change; Meadows spots now Lv 1,1,1,2,2 (floor spread), early bosses (Lv<=4) bring 2 minions, Old Oak Wood is Lv 3-4 (boss 5), enemy ramp above Lv7 softened to +7% HP / +0.35 ATK per level, bosses cap at 5 minions, Isles/Temple bosses Lv 9, Camp costs and recruit costs raised from tier 2 on (+1 extra level on Vitality/Drill/Bulwark/Fortune), Souls stars x1 / x1.25 / x1.5. Sim (stars on): fresh account ~10 battles (6 when the Lv4 boss wins, 11-16 when it falls); campaign: Greenvale cleared run 3-6, Azure/Sunscorch first boss run 4-7, Snowdrift (Frostveil) unlocked run 15-25 in 3 of 4 campaigns, Ash Fields (Ember) once at run 18.

**WP4 Templates and solver validation.** Replace the random placement in `gen.js` with named templates per danger tier (layout shapes plus barrel and armor placement rules); tier 1 teaches one mechanic per fight. Extend `tools/solve.js` into a batch validator that, for many seeds and a reference squad, asserts: tier 1 is trivial, tiers 2-3 have a 0-damage 1-turn solution, tier 4+ has none and the best line costs 1-4 HP. Fail CI-style with a report. Tune templates until it passes.

*Done (WP4):* ordinary battles come from 13 named templates in `gen.js` (`Gen.TEMPLATES`, row strings for back/front, random mirror, per-template HP/ATK scale) by `World.danger`: tier 1 one idea per fight (attack, range, boost, overkill, barrel, shield, armor), tiers 2-3 hidden one-turn clears, tier 4-5 "Survive" layouts with a heavy enemy; bosses/elites keep the old random generator until WP6 (Lv<=6 bosses got +HP, Souls x0.8, to hold WP3 pacing). `tools/solve.js` exports its solver; `node tools/validate-gen.js [seeds] [tiers]` is the batch validator (exit 1 plus report on failure).

**WP5 New enemy mechanics.** Add Healer (heals neighbours by 2 at end of turn), Splitter (spawns two 1-HP enemies on death), Summoner (adds a Goblin each turn) and Bulwark (blocks overkill and pierce to the tile behind) to `engine.js` `createState` and `resolveTurn` with new events; extend `battle.js` rendering and playback for the new events, register the types in `world-data.js` themes for regions 3+, and let `gen.js` use them at tier 4+. Keep the engine pure so `solve.js` still works.

*Done (WP5):* special rules are a per-enemy `kind` (`healer`/`splitter`/`summoner`/`bulwark`, plus `minion {type,hp,atk}`) handled in `engine.js` (new events `spawn`, `heal`, `bulwark`; `Engine.ENEMY_KINDS`), so any themed creature can carry one and no new art or theme roles are needed; `battle.js` shows a coloured badge and ring, a rule hint before the fight, and plays spawn/heal/blocked animations; `gen.js` tier 4-5 templates `mender`, `brood`, `hive`, `bulwark` (one teaching template each, chars m/s/u/k); `validate-gen.js 40` passes 195-200/200 per run (the annealing solver is stochastic, so 1-5 edge cases drift between runs, also in WP4 templates); fresh-account sim 9.3 battles, campaign unlock times unchanged (Frostveil run 18, Ember run 22).

**WP6 Handcrafted bosses and elites.** Move boss fights out of the generic generator into a `boss-defs.js` table with one gimmick per boss (for example moves one column each turn, or ignores damage below x2). Implement gimmicks as engine hooks, add UI telegraphs, and give elites small fixed variants. Validate each with the solver from WP4.

*Done (WP6):* 20 bosses and 20 elites are handcrafted in `js/boss-defs.js` (fixed layouts, never mirrored) and built by `Gen.fromDef`; eleven boss gimmicks live in the engine (`Engine.ENEMY_GIMMICKS`: guard, ward, veil, gaze, sweep, stride, tide, regrow, regen, rage, harden; new events `move`, `tide`, `regrow`, `rage`, `harden`, `hit.warded`) next to the WP5 kinds, shown as a badge, an intro line in the battle message/log and a note on the node sheet; `validate-gen.js bosses` solves every boss/elite with a tier reference squad (+ run ATK upgrades); WP5 tier-5 edge cases (`brood`, `bastion`) retuned and the survive-tier check retries with a stronger search, so `validate-gen.js 40` passes cleanly; see GAME_DESIGN section 24 for the pacing numbers.

**WP7 Currencies and bounties.** Add Crystals and Dust to the save with HUD chips and a small currency bar in Camp; award Crystals for first boss kills. Add a `bounties.js` module that rolls 1-3 optional goals per run (win N battles without Shields, kill a boss with overkill), tracks them through battle events and pays Crystals on completion in the end-of-run modal.

**WP8 Equipment model.** Rework `items.js`: named slots (Weapon, Armor, Banner, Ring x2), item level from node danger, Rare/Epic substats, Legendary with a unique rule-changing effect (implemented as engine flags, for example overkill carries sideways). Migrate saves (bump the save key or add a migration). Add boss signature Legendaries, bad-luck protection counters and boss tokens in the save, guaranteed elite drops, and update the Gear tab.

**WP9 Forge and sets.** Add salvage-to-Dust and Dust spending (reroll one substat, level up an item) in a Forge tab. Add item sets with 2/4-piece bonuses (start with Wolfpack: Banners boost diagonally, then +1 ATK next to a Banner) via a set-bonus resolver in `items.js` and engine support for the diagonal boost.

**WP10 Unit rarity and squad rules.** Add rarity and trait fields to `ROSTER`, introduce Rare/Epic/Legendary units (Longbowman, Storm Mage, Phoenix Archer) with their rule effects in the engine, Command Point costs (Common 1, Rare 2, Epic 3, Legendary 4) against a cap of 8 that grows with Command upgrades, trait bonuses at 2/4/6, and enforce at least one supporter and one attacker before setting out. Rework the Squad tab accordingly.

**WP11 Gacha.** Add a Gacha tab: Crystal pulls with rarity odds, duplicates raising stars 1-5 (small stat steps, perk at 5), a pity counter (Epic every 30 pulls), Recruitment Office exchange of duplicates, duplicate-to-Dust conversion, and unit mastery XP with perks. Keep boss-gated direct recruits only as a fallback for commons.

**WP12 Relics.** New `relics.js` with a dozen rule-bending relics (barrels explode twice, supporters boost diagonally, overkill kills grant ATK, first Shield blocks double) implemented as engine rule flags passed in the run state. Offer them in the post-battle choice (heal / upgrade / relic), show owned relics in the HUD, and reset them each run.

**WP13 Shop, shrine choice, events.** Add Gold to runs (earned per battle, spent in shops, lost at run end). Add node types Shop (relics, heals, unit upgrades), Event (text choices with risk/reward in `events.js`), turn Shrine into "heal or upgrade a unit", and make some Treasure nodes guarded. Place them in `world-layout.js`/`world-data.js` and add map icons.

**WP14 Map expansion.** Add Waypoint nodes (saved in `save.waypoints`, selectable as run start), Keys dropped by elites/bosses that open locked paths and hidden regions, Secret nodes found through events or 3-star clears, and Scouting (fog reveal radius and previewing node contents, tied to a Camp track). Update the fog renderer in `map.js` and the WORLD_SPEC contract (new feature fields).

**WP15 Heroes.** Add a hero roster (Marshal swaps two units mid-turn, Pyromancer ignites a barrel, Quartermaster +1 reward choice) with unlock milestones, a hero picker at run start, a passive plus a once-per-battle ability button in `battle.js`, and engine support for mid-turn actions.

**WP16 Camp tracks and visuals.** Add the missing Camp upgrades: start-of-battle barrier, one revive per run, 4 reward choices, one reward re-roll, Scouting, extra starting gold, and the late-game Board track (6th column or 4th player row, which needs a dynamic board size in engine and battle render). Make the Camp scene grow visually (tents, forge, banner hall) in `map.js`.

**WP17 Achievements and bestiary.** Add `achievements.js`: milestones (unlock slots and Command Points), feats (clear with one attacker, 4-barrel chain), bestiary counters with small themed bonuses (+1 damage vs Knights after 50 kills), and a codex of bosses and events. Add an Achievements tab with Crystal rewards.

**WP18 Heat, Descend, final pacing.** After the final boss unlock Heat modifiers (the six listed, with point values and reward multiplier) and Descend (harder whole map). Wire into engine and `gen.js`, then run the campaign simulation and adjust unlock cadence to match section 18 pacing.
