'use strict';
/* Print score tables from results/<label>.json (optionally a second label for "before -> after"). Usage: node report.js before [after] */
const fs = require('fs'), path = require('path');
const R = require('./lib.js').R;
const load = l => JSON.parse(fs.readFileSync(path.join(__dirname, 'results', l + '.json'), 'utf8'));
const M = require('./marginal.js');
const a = load(process.argv[2]), b = process.argv[3] ? load(process.argv[3]) : null;
const cell = (x, y) => b ? `${x}>${y}` : `${x}`;
console.log('unit      r  L1 tiles    L5 tiles    effect(L5)');
['Common', 'Rare', 'Epic'].forEach((nm, rar) => R.UNITS.filter(u => u.rar === rar).forEach(u => {
  const g = (o, lv) => o && o.units[u.id] && o.units[u.id][lv] ? o.units[u.id][lv] : { tiles: [], fx: '-' };
  const l1 = g(a, 1).tiles, l5 = g(a, 5).tiles;
  const m = (x) => x.length ? Math.round(x.reduce((s, v) => s + v, 0) / x.length) : '-';
  console.log(u.id.padEnd(9), nm[0], ' ', (b ? l1.join(',') + ' > ' + g(b, 1).tiles.join(',') : l1.join(',')).padEnd(22), (b ? l5.join(',') + ' > ' + g(b, 5).tiles.join(',') : l5.join(',')).padEnd(26), cell(g(a, 5).fx, g(b, 5).fx));
}));
['hero', 'cl', 'ct', 'rb'].forEach(k => { console.log(k.toUpperCase()); Object.keys(a[k]).forEach(x => console.log('  ', x.padEnd(14), cell(a[k][x], b ? b[k][x] : ''))); });
