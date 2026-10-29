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
    { id: 'mage1',   type: 'mage',      cost: 55, need: 'forest' },
    { id: 'sword2',  type: 'swordsman', cost: 60, need: 'forest' },
    { id: 'shield2', type: 'shield',    cost: 60, need: 'forest', block: 2 },
    { id: 'spy1',    type: 'spyglass',  cost: 70, need: ['beach', 'dunes'] },
    { id: 'drum2',   type: 'drummer',   cost: 80, need: ['beach', 'dunes'] },
    { id: 'spear2',  type: 'spearman',  cost: 110, need: ['coral', 'temple'] },
    { id: 'horn2',   type: 'horn',      cost: 160, need: ['coral', 'temple'] },
    { id: 'mage2',   type: 'mage',      cost: 180, need: ['snow', 'ash'] },
  ];
  const ROSTER_BY = Object.fromEntries(ROSTER.map((u) => [u.id, u]));

  // Camp upgrades bought with Souls. Each level's cost is listed.
  const UPGRADES = [
    { id: 'vitality', name: 'Vitality',  icon: '❤️', desc: '+3 max HP',                       costs: [15, 30, 50, 80, 120, 170] },
    { id: 'command',  name: 'Command',   icon: '🎖️', desc: '+1 squad slot',                   costs: [25, 50, 90, 140, 200] },
    { id: 'drill',    name: 'Drill',     icon: '⚔️', desc: '+1 ATK to every attacker',        costs: [60, 150, 300] },
    { id: 'bulwark',  name: 'Bulwark',   icon: '🛡️', desc: '+1 block to every Shield',        costs: [30, 80, 160] },
    { id: 'fortune',  name: 'Fortune',   icon: '✦',  desc: '+20% Souls from battles',         costs: [40, 90, 160] },
  ];
  const UPGRADE_BY = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
  const BASE_HP = 20;
  const BASE_SLOTS = 5;

  const SAVE_KEY = 'tile-defense-world-v1';

  function freshSave() {
    return {
      souls: 0,
      upgrades: {},
      owned: ROSTER.filter((u) => u.start).map((u) => u.id),
      squad: ROSTER.filter((u) => u.start).map((u) => u.id),
      unlocked: ['meadow'],     // sub-areas visible on the map
      bossesBeaten: [],         // sub-area ids whose boss has fallen at least once
      runs: 0,
      bestLevel: 0,
      bestPath: [],
      lastPath: [],
      run: null,
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return Object.assign(freshSave(), JSON.parse(raw));
    } catch (e) { /* storage unavailable: play without saving */ }
    return freshSave();
  }
  function save(s) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
  }
  function reset() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
    return freshSave();
  }

  const level = (s, id) => s.upgrades[id] || 0;
  const maxHp = (s) => BASE_HP + 3 * level(s, 'vitality');
  const slots = (s) => BASE_SLOTS + level(s, 'command');
  const soulRate = (s) => 1 + 0.2 * level(s, 'fortune');
  function upgradeCost(s, id) {
    const u = UPGRADE_BY[id]; const lv = level(s, id);
    return lv < u.costs.length ? u.costs[lv] : null;
  }
  function recruitAvailable(s, unit) {
    if (!unit.need) return true;
    const need = Array.isArray(unit.need) ? unit.need : [unit.need];
    return need.some((b) => s.bossesBeaten.includes(b));
  }

  // The army handed to the battle engine: roster stats + Camp upgrades + run buffs.
  function buildArmy(s, mods) {
    return s.squad.map((id) => {
      const def = ROSTER_BY[id];
      const t = Engine.CARD_TYPES[def.type];
      const m = (mods && mods[id]) || {};
      const card = { id, type: def.type };
      let upgraded = false;
      if (t.role === 'attacker') {
        card.atk = t.atk + level(s, 'drill') + (m.atk || 0);
        card.range = t.range + (m.range || 0);
        upgraded = card.atk !== t.atk || card.range !== t.range;
      } else if (t.role === 'defender') {
        card.block = (def.block || t.block) + level(s, 'bulwark') + (m.block || 0);
        upgraded = card.block !== (def.block || t.block) || level(s, 'bulwark') > 0;
      } else if (t.role === 'support') {
        card.amount = t.amount + (m.amount || 0);
        upgraded = card.amount !== t.amount;
      }
      if (upgraded) card.upgraded = true;
      return card;
    });
  }

  const Progress = {
    ROSTER, ROSTER_BY, UPGRADES, UPGRADE_BY, BASE_HP,
    freshSave, load, save, reset, level, maxHp, slots, soulRate, upgradeCost, recruitAvailable, buildArmy,
  };
  root.Progress = Progress;
  if (typeof module !== 'undefined' && module.exports) module.exports = Progress;
})(typeof window !== 'undefined' ? window : globalThis);
