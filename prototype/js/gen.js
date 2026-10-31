// Builds a battle for a map node from its danger level and sub-area theme.
// Seeded by the run, so revisiting a node in the same run shows the same fight.
(function (root) {
  'use strict';
  const World = root.World;
  if (!root.BossDefs && typeof require === 'function') require('./boss-defs.js'); // Node tools (the browser loads it first)

  const vary = (v, R, spread) => Math.max(1, Math.round(v * (1 - spread + R() * spread * 2)));

  const RAMP_HP = 0.07, RAMP_ATK = 0.35;

  // ---------- Battle templates (design 8.2) ----------
  // Ordinary battles are picked from named templates by danger tier (World.danger of the node level).
  // `back` / `front` are the enemy rows (row 0 / row 1), one char per column; the layout is mirrored at random.
  //   b basic   w weak (60% HP)   t tough (140% HP, front row)   h heavy (about 2.2x HP, front row)   a armored (armor 1, 2 from Lv9)   x barrel (1 HP, blast 2)
  //   Special rules (tier 4+, drawn as the sub-area's creature with a badge, see Engine.ENEMY_KINDS):
  //   m Healer (heals neighbours by 2 each turn)   s Splitter (two 1-HP enemies when destroyed)
  //   u Summoner (adds a minion each turn)   k Bulwark (armored; blocks overkill and Pierce to the tile behind)
  // hp / atk scale the level's base enemy stats for this template; lv limits the levels it can appear at.
  // Placement rules are encoded in the layouts: barrels sit next to enemies so one shot can chain; armor sits behind
  // a front enemy (so overkill is reduced) or beside a barrel; tier 1 layouts contain one idea each.
  // Tier 1 teaches one mechanic per fight, tiers 2-3 hide a one-turn zero-damage clear, tier 4+ cannot be cleared in one turn.
  // tools/validate-gen.js checks all of this with the solver.
  const TEMPLATES = [
    // Tier 1 (Learn): obvious placement, one mechanic each.
    { name: 'first-blood', tier: 1, lv: [1, 1], hp: 0.8, atk: 1, back: '.....', front: '.b.b.', teach: 'attack' },
    { name: 'long-shot',   tier: 1, lv: [1, 3], hp: 0.6, atk: 1, back: '.w.w.', front: '.....', teach: 'range' },
    { name: 'boost',       tier: 1, lv: [1, 3], hp: 0.6, atk: 1, back: '.....', front: '..t..', teach: 'drummer +' },
    { name: 'twin-lane',   tier: 1, lv: [2, 3], hp: 0.5, atk: 1, back: '..b..', front: '..b..', teach: 'overkill' },
    { name: 'powder-keg',  tier: 1, lv: [2, 3], hp: 0.7, atk: 1, back: '.....', front: '.bxb.', teach: 'barrel' },
    { name: 'guard-post',  tier: 1, lv: [2, 3], hp: 0.6, atk: 1.4, back: '.....', front: 'b...b', teach: 'shield' },
    { name: 'armor-lesson',tier: 1, lv: [3, 3], hp: 0.55, atk: 1, back: '.....', front: '..a..', teach: 'armor' },
    // Tier 2-3 (Think): a clever one-turn, zero-damage line exists.
    { name: 'powder-row',  tier: 2, lv: [5, 6], hp: 0.38, atk: 1, back: '.....', front: 'bxbxb' },
    { name: 'stack',       tier: 2, lv: [4, 6], hp: 0.5, atk: 1, back: 'b.b..', front: 'b.b..' },
    { name: 'shell',       tier: 2, lv: [4, 6], hp: 0.4, atk: 1, back: '..b..', front: '.bab.' },
    { name: 'crossfire',   tier: 2, lv: [4, 6], hp: 0.32, atk: 1, back: '.b.b.', front: 'bx.xb' },
    { name: 'powder-row',  tier: 3, lv: [7, 9], hp: 0.5, atk: 1, back: '.....', front: 'bxbxb' },
    { name: 'stack',       tier: 3, lv: [7, 9], hp: 0.45, atk: 1, back: 'b.b..', front: 'b.b..' },
    { name: 'shell',       tier: 3, lv: [7, 9], hp: 0.45, atk: 1, back: '..b..', front: '.bab.' },
    { name: 'crossfire',   tier: 3, lv: [7, 9], hp: 0.38, atk: 1, back: '.b.b.', front: 'bx.xb' },
    // Tier 4+ (Survive): too much for one turn; the best line leaves a weak survivor.
    { name: 'gatehouse',  tier: 4, lv: [10, 12], hp: 0.63, hp5: 0.62, atk: 0.8, back: '.b.b.', front: 'bxhxb' },
    { name: 'bastion',    tier: 4, lv: [10, 12], hp: 0.36, hp5: 0.34, atk: 0.8, back: 'b...b', front: 'ta.ht' },
    { name: 'warband',    tier: 4, lv: [10, 12], hp: 0.4, hp5: 0.43, atk: 0.8, back: 'tb.bt', front: 'bxhxb' },
    // Tier 4+ mechanics, one teaching template each.
    { name: 'mender',     tier: 4, lv: [10, 12], hp: 0.44, hp5: 0.46, atk: 0.8, back: 'b.m.b', front: '.tbt.', teach: 'healer' },
    { name: 'brood',      tier: 4, lv: [10, 12], hp: 0.53, hp5: [0.57, 0.57, 0.58], atk: 1, atk5: 0.9, back: '.....', front: 'bsxsb', teach: 'splitter' },
    { name: 'hive',       tier: 4, lv: [10, 10], hp: 0.43, hp5: [0.4, 0.36, 0.44], atk: 0.8, back: 'b.u.b', front: 'tb.bt', teach: 'summoner' },
    { name: 'hive',       tier: 4, lv: [11, 12], hp: 0.4, atk: 0.8, back: 'b.u.b', front: 'tb.bt', teach: 'summoner' },
    { name: 'bulwark',    tier: 4, lv: [10, 12], hp: 0.28, hp5: [0.34, 0.3, 0.34], atk: 0.8, back: 'b.b.b', front: 'k.k.k', teach: 'bulwark' },
  ];
  // Tier 5 (Lv13+) reuses the Survive layouts with beefier enemies (the reference squad is stronger by then).
  // hp5 may be a list (Lv13, Lv14, Lv15+) for templates whose cost jumps between levels.
  TEMPLATES.filter((t) => t.tier === 4 && !(t.name === 'hive' && t.lv[0] === 11)).forEach((t) => {
    if (Array.isArray(t.hp5)) t.hp5.forEach((hp, i) => TEMPLATES.push(Object.assign({}, t, { tier: 5, lv: [13 + i, i === 2 ? 99 : 13 + i], hp, atk: t.atk5 || t.atk })));
    else TEMPLATES.push(Object.assign({}, t, { tier: 5, lv: [13, 99], hp: t.hp5 || Math.round(t.hp * 90) / 100, atk: t.atk5 || t.atk }));
  });
  const MARK_OF_ROLE = { armored: 'ak', barrel: 'x' };

  function pickTemplate(node, R) {
    const L = node.level, tier = World.danger(L);
    let pool = TEMPLATES.filter((t) => t.tier === tier && L >= t.lv[0] && L <= t.lv[1]);
    const mark = MARK_OF_ROLE[node.role];
    if (mark) { const m = pool.filter((t) => [...mark].some((ch) => (t.back + t.front).includes(ch))); if (m.length) pool = m; }
    if (!pool.length) pool = TEMPLATES.filter((t) => t.tier === tier);
    return pool[Math.floor(R() * pool.length)];
  }

  function fromTemplate(node, R) {
    const L = node.level, sub = node.sub;
    // Template fights grow at half the HP ramp: the puzzle has to stay solvable with the squad of that danger tier.
    const ramp = L > 7 ? 1 + RAMP_HP * 0.5 * (L - 7) : 1, rampAtk = L > 7 ? Math.floor((L - 7) * RAMP_ATK) : 0;
    const t = pickTemplate(node, R);
    const mirror = R() < 0.5;
    // Squads grow between the levels of a tier faster than the base enemy curve: ease the Survive tiers a little per level.
    const ease = L > 10 && L < 13 ? 1 - 0.07 * (L - 10) : L >= 15 ? 0.93 : 1;
    const enemies = [];
    [[0, t.back], [1, t.front]].forEach(([row, str]) => {
      for (let i = 0; i < 5; i++) {
        const ch = str[mirror ? 4 - i : i];
        if (ch === '.') continue;
        if (ch === 'x') { enemies.push({ type: sub + '_barrel', row, col: i, hp: 1 }); continue; }
        let role = 'basic', hpMul = 1, atkAdd = 0, armor = 0, kind = null;
        if (ch === 'w') hpMul = 0.6;
        else if (ch === 't') { role = 'tough'; hpMul = 1.4; atkAdd = L >= 5 ? 1 : 0; }
        else if (ch === 'h') { role = 'tough'; hpMul = 2.2; atkAdd = 1; }
        else if (ch === 'a') { role = 'armored'; armor = L >= 9 ? 2 : 1; hpMul = 0.9; }
        else if (ch === 'k') { role = 'armored'; armor = L >= 9 ? 2 : 1; hpMul = 1.1; kind = 'bulwark'; }
        else if (ch === 'm') { hpMul = 0.8; kind = 'healer'; }
        else if (ch === 's') { role = 'tough'; hpMul = 1; kind = 'splitter'; }
        else if (ch === 'u') { hpMul = 0.9; kind = 'summoner'; }
        const hp = vary((2.2 + L * 0.95) * hpMul * ramp * t.hp * ease, R, t.tier >= 4 ? 0.06 : 0.12);
        const atk = Math.max(1, Math.round(vary(1.5 + L * 0.42, R, 0.2) * t.atk)) + atkAdd + rampAtk;
        const en = { type: sub + '_' + role, row, col: i, hp, atk, armor };
        if (kind) en.kind = kind;
        if (kind === 'splitter' || kind === 'summoner') en.minion = { type: sub + '_basic', hp: kind === 'splitter' ? 1 : Math.max(2, Math.round(hp * 0.4)), atk: Math.max(1, Math.round(atk * 0.6)) };
        enemies.push(en);
      }
    });
    // The spot's icon on the map is its lead creature: make sure that creature is in the fight.
    if (node.role === 'armored' && !enemies.some((e) => e.type === sub + '_armored')) {
      const e = enemies.find((x) => x.type === sub + '_basic') || enemies[0];
      if (e) { e.type = sub + '_armored'; e.armor = Math.max(e.armor, 1); }
    }
    return { enemies, template: t.name, teach: t.teach };
  }

  // ---------- Handcrafted bosses and elites (js/boss-defs.js) ----------
  // Boss and elite HP is the level's base enemy HP times the def's multiplier times this per-level factor (elites 75%), tuned with
  // tools/sim-runs.js so that the first boss falls for a fresh account about one run in four and Frostveil opens around run 7-18.
  const fightHp = (L) => (L <= 6 ? 1.7 : L <= 7 ? 2.1 : L <= 9 ? 2.5 : L <= 12 ? 2.4 : 2.1);
  // Chars as in the templates plus B (the boss), G (guard of a 'guard' boss) and H (a head that regrows once).
  function fromDef(node, def, R, isBoss) {
    const L = node.level, sub = node.sub, E = root.Engine;
    const ramp = L > 7 ? 1 + RAMP_HP * (L - 7) : 1, // bosses and elites keep the full ramp (design 24.1)
       rampAtk = L > 7 ? Math.floor((L - 7) * RAMP_ATK) : 0;
    const unitHp = (2.2 + L * 0.95) * ramp * fightHp(L) * (isBoss ? 1 : 0.75), unitAtk = 1.5 + L * 0.42 + rampAtk;
    const enemies = [];
    [[0, def.back], [1, def.front]].forEach(([row, str]) => {
      for (let i = 0; i < 5; i++) {
        const ch = str[i];
        if (ch === '.') continue;
        if (ch === 'x') { enemies.push({ type: sub + '_barrel', row, col: i, hp: 1 }); continue; }
        if (ch === 'B') {
          const hp = Math.max(1, Math.round(unitHp * def.bossHp)), atk = Math.max(1, Math.round(unitAtk * def.bossAtk));
          const en = { type: sub + '_boss', row, col: i, hp, atk, armor: 0 };
          if (def.gimmick) { en.gimmick = def.gimmick; en.gp = def.gp || (def.gpHp ? Math.max(1, Math.round(hp * def.gpHp)) : 0); }
          if (def.kind) {
            en.kind = def.kind;
            if (def.kind === 'splitter') en.minion = { type: sub + '_basic', hp: 1, atk: Math.max(1, Math.round(atk * 0.5)) };
            if (def.kind === 'summoner') en.minion = { type: sub + '_basic', hp: Math.max(2, Math.round(unitHp * 0.5)), atk: Math.max(1, Math.round(atk * 0.5)) };
          }
          enemies.push(en);
          continue;
        }
        let role = 'basic', hpMul = 1, atkAdd = 0, armor = 0, kind = null, extra = null;
        if (ch === 'w') hpMul = 0.6;
        else if (ch === 't') { role = 'tough'; hpMul = 1.4; atkAdd = L >= 5 ? 1 : 0; }
        else if (ch === 'h') { role = 'tough'; hpMul = 2.2; atkAdd = 1; }
        else if (ch === 'a') { role = 'armored'; armor = L >= 9 ? 2 : 1; hpMul = 0.9; }
        else if (ch === 'k') { role = 'armored'; armor = L >= 9 ? 2 : 1; hpMul = 1.1; kind = 'bulwark'; }
        else if (ch === 'm') { hpMul = 0.8; kind = 'healer'; }
        else if (ch === 's') { role = 'tough'; hpMul = 1; kind = 'splitter'; }
        else if (ch === 'u') { hpMul = 0.9; kind = 'summoner'; }
        else if (ch === 'G') { role = 'tough'; hpMul = 1.2; atkAdd = 1; extra = { guardian: true }; }
        else if (ch === 'H') { role = 'tough'; hpMul = 1; extra = { gimmick: 'regrow' }; }
        const hp = vary(unitHp * hpMul * def.hp, R, 0.06);
        const atk = Math.max(1, Math.round(vary(unitAtk - rampAtk, R, 0.1) * def.atk)) + atkAdd + rampAtk;
        const en = { type: sub + '_' + role, row, col: i, hp, atk, armor };
        if (kind) en.kind = kind;
        if (extra) Object.assign(en, extra);
        if (en.gimmick === 'regrow') en.gp = Math.max(2, Math.round(hp * 0.6));
        if (kind === 'splitter' || kind === 'summoner') en.minion = { type: sub + '_basic', hp: kind === 'splitter' ? 1 : Math.max(2, Math.round(hp * 0.4)), atk: Math.max(1, Math.round(atk * 0.6)) };
        enemies.push(en);
      }
    });
    const name = def.name;
    const g = def.gimmick ? E.ENEMY_GIMMICKS[def.gimmick] : def.kind ? E.ENEMY_KINDS[def.kind] : null;
    const intro = isBoss
      ? { name, rule: g ? g.name : '', badge: g ? g.badge : '', text: def.intro }
      : { name, rule: 'Elite', badge: '', text: def.note };
    return { enemies, template: (isBoss ? 'boss ' : 'elite ') + sub, intro };
  }

  function generateBattle(node, runSeed) {
    const R = World.rng(runSeed + ':' + node.id);
    const Defs = root.BossDefs;
    if (node.type === 'boss' && Defs.BOSSES[node.sub]) return fromDef(node, Defs.BOSSES[node.sub], R, true);
    if (node.type === 'elite' && Defs.ELITES[node.sub]) return fromDef(node, Object.assign({ bossHp: 1, bossAtk: 1 }, Defs.ELITES[node.sub]), R, false);
    return fromTemplate(node, R);
  }

  // Souls for winning a battle at a node (before the Fortune bonus).
  // Stage rating (design 11): 3 stars = no damage, 2 = at most 3 damage, 1 = any clear.
  const STAR_SOULS = [1, 1, 1.25, 1.5];
  const starsFor = (damageTaken) => (damageTaken <= 0 ? 3 : damageTaken <= 3 ? 2 : 1);
  function soulsFor(node, stars) {
    const base = Math.round((3 + node.level * 2) * 0.8 * (STAR_SOULS[stars || 1] || 1)); // 0.8: templates make 3-star clears common
    if (node.type === 'boss') return base * 3;
    if (node.type === 'elite') return base * 2;
    return base;
  }

  const Gen = { generateBattle, soulsFor, starsFor, TEMPLATES };
  root.Gen = Gen;
  if (typeof module !== 'undefined' && module.exports) module.exports = Gen;
})(typeof window !== 'undefined' ? window : globalThis);
