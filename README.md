# Tile Defense

A turn-based tile placement game with roguelite runs. You place a fixed army of cards on a grid to defeat enemies in 1–2 turns, and your HP carries over between stages.

- **Design document:** [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md)
- **Gameplay prototype:** [`prototype/`](prototype/)

## Play the prototype

**Online:** https://claude.ai/artifact/1ifNch1Wk52wrNVw2fzVsh (claude.ai artifact; sign-in required, share it from the page's Share menu).

The prototype is the **world map game**:
1. Set out from Camp.
2. Choose fights on the map until your HP runs out, or return to Camp to bank your Souls.
3. Spend Souls on upgrades and recruits, then go further on the next run.

Each sub-area has a boss that reveals the next area.

The earlier three-stage battle tester is at `sandbox.html` (run it with `npm run dev` or `npm run preview`).

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

- **On an Android phone in Chrome:** connect over USB, run `adb reverse tcp:4173 tcp:4173`, then open `http://localhost:4173` on the phone.
- **As an installed app (Capacitor):** run `npx cap add android` once (needs Android Studio), then `npm run android` to build, sync and open Android Studio, and press Run.
- **Updating the artifact:** run `npm run single` and republish `prototype/dist/tile-defense.html` to the same artifact URL.

## Project layout

```
docs/GAME_DESIGN.md                  Gameplay design document
prototype/index.html                 World map game (Vite entry: main.js, world.css)
prototype/js/engine.js               Battle rules engine (pure logic, shared with tools)
prototype/js/world-data.js           Regions, sub-areas, enemy themes, map node graph
prototype/js/progress.js             Souls, Camp upgrades, roster, save file
prototype/js/gen.js                  Battle generator (level + sub-area theme)
prototype/js/map.js                  Painted world map, fog, paths, hero, panning
prototype/js/battle.js               Battle screen (placement + animated turns)
prototype/js/app.js                  Game flow: Camp, runs, rewards, results
prototype/sandbox.html               Three-stage battle tester (sandbox.js, style.css, js/stages.js, js/ui.js)
prototype/scripts/single-file.mjs    Packs the game into one HTML fragment
prototype/capacitor.config.json      Capacitor app settings
tools/solve.js                       Solver: finds strong placements for the sandbox stages
tools/sim-runs.js                    Plays whole world-map runs to check difficulty
```

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
```
