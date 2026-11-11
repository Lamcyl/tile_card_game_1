# V2 Units and Reactions: Implementation Plan

Status: step 1 done (core data and engine seam); steps 2 to 5 open. Source design: `DESIGN_V2.md` (V2.1) and `docs/data/*.json`. Target: the developer test page (`prototype/dev.js`, `design.js`, `js/fights.js`) behind a rules flag. The overworld (`index.html`) keeps the current roster and rules untouched.

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

Each entry is `{ p: <name>, ...params }`. Order of application is fixed (see 2.5).

| # | Primitive | Params | Covers |
|---|---|---|---|
| 1 | `attack` | pattern straight/spread/pierce, atk, range | all attackers |
| 2 | `skyfall` | atk (range = unlimited) | Khan Garid, Pegasus |
| 3 | `trample` | behind (damage) | Rakhsh, Yali |
| 4 | `swift` | first strike before the front row | Hind |
| 5 | `echo` | factor 0.5 | Sleipnir, Thor's Goats |
| 6 | `chain` | factor 1 (or 0.5 vs Wet/Water), jumps 1 | Dolphin, Long, Raiju |
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
| 20 | `reactRider` | extra hit reaction tied to an element rule | Pegasus (chain on Water) |
| 21 | `ignoreArmor` | n | Sunfire, items |
| 22 | `rend` | cap | Fangs, items |
| 23 | `mimic` | takes the element of the first enemy it hits | Tanuki |
| 24 | `mirror` | copies pattern and ATK of the left unit | Langur |
| 25 | `offering` | consume an adjacent Common for +n ATK (battle) | Scarab Roller |
| 26 | `brood` | every Nth turn spawn a 1-ATK drone card | Honeybee |

Bastion = `attack` + `shield` in one card; Kin only = `buff.kinOnly`; Bond = `buff` with `requires: unitId` in the squad (see risks).

**Coverage estimate** (from the 89 abilities): about **80 full**, **9 simplified**, 0 dropped. Full: every straight, spread, pierce, skyfall, shield, bastion, herald, boost, captain, scorch, venom, chill, mark, hold, sunder, tribute, bloom, ward, rebirth, trample, swift, echo, chain, molt, scale-type, decoy, carapace, swap, attune, current (about 75), plus 5 that need the harder primitives 23 to 26. Simplified (text changed, noted in `implNote`): Chiwen, Haetae and Shachihoko lose "douse Burn on allies" (no enemy burns player tiles until Section 5 adds one; the Shield and bastion parts stay); Moon Hare's Bond becomes "+1 ATK to adjacent Sun Crow" (board, not squad); Kunpeng and Khepri flavour text is removed. Primitives 23 to 26 are authored last (step 3) and any unit that does not pass its test by then is marked `notYet` and hidden from the V2 picker. A script (`tools/v2-coverage.js`) prints the tally so the estimate is measured, not guessed.

## 2. Elements and reactions in the engine

### 2.1 Elements on both sides

- Player card: `element`, `flavour` from the unit (Attune and Mimic change `s.element` at runtime for the turn or battle).
- Enemy: `Fights.stage` copies `element` and `flavour` from the monster record onto the enemy instance (`e.element`, `e.flavour`; they are on `ENEMY_TYPES` today). Plain monsters have no element and react to nothing but Wet and Burning statuses they gain.

### 2.2 Statuses (new `e.st` object on enemies, `u.st` on units)

| Status | Source | Duration, stacking | Effect |
|---|---|---|---|
| Burning (n) | Fire hit with `onHit burn`, Wildfire spread | 2 turns, refreshes, intensity does not stack (max 1; Fan doubles the tick) | tick n at start of enemy phase, ignores armor |
| Wet | Water hit; enemies tagged `wet` start Wet | 2 turns, refreshes | marker for Steam, Freeze, Conduct; cleared by Steam |
| Chilled | `onHit chill`, Ice hit | rest of the battle, -1 ATK per source, cap -2, min 1 | lowers enemy ATK per lane |
| Frozen | Ice hit on a Wet enemy | skips its next strike (all lanes), cannot refreeze for 1 turn | thawed by Fire (Steam) |
| Poisoned (n) | Venom | permanent, +1 per hit, cap 3 | tick n per turn, ignores armor |
| Marked | Mark | until the next hit, consumed on the first hit | +1 damage |
| Held | Hold | this turn | skips its strike |
| Armor shred | Sunder | battle, armor -1 (min 0) | |

Big bodies follow B7: a status applies once per attack action per body; ticks once per turn per body.

### 2.3 Hit reactions (attacker element versus target)

