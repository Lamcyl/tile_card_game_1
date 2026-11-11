# Tile Defense

A turn-based tile placement game with roguelite runs. You place a fixed army of cards on a grid to defeat enemies in 1–2 turns, and your HP carries over between stages.

- **Design document:** [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md)
- **Gameplay prototype:** [`prototype/`](prototype/)

## Play the prototype

**Online:** https://claude.ai/artifact/1ifNch1Wk52wrNVw2fzVsh (claude.ai artifact; sign-in required, share it from the page's Share menu).

The prototype is the **world map game**:
1. Set out from the **Camp menu**: a full-screen home (currencies, hero and squad, Set out with Rations; with lit Wayshrines it opens a compact start chooser listing Camp and the shrines by region) with buttons for Upgrades, Team (hero, squad, Command Points, traits), Gear (paper-doll, inventory, Forge, sets), Summon (gacha, Recruitment Office, Recruit), Heat (once unlocked), Journal, World map (read-only) and Settings (reset, test currency).
2. Fight any monster in an open area, in any order (only the first area is open at the start; each boss opens the next one for that run). Each win costs 1 Ration (bosses give some back), and the run ends when HP or Rations run out, or when you return to Camp to bank your Souls. Monsters drop gear you equip at Camp.
3. Spend Souls on upgrades and recruits, then go further on the next run.

The world is a generated tile map (Greenvale and Ashkara tilesets): the Camp plus 2 regions with 8 irregular sub-areas each (16 in all, see `docs/WORLD_SPEC.md`). Each sub-area has a landmark, 6-7 enemies including its own boss, and the boss reveals the next area. Regions are data files, so more can be added without code changes.

The **developer test page** is `dev.html` (see below). The earlier three-stage battle tester is at `sandbox.html` (run it with `npm run dev` or `npm run preview`).

## Web build (Vite + Capacitor)

```bash
cd prototype
npm install
```

```bash
npm run dev                          # hot reload on http://localhost:5173
```

```bash
npm run build && npm run preview     # production build on http://localhost:4173
```

```bash
npm run single                       # dist/tile-defense.html, one self-contained file for the artifact
```

- **Developer test page:** `npm run single:dev` builds `dist/tile-defense-dev.html` (one file, no world atlases, no `fetch()` of any kind, so it works under a `connect-src 'none'` CSP).

- **On an Android phone in Chrome:** connect over USB, run `adb reverse tcp:4173 tcp:4173`, then open `http://localhost:4173` on the phone.
- **As an installed app (Capacitor):** run `npx cap add android` once (needs Android Studio), then `npm run android` to build, sync and open Android Studio, and press Run.
- **Updating the artifact:** run `npm run single` and republish `prototype/dist/tile-defense.html` to the same artifact URL.

## Developer test page (`prototype/dev.html`)

An interactive test bench with no map: open `/dev.html` under `npm run dev` / `npm run preview`, or use the single file above. It runs the real battle screen (`js/battle.js`) with the current dev squad and never touches the game save: all state is under `localStorage` key `tile-defense-dev-v1` (presets: `tile-defense-dev-presets-v1`; the game uses `tile-defense-world-v4`).

- **Enemies:** regions, then sub-areas in progression order (tap to open), then every normal, elite and boss spot with level, enemy types and kinds, boss gimmick and the unique drop. **Fight** starts exactly that battle; afterwards the list shows win/lose, stars and turns. A seed field (generated fights are seeded), **Reroll all** and a per-fight dice button give new layouts; **-> Builder** copies a fight into the builder.
- **Builder:** pick a sub-area (creatures and backdrop) and level, tap a tile of the enemy board (2x5, plus the optional boss row) and add Basic / Tough / Armored / Barrel / Boss or a Healer / Splitter / Summoner / Bulwark, then edit type, kind, gimmick, HP, ATK, armor, gimmick parameter and guard flag. Meant for trying out the enemy-revamp ideas.
- **Big enemies and the boss row (builder):** the **Boss row** checkbox adds a third enemy row above the others (a boss there can be hit only through a column with no enemy in front). Choose a **Footprint** (1x1, 2x1, 1x2, 2x2, 3x1) before adding an enemy, or change it later in the edit panel; a Big body grows right and back from the front-left tile and is drawn as one merged tile (a layout that does not fit or overlaps is refused with a message). New and re-footprinted bodies get the HP and ATK-per-lane budget of `docs/DESIGN_V2.md` 10.5 (edit freely); a wide body strikes once per covered column. In the battle the whole body highlights when a unit's shot would hit any tile of it, and the boss row shows a chain over gated columns. `node tools/test-big-enemies.js` tests the rules and `node tools/validate-gen.js big` balance-checks five fixture fights.
- **Team:** add or remove any unit (no Command Point limit; a warning shows), set its rarity (CP cost and look), Stars and Mastery. **Camp:** hero, currencies, every upgrade track, Heat modifiers and Descend. **Gear:** grant, level, re-rarity, equip or remove any item. **Run:** current HP, max HP bonus, spent revives, relics, per-unit in-run ATK/range/block/boost bonuses, and the resulting engine rules.
- **Design:** a read-only viewer for the design proposals (`design.js`). Sub-tabs: Units, Elements and reactions, Families, Keywords, Items, Relics, Heroes, Regions (region -> sub-areas), Bestiary (853 entries, shown 40 at a time with a "Show more" button) and Variants. Each list has a search box, filters where the fields exist (element, family, rarity, culture, nature, familiarity, region, current vs new, ...), a result count and a mark filter. Every entry has **Keep / Maybe / Drop** buttons and a short note; a summary line per list shows kept / maybe / dropped / unmarked. Marks are saved in the dev state (`S.design`, under `tile-defense-dev-v1`). **Export / Import marks** (at the bottom of the tab) writes all marks and notes as JSON into a textarea (with a Copy button); pasting that JSON and tapping Import merges it back. The data is `docs/data/*.json` imported through Vite (bundled into the single file, never fetched). The design data never changes game rules.
- **Bestiary data:** `docs/data/bestiary.json` is generated from `docs/BESTIARY.md` by `node tools/bestiary-to-json.mjs` (run it again after editing the doc). It reads each table's header row, so column order can change, and parses the culture tables, the named-set tables, the Variants tables and the Monster families; it prints the counts (645 culture entries in 21 cultures, 208 set entries in 22 sets, 86 variant bases, 29 families) and lists any table it could not parse.
- Every edit applies to the next fight at once. **Presets** saves and loads whole setups (localStorage); **Reset to defaults** (tap twice) restores a rich default account (all bosses beaten, starter squad).

