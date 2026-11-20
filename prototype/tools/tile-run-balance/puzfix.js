'use strict';
/* Re-generates the puzzles the skilled placement bot could not solve (lessons p04 p08 p10 p11 p14 p15, quests q01 q02 q05 q08 q09), keeping id, name, teach, board, blocked cells,
   hand tile TYPES, enemy columns, need and reward. Each candidate (random colours, a hidden solution, HP = the damage that solution deals) must
     - be solved by the skilled bot in most seeds (so a reasoning player gets there with hill climbing, not by guessing),
     - have a limited number of winning placements out of all placements (exhaustive count: it is not trivial),
     - (lessons) NOT be winnable once the taught tile is removed / weakened (the mechanic is needed).
   Usage: node puzfix.js [ids,comma] > fixed.json      (the page's PUZZLES entries are replaced by apply-puz.js) */
const L = require('./lib.js'), R = L.R;
const pick = (a, r) => a[(r() * a.length) | 0];
const only = (process.argv[2] || '').split(',').filter(Boolean);
const LESSON_KEY = {   /* how the taught tile is removed to prove it is needed: drop = remove from the hand, flat = turn lanes into a plain forward strike */
  p04: { flat: tok => /[<>]/.test(tok) }, p08: { flat: tok => /<\^|\^>|<>/.test(tok) },
  p10: { drop: tok => /^p[RC]/.test(tok) }, p11: { drop: tok => /^xu/.test(tok) }, p14: { drop: tok => /^eu/.test(tok) }, p15: { drop: tok => /#/.test(tok) }
};
function damage(def, place) {
  const pf = R.puzzleFight(def), b = new Array(def.cols * def.rows).fill(null);
  place.forEach((c, i) => { if (c >= 0) R.placeCells(pf.tiles[i], c, def.cols, def.rows).forEach(q => { b[q] = pf.tiles[i]; }); });
  return { res: R.evaluate(pf.F, b, {}), pf, b };
}
function randomPlace(def, r) {
  const pf = R.puzzleFight(def);
  for (let a = 0; a < 80; a++) {
    const used = {}; def.blocked.forEach(q => { used[q] = 1; }); const out = []; let ok = true;
    for (let i = 0; i < pf.tiles.length && ok; i++) {
      const opts = []; for (let c = 0; c < def.cols * def.rows; c++) { const cl = R.placeCells(pf.tiles[i], c, def.cols, def.rows); if (cl && cl.every(q => !used[q])) opts.push([c, cl]); }
      if (!opts.length) { ok = false; break; } const o = pick(opts, r); o[1].forEach(q => { used[q] = 1; }); out.push(o[0]);
    }
    if (ok) return out;
  }
  return null;
}
function wins(def, place) { const d = damage(def, place); return d.pf.F.enemies.every((e, k) => d.res.en[k].dmg >= e.hp && d.res.en[k].src >= (e.need || 1)); }
function botRate(def, n, eff) { let ok = 0; for (let s = 1; s <= n; s++) { const pf = R.puzzleFight(def), st = L.search(pf.F, pf.tiles, { momentum: 0 }, 'skilled', L.rng(s * 13 + 7), eff); if (R.puzzleWin(pf.F, st.board)) ok++; } return ok / n; }
function countWins(def, maxLeaves) {   /* exhaustive: every tile on a free cell or left out */
  const pf = R.puzzleFight(def), N = def.cols * def.rows, F = pf.F, tiles = pf.tiles, board = new Array(N).fill(null); let w = 0, leaves = 0, over = false;
  (function rec(i) {
    if (over) return;
    if (i === tiles.length) { leaves++; if (leaves > maxLeaves) over = true; else if (R.puzzleWin(F, board)) w++; return; }
    rec(i + 1);
    for (let c = 0; c < N; c++) { const cs = R.placeCells(tiles[i], c, def.cols, def.rows); if (!cs || !cs.every(q => board[q] === null && def.blocked.indexOf(q) < 0)) continue; cs.forEach(q => board[q] = tiles[i]); rec(i + 1); cs.forEach(q => board[q] = null); }
  })(0);
  return over ? -1 : w;
}
function needed(def, key) {   /* true if no placement wins without the taught tile */
  const d2 = JSON.parse(JSON.stringify(def));
  if (key.drop) d2.hand = d2.hand.filter(h => !key.drop(h.t));
  if (key.flat) d2.hand = d2.hand.map(h => key.flat(h.t) ? Object.assign({}, h, { t: 'a^' + R.parseTok(h.t).n }) : h);
  return countWins(d2, 400000) === 0;
}
function lessonCandidate(old, seed) {
  const r = L.rng(seed), cs = Array.from(new Set(old.hand.map(h => h.c)));
  for (let tries = 0; tries < 4000; tries++) {
    const hand = old.hand.map(h => ({ c: pick(['r', 'b', 'g', 'y', 'p'].filter(c => cs.indexOf(c) >= 0 || r() < 0.2), r), t: h.t }));
    const def = { cols: old.cols, rows: old.rows, blocked: old.blocked, bonus: old.bonus, hand, enemies: old.enemies.map(e => [e[0], 1, 1].concat(e[3] ? [e[3]] : [])) };
    const sol = randomPlace(def, r); if (!sol) continue;
    const d = damage(def, sol), hp = old.enemies.map(e => d.res.en[d.pf.F.enemies.findIndex(x => x.c === e[0])].dmg);
    if (hp.some(x => x < 3)) continue;
    def.enemies = old.enemies.map((e, k) => [e[0], 1, hp[k]].concat(e[3] ? [e[3]] : []));
    if (!wins(def, sol) || botRate(def, 6, 30) < 0.66) continue;
    const w = countWins(def, 300000); if (w < 8 || w > 400) continue;
    if (!needed(def, LESSON_KEY[old.id])) continue;
    def.sol = sol.map((c, i) => [i, c]); return Object.assign({}, old, def, { hardness: w });
  }
  return null;
}
/* quests: same spec as puzgen.js with a looser random-win limit and the bot check */
const QS = {
  q01: { cols: 3, rows: 3, n: 6, pool: ['a^2', 'a^3', 'a^4', 'a^5'], maxWin: 0.03 },
  q02: { cols: 4, rows: 2, n: 6, pool: ['a^2', 'a^3', 'a^4'], maxWin: 0.03 },
  q05: { cols: 4, rows: 2, n: 6, pool: ['a^3', 'a^4', 'a<>3', 'a<2', 'a>2'], must: ['a<>3'], maxWin: 0.03 },
  q08: { cols: 3, rows: 3, n: 6, pool: ['a^3', 'a^4', 'a^5', 'xu2', 'pu1'], must: ['xu2'], maxWin: 0.03 },
  q09: { cols: 4, rows: 3, n: 6, pool: ['a^2', 'a^3', 'a^4', 'xu2', 'xlr2'], must: ['xu2', 'xlr2'], maxWin: 0.03 }
};
function questCandidate(old, spec, seed) {
  const r = L.rng(seed);
  for (let tries = 0; tries < 3000; tries++) {
    const cs = ['r', 'b', 'g'], hand = []; for (let i = 0; i < spec.n; i++) hand.push({ c: pick(cs, r), t: pick(spec.pool, r) });
    (spec.must || []).forEach((t, i) => { hand[i].t = t; });
    const def = { cols: spec.cols, rows: spec.rows, blocked: [], bonus: {}, hand, enemies: [] };
    for (let c = 0; c < spec.cols; c++) def.enemies.push([c, 1, 1]);
    const sol = randomPlace(def, r); if (!sol) continue; const d = damage(def, sol), hp = d.res.en.map(e => e.dmg);
    if (hp.some(x => x < 3)) continue;
    def.enemies = hp.map((x, c) => [c, 1, x]); if (!wins(def, sol)) continue;
    if (botRate(def, 6, 30) < 0.66) continue;
    const w = countWins(def, 400000); if (w !== -1 && w < 4) continue;
    let rw = 0; const N = 3000, r2 = L.rng(seed * 7 + tries); for (let k = 0; k < N; k++) { const rp = randomPlace(def, r2); if (rp && wins(def, rp)) rw++; }
    if (rw / N > spec.maxWin) continue;
    def.sol = sol.map((c, i) => [i, c]); return Object.assign({}, old, def, { hardness: w });
  }
  return null;
}
const out = {};
R.PUZZLES.forEach(old => {
  if (only.length && only.indexOf(old.id) < 0) return;
  let p = null;
  if (LESSON_KEY[old.id]) for (let s = 1; s <= 12 && !p; s++) p = lessonCandidate(old, 500 + old.id.charCodeAt(2) * 31 + s);
  else if (QS[old.id]) for (let s = 1; s <= 12 && !p; s++) p = questCandidate(old, QS[old.id], 900 + Number(old.id.slice(1)) * 17 + s);
  else return;
  if (!p) { console.error('FAILED', old.id); return; }
  console.error(old.id, 'exhaustive wins', p.hardness, 'bot', botRate(p, 10, 30)); delete p.hardness; out[old.id] = p; console.log('@@' + JSON.stringify(p));
});
console.log(JSON.stringify(out));
