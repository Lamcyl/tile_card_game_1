// Permanent progression (Souls, Camp upgrades, roster) and the save file.
(function (root) {
  'use strict';
  const Engine = root.Engine;

  // Every unit the player can own. `need` = boss that must be beaten first.
  const ROSTER = [
    { id: 'sword1',  type: 'swordsman', start: true },
    { id: 'archer1', type: 'archer',    start: true },
    { id: 'drum1',   type: 'drummer',   start: true },
    { id: 'shield1', type: 'shield',    start: true, block: 2 },
    { id: 'spear1',  type: 'spearman',  cost: 30 },
    { id: 'archer2', type: 'archer',    cost: 35 },
    { id: 'banner1', type: 'banner',    cost: 45, need: 'meadow' },
    { id: 'horn1',   type: 'horn',      cost: 70, need: 'meadow' },
    { id: 'mage1',   type: 'mage',      cost: 70, need: 'forest' },
    { id: 'sword2',  type: 'swordsman', cost: 100, need: 'forest' },
    { id: 'shield2', type: 'shield',    cost: 100, need: 'forest', block: 2 },
    { id: 'spy1',    type: 'spyglass',  cost: 90, need: 'bamboo' },
    { id: 'drum2',   type: 'drummer',   cost: 100, need: 'bamboo' },
    { id: 'spear2',  type: 'spearman',  cost: 150, need: ['coral', 'oasis'] },
    { id: 'horn2',   type: 'horn',      cost: 220, need: ['coral', 'oasis'] },
    { id: 'mage2',   type: 'mage',      cost: 260, need: ['snow', 'ash'] },
  ];
  const ROSTER_BY = Object.fromEntries(ROSTER.map((u) => [u.id, u]));

  // Camp upgrades bought with Souls. Each level's cost is listed.
  const UPGRADES = [
    { id: 'vitality', name: 'Vitality',  icon: '❤️', desc: '+3 max HP',                       costs: [15, 35, 70, 120, 190, 280, 420] },
    { id: 'command',  name: 'Command',   icon: '🎖️', desc: '+1 squad slot',                   costs: [25, 60, 120, 200, 300] },
    { id: 'drill',    name: 'Drill',     icon: '⚔️', desc: '+1 ATK to every attacker',        costs: [60, 180, 420, 800] },
    { id: 'bulwark',  name: 'Bulwark',   icon: '🛡️', desc: '+1 block to every Shield',        costs: [30, 100, 220, 420] },
    { id: 'fortune',  name: 'Fortune',   icon: '✦',  desc: '+20% Souls from battles',         costs: [40, 110, 230, 450] },
    { id: 'provisions', name: 'Provisions', icon: '🎒', desc: '+2 starting Supplies (battles per run)', costs: [20, 60, 140, 250] },
  ];
  const UPGRADE_BY = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
  const BASE_HP = 20;
  const BASE_SLOTS = 5;
const BASE_SUPPLIES = 8;   // battles a fresh account can fight per run
const SUPPLIES_PER_BOSS = 4; // a boss victory adds this many Supplies
const Items = () => root.Items;
const gear = (s) => (Items() ? Items().bonuses(s) : { atk: {}, amount: {}, range: {}, block: 0, hp: 0, supplies: 0, souls: 0, rules: {}, horn: false });

  const SAVE_KEY = 'tile-defense-world-v3';

  function freshSave() {
    return {
      souls: 0,
      crystals: 0,              // 💎 premium-ish currency: first boss kills, bounties, achievements; spent on gacha pulls (WP11)
      dust: 0,                  // ⚒ crafting currency: salvage and duplicates; spent in the Forge (WP9)
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

  function save(s) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
  }
  function reset() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
    return freshSave();
  }

  const level = (s, id) => s.upgrades[id] || 0;
  const maxHp = (s) => BASE_HP + 3 * level(s, 'vitality') + gear(s).hp;
  const slots = (s) => BASE_SLOTS + level(s, 'command');
  const soulRate = (s) => 1 + 0.2 * level(s, 'fortune') + gear(s).souls / 100;
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
    if (!unit.need) return true;
    const need = Array.isArray(unit.need) ? unit.need : [unit.need];
    return need.some((b) => s.bossesBeaten.includes(b));
  }

  // The army handed to the battle engine: roster stats + Camp upgrades + run buffs.
  function buildArmy(s, mods) {
    const g = gear(s);
    return s.squad.map((id) => {
      const def = ROSTER_BY[id];
      const t = Engine.CARD_TYPES[def.type];
      const m = (mods && mods[id]) || {};
      const card = { id, type: def.type };
      let upgraded = false;
      if (t.role === 'attacker') {
        card.atk = t.atk + level(s, 'drill') + (m.atk || 0) + (g.atk[def.type] || 0);
        card.range = t.range + (m.range || 0) + (g.range[def.type] || 0);
        upgraded = card.atk !== t.atk || card.range !== t.range;
      } else if (t.role === 'defender') {
        card.block = (def.block || t.block) + level(s, 'bulwark') + (m.block || 0) + g.block;
        upgraded = card.block !== (def.block || t.block) || level(s, 'bulwark') > 0;
      } else if (t.role === 'support') {
        // Legendary rule: the first War Horn in the squad multiplies by 3.
        const hornBase = def.type === 'horn' && g.horn && s.squad.find((x) => ROSTER_BY[x].type === 'horn') === id ? 3 : t.amount;
        card.amount = hornBase + (m.amount || 0) + (g.amount[def.type] || 0);
        upgraded = card.amount !== t.amount;
      }
      if (upgraded) card.upgraded = true;
      return card;
    });
  }

  const Progress = {
    ROSTER, ROSTER_BY, UPGRADES, UPGRADE_BY, BASE_HP, BASE_SUPPLIES, SUPPLIES_PER_BOSS,
    CURRENCIES, balance, canSpend, earn, spend, spendAll, bossCrystals,
    freshSave, load, save, reset, level, maxHp, slots, soulRate, startSupplies, upgradeCost, cheapestUpgrade, recruitAvailable, buildArmy,
  };
  root.Progress = Progress;
  if (typeof module !== 'undefined' && module.exports) module.exports = Progress;
})(typeof window !== 'undefined' ? window : globalThis);
