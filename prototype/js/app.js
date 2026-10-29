// Game flow for the world map prototype: Camp, runs, map choices,
// battles, rewards and end-of-run results.
(function () {
  'use strict';
  const E = window.Engine, World = window.World, P = window.Progress, Gen = window.Gen;
  const $ = (s) => document.querySelector(s);
  let save = P.load();
  let selected = null;
  let campTab = 'upgrades';
  let sheetOpen = true;
  let busy = false;
  let confirmReset = false, confirmReturn = false;

  const run = () => save.run;
  const persist = () => P.save(save);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cardName = (id) => E.CARD_TYPES[P.ROSTER_BY[id].type].name;
  const cardIcon = (id) => E.CARD_TYPES[P.ROSTER_BY[id].type].icon;

  // ---------- Map state ----------
  function frontier() {
    const r = run(); if (!r) return new Set();
    const cleared = new Set(r.cleared), out = new Set();
    for (const id of cleared) for (const n of World.adj[id]) {
      const node = World.byId[n];
      if (!cleared.has(n) && save.unlocked.includes(node.sub)) out.add(n);
    }
    return out;
  }
  // Walk from the hero's position through cleared spots to the target.
  function routeTo(target) {
    const r = run(), cleared = new Set(r.cleared);
    const prev = { [r.pos]: null }, queue = [r.pos];
    while (queue.length) {
      const id = queue.shift();
      if (id === target) break;
      for (const n of World.adj[id]) {
        if (n in prev) continue;
        if (n !== target && !cleared.has(n)) continue;
        prev[n] = id; queue.push(n);
      }
    }
    if (!(target in prev)) return null;
    const path = []; for (let id = target; id; id = prev[id]) path.unshift(id);
    return path;
  }
  function syncMap() { WorldMap.update({ save, run: run(), frontier: frontier(), selected }); }

  function nodeTitle(n) {
    if (n.type === 'camp') return 'Camp';
    const t = World.THEMES[n.sub];
    if (n.type === 'boss') return t.boss[0];
    if (n.type === 'elite') return t.tough[0] + ' Warband';
    if (n.type === 'shrine') return 'Healing Spring';
    if (n.type === 'treasure') return 'Supply Cache';
    return t.basic[0] + ' Patrol';
  }

  // ---------- HUD ----------
  function renderHud() {
    const r = run();
    if (r) {
      $('#hud').innerHTML =
        '<div class="hud-hp"><span class="lbl">♥</span><div class="bar"><i style="width:' + (100 * r.hp / r.maxHp) + '%"></i></div><b>' + r.hp + '/' + r.maxHp + '</b></div>' +
        '<div class="hud-chip" title="Souls carried on this run">✦ ' + r.souls + '</div>' +
        '<div class="hud-chip" title="Battles won">⚔ ' + r.wins + '</div>';
    } else {
      $('#hud').innerHTML =
        '<div class="hud-chip big">✦ ' + save.souls + ' <small>Souls</small></div>' +
        '<div class="hud-chip">Runs ' + save.runs + '</div>' +
        '<div class="hud-chip">Best Lv' + save.bestLevel + '</div>';
    }
  }

  // ---------- Bottom sheet ----------
  function renderSheet() {
    const sheet = $('#sheet');
    sheet.classList.toggle('collapsed', !sheetOpen);
    const r = run();
    const node = selected ? World.byId[selected] : null;
    let html = '<button class="grab" id="sheet-toggle" aria-label="' + (sheetOpen ? 'Collapse' : 'Expand') + ' panel"><span></span></button>';
    if (node && node.type !== 'camp') html += nodeSheet(node);
    else if (!r) html += campSheet();
    else html += runSheet();
    sheet.innerHTML = html;
  }

  function nodeSheet(n) {
    const r = run(), sub = World.SUB_BY[n.sub];
    const isFight = ['battle', 'elite', 'boss'].includes(n.type);
    let body = '<div class="sheet-head"><div><h2>' + esc(nodeTitle(n)) + '</h2><p class="muted">' + esc(sub.name) + ' · ' + esc(sub.region) + '</p></div>' +
      (isFight ? '<span class="lv" style="background:' + lvColor(n.level) + '">Lv' + n.level + '</span>' : '') + '</div>';
    if (isFight) {
      const preview = Gen.generateBattle(n, r ? r.seed : 'preview');
      const icons = preview.enemies.map((e) => E.ENEMY_TYPES[e.type].icon).join(' ');
      const souls = Math.round(Gen.soulsFor(n) * P.soulRate(save));
      body += '<p class="enemies">' + icons + '</p>';
      body += '<p class="muted">' + (n.type === 'boss'
        ? (save.bossesBeaten.includes(n.sub) ? 'Already defeated once. Fight again for Souls.' : 'Defeat it to reveal ' + sub.unlocks.map((u) => World.SUB_BY[u].name).join(' and ') + (sub.unlocks.length ? '.' : '. This is a final boss.'))
        : n.type === 'elite' ? 'A tougher fight that pays double Souls.' : 'A normal fight.') + ' Reward: ✦ ' + souls + '.</p>';
    } else if (n.type === 'shrine') body += '<p class="muted">Restores 8 HP. Once per run.</p>';
    else if (n.type === 'treasure') body += '<p class="muted">Free supplies: ✦ 10 and a reward of your choice.</p>';

    if (!r) body += '<p class="hint">Set out from Camp to travel here.</p><button class="primary wide" data-act="close-node">Back to Camp</button>';
    else if (r.cleared.includes(n.id)) body += '<p class="hint">Already cleared on this run.</p><button class="wide" data-act="close-node">Close</button>';
    else if (!frontier().has(n.id)) body += '<p class="hint">Too far away. Clear a spot next to it first.</p><button class="wide" data-act="close-node">Close</button>';
    else body += '<div class="row"><button data-act="close-node">Cancel</button><button class="primary grow" data-act="engage">' +
      (isFight ? (n.type === 'boss' ? '👑 Challenge' : '⚔ Fight') : n.type === 'shrine' ? '⛲ Rest' : '🎁 Open') + '</button></div>';
    return body;
  }

  function runSheet() {
    const r = run();
    return '<div class="sheet-head"><div><h2>On expedition</h2><p class="muted">Tap a glowing spot next to your trail to fight it.</p></div></div>' +
      '<p class="muted small">HP never regenerates by itself. Return to Camp to keep all ✦ ' + r.souls + ' Souls; if you fall, you keep 75%.</p>' +
      '<button class="wide' + (confirmReturn ? ' danger' : '') + '" data-act="return">' + (confirmReturn ? 'Tap again to end the run and return' : '🏕 Return to Camp') + '</button>';
  }

  function campSheet() {
    const tabs = ['upgrades', 'squad', 'recruit'];
    let html = '<div class="sheet-head"><div><h2>Camp</h2><p class="muted">Spend Souls, pick your squad, then set out.</p></div>' +
      '<button class="primary" data-act="start">Set out ➜</button></div>';
    html += '<div class="tabs">' + tabs.map((t) => '<button class="' + (campTab === t ? 'on' : '') + '" data-tab="' + t + '">' +
      { upgrades: 'Upgrades', squad: 'Squad ' + save.squad.length + '/' + P.slots(save), recruit: 'Recruit' }[t] + '</button>').join('') + '</div>';
    html += '<div class="list">';
    if (campTab === 'upgrades') {
      for (const u of P.UPGRADES) {
        const lv = P.level(save, u.id), cost = P.upgradeCost(save, u.id);
        html += '<div class="item"><span class="ic">' + u.icon + '</span><div class="grow"><b>' + u.name + ' <small>Lv ' + lv + '/' + u.costs.length + '</small></b><span class="muted">' + u.desc + '</span></div>' +
          (cost === null ? '<span class="muted">Max</span>' : '<button data-buy="' + u.id + '"' + (save.souls < cost ? ' disabled' : '') + '>✦ ' + cost + '</button>') + '</div>';
      }
      html += '<p class="muted small">Max HP ' + P.maxHp(save) + ' · Squad slots ' + P.slots(save) + '</p>';
    } else if (campTab === 'squad') {
      const army = P.buildArmy(save, {});
      for (const id of save.owned) {
        const inSquad = save.squad.includes(id), card = army.find((c) => c.id === id) || P.buildArmy(Object.assign({}, save, { squad: [id] }), {})[0];
        html += '<div class="item"><span class="ic">' + cardIcon(id) + '</span><div class="grow"><b>' + cardName(id) + '</b><span class="muted">' + statLine(card) + '</span></div>' +
          '<button class="' + (inSquad ? 'on' : '') + '" data-squad="' + id + '">' + (inSquad ? 'In squad' : 'Add') + '</button></div>';
      }
    } else {
      for (const u of P.ROSTER) {
        if (save.owned.includes(u.id) || u.start) continue;
        const avail = P.recruitAvailable(save, u);
        const need = Array.isArray(u.need) ? u.need : [u.need];
        html += '<div class="item' + (avail ? '' : ' locked') + '"><span class="ic">' + cardIcon(u.id) + '</span><div class="grow"><b>' + cardName(u.id) + '</b><span class="muted">' +
          (avail ? describeType(u.type) : 'Defeat ' + need.map((b) => World.THEMES[b].boss[0]).join(' or ')) + '</span></div>' +
          (avail ? '<button data-recruit="' + u.id + '"' + (save.souls < u.cost ? ' disabled' : '') + '>✦ ' + u.cost + '</button>' : '<span class="muted">🔒</span>') + '</div>';
      }
    }
    html += '</div><div class="tools"><span class="muted small">Prototype tools</span><button data-act="cheat">+100 ✦</button><button data-act="reset" class="' + (confirmReset ? 'danger' : '') + '">' + (confirmReset ? 'Tap again to erase' : 'Reset progress') + '</button></div>';
    return html;
  }
  function statLine(card) {
    const t = E.CARD_TYPES[card.type];
    if (t.role === 'attacker') return '⚔' + card.atk + ' · ' + { straight: '↑ straight', pierce: '⇈ pierce', spread: '↖↑↗ spread' }[t.pattern] + ' · R' + card.range;
    if (t.role === 'support') return (t.effect === 'atk' ? '+' + card.amount + ' ATK' : t.effect === 'mult' ? '×' + card.amount + ' damage' : '+' + card.amount + ' range') + (t.target === 'up' ? ' to the card above' : ' to all neighbours');
    return '🛡 blocks ' + card.block + ' in its column';
  }
  const describeType = (type) => statLine(Object.assign({ type }, cardDefaults(type)));
  function cardDefaults(type) {
    const t = E.CARD_TYPES[type];
    if (t.role === 'attacker') return { atk: t.atk + P.level(save, 'drill'), range: t.range };
    if (t.role === 'support') return { amount: t.amount };
    return { block: 2 + P.level(save, 'bulwark') };
  }
  const lvColor = (L) => (L <= 3 ? '#3f9a46' : L <= 6 ? '#d9a21b' : L <= 9 ? '#e0731f' : '#c63b31');

  function renderAll() { renderHud(); renderSheet(); syncMap(); }

  // ---------- Actions ----------
  function startRun() {
    const army = P.buildArmy(save, {});
    if (!army.some((c) => E.CARD_TYPES[c.type].role === 'attacker')) { toast('Add at least one attacker to your squad.'); campTab = 'squad'; renderAll(); return; }
    save.run = { seed: 'run' + Date.now(), hp: P.maxHp(save), maxHp: P.maxHp(save), pos: 'camp', cleared: ['camp'], path: ['camp'],
      souls: 0, wins: 0, maxLevel: 0, mods: {}, placement: {}, unlockedNow: [] };
    selected = null; confirmReturn = false; persist();
    WorldMap.placeToken('camp');
    const sub = World.SUB_BY.meadow; WorldMap.focus(sub.entry[0], sub.entry[1]);
    toast('Expedition started. Choose your first fight.');
    renderAll();
  }

  async function engage(id) {
    const r = run(), n = World.byId[id];
    const route = routeTo(id);
    if (!route || busy) return;
    busy = true; selected = null; sheetOpen = true; renderAll();
    await WorldMap.walk(route.slice(1));
    r.pos = id; r.path.push(id);
    busy = false;
    if (n.type === 'shrine') {
      const before = r.hp; r.hp = Math.min(r.maxHp, r.hp + 8); r.cleared.push(id); persist();
      toast('The spring restores ' + (r.hp - before) + ' HP.'); renderAll(); return;
    }
    if (n.type === 'treasure') {
      r.cleared.push(id); r.souls += 10; persist(); renderAll();
      offerReward('Supply cache', 'You found ✦ 10 and some supplies.'); return;
    }
    const stage = Object.assign({ heroHp: r.hp, heroMaxHp: r.maxHp }, Gen.generateBattle(n, r.seed));
    WorldMap.setActive(false);
    document.body.classList.add('in-battle');
    Battle.start({
      title: nodeTitle(n), subtitle: World.SUB_BY[n.sub].name + ' · Lv' + n.level, stage,
      army: P.buildArmy(save, r.mods), placement: r.placement,
      onEnd: (state) => battleOver(n, state),
    });
  }

  function battleOver(n, state) {
    const r = run();
    r.placement = Battle.placement();
    Battle.hide(); document.body.classList.remove('in-battle'); WorldMap.setActive(true);
    r.hp = state.hp;
    if (state.status !== 'cleared') { persist(); endRun(true); return; }
    const gained = Math.round(Gen.soulsFor(n) * P.soulRate(save));
    r.souls += gained; r.wins += 1; r.maxLevel = Math.max(r.maxLevel, n.level); r.cleared.push(n.id);
    let title = 'Victory', text = '✦ ' + gained + ' Souls. You lost ' + state.damageTaken + ' HP.';
    if (n.type === 'boss' && !save.bossesBeaten.includes(n.sub)) {
      save.bossesBeaten.push(n.sub);
      const sub = World.SUB_BY[n.sub];
      for (const u of sub.unlocks) if (!save.unlocked.includes(u)) { save.unlocked.push(u); r.unlockedNow.push(u); }
      r.souls += 25;
      title = World.THEMES[n.sub].boss[0] + ' defeated!';
      text = (sub.unlocks.length ? 'The fog lifts over ' + sub.unlocks.map((u) => World.SUB_BY[u].name).join(' and ') + '. ' : 'You conquered ' + sub.region + '! ') +
        'Bonus ✦ 25. New recruits may be waiting at Camp.';
      const target = sub.unlocks.length ? World.SUB_BY[sub.unlocks[0]] : sub;
      setTimeout(() => WorldMap.focus(target.entry[0], target.entry[1]), 300);
    }
    persist(); renderAll();
    offerReward(title, text);
  }

  // Choose 1 of 3: always one heal, plus two upgrades for this run.
  function offerReward(title, text) {
    const r = run(), R = World.rng(r.seed + ':reward:' + r.path.length);
    const army = P.buildArmy(save, r.mods);
    const pool = [];
    for (const c of army) {
      const t = E.CARD_TYPES[c.type];
      if (t.role === 'attacker') {
        pool.push({ kind: 'atk', id: c.id, label: '+1 ATK · ' + t.name, icon: t.icon });
        if (t.pattern !== 'straight' || t.range < 4) pool.push({ kind: 'range', id: c.id, label: '+1 range · ' + t.name, icon: t.icon });
      } else if (t.role === 'defender') pool.push({ kind: 'block', id: c.id, label: '+1 block · Shield', icon: t.icon });
      else if (t.effect !== 'mult') pool.push({ kind: 'amount', id: c.id, label: '+1 boost · ' + t.name, icon: t.icon });
    }
    const picks = [];
    while (picks.length < 2 && pool.length) picks.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
    picks.push({ kind: 'heal', label: 'Heal 5 HP', icon: '❤️' });
    modal('<h3>' + esc(title) + '</h3><p>' + esc(text) + '</p><p class="muted small">Choose one reward for this run:</p><div class="rewards">' +
      picks.map((p, i) => '<button data-reward="' + i + '"><span class="ic">' + p.icon + '</span>' + esc(p.label) + '</button>').join('') + '</div>');
    $('#modal').onclick = (ev) => {
      const b = ev.target.closest('[data-reward]'); if (!b) return;
      const p = picks[Number(b.dataset.reward)];
      if (p.kind === 'heal') r.hp = Math.min(r.maxHp, r.hp + 5);
      else { const m = r.mods[p.id] || (r.mods[p.id] = {}); m[p.kind] = (m[p.kind] || 0) + 1; }
      persist(); closeModal(); renderAll();
    };
  }

  function endRun(defeated) {
    const r = run();
    const earned = defeated ? Math.floor(r.souls * 0.75) : r.souls;
    const prevBest = save.bestLevel;
    save.souls += earned; save.runs += 1;
    save.bestLevel = Math.max(save.bestLevel, r.maxLevel);
    save.lastPath = r.path; save.run = null; selected = null; confirmReturn = false;
    persist();
    const unlockedNames = r.unlockedNow.map((u) => World.SUB_BY[u].name);
    modal('<h3>' + (defeated ? 'Your hero has fallen' : 'Back at Camp') + '</h3>' +
      '<div class="stats"><div><b>' + r.wins + '</b><span>battles won</span></div><div><b>Lv' + r.maxLevel + '</b><span>deepest fight' + (r.maxLevel > prevBest ? ' · new best!' : '') + '</span></div>' +
      '<div><b>✦ ' + earned + '</b><span>' + (defeated ? '75% of ' + r.souls + ' kept' : 'all Souls kept') + '</span></div></div>' +
      (unlockedNames.length ? '<p>New areas revealed: <b>' + esc(unlockedNames.join(', ')) + '</b></p>' : '') +
      '<p class="muted small">Spend Souls at Camp on upgrades and recruits, then set out again to reach further.</p>' +
      '<div class="row"><button class="primary grow" data-act="to-camp">Go to Camp</button></div>');
    $('#modal').onclick = (ev) => {
      if (!ev.target.closest('[data-act="to-camp"]')) return;
      closeModal(); WorldMap.placeToken('camp'); WorldMap.focus(World.CAMP.x, World.CAMP.y - 120);
      campTab = 'upgrades'; sheetOpen = true; renderAll();
    };
    renderAll();
  }

  // ---------- Modal and toast ----------
  function modal(html) { $('#modal-box').innerHTML = html; $('#modal').hidden = false; }
  function closeModal() { $('#modal').hidden = true; $('#modal').onclick = null; }
  let toastTimer = null;
  function toast(text) {
    const t = $('#toast'); t.textContent = text; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }

  // ---------- Wiring ----------
  $('#sheet').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.id === 'sheet-toggle') { sheetOpen = !sheetOpen; renderSheet(); return; }
    if (b.dataset.tab) { campTab = b.dataset.tab; sheetOpen = true; renderSheet(); return; }
    if (b.dataset.buy) {
      const cost = P.upgradeCost(save, b.dataset.buy);
      if (cost !== null && save.souls >= cost) { save.souls -= cost; save.upgrades[b.dataset.buy] = P.level(save, b.dataset.buy) + 1; persist(); toast(P.UPGRADE_BY[b.dataset.buy].name + ' upgraded.'); renderAll(); }
      return;
    }
    if (b.dataset.recruit) {
      const u = P.ROSTER_BY[b.dataset.recruit];
      if (save.souls >= u.cost) {
        save.souls -= u.cost; save.owned.push(u.id);
        if (save.squad.length < P.slots(save)) save.squad.push(u.id);
        persist(); toast(cardName(u.id) + ' joined your roster.'); renderAll();
      }
      return;
    }
    if (b.dataset.squad) {
      const id = b.dataset.squad, i = save.squad.indexOf(id);
      if (i >= 0) save.squad.splice(i, 1);
      else if (save.squad.length < P.slots(save)) save.squad.push(id);
      else toast('Squad is full. Buy Command at Camp for more slots.');
      persist(); renderAll(); return;
    }
    const act = b.dataset.act;
    if (act === 'start') startRun();
    else if (act === 'engage') engage(selected);
    else if (act === 'close-node') { selected = null; renderAll(); }
    else if (act === 'return') { if (!confirmReturn) { confirmReturn = true; renderSheet(); } else endRun(false); }
    else if (act === 'cheat') { save.souls += 100; persist(); renderAll(); }
    else if (act === 'reset') {
      if (!confirmReset) { confirmReset = true; renderSheet(); return; }
      confirmReset = false; save = P.reset(); WorldMap.placeToken('camp'); WorldMap.focus(World.CAMP.x, World.CAMP.y - 120, true); toast('Progress erased.'); renderAll();
    }
  });

  WorldMap.init({
    onTap(node) {
      if (busy) return;
      confirmReturn = false; confirmReset = false;
      if (!node || (node.type === 'camp' && !run())) { selected = null; sheetOpen = true; renderAll(); return; }
      selected = node.id; sheetOpen = true; renderAll();
    },
  });
  const r0 = run();
  WorldMap.placeToken(r0 ? r0.pos : 'camp');
  const start = r0 ? World.byId[r0.pos] : World.CAMP;
  WorldMap.focus(start.x, start.y - (r0 ? 0 : 120), true);
  renderAll();
})();
