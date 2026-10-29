// Balancing helper for the world map: plays whole runs with a strong
// (search-based) player and reports how far each run gets.
// Usage: node tools/sim-runs.js [runs]
'use strict';
const Engine = require('../prototype/js/engine.js');
const World = require('../prototype/js/world-data.js');
const Gen = require('../prototype/js/gen.js');
const Progress = require('../prototype/js/progress.js');

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

// One run: always take the lowest-level reachable node (bosses when nothing else is left).
function playRun(save) {
  const seed = 'sim' + Math.random();
  const mods = {};
  let hp = Progress.maxHp(save), cleared = new Set(['camp']), wins = 0, maxLv = 0, souls = 0;
  for (;;) {
    const frontier = [];
    for (const id of cleared) for (const n of World.adj[id]) {
      const node = World.byId[n];
      if (!cleared.has(n) && save.unlocked.includes(node.sub) && !frontier.includes(node)) frontier.push(node);
    }
    if (!frontier.length) break;
    frontier.sort((a, b) => (a.type === 'boss') - (b.type === 'boss') || a.level - b.level);
    const node = frontier[0];
    cleared.add(node.id);
    if (node.type === 'shrine') { hp = Math.min(Progress.maxHp(save), hp + 8); continue; }
    if (node.type === 'treasure') { souls += 10; continue; }
    const st = fight(node, hp, Progress.maxHp(save), Progress.buildArmy(save, mods), seed);
    if (st.status !== 'cleared') return { wins, maxLv, souls: Math.round(souls * 0.75), died: node.level };
    hp = st.hp; wins++; maxLv = Math.max(maxLv, node.level); souls += Gen.soulsFor(node);
    if (node.type === 'boss' && !save.bossesBeaten.includes(node.sub)) return { wins, maxLv, souls, boss: node.sub };
    // Reward: heal when low, otherwise +1 ATK on a random attacker.
    if (hp < Progress.maxHp(save) * 0.5) hp = Math.min(Progress.maxHp(save), hp + 5);
    else { const att = save.squad.filter((id) => Engine.CARD_TYPES[Progress.ROSTER_BY[id].type].role === 'attacker'); const id = att[Math.floor(Math.random() * att.length)]; mods[id] = { atk: ((mods[id] || {}).atk || 0) + 1 }; }
  }
  return { wins, maxLv, souls };
}

const profiles = {
  'fresh account': Progress.freshSave(),
  'after ~5 runs (HP+6, spear, archer2)': Object.assign(Progress.freshSave(), { upgrades: { vitality: 2 }, squad: ['sword1', 'archer1', 'drum1', 'shield1', 'spear1'] }),
  'meadow boss beaten (HP+9, 6 slots, horn)': Object.assign(Progress.freshSave(), { upgrades: { vitality: 3, command: 1 }, unlocked: ['meadow', 'forest'], bossesBeaten: ['meadow'], squad: ['sword1', 'archer1', 'drum1', 'shield1', 'spear1', 'horn1'] }),
};
const N = Number(process.argv[2] || 6);
console.log('World: ' + World.nodes.length + ' nodes, ' + World.edges.length + ' paths');
for (const [name, save] of Object.entries(profiles)) {
  const res = []; for (let i = 0; i < N; i++) res.push(playRun(save));
  const avg = (f) => (res.reduce((n, r) => n + f(r), 0) / N).toFixed(1);
  console.log(`\n${name}: battles won ${avg((r) => r.wins)}, deepest level ${avg((r) => r.maxLv)}, souls ${avg((r) => r.souls)}`);
  console.log('  ' + res.map((r) => (r.boss ? 'beat ' + r.boss + ' boss' : 'died at Lv' + r.died) + ' after ' + r.wins).join(' | '));
}
