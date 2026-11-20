'use strict';
/* Writes puzfix.js output into the PUZZLES line of tile-run.html, measures every quest puzzle's difficulty, orders the Puzzles page by it and sets the rewards.
   Usage: node apply-puz.js fixed.json [--write]   (without --write only prints the table)
   Difficulty D = log10(1 / random-win rate) + 0.25 x tiles (random placements, 6000 samples); order key = D + 0.15 x lesson rank of the puzzle's `need`, so the unlock chain
   (a puzzle needs its lesson AND the puzzle before it) never waits on a far-away lesson. Coins 20..40 by rank, plus 1 shard of the wishlist unit (the page adds it). */
const fs = require('fs'), path = require('path');
const L = require('./lib.js'), R = L.R, C = L.C;
const HTML = path.join(__dirname, '..', '..', 'samples', 'tile-run.html');
const fixed = fs.existsSync(process.argv[2] || '') ? JSON.parse(fs.readFileSync(process.argv[2], 'utf8')) : {};
const P = R.PUZZLES.map(p => fixed[p.id] ? Object.assign({}, p, fixed[p.id]) : p);
const lessonOrder = [].concat.apply([], Object.keys(C.lessons).sort().map(k => C.lessons[k]));
const pick = (a, r) => a[(r() * a.length) | 0];
function randomWin(def, N, seed) {
  const pf = R.puzzleFight(def), r = L.rng(seed); let w = 0;
  for (let k = 0; k < N; k++) {
    const used = {}; def.blocked.forEach(q => { used[q] = 1; }); const pl = []; let ok = true;
    for (let i = 0; i < pf.tiles.length && ok; i++) { const o = []; for (let c = 0; c < def.cols * def.rows; c++) { const cl = R.placeCells(pf.tiles[i], c, def.cols, def.rows); if (cl && cl.every(q => !used[q])) o.push([c, cl]); } if (!o.length) { ok = false; break; } const x = pick(o, r); x[1].forEach(q => { used[q] = 1; }); pl.push(x[0]); }
    if (!ok) continue; const b = new Array(def.cols * def.rows).fill(null); pl.forEach((c, i) => R.placeCells(pf.tiles[i], c, def.cols, def.rows).forEach(q => { b[q] = pf.tiles[i]; }));
    if (R.puzzleWin(pf.F, b)) w++;
  }
  return w / N;
}
const Q = P.filter(p => p.need && /^q/.test(p.id));
Q.forEach((p, i) => { const pw = Math.max(randomWin(p, 6000, 11 + i), 1 / 20000); p.D = Math.log10(1 / pw) + 0.25 * p.hand.length; p.key = p.D + 0.15 * lessonOrder.indexOf(p.need); });
const sorted = Q.slice().sort((a, b) => a.key - b.key);
sorted.forEach((p, i) => { p.reward = Object.assign({}, p.reward); delete p.reward.shards; p.reward.coins = 20 + Math.round(20 * i / (sorted.length - 1) / 5) * 5; });
console.log(sorted.map((p, i) => String(i + 1).padStart(2) + ' ' + p.id + ' ' + p.name.padEnd(20) + ' need ' + p.need + ' D ' + p.D.toFixed(2) + ' key ' + p.key.toFixed(2) + ' tiles ' + p.hand.length + ' coins ' + p.reward.coins).join('\n'));
const out = P.filter(p => !(p.need && /^q/.test(p.id))).slice(), hi = out.findIndex(p => p.id === 'h1');
/* lessons first (in their old order), then the quests by difficulty, then the hero lesson as before */
const lessons = P.filter(p => !p.need), final = [];
P.forEach(p => { if (!(p.need && /^q/.test(p.id)) && !final.includes(p)) final.push(p); });
const lastNeedIdx = final.length; sorted.forEach(p => final.push(p));
final.forEach(p => { if (!p.need) p.reward = Object.assign({}, p.reward, { coins: Math.max(20, (p.reward || {}).coins || 20) }); delete p.D; delete p.key; });
if (process.argv.includes('--write')) {
  const h = fs.readFileSync(HTML, 'utf8'), a = h.indexOf('var PUZZLES = '), b = h.indexOf('/*PUZ-END*/');
  fs.writeFileSync(HTML, h.slice(0, a) + 'var PUZZLES = ' + JSON.stringify(final) + ';\n' + h.slice(b));
  console.log('written', final.length, 'puzzles');
}
