'use strict';
/* Tile Run balance simulator: shared library.
   Loads the RULES block of prototype/samples/tile-run.html (never a copy), plays whole runs with a placement bot
   ("skilled": greedy + local search + hero use + sensible picks; "casual": single noisy greedy pass, random-ish picks). */
const fs = require('fs'), vm = require('vm'), path = require('path');
const HTML = process.env.TR_HTML || path.join(__dirname, '..', '..', 'samples', 'tile-run.html');

function loadRules(file) {
  const h = fs.readFileSync(file || HTML, 'utf8');
  const a = h.indexOf('/*RULES-START*/'), b = h.indexOf('/*RULES-END*/');
  const ctx = { Math: Object.create(Math), JSON, Object, Array, console };
  vm.createContext(ctx);
  const ea = h.indexOf('/*ENC-START*/'), eb = h.indexOf('/*ENC-END*/');   /* the encyclopedia (tile rarity stars); the rules default to 1 star without it */
  if (ea >= 0 && eb > ea) vm.runInContext(h.slice(ea, eb), ctx, { filename: 'tile-run-enc' });
  vm.runInContext(h.slice(a, b), ctx, { filename: 'tile-run-rules' });
  return ctx;
}
function rng(seed) { let a = seed | 0; return function () { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const R = loadRules();
const C = R.CONFIG;
/* TR_OVERRIDE=file.json (or inline JSON): numbers merged into CONFIG (and units: { id: { base, fx } }) so a tuning run needs no edit of the page */
(function () {
  const ov = process.env.TR_OVERRIDE; if (!ov) return;
  const o = JSON.parse(ov.trim().charAt(0) === '{' ? ov : fs.readFileSync(ov, 'utf8'));
  const merge = (t, s) => { for (const k in s) { if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k]) && t[k] && typeof t[k] === 'object') merge(t[k], s[k]); else t[k] = s[k]; } };
  if (o.units) { o.units.forEach(u => Object.assign(R.UNIT_BY_ID[u.id], u)); delete o.units; }
  if (o.effects) { for (const k in o.effects) Object.assign(R.EFFECTS[k], o.effects[k]); delete o.effects; }
  merge(C, o);
})();
const tok = s => { const p = R.parseTok(s); return { k: p.k, d: p.d, n: p.n, sh: p.sh }; };
/* a tile spec from a token like 'a^4' or 'pR1#h2', with optional rarity r, stars st, colour-rainbow rb */
const spec = (s, o) => Object.assign(tok(s), { rar: 0, st: 0 }, o || {});

/* ---------- objective used by the bot ---------- */
const WIN = 1e6;
function value(F, res, mode) {
  if (mode === 'dmg') { let v = 0; F.enemies.forEach((e, k) => { if (!e.dead) v += Math.min(res.en[k].dmg, e.hp); }); return v; }
  let v = 0, all = true;
  const twinDown = F.enemies.every(e => !e.twin || e.dead || res.en[F.enemies.indexOf(e)].kill);
  F.enemies.forEach((e, k) => {
    if (e.dead) return;
    const r = res.en[k], w = (e.kind === 'r' ? 0.2 : 1) * (e.atk + 2);
    const eff = r.dmg > 0 || r.raw === 0 ? r.dmg : r.raw * 0.3;      /* blocked by Guard / Aegis / 2-colour rule: partial credit so greedy keeps building */
    const d = Math.min(eff, e.hp);
    const kill = r.kill && (!e.twin || twinDown);
    v += w * d / e.hp + (kill ? w * 0.6 : 0);
    if (!kill && e.kind !== 'r') all = false;
  });
  return all ? v + WIN : v;
}
function sig(t) { return [t.c, t.c2 || '', t.rb ? 1 : 0, t.k, t.d, t.n, t.sh, t.rar || 0, t.up || 0].join('|'); }

