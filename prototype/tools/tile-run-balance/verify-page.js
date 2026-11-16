'use strict';
/* Drives the real page with Playwright at 360x740: load, home, team, recruit, level up, and real fights (a greedy bot places tiles through the page's own hooks).
   Usage: node verify-page.js [outDir]    Reports console / page errors; saves screenshots. */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const out = process.argv[2] || '/tmp/claude-0/-home-user-tile-card-game-1/bb334f70-570e-5e5d-84e1-bc910ba9db14/scratchpad/bal/';
const URL = 'file://' + path.join(__dirname, '..', '..', 'samples', 'tile-run.html');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto(URL); await p.waitForTimeout(400);
  const shot = async n => { await p.waitForTimeout(150); await p.screenshot({ path: path.join(out, n + '.png') }); };
  await p.evaluate(() => TR.setSpeed(0.05));
  await shot('01-home');
  /* team screen, recruit, level up */
  await p.evaluate(() => TR.show('team')); await shot('02-team');
  const rec = await p.evaluate(() => { const s = TR.store(); s.coins = 300; s.shards = 60; const r = TR.pull(), r2 = TR.pull(); const u = Object.keys(s.units).filter(k => s.units[k].u)[0]; const lv = TR.levelUp(u); const bs = TR.buySlot(u); TR.show('team'); return { pulled: [r && r.unit.name, r2 && r2.unit.name], lv, bs, coins: s.coins, shards: s.shards }; });
  console.log('recruit/level:', JSON.stringify(rec)); await shot('03-team-after');
  /* real fights: low and high difficulty */
  const fight = async (areaIdx, label, boost) => {
    const res = await p.evaluate(async ({ areaIdx, boost }) => {
      const M = TR.mapData(), A = M.areas[M.order[areaIdx]], key = A.keys[0], st = TR.stageInfo(key), s = TR.store();
      if (s.run) { s.run = null; }
      if (boost) {
        TR.UNITS.forEach(u => { s.units[u.id].u = true; s.units[u.id].l = 5; });
        ['r', 'b', 'g', 'y', 'p'].forEach(c => { const uid = s.team[c], u = TR.UNITS_BY_ID[uid]; for (let i = 0; i < 3; i++) TR.buySlotFree && 0; });
        s.shards = 400; ['r', 'b', 'g', 'y', 'p'].forEach(c => { const uid = s.team[c]; for (let i = 0; i < TR.CONFIG.slotMax[TR.UNITS_BY_ID[uid].rar]; i++) { TR.buySlot(uid); TR.addCT({ c: c, k: 'a', d: i % 2 ? '<>' : '^', n: i % 2 ? 5 : 7, sh: 'o', rar: 1 }); const e = s.ct[s.ct.length - 1]; TR.toggleSlot(uid, e.id); } });
      }
      TR.startRun('stage', st.tier, { len: st.len, mid: st.mid, drop: st.drop, trick: st.trick, cell: { key: key, name: st.name, region: st.regionName, area: st.area, idx: st.idx, n: st.n } });
      const log = { tier: st.tier, fights: 0, attacks: 0, kills: 0, sand: 0, win: null };
      const S = TR.S, ev = TR.rules.evaluate;
      const tileOf = id => S.run.bag.filter(t => t.id === id)[0];
      for (let guard = 0; guard < 80 && S.run && !S.run.over; guard++) {
        if (S.run.pending) { const pd = S.run.pending; if (pd.type === 'cleared') { log.win = true; break; } if (pd.keep && !pd.keep.done) { /* skip keep */ } TR.takePick(0); continue; }
        if (!S.fs) { TR.chooseOffer(0); if (!S.fs) continue; }
        /* greedy placement through the page's own state */
        const F = S.fs.F, N = F.cols * F.rows; S.board = new Array(N).fill(-1);
        const avail = S.run.bag.filter(t => !t.rest);
        const boardTiles = () => S.board.map(id => id >= 0 ? tileOf(id) : null);
        const val = () => { const r = ev(F, boardTiles(), { momentum: S.fs.mom }); let v = 0; F.enemies.forEach((e, k) => { if (!e.dead) v += Math.min(r.en[k].dmg > 0 ? r.en[k].dmg : r.en[k].raw * 0.3, e.hp) + (r.en[k].kill ? e.hp * 0.5 : 0); }); return v; };
        let cur = 0, placed = {};
        const addBest = () => {
          let best = null;
          avail.forEach(t => { if (placed[t.id]) return; for (let a = 0; a < N; a++) { const cs = TR.rules.placeCells(t, a, F.cols, F.rows); if (!cs || cs.some(q => S.board[q] >= 0 || F.blocked.indexOf(q) >= 0 || F.tb === q)) continue; cs.forEach(q => S.board[q] = t.id); const v = val(); cs.forEach(q => S.board[q] = -1); if (v > cur + 1e-9 && (!best || v > best.v)) best = { v, t, cs }; } });
          if (!best) return false; best.cs.forEach(q => S.board[q] = best.t.id); placed[best.t.id] = 1; cur = best.v; return true;
        };
        for (let step = 0; step < N; step++) if (!addBest()) break;
        for (let pass = 0; pass < 2; pass++) {   /* local search: take a tile off and put the best one back */
          Object.keys(placed).map(Number).forEach(id => {
            const snap = S.board.slice(), sp = Object.assign({}, placed), sc = cur;
            S.board = S.board.map(x => x === id ? -1 : x); delete placed[id]; cur = val();
            if (!addBest() || cur <= sc + 1e-9) { S.board = snap; placed = sp; cur = sc; }
          });
        }
        if (!boardTiles().some(Boolean)) { log.stuck = (log.stuck || 0) + 1; if (log.stuck > 3) break; }
        TR.render();
        const r0 = ev(F, boardTiles(), { momentum: S.fs.mom }); log.sand += r0.marks.length; log.kills += r0.en.filter(x => x.kill).length; log.attacks++;
        if (window.__shot) await window.__shot('fight-' + log.attacks, log);
        await TR.attack();
        await new Promise(r => setTimeout(r, 60));
        if (!S.fs && !S.run.pending) { break; }
      }
      log.fightsWon = S.run ? S.run.fights : null; log.hp = S.run ? S.run.hp + '/' + S.run.maxHp : null;
      return log;
    }, { areaIdx, boost });
    console.log(label, JSON.stringify(res));
    await shot(label);
    return res;
  };
  /* take a screenshot at the first placed board: expose a hook */
  await p.exposeFunction('__shotNode', async (n) => { await p.screenshot({ path: path.join(out, n + '.png') }); });
  await p.evaluate(() => { window.__shot = async (n, log) => { if (log.attacks === 1 && !window.__done1) { window.__done1 = 1; await new Promise(r => setTimeout(r, 120)); await window.__shotNode('04-fight-board-' + log.tier); } }; });
  await fight(0, '05-low-fight-result', false);
  await p.evaluate(() => { window.__done1 = 0; TR.store().run = null; });
  await fight(7, '06-high-fight-result', true);
  await p.evaluate(() => { window.__done1 = 0; TR.store().run = null; });
  await fight(19, '08-tier10-fight-result', true);
  await p.evaluate(() => TR.show('home')); await shot('07-home-after');
  console.log('errors:', errs.length ? errs.join('\n') : 'none');
  await b.close();
})();
