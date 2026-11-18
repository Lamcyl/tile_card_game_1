'use strict';
/* Tile encyclopedia generator.  Usage: [TR_HTML=file] [ENC_STEPS=n] node encyclopedia.js
   Enumerates every tile the rules can express (attack lanes ^ < > <> <^ ^> <^>; boost / multiplier: every non-empty subset of u d l r plus R C B; copy u d l r;
   each in every SHAPE_CELLS shape that fits the 6x4 tier-10 board) and writes ENCYC into the page between the ENC-START and ENC-END markers (outside the RULES block).
   n (endgame number) = Epic budget at difficulty 10 without jitter, as genSpec:
     attack  round(attackBase[2] x lanePen[lanes] x cellBonus[cells])     boost  max(1, round(boostBase[2] x dirPen[dirs | R C B] x (1.2 if multi-cell)))
     multiplier multBase[2]     copy  copyBase[2]
   status: "in game" if genSpec produced it in a heavy seeded sample (tiers 1-10, rarities 0-2) or it is a unit base tile, else "variant (not in game)".
   colMax / totMax: tier-10 board, 6 columns x 4 rows, no blocked cells, one enemy per column with 1e9 HP.  The tile (any colour of r b g, any anchor) plus a helper pool
     (strikes of number 6 in r b g, one Epic boost (4 / 3 per budget, direction searched) and one x2 multiplier (direction searched)) fill the board; a seeded
     random-restart hill climb (moves: cell colour, swap, helper colour / direction, tile colour, tile anchor) maximises the marginal contribution
     damage(board) - damage(board without the tile): colMax = best on a single column, totMax = best summed over all columns (searched separately).
   score = 100 x totMax / (totMax + median totMax of all tiles): 50 = a typical tile, near 100 = the strongest (no cap, so tiles stay apart). refHP = mean total HP of the first-attack enemies of seeded tier-10 final-boss fights from genFight (won = 7).
   teamScore (unit base tiles) = min(100, 2.5 x share%) of results/v13u*.json at level 5 (best unit with that tile). Runs on all cores via worker_threads. */
