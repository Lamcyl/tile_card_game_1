# V2 Units, Affinity and Merges: Implementation Plan (V2.2)

Status: all work steps done (1, 2, 2b, 3, 4 and 5: core data and engine seam; elements, affinity, weakness hits, statuses, sets, Rend, live keywords; column merges and both merge modes; every behaviour primitive, evolution stages for all lines, three new Lightning units; dev page and battle UI; V2 balance: `--rules=v2` validator, V2 tune files, unit budget script, affinity and merge studies). Source design: `DESIGN_V2.md` (V2.2) and `docs/data/*.json`. Target: the developer test page (`prototype/dev.js`, `design.js`, `js/fights.js`) behind a rules flag. The overworld (`index.html`) keeps the current roster and rules untouched.

## 0. Principles

- **One flag, one seam.** `state.rules.v2 = 1` switches V2 behaviour on. Every V2 code path lives in a new file `prototype/js/v2.js` (IIFE, `window.V2` / `module.exports`, like `fights.js`). `engine.js` gets a few small hook calls, each guarded by `if (rules.v2)`, so flag-off code runs the same instructions as commit 33b83f5.
- **Data first.** Unit behaviour is data (`behaviours` in `units.json`), executed by generic primitives. Adding a unit later means editing JSON, not the engine.
- **Pure and deterministic.** `computeStats` (boost phase) stays pure and is reused by the battle preview. All ordering is by tile (row front to back, column left to right) and by enemy id. No `Math.random` anywhere in V2 rules.
- **Reuse, do not fork.** V2 units are ordinary army cards with extra fields, so `battle.js`, `solve.js` and `validate-fights.mjs` keep working.

## 1. Data model

### 1.1 Runtime unit

An army card (what `Progress.buildArmy` returns today: `{ id, type, atk, range, block, amount }`) gains, for V2 units only:

```
{ id: 'plume_herald', type: 'v2', v2: true, unit: 'plume_herald',
  element: 'wood', flavour: null, family: 'wings', role: {atk:30,buff:70,guard:0},
  stage: 1..3, level: mastery 1-5, stars: 1-5, rarity, cp,
  atk, range, block,            // resolved base numbers after stage patches and level bonuses
  pattern: 'straight'|'spread'|'pierce'|null,
  beh: [ {p:'buff', ...}, ... ] // behaviours active at this stage, patches already applied
}
```

- `CARD_TYPES.v2` is added to `engine.js` with `role: 'hybrid'`. Code that tests `type.role === 'attacker' | 'support' | 'defender'` is routed through helpers `isAttacker(s)`, `isSupport(s)`, `isDefender(s)`, which for classic cards return exactly the old test, and for `v2` cards look at the behaviours (a Bastion is attacker and defender in one tile).
- `V2.load(units, elements, families)` indexes the JSON. `V2.card(unitId, {stage, level, stars})` builds the card (stage patches, then the same star and mastery bonuses as `buildArmy`: +1 ATK at 3 stars or Mastery 5, +1 range at 5 stars; shields get the same). `V2.UNITS` replaces `P.ROSTER` only on the dev page; `Progress.ROSTER` is not modified.
- `Command Points`: `cp` = `RARITY[rarity].cp` (unchanged 1/2/3/4, no stage surcharge, as DESIGN_V2 6). `Progress.squadCp` gets a V2 lookup through an optional `ROSTER_BY` extension, applied only when the dev page registers V2 units (see 6).
- Old traits are not used by V2 units. Families and resonance (section 3) replace them when the flag is on.

### 1.2 From text to behaviours

Each unit gets `behaviours: [...]` (and optional `stages: {2: [patch...], 3: [patch...]}` for the `evolution[].extends` lines; a patch is `{op:'add'|'set'|'inc', ...}`). The free-text `ability` stays as the display line. A unit is `implemented` when it has a non-empty `behaviours` and no `notYet` field. `status` in `units.json` stays `proposed`; add `impl: 'full' | 'simplified' | 'notYet'` plus `implNote` (what was changed in the text).

### 1.3 Behaviour primitives (26)

Each entry is `{ p: <name>, ...params }`. Order of application is fixed (see 2.6).

| # | Primitive | Params | Covers |
|---|---|---|---|
| 1 | `attack` | pattern straight/spread/pierce, atk, range | all attackers |
| 2 | `skyfall` | atk (range = unlimited) | Khan Garid, Pegasus |
| 3 | `trample` | behind (damage) | Rakhsh, Yali |
| 4 | `swift` | first strike before the front row | Hind |
| 5 | `echo` | factor 0.5 | Sleipnir, Thor's Goats |
| 6 | `chain` | factor 1 (0.5 only in the Conduct weakness hit; the legacy `wetVs` list is removed in step 2), jumps 1 | Dolphin, Long, Raiju |
| 7 | `scale` | when `fullHp` / `lastPlaced` / `firstPlaced` / `perElement` / `perFamily` / `perFamilyInRow`, bonus, cap | Pounce, Latecomer, Firstborn, Resonance, Howl |
| 8 | `molt` | per turn, cap | Yazi, Axolotl, Khepri |
| 9 | `onHit` | status burn/venom/chill/mark/hold/sunder, n, turns, `centreOnly`, `column` | Scorch, Venom, Chill, Mark, Hold, Sunder, Bai Ze |
| 10 | `push` | columns 1 | Cheonma |
| 11 | `buff` | target up/up2/adjacent/cross/column/row/board, effect atk/range/block, amount, `kin:{by,amt}`, `kinOnly` | Herald, Boost, Cross Boost, Relay, Captains, Qilin, Salamander |
| 12 | `grant` | gives target echo / swift (buff of a behaviour) | Qiuniu |
| 13 | `shield` | block, `perKin` {by, cap}, `grow` {per turn unstruck, cap} | Shield, Carapace, Herd, Resonance guard |
| 14 | `decoy` | takes first strike in its column | Bi'an, Xolo |
| 15 | `heroHeal` | n per turn | Bloom (Pelican, Honu, Moon Hare) |
| 16 | `heroGuard` | `negateFirstStrike` / `rebirth` | Kotuku, Phoenix |
| 17 | `onKill` | souls n / healHero n / elite bonus | Tribute, Huma |
| 18 | `attune` | unit above (and below at stage 2) takes this element | Nine-Tail Fox |
| 19 | `swap` | after attacking, swap with ally behind / adjacent | Tulpar, Reynard |
| 20 | `bonusDmg`, `colGuard`, `amplify`, `compose` | merge helpers (2.4); `reactRider` is dropped: Pegasus becomes a plain `skyfall` and its Water interaction is the Conduct weakness hit | merges, Pegasus |
| 21 | `ignoreArmor` | n | Sunfire, items |
| 22 | `rend` | cap | Fangs, items |
| 23 | `mimic` | takes the element of the first enemy it hits | Tanuki |
| 24 | `mirror` | copies pattern and ATK of the left unit | Langur |
| 25 | `offering` | consume an adjacent Common for +n ATK (battle) | Scarab Roller |
| 26 | `brood` | every Nth turn spawn a 1-ATK drone card | Honeybee |

Bastion = `attack` + `shield` in one card; Kin only = `buff.kinOnly`; Bond = `buff` with `requires: unitId` in the squad (see risks).

**Coverage estimate** (from the 89 abilities): about **80 full**, **9 simplified**, 0 dropped. Full: every straight, spread, pierce, skyfall, shield, bastion, herald, boost, captain, scorch, venom, chill, mark, hold, sunder, tribute, bloom, ward, rebirth, trample, swift, echo, chain, molt, scale-type, decoy, carapace, swap, attune, current (about 75), plus 5 that need the harder primitives 23 to 26. Simplified (text changed, noted in `implNote`): Chiwen, Haetae and Shachihoko lose "douse Burn on allies" (no enemy burns player tiles until Section 5 adds one; the Shield and bastion parts stay); Moon Hare's Bond becomes "+1 ATK to adjacent Sun Crow" (board, not squad); Kunpeng and Khepri flavour text is removed. Primitives 23 to 26 are authored last (step 3) and any unit that does not pass its test by then is marked `notYet` and hidden from the V2 picker. A script (`tools/v2-coverage.js`) prints the tally so the estimate is measured, not guessed.

## 2. Elements, affinity, weakness hits and column merges in the engine (V2.2)

