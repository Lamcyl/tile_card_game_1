// Unit tests for the V2 units (docs/V2_UNITS_PLAN.md) on the pure rules engine, plus the flag-off equivalence fuzz.
// Usage: node tools/test-v2.js [--no-fuzz]      (exit code 1 on any failure)
// The fuzz compares the current engine with the golden copy of commit 33b83f5 (the last engine before V2): `git show 33b83f5:prototype/js/engine.js`,
// or the file in env BASE_ENGINE. With rules.v2 off, {state, events} must be byte-identical (JSON) over random battles, real V2 fights included.
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const E = require('../prototype/js/engine.js');
const V2 = require('../prototype/js/v2.js');
const DATA = path.join(__dirname, '..', 'docs', 'data');
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
V2.load(read('units.json'), read('elements.json'), read('families.json'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('ok   ' + name); } catch (err) { failed++; console.log('FAIL ' + name + '\n     ' + String(err.stack || err).split('\n').slice(0, 9).join('\n     ')); }
}
const noFuzz = process.argv.includes('--no-fuzz');

// ---------- helpers ----------
const RULES = { v2: 1 };
function foe(row, col, o) { return Object.assign({ type: 'goblin', row, col, hp: 10, atk: 2, armor: 0 }, o); }
function battle(enemies, rules) {
  const st = E.createState({ heroHp: 100, heroMaxHp: 100, enemies, rules: Object.assign({}, RULES, rules) });
  st.enemies.forEach((e, i) => { if (enemies[i].maxHp) e.maxHp = enemies[i].maxHp; if (enemies[i].element) e.element = enemies[i].element; });
  return st;
}
// list of [row, col, card] in placement order; a card is a V2 unit id (string, optional {opts}) or a raw card object.
function squad(list) {
  const placement = {}, army = [];
  list.forEach(([r, c, card, o]) => {
    const cd = typeof card === 'string' ? V2.card(card, o) : card;
    const id = cd.id + '@' + r + ',' + c; // unique per tile
    army.push(Object.assign({}, cd, { id })); placement[E.key(r, c)] = id;
  });
  return { placement, army };
}
const turn = (state, sq) => E.resolveTurn(state, sq.placement, sq.army);
const stat = (state, sq, k) => E.computeStats(sq.placement, sq.army, state.enemies, state.rules)[k];
const hits = (events) => events.filter((e) => e.t === 'hit');
const byId = (state, id) => state.enemies.find((e) => e.id === id);
const fires = (events) => events.filter((e) => e.t === 'fire').map((e) => e.key);
const classic = (type, o) => Object.assign({ type }, o);

