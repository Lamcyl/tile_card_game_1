'use strict';
/* worker process for the scorer: receives { id, rc, n, level, seed } and answers { id, dmg, att } */
const L = require('./lib.js');
process.on('message', m => {
  if (m.type === 'contrib') { const M = require('./marginal.js'); const r = M.contrib(m.rc, m.seed || 1); process.send({ id: m.id, tiles: r.tiles, fx: r.fx }); return; }
  if (m.type === 'hero') { const M = require('./marginal.js'); process.send({ id: m.id, shares: M.heroScores(1) }); return; }
  if (m.type === 'cal') { process.send({ id: m.id, lam0: L.calibrate(m.rc) }); return; }
  if (m.type === 'cap') { const r = L.capacity(m.rc, m.lam0); process.send({ id: m.id, ln: r.ln, per: r.per, phis: r.phis }); return; }
  const r = L.measure(m.rc, m.n, m.level, m.seed); process.send({ id: m.id, dmg: r.dmg, att: r.att });
});
