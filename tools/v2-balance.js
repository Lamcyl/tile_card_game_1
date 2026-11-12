// Unit contribution vs power budget (docs/DESIGN_V2.md section 4, docs/V2_UNITS_PLAN.md step 5).
// Usage: node tools/v2-balance.js [--stage=1|2|3] [--csv] [--ids=a,b] [--verbose]
// Method: a fixed bench. Six plain classic attackers (four ATK 2 range 2 Swordsmen on the front row, the centre front tile left free for range-1 units, two Archers behind columns 1 and 3; elementless, so no merges) fight 7 bodies (HP 14, ATK 4, two with armour 1; five in the front row so range 1 reaches) for
// 4 turns. The unit under test is added on the best of the free tiles (brute force over the 9 free tiles); its value is the extra enemy HP removed plus the extra hero HP kept,
// against the same bench without it (the candidate is tried first and last in the placement order, for Latecomer and Firstborn), averaged over the 8 enemy elements (so the chart washes out). Enemies strike every turn; the hero has 400 HP so it never dies.
// ratio = value / powerBudget; the flags compare each unit with the median ratio of all units (x1.75 and above = strong, x0.5 and below = weak).
// Not measured by this bench (value 0 by construction, listed as "unmeasured"): Tribute (souls), Mentor, Bond, Offering (needs a Common ally), Mirror (needs a left neighbour; tested with the bench attacker).
'use strict';
const fs = require('fs');
const path = require('path');
const E = require('../prototype/js/engine.js');
const V2 = require('../prototype/js/v2.js');
const rd = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'data', f), 'utf8'));
const UNITS = rd('units.json'), ELDOC = rd('elements.json');
V2.load(UNITS, ELDOC, rd('families.json'));
const ELS = ELDOC.elements.map((e) => e.id);
const args = process.argv.slice(2);
const opt = (n, d) => { const a = args.find((x) => x.startsWith('--' + n + '=')); return a ? a.split('=')[1] : d; };
const STAGE = Number(opt('stage', 1)), TURNS = 4;
const only = opt('ids', null) ? opt('ids').split(',') : null;

const FREE = [];
for (const r of E.PLAYER_ROWS) for (let c = 0; c < E.COLS; c++) FREE.push(E.key(r, c));
const CTX = [0, 1, 3, 4].map((c) => [E.key(2, c), { id: 'ctx' + c, type: 'swordsman', atk: 2, range: 2 }])
  .concat([1, 3].map((c) => [E.key(3, c), { id: 'ctxb' + c, type: 'archer', atk: 2, range: 4 }]));
const FOES = [[1, 0, 0], [1, 1, 0], [1, 2, 1], [1, 3, 0], [1, 4, 0], [0, 1, 1], [0, 3, 0]]; // row, col, armour

function bench(el, extra, tile, first) {
  const enemies = FOES.map(([row, col, armor]) => ({ type: 'goblin', row, col, hp: 14, atk: 4, armor, element: el }));
  let st = E.createState({ heroHp: 400, heroMaxHp: 400, enemies, rules: { v2: {} } });
  st.enemies.forEach((e) => { e.element = el; });
  const army = CTX.map(([, c]) => c).concat(extra ? [extra] : []);
  const placement = {};
  if (extra && first) placement[tile] = extra.id;       // placement order matters for Latecomer / Firstborn: try the candidate first and last
  CTX.forEach(([k, c]) => { placement[k] = c.id; });
  if (extra && !first) placement[tile] = extra.id;
  const hp0 = st.enemies.reduce((n, e) => n + e.hp, 0);
  for (let t = 0; t < TURNS && st.status === 'playing'; t++) st = E.resolveTurn(st, placement, army).state;
  return (hp0 - st.enemies.reduce((n, e) => n + Math.max(0, e.alive ? e.hp : 0), 0)) + st.hp;
}
const baseVal = {};
for (const el of ELS) baseVal[el] = bench(el, null, null);

function valueOf(card) {
  let best = -1e9, bestTile = null;
  for (const tile of FREE) {
    if (CTX.some(([k]) => k === tile)) continue;
    for (const first of [false, true]) {
      let sum = 0;
      for (const el of ELS) sum += bench(el, card, tile, first) - baseVal[el];
      sum /= ELS.length;
      if (sum > best) { best = sum; bestTile = tile; }
    }
  }
  return { v: best, tile: bestTile };
}

const rows = [];
for (const u of UNITS) {
  if (only && !only.includes(u.id)) continue;
  const card = Object.assign(V2.card(u.id, { stage: STAGE, level: 1, stars: 1 }), { id: 'cand' });
  const { v, tile } = valueOf(card);
  const budget = u.powerBudget + (STAGE - 1); // +1 per evolution stage (DESIGN_V2 section 6)
  const r = u.roles;
  const kind = r.atk >= 70 ? 'attack' : r.atk + r.buff + r.guard > 0 && [r.atk, r.buff, r.guard].filter((x) => x >= 25).length >= 2 ? 'hybrid' : r.buff >= r.guard ? 'buff' : 'guard';
  rows.push({ id: u.id, name: u.name, rarity: u.rarity, type: u.type, kind, budget, cp: u.commandCost, v: Math.round(v * 100) / 100, ratio: v / budget, tile, atk: card.atk });
}
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const M = med(rows.filter((r) => r.v > 0).map((r) => r.ratio));
rows.forEach((r) => { r.rel = r.ratio / M; r.flag = r.v <= 0 ? 'unmeasured' : r.rel >= 1.75 ? 'STRONG' : r.rel <= 0.5 ? 'weak' : ''; });
const mean = (a) => (a.length ? a.reduce((n, x) => n + x, 0) / a.length : 0);
if (opt('csv', null) !== null || args.includes('--csv')) {
  console.log('id,rarity,kind,budget,value,ratio,rel,flag');
  rows.forEach((r) => console.log([r.id, r.rarity, r.kind, r.budget, r.v, r.ratio.toFixed(2), r.rel.toFixed(2), r.flag].join(',')));
} else {
  console.log(`stage ${STAGE}, bench ${TURNS} turns, median value/budget = ${M.toFixed(2)}`);
  console.log('by rarity (mean rel): ' + ['common', 'rare', 'epic', 'legendary'].map((k) => k + ' ' + mean(rows.filter((r) => r.rarity === k && r.v > 0).map((r) => r.rel)).toFixed(2)).join(', '));
  console.log('by kind   (mean rel): ' + ['attack', 'buff', 'guard', 'hybrid'].map((k) => k + ' ' + mean(rows.filter((r) => r.kind === k && r.v > 0).map((r) => r.rel)).toFixed(2) + ' (n=' + rows.filter((r) => r.kind === k).length + ')').join(', '));
  console.log('id'.padEnd(22) + 'rar'.padEnd(5) + 'kind'.padEnd(8) + 'bud'.padStart(4) + 'value'.padStart(7) + 'rel'.padStart(6) + '  flag');
  rows.slice().sort((a, b) => b.rel - a.rel).forEach((r) => console.log(r.id.padEnd(22) + r.rarity.slice(0, 4).padEnd(5) + r.kind.padEnd(8) + String(r.budget).padStart(4) + r.v.toFixed(1).padStart(7) + r.rel.toFixed(2).padStart(6) + '  ' + r.flag));
}
module.exports = { rows };
