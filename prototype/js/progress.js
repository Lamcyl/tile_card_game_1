// Permanent progression (Souls, Camp upgrades, roster) and the save file.
(function (root) {
  'use strict';
  const Engine = root.Engine;

  // ---------- Rarity, Command Points and traits (WP10) ----------
  // Every unit has a rarity (its Command Point cost) and a trait. The squad may spend at most commandCap() points.
  const RARITY = {
    common:    { name: 'Common',    cp: 1 },
    rare:      { name: 'Rare',      cp: 2 },
    epic:      { name: 'Epic',      cp: 3 },
    legendary: { name: 'Legendary', cp: 4 },
  };
  // Bringing 2 / 4 / 6 units of one trait gives the squad a bonus (the tiers stack). `fx` keys: hp, souls (percent), block (Shields),
  // wildAtk (Wild attackers), mageAtk (Mages), arcAmount (Arcane supporters), rules (engine rule flags, see Engine / Items.rules).
  const TRAITS = {
    order:  { name: 'Order',  icon: '🏯', tiers: {
      2: { text: '+2 max HP', fx: { hp: 2 } },
      4: { text: 'Shields block +1', fx: { block: 1 } },
      6: { text: 'Every enemy strike is weakened by 1', fx: { rules: { soften: 1 } } } } },
    wild:   { name: 'Wild',   icon: '🐾', tiers: {
      2: { text: '+10% Souls from battles', fx: { souls: 10 } },
      4: { text: 'Wild attackers +1 ATK', fx: { wildAtk: 1 } },
      6: { text: 'Opening Strike: the first shot of a battle deals double damage', fx: { rules: { opening: 1 } } } } },
    arcane: { name: 'Arcane', icon: '🔮', tiers: {
      2: { text: '+2 max HP', fx: { hp: 2 } },
      4: { text: 'Barrels explode for 3', fx: { rules: { blast: 3 } } },
      6: { text: 'Arcane supporters give +1 more, Mages +1 ATK', fx: { arcAmount: 1, mageAtk: 1 } } } },
    undead: { name: 'Undead', icon: '💀', tiers: {
      2: { text: '+4 max HP', fx: { hp: 4 } },
      4: { text: 'Last Breath: once per battle a lethal blow leaves 1 HP', fx: { rules: { stand: 1 } } },
      6: { text: 'Lifebloom: heal 1 HP every turn', fx: { rules: { mend: 1 } } } } },
  };
  const TRAIT_STEPS = [2, 4, 6];

  // Every unit the player can own. `need` = boss that must be beaten first; `cost` = Souls (Commons only; Rare and above are pulled with Crystals).
  //   rarity, trait: see RARITY / TRAITS. stats: overrides of the card type's numbers (atk, range, pattern, block, amount).
  //   fx: per-card engine effects (ignoreArmor, chain, see engine.js). rule: engine rule flags the unit grants to the whole run while
  //   it is in the squad (revive = Phoenix Archer). perk: one line shown in the Squad / Recruit tabs.
  const U = (o) => Object.assign({ rarity: 'common' }, o);
  const ROSTER = [
    U({ id: 'sword1',  type: 'swordsman', trait: 'wild',   start: true }),
    U({ id: 'archer1', type: 'archer',    trait: 'wild',   start: true }),
    U({ id: 'drum1',   type: 'drummer',   trait: 'arcane', start: true }),
    U({ id: 'shield1', type: 'shield',    trait: 'order',  start: true, block: 2 }),
    U({ id: 'spear1',  type: 'spearman',  trait: 'order',  cost: 30 }),
    U({ id: 'archer2', type: 'archer',    trait: 'wild',   cost: 35 }),
    U({ id: 'banner1', type: 'banner',    trait: 'order',  cost: 45, need: 'meadow' }),
    U({ id: 'horn1',   type: 'horn',      trait: 'arcane', cost: 70, need: 'meadow' }),
    U({ id: 'mage1',   type: 'mage',      trait: 'arcane', cost: 70, need: 'forest' }),
    U({ id: 'sword2',  type: 'swordsman', trait: 'wild',   rarity: 'rare', stats: { atk: 4 }, perk: 'Ruyi Staff: hits for 4 instead of 3' }),
    U({ id: 'shield2', type: 'shield',    trait: 'order',  rarity: 'rare', stats: { block: 3 }, perk: 'Bronze plating: blocks 3 instead of 2' }),
    U({ id: 'spy1',    type: 'spyglass',  trait: 'arcane', cost: 90, need: 'bamboo' }),
    U({ id: 'drum2',   type: 'drummer',   trait: 'arcane', rarity: 'rare', stats: { amount: 2 }, perk: 'Thunder drums: +2 ATK instead of +1' }),
    U({ id: 'spear2',  type: 'spearman',  trait: 'arcane', rarity: 'rare', stats: { atk: 3 }, perk: 'Lightning spear: hits for 3 instead of 2' }),
    U({ id: 'horn2',   type: 'horn',      trait: 'wild',   cost: 220, need: ['coral', 'oasis'] }),
    U({ id: 'mage2',   type: 'mage',      trait: 'arcane', rarity: 'rare', stats: { atk: 2 }, perk: 'Jaguar moon: hits for 2 instead of 1' }),
    U({ id: 'ushabti1', type: 'shield',    trait: 'undead', cost: 160, need: 'temple', block: 2 }),
    // Rare / Epic / Legendary units with rule effects. Rare and above come only from the gacha (WP11): no Souls cost, no boss gate.
    U({ id: 'longbow1', type: 'archer', trait: 'undead', rarity: 'rare', stats: { atk: 2, range: 5 }, fx: { ignoreArmor: 1 }, perk: 'Range 5; arrows ignore armor' }),
    U({ id: 'storm1',   type: 'mage',   trait: 'arcane', rarity: 'epic', stats: { atk: 2, range: 3 }, fx: { chain: 1 }, perk: 'Lightning chains to one more enemy next to a struck one' }),
    U({ id: 'phoenix1', type: 'archer', trait: 'wild',   rarity: 'legendary', stats: { atk: 3, range: 5, pattern: 'pierce' }, rule: { revive: 1 }, perk: 'Pierces every row; once per run you rise again at half HP' }),
  ];
  const ROSTER_BY = Object.fromEntries(ROSTER.map((u) => [u.id, u]));

  // Camp upgrades bought with Souls. Each level's cost is listed.
  const UPGRADES = [
    { id: 'vitality', name: 'Vitality',  icon: '❤️', desc: '+3 max HP',                       costs: [15, 35, 70, 120, 190, 280, 420] },
    { id: 'command',  name: 'Command',   icon: '🎖️', desc: '+1 Command Point',              costs: [25, 60, 120, 200, 300] },
    { id: 'drill',    name: 'Drill',     icon: '⚔️', desc: '+1 ATK to every attacker',        costs: [60, 180, 420, 800] },
    { id: 'bulwark',  name: 'Bulwark',   icon: '🛡️', desc: '+1 block to every Shield',        costs: [30, 100, 220, 420] },
    { id: 'fortune',  name: 'Fortune',   icon: '✦',  desc: '+20% Souls from battles',         costs: [40, 110, 230, 450] },
    { id: 'provisions', name: 'Provisions', icon: '🎒', desc: '+2 starting Supplies (battles per run)', costs: [20, 60, 140, 250] },
  ];
  const UPGRADE_BY = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
  const BASE_HP = 20;
  const BASE_CP = 8;   // Command Points: a Common unit costs 1, Rare 2, Epic 3, Legendary 4
const BASE_SUPPLIES = 8;   // battles a fresh account can fight per run
const SUPPLIES_PER_BOSS = 3; // the first boss of a run adds this many Supplies (WP18 pacing: 4 let strong runs snowball to 90+ battles)
const BOSS_SUPPLY_STEP = 2;  // ...and every further boss in the same run adds this much less; below 0 it just costs 1 Supply like any fight (3, +1, then -1)
const bossSupplies = (bossesDown) => Math.max(-1, SUPPLIES_PER_BOSS - BOSS_SUPPLY_STEP * (bossesDown || 0)); // net Supplies change for the next boss win
const Items = () => root.Items;
const gear = (s) => (Items() ? Items().bonuses(s) : { atk: {}, amount: {}, range: {}, block: 0, hp: 0, supplies: 0, souls: 0, rules: {}, horn: false });

  const SAVE_KEY = 'tile-defense-world-v3';
  const UNIT_CP = (id) => RARITY[ROSTER_BY[id].rarity].cp;

  function freshSave() {
    return {
      souls: 0,
      crystals: 0,              // 💎 premium-ish currency: first boss kills, bounties, achievements; spent on gacha pulls (WP11)
      dust: 0,                  // ⚒ crafting currency: salvage and duplicates; spent in the Forge (WP9)
      units: {},                // WP11: per owned unit { stars: 1-5 (duplicates), xp: mastery points }; absent = stars 1, xp 0
      pity: 0,                  // WP11: gacha pulls since the last Epic
      seals: {},                // WP11: Recruitment Office seals per rarity (from duplicates)
      bountiesDone: 0,          // completed bounties, lifetime
      upgrades: {},
      owned: ROSTER.filter((u) => u.start).map((u) => u.id),
      squad: ROSTER.filter((u) => u.start).map((u) => u.id),
      unlocked: ['meadow'],     // sub-areas visible on the map
      bossesBeaten: [],         // sub-area ids whose boss has fallen at least once
      runs: 0,
      bestLevel: 0,
      bestPath: [],
      lastPath: [],
      prevBestPath: [],         // the best route before the current bestPath (drawn as a second ghost)
      items: [],                // owned equipment item ids (permanent)
      itemData: {},             // WP8: per owned item { lv: item level, subs: [{kind, type, amount}] }
      loadout: { weapon: null, armor: null, banner: null, ring1: null, ring2: null }, // WP8: equipped item id per slot
      luck: {},                 // WP8 bad-luck protection: wins without the unique item (node id) / boss Legendary ('L:' + node id)
      tokens: {},               // WP8 boss tokens per boss node id (Items.TOKENS_NEEDED buys a Legendary)
      run: null,
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const s = Object.assign(freshSave(), JSON.parse(raw));
        s.unlocked = s.unlocked.filter((id) => root.World && root.World.SUB_BY[id]);
        if (!s.unlocked.length) s.unlocked = ['meadow'];
        s.squad = s.squad.filter((id) => ROSTER_BY[id] && s.owned.includes(id));
        fitSquad(s);       // WP10: old saves counted slots; Rare units now cost more Command Points
        if (root.Items) root.Items.migrate(s); // WP8: old saves have a flat `equipped` list and no item levels
        return s;
      }
    } catch (e) { /* storage unavailable: play without saving */ }
    return freshSave();
  }
  // ---------- Currencies ----------
  // One place for every wallet balance so later packages (Forge: dust, Gacha: crystals) share the same helpers.
  const CURRENCIES = {
    souls:    { name: 'Souls',    icon: '✦' },
    crystals: { name: 'Crystals', icon: '💎' },
    dust:     { name: 'Dust',     icon: '⚒' },
  };
  const balance = (s, cur) => Math.max(0, Math.floor(s[cur] || 0));
  const canSpend = (s, cur, n) => n >= 0 && balance(s, cur) >= n;
  function earn(s, cur, n) { n = Math.max(0, Math.floor(n)); s[cur] = balance(s, cur) + n; return n; }
  // Deducts n and returns true, or returns false (and changes nothing) if the balance is too low.
  function spend(s, cur, n) { n = Math.floor(n); if (!canSpend(s, cur, n)) return false; s[cur] = balance(s, cur) - n; return true; }
  // Spend several currencies at once ({ dust: 5, souls: 20 }); all or nothing.
  function spendAll(s, cost) {
    if (!Object.keys(cost).every((c) => canSpend(s, c, cost[c]))) return false;
    for (const c of Object.keys(cost)) spend(s, c, cost[c]);
    return true;
  }
  // Crystals for the first defeat of a sub-area boss (3 in region 1, +1 per region).
  const bossCrystals = (regionIndex) => 3 + (regionIndex || 0);


  // ---------- Gacha, duplicate stars and mastery (WP11) ----------
  const PULL_COST = 3, PULL10_COST = 27;          // Crystals
  const ODDS = { common: 62, rare: 28, epic: 9, legendary: 1 }; // percent per pull
  const PITY_AT = 30;                              // the 30th pull since the last Epic (or better) is an Epic
  const MAX_STARS = 5;
  // Dust for a duplicate of a unit already at 5 stars; Recruitment Office seals needed per rarity.
  const MAXED_DUST = { common: 3, rare: 8, epic: 20, legendary: 50 };
  const OFFICE_COST = { common: 4, rare: 6, epic: 8, legendary: 10 };
  const MASTERY_XP = [0, 30, 80, 150, 250];        // xp needed for mastery level 1..5 (1 xp per battle won, 2 for a boss)
  const MASTERY_PERKS = ['', '+1 HP (shared)', '+1% Souls', '+1 HP (shared)', 'Veteran: +1 to the main stat'];
  const STAR_TEXT = ['', '', '+1 HP (shared)', '+1 main stat', '+1 HP (shared)', 'Ascended: +1 range / block / boost'];
  const unitOf = (s, id) => (s.units && s.units[id]) || { stars: 1, xp: 0 };
  const starsOf = (s, id) => Math.max(1, Math.min(MAX_STARS, unitOf(s, id).stars || 1));
  const masteryLevel = (xp) => { let l = 1; for (let i = 1; i < MASTERY_XP.length; i++) if (xp >= MASTERY_XP[i]) l = i + 1; return l; };
  const masteryOf = (s, id) => { const xp = unitOf(s, id).xp || 0, lv = masteryLevel(xp); return { xp, lv, next: lv < MASTERY_XP.length ? MASTERY_XP[lv] : null, from: MASTERY_XP[lv - 1] }; };
  // Squad-wide extras from stars and mastery: hp points are shared (2 points = 1 max HP), souls in percent.
  function growthFx(s) {
    let pts = 0, souls = 0;
    for (const id of s.squad) {
      const st = starsOf(s, id), ml = masteryOf(s, id).lv;
      pts += (st >= 2 ? 1 : 0) + (st >= 4 ? 1 : 0) + (ml >= 2 ? 1 : 0) + (ml >= 4 ? 1 : 0);
      if (ml >= 3) souls += 1;
    }
    return { hp: Math.floor(pts / 2), souls };
  }
  function addXp(s, ids, n) {
    s.units = s.units || {};
    for (const id of ids) { const u = s.units[id] || (s.units[id] = { stars: 1, xp: 0 }); u.xp = (u.xp || 0) + n; }
  }
  const recruitable = (u) => u.rarity === 'common' && u.cost !== undefined; // direct boss-gated recruits are a Common-only fallback
  // Units a pull of this rarity can give. Commons respect boss gates; Rare and above never do.
  function poolFor(s, rarity) {
    return ROSTER.filter((u) => u.rarity === rarity && (rarity !== 'common' || u.start || recruitAvailable(s, u)));
  }
  // Gives the player a unit (new, or a duplicate: +1 star, a seal, or Dust once at 5 stars). Returns a result record.
  function grantUnit(s, id) {
    const u = ROSTER_BY[id]; s.units = s.units || {}; s.seals = s.seals || {};
    const res = { id, rarity: u.rarity, isNew: !s.owned.includes(id), stars: 1, dust: 0, seal: 0, starUp: false };
    if (res.isNew) { s.owned.push(id); s.units[id] = Object.assign({ stars: 1, xp: 0 }, s.units[id]); if (!canAdd(s, id)) s.squad.push(id); return res; }
    const rec = s.units[id] || (s.units[id] = { stars: 1, xp: 0 });
    rec.stars = starsOf(s, id);
    if (rec.stars < MAX_STARS) { rec.stars++; res.starUp = true; }
    else res.dust = earn(s, 'dust', MAXED_DUST[u.rarity]);
    res.stars = rec.stars; res.seal = 1; s.seals[u.rarity] = (s.seals[u.rarity] || 0) + 1;
    return res;
  }
  // One pull: rnd() returns [0,1). Pity: the PITY_AT-th pull since the last Epic or Legendary is an Epic.
  function pullOnce(s, rnd) {
    s.pity = (s.pity || 0) + 1;
    let rarity, pityHit = false;
    if (s.pity >= PITY_AT) { rarity = 'epic'; pityHit = true; }
    else { let r = rnd() * 100; rarity = 'common'; for (const k of ['legendary', 'epic', 'rare']) { if (r < ODDS[k]) { rarity = k; break; } r -= ODDS[k]; } }
    if (rarity === 'epic' || rarity === 'legendary') s.pity = 0;
    const pool = poolFor(s, rarity);
    const res = grantUnit(s, pool[Math.floor(rnd() * pool.length)].id);
    res.pityHit = pityHit; return res;
  }
  // n pulls for Crystals (1 or 10); returns the list of results, or null if you cannot pay.
  function pull(s, n, rnd) {
    if (!spend(s, 'crystals', n === 10 ? PULL10_COST : PULL_COST * n)) return null;
    const out = []; for (let i = 0; i < n; i++) out.push(pullOnce(s, rnd)); return out;
  }
  // Recruitment Office: spend seals of a rarity to take any unit of that rarity (new, or +1 star). Returns result or null.
  function officeTrade(s, id) {
    const u = ROSTER_BY[id]; if (!u) return null;
    s.seals = s.seals || {};
    if ((s.seals[u.rarity] || 0) < OFFICE_COST[u.rarity]) return null;
    if (s.owned.includes(id) && starsOf(s, id) >= MAX_STARS) return null;
    s.seals[u.rarity] -= OFFICE_COST[u.rarity];
    const res = grantUnit(s, id); s.seals[u.rarity] -= res.seal; // a trade does not refund a seal
    res.seal = 0; return res;
  }

  function save(s) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
  }
  function reset() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
    return freshSave();
  }

  const level = (s, id) => s.upgrades[id] || 0;
  // ---------- Squad: Command Points, the supporter rule, trait bonuses ----------
  const commandCap = (s) => BASE_CP + level(s, 'command');
  const squadCp = (s, ids) => (ids || s.squad).reduce((n, id) => n + UNIT_CP(id), 0);
  const roleOf = (id) => Engine.CARD_TYPES[ROSTER_BY[id].type].role;
  // Why this squad may not set out (a message), or null. Needs an attacker and a supporter, within the Command Point cap.
  function squadProblem(s, ids) {
    ids = ids || s.squad;
    if (!ids.some((id) => roleOf(id) === 'attacker')) return 'Your squad needs at least one attacker.';
    if (!ids.some((id) => roleOf(id) === 'support')) return 'Your squad needs at least one supporter (Drummer, Banner, War Horn or Spyglass).';
    if (squadCp(s, ids) > commandCap(s)) return 'Your squad costs ' + squadCp(s, ids) + ' Command Points but the cap is ' + commandCap(s) + '.';
    return null;
  }
  // Can this unit join the squad? Returns null or the reason.
  function canAdd(s, id) {
    if (s.squad.includes(id)) return null;
    return squadCp(s, s.squad.concat(id)) > commandCap(s) ? 'Not enough Command Points (' + squadCp(s) + '/' + commandCap(s) + ' used, this unit costs ' + UNIT_CP(id) + ').' : null;
  }
  // Drops units from the back of the squad until it fits the cap (old saves, fewer Command levels).
  function fitSquad(s) {
    while (s.squad.length && squadCp(s) > commandCap(s)) s.squad.pop();
    return s;
  }
  // Trait counts of a squad, and the bonuses that are active: [{ trait, count, step, text }] for every reached step.
  function activeTraits(s, ids) {
    const count = {};
    for (const id of ids || s.squad) { const t = ROSTER_BY[id].trait; count[t] = (count[t] || 0) + 1; }
    const out = [];
    for (const t of Object.keys(TRAITS)) for (const step of TRAIT_STEPS) if ((count[t] || 0) >= step) out.push({ trait: t, count: count[t], step, text: TRAITS[t].tiers[step].text, fx: TRAITS[t].tiers[step].fx });
    return out;
  }
  const traitCounts = (s, ids) => { const c = {}; for (const id of ids || s.squad) { const t = ROSTER_BY[id].trait; c[t] = (c[t] || 0) + 1; } return c; };
  // Summed numeric trait effects of the current squad.
  function traitFx(s) {
    const f = { hp: 0, souls: 0, block: 0, wildAtk: 0, mageAtk: 0, arcAmount: 0, rules: {} };
    for (const a of activeTraits(s)) for (const k of Object.keys(a.fx)) {
      if (k === 'rules') for (const r of Object.keys(a.fx.rules)) f.rules[r] = r === 'blast' ? Math.max(f.rules[r] || 0, a.fx.rules[r]) : (f.rules[r] || 0) + a.fx.rules[r];
      else f[k] += a.fx[k];
    }
    return f;
  }
  // Engine rule flags for a battle: equipment Legendaries + squad traits + unit rules (Phoenix revive, spent once per run: run.reviveUsed).
  function rulesFor(s, run) {
    const out = Object.assign({}, Items() ? Items().rules(s) : {});
    const add = (r) => { for (const k of Object.keys(r)) out[k] = k === 'blast' ? Math.max(out[k] || 0, r[k]) : (out[k] || 0) + r[k]; };
    add(traitFx(s).rules);
    for (const id of s.squad) if (ROSTER_BY[id].rule && !(ROSTER_BY[id].rule.revive && run && run.reviveUsed)) add(ROSTER_BY[id].rule);
    // WP12: relics picked on this run (run.relics, ids from relics.js).
    if (run && run.relics && run.relics.length) { const R = typeof window !== 'undefined' ? window.Relics : require('./relics.js'); add(R.rules(run.relics)); }
    return out;
  }

  const maxHp = (s) => BASE_HP + 3 * level(s, 'vitality') + gear(s).hp + traitFx(s).hp + growthFx(s).hp;
  const slots = commandCap; // legacy name
  const soulRate = (s) => 1 + 0.2 * level(s, 'fortune') + (gear(s).souls + traitFx(s).souls + growthFx(s).souls) / 100;