Hook: in the `resolveTurn` attacker loop, `V2.hit(state, s, e, dmg, ctx)` runs before `dealDamage` and returns `{ dmg, after: [] }`. It looks up the pair in a `REACTIONS` table built from `elements.json` (id, pair, hit rule as parameters, not text):

| Reaction | Hit rule as implemented |
|---|---|
| Steam | Fire vs Water/Wet/Ice target: +2, remove Wet and Frozen, other enemies touching it -1 ATK this turn (once per action) |
| Wildfire | Burn on a Wood or Burning enemy: spread Burn to neighbouring bodies |
| Fan | Wind hit on a Burning enemy: tick doubles this turn |
| Smother | Earth hit on a Fire enemy: +1, remove Burn or Fury |
| Ground | Earth hit on a Wind/Lightning enemy: +1, cancels chain or Fury |
| Eclipse | Light hit on a Shadow enemy: +2, remove Hide, Veiled, Ghost |
| Conduct | Lightning hit on a Water/Wet enemy: chain at half damage even without `chain` |
| Freeze | Ice hit on a Wet enemy: Frozen (Chill is applied by every Ice hit) |
| Bloom, Roots, Pollen, Sunfire, Mist | adjacent only (2.4) |

The "after" list (spread, chain, status) is processed FIFO after the main hit, in enemy-id order, and never re-triggers a reaction (one level deep; a chain hit is a hit but carries `fromReaction` so it cannot chain again). Per-hit versus per-action follows B7 and B8: damage bonuses per hit, neighbour effects and statuses once per action.

### 2.4 Adjacent reactions (allies)