/* ---------- placement search ---------- */
function search(F, tiles, opts, level, rnd, effort, passes, iters) {
  const cols = F.cols, Rw = F.rows, N = cols * Rw;
  const groups = {}, order = [];
  tiles.forEach(t => { const s = sig(t); if (!groups[s]) { groups[s] = []; order.push(s); } groups[s].push(t); });
  const usable = q => F.blocked.indexOf(q) < 0 && F.tb !== q;
  const anchorsOf = {};
  order.forEach(s => { const t = groups[s][0], l = []; for (let a = 0; a < N; a++) { const cs = R.placeCells(t, a, cols, Rw); if (cs && cs.every(usable)) l.push(cs); } anchorsOf[s] = l; });
  const evalB = b => value(F, R.evaluate(F, b, opts), opts.obj);
  const tryBoard = (board, cur, noise) => {
    /* add the best (tile, anchor) to the board; returns the new value or null */
    const left = {}; order.forEach(s => left[s] = groups[s].length); const onB = {};
    board.forEach(t => { if (t && !onB[t.id]) { onB[t.id] = 1; left[sig(t)]--; } });
    const cands = [];
    order.forEach(s => {
      if (left[s] <= 0) return; const t = groups[s][groups[s].length - left[s]];
      anchorsOf[s].forEach(cs => {
        if (cs.some(q => board[q])) return;
        cs.forEach(q => board[q] = t); const v = evalB(board); cs.forEach(q => board[q] = null);
        if (v > cur + 1e-9) cands.push({ v, t, cs });
      });
    });
    if (!cands.length) return null;
    cands.sort((a, b) => b.v - a.v);
    const pickC = noise && cands.length > 1 && rnd() < noise ? cands[Math.min(cands.length - 1, 1 + ((rnd() * 2) | 0))] : cands[0];
    pickC.cs.forEach(q => board[q] = pickC.t); return pickC.v;
  };
  const greedy = (noise) => {
    const board = new Array(N).fill(null); let cur = 0;
    for (;;) { const v = tryBoard(board, cur, noise); if (v === null) break; cur = v; if (cur >= WIN) break; }
    return { board, v: cur };
  };
  const ruin = (st, passes) => {
    for (let p = 0; p < passes; p++) {
      let improved = false;
      const placed = [], seen = {}; st.board.forEach(t => { if (t && !seen[t.id]) { seen[t.id] = 1; placed.push(t); } });
      for (let i = placed.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; const x = placed[i]; placed[i] = placed[j]; placed[j] = x; }
      for (const t of placed) {
        const snap = st.board.slice();
        st.board.forEach((x, q) => { if (x === t) st.board[q] = null; });
        const base = evalB(st.board), v = tryBoard(st.board, base, 0);
        if (v !== null && v > st.v + 1e-9) { st.v = v; improved = true; } else snap.forEach((x, q) => st.board[q] = x);
      }
      if (!improved) break;
    }
    return st;
  };
  /* simulated annealing from a start board: moves = relocate a tile, swap two tiles, replace by an unplaced tile, add, remove */
  const anneal = (st, iters) => {
    const board = st.board.slice(); let cur = evalB(board), bestV = cur, bestB = board.slice();
    const T0 = Math.max(1e-6, Math.abs(cur) * 0.04 + 1e-3);
    const sigsAll = order;
    const placedList = () => { const seen = {}, l = []; board.forEach(t => { if (t && !seen[t.id]) { seen[t.id] = 1; l.push(t); } }); return l; };
    for (let it = 0; it < iters; it++) {
      const T = T0 * (1 - it / iters) * (1 - it / iters) + 1e-9;
      const snap = board.slice(); const placed = placedList(); const r = rnd();
      const left = {}; sigsAll.forEach(sg => left[sg] = groups[sg].length); placed.forEach(t => left[sig(t)]--);
      const putAt = (t, cs) => cs.forEach(q => board[q] = t);
      const takeOut = t => { for (let q = 0; q < N; q++) if (board[q] === t) board[q] = null; };
      const randAnchor = t => { const l = anchorsOf[sig(t)].filter(cs => cs.every(q => !board[q])); return l.length ? l[(rnd() * l.length) | 0] : null; };
      let ok = true;
      if (r < 0.35 && placed.length) { const t = placed[(rnd() * placed.length) | 0]; takeOut(t); const cs = randAnchor(t); if (cs) putAt(t, cs); else ok = false; }
      else if (r < 0.6 && placed.length > 1) { const a = placed[(rnd() * placed.length) | 0], b = placed[(rnd() * placed.length) | 0]; if (a === b) ok = false; else {
        const ca = []; const cb = []; board.forEach((x, q) => { if (x === a) ca.push(q); else if (x === b) cb.push(q); });
        takeOut(a); takeOut(b);
        const fa = anchorsOf[sig(a)].filter(cs => cs.some(q => cb.indexOf(q) >= 0) && cs.every(q => !board[q])), fb = anchorsOf[sig(b)].filter(cs => cs.some(q => ca.indexOf(q) >= 0) && cs.every(q => !board[q]));
        if (fa.length) putAt(a, fa[(rnd() * fa.length) | 0]); else ok = false; if (ok) { const fb2 = fb.filter(cs => cs.every(q => !board[q])); if (fb2.length) putAt(b, fb2[(rnd() * fb2.length) | 0]); else ok = false; } } }
      else if (r < 0.8) { const un = sigsAll.filter(sg => left[sg] > 0); if (!un.length) ok = false; else { const sg = un[(rnd() * un.length) | 0], t = groups[sg][groups[sg].length - left[sg]];
        if (placed.length && rnd() < 0.6) { const o = placed[(rnd() * placed.length) | 0]; takeOut(o); }
        const cs = randAnchor(t); if (cs) putAt(t, cs); else ok = false; } }
      else if (r < 0.9 && placed.length) { takeOut(placed[(rnd() * placed.length) | 0]); }
      else ok = false;
      if (!ok) { snap.forEach((x, q) => board[q] = x); continue; }
      const v = evalB(board), d = v - cur;
      if (d >= 0 || rnd() < Math.exp(d / T)) { cur = v; if (v > bestV) { bestV = v; bestB = board.slice(); } } else snap.forEach((x, q) => board[q] = x);
    }
    return { board: bestB, v: bestV };
  };
  /* two-colour checkerboard templates: interior cells get the strongest tiles of the wanted colour (every interior tile is then sandwiched on both lines) */
  const tv = t => (t.k === 'a' ? t.n * Math.pow(R.laneOffsets(t.d).length, 0.7) * Math.pow(R.cellsOf(t).length, 0.8) : t.k === 'p' ? t.n * 2.2 : t.k === 'x' ? 6 : 3) + (t.rar || 0) * 0.1;
  const templates = () => {
    const cols_ = {}; tiles.forEach(t => { if (R.cellsOf(t).length !== 1 || t.c === 'x') return; (t.rb ? R.COLOR_IDS : [t.c, t.c2]).forEach(c => { if (c) (cols_[c] = cols_[c] || []).push(t); }); });
    const cs = Object.keys(cols_), out = [];
    const cells = []; for (let q = 0; q < N; q++) if (usable(q)) cells.push(q);
    const wt = q => { const r = (q / cols) | 0, c = q % cols; return ((c > 0 && c < cols - 1) ? 1 : 0) + ((r > 0 && r < Rw - 1) ? 1 : 0); };
    const sorted = cells.slice().sort((x, y) => wt(y) - wt(x));
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) for (let ph = 0; ph < 2; ph++) {
      const used = {}, board = new Array(N).fill(null);
      const pool = {}; [cs[i], cs[j]].forEach(c => pool[c] = cols_[c].slice().sort((x, y) => tv(y) - tv(x)));
      sorted.forEach(q => { const want = ((((q / cols) | 0) + (q % cols) + ph) % 2 === 0) ? cs[i] : cs[j]; const p = pool[want]; for (let k = 0; k < p.length; k++) if (!used[p[k].id]) { used[p[k].id] = 1; board[q] = p[k]; break; } });
      out.push(board);
    }
    return out;
  };
  let best;
  if (level === 'casual') { best = greedy(0.25); if (rnd() < 0.5) best = ruin(best, 1); }
  else {
    best = ruin(greedy(0), passes === undefined ? 3 : passes);
    { const tb = templates().map(b => ({ board: b, v: evalB(b) })).sort((x, y) => y.v - x.v).slice(0, 2); tb.forEach(x => { const r2 = ruin(x, 2); if (r2.v > best.v) best = r2; }); }
    if (iters) { const sa2 = anneal(best, iters); if (sa2.v > best.v) best = sa2; best = ruin(best, 1); }
    for (let r = 0; r < (effort === undefined ? 2 : effort) && best.v < WIN; r++) { const s2 = ruin(greedy(0.6), 3); if (s2.v > best.v) best = s2; }
  }
  return best;
}

