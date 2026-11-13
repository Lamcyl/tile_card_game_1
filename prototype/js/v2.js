// V2 units (docs/V2_UNITS_PLAN.md): data-driven behaviours executed by generic primitives, behind `rules.v2`.
// Pure and deterministic (no Math.random). Loaded after engine.js; installs itself as Engine.hooks.v2. Exposes window.V2 and module.exports.
// Step 1 primitives: attack, skyfall, trample, swift, echo, chain, scale, molt, buff, grant, shield.
// Step 2: elements, affinity matrix, weakness hits, statuses, element and family sets, Rend, live enemy keywords.
// Step 2b: column merges and the merge mode (rules.v2.mergeMode 'own' | 'best'). Every element rule is data (docs/data/elements.json).
(function (root) {
  'use strict';
  const E = root.Engine || (typeof require !== 'undefined' ? require('./engine.js') : null);

  const RARITY_CP = { common: 1, rare: 2, epic: 3, legendary: 4 }; // = Progress.RARITY[..].cp, no stage surcharge (DESIGN_V2 6)
  const SKYFALL_RANGE = 99;
  let UNITS = {}, ELEMENTS = {}, FAMILIES = {}, AFFINITY = {}, WEAK = {}, MERGES = {}, MERGE_RULES = {}, DOC = {};

  // Index the JSON from docs/data (units.json, elements.json, families.json). Arrays or id-keyed objects both work.
  // `elements` is the whole elements.json document (elements[], affinity, weaknessHits[], merges[], mergeRules) or just the element list.
  const pairKey = (a, b) => [a, b].sort().join('+');
  function load(units, elements, families) {
    const idx = (v) => (Array.isArray(v) ? Object.fromEntries(v.map((x) => [x.id, x])) : v || {});
    const doc = elements && !Array.isArray(elements) && Array.isArray(elements.elements) ? elements : null;
    UNITS = idx(units); ELEMENTS = idx(doc ? doc.elements : elements); FAMILIES = idx(families);
    DOC = doc || {}; AFFINITY = DOC.affinity || {}; MERGE_RULES = DOC.mergeRules || {};
    WEAK = {}; (DOC.weaknessHits || []).forEach((w) => { WEAK[w.attacker + '>' + w.defender] = w; });
    MERGES = {}; (DOC.merges || []).forEach((m) => { MERGES[pairKey(m.pair[0], m.pair[1])] = m; });
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
      element: u.element, flavour: null, family: u.family, sub: u.type, role: u.roles || null,
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
  const memOf = (rules) => rules.v2mem || (rules.v2mem = { molt: {}, grow: {} }); // per-battle counters and column effects, live in state.rules
  const cfg = (rules) => (rules && rules.v2 && typeof rules.v2 === 'object' ? rules.v2 : {}); // rules.v2 is 1 or { mergeMode, affinity }
  const lower = (x) => String(x || '').toLowerCase();
  const elOf = (s) => lower(s.element || (s.card && s.card.element)); // a player tile's element (Attune and Mimic set s.element)
  const SETS = new WeakMap(); // stats object -> { fam, own, f } computed in boost

  // ---------- element sets and family sets ----------
  // Element sets (elements.json `resonance` text) at 2 and 4 placed units of an element; the flags are read by the primitives below.
  // `own` flags only help cards of that element, `f` flags are global.
  const ELEMENT_SETS = {
    fire: [{ atkT1: 1 }, { burnPlus: 1 }], water: [{ chainPlus: 1 }, { healTurn: 1 }], wood: [{ moltCap: 1 }, { bloomPlus: 1 }],
    earth: [{ shieldPlus: 1 }, { armorIgnore: 1 }], wind: [{ rangePlus: 1 }, { firstDouble: 1 }], lightning: [{ chainPlus: 1 }, { chainFirstFull: 1 }],
    light: [{ purge: 1 }, { heraldPlus: 1 }], shadow: [{ holdNeighbour: 1 }, { safeT1: 1 }],
  };
  const OWN_FLAGS = ['atkT1', 'moltCap', 'shieldPlus', 'rangePlus'];
  const level = (n) => (n >= 4 ? 2 : n >= 2 ? 1 : 0);
  function computeSets(stats, army, rules) {
    const placed = Object.values(stats).filter((s) => s.card.v2);
    const out = { fam: {}, own: {}, f: {}, wild: 0, counts: {} };
    if (cfg(rules).sets === false) return out; // dev switch: no family or element set bonuses
    const squad = (army || []).filter((c) => c && c.v2 && !c.drone), pool = squad.length ? squad : placed.map((s) => s.card).filter((c) => !c.drone);
    const count = {}; pool.forEach((c) => { count[c.family] = (count[c.family] || 0) + 1; });
    // Wilds: 2 Wilds units let one count as any family, 4 let two (greedy: the family set it lifts most, ties by count then id).
    const wilds = FAMILIES.wilds ? 'wilds' : null;
    const wcount = wilds ? count[wilds] || 0 : 0, wn = level(wcount);
    const fams = Object.keys(FAMILIES).sort();
    for (let i = 0; i < wn; i++) {
      let best = null;
      for (const f of fams) {
        if (f === wilds) continue;
        const gain = level((count[f] || 0) + 1) - level(count[f] || 0);
        if (!best || gain > best.gain || (gain === best.gain && (count[f] || 0) > (count[best.f] || 0))) best = { f, gain };
      }
      if (best) count[best.f] = (count[best.f] || 0) + 1;
    }
    for (const f of fams) out.fam[f] = level(count[f] || 0);
    const ec = {}; placed.forEach((s) => { const el = elOf(s); if (el) ec[el] = (ec[el] || 0) + 1; });
    for (const el of Object.keys(ec)) {
      const flags = ELEMENT_SETS[el]; if (!flags) continue;
      for (let l = 0; l < level(ec[el]); l++) for (const [k, v] of Object.entries(flags[l])) {
        if (OWN_FLAGS.includes(k)) { (out.own[el] = out.own[el] || {})[k] = (out.own[el][k] || 0) + v; if (k === 'shieldPlus' || k === 'rangePlus') out.f[k] = Math.max(out.f[k] || 0, v); }
        else out.f[k] = (out.f[k] || 0) + v;
      }
    }
    out.counts = ec;
    return out;
  }

  // Per-tile runtime data (s.v2) for a V2 card, called from computeStats.
  function initStat(s, rules) {
    const v = { echo: false, swift: false, pounce: 0, trample: 0, chain: null, blockBonus: 0, rend: 0, secPlus: 0 };
    for (const b of s.card.beh || []) {
      if (b.p === 'echo') { v.echo = b.factor || 0.5; v.echoMinus = b.minus || 0; }
      else if (b.p === 'swift') v.swift = true;
      else if (b.p === 'scale' && b.when === 'fullHp') v.pounce += b.bonus || 0;
      else if (b.p === 'trample') v.trample = b.behind || 1;
      else if (b.p === 'chain') v.chain = b;
      else if (b.p === 'rend') v.rend = Math.max(v.rend, b.cap || 3);
    }
    if (rules && rules.rend) v.rend = Math.max(v.rend, rules.rendCap || 3);
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
    else if (tgt === 'beside') cells = [[r, c - 1], [r, c + 1]];
    else if (tgt === 'upleft') cells = [[r - 1, c - 1]];
    else if (tgt === 'far') cells = [[r - 2, c]];
    else if (tgt === 'sidecols') cells = rows.flatMap((rr) => [[rr, c - 1], [rr, c + 1]]);
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

  // Boost phase for V2 cards, after the classic support loop: sets, buffs and grants, scale bonuses, molt, stored next-turn buffs.
  // Adds to plus / rangeBonus / blockBonus (add first, multiply later).
  // Converters first, so sets, buffs and merges see the final elements and patterns:
  // Offering (consumes the first adjacent Common ally: up, left, right, down), Mirror (copies pattern, ATK and range of the left unit), Attune (the unit above, with `both` also below), Mimic (element kept in rules.v2mem.mimic).
  const NEIGH = [[-1, 0], [0, -1], [0, 1], [1, 0]];
  function convert(stats, rules) {
    const ordered = Object.values(stats).filter((s) => s.card.v2).sort((a, b) => a.r - b.r || a.c - b.c), mem = rules.v2mem;
    for (const s of ordered) for (const b of behOf(s, 'offering')) {
      if (!stats[s.key]) continue;
      const hit = NEIGH.map(([dr, dc]) => stats[E.key(s.r + dr, s.c + dc)]).find((t) => t && t !== s && t.card.v2 && t.card.rarity === 'common' && !behOf(t, 'offering').length);
      if (!hit) continue;
      delete stats[hit.key]; s.plus += b.n || 2; s.v2.offered = hit.key;
    }
    for (const s of ordered) for (const b of behOf(s, 'mirror')) {
      const left = stats[E.key(s.r, s.c - 1)];
      if (!stats[s.key] || !left || !E.isAttacker(left)) continue;
      s.card = Object.assign({}, s.card, { pattern: left.pattern }); s.pattern = left.pattern;
      s.baseAtk = left.baseAtk; s.baseRange = left.baseRange + (b.range || 0); s.v2.mirrors = left.key;
    }
    for (const s of ordered) for (const b of behOf(s, 'attune')) {
      if (!stats[s.key]) continue;
      const cells = [[-1, 0]].concat(b.both ? [[1, 0]] : []);
      for (const [dr, dc] of cells) {
        const t = stats[E.key(s.r + dr, s.c + dc)];
        if (!t || t === s) continue;
        t.element = s.card.element; t.v2 = t.v2 || { blockBonus: 0 }; t.v2.attunedBy = s.key;
        if (b.atk && E.isAttacker(t)) t.plus += b.atk;
        s.boosts.push(t.key);
      }
    }
    if (mem && mem.mimic) for (const s of ordered) if (stats[s.key] && mem.mimic[s.card.id] && behOf(s, 'mimic').length) s.element = mem.mimic[s.card.id];
  }

  function boost(stats, rules, army, turn) {
    convert(stats, rules);
    const keys = Object.keys(stats), mem = rules.v2mem;
    const cards = Object.values(stats).filter((s) => s.card.v2);
    const sets = computeSets(stats, army, rules); SETS.set(stats, sets);
    // set bonuses on single cards
    for (const s of Object.values(stats)) {
      const own = sets.own[elOf(s)] || {}, v = s.v2;
      if (E.isAttacker(s)) {
        if (sets.f.rangePlus) s.rangeBonus += sets.f.rangePlus;
        if (turn === 1 && own.atkT1) s.plus += own.atkT1;
        if (mem && mem.buff && mem.buff[s.c]) s.plus += mem.buff[s.c];
      }
      if (!s.card.v2) continue;
      const L = sets.fam[s.card.family] || 0;
      if (E.isAttacker(s)) {
        if (s.card.family === 'wings' && L >= 1) s.rangeBonus += 1;
        if (s.card.family === 'hooves') { if (L >= 1 && turn === 1) s.plus += 1; if (L >= 2) v.swift = true; }
        if (s.card.family === 'fangs') { if (L >= 1 && s.pattern === 'straight') v.rend = Math.max(v.rend, 3); if (L >= 2) { if (v.rend) v.rend = Math.max(v.rend, 4); if (v.pounce) v.pounce += 1; } }
      }
      if (s.card.family === 'scales' && L >= 1) v.secPlus = 1;
    }
    for (const s of cards) {
      for (const b of s.card.beh || []) {
        if (b.p === 'buff') {
          const plusHerald = sets.f.heraldPlus && /^(herald|bond)/.test(s.card.sub || '') ? sets.f.heraldPlus : 0;
          for (const tk of targetTiles(b.target, s, rules, b.diag)) {
            const t = stats[tk];
            if (!t) continue;
            if (b.only && t.card.unit !== b.only) continue; // Bond: only the named partner
            const kin = kinMatch(b, s, t);
            if (b.kinOnly && !kin) continue;
            const amount = b.amount + (kin && !b.kinOnly && b.kin.amt ? b.kin.amt : 0) + plusHerald;
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
            if (b.gives === 'echo') { t.v2.echo = t.v2.echo || b.factor || 0.5; t.v2.echoMinus = Math.max(t.v2.echoMinus || 0, b.minus || 0); }
            else if (b.gives === 'swift') t.v2.swift = true;
            t.boostedBy.push(s.key); s.boosts.push(tk);
          }
        } else if (b.p === 'scale' && E.isAttacker(s)) {
          let n = 0;
          const fangs4 = sets.fam.fangs >= 1 && s.card.family === 'fangs';
          if (b.when === 'lastPlaced') n = keys[keys.length - 1] === s.key ? 1 : 0;
          else if (b.when === 'firstPlaced') n = keys[0] === s.key ? 1 : 0;
          else if (b.when === 'perFamilyInRow') {
            n = fangs4 && b.family === undefined ? Math.max(0, (army || []).filter((c) => c && c.v2 && c.family === 'fangs').length - 1) // Fangs 2-set: Howl counts the whole squad
              : cards.filter((o) => o !== s && o.r === s.r && o.card.family === (b.family || s.card.family)).length;
          }
          else if (b.when === 'perFamily') n = cards.filter((o) => o !== s && o.card.family === (b.family || s.card.family)).length;
          else if (b.when === 'perElement') n = cards.filter((o) => o !== s && o.card.element === (b.element || s.card.element)).length;
          else continue; // fullHp is a per-hit bonus (hitBonus)
          const bonus = b.cap !== undefined ? Math.min(b.cap, n * (b.bonus || 1)) : n * (b.bonus || 1);
          s.plus += bonus;
        } else if (b.p === 'molt' && E.isAttacker(s)) {
          s.plus += Math.min((b.cap || 3) + (((sets.own[elOf(s)] || {}).moltCap) || 0), ((mem && mem.molt[s.card.id]) || 0) * (b.per || 1));
        }
      }
    }
  }

  // After the final numbers: Shield block from V2 buffs, per-Kin, growth and set bonuses; stored Chill; then the column merges.
  function finish(stats, rules) {
    const mem = rules.v2mem, sets = SETS.get(stats) || { f: {}, own: {}, fam: {} }, cards = Object.values(stats).filter((s) => s.card.v2);
    for (const s of Object.values(stats)) {
      if (E.isAttacker(s) && mem && mem.chill && mem.chill[s.c] && s.atk > 0) s.atk = Math.max(Math.min(1, s.atk), s.atk - 1); // struck by a Chill enemy last turn
      if (!E.isDefender(s)) continue;
      let extra = ((s.v2 && s.v2.blockBonus) || 0) + (((sets.own[elOf(s)] || {}).shieldPlus) || 0) + (s.card.v2 && s.card.family === 'scales' && sets.fam.scales >= 1 ? 1 : 0);
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
    if (cards.length || Object.values(stats).some((s) => elOf(s))) merges(stats, rules);
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

  // ---------- column merges (2b) ----------
  // Attackers of a column (placed cards with an element that fire this turn), front to back.
  const colAttackers = (stats, c) => Object.values(stats).filter((s) => s.c === c && E.isAttacker(s) && s.atk >= 1 && elOf(s)).sort((a, b) => a.r - b.r);
  function merges(stats, rules) {
    const cap = (MERGE_RULES.cap && MERGE_RULES.cap.perColumnPerTurn) || 3, byCol = {};
    for (const s of Object.values(stats)) { delete s.merges; if (E.isAttacker(s) && s.atk >= 1 && elOf(s)) (byCol[s.c] = byCol[s.c] || []).push(s); }
    for (const c of Object.keys(byCol)) {
      const list = byCol[c].sort((a, b) => a.r - b.r), els = [];
      list.forEach((s) => { if (!els.includes(elOf(s))) els.push(elOf(s)); });
      const entries = [];
      for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) entries.push([els[i], els[j]]);
      els.forEach((el) => { if (list.filter((s) => elOf(s) === el).length >= 2) entries.push([el, el]); });
      for (const [a, b] of entries.slice(0, cap)) {
        const m = MERGES[pairKey(a, b)];
        if (!m) continue;
        const carrier = list.find((s) => elOf(s) === a || elOf(s) === b);
        const partner = a === b ? list.find((s) => s !== carrier && elOf(s) === a) : list.find((s) => elOf(s) === (elOf(carrier) === a ? b : a));
        (carrier.merges = carrier.merges || []).push({ id: m.id, name: m.name, kind: m.kind, pair: [a, b], col: +c, spec: m.effect, with: partner ? partner.key : null });
      }
    }
  }
  // A carrier with no target hands its merges to the next attacker of the pair in its column that has yet to fire, else they are lost.
  function passMerges(attackers, s) {
    if (!s.merges || !s.merges.length) return;
    const rest = attackers.slice(attackers.indexOf(s) + 1).filter((o) => o.c === s.c && elOf(o));
    const keep = [];
    for (const m of s.merges) {
      const nxt = rest.find((o) => m.pair.includes(elOf(o)));
      if (nxt) (nxt.merges = nxt.merges || []).push(m); else keep.push(m);
    }
    delete s.merges;
  }

  // ---------- effect specs (units, weakness hits and merges share them) ----------
  const flatten = (spec) => (!spec ? [] : spec.p === 'compose' ? spec.parts.flatMap(flatten) : spec.p === 'amplify' ? flatten(spec.effect).map((l) => Object.assign({}, l, { _amp: spec.of })) : [spec]);
  // Same status or primitive from several leaves on one hit: the strongest applies; flat bonus damage adds up to +2 (mergeRules.overlap).
  function resolveLeaves(list) {
    const out = [], by = {};
    let bonus = 0;
    for (const l of list) {
      if (l.p === 'bonusDmg') { bonus += l.n || 0; continue; }
      const k = l.p === 'onHit' ? l.p + ':' + (l.op || l.status) : l.p;
      const cur = by[k];
      if (!cur) { by[k] = l; out.push(l); continue; }
      if (l.p === 'onHit' && l.op === 'cleanse') { cur.what = Array.from(new Set((cur.what || []).concat(l.what || []))); continue; }
      const score = (x) => (x.n || 0) * (x.tickMult || 1) * 100 + (x.turns || 0) + (x.factor || 0) * 10 + (x.columns || 0);
      if (score(l) > score(cur)) { out[out.indexOf(cur)] = l; by[k] = l; }
    }
    if (bonus) out.unshift({ p: 'bonusDmg', n: Math.min(2, bonus) });
    return out;
  }

  const hasKw = (e, k) => !!(e.kw && e.kw.includes(k) && !(e.st && e.st.supp && e.st.supp[k] > 0));
  const stOf = (e) => e.st || (e.st = {});
  const isBarrel = (T, e) => !!T.ENEMY_TYPES[e.type].barrel;
  // Living bodies touching e (B5: any side; a boss-row body only through a gate-open column), array order = enemy id order.
  function neighbours(T, e) {
    const cells = T.cellsOf(e);
    return T.state.enemies.filter((o) => o.alive && o !== e && !isBarrel(T, o) &&
      cells.some(([r, c]) => T.cellsOf(o).some(([or, oc]) => Math.abs(r - or) + Math.abs(c - oc) === 1 && (or !== T.BOSS_ROW || T.gateOpen(T.state.enemies, oc)))));
  }
  const once = (v, key) => { v.done = v.done || {}; if (v.done[key]) return false; v.done[key] = true; return true; }; // statuses and areas once per attack action per body (B7)

  function heal(T, n, source) {
    const st = T.state, amount = Math.min(st.maxHp - st.hp, T.healFor(st.rules, n));
    if (amount <= 0) return;
    st.hp += amount; T.events.push({ t: 'mend', amount, hp: st.hp, source });
  }
  function emit(T, ev) { T.events.push(ev); }

  // The body behind e in column col (past its rear edge), the front body of a column, and the bodies in a column.
  function behindOf(T, e, col) {
    let behind = null;
    for (let r = e.row - T.dOf(e); r >= -1 && !behind; r--) behind = T.enemyAt(T.state.enemies, r, col);
    if (!behind || behind === e || (behind.row === -1 && !T.gateOpen(T.state.enemies, col))) return null;
    return behind;
  }
  const frontOf = (T, col) => [1, 0, -1].map((r) => T.enemyAt(T.state.enemies, r, col)).find(Boolean) || null; // the boss row is only found when rows 1 and 0 are empty (gate)
  const inColumn = (T, col) => T.state.enemies.filter((o) => o.alive && !isBarrel(T, o) && T.cellsOf(o).some(([, c]) => c === col));

  // Apply one status leaf to a body (statuses live in e.st).
  function applyStatus(T, ctx, e, leaf) {
    if (!e.alive || isBarrel(T, e)) return;
    const { s } = ctx, v = s.v2 || {}, st = stOf(e), sets = T.sets, name = leaf.status === 'venom' ? 'poison' : leaf.status, n = leaf.n || 1;
    if (!once(ctx.v, name + ':' + e.id + ':' + (leaf._amp || ''))) return;
    let turns = leaf.turns;
    if (name === 'burn') {
      turns = (leaf.turns || 2) + (ctx.unit ? sets.f.burnPlus || 0 : 0);
      const cur = st.burn || { n: 0, turns: 0, mult: 1 };
      st.burn = { n: Math.max(cur.n, n), turns: Math.max(cur.turns, turns), mult: Math.max(cur.mult, leaf.tickMult || 1) };
    } else if (name === 'poison') {
      const cap = 3 + (leaf.capPlus || 0) + (v.secPlus || 0);
      st.poison = Math.min(Math.max(cap, st.poison || 0), (st.poison || 0) + n);
    } else if (name === 'chill') {
      const list = st.chill || (st.chill = []), had = list.length > 0, t = !leaf.turns || leaf.turns >= 99 ? null : leaf.turns;
      if (list.length < 2) list.push({ t });
      if (had && ctx.unit && !st.freezeCd) { st.frozen = true; st.freezeCd = 3; emit(T, { t: 'freeze', id: e.id, key: s.key }); } // an Ice hit on a Chilled body
    } else if (name === 'sunder') st.shred = (st.shred || 0) + n;
    else if (name === 'mark') { st.mark = true; if (leaf.turns) st.markT = Math.max(st.markT || 0, leaf.turns); else delete st.markT; } // a unit Mark with `turns` lapses at the end of that turn
    else if (name === 'hold') {
      if (st.holdCd > 0 || st.hold) return;
      st.hold = true; st.holdCool = leaf.cooldown || 0;
      if (sets.f.holdNeighbour && !ctx.noNeighbour) for (const o of neighbours(T, e)) if (once(ctx.v, 'holdN:' + o.id)) applyStatus(T, Object.assign({}, ctx, { noNeighbour: true }), o, leaf);
    } else return;
    emit(T, { t: 'status', id: e.id, status: name, n, turns: turns === undefined ? null : turns, key: s.key, source: ctx.src });
  }
  function cleanse(T, ctx, e, what, turns) {
    if (!e.alive) return;
    const st = stOf(e);
    for (const w of what || []) {
      if (w === 'ghost') e.kw = (e.kw || []).filter((k) => k !== 'ghost');
      else if (w === 'hide') st.noward = true;
      else if (w === 'veiled') st.noveil = true;
      else { st.supp = st.supp || {}; st.supp[w] = Math.max(st.supp[w] || 0, turns || 1); }
    }
    emit(T, { t: 'status', id: e.id, status: 'cleanse', what: what || [], key: ctx.s.key, source: ctx.src });
  }

  // Pushes one body a column sideways (right, bouncing at the edge); Big bodies and the boss row are Heavy (B9). Swaps with a plain body in the way.
  function push(T, e, columns) {
    if (!e.alive || E.isBig(e) || e.row < 0) return;
    for (let i = 0; i < columns; i++) {
      let dir = e.dir === -1 ? -1 : 1, to = e.col + dir;
      if (to < 0 || to >= E.COLS) { dir = -dir; to = e.col + dir; }
      const other = T.enemyAt(T.state.enemies, e.row, to);
      if (other && E.isBig(other)) return;
      const from = e.col;
      if (other) other.col = from;
      e.col = to;
      emit(T, { t: 'move', id: e.id, from: [e.row, from], to: [e.row, to], swap: other ? other.id : null, push: true });
    }
  }

  // Chain jump(s): base damage x factor to the lowest-HP neighbour (then, with `second`, one more at that factor). Jump hits are judged on their own element.
  function jump(T, ctx, from, base, leaf) {
    const { s } = ctx, seen = new Set([from.id].concat(ctx.hitIds || []));
    let f = leaf.factor !== undefined ? leaf.factor : 1;
    if (T.sets.f.chainFirstFull && !T.scratch.chainUsed) { f = 1; T.scratch.chainUsed = true; } // Lightning 4-set: the first chain each turn deals full damage
    let cur = from;
    const legs = [f].concat(leaf.second ? [leaf.second] : []);
    for (const fac of legs) {
      const next = neighbours(T, cur).filter((o) => !seen.has(o.id)).sort((a, b) => a.hp - b.hp)[0];
      if (!next) break;
      seen.add(next.id);
      const d = (fac === 1 ? base : Math.max(1, Math.ceil(base * fac))) + (T.sets.f.chainPlus || 0) + ((s.v2 && s.v2.secPlus) || 0);
      emit(T, { t: 'chain', key: s.key, from: cur.id, id: next.id, via: ctx.src });
      hit(T, { s, e: next, dmg: d, noArmor: false, canCarry: false, fromEffect: true });
      cur = next;
    }
  }

  // Run one effect leaf after a hit.
  function applyLeaf(T, ctx, leaf) {
    const { s, e, v } = ctx, mem = () => memOf(T.state.rules);
    if (leaf.andBlock && once(v, 'guard+')) { const m = mem(); m.guard = m.guard || {}; m.guard[s.c] = (m.guard[s.c] || 0) + leaf.andBlock; } // Resonance of Water and Earth: this column blocks more
    if (leaf.p === 'onHit') {
      if (leaf.op === 'cleanse') { if (once(v, 'cleanse:' + e.id)) cleanse(T, ctx, e, leaf.what, leaf.turns); return; }
      if (leaf.centreOnly && ctx.col !== undefined && ctx.col !== s.c) return; // Spread: only the centre target
      if (leaf.frontOnly && !once(v, 'front:' + leaf.status)) return; // Pierce: only the first (front) body it hits
      const targets = [e];
      // unit extensions per stage: the whole column, the front body of the neighbouring column, the body behind, the bodies beside
      if (leaf.column && once(v, 'column:' + leaf.status)) targets.push(...inColumn(T, s.c).filter((o) => o !== e));
      if (leaf.alsoColumn && once(v, 'alsoCol:' + leaf.status)) { const f = frontOf(T, s.c + 1 < E.COLS ? s.c + 1 : s.c - 1); if (f && !targets.includes(f)) targets.push(f); }
      if (leaf.alsoBehind) { const b = behindOf(T, e, ctx.col !== undefined ? ctx.col : e.col); if (b && !targets.includes(b)) targets.push(b); }
      if (leaf.alsoBeside) for (const o of neighbours(T, e).filter((x) => x.row === e.row && !targets.includes(x))) targets.push(o);
      if (leaf.area === 'neighbours' && once(v, 'area:' + leaf.status)) targets.push(...neighbours(T, e));
      if (leaf.spreadTo && once(v, 'spread:' + leaf.status)) targets.push(...neighbours(T, e).filter((o) => enemyEl(T.state.rules, o) === leaf.spreadTo.element));
      for (const t of targets) applyStatus(T, ctx, t, leaf);
      if (leaf.andStatus) applyStatus(T, ctx, e, { status: leaf.andStatus });
    } else if (leaf.p === 'chain') {
      if (leaf.viaWeakness && v.chain) return; // a unit's own chain already jumps: the strongest applies, no double jump
      if (once(v, 'chain:' + e.id)) T.after.push(() => jump(T, ctx, e, ctx.base, leaf));
    } else if (leaf.p === 'heroHeal') {
      if (leaf.oncePerTurn) { if (T.scratch['heal:' + leaf.n]) return; T.scratch['heal:' + leaf.n] = true; }
      else if (!once(v, 'heal')) return;
      heal(T, leaf.n, 'v2');
    } else if (leaf.p === 'push') {
      if (once(v, 'push:' + e.id)) {
        const side = leaf.alsoNeighbour ? neighbours(T, e).find((o) => o.row === e.row) : null; // Cheonma stage 2: the body beside it is pushed too
        T.after.push(() => { push(T, e, leaf.columns || 1); if (side) push(T, side, leaf.columns || 1); if (leaf.andStatus) applyStatus(T, ctx, e, { status: leaf.andStatus }); });
      }
    } else if (leaf.p === 'buff') {
      if (leaf.nextTurn && leaf.effect === 'atk' && once(v, 'buffNext')) { const m = mem(); m.buffNext = m.buffNext || {}; m.buffNext[s.c] = Math.min(leaf.cap || 99, (m.buffNext[s.c] || 0) + leaf.amount); }
    } else if (leaf.p === 'colGuard') {
      if (once(v, 'guard')) { const m = mem(); m.guard = m.guard || {}; m.guard[s.c] = (m.guard[s.c] || 0) + leaf.block; }
    } else if (leaf.p === 'echo') v.echo = Math.max(v.echo || 0, leaf.factor || 0.5);
    else if (leaf.p === 'trample') v.trample = Math.max(v.trample || 0, leaf.behind || 1);
  }

  // ---------- kills, rebirth, moves ----------
  // onKill leaves: Souls (a run currency, counted in state.soulsBonus), hero heal. A leaf with `any` counts every kill on the board, else only the owner's.
  function onKill(T, s, e) {
    const state = T.state, ty = T.ENEMY_TYPES[e.type] || {}, elite = !!ty.boss;
    for (const o of Object.values(T.stats)) {
      if (!o.card.v2) continue;
      for (const b of behOf(o, 'onKill')) {
        if (o !== s && !b.any) continue;
        const n = (b.souls || 0) + (elite ? b.eliteExtra || 0 : 0) + (elite && e.row === T.BOSS_ROW ? b.bossExtra || 0 : 0);
        if (n > 0) { state.soulsBonus = (state.soulsBonus || 0) + n; emit(T, { t: 'souls', n, id: e.id, key: o.key }); }
        if (b.healHero) {
          const k = 'kheal:' + o.key;
          if (b.once && T.scratch[k]) continue;
          T.scratch[k] = true; heal(T, b.healHero, 'v2');
        }
      }
    }
  }
  // Rebirth: once per battle a Phoenix on the board raises the hero at half HP (the engine calls this when the hero fell).
  function rebirth(T) {
    const state = T.state;
    if (state.hp > 0) return;
    for (const s of Object.values(T.stats)) for (const b of behOf(s, 'heroGuard')) {
      if (!b.rebirth) continue;
      const mem = memOf(state.rules);
      if (mem.reborn) return;
      mem.reborn = 1; state.hp = Math.max(1, Math.ceil(state.maxHp / 2));
      if (b.keepShield) state.barrier = (state.barrier || 0) + b.keepShield;
      emit(T, { t: 'revive', hp: state.hp, source: 'rebirth', key: s.key });
      return;
    }
  }
  // Swaps and Drones change the board for the rest of the battle: they are stored as a move list in rules.v2mem.moves and replayed on the placement
  // at the start of every turn (a placement is the same object turn after turn; a UI that lets the player rearrange must clear the list).
  const droneCard = (id) => ({ id, type: 'v2', v2: true, unit: 'drone', name: 'Drone', element: '', family: '', sub: 'drone', role: { atk: 100, buff: 0, guard: 0 }, stage: 1, level: 1, stars: 1,
    rarity: 'common', cp: 0, drone: true, beh: [{ p: 'attack', pattern: 'straight', atk: 1, range: 2 }], pattern: 'straight', atk: 1, range: 2 });
  function applyMoves(placement, army, rules) {
    const mem = rules.v2mem;
    if (!mem || !mem.moves || !mem.moves.length) return { placement, army };
    const pl = Object.assign({}, placement), extra = [];
    for (const m of mem.moves) {
      if (m.op === 'swap') { const a = pl[m.a], b = pl[m.b]; if (b === undefined) delete pl[m.a]; else pl[m.a] = b; if (a === undefined) delete pl[m.b]; else pl[m.b] = a; }
      else if (m.op === 'drone') { pl[m.key] = m.id; extra.push(droneCard(m.id)); }
    }
    return { placement: pl, army: army.concat(extra) };
  }
  // The partner tile a Swap unit trades with: 'behind', 'adjacent' (left, right, up, down) or 'row' (nearest in its row, ties left).
  function swapPartner(T, s, how) {
    const has = (r, c) => { const t = T.stats[E.key(r, c)]; return t && t !== s && !T.scratch.moved[t.key] ? t.key : null; };
    if (how === 'behind') return has(s.r + 1, s.c);
    if (how === 'row') {
      for (let d = 1; d < E.COLS; d++) { const k = has(s.r, s.c - d) || has(s.r, s.c + d); if (k) return k; }
      return null;
    }
    return has(s.r, s.c - 1) || has(s.r, s.c + 1) || has(s.r - 1, s.c) || has(s.r + 1, s.c);
  }

  // ---------- the hit ----------
  // Damage after the multiplier: weak = ceil(x1.5), resist = max(1, ceil(x0.5)) (elements.json affinityRules.rounding).
  const mul = (d, m) => (d <= 0 || m === 1 ? d : m > 1 ? Math.ceil(d * m) : Math.max(1, Math.ceil(d * m)));
  const affOf = (rules) => cfg(rules).affinity || AFFINITY;
  // Enemy elements are PARKED (docs/DESIGN_V2.md "Parked / later"): rules.v2.enemyElements must be true to bring back affinity multipliers, weakness hits and the Mimic source.
  const enemyEl = (rules, e) => (cfg(rules).enemyElements && e ? lower(e.element) : '');
  const multOf = (rules, a, d) => { const row = affOf(rules)[a]; return row && row[d] !== undefined ? row[d] : 1; };
  // Elements that judge this tile's hits: its own (Scales 4-set also counts as the element its family names), or in 'best' mode every attacker of the column.
  function hitElements(T, s) {
    const own = [elOf(s)];
    if (!own[0]) return [];
    const extra = (c) => (c.card.v2 && c.card.family && FAMILIES[c.card.family] && FAMILIES[c.card.family].countsAs && (T.sets.fam[c.card.family] || 0) >= 2 ? [FAMILIES[c.card.family].countsAs] : []);
    const mine = own.concat(extra(s));
    if (cfg(T.state.rules).mergeMode !== 'best') return mine;
    const out = [];
    for (const c of colAttackers(T.stats, s.c)) for (const el of [elOf(c)].concat(extra(c))) if (!out.includes(el)) out.push(el);
    return out.length ? out : mine;
  }
  function hitOne(T, x) {
    const { state, s, e, events } = x, rules = state.rules, v = s.v2 || (s.v2 = {}), sets = T.sets, fromEffect = !!x.fromEffect;
    const prim = !fromEffect && !v.primDone;
    if (prim) v.primDone = true;
    const ctx = { s, e, v, T, col: x.col, src: fromEffect ? 'effect' : 'unit', unit: false, base: 0, hitIds: x.hitIds };
    // merges ride on the carrier's primary hit
    let leaves = [], bonus = 0, armorN = 0;
    const bypass = [];
    if (prim && s.merges && s.merges.length) {
      leaves = resolveLeaves(s.merges.flatMap((m) => flatten(m.spec)));
      for (const l of leaves) {
        if (l.p === 'bonusDmg') bonus += l.n;
        else if (l.p === 'ignoreArmor') { armorN = Math.max(armorN, l.n || 0); for (const w of l.andIgnore || []) bypass.push(w === 'hide' ? 'ward' : w === 'veiled' ? 'veil' : w); }
      }
    }
    for (const b of behOf(s, 'ignoreArmor')) armorN = Math.max(armorN, b.n || 1);
    // flat parts, then the affinity multiplier
    const st = e.st;
    let base = x.dmg + hitBonus(s, e) + bonus;
    if (st && st.mark) { base += 1; st.mark = false; }
    if (sets.f.firstDouble && !fromEffect && !T.scratch.doubled) { base *= 2; T.scratch.doubled = true; } // Wind 4-set: the first hit each turn is doubled
    const ee = enemyEl(rules, e);
    let mult = 1, he = null;
    if (ee) {
      for (const el of hitElements(T, s)) { const m = multOf(rules, el, ee); if (he === null || m > mult) { mult = m; he = el; } }
    }
    let dmg = mul(base, mult);
    const weak = mult > 1 && he ? WEAK[he + '>' + ee] || null : null;
    if (ee && he && mult !== 1) emit(T, { t: 'weak', id: e.id, key: s.key, mult, element: he, name: weak ? weak.name : null });
    // keyword Ghost: plain hits do 1 less; a weak hit, Light or an Eclipse or cleanse effect reveals it
    if (hasKw(e, 'ghost') && mult <= 1 && elOf(s) !== 'light' && !bypass.includes('ghost') && !leaves.some((l) => l.op === 'cleanse' && (l.what || []).includes('ghost'))) dmg = Math.max(1, dmg - 1);
    // Wings 4-set: the first shot each turn by a Wings unit ignores Guarded and Hide
    if (!fromEffect && sets.fam.wings >= 2 && s.card.family === 'wings' && !T.scratch.wings) { T.scratch.wings = true; bypass.push('guard', 'ward'); }
    const armor = x.noArmor === true ? true : Math.max(armorN, sets.f.armorIgnore || 0) || false;
    const carry = s.card.v2 ? (x.canCarry && v.rend ? v.rend : false) : x.canCarry;
    ctx.base = base;
    const wasAlive = e.alive;
    T.dealDamage(state, e, dmg, carry, events, s.key, armor, x.col, bypass.length ? bypass : undefined);
    if (wasAlive && !e.alive) onKill(T, s, e);
    // Mimic: the first body it hits gives it that element for the battle
    if (!fromEffect && ee && s.card.v2 && behOf(s, 'mimic').length) {
      const m = memOf(rules); m.mimic = m.mimic || {};
      if (!m.mimic[s.card.id]) { m.mimic[s.card.id] = ee; s.element = ee; emit(T, { t: 'mimic', key: s.key, element: ee }); }
    }
    // effects after the hit
    ctx.unit = true;
    T.after = [];
    if (s.card.v2) for (const b of s.card.beh || []) if (b.p === 'onHit' || b.p === 'push') applyLeaf(T, ctx, b);
    ctx.unit = false;
    if (!fromEffect && weak) { ctx.src = 'weakness'; for (const l of flatten(weak.effect)) applyLeaf(T, ctx, l); }
    if (leaves.length) { ctx.src = 'merge'; for (const l of leaves) if (l.p !== 'bonusDmg' && l.p !== 'ignoreArmor') applyLeaf(T, ctx, l); }
    // keyword Thorn: a hit on it costs the hero 1 HP (once per turn per body, ignores Shields)
    if (hasKw(e, 'thorn') && !T.scratch['thorn' + e.id]) { T.scratch['thorn' + e.id] = true; state.hp = Math.max(0, state.hp - 1); state.damageTaken += 1; emit(T, { t: 'thorn', id: e.id, hp: state.hp }); }
    const queue = T.after; T.after = [];
    for (const f of queue) f(); // the after queue is FIFO and never re-triggers a weakness hit or a merge (jump hits carry fromEffect)
  }
  // UI helper (step 4): the multiplier a placed attacker `s` would get against enemy `e` on this board (same element choice as the hit, mode own or best).
  function preview(stats, s, e, rules) {
    const ee = enemyEl(rules, e);
    if (!ee || !elOf(s)) return null;
    const T = { stats, state: { rules }, sets: SETS.get(stats) || { f: {}, own: {}, fam: {} } };
    let mult = 1, he = null;
    for (const el of hitElements(T, s)) { const m = multOf(rules, el, ee); if (he === null || m > mult) { mult = m; he = el; } }
    return { mult, el: he, name: mult > 1 && he && WEAK[he + '>' + ee] ? WEAK[he + '>' + ee].name : null };
  }
  // Army cards for a squad list [{ id, stage, level, stars }] with run bonuses { unitId: { atk, range, block } } (the dev page and the reference squads).
  function army(entries, mods) {
    return (entries || []).filter((x) => UNITS[x.id]).map((x) => {
      const c = card(x.id, x), m = (mods || {})[x.id];
      if (m) { if (m.atk && c.atk !== undefined) c.atk += m.atk; if (m.range && c.range !== undefined) c.range += m.range; if (m.block && c.block !== undefined) c.block += m.block; }
      return c;
    });
  }
  function hit(T, x) { x.state = T.state; x.events = T.events; T.sets = SETS.get(T.stats) || { f: {}, own: {}, fam: {} }; T.after = T.after || []; hitOne(T, x); }

  // Damage of the chain jump: the behaviour's factor (the Conduct weakness hit carries its own 0.5), plus the Chain set bonuses.
  function chainDmg(T, s, dmg, target) {
    const ch = (s.v2 && s.v2.chain) || { factor: 1 }, f = ch.factor !== undefined ? ch.factor : 1, sets = SETS.get(T.stats) || { f: {} };
    const base = ch.flat !== undefined ? ch.flat : f === 1 ? dmg : Math.max(1, Math.ceil(dmg * f)); // `flat`: a fixed jump (Pegasus stage 2)
    return base + (ch.plus || 0) + (sets.f.chainPlus || 0) + ((s.v2 && s.v2.secPlus) || 0);
  }

  // Start of the Fire phase: set up the toolbox, announce merges, Purge (Light 2-set).
  function startTurn(T) {
    T.sets = SETS.get(T.stats) || { f: {}, own: {}, fam: {} }; T.after = [];
    for (const s of Object.values(T.stats)) for (const m of s.merges || []) emit(T, { t: 'merge', key: s.key, id: m.id, name: m.name, col: m.col, with: m.with });
    if (T.sets.f.purge) {
      const mem = memOf(T.state.rules);
      if (!mem.purged) { mem.purged = 1; for (const e of T.state.enemies) if (e.alive) { stOf(e).noward = true; stOf(e).noveil = true; } }
    }
  }

  // After an attacker's main hits: Trample (behind the target's rear edge, not overkill), then Echo (a second volley at half ATK, rounded up). Both are hits of their own.
  function afterFire(T, x) {
    const { s, hits, dmg, noArmor } = x, v = s.v2, state = T.state;
    if (!v) return;
    if (hits.length && s.card.v2) for (const b of behOf(s, 'swap')) { // Swap: after attacking, trade tiles with an ally (applied at the end of the turn)
      T.scratch.moved = T.scratch.moved || {}; T.scratch.swaps = T.scratch.swaps || [];
      if (T.scratch.moved[s.key]) continue;
      const k = swapPartner(T, s, b.with || 'adjacent');
      if (k) { T.scratch.moved[s.key] = T.scratch.moved[k] = true; T.scratch.swaps.push([s.key, k]); }
    }
    if (v.trample) {
      const amt = v.trample < 1 ? Math.max(1, Math.ceil(dmg * v.trample)) : v.trample + (v.secPlus || 0);
      for (const { e, col } of hits) {
        let behind = null;
        for (let r = e.row - T.dOf(e); r >= -1 && !behind; r--) behind = T.enemyAt(state.enemies, r, col);
        if (!behind || behind === e) continue;
        if (behind.row === -1 && !T.gateOpen(state.enemies, col)) continue; // boss-row gate (R1)
        hit(T, { s, e: behind, dmg: amt, noArmor, canCarry: false, col, fromEffect: true });
      }
    }
    if (v.echo) {
      const half = Math.max(1, Math.ceil(dmg * v.echo) - (v.echoMinus || 0)), again = T.hitsFor(s, state.enemies);
      T.events.push({ t: 'echo', key: s.key, atk: half, targets: again.map((h) => h.e.id) });
      for (const { e, col } of again) {
        if (!e.alive) continue;
        hit(T, { s, e, dmg: half, noArmor, canCarry: s.pattern !== 'pierce', col, fromEffect: true });
      }
    }
  }

  // ---------- status phase, strike hooks, end of turn ----------
  function statusPhase(T) {
    for (const e of T.state.enemies) {
      const st = e.st;
      if (!e.alive || !st) continue;
      if (st.poison) { T.events.push({ t: 'tick', id: e.id, status: 'poison', n: st.poison }); T.dealDamage(T.state, e, st.poison, false, T.events, 'poison', true, e.col); }
      if (e.alive && st.burn) {
        const n = st.burn.n * st.burn.mult;
        T.events.push({ t: 'tick', id: e.id, status: 'burn', n });
        T.dealDamage(T.state, e, n, false, T.events, 'burn', true, e.col);
        if (--st.burn.turns <= 0) delete st.burn;
      }
    }
  }
  // Before the enemies strike: frozen and held bodies skip the whole strike (all lanes, A5), Chill lowers ATK per lane (min 1), Chief and Alpha aura, Grudge.
  function preStrike(T) {
    const state = T.state, sets = T.sets || SETS.get(T.stats) || { f: {} }, skip = new Set(), atks = new Map(), chainers = [];
    const live = state.enemies.filter((e) => e.alive && E.isThreat(e));
    for (const e of live) {
      if (hasKw(e, 'grudge')) {
        const seen = (e.st && e.st.grudge) || [];
        for (const o of state.enemies) if (!o.alive && !seen.includes(o.id) && !isBarrel(T, o) && T.cellsOf(e).some(([r, c]) => T.cellsOf(o).some(([or, oc]) => Math.abs(r - or) + Math.abs(c - oc) === 1))) {
          stOf(e).grudge = (e.st.grudge || []).concat(o.id); e.atk += 2; emit(T, { t: 'grudge', id: e.id, atk: e.atk });
        }
      }
    }
    for (const e of live) {
      const st = e.st;
      if (st && st.frozen) { st.frozen = false; skip.add(e.id); emit(T, { t: 'freeze', id: e.id, skipped: true }); }
      else if (st && st.hold) { st.hold = false; st.holdCd = (st.holdCool || 0) + 1; skip.add(e.id); emit(T, { t: 'status', id: e.id, status: 'hold', skipped: true }); }
      let a = e.atk;
      if (live.some((o) => o !== e && (hasKw(o, 'chief') || hasKw(o, 'alpha')) && neighbours(T, e).includes(o))) a += 1;
      const chill = st && st.chill ? Math.min(2, st.chill.length) : 0;
      if (chill) a = Math.max(Math.min(1, a), a - chill);
      atks.set(e.id, skip.has(e.id) ? 0 : a);
      if (!skip.has(e.id) && hasKw(e, 'chain')) chainers.push(e);
    }
    // Decoy: the first strike in the decoy's column is also taken by the decoy (its block value, on top of the column pool; skewer ignores it).
    // Ward (heroGuard negate): the first strike of the battle that would hurt is negated; `second` adds one more in a different column.
    const placed = Object.values(T.stats).filter((o) => o.card.v2), decoyBlock = {}, decoyUsed = {};
    for (const o of placed) if (behOf(o, 'decoy').length) decoyBlock[o.c] = (decoyBlock[o.c] || 0) + (o.block || 0);
    let negates = 0;
    for (const o of placed) for (const b of behOf(o, 'heroGuard')) if (b.negate) negates += 1 + (b.second ? 1 : 0);
    return {
      atk: (e) => (atks.has(e.id) ? atks.get(e.id) : e.atk), skewer: (e) => hasKw(e, 'skewer'), safe: state.turn === 1 && !!sets.f.safeT1,
      chainers: () => chainers.filter((e) => e.alive),
      decoy: (e, col, remaining) => {
        if (!decoyBlock[col] || decoyUsed[col]) return 0;
        decoyUsed[col] = true;
        return hasKw(e, 'skewer') ? 0 : Math.max(0, Math.min(remaining, decoyBlock[col]));
      },
      negate: (col, dmg) => {
        if (!negates || dmg <= 0) return dmg;
        const mem = memOf(state.rules), used = mem.negated || (mem.negated = []);
        if (used.length >= negates || used.includes(col)) return dmg;
        used.push(col); T.events.push({ t: 'negate', col, amount: dmg });
        return 0;
      },
    };
  }
  function afterStrike(T, e, col, dmg) {
    if (hasKw(e, 'leech') && dmg > 0 && e.hp < e.maxHp) { e.hp += 1; T.events.push({ t: 'heal', id: e.id, targets: [{ id: e.id, amount: 1, hp: e.hp }], self: true, leech: true }); }
    if (hasKw(e, 'chill')) { const m = memOf(T.state.rules); m.chillNext = m.chillNext || {}; m.chillNext[col] = 1; } // the struck column's attackers lose 1 ATK next turn
  }
  const guardOf = (state, col) => (state.rules.v2mem && state.rules.v2mem.guard && state.rules.v2mem.guard[col]) || 0;
  const suppressed = (e, what) => !!(e.st && e.st.supp && e.st.supp[what] > 0);

  // End of turn: Molt and Carapace counters, hero heals, status countdowns, column effects.
  function endTurn(T) {
    const { state, stats, events } = T, sets = SETS.get(stats) || { f: {} };
    let healN = sets.f.healTurn || 0;
    const hurt = events.some((ev) => ev.t === 'strike' && ev.dmg > 0);
    for (const s of Object.values(stats)) if (s.card.v2) for (const b of behOf(s, 'heroHeal')) {
      const more = b.n2 && ((b.when2 === 'struck' && hurt) || (b.when2 === 'belowHalf' && state.hp * 2 < state.maxHp)); // stage 2 Bloom: heals more when it matters
      healN += (more ? b.n2 : b.n) + (sets.f.bloomPlus || 0);
    }
    if (healN) heal(T, healN, 'v2');
    // Swaps and Brood: stored as moves, replayed on the placement from the next turn
    const mv = (T.scratch.swaps && T.scratch.swaps.length) || Object.values(stats).some((s) => s.card.v2 && behOf(s, 'brood').length) ? memOf(state.rules) : null; // no memory unless something moves
    for (const [a, b] of T.scratch.swaps || []) { (mv.moves = mv.moves || []).push({ op: 'swap', a, b }); emit(T, { t: 'swap', a, b }); }
    if (mv) for (const s of Object.values(stats)) for (const b of behOf(s, 'brood')) {
      if (!s.card.v2 || state.turn % (b.every || 2) !== 0) continue;
      const mine = (mv.moves || []).filter((m) => m.op === 'drone' && m.from === s.card.id).length;
      if (mine >= (b.cap || 3)) continue;
      const taken = new Set(Object.keys(stats).concat((mv.moves || []).filter((m) => m.op === 'drone').map((m) => m.key)));
      const spot = NEIGH.map(([dr, dc]) => E.key(s.r + dr, s.c + dc)).find((k) => E.playerTilesFor(state.rules).includes(k) && !taken.has(k));
      if (!spot) continue;
      mv.droneN = (mv.droneN || 0) + 1;
      const id = 'drone:' + mv.droneN;
      (mv.moves = mv.moves || []).push({ op: 'drone', key: spot, id, from: s.card.id });
      emit(T, { t: 'drone', key: spot, id, from: s.key });
    }
    for (const e of state.enemies) {
      const st = e.st;
      if (!st) continue;
      if (st.chill) st.chill = st.chill.map((c) => (c.t === null ? c : { t: c.t - 1 })).filter((c) => c.t === null || c.t > 0);
      if (st.markT) { st.markT -= 1; if (st.markT <= 0) { st.mark = false; delete st.markT; } }
      if (st.holdCd > 0) st.holdCd -= 1;
      if (st.freezeCd > 0) st.freezeCd -= 1;
      st.hold = false;
      if (st.supp) for (const k of Object.keys(st.supp)) { st.supp[k] -= 1; if (st.supp[k] <= 0) delete st.supp[k]; }
    }
    const mem = state.rules.v2mem;
    if (mem) {
      mem.guard = {}; mem.chill = mem.chillNext || {}; mem.chillNext = {}; mem.buff = mem.buffNext || {}; mem.buffNext = {};
    }
    if (!Object.values(stats).some((s) => s.card.v2 && (behOf(s, 'molt').length || behOf(s, 'shield').some((b) => b.grow)))) return; // nothing to count: leave the state as it is
    const m2 = memOf(state.rules), struck = new Set(events.filter((ev) => ev.t === 'strike').map((ev) => ev.col));
    for (const s of Object.values(stats)) {
      if (!s.card.v2) continue;
      if (behOf(s, 'molt').length) m2.molt[s.card.id] = (m2.molt[s.card.id] || 0) + 1;
      if (E.isDefender(s) && behOf(s, 'shield').some((b) => b.grow) && !struck.has(s.c)) m2.grow[s.card.id] = (m2.grow[s.card.id] || 0) + 1;
    }
  }

  const V2 = { load, card, preview, army, implemented, maxStage, applyPatches, initStat, boost, finish, order, hitBonus, chainDmg, afterFire, endTurn, startTurn, hit, statusPhase, preStrike, afterStrike,
    guardOf, suppressed, passMerges, applyMoves, rebirth, merges, mul, multOf, colAttackers, computeSets, ELEMENT_SETS,
    get UNITS() { return UNITS; }, get ELEMENTS() { return ELEMENTS; }, get FAMILIES() { return FAMILIES; }, get AFFINITY() { return AFFINITY; }, get WEAKNESS_HITS() { return WEAK; }, get MERGES() { return MERGES; }, get MERGE_RULES() { return MERGE_RULES; } };
  if (E) E.hooks.v2 = V2;
  root.V2 = V2;
  if (typeof module !== 'undefined' && module.exports) module.exports = V2;
})(typeof window !== 'undefined' ? window : globalThis);
