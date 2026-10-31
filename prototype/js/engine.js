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

  // Special enemy rules (set per enemy as `kind`, so any themed creature can carry one).
  const ENEMY_KINDS = {
    healer:   { name: 'Healer',   badge: '✚', text: 'heals each adjacent enemy by 2 at the end of every turn it survives' },
    splitter: { name: 'Splitter', badge: '⑂', text: 'splits into two 1-HP enemies when destroyed' },
    summoner: { name: 'Summoner', badge: '⚑', text: 'calls a new minion into an empty enemy tile at the end of every turn it survives' },
    bulwark:  { name: 'Bulwark',  badge: '⛨', text: 'blocks overkill and Pierce from reaching the enemy behind it' },
  };

  // Boss / elite gimmicks (set per enemy as `gimmick`, parameter `gp`). One per fight, announced before it starts.
  // `text` may use {n} for the parameter. Handled in dealDamage (guard, ward, veil, regrow) and resolveTurn (the rest).
  const ENEMY_GIMMICKS = {
    guard:  { name: 'Guarded',   badge: '♜', text: 'takes no damage while its guard (marked ♜) still stands' },
    ward:   { name: 'Hide',      badge: '◈', text: 'ignores every hit weaker than {n} damage' },
    veil:   { name: 'Veiled',    badge: '☁', text: 'cannot be hurt during the first {n} turn(s)' },
    gaze:   { name: 'Gaze',      badge: '◉', text: 'attackers in its column lose {n} ATK' },
    sweep:  { name: 'Sweep',     badge: '≋', text: 'also strikes both neighbouring columns for half its damage' },
    stride: { name: 'Stride',    badge: '⇄', text: 'steps one column sideways every turn, swapping places with whoever is there' },
    tide:   { name: 'Tide',      badge: '〰', text: 'every enemy is carried one column each turn: the back row drifts left, the front row right' },
    regrow: { name: 'Regrow',    badge: '❀', text: 'grows back once with {n} HP at the end of a turn if the fight is not over' },
    regen:  { name: 'Regenerate', badge: '✚', text: 'heals {n} HP at the end of every turn' },
    rage:   { name: 'Fury',      badge: '♨', text: 'gains {n} extra ATK every turn it survives' },
    harden: { name: 'Harden',    badge: '▣', text: 'gains 1 armor every turn it survives (up to {n})' },
  };
  const gimmickText = (e) => (ENEMY_GIMMICKS[e.gimmick] ? ENEMY_GIMMICKS[e.gimmick].text.replace('{n}', e.gp) : '');

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
          // Special rule: 'healer' | 'splitter' | 'summoner' | 'bulwark' (null for plain enemies).
          // minion = { type, hp, atk } is what a Splitter / Summoner spawns.
          kind: e.kind || null,
          minion: e.minion || null,
          // Boss / elite gimmick (see ENEMY_GIMMICKS) and its parameter; `guardian` marks the escort a 'guard' boss hides behind.
          gimmick: e.gimmick || null,
          gp: e.gp || 0,
          guardian: !!e.guardian,
          dir: e.dir || 1,
          lives: e.gimmick === 'regrow' ? 1 : 0,
        };
      }),
    };
  }

  // Final numbers for every placed card after supporters are applied.
  // Rule: add all + bonuses first, then apply all × multipliers.
  function computeStats(placement, army, enemies) {
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
        // A gazing enemy weakens every attacker in its column.
        const gaze = (enemies || []).filter((e) => e.alive && e.gimmick === 'gaze' && e.col === s.c).reduce((n, e) => n + e.gp, 0);
        if (gaze) { s.gazed = Math.min(gaze, s.atk); s.atk -= s.gazed; }
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
      const hit = ENEMY_ROWS
        .map((er) => (distance(r, er) <= range ? enemyAt(enemies, er, c) : null))
        .filter(Boolean);
      // A Bulwark in the front row stops the shot there.
      return hit[0] && hit[0].kind === 'bulwark' && hit[0].row === 1 ? [hit[0]] : hit;
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

  // Why a hit does nothing at all (boss gimmicks), or null.
  function wardReason(state, e, amount) {
    if (e.gimmick === 'guard' && state.enemies.some((o) => o.alive && o.guardian)) return 'guard';
    if (e.gimmick === 'ward' && amount < e.gp) return 'ward';
    if (e.gimmick === 'veil' && state.turn <= e.gp) return 'veil';
    return null;
  }

  function dealDamage(state, e, amount, canCarry, events, source) {
    let dmg = Math.max(0, amount - e.armor);
    const warded = wardReason(state, e, amount);
    if (warded) dmg = 0;
    const before = e.hp;
    e.hp = Math.max(0, e.hp - dmg);
    const killed = !warded && dmg >= before;
    events.push({ t: 'hit', id: e.id, amount, dmg, armor: e.armor, hp: e.hp, killed, source, warded });
    if (!killed) return;
    e.alive = false;
    const leftover = dmg - before;
    // Overkill: leftover damage carries to the enemy directly behind.
    if (canCarry && leftover > 0 && e.row === 1) {
      const behind = enemyAt(state.enemies, 0, e.col);
      if (behind && e.kind === 'bulwark') events.push({ t: 'bulwark', id: e.id, amount: leftover });
      else if (behind) {
        events.push({ t: 'overkill', from: e.id, id: behind.id, amount: leftover });
        dealDamage(state, behind, leftover, false, events, 'overkill');
      }
    }
    if (e.kind === 'splitter') splitInto(state, e, events);
    const type = ENEMY_TYPES[e.type];
    if (type.barrel) {
      events.push({ t: 'explode', id: e.id, amount: type.blast });
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const n = enemyAt(state.enemies, e.row + dr, e.col + dc);
        if (n) dealDamage(state, n, type.blast, false, events, 'explode');
      }
    }
  }

  function spawn(state, src, row, col, hp, events, reason) {
    const m = src.minion || { type: src.type, hp: 2, atk: 1 };
    const t = ENEMY_TYPES[m.type];
    const born = {
      id: 'e' + state.enemies.length, type: m.type, row, col, hp, maxHp: hp,
      atk: t && t.barrel ? 0 : (m.atk || 1), armor: 0, alive: true, kind: null, minion: null, spawned: true, gimmick: null, gp: 0, guardian: false, dir: 1, lives: 0,
    };
    state.enemies.push(born);
    events.push({ t: 'spawn', from: src.id, reason, enemy: clone(born) });
    return born;
  }

  // Splitter: two 1-HP enemies, one in its own tile and one in an empty neighbouring enemy tile.
  function splitInto(state, e, events) {
    const spot = [[1 - e.row, e.col], [e.row, e.col - 1], [e.row, e.col + 1]]
      .find(([r, c]) => c >= 0 && c < COLS && !enemyAt(state.enemies, r, c));
    spawn(state, e, e.row, e.col, 1, events, 'split');
    if (spot) spawn(state, e, spot[0], spot[1], 1, events, 'split');
  }

  // Damage each column's enemies would deal next strike, sweepers included: [{col: n}] as an array of COLS numbers.
  function incomingByColumn(enemies) {
    const out = new Array(COLS).fill(0);
    for (const e of enemies) {
      if (!isThreat(e)) continue;
      out[e.col] += e.atk;
      if (e.gimmick === 'sweep') for (const c of [e.col - 1, e.col + 1]) if (c >= 0 && c < COLS) out[c] += Math.ceil(e.atk / 2);
    }
    return out;
  }

  const isThreat = (e) => e.alive && !ENEMY_TYPES[e.type].barrel;

  // Resolve one full turn: attackers fire, survivors strike, survivors enrage.
  // Returns the new state and an ordered event list for animation.
  function resolveTurn(state0, placement, army) {
    const state = clone(state0);
    const events = [];
    const stats = computeStats(placement, army, state.enemies);

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
    const pools = [];
    const shieldsOf = [];
    for (let col = 0; col < COLS; col++) {
      shieldsOf[col] = PLAYER_ROWS.map((r) => key(r, col)).filter((k) => stats[k] && stats[k].type.role === 'defender');
      pools[col] = shieldsOf[col].reduce((sum, k) => sum + stats[k].block, 0);
    }
    const strike = (e, col, atk, splash) => {
      const blocked = Math.min(pools[col], atk);
      pools[col] -= blocked;
      const dmg = atk - blocked;
      state.hp = Math.max(0, state.hp - dmg);
      state.damageTaken += dmg;
      events.push({ t: 'strike', id: e.id, atk, blocked, dmg, shields: shieldsOf[col], hp: state.hp, col, splash });
    };
    for (let col = 0; col < COLS; col++) {
      for (const er of ENEMY_ROWS) {
        const e = enemyAt(state.enemies, er, col);
        if (!e || !isThreat(e) || e.atk <= 0) continue;
        strike(e, col, e.atk, false);
      }
    }
    // Sweepers also strike the neighbouring columns for half damage (after every direct strike).
    for (const e of state.enemies.filter((x) => isThreat(x) && x.gimmick === 'sweep' && x.atk > 0)) {
      for (const col of [e.col - 1, e.col + 1]) if (col >= 0 && col < COLS) strike(e, col, Math.ceil(e.atk / 2), true);
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
    // Boss gimmicks that act at the end of the turn.
    for (const e of raged) {
      if (e.gimmick === 'rage') { e.atk += e.gp; events.push({ t: 'rage', id: e.id, amount: e.gp, atk: e.atk }); }
      if (e.gimmick === 'harden' && e.armor < e.gp) { e.armor += 1; events.push({ t: 'harden', id: e.id, armor: e.armor }); }
      if (e.gimmick === 'regen' && e.hp < e.maxHp) {
        const amount = Math.min(e.gp, e.maxHp - e.hp); e.hp += amount;
        events.push({ t: 'heal', id: e.id, targets: [{ id: e.id, amount, hp: e.hp }], self: true });
      }
    }

    // Healers mend their neighbours, then Summoners call reinforcements (they act at the end of the turn).
    for (const h of state.enemies.filter((e) => e.alive && e.kind === 'healer')) {
      const healed = [];
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const n = enemyAt(state.enemies, h.row + dr, h.col + dc);
        if (!n || n.hp >= n.maxHp) continue;
        const amount = Math.min(2, n.maxHp - n.hp);
        n.hp += amount;
        healed.push({ id: n.id, amount, hp: n.hp });
      }
      if (healed.length) events.push({ t: 'heal', id: h.id, targets: healed });
    }
    for (const sm of state.enemies.filter((e) => e.alive && e.kind === 'summoner')) {
      let best = null;
      for (const er of ENEMY_ROWS) {
        for (let c = 0; c < COLS; c++) {
          if (enemyAt(state.enemies, er, c)) continue;
          const d = Math.abs(c - sm.col) + (er === sm.row ? 0 : 1);
          if (!best || d < best.d) best = { d, r: er, c };
        }
      }
      if (best) spawn(state, sm, best.r, best.c, (sm.minion && sm.minion.hp) || 2, events, 'summon');
    }
    // Regrow: a fallen head grows back once, in its own tile if it is still free.
    for (const e of state.enemies.filter((x) => !x.alive && x.gimmick === 'regrow' && x.lives > 0)) {
      if (enemyAt(state.enemies, e.row, e.col)) continue;
      e.lives -= 1; e.alive = true; e.hp = Math.min(e.maxHp, e.gp || e.maxHp);
      events.push({ t: 'regrow', id: e.id, hp: e.hp });
    }
    // Movement: Stride (one sidestep, bouncing off the edge) and Tide (everyone is carried along).
    for (const e of state.enemies.filter((x) => x.alive && x.gimmick === 'stride')) {
      let to = e.col + e.dir;
      if (to < 0 || to >= COLS) { e.dir = -e.dir; to = e.col + e.dir; }
      const other = enemyAt(state.enemies, e.row, to);
      const from = e.col;
      if (other) other.col = from;
      e.col = to;
      events.push({ t: 'move', id: e.id, from: [e.row, from], to: [e.row, to], swap: other ? other.id : null });
    }
    if (state.enemies.some((x) => x.alive && x.gimmick === 'tide')) {
      const moves = [];
      for (const e of state.enemies.filter((x) => x.alive)) {
        const d = e.row === 0 ? -1 : 1;
        moves.push({ id: e.id, to: [e.row, (e.col + d + COLS) % COLS] });
      }
      moves.forEach((m) => { state.enemies.find((x) => x.id === m.id).col = m.to[1]; });
      events.push({ t: 'tide', moves });
    }
    state.turn += 1;
    return { state, events };
  }

  const Engine = {
    COLS, ROWS, ENEMY_ROWS, PLAYER_ROWS, CARD_TYPES, ENEMY_TYPES, ENEMY_KINDS, ENEMY_GIMMICKS, gimmickText, incomingByColumn,
    key, parseKey, clone, cardStat,
    createState, computeStats, targetsFor, reachableTiles, resolveTurn, isThreat,
  };

  // Always set the global (the browser bundle wraps this file as CommonJS),
  // and also export it for Node tools.
  root.Engine = Engine;
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
