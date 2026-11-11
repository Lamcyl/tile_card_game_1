# V2 Units, Affinity and Merges: Implementation Plan (V2.2)

Status: steps 1, 2 and 2b done (core data and engine seam; elements, affinity, weakness hits, statuses, sets, Rend, live keywords; column merges and both merge modes); steps 3 to 5 open and **revised in V2.2** (8 elements, affinity chart, named weakness hits, column merges in place of reactions). Source design: `DESIGN_V2.md` (V2.2) and `docs/data/*.json`. Target: the developer test page (`prototype/dev.js`, `design.js`, `js/fights.js`) behind a rules flag. The overworld (`index.html`) keeps the current roster and rules untouched.

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
