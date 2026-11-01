// Balancing helper for the world map: plays whole runs with a strong
// (search-based) player and reports how far each run gets.
// Env PROFILE=<substring> limits the profile mode to matching profiles. Souls use the real star multipliers.
// Usage: node tools/sim-runs.js [runs]            profiles at fixed progress points
//        node tools/sim-runs.js 1 campaign [maxRuns]   consecutive runs with greedy Camp shopping
'use strict';
// SEED=<n> makes every run reproducible (Math.random and the gacha rng are seeded). TRACE=1 prints the Camp state after each campaign run, DEBUG=1 every battle;
// HEAT=<hp,rage,heal,armor,cp,col> and DESCEND=<n> switch Heat / Descend on (WP18; 'endgame' mode plays a maxed account with them).
// HERO=<marshal|pyromancer|quartermaster|sentinel|rotate> chooses the hero (default marshal; profiles ignore unlocks); NOABILITY=1 never uses the ability.
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
const Events = require('../prototype/js/events.js');

const tilesCache = {};
function tilesFor(state) { // WP16: the Board track adds a 4th player row (rule deepRow); WP18 Heat may close the right-hand column (rule lostCol)
  const id = Engine.playerRowsFor(state.rules).join() + ':' + Engine.lostColsFor(state.rules);
  return tilesCache[id] || (tilesCache[id] = Engine.playerTilesFor(state.rules));
}

