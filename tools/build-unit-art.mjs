// Placeholder drawings for the 92 V2 beasts (docs/data/units.json): same idea as the enemy art map of tools/build-fights.mjs.
//   exact = a drawing carries the unit's name (or its real animal / bestiary name); close = a whole word of the name is a drawing's name; fallback = the family's pool, picked by name hash.
// Writes prototype/data/v2-unit-art.json  { units: { unitId: { art, match, via } } }.  Run: node tools/build-unit-art.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UNITS = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/data/units.json'), 'utf8'));
const DRAW = fs.readdirSync(path.join(ROOT, 'prototype/assets/units')).filter((f) => f.endsWith('.svg')).map((f) => f.replace('.svg', ''));
const norm = (s) => String(s).toLowerCase().replace(/ð/g, 'd').replace(/þ/g, 'th').replace(/æ/g, 'ae').replace(/ø/g, 'o').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '');
const hash = (s) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
const STEM = Object.fromEntries(DRAW.map((u) => [norm(u), u]));
const POOL = {
  wings: ['tengu', 'harpy', 'firebird', 'fenghuang', 'alkonost', 'bennu', 'griffin', 'ravens', 'samjok-o', 'vucub-caquix'],
  hooves: ['sleipnir', 'baku', 'xuanwu', 'haetae', 'minotaur', 'pixiu', 'baize'],
  fangs: ['cerberus', 'cadejo', 'komainu', 'kamaitachi', 'baihu', 'nemean-lion', 'jangsan-beom', 'balam', 'gumiho', 'tanuki'],
  scales: ['hydra', 'jormungandr', 'nidhogg', 'lindworm', 'orochi', 'imugi', 'kappa', 'sobek', 'jingwei', 'scylla', 'wadjet', 'xuanwu'],
  wilds: ['jangsan-beom', 'baihu', 'cadejo', 'ratatoskr', 'serket', 'khepri', 'kodama', 'leshy', 'nemean-lion', 'tanuki'],
};
function artFor(u) {
  const names = [u.name, u.baseAnimal, u.bestiary].concat((u.evolution || []).map((e) => e.name)).filter(Boolean);
  for (const n of names) if (STEM[norm(n)]) return { art: STEM[norm(n)], match: 'exact', via: n };
  const words = (n) => String(n).replace(/\(.*?\)/g, ' ').split(/[\s\-'’]+/).map(norm).filter((w) => w.length >= 3);
  for (const n of names) for (const w of words(n)) if (STEM[w]) return { art: STEM[w], match: 'close', via: 'word ' + w };
  const pool = POOL[u.family].filter((d) => DRAW.includes(d));
  return { art: pool[hash(u.name) % pool.length], match: 'fallback', via: u.family };
}
const units = {}, stats = { exact: 0, close: 0, fallback: 0, total: UNITS.length };
for (const u of UNITS) { const a = artFor(u); units[u.id] = a; stats[a.match]++; }
fs.writeFileSync(path.join(ROOT, 'prototype/data/v2-unit-art.json'), JSON.stringify({ note: 'Placeholder drawings (prototype/assets/units) per V2 unit id. exact = same name as a drawing, close = a word of the name is a drawing, fallback = family pool by name hash. Run tools/build-unit-art.mjs.', stats, units }, null, 1) + '\n');
console.log(stats);
