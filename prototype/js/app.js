// Game flow for the world map prototype: Camp, runs, map choices,
// battles, rewards and end-of-run results.
(function () {
  'use strict';
  const E = window.Engine, World = window.World, P = window.Progress, Gen = window.Gen, Items = window.Items;
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
  // Creature art for a roster card: { img (html), name (creature or type name), role (type name) }.
  function unitView(id) {
    const type = P.ROSTER_BY[id].type, t = E.CARD_TYPES[type], a = window.Art.unit({ id, type });
    const alt = a.name || t.name;
    return {
      img: a.url ? '<img src="' + a.url + '" alt="' + esc(alt) + '" draggable="false">' : esc(t.icon),
      name: alt, role: t.name,
    };
  }
  const unitTitle = (id) => { const v = unitView(id); return v.name === v.role ? v.name : v.name + ' · ' + v.role; };
  const unitCell = (id, extra) => { const v = unitView(id); return '<span class="art">' + v.img + '</span><div class="grow"><b>' + esc(v.name) + '</b><span class="role">' + esc(v.role) + '</span>' + extra + '</div>'; };
  function enemyChip(type) {
    const url = window.Art.enemy(type), et = E.ENEMY_TYPES[type], nm = et.name || type;
    return '<span class="enemy-chip" title="' + esc(nm) + '">' + (url ? '<img src="' + url + '" alt="' + esc(nm) + '" draggable="false">' : esc(et.icon)) + '</span>';
  }

  // ---------- Map state ----------
  // Free exploration: every unfought spot of every unlocked sub-area is open at any time.
  function frontier() {
    const r = run(); if (!r) return new Set();
    const cleared = new Set(r.cleared), out = new Set();
    for (const n of World.nodes) if (n.type !== 'camp' && save.unlocked.includes(n.sub) && !cleared.has(n.id)) out.add(n.id);
    return out;
  }
  function syncMap() { WorldMap.update({ save, run: run(), frontier: frontier(), selected }); }

  function nodeTitle(n) {
    if (n.type === 'camp') return 'Camp';
    const t = World.THEMES[n.sub];
    if (n.type === 'boss') return t.boss[0];
    if (n.type === 'elite') return t.tough[0] + ' Warband';
    if (n.type === 'shrine') return 'Healing Spring';
    if (n.type === 'treasure') return 'Supply Cache';
    return t[n.role === 'armored' || n.role === 'barrel' ? n.role : 'basic'][0] + ' Patrol';
  }

  // ---------- HUD ----------
  function renderHud() {
    const r = run();
    if (r) {
      $('#hud').innerHTML =
        '<div class="hud-hp"><span class="lbl">♥</span><div class="bar"><i style="width:' + (100 * r.hp / r.maxHp) + '%"></i></div><b>' + r.hp + '/' + r.maxHp + '</b></div>' +
        '<div class="hud-chip supplies' + (r.supplies <= 2 ? ' low' : '') + '" title="Supplies: battles left on this run. Normal and elite fights cost 1, bosses add ' + P.SUPPLIES_PER_BOSS + '.">🎒 ' + r.supplies + '</div>' +
        '<div class="hud-chip" title="Souls carried on this run">✦ ' + r.souls + '</div>';
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

  const rarClass = (it) => 'rar-' + it.rarity;
  const itemIcon = (it) => '<span class="ic">' + esc(Items.icon(it)) + '</span>';
  // One line of the "possible drops" list on a spot's sheet.
  function dropRow(e, n) {
    const it = Items.BY_ID[e.id], owned = save.items.includes(it.id);
    const firstBoss = e.kind === 'unique' && n.type === 'boss' && !save.bossesBeaten.includes(n.sub);
    const chance = firstBoss ? 'first win' : Math.round(e.chance * 100) + '%';
    return '<div class="drop ' + rarClass(it) + (e.kind === 'unique' ? ' unique' : '') + (owned ? ' owned' : '') + '">' + itemIcon(it) +
      '<div class="grow"><b>' + esc(it.name) + '</b><span>' + esc(Items.describe(it)) + (e.kind === 'unique' ? ' · only here' : '') + '</span></div>' +
      '<span class="chance">' + (owned ? '✓' : chance) + '</span></div>';
  }
  function supplyNote(n) {
    return n.type === 'boss' ? '<span class="cost gain">🎒 Boss: +' + P.SUPPLIES_PER_BOSS + ' Supplies</span>' : '<span class="cost">🎒 Costs 1 Supply</span>';
  }

  function nodeSheet(n) {
    const r = run(), sub = World.SUB_BY[n.sub];
    const isFight = ['battle', 'elite', 'boss'].includes(n.type);
    let body = '<div class="sheet-head"><div><h2>' + esc(nodeTitle(n)) + '</h2><p class="muted">' + esc(sub.name) + ' · ' + esc(sub.region) + '</p></div>' +
      (isFight ? '<span class="lv" style="background:' + lvColor(n.level) + '">Lv' + n.level + '</span>' : '') + '</div>';
    if (isFight) {
      const preview = Gen.generateBattle(n, r ? r.seed : 'preview');
      const icons = preview.enemies.map((e) => enemyChip(e.type)).join('');
      const souls = Math.round(Gen.soulsFor(n) * P.soulRate(save));
      body += '<p class="enemies">' + icons + '</p>';
      body += '<p class="muted">' + (n.type === 'boss'
        ? (save.bossesBeaten.includes(n.sub) ? 'Already defeated once. Fight again for Souls.' : 'Defeat it to reveal ' + sub.unlocks.map((u) => World.SUB_BY[u].name).join(' and ') + (sub.unlocks.length ? '.' : '. This is a final boss.'))
        : n.type === 'elite' ? 'A tougher fight that pays double Souls.' : 'A normal fight.') + ' Reward: ✦ ' + souls + '.</p>';
      body += '<p>' + supplyNote(n) + '</p>';
      body += '<div class="drops"><h4>Possible drops</h4>' + Items.tableFor(n).map((e) => dropRow(e, n)).join('') + '</div>';
    } else if (n.type === 'shrine') body += '<p class="muted">Restores 8 HP. Once per run.</p><p><span class="cost free">Free: costs no Supplies</span></p>';
    else if (n.type === 'treasure') body += '<p class="muted">Free supplies: ✦ 10 and a reward of your choice.</p><p><span class="cost free">Free: costs no Supplies</span></p>';

    if (!r) body += '<p class="hint">Set out from Camp to fight here.</p><button class="primary wide" data-act="close-node">Back to Camp</button>';
    else if (r.cleared.includes(n.id)) body += '<p class="hint">Already cleared on this run.</p><button class="wide" data-act="close-node">Close</button>';
    else body += '<div class="row"><button data-act="close-node">Cancel</button><button class="primary grow" data-act="engage">' +
      (isFight ? (n.type === 'boss' ? '👑 Challenge' : '⚔ Fight') : n.type === 'shrine' ? '⛲ Rest' : '🎁 Open') + '</button></div>';
    return body;
  }

  function runSheet() {
    const r = run();
    const open = [...frontier()].filter((id) => ['battle', 'elite', 'boss'].includes(World.byId[id].type)).length;
    return '<div class="sheet-head"><div><h2>On expedition</h2><p class="muted">Free exploration: tap any monster in an open area. ' + open + ' fights left.</p></div></div>' +
      '<p class="supply-line">🎒 <b>' + r.supplies + '</b> Supplies left. Each normal or elite win costs 1; a boss adds ' + P.SUPPLIES_PER_BOSS + '. At 0 you return to Camp safely.</p>' +
      '<p class="muted small">HP never regenerates by itself. Return to Camp to keep all ✦ ' + r.souls + ' Souls; if you fall, you keep 75%.</p>' +
      '<button class="wide' + (confirmReturn ? ' danger' : '') + '" data-act="return">' + (confirmReturn ? 'Tap again to end the run and return' : '🏕 Return to Camp') + '</button>';
  }

  function campSheet() {
    const tabs = ['upgrades', 'squad', 'recruit', 'gear'];
    let html = '<div class="sheet-head"><div><h2>Camp</h2><p class="muted">Spend Souls, pick your squad, then set out with 🎒 ' + P.startSupplies(save) + ' Supplies.</p></div>' +
      '<button class="primary" data-act="start">Set out ➜</button></div>';
    html += '<div class="tabs">' + tabs.map((t) => '<button class="' + (campTab === t ? 'on' : '') + '" data-tab="' + t + '">' +
      { upgrades: 'Upgrades', squad: 'Squad ' + save.squad.length + '/' + P.slots(save), recruit: 'Recruit', gear: 'Gear ' + save.equipped.length + '/' + Items.SLOTS }[t] + '</button>').join('') + '</div>';
    html += '<div class="list">';
    if (campTab === 'upgrades') {
      for (const u of P.UPGRADES) {
        const lv = P.level(save, u.id), cost = P.upgradeCost(save, u.id);
        html += '<div class="item"><span class="ic">' + u.icon + '</span><div class="grow"><b>' + u.name + ' <small>Lv ' + lv + '/' + u.costs.length + '</small></b><span class="muted">' + u.desc + '</span></div>' +
          (cost === null ? '<span class="muted">Max</span>' : '<button data-buy="' + u.id + '"' + (save.souls < cost ? ' disabled' : '') + '>✦ ' + cost + '</button>') + '</div>';
      }
      html += '<p class="muted small">Max HP ' + P.maxHp(save) + ' · Squad slots ' + P.slots(save) + ' · Start Supplies ' + P.startSupplies(save) + '</p>';
    } else if (campTab === 'squad') {
      const army = P.buildArmy(save, {});
      for (const id of save.owned) {
        const inSquad = save.squad.includes(id), card = army.find((c) => c.id === id) || P.buildArmy(Object.assign({}, save, { squad: [id] }), {})[0];
        html += '<div class="item">' + unitCell(id, '<span class="muted">' + statLine(card) + '</span>') +
          '<button class="' + (inSquad ? 'on' : '') + '" data-squad="' + id + '">' + (inSquad ? 'In squad' : 'Add') + '</button></div>';
      }
    } else if (campTab === 'gear') {
      html += gearTab();
    } else {
      for (const u of P.ROSTER) {
        if (save.owned.includes(u.id) || u.start) continue;
        const avail = P.recruitAvailable(save, u);
        const need = Array.isArray(u.need) ? u.need : [u.need];
        html += '<div class="item' + (avail ? '' : ' locked') + '">' + unitCell(u.id, '<span class="muted">' +
          (avail ? describeType(u.type) : 'Defeat ' + need.map((b) => World.THEMES[b].boss[0]).join(' or ')) + '</span>') +
          (avail ? '<button data-recruit="' + u.id + '"' + (save.souls < u.cost ? ' disabled' : '') + '>✦ ' + u.cost + '</button>' : '<span class="muted">🔒</span>') + '</div>';
      }
    }
    html += '</div><div class="tools"><span class="muted small">Prototype tools</span><button data-act="cheat">+100 ✦</button><button data-act="reset" class="' + (confirmReset ? 'danger' : '') + '">' + (confirmReset ? 'Tap again to erase' : 'Reset progress') + '</button></div>';
    return html;
  }
  function gearTab() {
    const owned = save.items.map((id) => Items.BY_ID[id]).filter(Boolean);
    let h = '<p class="muted small">Items drop from monsters and are kept forever. Equip up to ' + Items.SLOTS + ' (' + save.equipped.length + ' equipped). Collected ' + owned.length + '/' + Items.ALL.length + '.</p>';
    if (!owned.length) return h + '<p class="empty-gear">No gear yet. Win battles on the map: every monster has an item that only it drops.</p>';
    owned.sort((a, b) => (save.equipped.includes(b.id) - save.equipped.includes(a.id)) || (Items.RARITY[b.rarity].order - Items.RARITY[a.rarity].order) || a.name.localeCompare(b.name));
    for (const it of owned) {
      const on = save.equipped.includes(it.id), src = it.source;
      const from = src.kind === 'unique' ? nodeTitle(World.byId[src.spot]) + ' · ' + World.SUB_BY[src.sub].name : src.kind === 'sub' ? World.SUB_BY[src.sub].name : src.region;
      h += '<div class="item gear ' + rarClass(it) + (on ? ' equipped' : '') + '">' + itemIcon(it) + '<div class="grow"><b>' + esc(it.name) + ' <small>' + Items.RARITY[it.rarity].name + '</small></b><span class="effect">' + esc(Items.describe(it)) + '</span><span class="muted">' + esc(from) + '</span></div>' +
        '<button class="' + (on ? 'on' : '') + '" data-equip="' + it.id + '">' + (on ? 'Equipped' : 'Equip') + '</button></div>';
    }
    return h;
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
    const sup = P.startSupplies(save);
    save.run = { seed: 'run' + Date.now(), hp: P.maxHp(save), maxHp: P.maxHp(save), supplies: sup, startSupplies: sup, pos: 'camp', cleared: ['camp'], path: ['camp'],
      souls: 0, wins: 0, maxLevel: 0, mods: {}, placement: {}, unlockedNow: [], found: [] };
    selected = null; confirmReturn = false; persist();
    WorldMap.placeToken('camp');
    const sub = World.SUB_BY.meadow; WorldMap.focus(sub.entry[0], sub.entry[1]);
    toast('Expedition started with ' + sup + ' Supplies. Choose any fight.');
    renderAll();
  }

  async function engage(id) {
    const r = run(), n = World.byId[id];
    if (!r || busy || r.cleared.includes(id) || !save.unlocked.includes(n.sub)) return;
    busy = true; selected = null; sheetOpen = true; renderAll();
    // Short hops are walked; far ones just move the hero there.
    const from = World.byId[r.pos] || World.CAMP;
    if (Math.hypot(from.x - n.x, from.y - n.y) < 260) await WorldMap.walk([id]); else { WorldMap.placeToken(id); WorldMap.focus(n.x, n.y); }
    r.pos = id; r.path.push(id);
    busy = false;
    if (n.type === 'shrine') {
      const before = r.hp; r.hp = Math.min(r.maxHp, r.hp + 8); r.cleared.push(id); persist();
      toast('The spring restores ' + (r.hp - before) + ' HP.'); renderAll(); return;
    }
    if (n.type === 'treasure') {
      r.cleared.push(id); r.souls += 10; persist(); renderAll();
      offerReward('Supply cache', 'You found ✦ 10 and some supplies. This cost no Supplies.', n); return;
    }
    const stage = Object.assign({ heroHp: r.hp, heroMaxHp: r.maxHp }, Gen.generateBattle(n, r.seed));
    WorldMap.setActive(false);
    document.body.classList.add('in-battle');
    Battle.start({
      title: nodeTitle(n), subtitle: World.SUB_BY[n.sub].name + ' · Lv' + n.level, stage, biome: World.SUB_BY[n.sub].biome,
      army: P.buildArmy(save, r.mods), placement: r.placement,
      onEnd: (state) => battleOver(n, state),
    });
  }

  // The reward card shown when an item drops.
  function dropCard(it, note) {
    return '<div class="drop-card ' + rarClass(it) + '"><span class="ic big">' + esc(Items.icon(it)) + '</span><div class="grow"><small class="new">New item · ' + Items.RARITY[it.rarity].name + '</small><b>' + esc(it.name) + '</b><span>' + esc(Items.describe(it)) + '</span>' +
      (note ? '<em>' + esc(note) + '</em>' : '') + '</div></div>';
  }
  // Equip a freshly dropped item into a free slot and apply it to the run in progress.
  function autoEquip(it) {
    if (save.equipped.length >= Items.SLOTS) return false;
    save.equipped.push(it.id);
    const r = run();
    if (r) {
      if (it.kind === 'hp') { r.maxHp += it.amount; r.hp += it.amount; }
      if (it.kind === 'supplies') { r.supplies += it.amount; r.startSupplies += it.amount; }
    }
    return true;
  }

  function battleOver(n, state) {
    const r = run();
    r.placement = Battle.placement();
    Battle.hide(); document.body.classList.remove('in-battle'); WorldMap.setActive(true);
    r.hp = state.hp;
    if (state.status !== 'cleared') { persist(); endRun(true); return; }
    const gained = Math.round(Gen.soulsFor(n) * P.soulRate(save));
    r.souls += gained; r.wins += 1; r.maxLevel = Math.max(r.maxLevel, n.level); r.cleared.push(n.id);
    // Items: rolled before the boss is marked as beaten, so its first kill always drops its unique item.
    let dropId = Items.rollDrop(save, n, r.seed);
    if (!dropId && save.runs === 0 && !r.found.length && r.wins === 2) dropId = Items.guaranteedDrop(save, n); // design 24.3: an item in the first two battles
    let item = null, equipped = false;
    if (dropId) { item = Items.BY_ID[dropId]; save.items.push(dropId); r.found.push(dropId); equipped = autoEquip(item); }
    // Supplies: normal and elite wins cost 1, a boss adds some.
    const boss = n.type === 'boss';
    r.supplies += boss ? P.SUPPLIES_PER_BOSS : -1;
    let title = 'Victory', text = '✦ ' + gained + ' Souls. You lost ' + state.damageTaken + ' HP.';
    if (boss && !save.bossesBeaten.includes(n.sub)) {
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
    const supLine = '<p class="supply-line">🎒 ' + (boss ? 'The boss falls: <b>+' + P.SUPPLIES_PER_BOSS + ' Supplies</b>' : 'Spent <b>1 Supply</b>') + ' · ' + Math.max(0, r.supplies) + ' left.</p>';
    const extra = (item ? dropCard(item, equipped ? 'Equipped automatically. Change it in Camp ▸ Gear.' : 'Your three slots are full. Swap it in at Camp ▸ Gear.') : '') + supLine;
    persist(); renderAll();
    if (r.supplies <= 0) { outOfSupplies(title, text, extra); return; }
    offerReward(title, text, n, extra);
  }

  function outOfSupplies(title, text, extra) {
    modal('<h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' + extra +
      '<p><b>You are out of Supplies.</b> The expedition heads home safely with all Souls.</p><div class="row"><button class="primary grow" data-act="home">Return to Camp</button></div>');
    $('#modal').onclick = (ev) => { if (ev.target.closest('[data-act="home"]')) { closeModal(); endRun(false, 'supplies'); } };
  }

  // Choose 1 of 3: always one heal, plus two upgrades for this run.
  function offerReward(title, text, node, extra) {
    const r = run(), R = World.rng(r.seed + ':reward:' + r.path.length);
    const army = P.buildArmy(save, r.mods);
    const regionIdx = node ? World.SUB_BY[node.sub].regionIndex : 0;
    const pool = [];
    for (const c of army) {
      const t = E.CARD_TYPES[c.type];
      if (t.role === 'attacker') {
        pool.push({ kind: 'atk', id: c.id, label: '+1 ATK · ' + unitTitle(c.id), icon: t.icon, card: c.id });
        // Range is a rare reward that only appears from the second region onward (design 24.2).
        if (regionIdx >= 1 && (t.pattern !== 'straight' || t.range < 4) && R() < 0.4) pool.push({ kind: 'range', id: c.id, label: '+1 range · ' + unitTitle(c.id), icon: t.icon, card: c.id });
      } else if (t.role === 'defender') pool.push({ kind: 'block', id: c.id, label: '+1 block · ' + unitTitle(c.id), icon: t.icon, card: c.id });
      else if (t.effect !== 'mult') pool.push({ kind: 'amount', id: c.id, label: '+1 boost · ' + unitTitle(c.id), icon: t.icon, card: c.id });
    }
    const picks = [];
    while (picks.length < 2 && pool.length) picks.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
    picks.push({ kind: 'heal', label: 'Heal 5 HP', icon: '❤️' });
    modal('<h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' + (extra || '') + '<p class="muted small">Choose one reward for this run:</p><div class="rewards">' +
      picks.map((p, i) => '<button data-reward="' + i + '"><span class="ic">' + (p.card ? unitView(p.card).img : p.icon) + '</span><span>' + esc(p.label) + '</span></button>').join('') + '</div>');
    $('#modal').onclick = (ev) => {
      const b = ev.target.closest('[data-reward]'); if (!b) return;
      const p = picks[Number(b.dataset.reward)];
      if (p.kind === 'heal') r.hp = Math.min(r.maxHp, r.hp + 5);
      else { const m = r.mods[p.id] || (r.mods[p.id] = {}); m[p.kind] = (m[p.kind] || 0) + 1; }
      persist(); closeModal(); renderAll();
    };
  }

  function endRun(defeated, reason) {
    const r = run();
    const earned = defeated ? Math.floor(r.souls * 0.75) : r.souls;
    const prevBest = save.bestLevel;
    save.souls += earned; save.runs += 1;
    save.bestLevel = Math.max(save.bestLevel, r.maxLevel);
    save.lastPath = r.path; save.run = null; selected = null; confirmReturn = false;
    persist();
    const unlockedNames = r.unlockedNow.map((u) => World.SUB_BY[u].name);
    const found = (r.found || []).map((id) => Items.BY_ID[id]);
    modal('<h3>' + (defeated ? 'Your hero has fallen' : reason === 'supplies' ? 'Out of Supplies' : 'Back at Camp') + '</h3>' +
      '<div class="stats"><div><b>' + r.wins + '</b><span>battles won</span></div><div><b>Lv' + r.maxLevel + '</b><span>deepest fight' + (r.maxLevel > prevBest ? ' · new best!' : '') + '</span></div>' +
      '<div><b>✦ ' + earned + '</b><span>' + (defeated ? '75% of ' + r.souls + ' kept' : 'all Souls kept') + '</span></div></div>' +
      (found.length ? '<p>Items found: <b>' + found.map((it) => esc(it.name)).join(', ') + '</b>. Equip them in Camp ▸ Gear.</p>' : '') +
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
        persist(); toast(unitView(u.id).name + ' joined your roster.'); renderAll();
      }
      return;
    }
    if (b.dataset.equip) {
      const id = b.dataset.equip, i = save.equipped.indexOf(id);
      if (i >= 0) save.equipped.splice(i, 1);
      else if (save.equipped.length < Items.SLOTS) save.equipped.push(id);
      else { toast('All ' + Items.SLOTS + ' gear slots are full. Unequip something first.'); return; }
      persist(); renderAll(); return;
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