Rules source: `DESIGN_V2.md` section 2 and `docs/data/elements.json` (`affinity`, `weaknessHits[]`, `merges[]`, `mergeRules`, `affinityRules`). **No element id is hard-coded in `v2.js`**: the element list, the matrix, the weakness hits and the merges are read from the loaded JSON (`V2.load` takes `elements.json` whole). The old attacker-versus-target reaction table and the adjacent-ally reactions are removed.

### 2.1 Elements on both sides

- Player card: `element`, `flavour` from the unit (Attune and Mimic change `s.element` at runtime for the turn or battle).
- Enemy: `Fights.stage` copies `element` and `flavour` from the monster record onto the enemy instance (`e.element`, `e.flavour`). The fights already carry the 8 element names (`Lightning` for storm variants; flavour only `ice`). Plain monsters have no element: every hit on them is x1 and no weakness hit fires.
- Element ids are lower case in `units.json` and `elements.json`, capitalised in the fights; `V2` normalises with `toLowerCase`.

### 2.2 Statuses (new `e.st` object on enemies, `u.st` on units)

Used statuses only. **Wet and its checks are deleted** (no reaction reads it; the `wet` enemy tag stays an inert flavour tag).

| Status | Source | Duration, stacking | Effect |
|---|---|---|---|
| Burning (n) | Fire `onHit burn`, Wildfire, Kindle, Blaze, Magma | 2 turns, refreshes, does not stack (Kindle sets n 2) | tick n at start of the enemy phase, ignores armour |
| Chilled | `onHit chill`, Ice hit, Steam (1 turn), Scald (1 turn), Mire and Gloom (battle) | -1 ATK per source, cap -2, min 1; `turns` 1 or battle | lowers enemy ATK per lane |
| Frozen | a second Ice hit on an already Chilled enemy | skips its next strike (all lanes); cannot refreeze for 2 turns | |
| Poisoned (n) | Venom, Spores, Radiance and Resonance of Wood | permanent, +1 per hit, cap 3 | tick n per turn, ignores armour |
| Marked | Mark, Static, Sandstorm | until the next hit, consumed by the first hit | +1 damage |
| Held | Hold, Roots, Twilight, Shadow Resonance | this turn's next strike; cooldown 1 (2 for Shadow Resonance) | skips its strike |
| Armour shred | Sunder, Erode, Earth Radiance and Resonance | battle, armour -1 per application (min 0) | |

Big bodies follow B7: a status applies once per attack action per body; ticks once per turn per body.

### 2.3 Affinity (replaces the hit-reaction table)

Hook: in the `resolveTurn` attacker loop, `V2.hit(state, s, e, dmg, ctx)` runs before `dealDamage` and returns `{ dmg, after: [] }`.

1. `mult = AFFINITY[hitElement][e.element] ?? 1` (matrix from `elements.json`, so the dev page can overwrite it). In `own` mode `hitElement` is the attacker's element; in `best` mode it is the best multiplier among the column attackers' elements (see 2.5).
2. `dmg' = base + flat bonuses (buffs, Mark, merge bonus damage)`, then `mult > 1 ? ceil(dmg' x mult) : mult < 1 ? max(1, ceil(dmg' x mult)) : dmg'`. Armour, Hide and Rend come after, exactly as classic. Round once per hit; Spread, Pierce, Chain, Echo and Rend hits are separate hits with their own element.
3. If `mult > 1`, fire the **weakness hit** for the (attacker element, defender element) pair: look up `weaknessHits` by `attacker`/`defender`, then run its `effect` spec through the same primitives as units (`onHit`, `chain`, `heroHeal`, `push`; `op:'cleanse'` removes named statuses or keywords). Per hit event; area parts once per attack action.
4. The `after` queue (chain, push, status) is processed FIFO after the main hit, in enemy-id order, and never re-triggers a weakness hit or a merge (one level deep; a chain hit is a hit but carries `fromEffect` so it cannot chain again).

Per-hit versus per-action follows B7 and B8: the multiplier per hit, statuses and area parts once per action.

### 2.4 Column merges (replace adjacent reactions)

Hook: end of `computeStats` (V2 only) calls `V2.merges(stats, rules)`. Per column of the board:

1. Collect the **attackers** (placed cards with an attack behaviour and ATK >= 1 after boosts; hybrids count once; elementless cards are ignored), ordered front to back.
2. Build the list of distinct element pairs, plus one `[x, x]` entry per element that occurs twice or more, then cap it at `mergeRules.cap.perColumnPerTurn` (3). Look each up in `merges[]` by pair (order-free), for `light` / `shadow` partners use the matching `radiance_*`, `eclipse_*`, `twilight`, `resonance_*` entries.
3. Carrier: the front-most attacker of the pair (Resonance: the front-most of that element). Record `stats[carrier].merges = [{id, with: key}]` for the preview and the log.
4. Overlap: merges whose effect is the same status or primitive do not stack (strongest wins); total flat `bonusDmg` from merges on one hit is capped at +2.
5. In the Fire phase `V2.hit` adds the carrier's merge effects to its primary hit (damage parts before the affinity multiplier, status and area parts after). If the carrier cannot strike (Held, no target), the next attacker of the pair carries it, else it is lost.
6. Column effects (`colGuard` of Mist and Grove, `buff nextTurn` of Bloom and Charge) are stored in `state.rules.v2mem` for the column and read at the Strike phase or next Boost phase.

