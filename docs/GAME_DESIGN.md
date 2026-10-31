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
- Unexplored parts of the map are under **fog**. Nodes you have seen stay revealed permanently.

### 10.2 A run (an expedition)

1. Choose a **hero**, a **squad** from your roster (section 12) and your **equipment** (section 13).
2. Start at Camp, or at an unlocked **waypoint** (10.5), with full HP.
3. **Move freely.** (Prototype: every spot of an unlocked sub-area is open at once and Supplies limit the run, see 24.5.) From your current node you can travel to any connected, revealed node. You choose which fights to take, which way to go and how deep to push. Nothing forces you down a fixed path.
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
| 🔥 Shrine | Heal **or** upgrade a unit (one choice) |
| ❓ Event | A short text choice with a risk and a reward |
| 🗝 Secret | Hidden until found |
| 🚩 Waypoint | Unlocks a new starting point |

- **Landmarks** (bosses, shrines, waypoints, gates) are fixed, so the map becomes familiar and players can plan routes.
- **Ordinary nodes re-roll each run** from the region's pool, so each run's route is different.

---

## 11. In-run progression

- **After each battle, choose 1 of 3:**
  - ❤️ **Heal** some HP.
  - ⬆️ **Upgrade** a unit for this run: +1 ATK, +1 range, +1 block, or a stronger supporter (+1 → +2).
  - 💠 **Relic**: a run-only effect.
- **Relics** give each run its own identity, even with the same squad. They bend rules rather than adding stats:
  - "Barrels explode twice."
  - "Supporters also boost diagonally."
  - "+1 ATK for every enemy killed by overkill this run."
  - "The first Shield each battle blocks double."
- **Gold** is earned in battles and spent at shops. It resets when the run ends.
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

- **Duplicates** add stars (★1–★5), each a small upgrade. ★5 unlocks a **unit perk**.
- **Pity:** a guaranteed Epic every 30 pulls. A **Recruitment Office** trades unwanted duplicates for a unit of your choice, so bad luck never locks out a strategy.
- The common units from section 6.5 are the starting roster. Every region must be beatable with common units.
- **Unit mastery:** units gain XP when used. Mastery levels unlock small perks and skins, rewarding players who stick with favourites.

### 12.2 The squad (what you bring on a run)

- Each unit costs **Command Points** by rarity: Common 1, Rare 2, Epic 3, Legendary 4.
- The cap starts at **8** and grows with Camp upgrades and milestones.
- The choice "one Legendary or two Rares" is a real decision, so rarity always has a trade-off.
- Rule: the squad must include **at least one supporter**.
- **Traits:** every unit has a trait tag (Order, Wild, Arcane, Undead). Bringing 2/4/6 units of one trait gives a squad bonus, which makes squad-building a puzzle of its own.

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

Upgrade costs rise steeply and tracks have caps, so Camp upgrades support progress without replacing skill. The Camp screen grows visually as it is upgraded (more tents, a forge, a banner hall).

### 14.2 Heroes

- Choose one hero per run. Each has a **passive** and an **ability usable once per battle**.
- Examples: **Marshal** (swap two units mid-turn), **Pyromancer** (ignite one barrel), **Quartermaster** (+1 reward choice).
- Heroes are unlocked through milestones or pulled from the gacha.

### 14.3 Achievements

| Kind | Example | Reward |
|---|---|---|
| Milestones | Reach a region · beat the first boss | Unlocks: regions, slots, Command Points |
| Feats | Clear a battle with one attacker · a chain of 4 barrels | Crystals, cosmetics |
| Bestiary | Defeat 50 Knights | A small themed bonus, e.g. +1 damage against Knights |
| Codex | Find secrets, bosses and events | Lore entries |