// ---------- data and cards ----------
test('units.json: every unit has impl; implemented units use known primitives', () => {
  const units = read('units.json');
  assert.strictEqual(units.length, 89);
  for (const u of units) {
    assert.ok(['full', 'simplified', 'pending'].includes(u.impl), u.id);
    if (u.impl !== 'pending') assert.ok(V2.implemented(u), u.id);
    for (const b of u.behaviours || []) assert.ok(typeof b.p === 'string', u.id);
  }
  assert.ok(units.filter((u) => V2.implemented(u)).length >= 50);
});
test('V2.card: base numbers, stars and Mastery bonuses, shield bonuses, Command Points', () => {
  const a = V2.card('hongsa');
  assert.deepStrictEqual([a.type, a.v2, a.pattern, a.atk, a.range, a.cp, a.element, a.family], ['v2', true, 'straight', 2, 3, 1, 'water', 'wings']);
  const b = V2.card('hongsa', { stars: 3 }), c = V2.card('hongsa', { level: 5, stars: 5 });
  assert.deepStrictEqual([b.atk, b.range], [3, 3]);
  assert.deepStrictEqual([c.atk, c.range], [4, 4]);
  assert.strictEqual(V2.card('bixi').block, 3);
  assert.strictEqual(V2.card('bixi', { stars: 5, level: 5 }).block, 6);
  assert.strictEqual(V2.card('kunpeng').cp, 4);
  assert.strictEqual(V2.card('khan_garid').range, 99);
  assert.strictEqual(V2.card('plume_herald').atk, undefined);
});
test('stage patches: add, set, inc; stage is clamped to the evolution line', () => {
  const unit = { id: 'tst', name: 'Tst', element: 'fire', family: 'fangs', rarity: 'rare', roles: {}, evolution: [{ stage: 1 }, { stage: 2 }, { stage: 3 }],
    behaviours: [{ p: 'attack', pattern: 'straight', atk: 2, range: 1 }, { p: 'shield', block: 1 }],
    stages: { 2: [{ op: 'inc', p: 'attack', field: 'range', by: 1 }, { op: 'add', beh: { p: 'swift' } }], 3: [{ op: 'set', p: 'attack', set: { pattern: 'pierce' } }, { op: 'inc', p: 'shield', field: 'block' }] } };
  const keep = V2.UNITS;
  V2.load(Object.assign({}, keep, { tst: unit }));
  try {
    const s1 = V2.card('tst'), s2 = V2.card('tst', { stage: 2 }), s3 = V2.card('tst', { stage: 3 }), s9 = V2.card('tst', { stage: 9 });
    assert.deepStrictEqual([s1.range, s1.beh.length], [1, 2]);
    assert.deepStrictEqual([s2.range, s2.beh.some((b) => b.p === 'swift')], [2, true]);
    assert.deepStrictEqual([s3.pattern, s3.block], ['pierce', 2]);
    assert.strictEqual(s9.stage, 3);
    assert.strictEqual(V2.UNITS.tst.behaviours[0].range, 1, 'patching never mutates the data');
  } finally { V2.load(keep); }
});
test('role helpers: bastion is attacker and defender, herald only support, classic cards unchanged', () => {
  const st = battle([foe(1, 0)]), sq = squad([[2, 0, 'coconut_crab'], [3, 0, 'plume_herald'], [4, 0, classic('swordsman')], [4, 1, classic('shield')], [4, 2, classic('drummer')]]);
  const s = E.computeStats(sq.placement, sq.army, st.enemies, st.rules);
  const roles = (k) => [E.isAttacker(s[k]), E.isSupport(s[k]), E.isDefender(s[k])];
  assert.deepStrictEqual(roles('2,0'), [true, false, true]);
  assert.deepStrictEqual(roles('3,0'), [false, true, false]);
  assert.deepStrictEqual(roles('4,0'), [true, false, false]);
  assert.deepStrictEqual(roles('4,1'), [false, false, true]);
  assert.deepStrictEqual(roles('4,2'), [false, true, false]);
});

// ---------- attack patterns ----------
test('attack: straight, spread and pierce hit as in the classic rules', () => {
  const sq = squad([[2, 1, 'hongsa'], [2, 3, 'hammerhead'], [2, 4, 'karkadann']]);
  const st = battle([foe(1, 1), foe(0, 1), foe(1, 2), foe(1, 4), foe(0, 4), foe(1, 3)]);
  const r = turn(st, sq);
  const dm = (id) => hits(r.events).filter((h) => h.id === id).map((h) => h.amount);
  assert.deepStrictEqual(dm('e0'), [2]);          // hongsa straight ATK 2 on the column-1 front enemy
  assert.deepStrictEqual(dm('e1'), []);           // the one behind it is untouched
  assert.deepStrictEqual(dm('e2'), [1]);          // hammerhead spread R2 hits columns 2,3,4 front row (ATK 1)
  assert.deepStrictEqual(dm('e5'), [1]);
  assert.deepStrictEqual(dm('e3'), [1, 2]);       // spread (col 4) then the pierce
  assert.deepStrictEqual(dm('e4'), [2]);          // pierce goes through to the back row
});
test('skyfall: unlimited range from the back row, boss row stays behind the gate', () => {
  const sq = squad([[4, 2, 'khan_garid']]);
  const r = turn(battle([foe(1, 2), foe(0, 2)]), sq);
  assert.deepStrictEqual(hits(r.events).map((h) => [h.id, h.amount]), [['e0', 1]]);
  const r2 = turn(battle([foe(0, 2), foe(-1, 2)]), sq);
  assert.deepStrictEqual(hits(r2.events).map((h) => h.id), ['e0']);
});