## Project layout

```
docs/GAME_DESIGN.md                  Gameplay design document
prototype/index.html                 World map game (Vite entry: main.js, world.css, camp.css)
prototype/js/engine.js               Battle rules engine (pure logic, shared with tools)
prototype/data/regions/*.json        Region data (seeds, borders, tile recipes); see _schema.md
prototype/js/world-gen.js            GENERATED by tools/build-world.mjs: sub-areas, nodes, gates, blocking grids
prototype/assets/world/              GENERATED: per-region layer files and tile atlases (webp)
prototype/js/tilemap.js, world-nav.js  Tile renderer and tile navigation (A* pathing)
prototype/js/world-data.js           Regions, sub-areas, levels, unlocks, enemy themes; built from world-gen.js
prototype/js/progress.js             Souls, Camp upgrades, roster, save file
prototype/js/items.js                Equipment items, drop tables and their effects
prototype/js/gen.js                  Battle generator (level + sub-area theme)
prototype/js/boss-defs.js            Handcrafted bosses and elites (one gimmick each)
prototype/js/map.js                  World map view: camera, hero, nodes, fog, panning
prototype/js/battle.js               Battle screen (placement + animated turns)
prototype/js/app.js                  Game flow: Camp menu screens, runs, rewards, results (camp.css styles the Camp menu)
prototype/dev.html, dev.js, dev.css  Developer test page: enemy browser, battle builder, free editing (dev-boot.js marks the page)
prototype/design.js                  Design tab of the dev page: read-only design-data viewer with vetting marks
tools/test-big-enemies.js            Node assertions for Big enemies and the boss row (also a differential fuzz against the pre-change engine at git HEAD)
tools/bestiary-to-json.mjs           docs/BESTIARY.md -> docs/data/bestiary.json
prototype/sandbox.html               Three-stage battle tester (sandbox.js, style.css, js/stages.js, js/ui.js)
prototype/scripts/single-file.mjs    Packs the game into one HTML fragment
prototype/capacitor.config.json      Capacitor app settings
tools/solve.js                       Solver: finds strong placements for the sandbox stages
tools/sim-runs.js                    Plays whole world-map runs to check difficulty
```

## Rebuilding the world

The map is generated from `prototype/data/regions/*.json`. After editing a region file (or the tileset in `art-samples/tiles/`), rebuild in this order:

```bash
node tools/build-world.mjs --check     # 1. regenerate js/world-gen.js and assets/world/*.json, then verify (add --preview for SVG previews)
cd prototype && npm run world:atlas    # 2. rasterise the tile atlases (assets/world/*.webp; needs Playwright Chromium)
npm run single                         # 3. the single-file build (npm run build for the normal one)
```

Re-run the atlas after every `build-world` run (tile indices change). To add a region, follow the "Add a region" checklist in `docs/IMPLEMENTATION_PLAN.md`.

## Balancing a stage

```bash
node tools/solve.js            # all stages
```

```bash
node tools/solve.js stage9     # one stage
```

The solver searches for placements that take the least total damage and prints the best line it finds, turn by turn. Use it to confirm a stage's intended difficulty (see section 8.2 of the design document).

To check world map difficulty, play whole runs with a strong simulated player and see how far each account profile gets:

```bash
node tools/sim-runs.js 6       # 6 simulated runs per account profile
node tools/sim-runs.js 1 campaign 40   # consecutive runs with Camp shopping: when does each region unlock? (SEED=n, LOGBOSS=file, HERO=...)
HEAT=hp,rage,heal,armor,cp,col DESCEND=2 node tools/sim-runs.js 4 endgame   # a maxed account on Heat / Descend
node tools/validate-gen.js 40          # battle templates (40 seeds per danger tier)
node tools/validate-gen.js bosses      # every boss and elite against the median campaign account (BOSS_TURNS=5 allows longer fights)
```
