// Batch validator for the battle templates in prototype/js/gen.js (design 8.2).
// For many seeds per danger tier and a reference squad it asserts:
//   tier 1  : trivial        (a 1-turn 0-damage clear exists and even a very short search finds it)
//   tier 2-3: puzzle         (a 1-turn 0-damage clear exists, random placements rarely find it)
//   tier 4+ : survive        (no 1-turn clear exists, the best line costs 1-4 HP)
// Exits with code 1 and a report when any seed breaks its tier's rule.
// Usage: node tools/validate-gen.js [seedsPerTier=10] [tiers=1,2,3,4,5] [--verbose]
'use strict';
const Engine = require('../prototype/js/engine.js');
const World = require('../prototype/js/world-data.js');
require('../prototype/js/boss-defs.js');
const Gen = require('../prototype/js/gen.js');
const Progress = require('../prototype/js/progress.js');
const Solve = require('./solve.js');

// Reference squads: roughly what an account has when it first meets each tier (see sim-runs.js profiles).
const REF = {
  1: { upgrades: {}, squad: ['sword1', 'archer1', 'drum1', 'shield1', 'spear1'] },
  2: { upgrades: { vitality: 3, command: 1 }, squad: ['sword1', 'archer1', 'drum1', 'shield1', 'spear1', 'horn1'] },
  3: { upgrades: { vitality: 5, command: 2, drill: 1, bulwark: 1 }, squad: ['sword1', 'archer1', 'drum1', 'shield1', 'spear1', 'horn1', 'mage1'] },
  4: { upgrades: { vitality: 6, command: 3, drill: 2, bulwark: 2 }, squad: ['sword1', 'archer1', 'drum1', 'shield1', 'spear1', 'horn1', 'mage1', 'banner1'] },
  5: { upgrades: { vitality: 7, command: 4, drill: 3, bulwark: 3 }, squad: ['sword1', 'archer1', 'drum1', 'shield1', 'spear1', 'horn1', 'mage1', 'banner1', 'archer2'] },
};
// Bosses and elites are met mid-run by a median campaign account (WP18, from the sim's boss snapshots): it owns gacha units
// (Storm Mage, Rare swordsman), more Drill and Bulwark and less Vitality than the template references above (gear adds HP, see POWER).
const BOSS_REF = {
  1: REF[1], 2: REF[2],
  3: { upgrades: { vitality: 3, command: 3, drill: 1, bulwark: 2 }, squad: ['sword1', 'archer1', 'drum1', 'shield1', 'spear1', 'horn1', 'mage1', 'banner1', 'storm1'] },
  4: { upgrades: { vitality: 5, command: 3, drill: 2, bulwark: 2 }, squad: ['sword1', 'archer1', 'drum1', 'shield1', 'spear1', 'horn1', 'mage1', 'banner1', 'storm1'] },
  5: { upgrades: { vitality: 6, command: 4, drill: 2, bulwark: 3 }, squad: ['sword1', 'archer1', 'drum1', 'shield1', 'spear1', 'horn1', 'mage1', 'banner1', 'archer2', 'storm1'] },
};
// The first boss of each new level band (WP20: rice, the first of Greenvale's Lv7+ areas, and dshallows, the first of Ashkara) is the wall a freshly cleared Greenvale account meets (target: falls in run 5-10, WP18): it is checked
// against a lighter account (no gacha units, Drill 1) that still has the usual gear and relics.
const EARLY_BOSSES = ['rice', 'dshallows'];
const EARLY_REF = { upgrades: { vitality: 3, command: 2, drill: 1, bulwark: 1 }, squad: ['sword1', 'archer1', 'drum1', 'shield1', 'spear1', 'horn1', 'mage1', 'banner1'] };
const TIER_LEVELS = { 1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9], 4: [10, 11, 12], 5: [13, 14, 15] };
const SUB_FOR = { 1: 'forest', 2: 'lake', 3: 'ruins', 4: 'tomb', 5: 'citadel' };
const ROLES = ['basic', 'armored', 'barrel'];

