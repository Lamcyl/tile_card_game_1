# Tile Run tools

Playwright is expected under `/opt/node-tools/node_modules` (or any `NODE_PATH`). Each script has a usage line in its header.

- `tr-test.js` - reusable page test kit (phone viewport, CDP touch drags, store/stage/puzzle helpers, screenshots, console errors). Start here for any UI check.
  - `node prototype/tools/tr-test.js smoke [outDir]` - load, home, lesson puzzle via `sol`, stage fight, Tiles screen, slot-popup drag (touch, no hold, must equip), shard unlock of a locked unit, level-up dialog; exits 1 on a failure or any console error.
  - As a library: `const T = require('./tr-test.js'); await T.open({w:360,h:740}); await T.startStage(0); await T.chooseFirstOffer(); await T.autoPlace(); await T.touchDrag('#fhand .tile', '#fboard .cell'); await T.shot('x'); await T.close();`
  - `T.ghosts()` counts leftover `.ghost` drag copies (must be 0 after any drag).
- `tile-run-balance/` (balance tools, all load the `RULES` block of the page via `lib.js`):
  - `journey.js` / `journeys.js` / `jworker.js` - bot plays the whole campaign (skilled / casual players).
  - `tune.js` - tunes enemy HP per tier towards target win rates; `curve.js`, `report.js`, `tables.js` - tables from result files.
  - `score.js` / `marginal.js` / `catalog.js` - tile power scores by marginal damage.
  - `validate.js` - checks the placement bot solves every puzzle and daily.
  - `verify-page.js` - older Playwright check of the real page with bot fights.
  - `puzgen.js` - puzzle generator (hidden-solution puzzles for the lesson / quest / daily sets).
  - `puzfix.js` + `apply-puz.js` - regenerate the bot-failed puzzles (exhaustive checks) and write/order them in the page; `rel.js <tier> <n> [ids]` - relic A/B.
  - `encyclopedia.js` - enumerates every expressible tile, searches best boards for Column max / Total max, writes `ENCYC` into the page (Options > Encyclopedia); `node encyclopedia.js` (~90 s).
