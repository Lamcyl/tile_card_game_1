'use strict';
/* Validates the placement bot against the game's own puzzles: each puzzle (and generated daily) has a hidden solution
   made with evaluate(); the bot should find a winning board. Usage: node validate.js [dailies=60] */
const L = require('./lib.js'), R = L.R;
const nDaily = +(process.argv[2] || 60);
function solve(def, level, seed) {
  const pf = R.puzzleFight(def), rnd = L.rng(seed), t0 = pf.tiles;
  const st = L.search(pf.F, t0, { momentum: 0 }, level, rnd, level === 'skilled' ? 30 : 0);
  return R.puzzleWin(pf.F, st.board);
}
for (const level of ['skilled', 'casual']) {
  let ok = 0, n = 0, fail = [];
  R.PUZZLES.forEach((d, i) => { n++; if (solve(d, level, i + 1)) ok++; else fail.push(d.id); });
  let dok = 0, dn = 0;
  for (let s = 1; s <= nDaily; s++) { const d = R.genDaily(s * 977, 3 + (s % 8)); if (!d) continue; dn++; if (solve(d, level, s)) dok++; }
  console.log(level.padEnd(8), 'puzzles', ok + '/' + n, fail.join(','), ' dailies', dok + '/' + dn);
}