Permanent buffs from achievements are small and themed. Most rewards are currency, unlocks and cosmetics.

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
| 💎 Crystals | First boss kill of each sub-area (3, +1 per region; paid at once), bounties (paid at run end), achievements (later) | Gacha | Kept |
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
- Input: drag-and-drop, plus tap-to-select and tap-to-place for touch.

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
- **Unlocks:** a sub-area's boss reveals the next sub-area of its region; the last boss of a region reveals the next region.
- **Runs (free exploration):** start at Camp with 8 Supplies. Every monster in every unlocked sub-area (4-5 ordinary, 1 elite and the boss) can be fought at any time, in any order, once per run. HP carries over. Each sub-area may hold a healing spring or supply cache that costs no Supplies. After each battle you choose 1 of 3 run rewards (heal, +1 ATK/block/boost, and from the second region sometimes +1 range).
- **Supplies:** a normal or elite win costs 1 Supply, a boss adds 4. At 0 the run ends as a safe return (all Souls kept).
- **Items:** 210 permanent items (140 unique, 60 sub-area, 10 region); see 24.3.
- **Ending a run:** Return to Camp or running out of Supplies keeps 100% of Souls; a defeat keeps 75%.
- **Camp:** Souls buy upgrades (Vitality, Command, Drill, Bulwark, Fortune, Provisions) and recruits. Bosses unlock new recruits. The squad is limited by slots. The Gear tab equips up to 3 items.
- **Battles:** ordinary spots pick a named template by danger tier (`gen.js`): tier 1 teaches one mechanic per fight (attack, range, +, overkill, barrel, Shield, armor), tiers 2-3 are layouts with a hidden one-turn zero-damage clear, tier 4+ cannot be cleared in one turn (heavy enemy, best line costs about 1-4 HP). Layouts are mirrored at random and scaled by level. `node tools/validate-gen.js` checks this with the solver against a reference squad per tier. Elites and bosses are handcrafted fights from `boss-defs.js` (7.3): one gimmick per boss, usually a two-turn fight.
- **Saving:** progress is saved in the browser. Prototype tools give +100 Souls or reset progress.
- **Balancing:** `tools/sim-runs.js` plays whole runs with a strong player (Souls use the real star multipliers). On a fresh account it fights about 10 battles (6 if it dies to the Lv4 boss, 11-16 once the boss falls); real players should land at the 8-10 battles of 24.1. Sunny Meadows spots are Lv 1,1,1,2,2 with a Lv4 boss (2 minions, +7 HP now that template fights are cheap to clear); Old Oak Wood is Lv 3-4. Enemy growth ramps up from Lv8 (HP +7% and about +0.35 ATK per level above 7); Camp upgrades and recruits cost more from the second tier on, and Vitality, Drill, Bulwark and Fortune gained one more level. With greedy Camp shopping (`node tools/sim-runs.js 1 campaign 45`) the strong simulated player beats Greenvale in 3-6 runs, Azure Coast and Sunscorch in 4-8, and unlocks Frostveil around run 15-30 (Ember Peaks is slower, often beyond run 45); real players are slower. After WP6 (handcrafted bosses and elites with the full growth ramp; boss HP factor 1.7 at Lv<=6, 2.1 at Lv7, 2.5 at Lv8-9, 2.4 at Lv10-12, 2.1 at Lv13+, elites 75% of that): fresh account about 9 battles (the Lv4 Sansin falls in about one run in four), Greenvale boss in run 1-3, Azure Coast and Sunscorch first boss in run 4-9, Frostveil and Ember Peaks unlocked around run 9 and their first boss around run 17-20 (campaign sim, 3 samples). After the WP4 templates (strong player now clears most fights with 0 damage; Souls per fight x0.8, Lv5-6 bosses +9 HP): fresh account about 9 battles, first Greenvale boss in run 1-4, Azure Coast and Sunscorch first boss in run 4-7 (4 simulated campaigns).

**Battle sandbox (`sandbox.html`)**: the three handcrafted mid-run stages (6, 9 and 12) from the first prototype.

**Not included yet:** equipment sets and the forge, gacha pulls (recruits are bought directly), relics, heroes, Heat, waypoints and secrets, art and audio.

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
- **Implemented as follows.** Items (`js/items.js`) are permanent and give one passive effect: +ATK for a card type, +block for Shields, +amount for a support type, +max HP, +starting Supplies, +% Souls, or (rare, only from the second region on) +range for a card type. Rarity sets the strength: Common (+1 ATK, +1 block, +2 HP, +8% Souls), Rare (+2, +2, +4, +15%, +1 amount, +1 Supply, +1 range) and Epic (+3, +3, +6, +25%, +2 amount, +2 Supplies, +1 range). Up to 3 items are equipped in the Camp Gear tab; a new drop equips itself if a slot is free.
- **Every monster spot has one unique item** that only it drops (named after its creature, for example "Alux's Plate"), plus shared items: three per sub-area and two per region, 210 items in all (140 unique ones). A spot lists its unique item and three shared ones. Win chances: ordinary 25% / 7% / 4% (unique / sub-area / region), elite 40% / 12% / 7%, boss 35% / 18% / 10%. A boss's unique item (Epic) is guaranteed the first time it falls. At most one item drops per battle and owned items are skipped. The spot's sheet shows its drops, the unique one highlighted and owned ones ticked.
- The first or second battle of the very first run always drops an item. Range as a run reward (24.2) now only appears from the second region onward, and only some of the time.

### 24.4 More choice on the map (implemented as free exploration)

- The node graph is gone. Every sub-area has 6-7 monster spots (4-5 ordinary, 1 elite, 1 boss), all open at once (see 24.5), plus at most one spring or cache.

### 24.5 Battle limit per run ("Supplies") (implemented)

- Each run has a **Supplies** counter that works as a countdown. It starts at 8 and the Camp upgrade **Provisions** adds +2 per level (4 levels). Equipped items can add more.
  - Winning an ordinary battle costs **1** Supply.
  - Beating a boss **adds** 4 Supplies (it costs none), so a strong run can chain into the next region.
- The HUD shows the counter during a run, and each spot's sheet states "Costs 1 Supply" or "Boss: +4 Supplies". Springs and caches cost nothing.
- When Supplies reach 0, the run ends as a safe return (full Souls kept).
- **All battles in every unlocked sub-area are open to choose from**, with no walking or adjacency limit. Supplies, not distance, limit a run.
  - Early on, players spend Supplies on easy fights to grow during the run.
  - In the mid to late game, players can **go straight for a boss** and spend their Supplies where they matter.
- This replaces the "fight a spot next to your trail" rule (10.2), and makes waypoints (10.5) optional.
- Open question: should spots in already-conquered sub-areas cost less, or give less?
- 24.1 is tuned (WP3): gentler first sub-area, steeper costs and enemy ramp from region 2.