/* ---------- running one fight ---------- */
function heroOptsFor(fs, mode, target) {
  const o = { momentum: fs.mom };
  if (mode === 'rally') o.momentum += 1; if (mode === 'prism') o.prism = target; if (mode === 'overcharge') o.over = target;
  return o;
}
function playFight(run, offer, level, rnd, stats) {
  const fs = R.startFight(run, offer, rnd), F = fs.F, brnd = stats.b || rnd; stats.fs = fs;
  let guard = 0, fightDmg = 0;
  const skilled = level === 'skilled';
  const casualHeroAt = brnd() < 0.35 ? ((brnd() * 3) | 0) : -1;
  for (;;) {
    if (++guard > 40) { run.hp = 0; return 'lose'; }
    const hero = fs.hero, hid = hero.id, canHero = hid && hero.uses < hero.max;
    let useHero = null, target = 0;
    const baseOpts = heroOptsFor(fs, null); if (run.obj) baseOpts.obj = run.obj;
    const waitingTiles = run.bag.filter(t => t.rest).length;
    /* Second Wind first: it changes which tiles exist */
    let st = null;
    if (canHero && hid === 'wind' && waitingTiles >= 3) {
      const without = search(F, R.available(run), baseOpts, level, brnd, stats.effort, stats.passes, stats.iters);
      const rested = run.bag.filter(t => t.rest);
      rested.forEach(t => t.rest = false);
      const withW = search(F, R.available(run), baseOpts, level, brnd, stats.effort, stats.passes, stats.iters);
      rested.forEach(t => t.rest = true);
      const want = skilled ? (!run.obj && withW.v >= WIN && without.v < WIN) || withW.v > without.v * (run.obj ? 1.1 : 1.4) : (casualHeroAt === fs.turn || (run.hp < run.maxHp * 0.4));
      if (want) { R.heroToggle(run, fs); st = withW; useHero = 'wind'; } else st = without;
    } else st = search(F, R.available(run), baseOpts, level, brnd, stats.effort, stats.passes, stats.iters);
    if (canHero && !useHero && hid !== 'wind') {
      const placed = []; const seen = {}; st.board.forEach(t => { if (t && !seen[t.id]) { seen[t.id] = 1; placed.push(t); } });
      const cur = st.v;
      let bestMode = null, bestV = cur, bestT = 0;
      if (hid === 'rally') { const v = value(F, R.evaluate(F, st.board, heroOptsFor(fs, 'rally')), run.obj); if (v > bestV) { bestV = v; bestMode = 'rally'; } }
      else if (hid === 'prism' || hid === 'overcharge') placed.forEach(t => { const v = value(F, R.evaluate(F, st.board, heroOptsFor(fs, hid, t.id)), run.obj); if (v > bestV) { bestV = v; bestMode = hid; bestT = t.id; } });
      else if (hid === 'guard') {
        const threat = F.enemies.reduce((s, e) => s + (e.dead ? 0 : e.atk), 0);
        if (cur < WIN && (skilled ? threat >= run.hp * 0.3 || threat >= run.maxHp * 0.25 : casualHeroAt === fs.turn || run.hp < run.maxHp * 0.4)) bestMode = 'guard';
      }
      if (bestMode && bestMode !== 'guard') {
        const flips = !run.obj && bestV >= WIN && cur < WIN, gainFrac = (bestV - cur) / Math.max(1e-9, cur);
        if (skilled ? (flips || (gainFrac > 0.12 && (offer.kind === 'boss' || offer.kind === 'elite' || run.hp < run.maxHp * 0.6))) : (casualHeroAt === fs.turn)) { useHero = bestMode; target = bestT; }
      } else if (bestMode === 'guard') useHero = 'guard';
      if (useHero) { R.heroToggle(run, fs); if (target) R.heroTarget(fs, target); }
    }
    const info = R.resolveAttack(run, fs, st.board, rnd);
    if (stats) { stats.attacks++; if (useHero) stats.hero++; }
    if (run.inv) {   /* measuring mode: the hero cannot die; count the damage the enemies deal */
      let d = 0; if (!info.guarded) info.hit.forEach(k => { d += F.enemies[k].atk; });
      fightDmg += d; run.hp = run.maxHp; info.lose = null;
      if (fightDmg >= run.maxHp && !info.win && !run.cap) {   /* this fight alone would have killed the hero: count the most it can cost and move on */
        stats.dmg = (stats.dmg || 0) + run.maxHp; F.phases = null; F.enemies.forEach(e => { e.dead = true; e.hp = 0; }); return fs;
      }
      if (info.win) stats.dmg = (stats.dmg || 0) + fightDmg;
    }
    if (run.cap && fs.turn >= run.cap && !info.win) return 'cap';
    if (info.lose) return 'lose';
    if (info.win) return fs;
  }
}

