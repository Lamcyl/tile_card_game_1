# Tile Defense: Gameplay Design Document

> Working title. Art style, setting and platform are not decided yet. This document covers **gameplay only**.
> Status: v0.1, with a gameplay prototype in `prototype/`.

---

## 1. One-line pitch

A turn-based placement puzzle with roguelite runs. You arrange a small, fixed army of cards on a grid to destroy the enemies in front of you. Most stages are settled in one or two turns, your HP carries over from stage to stage, and permanent upgrades let each new run go further.

## 2. Design pillars

1. **Simple to read.** Every card shows one number and one arrow. A new player understands the board within 10 seconds.
2. **Placement is the game.** There is no card draw and no randomness in combat. Every outcome comes from where you put your cards.
3. **HP is the long-term resource.** HP never regenerates by itself, so a sloppy win now costs you stages later.
4. **Short stages.** Each stage is designed to finish in 1–2 turns, and enemies enrage to punish dragging a fight out.
5. **Depth comes from content, not rules.** New cards and enemies add depth. The core rules stay the same all game.

---

## 3. Core loop

```
 ┌───────────── RUN ─────────────────────────────────────────────┐
 │                                                               │
 │   Stage ──► Place army ──► Fight ──► Enemies left? ──yes──┐   │
 │     ▲                                     │               │   │
 │     │                                     no              │   │
 │     │                                     ▼               │   │
 │     └──── Reward (card / upgrade / heal) ◄─ Stage clear   │   │
 │                                                           │   │
 │              (rearrange, enemies enraged) ◄───────────────┘   │
 │                                                               │
 │   HP reaches 0 ──► Run over ──► Earn Souls                     │
 └───────────────────────────────────────────────────────────────┘
                     │
                     ▼
        Meta upgrades (permanent) ──► Next run
```

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

### 7.2 Later enemies (Act 3+)

| Enemy | Rule |
|---|---|
| Healer | Heals adjacent enemies by 2 at the end of each turn it survives |
| Splitter | Splits into two 1♥ enemies (in its tile and an empty neighbour) when destroyed |
| Summoner | Adds a Goblin to an empty enemy tile each turn |
| Bulwark | Blocks overkill and pierce from passing to the tile behind it |
| Boss | Large HP, high ATK and one gimmick (for example, it moves one column each turn, or it is immune to supporter-boosted damage below ×2) |

---

## 8. Stage design

### 8.1 Difficulty curve

| Act | Stages | Expected turns | Player goal | What's new |
|---|---|---|---|---|
| **1: Learn** | 1–5 | 1 | Find the obvious placement | One mechanic per stage: attack, range, +, ×, Shield |
| **2: Think** | 6–15 | 1–2 | Find the clever one-turn clear | Barrels, armor, back-row enemies, overkill |
| **3: Survive** | 16+ | 2 (a one-turn clear is usually impossible) | **Minimize damage** | Healer, Summoner, Splitter. A boss every 10 stages |

### 8.2 Stage design rules

- Every stage is **handcrafted** (or drawn from a handcrafted pool) and validated by the solver (`tools/solve.js`).
- Act 1: the solution is visually obvious.
- Act 2: a one-turn, zero-damage solution **must exist**, but random placements should almost never find it.
- Act 3: a one-turn clear should **not** exist. The best line should cost a small amount of HP (1–4), while a careless line costs 3–4× that.
- Total enemy ATK should be clearly higher than the hero's expected HP at that point, so ignoring the board is always fatal.

### 8.3 Prototype stages (for reference)

| Stage | Name | Hero HP | Army | Solver result |
|---|---|---|---|---|
| 6 | Powder Alley | 17/20 | 6 cards | Clearable in 1 turn with 0 damage (barrel and overkill combo) |
| 9 | The Iron Line | 14/20 | 8 cards | Clearable in 1 turn with 0 damage, a tight puzzle |
| 12 | The Siege | 11/20 | 9 cards | No 1-turn clear. The best found is 3 damage over 2 turns, and a careless first turn costs 6–11 |

