// Developer test page: enemy browser, custom battle builder and free editing of everything a battle reads.
// Uses the real battle screen (js/battle.js) with no world map. State lives under its own localStorage key, never the game save.
import './dev-boot.js';
import './theme.css';
import './world.css';
import './camp.css';
import './battle.css';
import './dev.css';
import './js/engine.js';
import './js/world-boot.js';
import './js/world-data.js';
import './js/art.js';
import './js/progress.js';
import './js/boss-defs.js';
import './js/gen.js';
import './js/battle.js';
import './js/items.js';
import './js/relics.js';

(function () {
  'use strict';
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
      custom: { sub: SUBS[0].id, level: 5, enemies: [], sel: [1, 2] }, ui: { tab: 'enemies', open: {}, f: { q: '', rar: '', slot: '', owned: false } },
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
    leave();
    results[current] = { won: state.status === 'cleared', stars: stars || 0, turns: state.turn, dmg: state.damageTaken };
    render();
  }
  $('#dev-exit').addEventListener('click', () => { leave(); results[current] = { quit: true }; render(); });

  // ---------- Enemy browser ----------
  const genOpts = () => P.genOpts(S.save);
  const seedOf = (id) => S.seeds[id] || S.run.seed;
  const nodeName = (n, sub) => (n.type === 'boss' ? Defs.BOSSES[sub.bossDef].name : n.type === 'elite' ? Defs.ELITES[sub.bossDef].name : 'Skirmish ' + (Number(n.id.split('-').pop()) + 1));
  const typeName = (t) => (E.ENEMY_TYPES[t] ? E.ENEMY_TYPES[t].name : t);
  function summarize(enemies) {
    const by = {};
    for (const e of enemies) { const k = typeName(e.type) + (e.kind ? ' ' + E.ENEMY_KINDS[e.kind].badge + e.kind : '') + (e.gimmick ? ' ' + E.ENEMY_GIMMICKS[e.gimmick].badge + e.gimmick : '') + (e.guardian ? ' guard' : ''); by[k] = (by[k] || 0) + 1; }
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
  const enemyAt = (r, c) => C().enemies.find((e) => e.row === r && e.col === c);
  function defaultsFor(role, L) {
    const base = 2.2 + L * 0.95, ramp = L > 7 ? 1 + 0.07 * (L - 7) : 1, atk = Math.round(1.5 + L * 0.42) + (L > 7 ? Math.floor((L - 7) * 0.35) : 0);
    if (role === 'barrel') return { hp: 1, atk: 0, armor: 0 };
    const m = { basic: [1, 0, 0], tough: [1.4, L >= 5 ? 1 : 0, 0], armored: [0.9, 0, L >= 9 ? 2 : 1], boss: [3.5, 1, 0] }[role];
    return { hp: Math.max(1, Math.round(base * ramp * m[0])), atk: Math.max(1, atk + m[1]), armor: m[2] };
  }
  function addEnemy(role, kind) {
    const [r, c] = C().sel; if (enemyAt(r, c)) return;
    C().enemies.push(Object.assign({ role, kind: kind || '', gimmick: '', gp: 0, guardian: false, row: r, col: c }, defaultsFor(role, C().level)));
  }
  function buildCustom() {
    const sub = C().sub;
    const enemies = C().enemies.map((e) => {
      const o = { type: sub + '_' + e.role, row: e.row, col: e.col, hp: e.role === 'barrel' ? 1 : Math.max(1, e.hp), atk: e.role === 'barrel' ? 0 : Math.max(0, e.atk), armor: e.armor || 0 };
      if (e.kind) o.kind = e.kind;
      if (e.gimmick) { o.gimmick = e.gimmick; o.gp = e.gp || 0; }
      if (e.guardian) o.guardian = true;
      if (e.kind === 'splitter') o.minion = { type: sub + '_basic', hp: 1, atk: Math.max(1, Math.round(o.atk * 0.6)) };
      if (e.kind === 'summoner') o.minion = { type: sub + '_basic', hp: Math.max(2, Math.round(o.hp * 0.4)), atk: Math.max(1, Math.round(o.atk * 0.6)) };
      return o;
    });
    return { enemies, template: 'custom' };
  }
  function loadIntoBuilder(id) {
    const n = World.byId[id], gen = Gen.generateBattle(n, seedOf(id), genOpts());
    C().sub = n.sub; C().level = Gen.scaled(n, genOpts()).level;
    C().enemies = gen.enemies.map((e) => ({ role: e.type.slice(n.sub.length + 1), kind: e.kind || '', gimmick: e.gimmick || '', gp: e.gp || 0, guardian: !!e.guardian, row: e.row, col: e.col, hp: e.hp, atk: e.atk, armor: e.armor || 0 }));
    S.ui.tab = 'builder';
  }
  const opt = (list, cur) => list.map((v) => { const [val, label] = Array.isArray(v) ? v : [v, v]; return '<option value="' + esc(val) + '"' + (String(val) === String(cur) ? ' selected' : '') + '>' + esc(label) + '</option>'; }).join('');
  function tabBuilder() {
    const c = C(), sub = SUBS.find((s) => s.id === c.sub);
    let h = '<div class="d-card"><div class="d-row"><label>Sub-area (creatures, backdrop) <select data-c="csub">' + opt(SUBS.map((s) => [s.id, s.region + ': ' + s.name]), c.sub) + '</select></label>' +
      '<label>Level <input type="number" min="1" max="30" data-c="clevel" value="' + c.level + '"></label></div>' +
      '<div class="d-mini">Back row on top, front row below (your side is at the bottom). Tap a tile, then add an enemy. Stats start from the level\'s curve; edit them freely.</div>';
    h += '<div class="d-board">';
    for (let r = 0; r < 2; r++) for (let col = 0; col < 5; col++) {
      const e = enemyAt(r, col), sel = c.sel[0] === r && c.sel[1] === col;
      h += '<button class="' + (sel ? 'sel' : '') + '" data-a="csel" data-r="' + r + '" data-col="' + col + '">' + (e ? (E.ENEMY_TYPES[sub.id + '_' + e.role] || {}).icon + '<br>' + e.role + (e.kind ? ' ' + E.ENEMY_KINDS[e.kind].badge : '') + (e.gimmick ? ' ' + E.ENEMY_GIMMICKS[e.gimmick].badge : '') + '<br>' + (e.role === 'barrel' ? 'barrel' : e.hp + 'hp ' + e.atk + 'atk') : '<span class="d-mini">empty</span>') + '</button>';
    }
    h += '</div>';
    const e = enemyAt(c.sel[0], c.sel[1]);
    if (!e) {
      h += '<h4>Add to tile ' + (c.sel[0] === 0 ? 'back' : 'front') + ' ' + (c.sel[1] + 1) + '</h4><div class="d-chips">' + ROLES.map((r) => '<button class="sm" data-a="cadd" data-role="' + r + '">' + r + '</button>').join('') +
        KINDS.map((k) => '<button class="sm" data-a="cadd" data-role="basic" data-kind="' + k + '">' + E.ENEMY_KINDS[k].badge + ' ' + k + '</button>').join('') + '</div>';
    } else {
      const f = (label, key, extra) => '<label>' + label + ' <input type="number" min="0" max="999" data-c="cfield" data-k="' + key + '" value="' + e[key] + '"' + (extra || '') + '></label>';
      h += '<h4>Edit tile ' + (c.sel[0] === 0 ? 'back' : 'front') + ' ' + (c.sel[1] + 1) + '</h4><div class="d-row"><label>Type <select data-c="cfield" data-k="role">' + opt(ROLES, e.role) + '</select></label>' +
        '<label>Kind <select data-c="cfield" data-k="kind">' + opt([['', 'none']].concat(KINDS.map((k) => [k, k])), e.kind) + '</select></label>' +
        '<label>Gimmick <select data-c="cfield" data-k="gimmick">' + opt([['', 'none']].concat(GIMMICKS.map((k) => [k, k])), e.gimmick) + '</select></label></div>' +
        '<div class="d-row">' + f('HP', 'hp') + f('ATK', 'atk') + f('Armor', 'armor') + f('Gimmick N', 'gp') + '<label><input type="checkbox" data-c="cguard"' + (e.guardian ? ' checked' : '') + '> guard escort</label></div>' +
        '<div class="d-row"><button class="sm" data-a="cauto">Reset stats to level</button><button class="sm danger" data-a="cdel">Remove</button></div>' +
        '<div class="d-mini">' + (e.kind ? esc(E.ENEMY_KINDS[e.kind].name + ': ' + E.ENEMY_KINDS[e.kind].text) + '. ' : '') + (e.gimmick ? esc(E.ENEMY_GIMMICKS[e.gimmick].name + ': ' + E.ENEMY_GIMMICKS[e.gimmick].text.replace('{n}', e.gp)) : '') + '</div>';
    }
    h += '<div class="d-row"><button class="primary" data-a="cfight"' + (c.enemies.length ? '' : ' disabled') + '>Fight custom battle</button><button class="sm danger" data-a="cclear">Clear board</button> ' + resultHtml('custom') + '</div></div>';
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
  const TABS = [['enemies', 'Enemies'], ['builder', 'Builder'], ['team', 'Team'], ['camp', 'Camp'], ['gear', 'Gear'], ['run', 'Run'], ['presets', 'Presets']];
  const TAB_FN = { enemies: tabEnemies, builder: tabBuilder, team: tabTeam, camp: tabCamp, gear: tabGear, run: tabRun, presets: tabPresets };
  function render() {
    applyOverrides();
    const root = $('#dev'), keep = window.scrollY;
    root.innerHTML = '<div class="d-head"><h1>Tile Defense dev test page</h1><div class="d-sum">' + esc(summaryLine()) + '</div><div class="d-tabs">' +
      TABS.map(([id, label]) => '<button class="sm' + (S.ui.tab === id ? ' on' : '') + '" data-a="tab" data-id="' + id + '">' + label + '</button>').join('') + '</div></div><div id="dev-body">' + TAB_FN[S.ui.tab]() + '</div>';
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
    reroll(el) { S.seeds[el.dataset.id] = rndSeed(); change(); },
    rerollall() { S.run.seed = rndSeed(); S.seeds = {}; change(); },
    clearseeds() { S.seeds = {}; change(); },
    tobuilder(el) { loadIntoBuilder(el.dataset.id); change(); },
    csel(el) { C().sel = [num(el.dataset.r, 0), num(el.dataset.col, 0)]; render(); },
    cadd(el) { addEnemy(el.dataset.role, el.dataset.kind); change(); },
    cdel() { const [r, c] = C().sel; C().enemies = C().enemies.filter((e) => !(e.row === r && e.col === c)); change(); },
    cauto() { const e = enemyAt(...C().sel); if (e) Object.assign(e, defaultsFor(e.role, C().level)); change(); },
    cclear() { C().enemies = []; change(); },
    cfight() { const sub = World.SUB_BY[C().sub]; fight('custom', 'Custom battle', sub.name + ' · Lv' + C().level, sub.biome, buildCustom()); },
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
    seed(el) { S.run.seed = el.value.trim() || 'dev'; },
    csub(el) { C().sub = el.value; },
    clevel(el) { C().level = clamp(num(el.value, 5), 1, 30); },
    cfield(el) {
      const e = enemyAt(...C().sel); if (!e) return; const k = el.dataset.k;
      if (k === 'role') { e.role = el.value; Object.assign(e, defaultsFor(e.role, C().level)); }
      else if (k === 'kind' || k === 'gimmick') {
        e[k] = el.value;
        if (k === 'gimmick') e.gp = { ward: 3, veil: 1, gaze: 1, rage: 1, harden: 2, guard: 0, regen: Math.max(1, Math.round(e.hp * 0.12)), regrow: Math.max(2, Math.round(e.hp * 0.6)) }[el.value] || 0;
      } else e[k] = clamp(num(el.value, 0), 0, 999);
    },
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
    const id = d.dataset.sub; if (!!S.ui.open[id] === d.open) return;
    S.ui.open[id] = d.open; persist();
    if (d.open) { const sub = World.SUB_BY[id]; d.querySelector('.body').innerHTML = World.nodes.filter((n) => n.sub === id && ['battle', 'elite', 'boss'].includes(n.type)).map((n) => nodeRow(n, sub)).join(''); }
  }, true);

  render();
  window.DevTest = { get state() { return S; }, results };
})();