// ---------- trample, swift, echo, chain ----------
test('trample: 1 damage to the enemy behind the target, and not as overkill', () => {
  const sq = squad([[2, 0, 'rakhsh']]);
  const r = turn(battle([foe(1, 0, { hp: 10 }), foe(0, 0, { hp: 10 })]), sq);
  assert.deepStrictEqual(hits(r.events).map((h) => [h.id, h.amount, h.dmg]), [['e0', 2, 2], ['e1', 1, 1]]);
  // a kill: the 2-damage hit kills the front enemy (HP 1), no overkill carry (leftover 1 would carry) is added
  const r2 = turn(battle([foe(1, 0, { hp: 1 }), foe(0, 0, { hp: 10 })]), sq);
  assert.ok(r2.events.some((e) => e.t === 'overkill'), 'classic overkill carry still happens');
  assert.strictEqual(byId(r2.state, 'e1').hp, 10 - 1 - 1);
});
test('trample: a boss-row body behind a living enemy is not reached (gate)', () => {
  const sq = squad([[2, 0, 'rakhsh']]);
  const r = turn(battle([foe(0, 0, { hp: 10 }), foe(-1, 0, { hp: 10 })]), sq);
  assert.strictEqual(byId(r.state, 'e1').hp, 10);
});
test('swift: attacks before the front row', () => {
  const sq = squad([[4, 0, 'ceryneian_hind'], [2, 1, 'hongsa'], [2, 0, classic('swordsman')]]);
  const r = turn(battle([foe(1, 0), foe(1, 1)]), sq);
  assert.deepStrictEqual(fires(r.events), ['4,0', '2,0', '2,1']);
});
test('echo: a second volley at half ATK rounded up; Echo Drum grants it to the unit above', () => {
  let r = turn(battle([foe(1, 0, { hp: 20 })]), squad([[2, 0, 'sleipnir']]));
  assert.deepStrictEqual(hits(r.events).map((h) => h.amount), [2, 1]);
  r = turn(battle([foe(1, 0, { hp: 20 })]), squad([[2, 0, 'sleipnir', { stars: 3 }]])); // ATK 3 -> 2
  assert.deepStrictEqual(hits(r.events).map((h) => h.amount), [3, 2]);
  r = turn(battle([foe(1, 0, { hp: 20 })]), squad([[2, 0, 'hongsa'], [3, 0, 'qiuniu']]));
  assert.deepStrictEqual(hits(r.events).map((h) => h.amount), [2, 1]);
  r = turn(battle([foe(1, 0, { hp: 20 })]), squad([[2, 0, 'hongsa']]));
  assert.deepStrictEqual(hits(r.events).map((h) => h.amount), [2]);
});
test('chain: the same damage jumps to the lowest-HP neighbour; half on a Water or Wet target', () => {
  const sq = squad([[2, 1, 'dolphin_chain']]);
  let r = turn(battle([foe(1, 1, { hp: 20 }), foe(1, 0, { hp: 9 }), foe(1, 2, { hp: 5 })]), sq);
  assert.deepStrictEqual(hits(r.events).map((h) => [h.id, h.amount]), [['e0', 2], ['e2', 2]]);
  assert.ok(r.events.some((e) => e.t === 'chain'));
  r = turn(battle([foe(1, 1, { hp: 20 }), foe(1, 2, { hp: 5, element: 'water' })]), squad([[2, 1, 'dolphin_chain', { stars: 3 }]])); // ATK 3
  assert.deepStrictEqual(hits(r.events).map((h) => [h.id, h.amount]), [['e0', 3], ['e1', 2]]);
  const wet = battle([foe(1, 1, { hp: 20 }), foe(1, 2, { hp: 5 })]); wet.enemies[1].st = { wet: 2 };
  r = turn(wet, sq);
  assert.deepStrictEqual(hits(r.events).map((h) => h.amount), [2, 1]);
});

