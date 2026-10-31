// Batch validator for the battle templates in prototype/js/gen.js (design 8.2).
// For many seeds per danger tier and a reference squad it asserts:
//   tier 1  : trivial        (a 1-turn 0-damage clear exists and even a very short search finds it)
//   tier 2-3: puzzle         (a 1-turn 0-damage clear exists, random placements rarely find it)
//   tier 4+ : survive        (no 1-turn clear exists, the best line costs 1-4 HP)
// Exits with code 1 and a report when any seed breaks its tier's rule.
// Usage: node tools/validate-gen.js [seedsPerTier=10] [tiers=1,2,3,4,5] [--verbose]
'use strict';
const Engine = require('../prototype/js/engine.js');
try { require('../prototype/js/world-layout.js'); } catch (e) { /* placeholder layout */ }
const World = require('../prototype/js/world-data.js');
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
const TIER_LEVELS = { 1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9], 4: [10, 11, 12], 5: [13, 14, 15] };
const SUB_FOR = { 1: 'forest', 2: 'lake', 3: 'cove', 4: 'rime', 5: 'caldera' };
const ROLES = ['basic', 'armored', 'barrel'];

// The deepest level of the last tier is met with a fully upgraded squad (Drill 4, Bulwark 4).
function refSave(tier, level) {
  const save = Object.assign(Progress.freshSave(), JSON.parse(JSON.stringify(REF[tier])));
  if (tier === 5 && level >= 15) { save.upgrades.drill = 4; save.upgrades.bulwark = 4; }
  return save;
}

function check(tier, level, seed, role, effort) {
  const save = refSave(tier, level), army = Progress.buildArmy(save, {});
  const node = { id: 'v-' + tier + '-' + level + '-' + seed, type: 'battle', level, sub: SUB_FOR[tier], role };
  const gen = Gen.generateBattle(node, 'validate' + seed);
  const stage = Object.assign({ heroHp: Progress.maxHp(save), heroMaxHp: Progress.maxHp(save) }, gen);
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
      const best = Solve.solve(state, army, 0, 3, { first: 10, later: 4, iters: 1200 });
      rec.cost = best.total;
      if (best.total < 1 || best.total > 4) rec.fails.push('best line costs ' + best.total + ' HP (want 1-4)');
    }
  }
  return rec;
}

function main() {
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
      recs.push(check(tier, level, i, ROLES[i % ROLES.length], effort));
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
