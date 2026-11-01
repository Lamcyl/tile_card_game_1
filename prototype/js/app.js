// Game flow for the world map prototype: Camp, runs, map choices,
// battles, rewards and end-of-run results.
(function () {
  'use strict';
  const Events = window.Events, Relics = window.Relics, Bounties = window.Bounties, E = window.Engine, World = window.World, P = window.Progress, Gen = window.Gen, Items = window.Items, Journal = window.Journal;
  const $ = (s) => document.querySelector(s);
  let save = P.load();
  let selected = null;
  let campView = 'home', teamSel = null, gearSel = null, summonView = 'summon'; // dedicated Camp menu: current screen and selections
  let sheetOpen = true;
  let menuOpen = false, dropSel = null; // in-run: HUD menu panel, tapped drop icon on the compact card
  let busy = false;
  let confirmReset = false, confirmReturn = false, confirmSalvage = null, gearFilter = 'all';
  let journalView = 'ach', bestRegion = 0; // WP17 Journal screen: 'ach' | 'bestiary' | 'codex'
  let pointAt = null; // upgrade id the results screen points to (first-run guarantee)

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
    for (const n of World.nodes) if (n.type !== 'camp' && save.unlocked.includes(n.sub) && subOpen(n.sub) && !cleared.has(n.id) && (n.type !== 'secret' || save.secrets.includes(n.id))) out.add(n.id);
    return out;
  }
  // Per-run gates: the fog of an area stays lifted for good (save.unlocked), but on each run only the start area is open
  // (a lit Wayshrine start opens its own area); the boss of an area opens the ones it leads to, for this run only.
  const openList = () => { const r = run(); return r ? (r.open || (r.open = save.unlocked.slice())) : []; };
  const subOpen = (id) => !run() || openList().includes(id);
  const gateBoss = (id) => { const s = World.SUB_BY[id], f = s && s.from; return f && World.THEMES[f] ? World.THEMES[f].boss[0] : 'the guardian'; };
  // WP14 scouting. A fogged spot (ordinary / elite) counts as scouted once the hero has been close, a scout looked, or it was fought.
  const isSeen = (n) => !World.FOGGED.includes(n.type) || save.seen.includes(n.id) || P.scoutLevel(save) >= 3 || (run() && run().cleared.includes(n.id));
  // Reveal spots within `rs` and hidden secrets within `rsec` of a point (defaults: the Scouting level's sight). Called as the hero walks.
  function revealAround(x, y, rs, rsec) {
    const lv = P.scoutLevel(save); rs = rs || World.sightRadius(lv); rsec = rsec || World.secretRadius(lv);
    let changed = false, found = null;
    for (const n of World.nodes) {
      if (n.type === 'camp' || !save.unlocked.includes(n.sub)) continue;
      const d = Math.hypot(n.x - x, n.y - y);
      if (World.FOGGED.includes(n.type)) { if (d <= rs && !save.seen.includes(n.id)) { save.seen.push(n.id); changed = true; } }
      else if (n.type === 'secret' && d <= rsec && !save.secrets.includes(n.id)) { save.secrets.push(n.id); changed = true; found = n; }
    }
    if (changed) { persist(); syncMap(); }
    if (found) toast('You spot something hidden nearby: a Sealed Cache!');
    return changed;
  }
  function syncMap() { WorldMap.update({ save, run: run(), frontier: frontier(), selected }); }

  function nodeTitle(n) {
    if (n.type === 'camp') return 'Camp';
    const t = World.THEMES[n.sub];
    if (n.type === 'boss') return t.boss[0];
    if (n.type === 'elite') return t.tough[0] + ' Warband';
    if (n.type === 'shrine') return 'Healing Spring';
    if (n.type === 'treasure') return n.guarded ? 'Guarded Cache' : 'Wayside Cache';
    if (n.type === 'shop') return 'Wayside Market';
    if (n.type === 'waypoint') return 'Wayshrine';
    if (n.type === 'secret') return 'Sealed Cache';
    if (n.type === 'event') return eventAt(n).title;
    if (n.guardFor) return t.armored[0] + ' Guard';
    return t[n.role === 'armored' || n.role === 'barrel' ? n.role : 'basic'][0] + ' Patrol';
  }

  // WP13: the event vignette that lives at an event node (fixed per node), the guard fight of a guarded cache, shop prices.
  const eventAt = (n) => Events.pick(World.SUB_BY[n.sub].region, World.hash(n.id));
  const guardOf = (n) => Object.assign({}, n, { type: 'battle', role: 'armored', guardFor: true });
  const regionOf = (n) => World.SUB_BY[n.sub].regionIndex;
  const price = (base, n) => Math.round(base * (1 + 0.2 * regionOf(n)));
  const goldNow = () => (run() ? run().gold || 0 : 0);
  const gopts = () => P.genOpts(save);                 // WP18 Heat / Descend options for Gen (enemy tweaks, level shift, reward multiplier)
  // Boss Rations of a boss node right now: first = never beaten on this account (a new frontier, pays more), else a toll boss. Grows with the level (power curve).
  const bossGain = (n) => P.bossSupplies(Gen.scaled(n, gopts()).level, !save.bossesBeaten.includes(n.sub), run() ? run().newDown : 0);
  const heal = (n) => P.healAmt(save, n);              // WP18 Heat "Bitter Herbs": healing is halved

  // ---------- HUD ----------
  function renderHud() {
    const r = run(), hud = $('#hud');
    hud.hidden = !r && campView !== 'map';
    hud.classList.toggle('run', !!r);
    if (r) {
      hud.innerHTML =
        '<div class="hud-row"><div class="hud-hp" title="Hit points"><span class="lbl">♥</span><div class="bar"><i style="width:' + (100 * r.hp / r.maxHp) + '%"></i></div><b>' + r.hp + '/' + r.maxHp + '</b></div>' +
        '<div class="hud-chip rations' + (r.supplies <= 2 ? ' low' : '') + '" title="Rations: battles left on this run. Normal and elite fights cost 1; every boss pays Rations that grow with its level (more for an area you have never conquered).">🍙 ' + r.supplies + '</div>' +
        '<div class="hud-chip gold" title="Gold: earned in fights, spent in Shops and events. Lost when the run ends.">🪙 ' + (r.gold || 0) + '</div>' +
        '<button type="button" class="hud-menu' + (menuOpen ? ' on' : '') + '" data-act="toggle-menu" aria-label="Expedition menu" aria-expanded="' + menuOpen + '">☰</button></div>' +
        '<div class="hud-row sub">' +
        '<div class="hud-chip mini" title="Souls carried on this run">✦ ' + r.souls + '</div>' +
        (r.keys > 0 ? '<div class="hud-chip mini keys" title="Keys: dropped by elites and bosses. Each opens one hidden Sealed Cache.">🗝 ' + r.keys + '</div>' : '') +
        (P.heatPoints(save) || P.descendOf(save) ? '<div class="hud-chip mini heat" title="' + esc(heatSummary()) + '">🔥 ' + P.heatPoints(save) + (P.descendOf(save) ? ' · ▼' + P.descendOf(save) : '') + '</div>' : '') +
        (r.relics && r.relics.length ? '<div class="hud-chip mini relics" title="Relics on this run">' + relicRow(r.relics) + '</div>' : '') + '</div>';
    } else if (campView === 'map') { // read-only World map from the Camp menu
      hud.innerHTML = '<button type="button" class="hud-back" data-cv="home" aria-label="Back to Camp">‹ Camp</button>' +
        '<div class="hud-chip big" title="Souls: buy Camp upgrades and recruits">✦ ' + P.balance(save, 'souls') + ' <small>Souls</small></div>' +
        '<div class="hud-chip cur crystals" title="Crystals: from first boss kills and bounties. Spent on Summon pulls (Rare, Epic and Legendary units).">💎 ' + P.balance(save, 'crystals') + '</div>' +
        '<div class="hud-chip cur dust" title="Dust: from salvaging gear. Spent in the Forge on gear.">⚒ ' + P.balance(save, 'dust') + '</div>';
    }
  }

  // ---------- Bottom sheet ----------
  function renderSheet() {
    const sheet = $('#sheet');
    const r = run();
    // The sheet only describes a spot picked on the read-only World map; in a run the map shows the compact card instead, and Camp has its own screens.
    const node = selected ? World.byId[selected] : null;
    sheet.hidden = !!r || campView !== 'map' || !node || node.type === 'camp';
    if (sheet.hidden) { sheet.innerHTML = ''; return; }
    sheet.classList.toggle('collapsed', !sheetOpen);
    sheet.innerHTML = '<button class="grab" id="sheet-toggle" aria-label="' + (sheetOpen ? 'Collapse' : 'Expand') + ' panel"><span></span></button>' + nodeSheet(node);
  }

  // Danger rating (design 8.1) as skulls, the same rating the map draws above each monster.
  const skulls = (level) => { const d = World.danger(level); return '<span class="skulls d' + d + '" title="Danger ' + d + ' of 5" aria-label="Danger ' + d + ' of 5">' + '☠︎'.repeat(d) + '</span>'; };

  const rarClass = (it) => 'rar-' + it.rarity;
  const itemIcon = (it) => '<span class="ic">' + esc(Items.icon(it)) + '</span>';
  // One line of the "possible drops" list on a spot's sheet.
  function dropRow(e, n) {
    const it = Items.BY_ID[e.id], owned = save.items.includes(it.id);
    const firstBoss = e.kind === 'unique' && n.type === 'boss' && !save.bossesBeaten.includes(n.sub);
    const now = Items.chanceNow(save, n, e), pity = now > e.chance + 0.001 && !firstBoss;
    const chance = firstBoss ? 'first win' : Math.round(now * 100) + '%' + (pity ? '↑' : '');
    const fx = Items.fxOf(it);
    return '<div class="drop ' + rarClass(it) + (e.kind === 'unique' ? ' unique' : '') + (owned ? ' owned' : '') + '">' + itemIcon(it) +
      '<div class="grow"><b>' + esc(it.name) + '</b><span>' + esc(it.slot === 'ring' ? 'Ring' : Items.SLOT_NAMES[it.slot]) + ' · ' + esc(Items.describe(it, n.level)) + (e.kind === 'unique' ? ' · only here' : '') + '</span>' +
      (fx ? '<span class="fx">' + esc(fx.text) + '</span>' : '') + '</div>' +
      '<span class="chance">' + (owned ? '✓' : chance) + '</span></div>';
  }
  // Boss tokens: progress bar plus a button for each Legendary of the boss that is not owned yet.
  function tokenBlock(n) {
    const have = Items.tokensOf(save, n.id), need = Items.TOKENS_NEEDED, legs = Items.LEGENDS_OF[n.id] || [];
    if (!legs.length) return '';
    const can = have >= need;
    return '<div class="tokens"><h4>Boss tokens <small>every kill gives one; ' + need + ' buy a Legendary</small></h4>' +
      '<div class="token-bar" aria-label="' + have + ' of ' + need + ' tokens"><i style="width:' + Math.min(100, 100 * have / need) + '%"></i><b>' + Math.min(have, need) + '/' + need + (have > need ? ' (+' + (have - need) + ')' : '') + '</b></div>' +
      '<div class="row">' + legs.map((it) => save.items.includes(it.id) ? '<span class="muted small grow">' + esc(it.name) + ' ✓</span>' :
        '<button class="rar-legendary" data-redeem="' + n.id + '|' + it.id + '"' + (can ? '' : ' disabled') + '>' + esc(Items.icon(it)) + ' ' + esc(it.name) + '</button>').join('') + '</div></div>';
  }
  function supplyNote(n) {
    if (n.type !== 'boss') return '<span class="cost">🍙 Costs 1 Ration</span>';
    const g = bossGain(n), first = !save.bossesBeaten.includes(n.sub);
    return '<span class="cost gain">🍙 Boss: ' + (g > 0 ? '+' + g + ' Rations' : 'free passage (Ration refunded)') + (first ? ' · new area' : '') + '</span>';
  }

  function nodeSheet(n) {
    const r = run(), sub = World.SUB_BY[n.sub];
    const guard = n.type === 'treasure' && n.guarded && (!r || !r.cleared.includes(n.id)) ? guardOf(n) : null;
    const isFight = ['battle', 'elite', 'boss'].includes(n.type) || !!guard;
    let body = '<div class="sheet-head"><div><h2>' + esc(nodeTitle(n)) + '</h2><p class="muted">' + esc(sub.name) + ' · ' + esc(sub.region) + '</p></div>' +
      (isFight || n.type === 'treasure' && n.guarded ? '<div class="lv-box">' + skulls(n.level) + '<span class="lv" style="background:' + lvColor(n.level) + '">Lv' + n.level + '</span></div>' : '') + '</div>';
    if (isFight) {
      const preview = Gen.generateBattle(guard || n, r ? r.seed : 'preview', gopts());
      const unseen = !guard && n.type !== 'boss' && !isSeen(n);
      const icons = unseen ? '<span class="enemy-chip unknown" title="Not scouted yet">?</span>'.repeat(3) : preview.enemies.map((e) => enemyChip(e.type)).join('');
      const souls = Math.round(Gen.soulsFor(n, 1, gopts()) * P.soulRate(save));
      body += '<p class="enemies">' + icons + '</p>';
      if (unseen) body += '<p class="muted">🔭 Not scouted yet: you see the danger, not what lurks here. Walk closer' + (r ? ', send a scout for 🪙 ' + price(World.SCOUT_GOLD, n) : '') + ', or raise Scouting at Camp.</p>';
      else if (preview.intro) body += '<p class="gimmick-note"><b>' + esc(preview.intro.name) + (preview.intro.rule && preview.intro.rule !== 'Elite' ? ' · ' + esc((preview.intro.badge ? preview.intro.badge + ' ' : '') + preview.intro.rule) : '') + '.</b> ' + esc(preview.intro.text) + '</p>';
      if (guard) body += '<p class="muted">A guard stands over the chest. Beat it to open the cache: ✦ ' + Gen.CACHE_SOULS + ', 🪙 ' + Gen.GUARD_GOLD + ' and a reward of your choice, plus the usual fight Souls.</p>';
      else body += '<p class="muted">' + (n.type === 'boss'
        ? (save.bossesBeaten.includes(n.sub) ? 'Already defeated: a toll boss on the way deeper (pays few Rations, no first-kill bonus).' : 'Defeat it to reveal ' + sub.unlocks.map((u) => World.SUB_BY[u].name).join(' and ') + (sub.unlocks.length ? '.' : '. This is a final boss.'))
        : n.type === 'elite' ? 'A tougher fight that pays double Souls.' : 'A normal fight.') + ' Reward: ✦ ' + souls + ', up to ✦ ' + Math.round(Gen.soulsFor(n, 3, gopts()) * P.soulRate(save)) + ' with ★★★ (no damage, plus a bonus item roll).</p>';
      { const rw = Gen.rewardFor(guard || n, gopts()); // what the post-battle choice offers here (Gen.rewardFor): deeper fights pay more
        body += '<p class="muted small">After the fight: upgrades of +' + rw.atk + ' ATK / +' + rw.block + ' block, heal ' + rw.heal + ' HP' + (rw.hp ? ', Fortify +' + rw.hp + ' max HP' : '') + (rw.team ? ', Warcry (all attackers +' + rw.team + ')' : '') + (n.type !== 'battle' ? ', a relic' : '') + '. Gear drops at item level ' + (Gen.scaled(n, gopts()).level + P.itemLvBonus(save)) + '.</p>'; }
      body += '<p>' + supplyNote(guard || n) + '</p>';
      if (!guard && !unseen) body += '<div class="drops"><h4>Possible drops <small>item level ' + n.level + (n.type === 'elite' ? ' · an elite always drops something' : '') + '</small></h4>' + Items.tableFor(n).map((e) => dropRow(e, n)).join('') + '</div>';
      if (n.type === 'boss') body += tokenBlock(n);
      const miss = guard ? 0 : Items.missesOf(save, n.id);
      if (miss > 0) body += '<p class="muted small">Bad-luck protection: ' + miss + ' win' + (miss === 1 ? '' : 's') + ' without the unique item. Its chance rises each time.</p>';
    } else if (n.type === 'shrine') body += '<p class="muted">A quiet spring and a small altar. Choose one: heal 8 HP <b>or</b> upgrade a unit for this run. Once per run.</p><p><span class="cost free">Free: costs no Rations</span></p>';
    else if (n.type === 'treasure') body += '<p class="muted">Free loot: ✦ ' + Gen.CACHE_SOULS + ', 🪙 ' + Gen.CACHE_GOLD + ' and a reward of your choice.</p><p><span class="cost free">Free: costs no Rations</span></p>';
    else if (n.type === 'shop') body += '<p class="muted">A travelling stall. Spend 🪙 Gold on healing, unit upgrades and relics. Stock changes every run; leave when you are done.</p><p><span class="cost free">Free: costs no Rations</span></p>';
    else if (n.type === 'waypoint') {
      const lit = save.waypoints.includes(n.sub);
      body += '<p class="muted">' + (lit ? 'A lit Wayshrine. ' + (r ? 'Fast travel here for free any time.' : 'Expeditions can start from here; only this area is open at the start.') : 'A torii and a quiet lantern. Light it once and it stays lit: later runs can start here, and you can fast travel back to it.') + '</p><p><span class="cost free">Free: costs no Rations</span>' +
        (lit && !r && save.startAt === n.sub ? ' <span class="cost gain">Your next run starts here</span>' : '') + '</p>';
    } else if (n.type === 'secret') {
      const keys = r ? r.keys || 0 : 0;
      body += '<p class="muted">A lacquered chest hidden off the trail, sealed with a vermilion cord. It opens with a 🗝 Key (dropped by elites and bosses): ✦ ' + Gen.CACHE_SOULS + ', 🪙 ' + (Gen.CACHE_GOLD + 2 * regionOf(n)) + ', 4 HP, and ' + (save.secretsOpened.includes(n.id) ? '⚒ 2 Dust.' : '💎 1 Crystal the first time.') + '</p><p><span class="cost free">Free: costs no Rations</span> <span class="cost' + (keys ? ' gain' : '') + '">🗝 ' + (r ? keys + ' key' + (keys === 1 ? '' : 's') + ' carried' : 'needs a key') + '</span></p>';
    } else if (n.type === 'event') body += '<p class="muted">Something stirs here. A short choice with a risk and a reward.</p><p><span class="cost free">Free: costs no Rations</span></p>';

    if (!r && n.type === 'waypoint' && save.waypoints.includes(n.sub)) body += '<div class="row"><button data-act="close-node">Back</button><button class="primary grow" data-act="start-here">' + (save.startAt === n.sub ? '🚩 Start here ✓' : '🚩 Start runs here') + '</button></div>';
    else if (!r) body += '<p class="hint">Set out from Camp to ' + (n.type === 'waypoint' || n.type === 'secret' ? 'visit this' : 'fight here') + '.</p><button class="wide" data-act="close-node">Close</button>';
    else if (r.cleared.includes(n.id)) body += '<p class="hint">Already cleared on this run.</p><button class="wide" data-act="close-node">Close</button>';
    else body += '<div class="row"><button data-act="close-node">Cancel</button>' +
      (isFight && !isSeen(n) && n.type !== 'boss' ? '<button data-act="scout"' + (goldNow() < price(World.SCOUT_GOLD, n) ? ' disabled' : '') + ' title="Reveal this spot and its surroundings">🔭 Scout 🪙 ' + price(World.SCOUT_GOLD, n) + '</button>' : '') +
      '<button class="primary grow" data-act="engage"' + (n.type === 'secret' && !(r.keys > 0) ? ' disabled' : '') + '>' +
      (isFight ? (n.type === 'boss' ? '👑 Challenge' : '⚔ Fight') : n.type === 'waypoint' ? (save.waypoints.includes(n.sub) ? '🚩 Fast travel' : '🚩 Light the shrine') : n.type === 'secret' ? '🗝 Open' : n.type === 'shrine' ? '⛲ Rest' : n.type === 'shop' ? '🛒 Browse' : n.type === 'event' ? '❓ Investigate' : '🎁 Open') + '</button></div>';
    return body;
  }

  function bountyList(list, showPay) {
    return '<ul class="bounties">' + list.map((b) => '<li class="' + (b.done ? 'done' : '') + '"><span class="bi">' + (b.done ? '✓' : Bounties.icon(b)) + '</span><span class="bt">' + esc(Bounties.text(b)) + '</span>' +
      '<small>' + (b.done ? 'done' : b.progress + '/' + b.goal) + '</small><span class="pay">💎 ' + b.reward + '</span></li>').join('') + '</ul>';
  }
  // ---------- In-run UI: compact info card + HUD menu ----------
  // A small floating card for a tapped spot: name, danger, one-line gimmick, cost/gain, drops as icons, actions. Never shown for ground taps.
  function dropChip(e, n, i) {
    const it = Items.BY_ID[e.id], owned = save.items.includes(it.id), uniq = e.kind === 'unique' || e.kind === 'legend';
    const firstBoss = e.kind === 'unique' && n.type === 'boss' && !save.bossesBeaten.includes(n.sub);
    const now = Items.chanceNow(save, n, e), pity = now > e.chance + 0.001 && !firstBoss;
    const tag = owned ? '✓' : firstBoss ? '1st' : Math.round(now * 100) + '%' + (pity ? '↑' : '');
    return '<button type="button" class="dchip ' + rarClass(it) + (uniq ? ' unique' : '') + (owned ? ' owned' : '') + (dropSel === i ? ' sel' : '') + '" data-drop="' + i + '" aria-label="' + esc(it.name + ', ' + Items.RARITY[it.rarity].name + (uniq ? ', unique' : '') + (owned ? ', owned' : '')) + '">' +
      '<span class="ic">' + esc(Items.icon(it)) + '</span><small>' + tag + '</small></button>';
  }
  function dropDetail(e, n) {
    const it = Items.BY_ID[e.id], fx = Items.fxOf(it);
    return '<p class="drop-detail ' + rarClass(it) + '"><b>' + esc(it.name) + '</b> · ' + Items.RARITY[it.rarity].name + ' ' + esc(it.slot === 'ring' ? 'Ring' : Items.SLOT_NAMES[it.slot]) + ' · ' + esc(Items.describe(it, n.level)) + (e.kind === 'unique' ? ' · only here' : '') + (fx ? ' · ' + esc(fx.text) : '') + '</p>';
  }
  function cardHTML(n) {
    const r = run(), sub = World.SUB_BY[n.sub], done = r.cleared.includes(n.id), open = subOpen(n.sub);
    const guard = n.type === 'treasure' && n.guarded && !done ? guardOf(n) : null;
    const isFight = ['battle', 'elite', 'boss'].includes(n.type) || !!guard;
    const x = '<button type="button" class="card-x" data-act="close-node" aria-label="Close">✕</button>';
    let h = '<div class="card-head"><div class="grow"><h3>' + esc(nodeTitle(n)) + '</h3><small class="muted">' + esc(sub.name) + '</small></div>' +
      (isFight || n.type === 'treasure' && n.guarded ? '<div class="lv-box">' + skulls(n.level) + '<span class="lv" style="background:' + lvColor(n.level) + '">Lv' + n.level + '</span></div>' : '') + x + '</div>';
    if (!open) return h + '<p class="card-line closed">🔒 Closed on this run. Defeat <b>' + esc(gateBoss(n.sub)) + '</b> to open the way.</p>';
    if (done) return h + '<p class="card-line">Already cleared on this run.</p>';
    let chips = '', note = '', acts = '';
    const act = (cls, label, a, dis) => '<button type="button" class="' + cls + '" data-act="' + a + '"' + (dis ? ' disabled' : '') + '>' + label + '</button>';
    if (isFight) {
      const preview = Gen.generateBattle(guard || n, r.seed, gopts()), unseen = !guard && n.type !== 'boss' && !isSeen(n), g = guard || n;
      const bg = n.type === 'boss' ? bossGain(n) : 0;
      const souls = Math.round(Gen.soulsFor(g, 1, gopts()) * P.soulRate(save));
      chips = '<div class="card-enemies">' + (unseen ? '<span class="enemy-chip unknown" title="Not scouted yet">?</span>'.repeat(3) : preview.enemies.map((e) => enemyChip(e.type)).join('')) + '</div>' +
        '<span class="cost' + (n.type === 'boss' ? ' gain' : '') + '">' + (n.type === 'boss' ? (bg > 0 ? '+' + bg : '±0') : '−1') + ' 🍙</span><span class="cost">✦ ' + souls + '+</span>';
      if (unseen) note = '<p class="card-line">🔭 Not scouted: you see the danger, not what lurks here.</p>';
      else if (preview.intro) note = '<p class="card-line gimmick"><b>' + esc((preview.intro.badge ? preview.intro.badge + ' ' : '') + (preview.intro.rule && preview.intro.rule !== 'Elite' ? preview.intro.rule : preview.intro.name)) + '</b> ' + esc(preview.intro.text) + '</p>';
      else if (guard) note = '<p class="card-line">A guard stands over the chest: beat it to open the cache.</p>';
      if (!guard && !unseen) {
        const table = Items.tableFor(n);
        note += '<div class="dchips" aria-label="Possible drops">' + table.map((e, i) => dropChip(e, n, i)).join('') + '</div>' + (dropSel !== null && table[dropSel] ? dropDetail(table[dropSel], n) : '');
        if (n.type === 'boss' && (Items.LEGENDS_OF[n.id] || []).length) note += '<p class="card-line small">Boss tokens ' + Math.min(Items.tokensOf(save, n.id), Items.TOKENS_NEEDED) + '/' + Items.TOKENS_NEEDED + ' (Legendary at Camp)</p>';
      }
      if (n.type === 'boss' && !save.bossesBeaten.includes(n.sub)) note += '<p class="card-line small">Beating it opens ' + (sub.unlocks.length ? esc(sub.unlocks.map((u) => World.SUB_BY[u].name).join(' and ')) : 'nothing more: a final boss') + '.</p>';
      else if (n.type === 'boss' && sub.unlocks.length) note += '<p class="card-line small">Beating it opens ' + esc(sub.unlocks.map((u) => World.SUB_BY[u].name).join(' and ')) + ' for this run.</p>';
      acts = (!guard && !unseen ? '' : '') + (unseen && n.type !== 'boss' ? act('', '🔭 Scout 🪙 ' + price(World.SCOUT_GOLD, n), 'scout', goldNow() < price(World.SCOUT_GOLD, n)) : '') + act('primary grow', n.type === 'boss' ? '👑 Challenge' : '⚔ Fight', 'engage');
    } else if (n.type === 'shrine') { chips = '<span class="cost free">Free</span>'; note = '<p class="card-line">Heal 8 HP <b>or</b> upgrade a unit for this run. Once per run.</p>'; acts = act('primary grow', '⛲ Rest', 'engage'); }
    else if (n.type === 'treasure') { chips = '<span class="cost free">Free</span><span class="cost gain">+✦ ' + Gen.CACHE_SOULS + '</span><span class="cost gain">+🪙 ' + (Gen.CACHE_GOLD + 2 * regionOf(n)) + '</span>'; note = '<p class="card-line">A reward of your choice.</p>'; acts = act('primary grow', '🎁 Open', 'engage'); }
    else if (n.type === 'shop') { chips = '<span class="cost">🪙 ' + (r.gold || 0) + '</span><span class="cost free">Browse free</span>'; note = '<p class="card-line warn">⚠ You can buy only <b>one</b> item here. The market packs up after your purchase.</p>'; acts = act('primary grow', '🛒 Browse', 'engage'); }
    else if (n.type === 'event') { chips = '<span class="cost free">Free</span>'; note = '<p class="card-line">A short choice with a risk and a reward.</p>'; acts = act('primary grow', '❓ Investigate', 'engage'); }
    else if (n.type === 'waypoint') {
      const lit = save.waypoints.includes(n.sub);
      chips = '<span class="cost free">Free</span>'; note = '<p class="card-line">' + (lit ? 'A lit Wayshrine: fast travel here, or start runs here from Camp.' : 'Light it once and it stays lit: later runs can start here.') + '</p>';
      acts = act('primary grow', lit ? '🚩 Fast travel' : '🚩 Light the shrine', 'engage');
    } else if (n.type === 'secret') {
      chips = '<span class="cost free">Free</span><span class="cost' + (r.keys ? ' gain' : '') + '">🗝 ' + (r.keys || 0) + '</span>'; note = '<p class="card-line">A hidden chest. Needs a 🗝 Key: ✦ ' + Gen.CACHE_SOULS + ', 🪙 ' + (Gen.CACHE_GOLD + 2 * regionOf(n)) + ', 4 HP and a Crystal or Dust.</p>';
      acts = act('primary grow', '🗝 Open', 'engage', !(r.keys > 0));
    }
    return h + '<div class="card-row">' + chips + '</div>' + note + '<div class="row card-acts">' + acts + '</div>';
  }
  function renderCard() {
    const el = $('#card'), n = run() && selected ? World.byId[selected] : null;
    if (!n || n.type === 'camp') { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false; el.innerHTML = cardHTML(n);
  }
  // The expedition menu (HUD button): Rations and Gold, relics, bounties, scout, return to Camp.
  function renderMenu() {
    const el = $('#runmenu'), r = run();
    if (!r || !menuOpen) { el.hidden = true; el.innerHTML = ''; return; }
    const bl = r.bounties || [], open = [...frontier()].filter((id) => ['battle', 'elite', 'boss'].includes(World.byId[id].type)).length;
    const here = World.byId[r.pos] || World.CAMP, cost = price(World.SCOUT_GOLD, here);
    el.hidden = false;
    el.innerHTML = '<div class="menu-head"><h3>On expedition</h3><button type="button" class="card-x" data-act="toggle-menu" aria-label="Close menu">✕</button></div>' +
      '<p class="supply-line">🍙 <b>' + r.supplies + '</b> Rations left, ' + open + ' fights in open areas. Each normal or elite win costs 1; every boss pays Rations that grow with its level (an area you never conquered pays about 3x a toll boss), so push deep, then farm the highest area. At 0 you return to Camp safely.</p>' +
      '<p class="supply-line">🪙 <b>' + (r.gold || 0) + '</b> Gold · 🗝 <b>' + (r.keys || 0) + '</b> Keys · ✦ <b>' + r.souls + '</b> Souls</p>' +
      '<p class="supply-line small">Open areas: ' + esc(openList().map((id) => World.SUB_BY[id].name).join(', ')) + '. Others stay closed until their gate boss falls.</p>' +
      (r.relics && r.relics.length ? '<h4 class="bounty-h">Relics <small>run only</small></h4><ul class="relic-list">' + r.relics.map((id) => '<li>' + relicRow([id]) + '<span><b>' + esc(Relics.BY_ID[id].name) + '</b> ' + esc(Relics.BY_ID[id].text) + '</span></li>').join('') + '</ul>' : '') +
      (bl.length ? '<h4 class="bounty-h">Bounties <small>paid in 💎 at run end</small></h4>' + bountyList(bl) : '') +
      '<div class="row"><button type="button" data-act="scout-here"' + (goldNow() < cost ? ' disabled' : '') + ' title="Reveal the spots around the hero">🔭 Send a scout 🪙 ' + cost + '</button>' +
      '<button type="button" class="grow' + (confirmReturn ? ' danger' : '') + '" data-act="return">' + (confirmReturn ? 'Tap again to return' : '🏕 Return to Camp') + '</button></div>' +
      '<p class="muted small">HP never regenerates by itself. Returning keeps all Souls; falling keeps 75%.</p>';
  }

  // WP15: hero chips (brushed-seal monograms stand in for portraits) and the chosen hero's passive and ability.
  const sealHTML = (h, cls) => '<span class="hero-seal ' + (cls || '') + '" style="--hero-hue:' + h.hue + '" aria-hidden="true">' + h.glyph + '</span>';
  function heroPicker() {
    const cur = P.heroOf(save), ab = E.HERO_ABILITIES[cur.ability];
    return '<div class="hero-pick" aria-label="Hero"><div class="hero-chips">' + P.HEROES.map((h) => {
      const ok = P.heroUnlocked(save, h.id);
      return '<button class="hero-chip' + (cur.id === h.id ? ' on' : '') + (ok ? '' : ' locked') + '" data-hero="' + h.id + '" aria-pressed="' + (cur.id === h.id) + '" title="' + esc(ok ? h.name : h.lock) + '">' + sealHTML(h) + '<span>' + h.name + (ok ? '' : ' 🔒') + '</span></button>';
    }).join('') + '</div><p class="hero-text"><b>' + esc(cur.name) + '</b> · Passive: ' + esc(cur.passive) + '. Ability (once per battle): <b>' + ab.icon + ' ' + esc(ab.name) + '</b>, ' + esc(ab.text.charAt(0).toLowerCase() + ab.text.slice(1)) + '</p></div>';
  }

  // WP16: the painted Camp. Small inline SVG in the watercolour palette; structures appear as Camp tracks are upgraded.
  function campScene(sv) {
    const L = (id) => P.level(sv, id), g = [];
    const tent = (x, w, col, key) => '<g class="cs-' + key + '"><path d="M' + (x - w) + ' 80 L' + x + ' ' + (80 - w * 0.95) + ' L' + (x + w) + ' 80 Z" fill="' + col + '" stroke="#2b2a35" stroke-width="1.4" stroke-linejoin="round"/><path d="M' + x + ' ' + (80 - w * 0.95) + ' L' + (x - w * 0.22) + ' 80 L' + (x + w * 0.22) + ' 80 Z" fill="#3a2d22" opacity=".75"/><path d="M' + x + ' ' + (80 - w * 0.95) + ' v-6" stroke="#2b2a35" stroke-width="1.4"/></g>';
    g.push('<ellipse cx="180" cy="86" rx="190" ry="14" fill="#a6b27c" opacity=".55"/><ellipse cx="90" cy="84" rx="95" ry="7" fill="#c7b98a" opacity=".5"/><path d="M0 70 q40 -22 90 -6 t100 -4 t100 -2 t70 8 V100 H0Z" fill="#9fb48a" opacity=".42"/>');
    if (L('scouting')) g.push('<g class="cs-tower"><path d="M14 80 L18 44 M34 80 L30 44" stroke="#5b4630" stroke-width="2.4"/><path d="M17 62 L31 62 M16 52 L32 52 M17 62 L31 52 M31 62 L17 52" stroke="#5b4630" stroke-width="1.2"/><rect x="12" y="38" width="26" height="8" rx="1.5" fill="#8d6a46" stroke="#2b2a35" stroke-width="1.2"/><path d="M9 38 L25 28 L41 38 Z" fill="#c8352b" stroke="#2b2a35" stroke-width="1.2" stroke-linejoin="round"/></g>');
    if (L('revive')) g.push('<g class="cs-torii"><path d="M52 80 V50 M72 80 V50" stroke="#c8352b" stroke-width="3.4"/><path d="M45 50 Q62 44 79 50" stroke="#c8352b" stroke-width="4" fill="none"/><path d="M50 58 H74" stroke="#c8352b" stroke-width="2.6"/><circle class="cs-glow" cx="62" cy="68" r="4" fill="#f2c94c"/></g>');
    g.push(tent(104, 30, '#e9dcb8', 'tent'));
    if (L('vitality') >= 2) g.push(tent(286, 24, '#d9cba0', 'tent2'));
    if (L('vitality') >= 5) g.push(tent(318, 18, '#e4b9a8', 'tent3'));
    if (L('ward')) g.push('<g class="cs-ward"><path d="M72 46 Q104 56 136 46" stroke="#8a6a3a" stroke-width="1.6" fill="none"/>' + [82, 98, 114, 128].slice(0, 2 + L('ward')).map((x) => '<path d="M' + x + ' ' + (50 + (x - 104) * (x - 104) / 700) + ' l-2 7 l3 5" stroke="#f7f0e0" stroke-width="3" fill="none" stroke-linejoin="round"/>').join('') + '</g>');
    g.push('<g class="cs-fire"><path d="M139 82 L158 82 M142 84 L155 79 M155 84 L142 79" stroke="#4a3626" stroke-width="2.6" stroke-linecap="round"/><path class="cs-flame" d="M148 79 C141 72 147 68 146 61 C151 66 156 70 154 76 C153 78 151 79 148 79Z" fill="#e8772e" stroke="#c8352b" stroke-width="1"/><path class="cs-flame" d="M148 78 C145 74 148 72 148 69 C151 72 152 75 150 78Z" fill="#f2c94c"/></g>');
    if (L('fortune')) { const n = Math.min(5, 2 + L('fortune')); let ls = '<path d="M60 40 Q150 54 240 38" stroke="#6b5f52" stroke-width="1" fill="none"/>'; for (let i = 0; i < n; i++) { const x = 70 + i * (160 / Math.max(1, n - 1)), y = 40 + 10 * Math.sin(Math.PI * (x - 60) / 180) + 4; ls += '<g class="cs-lantern" style="animation-delay:' + (i * 0.4) + 's"><rect x="' + (x - 4) + '" y="' + y + '" width="8" height="11" rx="3" fill="#e8772e" stroke="#7a2a18" stroke-width="1"/><rect x="' + (x - 2.2) + '" y="' + (y + 2) + '" width="4.4" height="7" rx="2" fill="#f7d77a"/></g>'; } g.push('<g class="cs-lanterns">' + ls + '</g>'); }
    if (L('choice')) g.push('<g class="cs-sign"><path d="M178 82 V58" stroke="#5b4630" stroke-width="2.4"/><path d="M178 60 H194 L199 64 L194 68 H178Z" fill="#d8b77a" stroke="#2b2a35" stroke-width="1"/><path d="M178 70 H164 L159 74 L164 78 H178Z" fill="#d8b77a" stroke="#2b2a35" stroke-width="1"/></g>');
    if (L('drill') || L('bulwark')) g.push('<g class="cs-forge"><rect x="204" y="62" width="30" height="18" fill="#8a6a4a" stroke="#2b2a35" stroke-width="1.3"/><path d="M200 63 L219 50 L238 63Z" fill="#6b4a38" stroke="#2b2a35" stroke-width="1.3" stroke-linejoin="round"/><rect x="226" y="40" width="6" height="14" fill="#7a7a7e" stroke="#2b2a35" stroke-width="1"/><circle class="cs-smoke" cx="229" cy="36" r="4" fill="#b8b3a8" opacity=".6"/><rect x="209" y="70" width="9" height="10" fill="#e8772e" opacity=".85"/>' + (L('bulwark') ? '<path d="M240 80 v-10 a6 7 0 0 1 12 0 v10Z" fill="#8f98a8" stroke="#2b2a35" stroke-width="1.1"/>' : '') + '</g>');
    if (L('command') >= 3) g.push('<g class="cs-hall"><rect x="250" y="60" width="26" height="20" fill="#e6d3a6" stroke="#2b2a35" stroke-width="1.3"/><path d="M244 62 Q263 44 282 62Z" fill="#3e5483" stroke="#2b2a35" stroke-width="1.3" stroke-linejoin="round"/><path d="M263 40 v-8" stroke="#2b2a35"/><path d="M263 32 h10 l-3 4 3 4 h-10Z" fill="#c8352b" stroke="#2b2a35" stroke-width=".8"/></g>');
    else if (L('command')) g.push('<g class="cs-pole"><path d="M258 80 V40" stroke="#5b4630" stroke-width="2.4"/><path class="cs-flag" d="M259 41 h18 l-5 6 5 6 h-18Z" fill="#c8352b" stroke="#2b2a35" stroke-width="1"/></g>');
    if (L('provisions')) g.push('<g class="cs-crates"><rect x="330" y="68" width="16" height="12" fill="#b88a55" stroke="#2b2a35" stroke-width="1.2"/><path d="M330 74 H346 M338 68 V80" stroke="#6b4a2a" stroke-width="1"/>' + (L('provisions') >= 2 ? '<rect x="336" y="56" width="12" height="12" fill="#c79a62" stroke="#2b2a35" stroke-width="1.2"/>' : '') + (L('provisions') >= 3 ? '<ellipse cx="322" cy="76" rx="6" ry="5" fill="#d9c58a" stroke="#2b2a35" stroke-width="1.1"/>' : '') + '</g>');
    if (L('purse')) g.push('<g class="cs-purse"><path d="M300 80 q-6 -3 -4 -11 q4 -4 8 0 q2 8 -4 11Z" fill="#c9a23a" stroke="#2b2a35" stroke-width="1.1"/><circle cx="300" cy="73" r="2" fill="#f7e9a8"/></g>');
    if (L('board')) g.push('<g class="cs-board"><path d="M196 82 V76 M222 82 V76" stroke="#5b4630" stroke-width="2"/><rect x="192" y="68" width="34" height="8" rx="1" fill="#e6c98a" stroke="#2b2a35" stroke-width="1.1"/><path d="M200 68 V76 M209 68 V76 M217 68 V76 M192 72 H226" stroke="#6b4a2a" stroke-width=".7"/></g>');
    return '<svg class="camp-scene" viewBox="0 0 360 96" role="img" aria-label="Your camp. It grows as you buy Camp upgrades.">' + g.join('') + '</svg>';
  }

  // ---------- Heat and Descend (WP18) ----------
  const heatSummary = () => 'Heat ' + P.heatPoints(save) + ': ' + save.heat.map((id) => P.HEAT_BY[id].name).join(', ') + (P.descendOf(save) ? ' · Descend ' + P.descendOf(save) : '') + ' · rewards x' + P.rewardMult(save).toFixed(2);
  function heatTab() {
    if (!P.heatUnlocked(save)) {
      return '<div class="heat-lock"><svg viewBox="0 0 120 70" aria-hidden="true"><path d="M20 60 Q60 54 100 60" stroke="#6b5f52" stroke-width="2" fill="none"/><path d="M60 56 C46 44 58 36 54 22 C66 30 74 42 66 52 C64 55 62 56 60 56Z" fill="#c9bfae" stroke="#6b5f52" stroke-width="1.6"/></svg>' +
        '<h4>The braziers are cold</h4><p class="muted">Defeat a final boss, Morana at the Glacier Throne or Zmey Gorynych at the Magma Caldera, to light them. Then you may take on <b>Heat</b> modifiers for richer rewards, and <b>Descend</b> into a harder copy of the whole map.</p></div>';
    }
    const pts = P.heatPoints(save), d = P.descendOf(save), dmax = P.descendMax(save), busyRun = !!run();
    let html = '<div class="heat-head"><div class="heat-flame ' + (pts ? 'lit' : '') + '" aria-hidden="true"><svg viewBox="0 0 40 48"><path d="M20 46 C8 40 6 28 14 20 C14 26 18 28 20 26 C18 18 24 10 28 2 C34 14 38 24 34 34 C32 40 26 44 20 46Z" fill="' + (pts ? '#e8772e' : '#cfc6b4') + '" stroke="#2b2a35" stroke-width="1.6" stroke-linejoin="round"/><path d="M20 44 C15 40 16 34 20 30 C24 34 25 40 20 44Z" fill="' + (pts ? '#f2c94c' : '#e6dfd0') + '"/></svg></div>' +
      '<div class="grow"><b>Heat ' + pts + '</b> <small class="muted">/ ' + P.HEAT_MODS.reduce((n, m) => n + m.pts, 0) + '</small><div class="muted small">Rewards ×' + P.rewardMult(save).toFixed(2) + ' (Souls and Gold) · drops +' + P.itemLvBonus(save) + ' item levels</div></div></div>';
    if (busyRun) html += '<p class="muted small">Heat can only be changed at Camp, between expeditions.</p>';
    html += '<h4 class="track-h">Heat modifiers</h4>';
    for (const m of P.HEAT_MODS) {
      const on = P.heatOn(save, m.id);
      html += '<div class="item heat-mod' + (on ? ' on' : '') + '"><span class="heat-pts" aria-hidden="true">' + m.pts + '</span><div class="grow"><b>' + esc(m.name) + '</b><span class="muted">' + esc(m.text) + '</span></div>' +
        '<button class="heat-switch" role="switch" aria-checked="' + on + '" aria-label="' + esc(m.name) + '" data-heat="' + m.id + '"' + (busyRun ? ' disabled' : '') + '><i></i></button></div>';
    }
    if (P.heatOn(save, 'cp') && P.squadProblem(save)) html += '<p class="heat-warn">⚠ ' + esc(P.squadProblem(save)) + ' Trim the squad in the Team screen.</p>';
    html += '<h4 class="track-h">Descend</h4><div class="item descend"><span class="ic">▼</span><div class="grow"><b>Descend ' + d + (dmax < P.MAX_DESCEND ? '' : '') + ' <small>/ ' + P.MAX_DESCEND + '</small></b><span class="muted">' +
      (d ? 'Every spot is ' + (Gen.DESCEND_LV * d) + ' levels harder; rewards ×' + (1 + 0.4 * d).toFixed(1) + ', drops +' + (2 * d) + ' item levels.' : 'The normal map. Each step makes every spot ' + Gen.DESCEND_LV + ' levels harder for ×1.4 more rewards and +2 item levels.') +
      (dmax < P.MAX_DESCEND ? ' Beat a final boss on Descend ' + dmax + ' to open the next step.' : '') + '</span></div>' +
      '<div class="stepper"><button data-descend="-1" aria-label="Descend less"' + (d <= 0 || busyRun ? ' disabled' : '') + '>−</button><b>' + d + '</b><button data-descend="1" aria-label="Descend more"' + (d >= dmax || busyRun ? ' disabled' : '') + '>+</button></div></div>';
    return html;
  }

  // ---------- Camp menu: a dedicated full-screen home plus one screen per topic ----------
  const CAMP_SCREENS = {
    upgrades: { title: 'Upgrades', icon: '⛺' }, team: { title: 'Team', icon: '🎖️' }, gear: { title: 'Gear', icon: '⚔️' }, summon: { title: 'Summon', icon: '✨' },
    heat: { title: 'Heat', icon: '🔥' }, journal: { title: 'Journal', icon: '📖' }, settings: { title: 'Settings', icon: '⚙️' },
  };
  const upgradesAffordable = () => Object.keys(P.UPGRADE_BY).filter((id) => { const c = P.upgradeCost(save, id); return c !== null && save.souls >= c; }).length;
  const curBar = () => '<div class="cur-bar" aria-label="Currencies">' + Object.keys(P.CURRENCIES).map((c) => '<span class="cur-' + c + '"><i>' + P.CURRENCIES[c].icon + '</i><b>' + P.balance(save, c) + '</b><small>' + P.CURRENCIES[c].name + '</small></span>').join('') + '</div>';
  const miniCur = () => '<div class="mini-cur" aria-label="Currencies">' + Object.keys(P.CURRENCIES).map((c) => '<span class="cur-' + c + '" title="' + P.CURRENCIES[c].name + '">' + P.CURRENCIES[c].icon + ' <b>' + P.balance(save, c) + '</b></span>').join('') + '</div>';

  function campHome() {
    const cur = P.heroOf(save), problem = P.squadProblem(save), cp = P.squadCp(save), cap = P.commandCap(save), ups = upgradesAffordable(), cr = P.balance(save, 'crystals');
    const tiles = [
      ['upgrades', '⛺', 'Upgrades', ups ? ups + ' affordable' : 'Camp tracks', ups ? ups : 0],
      ['team', '🎖️', 'Team', 'CP ' + cp + '/' + cap + ' · ' + save.squad.length + ' units', problem ? '!' : 0],
      ['gear', '⚔️', 'Gear', Items.equippedIds(save).length + '/' + Items.SLOTS + ' worn · Forge', 0],
      ['summon', '✨', 'Summon', '💎 ' + cr + ' · Recruit', cr >= P.PULL_COST ? '•' : 0],
    ];
    if (P.heatUnlocked(save)) tiles.push(['heat', '🔥', 'Heat', 'Heat ' + P.heatPoints(save) + (P.descendOf(save) ? ' · ▼' + P.descendOf(save) : ''), 0]);
    tiles.push(['journal', '📖', 'Journal', Journal.doneCount(save) + '/' + Journal.LIST.length + ' feats', 0], ['map', '🗺️', 'World map', 'Look around', 0], ['settings', '⚙️', 'Settings', 'Reset · test gold', 0]);
    const squadArt = save.squad.map((id) => '<span class="mini ' + rarClassOf(id) + '" title="' + esc(unitTitle(id)) + '">' + unitView(id).img + '</span>').join('');
    const body = '<div class="camp-banner"><div class="sun" aria-hidden="true"></div>' + campScene(save) + '<div class="banner-title"><h1>Camp</h1><small>Runs ' + save.runs + ' · Best Lv' + save.bestLevel + '</small></div></div>' +
      '<div class="camp-pad">' + curBar() +
      '<button type="button" class="party' + (problem ? ' warn' : '') + '" data-cv="team" aria-label="Change hero and squad">' +
        '<span class="p-hero">' + sealHTML(cur) + '<span><b>' + esc(cur.name) + '</b><small>' + esc(cur.passive) + '</small></span></span>' +
        '<span class="p-squad">' + (squadArt || '<em>Empty squad</em>') + '</span>' +
        '<span class="p-cp">🎖️ ' + cp + '/' + cap + '<small>' + (problem ? '⚠ ' + esc(problem) : 'Squad ready · tap to change') + '</small></span></button>' +
      '<div class="camp-grid">' + tiles.map((t) => '<button type="button" class="ctile" data-cv="' + t[0] + '"><span class="seal-ic" aria-hidden="true">' + t[1] + '</span><span class="ct"><b>' + t[2] + '</b><small>' + t[3] + '</small></span>' + (t[4] ? '<i class="badge">' + t[4] + '</i>' : '') + '</button>').join('') + '</div></div>';
    let foot = '<div class="camp-foot">';
    foot += '<button type="button" class="primary setout" data-act="start"><span class="so-main"><i aria-hidden="true">出陣</i>Set out</span><small>🍙 ' + P.startSupplies(save) + ' Rations · ♥ ' + P.maxHp(save) + ' HP</small></button></div>';
    return { body, foot };
  }

  function upgradesBody() {
    const GROUPS = [['Body', ['vitality', 'ward', 'revive', 'bulwark']], ['Arms', ['command', 'drill']], ['Fortune', ['fortune', 'purse', 'provisions', 'choice']], ['Exploring', ['scouting', 'board']]];
    let html = '<p class="lead">Spend ✦ Souls on permanent Camp upgrades. Your camp grows as you build.</p><div class="list">';
    for (const [gname, ids] of GROUPS) {
      html += '<h4 class="track-h">' + gname + '</h4>';
      for (const id of ids) {
        const u = P.UPGRADE_BY[id], lv = P.level(save, u.id), cost = P.upgradeCost(save, u.id);
        html += '<div class="item track' + (lv ? ' built' : '') + '"><span class="ic">' + u.icon + '</span><div class="grow"><b>' + u.name + ' <small>Lv ' + lv + '/' + u.costs.length + '</small></b><span class="muted">' + u.desc + '</span>' +
          '<span class="pips" aria-hidden="true">' + u.costs.map((_, i) => '<i class="' + (i < lv ? 'on' : '') + '"></i>').join('') + '</span></div>' +
          (cost === null ? '<span class="maxed">Max</span>' : '<button data-buy="' + u.id + '"' + (pointAt === u.id ? ' class="point"' : '') + (save.souls < cost ? ' disabled' : '') + '>✦ ' + cost + '</button>') + '</div>';
      }
    }
    return html + '</div><p class="muted small">Max HP ' + P.maxHp(save) + ' · Command Points ' + P.commandCap(save) + ' · Start Rations ' + P.startSupplies(save) + '</p>';
  }

  // Team: hero, squad slots (tap or drag to swap), Command Points, traits and the owned roster as a grid.
  function placeInSquad(id, i) {
    if (save.squad.includes(id) || !save.owned.includes(id)) return;
    const next = save.squad.slice();
    if (i >= 0 && i < next.length) next[i] = id; else next.push(id);
    if (P.squadCp(save, next) > P.commandCap(save)) { toast('Not enough Command Points for that swap (' + P.squadCp(save, next) + '/' + P.commandCap(save) + ').'); return; }
    save.squad = next; teamSel = id; persist(); renderAll();
  }
  function tapSlot(i) {
    const cur = save.squad[i];
    if (teamSel && !save.squad.includes(teamSel)) { placeInSquad(teamSel, cur === undefined ? -1 : i); return; }
    teamSel = cur === undefined || teamSel === cur ? null : cur; renderAll();
  }
  function dropOnSlot(id, i) {
    const from = save.squad.indexOf(id);
    if (from >= 0) { if (from !== i && i < save.squad.length) { const t = save.squad[i]; save.squad[i] = id; save.squad[from] = t; persist(); renderAll(); } return; }
    placeInSquad(id, i < save.squad.length ? i : -1);
  }
  function teamBody() {
    const army = P.buildArmy(save, {}), problem = P.squadProblem(save), cp = P.squadCp(save), cap = P.commandCap(save);
    const cardOf = (id) => army.find((c) => c.id === id) || P.buildArmy(Object.assign({}, save, { squad: [id] }), {})[0];
    if (teamSel && !save.owned.includes(teamSel)) teamSel = null;
    let h = '<h4 class="track-h">Hero</h4>' + heroPicker() + '<div class="squad-sticky"><h4 class="track-h">Squad <small>tap or drag a unit onto a slot to swap</small></h4>';
    h += '<div class="squad-head"><div class="cp-bar' + (cp > cap ? ' over' : '') + '" role="meter" aria-valuenow="' + cp + '" aria-valuemax="' + cap + '"><i style="width:' + Math.min(100, 100 * cp / cap) + '%"></i><span>🎖️ Command Points <b>' + cp + ' / ' + cap + '</b></span></div>' +
      '<p class="squad-rule ' + (problem ? 'bad' : 'ok') + '">' + (problem ? '⚠ ' + esc(problem) : '✔ Squad ready: an attacker and a supporter, ' + (cap - cp) + ' CP spare.') + '</p></div>';
    const nslots = Math.max(5, save.squad.length + 1);
    h += '<div class="slots" aria-label="Squad">';
    for (let i = 0; i < nslots; i++) {
      const id = save.squad[i];
      h += id ? '<button type="button" class="uslot ' + rarClassOf(id) + (teamSel === id ? ' sel' : '') + '" data-slot="' + i + '" data-drag="' + id + '" draggable="true" aria-label="' + esc(unitTitle(id)) + ', in squad"><span class="art">' + unitView(id).img + '</span><small>🎖️' + P.unitCp(id) + ' · ' + esc(unitView(id).name) + '</small></button>'
        : '<button type="button" class="uslot empty" data-slot="' + i + '" aria-label="Empty slot"><span class="plus">+</span><small>empty</small></button>';
    }
    h += '</div></div>' + traitPanel() + '<h4 class="track-h">Roster <small>' + save.owned.length + ' units · more from Summon and Recruit</small></h4><div class="roster">';
    for (const id of save.owned) {
      const inSq = save.squad.includes(id), st = P.starsOf(save, id);
      h += '<button type="button" class="utile ' + rarClassOf(id) + (inSq ? ' insquad' : '') + (teamSel === id ? ' sel' : '') + '" data-tsel="' + id + '" data-drag="' + id + '" draggable="true" aria-label="' + esc(unitTitle(id) + (inSq ? ', in squad' : '')) + '">' +
        '<span class="art">' + unitView(id).img + '</span><b>' + esc(unitView(id).name) + '</b><small>🎖️' + P.unitCp(id) + ' <span class="stars">' + '★'.repeat(st) + '</span></small>' + (inSq ? '<i class="tick">✓</i>' : '') + '</button>';
    }
    h += '</div>';
    let drawer = '';
    if (teamSel) {
      const id = teamSel, inSq = save.squad.includes(id), why = !inSq && P.canAdd(save, id);
      drawer = '<aside class="drawer udetail ' + rarClassOf(id) + '"><button type="button" class="d-x" data-tsel="" aria-label="Close">✕</button><div class="item unit ' + rarClassOf(id) + '">' + unitCell(id, unitMeta(id) + '<span class="muted">' + statLine(cardOf(id)) + '</span>' + unitPerk(id)) + '</div>' +
        '<div class="row"><button type="button" class="' + (inSq ? '' : 'primary') + ' grow" data-squad="' + id + '">' + (inSq ? 'Remove from squad' : why ? 'Add (needs a swap)' : 'Add to squad') + '</button></div>' +
        (why ? '<p class="muted small">' + esc(why) + ' Tap a squad slot above to swap this unit in.</p>' : !inSq ? '<p class="muted small">Tap a squad slot above to swap it in, or add it to a free slot.</p>' : '') + '</aside>';
    }
    return { body: h, foot: drawer };
  }

  // Gear: paper-doll of the 5 slots, set bonuses, filtered inventory grid; item detail with equip, Forge and salvage in a drawer.
  const itemFrom = (it) => { const src = it.source; return src.kind === 'unique' ? nodeTitle(World.byId[src.spot]) + ' · ' + World.SUB_BY[src.sub].name : src.kind === 'legend' ? 'Signature of ' + nodeTitle(World.byId[src.spot]) : src.kind === 'sub' ? World.SUB_BY[src.sub].name : src.region; };
  const DOLL = '<svg class="doll-fig" viewBox="0 0 100 190" aria-hidden="true"><path d="M50 12c-9 0-15 7-15 16s6 17 15 17 15-8 15-17-6-16-15-16z" fill="#e9dcb8" stroke="#2b2a35" stroke-width="2.4"/><path d="M26 58c8-8 16-11 24-11s16 3 24 11l8 50-12 3-4-30-4 94H44l-2-94-4 30-12-3z" fill="#d7cba3" stroke="#2b2a35" stroke-width="2.4" stroke-linejoin="round"/><path d="M42 118l-7 62h12l3-52 3 52h12l-7-62z" fill="#c9bd96" stroke="#2b2a35" stroke-width="2.2" stroke-linejoin="round"/><circle cx="50" cy="70" r="5" fill="#c8352b" opacity=".85"/></svg>';
  function gearBody() {
    const owned = save.items.map((id) => Items.BY_ID[id]).filter(Boolean), eq = Items.equippedIds(save);
    if (gearSel && !save.items.includes(gearSel)) gearSel = null;
    const slotBtn = (sl) => {
      const id = save.loadout[sl.id], it = id && Items.BY_ID[id];
      return '<button type="button" class="slot ' + (it ? rarClass(it) + ' filled' : 'empty') + (it && gearSel === it.id ? ' sel' : '') + '" ' + (it ? 'data-gsel="' + it.id + '" aria-label="' + esc(sl.name + ': ' + it.name) + '"' : 'data-gfilter="' + (sl.fits) + '" aria-label="' + sl.name + ' slot is empty, show matching items"') + '>' +
        '<span class="si">' + (it ? esc(Items.icon(it)) : sl.icon) + '</span><small>' + sl.name + '</small><em>' + (it ? esc(it.name) : 'empty') + '</em></button>';
    };
    const L = Items.SLOT_LIST;
    let h = '<div class="doll" aria-label="Equipped gear"><div class="doll-col">' + [L[0], L[1], L[2]].map(slotBtn).join('') + '</div>' + DOLL + '<div class="doll-col">' + [L[3], L[4]].map(slotBtn).join('') +
      '<div class="doll-note"><b>' + eq.length + '/' + Items.SLOTS + '</b><small>worn</small></div></div></div>';
    h += setPanel();
    const chips = [['all', 'All']].concat(Object.keys(Items.SLOT_NAMES).map((k) => [k, Items.SLOT_NAMES[k]]));
    h += '<h4 class="track-h">Inventory <small>' + owned.length + '/' + Items.ALL.length + ' collected · tap an item</small></h4><div class="chips">' + chips.map((c) => '<button class="' + (gearFilter === c[0] ? 'on' : '') + '" data-gfilter="' + c[0] + '">' + c[1] + '</button>').join('') + '</div>';
    const bossTok = World.nodes.filter((n) => n.type === 'boss' && Items.tokensOf(save, n.id) > 0);
    if (bossTok.length) h += '<details class="tok-list"><summary>Boss tokens (' + bossTok.length + ' boss' + (bossTok.length === 1 ? '' : 'es') + ')</summary>' + bossTok.map((n) => '<h5>' + esc(nodeTitle(n)) + '</h5>' + tokenBlock(n)).join('') + '</details>';
    const list = owned.filter((it) => gearFilter === 'all' || it.slot === gearFilter);
    list.sort((a, b) => (eq.includes(b.id) - eq.includes(a.id)) || (Items.RARITY[b.rarity].order - Items.RARITY[a.rarity].order) || (Items.dataOf(save, b.id).lv - Items.dataOf(save, a.id).lv) || a.name.localeCompare(b.name));
    if (!owned.length) h += '<p class="empty-gear">No gear yet. Win battles on the map: every monster has an item that only it drops.</p>';
    else if (!list.length) h += '<p class="empty-gear">Nothing in this slot yet.</p>';
    else h += '<div class="inv">' + list.map((it) => '<button type="button" class="gtile ' + rarClass(it) + (eq.includes(it.id) ? ' equipped' : '') + (gearSel === it.id ? ' sel' : '') + '" data-gsel="' + it.id + '" aria-label="' + esc(it.name + ', ' + Items.RARITY[it.rarity].name + (eq.includes(it.id) ? ', equipped' : '')) + '"><span class="gi">' + esc(Items.icon(it)) + '</span><b>' + esc(it.name) + '</b><small>iLv ' + Items.dataOf(save, it.id).lv + '</small>' + (eq.includes(it.id) ? '<i class="tick">E</i>' : '') + '</button>').join('') + '</div>';
    let drawer = '';
    const it = gearSel && Items.BY_ID[gearSel];
    if (it) {
      const on = eq.includes(it.id), d = Items.dataOf(save, it.id), dust = P.balance(save, 'dust'), lc = Items.levelCost(save, it.id), rc = Items.rerollCost(save, it.id), set = Items.setOf(it), fx = Items.fxOf(it), val = Items.salvageValue(save, it.id), sure = confirmSalvage === it.id;
      drawer = '<aside class="drawer gdetail ' + rarClass(it) + '"><button type="button" class="d-x" data-gsel="" aria-label="Close">✕</button>' +
        '<div class="gd-head">' + itemIcon(it) + '<div class="grow"><b>' + esc(it.name) + '</b><span class="meta"><i class="rb">' + Items.RARITY[it.rarity].name + '</i> ' + (it.slot === 'ring' ? 'Ring' : Items.SLOT_NAMES[it.slot]) + ' · iLv ' + d.lv + (set ? ' · ' + set.icon + ' ' + esc(set.name) : '') + '</span><span class="muted small">' + esc(itemFrom(it)) + '</span></div></div>' +
        '<div class="gd-stats"><span class="effect">' + esc(Items.effectText(it.kind, it.type, Items.mainAmount(it, d))) + '</span>' +
        d.subs.map((sb, i) => '<span class="subrow"><span class="sub">+ ' + esc(Items.substatText(sb, d)) + '</span><button data-reroll="' + it.id + '|' + i + '"' + (dust < rc ? ' disabled' : '') + ' aria-label="Reroll substat">🎲 ⚒' + rc + '</button></span>').join('') +
        (fx ? '<span class="fx">' + esc(fx.text) + '</span>' : '') + '</div>' +
        '<div class="gd-forge"><small>⚒ Forge · you have ' + dust + ' Dust</small>' + (lc === null ? '<span class="muted">Max item level</span>' : '<button data-lvup="' + it.id + '"' + (dust < lc ? ' disabled' : '') + '>⬆ Level ' + (d.lv + 1) + ' · ⚒' + lc + '</button>') + '</div>' +
        '<div class="row"><button class="grow ' + (on ? 'on' : 'primary') + '" data-equip="' + it.id + '">' + (on ? 'Unequip' : 'Equip') + '</button><button class="salvage' + (sure ? ' danger' : '') + '" data-salvage="' + it.id + '">' + (sure ? 'Sure? ' : 'Salvage ') + '⚒ +' + val + '</button></div></aside>';
    }
    return { body: h, foot: drawer };
  }

  function recruitBody() {
    let shown = 0, html = '<div class="list">';
    for (const u of P.ROSTER) {
      if (save.owned.includes(u.id) || u.start || !P.recruitable(u)) continue;
      shown++;
      const avail = P.recruitAvailable(save, u), need = Array.isArray(u.need) ? u.need : [u.need], can = save.souls >= u.cost;
      html += '<div class="item unit ' + rarClassOf(u.id) + (avail ? '' : ' locked') + '">' + unitCell(u.id, unitMeta(u.id) + '<span class="muted">' +
        (avail ? describeType(u.type, u) : 'Defeat ' + need.map((b) => World.THEMES[b].boss[0]).join(' or ')) + '</span>' + unitPerk(u.id)) +
        (avail ? '<button data-recruit="' + u.id + '"' + (can ? '' : ' disabled') + '>✦ ' + u.cost + '</button>' : '<span class="muted">🔒</span>') + '</div>';
    }
    html += '</div>';
    if (!shown) return '<p class="muted">Every Common has joined you. Rare, Epic and Legendary units come from Summon.</p>';
    return html + '<p class="muted small">Commons can be bought here with Souls once their boss has fallen. Rarer units come from Summon.</p>';
  }
  function summonBody() {
    const views = [['summon', '✨ Summon'], ['recruit', '🛡 Recruit']];
    return '<div class="chips views">' + views.map((c) => '<button class="' + (summonView === c[0] ? 'on' : '') + '" data-sview="' + c[0] + '">' + c[1] + '</button>').join('') + '</div>' + (summonView === 'recruit' ? recruitBody() : summonTab());
  }
  function settingsBody() {
    return '<p class="lead">Prototype tools and save data.</p><div class="list"><div class="item"><span class="ic">💰</span><div class="grow"><b>Test currency</b><span class="muted">Adds 100 ✦ Souls, 30 💎 Crystals and 10 ⚒ Dust.</span></div><button data-act="cheat">+100 ✦ 30 💎 10 ⚒</button></div>' +
      '<div class="item"><span class="ic">🗑</span><div class="grow"><b>Reset progress</b><span class="muted">Erases the whole save: upgrades, roster, gear and the map.</span></div><button data-act="reset" class="' + (confirmReset ? 'danger' : '') + '">' + (confirmReset ? 'Tap again to erase' : 'Reset') + '</button></div>' +
      '<div class="item"><span class="ic">📊</span><div class="grow"><b>Record</b><span class="muted">' + save.runs + ' expeditions · deepest fight Lv' + save.bestLevel + ' · ' + save.owned.length + ' units · ' + save.items.length + ' items</span></div></div></div>';
  }

  let campShown = null;
  function renderCamp() {
    const el = $('#camp'), show = !run() && campView !== 'map';
    el.hidden = !show;
    if (!show) { el.innerHTML = ''; campShown = null; return; }
    const prev = el.querySelector('.camp-body'), top = prev && campShown === campView ? prev.scrollTop : 0;
    let body = '', foot = '', head = '';
    if (campView === 'home') ({ body, foot } = campHome());
    else {
      const sc = CAMP_SCREENS[campView] || CAMP_SCREENS.upgrades;
      head = '<header class="camp-head"><button type="button" class="back" data-cv="home" aria-label="Back to Camp">‹</button><h2><span aria-hidden="true">' + sc.icon + '</span> ' + sc.title + '</h2>' + miniCur() + '</header>';
      if (campView === 'upgrades') body = upgradesBody();
      else if (campView === 'team') ({ body, foot } = teamBody());
      else if (campView === 'gear') ({ body, foot } = gearBody());
      else if (campView === 'summon') body = summonBody();
      else if (campView === 'heat') body = heatTab();
      else if (campView === 'journal') body = journalTab();
      else body = settingsBody();
    }
    el.innerHTML = '<div class="camp-screen v-' + campView + (campShown !== campView ? ' enter' : '') + '">' + head + '<div class="camp-body">' + body + '</div>' + foot + '</div>';
    el.querySelector('.camp-body').scrollTop = top; campShown = campView;
    const sel = el.querySelector('.camp-body .utile.sel, .camp-body .gtile.sel'); if (sel && el.querySelector('.drawer')) sel.scrollIntoView({ block: 'nearest' });
  }
  function goCamp(v) {
    campView = v; selected = null; confirmReset = false; confirmSalvage = null; teamSel = null; gearSel = null; summonMsg = '';
    if (v === 'journal' && !journalView) journalView = 'ach';
    renderAll();
    WorldMap.setOverview(v === 'map');
  }

  // ---------- Journal (WP17): Achievements, Bestiary, Codex ----------
  function journalTab() {
    const views = [['ach', 'Feats'], ['bestiary', 'Bestiary'], ['codex', 'Codex']];
    let h = '<div class="jtabs">' + views.map(([id, nm]) => '<button class="' + (journalView === id ? 'on' : '') + '" data-jv="' + id + '">' + nm + '</button>').join('') + '</div><div class="list journal">';
    if (journalView === 'ach') h += achList(); else if (journalView === 'bestiary') h += bestiaryList(); else h += codexList();
    return h + '</div>';
  }
  function achList() {
    let h = '<p class="muted small">Rewards are paid the moment a feat is reached. ' + Journal.doneCount(save) + ' of ' + Journal.LIST.length + ' done.</p>', group = '';
    for (const a of Journal.LIST) {
      if (a.group !== group) { group = a.group; h += '<h4 class="track-h">' + group + '</h4>'; }
      const ok = Journal.done(save, a.id), v = Journal.progress(save, a);
      h += '<div class="item ach' + (ok ? ' got' : '') + '"><span class="ic">' + (ok ? '✔' : '◌') + '</span><div class="grow"><b>' + esc(a.name) + '</b><span class="muted">' + esc(a.desc) + '</span>' +
        (ok ? '' : '<span class="ach-bar" role="meter" aria-valuenow="' + v + '" aria-valuemax="' + a.goal + '"><i style="width:' + (100 * v / a.goal) + '%"></i></span>') + '</div>' +
        '<span class="ach-rw">' + (ok ? 'Done' : v + '/' + a.goal) + '<small>' + Journal.rewardText(a.reward) + '</small></span></div>';
    }
    return h;
  }
  function bestiaryList() {
    const j = Journal.J(save), subs = World.SUBAREAS.filter((x) => x.region === World.REGIONS[bestRegion]);
    let h = '<div class="chips">' + World.REGIONS.map((rg, i) => {
      const n = World.SUBAREAS.filter((x) => x.region === rg).reduce((t, x) => t + Journal.ROLES.filter((r) => j.seen[Journal.keyOf(x.id, r)] > 0).length, 0);
      return '<button class="' + (bestRegion === i ? 'on' : '') + '" data-region="' + i + '">' + esc(rg) + '<small>' + n + '/20</small></button>';
    }).join('') + '</div>';
    for (const sub of subs) {
      h += '<h4 class="track-h">' + esc(sub.name) + '</h4>';
      for (const c of Journal.creatures().filter((x) => x.sub === sub.id)) {
        const seen = j.seen[c.key] > 0, url = window.Art.enemy(c.key), role = Journal.ROLE[c.role], boss = c.role === 'boss';
        const bd = boss && window.BossDefs ? window.BossDefs.BOSSES[sub.id] : null;
        const rule = boss ? (bd ? bd.intro : '') : role.text;
        h += '<div class="item beast' + (seen ? '' : ' unseen') + (boss ? ' boss' : '') + '"><span class="art">' + (url ? '<img src="' + url + '" alt="' + (seen ? esc(c.name) : 'Unknown creature') + '" draggable="false">' : esc(c.icon)) + '</span><div class="grow">' +
          (seen ? '<b>' + esc(c.name) + ' <small>' + role.name + '</small></b><span class="muted">' + esc(c.lore) + '</span><span class="rule">' + esc(rule) + '</span>' +
            '<span class="tally">Met ' + j.seen[c.key] + '× · defeated ' + (j.kills[c.key] || 0) + '</span>' : '<b>? ? ?</b><span class="muted">' + role.name + ' of ' + esc(sub.name) + '. Meet it in battle to learn more.</span>') + '</div></div>';
      }
    }
    return h;
  }
  function codexList() {
    const j = Journal.J(save);
    let h = '<h4 class="track-h">Bosses</h4>';
    for (const sub of World.SUBAREAS) {
      const bd = window.BossDefs.BOSSES[sub.id], n = j.bosses[sub.id] || 0, known = n > 0 || j.seen[Journal.keyOf(sub.id, 'boss')] > 0;
      const g = bd.gimmick ? E.ENEMY_GIMMICKS[bd.gimmick] : bd.kind ? E.ENEMY_KINDS[bd.kind] : null;
      h += '<div class="item codex' + (known ? '' : ' unseen') + '"><div class="grow">' + (known ? '<b>' + esc(bd.name) + ' <small>' + esc(sub.name) + '</small></b>' +
        (g ? '<span class="rule">' + g.badge + ' ' + esc(g.name) + '</span>' : '') + '<span class="muted">' + esc(bd.intro) + '</span><span class="tally">' + (n ? 'Defeated ' + n + '×' : 'Not yet defeated') + '</span>' :
        '<b>? ? ?</b><span class="muted">Guards ' + esc(sub.name) + ' (' + esc(sub.region) + ').</span>') + '</div></div>';
    }
    h += '<h4 class="track-h">Rules met in battle</h4>';
    const rules = Object.assign({}, E.ENEMY_KINDS, E.ENEMY_GIMMICKS);
    for (const k of Object.keys(rules)) {
      const r = rules[k], got = j.rules[k];
      h += '<div class="item codex rule-row' + (got ? '' : ' unseen') + '"><span class="ic">' + (got ? r.badge : '?') + '</span><div class="grow">' + (got ? '<b>' + esc(r.name) + '</b><span class="muted">It ' + esc(r.text.replace('{n}', 'N')) + '.</span>' : '<b>? ? ?</b><span class="muted">Not met yet.</span>') + '</div></div>';
    }
    h += '<h4 class="track-h">Relics <small>' + Object.keys(j.relics).length + '/' + Relics.LIST.length + '</small></h4>';
    for (const rel of Relics.LIST) {
      const got = j.relics[rel.id];
      h += '<div class="item codex rule-row' + (got ? '' : ' unseen') + '"><span class="ic">' + (got ? esc(rel.glyph) : '?') + '</span><div class="grow">' + (got ? '<b>' + esc(rel.name) + ' <small>' + esc(rel.myth) + '</small></b><span class="muted">' + esc(rel.text) + '</span>' : '<b>? ? ?</b><span class="muted">Found on an expedition, in a reward choice, Shrine or event.</span>') + '</div></div>';
    }
    return h;
  }
  // Pay out any feats reached; returns an HTML block for the results modal (and toasts when there is none to show).
  function checkFeats(inModal) {
    const got = Journal.check(save); if (!got.length) return '';
    persist();
    if (!inModal) toast('🏆 ' + got.map((g) => g.a.name + ' (' + Journal.rewardText(g.a.reward) + ')').join(' · '));
    return '<div class="ach-done">' + got.map((g) => '<p>🏆 Feat: <b>' + esc(g.a.name) + '</b> · ' + Journal.rewardText(g.a.reward) + '</p>').join('') + '</div>';
  }
  // Stat lines of an owned item: main effect, substats and (Legendary) the unique rule.
  function itemLines(it) {
    const d = Items.dataOf(save, it.id), fx = Items.fxOf(it);
    return '<span class="effect">' + esc(Items.effectText(it.kind, it.type, Items.mainAmount(it, d))) + '</span>' +
      d.subs.map((sb) => '<span class="sub">+ ' + esc(Items.substatText(sb, d)) + '</span>').join('') +
      (fx ? '<span class="fx">' + esc(fx.text) + '</span>' : '');
  }
  // Set bonuses of the equipped gear: one row per set with at least one piece worn.
  function setPanel() {
    const st = Items.setStatus(save);
    if (!st.length) return '<p class="muted small set-hint">Sets: wear 2 or 4 items from one region (every item belongs to its region\'s set) for bonuses.</p>';
    return '<div class="sets">' + st.map((x) => '<div class="set-card' + (x.tiers.some((t) => t.on) ? ' on' : '') + '"><b>' + x.set.icon + ' ' + esc(x.set.name) + ' <small>' + x.count + ' piece' + (x.count === 1 ? '' : 's') + '</small></b>' +
      x.tiers.map((t) => '<span class="' + (t.on ? 'on' : '') + '">' + (t.on ? '✔' : '○') + ' ' + t.n + ': ' + esc(t.text) + '</span>').join('') + '</div>').join('') + '</div>';
  }
  const rarClassOf = (id) => 'rar-' + P.ROSTER_BY[id].rarity;
  // Rarity, Command Point cost and trait of a roster unit, as a small line of chips.
  function unitMeta(id) {
    const u = P.ROSTER_BY[id], tr = P.TRAITS[u.trait];
    return '<span class="meta"><span class="chip rar">' + P.RARITY[u.rarity].name + '</span><span class="chip cp" title="Command Points">🎖️ ' + P.unitCp(id) + '</span><span class="chip trait" title="' + esc(tr.name + ' trait') + '">' + tr.icon + ' ' + tr.name + '</span>' + growthChips(id) + '</span>';
  }
  // Duplicate stars and mastery level of an owned unit.
  function growthChips(id) {
    if (!save.owned.includes(id)) return '';
    const st = P.starsOf(save, id), m = P.masteryOf(save, id);
    return '<span class="chip stars" title="Duplicates raise stars: ' + esc(P.STAR_TEXT.slice(2, st + 1).join(', ') || 'none yet') + '">' + '★'.repeat(st) + '<i>' + '★'.repeat(P.MAX_STARS - st) + '</i></span>' +
      '<span class="chip mastery" title="Mastery grows when the unit fights. ' + esc(m.next === null ? 'Max level.' : m.xp + '/' + m.next + ' xp to the next level.') + '">Mastery ' + m.lv + '</span>';
  }
  // Mastery progress bar for the Summon tab.
  const masteryBar = (id) => { const m = P.masteryOf(save, id), pct = m.next === null ? 100 : Math.round(100 * (m.xp - m.from) / (m.next - m.from)); return '<span class="mbar" title="' + m.xp + ' xp"><i style="width:' + pct + '%"></i></span>'; };

  // ---------- Summon (WP11) ----------
  let summonMsg = '';
  function summonTab() {
    const cr = P.balance(save, 'crystals'), pity = save.pity || 0, seals = save.seals || {};
    let h = '<div class="summon"><div class="odds">' + Object.keys(P.ODDS).map((k) => '<span class="rar-' + k + '"><i></i>' + P.RARITY[k].name + ' ' + P.ODDS[k] + '%</span>').join('') + '</div>' +
      '<div class="pity" role="meter" aria-valuenow="' + pity + '" aria-valuemax="' + P.PITY_AT + '"><i style="width:' + Math.min(100, 100 * pity / P.PITY_AT) + '%"></i><span>Pity <b>' + pity + ' / ' + P.PITY_AT + '</b> · an Epic is guaranteed at ' + P.PITY_AT + '</span></div>' +
      '<div class="pulls"><button class="primary" data-pull="1"' + (cr < P.PULL_COST ? ' disabled' : '') + '>Summon ×1<small>💎 ' + P.PULL_COST + '</small></button>' +
      '<button class="primary" data-pull="10"' + (cr < P.PULL10_COST ? ' disabled' : '') + '>Summon ×10<small>💎 ' + P.PULL10_COST + '</small></button></div>' +
      '<p class="muted small">Duplicates add a ★ (max ' + P.MAX_STARS + ': ' + esc(P.STAR_TEXT[2]) + ' at ★2, ' + esc(P.STAR_TEXT[3]) + ' at ★3, ' + esc(P.STAR_TEXT[5]) + ' at ★5), give a Seal, and turn into Dust at ★5. Commons are drawn from units whose boss has fallen.</p>' +
      (summonMsg ? '<p class="squad-rule ok">' + summonMsg + '</p>' : '') + '</div>';
    h += '<div class="office"><h4>Recruitment Office <small>trade Seals for any unit of that rarity</small></h4><div class="seals">' + Object.keys(P.OFFICE_COST).map((k) =>
      '<span class="rar-' + k + '"><b>' + (seals[k] || 0) + '</b> / ' + P.OFFICE_COST[k] + ' ' + P.RARITY[k].name + '</span>').join('') + '</div>';
    const ready = Object.keys(P.OFFICE_COST).filter((k) => (seals[k] || 0) >= P.OFFICE_COST[k]);
    if (!ready.length) h += '<p class="muted small">Every duplicate pull earns a Seal of its rarity. Collect enough and choose your unit here, so bad luck never locks out a plan.</p>';
    for (const u of P.ROSTER) {
      if (!ready.includes(u.rarity) || (save.owned.includes(u.id) && P.starsOf(save, u.id) >= P.MAX_STARS)) continue;
      h += '<div class="item unit ' + rarClassOf(u.id) + '">' + unitCell(u.id, unitMeta(u.id)) + '<button data-office="' + u.id + '">' + (save.owned.includes(u.id) ? '+1 ★' : 'Recruit') + '</button></div>';
    }
    h += '</div><div class="mastery-list"><h4>Mastery <small>units grow by fighting: +1 xp per win, +2 for a boss</small></h4>' + save.owned.map((id) => {
      const m = P.masteryOf(save, id);
      return '<div class="mrow ' + rarClassOf(id) + '"><span class="art">' + unitView(id).img + '</span><div class="grow"><b>' + esc(unitView(id).name) + '</b> <small>Mastery ' + m.lv + ' · ' + m.xp + (m.next === null ? '' : '/' + m.next) + ' xp</small>' + masteryBar(id) +
        '<span class="muted small">' + (m.lv < 5 ? 'Next: ' + esc(P.MASTERY_PERKS[m.lv]) : 'Veteran: +1 main stat') + '</span></div></div>';
    }).join('') + '</div>';
    return h;
  }
  // Brushed reveal of the pull results: the creature drawing is unveiled by a sweeping ink-brush mask in its rarity colour.
  function showSummon(results) {
    const one = results.length === 1;
    const tile = (r, i) => {
      const v = unitView(r.id), tag = r.isNew ? 'NEW' : r.starUp ? '★' + r.stars : r.dust ? '+⚒ ' + r.dust : 'Max';
      return '<div class="pull rar-' + r.rarity + (r.isNew ? ' fresh' : '') + (r.pityHit ? ' pity' : '') + '" style="--d:' + (i * 0.14) + 's"><span class="halo"></span><span class="brush">' + v.img + '</span>' +
        '<b>' + esc(v.name) + '</b><small>' + P.RARITY[r.rarity].name + '</small><em>' + tag + '</em></div>';
    };
    modal('<h3>' + (one ? 'Summoned' : 'Summoned ×' + results.length) + '</h3><div class="pull-grid' + (one ? ' one' : '') + '">' + results.map(tile).join('') + '</div>' +
      '<p class="muted small center">' + 'Pity ' + (save.pity || 0) + ' / ' + P.PITY_AT + '</p><div class="row"><button class="primary grow" data-act="close">Continue</button></div>');
    $('#modal').onclick = (ev) => { if (ev.target.closest('[data-act="close"]')) closeModal(); };
  }
  const unitPerk = (id) => (P.ROSTER_BY[id].perk ? '<span class="perk">' + esc(P.ROSTER_BY[id].perk) + '</span>' : '');
  // Trait synergy panel: count per trait, active bonuses and the next step to reach.
  function traitPanel() {
    const counts = P.traitCounts(save);
    const card = (t) => {
      const tr = P.TRAITS[t], n = counts[t] || 0;
      return '<div class="trait' + (n >= 2 ? ' on' : '') + '"><b>' + tr.icon + ' ' + tr.name + ' <em>' + n + '</em></b>' + P.TRAIT_STEPS.map((st) =>
        '<span class="' + (n >= st ? 'got' : '') + '"><i>' + st + '</i> ' + esc(tr.tiers[st].text) + '</span>').join('') + '</div>';
    };
    const all = Object.keys(P.TRAITS), used = all.filter((t) => counts[t]), spare = all.filter((t) => !counts[t]);
    return '<div class="traits"><h4>Trait bonuses <small>2 / 4 / 6 of a kind in the squad</small></h4>' + used.map(card).join('') +
      (spare.length ? '<details><summary>Other traits (' + spare.length + ')</summary><div class="traits-more">' + spare.map(card).join('') + '</div></details>' : '') + '</div>';
  }
  function statLine(card) {
    const t = E.CARD_TYPES[card.type];
    if (t.role === 'attacker') return '⚔' + card.atk + ' · ' + { straight: '↑ straight', pierce: '⇈ pierce', spread: '↖↑↗ spread' }[card.pattern || t.pattern] + ' · R' + card.range;
    if (t.role === 'support') return (t.effect === 'atk' ? '+' + card.amount + ' ATK' : t.effect === 'mult' ? '×' + card.amount + ' damage' : '+' + card.amount + ' range') + (t.target === 'up' ? ' to the card above' : ' to all neighbours');
    return '🛡 blocks ' + card.block + ' in its column';
  }
  const describeType = (type, u) => {
    const d = cardDefaults(type), st = (u && u.stats) || {};
    return statLine(Object.assign({ type }, d, st.atk !== undefined ? { atk: st.atk + P.level(save, 'drill') } : {}, st.range !== undefined ? { range: st.range } : {}, st.amount !== undefined ? { amount: st.amount } : {}, st.pattern ? { pattern: st.pattern } : {}, st.block !== undefined ? { block: st.block + P.level(save, 'bulwark') } : {}));
  };
  function cardDefaults(type) {
    const t = E.CARD_TYPES[type];
    if (t.role === 'attacker') return { atk: t.atk + P.level(save, 'drill'), range: t.range };
    if (t.role === 'support') return { amount: t.amount };
    return { block: 2 + P.level(save, 'bulwark') };
  }
  const lvColor = (L) => (L <= 3 ? '#3f9a46' : L <= 6 ? '#d9a21b' : L <= 9 ? '#e0731f' : '#c63b31');

  function renderAll() { renderHud(); renderCamp(); renderSheet(); renderCard(); renderMenu(); syncMap(); }

  // ---------- Actions ----------
  function startRun() {
    const problem = P.squadProblem(save);
    if (problem) { toast(problem); campView = 'team'; renderAll(); return; }
    const lit = save.waypoints.filter((id) => World.SUB_BY[id]);
    if (!lit.length) { save.startAt = 'camp'; beginRun(); return; }
    openStartChooser(lit);
  }
  // Set out with lit Wayshrines: a compact sheet lists Camp plus the shrines by region; picking a row starts the run there.
  function openStartChooser(lit) {
    const groups = {};
    lit.forEach((id) => { const reg = World.SUB_BY[id].region; (groups[reg] = groups[reg] || []).push(id); });
    const row = (id, label) => '<button type="button" class="sc-row' + (save.startAt === id ? ' on' : '') + '" data-pick-start="' + id + '"><span aria-hidden="true">' + (id === 'camp' ? '⛺' : '🚩') + '</span>' + esc(label) + '</button>';
    modal('<div class="start-chooser"><h3>Where to start?</h3><div class="sc-list">' + row('camp', 'Camp') +
      Object.keys(groups).map((reg) => '<div class="sc-region">' + esc(reg) + '</div>' + groups[reg].map((id) => row(id, World.SUB_BY[id].name)).join('')).join('') +
      '</div><button type="button" class="sc-cancel" data-act="close">Cancel</button></div>');
    $('#modal').onclick = (ev) => {
      const b = ev.target.closest('[data-pick-start]');
      if (b) { save.startAt = b.dataset.pickStart; closeModal(); beginRun(); return; }
      if (ev.target.closest('[data-act="close"]') || ev.target === $('#modal')) closeModal();
    };
  }
  function beginRun() {
    const sup = P.startSupplies(save);
    const startId = save.startAt !== 'camp' && save.waypoints.includes(save.startAt) ? save.startAt + '-wp' : 'camp'; // WP14: begin at a lit Wayshrine
    save.run = { seed: 'run' + Date.now(), hp: P.maxHp(save), maxHp: P.maxHp(save), supplies: sup, startSupplies: sup, pos: startId, cleared: ['camp'], path: [startId], keys: 0,
      open: [startId === 'camp' ? 'meadow' : save.startAt], bounties: Bounties.roll(World.rng('bounty:' + Date.now())), crystalsNow: 0, souls: 0, gold: P.startGold(save), rerolls: P.rewardRerolls(save), reviveUsed: 0, shops: {}, wins: 0, maxLevel: 0, mods: {}, relics: [], placement: {}, unlockedNow: [], found: [] };
    selected = null; confirmReturn = false; menuOpen = false; persist();
    WorldMap.placeToken(startId);
    if (startId === 'camp') { const sub = World.SUB_BY.meadow; WorldMap.focus(sub.entry[0], sub.entry[1]); } else WorldMap.focus(World.byId[startId].x, World.byId[startId].y);
    toast('Expedition started' + (P.heatPoints(save) || P.descendOf(save) ? ' (Heat ' + P.heatPoints(save) + (P.descendOf(save) ? ', Descend ' + P.descendOf(save) : '') + ')' : '') + (startId === 'camp' ? '' : ' at the ' + World.SUB_BY[World.byId[startId].sub].name + ' Wayshrine') + ' with ' + sup + ' Rations (only ' + World.SUB_BY[run().open[0]].name + ' is open) and ' + run().bounties.length + (run().bounties.length === 1 ? ' bounty' : ' bounties') + '.');
    renderAll();
  }

  async function engage(id) {
    const r = run(); let n = World.byId[id];
    if (!r || busy || r.cleared.includes(id) || !save.unlocked.includes(n.sub)) return;
    if (!subOpen(n.sub)) { toast('Closed on this run: defeat ' + gateBoss(n.sub) + ' first.'); return; }
    if (n.type === 'secret' && !(r.keys > 0)) { toast('The cache is sealed. Elites and bosses drop keys.'); return; }
    if (n.type === 'waypoint' && save.waypoints.includes(n.sub)) { // fast travel: free and instant
      selected = null; WorldMap.placeToken(id); WorldMap.focus(n.x, n.y); r.pos = id; persist(); toast('Fast travel to the ' + World.SUB_BY[n.sub].name + ' Wayshrine.'); renderAll(); return;
    }
    busy = true; selected = null; menuOpen = false; sheetOpen = true; renderAll();
    // Short hops are walked; far ones just move the hero there.
    const from = World.byId[r.pos] || World.CAMP;
    if (Math.hypot(from.x - n.x, from.y - n.y) < 1600) await WorldMap.walk([id]); else { WorldMap.placeToken(id); WorldMap.focus(n.x, n.y); }
    r.pos = id; r.path.push(id);
    if (World.FOGGED.includes(n.type) && !save.seen.includes(id)) save.seen.push(id);
    busy = false;
    if (n.type === 'waypoint') { // first visit: light it (stays lit for good) and see the surroundings
      save.waypoints.push(n.sub); revealAround(n.x, n.y, 620, 260); persist(); renderAll();
      modal('<h3>Wayshrine lit</h3><p>The lantern at the ' + esc(World.SUB_BY[n.sub].name) + ' Wayshrine glows. The hills around it are no longer a mystery.</p><p class="supply-line">🚩 Later runs can <b>start here</b> (pick it at Camp or on the shrine\'s sheet), and you can fast travel back to it for free during a run. This cost no Rations.</p><div class="row"><button class="primary grow" data-act="ok">Good</button></div>');
      $('#modal').onclick = (ev) => { if (ev.target.closest('[data-act="ok"]')) closeModal(); }; return;
    }
    if (n.type === 'secret') {
      r.keys -= 1; r.cleared.push(id); const first = !save.secretsOpened.includes(id), gold = Gen.CACHE_GOLD + 2 * regionOf(n);
      r.souls += Gen.CACHE_SOULS; r.gold = (r.gold || 0) + gold; r.hp = Math.min(r.maxHp, r.hp + heal(4));
      if (first) { save.secretsOpened.push(id); P.earn(save, 'crystals', 1); r.crystalsNow = (r.crystalsNow || 0) + 1; } else P.earn(save, 'dust', 2);
      persist(); renderAll();
      modal('<h3>Sealed Cache opened</h3><p>The cord parts. Inside: ✦ ' + Gen.CACHE_SOULS + ', 🪙 ' + gold + ', and a restorative draught (+4 HP). ' + (first ? '💎 1 Crystal, found for the first time!' : '⚒ 2 Dust.') + ' This cost no Rations.</p><div class="row"><button class="primary grow" data-act="ok">Good</button></div>');
      $('#modal').onclick = (ev) => { if (ev.target.closest('[data-act="ok"]')) closeModal(); }; return;
    }
    if (n.type === 'shrine') { renderAll(); openShrine(n); return; }
    if (n.type === 'shop') { renderAll(); openShop(n); return; }
    if (n.type === 'event') { renderAll(); openEvent(n); return; }
    if (n.type === 'treasure' && !n.guarded) {
      const gold = Gen.CACHE_GOLD + 2 * regionOf(n);
      r.cleared.push(id); r.souls += Gen.CACHE_SOULS; r.gold = (r.gold || 0) + gold; persist(); renderAll();
      offerReward('Wayside cache', 'You found ✦ ' + Gen.CACHE_SOULS + ', 🪙 ' + gold + ' and a bit of food. This cost no Rations.', n); return;
    }
    if (n.guarded) n = guardOf(n); // a guarded cache: beat its guard first (battleOver opens the chest)
    const stage = Object.assign({ heroHp: r.hp, heroMaxHp: r.maxHp, rules: P.rulesFor(save, r) }, P.heroStage(save), Gen.generateBattle(n, r.seed, gopts()));
    WorldMap.setActive(false);
    document.body.classList.add('in-battle');
    Battle.start({
      title: nodeTitle(n), subtitle: World.SUB_BY[n.sub].name + ' · Lv' + n.level, stage, biome: World.SUB_BY[n.sub].biome,
      army: P.buildArmy(save, r.mods), hero: P.heroOf(save), placement: r.placement, relics: r.relics || [],
      onEnd: (state, stars, report) => battleOver(n, state, stars, report),
    });
  }

  // The reward card shown when an item drops (a duplicate shows as Dust instead).
  function dropCard(res, note) {
    const it = res.item;
    if (!res.isNew) return '<div class="drop-card ' + rarClass(it) + '"><span class="ic big">' + esc(Items.icon(it)) + '</span><div class="grow"><small class="new">Duplicate · ' + Items.RARITY[it.rarity].name + '</small><b>' + esc(it.name) + '</b><span>Turned into ⚒ ' + res.dust + ' Dust' + (res.levelUp ? '; your copy rose to item level ' + res.lv : '') + '.</span></div></div>';
    return '<div class="drop-card ' + rarClass(it) + '"><span class="ic big">' + esc(Items.icon(it)) + '</span><div class="grow"><small class="new">New ' + Items.RARITY[it.rarity].name + ' · ' + (it.slot === 'ring' ? 'Ring' : Items.SLOT_NAMES[it.slot]) + ' · iLv ' + res.lv + '</small><b>' + esc(it.name) + '</b>' + itemLines(it) +
      (note ? '<em>' + esc(note) + '</em>' : '') + '</div></div>';
  }
  // Equip a freshly dropped item into a free slot and apply it to the run in progress.
  function autoEquip(res) {
    if (!res || !res.isNew) return false;
    const before = Items.bonuses(save);
    if (!Items.equip(save, res.id, true)) return false;
    const after = Items.bonuses(save), r = run();
    if (r) {
      r.maxHp += after.hp - before.hp; r.hp += after.hp - before.hp;
      r.supplies += after.supplies - before.supplies; r.startSupplies += after.supplies - before.supplies;
    }
    return true;
  }

  function battleOver(n, state, stars, report) {
    const r = run();
    r.placement = Battle.placement();
    Battle.hide(); document.body.classList.remove('in-battle'); WorldMap.setActive(true);
    r.hp = state.hp;
    { // WP17 journal: creatures met and defeated, then feats (no rule changes)
      const won = state.status === 'cleared', placed = new Set(Object.values(r.placement || {}).filter((id) => P.ROSTER_BY[id] && E.CARD_TYPES[P.ROSTER_BY[id].type].role === 'attacker')).size;
      Journal.record(save, state, won, n, report, placed); for (const id of r.relics || []) Journal.noteRelic(save, id);
    }
    if (state.reviveUsed) r.reviveUsed = (Number(r.reviveUsed) || 0) + state.reviveUsed; // revives spent (Phoenix Archer, Second Wind): once per run each
    if (state.status !== 'cleared') { Journal.check(save); persist(); endRun(true); return; }
    stars = stars || 1;
    const gained = Math.round(Gen.soulsFor(n, stars, gopts()) * P.soulRate(save));
    P.addXp(save, save.squad, n.type === 'boss' ? 2 : 1); // WP11 unit mastery
    const goldGain = Gen.goldFor(n, stars, gopts()); r.gold = (r.gold || 0) + goldGain;
    r.souls += gained; r.wins += 1; r.maxLevel = Math.max(r.maxLevel, n.level); r.cleared.push(n.id);
    // Items: rolled before the boss is marked as beaten, so its first kill always drops its unique item.
    let drop = Items.grantDrop(save, n, r.seed, { lvBonus: P.itemLvBonus(save) });
    if (!drop && save.runs === 0 && !r.found.length && r.wins === 2) drop = Items.guaranteedDrop(save, n); // design 24.3: an item in the first two battles
    const item = drop && drop.item ? drop : null, equipped = autoEquip(item);
    if (item && item.isNew) r.found.push(item.id);
    // A 3-star clear earns one extra loot roll (design 11); a duplicate turns into Dust.
    let bonusItem = null, bonusEquipped = false;
    if (stars === 3) {
      const b = Items.grantDrop(save, n, r.seed + ':star', { bonus: true, lvBonus: P.itemLvBonus(save) });
      if (b && b.item) { bonusItem = b; if (b.isNew) r.found.push(b.id); bonusEquipped = autoEquip(b); }
    }
    const dustLine = drop && drop.consolation ? '<p class="supply-line">Elite spoils: ⚒ ' + drop.dust + ' Dust (you own everything it drops).</p>' : '';
    // Rations: normal and elite wins cost 1, a boss adds some.
    const boss = n.type === 'boss', wasBeaten = save.bossesBeaten.includes(n.sub);
    const gain = boss ? bossGain(n) : -1;
    if (boss) { r.bossesDown = (r.bossesDown || 0) + 1; if (!wasBeaten) r.newDown = (r.newDown || 0) + 1; } // newDown: new areas conquered this run (each pays x0.8 less Rations)
    r.supplies = gain > 0 ? P.addSupplies(r.supplies, gain) : r.supplies + gain;
    r.stars = (r.stars || 0) + stars;
    let title = 'Victory ' + '★'.repeat(stars), text = '✦ ' + gained + ' Souls, 🪙 ' + goldGain + ' Gold. You lost ' + state.damageTaken + ' HP.' + (stars === 3 ? ' Flawless: bonus loot roll!' : '');
    if (boss) { // the boss opens the areas it leads to for THIS run (and lifts their fog for good, the first time)
      const sub = World.SUB_BY[n.sub], first = !save.bossesBeaten.includes(n.sub), open = openList(), opened = sub.unlocks.filter((u) => !open.includes(u));
      for (const u of sub.unlocks) { if (!save.unlocked.includes(u)) { save.unlocked.push(u); r.unlockedNow.push(u); } if (!open.includes(u)) open.push(u); }
      if (first) {
        save.bossesBeaten.push(n.sub);
        r.souls += Gen.BOSS_BONUS_SOULS;
        const cry = P.earn(save, 'crystals', P.bossCrystals(sub.regionIndex)); r.crystalsNow = (r.crystalsNow || 0) + cry;
        title = World.THEMES[n.sub].boss[0] + ' defeated! ' + '★'.repeat(stars);
        text = (sub.unlocks.length ? 'The fog lifts over ' + sub.unlocks.map((u) => World.SUB_BY[u].name).join(' and ') + ' and the way is open. ' : 'You conquered ' + sub.region + '! ') +
          'Bonus ✦ ' + Gen.BOSS_BONUS_SOULS + ' and 💎 ' + cry + ' Crystals. New recruits may be waiting at Camp.';
      } else if (opened.length) {
        title = World.THEMES[n.sub].boss[0] + ' defeated! ' + '★'.repeat(stars);
        text = 'The gates to ' + opened.map((u) => World.SUB_BY[u].name).join(' and ') + ' open for this run. ✦ ' + gained + ' Souls, 🪙 ' + goldGain + ' Gold. You lost ' + state.damageTaken + ' HP.';
      }
      if (opened.length) { const target = World.SUB_BY[opened[0]]; setTimeout(() => WorldMap.focus(target.entry[0], target.entry[1]), 300); }
    }
    if (boss) { const was = save.descendDone; P.noteBoss(save, n.sub); if (P.FINAL_BOSSES.includes(n.sub) && P.descendOf(save) > 0 && save.descendDone > was) text += ' Descend ' + P.descendOf(save) + ' conquered: Descend ' + Math.min(P.MAX_DESCEND, P.descendOf(save) + 1) + ' is open at Camp.'; }
    if (boss && P.FINAL_BOSSES.includes(n.sub) && !save.heatSeen) { save.heatSeen = true; text += ' 🔥 The Heat braziers are lit at Camp: Heat modifiers and Descend are open.'; }
    if (n.guardFor) { // the guard of a cache has fallen: the chest opens
      const gg = Gen.GUARD_GOLD + 3 * regionOf(n); r.souls += Gen.CACHE_SOULS; r.gold += gg;
      title = 'The guard falls ' + '★'.repeat(stars); text += ' The cache is yours: ✦ ' + Gen.CACHE_SOULS + ' and 🪙 ' + gg + ' more.';
    }
    const done = Bounties.track(r.bounties, Object.assign({ won: true, stars, node: n.type }, report || {}));
    const bountyLine = done.length ? '<div class="bounty-done">' + done.map((b) => '<p>🎯 Bounty complete: <b>' + esc(Bounties.text(b)) + '</b> · 💎 ' + b.reward + ' at run end</p>').join('') + '</div>' : '';
    let keyNote = '';
    if ((boss || n.type === 'elite') && (r.keys || 0) < World.MAX_KEYS) { r.keys = (r.keys || 0) + 1; keyNote = ' · 🗝 <b>+1 Key</b> (opens a hidden Sealed Cache)'; }
    const supLine = '<p class="supply-line">🍙 ' + (boss ? 'The boss falls: ' + (gain > 0 ? '<b>+' + gain + ' Rations</b>' : '<b>its Ration is refunded</b>') + (!wasBeaten ? ' (new area pays more)' : ' (toll boss)') : 'Spent <b>1 Ration</b>') + ' · ' + Math.max(0, r.supplies) + ' left' + keyNote + '.</p>';
    const extra = (item ? dropCard(item, equipped ? 'Equipped automatically. Change it in Camp ▸ Gear.' : 'No free slot. Swap it in at Camp ▸ Gear.') : '') + dustLine +
      checkFeats(true) + (bonusItem ? dropCard(bonusItem, '★★★ bonus drop. ' + (bonusEquipped ? 'Equipped automatically.' : 'No free slot: swap it in at Camp ▸ Gear.')) : '') + bountyLine + supLine;
    persist(); renderAll();
    if (r.supplies <= 0) { outOfSupplies(title, text, extra); return; }
    offerReward(title, text, n, extra);
  }

  function outOfSupplies(title, text, extra) {
    modal('<h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' + extra +
      '<p><b>You are out of Rations.</b> The expedition heads home safely with all Souls.</p><div class="row"><button class="primary grow" data-act="home">Return to Camp</button></div>');
    $('#modal').onclick = (ev) => { if (ev.target.closest('[data-act="home"]')) { closeModal(); endRun(false, 'supplies'); } };
  }

  // Brushed ink-wash mark for a relic (CSS .relic-ic).
  const relicIcon = (rel) => '<span class="relic-ic" aria-hidden="true">' + rel.glyph + '</span>';
  const relicRow = (ids) => (ids || []).map((id) => '<span class="relic-ic sm" title="' + esc(Relics.BY_ID[id].name + ': ' + Relics.BY_ID[id].text) + '">' + Relics.BY_ID[id].glyph + '</span>').join('');

  // Every unit upgrade the run could take now: +1 ATK / block / boost, and +1 range (rare, from the second region on, design 24.2).
  // `rw` (Gen.rewardFor) scales the amounts for the post-battle choice; shrines, shops and events pass none and give +1.
  function upgradePool(node, R, rw) {
    const r = run(), cap = Gen.runCap(Math.max(r.maxLevel || 0, rw ? rw.level : node ? node.level : 0)); // units already at the run cap (Gen.runCap) are not offered
    const room = (id, k, step) => Gen.clipTo(((r.mods[id] || {})[k]), step, cap[k]);
    const army = P.buildArmy(save, r.mods), regionIdx = node ? World.SUB_BY[node.sub].regionIndex : 0, pool = [];
    for (const c of army) {
      const t = E.CARD_TYPES[c.type];
      if (t.role === 'attacker') {
        const nA = room(c.id, 'atk', rw ? rw.atk : 1);
        if (nA) pool.push({ kind: 'atk', n: nA, id: c.id, label: '+' + nA + ' ATK · ' + unitTitle(c.id), icon: t.icon, card: c.id });
        if (regionIdx >= 1 && ((c.pattern || t.pattern) !== 'straight' || c.range < 4) && R() < 0.4) pool.push({ kind: 'range', id: c.id, label: '+1 range · ' + unitTitle(c.id), icon: t.icon, card: c.id });
      } else if (t.role === 'defender') { const nB = room(c.id, 'block', rw ? rw.block : 1); if (nB) pool.push({ kind: 'block', n: nB, id: c.id, label: '+' + nB + ' block · ' + unitTitle(c.id), icon: t.icon, card: c.id }); }
      else if (t.effect !== 'mult') { const nM = room(c.id, 'amount', rw ? rw.amount : 1); if (nM) pool.push({ kind: 'amount', n: nM, id: c.id, label: '+' + nM + ' boost · ' + unitTitle(c.id), icon: t.icon, card: c.id }); }
    }
    return pool;
  }
  const takeFrom = (pool, R, n) => { const out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]); return out; };
  // Every source of run upgrades (post-battle choice, shrine, shop, event) respects the run cap (Gen.runCap) of the deepest level reached.
  function applyUpgrade(p, node) {
    const r = run(), m = r.mods[p.id] || (r.mods[p.id] = {}), cap = Gen.runCap(Math.max(r.maxLevel || 0, node ? node.level : 0))[p.kind];
    m[p.kind] = (m[p.kind] || 0) + (cap === undefined ? (p.n || 1) : Gen.clipTo(m[p.kind], p.n || 1, cap));
  }
  function giveRelic(R) {
    const r = run(), left = Relics.LIST.filter((x) => !r.relics.includes(x.id));
    if (r.relics.length >= Relics.MAX_PER_RUN || !left.length) return null;
    const rel = left[Math.floor(R() * left.length)]; r.relics.push(rel.id); return rel;
  }
  const pickBtn = (p, i, extra) => '<button data-reward="' + i + '"' + (extra && extra.dis ? ' disabled' : '') + '><span class="ic">' + (p.card ? unitView(p.card).img : p.icon) + '</span><span>' + esc(p.label) + '</span>' + (extra && extra.tag ? '<small class="price">' + extra.tag + '</small>' : '') + '</button>';

  // Shrine (design 10.6): heal OR upgrade a unit, one choice, then it is spent.
  function openShrine(n) {
    const r = run(), R = World.rng(r.seed + ':shrine:' + n.id), ups = takeFrom(upgradePool(n, R), R, 2);
    const picks = [{ kind: 'heal', label: 'Drink: heal 8 HP', icon: '💧' }].concat(ups);
    modal('<h3>Healing Spring</h3><p>Clear water pools beneath a mossy altar. You may take <b>one</b> blessing.</p><div class="rewards">' + picks.map((p, i) => pickBtn(p, i)).join('') + '</div>' +
      '<div class="row"><button data-act="close">Not now</button></div>');
    $('#modal').onclick = (ev) => {
      if (ev.target.closest('[data-act="close"]')) { closeModal(); return; }
      const b = ev.target.closest('[data-reward]'); if (!b) return;
      const p = picks[Number(b.dataset.reward)];
      if (p.kind === 'heal') { const before = r.hp; r.hp = Math.min(r.maxHp, r.hp + heal(8)); toast('The spring restores ' + (r.hp - before) + ' HP.'); }
      else { applyUpgrade(p, n); toast(p.label.split(' · ')[0] + ' for ' + unitView(p.card).name + '.'); }
      r.cleared.push(n.id); persist(); closeModal(); renderAll();
    };
  }

  // Shop (WP13, revised): four wares. Browsing is free and the market stays open until ONE item is bought; then it packs up for the run.
  function shopStock(n) {
    const r = run(), R = World.rng(r.seed + ':shop:' + n.id), ups = takeFrom(upgradePool(n, R), R, 2), stock = [];
    stock.push({ kind: 'heal', label: 'Healing draught: +8 HP', icon: '🍶', price: price(14, n) });
    for (const u of ups) stock.push(Object.assign({}, u, { price: price(u.kind === 'range' ? 32 : 22, n) }));
    const rel = r.relics.length < Relics.MAX_PER_RUN ? Relics.LIST.filter((x) => !r.relics.includes(x.id)) : [];
    if (rel.length) { const x = rel[Math.floor(R() * rel.length)]; stock.push({ kind: 'relic', id: x.id, label: x.name + ': ' + x.text, icon: relicIcon(x), price: price(40, n) }); }
    else stock.push({ kind: 'tonic', label: 'Ginseng tonic: +2 max HP', icon: '🌿', price: price(30, n) });
    return stock;
  }
  function openShop(n) {
    const r = run(); r.shops = r.shops || {};
    const st = r.shops[n.id] || (r.shops[n.id] = { stock: shopStock(n) });
    let pick = null;
    const draw = () => {
      const p = pick === null ? null : st.stock[pick];
      modal('<h3>Wayside Market</h3><p class="shop-warn">⚠ You can buy <b>only one item</b> here: the market packs up after your purchase. Look around as often as you like first.</p>' +
        '<p class="muted small">🪙 <b>' + (r.gold || 0) + '</b> Gold · ♥ ' + r.hp + '/' + r.maxHp + '</p><div class="rewards shop">' +
        st.stock.map((q, i) => pickBtn(q, i, { tag: '🪙 ' + q.price, dis: (r.gold || 0) < q.price })).join('') + '</div>' +
        (p ? '<p class="shop-confirm">Buy <b>' + esc(p.label) + '</b> for 🪙 ' + p.price + '? The market closes for this run.</p><div class="row"><button data-act="back">Not that one</button><button class="primary grow" data-act="buy">Buy and close</button></div>'
          : '<div class="row"><button class="primary grow" data-act="leave">Leave (the stall stays open)</button></div>'));
    };
    draw();
    $('#modal').onclick = (ev) => {
      if (ev.target.closest('[data-act="leave"]')) { closeModal(); renderAll(); return; }
      if (ev.target.closest('[data-act="back"]')) { pick = null; draw(); return; }
      if (ev.target.closest('[data-act="buy"]') && pick !== null) {
        const p = st.stock[pick];
        if ((r.gold || 0) < p.price) return;
        r.gold -= p.price;
        if (p.kind === 'heal') r.hp = Math.min(r.maxHp, r.hp + heal(8));
        else if (p.kind === 'tonic') { r.maxHp += 2; r.hp += 2; }
        else if (p.kind === 'relic') { if (!r.relics.includes(p.id)) r.relics.push(p.id); }
        else applyUpgrade(p, n);
        r.cleared.push(n.id); persist(); closeModal(); renderAll(); toast('Bought: ' + p.label.split(':')[0] + '. The market packs up.'); return;
      }
      const b = ev.target.closest('[data-reward]'); if (!b || b.disabled) return;
      pick = Number(b.dataset.reward); draw();
    };
  }

  // Event (WP13): a short vignette with choices; each choice may cost Gold and has a (sometimes random) outcome.
  function openEvent(n) {
    const r = run(), ev = eventAt(n), ri = regionOf(n), R = World.rng(r.seed + ':event:' + n.id);
    modal('<h3>' + esc(ev.title) + '</h3><p class="event-text">' + esc(ev.text) + '</p><div class="rewards event">' + ev.choices.map((c, i) => {
      const cost = Events.costOf(c, ri);
      return '<button data-choice="' + i + '"' + ((r.gold || 0) < cost ? ' disabled' : '') + '><span>' + esc(c.label) + '</span>' + (cost ? '<small class="price">🪙 ' + cost + '</small>' : '') + '</button>';
    }).join('') + '</div><div class="row"><button data-act="close">Not now</button></div>');
    $('#modal').onclick = (e) => {
      if (e.target.closest('[data-act="close"]')) { closeModal(); return; }
      const b = e.target.closest('[data-choice]'); if (!b || b.disabled) return;
      const c = ev.choices[Number(b.dataset.choice)], cost = Events.costOf(c, ri);
      if ((r.gold || 0) < cost) return;
      r.gold -= cost;
      const out = Events.resolve(c, ri, R), fx = out.fx, notes = [];
      if (fx.gold) { r.gold = Math.max(0, (r.gold || 0) + fx.gold); }
      if (fx.souls) r.souls += fx.souls;
      if (fx.maxhp) { r.maxHp += fx.maxhp; r.hp += fx.maxhp; }
      if (fx.hp) r.hp = Math.max(1, Math.min(r.maxHp, r.hp + (fx.hp > 0 ? heal(fx.hp) : fx.hp)));
      const ap = () => { const picks = takeFrom(upgradePool(n, R).filter((p) => fx.atk ? p.kind === 'atk' : true), R, 1); if (picks[0]) { applyUpgrade(picks[0], n); notes.push(picks[0].label); } };
      for (let k = 0; k < (fx.atk || 0) + (fx.up || 0); k++) ap();
      if (fx.relic) { const rel = giveRelic(R); notes.push(rel ? rel.name + ': ' + rel.text : 'You have no room for another relic.'); }
      r.cleared.push(n.id); persist(); renderAll();
      modal('<h3>' + esc(ev.title) + '</h3><p>' + esc(out.text) + '</p>' + (Events.fxText(fx) ? '<p class="event-fx"><b>' + esc(Events.fxText(fx)) + '</b></p>' : '') +
        (notes.length ? '<ul class="event-notes">' + notes.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '') + '<div class="row"><button class="primary grow" data-act="close">Continue</button></div>');
      $('#modal').onclick = (e2) => { if (e2.target.closest('[data-act="close"]')) closeModal(); };
    };
  }

  // Choose 1 of 3: always one heal, plus two upgrades for this run.
  function offerReward(title, text, node, extra, rerolled) {
    const r = run(), R = World.rng(r.seed + ':reward:' + r.path.length + (rerolled ? ':rr' + rerolled : ''));
    const rw = Gen.rewardFor(node || { level: 1, type: 'battle' }, gopts()), pool = upgradePool(node, R, rw);
    const picks = [];
    // WP12: a relic takes the place of one upgrade when the run offers one (always after elites and bosses).
    const relic = Relics.offer(r.relics, R, node ? node.type : 'battle');
    while (picks.length < (relic ? 1 : 2) + P.rewardChoices(save) - 3 && pool.length) picks.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
    if (relic) picks.push({ kind: 'relic', id: relic.id, label: relic.name + ': ' + relic.text, icon: relicIcon(relic) });
    // Depth pays: elites and bosses from Lv7 (ordinary fights from Lv10, one time in three) also offer a team-wide Warcry; from Lv6 a Fortify (max HP).
    const capNow = Gen.runCap(Math.max(r.maxLevel || 0, rw.level)), teamRoom = P.buildArmy(save, r.mods).some((c) => E.CARD_TYPES[c.type].role === 'attacker' && ((r.mods[c.id] || {}).atk || 0) < capNow.atk);
    const team = teamRoom ? (rw.team || (rw.teamChance && R() < rw.teamChance ? 1 : 0)) : 0;
    if (team) picks.push({ kind: 'team', n: team, label: 'Warcry: every attacker +' + team + ' ATK', icon: '📣' });
    if (!team && rw.hp && R() < 0.6) picks.push({ kind: 'maxhp', n: rw.hp, label: 'Fortify: +' + rw.hp + ' max HP', icon: '💪' });
    picks.push({ kind: 'heal', n: rw.heal, label: 'Heal ' + rw.heal + ' HP', icon: '❤️' });
    modal('<h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' + (extra || '') + '<p class="muted small">Choose one reward for this run (Lv' + rw.level + ' fight' + (node && node.type !== 'battle' ? ', ' + node.type : '') + '; deeper fights offer bigger rewards):</p><div class="rewards">' +
      picks.map((p, i) => '<button data-reward="' + i + '"><span class="ic">' + (p.card ? unitView(p.card).img : p.icon) + '</span><span>' + esc(p.label) + '</span></button>').join('') + '</div>' +
      ((r.rerolls || 0) > 0 ? '<div class="row"><button class="grow" data-reroll-reward="1">🎲 Re-roll the choices (' + r.rerolls + ' left this run)</button></div>' : ''));
    $('#modal').onclick = (ev) => {
      if (ev.target.closest('[data-reroll-reward]')) { r.rerolls -= 1; persist(); offerReward(title, text, node, extra, (rerolled || 0) + 1); return; }
      const b = ev.target.closest('[data-reward]'); if (!b) return;
      const p = picks[Number(b.dataset.reward)];
      if (p.kind === 'heal') r.hp = Math.min(r.maxHp, r.hp + heal(p.n));
      else if (p.kind === 'maxhp') { r.maxHp += p.n; r.hp += p.n; }
      else if (p.kind === 'team') { for (const c of P.buildArmy(save, r.mods)) if (E.CARD_TYPES[c.type].role === 'attacker') { const m = r.mods[c.id] || (r.mods[c.id] = {}); m.atk = (m.atk || 0) + Gen.clipTo(m.atk, p.n, Gen.runCap(r.maxLevel || 0).atk); } }
      else if (p.kind === 'relic') { (r.relics || (r.relics = [])).push(p.id); toast(Relics.BY_ID[p.id].name + ' joins the expedition.'); }
      else applyUpgrade(p);
      persist(); closeModal(); renderAll();
    };
  }

  function endRun(defeated, reason) {
    const r = run();
    let earned = defeated ? Math.floor(r.souls * 0.75) : r.souls;
    const prevBest = save.bestLevel, prevBestPath = save.bestPath || [];
    const firstRun = save.runs === 0;
    // New furthest reach: deeper fight, or the same depth with a longer route. The old best stays as a second ghost.
    const newBest = r.wins > 0 && (r.maxLevel > prevBest || (r.maxLevel === prevBest && r.path.length > prevBestPath.length));
    save.souls += earned; save.runs += 1;
    const bl = r.bounties || [], bountyCrystals = Bounties.collect(bl);
    P.earn(save, 'crystals', bountyCrystals); save.bountiesDone = (save.bountiesDone || 0) + bl.filter((b) => b.done).length;
    for (const id of r.relics || []) Journal.noteRelic(save, id);
    save.bestLevel = Math.max(save.bestLevel, r.maxLevel);
    save.lastPath = r.path.slice();
    if (newBest) { save.prevBestPath = prevBestPath; save.bestPath = r.path.slice(); }
    // First-run guarantee (design 24.1): the first run always pays for the cheapest Camp upgrade.
    let bonus = 0; pointAt = null;
    if (firstRun) {
      const cheap = P.cheapestUpgrade(save);
      if (cheap) { if (save.souls < cheap.cost) { bonus = cheap.cost - save.souls; save.souls += bonus; } pointAt = cheap.id; }
    }
    save.run = null; selected = null; confirmReturn = false; menuOpen = false; campView = 'home'; teamSel = null; gearSel = null;
    const featHtml = checkFeats(true);
    persist();
    const unlockedNames = r.unlockedNow.map((u) => World.SUB_BY[u].name);
    const found = (r.found || []).map((id) => Items.BY_ID[id]);
    const fights = r.path.map((id) => World.byId[id]).filter((n) => n && ['battle', 'elite', 'boss'].includes(n.type) && r.cleared.includes(n.id));
    const route = fights.length
      ? '<div class="route" aria-label="Route taken">' + fights.map((n) => '<span class="stop" title="' + esc(nodeTitle(n)) + '">' + skulls(n.level) + '<small>Lv' + n.level + '</small></span>').join('<i>›</i>') + '</div>'
      : '<p class="muted small">No fights this time.</p>';
    const cheap = pointAt ? P.UPGRADE_BY[pointAt] : null;
    modal('<h3>' + (defeated ? 'Your hero has fallen' : reason === 'supplies' ? 'Out of Rations' : 'Back at Camp') + '</h3>' +
      '<div class="stats"><div><b>' + r.wins + '</b><span>battles won' + (r.stars ? ' · ' + r.stars + '★' : '') + '</span></div><div><b>Lv' + r.maxLevel + '</b><span>deepest fight' + (newBest ? ' · new best!' : '') + '</span></div>' +
      '<div><b>✦ ' + earned + (bonus ? ' +' + bonus : '') + '</b><span>' + (defeated ? '75% of ' + r.souls + ' kept' : 'all Souls kept') + (bonus ? ' + first-run bonus' : '') + '</span></div></div>' +
      '<h4 class="route-h">Your route</h4>' + route +
      '<p class="reach">Furthest reach: <b>Lv' + r.maxLevel + '</b> · ' + (prevBest ? 'previous best <b>Lv' + prevBest + '</b>' : 'your first expedition') + '. ' +
      (newBest ? 'A new record! ' : '') + '<span class="muted">The map at Camp now draws your last route (red) and best reach (gold) as faint ghost lines' + (newBest && prevBestPath.length > 1 ? ', with the old best in grey' : '') + '.</span></p>' +
      (bl.length ? '<h4 class="route-h">Bounties</h4>' + bountyList(bl) + '<p class="bounty-sum">' + (bountyCrystals || r.crystalsNow ? '💎 +' + (bountyCrystals + (r.crystalsNow || 0)) + ' Crystals' + (r.crystalsNow ? ' (' + r.crystalsNow + ' from a first boss kill)' : '') : 'No bounty finished this time.') + '</p>' : '') +
      featHtml + (found.length ? '<p>Items found: <b>' + found.map((it) => esc(it.name)).join(', ') + '</b>. Equip them in Camp ▸ Gear.</p>' : '') +
      (unlockedNames.length ? '<p>New areas revealed: <b>' + esc(unlockedNames.join(', ')) + '</b></p>' : '') +
      (cheap ? '<p class="first-run">Your Souls already cover your first upgrade: <b>' + cheap.icon + ' ' + esc(cheap.name) + '</b> (' + esc(cheap.desc) + ') for ✦ ' + P.upgradeCost(save, cheap.id) + '.</p>' : '<p class="muted small">Spend Souls at Camp on upgrades and recruits, then set out again to reach further.</p>') +
      ((r.gold || 0) > 0 ? '<p class="muted small">🪙 ' + r.gold + ' unspent Gold stayed behind: Gold only lasts for one expedition.</p>' : '') +
      '<div class="row">' + (cheap ? '<button class="primary grow" data-act="to-upgrades">Go to Upgrades</button><button data-act="to-camp">Camp</button>' : '<button class="primary grow" data-act="to-camp">Go to Camp</button>') + '</div>');
    $('#modal').onclick = (ev) => {
      if (!ev.target.closest('[data-act="to-camp"], [data-act="to-upgrades"]')) return;
      closeModal(); WorldMap.placeToken('camp'); WorldMap.focus(World.CAMP.x, World.CAMP.y - 120);
      campView = ev.target.closest('[data-act="to-upgrades"]') ? 'upgrades' : 'home'; renderAll();
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
  const onPanelClick = (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.drop !== undefined) { dropSel = dropSel === Number(b.dataset.drop) ? null : Number(b.dataset.drop); renderCard(); return; }
    if (b.id === 'sheet-toggle') { sheetOpen = !sheetOpen; renderSheet(); return; }
    if (!b.dataset.salvage) confirmSalvage = null;
    if (b.dataset.cv) { goCamp(b.dataset.cv); return; }
    if (b.dataset.jv) { journalView = b.dataset.jv; renderAll(); const l = $('#camp .camp-body'); if (l) l.scrollTop = 0; return; }
    if (b.dataset.region) { bestRegion = Number(b.dataset.region); renderAll(); return; }
    if (b.dataset.tsel !== undefined) { teamSel = b.dataset.tsel && b.dataset.tsel !== teamSel ? b.dataset.tsel : null; renderAll(); return; }
    if (b.dataset.slot !== undefined) { tapSlot(Number(b.dataset.slot)); return; }
    if (b.dataset.gsel !== undefined) { gearSel = b.dataset.gsel && b.dataset.gsel !== gearSel ? b.dataset.gsel : null; renderAll(); return; }
    if (b.dataset.sview) { summonView = b.dataset.sview; renderAll(); return; }
    if (b.dataset.hero) {
      const h = P.HERO_BY[b.dataset.hero];
      if (!P.heroUnlocked(save, h.id)) { toast(h.name + ' is locked: ' + h.lock + '.'); return; }
      save.hero = h.id; persist(); toast(h.name + ' will lead the next expedition.'); renderAll(); return;
    }
    if (b.dataset.heat) { if (!run() && P.toggleHeat(save, b.dataset.heat)) { persist(); renderAll(); } return; }
    if (b.dataset.descend) { if (!run()) { P.setDescend(save, P.descendOf(save) + Number(b.dataset.descend)); persist(); renderAll(); } return; }
    if (b.dataset.buy) {
      const cost = P.upgradeCost(save, b.dataset.buy);
      if (cost !== null && save.souls >= cost) { pointAt = null; save.souls -= cost; save.upgrades[b.dataset.buy] = P.level(save, b.dataset.buy) + 1; persist(); toast(P.UPGRADE_BY[b.dataset.buy].name + ' upgraded.'); renderAll(); }
      return;
    }
    if (b.dataset.recruit) {
      const u = P.ROSTER_BY[b.dataset.recruit];
      if (!save.owned.includes(u.id) && P.recruitAvailable(save, u) && (u.gems !== undefined ? P.spend(save, 'crystals', u.gems) : P.spend(save, 'souls', u.cost))) {
        save.owned.push(u.id);
        if (!P.canAdd(save, u.id)) save.squad.push(u.id);
        persist(); toast(unitView(u.id).name + ' joined your roster.'); renderAll(); checkFeats(false);
      }
      return;
    }
    if (b.dataset.pull) {
      const n = Number(b.dataset.pull), res = P.pull(save, n, Math.random);
      if (!res) { toast('Not enough Crystals.'); return; }
      const ups = res.filter((r) => r.starUp).length, news = res.filter((r) => r.isNew).length;
      summonMsg = news + ' new, ' + ups + ' star-up' + (ups === 1 ? '' : 's') + '.';
      persist(); renderAll(); showSummon(res); checkFeats(false); return;
    }
    if (b.dataset.office) {
      const res = P.officeTrade(save, b.dataset.office);
      if (res) { summonMsg = ''; persist(); toast(unitView(res.id).name + (res.isNew ? ' joined your roster.' : ' gained a star (★' + res.stars + ').')); renderAll(); showSummon([res]); } else toast('Not enough Seals.');
      return;
    }
    if (b.dataset.equip) {
      const id = b.dataset.equip;
      if (!Items.unequip(save, id)) {
        const res = Items.equip(save, id);
        if (res && res.replaced) toast(Items.BY_ID[res.replaced].name + ' was swapped out.');
      }
      persist(); renderAll(); return;
    }
    if (b.dataset.reroll) {
      const [id, i] = b.dataset.reroll.split('|'), sb = Items.reroll(save, id, Number(i));
      if (sb) { persist(); toast('Substat rerolled: ' + Items.substatText(sb, Items.dataOf(save, id))); renderAll(); } else toast('Not enough Dust.');
      return;
    }
    if (b.dataset.lvup) {
      const lv = Items.levelUp(save, b.dataset.lvup);
      if (lv) { persist(); toast(Items.BY_ID[b.dataset.lvup].name + ' is now item level ' + lv + '.'); renderAll(); } else toast('Not enough Dust.');
      return;
    }
    if (b.dataset.gfilter) { gearFilter = b.dataset.gfilter; renderAll(); return; }
    if (b.dataset.salvage) {
      const id = b.dataset.salvage;
      if (confirmSalvage !== id) { confirmSalvage = id; renderAll(); return; }
      confirmSalvage = null; gearSel = null; const name = Items.BY_ID[id].name, n = Items.salvage(save, id);
      persist(); toast(name + ' salvaged: ⚒ +' + n + ' Dust.'); renderAll(); return;
    }
    if (b.dataset.redeem) {
      const [bossId, itemId] = b.dataset.redeem.split('|'), res = Items.redeemToken(save, bossId, itemId);
      if (res) { persist(); toast(res.item.name + ' bought with ' + Items.TOKENS_NEEDED + ' boss tokens.'); renderAll(); }
      return;
    }
    if (b.dataset.squad) {
      const id = b.dataset.squad, i = save.squad.indexOf(id);
      if (i >= 0) save.squad.splice(i, 1);
      else if (!P.canAdd(save, id)) save.squad.push(id);
      else toast(P.canAdd(save, id) + ' Buy Command at Camp for more.');
      persist(); renderAll(); return;
    }
    const act = b.dataset.act;
    if (act === 'start') startRun();
    else if (act === 'engage') engage(selected);
    else if (act === 'start-here') { const n = World.byId[selected]; save.startAt = n.sub; persist(); toast('Runs now start at the ' + World.SUB_BY[n.sub].name + ' Wayshrine.'); renderAll(); }
    else if (act === 'scout') {
      const n = World.byId[selected], cost = price(World.SCOUT_GOLD, n);
      if (run() && goldNow() >= cost) { run().gold -= cost; revealAround(n.x, n.y, 330, 240); save.seen.includes(n.id) || save.seen.push(n.id); persist(); toast('A scout reports back (🪙 ' + cost + ').'); renderAll(); } else toast('Not enough Gold to send a scout.');
    }
    else if (act === 'close-node') { selected = null; dropSel = null; renderAll(); }
    else if (act === 'toggle-menu') { menuOpen = !menuOpen; confirmReturn = false; selected = null; renderAll(); }
    else if (act === 'scout-here') {
      const h = WorldMap.heroAt(), here = World.byId[run().pos] || World.CAMP, cost = price(World.SCOUT_GOLD, here);
      if (goldNow() >= cost) { run().gold -= cost; revealAround(h.x, h.y, 330 + 300, 240 + 120); persist(); toast('A scout reports back (🪙 ' + cost + ').'); renderAll(); } else toast('Not enough Gold to send a scout.');
    }
    else if (act === 'return') { if (!confirmReturn) { confirmReturn = true; renderMenu(); } else { menuOpen = false; endRun(false); } }
    else if (act === 'cheat') { save.souls += 100; P.earn(save, 'crystals', 30); P.earn(save, 'dust', 10); persist(); renderAll(); }
    else if (act === 'reset') {
      if (!confirmReset) { confirmReset = true; renderAll(); return; }
      confirmReset = false; teamSel = gearSel = null; campView = 'home'; save = P.reset(); WorldMap.placeToken('camp'); WorldMap.focus(World.CAMP.x, World.CAMP.y - 120, true); toast('Progress erased.'); renderAll();
    }
  };
  for (const id of ['#sheet', '#camp', '#card', '#runmenu', '#hud']) $(id).addEventListener('click', onPanelClick);

  // Drag a unit onto a squad slot (mouse / pen; touch uses tap-to-swap).
  $('#camp').addEventListener('dragstart', (ev) => { const d = ev.target.closest('[data-drag]'); if (d) { ev.dataTransfer.setData('text/plain', d.dataset.drag); ev.dataTransfer.effectAllowed = 'move'; } });
  $('#camp').addEventListener('dragover', (ev) => { if (ev.target.closest('[data-slot]')) ev.preventDefault(); });
  $('#camp').addEventListener('drop', (ev) => { const sl = ev.target.closest('[data-slot]'); if (!sl) return; ev.preventDefault(); const id = ev.dataTransfer.getData('text/plain'); if (id && P.ROSTER_BY[id]) dropOnSlot(id, Number(sl.dataset.slot)); });

  WorldMap.init({
    onHero(x, y) { revealAround(x, y); },
    onTap(node) {
      if (busy) return;
      confirmReturn = false; confirmReset = false; dropSel = null;
      if (run()) { menuOpen = false; selected = node && node.type !== 'camp' ? node.id : null; renderAll(); return; } // ground taps only walk the hero
      if (campView !== 'map') return; // Camp screens cover the map; only the read-only World map view inspects spots
      if (!node || node.type === 'camp') { selected = null; renderAll(); return; }
      selected = node.id; sheetOpen = true; renderAll();
    },
  });
  const r0 = run();
  WorldMap.placeToken(r0 ? r0.pos : 'camp');
  const start = r0 ? World.byId[r0.pos] : World.CAMP;
  WorldMap.focus(start.x, start.y - (r0 ? 0 : 120), true);
  renderAll();
})();
