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
  // Camp track Board (WP16): rule flag `deepRow` adds a 4th player row (row 5, behind row 4). Everything that walks the board asks these.
  const rowsFor = (rules) => (rules && rules.deepRow ? ROWS + 1 : ROWS);
  const playerRowsFor = (rules) => (rules && rules.deepRow ? PLAYER_ROWS.concat(ROWS) : PLAYER_ROWS);
  // Heat "The board loses a column" (WP18): rule flag `lostCol` closes the rightmost player column (cards cannot stand there, enemies above it still strike).
  const lostColsFor = (rules) => Math.max(0, Math.min(2, (rules && rules.lostCol) || 0));
  const tileBlocked = (rules, k) => { const [r, c] = k.split(',').map(Number); return r >= 2 && c >= COLS - lostColsFor(rules); };
  const playerTilesFor = (rules) => { const out = []; for (const r of playerRowsFor(rules)) for (let c = 0; c < COLS - lostColsFor(rules); c++) out.push(r + ',' + c); return out; };

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
  // Hero abilities (WP15): usable once per battle, during the Plan phase, via useAbility(). `target` 'enemy' needs a tile choice.
  // rally / brace set a one-turn rule (rules.rally, rules.brace) that resolveTurn consumes; ration and ignite act at once.
  const HERO_ABILITIES = {
    rally:  { name: 'Rally',  icon: '📣', target: 'none',  text: 'Every attacker gets +1 ATK this turn.' },
    ignite: { name: 'Ignite', icon: '🔥', target: 'enemy', text: 'Set one enemy ablaze: a Barrel explodes at once, anything else takes 2 damage (ignores armor).' },
    ration: { name: 'Ration', icon: '🍱', target: 'none',  text: 'Heal the damage taken in this battle, up to 4 HP.' },
    brace:  { name: 'Brace',  icon: '🛡️', target: 'none',  text: 'Every enemy strike is weakened by 2 this turn.' },
  };
  const gimmickText = (e) => (ENEMY_GIMMICKS[e.gimmick] ? ENEMY_GIMMICKS[e.gimmick].text.replace('{n}', e.gp) : '');

  // Heat "heals are 50% weaker" (rule healHalf): the hero's healing is halved, rounded down (a 1-HP Lifebloom tick is lost).
  const healFor = (rules, n) => (rules && rules.healHalf ? Math.floor(n / 2) : n);

  const key = (r, c) => r + ',' + c;
  const parseKey = (k) => k.split(',').map(Number);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // Card value with per-card upgrades falling back to the type default.
  function cardStat(card, field) {
    return card[field] !== undefined ? card[field] : CARD_TYPES[card.type][field];
  }

  // Rule-driven attacker ATK bonus (WP12 relics): "feast" (kills by overkill, rules.feastN, max 3) and "kindle" (first turn only).
  function syncBonus(rules, turn) {
    rules.bonusAtk = (rules.feast ? rules.feastN || 0 : 0) + (rules.kindle && turn === 1 ? rules.kindle : 0) + (rules.rally || 0);
    return rules;
  }

  // Build a stage's starting state from its definition.
  function createState(stage) {
    return {
      hp: stage.heroHp,
      maxHp: stage.heroMaxHp,
      turn: 1,
      damageTaken: 0,
      // Rule flags from equipped Legendaries and squad traits (Progress.rulesFor): spill, blast, opening, soften, sunder, stand, mend, revive. Empty by default.
      rules: syncBonus(Object.assign({}, stage.rules), 1),
      hero: stage.hero || null,       // WP15: hero id and its once-per-battle ability (HERO_ABILITIES key); abilityUsed flips when spent
      ability: stage.ability || null,
      abilityUsed: false,
      barrier: Math.max(0, (stage.rules && stage.rules.barrier) || 0), // Camp Ward (WP16): soaks the first damage of this battle
      reviveUsed: 0,                  // revives spent in this battle (Phoenix Archer, Camp Second Wind); rules.revive = revives still available
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
  function computeStats(placement, army, enemies, rules) {
    rules = rules || {};
    const byId = {};
    army.forEach((c) => { byId[c.id] = c; });
    const stats = {};
    for (const k of Object.keys(placement)) {
      const card = byId[placement[k]];
      if (!card || tileBlocked(rules, k)) continue; // a closed column (Heat) holds no card
      const [r, c] = parseKey(k);
      const type = CARD_TYPES[card.type];
      stats[k] = {
        key: k, r, c, card, type,
        baseAtk: cardStat(card, 'atk'),
        baseRange: cardStat(card, 'range'),
        // WP10: a card may carry its own firing pattern and unit effects (fx: ignoreArmor, chain) from its roster entry.
        pattern: card.pattern || type.pattern,
        fx: card.fx || null,
        plus: type.role === 'attacker' ? rules.bonusAtk || 0 : 0, mult: 1, rangeBonus: type.role === 'attacker' ? rules.reach || 0 : 0,
        boostedBy: [], boosts: [],
      };
    }
    for (const s of Object.values(stats)) {
      if (s.type.role !== 'support') continue;
      for (const tk of supportTargets(s.type.target, s.r, s.c, rules.diagAll || (rules.diag && s.card.type === 'banner'), rowsFor(rules))) {
        const t = stats[tk];
        if (!t || t.type.role !== 'attacker') continue;
        const amount = cardStat(s.card, 'amount');
        if (s.type.effect === 'atk') t.plus += amount + (rules.bannerBite && s.card.type === 'banner' ? rules.bannerBite : 0);
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
        s.block = cardStat(s.card, 'block') + (rules.plate || 0);
      }
    }
    return stats;
  }

  // Tiles a supporter affects. Only player tiles count.
  // `diag` (set bonus Wolfpack): a Banner also boosts its four diagonal neighbours.
  function supportTargets(target, r, c, diag, rowCount) {
    const cells = target === 'up'
      ? [[r - 1, c]].concat(diag ? [[r - 1, c - 1], [r - 1, c + 1]] : [])
      : [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].concat(diag ? [[r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1]] : []);
    return cells
      .filter(([tr, tc]) => tr >= 2 && tr < (rowCount || ROWS) && tc >= 0 && tc < COLS)
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
    const pattern = s.pattern || s.type.pattern;
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
    const cols = (s.pattern || s.type.pattern) === 'spread' ? [s.c - 1, s.c, s.c + 1] : [s.c];
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

  function dealDamage(state, e, amount, canCarry, events, source, ignoreArmor) {
    const armor = ignoreArmor ? 0 : source === 'explode' ? e.armor : Math.max(0, e.armor - ((state.rules && state.rules.sunder) || 0));
    let dmg = Math.max(0, amount - armor);
    const warded = wardReason(state, e, amount);
    if (warded) dmg = 0;
    const before = e.hp;
    e.hp = Math.max(0, e.hp - dmg);
    const killed = !warded && dmg >= before;
    events.push({ t: 'hit', id: e.id, amount, dmg, armor: e.armor, hp: e.hp, killed, source, warded });
    if (!killed) return;
    e.alive = false;
    if (source === 'overkill' && state.rules && state.rules.feast && (state.rules.feastN || 0) < 3) {
      state.rules.feastN = (state.rules.feastN || 0) + 1; syncBonus(state.rules, state.turn);
      events.push({ t: 'feast', n: state.rules.feastN });
    }
    const leftover = dmg - before;
    // Overkill: leftover damage carries to the enemy directly behind.
    if (canCarry && leftover > 0 && e.row === 1) {
      const behind = enemyAt(state.enemies, 0, e.col);
      if (behind && e.kind === 'bulwark') events.push({ t: 'bulwark', id: e.id, amount: leftover });
      else if (behind) {
        events.push({ t: 'overkill', from: e.id, id: behind.id, amount: leftover });
        dealDamage(state, behind, leftover, false, events, 'overkill');
      }
      // Legendary rule "spill": the leftover also hits the front-row enemies on either side.
      if (state.rules && state.rules.spill) {
        for (const dc of [-1, 1]) {
          const side = enemyAt(state.enemies, 1, e.col + dc);
          if (!side) continue;
          events.push({ t: 'overkill', from: e.id, id: side.id, amount: leftover, side: true });
          dealDamage(state, side, leftover, false, events, 'overkill');
        }
      }
    }
    if (e.kind === 'splitter') splitInto(state, e, events);
    const type = ENEMY_TYPES[e.type];
    if (type.barrel) {
      const blast = Math.max(type.blast, (state.rules && state.rules.blast) || 0);
      // Relic "echo" (Mjölnir Shard): the blast goes off a second time.
      for (let pass = 0; pass < (state.rules && state.rules.echo ? 2 : 1); pass++) {
        events.push({ t: 'explode', id: e.id, amount: blast, echo: pass === 1 });
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const n = enemyAt(state.enemies, e.row + dr, e.col + dc);
          if (n) dealDamage(state, n, blast, false, events, 'explode');
        }
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

  // Can the hero use the ability right now? Returns null or the reason.
  function abilityProblem(state, target) {
    if (!state.ability || !HERO_ABILITIES[state.ability]) return 'no ability';
    if (state.status !== 'playing') return 'battle over';
    if (state.abilityUsed) return 'already used';
    if (HERO_ABILITIES[state.ability].target === 'enemy' && !(target && state.enemies.some((e) => e.alive && e.id === target))) return 'choose an enemy';
    if (state.ability === 'ration' && state.hp >= state.maxHp) return 'already at full health';
    return null;
  }
  // Use the hero ability (Plan phase). `target` = enemy id for targeted abilities. Returns { state, events } or null if it cannot be used.
  function useAbility(state0, target) {
    if (abilityProblem(state0, target)) return null;
    const state = clone(state0), events = [], id = state.ability;
    state.abilityUsed = true;
    events.push({ t: 'ability', id, hero: state.hero, target: target || null });
    if (id === 'rally') { state.rules.rally = 1; syncBonus(state.rules, state.turn); }
    else if (id === 'brace') state.rules.brace = 2;
    else if (id === 'ration') {
      const amount = Math.min(state.maxHp - state.hp, healFor(state.rules, Math.min(4, state.damageTaken)));
      state.hp += amount; events.push({ t: 'mend', amount, hp: state.hp, source: 'ration' });
    } else if (id === 'ignite') {
      const e = state.enemies.find((x) => x.id === target);
      dealDamage(state, e, ENEMY_TYPES[e.type].barrel ? e.hp : 2, false, events, 'ignite', true);
      if (!state.enemies.some(isThreat)) { state.status = 'cleared'; events.push({ t: 'cleared' }); }
    }
    return { state, events };
  }

  // Resolve one full turn: attackers fire, survivors strike, survivors enrage.
  // Returns the new state and an ordered event list for animation.
  function resolveTurn(state0, placement, army) {
    const state = clone(state0);
    if (!state.rules) state.rules = {};
    const events = [];
    const stats = computeStats(placement, army, state.enemies, state.rules);

    // Attackers fire front row first, then left to right.
    const attackers = Object.values(stats)
      .filter((s) => s.type.role === 'attacker')
      .sort((a, b) => a.r - b.r || a.c - b.c);
    let opened = false;
    for (const s of attackers) {
      const targets = targetsFor(s, state.enemies);
      // Legendary rule "opening": the first shot that finds a target in the first turn deals double damage.
      const dmg = state.rules.opening && state.turn === 1 && !opened && targets.length ? (opened = true, s.atk * 2) : s.atk;
      events.push({ t: 'fire', key: s.key, atk: dmg, targets: targets.map((e) => e.id) });
      const noArmor = !!(s.fx && s.fx.ignoreArmor); // Longbowman: arrows ignore armor
      for (const e of targets) {
        if (!e.alive) continue; // killed earlier in this same volley (e.g. by a blast)
        dealDamage(state, e, dmg, s.pattern !== 'pierce', events, s.key, noArmor);
      }
      // Storm Mage: lightning leaps to one more enemy next to a struck one (lowest HP first), for the same damage.
      if (s.fx && s.fx.chain && targets.length) {
        const hit = new Set(targets.map((e) => e.id));
        const next = state.enemies.filter((o) => o.alive && !hit.has(o.id) && !ENEMY_TYPES[o.type].barrel &&
          targets.some((t) => Math.abs(t.row - o.row) + Math.abs(t.col - o.col) === 1)).sort((a, b) => a.hp - b.hp)[0];
        if (next) {
          events.push({ t: 'chain', key: s.key, from: targets[0].id, id: next.id });
          dealDamage(state, next, dmg, false, events, s.key, noArmor);
        }
      }
      if (!state.enemies.some(isThreat)) break;
    }

    if (!state.enemies.some(isThreat)) {
      state.status = 'cleared';
      events.push({ t: 'cleared' });
      return { state, events };
    }

    if (state.rules.rally) { delete state.rules.rally; syncBonus(state.rules, state.turn); } // Rally lasts for one volley
    // Surviving enemies strike the hero. Shields absorb damage in their column.
    const pools = [];
    const shieldsOf = [];
    for (let col = 0; col < COLS; col++) {
      shieldsOf[col] = playerRowsFor(state.rules).map((r) => key(r, col)).filter((k) => stats[k] && stats[k].type.role === 'defender');
      pools[col] = shieldsOf[col].reduce((sum, k) => sum + stats[k].block, 0);
      if (state.rules.aegis && state.turn === 1) pools[col] *= 2; // relic "aegis": Shields block double on the first turn
    }
    const strike = (e, col, atk, splash) => {
      const blocked = Math.min(pools[col], atk);
      pools[col] -= blocked;
      let dmg = Math.max(0, atk - blocked - (state.rules.soften || 0) - (state.rules.brace || 0));
      const warded = Math.min(state.barrier || 0, dmg);
      if (warded) { state.barrier -= warded; dmg -= warded; }
      state.hp = Math.max(0, state.hp - dmg);
      state.damageTaken += dmg;
      events.push({ t: 'strike', id: e.id, atk, blocked, warded, dmg, shields: shieldsOf[col], hp: state.hp, col, splash });
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

    if (state.rules.brace) delete state.rules.brace; // Brace lasts for one strike
    // Legendary rule "stand": once per battle a lethal blow leaves 1 HP.
    if (state.hp <= 0 && state.rules.stand && !state.standUsed) { state.hp = 1; state.standUsed = true; events.push({ t: 'stand', hp: 1 }); }
    // Revive (Phoenix Archer, Camp Second Wind): rules.revive = revives available this battle; the caller adds state.reviveUsed to the run's tally.
    if (state.hp <= 0 && (state.rules.revive || 0) > (state.reviveUsed || 0)) {
      state.hp = Math.max(1, Math.ceil(state.maxHp / 2)); state.reviveUsed = (state.reviveUsed || 0) + 1; events.push({ t: 'revive', hp: state.hp });
    }
    if (state.hp <= 0) {
      state.status = 'defeated';
      events.push({ t: 'defeated' });
      return { state, events };
    }

    // Survivors enrage, so long fights get expensive.
    const raged = state.enemies.filter(isThreat);
    const enrageBy = 1 + (state.rules.enrageMore || 0); // Heat: enrage gives +2 instead of +1
    raged.forEach((e) => { e.atk += enrageBy; });
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
    // Legendary rule "mend": heal 1 HP at the end of every turn survived.
    if (state.rules.mend && state.hp < state.maxHp) { state.hp = Math.min(state.maxHp, state.hp + healFor(state.rules, state.rules.mend)); events.push({ t: 'mend', amount: healFor(state.rules, state.rules.mend), hp: state.hp }); }
    state.turn += 1;
    syncBonus(state.rules, state.turn);
    return { state, events };
  }

  const Engine = {
    COLS, ROWS, ENEMY_ROWS, PLAYER_ROWS, rowsFor, playerRowsFor, lostColsFor, tileBlocked, playerTilesFor, healFor, CARD_TYPES, ENEMY_TYPES, ENEMY_KINDS, ENEMY_GIMMICKS, HERO_ABILITIES, gimmickText, incomingByColumn,
    key, parseKey, clone, cardStat,
    createState, computeStats, targetsFor, reachableTiles, resolveTurn, useAbility, abilityProblem, isThreat,
  };

  // Always set the global (the browser bundle wraps this file as CommonJS),
  // and also export it for Node tools.
  root.Engine = Engine;
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
