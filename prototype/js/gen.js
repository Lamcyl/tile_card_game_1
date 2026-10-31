// Builds a battle for a map node from its danger level and sub-area theme.
// Seeded by the run, so revisiting a node in the same run shows the same fight.
(function (root) {
  'use strict';
  const World = root.World;

  function shuffle(a, R) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const vary = (v, R, spread) => Math.max(1, Math.round(v * (1 - spread + R() * spread * 2)));

  const RAMP_HP = 0.07, RAMP_ATK = 0.35;

  // ---------- Battle templates (design 8.2) ----------
  // Ordinary battles are picked from named templates by danger tier (World.danger of the node level).
  // `back` / `front` are the enemy rows (row 0 / row 1), one char per column; the layout is mirrored at random.
  //   b basic   w weak (60% HP)   t tough (140% HP, front row)   h heavy (about 2.2x HP, front row)   a armored (armor 1, 2 from Lv9)   x barrel (1 HP, blast 2)
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
    { name: 'bastion',    tier: 4, lv: [10, 12], hp: 0.36, hp5: 0.32, atk: 0.8, back: 'b...b', front: 'ta.ht' },
    { name: 'warband',    tier: 4, lv: [10, 12], hp: 0.4, hp5: 0.43, atk: 0.8, back: 'tb.bt', front: 'bxhxb' },
  ];
  // Tier 5 (Lv13+) reuses the Survive layouts with beefier enemies (the reference squad is stronger by then).
  TEMPLATES.filter((t) => t.tier === 4).forEach((t) => TEMPLATES.push(Object.assign({}, t, { tier: 5, lv: [13, 99], hp: t.hp5 || Math.round(t.hp * 90) / 100 })));
  const MARK_OF_ROLE = { armored: 'a', barrel: 'x' };

  function pickTemplate(node, R) {
    const L = node.level, tier = World.danger(L);
    let pool = TEMPLATES.filter((t) => t.tier === tier && L >= t.lv[0] && L <= t.lv[1]);
    const mark = MARK_OF_ROLE[node.role];
    if (mark) { const m = pool.filter((t) => (t.back + t.front).includes(mark)); if (m.length) pool = m; }
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
        let role = 'basic', hpMul = 1, atkAdd = 0, armor = 0;
        if (ch === 'w') hpMul = 0.6;
        else if (ch === 't') { role = 'tough'; hpMul = 1.4; atkAdd = L >= 5 ? 1 : 0; }
        else if (ch === 'h') { role = 'tough'; hpMul = 2.2; atkAdd = 1; }
        else if (ch === 'a') { role = 'armored'; armor = L >= 9 ? 2 : 1; hpMul = 0.9; }
        const hp = vary((2.2 + L * 0.95) * hpMul * ramp * t.hp * ease, R, t.tier >= 4 ? 0.06 : 0.12);
        const atk = Math.max(1, Math.round(vary(1.5 + L * 0.42, R, 0.2) * t.atk)) + atkAdd + rampAtk;
        enemies.push({ type: sub + '_' + role, row, col: i, hp, atk, armor });
      }
    });
    // The spot's icon on the map is its lead creature: make sure that creature is in the fight.
    if (node.role === 'armored' && !enemies.some((e) => e.type === sub + '_armored')) {
      const e = enemies.find((x) => x.type === sub + '_basic') || enemies[0];
      if (e) { e.type = sub + '_armored'; e.armor = Math.max(e.armor, 1); }
    }
    return { enemies, template: t.name, teach: t.teach };
  }

  function generateBattle(node, runSeed) {
    const R = World.rng(runSeed + ':' + node.id);
    if (node.type !== 'boss' && node.type !== 'elite') return fromTemplate(node, R);
    return legacyBattle(node, R);
  }

  // Bosses and elites keep the older random layout until they get handcrafted definitions.
  function legacyBattle(node, R) {
    const L = node.level;
    // From the second region on, enemies grow faster than the squad's early upgrades (design 24.1).
    const ramp = L > 7 ? 1 + RAMP_HP * (L - 7) : 1, rampAtk = L > 7 ? Math.floor((L - 7) * RAMP_ATK) : 0;
    const sub = node.sub;
    const enemies = [];
    const free = [];
    for (const r of [1, 0]) for (let c = 0; c < 5; c++) free.push([r, c]);
    const take = (pred) => {
      const opts = shuffle(free.filter(pred), R);
      const cell = opts[0] || shuffle(free.slice(), R)[0];
      free.splice(free.indexOf(cell), 1);
      return cell;
    };

    const add = (role, hp, atk, armor, cell) => enemies.push({ type: sub + '_' + role, row: cell[0], col: cell[1], hp, atk, armor: armor || 0 });

    if (node.type === 'boss') {
      // Boss in the front centre, minions around it. Usually a two-turn fight.
      const cell = [1, 2]; free.splice(free.findIndex((f) => f[0] === 1 && f[1] === 2), 1);
      add('boss', Math.round((10 + L * 4 + (L <= 4 ? 7 : L <= 6 ? 9 : 0)) * ramp), 3 + Math.floor(L * 0.6) + rampAtk, L >= 7 ? 1 : 0, cell);
      const minions = L <= 4 ? 2 : Math.min(5, 1 + Math.floor(L / 2)); // early bosses bring fewer minions (design 24.1)
      for (let i = 0; i < minions; i++) {
        const role = R() < 0.3 && L >= 4 ? 'armored' : 'basic';
        add(role, vary((2 + L * 0.95) * ramp, R, 0.3), vary(1.4 + L * 0.42, R, 0.3) + rampAtk, role === 'armored' ? 1 : 0, take(() => true));
      }
      if (L >= 3) add('barrel', 1, 0, 0, take((f) => f[0] === 1));
      return { enemies, template: 'boss' };
    }

    // Elite: one big tough enemy plus a random escort.
    const count = Math.min(8, Math.max(3, Math.round(3 + L * 0.55)));
    for (let i = 0; i < count; i++) {
      const roll = R();
      let role = 'basic', hpMul = 1, atkAdd = 0, armor = 0;
      if (L >= 3 && roll < 0.22) { role = 'armored'; armor = L >= 9 ? 2 : 1; hpMul = 0.9; }
      else if (roll < 0.45) { role = 'tough'; hpMul = 1.4; atkAdd = L >= 5 ? 1 : 0; }
      if (i === 0) { role = 'tough'; hpMul = 2.2; atkAdd = 1; }
      const hp = vary((2.2 + L * 0.95) * hpMul * ramp, R, 0.3);
      const atk = vary(1.5 + L * 0.42, R, 0.35) + atkAdd + rampAtk;
      add(role, hp, atk, armor, take((f) => (role === 'tough' ? f[0] === 1 : true)));
    }
    const barrels = L < 2 ? 0 : (R() < 0.6 ? 1 : 0) + (L >= 5 && R() < 0.45 ? 1 : 0);
    for (let i = 0; i < barrels && free.length; i++) {
      const cell = take((f) => enemies.some((e) => Math.abs(e.row - f[0]) + Math.abs(e.col - f[1]) === 1));
      enemies.push({ type: sub + '_barrel', row: cell[0], col: cell[1], hp: 1 });
    }
    return { enemies, template: 'elite' };
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
