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
  place.forEach((c, i) => { if (c >= 0) b[c] = pf.tiles[i]; });
  return { res: R.evaluate(pf.F, b, opts || {}), pf, b };
}
function randomPlace(def, r) {
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
    const sol = randomPlace(def, r), d = damage(def, sol);
    const hp = d.res.en.map(e => e.dmg);
    if (hp.some(x => x < 3)) continue;
    def.enemies = hp.map((x, c) => [c, 1, x]);
    if (!wins(def, sol)) continue;
    let w = 0; const N = 6000, r2 = rng(seed * 7 + tries);
    for (let k = 0; k < N; k++) if (wins(def, randomPlace(def, r2))) w++;
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
  { id: 'q10', name: 'Echo', need: 'p14', teach: 'Copy the strongest tile.', cols: 4, rows: 3, n: 7, pool: ['a^3', 'a^4', 'a^5', 'eu1', 'pu1'], must: ['eu1'], maxWin: 0.003 }
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
