'use strict';
/* Markdown tables for docs/TILE_RUN_BALANCE.md from results/*.json.  Usage: node tables.js before after [journeySkilled.json journeyCasual.json]  (scores: min(100, round(100 * share / 20))) */
const fs = require('fs'), path = require('path');
const L = require('./lib.js'), R = L.R, C = L.C;
const load = f => JSON.parse(fs.readFileSync(path.join(__dirname, 'results', f + '.json'), 'utf8'));
const S = x => Math.min(100, Math.round(100 * x / 20));
const A = load(process.argv[2] || 'before'), B = load(process.argv[3] || 'after');
const arr = (o, id, lv) => (o.units[id] && o.units[id][lv] ? o.units[id][lv].tiles.map(S) : []);
const fx = (o, id) => (o.units[id] && o.units[id][5] ? S(o.units[id][5].fx) : '-');
const mean = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : '-';
const out = [];
out.push('| Unit | Rar | Tiles at level 1 (before > after) | Tiles at level 5 (before > after) | Mean L5 | Effect (before > after) |', '|---|---|---|---|---|---|');
['Common', 'Rare', 'Epic'].forEach((nm, rar) => R.UNITS.filter(u => u.rar === rar).sort((a, b) => 'rbgyp'.indexOf(a.c) - 'rbgyp'.indexOf(b.c)).forEach(u => {
  out.push(`| ${u.name} | ${nm[0]} | ${arr(A, u.id, 1).join(', ')} > ${arr(B, u.id, 1).join(', ')} | ${arr(A, u.id, 5).join(', ')} > ${arr(B, u.id, 5).join(', ')} | ${mean(arr(A, u.id, 5))} > ${mean(arr(B, u.id, 5))} | ${fx(A, u.id)} > ${fx(B, u.id)} |`);
}));
console.log(out.join('\n')); console.log();
['Common', 'Rare', 'Epic'].forEach((nm, rar) => {
  const us = R.UNITS.filter(u => u.rar === rar);
  const m = (o, lv) => mean([].concat.apply([], us.map(u => arr(o, u.id, lv))));
  const f = o => mean(us.map(u => fx(o, u.id)).filter(x => x !== '-'));
  console.log(`${nm}: tiles L1 ${m(A, 1)} > ${m(B, 1)}, tiles L5 ${m(A, 5)} > ${m(B, 5)}, effects ${f(A)} > ${f(B)}`);
});
console.log('\nHEROES (share% of damage in a two-attack window; score)');
Object.keys(B.hero).forEach(h => console.log(h, A.hero[h], S(A.hero[h]), '>', B.hero[h], S(B.hero[h])));
['cl', 'ct', 'rb'].forEach(k => { console.log('\n' + k.toUpperCase()); Object.keys(B[k]).forEach(x => console.log(x.padEnd(14), (A[k] && A[k][x] !== undefined ? S(A[k][x]) : '-'), '>', S(B[k][x]))); });

/* changed unit data and numbers (needs BEFORE_HTML) */
if (process.env.BEFORE_HTML) {
  const RB = L.loadRules(process.env.BEFORE_HTML);
  console.log('\nUNIT DATA CHANGES');
  R.UNITS.forEach(u => { const o = RB.UNIT_BY_ID[u.id]; if (o.base !== u.base || o.fx !== u.fx || o.style !== u.style) console.log(`| ${u.name} | ${o.base} > ${u.base} | ${o.style} > ${u.style} | ${o.fx === u.fx ? "same" : o.fx + " > " + u.fx} |`); });
  console.log('\nCONFIG.stages hp / coin / heroHp / atk');
  RB.CONFIG.stages.forEach((s, i) => { const a = C.stages[i]; console.log(`| ${i + 1} | ${s.hp} > ${a.hp} | ${s.coin} > ${a.coin} | ${s.heroHp} | ${s.atk} |`); });
  const oldFx = { front1: 1, back2: 2, single1: 1, boostp1: 1, wide1: 1, neigh1: 1, palette1: 1, mult1: 1, sand3: 3, cell2: 2, same1: 1, backx2: 2, edge2: 2, touch1: 1, loyal2: 2, boosted2: 2, foes1: 1, small2: 2, small2max: 3, up2: 2, rowmates1: 1, corner3: 3, bread1: 1, linepow: 2, echo2: 2, mulled2: 2, rare2: 3, colmates1: 1, triple: 3 };
  console.log('\nEFFECT SIZES');
  Object.keys(oldFx).forEach(k => { const n = R.EFFECTS[k] || { name: k }; if (oldFx[k] !== C.fx[k]) console.log(`| ${n.name} (${k}) | ${oldFx[k]} > ${C.fx[k]} |`); });
}