function score(state, p, army, baseHp) {
  const s = Engine.resolveTurn(state, p, army).state;
  if (s.status === 'cleared') return -1;
  const threat = s.enemies.filter(Engine.isThreat);
  return ((baseHp === undefined ? state.hp : baseHp) - s.hp) + 0.6 * threat.reduce((n, e) => n + e.atk, 0) + 0.15 * threat.reduce((n, e) => n + e.hp, 0) + (s.status === 'defeated' ? 100 : 0);
}
function bestPlacement(state, army, iters = 2500, restarts = 4) {
  let best = null, bestV = Infinity;
  const TILES = tilesFor(state);
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
// Hero ability policy (WP15): before planning a turn, try the ability (every sensible target) and use it when the best
// placement afterwards scores clearly better than without it (a margin keeps it for a worse turn). NOABILITY=1 never uses it.
function abilityCandidates(st) {
  const id = st.ability, a = Engine.HERO_ABILITIES[id];
  if (!a || a.target === 'none') return [null];
  const foes = st.enemies.filter((e) => e.alive);
  const barrels = foes.filter((e) => Engine.ENEMY_TYPES[e.type].barrel);
  const threats = foes.filter(Engine.isThreat).sort((x, y) => y.atk - x.atk || x.hp - y.hp);
  return [...new Set(barrels.concat(threats.slice(0, 2)).map((e) => e.id))];
}
function planTurn(st, army, p0) {
  if (process.env.NOABILITY || st.abilityUsed || !st.ability) return { st, placement: p0 };
  const v0 = score(st, p0, army);
  if (v0 < 0) return { st, placement: p0 }; // this turn clears the board anyway
  let best = null;
  for (const t of abilityCandidates(st)) {
    const out = Engine.useAbility(st, t); if (!out) continue;
    if (out.state.status === 'cleared') return { st: out.state, placement: {} };
    const p1 = bestPlacement(out.state, army, 900, 2), v1 = score(out.state, p1, army, st.hp);
    if (!best || v1 < best.v) best = { v: v1, st: out.state, placement: p1 };
  }
  return best && best.v + 1.5 < v0 ? best : { st, placement: p0 };
}
function fight(node, hp, maxHp, army, seed, rules, heroStage, gopts) {
  const stage = Object.assign({ heroHp: hp, heroMaxHp: maxHp, rules: rules || {} }, heroStage || {}, Gen.generateBattle(node, seed, gopts));
  let st = Engine.createState(stage);
  while (st.status === 'playing' && st.turn <= 6) {
    const plan = planTurn(st, army, bestPlacement(st, army));
    st = plan.st;
    if (st.status !== 'playing') break;
    st = Engine.resolveTurn(st, plan.placement, army).state;
  }
  return st;
}

// One run with free exploration: every spot in an unlocked sub-area is open. The player takes the
// lowest-level fight first (bosses last, or when nothing else is left), uses springs when hurt,
// and stops when Rations run out or the hero falls. Items drop with their real chances and are auto-equipped.
function playRun(save0) {
  const save = JSON.parse(JSON.stringify(save0));
  const seed = 'sim' + Math.random();
  const mods = {};
  const gopts = Progress.genOpts(save), heal = (n) => Progress.healAmt(save, n); // WP18: Heat / Descend (HEAT=hp,rage,... DESCEND=n)
  const relics = []; // WP12: run relics (NORELICS=1 switches them off)
  // Per-run gates (app.js): only Sunny Meadows is open at the start (the sim never starts at a Wayshrine); a boss opens the areas it leads to for this run.
  // Endgame 'farm' mode keeps every area open (the player starts at a lit Wayshrine deep in the map).
  const runOpen = new Set(save.farm ? World.SUBAREAS.map((x) => x.id) : ['meadow']);
  let gold = Progress.startGold(save), keys = 0, reviveUsed = 0, rerolls = Progress.rewardRerolls(save), hp = Progress.maxHp(save), supplies = Progress.startSupplies(save), cleared = new Set(), wins = 0, maxLv = 0, souls = 0, bosses = 0, items = 0, wonFirst = [];
  for (;;) {
    if (supplies <= 0) return { wins, maxLv, souls, bosses, items, end: 'supplies', start: Progress.startSupplies(save0), save };
    // Sub-areas whose boss already fell are skipped (nothing new there); fights are taken lowest level first,
    // the boss when Rations run low (<= 2) or when nothing else is left in the frontier.
    // A sub-area whose boss already fell in an earlier run has nothing new, but its boss is still the gate to the areas behind it: it is re-fought each run (rushed, first).
    const isGate = (n) => n.type === 'boss' && World.SUB_BY[n.sub].unlocks.some((u) => !runOpen.has(u));
    const open = World.nodes.filter((n) => n.type !== 'camp' && n.type !== 'waypoint' && !cleared.has(n.id) && save.unlocked.includes(n.sub) && runOpen.has(n.sub) && (save.farm || !save.bossesBeaten.includes(n.sub) || isGate(n) || wins < 3)); // save.farm (endgame mode): beaten sub-areas stay open; otherwise their ordinary spots only serve as a 3-win warm-up
    // WP14: a hidden Sealed Cache (found by walking near it, assumed 60% of the time) is opened with a key dropped by an elite or boss: cache Souls and Gold plus 4 HP.
    const secret = open.find((n) => n.type === 'secret');
    if (secret && keys > 0) { cleared.add(secret.id); if (Math.random() < 0.6) { keys--; if (!save.secretsOpened.includes(secret.id)) { save.secretsOpened.push(secret.id); save.crystals += 1; } else save.dust += 2; /* app.js: 1 Crystal the first time, later 2 Dust */ souls += Gen.CACHE_SOULS; gold += Gen.CACHE_GOLD + 2 * World.SUB_BY[secret.sub].regionIndex; hp = Math.min(Progress.maxHp(save), hp + heal(4)); } continue; }
    // WP13 non-battle nodes: spring (heal when hurt, else +1 ATK), cache, shop and event. A guarded cache is a normal fight with a bonus.
    const pois = open.filter((n) => ['shrine', 'shop', 'event'].includes(n.type) || (n.type === 'treasure' && !n.guarded));
    const guardOf = (n) => Object.assign({}, n, { type: 'battle', role: 'armored', guardFor: true });
    const fights = open.filter((n) => !pois.includes(n) && n.type !== 'secret').map((n) => (n.guarded ? guardOf(n) : n)).sort((a, b) => (a.type === 'boss') - (b.type === 'boss') || (save.farm ? b.level - a.level : a.level - b.level)); // farm (endgame): deepest spots first
    const ri = (n) => World.SUB_BY[n.sub].regionIndex, atkUp = () => { const att = save.squad.filter((id) => Engine.CARD_TYPES[Progress.ROSTER_BY[id].type].role === 'attacker'); const id = att[Math.floor(Math.random() * att.length)]; mods[id] = { atk: ((mods[id] || {}).atk || 0) + 1 }; };
    const maxHp = () => Progress.maxHp(save), spring = pois.find((n) => n.type === 'shrine'); // heal when below 60% HP
    if (spring && hp < maxHp() * 0.6) { cleared.add(spring.id); hp = Math.min(maxHp(), hp + heal(8)); continue; }
    const cache = pois.find((n) => n.type === 'treasure'); if (cache) { cleared.add(cache.id); souls += Gen.CACHE_SOULS; gold += Gen.CACHE_GOLD + 2 * ri(cache); continue; }
    // Shop (app.js): browsing is free but the market closes after ONE purchase. The player only visits when it will buy: heal when hurt (below 70%), else a relic at 40+, else one +1 ATK (22).
    const shop = pois.find((n) => n.type === 'shop');
    if (shop) {
      const pr = (b) => Math.round(b * (1 + 0.2 * ri(shop))), canRelic = !process.env.NORELICS && relics.length < Relics.MAX_PER_RUN && gold >= pr(40);
      if (hp < maxHp() * 0.7 && gold >= pr(14)) { cleared.add(shop.id); gold -= pr(14); hp = Math.min(maxHp(), hp + heal(8)); continue; }
      if (canRelic) { const left = Relics.LIST.filter((x) => !relics.includes(x.id) && !['prism', 'mjolnir', 'susanoo'].includes(x.id)); if (left.length) { cleared.add(shop.id); gold -= pr(40); relics.push(left[Math.floor(Math.random() * left.length)].id); continue; } }
      if (gold >= pr(22)) { cleared.add(shop.id); gold -= pr(22); atkUp(); continue; }
    }
    const evn = pois.find((n) => n.type === 'event');   // take the first affordable non-leaving choice
    if (evn) {
      cleared.add(evn.id); const e = Events.pick(World.SUB_BY[evn.sub].region, World.hash(evn.id)), c = e.choices.find((ch) => ch !== Events.LEAVE && Events.costOf(ch, ri(evn)) <= gold && !(ch.cost && ch.cost.gold > 12));
      if (c) {
        gold -= Events.costOf(c, ri(evn)); const fx = Events.resolve(c, ri(evn), Math.random).fx;
        gold = Math.max(0, gold + (fx.gold || 0)); souls += fx.souls || 0; if (fx.maxhp) hp += fx.maxhp; if (fx.hp) hp = Math.max(1, Math.min(maxHp(), hp + (fx.hp > 0 ? heal(fx.hp) : fx.hp)));
        for (let k = 0; k < (fx.atk || 0) + (fx.up || 0); k++) atkUp();
        if (fx.relic && !process.env.NORELICS && relics.length < Relics.MAX_PER_RUN) { const left = Relics.LIST.filter((x) => !relics.includes(x.id)); if (left.length) relics.push(left[Math.floor(Math.random() * left.length)].id); }
      }
      continue;
    }
    if (!fights.length) return { wins, maxLv, souls, bosses, items, end: 'cleared', start: Progress.startSupplies(save0), save };
    const bossNode = fights.find((n) => n.type === 'boss'), normals = fights.filter((n) => n.type !== 'boss');
    // Gate boss of an already conquered area: straight through, but only after 3 warm-up wins this run (a cold +0 ATK squad would die to it and earn nothing).
    const rush = wins >= 3 ? fights.find((n) => n.type === 'boss' && save.bossesBeaten.includes(n.sub)) : null;
    // Depth pays: after the warm-up and the gate rush, the player grinds the HIGHEST fights of the frontier first (rewards and Souls grow with the level, a Ration costs the same).
    // The highest fight it can handle: its level is at most one above the deepest boss the account has beaten (the frontier area is graded by that boss).
    const safeLv = Math.max(3, ...save.bossesBeaten.map((b) => World.nodes.find((x) => x.sub === b && x.type === 'boss').level)) + 1 + (gopts.descend ? 2 * gopts.descend : 0);
    const grind = wins >= 3 && !process.env.ASCEND ? (normals.filter((x) => x.level <= safeLv).sort((a, b) => b.level - a.level)[0] || normals[0]) : normals[0];
    const node = rush || (bossNode && (supplies <= 2 || !normals.length) ? bossNode : (grind || bossNode));
    cleared.add(node.id);
    if (process.env.LOGBOSS && (node.type === 'boss' || node.type === 'elite')) { // WP18: snapshot of the account at every boss / elite fight (feeds the validator's reference squads)
      const ar = Progress.buildArmy(save, mods), rl = Progress.rulesFor(save, { relics, reviveUsed });
      require('fs').appendFileSync(process.env.LOGBOSS, JSON.stringify({ id: node.id, sub: node.sub, type: node.type, lv: node.level, run: save0.runs + 1, win: wins, hp, maxHp: Progress.maxHp(save), vit: Progress.level(save, 'vitality'), up: save.upgrades, squad: save.squad,
        atk: ar.filter((c) => c.atk).map((c) => c.id + ':' + c.atk + '/' + c.range), blk: ar.filter((c) => c.block).map((c) => c.block), amt: ar.filter((c) => c.amount).map((c) => c.id + ':' + c.amount), mods: Object.fromEntries(Object.entries(mods).map(([k, v]) => [k, v.atk || 0])),
        rules: rl, relics: relics.slice(), stars: save.squad.map((i) => Progress.starsOf(save, i)).join('') }) + '\n');
    }
    const st = fight(node, hp, Progress.maxHp(save), Progress.buildArmy(save, mods), seed, process.env.NORULES ? {} : Progress.rulesFor(save, { relics, reviveUsed }), Progress.heroStage(save), gopts);
    reviveUsed += st.reviveUsed || 0;
    if (st.status !== 'cleared') return { wins, maxLv, souls: Math.round(souls * 0.75), bosses, items, end: 'died', diedAt: node.level, start: Progress.startSupplies(save0), save };
    if (process.env.DEBUG) console.log('  run' + (save0.runs + 1) + ' w' + wins + ' ' + node.id + ' ' + node.type + ' Lv' + node.level + ' hp ' + st.hp + '/' + Progress.maxHp(save) + ' sup ' + supplies + ' atk ' + JSON.stringify(Progress.buildArmy(save, mods).filter((c) => c.atk).map((c) => c.id + ':' + c.atk)) + ' dmg' + st.damageTaken);
    hp = st.hp; wins++; if (node.type === 'elite' || node.type === 'boss') keys = Math.min(World.MAX_KEYS, keys + 1); gold += Gen.goldFor(node, Gen.starsFor(st.damageTaken || 0), gopts);
    if (node.guardFor) { souls += Gen.CACHE_SOULS; gold += Gen.GUARD_GOLD + 3 * ri(node); } Progress.addXp(save, save.squad, node.type === 'boss' ? 2 : 1); // WP11 mastery
     maxLv = Math.max(maxLv, node.level); souls += Math.round(Gen.soulsFor(node, Gen.starsFor(st.damageTaken || 0), gopts) * Progress.soulRate(save)); // rounded per fight like app.js battleOver
    // Real WP8 drop logic (levels, substats, pity, elite guarantee, boss Legendaries); new items auto-equip into a free slot.
    const stars = Gen.starsFor(st.damageTaken || 0);
    const takeDrop = (drop) => {
      if (process.env.NOITEMS) return;
      if (!drop || !drop.item || !drop.isNew) return;
      items++;
      const b0 = Items.bonuses(save);
      if (Items.equip(save, drop.id, true)) { const b1 = Items.bonuses(save); hp += b1.hp - b0.hp; supplies += b1.supplies - b0.supplies; }
    };
    takeDrop(Items.grantDrop(save, node, seed, { lvBonus: Progress.itemLvBonus(save) }) || (!save0.runs && wins === 2 && !items ? Items.guaranteedDrop(save, node) : null));
    if (stars === 3) takeDrop(Items.grantDrop(save, node, seed + ':star', { bonus: true, lvBonus: Progress.itemLvBonus(save) })); // 3-star clears earn a bonus roll (app.js battleOver)
    if (node.type === 'boss') {
      supplies = Progress.addSupplies(supplies, Progress.bossSupplies(Gen.scaled(node, gopts).level, !save.bossesBeaten.includes(node.sub))); bosses++; souls += Gen.BOSS_BONUS_SOULS; // real rule: Rations grow with the boss level, new areas pay ~3x a toll boss
      for (const u of World.SUB_BY[node.sub].unlocks) { runOpen.add(u); if (!save.unlocked.includes(u)) save.unlocked.push(u); } // opens for this run; the fog lifts for good
      if (!save.bossesBeaten.includes(node.sub)) save.bossesBeaten.push(node.sub);
    } else supplies -= 1;
    // Reward: heal when low, otherwise a relic when offered (greedy: first offered), otherwise +1 ATK on a random attacker.
    // Camp Choice track: Lv1 a 4th choice = a second look at the relic offer; Lv2 = one re-roll per run (another look when nothing good was offered).
    const good = (o) => o && !['prism', 'mjolnir', 'susanoo'].includes(o.id);
    let offered = process.env.NORELICS ? null : Relics.offer(relics, Math.random, node.type);
    for (let look = Progress.level(save, 'choice') >= 1 ? 1 : 0; look > 0 && !good(offered) && !process.env.NORELICS; look--) offered = Relics.offer(relics, Math.random, node.type) || offered;
    if (!good(offered) && rerolls > 0 && !process.env.NORELICS && hp >= Progress.maxHp(save) * 0.5) { rerolls--; offered = Relics.offer(relics, Math.random, node.type) || offered; }
    // Depth-scaled rewards (Gen.rewardFor / Gen.runCap, same numbers as the app): heal when low, else a relic, else the Warcry (team) pick, else the single-unit ATK step (capped per unit).
    const rw = Gen.rewardFor(node, gopts), cap = Gen.runCap(Math.max(maxLv, rw.level)), att = save.squad.filter((id) => Engine.CARD_TYPES[Progress.ROSTER_BY[id].type].role === 'attacker');
    const room = att.filter((id) => ((mods[id] || {}).atk || 0) < cap.atk);
    const team = room.length ? (rw.team || (rw.teamChance && Math.random() < rw.teamChance ? 1 : 0)) : 0;
    const bump = (id, n) => { mods[id] = Object.assign(mods[id] || {}, { atk: ((mods[id] || {}).atk || 0) + Gen.clipTo((mods[id] || {}).atk, n, cap.atk) }); };
    if (hp < Progress.maxHp(save) * 0.5) hp = Math.min(Progress.maxHp(save), hp + heal(rw.heal));
    else if (offered && !['prism', 'mjolnir', 'susanoo'].includes(offered.id)) relics.push(offered.id); // greedy: skip the situational relics
    else if (team) room.forEach((id) => bump(id, team));
    else if (room.length) bump(room[Math.floor(Math.random() * room.length)], rw.atk);
    else if (hp < Progress.maxHp(save)) hp = Math.min(Progress.maxHp(save), hp + heal(rw.heal));
  }
}

// Camp shopping plan of the campaign sim: [kind, id, level to reach] in order of priority (power first, comfort last).
const SHOP_PLAN = [['up', 'vitality', 1], ['unit', 'spear1'], ['up', 'provisions', 1], ['up', 'command', 1], ['up', 'drill', 1], ['up', 'vitality', 2], ['unit', 'archer2'], ['up', 'bulwark', 1], ['up', 'command', 2],
  ['up', 'vitality', 3], ['unit', 'banner1'], ['unit', 'horn1'], ['unit', 'mage1'], ['up', 'drill', 2], ['up', 'provisions', 2], ['up', 'bulwark', 2], ['up', 'command', 3], ['up', 'vitality', 4], ['up', 'fortune', 1], ['up', 'ward', 1],
  ['up', 'choice', 1], ['up', 'vitality', 5], ['up', 'command', 4], ['up', 'drill', 3], ['up', 'bulwark', 3], ['up', 'fortune', 2], ['up', 'provisions', 3], ['up', 'ward', 2], ['up', 'purse', 1], ['up', 'vitality', 6], ['up', 'command', 5],
  ['up', 'revive', 1], ['up', 'choice', 2], ['up', 'drill', 4], ['up', 'bulwark', 4], ['up', 'fortune', 3], ['up', 'purse', 2], ['up', 'vitality', 7], ['up', 'fortune', 4], ['up', 'purse', 3], ['up', 'board', 1], ['unit', 'spy1'], ['unit', 'ushabti1'], ['unit', 'horn2']];
let profiles = {
  'fresh account': Progress.freshSave(),
  'after ~5 runs (HP+6, spear, archer2)': Object.assign(Progress.freshSave(), { upgrades: { vitality: 2 }, squad: ['sword1', 'archer1', 'drum1', 'shield1', 'spear1'] }),
  'meadow boss beaten (HP+9, 6 slots, horn, Provisions 1)': Object.assign(Progress.freshSave(), { upgrades: { vitality: 3, command: 1, provisions: 1 }, unlocked: ['meadow', 'forest'], bossesBeaten: ['meadow'], squad: ['sword1', 'archer1', 'drum1', 'shield1', 'spear1', 'horn1'] }),
  'Greenvale done (HP+15, 7 slots, Drill 1, Provisions 2)': Object.assign(Progress.freshSave(), { upgrades: { vitality: 5, command: 2, drill: 1, bulwark: 1, provisions: 2 }, unlocked: ['meadow', 'forest', 'bamboo', 'lake', 'beach', 'dunes'], bossesBeaten: ['meadow', 'forest', 'bamboo', 'lake'], squad: ['sword1', 'archer1', 'drum1', 'shield1', 'spear1', 'horn1', 'mage1'] }),
};

// WP18 endgame account: every Camp track maxed, best squad (stars 3), no gear. Used by `node tools/sim-runs.js N endgame` with HEAT / DESCEND to see how hard the post-game is.
function endgameSave() {
  const s = Progress.freshSave();
  for (const u of Progress.UPGRADES) s.upgrades[u.id] = u.costs.length;
  s.unlocked = World.SUBAREAS.map((x) => x.id); s.bossesBeaten = World.SUBAREAS.map((x) => x.id); s.runs = 99;
  s.owned = Progress.ROSTER.map((u) => u.id); s.units = {}; for (const id of s.owned) s.units[id] = { stars: 3, xp: 250 };
  s.squad = []; for (const id of ['phoenix1', 'storm1', 'sword2', 'drum2', 'shield2', 'horn1', 'banner1', 'longbow1', 'spear2', 'mage2']) if (!Progress.canAdd(s, id)) s.squad.push(id);
  s.heat = (process.env.HEAT || '').split(',').filter(Boolean); s.descend = Number(process.env.DESCEND || 0);
  s.descendDone = s.descend; s.farm = true; s.hero = process.env.HERO || 'marshal';
  return s;
}
// Hero choice (WP15): HERO=<id> picks one (falls back to Marshal while locked); HERO=rotate cycles through the unlocked heroes run by run.
function setHero(save, force) {
  const want = process.env.HERO || 'marshal', list = Progress.HEROES.filter((h) => Progress.heroUnlocked(save, h.id));
  if (force && Progress.HERO_BY[want]) { save.hero = want; return; } // profiles: any hero, whatever the unlock state
  save.hero = want === 'rotate' ? list[(save.runs || 0) % list.length].id : (list.find((h) => h.id === want) || list[0]).id;
}
// Campaign: play consecutive runs, spending Souls greedily on the cheapest useful Camp upgrade or recruit,
// and report in which run each region's first boss fell.
function campaign(maxRuns) {
  const crystalBoss = new Set(); let simSeed = (Number(process.env.SEED) || 0) * 7919 + 12345; const simRnd = () => { simSeed = (simSeed * 1664525 + 1013904223) >>> 0; return simSeed / 4294967296; };
  let save = Progress.freshSave(); setHero(save); const firstRun = {}, unlockRun = {}, log = [];
  const order = ['vitality', 'provisions', 'command', 'drill', 'fortune', 'bulwark'].concat(process.env.NOTRACKS ? [] : ['ward', 'revive', 'choice', 'purse', 'board']); // WP16 tracks join the greedy shopping (NOTRACKS=1: ablation)
  for (let r = 1; r <= maxRuns; r++) {
    const res = playRun(save); const before = save.bossesBeaten.length;
    save = res.save; save.runs++; save.souls += Math.round(res.souls); save.run = null;
    if (r === 1) { const cheap = Progress.cheapestUpgrade(save); if (cheap && save.souls < cheap.cost) save.souls = cheap.cost; } // first-run guarantee (app.js endRun)
    setHero(save);
    for (const b of save.bossesBeaten) { for (const u of World.SUB_BY[b].unlocks) if (!(u in unlockRun)) unlockRun[u] = r; }
    // WP11 gacha approximation: Crystals = first boss kills (3 + region) + about 3 per run from bounties; spent on single pulls with a seeded rng.
    for (const b of save.bossesBeaten) if (!(crystalBoss.has(b))) { crystalBoss.add(b); save.crystals += Math.round(Progress.bossCrystals(World.SUB_BY[b].regionIndex)); }
    save.crystals += 3;
    while (!process.env.NOGACHA && save.crystals >= Progress.PULL_COST) { Progress.pull(save, 1, simRnd); }
    for (const b of save.bossesBeaten) { const reg = World.SUB_BY[b].region; if (!(reg in firstRun)) firstRun[reg] = r; }
    // Shopping (WP18 fix): a planning player buys power first (Vitality, Drill, Bulwark, Command, a few recruits) and saves up for the next item on
    // the list instead of buying whatever is cheapest (the old greedy rule spent early Souls on Purse / Ward / Choice and left Drill at 0 for 15 runs).
    // NOGREEDY-style old behaviour: SHOP=cheap.
    if (process.env.SHOP === 'cheap') {
      for (let guard = 0; guard < 20; guard++) {
        const opts = [];
        for (const u of Progress.ROSTER) if (!u.start && !save.owned.includes(u.id) && Progress.recruitAvailable(save, u) && u.cost <= save.souls) opts.push({ cost: u.cost, buy: () => { save.owned.push(u.id); if (!Progress.canAdd(save, u.id)) save.squad.push(u.id); } });
        for (const id of order) { const c = Progress.upgradeCost(save, id); if (c !== null && c <= save.souls) opts.push({ cost: c, buy: () => { save.upgrades[id] = (save.upgrades[id] || 0) + 1; } }); }
        if (!opts.length) break; opts.sort((a, b) => a.cost - b.cost); save.souls -= opts[0].cost; opts[0].buy();
      }
    } else for (let guard = 0; guard < 40; guard++) {
      let bought = false;
      for (const [kind, id, lv] of SHOP_PLAN) {
        if (kind === 'up') {
          if (!order.includes(id) || Progress.level(save, id) >= lv) continue;
          const c = Progress.upgradeCost(save, id); if (c === null) continue;
          if (c > save.souls) break; // save up for this one
          save.souls -= c; save.upgrades[id] = (save.upgrades[id] || 0) + 1; bought = true; break;
        } else {
          const u = Progress.ROSTER_BY[id];
          if (save.owned.includes(id) || !Progress.recruitAvailable(save, u)) continue;
          if (u.cost > save.souls) break;
          save.souls -= u.cost; save.owned.push(id); if (!Progress.canAdd(save, id)) save.squad.push(id); bought = true; break;
        }
      }
      if (!bought) break;
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
if (process.argv[3] === 'endgame') profiles = { ['endgame account, Heat ' + Progress.heatPoints(Object.assign(Progress.freshSave(), { heat: (process.env.HEAT || '').split(',').filter(Boolean) })) + ', Descend ' + Number(process.env.DESCEND || 0)]: endgameSave() };
if (process.argv[3] !== 'campaign') {
  for (const [name, save] of Object.entries(profiles)) {
    if (process.env.PROFILE && !name.includes(process.env.PROFILE)) continue;
    setHero(save, true); const res = []; for (let i = 0; i < N; i++) res.push(playRun(save));
    const avg = (f) => (res.reduce((n, r) => n + f(r), 0) / N).toFixed(1);
    console.log(`\n${name} (start Rations ${res[0].start}): battles won ${avg((r) => r.wins)}, bosses ${avg((r) => r.bosses)}, items ${avg((r) => r.items)}, deepest level ${avg((r) => r.maxLv)}, souls ${avg((r) => r.souls)}`);
    console.log('  ' + res.map((r) => (r.end === 'died' ? 'died at Lv' + r.diedAt : r.end === 'supplies' ? 'out of Rations' : 'cleared all') + ' after ' + r.wins).join(' | '));
  }
} else campaign(Number(process.argv[4] || 40));