// The deepest level of the last tier is met with a fully upgraded squad (Drill 4, Bulwark 4).
function refSave(tier, level, table) {
  const save = Object.assign(Progress.freshSave(), JSON.parse(JSON.stringify((table || REF)[tier])), { hero: null }); // heroless reference squads (hero passives would only make fights easier)
  if (!table && tier === 5 && level >= 15) { save.upgrades.drill = 4; save.upgrades.bulwark = 4; } // the deepest template level is met with a fully upgraded squad
  return save;
}

function check(tier, level, seed, role, effort) {
  const save = refSave(tier, level), army = Progress.buildArmy(save, {});
  const node = { id: 'v-' + tier + '-' + level + '-' + seed, type: 'battle', level, sub: SUB_FOR[tier], role };
  const gen = Gen.generateBattle(node, 'validate' + seed);
  const stage = Object.assign({ heroHp: Progress.maxHp(save), heroMaxHp: Progress.maxHp(save), rules: Progress.rulesFor(save) }, gen);
  const state = Engine.createState(stage);
  const rec = { tier, level, seed, template: gen.template || '?', enemies: gen.enemies.length, fails: [] };
  const clear = Solve.oneTurnClear(state, army, effort.restarts, effort.iters);
  rec.clear = !!clear;
  if (tier === 1) {
    rec.random = Solve.randomClearRate(state, army, 150);
    if (!clear) rec.fails.push('no 1-turn clear');
    else if (!Solve.oneTurnClear(state, army, 2, 400)) rec.fails.push('not trivial (a short search misses the clear)');
  } else if (tier <= 3) {
    rec.random = Solve.randomClearRate(state, army, 150);
    if (!clear) rec.fails.push('no 1-turn 0-damage clear');
    else if (rec.random > 0.35) rec.fails.push('too easy (random clears ' + Math.round(rec.random * 100) + '%)');
  } else {
    if (clear) rec.fails.push('1-turn clear exists');
    else {
      let best = Solve.solve(state, army, 0, 3, { first: 10, later: 4, iters: 1200 });
      // The annealing solver is stochastic: an out-of-range cost only counts if a stronger search confirms it.
      if (best.total > 4) { const b2 = Solve.solve(state, army, 0, 3, { first: 24, later: 8, iters: 2000 }); if (b2.total < best.total) best = b2; }
      rec.cost = best.total;
      if (best.total < 1 || best.total > 4) rec.fails.push('best line costs ' + best.total + ' HP (want 1-4)');
    }
  }
  return rec;
}

