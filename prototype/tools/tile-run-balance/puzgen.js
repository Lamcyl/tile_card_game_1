'use strict';
/* Puzzle generator for the Puzzles page and the hero lesson.
   Usage: node puzgen.js            prints JSON puzzles to paste into the PUZ block of tile-run.html
   A puzzle = a hidden solution (random hand on a random board); enemy HP = the damage that solution deals per column.
   Kept only if few random placements also win (hardness), so a solve needs the taught mechanic. Seeds are fixed. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const H = fs.readFileSync(path.join(__dirname, '..', '..', 'samples', 'tile-run.html'), 'utf8');
const R = { Math: Object.create(Math), JSON, Object, Array, console }; vm.createContext(R);
vm.runInContext(H.slice(H.indexOf('/*RULES-START*/'), H.indexOf('/*RULES-END*/')), R);
function rng(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const pick = (a, r) => a[(r() * a.length) | 0];

function damage(def, place, opts) {   /* place: cell index per hand tile (-1 = not placed) */
  const pf = R.puzzleFight(def), b = new Array(def.cols * def.rows).fill(null);
  place.forEach((c, i) => { if (c >= 0) R.placeCells(pf.tiles[i], c, def.cols, def.rows).forEach(q => { b[q] = pf.tiles[i]; }); });
  return { res: R.evaluate(pf.F, b, opts || {}), pf, b };
}
function randomPlace(def, r) {
  if (def.hand.some(h => h.t.indexOf('#') >= 0)) {   /* shaped (wide) tiles: sequential random fit */
    const pf = R.puzzleFight(def);
    for (let a = 0; a < 60; a++) {
      const used = {}; def.blocked.forEach(q => { used[q] = 1; }); const out = []; let ok = true;
      for (let i = 0; i < pf.tiles.length && ok; i++) {
        const opts = []; for (let c = 0; c < def.cols * def.rows; c++) { const cl = R.placeCells(pf.tiles[i], c, def.cols, def.rows); if (cl && cl.every(q => !used[q])) opts.push([c, cl]); }
        if (!opts.length) { ok = false; break; } const o = pick(opts, r); o[1].forEach(q => { used[q] = 1; }); out.push(o[0]);
      }
      if (ok) return out;
    }
    return null;
  }
  const free = []; for (let c = 0; c < def.cols * def.rows; c++) if (def.blocked.indexOf(c) < 0) free.push(c);
  free.sort(() => r() - 0.5); return def.hand.map((h, i) => free[i]);
}
function wins(def, place, opts) { const d = damage(def, place, opts); return d.pf.F.enemies.every((e, k) => d.res.en[k].dmg >= e.hp && d.res.en[k].src >= (e.need || 1)); }

function make(spec, seed) {
  const r = rng(seed);
  for (let tries = 0; tries < 400; tries++) {
    const cols = spec.cols, rows = spec.rows, cs = ['r', 'b', 'g'].slice(0, spec.colours || 3);
    const hand = []; for (let i = 0; i < spec.n; i++) hand.push({ c: pick(cs, r), t: pick(spec.pool, r) });
    (spec.must || []).forEach((t, i) => { hand[i].t = t; });
    const def = { cols, rows, blocked: spec.blocked || [], bonus: {}, hand, enemies: [] };
    for (let c = 0; c < cols; c++) def.enemies.push([c, 1, 1]);
    for (let k = 0; k < (spec.bonus || 0); k++) { let q; do q = (r() * cols * rows) | 0; while (def.blocked.indexOf(q) >= 0 || def.bonus[q]); def.bonus[q] = pick(['p1', 'p2', 'x2'], r); }
    const sol = randomPlace(def, r); if (!sol) continue; const d = damage(def, sol);
    const hp = d.res.en.map(e => e.dmg);
    if (hp.some(x => x < 3)) continue;
    def.enemies = hp.map((x, c) => (spec.guard || []).indexOf(c) >= 0 ? [c, 1, x, 2] : [c, 1, x]);
    if (!wins(def, sol)) continue;
    let w = 0; const N = 6000, r2 = rng(seed * 7 + tries);
    for (let k = 0; k < N; k++) { const rp = randomPlace(def, r2); if (rp && wins(def, rp)) w++; }
    if (w / N > spec.maxWin || w === 0 && false) continue;
    def.sol = sol.map((c, i) => [i, c]);
    return Object.assign({ id: spec.id, name: spec.name, teach: spec.teach, need: spec.need, stage: 1 }, def, { reward: { coins: 25 }, hardness: w / N });
  }
  return null;
}
const S = [
  { id: 'q01', name: 'Crossfire', need: 'p03', teach: 'Two sandwiches through one tile: x4.', cols: 3, rows: 3, n: 7, pool: ['a^2', 'a^3', 'a^4', 'a^5'], maxWin: 0.004 },
  { id: 'q02', name: 'Tight Squeeze', need: 'p03', teach: 'Every enemy needs a sandwich.', cols: 4, rows: 2, n: 7, pool: ['a^2', 'a^3', 'a^4'], maxWin: 0.004 },
  { id: 'q03', name: 'Fuel Line', need: 'p06', teach: 'Boosts and sandwiches together.', cols: 3, rows: 3, n: 6, pool: ['a^2', 'a^3', 'a^4', 'pu1', 'pudlr1', 'plr1'], must: ['pudlr1'], maxWin: 0.004 },
  { id: 'q04', name: 'Bonus Round', need: 'p06', teach: 'Where does the boost help most?', cols: 4, rows: 3, n: 7, pool: ['a^2', 'a^3', 'a^4', 'pu2', 'pud1'], must: ['pu2'], maxWin: 0.003 },
  { id: 'q05', name: 'Side Step', need: 'p04', teach: 'Side lanes reach the next column.', cols: 4, rows: 2, n: 6, pool: ['a^3', 'a^4', 'a<>3', 'a<2', 'a>2'], must: ['a<>3'], maxWin: 0.004 },
  { id: 'q06', name: 'Fork in the Road', need: 'p04', teach: 'Forks and sandwiches.', cols: 3, rows: 3, n: 7, pool: ['a^2', 'a^3', 'a<>2', 'a<3', 'a>3'], maxWin: 0.003 },
  { id: 'q07', name: 'Trident', need: 'p08', teach: 'Three lanes from one tile.', cols: 4, rows: 3, n: 7, pool: ['a^3', 'a<^>2', 'a<^2', 'a^>2', 'pu1'], must: ['a<^>2'], maxWin: 0.003 },
  { id: 'q08', name: 'Double Time', need: 'p11', teach: 'Put the multiplier where it counts.', cols: 3, rows: 3, n: 6, pool: ['a^3', 'a^4', 'a^5', 'xu2', 'pu1'], must: ['xu2'], maxWin: 0.003 },
  { id: 'q09', name: 'Stack It', need: 'p12', teach: 'Multipliers and sandwiches stack.', cols: 4, rows: 3, n: 7, pool: ['a^2', 'a^3', 'a^4', 'xu2', 'xlr2'], must: ['xu2', 'xlr2'], maxWin: 0.003 },
  { id: 'q10', name: 'Echo', need: 'p14', teach: 'Copy the strongest tile.', cols: 4, rows: 3, n: 7, pool: ['a^3', 'a^4', 'a^5', 'eu1', 'pu1'], must: ['eu1'], maxWin: 0.003 },
  /* q11..q20: harder, bigger boards and combined mechanics */
  { id: 'q11', name: 'Line Dance', need: 'p10', teach: 'Row and column boosts reach every tile on their line.', cols: 5, rows: 3, n: 10, pool: ['a^2', 'a^3', 'a^4', 'a^3', 'pR1', 'pC1'], must: ['pR1', 'pC1'], blocked: [0, 14], maxWin: 0.003 },
  { id: 'q12', name: 'Wide Load', need: 'p13', teach: 'A two-cell tile hits two columns at once.', cols: 5, rows: 3, n: 7, pool: ['a^3', 'a^2', 'a^4#h2', 'a^5#h2', 'a^3#h2'], must: ['a^4#h2', 'a^5#h2'], maxWin: 0.003 },
  { id: 'q13', name: 'Boosted Echo', need: 'p14', teach: 'Boost first, then copy the boosted tile.', cols: 4, rows: 3, n: 7, pool: ['a^3', 'a^4', 'a^5', 'eu1', 'pu1', 'pu2'], must: ['eu1', 'pu2'], maxWin: 0.003 },
  { id: 'q14', name: 'Multiplier Sandwich', need: 'p12', teach: 'A multiplier and a sandwich add into one pool.', cols: 5, rows: 3, n: 8, pool: ['a^2', 'a^3', 'a^4', 'xu2', 'xlr2'], must: ['xu2', 'xlr2'], blocked: [0, 14], maxWin: 0.003 },
  { id: 'q15', name: 'Lucky Guard', need: 'p07', teach: 'Put your best tile on a bonus cell, and reach the guard twice.', cols: 4, rows: 3, n: 7, pool: ['a^2', 'a^3', 'a^4', 'a<>3', 'a<>2'], bonus: 3, guard: [1], maxWin: 0.003 },
  { id: 'q16', name: 'Gatekeepers', need: 'p08', teach: 'Two guards: spread your lanes so each gets two tiles.', cols: 5, rows: 3, n: 8, pool: ['a^3', 'a^4', 'a<>3', 'a<^>2', 'a<^2'], must: ['a<^>2'], guard: [1, 3], maxWin: 0.003 },
  { id: 'q17', name: 'Fortress', need: 'p03', teach: 'Blocked cells break lines: find the clean sandwiches.', cols: 5, rows: 4, n: 9, pool: ['a^2', 'a^3', 'a^4', 'a^5'], blocked: [0, 4, 7, 12, 17, 19], maxWin: 0.003 },
  { id: 'q18', name: 'Lucky Echo', need: 'p14', teach: 'Copy a multiplied tile on a bonus cell.', cols: 4, rows: 3, n: 8, pool: ['a^3', 'a^4', 'a^5', 'xu2', 'eu1', 'pu1'], must: ['xu2', 'eu1'], bonus: 2, maxWin: 0.003 },
  { id: 'q19', name: 'Grand Stack', need: 'p15', teach: 'A wide tile, lines and multipliers all in one board.', cols: 5, rows: 4, n: 9, pool: ['a^3', 'a^4', 'a^2', 'xu2', 'xudlr2', 'pR1', 'a^5#h2'], must: ['xu2', 'pR1', 'a^5#h2'], blocked: [0, 19], maxWin: 0.003 },
  { id: 'q20', name: 'Finale', need: 'p12', teach: 'Everything at once: guard, bonus cells, copy, boosts and a wide tile.', cols: 5, rows: 4, n: 10, pool: ['a^3', 'a^4', 'a^5', 'xu2', 'eu1', 'pu1', 'pudlr1', 'a<>3', 'a^3#h2'], must: ['xu2', 'eu1', 'a^3#h2'], blocked: [0, 19], bonus: 2, guard: [2], maxWin: 0.003 }
];
const out = [];
S.forEach((s, i) => { const p = make(s, 1000 + i * 31); if (p) out.push(p); else console.error('no puzzle for', s.id); });

/* the hero lesson: Lumi's Prism (one tile counts as every colour) is needed to win */
function heroPuzzle() {
  const r = rng(77);
  for (let tries = 0; tries < 3000; tries++) {
    const def = { cols: 3, rows: 2, blocked: [], bonus: {}, hand: [], enemies: [] };
    for (let i = 0; i < 5; i++) def.hand.push({ c: pick(['r', 'b', 'g'], r), t: pick(['a^2', 'a^3', 'a^4'], r) });
    for (let c = 0; c < 3; c++) def.enemies.push([c, 1, 1]);
    const sol = randomPlace(def, r), pt = 1 + ((r() * 5) | 0);
    const d = damage(def, sol, { prism: pt }), hp = d.res.en.map(e => e.dmg);
    if (hp.some(x => x < 3)) continue;
    def.enemies = hp.map((x, c) => [c, 1, x]);
    /* exhaustive: no placement may win without the prism */
    let plain = 0; const cells = [0, 1, 2, 3, 4, 5];
    const rec = (i, used, pl) => { if (plain) return; if (i === 5) { if (wins(def, pl)) plain++; return; } for (const c of cells) if (!used[c]) { used[c] = 1; pl[i] = c; rec(i + 1, used, pl); used[c] = 0; } };
    rec(0, {}, []);
    if (plain) continue;
    def.sol = sol.map((c, i) => [i, c]);
    return Object.assign({ id: 'h1', name: 'Meet Lumi', hero: 'prism', stage: 1, teach: 'Heroes have one active skill per fight. Tap Lumi, then tap a placed tile: it counts as every colour on this attack. Use it to make a sandwich.' }, def, { reward: { coins: 20 }, prismTile: pt });
  }
  return null;
}
const hp = heroPuzzle(); if (hp) out.push(hp); else console.error('no hero puzzle');
console.log(JSON.stringify(out.map(p => { const q = Object.assign({}, p); delete q.hardness; delete q.prismTile; return q; })));
console.error(out.map(p => p.id + ' ' + (p.hardness !== undefined ? (p.hardness * 100).toFixed(2) + '% random wins' : 'prism tile ' + p.prismTile)).join('\n'));
