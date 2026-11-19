'use strict';
const J = require('./journey.js');
process.on('message', m => {
  const r = J.journey(m.level, m.seed, m.o || {});
  const units = Object.keys(r.S.units).filter(id => r.S.units[id].u).map(id => id + ':' + r.S.units[id].l);
  process.send({ id: m.id, endless: r.endless, log: r.log, runs: r.runs, minutes: r.minutes, finished: r.finished, losses: r.losses, grind: r.grind, pulls: r.S.pulls, coins: r.S.coins, shards: Object.values(r.S.ush).reduce((a, b) => a + b, 0), units, team: r.S.team,
    slots: r.S.slots, ctN: r.S.ct.length, ctStars: r.S.ct.reduce((s, e) => s + (e.st || 0), 0), invN: r.S.inv.length });
});
