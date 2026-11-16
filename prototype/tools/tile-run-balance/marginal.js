'use strict';
/* Marginal-contribution scoring ("how much of the team's damage disappears when the tile is missing").
   The skilled bot plays the first attack of 24 fixed, seeded tier-10 fights (final boss body, mid-boss, elites, normals), enemy HP x LAM, with the reference
   endgame team.  On each board the damage that counts is V = sum over enemies of min(damage, HP).  share = 1 - V'/V where V' is the same board with the tile
   taken off (its cells empty) -- geometric mean over the fights.  Unit effects: the same boards evaluated without the effect.
   Score = 100 * share / 0.40, clamped to 100: a tile that carries 40% of a skilled player's damage is "necessary" (the headroom a well-built endgame team has over
   the toughest battle is 25-40%).  Heroes: the extra damage share their ability adds over a two-attack window (see heroScores). */
const L = require('./lib.js'), R = L.R, C = L.C;
const S100 = 0.40, LAM = 1.25;
const H = S100;
const FIGHTS = [];
for (let i = 0; i < 6; i++) FIGHTS.push({ kind: 'boss', seed: 11 + i, won: 7 });
for (let i = 0; i < 4; i++) FIGHTS.push({ kind: 'boss', mid: true, seed: 21 + i, won: 4 });
for (let i = 0; i < 8; i++) FIGHTS.push({ kind: 'elite', seed: 31 + i, won: 5 });
for (let i = 0; i < 6; i++) FIGHTS.push({ kind: 'normal', seed: 41 + i, won: 5 });
function mkFight(rc, f) {
  const T = L.recipeTeam(rc), rnd = L.rng(f.seed), o = L.stageOpt('top', 0).opt;
  const run = R.newRun('stage', 10, T.team, T.units, T.colourless, rnd, T.hero, Object.assign({}, o, { slots: T.slots }));
  if (rc.runkit !== false) L.RUNKIT.forEach(k => run.bag.push(R.mkTile(run, k.c, run.team[k.c], L.spec(k.t), Object.assign({ rar: k.rar || 0, added: true, kit: true }, k.x || {}))));
  L.recipeEdit(rc)(run); run.won = f.won;
  const off = R.genFight(run, f.kind, rnd, f.mid ? { mid: true, trick: R.midTrick(run) } : {});
  const F = off.F; F.phases = null; F.tricks = F.tricks.filter(t => t !== 'twin');
  F.enemies.forEach(e => { e.hp = Math.max(1, Math.round(e.hp * LAM)); e.max = e.hp; e.twin = 0; });
  F.fx = JSON.parse(JSON.stringify(run.fx)); F.relics = [];
  return { run, F };
}
const Vof = (F, board, fxOver) => { const F2 = fxOver ? Object.assign({}, F, { fx: fxOver }) : F; const res = R.evaluate(F2, board, { momentum: 0 }); let v = 0; F.enemies.forEach((e, k) => { v += Math.min(res.en[k].dmg, e.hp); }); return v; };
const placed = board => { const seen = {}, l = []; board.forEach(t => { if (t && !seen[t.id]) { seen[t.id] = 1; l.push(t); } }); return l; };
/* find the marked tiles of a recipe in a bag (ids) */
function targetsOf(rc, bag) {
  const out = [];
  if (rc.measure === 'unit') bag.filter(t => t.u === rc.unit && !t.slot && !t.kit).forEach(t => out.push(t.id));
  if (rc.measureSlot) { const sl = bag.filter(t => t.slot && t.u === rc.measureSlot[0]); if (sl[rc.measureSlot[1]]) out.push(sl[rc.measureSlot[1]].id); }
  if (rc.measureCl !== undefined) { const cl = bag.filter(t => t.c === 'x'); if (cl[rc.measureCl]) out.push(cl[rc.measureCl].id); }
  return out;
}
/* returns { tiles: [score per target], fx: score of the effect of rc.fxColour } */
function contrib(rc, seed0) {
  const acc = {}, accFx = []; let n = 0, targetIds = null;
  FIGHTS.forEach((f, fi) => {
    const { run, F } = mkFight(rc, f);
    const avail = run.bag; if (!targetIds) targetIds = targetsOf(rc, avail);
    const st = L.search(F, avail, { momentum: 0, obj: 'dmg' }, 'skilled', L.rng((seed0 || 1) * 97 + fi), 0, 1, 0);
    const board = st.board, V = Vof(F, board); if (V <= 0) return; n++;
    const used = placed(board), usedIds = {}; used.forEach(t => usedIds[t.id] = 1);
    const bench = avail.filter(t => !usedIds[t.id]);
    targetIds.forEach(id => {
      const t = used.filter(x => x.id === id)[0]; let Vw = V;
      if (t) {
        const cells = []; board.forEach((x, q) => { if (x === t) cells.push(q); });
        const trial = board.slice(); cells.forEach(q => trial[q] = null); Vw = Vof(F, trial);
      }
      acc[id] = (acc[id] || 0) + Math.log(V / Math.max(1e-9, Vw));
    });
    if (rc.fxColour) { const fo = JSON.parse(JSON.stringify(F.fx)); delete fo[rc.fxColour]; accFx.push(Math.log(V / Math.max(1e-9, Vof(F, board, fo)))); }
  });
  const share = x => 1 - Math.exp(-x);
  return { tiles: targetIds.map(id => share((acc[id] || 0) / n)), fx: accFx.length ? share(accFx.reduce((a, b) => a + b, 0) / n) : null, n };
}
/* heroes: for each fight, board 1 (whole bag), board 2 (what is left), board 3 (what is left again); wind: board 2 from the whole bag again.
   rally = +1 momentum on one attack, prism / overcharge = best single target of board 1, guard = one more attack (it saves one enemy volley). Share of the
   extra damage in the window; score = 100 * share / 0.40 */