/* keep one tile after a boss: the candidate with the best printed value (rainbow first). mid = the mid-boss keep */
function takeKeep(run, fs, stats, mid) {
  const p = run.pending, k = p && p.keep; if (!k || k.done) return [];
  let bi = -1, bv = -1; k.cands.forEach((c, i) => { const v = (c.rb ? 100 : 0) + (c.k === 'a' ? c.n * Math.pow(R.laneOffsets(c.d).length, 0.8) * Math.pow(R.cellsOf(c).length, 0.7) : c.k === 'p' ? c.n * 3 : c.k === 'x' ? 12 : 8) + (c.rar || 0) * 0.5; if (v > bv) { bv = v; bi = i; } });
  const c = R.applyKeep(run, bi); stats.keeps = stats.keeps || []; if (c) stats.keeps.push(Object.assign({ mid: !!mid }, c)); return [];
}
/* ---------- a full run ---------- */
const RELIC_PRI = ['triple', 'big3', 'colourful', 'front', 'back2', 'boost1', 'copy2', 'forkown', 'bonus2', 'heal4', 'mom', 'twice'];
function playRun(run, level, rnd, stats) {
  const skilled = level === 'skilled';
  stats = stats || { attacks: 0, hero: 0 };
  const brnd = stats.b || rnd;
  let guard = 0;
  while (++guard < 200) {
    const offers = run.offers, hpF = run.hp / run.maxHp;
    let idx = 0;
    if (skilled) {
      const fights = offers.map((o, i) => [o, i]).filter(x => !x[0].node), nodes = offers.map((o, i) => [o, i]).filter(x => x[0].node);
      const rest = nodes.filter(x => x[0].node === 'rest')[0], forge = nodes.filter(x => x[0].node === 'forge')[0], treas = nodes.filter(x => x[0].node === 'treasure')[0];
      const elite = fights.filter(x => x[0].kind === 'elite')[0];
      if (rest && hpF < 0.6) idx = rest[1];
      else if (forge && hpF >= 0.5) idx = forge[1];
      else if (elite && hpF >= 0.55) idx = elite[1];
      else if (treas && hpF >= 0.5) idx = treas[1];
      else idx = (fights.filter(x => x[0].kind !== 'elite')[0] || fights[0] || nodes[0])[1];
    } else idx = (brnd() * offers.length) | 0;
    const o = offers[idx];
    if (o.node) {
      R.chooseNode(run, o.node, rnd);
      if (run.pending.type === 'forge') { const ps = run.pending.picks; if (!ps.length) { run.pending = null; run.offers = R.genOffers(run, rnd); } else R.applyPick(run, skilled ? 0 : (brnd() * ps.length) | 0, rnd); }
      else { run.pending = null; run.offers = R.genOffers(run, rnd); }
      continue;
    }
    const res = playFight(run, o, level, rnd, stats);
    if (res === 'lose') return { win: false, hp: 0, run, stats };
    const out = R.finishFight(run, res, rnd);
    if (out.cleared) { const kc = stats.keepPolicy ? takeKeep(run, res, stats) : []; return { win: true, hp: run.hp / run.maxHp, run, stats, keeps: stats.keeps }; }
    const p = run.pending;
    if (p.relicPicks) { const ids = p.relicPicks; const rid = skilled ? ids.slice().sort((a, b) => RELIC_PRI.indexOf(a) - RELIC_PRI.indexOf(b))[0] : ids[(brnd() * ids.length) | 0]; run.relics.push(rid); }
    const picks = p.picks; let k = 0;
    if (skilled) {
      const heal = picks.findIndex(x => x.type === 'heal'), tile = picks.findIndex(x => x.type === 'tile'), up = picks.findIndex(x => x.type === 'up');
      const hf = run.hp / run.maxHp;
      if (hf < 0.5) k = heal;
      else {
        const t = picks[tile] && picks[tile].tile, tv = t ? (t.k === 'a' ? t.n * (R.laneOffsets(t.d).length > 1 ? 1.4 : 1) * (R.cellsOf(t).length > 1 ? 1.3 : 1) : t.k === 'p' ? t.n * 3.5 : t.k === 'x' ? 8 : 6) : 0;
        const uv = picks[up] ? (picks[up].kind === 'n2' ? 2 * 2.2 : 3.5) : 0;
        k = tv >= uv ? tile : (up >= 0 ? up : tile);
        if (hf < 0.75 && tv < 5 && uv < 5) k = heal;
      }
    } else { const hf = run.hp / run.maxHp; k = hf < 0.55 && brnd() < 0.6 ? picks.findIndex(x => x.type === 'heal') : (brnd() * picks.length) | 0; }
    if (p.keep && !p.keep.done) { if (stats.keepPolicy) takeKeep(run, res, stats, true); else R.applyKeep(run, -1); }
    R.applyPick(run, k, rnd);
  }
  return { win: false, hp: 0, run, stats };
}

