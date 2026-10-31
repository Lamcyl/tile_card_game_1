// Builds a battle for a map node from its danger level and sub-area theme.
// Seeded by the run, so revisiting a node in the same run shows the same fight.
(function (root) {
  'use strict';
  const World = root.World;

  function shuffle(a, R) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const vary = (v, R, spread) => Math.max(1, Math.round(v * (1 - spread + R() * spread * 2)));

  const RAMP_HP = 0.07, RAMP_ATK = 0.35;
  function generateBattle(node, runSeed) {
    const R = World.rng(runSeed + ':' + node.id);
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
      add('boss', Math.round((10 + L * 4) * ramp), 3 + Math.floor(L * 0.6) + rampAtk, L >= 7 ? 1 : 0, cell);
      const minions = L <= 4 ? 2 : Math.min(5, 1 + Math.floor(L / 2)); // early bosses bring fewer minions (design 24.1)
      for (let i = 0; i < minions; i++) {
        const role = R() < 0.3 && L >= 4 ? 'armored' : 'basic';
        add(role, vary((2 + L * 0.95) * ramp, R, 0.3), vary(1.4 + L * 0.42, R, 0.3) + rampAtk, role === 'armored' ? 1 : 0, take(() => true));
      }
      if (L >= 3) add('barrel', 1, 0, 0, take((f) => f[0] === 1));
      return { enemies };
    }

    const elite = node.type === 'elite';
    // Level 1 fights are small, so a new player's first battles teach the rules.
    const count = L <= 1 ? 2 : Math.min(8, Math.max(3, Math.round(2 + L * 0.55 + (elite ? 1 : 0))));
    for (let i = 0; i < count; i++) {
      const roll = R();
      let role = 'basic', hpMul = 1, atkAdd = 0, armor = 0;
      if (L >= 3 && roll < 0.22) { role = 'armored'; armor = L >= 9 ? 2 : 1; hpMul = 0.9; }
      else if (roll < 0.45) { role = 'tough'; hpMul = 1.4; atkAdd = L >= 5 ? 1 : 0; }
      if (elite && i === 0) { role = 'tough'; hpMul = 2.2; atkAdd = 1; }
      const hp = vary((2.2 + L * 0.95) * hpMul * ramp, R, 0.3);
      const atk = vary(1.5 + L * 0.42, R, 0.35) + atkAdd + rampAtk;
      // Tough enemies prefer the front row, basic ones spread out.
      add(role, hp, atk, armor, take((f) => (role === 'tough' ? f[0] === 1 : true)));
    }
    // Barrels: free combo opportunities, more common from level 2.
    const barrels = L < 2 ? 0 : (R() < 0.6 ? 1 : 0) + (L >= 5 && R() < 0.45 ? 1 : 0);
    for (let i = 0; i < barrels && free.length; i++) {
      const cell = take((f) => enemies.some((e) => Math.abs(e.row - f[0]) + Math.abs(e.col - f[1]) === 1));
      enemies.push({ type: sub + '_barrel', row: cell[0], col: cell[1], hp: 1 });
    }
    // The spot's icon on the map is its lead creature: make sure that creature is in the fight.
    if (node.role === 'armored' && !enemies.some((e) => e.type === sub + '_armored')) {
      const e = enemies.find((x) => x.type === sub + '_basic') || enemies[0];
      if (e) { e.type = sub + '_armored'; e.armor = Math.max(e.armor, 1); }
    }
    if (node.role === 'barrel' && !enemies.some((e) => e.type === sub + '_barrel') && free.length) {
      const cell = take((f) => enemies.some((e) => Math.abs(e.row - f[0]) + Math.abs(e.col - f[1]) === 1));
      enemies.push({ type: sub + '_barrel', row: cell[0], col: cell[1], hp: 1 });
    }
    return { enemies };
  }

  // Souls for winning a battle at a node (before the Fortune bonus).
  // Stage rating (design 11): 3 stars = no damage, 2 = at most 3 damage, 1 = any clear.
  const STAR_SOULS = [1, 1, 1.25, 1.5];
  const starsFor = (damageTaken) => (damageTaken <= 0 ? 3 : damageTaken <= 3 ? 2 : 1);
  function soulsFor(node, stars) {
    const base = Math.round((3 + node.level * 2) * (STAR_SOULS[stars || 1] || 1));
    if (node.type === 'boss') return base * 3;
    if (node.type === 'elite') return base * 2;
    return base;
  }

  const Gen = { generateBattle, soulsFor, starsFor };
  root.Gen = Gen;
  if (typeof module !== 'undefined' && module.exports) module.exports = Gen;
})(typeof window !== 'undefined' ? window : globalThis);