function heroScores(seed0) {
  const acc = { rally: [], wind: [], prism: [], overcharge: [], guard: [] };
  FIGHTS.forEach((f, fi) => {
    const { run, F } = mkFight({}, f), bag = run.bag, rnd = L.rng((seed0 || 1) * 131 + fi);
    const cap = (board, hp) => { const res = R.evaluate(F, board, { momentum: 0 }); let v = 0; F.enemies.forEach((e, k) => { v += Math.min(res.en[k].dmg, hp[k]); }); return v; };
    const play = (tiles, hp, o) => { const sv = F.enemies.map(e => e.hp); F.enemies.forEach((e, k) => e.hp = hp[k]); const st = L.search(F, tiles, Object.assign({ momentum: 0, obj: 'dmg' }, o || {}), 'skilled', rnd, 0, 1, 0); F.enemies.forEach((e, k) => e.hp = sv[k]); return st; };
    const dmgs = (board, hp, o) => { const res = R.evaluate(F, board, Object.assign({ momentum: 0 }, o || {})); return res.en.map((e, k) => Math.min(e.dmg, hp[k])); };
    let hp = F.enemies.map(e => e.hp), tiles = bag;
    const s1 = play(tiles, hp), d1 = dmgs(s1.board, hp), V1 = d1.reduce((a, b) => a + b, 0); if (V1 <= 0) return;
    const used1 = placed(s1.board), u1 = {}; used1.forEach(t => u1[t.id] = 1);
    const hp2 = hp.map((h, k) => h - d1[k]), left1 = bag.filter(t => !u1[t.id]);
    const s2 = play(left1, hp2), d2 = dmgs(s2.board, hp2), V2 = d2.reduce((a, b) => a + b, 0);
    const u2 = {}; placed(s2.board).forEach(t => u2[t.id] = 1);
    const hp3 = hp2.map((h, k) => h - d2[k]), left2 = left1.filter(t => !u2[t.id]);
    const s3 = play(left2, hp3), V3 = dmgs(s3.board, hp3).reduce((a, b) => a + b, 0);
    /* wind: attack 2 from the whole bag again */
    const s2w = play(bag, hp2), V2w = dmgs(s2w.board, hp2).reduce((a, b) => a + b, 0);
    acc.wind.push(Math.max(0, V2w - V2) / (V1 + Math.max(V2w, V2)));
    acc.guard.push(V3 / (V1 + V2 + V3));
    const tot = V1 + V2;
    const sum = a => a.reduce((x, y) => x + y, 0);
    const rally = Math.max(sum(dmgs(s1.board, hp, { momentum: 1 })) - V1, sum(dmgs(s2.board, hp2, { momentum: 1 })) - V2, 0);
    acc.rally.push(rally / (tot + rally));
    let bp = 0, bo = 0;
    [[s1.board, hp], [s2.board, hp2]].forEach(([board, h]) => placed(board).forEach(t => {
      const base = sum(dmgs(board, h)); bp = Math.max(bp, sum(dmgs(board, h, { prism: t.id })) - base); bo = Math.max(bo, sum(dmgs(board, h, { over: t.id })) - base);
    }));
    acc.prism.push(bp / (tot + bp)); acc.overcharge.push(bo / (tot + bo));
  });
  const out = {}; Object.keys(acc).forEach(k => { out[k] = acc[k].reduce((a, b) => a + b, 0) / acc[k].length; }); return out;
}
/* Guard saves one enemy volley per fight: share of the hero's survivable damage (HP + two boss heals + two heal picks) one volley of the benchmark fights costs */
function guardShare() {
  let v = 0, n = 0; FIGHTS.forEach(f => { const { F } = mkFight({}, f); v += F.enemies.reduce((s, e) => s + (e.dead ? 0 : e.atk), 0); n++; });
  const lim = C.stages[9].heroHp * (1 + 2 * C.boss.heal + 2 * C.growHeal); return (v / n) / lim;
}
module.exports = { guardShare, heroScores, contrib, mkFight, FIGHTS, H, LAM, Vof };
if (require.main === module) {
  for (const [u, lv] of [['ember', 1], ['ember', 5], ['brand', 5], ['amber', 5], ['wisp', 5]]) for (const sd of [1, 2]) { const t0 = Date.now(); const r = contrib({ team: { [R.UNIT_BY_ID[u].c]: u }, levels: { [u]: lv }, measure: 'unit', unit: u, fxColour: R.UNIT_BY_ID[u].c }, sd); console.log(u, lv, 'seed', sd, r.tiles.map(x => x.toFixed(1)).join(','), 'fx', r.fx.toFixed(1), ((Date.now() - t0) / 1000).toFixed(1) + 's'); }
}
