# Tile Defense

A turn-based tile placement game with roguelite runs. You place a fixed army of cards on a grid to defeat enemies in 1–2 turns, and your HP carries over between stages.

- **Design document:** [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md)
- **Gameplay prototype:** [`prototype/`](prototype/)

## Play the prototype

It's plain HTML and JavaScript with no build step. Either open `prototype/index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000 --directory prototype
```

Then open http://localhost:8000.

The prototype starts on **Stage 9: The Iron Line**. Stages 6 and 12 are also available, to compare an easier stage with a "you can't win in one turn" stage.

## Project layout

```
docs/GAME_DESIGN.md     Gameplay design document
prototype/index.html    Prototype page
prototype/style.css     Placeholder styling
prototype/js/engine.js  Rules engine (pure logic, shared with tools)
prototype/js/stages.js  Stage definitions
prototype/js/ui.js      Rendering, input and turn playback
tools/solve.js          Balancing solver: finds strong placements per stage
```

## Balancing a stage

```bash
node tools/solve.js            # all stages
```

```bash
node tools/solve.js stage9     # one stage
```

The solver searches for placements that take the least total damage and prints the best line it finds, turn by turn. Use it to confirm a stage's intended difficulty (see section 8.2 of the design document).
