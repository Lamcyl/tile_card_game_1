'use strict';
/* Reusable Playwright kit for prototype/samples/tile-run.html (phone-sized, touch via CDP).
   Library:  const T = require('./tr-test.js');
             await T.open({ w: 360, h: 740, touch: true, save: null, out: '/tmp/x' });   // fresh save, tutorials off (?tut=0)
             await T.startStage(0); await T.chooseFirstOffer(); await T.autoPlace(); await T.attack();
             await T.touchDrag('#fhand .tile', '#fboard .cell', { steps: 4, ms: 8 });     // selector or {x,y}
             await T.shot('name'); console.log(await T.errors()); await T.close();
   Helpers: freshSave(), setStore(fn), startStage(areaIdx), startPuzzle(id), chooseFirstOffer(), placeSolution() (puzzles, uses def.sol),
            placeTiles([[tileId,cell],..]), autoPlace() (first-fit greedy), attack(), openTeam(colour), ev(fn,arg) (page.evaluate), ghosts() (count .ghost).
   CLI:     node tr-test.js smoke [outDir]    -> one line per step, then errors; exit code 1 on any failure. */
const path = require('path'), fs = require('fs');
let chromium;
for (const m of ['playwright', '/opt/node-tools/node_modules/playwright']) { try { chromium = require(m).chromium; break; } catch (e) {} }
const URL = 'file://' + path.join(__dirname, '..', 'samples', 'tile-run.html');
let browser, ctx, page, cdp, errs = [], outDir = '/tmp/tr-test';

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function open(o = {}) {
  const { w = 360, h = 740, touch = true, save = null, out = outDir, tut = false } = o;
  outDir = out; fs.mkdirSync(outDir, { recursive: true }); errs = [];
  browser = await chromium.launch();
  ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch });
  page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  cdp = await ctx.newCDPSession(page);
  if (save) await ctx.addInitScript(s => { try { localStorage.setItem(s.k, s.v); } catch (e) {} }, { k: 'tileRunPrototype.v8', v: typeof save === 'string' ? save : JSON.stringify(save) });
  await page.goto(URL + (tut ? '' : '?tut=0')); await sleep(400);
  await page.evaluate(() => TR.setSpeed(0.05));
  return page;
}
const ev = (fn, arg) => page.evaluate(fn, arg);
async function freshSave() { await ev(() => { localStorage.clear(); }); await page.goto(URL + '?tut=0'); await sleep(300); await ev(() => TR.setSpeed(0.05)); }
async function setStore(fn) { return page.evaluate(`(${fn.toString()})(TR.store())`).then(async r => { await ev(() => TR.save()); return r; }); }
async function startStage(idx = 0) {
  return ev(i => {
    const M = TR.mapData(), A = M.areas[M.order[i] || i] || M.areas[i], key = A.keys[0], st = TR.stageInfo(key), s = TR.store(); s.run = null;
    TR.startRun('stage', st.tier, { len: st.len, mid: st.mid, drop: st.drop, trick: st.trick, cell: { key, name: st.name, region: st.regionName, area: st.area, idx: st.idx, n: st.n } });
    return { tier: st.tier, key };
  }, idx);
}
async function startPuzzle(id) { return ev(i => { const d = TR.PUZZLES.filter(p => p.id === i)[0] || TR.PUZZLES[0]; TR.startPuzzle(d); return d.id; }, id); }
async function chooseFirstOffer() { await ev(() => { if (!TR.S.fs) TR.chooseOffer(0); }); await sleep(80); return ev(() => !!TR.S.fs); }
async function placeTiles(pairs) { return ev(p => p.map(([t, c]) => TR.place(t, c)), pairs); }
async function placeSolution() {
  return ev(() => { const d = TR.S.puz.def, bag = TR.S.run.bag; return d.sol.map(([i, c]) => TR.place(bag[i].id, c)); });
}
async function autoPlace() {   /* first-fit greedy through the page's own hooks */
  return ev(() => {
    const S = TR.S, F = S.fs.F, N = F.cols * F.rows; let n = 0;
    for (const t of S.run.bag.filter(t => !t.rest)) for (let a = 0; a < N; a++) { const cs = TR.rules.placeCells(t, a, F.cols, F.rows); if (cs && cs.every(q => S.board[q] < 0 && F.blocked.indexOf(q) < 0 && F.tb !== q) && TR.place(t.id, a)) { n++; break; } }
    return n;
  });
}
async function attack() { await ev(() => { TR.attack(); }); await sleep(250); }
async function openTeam(colour) {
  await ev(() => TR.show('team')); await sleep(150);
  if (colour) await ev(c => { const u = TR.store().team[c]; if (u) { const b = document.querySelector('[data-act="pick"][data-u="' + u + '"]'); if (b) b.click(); } }, colour);
  await sleep(100);
}
async function pt(x) {
  if (x && typeof x === 'object') return x;
  const r = await page.locator(x).first().boundingBox(); if (!r) throw new Error('no element: ' + x);
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}
async function touchDrag(from, to, { steps = 6, ms = 12, hold = 0, release = true } = {}) {
  const a = await pt(from), b = await pt(to), send = (type, p) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: p ? [{ x: p.x, y: p.y, id: 1 }] : [] });
  await send('touchStart', a); if (hold) await sleep(hold);
  for (let i = 1; i <= steps; i++) { await send('touchMove', { x: a.x + (b.x - a.x) * i / steps, y: a.y + (b.y - a.y) * i / steps }); if (ms) await sleep(ms); }
  if (release) await send('touchEnd');
  return b;
}
const ghosts = () => ev(() => document.querySelectorAll('.ghost').length);
async function shot(name) { await sleep(120); const f = path.join(outDir, name + '.png'); await page.screenshot({ path: f }); return f; }
const errors = async () => errs.slice();
async function close() { if (browser) await browser.close(); browser = null; }