const startSupplies = (s) => BASE_SUPPLIES + 2 * level(s, 'provisions') + gear(s).supplies;
  function upgradeCost(s, id) {
    const u = UPGRADE_BY[id]; const lv = level(s, id);
    return lv < u.costs.length ? u.costs[lv] : null;
  }
  // The cheapest next Camp upgrade (first-run guarantee, design 24.1).
  function cheapestUpgrade(s) {
    let best = null;
    for (const u of UPGRADES) { const c = upgradeCost(s, u.id); if (c !== null && (!best || c < best.cost)) best = { id: u.id, cost: c }; }
    return best;
  }
  function recruitAvailable(s, unit) {
    if (unit.rarity !== 'common') return false; // WP11: Rare and above come from the gacha
    if (!unit.need) return true;
    const need = Array.isArray(unit.need) ? unit.need : [unit.need];
    return need.some((b) => s.bossesBeaten.includes(b));
  }

  // The army handed to the battle engine: roster stats + Camp upgrades + run buffs.
  function buildArmy(s, mods) {
    const g = gear(s), tf = traitFx(s);
    return s.squad.map((id) => {
      const def = ROSTER_BY[id];
      const t = Engine.CARD_TYPES[def.type];
      const base = (f) => (def.stats && def.stats[f] !== undefined ? def.stats[f] : t[f]);
      const m = (mods && mods[id]) || {};
      const card = { id, type: def.type };
      const st = starsOf(s, id), vet = masteryOf(s, id).lv >= 5 ? 1 : 0, star3 = st >= 3 ? 1 : 0, star5 = st >= 5 ? 1 : 0;
      let upgraded = false;
      if (t.role === 'attacker') {
        const wild = def.trait === 'wild' ? tf.wildAtk : 0, mage = def.type === 'mage' ? tf.mageAtk : 0;
        card.atk = base('atk') + star3 + vet + level(s, 'drill') + (m.atk || 0) + (g.atk[def.type] || 0) + wild + mage;
        card.range = base('range') + star5 + (m.range || 0) + (g.range[def.type] || 0);
        upgraded = card.atk !== base('atk') || card.range !== base('range');
        if (def.stats && def.stats.pattern) card.pattern = def.stats.pattern;
        if (def.fx) card.fx = def.fx;
      } else if (t.role === 'defender') {
        const b0 = def.block || base('block');
        card.block = b0 + star3 + star5 + vet + level(s, 'bulwark') + (m.block || 0) + g.block + tf.block;
        upgraded = card.block !== b0 || level(s, 'bulwark') > 0;
      } else if (t.role === 'support') {
        // Legendary rule: the first War Horn in the squad multiplies by 3.
        const b0 = def.type === 'horn' && g.horn && s.squad.find((x) => ROSTER_BY[x].type === 'horn') === id ? 3 : base('amount');
        card.amount = b0 + (t.effect === 'mult' ? 0 : star3 + star5) + (m.amount || 0) + (g.amount[def.type] || 0) + (def.trait === 'arcane' && t.effect === 'atk' ? tf.arcAmount : 0);
        upgraded = card.amount !== base('amount');
      }
      if (upgraded || st > 1) card.upgraded = true;
      return card;
    });
  }

  const Progress = {
    ROSTER, ROSTER_BY, RARITY, TRAITS, TRAIT_STEPS, BASE_CP, UPGRADES, UPGRADE_BY, BASE_HP, BASE_SUPPLIES, SUPPLIES_PER_BOSS, bossSupplies,
    PULL_COST, PULL10_COST, ODDS, PITY_AT, MAX_STARS, MAXED_DUST, OFFICE_COST, MASTERY_XP, MASTERY_PERKS, STAR_TEXT,
    starsOf, masteryOf, masteryLevel, growthFx, addXp, poolFor, grantUnit, pullOnce, pull, officeTrade, recruitable,
    CURRENCIES, balance, canSpend, earn, spend, spendAll, bossCrystals,
    commandCap, squadCp, squadProblem, canAdd, fitSquad, activeTraits, traitCounts, traitFx, rulesFor, unitCp: UNIT_CP,
    freshSave, load, save, reset, level, maxHp, slots, soulRate, startSupplies, upgradeCost, cheapestUpgrade, recruitAvailable, buildArmy,
  };
  root.Progress = Progress;
  if (typeof module !== 'undefined' && module.exports) module.exports = Progress;
})(typeof window !== 'undefined' ? window : globalThis);