// ---------- scale and molt ----------
test('pounce: +2 against a full-HP enemy only', () => {
  const sq = squad([[2, 0, 'suanni']]);
  let r = turn(battle([foe(1, 0, { hp: 10 })]), sq);
  assert.deepStrictEqual(hits(r.events).map((h) => h.amount), [4]);
  r = turn(battle([foe(1, 0, { hp: 8, maxHp: 10 })]), sq);
  assert.deepStrictEqual(hits(r.events).map((h) => h.amount), [2]);
});
test('latecomer and firstborn follow the placement order', () => {
  let sq = squad([[2, 0, 'puma_of_the_andes'], [2, 1, 'hongsa']]);
  const st = battle([foe(1, 0), foe(1, 1)]);
  assert.strictEqual(stat(st, sq, '2,0').atk, 2);
  sq = squad([[2, 1, 'hongsa'], [2, 0, 'puma_of_the_andes']]);
  assert.strictEqual(stat(st, sq, '2,0').atk, 4);
  assert.strictEqual(stat(st, sq, '2,1').atk, 2);
  sq = squad([[2, 0, 'salmon_of_knowledge'], [2, 1, 'hongsa']]);
  assert.strictEqual(stat(st, sq, '2,0').atk, 4);
  sq = squad([[2, 1, 'hongsa'], [2, 0, 'mantis_ambusher']]);
  assert.strictEqual(stat(st, sq, '2,0').atk, 2);
});
test('howl: +1 ATK per other Fangs unit in its row, max +2', () => {
  const st = battle([foe(1, 0)]);
  let sq = squad([[2, 0, 'cu_sidhe'], [2, 1, 'singha'], [2, 2, 'suanni'], [2, 3, 'amur_tiger'], [3, 0, 'singha']]);
  assert.strictEqual(stat(st, sq, '2,0').atk, 3);
  sq = squad([[2, 0, 'cu_sidhe'], [2, 1, 'singha'], [2, 2, 'hongsa']]);
  assert.strictEqual(stat(st, sq, '2,0').atk, 2);
});
test('molt: +1 ATK each turn survived, up to +3', () => {
  const sq = squad([[2, 0, 'yazi']]);
  let st = battle([foe(1, 0, { hp: 99, atk: 1 })]), seen = [];
  for (let t = 0; t < 6; t++) { seen.push(stat(st, sq, '2,0').atk); st = turn(st, sq).state; }
  assert.deepStrictEqual(seen, [1, 2, 3, 4, 4, 4]);
});

