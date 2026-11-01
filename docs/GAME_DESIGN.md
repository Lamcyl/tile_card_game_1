# Tile Defense: Gameplay Design Document

> Working title. Art style, setting and platform are not decided yet. This document covers **gameplay only**.
> Status: v0.2, with a gameplay prototype in `prototype/`. v0.2 adds the progression design (sections 9–19).

---

## 1. One-line pitch

A turn-based placement puzzle with roguelite expeditions. You arrange a small squad of units on a grid to destroy the enemies in front of you; most battles are settled in one or two turns. Each run sets out from Camp across a large world map, choosing its own fights until HP runs out. Early runs end after a few battles, and permanent progress (new units, equipment, Camp upgrades) lets every run reach further into the map.

## 2. Design pillars

1. **Simple to read.** Every card shows one number and one arrow. A new player understands the board within 10 seconds.
2. **Placement is the game.** There is no card draw and no randomness in combat. Every outcome comes from where you put your cards.
3. **HP is the long-term resource.** HP never regenerates by itself, so a sloppy win now costs you stages later.
4. **Short stages.** Each stage is designed to finish in 1–2 turns, and enemies enrage to punish dragging a fight out.
5. **Depth comes from content, not rules.** New cards and enemies add depth. The core rules stay the same all game.
6. **Every run makes progress.** Even a short run banks loot and Souls and reveals more of the map. Reach is the main measure of getting stronger.

---

## 3. Core loop

```
 ┌───────────── RUN (expedition) ────────────────────────────────┐
 │                                                               │
 │   Camp ──► Choose a node on the world map ──► Battle          │
 │                ▲                                │             │
 │                │      Place squad ──► Fight ──► Enemies left? │
 │                │          ▲                  yes │    │ no    │
 │                │          └──(rearrange, enrage)─┘    ▼       │
 │                └──── Reward (heal / upgrade / relic) ◄ Clear  │
 │                                                               │
 │   HP 0 (defeat) or Return to Camp (retreat) ──► Run over      │
 └───────────────────────────────────────────────────────────────┘
                     │  items, Souls, Crystals, map revealed
                     ▼
   Permanent progress (roster, equipment, Camp, map unlocks) ──► Next run reaches further
```

Sections 9–19 describe progression in detail.

---

## 4. The board

```
  col:   0     1     2     3     4
       [ E ] [ E ] [ E ] [ E ] [ E ]   row 0  enemy back row
       [ E ] [ E ] [ E ] [ E ] [ E ]   row 1  enemy front row
       ═════════════════════════════
       [ P ] [ P ] [ P ] [ P ] [ P ]   row 2  your front row
       [ P ] [ P ] [ P ] [ P ] [ P ]   row 3  your middle row
       [ P ] [ P ] [ P ] [ P ] [ P ]   row 4  your back row
                   🧙 Hero (HP)
```

- 5 columns: 2 enemy rows and 3 player rows.
- All tiles are identical. There is **no terrain**.
- **Distance** is counted in rows upward. From your front row, the enemy front row is 1 away and the enemy back row is 2 away. From your back row, they are 3 and 4 away.

---

## 5. Turn structure

Each turn has four phases, always in this order:

| # | Phase | What happens |
|---|---|---|
| 1 | **Plan** | Place or rearrange any of your cards on your tiles. There is no time limit. |
| 2 | **Boost** | Supporters apply their bonuses. The final numbers are shown on the cards *before* you press Fight. |
| 3 | **Attack** | Attackers fire one at a time: **front row first, then left to right**. Damage is applied immediately, so later attackers see the updated board. |
| 4 | **Enemy strike** | Every surviving enemy deals its ATK to your hero. A Shield in the same column absorbs damage first. |
| 5 | **Enrage** | If any enemies survive, each one gets **+1 ATK**. Then the next turn begins. |

- **Stage clear:** every non-Barrel enemy is destroyed. This is checked as soon as the attack phase ends, so a full clear means you take **no damage** that turn.
- **Defeat:** hero HP reaches 0. The run ends.
- Your cards stay where you left them between turns, and you can rearrange them freely.

---

## 6. Cards

### 6.1 Card anatomy

```
┌──────────┐
│ 🏹     ★ │  ← icon, ★ = upgraded
│   ⚔2     │  ← main number (ATK / bonus / block)
│  ↑  R4   │  ← pattern + range (or supporter direction)
│  ARCHER  │
└──────────┘
```

### 6.2 Card roles

| Role | What it does | Shows |
|---|---|---|
| **Attacker** | Deals its ATK to the enemies its pattern hits | ⚔ ATK, pattern, R range |
| **Supporter** | Modifies the attacker(s) it points at. Supporters do nothing on their own | +N, ×N or R+N, and a direction |
| **Defender** | Absorbs enemy damage in its column | 🛡 block value |

### 6.3 Attack patterns (only three)

| Glyph | Pattern | Rule |
|---|---|---|
| **↑** | Straight | Hits the **first** living enemy in its column, if it is within range. |
| **⇈** | Pierce | Hits **every** living enemy in its column that is within range. |
| **↖↑↗** | Spread | Hits the first living enemy in its own column and in each neighbouring column (if within range). |

"First enemy" means the front-row enemy if it's alive, otherwise the back-row enemy. If the first enemy in a column is out of range, a Straight attack in that column **misses**. It doesn't skip to another target.

### 6.4 Supporter rules

- A **↑** supporter boosts the card **directly above it** (one row toward the enemy).
- A **✚** supporter boosts the cards on **all 4 sides**.
- Supporters only boost **attackers**. A supporter pointing at another supporter, a Shield or an empty tile does nothing, and the UI dims it.
- **Math order:** add all **+** bonuses first, then apply all **×** multipliers. Two ×2s make ×4.

### 6.5 Starter card list

These are the **common units** every player starts with (see section 12 for rarer units).

| Card | Role | Base value | Pattern | Range | Notes |
|---|---|---|---|---|---|
| Swordsman 🗡️ | Attacker | ⚔3 | ↑ | 1 | High damage, but must stand in the front row |
| Archer 🏹 | Attacker | ⚔2 | ↑ | 4 | Hits from anywhere |
| Spearman 🔱 | Attacker | ⚔2 | ⇈ | 3 | Hits both enemy rows |
| Mage 🔮 | Attacker | ⚔1 | ↖↑↗ | 3 | Hits up to 3 enemies |
| Drummer 🥁 | Supporter | +1 ATK | ↑ | – | |
| Banner 🚩 | Supporter | +1 ATK | ✚ | – | Can boost up to 4 attackers |
| War Horn 📯 | Supporter | ×2 ATK | ↑ | – | The key combo piece |
| Spyglass 🔭 | Supporter | +1 range | ↑ | – | Lets back-row attackers reach |
| Shield 🛡️ | Defender | 🛡2–3 | column | – | Absorbs up to N damage per turn in its column. Shields in the same column stack |

### 6.6 Future cards (content ideas, same rules)

- **Echo Bell** ⟳: the attacker above it fires twice.
- **Sniper**: ⚔5, Straight, range 5, but it can only target the enemy back row.
- **Twin Banner**: +2 ATK to the left and right only.
- **Golden Horn**: ×3, but it occupies 2 tiles.
- **Bulwark**: a Shield that also gives +1 block to adjacent Shields.
- **Ballista**: ⚔4 Pierce, but it must be in the back row.

---

## 7. Enemies

Each enemy shows **♥ HP** and **⚔ ATK**. ATK doubles as the telegraph: it's exactly how much damage that enemy will deal to you if it survives.

| Enemy | Rule | Teaches |
|---|---|---|
| Goblin 👺 / Orc 👹 / Skeleton 💀 | Plain HP and ATK | Basic targeting and kill priority |
| **Barrel** 🛢️ | 1 HP, 0 ATK. When destroyed it deals 2 damage to each orthogonally adjacent enemy, and chains to other Barrels. It does not need to be destroyed to clear the stage. | Chain reactions, area damage |
| **Knight** 🗿 (Armored N) | Each hit deals N less damage, including explosions and overkill | Stack one big hit instead of many small ones |

### 7.1 Combat interactions

- **Overkill:** when a **Straight** or **Spread** hit destroys a front-row enemy, the extra damage carries to the enemy directly behind it. **Pierce** hits don't carry, because they already hit both rows.
- **Explosions** are separate hits. They are affected by armor and do not overkill.
- **Order matters:** an enemy destroyed by an earlier attacker can't be hit again, and later Straight attacks move on to the next enemy in that column.

### 7.2 Later enemies (outer regions)

| Enemy | Rule |
|---|---|
| Healer ✚ | Heals each orthogonally adjacent enemy by 2 (up to its max HP) at the end of each turn it survives |
| Splitter ⑂ | Splits into two 1♥ enemies (in its tile and an empty neighbour; they attack at once) when destroyed |
| Summoner ⚑ | Adds a minion (about 40% of its HP, 60% of its ATK) to the nearest empty enemy tile at the end of each turn it survives |
| Bulwark ⛨ | Armored. Blocks overkill and Pierce from passing to the tile behind it when in the front row |

