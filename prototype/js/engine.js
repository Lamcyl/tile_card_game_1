// Rules engine for Tile Defense. Pure logic, no DOM.
// Loaded by the browser as a plain script (exposes window.Engine) and by
// Node tools via require().
(function (root) {
  'use strict';

  const COLS = 5;
  const ROWS = 5;
  // Rows 0-1 belong to enemies (0 = back, 1 = front).
  // Rows 2-4 belong to the player (2 = front, 4 = back).
  const ENEMY_ROWS = [1, 0];
  const PLAYER_ROWS = [2, 3, 4];

  const CARD_TYPES = {
    swordsman: { name: 'Swordsman', role: 'attacker', icon: '🗡️', atk: 3, pattern: 'straight', range: 1 },
    archer:    { name: 'Archer',    role: 'attacker', icon: '🏹', atk: 2, pattern: 'straight', range: 4 },
    spearman:  { name: 'Spearman',  role: 'attacker', icon: '🔱', atk: 2, pattern: 'pierce',   range: 3 },
    mage:      { name: 'Mage',      role: 'attacker', icon: '🔮', atk: 1, pattern: 'spread',   range: 3 },
    drummer:   { name: 'Drummer',   role: 'support',  icon: '🥁', effect: 'atk',   amount: 1, target: 'up' },
    banner:    { name: 'Banner',    role: 'support',  icon: '🚩', effect: 'atk',   amount: 1, target: 'adjacent' },
    horn:      { name: 'War Horn',  role: 'support',  icon: '📯', effect: 'mult',  amount: 2, target: 'up' },
    spyglass:  { name: 'Spyglass',  role: 'support',  icon: '🔭', effect: 'range', amount: 1, target: 'up' },
    shield:    { name: 'Shield',    role: 'defender', icon: '🛡️', block: 3 },
  };

  const ENEMY_TYPES = {
    goblin:  { name: 'Goblin',   icon: '👺' },
    orc:     { name: 'Orc',      icon: '👹' },
    knight:  { name: 'Knight',   icon: '🗿' },
    archer:  { name: 'Skeleton', icon: '💀' },
    barrel:  { name: 'Barrel',   icon: '🛢️', barrel: true, blast: 2 },
  };

  const key = (r, c) => r + ',' + c;
  const parseKey = (k) => k.split(',').map(Number);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // Card value with per-card upgrades falling back to the type default.
  function cardStat(card, field) {
    return card[field] !== undefined ? card[field] : CARD_TYPES[card.type][field];
  }

  // Build a stage's starting state from its definition.
  function createState(stage) {
    return {
      hp: stage.heroHp,
      maxHp: stage.heroMaxHp,
      turn: 1,
      damageTaken: 0,
      status: 'playing', // 'playing' | 'cleared' | 'defeated'
      enemies: stage.enemies.map((e, i) => {
        const t = ENEMY_TYPES[e.type];
        return {
          id: 'e' + i,
          type: e.type,
          row: e.row,
          col: e.col,
          hp: t.barrel ? (e.hp || 1) : e.hp,
          maxHp: t.barrel ? (e.hp || 1) : e.hp,
          atk: t.barrel ? 0 : e.atk,
          armor: e.armor || 0,
          alive: true,
        };
      }),
    };
  }

  // Final numbers for every placed card after supporters are applied.
  // Rule: add all + bonuses first, then apply all × multipliers.
  function computeStats(placement, army) {
    const byId = {};
    army.forEach((c) => { byId[c.id] = c; });
    const stats = {};
    for (const k of Object.keys(placement)) {
      const card = byId[placement[k]];
      if (!card) continue;
      const [r, c] = parseKey(k);
      const type = CARD_TYPES[card.type];
      stats[k] = {
        key: k, r, c, card, type,
        baseAtk: cardStat(card, 'atk'),
        baseRange: cardStat(card, 'range'),
        plus: 0, mult: 1, rangeBonus: 0,
        boostedBy: [], boosts: [],
      };
    }
    for (const s of Object.values(stats)) {
      if (s.type.role !== 'support') continue;
      for (const tk of supportTargets(s.type.target, s.r, s.c)) {
        const t = stats[tk];
        if (!t || t.type.role !== 'attacker') continue;
        const amount = cardStat(s.card, 'amount');
        if (s.type.effect === 'atk') t.plus += amount;
        else if (s.type.effect === 'mult') t.mult *= amount;
        else if (s.type.effect === 'range') t.rangeBonus += amount;
        t.boostedBy.push(s.key);
        s.boosts.push(tk);
      }
    }
    for (const s of Object.values(stats)) {
      if (s.type.role === 'attacker') {
        s.atk = (s.baseAtk + s.plus) * s.mult;
        s.range = s.baseRange + s.rangeBonus;
      } else if (s.type.role === 'defender') {
        s.block = cardStat(s.card, 'block');
      }
    }
    return stats;
  }

  // Tiles a supporter affects. Only player tiles count.
  function supportTargets(target, r, c) {
    const cells = target === 'up'
      ? [[r - 1, c]]
      : [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
    return cells
      .filter(([tr, tc]) => tr >= 2 && tr < ROWS && tc >= 0 && tc < COLS)
      .map(([tr, tc]) => key(tr, tc));
  }

  function enemyAt(enemies, row, col) {
    return enemies.find((e) => e.alive && e.row === row && e.col === col) || null;
  }

  // Distance from a player tile up to an enemy row.
  const distance = (playerRow, enemyRow) => playerRow - enemyRow;

  // The first living enemy in a column, if it is within range.
  function firstInColumn(enemies, col, r, range) {
    for (const er of ENEMY_ROWS) {
      const e = enemyAt(enemies, er, col);
      if (e) return distance(r, er) <= range ? e : null;
    }
    return null;
  }

  // Which enemies an attacker would hit given the current board.
  function targetsFor(s, enemies) {
    const { r, c, range } = s;
    const pattern = s.type.pattern;
    if (pattern === 'straight') {
      const e = firstInColumn(enemies, c, r, range);
      return e ? [e] : [];
    }
    if (pattern === 'pierce') {
      return ENEMY_ROWS
        .map((er) => (distance(r, er) <= range ? enemyAt(enemies, er, c) : null))
        .filter(Boolean);
    }
    if (pattern === 'spread') {
      const out = [];
      for (const cc of [c - 1, c, c + 1]) {
        if (cc < 0 || cc >= COLS) continue;
        const e = firstInColumn(enemies, cc, r, range);
        if (e) out.push(e);
      }
      return out;
    }
    return [];
  }

  // Enemy tiles an attacker can reach at all (for range preview).
  function reachableTiles(s) {
    const cols = s.type.pattern === 'spread' ? [s.c - 1, s.c, s.c + 1] : [s.c];
    const out = [];
    for (const cc of cols) {
      if (cc < 0 || cc >= COLS) continue;
      for (const er of ENEMY_ROWS) {
        if (distance(s.r, er) <= s.range) out.push(key(er, cc));
      }
    }
    return out;
  }

  function dealDamage(state, e, amount, canCarry, events, source) {
    const dmg = Math.max(0, amount - e.armor);
    const before = e.hp;
    e.hp = Math.max(0, e.hp - dmg);
    const killed = dmg >= before;
    events.push({ t: 'hit', id: e.id, amount, dmg, armor: e.armor, hp: e.hp, killed, source });
    if (!killed) return;
    e.alive = false;
    const leftover = dmg - before;
    // Overkill: leftover damage carries to the enemy directly behind.
    if (canCarry && leftover > 0 && e.row === 1) {
      const behind = enemyAt(state.enemies, 0, e.col);
      if (behind) {
        events.push({ t: 'overkill', from: e.id, id: behind.id, amount: leftover });
        dealDamage(state, behind, leftover, false, events, 'overkill');
      }
    }
    const type = ENEMY_TYPES[e.type];
    if (type.barrel) {
      events.push({ t: 'explode', id: e.id, amount: type.blast });
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const n = enemyAt(state.enemies, e.row + dr, e.col + dc);
        if (n) dealDamage(state, n, type.blast, false, events, 'explode');
      }
    }
  }

  const isThreat = (e) => e.alive && !ENEMY_TYPES[e.type].barrel;

  // Resolve one full turn: attackers fire, survivors strike, survivors enrage.
  // Returns the new state and an ordered event list for animation.
  function resolveTurn(state0, placement, army) {
    const state = clone(state0);
    const events = [];
    const stats = computeStats(placement, army);

    // Attackers fire front row first, then left to right.
    const attackers = Object.values(stats)
      .filter((s) => s.type.role === 'attacker')
      .sort((a, b) => a.r - b.r || a.c - b.c);
    for (const s of attackers) {
      const targets = targetsFor(s, state.enemies);
      events.push({ t: 'fire', key: s.key, atk: s.atk, targets: targets.map((e) => e.id) });
      for (const e of targets) {
        if (!e.alive) continue; // killed earlier in this same volley (e.g. by a blast)
        dealDamage(state, e, s.atk, s.type.pattern !== 'pierce', events, s.key);
      }
      if (!state.enemies.some(isThreat)) break;
    }

    if (!state.enemies.some(isThreat)) {
      state.status = 'cleared';
      events.push({ t: 'cleared' });
      return { state, events };
    }

    // Surviving enemies strike the hero. Shields absorb damage in their column.
    for (let col = 0; col < COLS; col++) {
      const shieldKeys = PLAYER_ROWS.map((r) => key(r, col))
        .filter((k) => stats[k] && stats[k].type.role === 'defender');
      let pool = shieldKeys.reduce((sum, k) => sum + stats[k].block, 0);
      for (const er of ENEMY_ROWS) {
        const e = enemyAt(state.enemies, er, col);
        if (!e || !isThreat(e) || e.atk <= 0) continue;
        const blocked = Math.min(pool, e.atk);
        pool -= blocked;
        const dmg = e.atk - blocked;
        state.hp = Math.max(0, state.hp - dmg);
        state.damageTaken += dmg;
        events.push({ t: 'strike', id: e.id, atk: e.atk, blocked, dmg, shields: shieldKeys, hp: state.hp });
      }
    }

    if (state.hp <= 0) {
      state.status = 'defeated';
      events.push({ t: 'defeated' });
      return { state, events };
    }

    // Survivors enrage, so long fights get expensive.
    const raged = state.enemies.filter(isThreat);
    raged.forEach((e) => { e.atk += 1; });
    events.push({ t: 'enrage', ids: raged.map((e) => e.id) });
    state.turn += 1;
    return { state, events };
  }

  const Engine = {
    COLS, ROWS, ENEMY_ROWS, PLAYER_ROWS, CARD_TYPES, ENEMY_TYPES,
    key, parseKey, clone, cardStat,
    createState, computeStats, targetsFor, reachableTiles, resolveTurn, isThreat,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
  else root.Engine = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