/* ---------- team and stage helpers ---------- */
/* team: { r: 'ember', ... } (missing colours get the starter), levels: { id: L } (default 1), slots: { id: [spec] }, colourless: [spec] */
function makeTeam(o) {
  o = o || {};
  const team = {}; R.UNITS.forEach(u => { if (C.starters.indexOf(u.id) >= 0) team[u.c] = u.id; });
  Object.assign(team, o.team || {});
  const units = {}; R.UNITS.forEach(u => units[u.id] = { l: (o.levels && (o.levels[u.id] || o.levels.all)) || 1 });
  const slots = {}; for (const id in (o.slots || {})) slots[id] = o.slots[id].map(s => { const sp = typeof s === 'string' ? spec(s) : s; return Object.assign({}, sp, { n: sp.n + sp.st * C.stars.bonus }); });
  const colourless = (o.colourless || []).map(s => typeof s === 'string' ? spec(s) : s);
  return { team, units, slots, colourless, hero: o.hero === undefined ? 'rally' : o.hero };
}
/* stage options for a map area (tier, run length, mid boss, trick from the stage index) */
function stageOpt(areaId, idx) {
  const M = R.mapData(), A = M.areas[areaId], st = M.stages[A.keys[idx % A.keys.length]];
  return { tier: A.tier, opt: { len: st.len, mid: st.mid, drop: st.drop, trick: st.trick, cell: { key: st.key } } };
}
/* o.inv: hero cannot die (damage is summed); o.edit(run): change the bag / fx after the run is built; o.scale: enemy HP factor of the tier; o.effort: bot restarts */
function simRun(T, tier, level, seed, opt, mode, x) {
  x = x || {};
  const rnd = rng(seed), brnd = rng(seed * 31 + 17);
  const o = Object.assign({}, opt || {}); o.slots = T.slots;
  const run = R.newRun(mode || 'stage', tier, T.team, T.units, T.colourless, rnd, T.hero, o);
  if (x.inv) run.inv = true;
  if (x.edit) x.edit(run);
  const st = { attacks: 0, hero: 0, dmg: 0, b: brnd, effort: x.effort, passes: x.passes };
  const r = playRun(run, level, rnd, st);
  r.stats = st; return r;
}
/* many runs: returns { win, hp (mean HP fraction left in wins), fights } */
function batch(T, tier, level, n, opt, seed0, mode, x) {
  let w = 0, hp = 0, fights = 0, att = 0, dmg = 0;
  for (let i = 0; i < n; i++) { const r = simRun(T, tier, level, (seed0 || 1) * 100003 + i * 7919 + tier, opt, mode, x); dmg += r.stats.dmg; if (r.win) { w++; hp += r.hp; } fights += r.run.fights; att += r.stats.attacks; }
  return { win: w / n, hp: w ? hp / w : 0, fights: fights / n, attacks: att / n, dmg: dmg / n, n };
}
/* ---------- recipes: plain JSON descriptions of a team (so workers can build them) ----------
   { team:{r:'brand',..}, lv:5, kit:true (fill every slot with the reference kit), slots:{unitId:[ {t:'a^7',rar,st,rb} ]}, colourless:[{t,rar,st}], hero:'rally',
     dropBase:[unitId, i], dropSlot:[unitId, i], dropColourless:i, noFx:['r'], scale:1 (enemy HP factor of the tier), }  */
