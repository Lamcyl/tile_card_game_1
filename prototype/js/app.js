// Game flow for the world map prototype: Camp, runs, map choices,
// battles, rewards and end-of-run results.
(function () {
  'use strict';
  const Bounties = window.Bounties, E = window.Engine, World = window.World, P = window.Progress, Gen = window.Gen, Items = window.Items;
  const $ = (s) => document.querySelector(s);
  let save = P.load();
  let selected = null;
  let campTab = 'upgrades';
  let sheetOpen = true;
  let busy = false;
  let confirmReset = false, confirmReturn = false, confirmSalvage = null, gearFilter = 'all', gearView = 'gear';
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
        '<div class="hud-chip big" title="Souls: buy Camp upgrades and recruits">✦ ' + P.balance(save, 'souls') + ' <small>Souls</small></div>' +
        '<div class="hud-chip cur crystals" title="Crystals: from first boss kills and bounties. Spent on Summon pulls (Rare, Epic and Legendary units).">💎 ' + P.balance(save, 'crystals') + '</div>' +
        '<div class="hud-chip cur dust" title="Dust: from salvaging gear. Spent in the Forge (coming soon).">⚒ ' + P.balance(save, 'dust') + '</div>';
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
    return n.type === 'boss' ? '<span class="cost gain">🎒 Boss: +' + P.SUPPLIES_PER_BOSS + ' Supplies</span>' : '<span class="cost">🎒 Costs 1 Supply</span>';
  }

  function nodeSheet(n) {
    const r = run(), sub = World.SUB_BY[n.sub];
    const isFight = ['battle', 'elite', 'boss'].includes(n.type);
    let body = '<div class="sheet-head"><div><h2>' + esc(nodeTitle(n)) + '</h2><p class="muted">' + esc(sub.name) + ' · ' + esc(sub.region) + '</p></div>' +
      (isFight ? '<div class="lv-box">' + skulls(n.level) + '<span class="lv" style="background:' + lvColor(n.level) + '">Lv' + n.level + '</span></div>' : '') + '</div>';
    if (isFight) {
      const preview = Gen.generateBattle(n, r ? r.seed : 'preview');
      const icons = preview.enemies.map((e) => enemyChip(e.type)).join('');
      const souls = Math.round(Gen.soulsFor(n) * P.soulRate(save));
      body += '<p class="enemies">' + icons + '</p>';
      if (preview.intro) body += '<p class="gimmick-note"><b>' + esc(preview.intro.name) + (preview.intro.rule && preview.intro.rule !== 'Elite' ? ' · ' + esc((preview.intro.badge ? preview.intro.badge + ' ' : '') + preview.intro.rule) : '') + '.</b> ' + esc(preview.intro.text) + '</p>';
      body += '<p class="muted">' + (n.type === 'boss'
        ? (save.bossesBeaten.includes(n.sub) ? 'Already defeated once. Fight again for Souls.' : 'Defeat it to reveal ' + sub.unlocks.map((u) => World.SUB_BY[u].name).join(' and ') + (sub.unlocks.length ? '.' : '. This is a final boss.'))
        : n.type === 'elite' ? 'A tougher fight that pays double Souls.' : 'A normal fight.') + ' Reward: ✦ ' + souls + ', up to ✦ ' + Math.round(Gen.soulsFor(n, 3) * P.soulRate(save)) + ' with ★★★ (no damage, plus a bonus item roll).</p>';
      body += '<p>' + supplyNote(n) + '</p>';
      body += '<div class="drops"><h4>Possible drops <small>item level ' + n.level + (n.type === 'elite' ? ' · an elite always drops something' : '') + '</small></h4>' + Items.tableFor(n).map((e) => dropRow(e, n)).join('') + '</div>';
      if (n.type === 'boss') body += tokenBlock(n);
      const miss = Items.missesOf(save, n.id);
      if (miss > 0) body += '<p class="muted small">Bad-luck protection: ' + miss + ' win' + (miss === 1 ? '' : 's') + ' without the unique item. Its chance rises each time.</p>';
    } else if (n.type === 'shrine') body += '<p class="muted">Restores 8 HP. Once per run.</p><p><span class="cost free">Free: costs no Supplies</span></p>';
    else if (n.type === 'treasure') body += '<p class="muted">Free supplies: ✦ 10 and a reward of your choice.</p><p><span class="cost free">Free: costs no Supplies</span></p>';

    if (!r) body += '<p class="hint">Set out from Camp to fight here.</p><button class="primary wide" data-act="close-node">Back to Camp</button>';
    else if (r.cleared.includes(n.id)) body += '<p class="hint">Already cleared on this run.</p><button class="wide" data-act="close-node">Close</button>';
    else body += '<div class="row"><button data-act="close-node">Cancel</button><button class="primary grow" data-act="engage">' +
      (isFight ? (n.type === 'boss' ? '👑 Challenge' : '⚔ Fight') : n.type === 'shrine' ? '⛲ Rest' : '🎁 Open') + '</button></div>';
    return body;
  }

  function bountyList(list, showPay) {
    return '<ul class="bounties">' + list.map((b) => '<li class="' + (b.done ? 'done' : '') + '"><span class="bi">' + (b.done ? '✓' : Bounties.icon(b)) + '</span><span class="bt">' + esc(Bounties.text(b)) + '</span>' +
      '<small>' + (b.done ? 'done' : b.progress + '/' + b.goal) + '</small><span class="pay">💎 ' + b.reward + '</span></li>').join('') + '</ul>';
  }
  function runSheet() {
    const r = run(), bl = r.bounties || [];
    const open = [...frontier()].filter((id) => ['battle', 'elite', 'boss'].includes(World.byId[id].type)).length;
    return '<div class="sheet-head"><div><h2>On expedition</h2><p class="muted">Free exploration: tap any monster in an open area. ' + open + ' fights left.</p></div></div>' +
      '<p class="supply-line">🎒 <b>' + r.supplies + '</b> Supplies left. Each normal or elite win costs 1; a boss adds ' + P.SUPPLIES_PER_BOSS + '. At 0 you return to Camp safely.</p>' +
      (bl.length ? '<h4 class="bounty-h">Bounties <small>optional, paid in 💎 when the run ends</small></h4>' + bountyList(bl) : '') +
      '<p class="muted small">HP never regenerates by itself. Return to Camp to keep all ✦ ' + r.souls + ' Souls; if you fall, you keep 75%.</p>' +
      '<button class="wide' + (confirmReturn ? ' danger' : '') + '" data-act="return">' + (confirmReturn ? 'Tap again to end the run and return' : '🏕 Return to Camp') + '</button>';
  }

  function campSheet() {
    const tabs = ['upgrades', 'squad', 'recruit', 'summon', 'gear'];
    let html = '<div class="sheet-head"><div><h2>Camp</h2><p class="muted">Spend Souls, pick your squad (Command Points, one supporter minimum), then set out with 🎒 ' + P.startSupplies(save) + ' Supplies.</p></div>' +
      '<button class="primary" data-act="start">Set out ➜</button></div>';
    html += '<div class="cur-bar" aria-label="Currencies">' + Object.keys(P.CURRENCIES).map((c) => '<span class="cur-' + c + '"><i>' + P.CURRENCIES[c].icon + '</i><b>' + P.balance(save, c) + '</b><small>' + P.CURRENCIES[c].name + '</small></span>').join('') +
      '<span class="cur-meta"><small>Runs ' + save.runs + ' · Best Lv' + save.bestLevel + '</small></span></div>';
    html += '<div class="tabs">' + tabs.map((t) => '<button class="' + (campTab === t ? 'on' : '') + '" data-tab="' + t + '">' +
      { upgrades: 'Camp', squad: 'Squad ' + P.squadCp(save) + '/' + P.commandCap(save), recruit: 'Recruit', summon: 'Summon', gear: 'Gear ' + Items.equippedIds(save).length + '/' + Items.SLOTS }[t] + '</button>').join('') + '</div>';
    html += '<div class="list">';
    if (campTab === 'upgrades') {
      for (const u of P.UPGRADES) {
        const lv = P.level(save, u.id), cost = P.upgradeCost(save, u.id);
        html += '<div class="item"><span class="ic">' + u.icon + '</span><div class="grow"><b>' + u.name + ' <small>Lv ' + lv + '/' + u.costs.length + '</small></b><span class="muted">' + u.desc + '</span></div>' +
          (cost === null ? '<span class="muted">Max</span>' : '<button data-buy="' + u.id + '"' + (pointAt === u.id ? ' class="point"' : '') + (save.souls < cost ? ' disabled' : '') + '>✦ ' + cost + '</button>') + '</div>';
      }
      html += '<p class="muted small">Max HP ' + P.maxHp(save) + ' · Squad slots ' + P.slots(save) + ' · Start Supplies ' + P.startSupplies(save) + '</p>';
    } else if (campTab === 'squad') {
      const army = P.buildArmy(save, {}), problem = P.squadProblem(save), cp = P.squadCp(save), cap = P.commandCap(save);
      html += '<div class="squad-head"><div class="cp-bar' + (cp > cap ? ' over' : '') + '" role="meter" aria-valuenow="' + cp + '" aria-valuemax="' + cap + '"><i style="width:' + Math.min(100, 100 * cp / cap) + '%"></i><span>🎖️ Command Points <b>' + cp + ' / ' + cap + '</b></span></div>' +
        '<p class="squad-rule ' + (problem ? 'bad' : 'ok') + '">' + (problem ? '⚠ ' + esc(problem) : '✔ Squad ready: an attacker and a supporter, ' + (cap - cp) + ' CP spare.') + '</p>' +
        '<p class="muted small">Cost by rarity: Common 1 · Rare 2 · Epic 3 · Legendary 4. Buy Command to raise the cap.</p></div>';
      html += traitPanel();
      for (const id of save.owned) {
        const inSquad = save.squad.includes(id), card = army.find((c) => c.id === id) || P.buildArmy(Object.assign({}, save, { squad: [id] }), {})[0];
        const blocked = !inSquad && P.canAdd(save, id);
        html += '<div class="item unit ' + rarClassOf(id) + '">' + unitCell(id, unitMeta(id) + '<span class="muted">' + statLine(card) + '</span>' + unitPerk(id)) +
          '<button class="' + (inSquad ? 'on' : blocked ? 'cant' : '') + '" data-squad="' + id + '" title="' + esc(blocked || '') + '">' + (inSquad ? 'In squad' : 'Add') + '</button></div>';
      }
    } else if (campTab === 'gear') {
      html += gearTab();
    } else if (campTab === 'recruit') {
      let shown = 0;
      for (const u of P.ROSTER) {
        if (save.owned.includes(u.id) || u.start || !P.recruitable(u)) continue;
        shown++;
        const avail = P.recruitAvailable(save, u), gems = false;
        const need = Array.isArray(u.need) ? u.need : [u.need];
        const can = gems ? P.canSpend(save, 'crystals', u.gems) : save.souls >= u.cost;
        html += '<div class="item unit ' + rarClassOf(u.id) + (avail ? '' : ' locked') + '">' + unitCell(u.id, unitMeta(u.id) + '<span class="muted">' +
          (avail ? describeType(u.type, u) : 'Defeat ' + need.map((b) => World.THEMES[b].boss[0]).join(' or ')) + '</span>' + unitPerk(u.id)) +
          (avail ? '<button data-recruit="' + u.id + '"' + (can ? '' : ' disabled') + '>' + (gems ? '💎 ' + u.gems : '✦ ' + u.cost) + '</button>' : '<span class="muted">🔒</span>') + '</div>';
      }
      if (!shown) html += '<p class="muted">Every Common has joined you. Rare, Epic and Legendary units come from the Summon tab.</p>';
      else html += '<p class="muted small">Commons can be bought here with Souls once their boss has fallen. Rarer units come from the Summon tab.</p>';
    } else if (campTab === 'summon') {
      html += summonTab();
    }
    html += '</div><div class="tools"><span class="muted small">Prototype tools</span><button data-act="cheat">+100 ✦ 30 💎 10 ⚒</button><button data-act="reset" class="' + (confirmReset ? 'danger' : '') + '">' + (confirmReset ? 'Tap again to erase' : 'Reset progress') + '</button></div>';
    return html;
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
  function forgeView() {
    const owned = save.items.map((id) => Items.BY_ID[id]).filter(Boolean), eq = Items.equippedIds(save), dust = P.balance(save, 'dust');
    let h = '<p class="muted small">Spend ⚒ Dust (<b>' + dust + '</b>) to reroll a substat or raise an item\'s level (max ' + Items.MAX_ILVL + '). Salvage items in the Gear view.</p>' + setPanel();
    if (!owned.length) return h + '<p class="empty-gear">Nothing to forge yet.</p>';
    owned.sort((a, b) => (eq.includes(b.id) - eq.includes(a.id)) || (Items.RARITY[b.rarity].order - Items.RARITY[a.rarity].order) || a.name.localeCompare(b.name));
    for (const it of owned) {
      const d = Items.dataOf(save, it.id), lc = Items.levelCost(save, it.id), rc = Items.rerollCost(save, it.id), set = Items.setOf(it);
      h += '<div class="item gear forge ' + rarClass(it) + (eq.includes(it.id) ? ' equipped' : '') + '">' + itemIcon(it) + '<div class="grow"><b>' + esc(it.name) + '</b>' +
        '<span class="meta"><i class="rb">' + Items.RARITY[it.rarity].name + '</i> iLv ' + d.lv + (set ? ' · ' + set.icon + ' ' + esc(set.name) : '') + '</span>' + '<span class="effect">' + esc(Items.effectText(it.kind, it.type, Items.mainAmount(it, d))) + '</span>' +
        d.subs.map((sb, i) => '<span class="subrow"><span class="sub">+ ' + esc(Items.substatText(sb, d)) + '</span><button data-reroll="' + it.id + '|' + i + '"' + (dust < rc ? ' disabled' : '') + ' aria-label="Reroll substat">🎲 ⚒' + rc + '</button></span>').join('') +
        '<span class="forge-btns">' + (lc === null ? '<span class="muted">Max level</span>' : '<button data-lvup="' + it.id + '"' + (dust < lc ? ' disabled' : '') + '>⬆ Level ' + (d.lv + 1) + ' · ⚒' + lc + '</button>') + '</span></div></div>';
    }
    return h;
  }
  function gearTab() {
    const toggle = '<div class="chips views">' + [['gear', 'Gear'], ['forge', '⚒ Forge']].map((c) => '<button class="' + (gearView === c[0] ? 'on' : '') + '" data-gview="' + c[0] + '">' + c[1] + '</button>').join('') + '</div>';
    if (gearView === 'forge') return toggle + forgeView();
    return toggle + gearList();
  }
  function gearList() {
    const owned = save.items.map((id) => Items.BY_ID[id]).filter(Boolean);
    const eq = Items.equippedIds(save);
    let h = '<div class="paperdoll" aria-label="Equipped gear">' + Items.SLOT_LIST.map((sl) => {
      const id = save.loadout[sl.id], it = id && Items.BY_ID[id];
      return '<button class="slot ' + (it ? rarClass(it) + ' filled' : '') + '" ' + (it ? 'data-equip="' + it.id + '" title="' + esc(it.name) + ': tap to unequip"' : 'disabled') + '>' +
        '<span class="si">' + (it ? esc(Items.icon(it)) : sl.icon) + '</span><small>' + sl.name + '</small><em>' + (it ? esc(it.name) : 'empty') + '</em></button>';
    }).join('') + '</div>';
    h += setPanel();
    h += '<p class="muted small">Items drop from monsters, scale with the fight\'s level and are kept forever. Rings take anything. Collected ' + owned.length + '/' + Items.ALL.length + '. Salvaging gives Dust ⚒.</p>';
    const chips = [['all', 'All']].concat(Object.keys(Items.SLOT_NAMES).map((k) => [k, Items.SLOT_NAMES[k]]));
    h += '<div class="chips">' + chips.map((c) => '<button class="' + (gearFilter === c[0] ? 'on' : '') + '" data-gfilter="' + c[0] + '">' + c[1] + '</button>').join('') + '</div>';
    const bossTok = World.nodes.filter((n) => n.type === 'boss' && Items.tokensOf(save, n.id) > 0);
    if (bossTok.length) h += '<details class="tok-list"><summary>Boss tokens (' + bossTok.length + ' boss' + (bossTok.length === 1 ? '' : 'es') + ')</summary>' +
      bossTok.map((n) => '<h5>' + esc(nodeTitle(n)) + '</h5>' + tokenBlock(n)).join('') + '</details>';
    const list = owned.filter((it) => gearFilter === 'all' || it.slot === gearFilter);
    if (!owned.length) return h + '<p class="empty-gear">No gear yet. Win battles on the map: every monster has an item that only it drops.</p>';
    list.sort((a, b) => (eq.includes(b.id) - eq.includes(a.id)) || (Items.RARITY[b.rarity].order - Items.RARITY[a.rarity].order) || (Items.dataOf(save, b.id).lv - Items.dataOf(save, a.id).lv) || a.name.localeCompare(b.name));
    if (!list.length) h += '<p class="empty-gear">Nothing in this slot yet.</p>';
    for (const it of list) {
      const on = eq.includes(it.id), src = it.source, d = Items.dataOf(save, it.id);
      const from = src.kind === 'unique' ? nodeTitle(World.byId[src.spot]) + ' · ' + World.SUB_BY[src.sub].name : src.kind === 'legend' ? 'Signature of ' + nodeTitle(World.byId[src.spot]) : src.kind === 'sub' ? World.SUB_BY[src.sub].name : src.region;
      const val = Items.salvageValue(save, it.id), sure = confirmSalvage === it.id;
      h += '<div class="item gear ' + rarClass(it) + (on ? ' equipped' : '') + '">' + itemIcon(it) + '<div class="grow"><b>' + esc(it.name) + '</b>' +
        '<span class="meta"><i class="rb">' + Items.RARITY[it.rarity].name + '</i> ' + (it.slot === 'ring' ? 'Ring' : Items.SLOT_NAMES[it.slot]) + ' · iLv ' + d.lv + '</span>' + itemLines(it) + '<span class="muted">' + esc(from) + '</span></div>' +
        '<div class="btns"><button class="' + (on ? 'on' : '') + '" data-equip="' + it.id + '">' + (on ? 'Unequip' : 'Equip') + '</button>' +
        '<button class="salvage' + (sure ? ' danger' : '') + '" data-salvage="' + it.id + '">' + (sure ? 'Sure? ' : '') + '⚒ +' + val + '</button></div></div>';
    }
    return h;
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
    return '<div class="traits"><h4>Traits <small>2 / 4 / 6 of a kind in the squad</small></h4>' + Object.keys(P.TRAITS).map((t) => {
      const tr = P.TRAITS[t], n = counts[t] || 0;
      return '<div class="trait' + (n >= 2 ? ' on' : '') + '"><b>' + tr.icon + ' ' + tr.name + ' <em>' + n + '</em></b>' + P.TRAIT_STEPS.map((st) =>
        '<span class="' + (n >= st ? 'got' : '') + '"><i>' + st + '</i> ' + esc(tr.tiers[st].text) + '</span>').join('') + '</div>';
    }).join('') + '</div>';
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

  function renderAll() { renderHud(); renderSheet(); syncMap(); }

  // ---------- Actions ----------
  function startRun() {
    const problem = P.squadProblem(save);
    if (problem) { toast(problem); campTab = 'squad'; sheetOpen = true; renderAll(); return; }
    const sup = P.startSupplies(save);
    save.run = { seed: 'run' + Date.now(), hp: P.maxHp(save), maxHp: P.maxHp(save), supplies: sup, startSupplies: sup, pos: 'camp', cleared: ['camp'], path: ['camp'],
      bounties: Bounties.roll(World.rng('bounty:' + Date.now())), crystalsNow: 0, souls: 0, wins: 0, maxLevel: 0, mods: {}, placement: {}, unlockedNow: [], found: [] };
    selected = null; confirmReturn = false; persist();
    WorldMap.placeToken('camp');
    const sub = World.SUB_BY.meadow; WorldMap.focus(sub.entry[0], sub.entry[1]);
    toast('Expedition started with ' + sup + ' Supplies and ' + run().bounties.length + (run().bounties.length === 1 ? ' bounty' : ' bounties') + '.');
    renderAll();
  }

  async function engage(id) {
    const r = run(), n = World.byId[id];
    if (!r || busy || r.cleared.includes(id) || !save.unlocked.includes(n.sub)) return;
    busy = true; selected = null; sheetOpen = true; renderAll();
    // Short hops are walked; far ones just move the hero there.
    const from = World.byId[r.pos] || World.CAMP;
    if (Math.hypot(from.x - n.x, from.y - n.y) < 1600) await WorldMap.walk([id]); else { WorldMap.placeToken(id); WorldMap.focus(n.x, n.y); }
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
    const stage = Object.assign({ heroHp: r.hp, heroMaxHp: r.maxHp, rules: P.rulesFor(save, r) }, Gen.generateBattle(n, r.seed));
    WorldMap.setActive(false);
    document.body.classList.add('in-battle');
    Battle.start({
      title: nodeTitle(n), subtitle: World.SUB_BY[n.sub].name + ' · Lv' + n.level, stage, biome: World.SUB_BY[n.sub].biome,
      army: P.buildArmy(save, r.mods), placement: r.placement,
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
    if (state.reviveUsed) r.reviveUsed = true; // Phoenix Archer: one rebirth per run
    if (state.status !== 'cleared') { persist(); endRun(true); return; }
    stars = stars || 1;
    const gained = Math.round(Gen.soulsFor(n, stars) * P.soulRate(save));
    P.addXp(save, save.squad, n.type === 'boss' ? 2 : 1); // WP11 unit mastery
    r.souls += gained; r.wins += 1; r.maxLevel = Math.max(r.maxLevel, n.level); r.cleared.push(n.id);
    // Items: rolled before the boss is marked as beaten, so its first kill always drops its unique item.
    let drop = Items.grantDrop(save, n, r.seed);
    if (!drop && save.runs === 0 && !r.found.length && r.wins === 2) drop = Items.guaranteedDrop(save, n); // design 24.3: an item in the first two battles
    const item = drop && drop.item ? drop : null, equipped = autoEquip(item);
    if (item && item.isNew) r.found.push(item.id);
    // A 3-star clear earns one extra loot roll (design 11); a duplicate turns into Dust.
    let bonusItem = null, bonusEquipped = false;
    if (stars === 3) {
      const b = Items.grantDrop(save, n, r.seed + ':star', { bonus: true });
      if (b && b.item) { bonusItem = b; if (b.isNew) r.found.push(b.id); bonusEquipped = autoEquip(b); }
    }
    const dustLine = drop && drop.consolation ? '<p class="supply-line">Elite spoils: ⚒ ' + drop.dust + ' Dust (you own everything it drops).</p>' : '';
    // Supplies: normal and elite wins cost 1, a boss adds some.
    const boss = n.type === 'boss';
    r.supplies += boss ? P.SUPPLIES_PER_BOSS : -1;
    r.stars = (r.stars || 0) + stars;
    let title = 'Victory ' + '★'.repeat(stars), text = '✦ ' + gained + ' Souls. You lost ' + state.damageTaken + ' HP.' + (stars === 3 ? ' Flawless: bonus loot roll!' : '');
    if (boss && !save.bossesBeaten.includes(n.sub)) {
      save.bossesBeaten.push(n.sub);
      const sub = World.SUB_BY[n.sub];
      for (const u of sub.unlocks) if (!save.unlocked.includes(u)) { save.unlocked.push(u); r.unlockedNow.push(u); }
      r.souls += 25;
      const cry = P.earn(save, 'crystals', P.bossCrystals(sub.regionIndex)); r.crystalsNow = (r.crystalsNow || 0) + cry;
      title = World.THEMES[n.sub].boss[0] + ' defeated! ' + '★'.repeat(stars);
      text = (sub.unlocks.length ? 'The fog lifts over ' + sub.unlocks.map((u) => World.SUB_BY[u].name).join(' and ') + '. ' : 'You conquered ' + sub.region + '! ') +
        'Bonus ✦ 25 and 💎 ' + cry + ' Crystals. New recruits may be waiting at Camp.';
      const target = sub.unlocks.length ? World.SUB_BY[sub.unlocks[0]] : sub;
      setTimeout(() => WorldMap.focus(target.entry[0], target.entry[1]), 300);
    }
    const done = Bounties.track(r.bounties, Object.assign({ won: true, stars, node: n.type }, report || {}));
    const bountyLine = done.length ? '<div class="bounty-done">' + done.map((b) => '<p>🎯 Bounty complete: <b>' + esc(Bounties.text(b)) + '</b> · 💎 ' + b.reward + ' at run end</p>').join('') + '</div>' : '';
    const supLine = '<p class="supply-line">🎒 ' + (boss ? 'The boss falls: <b>+' + P.SUPPLIES_PER_BOSS + ' Supplies</b>' : 'Spent <b>1 Supply</b>') + ' · ' + Math.max(0, r.supplies) + ' left.</p>';
    const extra = (item ? dropCard(item, equipped ? 'Equipped automatically. Change it in Camp ▸ Gear.' : 'No free slot. Swap it in at Camp ▸ Gear.') : '') + dustLine +
      (bonusItem ? dropCard(bonusItem, '★★★ bonus drop. ' + (bonusEquipped ? 'Equipped automatically.' : 'No free slot: swap it in at Camp ▸ Gear.')) : '') + bountyLine + supLine;
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
        if (regionIdx >= 1 && ((c.pattern || t.pattern) !== 'straight' || c.range < 4) && R() < 0.4) pool.push({ kind: 'range', id: c.id, label: '+1 range · ' + unitTitle(c.id), icon: t.icon, card: c.id });
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
    let earned = defeated ? Math.floor(r.souls * 0.75) : r.souls;
    const prevBest = save.bestLevel, prevBestPath = save.bestPath || [];
    const firstRun = save.runs === 0;
    // New furthest reach: deeper fight, or the same depth with a longer route. The old best stays as a second ghost.
    const newBest = r.wins > 0 && (r.maxLevel > prevBest || (r.maxLevel === prevBest && r.path.length > prevBestPath.length));
    save.souls += earned; save.runs += 1;
    const bl = r.bounties || [], bountyCrystals = Bounties.collect(bl);
    P.earn(save, 'crystals', bountyCrystals); save.bountiesDone = (save.bountiesDone || 0) + bl.filter((b) => b.done).length;
    save.bestLevel = Math.max(save.bestLevel, r.maxLevel);
    save.lastPath = r.path.slice();
    if (newBest) { save.prevBestPath = prevBestPath; save.bestPath = r.path.slice(); }
    // First-run guarantee (design 24.1): the first run always pays for the cheapest Camp upgrade.
    let bonus = 0; pointAt = null;
    if (firstRun) {
      const cheap = P.cheapestUpgrade(save);
      if (cheap) { if (save.souls < cheap.cost) { bonus = cheap.cost - save.souls; save.souls += bonus; } pointAt = cheap.id; }
    }
    save.run = null; selected = null; confirmReturn = false;
    persist();
    const unlockedNames = r.unlockedNow.map((u) => World.SUB_BY[u].name);
    const found = (r.found || []).map((id) => Items.BY_ID[id]);
    const fights = r.path.map((id) => World.byId[id]).filter((n) => n && ['battle', 'elite', 'boss'].includes(n.type) && r.cleared.includes(n.id));
    const route = fights.length
      ? '<div class="route" aria-label="Route taken">' + fights.map((n) => '<span class="stop" title="' + esc(nodeTitle(n)) + '">' + skulls(n.level) + '<small>Lv' + n.level + '</small></span>').join('<i>›</i>') + '</div>'
      : '<p class="muted small">No fights this time.</p>';
    const cheap = pointAt ? P.UPGRADE_BY[pointAt] : null;
    modal('<h3>' + (defeated ? 'Your hero has fallen' : reason === 'supplies' ? 'Out of Supplies' : 'Back at Camp') + '</h3>' +
      '<div class="stats"><div><b>' + r.wins + '</b><span>battles won' + (r.stars ? ' · ' + r.stars + '★' : '') + '</span></div><div><b>Lv' + r.maxLevel + '</b><span>deepest fight' + (newBest ? ' · new best!' : '') + '</span></div>' +
      '<div><b>✦ ' + earned + (bonus ? ' +' + bonus : '') + '</b><span>' + (defeated ? '75% of ' + r.souls + ' kept' : 'all Souls kept') + (bonus ? ' + first-run bonus' : '') + '</span></div></div>' +
      '<h4 class="route-h">Your route</h4>' + route +
      '<p class="reach">Furthest reach: <b>Lv' + r.maxLevel + '</b> · ' + (prevBest ? 'previous best <b>Lv' + prevBest + '</b>' : 'your first expedition') + '. ' +
      (newBest ? 'A new record! ' : '') + '<span class="muted">The map at Camp now draws your last route (red) and best reach (gold) as faint ghost lines' + (newBest && prevBestPath.length > 1 ? ', with the old best in grey' : '') + '.</span></p>' +
      (bl.length ? '<h4 class="route-h">Bounties</h4>' + bountyList(bl) + '<p class="bounty-sum">' + (bountyCrystals || r.crystalsNow ? '💎 +' + (bountyCrystals + (r.crystalsNow || 0)) + ' Crystals' + (r.crystalsNow ? ' (' + r.crystalsNow + ' from a first boss kill)' : '') : 'No bounty finished this time.') + '</p>' : '') +
      (found.length ? '<p>Items found: <b>' + found.map((it) => esc(it.name)).join(', ') + '</b>. Equip them in Camp ▸ Gear.</p>' : '') +
      (unlockedNames.length ? '<p>New areas revealed: <b>' + esc(unlockedNames.join(', ')) + '</b></p>' : '') +
      (cheap ? '<p class="first-run">Your Souls already cover your first upgrade: <b>' + cheap.icon + ' ' + esc(cheap.name) + '</b> (' + esc(cheap.desc) + ') for ✦ ' + P.upgradeCost(save, cheap.id) + '.</p>' : '<p class="muted small">Spend Souls at Camp on upgrades and recruits, then set out again to reach further.</p>') +
      '<div class="row">' + (cheap ? '<button class="primary grow" data-act="to-upgrades">Go to Upgrades</button><button data-act="to-camp">Camp</button>' : '<button class="primary grow" data-act="to-camp">Go to Camp</button>') + '</div>');
    $('#modal').onclick = (ev) => {
      if (!ev.target.closest('[data-act="to-camp"], [data-act="to-upgrades"]')) return;
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
    if (!b.dataset.salvage) confirmSalvage = null;
    if (b.dataset.tab) { campTab = b.dataset.tab; sheetOpen = true; renderSheet(); return; }
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
        persist(); toast(unitView(u.id).name + ' joined your roster.'); renderAll();
      }
      return;
    }
    if (b.dataset.pull) {
      const n = Number(b.dataset.pull), res = P.pull(save, n, Math.random);
      if (!res) { toast('Not enough Crystals.'); return; }
      const ups = res.filter((r) => r.starUp).length, news = res.filter((r) => r.isNew).length;
      summonMsg = news + ' new, ' + ups + ' star-up' + (ups === 1 ? '' : 's') + '.';
      persist(); renderAll(); showSummon(res); return;
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
    if (b.dataset.gview) { gearView = b.dataset.gview; renderSheet(); return; }
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
    if (b.dataset.gfilter) { gearFilter = b.dataset.gfilter; renderSheet(); return; }
    if (b.dataset.salvage) {
      const id = b.dataset.salvage;
      if (confirmSalvage !== id) { confirmSalvage = id; renderSheet(); return; }
      confirmSalvage = null; const name = Items.BY_ID[id].name, n = Items.salvage(save, id);
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
    else if (act === 'close-node') { selected = null; renderAll(); }
    else if (act === 'return') { if (!confirmReturn) { confirmReturn = true; renderSheet(); } else endRun(false); }
    else if (act === 'cheat') { save.souls += 100; P.earn(save, 'crystals', 30); P.earn(save, 'dust', 10); persist(); renderAll(); }
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