// ---------- Bosses and elites (handcrafted, one gimmick each) ----------
// Every boss and elite node of the world is generated for real and solved with the reference squad of its tier
// (a weaker one for the first boss). Rules: no one-turn clear for a boss (usually a two-turn fight), the best line
// clears within 4 turns, and costs at most 50% (boss) / 35% (elite) of the reference max HP.
// Summary line per fight: best-line HP cost and turns.
function bossSave(node) {
  const tier = World.danger(node.level);
  const save = node.type === 'boss' && EARLY_BOSSES.includes(node.sub) ? refSave(tier, node.level, { [tier]: EARLY_REF }) : refSave(tier, node.level, BOSS_REF);
  if (node.level <= 4) { save.upgrades = { vitality: 2 }; save.squad = ['sword1', 'archer1', 'drum1', 'shield1', 'spear1']; }
  return save;
}
// Power a player realistically has when meeting a boss or elite of this level, on top of the Camp upgrades and squad of its tier (WP18).
// Measured with `LOGBOSS=file node tools/sim-runs.js 1 campaign 30` (median over 4 seeds, see docs/IMPLEMENTATION_PLAN.md WP18):
//   atk    ATK added to every attacker: run rewards (+1 ATK per won fight), item sub-stats and sets, star and mastery bonuses
//   block  extra block on every Shield (gear, Order trait)
//   hp     max HP relative to the reference Camp (gear, mastery, trait bonuses; negative where the reference Camp is richer than the median account)
//   rules  engine rules the account carries: hero Marshal (plate), item sets (Wolfpack diag / bannerBite) and the 1-4 relics a run has found by then
// Heroless in the other checks; here the Marshal's passive and typical relics are included because every boss is met mid-run.
const POWER = [
  { upTo: 4,  atk: 3, block: 0, hp: 0,   rules: { plate: 1 } },
  { upTo: 6,  atk: 4, block: 1, hp: -4,  rules: { plate: 1, diag: 1, bannerBite: 1, sunder: 1 } },
  { upTo: 9,  atk: 4, block: 1, hp: 5,   rules: { plate: 1, diag: 1, bannerBite: 1, sunder: 1, opening: 1, reach: 1 } },
  { upTo: 12, atk: 5, block: 2, hp: 10,  rules: { plate: 1, diag: 1, bannerBite: 1, sunder: 1, opening: 1, reach: 1, stand: 1 } },
  { upTo: 14, atk: 6, block: 2, hp: 12,  rules: { plate: 1, diag: 1, bannerBite: 1, sunder: 1, opening: 1, reach: 1, stand: 1, barrier: 1 } },
  { upTo: 99, atk: 6, block: 3, hp: 15,  rules: { plate: 1, diag: 1, bannerBite: 1, sunder: 1, opening: 1, reach: 1, stand: 1, barrier: 1, aegis: 1 } },
];
const MAX_TURNS = Number(process.env.BOSS_TURNS || 4); // a boss must fall within this many turns
const powerAt = (level, node) => (node && node.type === 'boss' && EARLY_BOSSES.includes(node.sub) ? Object.assign({}, POWER.find((p) => level <= p.upTo), { atk: 3, hp: 10 }) : POWER.find((p) => level <= p.upTo));
function runMods(save, node) {
  const mods = {}, pw = powerAt(node.level, node);
  for (const id of save.squad) {
    const role = Engine.CARD_TYPES[Progress.ROSTER_BY[id].type].role;
    if (role === 'attacker') mods[id] = { atk: pw.atk };
    else if (role === 'defender' && pw.block) mods[id] = { block: pw.block };
  }
  return mods;
}
// The solver is stochastic: one unlucky search can miss a good line. A failure on cost is only final when two stronger
// searches (more restarts and iterations) agree; the best line over all tries counts. A found one-turn clear is always real.
function checkFight(node, effort, genOverride) {
  const save = bossSave(node), army = Progress.buildArmy(save, runMods(save, node));
  const maxHp = Progress.maxHp(save) + powerAt(node.level, node).hp;
  const gen = genOverride || Gen.generateBattle(node, 'validate-fight');
  const state = Engine.createState(Object.assign({ heroHp: maxHp, heroMaxHp: maxHp, rules: Object.assign(Progress.rulesFor(save), powerAt(node.level, node).rules) }, gen));
  const boss = node.type === 'boss';
  const rec = { id: node.id, level: node.level, boss, maxHp, fails: [], enemies: gen.enemies.length, hp: gen.enemies.reduce((n, e) => n + (e.type.endsWith('_barrel') ? 0 : e.hp), 0) };
  const clear = Solve.oneTurnClear(state, army, effort.restarts, effort.iters);
  rec.clear = !!clear;
  const limit = (boss ? 0.5 : 0.35) * maxHp;
  let best = Solve.solve(state, army, 0, MAX_TURNS, { first: effort.first, later: 3, iters: effort.iters });
  for (let k = 1; k <= 3 && best.total > limit; k++) { // escalate the search effort before calling a fight too hard
    const b2 = Solve.solve(state, army, 0, MAX_TURNS, { first: effort.first * (k + 1), later: 3 + k, iters: effort.iters + 600 * k });
    if (b2.total < best.total) best = b2;
  }
  rec.cost = best.total; rec.turns = best.line.length;
  if (boss && clear) rec.fails.push('boss falls in one turn');
  if (best.total >= 99) rec.fails.push('unwinnable in ' + MAX_TURNS + ' turns');
  else if (best.total > limit) rec.fails.push('best line costs ' + best.total + ' of ' + maxHp + ' HP');
  else if (best.total < 1 && boss) rec.fails.push('boss costs nothing');
  return rec;
}
function bossMain(args) {
  const only = args[0] && args[0] !== 'all' ? args[0].split(',') : null;
  const effort = { restarts: 10, iters: 1200, first: 10 };
  const nodes = World.nodes.filter((n) => (n.type === 'boss' || n.type === 'elite') && (!only || only.includes(n.sub) || only.includes(n.type)));
  let bad = 0; const failures = [];
  for (const n of nodes) {
    let rec = checkFight(n, effort);
    // The annealing solver is stochastic: a failure must repeat on a second try to count.
    if (rec.fails.length) rec = checkFight(n, effort);
    console.log(`${rec.id.padEnd(14)} Lv${String(rec.level).padEnd(3)} ${rec.boss ? 'boss ' : 'elite'} enemies ${rec.enemies} hp ${String(rec.hp).padEnd(4)} ref HP ${rec.maxHp} best cost ${String(rec.cost).padEnd(3)} turns ${rec.turns} oneTurn ${rec.clear ? 'yes' : 'no '} ${rec.fails.length ? 'FAIL ' + rec.fails.join('; ') : ''}`);
    if (rec.fails.length) { bad++; failures.push(`  ${rec.id}: ${rec.fails.join('; ')}`); }
  }
  if (bad) { console.log('\nFAILURES (' + bad + '/' + nodes.length + '):\n' + failures.join('\n')); process.exit(1); }
  console.log('\nAll ' + nodes.length + ' boss and elite fights pass.');
}

