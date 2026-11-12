// V2 fights (docs/WORLD_PROGRESSION.md section 4.1 and "Playable fights (dev page)"): the data side shared by the dev page and tools/validate-fights.mjs.
//   - the enemy stat rule to Lv55 (baseHp / baseAtk) and the player power it assumes (playerHit P(L), heroHp H(L), shield block),
//   - Fights.reference(L): the "reference squad" of a level, i.e. P(L) mapped onto the current stat system (units, ATK bonuses, HP),
//   - Fights.load(regionFiles, artMap): registers one Engine.ENEMY_TYPES entry per monster (real name + placeholder art) and indexes the fights,
//   - Fights.stage(fight): the stage object (`enemies`, `bossRow`) that Engine.createState / Battle.start read.
// Fight data is produced by tools/build-fights.mjs into prototype/data/fights/. Sets window.Fights (and module.exports in Node).
(function (root) {
  'use strict';
  const Engine = root.Engine || (typeof require === 'function' ? require('./engine.js') : null);
  const round = (v) => Math.floor(v + 0.5); // rounded half up, as in the design

  // ---------- Stat rule (section 4.1) ----------
  const baseHp = (L) => round(L <= 15 ? 2.2 + 0.95 * L : 16.5 + 0.5 * (L - 15));
  const baseAtk = (L) => round(L <= 15 ? 1.5 + 0.42 * L : 7.8 + 0.12 * (L - 15));
  // Expected damage per attacker hit, hero HP, and Shield block the stat rule assumes.
  const playerHit = (L) => (L <= 15 ? 2 + 0.2 * L : 5 + 0.14 * (L - 15));
  const heroHp = (L) => round(L <= 15 ? 9 + L : 24 + 0.9 * (L - 15));
  const shieldBlock = (L) => round(2 + 0.05 * L);

  // ---------- Reference squad per level ----------
  // The player the stat rule assumes, built from the current units: every attacker's ATK is raised (run-upgrade style `mods.atk`) to P(L) when its base is lower,
  // the Shield to shieldBlock(L), the hero has H(L) HP and no hero ability, gear, relic or rule. Units join as levels pass (first number = level).
  const ATTACKERS = [['sword1', 1], ['archer1', 1], ['spear1', 1], ['mage1', 4], ['archer2', 8], ['storm1', 12]];
  const SUPPORT = [['drum1', 1], ['shield1', 1], ['shield2', 6], ['ushabti1', 14]];
  function reference(L, Progress) {
    const P = Progress || root.Progress || (typeof require === 'function' ? require('./progress.js') : null);
    const squad = ATTACKERS.concat(SUPPORT).filter((x) => L >= x[1]).map((x) => x[0]);
    const mods = {}, hit = playerHit(L), blk = shieldBlock(L);
    for (const id of squad) {
      const u = P.ROSTER_BY[id], t = Engine.CARD_TYPES[u.type];
      if (t.role === 'attacker') { const base = u.stats && u.stats.atk !== undefined ? u.stats.atk : t.atk; const b = Math.max(0, round(hit - base)); if (b) mods[id] = { atk: b }; }
      else if (t.role === 'defender') { const base = u.block || t.block; const b = Math.max(0, blk - base); if (b) mods[id] = { block: b }; }
    }
    const cp = squad.reduce((n, id) => n + P.squadCp({ squad: [id] }), 0);
    return { level: L, squad, mods, hp: heroHp(L), hit: Math.round(hit * 10) / 10, block: blk, upgrades: cp > 8 ? { command: cp - 8 } : {} };
  }
  // A Progress save for the reference (heroless, nothing owned beyond the squad). Used by the validator; the dev page applies the same fields to its own save.
  function referenceSave(L, Progress) {
    const P = Progress || root.Progress || require('./progress.js'), ref = reference(L, P), save = P.freshSave();
    save.squad = ref.squad.slice(); save.upgrades = Object.assign({}, ref.upgrades); save.hero = null; save.owned = P.ROSTER.map((u) => u.id);
    const army = P.buildArmy(save, ref.mods);
    return { save, ref, mods: ref.mods, army, maxHp: ref.hp, volley: army.reduce((n, c) => n + (c.atk || 0), 0) };
  }

  // ---------- V2 reference squad (step 4; the balance step tunes it) ----------
  // The same idea with the guardian beasts: three elements in the first column set (Fire, Water, Wood), more join as levels pass, one Herald and Shields as support.
  // Each attacker is raised to P(L) through `mods.atk` and each Shield to shieldBlock(L); stage, Mastery and stars stay at 1.
  const ATTACKERS_V2 = [['singha', 1], ['hongsa', 1], ['amur_tiger', 1], ['reindeer_hauler', 4], ['rakhsh', 8], ['kamaitachi_trio', 12]];
  const SUPPORT_V2 = [['zodiac_hound', 1], ['bixi', 1], ['river_hippo', 6], ['audhumbla', 14]];
  function referenceV2(L, V2) {
    V2 = V2 || root.V2 || (typeof require === 'function' ? require('./v2.js') : null);
    const ids = ATTACKERS_V2.concat(SUPPORT_V2).filter((x) => L >= x[1]).map((x) => x[0]);
    const squad = ids.map((id) => ({ id, stage: 1, level: 1, stars: 1 })), mods = {}, hit = playerHit(L), blk = shieldBlock(L);
    for (const c of V2.army(squad)) {
      if (c.pattern && c.atk !== undefined) { const b = Math.max(0, round(hit - c.atk)); if (b) mods[c.id] = { atk: b }; }
      else if (c.block !== undefined) { const b = Math.max(0, blk - c.block); if (b) mods[c.id] = { block: b }; }
    }
    const cp = V2.army(squad).reduce((n, c) => n + c.cp, 0);
    return { level: L, squad, mods, hp: heroHp(L), hit: Math.round(hit * 10) / 10, block: blk, upgrades: cp > 8 ? { command: cp - 8 } : {}, v2: true };
  }
  function referenceSaveV2(L, Progress, V2) {
    V2 = V2 || root.V2 || require('./v2.js');
    const P = Progress || root.Progress || require('./progress.js'), ref = referenceV2(L, V2), save = P.freshSave();
    save.squad = []; save.upgrades = Object.assign({}, ref.upgrades); save.hero = null; save.owned = P.ROSTER.map((u) => u.id);
    const army = V2.army(ref.squad, ref.mods);
    return { save, ref, mods: ref.mods, army, maxHp: ref.hp, volley: army.reduce((n, c) => n + (c.pattern ? c.atk || 0 : 0), 0) };
  }

  // ---------- Fight data ----------
  let FIGHTS = [], REGIONS = [], BY_ID = {}, SUB_BY = {}, ART = {};
  const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  // One engine enemy type per monster (+ variant) in a sub-area; bosses and elites get a separate key so the crown shows only on the boss.
  const typeKey = (e, boss) => 'v2_' + (e.role === 'barrel' ? 'barrel_' + slug(e.mon || 'keg') : slug(e.mon) + (e.variant ? '_' + slug(e.variant) : '') + (boss ? '_boss' : ''));
  function register(e, boss) {
    const key = typeKey(e, boss);
    if (!Engine.ENEMY_TYPES[key]) {
      Engine.ENEMY_TYPES[key] = e.role === 'barrel'
        ? { name: e.mon || 'Powder keg', icon: '🛢️', barrel: true, blast: 2, v2: true }
        : { name: e.mon, icon: '👾', art: e.art, boss: !!boss, v2: true, variant: e.variant || '', element: e.element || '', flavour: e.flavour || '' };
    }
    return key;
  }
  // Expand a sub-area's compact enemy list (monster table + indexes) into full records.
  function expand(sub, f) {
    return f.enemies.map((e) => {
      const m = e.m !== undefined ? sub.monsters[e.m] : { name: e.mon, variant: e.variant, element: e.element, flavour: e.flavour, art: e.art };
      return Object.assign({ mon: m.name, variant: m.variant || '', element: m.element || '', flavour: m.flavour || '', art: m.art || null }, e);
    });
  }
  function load(regionFiles, artMap) {
    FIGHTS = []; REGIONS = []; BY_ID = {}; SUB_BY = {}; ART = artMap || {};
    for (const rf of regionFiles) {
      REGIONS.push(rf.region);
      for (const sub of rf.subareas) {
        sub.regionId = rf.region.id; sub.regionName = rf.region.name; SUB_BY[sub.id] = sub;
        for (const f of sub.fights) {
          f.sub = sub.id; f.enemies = expand(sub, f);
          FIGHTS.push(f); BY_ID[f.id] = f;
        }
      }
    }
    return FIGHTS.length;
  }
  // The stage fields of a fight (enemy list in the engine's format). Registers the enemy types on first use.
  // `o.v2` (rules.v2): the enemies also carry their `element`, `flavour` and keywords (`kw`, from the fight's inert tags, which V2 makes live); classic stages are unchanged.
  function stage(fight, o) {
    const v2 = !!(o && o.v2);
    const enemies = fight.enemies.map((e) => {
      const boss = e.role === 'boss' || e.role === 'elite';
      const o = { type: register(e, boss), row: e.r, col: e.c, hp: e.hp, atk: e.role === 'barrel' ? 0 : e.atk, armor: e.armor || 0 };
      if (e.fp && e.fp !== '1x1') o.footprint = e.fp;
      if (e.kind) o.kind = e.kind;
      if (e.gimmick) { o.gimmick = e.gimmick; o.gp = e.gp || 0; }
      if (e.guardian) o.guardian = true;
      if (v2 && e.element) { o.element = e.element; if (e.flavour) o.flavour = e.flavour; }
      if (v2 && e.inert && e.inert.length) o.kw = e.inert.map((k) => (typeof k === 'string' ? k : k.id));
      if (e.minion) o.minion = { type: register({ role: 'basic', mon: e.mon, variant: e.variant, art: e.art }, false), hp: e.minion.hp, atk: e.minion.atk };
      return o;
    });
    return Object.assign({ enemies, template: 'v2 ' + fight.step }, fight.bossRow ? { bossRow: true } : null);
  }

  const Fights = {
    baseHp, baseAtk, playerHit, heroHp, shieldBlock, reference, referenceSave, referenceV2, referenceSaveV2, ATTACKERS_V2, SUPPORT_V2, load, stage, register, typeKey, slug,
    get all() { return FIGHTS; }, get regions() { return REGIONS; }, byId: (id) => BY_ID[id], sub: (id) => SUB_BY[id], get art() { return ART; },
  };
  root.Fights = Fights;
  if (typeof module !== 'undefined' && module.exports) module.exports = Fights;
})(typeof window !== 'undefined' ? window : globalThis);
