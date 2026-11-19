'use strict';
/* Journey simulator: a bot plays the whole campaign from a fresh save, with the game's own coin / shard / unit / slot / star economy.
   Usage: node journey.js <skilled|casual> <n players> [seed0] [maxRuns]   (prints a summary; --json file to dump)
   Player model: unit shards (first clear 3 of a featured unit, replay 1, elite drops) unlock units; coins buy levels and slots (best value per coin), fills slots with the best collected tiles,
   keeps the best tile after each boss, takes the next playable stage of the lowest tier; after two losses in a row it replays (farms) easier cleared stages (replay bonus: coins, a tile, a shard)
   until it has lost no more than REPLAYS in a row of such farming runs, then tries the frontier again. */
const L = require('./lib.js'), R = L.R, C = L.C;
const MIN = { run: 1.0, fight: 0.5, attack: 1.0 };    /* assumed minutes: per run (setup, map, results), per fight played (choosing the fight, the pick screen), per attack (placing 8 to 15 tiles and watching the result) */

function vtile(t) {
  const cells = R.cellsOf(t).length, lanes = t.k === 'a' ? R.laneOffsets(t.d).length : 1, n = (t.n || 0) + (t.st || 0) * C.stars.bonus * (t.stAdded ? 0 : 0);
  if (t.k === 'a') return n * Math.pow(lanes, 0.8) * Math.pow(cells, 0.7);
  if (t.k === 'p') return n * (/[RC]/.test(t.d) ? 3 : t.d === 'B' ? 5 : t.d.length) * 0.9 * Math.pow(cells, 0.5);
  if (t.k === 'x') return n * 2.5 * (/[RCB]/.test(t.d) ? 2.5 : t.d.length * 0.8) * 1;
  return n + 4;
}
const ev = e => vtile({ k: e.k, d: e.d, n: e.n + (e.st || 0) * C.stars.bonus, sh: e.sh || 'o' });
function power(u, lvl) {
  let s = 0; R.unitBase(u, lvl).forEach(k => { s += vtile(k); });
  return s + [4, 7, 11][u.rar] + 3 * u.rar * lvl;
}
function newStore() {
  const units = {}, team = {}; R.UNITS.forEach(u => { const st = C.starters.indexOf(u.id) >= 0; if (st) team[u.c] = u.id; units[u.id] = { u: st, l: 1 }; });
  return { coins: C.startCoins, ush: {}, units, team, ct: [], inv: [], nid: 0, cleared: {}, hero: 'rally', slots: {}, pulls: 0, dupShards: 0 };
}
function addInv(S, t) { S.nid++; S.inv.push({ id: S.nid, k: t.k, d: t.d, n: t.n, sh: t.sh || 'o', rar: t.rar || 0, st: 0 }); R.mergeStars(S.inv, null, null); }
function addCT(S, t) { S.nid++; S.ct.push({ id: S.nid, c: t.c, k: t.k, d: t.d, n: t.n, sh: t.sh || 'o', rar: t.rar || 0, st: 0 }); R.mergeStars(S.ct, null, null); }
function slotCount(S, id) { return (S.slots[id] || 1); }
function addShards(S, sh) { if (sh) S.ush[sh.u] = (S.ush[sh.u] || 0) + sh.n; }
function unlockUnits(S) { R.UNITS.forEach(u => { const st = S.units[u.id]; if (!st.u && (S.ush[u.id] || 0) >= C.shards.need[u.rar]) { S.ush[u.id] -= C.shards.need[u.rar]; st.u = true; S.pulls++; } }); }
function bestTeam(S) {
  const t = {}; R.COLOR_IDS.forEach(c => {
    let best = null, bv = -1; R.UNITS.forEach(u => { if (u.c !== c || !S.units[u.id].u) return; const p = power(u, S.units[u.id].l) + 4 * u.rar; if (p > bv) { bv = p; best = u.id; } });
    t[c] = best;
  }); return t;
}
/* spend coins on the team units (levels and slots, the best value per coin first) */
function spendShards(S) {
  for (;;) {
    let best = null;
    R.COLOR_IDS.forEach(c => {
      const u = R.UNIT_BY_ID[S.team[c]], st = S.units[u.id];
      if (st.l < C.lvlMax) { const cost = C.levelCoins[st.l + 1]; if (cost <= S.coins) { const v = 3.2 / cost + (st.l < 3 ? 0.15 : 0); if (!best || v > best.v) best = { v, f: () => { S.coins -= cost; st.l++; } }; } }
      const ns = slotCount(S, u.id);
      if (ns < C.slotMax[u.rar]) { const cost = C.slotCost[ns]; if (cost <= S.coins) { const v = 6 / cost; if (!best || v > best.v) best = { v, f: () => { S.coins -= cost; S.slots[u.id] = ns + 1; } }; } }
    });
    if (!best) return; best.f();
  }
}
function setup(S) {   /* team, slots, colourless bag for the next run */
  S.team = bestTeam(S);
  const used = {}, slots = {};
  const cts = S.ct.slice().sort((a, b) => ev(b) - ev(a)); let rb = 0;
  R.COLOR_IDS.forEach(c => {
    const uid = S.team[c], n = slotCount(S, uid); slots[uid] = [];
    cts.forEach(e => { if (slots[uid].length >= n || used[e.id]) return; if (e.c === c || (e.c === 'w' && rb < C.rainbow.maxTeam)) { used[e.id] = 1; if (e.c === 'w') rb++; slots[uid].push({ k: e.k, d: e.d, n: e.n + (e.st || 0) * C.stars.bonus, sh: e.sh, rar: e.rar || 0, st: e.st || 0, rb: e.c === 'w' }); } });
  });
  const cl = S.inv.slice().sort((a, b) => ev(b) - ev(a)).slice(0, C.maxColourless).map(e => ({ k: e.k, d: e.d, n: e.n, sh: e.sh, rar: e.rar, st: e.st }));
  return { slots, colourless: cl };
}
function pickStage(S, rnd, fails) {
  const M = R.mapData(), cl = S.cleared; let best = null;
  M.order.forEach(id => { const A = M.areas[id]; A.keys.forEach(k => { if (cl[k]) return; if (R.stageState(k, cl, false) !== 'a') return; const s = M.stages[k]; const key = s.tier * 100 + s.ai + s.idx * 0.01; if (!best || key < best.key) best = { key, k }; }); });
  return best && best.k;
}
function grindStage(S, tier) {   /* a cleared stage of about this tier */
  const M = R.mapData(); let best = null;
  Object.keys(S.cleared).forEach(k => { const s = M.stages[k]; if (!best || Math.abs(s.tier - tier) < Math.abs(best.tier - tier) || (Math.abs(s.tier - tier) === Math.abs(best.tier - tier) && s.len > best.len)) best = s; });
  return best && best.key;
}
function journey(level, seed, o) {
  o = o || {}; const rnd = L.rng(seed * 7919 + 13), S = newStore(), M = R.mapData(), log = [];
  let minutes = 0, losses = 0, runsN = 0, grind = 0, lastKey = null, streak = 0, farmLeft = 0;
  const doneAreas = () => R.doneAreaCount(S.cleared), topDone = () => M.areas.top.keys.filter(k => S.cleared[k]).length >= 3;
  const heroPref = o.heroPref || ['overcharge', 'prism', 'wind', 'guard', 'rally'];
  while (runsN < (o.maxRuns || 400) && !topDone()) {
    unlockUnits(S); S.team = bestTeam(S); spendShards(S);
    let key = pickStage(S, rnd), isGrind = false;
    if (streak >= 2 && farmLeft <= 0) { farmLeft = o.farm === undefined ? 3 : o.farm; streak = 0; }
    if (farmLeft > 0) { const g = grindStage(S, M.stages[key].tier - 1); if (g) { key = g; isGrind = true; grind++; } farmLeft--; }
    const st = M.stages[key], setupX = setup(S);
    const heroes = R.heroesUnlockedBy(Object.keys(S.cleared).length); const hero = heroPref.filter(h => heroes.indexOf(h) >= 0)[0] || 'rally';
    const T = { team: S.team, units: Object.fromEntries(Object.keys(S.units).map(id => [id, { l: S.units[id].l }])), slots: setupX.slots, colourless: setupX.colourless, hero };
    const rnd2 = L.rng(seed * 100003 + runsN * 31 + 5);
    const run = R.newRun('stage', st.tier, T.team, T.units, T.colourless.map(c => Object.assign({}, c)), rnd2, hero, { len: st.len, mid: st.mid, drop: st.drop, trick: st.trick, cell: { key }, slots: T.slots, locked: R.UNITS.filter(u => !S.units[u.id].u).map(u => u.id) });
    const stats = { attacks: 0, hero: 0, dmg: 0, b: L.rng(seed * 31 + runsN * 17 + 1), keepPolicy: true };
    const res = L.playRun(run, level, rnd2, stats);
    runsN++;
    const mins = MIN.run + MIN.fight * run.fights + MIN.attack * stats.attacks; minutes += mins;
    const how = res.win ? 'bank' : 'dead', k = R.settle(run, how);
    S.coins += k.coins; k.tiles.forEach(t => addInv(S, t)); for (const id in k.ushards) addShards(S, { u: id, n: k.ushards[id] });
    (res.keeps || stats.keeps || []).forEach(c => { if (res.win || c.mid) addCT(S, c); });
    if (res.win) {
      if (!S.cleared[key]) { const fr = R.firstClearReward(st.tier, rnd2); S.coins += fr.coins; addInv(S, fr.tile); addShards(S, R.clearShards(key, true, rnd2)); S.cleared[key] = 1; }
      else { const rp = R.replayReward(st.tier, key, rnd2); S.coins += rp.coins; addInv(S, rp.tile); addShards(S, rp.shards); }
      if (!isGrind) streak = 0;
    } else { if (!isGrind) streak++; losses++; }
    log.push({ n: runsN, key, tier: st.tier, runCoins: run.coins, unlocked: S.pulls, slotsN: R.COLOR_IDS.reduce((a, c) => a + slotCount(S, S.team[c]), 0), ctN: S.ct.length, stars: S.ct.reduce((a, e) => a + (e.st || 0), 0), area: st.area, win: res.win, fights: run.fights, attacks: stats.attacks, mins, grind: isGrind, hp: res.hp, coins: S.coins, shards: Object.values(S.ush).reduce((a, b) => a + b, 0), cleared: Object.keys(S.cleared).length, hours: minutes / 60,
      lv: R.COLOR_IDS.map(c => S.units[S.team[c]].l).join(''), un: Object.values(S.units).filter(u => u.u).length });
  }
  /* Endless with the team the player has now (tier 10 board): depth = bosses beaten */
  const endless = [];
  if (o.endless) for (let k = 0; k < o.endless; k++) {
    S.team = bestTeam(S); const sx = setup(S), hero = heroPref.filter(h => R.heroesUnlockedBy(Object.keys(S.cleared).length).indexOf(h) >= 0)[0] || 'rally';
    const units = Object.fromEntries(Object.keys(S.units).map(id => [id, { l: S.units[id].l }])), r2 = L.rng(seed * 977 + k * 13 + 3);
    const run = R.newRun('endless', 10, S.team, units, sx.colourless.map(c => Object.assign({}, c)), r2, hero, { slots: sx.slots });
    const res = L.playRun(run, level, r2, { attacks: 0, hero: 0, dmg: 0, b: L.rng(seed * 59 + k), endless: true });
    endless.push({ depth: run.depth, fights: run.fights });
  }
  return { S, log, runs: runsN, minutes, finished: topDone(), losses, grind, endless };
}
module.exports = { journey, vtile, power, MIN };
if (require.main === module) {
  const level = process.argv[2] || 'skilled', n = +(process.argv[3] || 1), s0 = +(process.argv[4] || 1), maxRuns = +(process.argv[5] || 400);
  const out = [];
  for (let i = 0; i < n; i++) {
    const t0 = Date.now(), r = journey(level, s0 + i, { maxRuns });
    out.push(r);
    const byTier = {}; r.log.forEach(x => { const b = byTier[x.tier] = byTier[x.tier] || { runs: 0, win: 0 }; b.runs++; if (x.win) b.win++; });
    console.log(level, 'seed', s0 + i, 'finished', r.finished, 'runs', r.runs, 'hours', (r.minutes / 60).toFixed(1), 'losses', r.losses, 'grind', r.grind, 'units', Object.values(r.S.units).filter(u => u.u).length, 'unlocked', r.S.pulls, 'sec', ((Date.now() - t0) / 1000) | 0);
    console.log('  tier runs/win%:', Object.keys(byTier).map(t => t + ':' + byTier[t].runs + '/' + Math.round(100 * byTier[t].win / byTier[t].runs)).join(' '));
  }
}
