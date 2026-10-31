// Balancing helper for the world map: plays whole runs with a strong
// (search-based) player and reports how far each run gets.
// Env PROFILE=<substring> limits the profile mode to matching profiles. Souls use the real star multipliers.
// Usage: node tools/sim-runs.js [runs]            profiles at fixed progress points
//        node tools/sim-runs.js 1 campaign [maxRuns]   consecutive runs with greedy Camp shopping
'use strict';
const Engine = require('../prototype/js/engine.js');
try { require('../prototype/js/world-layout.js'); } catch (e) { /* placeholder layout */ }
const World = require('../prototype/js/world-data.js');
require('../prototype/js/boss-defs.js');
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
function fight(node, hp, maxHp, army, seed, rules) {
  const stage = Object.assign({ heroHp: hp, heroMaxHp: maxHp, rules: rules || {} }, Gen.generateBattle(node, seed));
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
    // Sub-areas whose boss already fell are skipped (nothing new there); fights are taken lowest level first,
    // the boss when Supplies run low (<= 2) or when nothing else is left in the frontier.
    const open = World.nodes.filter((n) => n.type !== 'camp' && !cleared.has(n.id) && save.unlocked.includes(n.sub) && !save.bossesBeaten.includes(n.sub));
    const pois = open.filter((n) => n.type === 'shrine' || n.type === 'treasure');
    const fights = open.filter((n) => !pois.includes(n)).sort((a, b) => (a.type === 'boss') - (b.type === 'boss') || a.level - b.level);
    const spring = pois.find((n) => n.type === 'shrine'); // heal when below 60% HP
    if (spring && hp < Progress.maxHp(save) * 0.6) { cleared.add(spring.id); hp = Math.min(Progress.maxHp(save), hp + 8); continue; }
    const cache = pois.find((n) => n.type === 'treasure'); if (cache) { cleared.add(cache.id); souls += 10; continue; }
    if (!fights.length) return { wins, maxLv, souls, bosses, items, end: 'cleared', start: Progress.startSupplies(save0), save };
    const bossNode = fights.find((n) => n.type === 'boss'), normals = fights.filter((n) => n.type !== 'boss');
    const node = bossNode && (supplies <= 2 || !normals.length) ? bossNode : (normals[0] || bossNode);
    cleared.add(node.id);
    const st = fight(node, hp, Progress.maxHp(save), Progress.buildArmy(save, mods), seed, process.env.NORULES ? {} : Progress.rulesFor(save));
    if (st.status !== 'cleared') return { wins, maxLv, souls: Math.round(souls * 0.75), bosses, items, end: 'died', diedAt: node.level, start: Progress.startSupplies(save0), save };
    hp = st.hp; wins++; maxLv = Math.max(maxLv, node.level); souls += Gen.soulsFor(node, Gen.starsFor(st.damageTaken || 0)) * Progress.soulRate(save);
    // Real WP8 drop logic (levels, substats, pity, elite guarantee, boss Legendaries); new items auto-equip into a free slot.
    const drop = Items.grantDrop(save, node, seed) || (!save0.runs && wins === 2 && !items ? Items.guaranteedDrop(save, node) : null);
    if (drop && drop.item) {
      if (drop.isNew) {
        items++;
        const b0 = Items.bonuses(save);
        if (Items.equip(save, drop.id, true)) { const b1 = Items.bonuses(save); hp += b1.hp - b0.hp; supplies += b1.supplies - b0.supplies; }
      }
    }
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
  'Greenvale done (HP+15, 7 slots, Drill 1, Provisions 2)': Object.assign(Progress.freshSave(), { upgrades: { vitality: 5, command: 2, drill: 1, bulwark: 1, provisions: 2 }, unlocked: ['meadow', 'forest', 'bamboo', 'lake', 'beach', 'dunes'], bossesBeaten: ['meadow', 'forest', 'bamboo', 'lake'], squad: ['sword1', 'archer1', 'drum1', 'shield1', 'spear1', 'horn1', 'mage1'] }),
};