// ---------- buffs and shields ----------
test('buff: Herald and Kin bonus (adjacent Wings get +2), non-Kin +1, nothing for non-attackers', () => {
  const st = battle([foe(1, 0)]);
  const sq = squad([[3, 1, 'plume_herald'], [3, 0, 'hongsa'], [3, 2, 'singha'], [2, 1, 'bixi']]);
  assert.strictEqual(stat(st, sq, '3,0').atk, 2 + 2);
  assert.strictEqual(stat(st, sq, '3,2').atk, 3 + 1);
  assert.deepStrictEqual(stat(st, sq, '3,1').boosts.sort(), ['3,0', '3,2']);
});
test('buff: up, up2, range, column, row, kinOnly board, element kin', () => {
  const st = battle([foe(1, 0)]);
  let sq = squad([[4, 0, 'ratatoskr'], [3, 0, 'bixi'], [2, 0, 'hongsa']]);
  assert.strictEqual(stat(st, sq, '2,0').atk, 3, 'relay reaches two tiles up (over the shield)');
  sq = squad([[3, 0, 'thousand_year_crane'], [2, 0, 'hongsa']]);
  assert.strictEqual(stat(st, sq, '2,0').range, 4);
  sq = squad([[4, 1, 'indrik'], [2, 1, 'hongsa'], [3, 1, 'singha'], [2, 2, 'singha']]);
  assert.deepStrictEqual([stat(st, sq, '2,1').atk, stat(st, sq, '3,1').atk, stat(st, sq, '2,2').atk], [3, 4, 3]);
  sq = squad([[4, 0, 'humpback_cantor'], [4, 3, 'hongsa'], [3, 3, 'hongsa']]);
  assert.deepStrictEqual([stat(st, sq, '4,3').atk, stat(st, sq, '3,3').atk], [3, 2]);
  sq = squad([[4, 4, 'qilin'], [2, 0, 'rakhsh'], [2, 1, 'hongsa'], [3, 3, 'singha']]);
  assert.deepStrictEqual([stat(st, sq, '2,0').atk, stat(st, sq, '2,1').atk], [4, 2]);
  sq = squad([[3, 1, 'rain_dragon_chen'], [2, 1, 'hongsa'], [2, 2, 'amur_tiger']]);
  assert.strictEqual(stat(st, sq, '2,1').atk, 2 + 1); // up only: Water hongsa gets +1
  sq = squad([[3, 1, 'rain_dragon_chen'], [2, 1, 'amur_tiger']]);
  assert.strictEqual(stat(st, sq, '2,1').atk, 2 + 2); // Wood Kin +2
  sq = squad([[3, 1, 'salamander'], [3, 0, 'suanni'], [3, 2, 'hongsa']]);
  assert.deepStrictEqual([stat(st, sq, '3,0').atk, stat(st, sq, '3,2').atk], [4, 2]);
});
test('classic supports still boost V2 attackers, and V2 buffs boost classic attackers', () => {
  const st = battle([foe(1, 0)]);
  let sq = squad([[3, 0, classic('drummer')], [2, 0, 'hongsa']]);
  assert.strictEqual(stat(st, sq, '2,0').atk, 3);
  sq = squad([[3, 0, 'tui_mimic'], [2, 0, classic('swordsman')]]);
  assert.strictEqual(stat(st, sq, '2,0').atk, 4);
});
test('shield: V2 shields absorb in their column; a bastion attacks and blocks from one tile', () => {
  const st = battle([foe(1, 0, { atk: 5, hp: 50 }), foe(1, 1, { atk: 5, hp: 50 })]);
  const r = turn(st, squad([[2, 0, 'coconut_crab'], [3, 1, 'bixi']]));
  const s = r.events.filter((e) => e.t === 'strike');
  assert.deepStrictEqual(s.map((x) => [x.col, x.blocked, x.dmg]), [[0, 1, 4], [1, 3, 2]]);
  assert.strictEqual(hits(r.events).length, 1);
});
test('shield: Herd and Resonance guard count other Kin, Carapace grows when unstruck, Block buffs add', () => {
  const st = battle([foe(1, 0, { hp: 99, atk: 1 })]);
  let sq = squad([[3, 0, 'audhumbla'], [3, 1, 'singha'], [3, 2, 'rakhsh'], [3, 3, 'karkadann']]);
  assert.strictEqual(stat(st, sq, '3,0').block, 2 + 2);
  sq = squad([[3, 0, 'giant_panda'], [3, 1, 'amur_tiger'], [3, 2, 'cu_sidhe']]);
  assert.strictEqual(stat(st, sq, '3,0').block, 2 + 2);
  sq = squad([[3, 4, 'geobuk']]); // nobody strikes column 4: grows every turn
  let s2 = battle([foe(1, 0, { hp: 99, atk: 1 })]), seen = [];
  for (let t = 0; t < 5; t++) { seen.push(stat(s2, sq, '3,4').block); s2 = turn(s2, sq).state; }
  assert.deepStrictEqual(seen, [2, 3, 4, 5, 5]);
  sq = squad([[3, 0, 'geobuk']]); // struck every turn: stays
  s2 = battle([foe(1, 0, { hp: 99, atk: 1 })]); seen = [];
  for (let t = 0; t < 3; t++) { seen.push(stat(s2, sq, '3,0').block); s2 = turn(s2, sq).state; }
  assert.deepStrictEqual(seen, [2, 2, 2]);
  sq = squad([[3, 1, 'polar_bear'], [3, 0, 'bixi'], [3, 2, 'river_hippo'], [2, 1, 'hongsa']]);
  assert.deepStrictEqual([stat(st, sq, '3,0').block, stat(st, sq, '3,2').block, stat(st, sq, '3,1').block], [4, 4, 3]);
  assert.strictEqual(stat(st, sq, '2,1').atk, 3, 'hongsa is Water: polar bear gives +1 ATK to Water attackers');
});
test('shield: classic Shield gets V2 block buffs; Divine Tortoise is Kin only', () => {
  const st = battle([foe(1, 0)]);
  const sq = squad([[3, 0, 'divine_tortoise'], [4, 0, classic('shield')], [3, 1, 'bixi'], [3, 2, 'hongsa']]);
  assert.strictEqual(stat(st, sq, '3,1').block, 3 + 2);
  assert.strictEqual(stat(st, sq, '4,0').block, 3, 'a classic card has no family');
});

// ---------- determinism and smoke ----------
test('determinism: two runs of the same V2 battle are identical', () => {
  const run = () => {
    let st = battle([foe(1, 0, { hp: 14 }), foe(1, 1, { hp: 14 }), foe(0, 1, { hp: 9, element: 'water' }), foe(1, 2, { hp: 12 })]), out = [];
    const sq = squad([[2, 1, 'dolphin_chain'], [3, 1, 'qiuniu'], [2, 0, 'rakhsh'], [4, 0, 'ceryneian_hind'], [3, 2, 'yazi'], [3, 3, 'audhumbla']]);
    for (let t = 0; t < 4 && st.status === 'playing'; t++) { const r = turn(st, sq); out.push(r); st = r.state; }
    return JSON.stringify(out);
  };
  assert.strictEqual(run(), run());
});
test('smoke: every implemented unit builds at each stage and survives a 3-turn battle', () => {
  let n = 0;
  for (const u of Object.values(V2.UNITS)) {
    if (!V2.implemented(u)) continue;
    for (let stage = 1; stage <= V2.maxStage(u); stage++) {
      const cd = V2.card(u.id, { stage, level: 5, stars: 5 });
      const sq = squad([[2, 1, cd], [3, 1, 'plume_herald'], [3, 2, 'bixi'], [2, 2, classic('swordsman')]]);
      let st = battle([foe(1, 0, { hp: 6 }), foe(1, 1, { hp: 9 }), foe(0, 1, { hp: 9 }), foe(1, 2, { hp: 9 })]);
      for (let t = 0; t < 3 && st.status === 'playing'; t++) st = turn(st, sq).state;
      assert.ok(['playing', 'cleared', 'defeated'].includes(st.status), u.id);
      n++;
    }
  }
  assert.ok(n >= 50);
});

