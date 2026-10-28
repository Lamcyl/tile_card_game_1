// Browser UI for the prototype: board rendering, placement input and
// turn playback. All rules live in engine.js.
(function () {
  'use strict';
  const E = window.Engine;
  const STAGES = window.STAGES;
  const $ = (sel) => document.querySelector(sel);

  const PATTERN_GLYPH = { straight: '↑', pierce: '⇈', spread: '↖↑↗' };
  const PATTERN_TEXT = {
    straight: 'hits the first enemy in its column',
    pierce: 'hits every enemy in its column',
    spread: 'hits the first enemy in its column and both neighbouring columns',
  };
  const SPEEDS = [1, 2, 4];

  const game = {
    stageIndex: 0,
    stage: null,
    state: null,
    view: null,       // display copy of state while a turn animates
    placement: {},    // tile key -> card id
    selected: null,   // card id picked by tap
    hover: null,      // tile key under the pointer
    busy: false,
    speed: 1,
  };

  // ---------- Stage lifecycle ----------

  function loadStage(index) {
    game.stageIndex = index;
    game.stage = STAGES[index];
    game.state = E.createState(game.stage);
    game.view = null;
    game.placement = {};
    game.selected = null;
    game.busy = false;
    $('#log').innerHTML = '';
    $('#message').textContent = 'Place your army, then press Fight.';
    hideModal();
    buildBoard();
    render();
  }

  function buildBoard() {
    const board = $('#board');
    board.innerHTML = '';
    for (let r = 0; r < E.ROWS; r++) {
      for (let c = 0; c < E.COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell row-' + r + (r < 2 ? ' enemy-zone' : ' player-zone');
        cell.dataset.key = E.key(r, c);
        board.appendChild(cell);
      }
    }
  }

  const cellEl = (k) => document.querySelector('.cell[data-key="' + k + '"]');
  const cardById = (id) => game.stage.army.find((c) => c.id === id);
  const tileOf = (id) => Object.keys(game.placement).find((k) => game.placement[k] === id) || null;
  const current = () => game.view || game.state;

  // ---------- Rendering ----------

  function render() {
    const s = current();
    const stats = E.computeStats(game.placement, game.stage.army);

    // Stage select
    $('#stage-select').innerHTML = STAGES.map((st, i) =>
      '<button data-stage="' + i + '" class="' + (i === game.stageIndex ? 'active' : '') + '">Stage ' +
      st.number + ' · ' + st.name + '</button>').join('');

    $('#stage-title').textContent = 'Stage ' + game.stage.number + ': ' + game.stage.name;
    $('#stage-hint').textContent = game.stage.hint;
    $('#turn').textContent = s.turn;
    $('#damage').textContent = s.damageTaken;
    renderHero(s);

    // Highlights from the hovered or selected card.
    const focusKey = game.hover && game.placement[game.hover] ? game.hover
      : (game.selected && tileOf(game.selected)) || null;
    const reach = new Set();
    const willHit = new Set();
    const boostTargets = new Set();
    if (focusKey && stats[focusKey] && !game.busy) {
      const st = stats[focusKey];
      if (st.type.role === 'attacker') {
        E.reachableTiles(st).forEach((k) => reach.add(k));
        E.targetsFor(st, s.enemies).forEach((e) => willHit.add(E.key(e.row, e.col)));
      } else if (st.type.role === 'support') {
        st.boosts.forEach((k) => boostTargets.add(k));
      }
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

    // Hand: cards not on the board.
    const hand = game.stage.army.filter((c) => !tileOf(c.id));
    $('#hand').innerHTML = hand.length
      ? hand.map((c) => '<div class="slot">' + cardHTML(c, null, 'hand') + '</div>').join('')
      : '<div class="hand-empty">All cards placed. Drop a card here to take it back.</div>';

    renderThreat(s, stats);

    $('#fight').disabled = game.busy || s.status !== 'playing';
    $('#clear').disabled = game.busy || s.status !== 'playing';
    $('#retry').disabled = game.busy;
    $('#speed').textContent = 'Speed ' + game.speed + '×';
  }

  function renderHero(s) {
    $('#hp-fill').style.width = (100 * s.hp / s.maxHp) + '%';
    $('#hp-text').textContent = '♥ ' + s.hp + ' / ' + s.maxHp;
  }

  // Per-column forecast: damage you take if no enemy dies this turn.
  function renderThreat(s, stats) {
    let total = 0;
    const cols = [];
    for (let c = 0; c < E.COLS; c++) {
      const incoming = s.enemies
        .filter((e) => E.isThreat(e) && e.col === c)
        .reduce((n, e) => n + e.atk, 0);
      const block = E.PLAYER_ROWS
        .map((r) => stats[E.key(r, c)])
        .filter((st) => st && st.type.role === 'defender')
        .reduce((n, st) => n + st.block, 0);
      const dmg = Math.max(0, incoming - block);
      total += dmg;
      cols.push(incoming === 0
        ? '<div class="muted">–</div>'
        : '<div class="' + (dmg ? 'dmg' : 'safe') + '" title="⚔' + incoming + (block ? ' − 🛡' + block : '') + '">' +
          (dmg ? '−' + dmg + ' ♥' : '✓ 0') + '</div>');
    }
    $('#threat').innerHTML = cols.join('');
    $('.threat-label').innerHTML = 'If nothing dies, you take: <b class="' + (total ? 'dmg' : 'safe') +
      '" style="color:var(' + (total ? '--hp' : '--good') + ')">' + total + '</b>';
  }

  function enemyHTML(e) {
    const t = E.ENEMY_TYPES[e.type];
    if (t.barrel) {
      return '<div class="enemy barrel" title="Barrel: explodes for ' + t.blast +
        ' damage to every adjacent enemy when destroyed. It does not attack and does not need to be destroyed.">' +
        '<div class="e-icon">' + t.icon + '</div><div class="e-name">Barrel</div>' +
        '<div class="e-stats"><span class="hp">♥' + e.hp + '</span><span class="atk">💥' + t.blast + '</span></div></div>';
    }
    return '<div class="enemy" title="' + t.name + ': ' + e.hp + ' HP, deals ' + e.atk + ' damage' +
      (e.armor ? ', armor ' + e.armor + ' (each hit deals ' + e.armor + ' less)' : '') + '">' +
      (e.armor ? '<span class="badge">🛡' + e.armor + '</span>' : '') +
      '<div class="e-icon">' + t.icon + '</div><div class="e-name">' + t.name + '</div>' +
      '<div class="e-stats"><span class="hp">♥' + e.hp + '</span><span class="atk">⚔' + e.atk + '</span></div></div>';
  }

  function cardHTML(card, st, from) {
    const t = E.CARD_TYPES[card.type];
    let main = '';
    let sub = '';
    let desc = t.name + ': ';
    let extra = '';
    if (t.role === 'attacker') {
      const atk = st ? st.atk : E.cardStat(card, 'atk');
      const range = st ? st.range : E.cardStat(card, 'range');
      main = '<span class="' + (st && st.atk !== st.baseAtk ? 'boosted' : '') + '">⚔' + atk + '</span>';
      sub = '<span>' + PATTERN_GLYPH[t.pattern] + '</span><span class="' + (st && st.rangeBonus ? 'boosted' : '') + '">R' + range + '</span>';
      desc += atk + ' damage, ' + PATTERN_TEXT[t.pattern] + ', reaches ' + range + ' tile(s) up';
    } else if (t.role === 'support') {
      const amount = E.cardStat(card, 'amount');
      const label = t.effect === 'atk' ? '+' + amount : t.effect === 'mult' ? '×' + amount : 'R+' + amount;
      main = label;
      sub = t.target === 'up' ? '<span>↑ above</span>' : '<span>✚ around</span>';
      const what = t.effect === 'atk' ? '+' + amount + ' ATK' : t.effect === 'mult' ? '×' + amount + ' damage' : '+' + amount + ' range';
      desc += what + ' to the ' + (t.target === 'up' ? 'attacker directly above it' : 'attackers on all 4 sides');
      if (t.effect === 'mult') extra = ' mult';
      if (st && st.boosts.length === 0) extra += ' idle';
    } else {
      const block = st ? st.block : E.cardStat(card, 'block');
      main = '🛡' + block;
      sub = '<span>column</span>';
      desc += 'absorbs up to ' + block + ' damage from enemies in its column each turn';
    }
    if (card.upgraded) desc += ' (upgraded)';
    const cls = 'card role-' + t.role + extra + (game.selected === card.id ? ' selected' : '');
    return '<div class="' + cls + '" data-card="' + card.id + '" data-from="' + from + '" title="' + desc + '">' +
      '<div class="c-top"><span>' + t.icon + '</span>' + (card.upgraded ? '<span class="up">★</span>' : '') + '</div>' +
      '<div class="c-main">' + main + '</div><div class="c-sub">' + sub + '</div>' +
      '<div class="c-name">' + t.name + '</div></div>';
  }

  // ---------- Placement input ----------

  function placeCard(id, k) {
    const from = tileOf(id);
    const occupant = game.placement[k];
    if (occupant === id) return;
    if (from) delete game.placement[from];
    game.placement[k] = id;
    if (occupant && from) game.placement[from] = occupant; // swap
  }

  function returnCard(id) {
    const from = tileOf(id);
    if (from) delete game.placement[from];
  }

  let drag = null;

  function onPointerDown(ev) {
    if (game.busy || game.state.status !== 'playing' || ev.button > 0) return;
    const card = ev.target.closest('[data-card]');
    drag = { id: card ? card.dataset.card : null, el: card, x0: ev.clientX, y0: ev.clientY, ghost: null, over: null };
    if (card) ev.preventDefault();
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
  }

  function dropTargetAt(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    return el.closest('.cell.player-zone') || el.closest('#hand');
  }

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
    const d = drag;
    drag = null;
    if (!d) return;
    if (d.over) d.over.classList.remove('drop-hover');
    const target = dropTargetAt(ev.clientX, ev.clientY);

    if (d.ghost) {
      d.ghost.remove();
      if (target && target.id === 'hand') returnCard(d.id);
      else if (target) placeCard(d.id, target.dataset.key);
      game.selected = null;
    } else if (d.id) {
      // Tap on a card.
      const tappedTile = d.el.dataset.from !== 'hand' ? d.el.dataset.from : null;
      if (game.selected === d.id) game.selected = null;
      else if (game.selected && tappedTile) { placeCard(game.selected, tappedTile); game.selected = null; }
      else game.selected = d.id;
    } else if (game.selected && target) {
      // Tap on an empty tile or the hand with a card selected.
      if (target.id === 'hand') returnCard(game.selected);
      else placeCard(game.selected, target.dataset.key);
      game.selected = null;
    } else {
      game.selected = null;
    }
    render();
  }

  function onHover(ev) {
    if (drag && drag.ghost) return;
    const cell = ev.target.closest && ev.target.closest('.cell');
    const k = cell ? cell.dataset.key : null;
    if (k !== game.hover) { game.hover = k; if (!game.busy) render(); }
  }

  // ---------- Turn playback ----------

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms / game.speed));

  function centerOf(el) {
    const a = $('#arena').getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - a.left + r.width / 2, y: r.top - a.top + r.height / 2 };
  }

  function floatText(el, text, cls) {
    const p = centerOf(el);
    const f = document.createElement('div');
    f.className = 'float ' + (cls || '');
    f.textContent = text;
    f.style.left = p.x + 'px';
    f.style.top = p.y + 'px';
    f.style.animationDuration = (900 / game.speed) + 'ms';
    $('#fx').appendChild(f);
    setTimeout(() => f.remove(), 900 / game.speed + 50);
  }

  async function projectile(fromEl, toEl, cls) {
    const a = centerOf(fromEl);
    const b = centerOf(toEl);
    const p = document.createElement('div');
    p.className = 'projectile ' + (cls || '');
    p.style.left = a.x + 'px';
    p.style.top = a.y + 'px';
    const ms = 220 / game.speed;
    p.style.transitionDuration = ms + 'ms';
    $('#fx').appendChild(p);
    p.getBoundingClientRect(); // commit start position before transitioning
    p.style.transform = 'translate(' + (b.x - a.x) + 'px,' + (b.y - a.y) + 'px)';
    await new Promise((res) => setTimeout(res, ms));
    p.remove();
  }

  function flash(el, cls, ms) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms / game.speed);
  }

  function log(html, cls) {
    const line = document.createElement('div');
    if (cls) line.className = cls;
    line.innerHTML = html;
    $('#log').appendChild(line);
    $('#log').scrollTop = $('#log').scrollHeight;
  }

  const enemyCell = (view, id) => {
    const e = view.enemies.find((en) => en.id === id);
    return cellEl(E.key(e.row, e.col));
  };
  const enemyName = (view, id) => E.ENEMY_TYPES[view.enemies.find((en) => en.id === id).type].name;

  async function fight() {
    if (game.busy || game.state.status !== 'playing') return;
    if (!Object.keys(game.placement).length) {
      $('#message').textContent = 'Place at least one card first.';
      return;
    }
    game.busy = true;
    game.selected = null;
    const before = game.state;
    const stats = E.computeStats(game.placement, game.stage.army);
    const { state, events } = E.resolveTurn(before, game.placement, game.stage.army);
    game.view = E.clone(before);
    $('#message').textContent = '';
    render();
    log('Turn ' + before.turn, 'turn');

    for (const ev of events) await playEvent(ev, game.view, stats);

    game.state = state;
    game.view = null;
    game.busy = false;
    render();
    afterTurn(before, state);
  }

  async function playEvent(ev, view, stats) {
    if (ev.t === 'fire') {
      const el = cellEl(ev.key);
      const st = stats[ev.key];
      el.classList.add('firing');
      if (!ev.targets.length) {
        floatText(el, 'no target', 'info');
        log(st.type.name + ' has no target in range', 'bad');
        await sleep(450);
      } else {
        log(st.type.name + ' fires for ⚔' + ev.atk);
        await Promise.all(ev.targets.map((id) => projectile(el, enemyCell(view, id))));
      }
      el.classList.remove('firing');
    } else if (ev.t === 'hit') {
      const e = view.enemies.find((en) => en.id === ev.id);
      const el = enemyCell(view, ev.id);
      e.hp = ev.hp;
      flash(el, 'shake', 300);
      floatText(el, '−' + ev.dmg + (ev.armor && ev.amount > ev.dmg ? ' (🛡' + ev.armor + ')' : ''), 'dmg');
      if (ev.killed) e.alive = false;
      log('&nbsp;&nbsp;' + enemyName(view, ev.id) + ' takes ' + ev.dmg + (ev.killed ? ', destroyed' : ' (' + ev.hp + ' left)'),
        ev.killed ? 'good' : '');
      render();
      await sleep(320);
    } else if (ev.t === 'overkill') {
      const from = enemyCell(view, ev.from);
      floatText(from, 'Overkill ' + ev.amount + '!', 'info');
      log('&nbsp;&nbsp;Overkill: ' + ev.amount + ' carries to the ' + enemyName(view, ev.id));
      await projectile(from, enemyCell(view, ev.id));
    } else if (ev.t === 'explode') {
      const el = enemyCell(view, ev.id);
      flash(el, 'boom-flash', 450);
      floatText(el, '💥', 'boom');
      log('&nbsp;&nbsp;Barrel explodes for ' + ev.amount + ' to its neighbours');
      await sleep(380);
    } else if (ev.t === 'strike') {
      const el = enemyCell(view, ev.id);
      const hero = $('#hero');
      const target = ev.blocked && ev.shields.length ? cellEl(ev.shields[0]) : hero;
      await projectile(el, target, 'enemy-shot');
      if (ev.blocked) {
        ev.shields.forEach((k) => flash(cellEl(k), 'shield-flash', 400));
        floatText(cellEl(ev.shields[0]), 'Blocked ' + ev.blocked, 'block');
        if (ev.dmg) await projectile(cellEl(ev.shields[0]), hero, 'enemy-shot');
      }
      if (ev.dmg) {
        flash(hero, 'hurt', 350);
        floatText(hero, '−' + ev.dmg + ' ♥', 'dmg');
      }
      view.hp = ev.hp;
      view.damageTaken += ev.dmg;
      log(enemyName(view, ev.id) + ' attacks for ⚔' + ev.atk +
        (ev.blocked ? ', ' + ev.blocked + ' blocked' : '') + ': you take ' + ev.dmg, ev.dmg ? 'bad' : '');
      render();
      await sleep(380);
    } else if (ev.t === 'enrage') {
      if (!ev.ids.length) return;
      ev.ids.forEach((id) => {
        view.enemies.find((en) => en.id === id).atk += 1;
        const el = enemyCell(view, id);
        flash(el, 'rage', 500);
        floatText(el, '+1 ⚔', 'info');
      });
      log('Survivors enrage: +1 ⚔', 'bad');
      render();
      await sleep(600);
    }
  }

  function afterTurn(before, after) {
    if (after.status === 'cleared') {
      log('Stage cleared!', 'good');
      const dmg = after.damageTaken;
      const stars = dmg === 0 ? 3 : dmg <= 3 ? 2 : 1;
      const next = game.stageIndex + 1 < STAGES.length;
      showModal(
        '<h3>Stage cleared!</h3>' +
        '<div class="stars">' + '★'.repeat(stars) + '<span style="opacity:.25">' + '★'.repeat(3 - stars) + '</span></div>' +
        '<p>Turns: <b>' + (after.turn) + '</b> · Damage taken: <b>' + dmg + '</b></p>' +
        '<p>HP carried to the next stage: <b>' + after.hp + ' / ' + after.maxHp + '</b></p>' +
        '<p class="muted" style="font-size:13px">★★★ = no damage · ★★ = 3 or less</p>' +
        '<div class="row"><button data-act="close">View board</button><button data-act="retry">Retry</button>' +
        (next ? '<button class="primary" data-act="next">Next stage</button>' : '') + '</div>');
    } else if (after.status === 'defeated') {
      log('Your hero has fallen.', 'bad');
      showModal('<h3>Run over</h3><p>Your hero ran out of HP on turn ' + before.turn + '.</p>' +
        '<p class="muted" style="font-size:13px">In the full game you would now spend Souls on permanent upgrades.</p>' +
        '<div class="row"><button data-act="close">View board</button>' +
        '<button class="primary" data-act="retry">Retry stage</button></div>');
    } else {
      const lost = before.hp - after.hp;
      $('#message').textContent = 'Turn ' + after.turn + ': you lost ' + lost +
        ' HP and the survivors enraged. Rearrange your army and fight again.';
    }
  }

  function showModal(html) {
    $('#modal-box').innerHTML = html;
    $('#modal').classList.remove('hidden');
  }
  function hideModal() { $('#modal').classList.add('hidden'); }

  // ---------- Wiring ----------

  document.addEventListener('pointerdown', (ev) => {
    if (ev.target.closest('#board, #hand')) onPointerDown(ev);
  });
  $('#board').addEventListener('pointerover', onHover);
  $('#board').addEventListener('pointerleave', () => { game.hover = null; if (!game.busy) render(); });
  $('#fight').addEventListener('click', fight);
  $('#clear').addEventListener('click', () => { game.placement = {}; game.selected = null; render(); });
  $('#retry').addEventListener('click', () => loadStage(game.stageIndex));
  $('#speed').addEventListener('click', () => {
    game.speed = SPEEDS[(SPEEDS.indexOf(game.speed) + 1) % SPEEDS.length];
    render();
  });
  $('#stage-select').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-stage]');
    if (b && !game.busy) loadStage(Number(b.dataset.stage));
  });
  $('#modal').addEventListener('click', (ev) => {
    const act = ev.target.closest('[data-act]');
    if (!act) return;
    if (act.dataset.act === 'close') hideModal();
    if (act.dataset.act === 'retry') loadStage(game.stageIndex);
    if (act.dataset.act === 'next') loadStage(game.stageIndex + 1);
  });

  // Start on the middle stage.
  loadStage(1);
})();
