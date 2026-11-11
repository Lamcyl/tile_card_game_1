// V2 units (docs/V2_UNITS_PLAN.md): data-driven behaviours executed by generic primitives, behind `rules.v2`.
// Pure and deterministic (no Math.random). Loaded after engine.js; installs itself as Engine.hooks.v2. Exposes window.V2 and module.exports.
// Step 1 primitives: attack, skyfall, trample, swift, echo, chain, scale, molt, buff, grant, shield.
(function (root) {
  'use strict';
  const E = root.Engine || (typeof require !== 'undefined' ? require('./engine.js') : null);

  const RARITY_CP = { common: 1, rare: 2, epic: 3, legendary: 4 }; // = Progress.RARITY[..].cp, no stage surcharge (DESIGN_V2 6)
  const SKYFALL_RANGE = 99;
  let UNITS = {}, ELEMENTS = {}, FAMILIES = {};

  // Index the JSON from docs/data (units.json, elements.json, families.json). Arrays or id-keyed objects both work.
  function load(units, elements, families) {
    const idx = (v) => (Array.isArray(v) ? Object.fromEntries(v.map((x) => [x.id, x])) : v || {});
    UNITS = idx(units); ELEMENTS = idx(elements); FAMILIES = idx(families);
    return Object.keys(UNITS).length;
  }

  // Unit is implemented when it has behaviours and no `notYet`.
  const implemented = (u) => !!(u && u.behaviours && u.behaviours.length && !u.notYet);
  const maxStage = (u) => Math.max(1, Math.min(3, (u.evolution || []).length || 1));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // Stage patches: stages = { 2: [patch...], 3: [patch...] }. A patch is
  //   { op:'add', beh:{...} }                  append a behaviour
  //   { op:'set', p:'buff', set:{...}, i? }    merge fields into the i-th (default first) behaviour with that p
  //   { op:'inc', p:'shield', field:'block', by:1, i? }   add to a numeric field
  function applyPatches(beh, stages, stage) {
    let out = beh.map((b) => JSON.parse(JSON.stringify(b)));
    for (let st = 2; st <= stage; st++) {
      for (const patch of (stages && stages[st]) || []) {
        if (patch.op === 'add') { out.push(JSON.parse(JSON.stringify(patch.beh))); continue; }
        const matches = out.filter((b) => b.p === patch.p), t = matches[patch.i || 0];
        if (!t) continue;
        if (patch.op === 'set') Object.assign(t, patch.set);
        else if (patch.op === 'inc') t[patch.field] = (t[patch.field] || 0) + (patch.by || 1);
      }
    }
    return out;
  }

  // Build the army card for a unit: { stage, level (Mastery 1-5), stars (1-5) }.
  // Star and Mastery bonuses follow Progress.buildArmy: +1 ATK at 3 stars or Mastery 5, +1 range at 5 stars; Shields +1 each for 3 stars, 5 stars and Mastery 5.
  function card(unitId, o) {
    o = o || {};
    const u = UNITS[unitId];
    if (!u) throw new Error('V2.card: unknown unit ' + unitId);
    const stage = clamp(o.stage || 1, 1, maxStage(u)), level = clamp(o.level || 1, 1, 5), stars = clamp(o.stars || 1, 1, 5);
    const beh = applyPatches(u.behaviours || [], u.stages, stage);
    const star3 = stars >= 3 ? 1 : 0, star5 = stars >= 5 ? 1 : 0, vet = level >= 5 ? 1 : 0;
    const c = {
      id: unitId, type: 'v2', v2: true, unit: unitId, name: u.name,
      element: u.element, flavour: null, family: u.family, role: u.roles || null,
      stage, level, stars, rarity: u.rarity, cp: RARITY_CP[u.rarity] || 1, beh,
    };
    const at = beh.find((b) => b.p === 'attack'), sky = beh.find((b) => b.p === 'skyfall');
    if (at) { c.pattern = at.pattern; c.atk = at.atk + star3 + vet; c.range = at.range + star5; }
    else if (sky) { c.pattern = 'straight'; c.atk = sky.atk + star3 + vet; c.range = SKYFALL_RANGE; }
    const sh = beh.find((b) => b.p === 'shield');
    if (sh) c.block = sh.block + star3 + star5 + vet;
    return c;
  }

  // ---------- engine hooks ----------
  const behOf = (s, p) => (s.card.beh || []).filter((b) => b.p === p);
  const firstBeh = (s, p) => (s.card.beh || []).find((b) => b.p === p) || null;
  const memOf = (rules) => rules.v2mem || (rules.v2mem = { molt: {}, grow: {} }); // per-battle counters, keyed by card id, live in state.rules

  // Per-tile runtime data (s.v2) for a V2 card, called from computeStats.
  function initStat(s) {
    const v = { echo: false, swift: false, pounce: 0, trample: 0, chain: null, blockBonus: 0 };
    for (const b of s.card.beh || []) {
      if (b.p === 'echo') v.echo = b.factor || 0.5;
      else if (b.p === 'swift') v.swift = true;
      else if (b.p === 'scale' && b.when === 'fullHp') v.pounce += b.bonus || 0;
      else if (b.p === 'trample') v.trample = b.behind || 1;
      else if (b.p === 'chain') v.chain = b;
    }
    s.v2 = v;
    if (v.chain) s.fx = Object.assign({}, s.fx, { chain: true });
  }

  // Tiles a buff reaches (player tiles only).
  function targetTiles(tgt, s, rules, diag) {
    const { r, c } = s, rowCount = E.rowsFor(rules), rows = E.playerRowsFor(rules);
    let cells;
    if (tgt === 'up') cells = [[r - 1, c]];
    else if (tgt === 'up2') cells = [[r - 1, c], [r - 2, c]];
    else if (tgt === 'adjacent') cells = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].concat(diag ? [[r - 1, c - 1], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c + 1]] : []);
    else if (tgt === 'column') cells = rows.map((rr) => [rr, c]);
    else if (tgt === 'row') cells = Array.from({ length: E.COLS }, (_, cc) => [r, cc]);
    else if (tgt === 'board') cells = rows.flatMap((rr) => Array.from({ length: E.COLS }, (_, cc) => [rr, cc]));
    else cells = [];
    return cells.filter(([tr, tc]) => tr >= 2 && tr < rowCount && tc >= 0 && tc < E.COLS && !(tr === r && tc === c)).map(([tr, tc]) => E.key(tr, tc));
  }

  // Does target t match the kin rule of buff b coming from source s?
  function kinMatch(b, s, t) {
    if (!b.kin || !t.card.v2) return false;
    const by = b.kin.by || 'family';
    const want = b.kin.value !== undefined ? b.kin.value : s.card[by];
    return t.card[by] === want;
  }

  // Boost phase for V2 cards, after the classic support loop: buffs and grants, scale bonuses, molt. Adds to plus / rangeBonus / blockBonus (add first, multiply later).
  function boost(stats, rules) {
    const keys = Object.keys(stats), mem = rules.v2mem;
    const cards = Object.values(stats).filter((s) => s.card.v2);
    for (const s of cards) {
      for (const b of s.card.beh || []) {
        if (b.p === 'buff') {
          for (const tk of targetTiles(b.target, s, rules, b.diag)) {
            const t = stats[tk];
            if (!t) continue;
            const kin = kinMatch(b, s, t);
            if (b.kinOnly && !kin) continue;
            const amount = b.amount + (kin && !b.kinOnly && b.kin.amt ? b.kin.amt : 0);
            if (b.effect === 'atk') { if (!E.isAttacker(t)) continue; t.plus += amount; }
            else if (b.effect === 'range') { if (!E.isAttacker(t)) continue; t.rangeBonus += amount; }
            else if (b.effect === 'block') { if (!E.isDefender(t)) continue; t.v2 = t.v2 || { blockBonus: 0 }; t.v2.blockBonus += amount; }
            else continue;
            t.boostedBy.push(s.key); s.boosts.push(tk);
          }
        } else if (b.p === 'grant') {
          for (const tk of targetTiles(b.target, s, rules)) {
            const t = stats[tk];
            if (!t || !E.isAttacker(t)) continue;
            t.v2 = t.v2 || { blockBonus: 0 };
            if (b.gives === 'echo') t.v2.echo = t.v2.echo || 0.5;
            else if (b.gives === 'swift') t.v2.swift = true;
            t.boostedBy.push(s.key); s.boosts.push(tk);
          }
        } else if (b.p === 'scale' && E.isAttacker(s)) {
          let n = 0;
          if (b.when === 'lastPlaced') n = keys[keys.length - 1] === s.key ? 1 : 0;
          else if (b.when === 'firstPlaced') n = keys[0] === s.key ? 1 : 0;
          else if (b.when === 'perFamilyInRow') n = cards.filter((o) => o !== s && o.r === s.r && o.card.family === (b.family || s.card.family)).length;
          else if (b.when === 'perFamily') n = cards.filter((o) => o !== s && o.card.family === (b.family || s.card.family)).length;
          else if (b.when === 'perElement') n = cards.filter((o) => o !== s && o.card.element === (b.element || s.card.element)).length;
          else continue; // fullHp is a per-hit bonus (hitBonus)
          const bonus = b.cap !== undefined ? Math.min(b.cap, n * (b.bonus || 1)) : n * (b.bonus || 1);
          s.plus += bonus;
        } else if (b.p === 'molt' && E.isAttacker(s)) {
          s.plus += Math.min(b.cap || 3, ((mem && mem.molt[s.card.id]) || 0) * (b.per || 1));
        }
      }
    }
  }

  // After the final numbers: Shield block from V2 buffs, per-Kin and growth.
  function finish(stats, rules) {
    const mem = rules.v2mem, cards = Object.values(stats).filter((s) => s.card.v2);
    for (const s of Object.values(stats)) {
      if (!E.isDefender(s)) continue;
      let extra = (s.v2 && s.v2.blockBonus) || 0;
      for (const b of behOf(s, 'shield')) {
        if (b.perKin) {
          const by = b.perKin.by || 'family';
          const n = cards.filter((o) => o !== s && o.card[by] === s.card[by]).length;
          extra += Math.min(b.perKin.cap !== undefined ? b.perKin.cap : 99, n * (b.perKin.amt || 1));
        }
        if (b.grow) extra += Math.min(b.grow.cap || 3, ((mem && mem.grow[s.card.id]) || 0) * (b.grow.per || 1));
      }
      s.block += extra;
    }
  }

  // Swift attackers fire first (stable: keeps the row-then-column order inside each group).
  function order(attackers) {
    const swift = (s) => !!(s.v2 && s.v2.swift);
    return attackers.filter(swift).concat(attackers.filter((s) => !swift(s)));
  }

  // Extra damage on one hit (Pounce: +bonus against an enemy at full HP).
  function hitBonus(s, e) {
    return s.v2 && s.v2.pounce && e.hp === e.maxHp ? s.v2.pounce : 0;
  }

  // Damage of the chain jump: factor, or the wet factor against a Water or Wet target.
  function chainDmg(s, dmg, target) {
    const ch = (s.v2 && s.v2.chain) || { factor: 1 };
    const wet = (ch.wetVs || []).includes(target.element) || !!(target.st && target.st.wet); // element ids come from the unit data (elements.json), never a list here
    const f = wet && ch.wetFactor !== undefined ? ch.wetFactor : ch.factor !== undefined ? ch.factor : 1;
    return f === 1 ? dmg : Math.max(1, Math.ceil(dmg * f));
  }

  // After an attacker's main hits: Trample (1 behind the target's rear edge, not overkill), then Echo (a second volley at half ATK, rounded up).
  function afterFire(x) {
    const { state, s, hits, dmg, events, noArmor } = x, v = s.v2;
    if (!v) return;
    if (v.trample) {
      for (const { e, col } of hits) {
        let behind = null;
        for (let r = e.row - x.dOf(e); r >= -1 && !behind; r--) behind = x.enemyAt(state.enemies, r, col);
        if (!behind || behind === e) continue;
        if (behind.row === -1 && !x.gateOpen(state.enemies, col)) continue; // boss-row gate (R1)
        x.dealDamage(state, behind, v.trample, false, events, s.key, noArmor, col);
      }
    }
    if (v.echo) {
      const half = Math.ceil(dmg * v.echo), again = x.hitsFor(s, state.enemies);
      events.push({ t: 'echo', key: s.key, atk: half, targets: again.map((h) => h.e.id) });
      for (const { e, col } of again) {
        if (!e.alive) continue;
        x.dealDamage(state, e, half, s.pattern !== 'pierce', events, s.key, noArmor, col);
      }
    }
  }

  // End of turn: Molt and Carapace counters, per card id. A card survives every turn it stands on the board.
  function endTurn(state, stats, events) {
    if (!Object.values(stats).some((s) => s.card.v2 && (behOf(s, 'molt').length || behOf(s, 'shield').some((b) => b.grow)))) return; // nothing to count: leave the state as it is
    const mem = memOf(state.rules), struck = new Set(events.filter((ev) => ev.t === 'strike').map((ev) => ev.col));
    for (const s of Object.values(stats)) {
      if (!s.card.v2) continue;
      if (behOf(s, 'molt').length) mem.molt[s.card.id] = (mem.molt[s.card.id] || 0) + 1;
      if (E.isDefender(s) && behOf(s, 'shield').some((b) => b.grow) && !struck.has(s.c)) mem.grow[s.card.id] = (mem.grow[s.card.id] || 0) + 1;
    }
  }

  const V2 = { load, card, implemented, maxStage, applyPatches, initStat, boost, finish, order, hitBonus, chainDmg, afterFire, endTurn,
    get UNITS() { return UNITS; }, get ELEMENTS() { return ELEMENTS; }, get FAMILIES() { return FAMILIES; } };
  if (E) E.hooks.v2 = V2;
  root.V2 = V2;
  if (typeof module !== 'undefined' && module.exports) module.exports = V2;
})(typeof window !== 'undefined' ? window : globalThis);
