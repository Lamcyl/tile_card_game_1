# Tile Defense

A turn-based tile placement game with roguelite runs. You place a fixed army of cards on a grid to defeat enemies in 1–2 turns, and your HP carries over between stages.

- **Design document:** [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md)
- **Gameplay prototype:** [`prototype/`](prototype/)

## Play the prototype

**Online:** https://claude.ai/artifact/1ifNch1Wk52wrNVw2fzVsh (claude.ai artifact; sign-in required, share it from the page's Share menu).

The prototype starts on **Stage 9: The Iron Line**. Stages 6 and 12 are also available, to compare an easier stage with a "you can't win in one turn" stage.

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
prototype/index.html                 Page markup (Vite entry)
prototype/main.js                    Loads the stylesheet and scripts in order
prototype/style.css                  Placeholder styling
prototype/js/engine.js               Rules engine (pure logic, shared with tools)
prototype/js/stages.js               Stage definitions
prototype/js/ui.js                   Rendering, input and turn playback
prototype/scripts/single-file.mjs    Packs the build into one HTML fragment
prototype/capacitor.config.json      Capacitor app settings
tools/solve.js                       Balancing solver: finds strong placements per stage
```

## Balancing a stage

```bash
node tools/solve.js            # all stages
```

```bash
node tools/solve.js stage9     # one stage
```

The solver searches for placements that take the least total damage and prints the best line it finds, turn by turn. Use it to confirm a stage's intended difficulty (see section 8.2 of the design document).
