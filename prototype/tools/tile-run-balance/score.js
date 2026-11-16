'use strict';
/* Tile power scores (see marginal.js for the metric).  Usage: [TR_HTML=file] node score.js <label> [units|catalog|all] [unit ids, comma separated]
   Writes results/<label>.json (SHARES in percent: score = min(100, 100 * share / 40)): { units: {id: {1: {tiles, fx}, 5: {...}}}, hero: {...}, cl: {...}, ct: {...}, rb: {...} } */
const fs = require('fs'), path = require('path');
const L = require('./lib.js'), pool = require('./pool.js'), cat = require('./catalog.js');
const R = L.R, C = L.C;
const label = process.argv[2] || 'run', what = process.argv[3] || 'all', only = process.argv[4] ? process.argv[4].split(',') : null;
const jobs = [], keys = [];
const add = (key, job) => { keys.push(key); jobs.push(job); };
(async () => {
  const t0 = Date.now();
  if (what === 'all' || what === 'units') R.UNITS.filter(u => !only || only.indexOf(u.id) >= 0).forEach(u => [1, 5].forEach(lv =>
    add(`u|${u.id}|${lv}`, { type: 'contrib', rc: { team: { [u.c]: u.id }, levels: { [u.id]: lv }, measure: 'unit', unit: u.id, fxColour: u.c } })));
  if (what === 'all' || what === 'catalog') {
    add('hero|all', { type: 'hero' });
    Object.keys(cat.kinds).forEach(kd => [0, 1, 2].forEach(r => [0, 3].forEach(st => {
      add(`cl|${kd}|${r}|${st}`, { type: 'contrib', rc: { colourless: L.KIT_CL.slice(0, 2).concat([{ t: cat.colourless(cat.kinds[kd][r], C, R), rar: r, st }]), measureCl: 2 } });
      add(`ct|${kd}|${r}|${st}`, { type: 'contrib', rc: { slots: { brand: [L.KIT[0], { t: cat.kinds[kd][r], rar: r, st }] }, measureSlot: ['brand', 1] } });
    })));
    [['strike', 'a^3'], ['fork', 'a<>2'], ['plus', 'pudlr1']].forEach(([n, t]) => [0, 3].forEach(st => add(`rb|${n}|${st}`, { type: 'contrib', rc: { slots: { brand: [L.KIT[0], { t, rar: 0, st, rb: true }] }, measureSlot: ['brand', 1] } })));
  }
  console.log('configs', jobs.length);
  const iv = setInterval(() => console.log('...', Math.round((Date.now() - t0) / 1000), 's'), 120000);
  const res = await pool.run(jobs); clearInterval(iv);
  const file = path.join(__dirname, 'results', label + '.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const out = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { units: {}, hero: {}, cl: {}, ct: {}, rb: {} };
  out.label = label;
  keys.forEach((k, i) => {
    const p = k.split('|'), r = res[i];
    if (p[0] === 'u') { (out.units[p[1]] = out.units[p[1]] || {})[p[2]] = { tiles: r.tiles.map(x => +(100 * x).toFixed(1)), fx: r.fx === null ? null : +(100 * r.fx).toFixed(1) }; }
    else if (p[0] === 'hero') { for (const h in r.shares) out.hero[h] = +(100 * r.shares[h]).toFixed(1); }
    else out[p[0]][p.slice(1).join('|')] = +(100 * r.tiles[0]).toFixed(1);
  });
  fs.writeFileSync(file, JSON.stringify(out, null, 1));
  console.log('done', (Date.now() - t0) / 1000, 's');
})();
