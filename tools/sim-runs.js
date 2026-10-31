// Balancing helper for the world map: plays whole runs with a strong
// (search-based) player and reports how far each run gets.
// Env PROFILE=<substring> limits the profile mode to matching profiles. Souls use the real star multipliers.
// Usage: node tools/sim-runs.js [runs]            profiles at fixed progress points
//        node tools/sim-runs.js 1 campaign [maxRuns]   consecutive runs with greedy Camp shopping
'use strict';
// SEED=<n> makes every run reproducible (Math.random and the gacha rng are seeded). TRACE=1 prints the Camp state after each campaign run, DEBUG=1 every battle;
// NOITEMS / NOGACHA / NORULES / NORELICS switch a power source off (ablation).
if (process.env.SEED) { let a = Number(process.env.SEED) >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const Engine = require('../prototype/js/engine.js');
try { require('../prototype/js/world-layout.js'); } catch (e) { /* placeholder layout */ }
const World = require('../prototype/js/world-data.js');
require('../prototype/js/boss-defs.js');
const Gen = require('../prototype/js/gen.js');
const Progress = require('../prototype/js/progress.js');
const Items = require('../prototype/js/items.js');
const Relics = require('../prototype/js/relics.js');

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
  const relics = []; // WP12: run relics (NORELICS=1 switches them off)
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
    const cache = pois.find((n) => n.type === 'treasure'); if (cache) { cleared.add(cache.id); souls += Gen.CACHE_SOULS; continue; }
    if (!fights.length) return { wins, maxLv, souls, bosses, items, end: 'cleared', start: Progress.startSupplies(save0), save };
    const bossNode = fights.find((n) => n.type === 'boss'), normals = fights.filter((n) => n.type !== 'boss');
    const node = bossNode && (supplies <= 2 || !normals.length) ? bossNode : (normals[0] || bossNode);
    cleared.add(node.id);
    const st = fight(node, hp, Progress.maxHp(save), Progress.buildArmy(save, mods), seed, process.env.NORULES ? {} : Progress.rulesFor(save, { relics }));
    if (st.status !== 'cleared') return { wins, maxLv, souls: Math.round(souls * 0.75), bosses, items, end: 'died', diedAt: node.level, start: Progress.startSupplies(save0), save };
    if (process.env.DEBUG) console.log('  run' + (save0.runs + 1) + ' w' + wins + ' ' + node.id + ' ' + node.type + ' Lv' + node.level + ' hp ' + st.hp + '/' + Progress.maxHp(save) + ' sup ' + supplies + ' atk ' + JSON.stringify(Progress.buildArmy(save, mods).filter((c) => c.atk).map((c) => c.id + ':' + c.atk)) + ' dmg' + st.damageTaken);
    hp = st.hp; wins++; Progress.addXp(save, save.squad, node.type === 'boss' ? 2 : 1); // WP11 mastery
     maxLv = Math.max(maxLv, node.level); souls += Gen.soulsFor(node, Gen.starsFor(st.damageTaken || 0)) * Progress.soulRate(save);
    // Real WP8 drop logic (levels, substats, pity, elite guarantee, boss Legendaries); new items auto-equip into a free slot.
    const stars = Gen.starsFor(st.damageTaken || 0);
    const takeDrop = (drop) => {
      if (process.env.NOITEMS) return;
      if (!drop || !drop.item || !drop.isNew) return;
      items++;
      const b0 = Items.bonuses(save);
      if (Items.equip(save, drop.id, true)) { const b1 = Items.bonuses(save); hp += b1.hp - b0.hp; supplies += b1.supplies - b0.supplies; }
    };
    takeDrop(Items.grantDrop(save, node, seed) || (!save0.runs && wins === 2 && !items ? Items.guaranteedDrop(save, node) : null));
    if (stars === 3) takeDrop(Items.grantDrop(save, node, seed + ':star', { bonus: true })); // 3-star clears earn a bonus roll (app.js battleOver)
    if (node.type === 'boss') {
      supplies += Progress.bossSupplies(bosses); bosses++; souls += Gen.BOSS_BONUS_SOULS; // real rule: 3, then 1, then -1
      if (!save.bossesBeaten.includes(node.sub)) { save.bossesBeaten.push(node.sub); for (const u of World.SUB_BY[node.sub].unlocks) if (!save.unlocked.includes(u)) save.unlocked.push(u); }
    } else supplies -= 1;
    // Reward: heal when low, otherwise a relic when offered (greedy: first offered), otherwise +1 ATK on a random attacker.
    const offered = process.env.NORELICS ? null : Relics.offer(relics, Math.random, node.type);
    if (hp < Progress.maxHp(save) * 0.5) hp = Math.min(Progress.maxHp(save), hp + 5);
    else if (offered && !['prism', 'mjolnir', 'susanoo'].includes(offered.id)) relics.push(offered.id); // greedy: skip the situational relics
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
  const crystalBoss = new Set(); let simSeed = (Number(process.env.SEED) || 0) * 7919 + 12345; const simRnd = () => { simSeed = (simSeed * 1664525 + 1013904223) >>> 0; return simSeed / 4294967296; };
  let save = Progress.freshSave(); const firstRun = {}, unlockRun = {}, log = [];
  const order = ['vitality', 'provisions', 'command', 'drill', 'fortune', 'bulwark'];
  for (let r = 1; r <= maxRuns; r++) {
    const res = playRun(save); const before = save.bossesBeaten.length;
    save = res.save; save.runs++; save.souls += Math.round(res.souls); save.run = null;
    if (r === 1) { const cheap = Progress.cheapestUpgrade(save); if (cheap && save.souls < cheap.cost) save.souls = cheap.cost; } // first-run guarantee (app.js endRun)
    for (const b of save.bossesBeaten) { for (const u of World.SUB_BY[b].unlocks) if (!(u in unlockRun)) unlockRun[u] = r; }
    // WP11 gacha approximation: Crystals = first boss kills (3 + region) + about 3 per run from bounties; spent on single pulls with a seeded rng.
    for (const b of save.bossesBeaten) if (!(crystalBoss.has(b))) { crystalBoss.add(b); save.crystals += Math.round(Progress.bossCrystals(World.SUB_BY[b].regionIndex)); }
    save.crystals += 3;
    while (!process.env.NOGACHA && save.crystals >= Progress.PULL_COST) { Progress.pull(save, 1, simRnd); }
    for (const b of save.bossesBeaten) { const reg = World.SUB_BY[b].region; if (!(reg in firstRun)) firstRun[reg] = r; }
    for (let guard = 0; guard < 20; guard++) { // shopping
      const opts = [];
      for (const u of Progress.ROSTER) if (!u.start && !save.owned.includes(u.id) && Progress.recruitAvailable(save, u) && u.cost <= save.souls) opts.push({ cost: u.cost, buy: () => { save.owned.push(u.id); if (!Progress.canAdd(save, u.id)) save.squad.push(u.id); } });
      for (const id of order) { const c = Progress.upgradeCost(save, id); if (c !== null && c <= save.souls) opts.push({ cost: c, buy: () => { save.upgrades[id] = (save.upgrades[id] || 0) + 1; } }); }
      if (!opts.length) break; opts.sort((a, b) => a.cost - b.cost); save.souls -= opts[0].cost; opts[0].buy();
    }
    if (process.env.TRACE) console.log('after run ' + r + ': souls left ' + save.souls + ' (earned ' + Math.round(res.souls) + ') upgrades ' + JSON.stringify(save.upgrades) + ' squad ' + save.squad.join(',') + ' crystals ' + save.crystals + ' items ' + save.items.length + ' wins ' + res.wins + ' end ' + res.end);
    log.push(res.wins + (res.end === 'died' ? 'x@' + res.diedAt : '') + (res.bosses ? 'B' + res.bosses : ''));
    if (save.bossesBeaten.length === World.SUBAREAS.length) break;
  }
  console.log('\nCampaign (' + maxRuns + ' runs max): battles per run ' + log.join(' '));
  console.log('  final upgrades ' + JSON.stringify(save.upgrades) + ', squad ' + save.squad.length + ' (' + Progress.squadCp(save) + '/' + Progress.commandCap(save) + ' CP), owned ' + save.owned.length + ' (stars ' + save.owned.map((i) => Progress.starsOf(save, i)).join('') + ', pity ' + save.pity + ')' + ', items ' + save.items.length);
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