// ---------- flag-off equivalence fuzz ----------
function baseEngine() {
  if (process.env.BASE_ENGINE) return process.env.BASE_ENGINE;
  const rev = process.env.BASE_REV || '33b83f5'; // the last commit before V2 engine changes
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'engine-' + rev + '-'));
  const file = path.join(dir, 'engine-' + rev + '.js');
  try { fs.writeFileSync(file, execSync('git show ' + rev + ':prototype/js/engine.js', { cwd: path.join(__dirname, '..'), stdio: ['ignore', 'pipe', 'ignore'] })); } catch (err) { return null; }
  return file;
}
function makeRng(seed) { let s = seed >>> 0; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; return { rnd, ri: (n) => Math.floor(rnd() * n) }; }

// Plays one stage on both engines with the same army and placements for up to 6 turns; asserts identical {state, events}.
function playBoth(Old, stage, army, rng, label, flagOn) {
  const mk = (Eng) => Eng.createState(JSON.parse(JSON.stringify(stage)));
  let a = mk(Old), b = mk(E), turns = 0;
  const tiles = []; for (let r = 2; r <= 4; r++) for (let c = 0; c < 5; c++) tiles.push(r + ',' + c);
  for (let t = 0; t < 6 && a.status === 'playing'; t++) {
    const placement = {}, free = tiles.slice();
    for (const c of army) { if (rng.rnd() < 0.15 || !free.length) continue; placement[free.splice(rng.ri(free.length), 1)[0]] = c.id; }
    const ra = Old.resolveTurn(a, placement, army), rb = E.resolveTurn(b, placement, army);
    assert.strictEqual(JSON.stringify({ state: rb.state, events: rb.events }), JSON.stringify({ state: ra.state, events: ra.events }), label + ' turn ' + t + (flagOn ? ' (flag on)' : ''));
    a = ra.state; b = rb.state; turns++;
  }
  return turns;
}
function randomArmy(rng) {
  const types = ['swordsman', 'archer', 'spearman', 'mage', 'drummer', 'banner', 'horn', 'spyglass', 'shield'];
  const army = [];
  for (let i = 0; i < 4 + rng.ri(5); i++) {
    const type = types[rng.ri(types.length)], c = { id: 'u' + i, type };
    if (rng.rnd() < 0.3) { const t = E.CARD_TYPES[type]; if (t.role === 'attacker') { c.atk = t.atk + rng.ri(3); c.range = t.range + rng.ri(2); } if (t.role === 'defender') c.block = t.block + rng.ri(3); if (t.role === 'support' && t.effect !== 'mult') c.amount = t.amount + rng.ri(2); }
    if (rng.rnd() < 0.15) c.fx = { chain: true, ignoreArmor: rng.rnd() < 0.5 };
    if (rng.rnd() < 0.1 && E.CARD_TYPES[type].role === 'attacker') c.pattern = ['straight', 'pierce', 'spread'][rng.ri(3)];
    army.push(c);
  }
  return army;
}
const FUZZ_RULE_KEYS = ['spill', 'blast', 'echo', 'feast', 'opening', 'sunder', 'reach', 'plate', 'soften', 'aegis', 'bonusAtk', 'diag', 'bannerBite', 'healHalf', 'stand', 'mend', 'enrageMore', 'deepRow'];

