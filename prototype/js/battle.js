// Battle screen for the world map game: placement input and animated
// turn playback, built on the rules engine. Battle.start() opens a fight
// and calls onEnd(finalState) once it is won or lost.
(function () {
  'use strict';
  const E = window.Engine;
  const root = document.getElementById('battle');
  const $ = (sel) => root.querySelector(sel);

  const WARD_TEXT = { guard: 'its guard still stands', ward: 'hit too weak', veil: 'veiled this turn' };
  const PATTERN_GLYPH = { straight: '↑', pierce: '⇈', spread: '↖↑↗' };
  const PATTERN_TEXT = {
    straight: 'hits the first enemy in its column',
    pierce: 'hits every enemy in its column',
    spread: 'hits the first enemy in its column and both neighbouring columns',
  };
  const SPEEDS = [1, 2, 4];

  const game = { army: [], state: null, view: null, placement: {}, selected: null, hover: null, busy: false, speed: 2, onEnd: null };

  // Board cells are built once; their contents are redrawn on every render.
  (function buildBoard() {
    const board = $('#b-board');
    for (let r = 0; r < E.ROWS; r++) {
      for (let c = 0; c < E.COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell row-' + r + (r < 2 ? ' enemy-zone' : ' player-zone');
        cell.dataset.key = E.key(r, c);
        board.appendChild(cell);
      }
    }
  })();

  const cellEl = (k) => root.querySelector('.cell[data-key="' + k + '"]');
  const cardById = (id) => game.army.find((c) => c.id === id);
  const tileOf = (id) => Object.keys(game.placement).find((k) => game.placement[k] === id) || null;
  const current = () => game.view || game.state;

  function start(opts) {
    game.army = opts.army;
    game.state = E.createState(opts.stage);
    game.view = null;
    game.selected = null;
    game.busy = false;
    game.onEnd = opts.onEnd;
    logEl.innerHTML = '';
    { const collapse = window.innerHeight < 900; $('#b-log').classList.toggle('collapsed', collapse); $('#b-log-toggle').setAttribute('aria-expanded', String(!collapse)); } // short screens keep the Fight button in view
    log('Fight begins: place your squad.', 'turn');
    // Keep the player's last layout for cards that are still in the squad.
    const kept = {};
    for (const [k, id] of Object.entries(opts.placement || {})) if (cardById(id)) kept[k] = id;
    game.placement = kept;
    setBiome(opts.biome);
    $('#b-name').textContent = opts.title;
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
      log((intro.rule === 'Elite' ? 'Elite: ' : 'Boss: ') + intro.name + (intro.rule && intro.rule !== 'Elite' ? ' (' + intro.rule + ')' : '') + '. ' + intro.text, 'bad');
    } else introEl.textContent = rules.length ? rules.join(' ') : Object.keys(kept).length ? 'Your last layout is ready. Adjust it, then press Fight.' : 'Place your squad, then press Fight.';
    root.hidden = false;
    render();
  }
  const placement = () => Object.assign({}, game.placement);

  // ---------- Battle log (design 20) ----------
  const logEl = $('#b-log-lines');
  function log(html, cls) {
    const line = document.createElement('div');
    if (cls) line.className = cls;
    line.innerHTML = html;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  }
  const nameOf = (view, id) => { const e = view.enemies.find((en) => en.id === id); return e ? E.ENEMY_TYPES[e.type].name + (e.kind ? ' ' + E.ENEMY_KINDS[e.kind].badge : '') : 'Enemy'; };
  const cardName = (key) => { const c = cardById(game.placement[key]); if (!c) return 'Unit'; const u = window.Art ? Art.unit(c) : null; return (u && u.name) || E.CARD_TYPES[c.type].name; };
  function logEvent(ev, view) {
    if (ev.t === 'fire') log(ev.targets.length ? cardName(ev.key) + ' fires for ⚔' + ev.atk : cardName(ev.key) + ' has no target in range', ev.targets.length ? '' : 'bad');
    else if (ev.t === 'hit' && ev.warded) log('&nbsp;&nbsp;' + nameOf(view, ev.id) + ' is untouched (' + WARD_TEXT[ev.warded] + ')', 'bad');
    else if (ev.t === 'hit') log('&nbsp;&nbsp;' + nameOf(view, ev.id) + ' takes ' + ev.dmg + (ev.armor && ev.amount > ev.dmg ? ' (armor)' : '') + (ev.killed ? ', defeated' : ' (' + ev.hp + ' left)'), ev.killed ? 'good' : '');
    else if (ev.t === 'overkill') log('&nbsp;&nbsp;Overkill: ' + ev.amount + ' carries to the ' + nameOf(view, ev.id));
    else if (ev.t === 'explode') log('&nbsp;&nbsp;Barrel explodes for ' + ev.amount + ' to its neighbours');
    else if (ev.t === 'strike') log(nameOf(view, ev.id) + ' attacks for ⚔' + ev.atk + (ev.blocked ? ', shield blocks ' + ev.blocked : '') + (ev.dmg ? ', you take ' + ev.dmg : ''), ev.dmg ? 'bad' : '');
    else if (ev.t === 'bulwark') log('&nbsp;&nbsp;' + nameOf(view, ev.id) + ' blocks the overkill (' + ev.amount + ' wasted)', 'bad');
    else if (ev.t === 'spawn') log(ev.reason === 'split' ? '&nbsp;&nbsp;' + nameOf(view, ev.from) + ' splits: a ' + E.ENEMY_TYPES[ev.enemy.type].name + ' appears' : nameOf(view, ev.from) + ' summons a ' + E.ENEMY_TYPES[ev.enemy.type].name + ' (♥' + ev.enemy.hp + ' ⚔' + ev.enemy.atk + ')', 'bad');
    else if (ev.t === 'heal') log(nameOf(view, ev.id) + ' heals ' + ev.targets.map((h) => nameOf(view, h.id) + ' +' + h.amount).join(', '), 'bad');
    else if (ev.t === 'rage') log(nameOf(view, ev.id) + ' is in a fury: +' + ev.amount + ' ⚔', 'bad');
    else if (ev.t === 'harden') log(nameOf(view, ev.id) + ' hardens: armor ' + ev.armor, 'bad');
    else if (ev.t === 'regrow') log(nameOf(view, ev.id) + ' grows back (' + ev.hp + ' HP)', 'bad');
    else if (ev.t === 'move') log(nameOf(view, ev.id) + ' steps to column ' + (ev.to[1] + 1), 'bad');
    else if (ev.t === 'tide') log('The tide carries every enemy one column', 'bad');
    else if (ev.t === 'enrage') { if (ev.ids.length) log('Survivors enrage: +1 ⚔', 'bad'); }
    else if (ev.t === 'cleared') log('Stage cleared!', 'good');
    else if (ev.t === 'defeated') log('Your hero has fallen.', 'bad');
  }
  $('#b-log-toggle').addEventListener('click', () => {
    const open = $('#b-log').classList.toggle('collapsed') === false;
    $('#b-log-toggle').setAttribute('aria-expanded', String(open));
  });

  // Painted backdrop and stream style follow the biome of the fight.
  const STREAM_BY_BIOME = { meadow: 'water', forest: 'water', beach: 'sea', coral: 'sea', dunes: 'sand', temple: 'sand', snow: 'ice', glacier: 'ice', ash: 'lava', caldera: 'lava' };
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
    const stats = E.computeStats(game.placement, game.army, s.enemies);
    $('#b-turn').textContent = s.turn;
    $('#b-hpfill').style.width = (100 * s.hp / s.maxHp) + '%';
    $('#b-hptext').textContent = s.hp + ' / ' + s.maxHp;

    const focusKey = game.hover && game.placement[game.hover] ? game.hover : (game.selected && tileOf(game.selected)) || null;
    const reach = new Set(), willHit = new Set(), boostTargets = new Set();
    if (focusKey && stats[focusKey] && !game.busy) {
      const st = stats[focusKey];
      if (st.type.role === 'attacker') {
        E.reachableTiles(st).forEach((k) => reach.add(k));
        E.targetsFor(st, s.enemies).forEach((e) => willHit.add(E.key(e.row, e.col)));
      } else if (st.type.role === 'support') st.boosts.forEach((k) => boostTargets.add(k));
    }
    for (let r = 0; r < E.ROWS; r++) {
      for (let c = 0; c < E.COLS; c++) {
        const k = E.key(r, c);
        const cell = cellEl(k);
        cell.classList.toggle('reach', reach.has(k));
        cell.classList.toggle('will-hit', willHit.has(k));
        cell.classList.toggle('boost-target', boostTargets.has(k));
        cell.classList.toggle('can-drop', r >= 2 && !!game.selected && !game.busy);
        if (r < 2) {
          const e = s.enemies.find((en) => en.alive && en.row === r && en.col === c);
          cell.innerHTML = e ? enemyHTML(e) : '';
        } else {
          const id = game.placement[k];
          cell.innerHTML = id ? cardHTML(cardById(id), stats[k], k) : '';
        }
      }
    }
    const hand = game.army.filter((c) => !tileOf(c.id));
    $('#b-hand').innerHTML = hand.length
      ? hand.map(handSlotHTML).join('')
      : '<div class="hand-empty">Whole squad placed. Drop a card here to take it back.</div>';
    renderThreat(s, stats);
    $('#b-fight').disabled = game.busy || s.status !== 'playing';
    $('#b-clear').disabled = game.busy || s.status !== 'playing';
    $('#b-speed').textContent = game.speed + '×';
  }

  function renderThreat(s, stats) {
    let total = 0;
    const cols = [];
    const inc = E.incomingByColumn(s.enemies);
    for (let c = 0; c < E.COLS; c++) {
      const incoming = inc[c];
      const block = E.PLAYER_ROWS.map((r) => stats[E.key(r, c)]).filter((st) => st && st.type.role === 'defender').reduce((n, st) => n + st.block, 0);
      const dmg = Math.max(0, incoming - block);
      total += dmg;
      cols.push(incoming === 0 ? '<div class="muted">–</div>' : '<div class="' + (dmg ? 'dmg' : 'safe') + '">' + (dmg ? '−' + dmg : '✓') + '</div>');
    }
    $('#b-threat').innerHTML = cols.join('');
    $('#b-threat-total').textContent = total;
    $('#b-threat-total').className = total ? 'dmg' : 'safe';
  }

  const TXT = '︎'; // force text (not emoji) glyph rendering for stat symbols
  const artImg = (url, alt) => '<img src="' + url + '" alt="' + alt + '" draggable="false">';

  function enemyHTML(e) {
    const t = E.ENEMY_TYPES[e.type];
    const art = window.Art ? Art.enemy(e.type) : null;
    const face = '<div class="c-art">' + (art ? artImg(art, t.name) : '<span class="e-icon">' + t.icon + '</span>') + '</div>';
    if (t.barrel) {
      return '<div class="enemy barrel" title="' + t.name + ': explodes for ' + t.blast + ' damage to every adjacent enemy when destroyed. It does not attack.">' +
        face + '<div class="tags"><span class="tag hp">♥' + TXT + e.hp + '</span><span class="tag atk">💥' + t.blast + '</span></div></div>';
    }
    const gim = e.gimmick ? E.ENEMY_GIMMICKS[e.gimmick] : null;
    const kind = e.kind ? E.ENEMY_KINDS[e.kind] : gim ? { name: gim.name, badge: gim.badge, text: E.gimmickText(e) } : null;
    const guard = e.guardian ? ' guardian' : '';
    return '<div class="enemy' + (t.boss ? ' boss' : '') + (e.kind ? ' kind-' + e.kind : '') + (gim ? ' gimmick gimmick-' + e.gimmick : '') + guard + '" title="' + t.name + (kind ? ' (' + kind.name + ': ' + kind.text + ')' : '') + ': ' + e.hp + ' HP, deals ' + e.atk + ' damage' +
      (e.armor ? ', armor ' + e.armor : '') + '">' + face +
      (kind ? '<span class="kind-badge" aria-label="' + kind.name + '">' + kind.badge + '</span>' : '') + (e.guardian ? '<span class="guard-badge" title="Guard: the boss takes no damage while this enemy lives">♜</span>' : '') +
      (e.armor ? '<span class="tag armor">🛡' + TXT + e.armor + '</span>' : '') + (t.boss ? '<span class="crown">👑</span>' : '') +
      '<div class="tags"><span class="tag hp">♥' + TXT + e.hp + '</span><span class="tag atk">⚔' + TXT + e.atk + '</span></div></div>';
  }

  function cardHTML(card, st, from) {
    const t = E.CARD_TYPES[card.type];
    const unit = window.Art ? Art.unit(card) : { url: null, name: null };
    let main = '', sub = '', desc = t.name + ': ', extra = '';
    if (t.role === 'attacker') {
      const atk = st ? st.atk : E.cardStat(card, 'atk');
      const range = st ? st.range : E.cardStat(card, 'range');
      main = '<span class="' + (st && st.gazed ? 'gazed' : st && st.atk !== st.baseAtk ? 'boosted' : '') + '">⚔' + TXT + atk + '</span>';
      sub = '<span>' + PATTERN_GLYPH[t.pattern] + '</span><span class="' + (st && st.rangeBonus ? 'boosted' : '') + '">R' + range + '</span>';
      desc += atk + ' damage' + (st && st.gazed ? ' (weakened by a gaze)' : '') + ', ' + PATTERN_TEXT[t.pattern] + ', reaches ' + range + ' tile(s) up';
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
    const cls = 'card role-' + t.role + extra + (game.selected === card.id ? ' selected' : '');
    const face = '<div class="c-art">' + (unit.url ? artImg(unit.url, unit.name || t.name) : '<span class="e-icon">' + t.icon + '</span>') + '</div>';
    const html = '<div class="' + cls + '" data-card="' + card.id + '" data-from="' + from + '" title="' + desc + '">' + face +
      '<span class="c-role">' + t.name + '</span>' + (card.upgraded ? '<span class="up">★</span>' : '') +
      '<div class="tags"><span class="tag main">' + main + '</span><span class="tag sub">' + sub + '</span></div></div>';
    return html;
  }
  const handSlotHTML = (c) => {
    const t = E.CARD_TYPES[c.type], u = window.Art ? Art.unit(c) : { name: null };
    return '<div class="slot">' + cardHTML(c, null, 'hand') + '<div class="c-name">' + (u.name || t.name) + '</div></div>';
  };

  // ---------- Placement input (drag, or tap a card then a tile) ----------

  function placeCard(id, k) {
    const from = tileOf(id);
    const occupant = game.placement[k];
    if (occupant === id) return;
    if (from) delete game.placement[from];
    game.placement[k] = id;
    if (occupant && from) game.placement[from] = occupant;
  }
  function returnCard(id) { const from = tileOf(id); if (from) delete game.placement[from]; }

  let drag = null;
  function dropTargetAt(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el || !root.contains(el)) return null;
    return el.closest('.cell.player-zone') || el.closest('#b-hand');
  }
  root.addEventListener('pointerdown', (ev) => {
    if (game.busy || !game.state || game.state.status !== 'playing' || ev.button > 0) return;
    if (!ev.target.closest('#b-board, #b-hand')) return;
    const card = ev.target.closest('[data-card]');
    drag = { id: card ? card.dataset.card : null, el: card, x0: ev.clientX, y0: ev.clientY, ghost: null, over: null };
    if (card) ev.preventDefault();
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
  });
  function onPointerMove(ev) {
    if (!drag || !drag.id) return;
    if (!drag.ghost && Math.hypot(ev.clientX - drag.x0, ev.clientY - drag.y0) > 6) {
      const r = drag.el.getBoundingClientRect();
      drag.ghost = drag.el.cloneNode(true);
      drag.ghost.classList.add('ghost');
      drag.ghost.style.width = r.width + 'px';
      drag.ghost.style.height = r.height + 'px';
      document.body.appendChild(drag.ghost);
      drag.el.classList.add('dragging');
    }
    if (!drag.ghost) return;
    drag.ghost.style.left = (ev.clientX - drag.ghost.offsetWidth / 2) + 'px';
    drag.ghost.style.top = (ev.clientY - drag.ghost.offsetHeight / 2) + 'px';
    const over = dropTargetAt(ev.clientX, ev.clientY);
    if (over !== drag.over) {
      if (drag.over) drag.over.classList.remove('drop-hover');
      if (over) over.classList.add('drop-hover');
      drag.over = over;
    }
  }
  function onPointerUp(ev) {
    window.removeEventListener('pointermove', onPointerMove);
    const d = drag; drag = null;
    if (!d) return;
    if (d.over) d.over.classList.remove('drop-hover');
    const target = dropTargetAt(ev.clientX, ev.clientY);
    if (d.ghost) {
      d.ghost.remove();
      if (target && target.id === 'b-hand') returnCard(d.id);
      else if (target) placeCard(d.id, target.dataset.key);
      game.selected = null;
    } else if (d.id) {
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
  $('#b-board').addEventListener('pointerover', (ev) => {
    if (drag && drag.ghost) return;
    const cell = ev.target.closest && ev.target.closest('.cell');
    const k = cell ? cell.dataset.key : null;
    if (k !== game.hover) { game.hover = k; if (!game.busy) render(); }
  });
  $('#b-board').addEventListener('pointerleave', () => { game.hover = null; if (!game.busy && game.state) render(); });

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

  async function fight() {
    if (game.busy || game.state.status !== 'playing') return;
    if (!Object.keys(game.placement).length) { $('#b-msg').textContent = 'Place at least one card first.'; return; }
    game.busy = true; game.selected = null;
    const before = game.state;
    const stats = E.computeStats(game.placement, game.army);
    const { state, events } = E.resolveTurn(before, game.placement, game.army);
    game.view = E.clone(before);
    $('#b-msg').textContent = '';
    log('Turn ' + before.turn, 'turn');
    render();
    for (const ev of events) { logEvent(ev, game.view); await playEvent(ev, game.view, stats); }
    game.state = state; game.view = null; game.busy = false;
    render();
    if (state.status === 'playing') {
      $('#b-msg').textContent = 'Turn ' + state.turn + ': you lost ' + (before.hp - state.hp) + ' HP and the survivors enraged (+1 ⚔). Rearrange and fight again.';
    } else {
      let stars = 0;
      if (state.status === 'cleared') {
        stars = window.Gen ? Gen.starsFor(state.damageTaken) : 1;
        const note = ['', 'cleared', 'at most 3 damage taken', 'no damage taken'][stars];
        $('#b-msg').innerHTML = 'Victory! <span class="stars" aria-label="' + stars + ' stars">' + '★'.repeat(stars) + '<i>' + '★'.repeat(3 - stars) + '</i></span> ' + note;
        log('Rating: ' + '★'.repeat(stars) + ' (' + note + ')', 'good');
      } else $('#b-msg').textContent = 'Your hero has fallen.';
      await sleep(stars ? 1400 : 700);
      game.onEnd(state, stars);
    }
  }

  async function playEvent(ev, view, stats) {
    if (ev.t === 'fire') {
      const el = cellEl(ev.key);
      el.classList.add('firing');
      if (!ev.targets.length) { floatText(el, 'no target', 'info'); await sleep(420); }
      else await Promise.all(ev.targets.map((id) => projectile(el, enemyCell(view, id))));
      el.classList.remove('firing');
    } else if (ev.t === 'hit') {
      const e = view.enemies.find((en) => en.id === ev.id), el = enemyCell(view, ev.id);
      e.hp = ev.hp;
      flash(el, 'shake', 300);
      floatText(el, ev.warded ? (ev.warded === 'ward' ? 'Too weak!' : ev.warded === 'guard' ? 'Guarded ♜' : 'Veiled ☁') : '−' + ev.dmg + (ev.armor && ev.amount > ev.dmg ? ' 🛡' : ''), ev.warded ? 'info' : 'dmg');
      if (ev.killed) e.alive = false;
      render(); await sleep(300);
    } else if (ev.t === 'overkill') {
      const from = enemyCell(view, ev.from);
      floatText(from, 'Overkill ' + ev.amount + '!', 'info');
      await projectile(from, enemyCell(view, ev.id));
    } else if (ev.t === 'explode') {
      const el = enemyCell(view, ev.id);
      flash(el, 'boom-flash', 450); floatText(el, '💥', 'boom'); await sleep(360);
    } else if (ev.t === 'strike') {
      const el = enemyCell(view, ev.id), hero = $('#b-hero');
      const target = ev.blocked && ev.shields.length ? cellEl(ev.shields[0]) : hero;
      await projectile(el, target, 'enemy-shot');
      if (ev.blocked) {
        ev.shields.forEach((k) => flash(cellEl(k), 'shield-flash', 400));
        floatText(cellEl(ev.shields[0]), 'Blocked ' + ev.blocked, 'block');
        if (ev.dmg) await projectile(cellEl(ev.shields[0]), hero, 'enemy-shot');
      }
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
    } else if (ev.t === 'enrage') {
      if (!ev.ids.length) return;
      ev.ids.forEach((id) => { view.enemies.find((en) => en.id === id).atk += 1; const el = enemyCell(view, id); flash(el, 'rage', 500); floatText(el, '+1 ⚔', 'info'); });
      render(); await sleep(560);
    }
  }

  $('#b-fight').addEventListener('click', fight);
  $('#b-clear').addEventListener('click', () => { game.placement = {}; game.selected = null; render(); });
  $('#b-speed').addEventListener('click', () => { game.speed = SPEEDS[(SPEEDS.indexOf(game.speed) + 1) % SPEEDS.length]; render(); });

  window.Battle = {
    start, placement, hide: () => { root.hidden = true; },
    // Current fight, read by automated tests.
    debug: () => ({ state: game.state, army: game.army }),
  };
})();
