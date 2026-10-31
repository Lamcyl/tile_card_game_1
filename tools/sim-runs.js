// Balancing helper for the world map: plays whole runs with a strong
// (search-based) player and reports how far each run gets.
// Usage: node tools/sim-runs.js [runs]
'use strict';
const Engine = require('../prototype/js/engine.js');
const World = require('../prototype/js/world-data.js');
const Gen = require('../prototype/js/gen.js');
const Progress = require('../prototype/js/progress.js');
const Items = require('../prototype/js/items.js');

const TILES = [];
for (const r of Engine.PLAYER_ROWS) for (let c = 0; c < 5; c++) TILES.push(Engine.key(r, c));

function score(state, p, army) {
  const s = Engine.resolveTurn(state, p, army).state;
  if (s.status === 'cleared') return -1;
  const threat = s.enemies.filter(Engine.isThreat);
  return (state.hp - s.hp) + 0.6 * threat.reduce((n, e) => n + e.atk, 0) + 0.15 * threat.reduce((n, e) => n + e.hp, 0) + (s.status === 'defeated' ? 100 : 0);
}
function bestPlacement(state, army, iters = 2500, restarts = 4) {
  let best = null, bestV = Infinity;
  for (let k = 0; k < restarts; k++) {
    const t = TILES.slice().sort(() => Math.random() - 0.5);
    let cur = {}; army.forEach((c, i) => { cur[t[i]] = c.id; });
    let curV = score(state, cur, army);
    for (let i = 0; i < iters; i++) {
      const q = Object.assign({}, cur); const used = Object.keys(q);
      const from = used[Math.floor(Math.random() * used.length)], to = TILES[Math.floor(Math.random() * TILES.length)];
      const a = q[from], b = q[to]; q[to] = a; if (b) q[from] = b; else delete q[from];
      const v = score(state, q, army); const temp = 2 * (1 - i / iters) + 0.01;
      if (v < curV || Math.random() < Math.exp((curV - v) / temp)) { cur = q; curV = v; if (v < bestV) { best = q; bestV = v; } }
    }
  }
  return best;
}
function fight(node, hp, maxHp, army, seed) {
  const stage = Object.assign({ heroHp: hp, heroMaxHp: maxHp }, Gen.generateBattle(node, seed));
  let st = Engine.createState(stage);
  while (st.status === 'playing' && st.turn <= 6) st = Engine.resolveTurn(st, bestPlacement(st, army), army).state;
  return st;
}

// One run with free exploration: every spot in an unlocked sub-area is open. The player takes the
// lowest-level fight first (bosses last, or when nothing else is left), uses springs when hurt,
// and stops when Supplies run out or the hero falls. Items drop with their real chances and are auto-equipped.
function playRun(save0) {
  const save = JSON.parse(JSON.stringify(save0));
  const seed = 'sim' + Math.random();
  const mods = {};
  let hp = Progress.maxHp(save), supplies = Progress.startSupplies(save), cleared = new Set(), wins = 0, maxLv = 0, souls = 0, bosses = 0, items = 0, wonFirst = [];
  for (;;) {
    if (supplies <= 0) return { wins, maxLv, souls, bosses, items, end: 'supplies', start: Progress.startSupplies(save0), save };
    const open = World.nodes.filter((n) => n.type !== 'camp' && !cleared.has(n.id) && save.unlocked.includes(n.sub));
    const pois = open.filter((n) => n.type === 'shrine' || n.type === 'treasure');
    const fights = open.filter((n) => !pois.includes(n)).sort((a, b) => (a.type === 'boss') - (b.type === 'boss') || a.level - b.level);
    const spring = pois.find((n) => n.type === 'shrine'); // heal when below 60% HP
    if (spring && hp < Progress.maxHp(save) * 0.6) { cleared.add(spring.id); hp = Math.min(Progress.maxHp(save), hp + 8); continue; }
    const cache = pois.find((n) => n.type === 'treasure'); if (cache) { cleared.add(cache.id); souls += 10; continue; }
    if (!fights.length) return { wins, maxLv, souls, bosses, items, end: 'cleared', start: Progress.startSupplies(save0), save };
    const node = fights[0];
    cleared.add(node.id);
    const st = fight(node, hp, Progress.maxHp(save), Progress.buildArmy(save, mods), seed);
    if (st.status !== 'cleared') return { wins, maxLv, souls: Math.round(souls * 0.75), bosses, items, end: 'died', diedAt: node.level, start: Progress.startSupplies(save0), save };
    hp = st.hp; wins++; maxLv = Math.max(maxLv, node.level); souls += Gen.soulsFor(node) * Progress.soulRate(save);
    const drop = Items.rollDrop(save, node, seed) || (!save0.runs && wins === 2 && !items ? Items.guaranteedDrop(save, node) : null);
    if (drop) { items++; save.items.push(drop); if (save.equipped.length < Items.SLOTS) { save.equipped.push(drop); const it = Items.BY_ID[drop]; if (it.kind === 'hp') hp += it.amount; if (it.kind === 'supplies') supplies += it.amount; } }
    if (node.type === 'boss') {
      supplies += Progress.SUPPLIES_PER_BOSS; bosses++; souls += 25;
      if (!save.bossesBeaten.includes(node.sub)) { save.bossesBeaten.push(node.sub); for (const u of World.SUB_BY[node.sub].unlocks) if (!save.unlocked.includes(u)) save.unlocked.push(u); }
    } else supplies -= 1;
    // Reward: heal when low, otherwise +1 ATK on a random attacker.
    if (hp < Progress.maxHp(save) * 0.5) hp = Math.min(Progress.maxHp(save), hp + 5);
    else { const att = save.squad.filter((id) => Engine.CARD_TYPES[Progress.ROSTER_BY[id].type].role === 'attacker'); const id = att[Math.floor(Math.random() * att.length)]; mods[id] = { atk: ((mods[id] || {}).atk || 0) + 1 }; }
  }
}

const profiles = {
  'fresh account': Progress.freshSave(),
  'after ~5 runs (HP+6, spear, archer2)': Object.assign(Progress.freshSave(), { upgrades: { vitality: 2 }, squad: ['sword1', 'archer1', 'drum1', 'shield1', 'spear1'] }),
  'meadow boss beaten (HP+9, 6 slots, horn, Provisions 1)': Object.assign(Progress.freshSave(), { upgrades: { vitality: 3, command: 1, provisions: 1 }, unlocked: ['meadow', 'forest'], bossesBeaten: ['meadow'], squad: ['sword1', 'archer1', 'drum1', 'shield1', 'spear1', 'horn1'] }),
};
const N = Number(process.argv[2] || 6);
console.log('World: ' + World.SUBAREAS.length + ' sub-areas, ' + World.nodes.filter((n) => n.type !== 'camp').length + ' spots (free exploration), ' + Items.ALL.length + ' items');
for (const [name, save] of Object.entries(profiles)) {
  const res = []; for (let i = 0; i < N; i++) res.push(playRun(save));
  const avg = (f) => (res.reduce((n, r) => n + f(r), 0) / N).toFixed(1);
  console.log(`\n${name} (start Supplies ${res[0].start}): battles won ${avg((r) => r.wins)}, bosses ${avg((r) => r.bosses)}, items ${avg((r) => r.items)}, deepest level ${avg((r) => r.maxLv)}, souls ${avg((r) => r.souls)}`);
  console.log('  ' + res.map((r) => (r.end === 'died' ? 'died at Lv' + r.diedAt : r.end === 'supplies' ? 'out of Supplies' : 'cleared all') + ' after ' + r.wins).join(' | '));
}