function fuzz(flagOn) {
  const file = baseEngine();
  if (!file) { console.log('     (skipped: no base engine)'); return; }
  const Old = require(file);
  globalThis.Engine = E; // requiring the old engine overwrote the global that fights.js reads
  const rng = makeRng(flagOn ? 777 : 2024);
  let compared = 0, battles = 0;
  const bigFp = ['1x1', '1x1', '1x1', '2x1', '1x2', '2x2', '3x1'];
  const kinds = [null, null, null, 'healer', 'splitter', 'summoner', 'bulwark'];
  const gimmicks = [null, null, null, 'guard', 'ward', 'veil', 'gaze', 'sweep', 'stride', 'tide', 'regrow', 'regen', 'rage', 'harden'];
  // 1. random stages with Big bodies, boss row, every kind and gimmick
  for (let n = 0; n < 700; n++) {
    const enemies = [], bossRow = rng.rnd() < 0.3, occupied = new Set();
    const rows = bossRow ? [1, 0, -1] : [1, 0];
    for (const r of rows) for (let c = 0; c < 5; c++) if (rng.rnd() < 0.4) {
      const fp = r === -1 || rng.rnd() < 0.6 ? '1x1' : bigFp[rng.ri(bigFp.length)];
      const probe = { footprint: fp, row: r, col: c };
      if (E.validateLayout([probe]).length) continue;
      const cells = E.cellsOf(Object.assign(E.createState({ heroHp: 1, heroMaxHp: 1, enemies: [Object.assign({ type: 'goblin', hp: 1, atk: 1 }, probe)] }).enemies[0]));
      if (cells.some(([rr, cc]) => occupied.has(rr + ',' + cc))) continue;
      cells.forEach(([rr, cc]) => occupied.add(rr + ',' + cc));
      const e = { type: rng.rnd() < 0.12 && fp === '1x1' ? 'barrel' : 'goblin', row: r, col: c, hp: 1 + rng.ri(14), atk: 1 + rng.ri(4), armor: rng.rnd() < 0.2 ? 1 : 0 };
      if (fp !== '1x1') e.footprint = fp;
      if (e.type !== 'barrel') {
        const k = kinds[rng.ri(kinds.length)]; if (k) { e.kind = k; e.minion = { type: 'goblin', hp: 2, atk: 1 }; }
        const g = gimmicks[rng.ri(gimmicks.length)]; if (g && n % 3 === 0) { e.gimmick = g; e.gp = 1 + rng.ri(3); }
        if (rng.rnd() < 0.08) e.guardian = true;
      }
      enemies.push(e);
    }
    if (!enemies.length) continue;
    const rules = {}; for (const k of FUZZ_RULE_KEYS) if (rng.rnd() < 0.15) rules[k] = k === 'plate' || k === 'soften' || k === 'reach' || k === 'bonusAtk' ? 1 : 1;
    if (flagOn) rules.v2 = 1;
    const stage = { heroHp: 30 + rng.ri(30), heroMaxHp: 60, enemies, rules, bossRow: bossRow || undefined };
    if (flagOn && rules.deepRow) delete rules.deepRow;
    compared += playBoth(Old, stage, randomArmy(rng), rng, 'random stage ' + n, flagOn); battles++;
  }
  // 2. real V2 fights (700 generated), classic roster squads
  const Fights = require('../prototype/js/fights.js');
  const dir = path.join(__dirname, '..', 'prototype', 'data', 'fights');
  const files = fs.readdirSync(dir).filter((f) => /^region-.*\.json$/.test(f)).sort();
  Fights.load(files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))), {});
  Object.assign(Old.ENEMY_TYPES, E.ENEMY_TYPES);
  for (const fight of Fights.all) {
    if (rng.rnd() > 0.5) continue; // half of them keeps the run short
    const stage = Object.assign({ heroHp: 40, heroMaxHp: 40, rules: flagOn ? { v2: 1 } : {} }, Fights.stage(fight));
    Object.assign(Old.ENEMY_TYPES, E.ENEMY_TYPES); // Fights.stage registers the monster types on first use
    compared += playBoth(Old, stage, randomArmy(rng), rng, 'fight ' + fight.id, flagOn); battles++;
  }
  assert.ok(compared > 1500, 'compared ' + compared);
  console.log('     compared ' + compared + ' turns in ' + battles + ' battles');
}
if (!noFuzz) {
  test('fuzz: with rules.v2 off the engine is byte-identical to commit 33b83f5 (random Big/boss-row stages and the real V2 fights)', () => fuzz(false));
  test('fuzz: with rules.v2 on, classic cards and elementless enemies still match 33b83f5 (no Rend change in this step)', () => fuzz(true));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