---

## 9. The run (in-run progression)

- **Starting army:** Swordsman, Archer, Drummer, Shield (🛡2). That's 4 cards.
- **Starting HP:** 20.
- **After each stage**, pick **1 of 3** rewards:
  - 🆕 **New card** from the unlocked pool.
  - ⬆️ **Upgrade** a card: +1 ATK, +1 range, +1 block, or a stronger supporter (+1 → +2, ×2 → ×3 for rare upgrades).
  - ❤️ **Heal 3–5 HP**. This is rare (roughly every 3–4 stages) and always competes with power, so it's a real choice.
- The army grows from 4 to about 10–12 cards by the late game. The board has 15 tiles, so space becomes a constraint later.
- **HP never regenerates automatically.**
- **Stage rating:** ★★★ for no damage, ★★ for 3 or less, ★ for a clear. Stars feed the Soul payout.

## 10. Meta progression (between runs)

When a run ends, you earn **Souls ✦** for stages cleared, bosses defeated and stars earned.

| Tree | Example upgrades |
|---|---|
| ❤️ Hero | +2 max HP per level · start each stage with a 1-point barrier · one revive per run |
| ⚔️ Army | Starting attackers +1 ATK · start with a 5th card · starting Shield +1 |
| 🃏 Unlocks | Add new cards to the reward pool (Mage, Spearman, Echo Bell…) |
| 🎁 Rewards | 4 reward choices instead of 3 · heals appear more often · one reward re-roll per stage |
| 🗺️ Board | Unlock a 6th column or a 4th player row |

**Target pacing:** a first run ends around stage 8–12. With steady upgrades, players should reach Act 3 after 3–5 runs and beat the first boss after about 8–10 runs.

---

## 11. UX requirements

- **Live final numbers:** placed cards always show their boosted ATK and range. Boosted values are highlighted.
- **Idle supporters are dimmed**, so the player immediately sees a wasted placement.
- **Hover or select an attacker** to highlight the tiles it can reach and the enemy it would hit right now.
- **Threat forecast:** under each column, show how much damage you take if nothing in that column dies, after Shields.
- **Step-by-step playback** of each turn (shot, hit, overkill, explosion, strike, enrage), with a speed toggle and a text battle log.
- Input: drag-and-drop, plus tap-to-select and tap-to-place for touch.

---

## 12. Balancing levers

| Lever | Effect |
|---|---|
| Enemy HP vs. available ATK | How hard a one-turn clear is |
| Total enemy ATK | The cost of failure |
| Enrage amount (+1 per turn) | How strongly the game pushes stages to 1–2 turns |
| Shield block value | How forgiving partial clears are |
| Heal frequency and amount | Run length |
| Number of free tiles vs. army size | Placement pressure in late runs |

---

## 13. Open questions

1. Should enemies ever **move or change rows** between turns, or stay static for readability?
2. Should a stage be allowed to give a **bonus for a one-turn clear** (extra Souls or an extra reward), beyond the stars?
3. Should **Barrels** ever attack, or stay pure board hazards?
4. Should there be a **turn limit** (for example, 3 turns), or is enrage enough pressure?
5. Should the card order be **front→back, left→right**, or should cards fire in an order the player chooses (more depth, less simple)?
6. Map structure: a linear sequence of stages, or branching paths (elite stages, shops, events)?

---

## 14. Prototype scope (current)

The prototype in `prototype/` tests **only the core placement gameplay**:

- 3 mid-run stages (6, 9 and 12), each with a preset army and carried-over HP
- All rules in sections 4–7 except the Act 3+ enemies
- The live boost display, idle supporters, reach and target preview, threat forecast, animated playback and battle log
- **Not included:** rewards, run map, meta progression, art or audio

See the README for how to run it.