Merge effect specs use the existing behaviour primitives (`onHit`, `chain`, `echo`, `trample`, `heroHeal`, `buff`, `ignoreArmor`, `push`) plus three small ones: `bonusDmg {n}`, `colGuard {block, turns}` and `amplify {of, effect}` (the effect of the element's `signatures` entry at Radiance or Resonance strength); `compose {parts}` applies several. Results are order independent.

### 2.5 Merge mode switch (`rules.v2.mergeMode`)

| Mode | Implementation |
|---|---|
| `own` (default) | `hitElement = s.element` for every hit. Merge effects ride on the carrier hit, which uses the carrier's own element |
| `best` | For a hit by an attacker in column c: `hitElement` = the column attacker element with the highest `AFFINITY[el][e.element]` (ties: the front-most). The weakness hit is the one for that element, once per hit. Merges unchanged. Resist applies only if every attacker resists. A one-element column behaves as `own` |

The mode lives in `state.rules.v2.mergeMode` (set from the dev page; default `own`). It changes nothing when only one element stands in the column.

### 2.6 Resolution order (one turn)

1. **Boost phase** (`computeStats`): base, buffs (with Kin bonus), captains and element sets, then column merges (2.4), then Offering and Mirror, then multipliers. Emit `merge` events for the log.
2. **Fire phase**: attackers by (row front first, column left to right); Swift units first. For each hit: Marked, Frozen/Chilled checks, base plus flat plus merge damage, affinity multiplier (2.3), `dealDamage` (armour, Hide, Veil, Rend), `onHit` statuses, weakness hit, merge status and area effects, `after` queue, kill hooks, `echo` second hit, `swap` last.
3. **Status phase** (new, before enemy strikes): Burn and Poison ticks (enemy id order); deaths count as kills but never Rend.
4. **Strike phase**: existing logic; Frozen and Held skip; Chilled lowers ATK per lane; Mist, Grove, Decoy and Shields apply per column.
5. **End of turn**: existing gimmicks, `heroHeal`, Molt and Carapace growth, status duration countdown, column effects expire.

### 2.7 Enemy flavours and inert keywords

Only the Ice flavour remains (Chill, second-hit Freeze). Lightning is an element, not a flavour. Keywords made live: see section 5. Enemy keywords are stored on the instance as `e.kw` copied from `inert` by `Fights.stage` when `rules.v2` is set.

### 2.8 UI feedback (`battle.js`, `ui.js`, `dev.css`)

- **Element chip** on every card and enemy, with 8 colours (`battle.js` `EL_COLOR` hard-codes the 7 old names: **add Lightning**, and drive the colours from `elements.json`). On an enemy card, small arrows show weak (up) and resist (down) elements; the squad bar shows element sets and family counters.
- **Preview before placing:** the ghost preview draws a merge icon on the column's carrier and a one-line list under the board ("Column 2: Scald (Fire + Water), Mire (Water + Earth)"). Placing an attacker over an enemy shows the multiplier on the target ("x1.5 Conduct").
- **Hit pop-ups:** "Weak x1.5", "Conduct", "Scald"; status icons in the enemy status row with turn counts.
- **Battle log:** one line per weakness hit, merge and status event (`weak`, `merge`, `status`, `tick`, `freeze`), as new event types; unknown event types are ignored so classic fights are unaffected.
- **Complexity budget:** at most 3 merge icons per column, text details only on tap.

## 3. Families, kin bonuses, resonance and Rend (v2 flag)

- **Kin bonus:** `buff.kin = {by:'family'|'element', amt:1}`: target gets `amount + amt` when `target.family`/`element` matches; `kinOnly` buffs skip other targets and use `amount` 2 (data holds the numbers). No engine special case per unit.
- **Family sets** at 2 and 4 on the **squad** (`army`, not the board): Wings (+1 range / first shot ignores Guarded and Hide), Hooves (+1 ATK turn 1 / all Swift), Fangs (Straight Fangs gain Rend and Howl counts the squad / Rend cap 4, Pounce +1), Scales (secondary numbers +1 / count as Water), Wilds (one or two units count as any family). Implemented as `V2.FAMILY_SETS` returning rule flags merged into `state.rules` and per-card modifiers inside `computeStats`.
- **Element sets** (formerly squad "resonance", renamed to avoid the clash with the Resonance merge) at 2 and 4 on **placed** units of an element (`elements.json` `resonance` text mapped to flags: Fire, Water, Wood, Earth, Wind, Lightning, Light, Shadow). Counted in `computeStats`; item `resonance_count` adds 1 later.
- **Rend** under `rules.v2`: `dealDamage` carries overkill only when the source stats have `rend` (card behaviour, family set, relic rule `rend`, Whetstone `rendCap`); cap 3, 4 with the Fangs 4-set or Hunter's Moon; Spill needs Rend. Flag off: the current "every non-Pierce hit carries" code path is untouched. The enemy tags (Bulwark, Sansin and so on) keep their meaning; the re-tag of fight text is data only and done in step 4.

## 4. Evolution stages

- `stage` (1-3) selects which patches of `stages` apply when `V2.card` builds the card. Legendaries exist at stages 2 and 3 only; units with 2 evolution entries cap at stage 2. No Command Point surcharge.
- Stage rules mirror DESIGN_V2 6 (Mastery Lv3 plus 2 stars for 2, Lv5 plus 4 stars for 3) but the **dev page ignores the unlock rules** and lets the tester pick any stage; `V2.maxStage(unit)` and `V2.unlocked(save, unit)` exist so the main game can adopt them later.
- Run evolution (seeds, shrines) and the Mentor behaviour are **out of scope**.

## 5. Enemy keywords made live in this work

Live (needed by weakness hits, merges or cheap and generic): `chill` (the enemy's strike chills the attacker in the struck column, -1 ATK next turn), `chain` (enemy lightning hits the hero's neighbouring column for half), `ghost` (plain hits do 1 less; Dawn and Eclipse remove it), `skewer` (ignores Shield), `leech` (heals when it hits the hero), `chief` and `alpha` (neighbour ATK +1 aura), `grudge` (+2 ATK when a neighbour dies), `thorn` (a hit costs the hero 1 HP). **Stay inert:** swarm, rise, mimic, enrage, fuse, phases, venom (enemy venom), hold, corrupted, crystal, sand-bury, trample. `docs/data/fights-unsupported.md` is regenerated and lists what is live under the flag.

## 6. Dev page changes (`prototype/dev.js`, `design.js`, `dev.css`)

- **Rule-set toggle** in the Run (or header) tab: Classic / V2, stored as `S.rules = 'classic'|'v2'`. When V2 is selected `P.rulesFor` output gets `v2: 1` and the Team tab switches to the V2 roster; a banner says "V2 rules, dev only".
- **Team editor (V2):** a table of the 89 units (filter by family, element, rarity, implemented); per row: in squad, stage (1-3), Mastery (1-5), Stars (1-5). `S.v2squad = [{id, stage, level, stars}]`, saved in dev state. Command Points are shown but not enforced (as today).
- **Squad bar:** family counters (2 / 4 thresholds lit), element set counters, and CP used.
- **Reference V2 squads:** `Fights.referenceV2(L)` builds a V2 squad per level (list `ATTACKERS_V2`, `SUPPORT_V2`, ATK raised to P(L) through the same `mods` mechanism, Shield block to `shieldBlock(L)`). The existing "Ref Lv N" buttons apply the V2 one when the toggle is V2.
- **Design tab:** the Units sub-tab gets an Implemented column (full / simplified / not yet, from `impl`) and a filter; The Elements tab lists the 8 elements, the weakness hits and the merges with live / not yet status (already wired to `weaknessHits` and `merges` in V2.2).
- **Editable weakness chart (4.1)** in the Design or Run tab: an 8x8 grid, rows = attacker element, columns = enemy element (matches `elements.json` `affinity[attacker][defender]`). Tap a cell to cycle **x0.5, x1, x1.5**; buttons **Reset** (reload `elements.json`), **Export** (copy the matrix as JSON) and **Import** (paste JSON, validated: 8x8, values 0.5, 1 or 1.5). The chart lives in dev state (`S.affinity`) and is passed into `V2.load` as an override; **changes apply to the next fight**, not the one in progress. The weakness hit names stay tied to the pair: a cell set to x1.5 fires the weakness hit defined for that pair in `weaknessHits[]`, a pair without a defined hit gets the bonus only. Show the cell colour (green weak, red resist) and the pair name on long-press.
- **Merge-mode switch (4.1):** a two-state control **Own element / Best of column** (default Own element) in the same panel, stored as `S.mergeMode` and passed as `rules.v2.mergeMode`; also next fight. A line under it states the mode's rule (`mergeRules.modes`).
- **Classic roster remains** for the classic toggle and for `index.html`.

## 7. Solver, validator, tests

- **`tools/solve.js`** needs no change in its search: it already calls `Engine.resolveTurn` and scores from the state, so behaviours, affinity and merges flow through. Two edits: `TILES` takes `playerTilesFor(rules)`; the score term for survivor threat includes statuses (Frozen and Held enemies count 0).
- **`tools/validate-fights.mjs`**: new option `--rules=v2`, which builds the army from `Fights.referenceSaveV2(L)` and sets `rules.v2`. Results are reported separately; the BALANCE block in `fights-unsupported.md` gets a V2 table next to the classic one. The classic run must stay 700 of 700.
- **Re-tuning (`tools/fights-tune.json`, `fights-adjust.json`):** do not change the classic numbers. Add `tools/fights-tune.v2.json` and `fights-adjust.v2.json`, read by `build-fights.mjs --rules=v2` to write `prototype/data/fights-v2/`; `dev.js` loads the set matching the toggle. Targets stay (intro 0.65 ... boss 2.7). If the two sets would differ only slightly, step 5 may instead apply a per-sub-area ATK factor. Open: one data set for both rule sets is simpler, but the V2 squad is stronger at equal level, so separate tuning is recommended.
- **`tools/test-v2.js`** (new, plain node asserts like `test-big-enemies.js`): one test per primitive on a hand-built board; one per affinity pair class (weak, resist, neutral, rounding table 1 to 6), one per weakness hit (12), one per merge (36, grouped by kind), merge rules (cap 3, carrier, overlap, no merge for non-attackers or elementless cards, Big body once per action), both merge modes; statuses (duration, stacking, Big body once per action); Kin bonus; family set 2 and 4; Rend cap; determinism (two runs equal); all 89 units construct and survive a 3-turn smoke battle without throwing.
- **Fuzz equivalence:** `git show 33b83f5:prototype/js/engine.js` into the scratchpad as `engine-33b83f5.js`; `test-v2.js --fuzz` generates 2000 stages (`Gen`, V2 fights with Big bodies, random placements and armies from the classic roster), runs both engines with the flag off and asserts `JSON.stringify` of `{state, events}` is equal. A second fuzz with the flag on, classic cards and elementless enemies must differ only through Rend (assert equal when no overkill carry occurs). Also run `tools/test-big-enemies.js` and `tools/validate-gen.js` unchanged.

## 8. Work steps (each sized for one Sonnet agent)

| Step | Scope | Files | Done when |
|---|---|---|---|
| **1. Core data and engine seam** | `CARD_TYPES.v2`, `isAttacker/…` helpers, `v2.js` skeleton (`load`, `card`), primitives 1 to 8, 11 to 13 for the simple ~60 units; `behaviours` authored for those; `impl` tally script; flag-off fuzz harness (golden copy of 33b83f5) | `js/engine.js`, new `js/v2.js`, `docs/data/units.json`, `tools/v2-coverage.js`, `tools/test-v2.js` (fuzz and primitive tests) | `node tools/test-v2.js` green incl. flag-off equivalence; `test-big-enemies.js`, `validate-gen.js` unchanged; coverage script prints the tally |
| **2. Elements, affinity, weakness hits, statuses** | load the 8 elements and the `affinity` matrix, `V2.hit` multiplier with the rounding rule (2.3), the 12 weakness hits from `weaknessHits[]`, statuses 2.2 (Wet deleted, Frozen by a second Ice hit), element sets, family sets, kin bonus, Rend under the flag, new events; enemy `element`/`flavour` through `Fights.stage`; live keywords (section 5); remove the `wetVs` data and the `st.wet` check in `chain`, make Pegasus a plain skyfall | `js/engine.js`, `js/v2.js`, `js/fights.js`, `docs/data/units.json`, `tools/test-v2.js` | a test per weakness hit, per multiplier case and per status; rounding table test; Big-body once-per-action test; determinism; fuzz still equal with the flag off |
| **2b. Column merges** | `V2.merges` (2.4): attacker set, pair list, cap 3, carrier, overlap, merge specs (`bonusDmg`, `colGuard`, `amplify`, `compose`), `mergeMode` own / best (2.5), column effect memory, `merge` events | `js/v2.js`, `js/engine.js` (hook only), `tools/test-v2.js` | a test per merge kind and per cap and overlap rule; both modes tested on a mixed-element column; flag-off fuzz still equal |
| **3. Remaining behaviours and evolution** | primitives 9 to 10, 14 to 26 for the rest of the units (chain, echo, swap, decoy, attune, mimic, mirror, offering, brood, rebirth, and others); `stages` patches for all lines; `impl`/`implNote` completed; `notYet` units flagged | `js/v2.js`, `units.json`, `tools/test-v2.js` | every unit is full, simplified or `notYet` and the smoke battle passes for all implemented units at each stage |
| **4. Dev page and UI** | rule toggle, V2 team editor, squad bar, reference squad builder, `referenceSaveV2`, element chips (8 colours, **add Lightning to `EL_COLOR`**), weak and resist arrows on enemies, merge preview, pop-ups, log lines, Design tab implemented column; **editable 8x8 weakness chart** and **merge-mode switch** (4.1); README dev section; `DESIGN_V2.md` section 10 note update | `dev.js`, `design.js`, `dev.css`, `js/battle.js`, `js/ui.js`, `js/fights.js`, `README.md`, `docs/DESIGN_V2.md` | manual check on a 390 px viewport: toggle, pick, place, see the merge preview and the weak arrows, edit the chart, switch merge mode, fight, read log; classic fights still look identical; `npm run build` and `npm run single:dev` succeed |
| **5. Balance and validation** | `--rules=v2` in the validator (mode Own element; also run Best of column once as a report), V2 tune files, regenerate fights-v2, tune until 700/700 pass and the V2 table in `fights-unsupported.md`; check that no single merge or 3-merge column dominates (log merge usage in the solver output) and tune the numbers in `elements.json`; update the "not live" list | `tools/validate-fights.mjs`, `tools/solve.js`, `tools/build-fights.mjs`, `tools/fights-tune.v2.json`, `tools/fights-adjust.v2.json`, `docs/data/fights-unsupported.md`, `docs/WORLD_PROGRESSION.md` note | `node tools/validate-fights.mjs --rules=v2` passes 700/700, classic run still 700/700, every sub-area rises and boss harder than elite |

Steps are strictly sequential (2b follows 2) (each depends on the previous). Each step ends with `node tools/test-v2.js`, the classic validator on a sample (`--every=10 --quick`) and a doc note in this file's status line.

## 9. Risks and open choices

| Risk or choice | Recommendation |
|---|---|
| Merges automatic or by tap | **Column merges are automatic** (decision accepted; replaces "adjacent-ally reactions are automatic"); they are shown in the preview before Fight. Revisit if testers want control |
| Merge mode | **Own element** is the default; **Best of column** is a dev-page switch for testing only (2.5). No new affinities for merged elements |
| 3-element column too strong | The cap (3), no-stack and +2 damage cap (2.4) bound it; check in the step 5 balance runs that a 3-merge column does not dominate, tune merge numbers in `elements.json` |
| Complexity on a phone | At most 3 merge icons per column, details on tap, a one-line summary under the board, and a toggle to hide icons. Test every UI change at 390 px |
| Engine perf: solver runs thousands of turns | Keep `computeStats` allocation-light, cache the 8x8 matrix and the merge lookup by element pair, avoid cloning statuses when empty. Gate: V2 validator within 2x the classic time |
| Flag-off regressions | The fuzz test against 33b83f5 is a blocking check in every step; no edits to unflagged lines except the helper substitutions |
| Hybrid roles break `role` checks | All role tests go through helpers (step 1); a grep check for raw `.role ===` outside them is part of the done-check |
| Bond, Offering, Brood add board state | Simplify Bond to adjacency, Offering to "+2 ATK, adjacent Common cannot attack this battle" (no return next battle), Brood to a fixed drone card; mark `notYet` if a primitive proves unstable |
| Tuned fights differ between rule sets | Separate V2 tune file (step 5); keep classic data frozen |
| Units not in `Progress.ROSTER` break save and gacha code | V2 squad lives only in dev state; no V2 id ever reaches `Progress` saves or the overworld |
| Family count on squad vs board | Squad for family sets, board for element sets and merges (as DESIGN_V2 3 and 2). Confirm during the balance step |
| Elite and boss affinity | Same chart as their element in this work; no immunities. Optional `affinityOverride` later (DESIGN_V2 open decision 11) |
| `wet`, `chill`, `chain` keyword meaning on enemies | `wet` becomes an inert tag (Wet status is deleted); `chill` (strike chills) and `chain` (strike chains) as above; confirm with the author of `build-fights.mjs` |

## 10. Step notes

### Step 1 (core data and engine seam)

Done: `CARD_TYPES.v2` (role `hybrid`) and helpers `isAttacker/isSupport/isDefender` in `engine.js` (the only raw `.role ===` left in the engine is inside the helpers; the UI files `battle.js`, `app.js`, `dev.js` still test `type.role` and are step 4 work); `prototype/js/v2.js` (`load`, `card`, stage patches, hooks); `Engine.hooks.v2` registry, every call guarded by `rules.v2`; behaviours for 58 units (51 full, 7 simplified), 31 marked `impl: 'pending'`; `tools/v2-coverage.js`; `tools/test-v2.js` (25 tests incl. two fuzz runs against `git show 33b83f5`, ~1050 battles each, real V2 fights included); `dev.js` imports `v2.js`.

Decisions and readings:
- `impl` also has the value `pending` (behaviours not authored yet, step 3 or later); `implNote` says which primitive is missing. Pegasus is pending because of its Water reaction rider (V2.2: the rider is dropped, Conduct covers it; author it as a plain skyfall).
- Primitives done: attack, skyfall (range 99), trample, swift, echo (second volley, half ATK rounded up, repeats the pattern fresh), chain (as classic `fx.chain`), scale (fullHp as per-hit Pounce; lastPlaced, firstPlaced, perFamilyInRow, perFamily, perElement), molt, buff (up, up2, adjacent, column, row, board; effects atk, range, block; `kin` and `kinOnly`; `diag` for patches), grant (echo, swift), shield (`perKin`, `grow`).
- Units with no stated ATK use ATK 2. Divine Tortoise has no stated base block, so Shield 2 is assumed (simplified). Polar Bear reads as: adjacent Shields +1 block (Water +2), adjacent Water attackers +1 ATK.
- Latecomer/Firstborn use the key order of `placement` (insertion order). The UI must build the placement in the order cards were placed.
- Molt and Carapace counters live in `state.rules.v2mem` (per card id, created only when such a unit is on the board). Molt counts turns on the board; Carapace grows on turns with no enemy strike in its column and never shrinks.
- Chain halves against a target that is Wet or whose element is in the behaviour's `wetVs` list (data: `["water"]`). Element ids are never listed in code: they come from `elements.json` and unit data (V2.2: Wind and Lightning did split, the 8-element list is data only; `v2.js` needed no change). The `wetVs` data on Dolphin, Raiju and Long stays until step 2 because `test-v2.js` asserts the half chain.
- `Progress.squadCp` V2 lookup is not done (step 4, with the team editor).
- With the flag on and classic cards the engine still matches 33b83f5 exactly (Rend is step 2).

### V2.2 revision (design step, data only)

- Eight elements: Lightning split from Wind (Kunpeng, Pegasus, Thor's Goats, Raiju now `element: lightning`, no flavour); storm-variant enemies are Lightning in `regions.json` and the fights; the Ice flavour stays.
- `elements.json` now has `affinity` (8x8), `affinityRules` (rounding), `weaknessHits[]` (12), `signatures`, `merges[]` (36, with effect specs), `mergeRules` (scope, attacker, pairs, cap 3, carrier, overlap, modes). The V2.1 `reactions[]` table is removed.
- Behaviours and statuses reused; new small primitives: `bonusDmg`, `colGuard`, `amplify`, `compose`, and `onHit op:'cleanse'`.
- Steps 2 to 5 above are rewritten for affinity (step 2), column merges (step 2b), the editable chart and mode switch (step 4) and balance (step 5). Nothing in `prototype/js/` was changed in the design step: `v2.js` and the unit behaviours are data driven (only `battle.js` `EL_COLOR` lists the old 7 colours, fixed in step 4); `prototype/design.js` got a three-line change so its Elements tab reads `weaknessHits` and `merges`.

### Step 2 and 2b (elements, affinity, weakness hits, statuses, sets, Rend, keywords, column merges)

Done in one run: `js/v2.js` (hooks `startTurn`, `hit`, `passMerges`, `statusPhase`, `preStrike`, `afterStrike`, `guardOf`, `suppressed`, `endTurn`; `computeSets`, `merges`), small flag-guarded hooks in `engine.js`, `Fights.stage(fight, { v2: true })`, data (Pegasus plain skyfall, `wetVs`/`wetFactor` removed, `families.json` `scales.countsAs`), `tools/test-v2.js` (62 tests, both fuzz runs still equal to 33b83f5), `docs/data/fights-unsupported.md` (LIVE keywords).

Rules switches and where the data lives:
- `state.rules.v2` is `1` or an object: `{ mergeMode: 'own' | 'best', affinity: {attacker: {defender: mult}}, sets: false }`. A given `affinity` replaces the loaded matrix as a whole (a missing row or cell is x1), so the dev page must pass the full 8x8. `mergeMode` default is `mergeRules.modes.default` (own). `sets: false` turns family and element set bonuses off (used by the step 1 tests).
- Matrix, weakness hits, merges and `mergeRules` (cap 3) are read from the `elements.json` document given to `V2.load(units, elementsDoc, families)`; changing them there needs no code change. Element ids appear in `v2.js` only in `ELEMENT_SETS` (the mapped 2/4 set flags) and once as `'light'` for the Ghost keyword.
- Engine seams (all behind `rules.v2`): `computeStats(..., turn)` gets the turn (default 1) so turn-1 bonuses work in the preview; `dealDamage` takes `canCarry` as a Rend cap, `ignoreArmor` as a number and a `bypass` list, `e.st.shred` shreds armour; `wardReason` honours `bypass`, `e.st.noward` and `e.st.noveil`; the strike phase calls `preStrike` (skip, Chill, aura, Grudge, skewer), `afterStrike`, column guards and Chain neighbour strikes. `createState` copies `element`, `flavour`, `kw` only when the stage entry has them.

Decisions and readings:
- Rend under the flag applies to **V2 cards only**; classic cards in a V2 battle keep the classic carry (so the flag-on fuzz stays equal and `Progress` squads are unaffected). Carry overkill of V2 cards needs a `rend` behaviour (primitive 22, step 3), the Fangs 2-set (Straight Fangs, cap 3, cap 4 at the 4-set), `rules.rend` or `rules.rendCap`. Overkill carry hits and Spill hits are raw damage, not judged on an element (the plan's "Rend hits judged on their own element" is not done: the carry happens inside `dealDamage`).
- Frozen: a `onHit chill` of a **unit behaviour** (an Ice hit) on an already Chilled body freezes it; Steam, Scald, Mire and Gloom chills do not. Freeze and Hold skip the whole strike once; Hold cooldown n means no new Hold for n turns after it was used; Freeze cannot repeat for 2 turns.
- Chill turns: 1 expires at the end of the turn, 99 or none lasts the battle; cap two stacks (-2 ATK, min 1). Burn ticks in the Status phase (applied on turn T it ticks on T and T+1 for 2 turns), refreshes to the longer duration and takes the larger n (and `tickMult`). Poison +n per action, cap 3 (+`capPlus`, +1 for the Scales 2-set).
- Statuses and areas apply once per attack action per body (`once` keys in `s.v2.done`); damage per hit. Weakness hits fire per hit; chain jump hits, echo and trample hits are separate hits with their own multiplier but carry `fromEffect` (no weakness hit, no merge, no further chain). A unit's own `chain` suppresses a Conduct jump in the same action (strongest wins).
- Mark is +1 on the next hit and is consumed by it (a Sandstorm or Static mark is spent by the next attacker of the turn). Smother and Ground `cleanse` set `e.st.supp[name]` for `turns` turns: `enrage`, `fury` (rage gimmick), `regrow` and the `chain` keyword; `hide` and `veiled` set `noward` / `noveil`; `ghost` removes the keyword.
- Keywords (section 5, readings from `keywords.json` and DESIGN_V2): `chill` chills the struck column for the next turn (any strike), `chain` strikes both neighbouring columns for half after the direct strikes, `ghost` -1 on plain hits (min 1), `skewer` skips the Shield pool, `leech` heals the enemy 1 when its strike hurts the hero, `chief` and `alpha` give +1 ATK to a neighbouring enemy (once, not per aura), `grudge` +2 ATK per neighbour that died, `thorn` is read as "a player hit on it costs the hero 1 HP, once per turn per body, ignoring Shields". Enemy keywords reach the engine as `e.kw` from `Fights.stage(fight, { v2: true })` (the fights' `inert` list).
- Element sets: Fire 2 +1 ATK turn 1 (own element), 4 Burn +1 turn (unit onHit); Water 2 chain +1, 4 hero heals 1 per turn; Wood 2 Molt cap +1, 4 Bloom (`heroHeal` behaviour) +1; Earth 2 Shields +1 block, 4 hits ignore 1 armour; Wind 2 all attackers +1 range, 4 first hit of the turn doubled before the multiplier; Lightning 2 chain +1, 4 first chain each turn full damage; Light 2 Purge (Hide and Veil stripped from every enemy once per battle, applied in the first turn the set is on), 4 Herald and Bond buffs +1; Shadow 2 Hold also holds the neighbours, 4 hero not struck on turn 1. Counted on placed V2 cards. Family sets count the squad (`army`): Wings 2 range, 4 first shot ignores Guarded and Hide; Hooves 2 ATK turn 1, 4 Swift; Fangs 2 Rend (Straight) and Howl counts the squad, 4 Rend 4 and Pounce +1; Scales 2 secondary +1 (Shield block, chain jump, trample, poison cap), 4 Scales also judge hits as `families.json` `countsAs` (Water, best multiplier of own and that element; they do not count for merges); Wilds 2 / 4 let one / two Wilds count as the family they lift most. Kin bonus was already done in step 1.
- Merges: computed in `finish` (after boosts, so ATK >= 1 uses the final numbers and Chill from last turn), stored on the carrier as `stats[k].merges = [{id, name, kind, pair, col, spec, with}]`; a `merge` event per carrier merge opens the Fire phase. Pair order is first-seen element order front to back, Resonance entries follow the pairs, then the cap 3. A carrier with no target passes its merges to the next later attacker of the pair in its column, else they are lost. Damage parts (`bonusDmg` capped at +2, `ignoreArmor`, `andIgnore`) apply on the carrier's primary hit before armour; status, area, chain, echo, trample, heal, push and column parts after it. Overlap keeps the strongest (n x tickMult, then turns). Column effects live in `rules.v2mem`: `guard` (this turn's Strike), `buffNext` -> `buff` (next Boost), `chillNext` -> `chill` (enemy Chill keyword). `bonusDmg`, `colGuard`, `amplify`, `compose` are generic; `amplify` applies the stronger effect given in the data.
- Merge mode `best`: a hit is judged by the best multiplier among the elements of the column's attackers (ties: the front-most, own element first), so a resist applies only if all resist; the weakness hit follows the chosen element once per hit; a one-element column is `own`. Classic or elementless attackers never use it.
- Events added: `weak` (id, mult, element, name), `merge`, `status`, `tick`, `freeze`, `grudge`, `thorn`, `chain` (existing, now also from weakness hits and merges), `move` with `push: true`, `mend` with `source: 'v2'`. Unknown types are ignored by the classic UI.
- Not done in these steps: `onHit`, `push`, `heroHeal`, `rend` and `ignoreArmor` as unit behaviours are executed (generic leaves) but no unit data uses them yet (step 3); `Fights.referenceV2`, UI chips, merge preview, the chart editor and the mode switch are step 4; V2 validation and tuning are step 5. The step 1 tests run with `rules.v2 = { sets: false }`; the new tests with `{ v2: {} }`.

### Step 3 (remaining behaviours, evolution stages, Lightning units)

Done: every pending unit now has behaviours (`impl` is `full` 77 or `simplified` 15, none `pending`/`notYet`); `stages` patches for every evolution entry of all 92 units (stage 2 and, for the six 3-stage lines, stage 3); the 3 new Lightning units; `tools/test-v2.js` 86 tests (24 new: one per primitive, per stage family, a patch-integrity test, a "never escalates" test, determinism over all units and stages), both flag-off and flag-on fuzz runs still equal to 33b83f5.

Evolution rule kept: a stage never changes type, family, element, base ATK or pattern; it adds range (+1), area (diagonals, beside, upper-left, side columns, far unit, column, row), an extra target (behind, beside, second column, neighbour), a longer or larger secondary (Burn 3 turns, poison cap 4, Molt cap 4, Shield +1, heal 2) or a buff reach. Four flavour-only stage-2 texts had no effect in the engine and were replaced in the data (`evolution[].extends` and `implNote` updated): Jaguar Moon (range +1), Haetae and Shachihoko (range +1), Chiwen (Shield +1).

New Lightning units (DESIGN_V2 open decision 4d, now closed; Lightning has 7): **Kui** (Ambivalent beast from the bestiary, Hooves, rare: Straight R2 that Marks the target, stage 2 also the enemy behind), **Electric Eel** (real animal, Scales, common: Straight R2 ATK 1 that Holds, not again next turn, stage 2 also the enemy beside), **Storm Petrel** (real animal, Wings, common: the unit above +1 ATK, Lightning units +2 as Kin; stage 2 also the unit beside). No deities.

New primitives and patch ops (all in `v2.js`, flag guarded; targets `beside`, `upleft`, `far`, `sidecols` added to `buff`/`grant`):
- `onHit` extensions: `centreOnly` (Spread centre), `frontOnly` (first body of a Pierce), `column` (every enemy in its column), `alsoColumn` (front body of the neighbouring column, right else left), `alsoBehind`, `alsoBeside` (same-row neighbours), `turns` on Mark (a unit Mark lapses at the end of that turn; weakness-hit Marks stay until spent as before), Hold `cooldown`. `push` unit behaviour with `alsoNeighbour`.
- `heroHeal` `n2`/`when2` (`struck`, `belowHalf`); `heroGuard` `negate` (first damaging strike of the battle; `second` adds one in another column) and `rebirth` (hero rises at half HP once per battle, `keepShield` gives a hero barrier); `onKill` (`souls`, `eliteExtra`, `bossExtra`, `healHero` with `once`, `any` counts every kill on the board). Souls accrue in `state.soulsBonus` plus a `souls` event; the run layer is step 4 or later. "Elite and boss" both read as an enemy type flagged `boss`; `bossExtra` needs the body on the boss row.
- `decoy`: the first strike in the decoy's column is also taken by the decoy (its block value on top of the column pool, once per turn, skewer ignores it). Engine hooks `sk.decoy` and `sk.negate` in the strike loop and `rebirth` before the defeat check.
- `attune` (`both` = also below, `atk` = attuned units +ATK), `mimic` (element of the first body hit, kept in `rules.v2mem.mimic` for the battle, first hit itself is judged normally), `mirror` (left unit's pattern, base ATK and range, `range` bonus; the card is not an attacker when nothing attackable stands on its left, and classic supports do not reach it), `offering` (consumes the first adjacent Common V2 ally in the order up, left, right, down for the whole battle; no return), `ignoreArmor` as a unit behaviour, `echo` and `grant` with `minus` (full ATK minus 1), `chain` with `plus` and `flat`, `buff.only` (Bond partner).
- `swap` and `brood` change the board: they append to `rules.v2mem.moves` (`swap` {a,b}; `drone` {key,id,from}) and `Engine.resolveTurn` replays the list on the placement and army at the start of every turn (`V2.applyMoves`). Events `swap`, `drone`, `mimic`, `negate`, `souls`, `revive` (source `rebirth`). The battle UI must show these and, if the player may rearrange cards between turns, clear `v2mem.moves`. The Drone is an elementless, familyless 1-ATK R2 card (`drone: true`, excluded from family sets), at most 3 per Hive.
- Tulpar needs an ally behind; Reynard picks the first of left, right, up, down (stage 2: nearest in its row, ties left). Two swaps never touch the same tile in one turn.
- Readings: Kotuku stage 2 "next column" is "one more strike negated, in a different column"; Cheonma stage 2 pushes the first same-row neighbour as well; Huma heals on the first kill each turn of any unit; Phoenix rebirth is once per battle; Bond (Moon Hare) is adjacency, Moon Hare gives an adjacent Sun Crow +1 ATK; Kunpeng stage 2 chains at half damage; Pegasus stage 2 chains a flat 1; Units with no stated ATK use ATK 2 (Sun Crow, Raven Pair, Phoenix, Sarimanok, ...), Scarab Roller ATK 1.
- Preview note for step 4: `computeStats` shows Offering, Mirror and Attune, but not swaps or spawned Drones (they come from `V2.applyMoves` inside `resolveTurn`).

### Step 4 (dev page and battle UI)

Done: `dev.js` (Classic / V2 rules switch `S.rules`, V2 team editor, **Chart** tab, V2 reference squads, Run tab for V2 bonuses), `js/battle.js` (V2 cards, chips, previews, inspect card, new events), `battle.css`, `dev.css`, `js/fights.js` (`referenceV2`, `referenceSaveV2`), `js/v2.js` (`V2.army`, `V2.preview`), `js/art.js` (`Art.setV2`, V2 branch of `Art.unit`), `js/progress.js` (`UNIT_CP` falls back to the V2 data), `design.js` (implemented status), `tools/build-unit-art.mjs` -> `data/v2-unit-art.json` (17 exact, 0 close, 75 family fallback).

Decisions and readings:
- Dev state: `S.rules` ('classic' | 'v2'), `S.v2squad` (unit ids), `S.v2cfg` (`{id: {stage, level, stars}}`, defaults 1/1/1 for beasts never edited), `S.affinity` (null = the default of `elements.json`, else the full 8x8), `S.mergeMode`. `fight()` under V2 builds the army with `V2.army(entries, S.run.mods)`, uses a save copy with an empty classic squad for HP, hero and `rulesFor` (classic traits do not apply), and sets `rules.v2 = { mergeMode, affinity: full 8x8 }`. The classic squad, rarity overrides and gear stat bonuses to classic cards are untouched; gear bonuses do not reach V2 cards (rules from gear and hero do).
- "Adjacent-ally reactions are automatic" is superseded: column merges are automatic (no player choice). The merge preview uses `stats[k].merges` from `computeStats` of the placed board, or of the probe board while dragging or with a hand card selected; at most 2 merge icons per tile (+N), the full list is the line under the board (tap to expand), the tile titles and the inspect card; the log has one line per `merge` event.
- Board seen by the player = `applyMoves(placement, army, rules)` (swaps and Drones from step 3). Rearranging (drop, return, Return all) first bakes that replay into the layout (Drone cards become ordinary army cards) and clears `rules.v2mem.moves`, as the step 3 hand-off asks. Consequence: after a rearrangement a Hive's per-battle Drone cap (3, counted from the move list) restarts. Placement order (Latecomer, Firstborn) is the insertion order of `game.placement`, which the UI keeps in placement order; swapping two tiles re-inserts the displaced card last.
- Weak and resist: the `weak` event (any multiplier other than 1) gives a pop-up ("Conduct x1.5 ▲" or "Resist x0.5 ▼"), a log line, and a ▲ / ▼ on the damage number of the hit that follows. The preview badge (▲x1.5 / ▼x0.5, via `V2.preview`, same element choice as the hit incl. Best of column) sits on every target of the focused or probed attacker; x1 shows nothing. Enemy cards carry the element chip, the weak-to glyphs (up to 3, from the current chart) and up to 3 status icons from `e.st`; the inspect card lists element, weak-to and resists with multipliers (from `rules.v2.affinity`, so an edited chart shows), keywords with the `keywords.json` rule text, and statuses with turns.
- Inspect: tapping an enemy opens its card in V2 fights (classic unchanged); units open in inspect mode (the 🔍 button, V2 only) so tapping a unit still selects it for placement otherwise.
- Statuses on enemies refresh when the turn settles, not mid-playback (the view is a clone of the pre-turn state); pop-ups show them as they happen.
- Reference V2 squad (placeholder for step 5): attackers Singha (Fire) and Hongsa (Water) and Amur Tiger (Wood) from Lv 1, Reindeer Hauler (Lv 4), Rakhsh (Lv 8), Dolphin Chain (Lv 12); Zodiac Hound (herald) and Bixi (Shield) from Lv 1, River Hippo (Lv 6), Audhumbla (Lv 14); stage 1, Mastery 1, 1 star; ATK raised to P(L) and Shield block to shieldBlock(L) through `mods`. Three elements in the first column set, so a 3-element column is possible from Lv 1.
- Art: `EL_COLOR` is lower case and has Lightning (`#7a5fd0`); `Art.unit` for a V2 card reads `data/v2-unit-art.json` (registered by the dev page only, the main game bundle is unchanged).

### Step 5 (balance and validation)

Done: `tools/validate-fights.mjs --rules=v2` (V2 fights from `prototype/data/fights-v2/`, V2 reference squad, `rules.v2` with Own element merges; also `--merge=best`, `--mergecap=0..3`, `--squad=weak|neutral|resist` for the studies, merge usage in the report, `--write` fills the `BALANCE_V2` block of `docs/data/fights-unsupported.md`), `tools/build-fights.mjs --rules=v2` (reads `tools/fights-tune.v2.json` and `tools/fights-adjust.v2.json`, scales enemy HP to the V2 reference squad volley, writes `prototype/data/fights-v2/`; the classic run and files are unchanged), `tools/v2-balance.js` (unit value against power budget), and the dev page loads the fight set that matches the Rules switch (`dev.js` `loadFights`). The validator passes `--rules=v2` to its workers (the first draft ran the classic fights in the workers).

Results (final non-quick runs, see `fights-unsupported.md`): V2 rules **700 of 700** (non-quick solver), difficulty rises along the 7 fights in 100 of 100 sub-areas, boss harder than elite in 100 of 100; classic rules **700 of 700** (unchanged). Averages per step (V2): turns 1.02 / 1.09 / 2.13 / 2.41 / 2.31 / 2.60 / 3.32, hero cost 0.1 / 0.1 / 1.0 / 2.3 / 3.1 / 0.1 / 3.9 HP. Run time: V2 8 min with 4 workers (non-quick), 5 min quick; classic 2 min.

V2 tuning (what differs from the classic numbers):
- `fights-tune.v2.json`: HP targets per step intro 0.65, intro II 0.95, combine 1.7, combine II 2.0, pre-elite 2.2, elite 2.3, boss 2.8 volleys (classic 0.65, 0.95, 1.6, 1.85, 2.1, 2.2, 2.7) with band multipliers 1.0 / 0.9 / 0.85 / 0.85 / 0.85 (classic 1.2 / 1 / 1 / 1.15 / 1.15): the V2 reference squad kills more per ATK point than the classic one (weak hits, merges, chain, trample), but the live enemy keywords (Thorn, Ghost, Chill, Chain) and 0.5 resists slow the single-target straight units, so a 1.0 multiplier left 172 of 700 fights failing on "takes 4-5 turns" or unwinnable bosses. ATK factors per step are x1.4 of the classic ones, elite ATK 1.5 and boss ATK 1.25 (classic 0.8 and 0.9): the V2 squad takes far fewer strikes (Shield 3 blocks, kills before the strike, Hold, Chill), so enemy ATK had to rise to keep the hero cost visible. `fights-adjust.v2.json` holds 60-odd per-fight HP corrections found by `--suggest` plus a rise fixer (a later fight is raised to the load of the one before it).
- V2 reference squad (`Fights.referenceV2`): Singha, Hongsa, Amur Tiger from Lv 1, Reindeer Hauler from Lv 4, Rakhsh from Lv 8, Kamaitachi Trio (the only common Spread besides Hammerhead) from Lv 12 in place of Dolphin Chain, which became Straight R1 in the unit balance; supports unchanged (Zodiac Hound, Bixi, River Hippo, Audhumbla).
- The cost of a fight (HP lost on the best line) is much lower than in classic (about 4% of max HP on average against 17%): the squad wins mostly by killing first. The pass criteria (turn band, non-trivial, beatable, rising load, boss above elite) are met; a hard fight is one that takes 3 turns, not one that hurts. Raising enemy ATK further only produced unwinnable fights at Lv 40+ in the first drafts, so this is left as a known soft spot (see below).

Unit balance (`tools/v2-balance.js`; method and thresholds in its header): bench of six plain attackers against seven bodies (HP 14, ATK 4) for 4 turns, the unit on its best tile (tried placed first and last), value = extra enemy HP removed plus extra hero HP kept, averaged over the 8 enemy elements, divided by the power budget and compared with the median (x1.75 and above = strong, x0.5 and below = weak). Before: 13 units strong, 9 weak, 2 unmeasured (value 0); after (stage 1): 2 strong (Reindeer Hauler and Snow Leopard, x1.81), 5 weak, 1 unmeasured (Salamander). By rarity (mean relative value) common 1.17, rare 0.99, epic 0.92, legendary 1.17; by kind attack 1.20, buff 1.02, guard 0.97, hybrid 0.80. 23 units changed (data only; types, families, elements and the evolution rules are untouched, the `evolution[].extends` text was only reworded for Honeybee):
  - Strong, lowered: **Dolphin Chain** (Common, value x2.1 before) chain jump 1.0 -> 0.5 of the damage and Straight R2 -> R1; **Hammerhead** Spread R2 -> R1; **Firebird** Spread R3 -> R1 (the Spread ATK 1 units gain most from the ceil rule); **Bi'an** Shield 3 -> 2 (its Decoy doubles the block); **White Hart** Shield 2 -> 1; **Cat Sidhe** and **Nazca Weaver** Hold cooldown 1 -> 2 (a held strike is worth the whole enemy ATK); **Reindeer Hauler** and **Snow Leopard** Chill 99 turns -> 2 turns (Chill plus Frozen stays the strongest common secondary, x1.8).
  - Weak, raised: **Honu**, **Pelican of Mercy**, **Moon Hare** heal 1 -> 2 (stage 2: 3); **Softshell Elder** Shield 1 -> 2; **Geobuk** Shield 2 -> 3; **Honeybee Hive** a Drone every turn instead of every 2nd turn (max 3), stage 2 now max 4 Drones (was "every turn"); **Thousand-Year Crane** also +1 ATK on the unit above (range alone has no value); **Golden Turtle** +1 -> +2 ATK on the unit above (and +1 range); **Yazi** and **Axolotl** ATK 1 -> 2 and **Khepri** ATK 2 -> 3 (Molt needs turns to pay off in fights of 2 to 3 turns); **Ddraig Goch**, **Simargl** Pierce ATK 2 -> 3 and **Dragon Gate Carp** ATK 2 -> 3 (epics sat at 0.7 to 0.8 of the median).
  - Biggest relative changes: Honu, Pelican and Moon Hare heal x2, Yazi and Axolotl ATK x2, Dolphin Chain's jump halved, Honeybee Hive's spawn rate doubled, Golden Turtle's buff doubled. All ability texts in `units.json` were updated to match.
- Tests updated for the new numbers (`tools/test-v2.js`: chain jump, Bloom, Decoy block, Mirror range, Brood, Molt, Geobuk, Reindeer chill turns); 86 of 86 pass, both fuzz runs still equal to 33b83f5.
- Still weak or not measurable by the bench (judged by hand): Kotuku (one negated strike is worth the enemy ATK, so 4 in a bench of ATK 4 enemies; fine from Lv 10 where enemies hit for 6+), Honeybee Hive (Drone ATK 1 is fixed in `v2.js`; weak for fights of 3 turns), Scarab Roller, Nine-Tail Fox, Salamander and Divine Tortoise need Commons, mixed elements, Fire allies or Scales Shields around them (the bench has none), Cu Sidhe needs Fangs in its row. Hybrids stay a little below pure units on the bench (0.80 against 1.20 for attackers) because Shield or heal parts are valued at their bench worth, not their cost; the epic mean (0.92) is slightly under rare. Evolution: the median stage-2 gain is 0 and the mean +20%, but a second buffed tile (Tui Mimic, Firefly Lantern, Storm Petrel, Golden Turtle, Ratatoskr), Electric Eel's second Hold and the +1 range of Range-1 attackers (Singha, Brown Bear, Amur Tiger, Winter Wolf) gain 50 to 110% on the bench; Cheonma's neighbour push loses 30%. These stay as designed (extra target or range is the stated stage extension) and are listed for a later pass.
- Ceil rounding of the weak rule (ATK 1 x1.5 = 2, ATK 1 x0.5 = 1) gives every ATK 1 unit about +25% on average over the 8 elements and ATK 2 +0%, ATK 3 +8%: Spread ATK 1 units (Hammerhead, Kamaitachi, Firebird) are the beneficiaries; Hammerhead and Firebird lost 1 range for it.

Affinity study (`--squad=`; every second sub-area, 350 fights, quick solver, each attacker of the reference squad gets one of three elements picked per fight by the HP-weighted chart multiplier against that fight's enemies; supports unchanged):

| Squad (same units, elements picked per fight) | Mean multiplier of its elements | Fights won | Mean turns | Mean hero cost | Passing the band checks |
|---|---|---|---|---|---|
| Weak elements (best 3 against the fight) | x1.24 | 350 / 350 | 1.62 | 1.7% | 266 (the rest are one-turn clears: too easy) |
| Reference squad (Fire, Water, Wood, Wind) | about x1.0 | 350 / 350 | 2.13 | 4.0% | 350 |
| Neutral elements (nearest x1.0 against the fight) | x1.00 | 350 / 350 | 1.91 | 4.5% | 328 |
| Resisted elements (worst 3 against the fight) | x0.75 | 349 / 350 | 2.36 | 9.0% | 334 |

Reading: affinity matters (resisted squads need 0.45 turns more than neutral ones and lose about twice the HP; weak squads finish 0.3 turns sooner than neutral ones and 0.7 sooner than resisted ones; 34 of their 50 combine fights end in a single turn, against 11 for neutral) but is not mandatory: a squad of neutral elements wins every sub-area fight at the reference level, and even a squad whose three elements are all resisted wins 349 of 350 (the one loss is an Lv 50+ boss). The gap between weak and resisted is 0.74 turns and 7.3 points of max HP per fight on average. Squad sets (the element 2-set and 4-set bonuses) are part of these figures: the study squads repeat three elements over six attackers, so they hold sets the reference squad does not.

Merge study (`--mergecap=`, same 350 fights, reference squad, Own element):

| Per-column merge cap | Fights won | Mean turns | Mean hero cost | Passing the band checks |
|---|---|---|---|---|
| 0 (merges off) | 344 / 350 | 2.26 | 20.2% | 325 |
| 1 | 348 / 350 | 2.13 | 5.6% | 347 |
| 2 | 350 / 350 | 2.14 | 4.1% | 349 |
| 3 (data) | 350 / 350 | 2.13 | 4.0% | 350 |
| 3, mode Best of column (report) | 350 / 350 | 1.91 | 2.9% | 329 (more one-turn clears) |

Reading: the first merge is what matters (cost 20.2% -> 5.6%), the second adds little, the third nothing measurable: going from cap 2 to cap 3 changes the mean cost by 0.1 points and not the turns. In the best lines of the reference squad 1108 columns use one merge, 107 use two and 155 use three (11% of merge columns; the squad has three or four elements and the solver stacks columns when it can); the merge used most is Scald (26% of merge events), then Blaze, Water Resonance, Bloom, Kindle (11 to 14% each), 8 different merges in all. A 3-merge column is therefore not dominant, and no merge numbers or caps were changed. A column with merges off costs the reference squad five times the HP but still wins 98% of the fights; Best of column is about 25% stronger than Own element and is left as the dev-only report mode it is.

### Step 6 (phone-test changes)

Done after the first test on a Samsung phone:
- **Enemy elements parked.** `rules.v2.enemyElements` (default off) gates every use of an enemy element in `v2.js` (`enemyEl`): affinity multiplier, `weak` events and named weakness hits, `V2.preview`, Mimic's source, Spread-to-element. Battle UI: no element chip, weak-to glyphs, name-label dot, variant text, ▲/▼ badges or inspect rows on enemies unless the switch is on. Own-attacker column merges are unchanged. Dev page: Chart tab shows the "parked" card with the switch (the merge-mode switch stays); the chart editor appears only with it on. `validate-fights.mjs --enemyelements=on` re-runs a validation with them on. `tools/test-v2.js` runs its element tests with the switch on (default of its `battle()` helper) and has a new test for the parked default.
- **Long-press inspect** replaces the 🔍 inspect mode and tap-to-inspect (450 ms, cancelled by moving more than 6 px, scroll or pointercancel; the tap action is skipped; `contextmenu` suppressed). Classic fights get a simple card (name and the tile's text).
- **Reactions row** `#b-react` under the player board replaces the icons on the carrying unit and the `#b-merges` line; icons are deduplicated per column; long-press shows name, elements and effect text.
- **Removed:** the "If nothing dies, you take N" strip and the battle log (and its 📜 button) from `index.html`, `dev.html`, `battle.js` and `battle.css` (the old `style.css` / `ui.js` sandbox keeps its own copy).
- **Retreat** (`#b-retreat`, `Battle.start({ rations, onRetreat })`): game `app.js retreat()` keeps `r.hp`, `r.supplies -= 1`, no rewards, ends the run safely at 0 Rations; dev page `retreat()` keeps HP (the mini-run's HP while a chain runs, else `S.run.hp`), spends a new dev Ration counter (`S.run.rations`, Run tab, default 10). "Exit battle" stays as the no-cost abort.
- **Dark mode:** `<meta name="color-scheme" content="light dark">` (also written by `scripts/single-file.mjs`, which drops the page head) plus `color-scheme: light dark` and a `@media (prefers-color-scheme: dark)` block in `theme.css` that restates the same light colours and form-control colours. Not verifiable without the real phone; Samsung's own notes say forced dark respects the declared schemes only in some settings ("Prefer media query over force dark" / adaptive force dark), so the Samsung "Use website dark theme" setting may still matter.
- **Re-tune after parking:** with enemy elements off the V2 quick validation first gave 691/700 (9 fights: 4 or 5 turns, three one-turn clears, one boss too costly). `--suggest` per failing sub-area added about 9 entries to `tools/fights-adjust.v2.json` (70 to 79 entries) and `node tools/build-fights.mjs --rules=v2` rebuilt `data/fights-v2/`. Quick run after that: 699/700 passing fights (the last, greenvale-misty-highlands/combine2, was then re-suggested and passes 7/7 in a single-sub-area run), difficulty rises in 100/100 sub-areas, boss harder than elite in 99/100 (emberreach-dwarven-forge, left). The classic quick run is 699/700 (one pre-elite 18 HP against a limit of 17; the classic engine path is byte-identical, see the fuzz test). The full non-quick run was not repeated.