// ---------- Big enemies and the boss row (DESIGN_V2 section 10) ----------
// Fixture fights written with the optional `foot` (footprint per layout char) and `top` (boss row) fields of boss-defs.js, generated for real and
// solved like any boss / elite. They check that the solver and the engine cope with Big bodies and the gate, and give a first balance reading
// (the footprint HP / ATK budget of 10.5 is applied by the generator). Usage: node tools/validate-gen.js big
const BIG_FIXTURES = [
  { id: 'big-elite-2x1', level: 7, sub: 'forest', type: 'elite', def: { name: 'Twin-crest', back: 'b...b', front: '.tE..', foot: { E: '2x1' }, hp: 0.5, atk: 1, note: 'A wide elite.' }, boss: false },
  { id: 'big-elite-1x2', level: 8, sub: 'lake', type: 'elite', def: { name: 'Pillar', back: 'b....', front: 'b.E.b', foot: { E: '1x2' }, hp: 0.5, atk: 1, note: 'A deep elite.' }, boss: false },
  { id: 'big-elite-2x2', level: 14, sub: 'tomb', type: 'elite', def: { name: 'Colossus', back: 'b...b', front: '.E.b.', foot: { E: '2x2' }, hp: 0.5, atk: 1, note: 'A 2x2 elite.' }, boss: false },
  { id: 'big-boss-row', level: 8, sub: 'forest', type: 'boss', def: { name: 'Throne', back: 'b...b', front: 'b.b.b', top: '..B..', hp: 0.5, atk: 1, bossHp: 1.8, bossAtk: 1.1, gimmick: 'ward', gp: 2, intro: 'x' }, boss: true },
  { id: 'big-boss-3x1-row', level: 8, sub: 'forest', type: 'boss', def: { name: 'Wyrm', back: '.b.b.', front: 'b...b', top: 'B....', foot: { B: '3x1' }, hp: 0.5, atk: 1, bossHp: 1.8, bossAtk: 1.1, gimmick: 'regen', gpHp: 0.1, intro: 'x' }, boss: true },
];
function bigMain() {
  const effort = { restarts: 10, iters: 1200, first: 10 };
  let bad = 0;
  for (const f of BIG_FIXTURES) {
    const node = { id: f.id, type: f.type, level: f.level, sub: f.sub };
    const gen = Gen.generateFromDef(node, f.def, 'validate-big', f.boss);
    let rec = checkFight(node, effort, gen);
    if (rec.fails.length) rec = checkFight(node, effort, gen);
    console.log(`${rec.id.padEnd(18)} Lv${String(rec.level).padEnd(3)} ${rec.boss ? 'boss ' : 'elite'} enemies ${rec.enemies} hp ${String(rec.hp).padEnd(4)} ref HP ${rec.maxHp} best cost ${String(rec.cost).padEnd(3)} turns ${rec.turns} oneTurn ${rec.clear ? 'yes' : 'no '} ${rec.fails.length ? 'FAIL ' + rec.fails.join('; ') : ''}`);
    if (rec.fails.length) bad++;
  }
  if (bad) { console.log('\n' + bad + ' big-enemy fixtures fail'); process.exit(1); }
  console.log('\nAll ' + BIG_FIXTURES.length + ' big-enemy fixtures pass.');
}