const KIT = [{ t: 'a^7', rar: 1, st: 1 }, { t: 'a<>5', rar: 1, st: 1 }, { t: 'pudlr2', rar: 1, st: 1 }];
const KIT_CL = [{ t: 'a^8', rar: 1, st: 1 }, { t: 'a^8', rar: 1, st: 1 }, { t: 'pudlr3', rar: 1, st: 1 }];
const REF_TEAM = { r: 'brand', b: 'mist', g: 'thorn', y: 'spark', p: 'hex' };
function recipeTeam(rc) {
  const team = Object.assign({}, REF_TEAM, rc.team || {}), slots = {};
  const sp = x => spec(x.t, { rar: x.rar || 0, st: x.st || 0, rb: !!x.rb });
  for (const c in team) { const u = R.UNIT_BY_ID[team[c]], n = rc.kit === false ? 0 : C.slotMax[u.rar]; if (n) slots[u.id] = KIT.slice(0, n).map(sp); }
  for (const id in (rc.slots || {})) slots[id] = rc.slots[id].map(sp);
  const cl = (rc.colourless || KIT_CL).map(sp);
  const lv = {}; R.UNITS.forEach(u => lv[u.id] = (rc.levels && rc.levels[u.id]) || rc.lv || 5);
  return makeTeam({ team, levels: lv, slots, colourless: cl, hero: rc.hero === undefined ? 'rally' : rc.hero });
}
function recipeEdit(rc) {
  return run => {
    const rm = f => { const i = run.bag.findIndex(f); if (i >= 0) run.bag.splice(i, 1); };
    const nth = (f, n) => { let k = -1; return t => f(t) && ++k === n; };
    if (rc.dropBase) rm(nth(t => t.u === rc.dropBase[0] && !t.slot, rc.dropBase[1]));
    if (rc.dropSlot) rm(nth(t => t.u === rc.dropSlot[0] && t.slot, rc.dropSlot[1]));
    if (rc.dropColourless !== undefined) rm(nth(t => t.c === 'x', rc.dropColourless));
    (rc.noFx || []).forEach(c => delete run.fx[c]);
  };
}
/* run a recipe: N invulnerable (measuring) runs of the final area; returns mean damage taken per run, plus win-rate of the same team with a mortal hero if mortal */
function measure(rc, n, level, seed0) {
  const T = recipeTeam(rc), saved = C.stages[9].hp, o = stageOpt('top', 0).opt;
  C.stages[9].hp = saved * (rc.scale || 1);
  let dmg = 0, att = 0;
  try { for (let i = 0; i < n; i++) { const r = simRun(T, 10, level || 'skilled', (seed0 || 1) * 100003 + i * 7919, o, 'stage', { inv: true, edit: recipeEdit(rc) }); dmg += r.stats.dmg; att += r.stats.attacks; } }
  finally { C.stages[9].hp = saved; }
  return { dmg: dmg / n, att: att / n };
}
/* ---------- the capacity metric ----------
   A fixed list of seeded tier-10 fights (final boss phase 1 and phase 2, mid-boss, elite, normal). Each fight is scaled to a fixed enemy HP (lam0, set once per
   game version from the reference team) and the skilled bot plays T = 2 attacks with an unkillable hero. phi = share of the fight's HP removed in those attacks.
   The team's capacity is the weighted geometric mean of phi. A tile's score = 100 * ln(capacity with / without) / ln(1.25). */