// Campaign: play consecutive runs, spending Souls greedily on the cheapest useful Camp upgrade or recruit,
// and report in which run each region's first boss fell.
function campaign(maxRuns) {
  let save = Progress.freshSave(); const firstRun = {}, unlockRun = {}, log = [];
  const order = ['vitality', 'provisions', 'command', 'drill', 'fortune', 'bulwark'];
  for (let r = 1; r <= maxRuns; r++) {
    const res = playRun(save); const before = save.bossesBeaten.length;
    save = res.save; save.runs++; save.souls += Math.round(res.souls); save.run = null;
    for (const b of save.bossesBeaten) { for (const u of World.SUB_BY[b].unlocks) if (!(u in unlockRun)) unlockRun[u] = r; }
    for (const b of save.bossesBeaten) { const reg = World.SUB_BY[b].region; if (!(reg in firstRun)) firstRun[reg] = r; }
    for (let guard = 0; guard < 20; guard++) { // shopping
      const opts = [];
      for (const u of Progress.ROSTER) if (!u.start && !save.owned.includes(u.id) && Progress.recruitAvailable(save, u) && u.cost <= save.souls) opts.push({ cost: u.cost, buy: () => { save.owned.push(u.id); if (!Progress.canAdd(save, u.id)) save.squad.push(u.id); } });
      for (const id of order) { const c = Progress.upgradeCost(save, id); if (c !== null && c <= save.souls) opts.push({ cost: c, buy: () => { save.upgrades[id] = (save.upgrades[id] || 0) + 1; } }); }
      if (!opts.length) break; opts.sort((a, b) => a.cost - b.cost); save.souls -= opts[0].cost; opts[0].buy();
    }
    log.push(res.wins + (res.end === 'died' ? 'x@' + res.diedAt : '') + (res.bosses ? 'B' + res.bosses : ''));
    if (save.bossesBeaten.length === World.SUBAREAS.length) break;
  }
  console.log('\nCampaign (' + maxRuns + ' runs max): battles per run ' + log.join(' '));
  console.log('  final upgrades ' + JSON.stringify(save.upgrades) + ', squad ' + save.squad.length + ' (' + Progress.squadCp(save) + '/' + Progress.commandCap(save) + ' CP), owned ' + save.owned.length + ', items ' + save.items.length);
  console.log('  bosses beaten ' + save.bossesBeaten.length + '/' + World.SUBAREAS.length + ' (' + save.bossesBeaten.join(', ') + ')');
  console.log('  run in which a sub-area was first unlocked: ' + ['forest', 'beach', 'dunes', 'snow', 'ash', 'glacier', 'caldera'].map((u) => u + ' ' + (unlockRun[u] || '-')).join(', '));
  console.log('  run in which each region first had a boss beaten: ' + World.REGIONS.map((g) => g + ' ' + (firstRun[g] || '-')).join(', '));
}

const N = Number(process.argv[2] || 6);
const nodes = World.nodes.filter((n) => n.type !== 'camp');
console.log('World: ' + World.SUBAREAS.length + ' sub-areas, ' + nodes.length + ' spots (free exploration; ' + nodes.filter((n) => ['battle', 'elite', 'boss'].includes(n.type)).length + ' monster spots), ' + Items.ALL.length + ' items' + (typeof window === 'undefined' && !globalThis.WorldLayout ? ' [placeholder layout]' : ''));
if (process.argv[3] !== 'campaign') {
  for (const [name, save] of Object.entries(profiles)) {
    if (process.env.PROFILE && !name.includes(process.env.PROFILE)) continue;
    const res = []; for (let i = 0; i < N; i++) res.push(playRun(save));
    const avg = (f) => (res.reduce((n, r) => n + f(r), 0) / N).toFixed(1);
    console.log(`\n${name} (start Supplies ${res[0].start}): battles won ${avg((r) => r.wins)}, bosses ${avg((r) => r.bosses)}, items ${avg((r) => r.items)}, deepest level ${avg((r) => r.maxLv)}, souls ${avg((r) => r.souls)}`);
    console.log('  ' + res.map((r) => (r.end === 'died' ? 'died at Lv' + r.diedAt : r.end === 'supplies' ? 'out of Supplies' : 'cleared all') + ' after ' + r.wins).join(' | '));
  }
} else campaign(Number(process.argv[4] || 40));