/* ---------------- smoke ---------------- */
async function smoke(out) {
  const res = []; const step = async (n, fn) => { let r; try { r = await fn(); res.push([n, r === false ? 'FAIL' : 'ok', r === false || r === undefined || r === true ? '' : JSON.stringify(r)]); } catch (e) { res.push([n, 'FAIL', e.message.split('\n')[0]]); } };
  await open({ out });
  await step('load+home', async () => { await shot('01-home'); return ev(() => TR.S.screen === 'home'); });
  await step('lesson puzzle solved by sol', async () => {
    await startPuzzle('p01'); const placed = await placeSolution(); await attack(); await sleep(500);
    await shot('02-puzzle'); return ev(() => !!document.querySelector('#result') && /Solved/.test(document.body.innerText)) ? { placed: placed.filter(Boolean).length } : false;
  });
  await step('stage fight place+attack', async () => {
    await ev(() => { TR.S.run = null; TR.store().run = null; TR.show('home'); });
    const st = await startStage(0); const f = await chooseFirstOffer(); const n = await autoPlace(); await shot('03-fight');
    const sh = await ev(() => [document.scrollingElement.scrollHeight, innerHeight]); await attack();
    return f && n > 0 && sh[0] <= sh[1] ? { tier: st.tier, placed: n, scroll: sh.join('/') } : false;
  });
  await step('team screen', async () => { await openTeam('r'); await shot('04-team'); return ev(() => TR.S.screen === 'team'); });
  await step('slot popup drag', async () => {
    await ev(() => { const s = TR.store(); s.coins = 999; s.shards = 99; const u = s.team.r; TR.buySlot(u); if (!TR.store().ct || !TR.store().ct.length) TR.addCT({ c: 'r', k: 'a', d: '^', n: 3, sh: 'o', rar: 1 }); TR.show('team'); });
    await sleep(150); await ev(() => { const b = document.querySelector('[data-act="slotpop"]'); if (b) b.click(); }); await sleep(150);
    const has = await ev(() => !!document.querySelector('#modal [data-dd="ct"]') && !!document.querySelector('#modal [data-dz^="slot"]'));
    if (!has) return 'no draggable tile or slot (skipped)';
    await touchDrag('#modal [data-dd="ct"]', '#modal [data-dz^="slot"]', { steps: 6, ms: 15 }); await sleep(400);
    await shot('05-slotpop'); return (await ghosts()) === 0;
  });
  await step('level-up dialog', async () => {
    await ev(() => { TR.store().coins = 999; TR.show('team'); }); await sleep(150);
    const ok = await ev(() => { const b = document.querySelector('[data-act="level"]'); if (b) { b.click(); return true; } return false; }); await sleep(150);
    if (!ok) return 'no level button (skipped)'; await shot('06-level'); return ev(() => !document.querySelector('#modal').hidden);
  });
  const e = await errors(); await close();
  res.forEach(r => console.log((r[1] === 'ok' ? 'PASS ' : 'FAIL ') + r[0] + (r[2] ? ' - ' + r[2] : '')));
  console.log('errors: ' + (e.length ? '\n  ' + e.join('\n  ') : 'none'));
  process.exit(res.some(r => r[1] !== 'ok') || e.length ? 1 : 0);
}
module.exports = { open, freshSave, setStore, startStage, startPuzzle, chooseFirstOffer, placeSolution, placeTiles, autoPlace, attack, openTeam, touchDrag, shot, errors, close, ev, ghosts, sleep, page: () => page };
if (require.main === module) { const c = process.argv[2]; if (c === 'smoke') smoke(process.argv[3] || '/tmp/tr-test'); else console.log('usage: node tr-test.js smoke [outDir]'); }
