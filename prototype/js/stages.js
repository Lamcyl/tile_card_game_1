// Mid-run stages for the prototype. Each stage snapshots the run at that
// point: the hero's carried-over HP and the army collected so far.
// Enemy rows: 1 = front, 0 = back.
(function (root) {
  'use strict';

  const STAGES = [
    {
      id: 'stage6',
      number: 6,
      name: 'Powder Alley',
      hint: 'Barrels explode when destroyed, damaging every enemy next to them.',
      heroHp: 17, heroMaxHp: 20,
      army: [
        { id: 'sword',   type: 'swordsman' },
        { id: 'archer',  type: 'archer' },
        { id: 'spear',   type: 'spearman' },
        { id: 'drum',    type: 'drummer' },
        { id: 'horn',    type: 'horn' },
        { id: 'shield',  type: 'shield', block: 2 },
      ],
      enemies: [
        { type: 'barrel', row: 1, col: 2, hp: 1 },
        { type: 'orc',    row: 1, col: 3, hp: 6, atk: 3 },
        { type: 'goblin', row: 0, col: 2, hp: 2, atk: 2 },
        { type: 'goblin', row: 0, col: 3, hp: 2, atk: 2 },
        { type: 'goblin', row: 0, col: 4, hp: 3, atk: 2 },
      ],
    },
    {
      id: 'stage9',
      number: 9,
      name: 'The Iron Line',
      hint: 'Knights have armor: every hit deals 1 less damage. One big hit beats many small ones.',
      heroHp: 14, heroMaxHp: 20,
      army: [
        { id: 'sword',   type: 'swordsman', atk: 4, upgraded: true },
        { id: 'archer',  type: 'archer' },
        { id: 'spear',   type: 'spearman' },
        { id: 'mage',    type: 'mage' },
        { id: 'drum',    type: 'drummer' },
        { id: 'banner',  type: 'banner' },
        { id: 'horn',    type: 'horn' },
        { id: 'shield',  type: 'shield' },
      ],
      enemies: [
        { type: 'goblin', row: 1, col: 0, hp: 3, atk: 2 },
        { type: 'barrel', row: 1, col: 1, hp: 1 },
        { type: 'knight', row: 1, col: 2, hp: 6, atk: 4, armor: 1 },
        { type: 'barrel', row: 1, col: 3, hp: 1 },
        { type: 'goblin', row: 1, col: 4, hp: 3, atk: 2 },
        { type: 'archer', row: 0, col: 1, hp: 3, atk: 3 },
        { type: 'orc',    row: 0, col: 2, hp: 5, atk: 3 },
        { type: 'goblin', row: 0, col: 4, hp: 4, atk: 1 },
      ],
    },
    {
      id: 'stage12',
      number: 12,
      name: 'The Siege',
      hint: 'You probably cannot win this in one turn. Kill the biggest threats and shield the rest.',
      heroHp: 11, heroMaxHp: 20,
      army: [
        { id: 'sword',   type: 'swordsman', atk: 4, upgraded: true },
        { id: 'archer',  type: 'archer', atk: 3, upgraded: true },
        { id: 'spear',   type: 'spearman' },
        { id: 'mage',    type: 'mage' },
        { id: 'drum',    type: 'drummer' },
        { id: 'banner',  type: 'banner' },
        { id: 'horn',    type: 'horn' },
        { id: 'spy',     type: 'spyglass' },
        { id: 'shield',  type: 'shield' },
      ],
      enemies: [
        { type: 'knight', row: 1, col: 0, hp: 5, atk: 3, armor: 1 },
        { type: 'goblin', row: 1, col: 1, hp: 4, atk: 2 },
        { type: 'barrel', row: 1, col: 2, hp: 1 },
        { type: 'goblin', row: 1, col: 3, hp: 4, atk: 2 },
        { type: 'knight', row: 1, col: 4, hp: 5, atk: 3, armor: 1 },
        { type: 'orc',    row: 0, col: 0, hp: 6, atk: 3 },
        { type: 'archer', row: 0, col: 2, hp: 4, atk: 4 },
        { type: 'orc',    row: 0, col: 3, hp: 6, atk: 3 },
        { type: 'archer', row: 0, col: 4, hp: 3, atk: 3 },
      ],
    },
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = STAGES;
  else root.STAGES = STAGES;
})(typeof window !== 'undefined' ? window : globalThis);
