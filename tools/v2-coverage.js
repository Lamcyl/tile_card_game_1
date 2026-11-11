// Prints how many of the V2 units are implemented (docs/data/units.json `impl`), by status, family and primitive.
// Usage: node tools/v2-coverage.js [--list]       (exit code 1 if a unit has behaviours but no impl, or an unknown primitive)
'use strict';
const units = require('../docs/data/units.json');
const PRIMS = ['attack', 'skyfall', 'trample', 'swift', 'echo', 'chain', 'scale', 'molt', 'onHit', 'push', 'buff', 'grant', 'shield', 'decoy', 'heroHeal', 'heroGuard', 'onKill', 'attune', 'swap', 'ignoreArmor', 'rend', 'mimic', 'mirror', 'offering', 'brood'];
const tally = {}, byFamily = {}, prim = {};
let bad = 0;
for (const u of units) {
  const st = u.notYet ? 'notYet' : u.impl || 'unset';
  tally[st] = (tally[st] || 0) + 1;
  const f = (byFamily[u.family] = byFamily[u.family] || {}); f[st] = (f[st] || 0) + 1;
  for (const b of u.behaviours || []) { if (!PRIMS.includes(b.p)) { console.log('unknown primitive ' + b.p + ' in ' + u.id); bad++; } prim[b.p] = (prim[b.p] || 0) + 1; }
  if ((u.behaviours || []).length && !u.impl) { console.log('no impl on ' + u.id); bad++; }
  if (process.argv.includes('--list')) console.log(st.padEnd(11) + u.id + (u.implNote ? '  (' + u.implNote + ')' : ''));
}
console.log('V2 units: ' + units.length + '  ' + Object.entries(tally).map(([k, v]) => k + ' ' + v).join(', '));
for (const [f, t] of Object.entries(byFamily)) console.log('  ' + f.padEnd(7) + Object.entries(t).map(([k, v]) => k + ' ' + v).join(', '));
console.log('primitives used: ' + PRIMS.filter((p) => prim[p]).map((p) => p + ' ' + prim[p]).join(', '));
console.log('primitives still unused: ' + PRIMS.filter((p) => !prim[p]).join(', '));
process.exit(bad ? 1 : 0);
