// Battle screen for the world map game: placement input and animated
// turn playback, built on the rules engine. Battle.start() opens a fight
// and calls onEnd(finalState) once it is won or lost.
(function () {
  'use strict';
  const E = window.Engine;
  const root = document.getElementById('battle');
  const $ = (sel) => root.querySelector(sel);

  const PATTERN_GLYPH = { straight: '↑', pierce: '⇈', spread: '↖↑↗' };
  const PATTERN_TEXT = {
    straight: 'hits the first enemy in its column',
    pierce: 'hits every enemy in its column',
    spread: 'hits the first enemy in its column and both neighbouring columns',
  };
  const SPEEDS = [1, 2, 4];

  const game = { army: [], state: null, view: null, placement: {}, selected: null, hover: null, busy: false, speed: 2, onEnd: null, report: null, hero: null, aiming: false };

  // Board cells are built once; their contents are redrawn on every render.
  // `boss` adds the optional boss row (row -1) above the two enemy rows; it exists only in battles that have one.
  function buildBoard(rows, boss) {
    const board = $('#b-board');
    board.innerHTML = '';
    for (let r = boss ? E.BOSS_ROW : 0; r < rows; r++) {
      for (let c = 0; c < E.COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell ' + (r < 0 ? 'row-boss' : 'row-' + r) + (r < 2 ? ' enemy-zone' : ' player-zone');
        cell.dataset.key = E.key(r, c);
        board.appendChild(cell);
      }
    }
    game.rows = rows; game.boss = !!boss; game.top = boss ? E.BOSS_ROW : 0;
    root.classList.toggle('deep-board', rows > E.ROWS);
    root.classList.toggle('boss-board', !!boss);
  }
  buildBoard(E.ROWS, false);

  const cellEl = (k) => root.querySelector('.cell[data-key="' + k + '"]');
  const v2on = (s) => !!(s && s.rules && s.rules.v2);
  const enemyEls = (s) => !!(s && s.rules && s.rules.v2 && s.rules.v2.enemyElements); // enemy elements are parked (docs/DESIGN_V2.md): chips, weak-to glyphs, badges and inspect rows only with this switch
  const lc = (x) => String(x || '').toLowerCase();
  // V2 swaps and spawned Drones live in rules.v2mem.moves and are replayed by the engine each turn: the board the player sees is that replay (eff).
  // Rearranging bakes the replay into the layout and clears the list (docs/V2_UNITS_PLAN.md step 3 hand-off).
  function eff() {
    const s = game.state, mem = s && s.rules && s.rules.v2 && s.rules.v2mem;
    if (mem && mem.moves && mem.moves.length && window.V2) return window.V2.applyMoves(game.placement, game.army, s.rules);
    return { placement: game.placement, army: game.army };
  }
  function bake() {
    const s = game.state, mem = s && s.rules && s.rules.v2 && s.rules.v2mem;
    if (!mem || !mem.moves || !mem.moves.length) return;
    const e = eff(); game.placement = Object.assign({}, e.placement); game.army = e.army; mem.moves = [];
  }
  const cardById = (id) => eff().army.find((c) => c.id === id);
  const tileOf = (id) => { const pl = eff().placement; return Object.keys(pl).find((k) => pl[k] === id) || null; };
  const current = () => game.view || game.state;
  const turnArg = (s) => (v2on(s) ? s.turn : undefined);

  function start(opts) {
    game.army = opts.army;
    game.state = E.createState(opts.stage);
    if (game.rows !== E.rowsFor(game.state.rules) || game.boss !== !!game.state.bossRow) buildBoard(E.rowsFor(game.state.rules), game.state.bossRow); // Camp Board track: a 4th player row; boss row: a 3rd enemy row
    game.view = null;
    game.selected = null;
    game.busy = false;
    game.aiming = false;
    game.hero = opts.hero || null;
    game.onEnd = opts.onEnd;
    game.onRetreat = opts.onRetreat || null; game.rations = opts.rations; retreatArm(false);
    game.report = { shields: false, overkills: 0, bossOverkill: false, explosions: 0, turns: 0 }; // read by bounties (app.js)
    $('#b-msg').classList.remove('open'); // the hint line is a toggle: the board gets the height
    // Keep the player's last layout for cards that are still in the squad.
    const kept = {};
    for (const [k, id] of Object.entries(opts.placement || {})) if (cardById(id) && !E.tileBlocked(game.state.rules, k)) kept[k] = id;
    game.placement = kept;
    setBiome(opts.biome);
    $('#b-name').textContent = opts.title;
    { const ids = opts.relics || [], el = $('#b-relics'); el.hidden = !ids.length; el.innerHTML = ids.map((id) => { const rl = window.Relics.BY_ID[id]; return '<span class="relic-ic sm" title="' + rl.name + ': ' + rl.text + '">' + rl.glyph + '</span>'; }).join(''); }
    $('#b-sub').textContent = opts.subtitle;
    const kinds = [...new Set(game.state.enemies.map((e) => e.kind).filter(Boolean))];
    const intro = opts.stage.intro;
    const rules = kinds.map((k) => E.ENEMY_KINDS[k].badge + ' ' + E.ENEMY_KINDS[k].name + ': ' + E.ENEMY_KINDS[k].text + '.');
    [...new Set(game.state.enemies.map((e) => e.gimmick).filter(Boolean))].forEach((g) => {
      const e = game.state.enemies.find((x) => x.gimmick === g);
      rules.push(E.ENEMY_GIMMICKS[g].badge + ' ' + E.ENEMY_GIMMICKS[g].name + ': ' + E.gimmickText(e) + '.');
    });
    const introEl = $('#b-msg');
    if (intro) {
      introEl.innerHTML = '<span class="intro-name">' + (intro.rule === 'Elite' ? '💀 ' : '👑 ') + intro.name + (intro.rule ? ' <i>' + (intro.badge ? intro.badge + ' ' : '') + intro.rule + '</i>' : '') + '</span> ' + intro.text;
    } else introEl.textContent = rules.length ? rules.join(' ') : Object.keys(kept).length ? 'Your last layout is ready. Adjust it, then press Fight.' : 'Place your squad, then press Fight.';
    closeInspect();
    root.hidden = false;
    render();
    fit();
  }
  const placement = () => Object.assign({}, eff().placement);



  // Painted backdrop and stream style follow the biome of the fight.
  const STREAM_BY_BIOME = { meadow: 'water', forest: 'water', beach: 'sea', coral: 'sea', dunes: 'sand', temple: 'sand', snow: 'ice', glacier: 'ice', ash: 'lava', caldera: 'lava', marsh: 'water', highlands: 'water', saltflat: 'sand', canyon: 'sand' };
  function setBiome(biome) {
    const b = STREAM_BY_BIOME[biome] ? biome : 'meadow';
    root.dataset.biome = b;
    root.dataset.stream = STREAM_BY_BIOME[b];
    const u = window.Art && Art.battleBackdrop ? Art.battleBackdrop(b) : null;
    root.style.backgroundImage = u ? 'url("' + u + '")' : '';
  }

  // ---------- Rendering ----------

  function render() {
    const s = current();
    const bd = eff(), stats = E.computeStats(bd.placement, bd.army, s.enemies, s.rules, turnArg(s));
    $('#b-turn').textContent = s.turn;
    $('#b-hpfill').style.width = (100 * s.hp / s.maxHp) + '%';
    $('#b-hptext').textContent = s.hp + ' / ' + s.maxHp + (s.barrier ? ' · 🔰' + s.barrier : '');
    renderHero(s);

    const rng = rangeFor(s, stats);
    for (let r = game.top; r < game.rows; r++) {
      for (let c = 0; c < E.COLS; c++) {
        const k = E.key(r, c);
        const cell = cellEl(k);
        cell.classList.toggle('reach', rng.reach.has(k));
        cell.classList.toggle('will-hit', rng.willHit.has(k));
        cell.classList.toggle('boost-target', rng.boost.has(k));
        const body = r < 2 ? E.enemyAt(s.enemies, r, c) : null; // a Big body covers several tiles; its card is drawn once, in the anchor tile
        cell.classList.toggle('can-target', game.aiming && !!body);
        cell.classList.toggle('gate-open', !!body && r === E.BOSS_ROW && E.gateOpen(s.enemies, c));
        cell.classList.toggle('closed', r >= 2 && E.tileBlocked(s.rules, k)); // Heat "Flooded Lane"
        cell.classList.toggle('can-drop', r >= 2 && !E.tileBlocked(s.rules, k) && !!game.selected && !game.busy);
        if (r < 2) {
          cell.innerHTML = body && body.row === r && body.col === c ? enemyHTML(body, s) : '';
        } else {
          const id = bd.placement[k];
          cell.innerHTML = id ? cardHTML(cardById(id), stats[k], k) : '';
        }
      }
    }
    const hand = bd.army.filter((c) => !tileOf(c.id));
    $('#b-hand').innerHTML = hand.length
      ? hand.map(handSlotHTML).join('')
      : '<div class="hand-empty">Squad placed. Drop a card here to take it back.</div>';
    paintBodies(rng);
    paintV2(s, rng);
    $('#b-fight').disabled = game.busy || s.status !== 'playing';
    $('#b-clear').disabled = game.busy || s.status !== 'playing';
    $('#b-speed').textContent = game.speed + '×';
    renderRetreat();
  }

  // Which tiles the focused unit reaches / will hit / boosts. While dragging (or with an unplaced unit selected and a
  // tile hovered) the unit is previewed on the tile under the pointer, buffs from its would-be neighbours included.
  function rangeFor(s, stats) {
    const out = { reach: new Set(), willHit: new Set(), boost: new Set(), stats: null, st: null };
    if (game.busy) return out;
    let focusKey = null, st = null;
    const dragId = drag && drag.ghost ? drag.id : null;
    const probe = dragId || (game.selected && !tileOf(game.selected) ? game.selected : null); // a unit not on the board yet (or being dragged)
    if (probe) {
      const k = dragId ? (drag.over && drag.over.dataset.key) : game.hover;
      const rowOf = k ? E.parseKey(k)[0] : -1;
      if (k && rowOf >= 2 && !E.tileBlocked(s.rules, k)) {
        const bd = eff(), p = Object.assign({}, bd.placement), from = tileOf(probe), occ = p[k];
        if (from) delete p[from];
        p[k] = probe;
        if (occ && from && occ !== probe) p[from] = occ;
        const hs = E.computeStats(p, bd.army, s.enemies, s.rules, turnArg(s));
        focusKey = k; st = hs[k]; out.stats = hs; // out.stats: the board as it would be (merge preview)
      }
    } else {
      focusKey = game.hover && eff().placement[game.hover] ? game.hover : (game.selected && tileOf(game.selected)) || null;
      st = focusKey ? stats[focusKey] : null;
    }
    out.st = st;
    if (!st) return out;
    if (E.isAttacker(st)) {
      E.reachableTiles(st, s.bossRow).forEach((k) => out.reach.add(k));
      // A targeted Big body is highlighted whole: every tile it covers, not only the struck column.
      E.targetsFor(st, s.enemies).forEach((e) => E.cellsOf(e).forEach(([r, c]) => out.willHit.add(E.key(r, c))));
      for (const e of s.enemies) if (e.alive && E.isBig(e) && E.cellsOf(e).some(([r, c]) => out.reach.has(E.key(r, c)))) E.cellsOf(e).forEach(([r, c]) => out.reach.add(E.key(r, c)));
    } else if (E.isSupport(st) && st.boosts) st.boosts.forEach((k) => out.boost.add(k));
    return out;
  }
  // Big bodies are one element over several tiles: mirror the tile highlights onto the card itself.
  function paintBodies(rng) {
    root.querySelectorAll('.enemy.big').forEach((el) => {
      const cells = el.dataset.cells.split(' ');
      el.classList.toggle('body-hit', cells.some((k) => rng.willHit.has(k)));
      el.classList.toggle('body-reach', cells.some((k) => rng.reach.has(k)));
    });
  }
  // Lightweight refresh of the highlight classes only (no card re-render), used on every drag move.
  function paintRange() {
    const s = current(), bd = eff(), stats = E.computeStats(bd.placement, bd.army, s.enemies, s.rules, turnArg(s)), rng = rangeFor(s, stats);
    for (let r = game.top; r < game.rows; r++) for (let c = 0; c < E.COLS; c++) {
      const k = E.key(r, c), cell = cellEl(k);
      cell.classList.toggle('reach', rng.reach.has(k));
      cell.classList.toggle('will-hit', rng.willHit.has(k));
      cell.classList.toggle('boost-target', rng.boost.has(k));
    }
    paintBodies(rng);
    paintV2(s, rng, stats);
  }

  // Hero panel (WP15): placeholder seal portrait, passive, and the once-per-battle ability button.
  function renderHero(s) {
    const h = game.hero, ab = s.ability && E.HERO_ABILITIES[s.ability], btn = $('#b-ability'), seal = $('#b-hero-seal');
    seal.textContent = h ? h.glyph : '命';
    seal.style.setProperty('--hero-hue', h ? h.hue : '');
    $('#b-hero-name').textContent = h ? h.name : 'Hero';
    $('#b-hero-passive').textContent = h ? h.passive : '';
    $('#b-hero').style.setProperty('--hero-hue', h ? h.hue : '');
    $('#b-hero-passive').title = h ? h.passive : '';
    btn.hidden = !ab;
    if (!ab) return;
    const problem = E.abilityProblem(s, ab.target === 'enemy' ? (s.enemies.find((en) => en.alive) || {}).id : null);
    const used = s.abilityUsed, stuck = !used && problem;
    btn.disabled = game.busy || s.status !== 'playing' || used || !!stuck;
    btn.classList.toggle('aiming', game.aiming);
    btn.innerHTML = '<span aria-hidden="true">' + ab.icon + '</span> ' + (used ? ab.name + ' (spent)' : game.aiming ? 'Pick a target' : ab.name);
    btn.title = ab.name + ' (once per battle): ' + ab.text + (used ? ' Already used.' : stuck ? ' (' + problem + ')' : '');
    btn.setAttribute('aria-label', btn.title);
  }

  const EL_COLOR = { wood: '#5a8a3a', water: '#3f6fb0', fire: '#d2542b', earth: '#a07a3a', wind: '#3f9d93', lightning: '#7a5fd0', light: '#d9a62b', shadow: '#6b4a8a' }; // the 8 elements (V2.2)
  const TXT = '︎'; // force text (not emoji) glyph rendering for stat symbols
  const artImg = (url, alt) => '<img src="' + url + '" alt="' + alt + '" draggable="false">';

  function enemyHTML(e, s) {
    const t = E.ENEMY_TYPES[e.type];
    const art = window.Art ? Art.enemy(e.type) : null;
    const face = '<div class="c-art">' + (art ? artImg(art, t.name) : '<span class="e-icon">' + t.icon + '</span>') + '</div>';
    if (t.barrel) {
      return '<div class="enemy barrel" title="' + t.name + ': explodes for ' + t.blast + ' damage to every adjacent enemy when destroyed. It does not attack.">' +
        face + '<div class="tags"><span class="tag hp">♥' + TXT + e.hp + '</span><span class="tag atk">💥' + t.blast + '</span></div></div>';
    }
    // V2 fights (js/fights.js): the placeholder drawing is labelled with the monster's real name and an element dot.
    const label = t.v2 ? '<span class="e-name"' + (t.element && enemyEls(s) ? ' style="--el:' + (EL_COLOR[lc(t.element)] || '#999') + '"' : '') + '>' + (t.element && enemyEls(s) ? '<i></i>' : '') + t.name + '</span>' : '';
    const gim = e.gimmick ? E.ENEMY_GIMMICKS[e.gimmick] : null;
    const kind = e.kind ? E.ENEMY_KINDS[e.kind] : gim ? { name: gim.name, badge: gim.badge, text: E.gimmickText(e) } : null;
    const guard = e.guardian ? ' guardian' : '';
    const big = E.isBig(e), lanes = E.lanesOf(e), fp = E.footprintOf(e);
    const bigCls = big ? ' big big-' + fp + (E.wOf(e) > 1 ? ' wide' : '') + (e.row === E.BOSS_ROW ? ' in-boss' : '') : e.row === E.BOSS_ROW ? ' in-boss' : '';
    // One merged card over the footprint: sized in cells, anchored at the front-left tile (see battle.css .enemy.big).
    const bigAttr = ' data-id="' + e.id + '" data-cells="' + E.cellsOf(e).map(([r, c]) => E.key(r, c)).join(' ') + '"' + (big ? ' style="--w:' + E.wOf(e) + ';--d:' + E.dOf(e) + '"' : '');
    const laneMarks = big && lanes > 1 ? '<div class="lanes" aria-hidden="true">' + '<span>▼</span>'.repeat(lanes) + '</div>' : '';
    const gates = e.row === E.BOSS_ROW && s ? '<div class="gates" aria-hidden="true">' + Array.from({ length: E.wOf(e) }, (_, i) => E.gateOpen(s.enemies, e.col + i) ? '<span class="open" title="Open: nothing stands in front">✦</span>' : '<span title="Gated: an enemy stands in front">⛓</span>').join('') + '</div>' : '';
    const atkTxt = e.atk + (lanes > 1 ? '×' + lanes : '');
    return '<div class="enemy' + bigCls + (t.boss ? ' boss' : '') + (e.kind ? ' kind-' + e.kind : '') + (gim ? ' gimmick gimmick-' + e.gimmick : '') + guard + '" title="' + t.name + (kind ? ' (' + kind.name + ': ' + kind.text + ')' : '') + ': ' + e.hp + ' HP, deals ' + e.atk + ' damage' + (lanes > 1 ? ' in each of ' + lanes + ' columns' : '') + (big ? ', footprint ' + fp : '') + (e.row === E.BOSS_ROW ? ', boss row: can be hit only through a column with no enemy in front' : '') +
      (e.armor ? ', armor ' + e.armor : '') + (t.v2 && enemyEls(s || current()) && (t.element || t.variant) ? ' [' + [t.element, t.variant, t.flavour].filter(Boolean).join(' · ') + ']' : '') + '"' + bigAttr + '>' + face + label + enemyV2HTML(e, s || current(), t) + laneMarks + gates +
      (kind ? '<span class="kind-badge" aria-label="' + kind.name + '">' + kind.badge + '</span>' : '') + (e.guardian ? '<span class="guard-badge" title="Guard: the boss takes no damage while this enemy lives">♜</span>' : '') +
      (e.armor ? '<span class="tag armor">🛡' + TXT + e.armor + '</span>' : '') + (t.boss ? '<span class="crown">👑</span>' : '') +
      '<div class="tags"><span class="tag hp">♥' + TXT + e.hp + '</span><span class="tag atk">⚔' + TXT + atkTxt + '</span></div></div>';
  }

  function cardHTML(card, st, from) {
    if (card.v2) return cardHTMLV2(card, st, from);
    const t = E.CARD_TYPES[card.type];
    const unit = window.Art ? Art.unit(card) : { url: null, name: null };
    let main = '', sub = '', desc = t.name + ': ', extra = '';
    if (t.role === 'attacker') {
      const atk = st ? st.atk : E.cardStat(card, 'atk');
      const range = st ? st.range : E.cardStat(card, 'range');
      main = '<span class="' + (st && st.gazed ? 'gazed' : st && st.atk !== st.baseAtk ? 'boosted' : '') + '">⚔' + TXT + atk + '</span>';
      const pat = (st && st.pattern) || card.pattern || t.pattern;
      sub = '<span>' + PATTERN_GLYPH[pat] + '</span><span class="' + (st && st.rangeBonus ? 'boosted' : '') + '">R' + range + '</span>';
      desc += atk + ' damage' + (st && st.gazed ? ' (weakened by a gaze)' : '') + ', ' + PATTERN_TEXT[pat] + ', reaches ' + range + ' tile(s) up' + (card.fx && card.fx.ignoreArmor ? ', ignores armor' : '') + (card.fx && card.fx.chain ? ', lightning chains to one more enemy' : '');
    } else if (t.role === 'support') {
      const amount = E.cardStat(card, 'amount');
      main = t.effect === 'atk' ? '+' + amount : t.effect === 'mult' ? '×' + amount : 'R+' + amount;
      sub = t.target === 'up' ? '<span>↑</span>' : '<span>✚</span>';
      desc += (t.effect === 'atk' ? '+' + amount + ' ATK' : t.effect === 'mult' ? '×' + amount + ' damage' : '+' + amount + ' range') +
        ' to the ' + (t.target === 'up' ? 'attacker directly above it' : 'attackers on all 4 sides');
      if (t.effect === 'mult') extra = ' mult';
      if (st && st.boosts.length === 0) extra += ' idle';
    } else {
      const block = st ? st.block : E.cardStat(card, 'block');
      main = '🛡' + TXT + block;
      sub = '<span>↕</span>';
      desc += 'absorbs up to ' + block + ' damage in its column each turn';
    }
    if (unit.name) desc = unit.name + ' · ' + desc;
    const ro = window.Progress && Progress.ROSTER_BY[card.id];
    if (ro && ro.rarity !== 'common') { extra += ' rar-' + ro.rarity; desc += ' (' + Progress.RARITY[ro.rarity].name + (ro.perk ? ': ' + ro.perk : '') + ')'; }
    if (ro) desc += ' [' + Progress.TRAITS[ro.trait].name + ']';
    const cls = 'card role-' + t.role + extra + (game.selected === card.id ? ' selected' : '');
    const face = '<div class="c-art">' + (unit.url ? artImg(unit.url, unit.name || t.name) : '<span class="e-icon">' + t.icon + '</span>') + '</div>';
    const html = '<div class="' + cls + '" data-card="' + card.id + '" data-from="' + from + '" title="' + desc + '">' + face +
      '<span class="c-role">' + t.name + '</span>' + (ro ? '<span class="c-trait" aria-hidden="true">' + Progress.TRAITS[ro.trait].icon + '</span>' : '') + (card.upgraded ? '<span class="up">★</span>' : '') +
      '<div class="tags"><span class="tag main">' + main + '</span><span class="tag sub">' + sub + '</span></div></div>';
    return html;
  }
  const handSlotHTML = (c) => {
    const t = E.CARD_TYPES[c.type], u = window.Art ? Art.unit(c) : { name: null };
    if (c.v2) return '<div class="slot">' + cardHTMLV2(c, null, 'hand') + '<div class="c-name">' + esc2(c.name) + '</div></div>';
    return '<div class="slot">' + cardHTML(c, null, 'hand') + '<div class="c-name">' + (u.name || t.name) + '</div></div>';
  };

  // ---------- V2 rules UI (dev page, rules.v2): element chips, statuses, merge preview, weak / resist, inspect card ----------
  const EL_GLYPH = { fire: '🔥', water: '💧', wood: '🌿', earth: '⛰', wind: '🌀', lightning: '⚡', light: '✨', shadow: '🌑' };
  const elColor = (el) => EL_COLOR[lc(el)] || '#999';
  const elGlyph = (el) => (window.V2 && window.V2.ELEMENTS[lc(el)] && window.V2.ELEMENTS[lc(el)].glyph) || EL_GLYPH[lc(el)] || '●';
  const elName = (el) => (window.V2 && window.V2.ELEMENTS[lc(el)] && window.V2.ELEMENTS[lc(el)].name) || lc(el);
  const elChip = (el, cls) => (el ? '<span class="el-chip ' + (cls || '') + '" style="--el:' + elColor(el) + '" title="' + elName(el) + '">' + elGlyph(el) + '</span>' : '');
  const affOf = (rules) => (rules && rules.v2 && typeof rules.v2 === 'object' && rules.v2.affinity) || (window.V2 ? window.V2.AFFINITY : {});
  // Attacker elements that hit `el` for more (weak) or less (resist) with the chart of the current fight.
  function matchups(rules, el) {
    const aff = affOf(rules), d = lc(el), weak = [], resist = [];
    if (!d) return { weak, resist };
    for (const a of Object.keys(aff)) { const m = aff[a] && aff[a][d] !== undefined ? aff[a][d] : 1; if (m > 1) weak.push(a); else if (m < 1) resist.push(a); }
    return { weak, resist };
  }
  // What a unit of element `el` hits for more / less.
  function strengths(rules, el) {
    const row = affOf(rules)[lc(el)] || {}, good = [], bad = [];
    for (const d of Object.keys(row)) { if (row[d] > 1) good.push(d); else if (row[d] < 1) bad.push(d); }
    return { good, bad };
  }
  const glyphs = (list) => list.map(elGlyph).join('');
  // Status icons of an enemy (e.st from the V2 engine) and a keyword list.
  function statusList(e) {
    const st = e.st || {}, out = [];
    if (st.frozen) out.push(['🧊', 'Frozen', 'Frozen: skips its next strike']);
    if (st.hold) out.push(['⛓', 'Held', 'Held: skips its next strike']);
    if (st.burn && st.burn.turns > 0) out.push(['🔥', st.burn.n + '', 'Burning ' + st.burn.n + ' per turn, ' + st.burn.turns + ' turn(s) left']);
    if (st.poison) out.push(['☠', st.poison + '', 'Poisoned ' + st.poison + ' per turn']);
    if (st.chill && st.chill.length) out.push(['❄', '-' + st.chill.length, 'Chilled: -' + st.chill.length + ' ATK per lane']);
    if (st.mark) out.push(['🎯', '', 'Marked: +1 on the next hit']);
    if (st.shred) out.push(['⛏', '-' + st.shred, 'Armour shredded by ' + st.shred]);
    return out;
  }
  const enemyStatusHTML = (e) => { const l = statusList(e); return l.length ? '<div class="st-row">' + l.slice(0, 3).map((x) => '<span title="' + x[2] + '">' + x[0] + x[1] + '</span>').join('') + (l.length > 3 ? '<span>+' + (l.length - 3) + '</span>' : '') + '</div>' : ''; };
  function enemyV2HTML(e, s, t) {
    if (!v2on(s)) return '';
    const el = enemyEls(s) ? lc(e.element || t.element) : '';
    let h = el ? elChip(el, 'on-enemy') : '';
    if (el) { const m = matchups(s.rules, el); if (m.weak.length) h += '<span class="wk" title="Weak to ' + m.weak.map(elName).join(', ') + '">▲' + glyphs(m.weak.slice(0, 3)) + '</span>'; }
    return h + enemyStatusHTML(e);
  }
  // Compact stats and ability text of a V2 card (board, hand and inspect).
  const behNames = (card) => [...new Set((card.beh || []).map((b) => b.p))];
  function cardHTMLV2(card, st, from) {
    const unit = window.Art ? Art.unit(card) : { url: null, name: null };
    const atkr = !!card.pattern, def = (card.beh || []).some((b) => b.p === 'shield'), buf = (card.beh || []).find((b) => b.p === 'buff' || b.p === 'grant');
    let main, sub = '', role;
    if (atkr) {
      const atk = st ? st.atk : card.atk, range = st ? st.range : card.range, pat = (st && st.pattern) || card.pattern;
      main = '<span class="' + (st && st.atk !== st.baseAtk ? 'boosted' : '') + '">⚔' + TXT + atk + '</span>';
      sub = '<span>' + (PATTERN_GLYPH[pat] || '↑') + '</span><span class="' + (st && st.rangeBonus ? 'boosted' : '') + '">R' + (range >= 99 ? '∞' : range) + '</span>' + (def ? '<span>🛡' + TXT + (st ? st.block : card.block) + '</span>' : '');
      role = 'attacker';
    } else if (def) { main = '🛡' + TXT + (st ? st.block : card.block); sub = buf ? '<span>✚</span>' : '<span>↕</span>'; role = 'defender'; }
    else { main = buf && buf.amount ? '+' + buf.amount : '✦'; sub = '<span>' + (buf ? ({ atk: '⚔', range: 'R', block: '🛡' }[buf.effect] || '✚') : '✦') + '</span>'; role = 'support'; }
    const el = lc((st && st.element) || card.element);
    const desc = (card.name || '') + ' · ' + (card.sub || '') + ' · ' + elName(el) + ' · ' + (card.family || '') + (window.V2 && window.V2.UNITS[card.unit] ? ' — ' + window.V2.UNITS[card.unit].ability : '');
    const cls = 'card v2card role-' + role + (game.selected === card.id ? ' selected' : '') + (card.drone ? ' drone' : '') + (card.rarity && card.rarity !== 'common' ? ' rar-' + card.rarity : '');
    const face = '<div class="c-art">' + (unit.url ? artImg(unit.url, card.name) : '<span class="e-icon">🐾</span>') + '</div>';
    return '<div class="' + cls + '" data-card="' + card.id + '" data-from="' + from + '" title="' + esc2(desc) + '">' + face + '<span class="c-role">' + esc2(card.name || card.sub) + '</span>' + elChip(el, 'on-card') +
      '<div class="tags"><span class="tag main">' + main + '</span><span class="tag sub">' + sub + '</span></div></div>';
  }
  const esc2 = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Reaction icon: the two element glyphs of the merge on a gradient of their colours; long-press shows its card.
  const mergeIcon = (m) => '<span class="mg" data-mg="' + esc2(m.id) + '" data-pair="' + esc2(m.pair.join(',')) + '" style="--a:' + elColor(m.pair[0]) + ';--b:' + elColor(m.pair[1]) + '" title="' + esc2(m.name) + '">' + elGlyph(m.pair[0]) + elGlyph(m.pair[1]) + '</span>';
  // Preview layer, repainted after every render and on every drag move: the reactions of each column in the row under the board, and (enemy elements on) multiplier badges on the targets.
  function paintV2(s, rng, stats0) {
    const row = $('#b-react');
    root.querySelectorAll('.pv').forEach((n) => n.remove());
    if (!v2on(s)) { row.innerHTML = ''; row.hidden = true; return; }
    const stats = (rng && rng.stats) || stats0 || (function () { const bd = eff(); return E.computeStats(bd.placement, bd.army, s.enemies, s.rules, turnArg(s)); })(); // the probe board while dragging or with a hand card selected
    const lines = [];
    for (const st of Object.values(stats)) for (const m of st.merges || []) { const l = (lines[m.col] = lines[m.col] || []); if (!l.some((x) => x.id === m.id && x.pair.join() === m.pair.join())) l.push(m); }
    row.hidden = false;
    row.innerHTML = Array.from({ length: E.COLS }, (_, c) => '<div class="react-col">' + (lines[c] || []).map(mergeIcon).join('') + '</div>').join('');
    // multiplier on the targets of the focused attacker
    const st = rng && rng.st;
    if (st && E.isAttacker(st) && !game.busy && enemyEls(s)) {
      for (const e of E.targetsFor(st, s.enemies)) {
        const pv = window.V2.preview(stats, st, e, s.rules);
        if (!pv || pv.mult === 1) continue;
        const el = root.querySelector('.enemy[data-id="' + e.id + '"]');
        if (el) el.insertAdjacentHTML('beforeend', '<span class="pv ' + (pv.mult > 1 ? 'weak' : 'resist') + '" title="' + esc2(elName(pv.el) + ' on ' + elName(e.element) + (pv.name ? ': ' + pv.name : '')) + '">' + (pv.mult > 1 ? '▲×' : '▼×') + pv.mult + '</span>');
      }
    }
  }
  function closeInspect() { const n = $('#b-inspect'); if (n) n.remove(); }
  const KW = { map: {} };
  const chips = (list, fn) => list.map((x) => '<span class="ins-chip">' + fn(x) + '</span>').join('') || '<span class="d-none">none</span>';
  function inspectHTMLEnemy(e, s) {
    const t = E.ENEMY_TYPES[e.type], on = enemyEls(s), el = on ? lc(e.element || t.element) : '', m = matchups(s.rules, el), art = window.Art ? Art.enemy(e.type) : null;
    const kind = e.kind ? E.ENEMY_KINDS[e.kind] : null, gim = e.gimmick ? E.ENEMY_GIMMICKS[e.gimmick] : null, sl = statusList(e);
    return '<div class="ins-head">' + (art ? artImg(art, t.name) : '<span class="e-icon">' + t.icon + '</span>') + '<div><b>' + esc2(t.name) + '</b> ' + elChip(el) + (on && (e.flavour || t.flavour) ? '<span class="ins-chip">' + esc2(e.flavour || t.flavour) + '</span>' : '') +
      '<div class="ins-sub">♥ ' + e.hp + ' · ⚔ ' + e.atk + (e.armor ? ' · 🛡 ' + e.armor : '') + (on && t.variant ? ' · ' + esc2(t.variant) : '') + (t.boss ? ' · boss' : '') + '</div></div><button class="ins-x" type="button" aria-label="Close">✕</button></div>' +
      (on ? '<div class="ins-row"><span>Element</span>' + (el ? elChip(el) + ' ' + elName(el) : '<i>none</i>') + '</div>' +
      '<div class="ins-row"><span>Weak to ▲</span>' + chips(m.weak, (a) => elChip(a) + ' ' + elName(a) + ' ×' + affOf(s.rules)[a][el]) + '</div>' +
      '<div class="ins-row"><span>Resists ▼</span>' + chips(m.resist, (a) => elChip(a) + ' ' + elName(a) + ' ×' + affOf(s.rules)[a][el]) + '</div>' : '') +
      '<div class="ins-row"><span>Keywords</span>' + chips((e.kw || []).concat(kind ? [kind.name] : [], gim ? [gim.name] : []), (k) => '<b>' + esc2(k) + '</b>' + (KW.map[k + '_e'] || KW.map[k] ? ' ' + esc2(KW.map[k + '_e'] || KW.map[k]) : (kind && k === kind.name ? ' ' + esc2(kind.text) : gim && k === gim.name ? ' ' + esc2(E.gimmickText(e)) : ''))) + '</div>' +
      '<div class="ins-row"><span>Statuses</span>' + chips(sl, (x) => x[0] + ' ' + esc2(x[2])) + '</div>';
  }
  function inspectHTMLCard(card, st, s) {
    const u = window.V2 && window.V2.UNITS[card.unit], el = lc((st && st.element) || card.element), sg = strengths(s.rules, el), m = matchups(s.rules, el), unit = window.Art ? Art.unit(card) : {};
    const evo = u && u.evolution ? u.evolution.map((x) => (x.stage === card.stage ? '<b>' : '') + 'S' + x.stage + ' ' + esc2(x.name) + (x.stage === card.stage ? '</b>' : '')).join(' → ') : '';
    const r = card.role || {};
    return '<div class="ins-head">' + (unit.url ? artImg(unit.url, card.name) : '') + '<div><b>' + esc2(card.name) + '</b> ' + elChip(el) + '<span class="ins-chip">' + esc2(card.family || '') + '</span><span class="ins-chip">' + esc2(card.rarity || '') + '</span>' +
      '<div class="ins-sub">' + (card.pattern ? '⚔ ' + (st ? st.atk : card.atk) + ' · R' + ((st ? st.range : card.range) >= 99 ? '∞' : (st ? st.range : card.range)) + ' · ' + card.pattern : '') + (card.block !== undefined ? ' · 🛡 ' + (st ? st.block : card.block) : '') + ' · stage ' + card.stage + ' · mastery ' + card.level + ' · ★' + card.stars + '</div></div><button class="ins-x" type="button" aria-label="Close">✕</button></div>' +
      '<div class="ins-row"><span>Ability</span>' + esc2(u ? u.ability : card.drone ? 'A 1-ATK Drone spawned by a Honeybee Hive.' : '') + '</div>' +
      '<div class="ins-row"><span>Roles</span>⚔ ' + (r.atk || 0) + ' · ✚ ' + (r.buff || 0) + ' · 🛡 ' + (r.guard || 0) + '</div>' +
      (evo ? '<div class="ins-row"><span>Stages</span>' + evo + '</div>' : '') +
      '<div class="ins-row"><span>Keywords</span>' + chips(behNames(card), (k) => '<b>' + esc2(k) + '</b>' + (KW.map[k] ? ' ' + esc2(KW.map[k]) : '')) + '</div>' +
      (enemyEls(s) ? '<div class="ins-row"><span>Hits harder ▲</span>' + chips(sg.good, (d) => elChip(d) + ' ' + elName(d)) + '</div>' +
      '<div class="ins-row"><span>Hits softer ▼</span>' + chips(sg.bad, (d) => elChip(d) + ' ' + elName(d)) + '</div>' +
      '<div class="ins-row"><span>Weak to ▲</span>' + chips(m.weak, (a) => elChip(a) + ' ' + elName(a)) + '</div>' +
      '<div class="ins-row"><span>Resists ▼</span>' + chips(m.resist, (a) => elChip(a) + ' ' + elName(a)) + '</div>' : '') +
      '<div class="ins-row"><span>Merges now</span>' + chips((st && st.merges) || [], (x) => '<b>' + esc2(x.name) + '</b> ' + elGlyph(x.pair[0]) + '+' + elGlyph(x.pair[1])) + '</div>';
  }
  // The inspect card (long-press): V2 cards and enemies have full cards; classic units and enemies show their name and the tile's text.
  function openInspect(kind, id, pairText) {
    const s = current(); if (!s) return;
    let html = '';
    const X = '<button class="ins-x" type="button" aria-label="Close">✕</button>';
    if (kind === 'reaction') {
      const m = window.V2 && Object.values(window.V2.MERGES).find((x) => x.id === id), pair = (pairText || '').split(',');
      if (!m) return;
      html = '<div class="ins-head"><div><b>' + esc2(m.name) + '</b> ' + pair.map((x) => elChip(x)).join('') + '<div class="ins-sub">Reaction · ' + pair.map(elName).join(' + ') + '</div></div>' + X + '</div><div class="ins-row">' + esc2(m.text || '') + '</div>';
    } else if (v2on(s)) {
      if (kind === 'enemy') { const e = s.enemies.find((x) => x.id === +id || x.id === id); if (!e) return; html = inspectHTMLEnemy(e, s); }
      else {
        const card = cardById(id); if (!card || !card.v2) return;
        const bd = eff(), stats = E.computeStats(bd.placement, bd.army, s.enemies, s.rules, turnArg(s)), k = tileOf(id);
        html = inspectHTMLCard(card, k ? stats[k] : null, s);
      }
    } else {
      const el = root.querySelector(kind === 'enemy' ? '.enemy[data-id="' + id + '"]' : '[data-card="' + id + '"]'); if (!el) return;
      const img = el.querySelector('img'), name = kind === 'enemy' ? (el.title || '').split(':')[0] : (el.querySelector('.c-role') || {}).textContent;
      html = '<div class="ins-head">' + (img ? artImg(img.getAttribute('src'), name || '') : '') + '<div><b>' + esc2(name || '') + '</b></div>' + X + '</div><div class="ins-row">' + esc2(el.title || '') + '</div>';
    }
    closeInspect();
    const box = document.createElement('div'); box.id = 'b-inspect'; box.className = 'b-inspect'; box.innerHTML = html; root.appendChild(box);
    box.addEventListener('click', (ev) => { if (ev.target.closest('.ins-x') || ev.target === box) closeInspect(); });
  }

  // ---------- Long-press to inspect (touch and mouse): a press held ~450 ms on a unit, an enemy or a reaction icon opens its card ----------
  const LONG_MS = 450;
  let lp = null; // { t, x, y, pid, fired }
  function lpCancel() { if (lp && !lp.fired) { clearTimeout(lp.t); lp = null; } }
  function lpArm(ev, fn) { lpCancel(); lp = { x: ev.clientX, y: ev.clientY, pid: ev.pointerId, fired: false, t: setTimeout(() => { lp.fired = true; if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) { /* ignore */ } } fn(); }, LONG_MS) }; }
  function lpTake() { const f = !!(lp && lp.fired); if (lp) clearTimeout(lp.t); lp = null; return f; } // true when the press just ended was a long-press (its tap action is skipped)
  root.addEventListener('pointermove', (ev) => { if (lp && !lp.fired && ev.pointerId === lp.pid && Math.hypot(ev.clientX - lp.x, ev.clientY - lp.y) > DRAG_PX) lpCancel(); });
  window.addEventListener('scroll', lpCancel, true);
  root.addEventListener('contextmenu', (ev) => ev.preventDefault()); // no browser menu or text-selection callout on a long press
  root.addEventListener('pointerdown', (ev) => { // reaction icons are outside the board and the hand, so they arm here
    const mg = ev.target.closest('.mg[data-mg]');
    if (mg && ev.button <= 0) lpArm(ev, () => openInspect('reaction', mg.dataset.mg, mg.dataset.pair));
  });
  root.addEventListener('pointerup', () => { if (!drag) lpTake(); });
  root.addEventListener('pointercancel', lpCancel);

  // ---------- Placement input (drag, or tap a card then a tile) ----------

  function placeCard(id, k) {
    const from = tileOf(id);
    if (game.state && E.tileBlocked(game.state.rules, k)) return; // Heat: the closed column holds no card
    bake();
    const occupant = game.placement[k];
    if (occupant === id) return;
    if (from) delete game.placement[from];
    game.placement[k] = id;
    if (occupant && from) game.placement[from] = occupant;
  }
  function returnCard(id) { bake(); const from = tileOf(id); if (from) delete game.placement[from]; }

  let drag = null;
  function dropTargetAt(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el || !root.contains(el)) return null;
    return el.closest('.cell.player-zone:not(.closed)') || el.closest('#b-hand');
  }
  const DRAG_PX = 6; // movement under this is a tap, over it a drag (pointer events: mouse, touch and pen alike)
  root.addEventListener('pointerdown', (ev) => {
    if (game.aiming && !game.busy && game.state && game.state.status === 'playing' && ev.target.closest('#b-board')) { // ability targeting (WP15): pick on press, the board re-renders on release
      const cell = ev.target.closest('.cell.can-target');
      if (cell) { const [r, c] = E.parseKey(cell.dataset.key), en = E.enemyAt(game.state.enemies, r, c); if (en) { ev.preventDefault(); castAbility(en.id); } }
      return;
    }
    if (game.busy || !game.state || game.state.status !== 'playing' || ev.button > 0 || drag) return;
    if (!ev.target.closest('#b-board, #b-hand')) return;
    const card = ev.target.closest('[data-card]');
    drag = { id: card ? card.dataset.card : null, el: card, fromHand: !card || card.dataset.from === 'hand', enemy: ((ev.target.closest('#b-board .enemy[data-id]') || { dataset: {} }).dataset.id) || null, x0: ev.clientX, y0: ev.clientY, pid: ev.pointerId, touch: ev.pointerType !== 'mouse', ghost: null, over: null };
    if (card && !drag.touch) ev.preventDefault();
    if (card || drag.enemy) lpArm(ev, () => openInspect(card ? 'card' : 'enemy', card ? card.dataset.card : drag.enemy)); // long-press: inspect; moving more than DRAG_PX cancels it
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
    window.addEventListener('pointercancel', onPointerCancel, { once: true });
  });
  function endDragListeners() {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
  }
  function startGhost(ev) {
    const el = drag.el, r = el.getBoundingClientRect();
    drag.ghost = el.cloneNode(true);
    drag.ghost.classList.add('ghost');
    drag.ghost.classList.remove('selected');
    drag.ghost.style.width = r.width + 'px';
    drag.ghost.style.height = r.height + 'px';
    drag.ghost.style.setProperty('--cell', getComputedStyle(el).getPropertyValue('--cell'));
    root.appendChild(drag.ghost);
    el.classList.add('dragging');
    root.classList.add('is-dragging');
    game.hover = null;
    if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) { /* ignore */ } }
  }
  function onPointerMove(ev) {
    if (!drag || ev.pointerId !== drag.pid || !drag.id) return;
    if (!drag.ghost) {
      const dx = ev.clientX - drag.x0, dy = ev.clientY - drag.y0;
      if (Math.hypot(dx, dy) <= DRAG_PX) return;
      lpCancel(); startGhost(ev);
    }
    if (ev.cancelable) ev.preventDefault();
    drag.ghost.style.left = (ev.clientX - drag.ghost.offsetWidth / 2) + 'px';
    drag.ghost.style.top = (ev.clientY - drag.ghost.offsetHeight / 2 - (drag.touch ? 18 : 0)) + 'px'; // touch: lift the card above the fingertip
    const over = dropTargetAt(ev.clientX, ev.clientY - (drag.touch ? 18 : 0));
    if (over !== drag.over) {
      if (drag.over) drag.over.classList.remove('drop-hover');
      if (over) over.classList.add('drop-hover');
      drag.over = over;
      paintRange();
    }
  }
  function finishDrag(ev, cancelled) {
    endDragListeners();
    const d = drag; drag = null;
    const wasLong = lpTake();
    if (!d) return;
    if (d.over) d.over.classList.remove('drop-hover');
    root.classList.remove('is-dragging');
    if (wasLong && !d.ghost) return; // a long-press opened the inspect card: no tap action
    const target = cancelled ? null : dropTargetAt(ev.clientX, ev.clientY - (d.ghost && d.touch ? 18 : 0));
    if (d.ghost) {
      d.ghost.remove();
      if (target && target.id === 'b-hand') returnCard(d.id);
      else if (target) placeCard(d.id, target.dataset.key);
      game.selected = null;
    } else if (cancelled) { /* the browser took the gesture (e.g. a scroll of the hand) */ }
    else if (d.id) {
      const tappedTile = d.el.dataset.from !== 'hand' ? d.el.dataset.from : null;
      if (game.selected === d.id) game.selected = null;
      else if (game.selected && tappedTile) { placeCard(game.selected, tappedTile); game.selected = null; }
      else game.selected = d.id;
    } else if (game.selected && target) {
      if (target.id === 'b-hand') returnCard(game.selected);
      else placeCard(game.selected, target.dataset.key);
      game.selected = null;
    } else game.selected = null;
    render();
  }
  function onPointerUp(ev) { finishDrag(ev, false); }
  function onPointerCancel(ev) { finishDrag(ev, true); }
  $('#b-board').addEventListener('pointerover', (ev) => {
    if (drag) return;
    const cell = ev.target.closest && ev.target.closest('.cell');
    const k = cell ? cell.dataset.key : null;
    if (k !== game.hover) { game.hover = k; if (!game.busy) paintRange(); } // classes only: rebuilding the cards here would detach the one being pressed (touch fires pointerover just before pointerdown)
  });
  $('#b-board').addEventListener('pointerleave', () => { if (drag) return; game.hover = null; if (!game.busy && game.state) paintRange(); });

  // ---------- Turn playback ----------

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms / game.speed));
  function centerOf(el) {
    const a = $('#b-arena').getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: r.left - a.left + r.width / 2, y: r.top - a.top + r.height / 2 };
  }
  function floatText(el, text, cls) {
    const p = centerOf(el), f = document.createElement('div');
    f.className = 'float ' + (cls || ''); f.textContent = text;
    f.style.left = p.x + 'px'; f.style.top = p.y + 'px'; f.style.animationDuration = (900 / game.speed) + 'ms';
    $('#b-fx').appendChild(f);
    setTimeout(() => f.remove(), 900 / game.speed + 50);
  }
  async function projectile(fromEl, toEl, cls) {
    const a = centerOf(fromEl), b = centerOf(toEl), p = document.createElement('div');
    p.className = 'projectile ' + (cls || ''); p.style.left = a.x + 'px'; p.style.top = a.y + 'px';
    const ms = 220 / game.speed; p.style.transitionDuration = ms + 'ms';
    $('#b-fx').appendChild(p);
    p.getBoundingClientRect();
    p.style.transform = 'translate(' + (b.x - a.x) + 'px,' + (b.y - a.y) + 'px)';
    await new Promise((res) => setTimeout(res, ms));
    p.remove();
  }
  function flash(el, cls, ms) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms / game.speed); }
  const enemyCell = (view, id) => { const e = view.enemies.find((en) => en.id === id); return cellEl(E.key(e.row, e.col)); };
  // The tile of a body in the column a hit or strike went through (the anchor tile when no column is given): floats and projectiles use it.
  const laneCell = (view, id, col) => { const e = view.enemies.find((en) => en.id === id); return cellEl(E.key(e.row, col !== undefined && col >= e.col && col < e.col + E.wOf(e) ? col : e.col)); };

  async function fight() {
    if (game.busy || game.state.status !== 'playing') return;
    if (!Object.keys(game.placement).length) { $('#b-msg').textContent = 'Place at least one card first.'; return; }
    game.busy = true; game.selected = null;
    const before = game.state;
    const stats = E.computeStats(game.placement, game.army, undefined, before.rules);
    const { state, events } = E.resolveTurn(before, game.placement, game.army);
    { // bounty bookkeeping
      const rep = game.report; rep.turns += 1;
      if (Object.values(eff().placement).some((id) => { const c = cardById(id); return c && (c.v2 ? !!c.block : E.CARD_TYPES[c.type].role === 'defender'); })) rep.shields = true;
      for (const ev of events) {
        if (ev.t === 'overkill') rep.overkills += 1;
        else if (ev.t === 'explode') rep.explosions += 1;
        else if (ev.t === 'hit' && ev.killed && ev.source === 'overkill') { const en = before.enemies.find((x) => x.id === ev.id); if (en && /_boss$/.test(en.type)) rep.bossOverkill = true; }
      }
    }
    game.view = E.clone(before);
    $('#b-msg').textContent = '';
    render();
    for (const ev of events) { await playEvent(ev, game.view, stats); }
    await settle(before, state);
  }

  // After a turn or an ability: show the state, then either carry on planning or end the battle.
  async function settle(before, state) {
    game.state = state; game.view = null; game.busy = false; game.aiming = false;
    render();
    if (state.status === 'playing') {
      $('#b-msg').textContent = 'Turn ' + state.turn + ': you lost ' + (before.hp - state.hp) + ' HP and the survivors enraged (+1 ⚔). Rearrange and fight again.';
    } else {
      let stars = 0;
      if (state.status === 'cleared') {
        stars = window.Gen ? Gen.starsFor(state.damageTaken) : 1;
        const note = ['', 'cleared', 'at most 3 damage taken', 'no damage taken'][stars];
        $('#b-msg').innerHTML = 'Victory! <span class="stars" aria-label="' + stars + ' stars">' + '★'.repeat(stars) + '<i>' + '★'.repeat(3 - stars) + '</i></span> ' + note;
      } else $('#b-msg').textContent = 'Your hero has fallen.';
      await sleep(stars ? 1400 : 700);
      game.onEnd(state, stars, game.report);
    }
  }

  // ---------- Hero ability (WP15) ----------
  async function castAbility(target) {
    const before = game.state, ab = E.HERO_ABILITIES[before.ability];
    const out = E.useAbility(before, target);
    game.aiming = false;
    if (!out) { render(); return; }
    game.busy = true; game.selected = null;
    for (const ev of out.events) if (ev.t === 'explode') game.report.explosions += 1;
    game.view = E.clone(before);
    render();
    for (const ev of out.events) { await playEvent(ev, game.view, null); }
    if (out.state.status !== 'playing') { await settle(before, out.state); return; }
    game.state = out.state; game.view = null; game.busy = false;
    $('#b-msg').textContent = ab.name + ' is spent for this battle. ' + (before.ability === 'rally' ? 'Attackers hit harder this turn: press Fight.' : before.ability === 'brace' ? 'Enemy strikes are weakened this turn: press Fight.' : 'Rearrange and press Fight.');
    render();
  }
  $('#b-ability').addEventListener('click', () => {
    const s = game.state; if (!s || game.busy || s.status !== 'playing' || s.abilityUsed || !s.ability) return;
    if (E.HERO_ABILITIES[s.ability].target === 'enemy') {
      game.aiming = !game.aiming;
      $('#b-msg').textContent = game.aiming ? E.HERO_ABILITIES[s.ability].name + ': tap an enemy to target it (tap the button again to cancel).' : '';
      render();
    } else castAbility(null);
  });


  const pendingWeak = {};
  const STATUS_ICON = { burn: '🔥 Burn', poison: '☠ Poison', chill: '❄ Chill', mark: '🎯 Mark', hold: '⛓ Held', sunder: '⛏ Sunder', cleanse: '✨ Cleanse' };
  async function playV2(ev, view) {
    if (ev.t === 'weak') {
      pendingWeak[ev.id] = ev;
      const el = laneCell(view, ev.id);
      floatText(el, ev.mult > 1 ? (ev.name || 'Weak') + ' ×' + ev.mult + ' ▲' : 'Resist ×' + ev.mult + ' ▼', ev.mult > 1 ? 'weak' : 'resist');
      if (ev.mult > 1) flash(el, 'weak-flash', 500);
      await sleep(320);
    } else if (ev.t === 'merge') { const c = cellEl(ev.key); if (c) { flash(c, 'merge-flash', 500); floatText(c, '✦ ' + ev.name, 'merge'); } await sleep(300); }
    else if (ev.t === 'status') { if (!ev.skipped) floatText(enemyCell(view, ev.id), STATUS_ICON[ev.status] || ev.status, 'info'); await sleep(200); }
    else if (ev.t === 'tick') { await sleep(120); }
    else if (ev.t === 'freeze') { floatText(enemyCell(view, ev.id), '🧊 ' + (ev.skipped ? 'skips' : 'Frozen'), 'info'); await sleep(260); }
    else if (ev.t === 'swap') { await sleep(150); }
    else if (ev.t === 'drone') { const c = cellEl(ev.key); if (c) floatText(c, 'Drone!', 'info'); await sleep(200); }
    else if (ev.t === 'negate') { floatText($('#b-hero'), 'Negated', 'block'); await sleep(260); }
    else if (ev.t === 'mimic') { const c = cellEl(ev.key); if (c) floatText(c, elGlyph(ev.element) + ' Mimic', 'info'); await sleep(240); }
    else if (ev.t === 'thorn') { view.hp = ev.hp; floatText($('#b-hero'), '−1 ♥ thorns', 'dmg'); await sleep(240); }
    else if (ev.t === 'grudge') { const e = view.enemies.find((en) => en.id === ev.id); if (e) e.atk = ev.atk; await sleep(120); }
    else if (ev.t === 'souls') { floatText($('#b-hero'), '+' + ev.n + ' souls', 'heal'); await sleep(200); }
    else return false;
    return true;
  }
  async function playEvent(ev, view, stats) {
    if (v2on(game.state) && await playV2(ev, view)) return;
    if (ev.t === 'fire') {
      const el = cellEl(ev.key);
      el.classList.add('firing');
      if (!ev.targets.length) { floatText(el, 'no target', 'info'); await sleep(420); }
      else await Promise.all(ev.targets.map((id, i) => projectile(el, laneCell(view, id, ev.cols && ev.cols[i]))));
      el.classList.remove('firing');
    } else if (ev.t === 'hit') {
      const e = view.enemies.find((en) => en.id === ev.id), el = enemyCell(view, ev.id);
      e.hp = ev.hp;
      flash(el, 'shake', 300);
      const pw = pendingWeak[ev.id]; delete pendingWeak[ev.id];
      floatText(laneCell(view, ev.id, ev.col), ev.warded ? (ev.warded === 'ward' ? 'Too weak!' : ev.warded === 'guard' ? 'Guarded ♜' : 'Veiled ☁') : '−' + ev.dmg + (pw ? (pw.mult > 1 ? ' ▲' : ' ▼') : '') + (ev.armor && ev.amount > ev.dmg ? ' 🛡' : ''), ev.warded ? 'info' : pw && pw.mult > 1 ? 'dmg weakhit' : 'dmg');
      if (ev.killed) e.alive = false;
      render(); await sleep(300);
    } else if (ev.t === 'overkill') {
      const from = laneCell(view, ev.from, ev.col);
      floatText(from, (ev.side ? 'Spill ' : 'Overkill ') + ev.amount + '!', 'info');
      await projectile(from, laneCell(view, ev.id, ev.col));
    } else if (ev.t === 'explode') {
      const el = enemyCell(view, ev.id);
      flash(el, 'boom-flash', 450); floatText(el, '💥', 'boom'); await sleep(360);
    } else if (ev.t === 'strike') {
      const el = laneCell(view, ev.id, ev.col), hero = $('#b-hero'); // a wide body strikes from each lane's column
      const target = ev.blocked && ev.shields.length ? cellEl(ev.shields[0]) : hero;
      await projectile(el, target, 'enemy-shot');
      if (ev.blocked) {
        ev.shields.forEach((k) => flash(cellEl(k), 'shield-flash', 400));
        floatText(cellEl(ev.shields[0]), 'Blocked ' + ev.blocked, 'block');
        if (ev.dmg) await projectile(cellEl(ev.shields[0]), hero, 'enemy-shot');
      }
      if (ev.warded) floatText(hero, 'Ward −' + ev.warded, 'block');
      if (ev.dmg) { flash(hero, 'hurt', 350); floatText(hero, '−' + ev.dmg + ' ♥', 'dmg'); }
      view.hp = ev.hp; render(); await sleep(340);
    } else if (ev.t === 'bulwark') {
      floatText(enemyCell(view, ev.id), 'Blocked ⛨', 'info'); flash(enemyCell(view, ev.id), 'shake', 300); await sleep(420);
    } else if (ev.t === 'spawn') {
      view.enemies.push(E.clone(ev.enemy));
      const el = enemyCell(view, ev.enemy.id);
      render();
      el.classList.remove('spawned'); void el.offsetWidth; el.classList.add('spawned');
      floatText(el, ev.reason === 'split' ? 'Split!' : 'Summoned!', 'info');
      setTimeout(() => el.classList.remove('spawned'), 600 / game.speed);
      await sleep(480);
    } else if (ev.t === 'heal') {
      const src = enemyCell(view, ev.id);
      flash(src, 'heal-flash', 500);
      if (ev.self) { const n = view.enemies.find((en) => en.id === ev.id); n.hp = ev.targets[0].hp; floatText(src, '+' + ev.targets[0].amount + ' ♥', 'heal'); render(); await sleep(420); return; }
      await Promise.all(ev.targets.map((h) => {
        const n = view.enemies.find((en) => en.id === h.id); n.hp = h.hp;
        floatText(enemyCell(view, h.id), '+' + h.amount + ' ♥', 'heal');
        return projectile(src, enemyCell(view, h.id), 'heal-shot');
      }));
      render(); await sleep(260);
    } else if (ev.t === 'rage') {
      const e = view.enemies.find((en) => en.id === ev.id); e.atk = ev.atk; const el = enemyCell(view, ev.id);
      flash(el, 'rage', 500); floatText(el, 'Fury +' + ev.amount + ' ⚔', 'info'); render(); await sleep(520);
    } else if (ev.t === 'harden') {
      const e = view.enemies.find((en) => en.id === ev.id); e.armor = ev.armor;
      floatText(enemyCell(view, ev.id), 'Armor ' + ev.armor + ' 🛡', 'info'); render(); await sleep(440);
    } else if (ev.t === 'regrow') {
      const e = view.enemies.find((en) => en.id === ev.id); e.alive = true; e.hp = ev.hp; render();
      const el = enemyCell(view, ev.id); el.classList.remove('spawned'); void el.offsetWidth; el.classList.add('spawned');
      floatText(el, 'Regrows ❀', 'info'); setTimeout(() => el.classList.remove('spawned'), 600 / game.speed); await sleep(520);
    } else if (ev.t === 'move') {
      const e = view.enemies.find((en) => en.id === ev.id); e.row = ev.to[0]; e.col = ev.to[1];
      if (ev.swap) { const o = view.enemies.find((en) => en.id === ev.swap); o.col = ev.from[1]; }
      render(); floatText(enemyCell(view, ev.id), ev.to[1] > ev.from[1] ? '→' : '←', 'info'); await sleep(420);
    } else if (ev.t === 'tide') {
      ev.moves.forEach((m) => { const e = view.enemies.find((en) => en.id === m.id); e.row = m.to[0]; e.col = m.to[1]; });
      render(); root.classList.add('tide-wash'); setTimeout(() => root.classList.remove('tide-wash'), 700 / game.speed); await sleep(520);
    } else if (ev.t === 'feast') {
      floatText($('#b-hero'), '+1 ⚔ Fang', 'info'); await sleep(300);
    } else if (ev.t === 'ability') {
      const hero = $('#b-hero'), ab = E.HERO_ABILITIES[view.ability];
      flash(hero, 'heal-flash', 500); floatText(hero, ab.icon + ' ' + ab.name + '!', 'info');
      if (ev.target) await projectile(hero, enemyCell(view, ev.target), 'heal-shot');
      else await sleep(380);
    } else if (ev.t === 'stand' || ev.t === 'mend' || ev.t === 'revive') {
      const hero = $('#b-hero'); view.hp = ev.hp; flash(hero, 'heal-flash', 500);
      floatText(hero, ev.t === 'stand' ? 'Last Breath!' : ev.t === 'revive' ? 'Reborn! ' + ev.hp + ' ♥' : '+' + ev.amount + ' ♥', 'heal'); render(); await sleep(480);
    } else if (ev.t === 'enrage') {
      if (!ev.ids.length) return;
      ev.ids.forEach((id) => { view.enemies.find((en) => en.id === id).atk += 1; const el = enemyCell(view, id); flash(el, 'rage', 500); floatText(el, '+1 ⚔', 'info'); });
      render(); await sleep(560);
    }
  }

  // The hint / result line is one line; tap it to read the rest.
  $('#b-msg').addEventListener('click', () => $('#b-msg').classList.toggle('open'));

  // Size the board from the real viewport: the largest --cell for which the whole screen (header, board,
  // hero, hand, controls) fits without scrolling. Everything else scales from --cell in battle.css.
  function fit() {
    if (root.hidden) return;
    const cap = Math.min(root.clientWidth || innerWidth, 480) - 26;
    let lo = 28, hi = Math.min(game.rows > E.ROWS || game.boss ? 64 : 72, cap / 5);
    for (let i = 0; i < 9; i++) {
      const mid = (lo + hi) / 2;
      root.style.setProperty('--cell', mid + 'px');
      if (root.scrollHeight > root.clientHeight) hi = mid; else lo = mid;
    }
    root.style.setProperty('--cell', Math.floor(lo * 10) / 10 + 'px');
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 120));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);

  // Retreat: ends the fight without a win or a loss. The caller (opts.onRetreat) keeps the HP, takes the Ration and returns to where the fight started. Needs 1 Ration (opts.rations); one confirming tap.
  let retreatTimer = null;
  function retreatArm(on) {
    clearTimeout(retreatTimer); game.retreatArmed = !!on;
    if (on) retreatTimer = setTimeout(() => { game.retreatArmed = false; renderRetreat(); }, 3000);
    renderRetreat();
  }
  function renderRetreat() {
    const b = $('#b-retreat'), s = game.state, none = game.rations !== undefined && game.rations <= 0;
    b.hidden = !game.onRetreat;
    if (b.hidden) return;
    b.disabled = game.busy || !s || s.status !== 'playing' || none;
    b.classList.toggle('armed', !!game.retreatArmed);
    b.textContent = none ? 'No rations' : game.retreatArmed ? 'Retreat? −1 🍙' : 'Retreat';
    b.title = none ? 'You need 1 Ration to retreat.' : 'Leave this fight without a win or a loss: you keep your HP, lose 1 Ration and get no rewards.';
  }
  $('#b-retreat').addEventListener('click', () => {
    if (game.busy || !game.onRetreat || !game.state || game.state.status !== 'playing') return;
    if (!game.retreatArmed) { retreatArm(true); return; }
    retreatArm(false); game.onRetreat(game.state);
  });
  $('#b-fight').addEventListener('click', fight);
  $('#b-clear').addEventListener('click', () => { bake(); game.placement = {}; game.selected = null; render(); });
  $('#b-speed').addEventListener('click', () => { game.speed = SPEEDS[(SPEEDS.indexOf(game.speed) + 1) % SPEEDS.length]; render(); });

  window.Battle = {
    start, placement, fit, hide: () => { root.hidden = true; closeInspect(); },
    setKeywords: (m) => { KW.map = m || {}; }, // keyword id -> rule text, for the inspect card (dev page)
    // Current fight, read by automated tests.
    debug: () => ({ state: game.state, army: game.army }),
  };
})();