function main() {
  if (process.argv[2] === 'big') return bigMain();
  if (process.argv[2] === 'bosses') return bossMain(process.argv.slice(3));
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const verbose = process.argv.includes('--verbose');
  const seeds = Number(args[0] || 10);
  const tiers = (args[1] || '1,2,3,4,5').split(',').map(Number);
  let bad = 0, total = 0;
  const failures = [];
  for (const tier of tiers) {
    const effort = tier >= 4 ? { restarts: 16, iters: 1500 } : { restarts: 12, iters: 1500 };
    const recs = [];
    for (let i = 0; i < seeds; i++) {
      const level = TIER_LEVELS[tier][i % 3];
      let rec = check(tier, level, i, ROLES[i % ROLES.length], effort);
      // The annealing solver is stochastic. A failure that says "the search did not find the clear / the line costs too much" is retried
      // with 2x and 3x the effort (WP18); failures that are certain (a one-turn clear exists where none should, too easy) are final.
      for (let k = 2; k <= 3 && rec.fails.length && rec.fails.every((f) => /no 1-turn|not trivial|best line costs|costs/.test(f)); k++) {
        rec = check(tier, level, i, ROLES[i % ROLES.length], { restarts: effort.restarts * k, iters: effort.iters + 600 * (k - 1) });
      }
      recs.push(rec);
    }
    const pass = recs.filter((r) => !r.fails.length).length;
    total += recs.length; bad += recs.length - pass;
    const byT = {};
    for (const r of recs) { (byT[r.template] = byT[r.template] || { n: 0, ok: 0 }); byT[r.template].n++; if (!r.fails.length) byT[r.template].ok++; }
    const extra = tier >= 4 ? 'avg best cost ' + (recs.filter((r) => r.cost !== undefined).reduce((n, r) => n + r.cost, 0) / Math.max(1, recs.filter((r) => r.cost !== undefined).length)).toFixed(1)
      : 'avg random-clear ' + Math.round(100 * recs.reduce((n, r) => n + (r.random || 0), 0) / recs.length) + '%';
    console.log(`Tier ${tier}: ${pass}/${recs.length} pass; ${extra}; templates ` + Object.entries(byT).map(([k, v]) => `${k} ${v.ok}/${v.n}`).join(', '));
    for (const r of recs) if (r.fails.length) failures.push(`  tier ${tier} Lv${r.level} seed ${r.seed} [${r.template}, ${r.enemies} enemies]: ${r.fails.join('; ')}`);
    if (verbose) for (const r of recs) console.log('   ', JSON.stringify(r));
  }
  if (bad) { console.log('\nFAILURES (' + bad + '/' + total + '):\n' + failures.join('\n')); process.exit(1); }
  console.log('\nAll ' + total + ' battles pass.');
}
main();