Hook: end of `computeStats` (V2 only), `V2.adjacent(stats, rules)`: for every orthogonal pair of placed V2 units with a paired element, apply the table: Wildfire (+1 ATK to Wood), Steam (hero +1 block), Bloom (+1 ATK, hero heals 1 per turn), Conduct (Wind chains), Fan (Fire +1 ATK), Smother (warning, see 9), Roots (Shields +1), Pollen (+1 reach on the Wood unit's buff), Ground (chain reach +1), Eclipse (both +1 ATK), Sunfire (both ignore 1 armor), Mist (column takes 1 less enemy damage). **Automatic** in v1 of this work. Each applied reaction is recorded in `stats[k].reactions = [{id, with:key}]` so the preview and the battle log can show it. Results are order independent (each reaction adds to a `plus` / `block` total before multipliers, same rule as classic: add, then multiply).

### 2.5 Resolution order (one turn)

1. **Boost phase** (`computeStats`): base, then buffs (with Kin bonus), then captains and resonance, then adjacent reactions, then Offering and Mirror, then multipliers. Emit `react` events for the log.
2. **Fire phase**: attackers by (row front first, column left to right); Swift units first. For each hit: Marked, Frozen/Chilled checks, hit reaction, `dealDamage` (armor, Hide, Veil, Rend), `onHit` statuses, `after` queue, kill hooks (`onKill`, Wet clear on death), `echo` second hit, `swap` last.
3. **Status phase** (new, before enemy strikes): Burn and Poison ticks (enemy id order); deaths count as kills but never Rend.
4. **Strike phase**: existing logic; Frozen, Held skip; Chilled lowers ATK per lane; Mist and Decoy and Shields apply per column.
5. **End of turn**: existing gimmicks (rage, harden, regen, heal, regrow, tide), `heroHeal`, Molt and Carapace growth, status duration countdown.

### 2.6 Enemy flavours and inert keywords

Ice and Lightning flavours become live through 2.2 and 2.3. Keywords made live: see section 5. Enemy keywords are stored on the instance as `e.kw` (array) copied from `inert` by `Fights.stage` when `rules.v2` is set (the engine only reads them under the flag).

### 2.7 UI feedback (`battle.js`, `ui.js`, `dev.css`)

- **Element chip** on every card and enemy (small coloured pip plus a 1-letter flavour mark); the squad bar shows resonance and family counters.
- **Preview before placing:** the existing ghost preview (computeStats on a hypothetical placement) draws reaction icons on the affected tiles and a one-line list under the board ("Wildfire: Bulgae +1 ATK"). A Smother pair shows a warning triangle.
- **Hit pop-ups** (floating text on the enemy): "Steam +2", "Freeze", "Wildfire"; status icons in the enemy status row with turn counts.
- **Battle log:** one line per reaction and status event (`react`, `status`, `tick`, `freeze`), using new event types in the `events` list that `battle.js` already animates; unknown event types are ignored so classic fights are unaffected.
- **Complexity budget:** at most 2 reaction icons per tile, text details only on tap (the existing info card).

## 3. Families, kin bonuses, resonance and Rend (v2 flag)

- **Kin bonus:** `buff.kin = {by:'family'|'element', amt:1}`: target gets `amount + amt` when `target.family`/`element` matches; `kinOnly` buffs skip other targets and use `amount` 2 (data holds the numbers). No engine special case per unit.
- **Family sets** at 2 and 4 on the **squad** (`army`, not the board): Wings (+1 range / first shot ignores Guarded and Hide), Hooves (+1 ATK turn 1 / all Swift), Fangs (Straight Fangs gain Rend and Howl counts the squad / Rend cap 4, Pounce +1), Scales (secondary numbers +1 / count as Water), Wilds (one or two units count as any family). Implemented as `V2.FAMILY_SETS` returning rule flags merged into `state.rules` and per-card modifiers inside `computeStats`.
- **Resonance** at 2 and 4 on **placed** units of an element (`elements.json` text mapped to flags: Fire, Water, Wood, Earth, Wind, Light, Shadow). Counted in `computeStats`; item `resonance_count` adds 1 later.
- **Rend** under `rules.v2`: `dealDamage` carries overkill only when the source stats have `rend` (card behaviour, family set, relic rule `rend`, Whetstone `rendCap`); cap 3, 4 with the Fangs 4-set or Hunter's Moon; Spill needs Rend. Flag off: the current "every non-Pierce hit carries" code path is untouched. The enemy tags (Bulwark, Sansin and so on) keep their meaning; the re-tag of fight text is data only and done in step 4.

## 4. Evolution stages

- `stage` (1-3) selects which patches of `stages` apply when `V2.card` builds the card. Legendaries exist at stages 2 and 3 only; units with 2 evolution entries cap at stage 2. No Command Point surcharge.
- Stage rules mirror DESIGN_V2 6 (Mastery Lv3 plus 2 stars for 2, Lv5 plus 4 stars for 3) but the **dev page ignores the unlock rules** and lets the tester pick any stage; `V2.maxStage(unit)` and `V2.unlocked(save, unit)` exist so the main game can adopt them later.
- Run evolution (seeds, shrines) and the Mentor behaviour are **out of scope**.

## 5. Enemy keywords made live in this work

Live (needed by reactions or cheap and generic): `wet` (starts Wet), `chill` (the enemy's strike chills the attacker in the struck column, -1 ATK next turn), `chain` (enemy lightning hits the hero's neighbouring column for half), `ghost` (plain hits do 1 less; Eclipse removes it), `skewer` (ignores Shield), `leech` (heals when it hits the hero), `chief` and `alpha` (neighbour ATK +1 aura), `grudge` (+2 ATK when a neighbour dies), `thorn` (a hit costs the hero 1 HP). **Stay inert:** swarm, rise, mimic, enrage, fuse, phases, venom (enemy venom), hold, corrupted, crystal, sand-bury, trample. `docs/data/fights-unsupported.md` is regenerated and lists what is live under the flag.

## 6. Dev page changes (`prototype/dev.js`, `design.js`, `dev.css`)

- **Rule-set toggle** in the Run (or header) tab: Classic / V2, stored as `S.rules = 'classic'|'v2'`. When V2 is selected `P.rulesFor` output gets `v2: 1` and the Team tab switches to the V2 roster; a banner says "V2 rules, dev only".
- **Team editor (V2):** a table of the 89 units (filter by family, element, rarity, implemented); per row: in squad, stage (1-3), Mastery (1-5), Stars (1-5). `S.v2squad = [{id, stage, level, stars}]`, saved in dev state. Command Points are shown but not enforced (as today).
- **Squad bar:** family counters (2 / 4 thresholds lit), element resonance counters, and CP used.
- **Reference V2 squads:** `Fights.referenceV2(L)` builds a V2 squad per level (list `ATTACKERS_V2`, `SUPPORT_V2`, ATK raised to P(L) through the same `mods` mechanism, Shield block to `shieldBlock(L)`). The existing "Ref Lv N" buttons apply the V2 one when the toggle is V2.
- **Design tab:** the Units sub-tab gets an Implemented column (full / simplified / not yet, from `impl`) and a filter; Elements shows reaction status (live / not yet).
- **Classic roster remains** for the classic toggle and for `index.html`.

## 7. Solver, validator, tests

- **`tools/solve.js`** needs no change in its search: it already calls `Engine.resolveTurn` and scores from the state, so behaviours and reactions flow through. Two edits: `TILES` takes `playerTilesFor(rules)`; the score term for survivor threat includes statuses (Frozen and Held enemies count 0).
- **`tools/validate-fights.mjs`**: new option `--rules=v2`, which builds the army from `Fights.referenceSaveV2(L)` and sets `rules.v2`. Results are reported separately; the BALANCE block in `fights-unsupported.md` gets a V2 table next to the classic one. The classic run must stay 700 of 700.
- **Re-tuning (`tools/fights-tune.json`, `fights-adjust.json`):** do not change the classic numbers. Add `tools/fights-tune.v2.json` and `fights-adjust.v2.json`, read by `build-fights.mjs --rules=v2` to write `prototype/data/fights-v2/`; `dev.js` loads the set matching the toggle. Targets stay (intro 0.65 ... boss 2.7). If the two sets would differ only slightly, step 5 may instead apply a per-sub-area ATK factor. Open: one data set for both rule sets is simpler, but the V2 squad is stronger at equal level, so separate tuning is recommended.
- **`tools/test-v2.js`** (new, plain node asserts like `test-big-enemies.js`): one test per primitive on a hand-built board; one per reaction (hit and adjacent); statuses (duration, stacking, Big body once per action); Kin bonus; family set 2 and 4; Rend cap; determinism (two runs equal); all 89 units construct and survive a 3-turn smoke battle without throwing.
- **Fuzz equivalence:** `git show 33b83f5:prototype/js/engine.js` into the scratchpad as `engine-33b83f5.js`; `test-v2.js --fuzz` generates 2000 stages (`Gen`, V2 fights with Big bodies, random placements and armies from the classic roster), runs both engines with the flag off and asserts `JSON.stringify` of `{state, events}` is equal. A second fuzz with the flag on, classic cards and elementless enemies must differ only through Rend (assert equal when no overkill carry occurs). Also run `tools/test-big-enemies.js` and `tools/validate-gen.js` unchanged.

## 8. Work steps (each sized for one Sonnet agent)

| Step | Scope | Files | Done when |
|---|---|---|---|
| **1. Core data and engine seam** | `CARD_TYPES.v2`, `isAttacker/…` helpers, `v2.js` skeleton (`load`, `card`), primitives 1 to 8, 11 to 13 for the simple ~60 units; `behaviours` authored for those; `impl` tally script; flag-off fuzz harness (golden copy of 33b83f5) | `js/engine.js`, new `js/v2.js`, `docs/data/units.json`, `tools/v2-coverage.js`, `tools/test-v2.js` (fuzz and primitive tests) | `node tools/test-v2.js` green incl. flag-off equivalence; `test-big-enemies.js`, `validate-gen.js` unchanged; coverage script prints the tally |
| **2. Elements, statuses, reactions** | statuses 2.2, hit and adjacent reactions, resolution order 2.5, resonance, family sets, kin bonus, Rend under the flag, new events; enemy `element`/`flavour` passed through `Fights.stage`; live keywords (section 5) | `js/engine.js`, `js/v2.js`, `js/fights.js`, `tools/test-v2.js` | per-reaction and per-status tests pass; Big-body once-per-action test passes; determinism test passes; fuzz still equal with the flag off |
| **3. Remaining behaviours and evolution** | primitives 9 to 10, 14 to 26 for the rest of the units (chain, echo, swap, decoy, attune, mimic, mirror, offering, brood, rebirth, and others); `stages` patches for all lines; `impl`/`implNote` completed; `notYet` units flagged | `js/v2.js`, `units.json`, `tools/test-v2.js` | every unit is full, simplified or `notYet` and the smoke battle passes for all implemented units at each stage |
| **4. Dev page and UI** | rule toggle, V2 team editor, squad bar, reference squad builder, `referenceSaveV2`, element chips, reaction preview, pop-ups, log lines, Design tab implemented column; README dev section; `DESIGN_V2.md` section 10 note update | `dev.js`, `design.js`, `dev.css`, `js/battle.js`, `js/ui.js`, `js/fights.js`, `README.md`, `docs/DESIGN_V2.md` | manual check on a 390 px viewport: toggle, pick, place, see reaction preview, fight, read log; classic fights still look identical; `npm run build` and `npm run single:dev` succeed |
| **5. Balance and validation** | `--rules=v2` in the validator, V2 tune files, regenerate fights-v2, tune until 700/700 pass and the V2 table in `fights-unsupported.md`; update the "not live" list | `tools/validate-fights.mjs`, `tools/solve.js`, `tools/build-fights.mjs`, `tools/fights-tune.v2.json`, `tools/fights-adjust.v2.json`, `docs/data/fights-unsupported.md`, `docs/WORLD_PROGRESSION.md` note | `node tools/validate-fights.mjs --rules=v2` passes 700/700, classic run still 700/700, every sub-area rises and boss harder than elite |

Steps are strictly sequential (each depends on the previous). Each step ends with `node tools/test-v2.js`, the classic validator on a sample (`--every=10 --quick`) and a doc note in this file's status line.

## 9. Risks and open choices

| Risk or choice | Recommendation |
|---|---|
| Adjacent reactions automatic or by tap | **Automatic** in the first version; reactions are shown in the preview before Fight. Revisit if testers want control |
| Smother warning pair | Keep as a **visible warning only** plus one mild effect: the Fire unit's Burn lasts 1 turn instead of 2 when it stands beside Earth. No damage to allies |
| Complexity on a phone | At most 2 reaction icons per tile, details on tap, a one-line summary under the board, and a toggle to hide icons. Test every UI change at 390 px |
| Engine perf: solver runs thousands of turns | Keep `computeStats` allocation-light, cache the reaction table by element pair, avoid cloning statuses when empty. Gate: V2 validator within 2x the classic time |
| Flag-off regressions | The fuzz test against 33b83f5 is a blocking check in every step; no edits to unflagged lines except the helper substitutions |
| Hybrid roles break `role` checks | All role tests go through helpers (step 1); a grep check for raw `.role ===` outside them is part of the done-check |
| Bond, Offering, Brood add board state | Simplify Bond to adjacency, Offering to "+2 ATK, adjacent Common cannot attack this battle" (no return next battle), Brood to a fixed drone card; mark `notYet` if a primitive proves unstable |
| Tuned fights differ between rule sets | Separate V2 tune file (step 5); keep classic data frozen |
| Units not in `Progress.ROSTER` break save and gacha code | V2 squad lives only in dev state; no V2 id ever reaches `Progress` saves or the overworld |
| Family count on squad vs board | Squad for family sets, board for resonance (as DESIGN_V2 3 and 2). Confirm during the balance step |
| Elite and boss reaction resistance | Never in this work; enemies have no immunities unless tagged |
| `wet`, `chill`, `chain` keyword meaning on enemies | Interpreted as above (starts Wet; strike chills; strike chains); confirm with the author of `build-fights.mjs` |

## 10. Step notes

### Step 1 (core data and engine seam)

Done: `CARD_TYPES.v2` (role `hybrid`) and helpers `isAttacker/isSupport/isDefender` in `engine.js` (the only raw `.role ===` left in the engine is inside the helpers; the UI files `battle.js`, `app.js`, `dev.js` still test `type.role` and are step 4 work); `prototype/js/v2.js` (`load`, `card`, stage patches, hooks); `Engine.hooks.v2` registry, every call guarded by `rules.v2`; behaviours for 58 units (51 full, 7 simplified), 31 marked `impl: 'pending'`; `tools/v2-coverage.js`; `tools/test-v2.js` (25 tests incl. two fuzz runs against `git show 33b83f5`, ~1050 battles each, real V2 fights included); `dev.js` imports `v2.js`.

Decisions and readings:
- `impl` also has the value `pending` (behaviours not authored yet, step 3 or later); `implNote` says which primitive is missing. Pegasus is pending because of its Water reaction rider.
- Primitives done: attack, skyfall (range 99), trample, swift, echo (second volley, half ATK rounded up, repeats the pattern fresh), chain (as classic `fx.chain`), scale (fullHp as per-hit Pounce; lastPlaced, firstPlaced, perFamilyInRow, perFamily, perElement), molt, buff (up, up2, adjacent, column, row, board; effects atk, range, block; `kin` and `kinOnly`; `diag` for patches), grant (echo, swift), shield (`perKin`, `grow`).
- Units with no stated ATK use ATK 2. Divine Tortoise has no stated base block, so Shield 2 is assumed (simplified). Polar Bear reads as: adjacent Shields +1 block (Water +2), adjacent Water attackers +1 ATK.
- Latecomer/Firstborn use the key order of `placement` (insertion order). The UI must build the placement in the order cards were placed.
- Molt and Carapace counters live in `state.rules.v2mem` (per card id, created only when such a unit is on the board). Molt counts turns on the board; Carapace grows on turns with no enemy strike in its column and never shrinks.
- Chain halves against a target that is Wet or whose element is in the behaviour's `wetVs` list (data: `["water"]`). Element ids are never listed in code: they come from `elements.json` and unit data, because the element list may change (Wind and Lightning may split; enemy strengths and weaknesses are not implemented).
- `Progress.squadCp` V2 lookup is not done (step 4, with the team editor).
- With the flag on and classic cards the engine still matches 33b83f5 exactly (Rend is step 2).