These are rules carried by an ordinary themed creature (the engine's `kind` field), shown with a coloured badge and ring plus a rule hint before the fight. They appear from Lv10 (danger 4) in the templates `mender`, `brood`, `hive` and `bulwark`; Summoner minions and Splitter halves use the area's basic creature.
| Boss | Large HP, high ATK and one gimmick (see 7.3). Handcrafted, one per sub-area |

### 7.3 Boss gimmicks and elites

Every boss is a fixed layout from `js/boss-defs.js` with one rule, announced by an intro line (`👑 Name`, rule badge) when the fight opens and on the node sheet. A boss either carries an engine **gimmick** (`Engine.ENEMY_GIMMICKS`) or one of the 7.2 kinds. The badge on the enemy repeats the rule; hover shows the text.

| Boss (sub-area) | Rule |
|---|---|
| Sansin (Sunny Meadows) | **Guarded ♜**: takes no damage while its tiger guard lives; overkill from the guard's death carries on to Sansin |
| Yamata no Orochi (Old Oak Wood) | **Regrow ❀**: its heads grow back once (at the end of a turn, unless the whole board fell) |
| Qiongqi (Bamboo Valley) / Nidhogg (Frozen Lake) | **Hide ◈**: hits weaker than 3 / 4 damage do nothing |
| Medusa (Mirror Lake) | **Gaze ◉**: attackers in her column lose 1 ATK |
| Scylla (Shell Beach) / Surtr (Ash Fields) | **Sweep ≋**: also strikes both neighbouring columns for half damage |
| Poseidon (Coral Shallows) | **Tide 〰**: the back row drifts one column left and the front row one column right each turn |
| Hydra (Shipwreck Cove) | **Regenerate ✚**: heals about 12% of its HP every turn |
| Typhon (Mist Isles) | **Fury ♨**: +1 extra ATK every turn it survives |
| Apep (Dune Sea) | **Harden ▣**: +1 armor per turn (up to 3) |
| Set (Palm Oasis) / Vucub-Caquix (Obsidian Ridge) | **Stride ⇄**: sidesteps one column per turn, swapping with whoever is there |
| Ah Puch (Red Canyon) / Hel (Rime Forest) / Jangsan-beom (Snowdrift) / Loki (Ember Falls) | The Summoner / Healer / Bulwark / Splitter rule of 7.2, on the boss itself |
| Ra (Buried Temple) / Morana (Glacier Throne) | **Veiled ☁**: cannot be hurt on turn 1 (clear the escort first, strike on turn 2) |
| Zmey Gorynych (Magma Caldera) | Three heads that **regrow ❀** around the boss |

Elites are small fixed variants (no gimmick of their own, a note on the sheet): brute with escort, heavy bodyguard, armoured pair, powder gang (heavy between barrels), Bulwark wall, Splitter brood, Summoner hive and Healer field hospital, assigned per sub-area. Boss and elite HP is the level's base HP times a tuned factor with the full growth ramp of 24.1. `tools/validate-gen.js bosses` solves all 40 with the reference squad of that tier (plus the ATK upgrades a run has earned by then): no boss falls in one turn, and the best line clears within 4 turns (usually 2-3) at a bounded HP cost.

---

## 8. Stage design

### 8.1 Difficulty by danger

Difficulty depends on a node's **danger rating**, which rises with distance from Camp and with the region (section 10).

| Danger | Expected turns | Player goal | What's new |
|---|---|---|---|
| **☠ Learn** (near Camp) | 1 | Find the obvious placement | One mechanic per battle: attack, range, +, ×, Shield |
| **☠☠ to ☠☠☠ Think** | 1–2 | Find the clever one-turn clear | Barrels, armor, back-row enemies, overkill |
| **☠☠☠☠+ Survive** | 2 (a one-turn clear is usually impossible) | **Minimize damage** | Healer, Summoner, Splitter. Gimmick bosses |

### 8.2 Stage design rules

- Ordinary battles are built from **templates** (enemy layouts plus placement rules for barrels and armor) scaled by danger. Elites and bosses are **handcrafted** (7.3). Everything is validated by the solver (`tools/solve.js`).
- ☠: the solution is visually obvious.
- ☠☠–☠☠☠: a one-turn, zero-damage solution **must exist**, but random placements should almost never find it.
- ☠☠☠☠+: a one-turn clear should **not** exist. The best line should cost a small amount of HP (1–4), while a careless line costs 3–4× that.
- Total enemy ATK should be clearly higher than the hero's expected HP at that point, so ignoring the board is always fatal.

### 8.3 Prototype stages (for reference)

| Stage | Name | Hero HP | Army | Solver result |
|---|---|---|---|---|
| 6 | Powder Alley | 17/20 | 6 cards | Clearable in 1 turn with 0 damage (barrel and overkill combo) |
| 9 | The Iron Line | 14/20 | 8 cards | Clearable in 1 turn with 0 damage, a tight puzzle |
| 12 | The Siege | 11/20 | 9 cards | No 1-turn clear. The best found is 3 damage over 2 turns, and a careless first turn costs 6–11 |

---

## 9. Progression overview

Progression runs on three nested loops:

```
 BATTLE   (1–2 turns)        a placement puzzle on the 5×5 board
    │  win → gold, loot, stars
    ▼
 RUN      (an expedition from Camp; ends when HP runs out or you return)
    │  choose encounters on the world map · rewards after battles · relics · shops
    │  run ends → items kept, Souls, Crystals, map revealed, achievements
    ▼
 ACCOUNT  (permanent)
    roster (gacha) · equipment · Camp upgrades · heroes · map unlocks · Heat
    └─► you reach further into the map on the next run
```

**Principles**

1. **Reach is the main measure of progress.** The clearest sign that you got stronger is that you reached somewhere new on the map.
2. **Every run makes permanent progress**, even a run that ends after two battles. Short early runs are expected, not a failure.
3. **Progress adds options more than numbers.** New units, effects, routes and rules come before bigger stats. Where numbers do grow, enemies scale with distance, so battles stay puzzles.
4. **Numbers stay whole.** Every buff is a whole number on a specific card type (see 13.2), so the board always shows the exact value the puzzle needs.

---

## 10. The world map and runs

Inspired by incremental exploration games such as *Our Ascent*, *Hero's Quest* and *InflationRPG*: the map is large, a run only gets part of the way across it, and progress between runs pushes your reach further each time.

### 10.1 Structure

- **One large, persistent world map**, made of encounter nodes connected by paths, spreading out from the **Camp** at its centre (or one edge).
- The map is divided into **regions** (Goblin Woods, Iron Keep, Sunken Crypt, …). Each region has its own enemy set, encounter pool, boss and loot table.
- Every node shows a **danger rating** (☠ to ☠☠☠☠☠) that depends on its distance from Camp and its region. Rewards rise with danger. *(Prototype: skulls are derived from level: Lv1-3 = 1, 4-6 = 2, 7-9 = 3, 10-12 = 4, 13+ = 5, shown on sheets and above map monsters.)*
- Unexplored parts of the map are under **fog**. Nodes you have seen stay revealed permanently. *(Implemented, WP14: locked sub-areas are fogged; inside an unlocked one, far ordinary/elite spots are silhouettes until the hero has been near or scouted, see 24.6.)*

### 10.2 A run (an expedition)

1. Choose a **hero**, a **squad** from your roster (section 12) and your **equipment** (section 13).
2. Start at Camp, or at an unlocked **waypoint** (10.5), with full HP.
3. **Move freely.** (Prototype: every spot of an unlocked sub-area is open at once and Rations limit the run, see 24.5.) From your current node you can travel to any connected, revealed node. You choose which fights to take, which way to go and how deep to push. Nothing forces you down a fixed path.
4. Each node is cleared once per run. Taking easy nodes near Camp is safe but pays little, so you are always pulled outward.
5. HP carries from battle to battle and never regenerates on its own. Camp-style nodes, relics and some rewards can heal.
6. **The run ends** when your HP reaches 0 (defeat) or when you choose **Return to Camp** (retreat).

### 10.3 Ending a run

| Ending | Items found | Souls ✦ | Notes |
|---|---|---|---|
| **Retreat** (choose to return) | Kept | 100% | Safe banking: a push-your-luck decision |
| **Defeat** (HP 0) | Kept | 75% | Still always progress |

- Revealed map, defeated bosses, unlocked waypoints and achievements are always kept.
- **Gold** and **relics** belong to the run and are lost either way.
- The results screen shows the path you took and your **furthest reach**, with the previous best drawn as a ghost line, so progress is visible even on a short run. *(Implemented: the route, reach vs best, and ghost lines on the Camp map; furthest reach = deepest level, ties broken by longer route.)*

### 10.4 Expected reach

| Stage of the game | Typical run |
|---|---|
| First runs | 2–4 battles, near Camp only. The map is mostly fog. |
| After a few hours | Clears the first region and attempts its boss. |
| Mid game | Chains 2–3 regions, starts from a waypoint, farms specific bosses. |
| Late game | Full map, hidden regions, Heat levels, endless tower. |

Early unlocks should come quickly (one meaningful unlock almost every run) so short runs feel rewarding.

### 10.5 Expanding your reach

| Unlock | How | Effect |
|---|---|---|
| **Waypoints** | Reach one during a run | Later runs can start there (encounters near it become your new "easy" ring) |
| **Gates and bridges** | Defeat a region boss | The next region opens **from the next run** |
| **Keys** | Elite or boss drops | Open locked paths and hidden regions |
| **Scouting** | Camp upgrade or equipment | Reveal more of the fog around you, so you can plan routes |
| **Secret paths** | Events, 3-star clears, beating a boss in a specific way | Shortcuts and hidden nodes |
| **Map expansion** | Account milestones | New outer regions are added to the map (like new floors in *The Binding of Isaac*) |

### 10.6 Encounter types

| Node | What it offers |
|---|---|
| ⚔ Battle | A normal stage from the region's pool |
| 💀 Elite | A harder stage with a guaranteed item drop |
| 👑 Boss | A fixed, handcrafted fight with signature loot. Unlocks the next region |
| 💰 Treasure | Free loot, sometimes guarded |
| 🛒 Shop | Spend gold on relics, heals and unit upgrades |
| 🔥 Shrine | Heal **or** upgrade a unit (one choice) *(implemented, WP13)* |
| ❓ Event | A short text choice with a risk and a reward |
| 🗝 Secret | Hidden until found |
| 🚩 Waypoint | Unlocks a new starting point |

- **Landmarks** (bosses, shrines, waypoints, gates) are fixed, so the map becomes familiar and players can plan routes.
- **Ordinary nodes re-roll each run** from the region's pool, so each run's route is different.

---

## 11. In-run progression

- **After each battle, choose 1 of 3 (or more):** the size of the choices **grows with the fight's level and type** (24.8, "Power curve"; a Lv15 boss is worth several Lv3 fights).
  - ❤️ **Heal** HP: (4 + 0.6 x Lv) HP, x1.25 elite, x1.5 boss.
  - ⬆️ **Upgrade** a unit for this run: +N ATK (N = 1 at Lv1-11, 2 from Lv12, elites 1-3, bosses 1-4), +N/2 block or boost, or +1 range (rare, region 2+). A unit's run bonus is capped by the deepest level reached on the run (ATK cap 1.5 + 0.3 x Lv), so deep fights fill the cap fast and shallow ones barely move it.
  - 📣 **Warcry**: every attacker +1 ATK (bosses from Lv9, elites from Lv11, ordinary fights from Lv13 one time in four). 💪 **Fortify**: +(1 + Lv/3) max HP for the run (from Lv6, replaces the Warcry slot).
  - 💠 **Relic**: a run-only effect.
- **Relics** give each run its own identity, even with the same squad. They bend rules rather than adding stats:
  - "Barrels explode twice."
  - "Supporters also boost diagonally."
  - "+1 ATK for every enemy killed by overkill this run."
  - "The first Shield each battle blocks double."
  - *(Implemented, WP12: `js/relics.js`, 12 relics with Norse, Greek, Egyptian, Shinto and Vedic names, e.g. Mjölnir Shard (barrels explode twice), Prism of Ra (supporters boost diagonally), Fenrir's Fang (each overkill kill gives attackers +1 ATK for the battle, max +3), Aegis of Athena (Shields block double on turn 1 of a battle, a simplification of "first Shield"). A relic replaces one of the two upgrade choices: always after elites and bosses, about 40% of other wins, no duplicates, at most 4 per run. They are engine rule flags in `state.rules`, kept in the run state and lost when the run ends.)*
- **Gold** is earned in battles and spent at shops and events. It resets when the run ends. *(Revised: a Wayside Market can be browsed any number of times and closes only after ONE item is bought, with a clear warning before; see 24.7.)* *(Implemented, WP13: a fight pays (3 + 7 w(level)) Gold (WP19, was 3 + 1.5 x level), x1.25 / x1.5 for 2 / 3 stars, x2 elite, x3 boss; caches pay 8 +2 per region, a cache guard 16 +3 per region. Shops (🛒 Wayside Market, 10 sub-areas) sell a heal (+8 HP, 14), two unit upgrades (22; range 32) and a relic (40) or a +2 max HP tonic once the relic cap is reached, prices +20% per region; each ware once, the shop closes when you leave. Event nodes (`js/events.js`, 15 vignettes, 3 per region, Korean / Slavic / Greek / Japanese / Egyptian / Maya / Norse myth) offer 2-3 choices, some with a Gold cost and a random outcome (HP is never taken below 1). The Shrine is now one choice: heal 8 HP or one of two unit upgrades. Six treasure caches are guarded: beating an armored patrol at the sub-area's top level (costs 1 Ration) opens the chest. Shops, events, shrines and unguarded caches cost no Rations.)*
- **Stage rating:** ★★★ for no damage, ★★ for 3 or less, ★ for a clear. A ★★★ clear gives an extra loot roll, rewarding a well-solved puzzle. Souls scale with the rating (prototype: ×1 / ×1.25 / ×1.5). *(Implemented.)*
- **Bounties:** each run offers 1–3 optional goals ("Win 3 battles without Shields", "Kill a boss with overkill") that pay Crystals. *(Implemented, WP7: `js/bounties.js`; seven kinds (no Shield, ★★★, overkill count, boss overkill, one-turn win, barrels, elite), 2-5 💎 each, rolled at run start, shown in the run sheet, paid when the run ends even after a defeat.)*

---

## 12. Roster and squad (gacha)

### 12.1 The roster

- New units are pulled from a **gacha** after runs, using **Crystals 💎**.
- Rarity changes **what a unit does**, not only its numbers:

| Rarity | Example |
|---|---|
| Common | Archer ⚔2 ↑ R4 |
| Rare | Longbowman ⚔2 ↑ R5, ignores armor |
| Epic | Storm Mage ⚔2 ↖↑↗, chains to one more enemy |
| Legendary | Phoenix Archer ⚔3 ⇈ R5, revives once per run |

*Implemented (WP10):* Longbowman (Draugr, Rare), Storm Mage (Typhon, Epic, chain hits the lowest-HP enemy next to a struck one for the same damage) and Phoenix Archer (revives at half max HP, once per run) exist and are bought with Crystals until the WP11 gacha; Wukong, Talos, Perun, Lei Gong and Ix Chel are Rare with +1 to their main number.

- **Duplicates** add stars (★1–★5), each a small upgrade. ★5 unlocks a **unit perk**. *(Implemented, WP11: ★2/★4 give shared HP, ★3 +1 ATK/block/boost, ★5 +1 range/block/boost; a duplicate also gives a Seal, and a duplicate of a ★5 unit turns into Dust.)*
- **Pulls:** 💎 4 each (10 for 36; 3 and 27 before WP18); Common 62 / Rare 28 / Epic 9 / Legendary 1 %. Rare and above come only from the gacha; Commons can still be bought with Souls after their boss falls.
- **Pity:** a guaranteed Epic every 30 pulls. A **Recruitment Office** trades Seals (one per duplicate; 4 Common, 6 Rare, 8 Epic, 10 Legendary) for a unit of that rarity of your choice, so bad luck never locks out a strategy.
- The common units from section 6.5 are the starting roster. Every region must be beatable with common units.
- **Unit mastery:** units gain XP when used (1 per battle won, 2 for a boss; levels at 30/80/150/250 xp; Lv2/4 shared HP, Lv3 +1% Souls, Lv5 +1 main stat; skins not built yet). Mastery levels unlock small perks and skins, rewarding players who stick with favourites.

### 12.2 The squad (what you bring on a run)

- Each unit costs **Command Points** by rarity: Common 1, Rare 2, Epic 3, Legendary 4.
- The cap starts at **8** and grows with Camp upgrades and milestones.
- The choice "one Legendary or two Rares" is a real decision, so rarity always has a trade-off.
- Rule: the squad must include **at least one supporter** (and one attacker); Set out is blocked otherwise. *(Implemented, WP10: `Progress.squadProblem`.)*
- **Traits:** every unit has a trait tag (Order, Wild, Arcane, Undead). Bringing 2/4/6 units of one trait gives a squad bonus, which makes squad-building a puzzle of its own.
  - *Implemented (WP10):* the bonuses stack by step. **Order** 2: +2 max HP, 4: Shields block +1, 6: every enemy strike is weakened by 1. **Wild** 2: +10% Souls, 4: Wild attackers +1 ATK, 6: the first shot of a battle deals double damage. **Arcane** 2: +2 max HP, 4: Barrels explode for 3, 6: Arcane supporters +1 more and Mages +1 ATK. **Undead** 2: +4 max HP, 4: once per battle a lethal blow leaves 1 HP, 6: heal 1 HP every turn. The Command Point cap is 8 plus one per Command upgrade level (the upgrade now gives Command Points, not squad slots), and old saves are trimmed to fit it.

### 12.3 Monetization note

If the gacha ever takes real money, loot-box rules vary by country and need checking early. As an earn-only system it can be generous.

---

## 13. Equipment

### 13.1 Slots

| Slot | Buffs |
|---|---|
| Weapon | Attackers |
| Armor | Shields and hero HP |
| Banner | Supporters |
| Ring ×2 | Anything |

Equipment drops randomly from enemies (more often from elites and bosses) and is **kept between runs**.

### 13.2 Rarity and stats

| Rarity | Contents |
|---|---|
| Common | 1 main effect |
| Rare | Main effect + 1 substat |
| Epic | Main effect + 2 substats |
| Legendary | Main effect + 2 substats + 1 **unique effect** |

- **Stats are whole numbers aimed at a card type**, for example "+1 ATK to Archers", "Shields block +1", "+1 range to Spearmen", "+2 max HP". This keeps the board readable (see 22, open question 7, for the alternative).
- **Unique effects change rules**, for example "Overkill also carries sideways", "Barrels explode for 4" or "Your first War Horn gives ×3". These are what players farm bosses for.
- **Item level** depends on the danger of the node it dropped from, so pushing further always finds better items.

### 13.3 Sets

Items can belong to sets. Example: **Wolfpack**. With 2 pieces, Banners also boost diagonally. With 4 pieces, every attacker next to a Banner gets +1 ATK.

### 13.4 Forge

- **Salvage** unwanted items into **Dust ⚒**.
- Spend Dust to **re-roll** one substat or **level up** an item.
- This keeps the inventory clean and gives every drop some value.

### 13.5 Boss farming

- Each boss has 2–3 signature Legendaries.
- **Bad-luck protection:** each kill without the item raises the drop chance.
- **Boss tokens:** every kill gives a token, and a fixed number of tokens buys the item directly. Farming always moves you forward.

---

## 14. Camp, heroes and achievements

### 14.1 Camp upgrades (spend Souls ✦)

| Track | Examples |
|---|---|
| Survival | +2 max HP per level · a 1-point barrier at the start of each battle · one revive per run |
| Command | +1 Command Point per level |
| Fortune | More Souls · better item drop rate · more starting gold |
| Choice | 4 reward choices instead of 3 · one reward re-roll per run |
| Scouting | Larger fog reveal radius · see node contents before travelling |
| Board | Unlock a 6th column or a 4th player row (late game) |

*(Implemented, WP16.)* Tracks: Vitality, Command, Drill, Bulwark, Fortune, Provisions, Scouting plus **Ward** (barrier +1 per level, 2 levels, absorbs the first damage taken each battle after Shields), **Second Wind** (one revive per run at half HP, stacks with the Phoenix Archer's), **Choice** (Lv1: 4 reward choices, +1 more with the Quartermaster; Lv2: one reward re-roll per run), **Purse** (+5 starting Gold per level, 3 levels) and **Board** (a **4th player row** behind the others; the 6th-column variant was not built). The Camp sheet shows a painted camp that gains a tower, torii, forge, banner hall, tents, lanterns, crates and more as tracks are bought.

Upgrade costs rise steeply and tracks have caps, so Camp upgrades support progress without replacing skill. The Camp screen grows visually as it is upgraded (more tents, a forge, a banner hall).

### 14.2 Heroes

- Choose one hero per run. Each has a **passive** and an **ability usable once per battle**.
- Examples: **Marshal** (swap two units mid-turn), **Pyromancer** (ignite one barrel), **Quartermaster** (+1 reward choice).
- Heroes are unlocked through milestones or pulled from the gacha.
- *(Implemented, WP15.)* The hero is picked on the Camp sheet (chips with a brushed-seal monogram as a placeholder portrait, until real art exists) and saved as `save.hero`. Passives are engine rules / HP / reward choices; abilities live in `Engine.HERO_ABILITIES` and are used in the Plan phase with `Engine.useAbility`, so the solver and simulations understand them. The hero panel in battle shows the seal, name, passive and an ability button (a targeted ability asks you to tap an enemy; the button is greyed out as "spent" afterwards).

| Hero | Unlock | Passive | Ability (once per battle) |
|---|---|---|---|
| **Marshal** 将 | from the start | Shields block +1 | **Rally**: every attacker +1 ATK this turn (replaces "swap two units": units can already be rearranged freely during Plan) |
| **Pyromancer** 炎 | beat the Sunny Meadows boss | Barrels explode for 3 | **Ignite**: pick an enemy; a Barrel explodes at once, anything else takes 2 damage ignoring armor |
| **Quartermaster** 糧 | finish 3 expeditions | One extra choice in every reward | **Ration**: heal the damage taken this battle, up to 4 HP |
| **Sentinel** 守 | beat the Old Oak Wood boss | +4 max HP | **Brace**: enemy strikes are weakened by 2 this turn |

Gacha-pulled heroes and the Marshal's literal swap are not implemented.

### 14.3 Achievements

| Kind | Example | Reward |
|---|---|---|
| Milestones | Reach a region · beat the first boss | Unlocks: regions, slots, Command Points |
| Feats | Clear a battle with one attacker · a chain of 4 barrels | Crystals, cosmetics |
| Bestiary | Defeat 50 Knights | A small themed bonus, e.g. +1 damage against Knights |
| Codex | Find secrets, bosses and events | Lore entries |

Permanent buffs from achievements are small and themed. Most rewards are currency, unlocks and cosmetics.

*Prototype (WP17):* the Journal button in the Camp sheet opens Feats, Bestiary and Codex. Feats (milestones, feats, collection) pay small Crystal/Dust sums at once; the Bestiary counts meetings and kills per creature (100 entries, silhouettes until met) and the Codex lists bosses, enemy rules and relics met. Milestones do not unlock slots or Command Points and the Bestiary gives no combat bonus (such as +1 damage vs Knights): both would change the rules or pacing, so only currency rewards are implemented.

---

## 15. Difficulty (Heat)

- After beating the final boss, players can turn on **Heat modifiers**. Each modifier adds Heat points, and Heat multiplies rewards and item level.

| Modifier | Heat |
|---|---|
| Enemies +1 HP | 1 |
| Enrage gives +2 instead of +1 | 2 |
| Heals are 50% weaker | 1 |
| Enemies start with 1 armor | 3 |
| Command Point cap −2 | 2 |
| The board loses a column | 4 |

- **Descend:** a harder version of the whole map (new game plus), combinable with Heat.

*Prototype (WP18):* both are unlocked by defeating a **final boss** (Morana at the Glacier Throne or Zmey Gorynych at the Magma Caldera) and live in the Camp's 🔥 tab (a lock with a cold brazier before that). Each modifier is a toggle with its Heat points (1 / 2 / 1 / 3 / 2 / 4 = 13 in total):

| Modifier (prototype name) | Heat | Where it acts |
|---|---|---|
| Tough Hides: every enemy +1 HP | 1 | `Gen.generateBattle(node, seed, opts)` (`opts = Progress.genOpts(save)`) |
| Fury: enrage gives +2 ATK | 2 | engine rule `enrageMore` |
| Bitter Herbs: your healing is halved (rounded down; Lifebloom's 1 HP tick is lost) | 1 | engine rule `healHalf` (Lifebloom, Ration), `Progress.healAmt` (springs, shops, rewards, events, caches) |
| Lacquered Plates: every enemy starts with 1 armor | 3 | `Gen.generateBattle` |
| Thin Ranks: Command Point cap -2 | 2 | `Progress.commandCap` (the squad is not trimmed, Set out asks you to) |
| Flooded Lane: the board loses its right-hand column | 4 | engine rule `lostCol` (`Engine.tileBlocked / playerTilesFor`): cards cannot stand there, enemies above it still strike; closed tiles are inked out in the battle |

Heat multiplies **rewards by 1 + 0.08 per Heat point** (Souls and Gold; 13 Heat = x2.04) and raises the **item level of drops by 1 per 3 Heat**. **Descend** (levels 0-5) shifts every spot `Gen.DESCEND_LV` = 2 levels per step (enemy stats, template tier and boss strength all follow the higher level), pays **x(1 + 0.4 per step)** and adds +2 item levels per step. Descend 1 is open after any final boss; beating a final boss while on Descend N opens Descend N+1. Both combine, show as a 🔥 chip in the run HUD, and are fixed for the duration of an expedition. `tools/sim-runs.js N endgame` (env `HEAT=hp,rage,heal,armor,cp,col`, `DESCEND=n`) plays a maxed account to size the post-game.

---

## 16. Extra modes

| Mode | Description |
|---|---|
| **Daily expedition** | Everyone gets the same map, squad, hero and relics. A leaderboard ranks reach and damage taken. Pure puzzle skill. |
| **Endless tower** | Floors get harder forever. The end-game use for all your equipment. |

---

## 17. Currencies

| Currency | Earned from | Spent on | Kept? |
|---|---|---|---|
| 🪙 Gold | Battles during a run | Shops during the run | Lost when the run ends |
| ✦ Souls | End of run (reach, danger, stars) | Camp upgrades | Kept |
| 💎 Crystals | First boss kill of each sub-area (3, +1 per region; paid at once), bounties (paid at run end), achievements (small sums, WP17) | Gacha | Kept |
| ⚒ Dust | Salvaging items and duplicate units (no source yet; Camp's prototype cheat adds some) | Forge | Kept |

Four currencies is the maximum; more starts to confuse players.

---

## 18. Pacing (first hours)

| Runs | What the player experiences |
|---|---|
| 1–3 | 2–4 battles per run near Camp. Learns the map, rewards and relics. First Camp upgrades and first 10-pull. |
| 4–8 | Clears Goblin Woods and beats its boss. The Iron Keep gate opens. Equipment slots unlock, and the first Epic unit arrives. |
| 9–15 | Starts from waypoints and chains 2 regions. Traits start to matter. Farms the Keep boss for a set piece. |
| 15+ | Hidden regions, secrets, the final boss, then Heat, Descend, the daily expedition and the endless tower. |

---

## 19. Progression risks

| Risk | Mitigation |
|---|---|
| Permanent power makes puzzles trivial | Enemy stats scale with danger. Permanent buffs are capped or small. Most progress adds options. |
| Gacha luck decides who wins | Pity, the Recruitment Office and Command Point costs. Every region can be beaten with common units. |
| Grinding feels slow | Bad-luck protection, boss tokens, quick early unlocks, and Heat multiplying rewards. |
| Short early runs feel like failure | Every run banks loot and Souls, and the results screen shows new reach against a ghost of the previous best. |
| Too many stats on items | Whole numbers on specific card types, at most 3 substats, and one rule-changing effect on Legendaries. |
| Handmade stages run out | Build battles from **templates** (enemy layouts plus placement rules for barrels and armor), scaled by danger and checked by the solver. Bosses and elites stay handmade. |
| Players farm the safe nodes near Camp | Each node clears once per run, and rewards scale with danger. |


---

## 20. UX requirements

- **Live final numbers:** placed cards always show their boosted ATK and range. Boosted values are highlighted.
- **Idle supporters are dimmed**, so the player immediately sees a wasted placement.
- **Hover or select an attacker** to highlight the tiles it can reach and the enemy it would hit right now.
- **Threat forecast:** under each column, show how much damage you take if nothing in that column dies, after Shields.
- **Step-by-step playback** of each turn (shot, hit, overkill, explosion, strike, enrage), with a speed toggle and a text battle log.
- Input: drag-and-drop, plus tap-to-select and tap-to-place for touch. Pointer events: pressing a unit (hand or board) and moving more than ~6 px drags it at once, no selection tap needed; a shorter press is a tap. Dropping on another tile moves or swaps, dropping on the hand returns it.
- **Range preview while dragging:** from the tile under the pointer, an attacker shows the tiles it reaches (vermilion fill with diagonal hatch, ↑ badge) and the enemies it would hit (deeper red crosshatch, ✖ badge), a supporter shows its boost targets (teal dotted fill, ✚ badge); buffs from the would-be neighbours are included. The same shows on hover or selection. Shapes and badges, not just colour, carry the meaning.
- **One-screen battle:** the battle never scrolls. The cell size is measured from the viewport (`fit()` in `js/battle.js`, 100dvh plus safe-area insets), covering 5 or 6 board rows, threat line, hero panel with ability, hand and controls. The hand is one scrollable row of compact cards; the battle log (📜) and the hint line (tap to expand) are toggles.
- **Set out chooser:** the Camp home has no Start-at chips. With lit Wayshrines, Set out opens a scrollable sheet of Camp plus the shrines grouped by region; picking one starts the run there. With none, the run starts at once.

---

## 21. Balancing levers

| Lever | Effect |
|---|---|
| Enemy HP vs. available ATK | How hard a one-turn clear is |
| Total enemy ATK | The cost of failure |
| Enrage amount (+1 per turn) | How strongly the game pushes stages to 1–2 turns |
| Shield block value | How forgiving partial clears are |
| Heal frequency and amount | Run length |
| Danger growth per distance | How far a run reaches at each level of account power |
| Souls and Crystals per run | Speed of permanent progress |
| Command Point cap | Squad size and how much rarity matters |
| Drop rates and bad-luck protection | How grindy boss farming feels |
| Number of free tiles vs. army size | Placement pressure in late runs |

---

## 22. Open questions

1. Should enemies ever **move or change rows** between turns, or stay static for readability?
2. Should a stage be allowed to give a **bonus for a one-turn clear** (extra Souls or an extra reward), beyond the stars?
3. Should **Barrels** ever attack, or stay pure board hazards?
4. Should there be a **turn limit** (for example, 3 turns), or is enrage enough pressure?
5. Should the card order be **front→back, left→right**, or should cards fire in an order the player chooses (more depth, less simple)?
6. ~~Map structure~~ Decided in v0.2: one persistent world map with free movement (section 10).
7. **Number scale:** keep small whole numbers with targeted buffs (current plan), or multiply every number by 10 (Archer ⚔20, Goblin ♥30) so percentage and fractional-feeling buffs (+4 = "+0.4") work while numbers stay readable?
8. Should movement on the map also cost **supplies** (a second limit besides HP, as in *InflationRPG*'s step limit), or is HP enough?
9. Can the player **re-fight** a cleared node in the same run, or is each node strictly once per run?
10. How much should **retreating** pay compared with defeat (currently 100% vs 75% of Souls)?
11. Should the gacha ever take **real money**, or stay earn-only?

---

## 23. Prototype scope (current)

The prototype in `prototype/` has two pages.

**World map game (`index.html`)**: tests short runs on a persistent map.

- **World:** 5 regions with 4 sub-areas each (20 in total) on a large, sparse map (a phone screen shows only 1-2 enemies; terrain features fill the space between). The exact geometry is the `WorldLayout` contract in `docs/WORLD_SPEC.md`. Greenvale (Sunny Meadows, Old Oak Wood, Bamboo Valley, Mirror Lake) sits above the Camp. Mirror Lake's boss opens the Azure Coast (Shell Beach, Coral Shallows, Shipwreck Cove, Mist Isles) and Sunscorch (Dune Sea, Palm Oasis, Red Canyon, Buried Temple). Mist Isles' boss opens Frostveil (Snowdrift Plains, Frozen Lake, Rime Forest, Glacier Throne) and Buried Temple's boss opens Ember Peaks (Ash Fields, Obsidian Ridge, Ember Falls, Magma Caldera). Each sub-area has its own landmark, enemy theme and boss, and **6-7 enemies including the boss** (4-5 ordinary, 1 elite, 1 boss), plus 0-1 spring or cache. About 140 monster spots in total. Levels rise from Lv1 (Sunny Meadows) to Lv13-15 (Glacier Throne, Magma Caldera).
- **Unlocks:** a sub-area's boss reveals the next sub-area of its region; the last boss of a region reveals the next region. *(Revised after playtest: the fog lift is permanent, but the way is **closed again on every run** until that boss is beaten again in the same run, see 24.7.)*
- **Runs (free exploration):** start at Camp with 8 Rations. Every monster in every sub-area that is **open on this run** (4-5 ordinary, 1 elite and the boss) can be fought at any time, in any order, once per run; at the start only Sunny Meadows is open (24.7). HP carries over. Each sub-area may hold a healing spring or supply cache that costs no Rations. After each battle you choose 1 of 3 run rewards (heal, +1 ATK/block/boost, and from the second region sometimes +1 range).
- **Rations:** a normal or elite win costs 1 Ration. **Every boss pays Rations that grow with its level** (24.8): a boss of an area you have never conquered ("new area") pays +3 at Lv4 up to +9 at Lv15 (net, after its own cost); re-fighting a conquered boss as a gate is a cheap toll (+0 at Lv4-6, +1 at Lv7-10, +2 Lv11-14, +3 at Lv15). At 0 the run ends as a safe return (all Souls kept); a held total is capped at 60.
- **Items:** 210 permanent items (140 unique, 60 sub-area, 10 region); see 24.3.
- **Ending a run:** Return to Camp or running out of Rations keeps 100% of Souls; a defeat keeps 75%.
- **Camp:** Souls buy upgrades (Vitality, Command, Drill, Bulwark, Fortune, Provisions) and recruits. Bosses unlock new recruits. The squad is limited by slots. The Gear tab equips up to 5 items (Weapon, Armor, Banner, Ring x2).
- **Battles:** ordinary spots pick a named template by danger tier (`gen.js`): tier 1 teaches one mechanic per fight (attack, range, +, overkill, barrel, Shield, armor), tiers 2-3 are layouts with a hidden one-turn zero-damage clear, tier 4+ cannot be cleared in one turn (heavy enemy, best line costs about 1-4 HP). Layouts are mirrored at random and scaled by level. `node tools/validate-gen.js` checks this with the solver against a reference squad per tier. Elites and bosses are handcrafted fights from `boss-defs.js` (7.3): one gimmick per boss, usually a two-turn fight.
- **Saving:** progress is saved in the browser. Prototype tools give +100 Souls or reset progress.
- **Balancing:** *(current numbers: "WP18 final pacing pass" at the end of this section; the history below is kept for reference)* `tools/sim-runs.js` plays whole runs with a strong player (Souls use the real star multipliers). On a fresh account it fights about 10 battles (6 if it dies to the Lv4 boss, 11-16 once the boss falls); real players should land at the 8-10 battles of 24.1. Sunny Meadows spots are Lv 1,1,1,2,2 with a Lv4 boss (2 minions, +7 HP now that template fights are cheap to clear); Old Oak Wood is Lv 3-4. Enemy growth ramps up from Lv8 (HP +7% and about +0.35 ATK per level above 7); Camp upgrades and recruits cost more from the second tier on, and Vitality, Drill, Bulwark and Fortune gained one more level. With greedy Camp shopping (`node tools/sim-runs.js 1 campaign 45`) the strong simulated player beats Greenvale in 3-6 runs, Azure Coast and Sunscorch in 4-8, and unlocks Frostveil around run 15-30 (Ember Peaks is slower, often beyond run 45); real players are slower. After WP6 (handcrafted bosses and elites with the full growth ramp; boss HP factor 1.7 at Lv<=6, 2.1 at Lv7, 2.5 at Lv8-9, 2.4 at Lv10-12, 2.1 at Lv13+, elites 75% of that): fresh account about 9 battles (the Lv4 Sansin falls in about one run in four), Greenvale boss in run 1-3, Azure Coast and Sunscorch first boss in run 4-9, Frostveil and Ember Peaks unlocked around run 9 and their first boss around run 17-20 (campaign sim, 3 samples). After the WP4 templates (strong player now clears most fights with 0 damage; Souls per fight x0.8 (x0.36 since WP18), Lv5-6 bosses +9 HP): fresh account about 9 battles, first Greenvale boss in run 1-4, Azure Coast and Sunscorch first boss in run 4-7 (4 simulated campaigns).

**Battle sandbox (`sandbox.html`)**: the three handcrafted mid-run stages (6, 9 and 12) from the first prototype.

**Not included yet:** art and audio (heroes are in, with placeholder seals; Heat and Descend are in since WP18).

See the README for how to run it.

---

## 24. Planned changes (from the first world map playtest)

These directions came out of the first playtest. Numbers are starting points for tuning. Status is noted per item.

### 24.1 Faster early progression, slower later

- **First runs should last 8–10 battles** (currently about 5 with perfect play). Make the first sub-area gentler and give it more Level 1–2 spots.
- **Front-load progression:** cheap, frequent unlocks early; upgrade costs and enemy growth rise more steeply from the second region onward.
- **Guaranteed upgrade after the first run:** the first run always pays at least enough Souls for the cheapest Camp upgrade (with a first-run bonus if needed). The results screen points straight to it. *(Implemented: top-up to the cheapest Camp upgrade, with a "Go to Upgrades" button.)*

### 24.2 Run rewards: range is a rare, mid-game upgrade (implemented)

- Remove **+1 range** from the common after-battle rewards. Extra range on an Archer is too strong early.
- Range becomes a **rare** reward that appears only from the second region onward, or comes from equipment.

### 24.3 Guaranteed first equipment drop and the item system (implemented)

- The first or second battle of the **first run** always drops a piece of equipment (for example, *Rusty Sword: +1 ATK to Swordsmen*).
- That moment introduces equipment and the equip screen (section 13).
- **Implemented as follows.** Items (`js/items.js`) are permanent and give one passive effect: +ATK for a card type, +block for Shields, +amount for a support type, +max HP, +starting Rations, +% Souls, or (rare, only from the second region on) +range for a card type. Rarity sets the strength: Common (+1 ATK, +1 block, +2 HP, +8% Souls), Rare (+2, +2, +4, +15%, +1 amount, +1 Ration, +1 range) and Epic (+3, +3, +6, +25%, +2 amount, +2 Rations, +1 range). Up to 3 items are equipped in the Camp Gear tab; a new drop equips itself if a slot is free.
- **Every monster spot has one unique item** that only it drops (named after its creature, for example "Alux's Plate"), plus shared items: three per sub-area and two per region, 210 items in all (140 unique ones). A spot lists its unique item and three shared ones. Win chances: ordinary 12% / 3.5% / 2% (unique / sub-area / region), elite 20% / 6% / 3.5%, boss 18% / 9% / 5% (halved in the WP18 pacing pass; bad-luck protection unchanged). A boss's unique item (Epic) is guaranteed the first time it falls. At most one item drops per battle and owned items are skipped. The spot's sheet shows its drops, the unique one highlighted and owned ones ticked.
- **WP8 changes to the above (implemented):** gear now has five slots (Weapon, Armor, Banner, Ring x2; rings take anything and other items overflow into a free ring), replacing "3 equipped items". Every number scales with **item level** (the level of the node it dropped from; numbers x(1 + 0.2 w(iLv)) with w = (iLv/5)^1.5, rounded down, so x1.2 at iLv5, x1.57 at iLv10 and x2.04 at iLv15; starting Rations and range do not scale. Before WP19: +5% per level). Epic and Legendary items carry 2 substats (Rare items carried 1 until the WP9 pacing pass) (+2 max HP, +1 block, +4% Souls, +1 ATK or +1 boost to a card type, scaled by level). Each of the 20 bosses has **two signature Legendaries** (plus its Epic unique item) with one rule-changing effect: Spill (overkill also hits the front-row neighbours), Opening Fang (first shot of a battle x2), Thick Hide (enemy strikes deal 1 less), Last Breath (survive one lethal blow at 1 HP per battle), Great Horn (first War Horn x3), Powder Charm (barrels explode for 4), Sunder Band (hits ignore 1 armor), Lifebloom (heal 1 HP each turn). **Bad-luck protection:** every win at a spot without its unique item adds +5% to that item's chance (cap 90%); a boss's Legendary chance is 5% per kill, +4% for each kill without one. **Boss tokens:** every boss kill gives that boss a token and 6 tokens buy one of its Legendaries (node sheet or Gear tab). **Elites** always drop something (an unowned item from their table, else 3 Dust). A drop that is already owned becomes **Dust** (half the salvage value) and raises the owned copy's level if it dropped higher; the Gear tab salvages any item for Dust (Common 2, Rare 5, Epic 12, Legendary 30, +1 per 3 item levels). Old saves are migrated on load (old items get a level and substats; the old equipped list fills the slots). The Forge and sets arrived with WP9 (below).
  - **WP9 Forge and sets (implemented):** the Gear tab has a Gear / Forge toggle. In the Forge, Dust rerolls one substat of an Epic or Legendary item (10 / 14 Dust; the new substat never repeats the main stat or another substat) or raises an item's level by one (max 20; 4 + 1.5 x level Dust, +2 for non-Common), which scales all its numbers by +5% per level. Every item belongs to the **set of its region**: Greenvale Wolfpack, Azure Coast Tidewatch, Sunscorch Dune Nomads, Frostveil Frostguard, Ember Peaks Cinderforge. Wearing 2 / 4 pieces of one set grants: Wolfpack (Banners also boost the 4 diagonal tiles; attackers a Banner boosts get +1 ATK more), Tidewatch (+4 max HP; +1 Ration), Dune Nomads (+10% Souls; Shields +1), Frostguard (Shields +1; +8 max HP), Cinderforge (+1 ATK to Swordsmen and Spearmen; barrels explode for 3). The Gear and Forge views show the active tiers.
  - **WP9 pacing pass:** to bring the fresh account back from 13.4 (WP8) towards the 9-10 target, Rare items no longer carry a substat (Epic and Legendary keep 2) and an elite's guaranteed drop never picks its unique item (it can still drop it by the normal roll). 60-run sim: 11.2 battles, 5.7 items. Old saves keep the substats they already have.
  - Pacing check (`tools/sim-runs.js`, 30 fresh-account runs each): 12.4 battles per run with WP8 gear against 10.6 before (items 6.0 against 5.5 found); the campaign sim reaches the same sub-areas about two runs sooner (Azure/Sunscorch/Frostveil first boss run 3 against 5). The sim now uses `Items.grantDrop`, so it models levels, substats, pity and Legendaries.
- The first or second battle of the very first run always drops an item. Range as a run reward (24.2) now only appears from the second region onward, and only some of the time.

### 24.4 More choice on the map (implemented as free exploration)

- The node graph is gone. Every sub-area has 6-7 monster spots (4-5 ordinary, 1 elite, 1 boss), all open at once (see 24.5), plus at most one spring or cache.

### 24.5 Battle limit per run ("Rations") (implemented)

- Each run has a **Rations** counter that works as a countdown. It starts at 8 and the Camp upgrade **Provisions** adds +2 per level (4 levels). Equipped items can add more.
  - Winning an ordinary battle costs **1** Ration.
  - **Rework (WP19, "depth pays"):** every boss now pays Rations that grow with its level, not only the first two of a run (which left the late chain costing a Ration per boss and made late runs "21 battles of pure boss rush"). A boss of a never-beaten area pays `round(2 + 1.3 w(L))` net Rations, a conquered boss (re-fought as the gate of the rush) `floor(w(L) / 1.5)`; see 24.8 for the table, the cap and the reasoning. (Old rule: +3, then +1, then -1 per boss.)
- The HUD shows the counter during a run, and each spot's sheet states "-1 🍙", "+N 🍙" ("new area" for a boss never beaten) or "±0 🍙" (a toll boss that refunds its own Ration). Springs and caches cost nothing.
- When Rations reach 0, the run ends as a safe return (full Souls kept).
- **All battles in every unlocked sub-area are open to choose from**, with no walking or adjacency limit. Rations, not distance, limit a run.
  - Early on, players spend Rations on easy fights to grow during the run.
  - In the mid to late game, players can **go straight for a boss** and spend their Rations where they matter.
- This replaces the "fight a spot next to your trail" rule (10.2), and makes waypoints (10.5) optional.
- Open question: should spots in already-conquered sub-areas cost less, or give less?
- 24.1 is tuned (WP3): gentler first sub-area, steeper costs and enemy ramp from region 2.

### 24.7 In-run UI, Rations naming, one-item markets and per-run gates (playtest revision)

Playtest feedback: the tap-everything bottom panel covered 60-70% of the screen, "Supplies" read like an inventory, relics pushed the HP bar off the HUD, markets closed after a mere visit, and conquered areas stayed open forever.

- **Map first.** During a run tapping the ground only walks the hero. The big bottom sheet exists only at Camp (a dedicated Camp menu screen is planned). Tapping a monster, market, spring, cache, event, Wayshrine or Sealed Cache opens a **compact info card** (max about 30% of the screen, bottom): name, danger skulls and Lv, one gimmick line for elites and bosses, cost or gain chips ("-1 🍙", "+3 🍙", "Free"), the enemy portraits as a small row, **possible drops as a row of small icons** (rarity-coloured frame, ◆ marker for a unique item, ✓ when owned, a short % or "1st" for a first boss kill; tap an icon for a one-line detail), and the Fight / Visit and close buttons. Tapping the ground or another spot closes or replaces it.
- **Slim HUD.** Line 1: HP bar (always visible), 🍙 Rations, 🪙 Gold, ☰ menu. Line 2 (smaller): ✦ Souls, 🗝 Keys, 🔥 Heat and the relic seals. The ☰ button opens a compact panel with Rations/Gold/Keys, open areas, relic list, bounties, "Send a scout" (reveals around the hero) and "Return to Camp"; it is closed by default.
- **Rations.** "Supplies" is renamed **Rations** with the 🍙 onigiri icon everywhere (HUD, cards, toasts, results, docs, sim text). Save fields keep their old names (`run.supplies`, `Progress.startSupplies`, `bossSupplies`). The Quartermaster's hero ability "Ration" now uses a 🍱 icon so the two do not share a symbol.
- **Wayside Market.** Visiting does not use the market up. It shows "You can buy only one item here: the market packs up after your purchase"; choosing an item asks for confirmation ("Buy and close") and only that purchase closes the market for the run. Leaving keeps it open. (`tools/sim-runs.js` buys exactly one item per market: heal when below 70% HP, else a relic at 40+ Gold, else one +1 ATK.)
- **Per-run gates.** Fog lifting is permanent (`save.unlocked`: areas ever unlocked stay painted, not misty), but a run starts with only Sunny Meadows open (`run.open`). A sub-area's gates are closed (spots dimmed and not fightable, the hero cannot walk in, a vermilion seal at its gate and the note "Defeat <boss> this run") until the boss that leads to it is defeated **in this run**; re-clearing a conquered boss pays Souls and the small toll Rations of 24.8 (nothing at Lv4-6, +1 at Lv7-10, more deeper) but no first-kill bonus or Crystals. Starting at a lit Wayshrine opens that Wayshrine's sub-area only (a shortcut past the earlier bosses). Fast travel cannot enter a closed area.
- **Pacing (re-measured, `tools/sim-runs.js`).** Fresh account: 9.9 battles per run (40 runs, target 9-11, unchanged as only Sunny Meadows is open). Campaign (4 seeds x 30 runs, the sim re-clears gate bosses each run after a 3-win warm-up): Greenvale boss run 1-2, Azure Coast / Sunscorch first boss run 3-6 / 3-7 (WP18: 4.8 / 6.5), Frostveil / Ember Peaks first unlocked run 6-26 / 7-27 (seed spread is wide, WP18 mean was about the same). Shift: ordinary veteran runs stay at 9-12 battles, but a run that re-clears a long boss chain reaches 17-21 battles and there are more of them (about every other run once the chain is conquered, before about 11% of runs), because the boss Rations refund (+3, +1) now pays for the walk through conquered areas instead of skipping them.

### 24.8 Power curve: depth pays (WP19)

Feedback: after the first two bosses a boss paid no Rations, and the post-battle reward was "+1 ATK" even at the endgame. Wanted loop: **rush the boss chain to the highest area you can, then grind there for gear and stats**, so a deep fight must be clearly worth more per Ration than a shallow one.

**Options for the power scale (levels 1-15, +Descend, small integers on a 5x5 board).**
- *Exponential* (a^L): Lv1 to Lv15 spans 30-100x. Integers explode (an ATK 3 unit vs 300 HP), one-turn puzzles and overkill stop being readable, and every number needs rebalancing per Descend step. Rejected.
- *Linear/low polynomial for enemies* (what the validated enemy curve already is: basic HP 2.2 + 0.95L, ATK 1.5 + 0.42L, boss HP about L^1.1): keeps the board readable (HP 3 to 16, bosses 5 to 75 per unit) and the puzzle solver bands valid. Kept for **danger**.
- *Power law for reward* (k = 1.5): rewards grow faster than danger, so reward per Ration rises with depth while the risk (a defeat keeps 75% Souls and ends the run) is the counterweight. k = 1 would barely differ from today, k = 2 gives 100x between Lv1 and Lv15 and breaks the economy.

**Chosen:** one curve, `w(L) = (L/5)^1.5` (`World.power`, 1.0 at Lv5). Enemies stay near-linear (danger), every reward magnitude is affine in w, and the player side is bounded by a linear cap so a long run cannot snowball:

| Quantity | Formula |
|---|---|
| Souls per fight | round((4 + 9w) x 0.32 x stars x Heat), x2 elite, x3 boss |
| Gold per fight | (3 + 7w) x stars, x2 elite, x3 boss |
| Run ATK step (post-battle) | round((0.4 + 0.3w) x k), k = 1 / 1.5 elite / 2 boss; block and boost half of it |
| Heal / Fortify (max HP) | (4 + 0.6L) / (1 + L/3), x1.25 elite, x1.5 boss |
| Warcry (all attackers +1) | boss Lv9+, elite Lv11+, ordinary Lv13+ one time in four |
| Run cap per unit | ATK 1.5 + 0.3L, block 1 + 0.2L, boost 1 + 0.15L of the deepest level reached (every source: fights, shops, shrines, events) |
| Item level numbers | x(1 + 0.2w(iLv)); item level = node level (+Heat/Descend); Rations and range never scale |
| Boss Rations, new area | round((2 + 1.3w) x 0.8^n), n = new areas already conquered in this run, min 1 |
| Boss Rations, conquered area (toll) | floor(w / 1.5) |

| Lv | w(L) | enemy HP | enemy ATK | boss unit HP | Souls (normal/elite/boss) | Gold | run ATK step n/e/b | cap ATK | heal | Rations first/toll | item x |
| 1 | 0.09 | 3.2 | 1.9 | 5 | 2/4/6 | 4 | 1/1/1 | 2 | 4 | 2 / +0 | x1.02 |
| 2 | 0.25 | 4.1 | 2.3 | 7 | 2/4/6 | 5 | 1/1/1 | 2 | 4 | 2 / +0 | x1.05 |
| 3 | 0.46 | 5.0 | 2.8 | 9 | 3/6/9 | 6 | 1/1/1 | 2 | 5 | 3 / +0 | x1.09 |
| 4 | 0.72 | 6.0 | 3.2 | 10 | 3/6/9 | 8 | 1/1/1 | 3 | 5 | 3 / +0 | x1.14 |
| 5 | 1.00 | 7.0 | 3.6 | 22 | 4/8/12 | 10 | 1/1/1 | 3 | 6 | 3 / +0 | x1.20 |
| 6 | 1.31 | 7.9 | 4.0 | 26 | 5/10/15 | 12 | 1/1/2 | 3 | 7 | 4 / +0 | x1.26 |
| 7 | 1.66 | 8.8 | 4.4 | 33 | 6/12/18 | 15 | 1/1/2 | 4 | 7 | 4 / +1 | x1.33 |
| 8 | 2.02 | 9.8 | 4.9 | 47 | 7/14/21 | 17 | 1/2/2 | 4 | 8 | 5 / +1 | x1.40 |
| 9 | 2.41 | 10.8 | 5.3 | 55 | 8/16/24 | 20 | 1/2/2 | 4 | 8 | 5 / +1 | x1.48 |
| 10 | 2.83 | 11.7 | 6.7 | 53 | 9/18/27 | 23 | 1/2/2 | 5 | 9 | 6 / +1 | x1.57 |
| 11 | 3.26 | 12.6 | 7.1 | 60 | 11/22/33 | 26 | 1/2/3 | 5 | 10 | 6 / +2 | x1.65 |
| 12 | 3.72 | 13.6 | 7.5 | 68 | 12/24/36 | 29 | 2/2/3 | 5 | 10 | 7 / +2 | x1.74 |
| 13 | 4.19 | 14.6 | 9.0 | 61 | 13/26/39 | 32 | 2/2/3 | 5 | 11 | 7 / +2 | x1.84 |
| 14 | 4.69 | 15.5 | 9.4 | 68 | 15/30/45 | 36 | 2/3/4 | 6 | 11 | 8 / +3 | x1.94 |
| 15 | 5.20 | 16.4 | 9.8 | 75 | 16/32/48 | 39 | 2/3/4 | 6 | 12 | 9 / +3 | x2.04 |

Rations rule: normal and elite fights cost 1. A boss pays the net amounts above (a toll boss at Lv4-6 is a free passage). The decay 0.8^n and the 60 Ration cap stop a run from conquering the whole world on Rations, and every spot can still be fought only once per run. Boss and elite strength in the two deep bands was raised (`BOSS_BAND` hp x1.3 / x1.35, atk x1.1) and `validate-gen.js` POWER now assumes ATK +3 / +4 / +4 / +5 / +6 / +6 (the run cap) so every boss still costs 20-50% of the reference HP.

**The loop.** Early: bosses pay +3 to +5, so rushing new areas extends the run. Later: toll bosses are almost free so the rush to the frontier costs little, then the highest fights you can survive give 2-3x the Souls and gear levels of shallow ones for the same single Ration. `tools/sim-runs.js` follows this: 3 warm-up wins, rush gate bosses, then grind the highest frontier fights up to (deepest beaten boss level + 1), the frontier boss last.

### 24.6 Waypoints, keys, secrets and scouting (implemented, WP14)

- **Wayshrines** (🚩): one near the entry of 19 sub-areas (not Mist Isles). Visiting one for the first time lights it for good (free, no Rations, and it reveals the spots around it). A run can **start** at any lit Wayshrine (Camp "Start at" chips, or the shrine's sheet); during a run a lit shrine offers **free instant fast travel**. A waypoint changes where the hero stands (and so what the fog shows); since the per-run gates (24.7) it is also a shortcut: a run that starts at a lit Wayshrine has that sub-area open from the first step.
- **Keys** (🗝): every elite and boss win drops one (max 3 carried, lost at run end). A key opens a **Sealed Cache**, a secret hidden off the trails in each sub-area (19): ✦ and 🪙 like a supply cache, 4 HP, and 💎 1 the first time (later ⚒ 2 Dust). No Rations cost, no reward choice.
- **Secrets** stay invisible until the hero walks within 130 units (+50 per Scouting level) or a scout looks; once found they stay on the map for good.
- **Scouting fog**: inside an unlocked sub-area, ordinary and elite spots farther than 430 units (+150 per Scouting level) from anywhere the hero has stood are faint silhouettes with their danger pips but no enemies or drop list; bosses and non-fight spots are landmarks and always visible. Spots, once seen, stay seen (`save.seen`). Scout button in a run: 🪙 6 (x region cost factor) reveals a spot and its surroundings. Camp upgrade **Scouting** (3 levels, ✦ 25 / 70 / 150): radius, secret radius, and at Lv 3 every spot shows its contents. Fighting a spot always reveals it.
- Pacing (`sim-runs.js` models keys and caches, secrets found 60% of the time): fresh account about 10 battles per run, no change beyond noise.

### WP18 early pacing pass (numbers)

- `tools/sim-runs.js` fixes: seeded (`SEED=n`, also the gacha rng, which used to be one fixed seed so every campaign was identical), 3-star bonus loot roll added, first-run Souls guarantee added, boss Souls/cache Souls read from Gen.
- Levers: boss Rations 3 / 1 / then 1 each (was +4 every boss); Souls per fight factor 0.8 to 0.36, first-boss bonus 25 to 11, cache 10 to 5; item drop chances halved.
- Campaign sim, 8 seeds x 40 runs, run in which each was first reached (mean): Greenvale boss 1.9, Greenvale cleared (Azure/Sunscorch open) 2.0, Azure/Sunscorch first boss 3.8 / 3.9, Frostveil / Ember Peaks unlocked 4.9 / 5.0, their first boss 7.8 / 8.1. Longest run 22 battles (was 94-105). Fresh account about 10.6 battles per run (was 11.8-13.2).
- Still faster than the targets (3-6 / 5-10 / 15-25): the strong simulated player already clears Lv<=9 once it owns a few upgrades, and the boss/elite HP is capped by `validate-gen.js bosses` reference squads. Next lever for WP18: Lv7-9 boss strength and the Camp upgrade/Gacha economy.

### WP18 final pacing pass (numbers)

Measured with the final code: fresh account = `PROFILE=fresh node tools/sim-runs.js 60` (seeds 31-33); campaign = `SEED=1..8 node tools/sim-runs.js 1 campaign 35` (greedy-but-planned Camp shopping, `SHOP=cheap` for the old cheapest-first rule, 35 runs maximum so ">35" means not reached).

| Target | Result |
|---|---|
| Fresh account 9-11 battles per run | **9.3 / 10.1 / 9.6** (3 x 60 runs; 6 when the Lv4 boss wins, 11-16 when it falls) |
| Greenvale cleared (Azure Coast and Sunscorch open) run 3-6 | **3.3** mean over 8 seeds (2, 3, 6, 6, 2, 1, 3, 3) |
| Azure Coast / Sunscorch first boss run 5-10 | **4.8 / 6.5** (2-8 / 2-14) |
| Frostveil / Ember Peaks first unlock run 15-25 | runs 7, 28, 30, >35, 8, 5, 15, 7 (Frostveil): mean 17.0 when the capped seed counts as 35, **median 8**; Ember Peaks 7, 28, 30, >35, 10, 6, 15, 8. Strongly bimodal: lucky accounts (an early Epic, gear sets) pass the Lv9 bosses by run 5-8, unlucky ones sit in front of them for 20+ runs |
| Final regions unlocked (Glacier Throne / Magma Caldera) | runs 18, 30, >35, >35, 18, 10, 24, 10 / 20, 30, >35, >35, 18, 11, 24, 12 (mean about 18-19 for the six seeds that got there) |
| Battles per campaign run | 10.5 on average: ordinary runs 9.7, boss-chain runs 17.5 (about 11% of runs; a first Greenvale boss win refunds Rations and the run snowballs +1 ATK per won fight) |

Before WP18 part 2 (same sim, old levers): fresh account 9-11 but Greenvale cleared in run 1-2, Frostveil / Ember unlocked in run 3-5 and the final regions in run 5. Levers moved: boss and elite strength per level band (`gen.js` `BOSS_BAND`, hp x1 / 1.9 / 1.8 / 1.55 / 1.4, atk x1 / 1.3 / 1.4 / 1.4 / 1.4 for Lv<=4 / 5-6 / 7-9 / 10-12 / 13+) plus per-boss `adj` in `boss-defs.js`; Souls per fight x0.32; boss Crystals 2 + region; gacha 4 Crystals per pull (36 for 10). `tools/validate-gen.js bosses` checks each boss against the median campaign account (`BOSS_REF` + `POWER`, built from `LOGBOSS` snapshots) and all 40 pass with every best line at 0-43% of the reference HP (limit 50%); `validate-gen.js 40` passes 200/200.
