# Tilewhist v1.0 (21 November 2026)

**Release file:** `prototype/release/tilewhist-v1.0.html`, a single self-contained page.

## How it is built
- Run `node prototype/tools/build-release.js`. It copies `prototype/samples/tile-run.html`, the development source, and removes every dev tool:
  - It hard-wires `DEV = false`.
  - It cuts the `window.TR` test hooks, the dev settings menu and the advanced encyclopedia (the one with scores).
  - It cuts the test-helper actions: coins, unlock all, shards, slots, tiles, dupe and similar.
- The source keeps the dev tools behind `?dev=1`, so the test kit (`tr-test.js`) and the balance tools still work.
- To make a new release, bump `VERSION` in the source and run the script again.

## Checked
- The source passes the smoke test with no errors.
- The release file was checked in a browser:
  - It loads with no errors.
  - `window.TR` and the gear are absent, even with `?dev=1`.
  - Injected dev actions do nothing.
  - The first tutorial was played by drag and attack.
  - The Guide shows "v1.0".

## In this version
- **Content:** 57 map stages over 10 tiers, tutorials, 20 Puzzles-page puzzles plus the daily puzzle, Endless mode, Skills, unit shards with a wishlist, and Colourless and Collected tiles.
- **Balance and fixes:** the November beta round. See `TILEWHIST_BETA_1.md` and `TILE_RUN_BALANCE.md`.
- **Look:** the Classic theme, with reduced text. The Mosaic and Classic+ themes were tried and removed.