const BENCH = [];
for (let i = 0; i < 3; i++) BENCH.push({ kind: 'boss', phase: 0, seed: 11 + i, won: 7, T: 2, w: 0.35 / 3 });
for (let i = 0; i < 3; i++) BENCH.push({ kind: 'boss', mid: true, seed: 21 + i, won: 4, T: 2, w: 0.2 / 3 });
for (let i = 0; i < 3; i++) BENCH.push({ kind: 'elite', seed: 31 + i, won: 5, T: 2, w: 0.25 / 3 });
for (let i = 0; i < 2; i++) BENCH.push({ kind: 'normal', seed: 41 + i, won: 5, T: 2, w: 0.2 / 2 });
/* extra tiles a run has gathered by the end (picks): the same for every team */
const RUNKIT = [{ c: 'r', t: 'a^6', rar: 1 }, { c: 'b', t: 'a<>4', rar: 1 }, { c: 'g', t: 'a^5', x: { up: 2 } }, { c: 'y', t: 'a^6', rar: 1 }, { c: 'p', t: 'a^5', x: { c2: 'b' } }];
function phiOf(rc, fsp, lam, Tover) {
  const T = recipeTeam(rc), rnd = rng(fsp.seed), brnd = rng(fsp.seed * 7 + 3), o = stageOpt('top', 0).opt;
  const run = R.newRun('stage', 10, T.team, T.units, T.colourless, rnd, T.hero, Object.assign({}, o, { slots: T.slots }));
  run.inv = true; run.cap = Tover || fsp.T; run.obj = 'dmg'; recipeEdit(rc)(run);
  if (rc.runkit !== false) RUNKIT.forEach(k => run.bag.push(R.mkTile(run, k.c, run.team[k.c], spec(k.t), Object.assign({ rar: k.rar || 0, added: true }, k.x || {}))));
  run.won = fsp.won;
  const off = R.genFight(run, fsp.kind, rnd, fsp.mid ? { mid: true, trick: R.midTrick(run) } : {});
  if (fsp.phase === 1 && off.F.phases && off.F.phases.length) { const ph = off.F.phases[0]; off.F.enemies = ph.enemies; off.F.tricks = ph.tricks; off.F.phases = null; R.initTricks(off.F, rnd); }
  else if (off.F.phases) off.F.phases = null;
  const sc = e => { e.hp = Math.max(1, Math.round(e.hp * lam)); e.max = e.hp; e.twin = 0; };
  off.F.enemies.forEach(sc); off.F.tricks = off.F.tricks.filter(t => t !== 'twin');   /* no revival: phi must be a smooth HP share */
  const tot = off.F.enemies.reduce((s, e) => s + e.hp, 0);
  const st = { attacks: 0, hero: 0, dmg: 0, b: brnd, passes: rc.passes === undefined ? 2 : rc.passes, effort: rc.effort === undefined ? 1 : rc.effort };
  playFight(run, off, 'skilled', rnd, st);
  const left = st.fs.F.enemies.reduce((s, e) => s + (e.dead ? 0 : Math.max(0, e.hp)), 0);
  return { phi: 1 - left / tot };
}
function capacity(rc, lam0) {
  let tot = 0; const per = [], phis = [];
  BENCH.forEach((f, i) => { const p = Math.max(0.02, phiOf(rc, f, lam0[i]).phi); phis.push(p); per.push(Math.log(p)); tot += f.w * Math.log(p); });
  return { ln: tot, per, phis };
}
/* lam0: per-fight enemy HP factor so that the reference team removes about 60% of the HP (one probe at 1.0, phi scales ~ 1/lam) */
function calibrate(rc) { return BENCH.map(f => { let lo = Math.log(0.3), hi = Math.log(30); for (let k = 0; k < 7; k++) { const m = (lo + hi) / 2; if (phiOf(rc, f, Math.exp(m)).phi > 0.6) lo = m; else hi = m; } return Math.exp((lo + hi) / 2); }); }
module.exports = { capacity, calibrate, phiOf, BENCH, RUNKIT, recipeTeam, recipeEdit, measure, KIT, KIT_CL, REF_TEAM, R, C, loadRules, rng, spec, tok, value, search, playRun, playFight, simRun, batch, makeTeam, stageOpt, WIN, HTML };
