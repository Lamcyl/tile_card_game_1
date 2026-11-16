'use strict';
/* Parallel journeys + summary. Usage: node journeys.js <skilled|casual> <n> [seed0] [maxRuns] [--json out]
   Summary: runs and hours to finish the world, win rate per tier at the moment it was played, and the team at the end. */
const cp = require('child_process'), path = require('path');
function runAll(level, n, seed0, maxRuns, workers) {
  return new Promise(resolve => {
    const out = []; let next = 0, done = 0; const kids = [];
    const feed = k => { if (next >= n) return; const id = next++; k.send({ id, level, seed: seed0 + id, o: { maxRuns, endless: 3 } }); };
    for (let i = 0; i < Math.min(workers || 4, n); i++) {
      const k = cp.fork(path.join(__dirname, 'jworker.js')); kids.push(k);
      k.on('message', m => { out[m.id] = m; done++; if (done === n) { kids.forEach(x => x.kill()); resolve(out); } else feed(k); });
      feed(k);
    }
  });
}
function summary(level, res) {
  const T = {}, areaHours = {};
  res.forEach(r => r.log.forEach(x => { const b = T[x.tier] = T[x.tier] || { runs: 0, win: 0, att: 0, fights: 0, mins: 0 }; b.runs++; if (x.win) b.win++; b.att += x.attacks; b.fights += x.fights; b.mins += x.mins; }));
  const q = (a, p) => { a = a.slice().sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * a.length))]; };
  const hrs = res.map(r => r.minutes / 60), runs = res.map(r => r.runs);
  const lines = [];
  lines.push(`${level}: ${res.length} players, finished ${res.filter(r => r.finished).length}; runs median ${q(runs, .5)} (${q(runs, .1)}..${q(runs, .9)}); hours median ${q(hrs, .5).toFixed(1)} (${q(hrs, .1).toFixed(1)}..${q(hrs, .9).toFixed(1)}); losses ${(res.reduce((s, r) => s + r.losses, 0) / res.length).toFixed(1)}; pulls ${(res.reduce((s, r) => s + r.pulls, 0) / res.length).toFixed(0)}; units owned ${(res.reduce((s, r) => s + r.units.length, 0) / res.length).toFixed(1)}`);
  const ed = [].concat.apply([], res.map(r => (r.endless || []).map(e => e.depth))).sort((a, b) => a - b);
  if (ed.length) lines.push(`endless depth (bosses beaten) with the final team: median ${ed[Math.floor(ed.length / 2)]}, range ${ed[0]}..${ed[ed.length - 1]}`);
  lines.push('tier  runs  win%  att/fight  min/run');
  Object.keys(T).sort((a, b) => a - b).forEach(t => { const b = T[t]; lines.push(String(t).padStart(4) + String(Math.round(b.runs / res.length * 10) / 10).padStart(6) + String(Math.round(100 * b.win / b.runs)).padStart(6) + (b.att / b.fights).toFixed(2).padStart(10) + (b.mins / b.runs).toFixed(1).padStart(9)); });
  /* team level at each tier's last run (median) */
  return { text: lines.join('\n'), T, hrs, runs };
}
module.exports = { runAll, summary };
if (require.main === module) {
  const level = process.argv[2] || 'skilled', n = +(process.argv[3] || 4), s0 = +(process.argv[4] || 1), mr = +(process.argv[5] || 400);
  runAll(level, n, s0, mr).then(res => {
    console.log(summary(level, res).text);
    const j = process.argv.indexOf('--json'); if (j > 0) require('fs').writeFileSync(process.argv[j + 1], JSON.stringify(res));
  });
}
