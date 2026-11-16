'use strict';
/* Difficulty curve and economy tables from journey files.  Usage: node curve.js after|before   (reads results/j-<label>-skilled.json and -casual.json) */
const fs = require('fs'), path = require('path');
const L = require('./lib.js'), C = L.C, R = L.R;
const label = process.argv[2] || 'after';
const load = k => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'results', `j-${label}-${k}.json`), 'utf8')); } catch (e) { return null; } };
const J = { skilled: load('skilled'), casual: load('casual') };
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
function perTier(res) {
  const T = {};
  res.forEach(r => r.log.forEach(x => { const b = T[x.tier] = T[x.tier] || { runs: 0, win: 0, att: 0, fights: 0, mins: 0, coins: [], lv: [], slots: [], un: [], ct: [], stars: [], pulls: [], hours: [] }; b.runs++; if (x.win) b.win++; b.att += x.attacks; b.fights += x.fights; b.mins += x.mins; if (x.win) b.coins.push(x.runCoins); b.lv.push(mean(x.lv.split('').map(Number))); b.slots.push(x.slotsN); b.un.push(x.un); b.ct.push(x.ctN); b.stars.push(x.stars); b.pulls.push(x.pulls); b.hours.push(x.hours); }));
  return T;
}
const P = {}; Object.keys(J).forEach(k => { if (J[k]) P[k] = perTier(J[k]); });
const n = k => J[k] ? J[k].length : 0;
const f1 = x => (Math.round(x * 10) / 10).toFixed(1), pc = (a, b) => b ? Math.round(100 * a / b) : '-';
console.log(`DIFFICULTY CURVE (${label}); journeys: skilled ${n('skilled')}, casual ${n('casual')}`);
console.log('| Tier | Board | HP / column | Enemy atk | Hero HP | Run | Boss | Skilled win % | Casual win % | Attacks per fight (skilled / casual) | Minutes per run (skilled / casual) |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|');
const lenOf = {}; R.mapData().order.forEach(id => { const a = R.mapData().areas[id]; lenOf[a.tier] = a.len; });
for (let t = 1; t <= 10; t++) {
  const S = C.stages[t - 1], a = P.skilled && P.skilled[t], b = P.casual && P.casual[t];
  console.log(`| ${t} | ${S.cols}x${S.rows} | ${S.hp} | ${S.atk} | ${S.heroHp} | ${lenOf[t]} | ${S.boss} | ${a ? pc(a.win, a.runs) : '-'} | ${b ? pc(b.win, b.runs) : '-'} | ${a ? (a.att / a.fights).toFixed(2) : '-'} / ${b ? (b.att / b.fights).toFixed(2) : '-'} | ${a ? f1(a.mins / a.runs) : '-'} / ${b ? f1(b.mins / b.runs) : '-'} |`);
}
console.log('\nTEAM AT THE TIME (mean over the runs played at that tier)');
console.log('| Tier | Skilled: unit level (mean of 5) | slots open | units owned | collected tiles | stars | pulls so far | hours so far | Casual: unit level | slots | units | pulls | hours |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (let t = 1; t <= 10; t++) {
  const a = P.skilled && P.skilled[t], b = P.casual && P.casual[t]; const g = (x, k) => x ? f1(mean(x[k])) : '-';
  console.log(`| ${t} | ${g(a, 'lv')} | ${g(a, 'slots')} | ${g(a, 'un')} | ${g(a, 'ct')} | ${g(a, 'stars')} | ${g(a, 'pulls')} | ${g(a, 'hours')} | ${g(b, 'lv')} | ${g(b, 'slots')} | ${g(b, 'un')} | ${g(b, 'pulls')} | ${g(b, 'hours')} |`);
}
console.log('\nECONOMY (coins per won run, runs per player at the tier)');
console.log('| Tier | Coins per won run (skilled) | First-clear coins | Runs per player (skilled) | Runs per player (casual) |');
console.log('|---|---|---|---|---|');
for (let t = 1; t <= 10; t++) { const a = P.skilled && P.skilled[t], b = P.casual && P.casual[t]; console.log(`| ${t} | ${a ? f1(mean(a.coins)) : '-'} | ${C.firstClear.coins[t - 1]} | ${a ? f1(a.runs / n('skilled')) : '-'} | ${b ? f1(b.runs / n('casual')) : '-'} |`); }
console.log('\nPACING');
Object.keys(J).forEach(k => { const r = J[k]; if (!r) return; const hrs = r.map(x => x.minutes / 60).sort((a, b) => a - b), runs = r.map(x => x.runs).sort((a, b) => a - b), q = (a, p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
  const fin = r.filter(x => x.finished).length; console.log(`${k}: finished ${fin}/${r.length}; runs median ${q(runs, .5)} (p10 ${q(runs, .1)}, p90 ${q(runs, .9)}); hours median ${q(hrs, .5).toFixed(1)} (p10 ${q(hrs, .1).toFixed(1)}, p90 ${q(hrs, .9).toFixed(1)}); losses ${f1(mean(r.map(x => x.losses)))}; pulls ${f1(mean(r.map(x => x.pulls)))}; units owned ${f1(mean(r.map(x => x.units.length)))}; shards left ${f1(mean(r.map(x => x.shards)))}`);
  const ed = [].concat.apply([], r.map(x => (x.endless || []).map(e => e.depth))).sort((a, b) => a - b); if (ed.length) console.log(`  endless depth (bosses beaten, final team, tier 10 board): median ${q(ed, .5)}, range ${ed[0]}..${ed[ed.length - 1]}`);
});
