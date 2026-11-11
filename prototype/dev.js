// Developer test page: enemy browser, custom battle builder and free editing of everything a battle reads.
// Uses the real battle screen (js/battle.js) with no world map. State lives under its own localStorage key, never the game save.
import './dev-boot.js';
import './theme.css';
import './world.css';
import './camp.css';
import './battle.css';
import './dev.css';
import './js/engine.js';
import './js/v2.js';
import './js/world-boot.js';
import './js/world-data.js';
import './js/art.js';
import './js/progress.js';
import './js/boss-defs.js';
import './js/gen.js';
import './js/fights.js';
import fightsArt from './data/fights/art-map.json';
import './js/battle.js';
import './js/items.js';
import './js/relics.js';
import { Design } from './design.js';

// V2 fights (tools/build-fights.mjs): 7 fights per sub-area, bundled with the page (no fetch).
const FIGHT_FILES = import.meta.glob('./data/fights/region-*.json', { eager: true, import: 'default' });

(function () {
  'use strict';
  const Fights = window.Fights;
  Fights.load(Object.keys(FIGHT_FILES).sort().map((k) => FIGHT_FILES[k]), fightsArt);
  const E = window.Engine, World = window.World, P = window.Progress, Gen = window.Gen, Items = window.Items, Relics = window.Relics, Defs = window.BossDefs, Battle = window.Battle;
  const KEY = 'tile-defense-dev-v1', PKEY = 'tile-defense-dev-presets-v1'; // never 'tile-defense-world-v4' (the game save)
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const num = (v, d) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? n : d; };
  const store = {
    get(k) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  };

  const SUBS = World.SUBAREAS, RARS = ['common', 'rare', 'epic', 'legendary'];
  const ORIG_U = Object.fromEntries(P.ROSTER.map((u) => [u.id, u.rarity])), ORIG_I = Object.fromEntries(Items.ALL.map((i) => [i.id, i.rarity]));
  const ROLES = ['basic', 'tough', 'armored', 'barrel', 'boss'], KINDS = Object.keys(E.ENEMY_KINDS), GIMMICKS = Object.keys(E.ENEMY_GIMMICKS);

  // ---------- State ----------
  function defaults() {
    const save = P.freshSave();
    save.bossesBeaten = SUBS.map((s) => s.id); save.unlocked = SUBS.map((s) => s.id); save.runs = 10;
    save.owned = P.ROSTER.map((u) => u.id); save.souls = 999; save.crystals = 99; save.dust = 99;
    return {
      save, run: { seed: 'dev', hp: null, hpBonus: 0, relics: [], mods: {}, reviveUsed: 0, gold: 0 }, seeds: {}, rar: { unit: {}, item: {} }, placement: {},
      custom: { sub: SUBS[0].id, level: 5, enemies: [], sel: [1, 2], bossRow: false, newFp: '1x1', warn: '' }, ui: { tab: 'enemies', open: {}, f: { q: '', rar: '', slot: '', owned: false } },
    };
  }
  function restore(data) {
    const d = defaults();
    if (!data || typeof data !== 'object') return d;
    const s = Object.assign({}, d, data);
    s.save = Object.assign(P.freshSave(), data.save || {}); s.run = Object.assign(d.run, data.run || {}); s.custom = Object.assign(d.custom, data.custom || {});
    s.ui = Object.assign(d.ui, data.ui || {}); s.ui.f = Object.assign(d.ui.f, (data.ui || {}).f || {}); s.rar = Object.assign({ unit: {}, item: {} }, data.rar || {});
    if (!SUBS.some((x) => x.id === s.custom.sub)) s.custom.sub = SUBS[0].id;
    s.save.squad = (s.save.squad || []).filter((id) => P.ROSTER_BY[id]);
    Items.migrate(s.save);
    return s;
  }
  let S = restore(store.get(KEY));
  const results = {}; // node id / 'custom' -> last result (this page visit only)
  let confirmReset = false, msg = '';
  const persist = () => store.set(KEY, S);

  // Unit and item rarity overrides (Command Point cost, colour, substat count): applied to the shared data before every use.
  function applyOverrides() {
    for (const id in ORIG_U) P.ROSTER_BY[id].rarity = RARS.includes(S.rar.unit[id]) ? S.rar.unit[id] : ORIG_U[id];
    for (const id in ORIG_I) Items.BY_ID[id].rarity = RARS.includes(S.rar.item[id]) ? S.rar.item[id] : ORIG_I[id];
  }

  // ---------- Battle launching ----------
  function runObj() { return { relics: S.run.relics.slice(), mods: S.run.mods, reviveUsed: S.run.reviveUsed, gold: S.run.gold }; }
  let current = null;
  function fight(key, title, subtitle, biome, gen) {
    applyOverrides();
    const save = S.save, run = runObj(), maxHp = Math.max(1, P.maxHp(save) + num(S.run.hpBonus, 0));
    const hp = S.run.hp == null || S.run.hp === '' ? maxHp : clamp(num(S.run.hp, maxHp), 1, 999);
    const stage = Object.assign({ heroHp: hp, heroMaxHp: Math.max(maxHp, hp), rules: P.rulesFor(save, run) }, P.heroStage(save), gen);
    current = key;
    document.body.classList.add('in-battle'); $('#dev-exit').hidden = false;
    Battle.start({ title, subtitle, stage, biome, army: P.buildArmy(save, S.run.mods), hero: P.heroOf(save), placement: S.placement, relics: run.relics, onEnd: (state, stars) => finish(state, stars) });
  }
  function leave() { S.placement = Battle.placement(); Battle.hide(); document.body.classList.remove('in-battle'); $('#dev-exit').hidden = true; persist(); }
  function finish(state, stars) {
    const key = current;
    leave();
    results[key] = { won: state.status === 'cleared', stars: stars || 0, turns: state.turn, dmg: state.damageTaken, hp: state.hp };
    if (chain && chain.key === key) { chainStep(key, state); return; }
    render();
  }
  $('#dev-exit').addEventListener('click', () => { leave(); results[current] = { quit: true }; if (chain && chain.key === current) { chain.over = 'aborted'; chain.key = null; S.ui.tab = 'fights'; } render(); });

  // ---------- Enemy browser ----------
  const genOpts = () => P.genOpts(S.save);
  const seedOf = (id) => S.seeds[id] || S.run.seed;
  const nodeName = (n, sub) => (n.type === 'boss' ? Defs.BOSSES[sub.bossDef].name : n.type === 'elite' ? Defs.ELITES[sub.bossDef].name : 'Skirmish ' + (Number(n.id.split('-').pop()) + 1));
  const typeName = (t) => (E.ENEMY_TYPES[t] ? E.ENEMY_TYPES[t].name : t);
  function summarize(enemies) {
    const by = {};
    for (const e of enemies) { const k = typeName(e.type) + (e.footprint ? ' ' + e.footprint : '') + (e.row === E.BOSS_ROW ? ' boss-row' : '') + (e.kind ? ' ' + E.ENEMY_KINDS[e.kind].badge + e.kind : '') + (e.gimmick ? ' ' + E.ENEMY_GIMMICKS[e.gimmick].badge + e.gimmick : '') + (e.guardian ? ' guard' : ''); by[k] = (by[k] || 0) + 1; }
    return Object.entries(by).map(([k, v]) => v + '× ' + k).join(', ');
  }
  function resultHtml(key) {
    const r = results[key]; if (!r) return '';
    if (r.quit) return '<span class="d-mini">left the fight</span>';
    return r.won ? '<span class="res-w">WIN ' + '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars) + '</span> <span class="d-mini">' + r.turns + ' turn' + (r.turns === 1 ? '' : 's') + ', -' + r.dmg + ' HP</span>' : '<span class="res-l">LOSE</span> <span class="d-mini">turn ' + r.turns + ', -' + r.dmg + ' HP</span>';
  }
  function nodeRow(n, sub) {
    const gen = Gen.generateBattle(n, seedOf(n.id), genOpts()), lv = Gen.scaled(n, genOpts()).level;
    const boss = n.type === 'boss', elite = n.type === 'elite', def = boss ? Defs.BOSSES[sub.bossDef] : elite ? Defs.ELITES[sub.bossDef] : null;
    const lead = gen.enemies.find((e) => e.gimmick && !e.guardian && e.gimmick !== 'regrow') || gen.enemies.find((e) => e.type.endsWith('_boss'));
    let extra = '';
    if (boss && lead) { const g = lead.gimmick ? E.ENEMY_GIMMICKS[lead.gimmick] : lead.kind ? E.ENEMY_KINDS[lead.kind] : null; if (g) extra = '<div class="d-mini">Gimmick: <b>' + g.badge + ' ' + esc(g.name) + '</b> ' + esc(lead.gimmick ? E.gimmickText(lead) : g.text) + '</div>'; }
    else if (elite && def) extra = '<div class="d-mini">' + esc(def.note || '') + '</div>';
    if (!boss && !elite) extra = '<div class="d-mini">Template: ' + esc(gen.template) + (gen.teach ? ' (' + esc(gen.teach) + ')' : '') + '</div>';
    const u = Items.UNIQUE_OF[n.id], drop = u ? '<div class="d-mini">Unique drop: <b class="rar-' + u.rarity + '">' + esc(Items.icon(u) + ' ' + u.name) + '</b> (' + u.rarity + ', ' + esc(Items.describe(u)) + ')</div>' : '';
    return '<div class="d-node"><div class="info"><span class="tag ' + n.type + '">' + (n.type === 'battle' ? 'normal' : n.type) + '</span><b>' + esc(nodeName(n, sub)) + '</b> Lv ' + lv + ' <span class="d-mini">seed ' + esc(seedOf(n.id)) + '</span> ' + resultHtml(n.id) +
      '<div class="d-mini">' + esc(summarize(gen.enemies)) + '</div>' + extra + drop + '</div>' +
      '<div class="d-row"><button class="primary" data-a="fight" data-id="' + n.id + '">Fight</button><button class="sm" data-a="reroll" data-id="' + n.id + '" title="New random seed for this fight">🎲</button><button class="sm" data-a="tobuilder" data-id="' + n.id + '" title="Copy into the custom builder">→ Builder</button></div></div>';
  }
  function tabEnemies() {
    let h = '<div class="d-card"><div class="d-row"><label>Seed <input type="text" data-c="seed" value="' + esc(S.run.seed) + '"></label><button class="sm" data-a="rerollall">🎲 Reroll all</button>' +
      '<button class="sm" data-a="clearseeds">Clear per-fight seeds</button></div><div class="d-mini">Generated fights depend on the seed (same seed = same fight). Heat / Descend (Camp tab) change them too. Per-fight 🎲 overrides the global seed for that spot.</div></div>';
    for (const region of World.REGIONS) {
      h += '<h3>' + esc(region) + '</h3>';
      for (const sub of SUBS.filter((s) => s.region === region)) {
        const nodes = World.nodes.filter((n) => n.sub === sub.id && ['battle', 'elite', 'boss'].includes(n.type)), open = !!S.ui.open[sub.id];
        h += '<details class="d-sub" data-sub="' + sub.id + '"' + (open ? ' open' : '') + '><summary>' + esc(sub.name) + ' <small>Lv ' + sub.lv[0] + '-' + sub.lv[1] + ', boss Lv ' + sub.bossLv + ', ' + esc(sub.biome) + ', ' + nodes.length + ' fights</small></summary><div class="body">' + (open ? nodes.map((n) => nodeRow(n, sub)).join('') : '') + '</div></details>';
      }
    }
    return h;
  }

  // ---------- Custom battle builder ----------
  const C = () => S.custom;
  // Builder enemies carry an optional footprint; a Big body occupies several tiles (anchor = front-left, depth grows toward the back, the boss row is row -1).
  const FPS = Object.keys(E.FOOTPRINTS);
  const fpOf = (e) => E.FOOTPRINTS[e.footprint || '1x1'];
  const coversAt = (e, r, c) => { const f = fpOf(e); return c >= e.col && c < e.col + f.w && r <= e.row && r > e.row - f.d; };
  const enemyAt = (r, c) => C().enemies.find((e) => coversAt(e, r, c));
  const rowName = (r) => (r === E.BOSS_ROW ? 'boss row' : r === 0 ? 'back' : 'front');
  function defaultsFor(role, L) {
    const base = 2.2 + L * 0.95, ramp = L > 7 ? 1 + 0.07 * (L - 7) : 1, atk = Math.round(1.5 + L * 0.42) + (L > 7 ? Math.floor((L - 7) * 0.35) : 0);
    if (role === 'barrel') return { hp: 1, atk: 0, armor: 0 };
    const m = { basic: [1, 0, 0], tough: [1.4, L >= 5 ? 1 : 0, 0], armored: [0.9, 0, L >= 9 ? 2 : 1], boss: [3.5, 1, 0] }[role];
    return { hp: Math.max(1, Math.round(base * ramp * m[0])), atk: Math.max(1, atk + m[1]), armor: m[2] };
  }
  // HP and ATK of a role at the level, scaled by the footprint budget (DESIGN_V2 10.5). Barrels stay 1x1.
  function statsFor(role, fp, L) {
    const d = defaultsFor(role, L);
    if (role === 'barrel' || fp === '1x1') return d;
    const b = E.applyBudget(fp, d.hp, d.atk);
    return Object.assign(d, { hp: b.hp, atk: b.atk });
  }
  function addEnemy(role, kind) {
    const [r, c] = C().sel; if (enemyAt(r, c)) return;
    const fp = role === 'barrel' ? '1x1' : C().newFp || '1x1';
    const e = Object.assign({ role, kind: kind || '', gimmick: '', gp: 0, guardian: false, row: r, col: c, footprint: fp }, statsFor(role, fp, C().level));
    const problems = E.validateLayout(C().enemies.concat(e));
    if (problems.length) { C().warn = 'Cannot place a ' + fp + ' here: ' + problems[0].replace(/^enemy \d+ ?/, ''); return; }
    C().warn = ''; C().enemies.push(e);
  }
  function buildCustom() {
    const sub = C().sub;
    const enemies = C().enemies.map((e) => {
      const o = { type: e.vt || sub + '_' + e.role, row: e.row, col: e.col, hp: e.role === 'barrel' ? 1 : Math.max(1, e.hp), atk: e.role === 'barrel' ? 0 : Math.max(0, e.atk), armor: e.armor || 0 };
      if (e.footprint && e.footprint !== '1x1' && e.role !== 'barrel') o.footprint = e.footprint;
      if (e.kind) o.kind = e.kind;
      if (e.gimmick) { o.gimmick = e.gimmick; o.gp = e.gp || 0; }
      if (e.guardian) o.guardian = true;
      if (e.mn) o.minion = Object.assign({}, e.mn);
      else if (e.kind === 'splitter') o.minion = { type: sub + '_basic', hp: 1, atk: Math.max(1, Math.round(o.atk * 0.6)) };
      else if (e.kind === 'summoner') o.minion = { type: sub + '_basic', hp: Math.max(2, Math.round(o.hp * 0.4)), atk: Math.max(1, Math.round(o.atk * 0.6)) };
      return o;
    });
    return Object.assign({ enemies, template: 'custom' }, C().bossRow ? { bossRow: true } : null);
  }
  function loadIntoBuilder(id) {
    const n = World.byId[id], gen = Gen.generateBattle(n, seedOf(id), genOpts());
    C().sub = n.sub; C().level = Gen.scaled(n, genOpts()).level;
    C().bossRow = !!gen.bossRow; C().warn = '';
    C().enemies = gen.enemies.map((e) => ({ role: e.type.slice(n.sub.length + 1), footprint: e.footprint || '1x1', kind: e.kind || '', gimmick: e.gimmick || '', gp: e.gp || 0, guardian: !!e.guardian, row: e.row, col: e.col, hp: e.hp, atk: e.atk, armor: e.armor || 0 }));
    S.ui.tab = 'builder';
  }
  const opt = (list, cur) => list.map((v) => { const [val, label] = Array.isArray(v) ? v : [v, v]; return '<option value="' + esc(val) + '"' + (String(val) === String(cur) ? ' selected' : '') + '>' + esc(label) + '</option>'; }).join('');
  function tabBuilder() {
    const c = C(), sub = SUBS.find((s) => s.id === c.sub);
    let h = '<div class="d-card"><div class="d-row"><label>Sub-area (creatures, backdrop) <select data-c="csub">' + opt(SUBS.map((s) => [s.id, s.region + ': ' + s.name]), c.sub) + '</select></label>' +
      '<label>Level <input type="number" min="1" max="55" data-c="clevel" value="' + c.level + '"></label></div>' +
      '<div class="d-row"><label><input type="checkbox" data-c="cbossrow"' + (c.bossRow ? ' checked' : '') + '> Boss row (third row behind the others; hit only through a column with no enemy in rows 1-2)</label></div>' +
      '<div class="d-mini">Boss row and back row on top, front row below (your side is at the bottom). Tap a tile, then add an enemy. Big bodies (2x1, 1x2, 2x2, 3x1) grow right and back from the front-left tile. Stats start from the level\'s curve and the footprint budget; edit them freely.</div>';
    const top = c.bossRow ? E.BOSS_ROW : 0, nrows = 2 - top;
    h += '<div class="d-board" style="grid-template-rows: repeat(' + nrows + ', minmax(62px, auto))">';
    for (let r = top; r < 2; r++) for (let col = 0; col < 5; col++) {
      const e = enemyAt(r, col), sel = c.sel[0] === r && c.sel[1] === col;
      const f = e ? fpOf(e) : { w: 1, d: 1 };
      if (e && (e.row !== r || e.col !== col)) continue; // covered by a Big body drawn once at its anchor
      const place = 'grid-column: ' + (col + 1) + ' / span ' + f.w + '; grid-row: ' + (r - f.d + 1 - top + 1) + ' / span ' + f.d + ';';
      const selBody = e && c.sel[0] !== undefined && enemyAt(c.sel[0], c.sel[1]) === e;
      h += '<button class="' + (sel || selBody ? 'sel' : '') + (e && f.w * f.d > 1 ? ' big' : '') + '" style="' + place + '" data-a="csel" data-r="' + r + '" data-col="' + col + '">' + (e ? (E.ENEMY_TYPES[e.vt || sub.id + '_' + e.role] || {}).icon + '<br>' + e.role + (e.footprint && e.footprint !== '1x1' ? ' ' + e.footprint : '') + (e.kind ? ' ' + E.ENEMY_KINDS[e.kind].badge : '') + (e.gimmick ? ' ' + E.ENEMY_GIMMICKS[e.gimmick].badge : '') + '<br>' + (e.role === 'barrel' ? 'barrel' : e.hp + 'hp ' + e.atk + 'atk' + (f.w > 1 ? '×' + f.w : '')) : '<span class="d-mini">' + (r === E.BOSS_ROW ? 'boss row' : 'empty') + '</span>') + '</button>';
    }
    h += '</div>';
    if (c.warn) h += '<div class="d-mini"><b>' + esc(c.warn) + '</b></div>';
    const e = enemyAt(c.sel[0], c.sel[1]);
    if (!e) {
      h += '<h4>Add to tile ' + rowName(c.sel[0]) + ' ' + (c.sel[1] + 1) + '</h4><div class="d-row"><label>Footprint <select data-c="cnewfp">' + opt(FPS, c.newFp) + '</select></label></div><div class="d-chips">' + ROLES.map((r) => '<button class="sm" data-a="cadd" data-role="' + r + '">' + r + '</button>').join('') +
        KINDS.map((k) => '<button class="sm" data-a="cadd" data-role="basic" data-kind="' + k + '">' + E.ENEMY_KINDS[k].badge + ' ' + k + '</button>').join('') + '</div>';
    } else {
      const f = (label, key, extra) => '<label>' + label + ' <input type="number" min="0" max="999" data-c="cfield" data-k="' + key + '" value="' + e[key] + '"' + (extra || '') + '></label>';
      h += '<h4>Edit ' + (e.footprint && e.footprint !== '1x1' ? e.footprint + ' ' : '') + 'tile ' + rowName(e.row) + ' ' + (e.col + 1) + '</h4><div class="d-row"><label>Type <select data-c="cfield" data-k="role">' + opt(ROLES, e.role) + '</select></label>' +
        '<label>Footprint <select data-c="cfield" data-k="footprint">' + opt(FPS, e.footprint || '1x1') + '</select></label>' +
        '<label>Kind <select data-c="cfield" data-k="kind">' + opt([['', 'none']].concat(KINDS.map((k) => [k, k])), e.kind) + '</select></label>' +
        '<label>Gimmick <select data-c="cfield" data-k="gimmick">' + opt([['', 'none']].concat(GIMMICKS.map((k) => [k, k])), e.gimmick) + '</select></label></div>' +
        '<div class="d-row">' + f('HP', 'hp') + f('ATK per lane', 'atk') + f('Armor', 'armor') + f('Gimmick N', 'gp') + '<label><input type="checkbox" data-c="cguard"' + (e.guardian ? ' checked' : '') + '> guard escort</label></div>' +
        '<div class="d-row"><button class="sm" data-a="cauto">Reset stats to level</button><button class="sm danger" data-a="cdel">Remove</button></div>' +
        '<div class="d-mini">' + (fpOf(e).w > 1 ? 'Strikes once per covered column (' + fpOf(e).w + ' lanes). ' : '') + (e.kind ? esc(E.ENEMY_KINDS[e.kind].name + ': ' + E.ENEMY_KINDS[e.kind].text) + '. ' : '') + (e.gimmick ? esc(E.ENEMY_GIMMICKS[e.gimmick].name + ': ' + E.ENEMY_GIMMICKS[e.gimmick].text.replace('{n}', e.gp)) : '') + '</div>';
    }
    h += '<div class="d-row"><button class="primary" data-a="cfight"' + (c.enemies.length ? '' : ' disabled') + '>Fight custom battle</button><button class="sm danger" data-a="cclear">Clear board</button> ' + resultHtml('custom') + '</div></div>';
    return h;
  }

  // ---------- V2 fights (data/fights, tools/build-fights.mjs) ----------
  // 7 fights per sub-area (intro, intro II, combine, combine II, pre-elite, elite, boss) for all 100 sub-areas, with the real monster names over placeholder drawings.
  const FV = () => S.ui.fv || (S.ui.fv = { region: Fights.regions[0].id, open: {}, rest: false, ref: null });
  let chain = null, lastChain = null; // the mini-run in progress, and the summary of the last one
  const chip = (el) => (el ? '<span class="chip el-' + esc(el) + '">' + esc(el) + '</span>' : '');
  const STEP_TAG = { intro: 'normal', intro2: 'normal', combine: 'normal', combine2: 'normal', preelite: 'normal', elite: 'elite', boss: 'boss' };
  const V2_BUILDER_ROLE = { basic: 'basic', weak: 'basic', healer: 'basic', splitter: 'basic', summoner: 'basic', head: 'basic', tough: 'tough', heavy: 'tough', guard: 'tough', armored: 'armored', bulwark: 'armored', barrel: 'barrel', elite: 'boss', boss: 'boss' };
  function v2Lines(f) {
    const groups = new Map();
    for (const e of f.enemies) {
      const key = [e.mon, e.variant || '', e.element || '', e.role, e.fp || '1x1', e.kind || '', e.gimmick || '', e.r === E.BOSS_ROW ? 'row' : ''].join('|');
      const g = groups.get(key) || { e, n: 0 }; g.n++; groups.set(key, g);
    }
    return [...groups.values()].map(({ e, n }) => {
      const kind = e.kind ? E.ENEMY_KINDS[e.kind] : null, gim = e.gimmick ? E.ENEMY_GIMMICKS[e.gimmick] : null;
      return '<div class="fv-en">' + n + '× <b>' + esc(e.mon) + '</b>' + (e.variant ? ' <span class="d-mini">(' + esc(e.variant) + ')</span>' : '') + ' ' + chip(e.element) + (e.flavour ? '<span class="tag">' + esc(e.flavour) + '</span>' : '') +
        ' <span class="tag">' + esc(kind ? kind.badge + ' ' + kind.name : e.role) + '</span>' + (gim ? '<span class="tag">' + gim.badge + ' ' + esc(gim.name) + (e.gp && ['ward', 'veil', 'gaze', 'harden'].includes(e.gimmick) ? ' ' + e.gp : '') + '</span>' : '') +
        ((e.fp && e.fp !== '1x1') ? '<span class="tag">' + e.fp + '</span>' : '') + (e.r === E.BOSS_ROW ? '<span class="tag">boss row</span>' : '') + (e.guardian ? '<span class="tag">♜ guard</span>' : '') +
        (e.role === 'barrel' ? '' : ' <span class="d-mini">' + e.hp + ' HP · ' + e.atk + ' ATK' + (e.armor ? ' · armor ' + e.armor : '') + '</span>') + ((e.inert || []).map((k) => '<span class="tag inert" title="Engine rule not built yet: inert tag">' + esc(k) + '</span>').join('')) + '</div>';
    }).join('');
  }
  function v2Row(f) {
    const key = 'v2:' + f.id, gridRows = (f.bossRow ? [f.layout.top] : []).concat([f.layout.back, f.layout.front]);
    return '<div class="d-node fv-fight"><div class="info"><span class="tag ' + STEP_TAG[f.step] + '">' + (f.n) + '. ' + f.step + '</span><b>' + esc(f.name) + '</b> Lv ' + f.level + ' ' + resultHtml(key) +
      '<div class="fv-lines">' + v2Lines(f) + '</div><pre class="fv-grid" title="Layout: boss row (if any), back row, front row. b basic, w weak, t tough, h heavy, a armored, k bulwark, m healer, s splitter, u summoner, x barrel, E elite, B boss, G guard, H head">' + gridRows.join('\n') + '</pre>' +
      (f.step === 'boss' && f.gimmickText ? '<div class="d-mini">Trick: ' + esc(f.gimmickText) + (f.approx ? ' <i>(engine gimmick: ' + esc(f.approx) + ')</i>' : '') + '</div>' : f.note ? '<div class="d-mini">' + esc(f.note) + '</div>' : '') + '</div>' +
      '<div class="d-row"><button class="primary" data-a="fvfight" data-id="' + f.id + '">Fight</button><button class="sm" data-a="fvref" data-lv="' + f.level + '" title="Set the dev squad and stats to the reference squad of Lv ' + f.level + '">Ref Lv ' + f.level + '</button><button class="sm" data-a="fvbuilder" data-id="' + f.id + '" title="Copy into the custom builder">→ Builder</button></div></div>';
  }
  function v2SubBody(sub) {
    const lv = sub.levels, refLv = lv.ordinary[1];
    return '<div class="d-mini"><b>Landmark:</b> ' + esc(sub.landmark) + '</div><div class="d-mini"><b>Arc:</b> ' + esc(sub.arc) + '</div>' +
      '<div class="d-row"><button class="primary" data-a="fvplay" data-id="' + sub.id + '">▶ Play sub-area (7 fights)</button><button class="sm" data-a="fvref" data-lv="' + refLv + '">Reference squad for Lv ' + refLv + '</button></div>' +
      sub.fights.map(v2Row).join('');
  }
  function refInfo() {
    const L = FV().ref; if (!L) return 'No reference applied: your own squad and stats are used.';
    const r = Fights.reference(L, P);
    return 'Reference squad Lv ' + L + ' applied: ' + r.squad.length + ' units, ' + r.hit + ' damage per attacker hit, Shield block ' + r.block + ', hero HP ' + r.hp + '. You can still edit everything in Team, Camp, Gear and Run.';
  }
  function v2Intro(f) {
    if (f.step === 'boss') {
      const b = f.enemies.find((e) => e.role === 'boss'), g = b.gimmick ? E.ENEMY_GIMMICKS[b.gimmick] : b.kind ? E.ENEMY_KINDS[b.kind] : null;
      return { intro: { name: b.mon, rule: g ? g.name : '', badge: g ? g.badge : '', text: (f.gimmickText || '') + (f.approx ? ' (engine rule used: ' + f.approx + ')' : '') } };
    }
    if (f.step === 'elite') { const b = f.enemies.find((e) => e.role === 'elite'); return { intro: { name: b.mon, rule: 'Elite', badge: '', text: f.note || 'An elite.' } }; }
    return null;
  }
  function launchV2(f, extra) {
    const sub = Fights.sub(f.sub);
    fight('v2:' + f.id, f.name, sub.name + ' · Lv' + f.level, sub.biome, Object.assign(Fights.stage(f), v2Intro(f), extra || {}));
  }
  function applyRef(L) {
    const ref = Fights.reference(L, P), save = S.save;
    save.squad = ref.squad.slice(); save.upgrades = Object.assign({}, ref.upgrades); save.hero = null; save.units = {}; save.loadout = Items.emptyLoadout(); save.heat = []; save.descend = 0;
    S.run.mods = JSON.parse(JSON.stringify(ref.mods)); S.run.relics = []; S.run.hp = null; S.run.reviveUsed = 0; S.run.hpBonus = ref.hp - P.maxHp(save);
    FV().ref = L;
  }
  function v2ToBuilder(id) {
    const f = Fights.byId(id), sub = Fights.sub(f.sub), st = Fights.stage(f), bsub = SUBS.find((x) => x.biome === sub.biome) || SUBS[0];
    C().sub = bsub.id; C().level = f.level; C().bossRow = !!f.bossRow; C().warn = ''; C().sel = [1, 2];
    C().enemies = st.enemies.map((o) => ({ role: V2_BUILDER_ROLE[f.enemies[st.enemies.indexOf(o)].role] || 'basic', vt: o.type, mn: o.minion || null, footprint: o.footprint || '1x1', kind: o.kind || '', gimmick: o.gimmick || '', gp: o.gp || 0, guardian: !!o.guardian, row: o.row, col: o.col, hp: o.hp, atk: o.atk, armor: o.armor || 0 }));
    S.ui.tab = 'builder';
  }
  // Mini-run: the 7 fights of a sub-area in order with the hero's HP carried over.
  function startChain(subId) {
    const sub = Fights.sub(subId), maxHp = Math.max(1, P.maxHp(S.save) + num(S.run.hpBonus, 0)), hp = S.run.hp == null || S.run.hp === '' ? maxHp : clamp(num(S.run.hp, maxHp), 1, 999);
    chain = { sub: subId, idx: 0, hp, maxHp: Math.max(maxHp, hp), start: hp, rows: [], key: null, over: null, rest: FV().rest }; lastChain = null;
    chainLaunch();
  }
  function chainLaunch() {
    const f = Fights.sub(chain.sub).fights[chain.idx];
    chain.key = 'v2:' + f.id;
    launchV2(f, { heroHp: chain.hp, heroMaxHp: chain.maxHp });
  }
  function chainStep(key, state) {
    const sub = Fights.sub(chain.sub), f = sub.fights[chain.idx], won = state.status === 'cleared';
    chain.rows.push({ name: f.name, level: f.level, won, turns: state.turn, dmg: state.damageTaken, hp: state.hp, stars: results[key].stars });
    chain.key = null; S.ui.tab = 'fights'; FV().region = sub.regionId; FV().open[chain.sub] = true;
    if (!won) { chain.over = 'lost'; lastChain = chain; chain = null; render(); return; }
    chain.hp = chain.rest ? Math.min(chain.maxHp, state.hp + Math.ceil(chain.maxHp * 0.3)) : state.hp;
    chain.idx++;
    if (chain.idx >= sub.fights.length) { chain.over = 'cleared'; lastChain = chain; chain = null; }
    render();
    const panel = document.querySelector('.fv-chain'); if (panel) panel.scrollIntoView({ block: 'start' });
  }
  function chainPanel() {
    const c = chain || lastChain; if (!c) return '';
    const sub = Fights.sub(c.sub);
    let h = '<div class="d-card fv-chain"><b>Mini-run: ' + esc(sub.name) + '</b> ';
    if (chain) {
      const f = sub.fights[c.idx];
      h += '<span class="d-mini">fight ' + (c.idx + 1) + ' of ' + sub.fights.length + ' · HP ' + c.hp + '/' + c.maxHp + '</span><div class="d-row"><button class="primary" data-a="fvnext">Start fight ' + (c.idx + 1) + ': ' + esc(f.name) + '</button><button class="sm danger" data-a="fvabort">Abort</button></div>';
    } else h += '<span class="' + (c.over === 'cleared' ? 'res-w' : 'res-l') + '">' + (c.over === 'cleared' ? 'SUB-AREA CLEARED' : c.over === 'lost' ? 'DEFEATED' : 'ABORTED') + '</span>';
    if (c.rows.length) {
      h += '<table class="d-table"><tr><th>#</th><th>Fight</th><th>Lv</th><th>Result</th><th>Turns</th><th>HP lost</th><th>HP left</th></tr>' +
        c.rows.map((r, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(r.name) + '</td><td>' + r.level + '</td><td>' + (r.won ? '<span class="res-w">win ' + '★'.repeat(r.stars) + '</span>' : '<span class="res-l">lose</span>') + '</td><td>' + r.turns + '</td><td>' + r.dmg + '</td><td>' + r.hp + '/' + c.maxHp + '</td></tr>').join('') + '</table>';
      if (!chain) { const lost = c.rows.reduce((n, r) => n + r.dmg, 0); h += '<div class="d-mini">Fights won ' + c.rows.filter((r) => r.won).length + '/' + sub.fights.length + ' · total HP lost ' + lost + ' · started at ' + c.start + ' HP, ended with ' + c.rows[c.rows.length - 1].hp + '/' + c.maxHp + (c.rest ? ' · campfire +30% between fights' : '') + '.</div>'; }
    }
    return h + '</div>';
  }
  function tabFights() {
    const fv = FV(), reg = Fights.regions.find((r) => r.id === fv.region) || Fights.regions[0], rf = Fights.all.filter((f) => Fights.sub(f.sub).regionId === reg.id);
    let h = '<div class="d-card"><div class="d-mini">All 100 sub-areas, 7 fights each (' + Fights.all.length + ' in total), generated by <code>tools/build-fights.mjs</code> from the world progression: stats follow WORLD_PROGRESSION 4.1, enemy kinds and gimmicks are the ones the engine runs today (other keywords are inert grey tags). Drawings are placeholders: the label shows the real monster. ' +
      esc(refInfo()) + '</div><div class="d-row"><label><input type="checkbox" data-c="fvrest"' + (fv.rest ? ' checked' : '') + '> Mini-run: campfire heals 30% max HP between fights</label></div></div>' + chainPanel();
    h += '<div class="d-chips">' + Fights.regions.map((r) => '<button class="sm' + (r.id === reg.id ? ' on' : '') + '" data-a="fvregion" data-id="' + r.id + '">' + r.number + '. ' + esc(r.name) + '</button>').join('') + '</div>';
    h += '<h3>' + reg.number + '. ' + esc(reg.name) + ' <small class="d-mini">boss Lv ' + esc(reg.levelBand.bossFirst + '-' + reg.levelBand.bossLast) + '</small></h3><div class="d-mini">' + esc(reg.terrain) + '</div>';
    for (const sub of Array.from(new Set(rf.map((f) => f.sub))).map((id) => Fights.sub(id))) {
      const open = !!fv.open[sub.id], lv = sub.levels;
      h += '<details class="d-sub fv-sub" data-fsub="' + sub.id + '"' + (open ? ' open' : '') + '><summary>' + esc(sub.name) + ' <small>Lv ' + lv.ordinary[0] + '-' + lv.ordinary[1] + ', elite ' + lv.elite + ', boss ' + lv.boss + ' · ' + esc(sub.theme) + '</small> ' + sub.elements.map(chip).join('') +
        '<div class="d-mini">Idea: ' + esc(sub.idea) + '</div></summary><div class="body">' + (open ? v2SubBody(sub) : '') + '</div></details>';
    }
    return h;
  }

  // ---------- Team ----------
  function summaryLine() {
    const s = S.save, cp = P.squadCp(s), cap = P.commandCap(s), prob = P.squadProblem(s);
    return 'Squad ' + s.squad.length + ' units, CP ' + cp + '/' + cap + (cp > cap ? ' (over cap, allowed here)' : '') + '. Max HP ' + (P.maxHp(s) + num(S.run.hpBonus, 0)) + '. Hero: ' + P.heroOf(s).name + '.' + (prob && !prob.includes('Command Points') ? ' Warning: ' + prob : '');
  }
  function tabTeam() {
    const s = S.save;
    let h = '<div class="d-card"><div class="d-mini">Tick a unit to put it in the squad (no Command Point limit here). Rarity changes its Command Point cost and look; Stars (1-5) and Mastery (1-5) are the duplicate and battle-xp growth that add stats.</div>' +
      '<div class="d-row"><button class="sm" data-a="squadall">All in squad</button><button class="sm" data-a="squadnone">Empty squad</button><button class="sm" data-a="squadstart">Starter squad</button><button class="sm" data-a="maxall">All Stars 5 + Mastery 5</button></div></div>';
    h += '<table class="d-table"><tr><th>In</th><th>Unit</th><th>Rarity</th><th>Stars</th><th>Mastery</th></tr>';
    for (const u of P.ROSTER) {
      const art = window.Art.unit({ id: u.id, type: u.type }), nm = (art.name || u.id) + ' (' + E.CARD_TYPES[u.type].name + ')';
      h += '<tr><td><input type="checkbox" data-c="squad" data-id="' + u.id + '"' + (s.squad.includes(u.id) ? ' checked' : '') + '></td><td class="rar-' + u.rarity + '">' + E.CARD_TYPES[u.type].icon + ' ' + esc(nm) + '<div class="d-mini">' + P.TRAITS[u.trait].icon + ' ' + u.trait + (u.perk ? ', ' + esc(u.perk) : '') + '</div></td>' +
        '<td><select data-c="urar" data-id="' + u.id + '">' + opt(RARS, u.rarity) + '</select></td><td><select data-c="ustars" data-id="' + u.id + '">' + opt([1, 2, 3, 4, 5], P.starsOf(s, u.id)) + '</select></td><td><select data-c="umast" data-id="' + u.id + '">' + opt([1, 2, 3, 4, 5], P.masteryOf(s, u.id).lv) + '</select></td></tr>';
    }
    h += '</table>';
    const tc = P.traitCounts(s), act = P.activeTraits(s);
    h += '<h4>Traits</h4><div class="d-mini">' + Object.keys(P.TRAITS).map((t) => P.TRAITS[t].icon + ' ' + t + ' ' + (tc[t] || 0)).join(' · ') + '</div>' + act.map((a) => '<div class="d-mini">' + a.trait + ' ' + a.step + ': ' + esc(a.text) + '</div>').join('');
    return h;
  }

  // ---------- Camp: hero, upgrades, currencies, heat ----------
  function tabCamp() {
    const s = S.save;
    let h = '<h3>Hero</h3><div class="d-row"><select data-c="hero"><option value="">No hero</option>' + opt(P.HEROES.map((x) => [x.id, x.glyph + ' ' + x.name + ' - ' + x.passive + ' (ability ' + x.ability + ')']), s.hero) + '</select></div>';
    h += '<h3>Currencies</h3><div class="d-row">' + Object.keys(P.CURRENCIES).map((k) => '<label>' + P.CURRENCIES[k].icon + ' ' + P.CURRENCIES[k].name + ' <input type="number" min="0" data-c="cur" data-k="' + k + '" value="' + P.balance(s, k) + '"></label>').join('') +
      '<label>🪙 Gold <input type="number" min="0" data-c="gold" value="' + S.run.gold + '"></label></div><div class="d-mini">Battles do not spend these; they are here for completeness (the gold/Souls feed nothing in a single fight).</div>';
    h += '<h3>Camp upgrades</h3><div class="d-grid">' + P.UPGRADES.map((u) => '<div class="d-card"><b>' + u.icon + ' ' + esc(u.name) + '</b> <input type="number" min="0" max="' + u.costs.length + '" data-c="upg" data-id="' + u.id + '" value="' + P.level(s, u.id) + '"> / ' + u.costs.length + '<div class="d-mini">' + esc(u.desc) + '</div></div>').join('') + '</div>';
    h += '<h3>Heat and Descend</h3><div class="d-chips">' + P.HEAT_MODS.map((m) => '<button class="sm' + (P.heatOn(s, m.id) ? ' on' : '') + '" data-a="heat" data-id="' + m.id + '" title="' + esc(m.text) + '">' + esc(m.name) + '</button>').join('') +
      '<label>Descend <input type="number" min="0" max="' + P.MAX_DESCEND + '" data-c="descend" value="' + P.descendOf(s) + '"></label></div><div class="d-mini">' + P.HEAT_MODS.filter((m) => P.heatOn(s, m.id)).map((m) => esc(m.text)).join(' ') + '</div>';
    return h;
  }

  // ---------- Gear ----------
  function tabGear() {
    const s = S.save, f = S.ui.f;
    let h = '<h3>Equipped</h3><div class="d-grid">' + Items.SLOT_LIST.map((sl) => {
      const id = s.loadout[sl.id], it = id && Items.BY_ID[id];
      return '<div class="d-card">' + sl.icon + ' <b>' + sl.name + '</b>: ' + (it ? '<span class="rar-' + it.rarity + '">' + esc(it.name) + '</span> <button class="sm" data-a="unequip" data-id="' + id + '">Unequip</button>' : '<span class="d-mini">empty</span>') + '</div>';
    }).join('') + '</div>';
    const b = Items.bonuses(s), sets = Items.setStatus(s).filter((x) => x.tiers.some((t) => t.on));
    h += '<div class="d-mini">Gear bonus: ' + esc(JSON.stringify({ atk: b.atk, amount: b.amount, range: b.range, block: b.block, hp: b.hp, souls: b.souls, rules: b.rules })) + (sets.length ? ' · sets active: ' + sets.map((x) => esc(x.set ? x.set.name : '')).join(', ') : '') + '</div>';
    h += '<h3>Items (' + Items.ALL.length + ')</h3><div class="d-row"><input type="text" placeholder="search name" data-c="fq" value="' + esc(f.q) + '"><select data-c="frar">' + opt([['', 'any rarity']].concat(RARS), f.rar) + '</select>' +
      '<select data-c="fslot">' + opt([['', 'any slot'], 'weapon', 'armor', 'banner', 'ring'], f.slot) + '</select><label><input type="checkbox" data-c="fown"' + (f.owned ? ' checked' : '') + '> owned only</label><button class="sm danger" data-a="removeall">Remove all</button></div>';
    const q = f.q.trim().toLowerCase();
    const list = Items.ALL.filter((it) => (!q || it.name.toLowerCase().includes(q) || it.id.includes(q)) && (!f.rar || it.rarity === f.rar) && (!f.slot || it.slot === f.slot) && (!f.owned || s.items.includes(it.id)));
    h += '<div class="d-mini">' + list.length + ' match' + (list.length > 40 ? ' (first 40 shown, narrow the filter)' : '') + '</div><div class="d-grid">';
    for (const it of list.slice(0, 40)) {
      const own = s.items.includes(it.id), d = Items.dataOf(s, it.id), eq = own && Items.slotOfItem(s, it.id);
      h += '<div class="d-card"><b class="rar-' + it.rarity + '">' + esc(Items.icon(it) + ' ' + it.name) + '</b> <span class="d-mini">' + it.slot + '</span><div class="d-mini">' + esc(Items.describe(it, own ? d.lv : 0)) + (it.fx ? ' + ' + esc(Items.LEGEND_FX[it.fx] ? Items.LEGEND_FX[it.fx].text : '') : '') + '</div>';
      if (!own) h += '<button class="sm" data-a="grant" data-id="' + it.id + '">Grant</button>';
      else h += '<div class="d-row"><label>Lv <input type="number" min="1" max="' + Items.MAX_ILVL + '" data-c="ilv" data-id="' + it.id + '" value="' + d.lv + '"></label><select data-c="irar" data-id="' + it.id + '">' + opt(RARS, it.rarity) + '</select>' +
        '<button class="sm' + (eq ? ' on' : '') + '" data-a="' + (eq ? 'unequip' : 'equip') + '" data-id="' + it.id + '">' + (eq ? 'Equipped' : 'Equip') + '</button><button class="sm" data-a="remove" data-id="' + it.id + '">Remove</button></div>' +
        (d.subs.length ? '<div class="d-mini">' + d.subs.map((x) => esc(Items.substatText(x, d))).join(', ') + '</div>' : '');
      h += '</div>';
    }
    return h + '</div><div class="d-mini">Rarity override changes the item\'s name colour and how many substats it rolls (re-rolled on change); the main bonus number stays as defined.</div>';
  }

  // ---------- Run state ----------
  function tabRun() {
    const s = S.save, r = S.run, squad = s.squad.filter((id) => P.ROSTER_BY[id]);
    let h = '<div class="d-card"><div class="d-row"><label>Current HP (blank = full) <input type="number" min="1" max="999" data-c="rhp" value="' + (r.hp == null ? '' : r.hp) + '"></label><label>Max HP bonus <input type="number" min="-50" max="999" data-c="rhpb" value="' + r.hpBonus + '"></label>' +
      '<label>Revives already spent <input type="number" min="0" max="9" data-c="rrev" value="' + r.reviveUsed + '"></label></div><div class="d-mini">Max HP from Camp/gear/traits is ' + P.maxHp(s) + '. These apply to every fight (HP does not carry between fights here).</div></div>';
    h += '<h3>Relics (' + r.relics.length + ' on)</h3><div class="d-grid">' + Relics.LIST.map((x) => '<button class="' + (r.relics.includes(x.id) ? 'on' : '') + '" data-a="relic" data-id="' + x.id + '"><b>' + x.glyph + ' ' + esc(x.name) + '</b><br><span class="d-mini">' + esc(x.text) + '</span></button>').join('') + '</div>';
    h += '<h3>In-run unit bonuses</h3><div class="d-row"><button class="sm" data-a="teamatk" data-n="1">All attackers +1 ATK</button><button class="sm" data-a="teamatk" data-n="-1">-1</button><button class="sm danger" data-a="clearmods">Clear all</button></div>';
    h += '<table class="d-table"><tr><th>Unit</th><th>+ATK</th><th>+Range</th><th>+Block</th><th>+Boost</th></tr>';
    for (const id of squad) {
      const u = P.ROSTER_BY[id], role = E.CARD_TYPES[u.type].role, m = r.mods[id] || {}, cell = (k, ok) => '<td>' + (ok ? '<input type="number" min="-9" max="99" data-c="mod" data-id="' + id + '" data-k="' + k + '" value="' + (m[k] || 0) + '">' : '') + '</td>';
      h += '<tr><td>' + E.CARD_TYPES[u.type].icon + ' ' + esc(window.Art.unit({ id, type: u.type }).name || id) + '</td>' + cell('atk', role === 'attacker') + cell('range', role === 'attacker') + cell('block', role === 'defender') + cell('amount', role === 'support') + '</tr>';
    }
    h += '</table>';
    h += '<h3>Resulting rules and army</h3><div class="d-mini">Engine rules: ' + esc(JSON.stringify(P.rulesFor(s, runObj()))) + '</div><div class="d-mini">' + P.buildArmy(s, r.mods).map((c) => esc(c.id + ' ' + JSON.stringify(Object.assign({}, c, { id: undefined, type: undefined })))).join('<br>') + '</div>';
    return h;
  }

  // ---------- Presets ----------
  function tabPresets() {
    const all = store.get(PKEY) || {};
    let h = '<div class="d-card"><div class="d-row"><input type="text" id="pname" placeholder="preset name"><button data-a="psave">Save current as preset</button></div>' + (msg ? '<div class="d-mini"><b>' + esc(msg) + '</b></div>' : '') + '</div>';
    h += Object.keys(all).map((n) => '<div class="d-card d-row"><b class="grow">' + esc(n) + '</b><button class="sm" data-a="pload" data-id="' + esc(n) + '">Load</button><button class="sm danger" data-a="pdel" data-id="' + esc(n) + '">Delete</button></div>').join('') || '<div class="d-mini">No presets yet.</div>';
    h += '<h3>Reset</h3><button class="danger" data-a="reset">' + (confirmReset ? 'Tap again to confirm reset' : 'Reset to defaults') + '</button><div class="d-mini">Dev state is stored under <code>' + KEY + '</code>; the game save (<code>tile-defense-world-v4</code>) is never touched.</div>';
    return h;
  }

  // ---------- Render ----------
  const TABS = [['enemies', 'Enemies'], ['fights', 'V2 Fights'], ['builder', 'Builder'], ['team', 'Team'], ['camp', 'Camp'], ['gear', 'Gear'], ['run', 'Run'], ['presets', 'Presets'], ['design', 'Design']];
  const TAB_FN = { enemies: tabEnemies, fights: tabFights, builder: tabBuilder, team: tabTeam, camp: tabCamp, gear: tabGear, run: tabRun, presets: tabPresets, design: () => '<div id="design-root"></div>' };
  function render() {
    applyOverrides();
    const root = $('#dev'), keep = window.scrollY;
    root.innerHTML = '<div class="d-head"><h1>Tile Defense dev test page</h1><div class="d-sum">' + esc(summaryLine()) + '</div><div class="d-tabs">' +
      TABS.map(([id, label]) => '<button class="sm' + (S.ui.tab === id ? ' on' : '') + '" data-a="tab" data-id="' + id + '">' + label + '</button>').join('') + '</div></div><div id="dev-body">' + TAB_FN[S.ui.tab]() + '</div>';
    if (S.ui.tab === 'design') { if (!S.design || typeof S.design !== 'object') S.design = { marks: {}, sub: 'units' }; Design.mount($('#design-root'), S.design, persist); }
    window.scrollTo(0, keep);
  }
  const change = () => { persist(); render(); };

  // ---------- Events ----------
  const rndSeed = () => Math.random().toString(36).slice(2, 7);
  const A = {
    tab(el) { S.ui.tab = el.dataset.id; msg = ''; confirmReset = false; window.scrollTo(0, 0); change(); },
    fight(el) {
      const n = World.byId[el.dataset.id], sub = World.SUB_BY[n.sub], gen = Gen.generateBattle(n, seedOf(n.id), genOpts()), lv = Gen.scaled(n, genOpts()).level;
      fight(n.id, nodeName(n, sub), sub.name + ' · Lv' + lv, sub.biome, gen);
    },
    fvregion(el) { FV().region = el.dataset.id; change(); },
    fvfight(el) { launchV2(Fights.byId(el.dataset.id)); },
    fvref(el) { applyRef(num(el.dataset.lv, 1)); change(); },
    fvbuilder(el) { v2ToBuilder(el.dataset.id); change(); },
    fvplay(el) { startChain(el.dataset.id); },
    fvnext() { if (chain && !chain.key) chainLaunch(); },
    fvabort() { if (chain) { chain.over = 'aborted'; lastChain = chain; chain = null; } change(); },
    reroll(el) { S.seeds[el.dataset.id] = rndSeed(); change(); },
    rerollall() { S.run.seed = rndSeed(); S.seeds = {}; change(); },
    clearseeds() { S.seeds = {}; change(); },
    tobuilder(el) { loadIntoBuilder(el.dataset.id); change(); },
    csel(el) { const r = num(el.dataset.r, 0), col = num(el.dataset.col, 0), e = enemyAt(r, col); C().sel = e ? [e.row, e.col] : [r, col]; C().warn = ''; render(); },
    cadd(el) { addEnemy(el.dataset.role, el.dataset.kind); change(); },
    cdel() { const e = enemyAt(...C().sel); C().enemies = C().enemies.filter((x) => x !== e); C().warn = ''; change(); },
    cauto() { const e = enemyAt(...C().sel); if (e) Object.assign(e, statsFor(e.role, e.footprint || '1x1', C().level)); change(); },
    cclear() { C().enemies = []; C().warn = ''; change(); },
    cfight() {
      const sub = World.SUB_BY[C().sub], gen = buildCustom(), problems = E.validateLayout(gen.enemies.map((o, i) => Object.assign({}, o, { footprint: o.footprint || '1x1' })));
      if (problems.length) { C().warn = 'Fix the layout first: ' + problems[0]; change(); return; }
      C().warn = ''; fight('custom', 'Custom battle', sub.name + ' · Lv' + C().level, sub.biome, gen);
    },
    squadall() { S.save.squad = P.ROSTER.map((u) => u.id); change(); },
    squadnone() { S.save.squad = []; change(); },
    squadstart() { S.save.squad = P.ROSTER.filter((u) => u.start).map((u) => u.id); change(); },
    maxall() { for (const u of P.ROSTER) S.save.units[u.id] = { stars: 5, xp: P.MASTERY_XP[4] }; change(); },
    heat(el) { const id = el.dataset.id, h = S.save.heat || []; S.save.heat = h.includes(id) ? h.filter((x) => x !== id) : h.concat(id); change(); },
    equip(el) { Items.equip(S.save, el.dataset.id, false); change(); },
    unequip(el) { Items.unequip(S.save, el.dataset.id); change(); },
    grant(el) { Items.addItem(S.save, el.dataset.id, 10, 'dev'); change(); },
    remove(el) { const id = el.dataset.id; Items.unequip(S.save, id); S.save.items = S.save.items.filter((x) => x !== id); delete S.save.itemData[id]; change(); },
    removeall() { S.save.items = []; S.save.itemData = {}; S.save.loadout = Items.emptyLoadout(); change(); },
    relic(el) { const id = el.dataset.id, r = S.run.relics; S.run.relics = r.includes(id) ? r.filter((x) => x !== id) : r.concat(id); change(); },
    teamatk(el) { const n = num(el.dataset.n, 1); for (const id of S.save.squad) if (E.CARD_TYPES[P.ROSTER_BY[id].type].role === 'attacker') { const m = S.run.mods[id] || (S.run.mods[id] = {}); m.atk = (m.atk || 0) + n; } change(); },
    clearmods() { S.run.mods = {}; change(); },
    psave() {
      const name = ($('#pname').value || '').trim(); if (!name) { msg = 'Enter a preset name first.'; render(); return; }
      const all = store.get(PKEY) || {}; all[name] = S; msg = store.set(PKEY, all) ? 'Saved "' + name + '".' : 'Could not save (storage unavailable).'; render();
    },
    pload(el) { const all = store.get(PKEY) || {}, p = all[el.dataset.id]; if (p) { S = restore(JSON.parse(JSON.stringify(p))); S.ui.tab = 'presets'; msg = 'Loaded "' + el.dataset.id + '".'; change(); } },
    pdel(el) { const all = store.get(PKEY) || {}; delete all[el.dataset.id]; store.set(PKEY, all); msg = ''; render(); },
    reset() { if (!confirmReset) { confirmReset = true; render(); return; } confirmReset = false; S = defaults(); S.ui.tab = 'presets'; msg = 'Reset to defaults.'; change(); },
  };
  const setMod = (id, k, v) => { const m = S.run.mods[id] || (S.run.mods[id] = {}); m[k] = v; if (!v) delete m[k]; };
  const CH = {
    fvrest(el) { FV().rest = el.checked; },
    seed(el) { S.run.seed = el.value.trim() || 'dev'; },
    csub(el) { C().sub = el.value; },
    clevel(el) { C().level = clamp(num(el.value, 5), 1, 55); },
    cfield(el) {
      const e = enemyAt(...C().sel); if (!e) return; const k = el.dataset.k;
      if (k === 'role') { delete e.vt; delete e.mn; if (el.value === 'barrel') e.footprint = '1x1'; e.role = el.value; Object.assign(e, statsFor(e.role, e.footprint || '1x1', C().level)); }
      else if (k === 'footprint') {
        const old = fpOf(e), fp = el.value, next = Object.assign({}, e, { footprint: fp });
        const problems = e.role === 'barrel' ? ['barrels are 1x1'] : E.validateLayout(C().enemies.map((x) => (x === e ? next : x)));
        if (problems.length) C().warn = 'A ' + fp + ' does not fit here: ' + problems[0].replace(/^enemy \d+ ?/, '');
        else { const nf = E.FOOTPRINTS[fp]; e.footprint = fp; e.hp = Math.max(1, Math.round(e.hp * nf.hp / old.hp)); if (e.atk > 0) e.atk = Math.max(1, Math.round(e.atk * nf.atk / old.atk)); C().warn = ''; }
      }
      else if (k === 'kind' || k === 'gimmick') {
        e[k] = el.value;
        if (k === 'gimmick') e.gp = { ward: 3, veil: 1, gaze: 1, rage: 1, harden: 2, guard: 0, regen: Math.max(1, Math.round(e.hp * 0.12)), regrow: Math.max(2, Math.round(e.hp * 0.6)) }[el.value] || 0;
      } else e[k] = clamp(num(el.value, 0), 0, 999);
    },
    cbossrow(el) { C().bossRow = el.checked; if (!el.checked) { C().enemies = C().enemies.filter((e) => e.row !== E.BOSS_ROW); if (C().sel[0] === E.BOSS_ROW) C().sel = [1, 2]; } C().warn = ''; },
    cnewfp(el) { C().newFp = FPS.includes(el.value) ? el.value : '1x1'; },
    cguard(el) { const e = enemyAt(...C().sel); if (e) e.guardian = el.checked; },
    squad(el) { const id = el.dataset.id, q = S.save.squad; S.save.squad = el.checked ? (q.includes(id) ? q : q.concat(id)) : q.filter((x) => x !== id); },
    urar(el) { if (el.value === ORIG_U[el.dataset.id]) delete S.rar.unit[el.dataset.id]; else S.rar.unit[el.dataset.id] = el.value; },
    ustars(el) { const u = S.save.units[el.dataset.id] || (S.save.units[el.dataset.id] = { stars: 1, xp: 0 }); u.stars = num(el.value, 1); },
    umast(el) { const u = S.save.units[el.dataset.id] || (S.save.units[el.dataset.id] = { stars: 1, xp: 0 }); u.xp = P.MASTERY_XP[clamp(num(el.value, 1), 1, 5) - 1]; },
    hero(el) { S.save.hero = el.value || null; },
    cur(el) { S.save[el.dataset.k] = Math.max(0, num(el.value, 0)); },
    gold(el) { S.run.gold = Math.max(0, num(el.value, 0)); },
    upg(el) { const u = P.UPGRADE_BY[el.dataset.id], v = clamp(num(el.value, 0), 0, u.costs.length); if (v) S.save.upgrades[u.id] = v; else delete S.save.upgrades[u.id]; },
    descend(el) { S.save.descend = clamp(num(el.value, 0), 0, P.MAX_DESCEND); },
    fq(el) { S.ui.f.q = el.value; }, frar(el) { S.ui.f.rar = el.value; }, fslot(el) { S.ui.f.slot = el.value; }, fown(el) { S.ui.f.owned = el.checked; },
    ilv(el) { const d = S.save.itemData[el.dataset.id]; if (d) d.lv = clamp(num(el.value, 1), 1, Items.MAX_ILVL); },
    irar(el) {
      const id = el.dataset.id; if (el.value === ORIG_I[id]) delete S.rar.item[id]; else S.rar.item[id] = el.value;
      Items.BY_ID[id].rarity = el.value; const d = S.save.itemData[id]; if (d) d.subs = Items.newData(Items.BY_ID[id], d.lv, 'dev' + el.value).subs;
    },
    rhp(el) { S.run.hp = el.value === '' ? null : clamp(num(el.value, 1), 1, 999); },
    rhpb(el) { S.run.hpBonus = clamp(num(el.value, 0), -50, 999); },
    rrev(el) { S.run.reviveUsed = clamp(num(el.value, 0), 0, 9); },
    mod(el) { setMod(el.dataset.id, el.dataset.k, clamp(num(el.value, 0), -9, 99)); },
  };
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-a]'); if (!el || !$('#dev').contains(el)) return;
    if (A[el.dataset.a]) A[el.dataset.a](el, ev);
    if (el.dataset.a !== 'reset' && el.dataset.a !== 'tab') confirmReset = false;
  });
  document.addEventListener('change', (ev) => {
    const el = ev.target.closest('[data-c]'); if (!el || !$('#dev').contains(el) || !CH[el.dataset.c]) return;
    CH[el.dataset.c](el); change();
  });
  // Sub-area lists render lazily when opened (16 areas of generated fights).
  document.addEventListener('toggle', (ev) => {
    const d = ev.target; if (!d.matches || !d.matches('details.d-sub')) return;
    if (d.matches('.fv-sub')) { const id = d.dataset.fsub; if (!!FV().open[id] === d.open) return; FV().open[id] = d.open; persist(); if (d.open) d.querySelector('.body').innerHTML = v2SubBody(Fights.sub(id)); return; }
    const id = d.dataset.sub; if (!!S.ui.open[id] === d.open) return;
    S.ui.open[id] = d.open; persist();
    if (d.open) { const sub = World.SUB_BY[id]; d.querySelector('.body').innerHTML = World.nodes.filter((n) => n.sub === id && ['battle', 'elite', 'boss'].includes(n.type)).map((n) => nodeRow(n, sub)).join(''); }
  }, true);

  Design.bind($('#dev'));
  render();
  window.DevTest = { get state() { return S; }, results, get chain() { return chain || lastChain; }, Fights };
})();