const fs = require('fs'), path = require('path'), { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const L = require('./lib.js'), R = L.R, C = L.C;
const HTML = L.HTML, STEPS = +process.env.ENC_STEPS || 450, COLS = 6, ROWS = 4, N = COLS * ROWS, HP = 1e9;
const HC = ['r', 'b', 'g'], LANES = ['^', '<', '>', '<>', '<^', '^>', '<^>'];
const SHAPES = Object.keys(R.SHAPE_CELLS);

function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function subsets(s) { const o = []; for (let m = 1; m < 16; m++) { let d = ''; for (let i = 0; i < 4; i++) if (m & (1 << i)) d += s[i]; o.push(d); } return o; }
function epicN(k, d, sh) {
  const B = C.budget, cells = R.SHAPE_CELLS[sh].length;
  if (k === 'a') return Math.max(1, Math.round(B.attackBase[2] * B.lanePen[R.laneOffsets(d).length] * B.cellBonus[cells]));
  if (k === 'p') return Math.max(1, Math.round(B.boostBase[2] * B.dirPen[/[RCB]/.test(d) ? d : d.length] * (cells > 1 ? 1.2 : 1)));
  if (k === 'x') return B.multBase[2];
  return B.copyBase[2];
}
const tokOf = (k, d, n, sh) => k + d + n + (sh === 'o' ? '' : '#' + sh);
function fits(sh) { const t = { sh }; const dm = R.shapeDims(t); return dm[0] <= ROWS && dm[1] <= COLS; }

/* ---------------- search (worker side) ---------------- */
function mkRng(seed) { return L.rng(seed); }
function searchTile(spec, objective, seed, seedState) {
  const rnd = mkRng(seed), pi = n => (rnd() * n) | 0;
  const cells = R.SHAPE_CELLS[spec.sh], anchors = [];
  for (let a = 0; a < N; a++) if (R.placeCells({ sh: spec.sh }, a, COLS, ROWS)) anchors.push(a);
  const F = { cols: COLS, rows: ROWS, enemies: [], blocked: [], bonus: {}, tricks: [], colMul: {}, deadRow: -1, phases: null, tb: -1, tn: -1, sc: -1, sn: -1, fx: {}, relics: [] };
  for (let c = 0; c < COLS; c++) F.enemies.push(R.mkEnemy(c, 1, HP, 1, 'p'));
  let uid = 0; const mk = (c, k, d, n, sh) => ({ id: ++uid, c, k, d, n, sh: sh || 'o', rest: false });
  const strike = {}, boostN = d => Math.max(1, Math.round(C.budget.boostBase[2] * C.budget.dirPen[d.length] * 1)), bd = ['u', 'd', 'l', 'r', 'ud', 'lr'], md = ['u', 'd', 'l', 'r'];
  const tileObj = {}; HC.forEach(c => tileObj[c] = mk(c, spec.k, spec.d, spec.n, spec.sh));
  const sObj = (q, c) => (strike[q + c] = strike[q + c] || mk(c, 'a', '^', 6));
  const bObj = {}, mObj = {};
  const bo = (q, c, d) => (bObj[q + c + d] = bObj[q + c + d] || mk(c, 'p', d, boostN(d)));
  const mo = (q, c, d) => (mObj[q + c + d] = mObj[q + c + d] || mk(c, 'x', d, 2));
  /* state: a anchor, tc tile colour, h[q] 0 empty 1..3 strike colour 4 boost 5 mult, -1 under the tile; bc, mc helper colours, bdi, mdi directions */
  const tc = a => R.placeCells({ sh: spec.sh }, a, COLS, ROWS);
  function fresh() {
    const s = { a: anchors[pi(anchors.length)], tc: pi(3), h: new Array(N).fill(1), bc: pi(3), mc: pi(3), bdi: pi(bd.length), mdi: pi(md.length) };
    for (let q = 0; q < N; q++) s.h[q] = 1 + pi(3);
    s.h[(rnd() * N) | 0] = 4; for (;;) { const q = pi(N); if (s.h[q] !== 4) { s.h[q] = 5; break; } }
    fixup(s, true); return s;
  }
  /* re-impose: tile cells are -1; exactly one boost and one mult exist elsewhere */
  function fixup(s) {
    const own = tc(s.a), inT = {}; own.forEach(q => inT[q] = 1);
    let nb = 0, nm = 0;
    for (let q = 0; q < N; q++) {
      if (inT[q]) { s.h[q] = -1; continue; }
      if (s.h[q] === -1) s.h[q] = 1 + pi(3);
      if (s.h[q] === 4) { if (nb++) s.h[q] = 1 + pi(3); } else if (s.h[q] === 5) { if (nm++) s.h[q] = 1 + pi(3); }
    }
    const free = () => { for (let g = 0; g < 200; g++) { const q = pi(N); if (!inT[q] && s.h[q] >= 0 && s.h[q] <= 3) return q; } for (let q = 0; q < N; q++) if (!inT[q] && s.h[q] >= 0 && s.h[q] <= 3) return q; return -1; };
    if (!nb) { const q = free(); if (q >= 0) s.h[q] = 4; }
    if (!nm) { const q = free(); if (q >= 0) s.h[q] = 5; }
  }
  const dmg = (s, withTile) => {
    const b = new Array(N).fill(null);
    for (let q = 0; q < N; q++) { const v = s.h[q]; if (v >= 1 && v <= 3) b[q] = sObj(q, HC[v - 1]); else if (v === 4) b[q] = bo(q, HC[s.bc], bd[s.bdi]); else if (v === 5) b[q] = mo(q, HC[s.mc], md[s.mdi]); }
    if (withTile) { const t = tileObj[HC[s.tc]]; tc(s.a).forEach(q => b[q] = t); }
    const r = R.evaluate(F, b, { momentum: 0 }); return r.en.map(e => e.dmg);
  };
  const score = (s) => { const w = dmg(s, true), o = dmg(s, false); let v = 0; for (let k = 0; k < COLS; k++) { const d = w[k] - o[k]; v = objective === 'col' ? Math.max(v, d) : v + d; } return v; };
  let best = null, bestV = -1;
  const per = Math.max(1, Math.round(STEPS / 3)), isS = v => v >= 1 && v <= 3;
  for (let rs = 0; rs < 3; rs++) {
    let s = (rs === 0 && seedState) ? seedState : fresh(), v = score(s), lb = s, lv = v;
    for (let it = 0; it < per; it++) {
      const T = 0.12 * Math.max(10, lv) * (1 - it / per);
      const t = { a: s.a, tc: s.tc, h: s.h.slice(), bc: s.bc, mc: s.mc, bdi: s.bdi, mdi: s.mdi }, m = rnd();
      if (m < 0.25) { const q = pi(N); if (isS(t.h[q]) || t.h[q] === 0) t.h[q] = rnd() < 0.1 ? 0 : 1 + pi(3); else continue; }
      else if (m < 0.45) { const p = pi(N), q = pi(N); if (t.h[p] < 0 || t.h[q] < 0) continue; const x = t.h[p]; t.h[p] = t.h[q]; t.h[q] = x; }
      else if (m < 0.65) {   /* sandwich stamp: x y x along a row or a column */
        const x = 1 + pi(3), y = 1 + ((x + pi(2)) % 3), horiz = rnd() < 0.5, r = pi(ROWS), c = pi(COLS), st = horiz ? 1 : COLS;
        const qs = horiz ? (c + 2 < COLS ? [r * COLS + c, r * COLS + c + 1, r * COLS + c + 2] : null) : (r + 2 < ROWS ? [r * COLS + c, (r + 1) * COLS + c, (r + 2) * COLS + c] : null);
        if (!qs || qs.some(q => !(isS(t.h[q]) || t.h[q] === 0))) continue; t.h[qs[0]] = x; t.h[qs[1]] = y; t.h[qs[2]] = x;
      }
      else if (m < 0.72) t.tc = pi(3);
      else if (m < 0.78) t.bc = pi(3); else if (m < 0.83) t.mc = pi(3);
      else if (m < 0.88) t.bdi = pi(bd.length); else if (m < 0.92) t.mdi = pi(md.length);
      else if (m < 0.96) { const p = pi(N), q = pi(N); if (t.h[p] !== 4 && t.h[p] !== 5) continue; if (t.h[q] < 0) continue; const x = t.h[p]; t.h[p] = t.h[q]; t.h[q] = x; }
      else { const old = tc(t.a); t.a = anchors[pi(anchors.length)]; old.forEach(q => { t.h[q] = 1 + pi(3); }); fixup(t); }
      const tv = score(t); if (tv >= v || rnd() < Math.exp((tv - v) / Math.max(1e-6, T))) { s = t; v = tv; if (v > lv) { lv = v; lb = s; } }
    }
    if (lv > bestV) { bestV = lv; best = lb; }
  }
  /* output layout */
  const w = dmg(best, true), o = dmg(best, false), tcs = tc(best.a), inT = {}; tcs.forEach(q => inT[q] = 1);
  const lay = [];
  for (let q = 0; q < N; q++) { const v = best.h[q]; lay.push(inT[q] ? 'T' : v === 0 ? '.' : v <= 3 ? HC[v - 1] : v === 4 ? 'P' : 'X'); }
let sumD = 0, maxD = 0; w.forEach((x, k) => { sumD += x - o[k]; maxD = Math.max(maxD, x - o[k]); });
  return { v: Math.round(bestV), sumD: Math.round(sumD), maxD: Math.round(maxD), state: best, lay: { c: HC[best.tc], a: best.a, b: lay.join(''), p: HC[best.bc] + bd[best.bdi], x: HC[best.mc] + md[best.mdi], dm: w.map(Math.round), d0: o.map(Math.round) } };
}

if (!isMainThread) {
  const out = workerData.items.map(it => {
    const h = hashStr(it.token), A = searchTile(it, 'col', h ^ 0x9e3779b9), B = searchTile(it, 'tot', h ^ 0x85ebca6b, A.state), Cc = searchTile(it, 'col', h ^ 1, B.state), D = searchTile(it, 'tot', h ^ 2, Cc.state), runs = [A, B, Cc, D];
    const col = runs.reduce((x, y) => y.maxD > x.maxD ? y : x), tot = runs.reduce((x, y) => y.sumD > x.sumD ? y : x);
    return { token: it.token, colMax: col.maxD, totMax: tot.sumD, best: { col: col.lay, tot: tot.lay } };
  });
  parentPort.postMessage(out);
  return;
}

/* ---------------- main ---------------- */
(async () => {
  const t0 = Date.now();
  /* enumerate */
  const tiles = [], seen = {};
  const add = (k, d, sh) => {
    if (!fits(sh)) return; const n = epicN(k, d, sh), token = tokOf(k, d, n, sh); if (seen[token]) return; seen[token] = 1;
    const t = { k, d, n, sh }, cs = R.cellsOf(t), dm = R.shapeDims(t);
    tiles.push({ token, k, d, n, sh, name: R.tileName(t), size: dm[1] + '×' + dm[0], cells: cs.length, intro: R.specStage(t) });
  };
  SHAPES.forEach(sh => {
    LANES.forEach(d => add('a', d, sh));
    subsets('udlr').forEach(d => { add('p', d, sh); add('x', d, sh); });
    ['R', 'C', 'B'].forEach(d => { add('p', d, sh); add('x', d, sh); });
    ['u', 'd', 'l', 'r'].forEach(d => add('e', d, sh));
  });
  /* in game: heavy seeded genSpec sample */
  const gen = {}, rnd = L.rng(20240607);
  for (let st = 1; st <= 10; st++) for (let rar = 0; rar <= 2; rar++) for (let i = 0; i < 60000; i++) { const s = R.genSpec(rar, st, rnd); gen[s.k + s.d + (s.sh === 'o' ? '' : '#' + s.sh)] = 1; }
  const unitOf = {};
  R.UNITS.forEach(u => u.base.split(' ').forEach((tk, i) => { const p = R.parseTok(tk), key = p.k + p.d + (p.sh === 'o' ? '' : '#' + p.sh); (unitOf[key] = unitOf[key] || []).push({ id: u.id, i }); }));
  /* team scores */
  const team = {};
  fs.readdirSync(path.join(__dirname, 'results')).filter(f => /^v13u\d\.json$/.test(f)).forEach(f => { const j = JSON.parse(fs.readFileSync(path.join(__dirname, 'results', f), 'utf8')); for (const id in j.units) if (j.units[id][5]) team[id] = j.units[id][5].tiles; });
  tiles.forEach(t => {
    const key = t.k + t.d + (t.sh === 'o' ? '' : '#' + t.sh), us = unitOf[key] || [];
    t.units = us.map(x => x.id).filter((v, i, a) => a.indexOf(v) === i);
    t.status = gen[key] || us.length ? 'in game' : 'variant (not in game)';
    let ts = null; us.forEach(x => { const v = team[x.id] && team[x.id][x.i]; if (v !== undefined) { const sc = Math.min(100, Math.round(25 * v) / 10); if (ts === null || sc > ts) ts = sc; } });
    if (ts !== null) t.teamScore = ts;
  });
  /* reference HP */
  const hps = [], rr = L.rng(777);
  for (let i = 0; i < 40; i++) {
    const run = { stage: 10, won: 7, depth: 7, mode: 'stage', bossTrick: 'final', hp: 30, drop: null };
    const f = R.genFight(run, 'boss', rr, { trick: 'final' });
    hps.push(f.F.enemies.reduce((s, e) => s + e.max, 0));
  }
  const refHP = Math.round(hps.reduce((a, b) => a + b, 0) / hps.length);
  console.log('tiles', tiles.length, 'in game', tiles.filter(t => t.status === 'in game').length, 'refHP', refHP, '(first attack, tier-10 final boss, mean of 40)');
  /* search in parallel */
  const nw = Math.max(1, Math.min(require('os').cpus().length, 8)), chunks = Array.from({ length: nw }, () => []);
  tiles.forEach((t, i) => chunks[i % nw].push(t));
  const res = (await Promise.all(chunks.map(items => new Promise((ok, bad) => { const w = new Worker(__filename, { workerData: { items } }); w.on('message', ok); w.on('error', bad); })))).flat();
  const by = {}; res.forEach(r => by[r.token] = r);
  tiles.forEach(t => {
  const MED = (function () { const v = tiles.map(t => by[t.token].totMax).sort((x, y) => x - y); return v[Math.floor(v.length / 2)]; })();
    const r = by[t.token]; t.colMax = r.colMax; t.totMax = r.totMax; t.score = 100 * r.totMax / (r.totMax + MED); t.best = r.best;
    t.score = Math.round(t.score * 10) / 10;
  });
  const data = tiles.map(t => { const o = { token: t.token, kind: t.k, name: t.name, size: t.size, cells: t.cells, intro: t.intro, status: t.status, units: t.units, n: t.n, colMax: t.colMax, totMax: t.totMax, score: t.score }; if (t.teamScore !== undefined) o.teamScore = t.teamScore; o.best = t.best; return o; });
  const html = fs.readFileSync(HTML, 'utf8'), blob = '/*ENC-START*/var ENC_REF = ' + refHP + ';var ENCYC = ' + JSON.stringify(data) + ';/*ENC-END*/';
  let out, a = html.indexOf('/*ENC-START*/'), b = html.indexOf('/*ENC-END*/');
  if (a >= 0 && b > a) out = html.slice(0, a) + blob + html.slice(b + '/*ENC-END*/'.length);
  else { const r = html.indexOf('/*RULES-START*/'); out = html.slice(0, r) + blob + '\n' + html.slice(r); }
  fs.writeFileSync(HTML, out);
  fs.writeFileSync(path.join(__dirname, 'results', 'encyclopedia-summary.json'), JSON.stringify({ refHP, tiles: data.map(d => ({ token: d.token, name: d.name, size: d.size, status: d.status, n: d.n, colMax: d.colMax, totMax: d.totMax, score: d.score, teamScore: d.teamScore })) }));
  console.log('written', HTML, ((out.length - html.length) / 1024).toFixed(0) + ' KB delta;', ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  const s = data.slice().sort((x, y) => y.score - x.score), f = d => d.score + ' ' + d.name + ' ' + d.token + ' col ' + d.colMax + ' tot ' + d.totMax + ' ' + d.status;
  console.log('TOP\n' + s.slice(0, 10).map(f).join('\n') + '\nBOTTOM\n' + s.slice(-10).map(f).join('\n'));
})();
