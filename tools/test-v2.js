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
const ELEMENTS_DOC = read('elements.json'), FAMILIES_DOC = read('families.json');
V2.load(read('units.json'), ELEMENTS_DOC, FAMILIES_DOC);

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('ok   ' + name); } catch (err) { failed++; console.log('FAIL ' + name + '\n     ' + String(err.stack || err).split('\n').slice(0, 9).join('\n     ')); }
}
const noFuzz = process.argv.includes('--no-fuzz');

// ---------- helpers ----------
const RULES = { v2: { sets: false } }; // the step 1 tests run without family and element set bonuses; the set tests use { v2: {} }
function foe(row, col, o) { return Object.assign({ type: 'goblin', row, col, hp: 10, atk: 2, armor: 0 }, o); }
function battle(enemies, rules) {
  const rl = Object.assign({}, RULES, rules);
  if (rl.v2 && typeof rl.v2 === 'object' && rl.v2.enemyElements === undefined) rl.v2 = Object.assign({ enemyElements: true }, rl.v2); // enemy elements are parked (default off): the element tests run with the switch on
  const st = E.createState({ heroHp: 100, heroMaxHp: 100, enemies, rules: rl });
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
  assert.strictEqual(units.length, 92);
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
  V2.load(Object.assign({}, keep, { tst: unit }), ELEMENTS_DOC, FAMILIES_DOC);
  try {
    const s1 = V2.card('tst'), s2 = V2.card('tst', { stage: 2 }), s3 = V2.card('tst', { stage: 3 }), s9 = V2.card('tst', { stage: 9 });
    assert.deepStrictEqual([s1.range, s1.beh.length], [1, 2]);
    assert.deepStrictEqual([s2.range, s2.beh.some((b) => b.p === 'swift')], [2, true]);
    assert.deepStrictEqual([s3.pattern, s3.block], ['pierce', 2]);
    assert.strictEqual(s9.stage, 3);
    assert.strictEqual(V2.UNITS.tst.behaviours[0].range, 1, 'patching never mutates the data');
  } finally { V2.load(keep, ELEMENTS_DOC, FAMILIES_DOC); }
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
  // a kill: the 2-damage hit kills the front enemy (HP 1); a V2 card without Rend carries no overkill, so the enemy behind only takes the Trample 1
  const r2 = turn(battle([foe(1, 0, { hp: 1 }), foe(0, 0, { hp: 10 })]), sq);
  assert.ok(!r2.events.some((e) => e.t === 'overkill'), 'no Rend, no carry');
  assert.strictEqual(byId(r2.state, 'e1').hp, 10 - 1);
  const r3 = turn(battle([foe(1, 0, { hp: 1 }), foe(0, 0, { hp: 10 })]), squad([[2, 0, classic('swordsman')]]));
  assert.ok(r3.events.some((e) => e.t === 'overkill'), 'classic cards still carry overkill under the flag');
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
test('chain: half the damage (at least 1) jumps to the lowest-HP neighbour (Dolphin; Conduct is a separate hit)', () => {
  const sq = squad([[2, 1, 'dolphin_chain']]);
  let r = turn(battle([foe(1, 1, { hp: 20 }), foe(1, 0, { hp: 9 }), foe(1, 2, { hp: 5 })]), sq);
  assert.deepStrictEqual(hits(r.events).map((h) => [h.id, h.amount]), [['e0', 2], ['e2', 1]]);
  assert.ok(r.events.some((e) => e.t === 'chain'));
  r = turn(battle([foe(1, 1, { hp: 20 }), foe(1, 2, { hp: 5, element: 'water' })]), squad([[2, 1, 'dolphin_chain', { stars: 3 }]])); // ATK 3, Water vs Water resists x0.5
  assert.deepStrictEqual(hits(r.events).map((h) => [h.id, h.amount]), [['e0', 3], ['e1', 1]]); // jump ceil(3 x 0.5) = 2, resisted by Water to 1
  assert.ok(V2.UNITS.dolphin_chain.behaviours.every((b) => b.wetVs === undefined), 'the legacy wetVs data is gone');
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
  assert.deepStrictEqual(seen, [2, 3, 4, 5, 5, 5]);
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
  assert.deepStrictEqual(seen, [3, 4, 5, 6, 6]);
  sq = squad([[3, 0, 'geobuk']]); // struck every turn: stays
  s2 = battle([foe(1, 0, { hp: 99, atk: 1 })]); seen = [];
  for (let t = 0; t < 3; t++) { seen.push(stat(s2, sq, '3,0').block); s2 = turn(s2, sq).state; }
  assert.deepStrictEqual(seen, [3, 3, 3]);
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

// ---------- step 2: elements, affinity, weakness hits, statuses, sets, keywords ----------
// A hand-made V2 attacker (family 'x' so no family set applies); extra fields override.
const U = (el, o) => Object.assign({ id: 'u', type: 'v2', v2: true, unit: 'u', element: el, family: 'x', pattern: 'straight', atk: 2, range: 3, cp: 1, beh: [{ p: 'attack', pattern: 'straight', atk: 2, range: 3 }] }, o);
const SH = (n, o) => Object.assign({ id: 'sh', type: 'v2', v2: true, unit: 'sh', element: null, family: 'x', block: n || 2, cp: 1, beh: [{ p: 'shield', block: n || 2 }] }, o);
const SETS_ON = { v2: {} };
const ev = (events, t) => events.filter((e) => e.t === t);
const play = (enemies, list, rules, turns, hp) => { let st = battle(enemies, rules), all = []; if (hp) st.hp = hp; const sq = squad(list); for (let i = 0; i < (turns || 1) && st.status === 'playing'; i++) { const r = turn(st, sq); all = all.concat(r.events); st = r.state; } return { st, events: all, sq }; };

test('enemy elements are parked: with rules.v2.enemyElements off (the default) enemies take plain damage, no weak events; merges still fire', () => {
  const off = (v2) => play([foe(1, 0, { hp: 30, element: 'wind' })], [[2, 0, U('water', { atk: 3 })], [3, 0, U('fire', { atk: 3 })]], { v2: Object.assign({ sets: false }, v2) });
  const a = off({ enemyElements: false }), b = off({});
  assert.strictEqual(ev(a.events, 'weak').length, 0); assert.strictEqual(JSON.stringify(a.events), JSON.stringify(b.events), 'default is off');
  assert.ok(ev(a.events, 'merge').length >= 1, 'column merges are unaffected');
  assert.ok(ev(off({ enemyElements: true, affinity: { water: { wind: 1.5 }, fire: { wind: 1.5 } } }).events, 'weak').length >= 1, 'switch on brings the chart back');
});

test('affinity: weak, resist, neutral and elementless enemies; rounding table 1 to 6', () => {
  assert.deepStrictEqual([1, 2, 3, 4, 5, 6].map((d) => V2.mul(d, 1.5)), [2, 3, 5, 6, 8, 9]);
  assert.deepStrictEqual([1, 2, 3, 4, 5, 6].map((d) => V2.mul(d, 0.5)), [1, 1, 2, 2, 3, 3]);
  const one = (att, def, atk) => { const r = play([foe(1, 0, { hp: 30, element: def })], [[2, 0, U(att, { atk })]]); return hits(r.events)[0].amount; };
  assert.strictEqual(one('water', 'fire', 3), 5, 'weak x1.5: 3 -> 5');
  assert.strictEqual(one('fire', 'water', 3), 2, 'resist x0.5: 3 -> 2');
  assert.strictEqual(one('fire', 'wind', 3), 3, 'neutral');
  assert.strictEqual(one('fire', undefined, 3), 3, 'an enemy without an element is x1');
  assert.strictEqual(one('fire', 'water', 1), 1, 'resist never goes below 1');
  assert.strictEqual(one('water', 'fire', 1), 2, 'weak: 1 -> 2');
});
test('affinity: the matrix is read from the rules, so a per-fight override applies', () => {
  const r = play([foe(1, 0, { hp: 30, element: 'wind' })], [[2, 0, U('fire', { atk: 2 })]], { v2: { affinity: { fire: { wind: 1.5 } } } });
  assert.strictEqual(hits(r.events)[0].amount, 3);
  assert.strictEqual(ev(r.events, 'weak')[0].mult, 1.5);
});
test('affinity: armour, Hide and Rend come after the multiplier', () => {
  const r = play([foe(1, 0, { hp: 30, element: 'fire', armor: 2 })], [[2, 0, U('water', { atk: 2 })]]);
  assert.deepStrictEqual([hits(r.events)[0].amount, hits(r.events)[0].dmg], [3, 1]);
});

const WHIT = {
  steam: ['water', 'fire'], smother: ['earth', 'fire'], conduct: ['lightning', 'water'], sap: ['wood', 'water'], wildfire: ['fire', 'wood'], uproot: ['wind', 'wood'],
  erode: ['water', 'earth'], roots: ['wood', 'earth'], static: ['lightning', 'wind'], ground: ['earth', 'lightning'], dawn: ['light', 'shadow'], gloom: ['shadow', 'light'],
};
test('weakness hits: all 12 are in the data and read from it', () => {
  assert.deepStrictEqual(Object.keys(V2.WEAKNESS_HITS).length, 12);
  for (const [id, [a, d]] of Object.entries(WHIT)) assert.strictEqual(V2.WEAKNESS_HITS[a + '>' + d].id, id);
});
function wk(id, check, o) {
  test('weakness hit ' + id, () => {
    const [a, d] = WHIT[id];
    o = Object.assign({ atk: 2, enemies: [foe(1, 0, { hp: 30, atk: 3, element: d }), foe(1, 1, { hp: 5, atk: 3 })], rules: null, turns: 1 }, o);
    const r = play(o.enemies, [[2, 0, U(a, { atk: o.atk })]], o.rules, o.turns, o.hp);
    check(r, byId(r.st, 'e0'), byId(r.st, 'e1'));
    assert.ok(ev(r.events, 'weak').some((w) => w.name && w.name.toLowerCase() === V2.WEAKNESS_HITS[a + '>' + d].name.toLowerCase()), 'a weak event names ' + id);
  });
}
wk('steam', (r, e0) => { assert.strictEqual(ev(r.events, 'strike').find((s) => s.id === 'e0').atk, 2, 'Chilled: ATK 3 -> 2 this turn'); assert.deepStrictEqual(e0.st.chill, [], 'expires at the end of the turn'); });
wk('smother', (r, e0) => assert.strictEqual(e0.atk, 3, 'its enrage is stopped this turn'), { enemies: [foe(1, 0, { hp: 30, atk: 3, element: 'fire', gimmick: 'rage', gp: 2 })] });
wk('conduct', (r) => { const h = hits(r.events); assert.deepStrictEqual(h.map((x) => [x.id, x.amount]), [['e0', 3], ['e1', 1]], 'half of the base 2 jumps to the lowest-HP neighbour'); }, { atk: 2 });
wk('sap', (r) => assert.strictEqual(ev(r.events, 'mend')[0].amount, 1), { enemies: [foe(1, 0, { hp: 30, atk: 3, element: 'water' })], hp: 50 });
wk('wildfire', (r, e0, e1) => { assert.deepStrictEqual([e0.st.burn.n, e0.st.burn.turns], [1, 1]); assert.ok(e1.st && e1.st.burn, 'spreads to a Wood neighbour'); }, { enemies: [foe(1, 0, { hp: 30, atk: 1, element: 'wood' }), foe(1, 1, { hp: 9, atk: 1, element: 'wood' })] });
wk('uproot', (r, e0) => assert.strictEqual(e0.col, 1, 'pushed one column'), { enemies: [foe(1, 0, { hp: 30, atk: 1, element: 'wood' })] });
wk('erode', (r, e0) => assert.strictEqual(e0.st.shred, 1));
wk('roots', (r, e0) => { assert.ok(!ev(r.events, 'strike').some((s) => s.id === 'e0'), 'held: no strike'); assert.strictEqual(e0.st.holdCd, 1, 'cooldown 1: cannot be held again next turn'); });
wk('static', (r, e0) => assert.strictEqual(e0.st.mark, true));
wk('ground', (r, e0) => assert.ok(!ev(r.events, 'strike').some((s) => s.col === 1 && s.splash), 'its chain keyword is cleansed'), { enemies: [foe(1, 0, { hp: 30, atk: 4, element: 'lightning', kw: ['chain'] })] });
wk('dawn', (r, e0) => { assert.ok(!e0.kw.includes('ghost')); assert.strictEqual(e0.st.noward, true); }, { enemies: [foe(1, 0, { hp: 30, atk: 1, element: 'shadow', kw: ['ghost'] })] });
wk('gloom', (r, e0) => assert.deepStrictEqual(e0.st.chill, [{ t: null }], 'Chilled for the battle'));
// the enemy fixtures need `kw` copied by createState
test('createState copies element, flavour and kw only when given (classic stages are unchanged)', () => {
  const st = E.createState({ heroHp: 5, heroMaxHp: 5, enemies: [{ type: 'goblin', row: 1, col: 0, hp: 1, atk: 1 }, { type: 'goblin', row: 1, col: 1, hp: 1, atk: 1, element: 'Fire', flavour: 'ice', kw: ['chill'] }] });
  assert.deepStrictEqual(Object.keys(st.enemies[0]).filter((k) => ['element', 'flavour', 'kw'].includes(k)), []);
  assert.deepStrictEqual([st.enemies[1].element, st.enemies[1].flavour, st.enemies[1].kw], ['Fire', 'ice', ['chill']]);
});
test('Fights.stage copies element, flavour and keywords only with { v2: true }', () => {
  const Fights = require('../prototype/js/fights.js');
  const dir = path.join(__dirname, '..', 'prototype', 'data', 'fights');
  Fights.load(fs.readdirSync(dir).filter((f) => /^region-.*\.json$/.test(f)).sort().map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))), {});
  const fight = Fights.all.find((f) => f.enemies.some((e) => e.element) && f.enemies.some((e) => e.inert && e.inert.length));
  assert.ok(fight);
  const a = Fights.stage(fight), b = Fights.stage(fight, { v2: true });
  assert.ok(a.enemies.every((e) => e.element === undefined && e.kw === undefined));
  assert.ok(b.enemies.some((e) => e.element) && b.enemies.some((e) => e.kw && e.kw.length));
  assert.ok(E.createState({ heroHp: 9, heroMaxHp: 9, enemies: b.enemies }).enemies.some((e) => e.kw));
});

test('status: Burn ticks at the start of the enemy phase for 2 turns, refreshes and does not stack', () => {
  const burner = U('fire', { atk: 1, beh: [{ p: 'attack', pattern: 'straight', atk: 1, range: 3 }, { p: 'onHit', status: 'burn', n: 1, turns: 2 }] });
  const r = play([foe(1, 0, { hp: 20, atk: 1 })], [[2, 0, burner]], null, 3);
  assert.deepStrictEqual(ev(r.events, 'tick').map((t) => [t.status, t.n]), [['burn', 1], ['burn', 1], ['burn', 1]], 'refreshed by every hit, never doubled');
  assert.deepStrictEqual(hits(r.events).filter((h) => h.source === 'burn').map((h) => h.dmg), [1, 1, 1]);
});
test('status: Poison is permanent, +1 per hit, cap 3, ignores armour', () => {
  const venom = U('wood', { atk: 1, beh: [{ p: 'attack', pattern: 'straight', atk: 1, range: 3 }, { p: 'onHit', status: 'venom', n: 1 }] });
  const r = play([foe(1, 0, { hp: 60, atk: 1, armor: 5 })], [[2, 0, venom]], null, 5);
  assert.deepStrictEqual(ev(r.events, 'tick').map((t) => t.n), [1, 2, 3, 3, 3]);
  assert.ok(hits(r.events).filter((h) => h.source === 'poison').every((h) => h.dmg === h.amount), 'armour 5 ignored');
});
test('status: Chill is -1 ATK per source, cap -2, min 1; a second Ice hit on a Chilled body Freezes (skips the strike), no refreeze for 2 turns', () => {
  const ice = U('water', { atk: 1, beh: [{ p: 'attack', pattern: 'straight', atk: 1, range: 3 }, { p: 'onHit', status: 'chill', n: 1 }] });
  const r = play([foe(1, 0, { hp: 60, atk: 5 })], [[2, 0, ice], [3, 0, ice], [4, 0, ice]], null, 1);
  assert.strictEqual(ev(r.events, 'strike').length, 0, 'turn 1: the 2nd Ice hit Freezes: no strike at all (all lanes)');
  assert.ok(ev(r.events, 'freeze').some((f) => f.skipped));
  assert.strictEqual(r.st.enemies[0].st.chill.length, 2, 'Chill is capped at -2');
  const one = play([foe(1, 0, { hp: 60, atk: 5 })], [[2, 0, ice]], null, 3);
  assert.deepStrictEqual(ev(one.events, 'strike').map((s) => s.atk), [4, 5], 'turn 1 Chill -1; turn 2 the 2nd Ice hit Freezes (skipped); turn 3 ATK 7 with Chill -2 and no refreeze yet');
});
test('status: Marked takes +1 on the first hit and is consumed; Hold skips the strike with a cooldown; Sunder shreds armour', () => {
  const mk = U('wind', { atk: 1, beh: [{ p: 'attack', pattern: 'straight', atk: 1, range: 3 }, { p: 'onHit', status: 'mark' }] });
  let r = play([foe(1, 0, { hp: 30, atk: 1 })], [[2, 0, mk]], null, 2);
  assert.deepStrictEqual(hits(r.events).map((h) => h.amount), [1, 2], 'the mark lands after turn 1 and adds +1 on the turn 2 hit (and is re-applied)');
  const hold = U('shadow', { atk: 1, beh: [{ p: 'attack', pattern: 'straight', atk: 1, range: 3 }, { p: 'onHit', status: 'hold', turns: 1, cooldown: 1 }] });
  r = play([foe(1, 0, { hp: 30, atk: 3 })], [[2, 0, hold]], null, 3);
  assert.deepStrictEqual(ev(r.events, 'strike').map((s) => s.id).length, 1, 'held on turn 1, cooling on turn 2, held again on turn 3');
  const sun = U('earth', { atk: 2, beh: [{ p: 'attack', pattern: 'straight', atk: 2, range: 3 }, { p: 'onHit', status: 'sunder' }] });
  r = play([foe(1, 0, { hp: 30, atk: 1, armor: 2 })], [[2, 0, sun]], null, 3);
  assert.deepStrictEqual(hits(r.events).map((h) => h.dmg), [0, 1, 2], 'armour -1 per application');
});
test('status: a Big body takes a status once per attack action and ticks once per turn', () => {
  const spread = U('wood', { atk: 1, pattern: 'spread', beh: [{ p: 'attack', pattern: 'spread', atk: 1, range: 3 }, { p: 'onHit', status: 'venom', n: 1 }] });
  const r = play([foe(1, 0, { hp: 30, atk: 1, footprint: '2x1' })], [[2, 1, spread]], null, 1);
  assert.strictEqual(hits(r.events).filter((h) => h.id === 'e0' && h.source !== 'poison').length, 2, 'hit in both covered columns');
  assert.strictEqual(r.st.enemies[0].st.poison, 1, 'Poison applied once');
  assert.strictEqual(ev(r.events, 'tick').length, 1);
});

test('Rend: V2 cards carry overkill only with Rend, capped at 3 (4 with the Fangs 4-set); classic cards unchanged', () => {
  const rend = U('fire', { atk: 9, beh: [{ p: 'attack', pattern: 'straight', atk: 9, range: 3 }, { p: 'rend', cap: 3 }] });
  let r = play([foe(1, 0, { hp: 1 }), foe(0, 0, { hp: 20 })], [[2, 0, rend]]);
  assert.deepStrictEqual(ev(r.events, 'overkill').map((o) => o.amount), [3], 'leftover 8 capped at 3');
  r = play([foe(1, 0, { hp: 1 }), foe(0, 0, { hp: 20 })], [[2, 0, U('fire', { atk: 9 })]]);
  assert.strictEqual(ev(r.events, 'overkill').length, 0);
  const fangs = (n) => Array.from({ length: n }, (_, i) => [2 + (i > 2 ? 1 : 0), i % 3 === 0 ? 0 : i % 3, U('fire', { family: 'fangs', atk: 9, beh: [{ p: 'attack', pattern: 'straight', atk: 9, range: 3 }, { p: 'rend', cap: 3 }] })]);
  r = play([foe(1, 0, { hp: 1 }), foe(0, 0, { hp: 20 })], fangs(4).map(([r0, c, u], i) => [2 + (i > 1 ? 1 : 0), i % 2 ? 1 : 0, u]), SETS_ON);
  assert.ok(ev(r.events, 'overkill').some((o) => o.amount === 4), 'Fangs 4-set: Rend cap 4');
});

test('element sets: Fire 2 (+1 ATK turn 1), Wind 2 (+1 range) and 4 (first hit doubled), Earth 2 (+1 block) and 4 (ignore 1 armour), Water 4 heals, Shadow 4 safe turn 1', () => {
  const st = battle([foe(1, 0, { hp: 99 })], SETS_ON);
  let sq = squad([[2, 0, U('fire')], [2, 1, U('fire')], [2, 2, U('water')]]);
  assert.deepStrictEqual([stat(st, sq, '2,0').atk, stat(st, sq, '2,2').atk], [3, 2]);
  assert.strictEqual(E.computeStats(sq.placement, sq.army, st.enemies, st.rules, 2)['2,0'].atk, 2, 'only on turn 1');
  sq = squad([[2, 0, U('wind')], [2, 1, U('wind')]]);
  assert.strictEqual(stat(st, sq, '2,0').range, 4);
  sq = squad([[2, 0, U('earth')], [3, 0, SH(2, { element: 'earth' })]]);
  assert.strictEqual(stat(st, sq, '3,0').block, 3);
  let r = play([0, 1, 2, 3].map((c) => foe(1, c, { hp: 99, armor: 2 })), [[2, 0, U('earth')], [2, 1, U('earth')], [2, 2, U('earth')], [2, 3, U('earth')]], SETS_ON);
  assert.deepStrictEqual(hits(r.events).slice(0, 4).map((h) => h.dmg), [1, 1, 1, 1], 'Earth 4: 2 - (2 - 1) = 1');
  r = play([foe(1, 0, { hp: 99 })], [[2, 0, U('wind', { atk: 1 })], [2, 1, U('wind')], [3, 0, U('wind')], [3, 1, U('wind')]], SETS_ON);
  assert.strictEqual(hits(r.events)[0].amount, 2, 'Wind 4: the first hit of the turn is doubled (1 -> 2)');
  const hurt = battle([foe(1, 0, { hp: 99, atk: 1 })], SETS_ON); hurt.hp = 50;
  r = turn(hurt, squad([[2, 0, U('water')], [2, 1, U('water')], [2, 2, U('water')], [2, 3, U('water')]]));
  assert.ok(ev(r.events, 'mend').some((m) => m.amount === 1), 'Water 4: the hero heals 1 per turn');
  r = play([foe(1, 0, { hp: 99, atk: 5 })], [[2, 0, U('shadow')], [2, 1, U('shadow')], [2, 2, U('shadow')], [2, 3, U('shadow')]], SETS_ON);
  assert.ok(ev(r.events, 'strike').every((s) => s.dmg === 0), 'Shadow 4: the hero cannot be struck on turn 1');
});
test('family sets: Wings 2 range, Hooves 2 ATK on turn 1 and 4 Swift, Fangs 2 Rend, Scales 2 block, Wilds count as any family', () => {
  const st = battle([foe(1, 0, { hp: 99 })], SETS_ON), F = (f, o) => U('none', Object.assign({ family: f }, o));
  let sq = squad([[2, 0, F('wings')], [2, 1, F('wings')]]);
  assert.strictEqual(stat(st, sq, '2,0').range, 4);
  sq = squad([[2, 0, F('hooves')], [2, 1, F('hooves')], [2, 2, F('hooves')], [2, 3, F('hooves')]]);
  assert.deepStrictEqual([stat(st, sq, '2,0').atk, !!stat(st, sq, '2,0').v2.swift], [3, true]);
  sq = squad([[2, 0, F('fangs')], [2, 1, F('fangs')]]);
  assert.strictEqual(stat(st, sq, '2,0').v2.rend, 3);
  sq = squad([[3, 0, SH(2, { family: 'scales' })], [3, 1, SH(2, { family: 'scales' })]]);
  assert.strictEqual(stat(st, sq, '3,0').block, 3);
  sq = squad([[2, 0, F('wings')], [2, 1, F('wilds')], [2, 2, F('wilds')]]);
  assert.strictEqual(stat(st, sq, '2,0').range, 4, '2 Wilds: one counts as a Wings unit, so the 2-set of Wings is on');
  sq = squad([[2, 0, F('wings')], [2, 1, F('wilds')]]);
  assert.strictEqual(stat(st, sq, '2,0').range, 3, 'one Wilds alone gives nothing');
});

test('keywords: chill, chain, ghost, skewer, leech, chief, grudge, thorn', () => {
  let r = play([foe(1, 0, { hp: 99, atk: 1, kw: ['chill'] })], [[2, 0, U('fire')]], null, 2);
  assert.deepStrictEqual(hits(r.events).map((h) => h.amount), [2, 1], 'struck column loses 1 ATK next turn');
  r = play([foe(1, 2, { hp: 99, atk: 4, kw: ['chain'] })], [[2, 2, U('fire', { atk: 1 })]]);
  assert.deepStrictEqual(ev(r.events, 'strike').map((s) => [s.col, s.atk]), [[2, 4], [1, 2], [3, 2]]);
  r = play([foe(1, 0, { hp: 99, kw: ['ghost'] })], [[2, 0, U('fire', { atk: 3 })]]);
  assert.strictEqual(hits(r.events)[0].amount, 2, 'plain hit: 1 less');
  r = play([foe(1, 0, { hp: 99, kw: ['ghost'], element: 'wood' })], [[2, 0, U('fire', { atk: 3 })]]);
  assert.strictEqual(hits(r.events)[0].amount, 5, 'a weak hit is not plain');
  r = play([foe(1, 0, { hp: 99, kw: ['ghost'] })], [[2, 0, U('light', { atk: 3 })]]);
  assert.strictEqual(hits(r.events)[0].amount, 3, 'Light reveals it');
  r = play([foe(1, 0, { hp: 99, atk: 3, kw: ['skewer'] })], [[2, 0, U('fire')], [3, 0, SH(5)]]);
  assert.strictEqual(ev(r.events, 'strike')[0].blocked, 0);
  r = play([foe(1, 0, { hp: 99, atk: 3, kw: ['leech'], maxHp: 99 })], [[2, 0, U('fire', { atk: 1 })]]);
  assert.strictEqual(r.st.enemies[0].hp, 99 - 1 + 1);
  r = play([foe(1, 0, { hp: 99, atk: 3 }), foe(1, 1, { hp: 99, atk: 3, kw: ['chief'] })], [[2, 3, U('fire', { atk: 1 })]]);
  assert.strictEqual(ev(r.events, 'strike').find((s) => s.id === 'e0').atk, 4, 'a Chief beside it: +1 ATK');
  r = play([foe(1, 0, { hp: 1, atk: 3 }), foe(1, 1, { hp: 99, atk: 3, kw: ['grudge'] })], [[2, 0, U('fire', { atk: 5 })]]);
  assert.strictEqual(ev(r.events, 'strike').find((s) => s.id === 'e1').atk, 5, 'a neighbour died: +2 ATK');
  const th = battle([foe(1, 0, { hp: 99, atk: 1, kw: ['thorn'] })]);
  assert.strictEqual(turn(th, squad([[2, 0, U('fire')], [2, 1, U('fire')]])).events.filter((e) => e.t === 'thorn').length, 1, 'once per turn per body');
});

// ---------- step 2b: column merges ----------
const col0 = (...els) => els.map((el, i) => [2 + i, 0, typeof el === 'string' ? U(el) : el]); // a column: first = front
const mergesOf = (list, rules) => { const st = battle([foe(1, 0, { hp: 99 })], rules), sq = squad(list); const stats = E.computeStats(sq.placement, sq.army, st.enemies, st.rules, 1); return Object.fromEntries(Object.entries(stats).filter(([, s]) => s.merges).map(([k, s]) => [k, s.merges.map((m) => m.id)])); };
test('merges: all 36 pairs resolve from the data; the front-most attacker of the pair carries', () => {
  const doc = ELEMENTS_DOC.merges;
  assert.strictEqual(doc.length, 36);
  for (const m of doc) {
    const [a, b] = m.pair;
    const list = a === b ? col0(a, a) : col0(b, a); // the second element of the pair in front
    const got = mergesOf(list);
    assert.deepStrictEqual(got, { '2,0': [m.id] }, m.id);
  }
});
test('merges: pairs of a mixed column (A,A,B = Resonance(A) + A+B; A,B,C = three pairs), cap 3, one merge once per column', () => {
  assert.deepStrictEqual(mergesOf(col0('fire', 'fire', 'water')), { '2,0': ['scald', 'resonance_fire'] });
  assert.deepStrictEqual(mergesOf(col0('fire', 'fire', 'fire')), { '2,0': ['resonance_fire'] });
  const m3 = mergesOf(col0('fire', 'water', 'wood'));
  assert.deepStrictEqual(m3, { '2,0': ['scald', 'kindle'], '3,0': ['bloom'] }, 'fire+water and fire+wood ride on the front fire card, water+wood on the water card');
  const old = ELEMENTS_DOC.mergeRules.cap.perColumnPerTurn;
  V2.load(V2.UNITS, Object.assign({}, ELEMENTS_DOC, { mergeRules: Object.assign({}, ELEMENTS_DOC.mergeRules, { cap: { perColumnPerTurn: 2 } }) }), FAMILIES_DOC);
  try { assert.strictEqual(Object.values(mergesOf(col0('fire', 'water', 'wood'))).flat().length, 2, 'the cap is data'); } finally { V2.load(V2.UNITS, ELEMENTS_DOC, FAMILIES_DOC); }
  assert.strictEqual(old, 3);
});
test('merges: Shields, pure supports, 0-ATK cards, classic and elementless cards never merge; columns are independent', () => {
  assert.deepStrictEqual(mergesOf([[2, 0, U('fire')], [3, 0, SH(2, { element: 'water' })]]), {});
  assert.deepStrictEqual(mergesOf([[2, 0, U('fire')], [3, 0, U('water', { atk: 0, beh: [{ p: 'attack', pattern: 'straight', atk: 0, range: 3 }] })]]), {});
  assert.deepStrictEqual(mergesOf([[2, 0, U('fire')], [3, 0, classic('swordsman')]]), {});
  assert.deepStrictEqual(mergesOf([[2, 0, U('fire')], [3, 0, U(null)]]), {});
  assert.deepStrictEqual(mergesOf([[2, 0, U('fire')], [2, 1, U('water')]]), {}, 'Same column only');
  assert.deepStrictEqual(mergesOf([[2, 0, U('fire')], [4, 0, U('water')]]), { '2,0': ['scald'] }, 'attackers need not be adjacent');
  assert.deepStrictEqual(mergesOf([[2, 0, U('fire', { atk: 0, beh: [{ p: 'attack', pattern: 'straight', atk: 0, range: 3 }] })], [3, 0, U('water')], [4, 0, U('wood')]]), { '3,0': ['bloom'] }, '0-ATK card is out of the pair list');
  const hy = U('fire', { block: 2, beh: [{ p: 'attack', pattern: 'straight', atk: 2, range: 3 }, { p: 'shield', block: 2 }] });
  assert.deepStrictEqual(mergesOf([[2, 0, hy], [3, 0, U('water')]]), { '2,0': ['scald'] }, 'a hybrid counts once, with its single element');
});
const dmgs = (r) => hits(r.events).filter((h) => !['burn', 'poison'].includes(h.source)).map((h) => [h.id, h.amount]);
test('merge effects: Plasma +2, Scald chill and +1, bonus damage capped at +2, overlap keeps the strongest', () => {
  let r = play([foe(1, 0, { hp: 99, atk: 4 })], col0('lightning', 'fire'));
  assert.deepStrictEqual(dmgs(r)[0], ['e0', 4], 'Plasma: carrier 2 + 2');
  r = play([foe(1, 0, { hp: 99, atk: 4 })], col0('water', 'fire'));
  assert.deepStrictEqual([dmgs(r)[0][1], r.st.enemies[0].st.chill.length], [3, 0]);
  assert.strictEqual(ev(r.events, 'strike')[0].atk, 3, 'Scald: -1 ATK this turn');
  r = play([foe(1, 0, { hp: 99 })], col0('fire', 'lightning', 'water'));
  assert.strictEqual(dmgs(r)[0][1], 2 + 2, 'Plasma (+2) and Scald (+1) on one carrier: capped at +2');
  r = play([foe(1, 0, { hp: 99 })], col0('fire', 'wood', 'earth'));
  assert.strictEqual(r.st.enemies[0].st.burn.n * r.st.enemies[0].st.burn.mult, 2, 'Kindle (n2) and Magma (n1 x2 ticks) are the same status: one burn of 2 per tick, not 4');
});
test('merge effects: Magma, Blaze, Spores, Sandstorm, Quake, Tempest, Surge', () => {
  let r = play([foe(1, 0, { hp: 99, armor: 2 })], col0('fire', 'earth'));
  assert.strictEqual(hits(r.events)[0].dmg, 1, 'Magma: the hit ignores 1 armour (2 - 1)');
  r = play([foe(1, 0, { hp: 99 }), foe(1, 1, { hp: 99 })], col0('fire', 'wind'));
  assert.ok(byId(r.st, 'e1').st.burn, 'Blaze: neighbours burn');
  r = play([foe(1, 0, { hp: 99 }), foe(1, 1, { hp: 99 })], col0('wood', 'wind'));
  assert.strictEqual(byId(r.st, 'e1').st.poison, 1, 'Spores: venom on the neighbours');
  r = play([foe(1, 0, { hp: 99 })], col0('earth', 'wind'));
  assert.deepStrictEqual(dmgs(r).map((d) => d[1]), [2, 3], 'Sandstorm: Marked by the carrier, the next hit deals +1');
  r = play([foe(1, 0, { hp: 99 }), foe(0, 0, { hp: 99 })], col0('earth', 'lightning'));
  assert.deepStrictEqual(dmgs(r).map((d) => d[1]).slice(0, 2), [2, 1], 'Quake: half behind the target');
  r = play([foe(1, 0, { hp: 99 })], col0('wind', 'lightning'));
  assert.strictEqual(ev(r.events, 'echo').length, 1, 'Tempest: an echo volley');
  r = play([foe(1, 0, { hp: 99 }), foe(1, 1, { hp: 99 })], col0('water', 'lightning'));
  assert.ok(ev(r.events, 'chain').length >= 1, 'Surge: a full jump');
});
test('merge effects: Bloom, Charge, Mist, Grove (column effects), Radiance, Eclipse, Twilight', () => {
  let st = battle([foe(1, 0, { hp: 99, atk: 3 })]); st.hp = 50;
  const sq = squad(col0('water', 'wood'));
  let r = turn(st, sq);
  assert.ok(ev(r.events, 'mend').some((m) => m.amount === 2), 'Bloom: hero heals 2');
  assert.strictEqual(stat(r.state, sq, '2,0').atk, 3, 'Bloom: +1 ATK to the column next turn');
  r = play([foe(1, 0, { hp: 99, atk: 3 })], col0('water', 'wind'));
  assert.strictEqual(ev(r.events, 'strike')[0].blocked, 1, 'Mist: the column blocks 1');
  r = play([foe(1, 0, { hp: 99, atk: 3 })], col0('wood', 'earth'));
  assert.strictEqual(ev(r.events, 'strike')[0].blocked, 1, 'Grove: the column blocks 1');
  r = play([foe(1, 0, { hp: 99, atk: 1 })], col0('wood', 'lightning'));
  const st2 = battle([foe(1, 0, { hp: 99, atk: 1 })]), sq2 = squad(col0('wood', 'lightning'));
  assert.strictEqual(stat(turn(st2, sq2).state, sq2, '2,0').atk, 3, 'Charge: +1 next turn');
  r = play([foe(1, 0, { hp: 99 })], col0('light', 'fire'));
  assert.deepStrictEqual([r.st.enemies[0].st.burn.n, r.st.enemies[0].st.burn.turns], [1, 2], 'Radiance (Fire): Burn 1 for 3 turns, one tick already paid');
  r = play([foe(1, 0, { hp: 99 })], col0('light', 'wood'));
  assert.strictEqual(r.st.enemies[0].st.poison, 2, 'Radiance (Wood): Poison 2');
  r = play([foe(1, 0, { hp: 99, armor: 3, gimmick: 'ward', gp: 5 })], col0('shadow', 'fire'));
  assert.deepStrictEqual([hits(r.events)[0].warded, hits(r.events)[0].dmg], [null, 1], 'Eclipse: ignores Hide; armour 3 - 2 = 1 absorbs 1 of the 2 damage');
  r = play([foe(1, 0, { hp: 99, atk: 3, kw: ['ghost'] })], col0('light', 'shadow'));
  assert.ok(r.st.enemies[0].st.hold === false && ev(r.events, 'strike').length === 0, 'Twilight: held');
  assert.ok(!r.st.enemies[0].kw.includes('ghost'));
});
test('merge effects: Resonance of each element', () => {
  let r = play([foe(1, 0, { hp: 99 })], col0('fire', 'fire'));
  assert.strictEqual(r.st.enemies[0].st.burn.n, 2);
  let st = battle([foe(1, 0, { hp: 99, atk: 4 })]); st.hp = 50;
  r = turn(st, squad(col0('water', 'water')));
  assert.ok(ev(r.events, 'mend').some((m) => m.amount === 2) && ev(r.events, 'strike')[0].blocked === 1, 'Water: heal 2 and +1 column block');
  r = play([foe(1, 0, { hp: 99 })], col0('wood', 'wood'));
  assert.strictEqual(r.st.enemies[0].st.poison, 2);
  r = play([foe(1, 0, { hp: 99, atk: 4 })], col0('earth', 'earth'));
  assert.deepStrictEqual([r.st.enemies[0].st.shred, ev(r.events, 'strike')[0].blocked], [2, 1], 'Earth: armour -2 and +1 block');
  r = play([foe(1, 0, { hp: 99 })], col0('wind', 'wind'));
  assert.deepStrictEqual([r.st.enemies[0].col, r.st.enemies[0].st.mark], [2, true], 'Wind: pushed 2 columns and Marked');
  r = play([foe(1, 1, { hp: 99 }), foe(1, 2, { hp: 99 }), foe(1, 3, { hp: 99 })], [[2, 1, U('lightning')], [3, 1, U('lightning')]]);
  assert.strictEqual(ev(r.events, 'chain').length, 2, 'Lightning: a full jump plus a half jump');
  r = play([foe(1, 0, { hp: 99, kw: ['ghost'] })], col0('light', 'light'));
  assert.deepStrictEqual([hits(r.events)[0].amount, r.st.enemies[0].kw.includes('ghost')], [3, false], 'Light: +1 damage and strips Hide and ghost');
  r = play([foe(1, 0, { hp: 99, atk: 3 })], col0('shadow', 'shadow'));
  assert.strictEqual(r.st.enemies[0].st.holdCd, 1, 'Shadow: Held, and cooling for the next turn');
});
test('merge carrier: if the carrier has no target the next attacker of the pair carries it, else it is lost', () => {
  const short = U('fire', { range: 1, beh: [{ p: 'attack', pattern: 'straight', atk: 2, range: 1 }] }), far = U('water', { range: 4, beh: [{ p: 'attack', pattern: 'straight', atk: 2, range: 4 }] });
  let r = play([foe(0, 0, { hp: 99 })], [[2, 0, short], [3, 0, far]]);
  assert.ok(r.st.enemies[0].st && r.st.enemies[0].st.chill.length >= 0 && ev(r.events, 'merge').length === 1);
  assert.strictEqual(dmgs(r)[0][1], 2 + 1, 'Scald passed to the water card: +1 damage');
  r = play([foe(0, 0, { hp: 99 })], [[2, 0, short], [3, 0, U('water', { range: 1, beh: [{ p: 'attack', pattern: 'straight', atk: 2, range: 1 }] })]]);
  assert.strictEqual(hits(r.events).length, 0);
});
test('merge mode: Own element judges each hit by its attacker; Best of column by the best element of the column; resists only if all resist', () => {
  const run = (mode, front, back, enemy) => hits(play([foe(1, 0, { hp: 99, element: enemy })], col0(front, back), { v2: { sets: false, mergeMode: mode } }).events).filter((h) => h.source !== 'burn').map((h) => h.amount);
  assert.deepStrictEqual(run('own', 'wood', 'fire', 'wood'), [2, 3], 'own: wood vs wood x1, fire vs wood x1.5 (Wildfire)');
  assert.deepStrictEqual(run('best', 'wood', 'fire', 'wood'), [3, 3], 'best: both hits use Fire');
  assert.deepStrictEqual(run('own', 'fire', 'water', 'fire'), [2, 3], 'own: the fire carrier resists itself (3 = 2 + Scald +1, halved to 2)');
  assert.deepStrictEqual(run('best', 'fire', 'water', 'fire'), [5, 3], 'best: Water beats the resist for both hits (Steam)');
  assert.deepStrictEqual(run('own', 'fire', 'wood', 'water'), [1, 3], 'own: fire resists water, wood is weak');
  assert.deepStrictEqual(run('best', 'fire', 'wood', 'water'), [3, 3], 'best: Wood lifts the fire hit too');
  assert.deepStrictEqual(run('best', 'fire', 'fire', 'fire'), run('own', 'fire', 'fire', 'fire'), 'a one-element column behaves as own (and a resist stays when every attacker resists)');
  const weakEv = (mode) => ev(play([foe(1, 0, { hp: 99, element: 'wood' })], col0('wood', 'fire'), { v2: { sets: false, mergeMode: mode } }).events, 'weak').map((w) => w.name);
  assert.deepStrictEqual(weakEv('own'), ['Wildfire'], 'only the fire hit fires the weakness hit');
  assert.deepStrictEqual(weakEv('best'), ['Wildfire', 'Wildfire'], 'best: one weakness hit per hit, from the best element');
  assert.strictEqual(V2.MERGE_RULES.modes.default, 'own');
});
test('column merges are deterministic and leave classic states alone', () => {
  const run = () => { let st = battle([foe(1, 0, { hp: 30 }), foe(1, 1, { hp: 30 }), foe(0, 0, { hp: 20 })]), out = []; const sq = squad([...col0('fire', 'wood', 'water'), [2, 1, U('earth')], [3, 1, U('wind')]]); for (let t = 0; t < 4 && st.status === 'playing'; t++) { const r = turn(st, sq); out.push(r); st = r.state; } return JSON.stringify(out); };
  assert.strictEqual(run(), run());
});

// ---------- step 3: remaining behaviours, evolution stages, Lightning units ----------
const NOSETS = { v2: { sets: false } };
const cs = (list, rules) => { const sq = squad(list); return E.computeStats(sq.placement, sq.army, [], rules || NOSETS); };
const strikes = (out) => out.events.filter((e) => e.t === 'strike');
test('data: every unit is implemented (full or simplified); every evolution entry has a stage patch that matches a behaviour', () => {
  for (const u of Object.values(V2.UNITS)) {
    assert.ok(['full', 'simplified'].includes(u.impl) && !u.notYet, u.id + ' ' + u.impl);
    const n = V2.maxStage(u);
    for (let stage = 2; stage <= n; stage++) {
      assert.ok(u.stages && u.stages[stage] && u.stages[stage].length, u.id + ' has no patch for stage ' + stage);
      const beh = V2.applyPatches(u.behaviours, u.stages, stage - 1);
      for (const patch of u.stages[stage]) {
        if (patch.op === 'add') { beh.push(JSON.parse(JSON.stringify(patch.beh))); continue; }
        assert.ok(beh.filter((b) => b.p === patch.p)[patch.i || 0], u.id + ' stage ' + stage + ' patch matches nothing: ' + JSON.stringify(patch));
      }
    }
  }
});
test('evolution extends and never escalates: family, element, base ATK and pattern never change; range and block grow by at most 1 per stage', () => {
  for (const u of Object.values(V2.UNITS)) {
    const base = V2.card(u.id, { stage: 1 });
    for (let stage = 2; stage <= V2.maxStage(u); stage++) {
      const c = V2.card(u.id, { stage });
      assert.strictEqual(c.family, base.family, u.id); assert.strictEqual(c.element, base.element, u.id);
      assert.strictEqual(c.atk, base.atk, u.id + ' base ATK must not change with stage');
      assert.strictEqual(c.pattern, base.pattern, u.id + ' pattern must not change with stage');
      assert.ok((c.range || 0) - (base.range || 0) <= stage - 1 && (c.block || 0) - (base.block || 0) <= stage - 1, u.id + ' range or block jumps too far');
    }
  }
});
test('Lightning units: Kui, Electric Eel and Storm Petrel are the three additions (7 in all); the petrel is the Lightning Kin buffer', () => {
  assert.strictEqual(Object.values(V2.UNITS).filter((u) => u.element === 'lightning').length, 7);
  for (const id of ['kui', 'electric_eel', 'storm_petrel']) assert.ok(V2.UNITS[id] && V2.UNITS[id].element === 'lightning' && V2.UNITS[id].nature !== 'Malevolent', id);
  const s = cs([[2, 0, 'raiju'], [3, 0, 'storm_petrel'], [2, 1, 'hongsa'], [3, 1, 'storm_petrel']]);
  assert.strictEqual(s['2,0'].plus, 2); assert.strictEqual(s['2,1'].plus, 1);
});
test('onHit units: Sun Crow Burn 1 for 2 turns (3 at stage 2); Reindeer and Snow Leopard Chill for 2 turns (stage 2 also the body behind)', () => {
  const st = battle([foe(1, 0, { hp: 20 }), foe(0, 0, { hp: 20 })]);
  let out = turn(st, squad([[2, 0, 'sun_crow']]));
  assert.strictEqual(byId(out.state, 'e0').st.burn.turns, 1); // 2 turns, one tick spent already
  out = turn(st, squad([[2, 0, V2.card('sun_crow', { stage: 2 })]]));
  assert.strictEqual(byId(out.state, 'e0').st.burn.turns, 2);
  out = turn(st, squad([[2, 0, 'reindeer_hauler']]));
  assert.strictEqual(byId(out.state, 'e0').st.chill.length, 1); assert.ok(!byId(out.state, 'e1').st);
  out = turn(st, squad([[2, 0, V2.card('snow_leopard', { stage: 2 })]]));
  assert.strictEqual(byId(out.state, 'e1').st.chill.length, 1);
});
test('onHit units: Firebird Spread burns the centre target only (stage 3: the sides too); Ddraig Goch stage 2 burns only the front body of its Pierce', () => {
  const foes = () => battle([foe(1, 0, { hp: 20 }), foe(1, 1, { hp: 20 }), foe(1, 2, { hp: 20 })]);
  const burning = (out, id) => out.events.some((e) => e.t === 'status' && e.status === 'burn' && e.id === id);
  let out = turn(foes(), squad([[2, 1, 'firebird']]));
  assert.ok(burning(out, 'e1') && !burning(out, 'e0') && !burning(out, 'e2'));
  out = turn(foes(), squad([[2, 1, V2.card('firebird', { stage: 3 })]]));
  assert.ok(burning(out, 'e0') && burning(out, 'e1') && burning(out, 'e2'));
  out = turn(battle([foe(1, 0, { hp: 20 }), foe(0, 0, { hp: 20 })]), squad([[2, 0, V2.card('ddraig_goch', { stage: 2 })]]));
  assert.ok(burning(out, 'e0') && !burning(out, 'e1'));
});
test('Mark units: Raven Pair mark lapses at the end of the turn (stage 2 lasts into the next, stage 3 marks a second column); Bai Ze marks the column; Kui stage 2 marks behind', () => {
  const col = () => battle([foe(1, 0, { hp: 20 }), foe(0, 0, { hp: 20 })]);
  let out = turn(col(), squad([[2, 0, 'raven_pair']]));
  assert.ok(!byId(out.state, 'e0').st.mark);
  out = turn(col(), squad([[2, 0, V2.card('raven_pair', { stage: 2 })]]));
  assert.ok(byId(out.state, 'e0').st.mark);
  out = turn(out.state, squad([[2, 3, 'hongsa']])); // nobody spends it: it lapses after its second turn
  assert.ok(!byId(out.state, 'e0').st.mark);
  out = turn(battle([foe(1, 0, { hp: 20 }), foe(1, 1, { hp: 20 })]), squad([[2, 0, V2.card('raven_pair', { stage: 3 })]]));
  assert.ok(out.events.some((e) => e.t === 'status' && e.status === 'mark' && e.id === 'e1'));
  out = turn(col(), squad([[2, 0, 'bai_ze']]));
  assert.ok(out.events.filter((e) => e.t === 'status' && e.status === 'mark').length === 2);
  out = turn(col(), squad([[2, 0, 'kui']]));
  assert.ok(!out.events.some((e) => e.t === 'status' && e.status === 'mark' && e.id === 'e1'));
  out = turn(col(), squad([[2, 0, V2.card('kui', { stage: 2 })]]));
  assert.ok(out.events.some((e) => e.t === 'status' && e.status === 'mark' && e.id === 'e1'));
  out = turn(battle([foe(1, 0, { hp: 20 })]), squad([[2, 0, V2.card('khan_garid', { stage: 2 })]]));
  assert.ok(out.events.some((e) => e.t === 'status' && e.status === 'mark'));
});
test('Hold units: Cat Sidhe, Nazca Weaver and Electric Eel hold the hit enemy (not again the next turn); stage 2 also the one beside', () => {
  const foes = () => battle([foe(1, 0, { hp: 90, atk: 3 }), foe(1, 1, { hp: 90, atk: 3 })]);
  const held = (out) => out.events.filter((e) => e.t === 'status' && e.status === 'hold' && e.skipped).map((e) => e.id);
  assert.deepStrictEqual(held(turn(foes(), squad([[2, 0, 'cat_sidhe']]))), ['e0']);
  assert.deepStrictEqual(held(turn(foes(), squad([[2, 0, V2.card('nazca_weaver', { stage: 2 })]]))).sort(), ['e0', 'e1']);
  const out = turn(foes(), squad([[2, 0, 'electric_eel']]));
  assert.deepStrictEqual(held(out), ['e0']);
  assert.deepStrictEqual(held(turn(out.state, squad([[2, 0, 'electric_eel']]))), []); // cooldown 1
});
test('Venom units: Wadjet and Komodo poison cap 3 (stage 2: 4); Baku Sunder shreds armour (stage 2 strips Hide and Veil)', () => {
  const sq3 = squad([[2, 0, 'wadjet']]);
  let st = battle([foe(1, 0, { hp: 99, atk: 0 })]);
  for (let i = 0; i < 5; i++) st = turn(st, sq3).state;
  assert.strictEqual(byId(st, 'e0').st.poison, 3);
  const sq4 = squad([[2, 0, V2.card('wadjet', { stage: 2 })]]);
  st = battle([foe(1, 0, { hp: 99, atk: 0 })]);
  for (let i = 0; i < 5; i++) st = turn(st, sq4).state;
  assert.strictEqual(byId(st, 'e0').st.poison, 4);
  assert.strictEqual(V2.card('komodo', { stage: 2 }).beh.find((b) => b.p === 'onHit').capPlus, 1);
  assert.strictEqual(byId(turn(battle([foe(1, 0, { hp: 20, armor: 2 })]), squad([[2, 0, 'baku']])).state, 'e0').st.shred, 1);
  const hid = battle([foe(1, 0, { hp: 20 })]); hid.enemies[0].gimmick = 'guard'; hid.enemies[0].gp = 1;
  const o2 = turn(hid, squad([[2, 0, V2.card('baku', { stage: 2 })]]));
  assert.ok(o2.events.some((e) => e.t === 'status' && e.status === 'cleanse' && e.what.includes('hide')));
});
test('Cheonma pushes the hit enemy a column sideways (stage 2 also the body beside it)', () => {
  let out = turn(battle([foe(1, 0, { hp: 20 })]), squad([[2, 0, 'cheonma']]));
  assert.strictEqual(byId(out.state, 'e0').col, 1);
  out = turn(battle([foe(1, 0, { hp: 20 }), foe(1, 1, { hp: 20 })]), squad([[2, 0, 'cheonma']]));
  assert.strictEqual(out.events.filter((e) => e.t === 'move' && e.push).length, 1);
  out = turn(battle([foe(1, 0, { hp: 20 }), foe(1, 1, { hp: 20 })]), squad([[2, 0, V2.card('cheonma', { stage: 2 })]]));
  assert.strictEqual(out.events.filter((e) => e.t === 'move' && e.push).length, 2);
});
test('Bloom heals 2 each turn; stage 2 heals 3 if the hero was struck (Pelican) or is below half HP (Honu, Moon Hare)', () => {
  const heal = (card, hp, foes) => { const st = battle(foes); st.hp = hp; return turn(st, squad([[3, 3, card]])).events.filter((e) => e.t === 'mend' && e.source === 'v2').reduce((n, e) => n + e.amount, 0); };
  assert.strictEqual(heal('pelican_of_mercy', 50, [foe(1, 0, { hp: 20, atk: 3 })]), 2);
  assert.strictEqual(heal(V2.card('pelican_of_mercy', { stage: 2 }), 50, [foe(1, 0, { hp: 20, atk: 3 })]), 3);
  assert.strictEqual(heal(V2.card('pelican_of_mercy', { stage: 2 }), 50, [foe(1, 0, { hp: 20, atk: 0 })]), 2);
  assert.strictEqual(heal(V2.card('honu', { stage: 2 }), 40, [foe(1, 0, { hp: 20, atk: 1 })]), 3);
  assert.strictEqual(heal(V2.card('moon_hare', { stage: 2 }), 90, [foe(1, 0, { hp: 20, atk: 1 })]), 2);
});
test('Ward: Kotuku negates the first damaging strike of the battle (stage 2 one more in another column); Phoenix raises the hero once at half HP (stage 2 with a Shield)', () => {
  const foes = () => battle([foe(1, 0, { hp: 90, atk: 4 }), foe(1, 1, { hp: 90, atk: 4 }), foe(1, 2, { hp: 90, atk: 4 })]);
  const hurt = (out) => strikes(out).reduce((n, e) => n + e.dmg, 0);
  assert.strictEqual(hurt(turn(foes(), squad([[3, 3, 'kotuku']]))), 8);
  assert.strictEqual(hurt(turn(foes(), squad([[3, 3, V2.card('kotuku', { stage: 2 })]]))), 4);
  const mk = () => { const st = battle([foe(1, 0, { hp: 90, atk: 30 })]); st.hp = 5; st.maxHp = 40; return st; };
  let out = turn(mk(), squad([[3, 3, 'phoenix']]));
  assert.strictEqual(out.state.status, 'playing'); assert.strictEqual(out.state.hp, 20);
  assert.ok(out.events.some((e) => e.t === 'revive' && e.source === 'rebirth'));
  out = turn(out.state, squad([[3, 3, 'phoenix']]));
  assert.strictEqual(out.state.status, 'defeated');
  assert.strictEqual(turn(mk(), squad([[3, 3, V2.card('phoenix', { stage: 2 })]])).state.barrier, 1);
});
test('onKill: Sarimanok +1 Soul per kill (stage 2 +2 more on an elite or boss kill), Pixiu +1 (+1 elite; stage 2 counts every kill); Huma heals 1 on the first kill each turn (stage 3: 2)', () => {
  let out = turn(battle([foe(1, 0, { hp: 2 })]), squad([[2, 0, 'sarimanok']]));
  assert.strictEqual(out.state.soulsBonus, 1); assert.ok(out.events.some((e) => e.t === 'souls' && e.n === 1));
  const eliteFoe = () => { const st = battle([foe(1, 0, { hp: 2 })]); E.ENEMY_TYPES.goblin_boss_test = { name: 'Boss', icon: '*', boss: true }; st.enemies[0].type = 'goblin_boss_test'; return st; };
  out = turn(eliteFoe(), squad([[2, 0, 'pixiu']]));
  delete E.ENEMY_TYPES.goblin_boss_test;
  assert.strictEqual(out.state.soulsBonus, 2);
  out = turn(battle([foe(1, 0, { hp: 2 })]), squad([[2, 0, 'hongsa'], [2, 1, 'pixiu']]));
  assert.ok(!out.state.soulsBonus);
  out = turn(battle([foe(1, 0, { hp: 2 })]), squad([[2, 0, 'hongsa'], [2, 1, V2.card('pixiu', { stage: 2 })]]));
  assert.strictEqual(out.state.soulsBonus, 1);
  const two = () => { const st = battle([foe(1, 0, { hp: 2 }), foe(1, 1, { hp: 2 })]); st.hp = 50; return st; };
  const heals = (card) => turn(two(), squad([[2, 0, 'hongsa'], [2, 1, 'hongsa'], [3, 3, card]])).events.filter((e) => e.t === 'mend' && e.source === 'v2');
  assert.strictEqual(heals('huma').length, 1); assert.strictEqual(heals('huma')[0].amount, 1);
  assert.strictEqual(heals(V2.card('huma', { stage: 3 }))[0].amount, 2);
});
test('Decoy: Bi\'an takes the first strike in its column (its block on top of the column pool): Shield 2 and 2 against a 4 strike, only the first strike', () => {
  const one = (id) => strikes(turn(battle([foe(1, 0, { hp: 90, atk: 6 })]), squad([[2, 0, id]])))[0];
  assert.strictEqual(one('bian').blocked, 4); assert.strictEqual(one('bian').dmg, 2);
  assert.strictEqual(one('bixi').blocked, 3);
  const two = strikes(turn(battle([foe(1, 0, { hp: 90, atk: 6 }), foe(0, 0, { hp: 90, atk: 6 })]), squad([[2, 0, 'bian']])));
  assert.strictEqual(two[0].dmg, 2); assert.ok(two[1].dmg > two[0].dmg);
  assert.strictEqual(V2.card('bian', { stage: 2 }).block, 3); assert.strictEqual(V2.card('xolo_guide', { stage: 2 }).block, 3);
});
test('Attune: the unit above takes the element (stage 2 also below, stage 3 +1 ATK); merges read the new element', () => {
  let s = cs([[2, 0, 'hongsa'], [3, 0, 'nine_tail_fox'], [4, 0, 'amur_tiger']]);
  assert.strictEqual(s['2,0'].element, 'fire'); assert.ok(!s['4,0'].element);
  s = cs([[2, 0, 'hongsa'], [3, 0, V2.card('nine_tail_fox', { stage: 3 })], [4, 0, 'amur_tiger']]);
  assert.strictEqual(s['4,0'].element, 'fire'); assert.strictEqual(s['2,0'].plus, 1); assert.strictEqual(s['4,0'].plus, 1);
  s = cs([[2, 0, 'hongsa'], [3, 0, 'nine_tail_fox'], [4, 0, 'singha']]);
  assert.ok((s['2,0'].merges || []).length === 1 && s['2,0'].merges[0].pair.join() === 'fire,fire'); // Water Hongsa now Fire: Resonance of Fire with Singha
});
test('Swap: Tulpar trades tiles with the ally behind after attacking; Reynard with an adjacent ally (stage 2 any ally in its row); the swap persists on the next turns', () => {
  const sq = squad([[2, 0, 'tulpar'], [3, 0, 'hongsa']]);
  let out = turn(battle([foe(1, 0, { hp: 90 })]), sq);
  assert.ok(out.events.some((e) => e.t === 'swap' && e.a === '2,0' && e.b === '3,0'));
  const moved = V2.applyMoves(sq.placement, sq.army, out.state.rules).placement; // what the next turn sees: the two units trade tiles
  assert.strictEqual(moved['2,0'], sq.placement['3,0']); assert.strictEqual(moved['3,0'], sq.placement['2,0']);
  out = turn(out.state, sq);
  assert.ok(!out.events.some((e) => e.t === 'swap')); // Tulpar now stands at 3,0 with nobody behind it: no second swap
  out = turn(battle([foe(1, 1, { hp: 90 })]), squad([[2, 1, 'reynard'], [2, 2, 'hongsa']]));
  assert.ok(out.events.some((e) => e.t === 'swap' && e.a === '2,1' && e.b === '2,2'));
  out = turn(battle([foe(1, 0, { hp: 90 })]), squad([[2, 0, V2.card('reynard', { stage: 2 })], [2, 3, 'hongsa']]));
  assert.ok(out.events.some((e) => e.t === 'swap' && e.a === '2,0' && e.b === '2,3'));
  assert.ok(!turn(battle([foe(1, 0, { hp: 90 })]), squad([[2, 0, 'tulpar']])).events.some((e) => e.t === 'swap'));
});
test('Mimic: Tanuki takes the element of the first enemy it hits for the rest of the battle', () => {
  const sq = squad([[2, 0, 'tanuki_trickster']]);
  let st = battle([foe(1, 0, { hp: 90, element: 'fire' })]);
  assert.ok(!stat(st, sq, '2,0').element);
  st = turn(st, sq).state;
  assert.strictEqual(stat(st, sq, '2,0').element, 'fire');
});
test('Mirror: Langur copies pattern, base ATK and range of the unit to its left (stage 2 +1 range); nothing to copy means no attack', () => {
  let s = cs([[2, 0, 'hammerhead'], [2, 1, 'langur_mirror']]);
  assert.strictEqual(s['2,1'].pattern, 'spread'); assert.strictEqual(s['2,1'].atk, 1); assert.strictEqual(s['2,1'].range, 1); assert.ok(E.isAttacker(s['2,1']));
  assert.strictEqual(cs([[2, 0, 'hammerhead'], [2, 1, V2.card('langur_mirror', { stage: 2 })]])['2,1'].range, 2);
  assert.ok(!E.isAttacker(cs([[2, 0, 'bixi'], [2, 1, 'langur_mirror']])['2,1']));
  assert.ok(!E.isAttacker(cs([[2, 1, 'langur_mirror']])['2,1']));
});
test('Offering: Scarab Roller consumes the first adjacent Common ally for +2 ATK (stage 2 +3); rarer allies are left alone', () => {
  let s = cs([[2, 0, 'scarab_roller'], [3, 0, 'hongsa']]);
  assert.ok(!s['3,0']); assert.strictEqual(s['2,0'].atk, 3);
  assert.strictEqual(cs([[2, 0, V2.card('scarab_roller', { stage: 2 })], [3, 0, 'hongsa']])['2,0'].atk, 4);
  s = cs([[2, 0, 'scarab_roller'], [3, 0, 'raiju']]);
  assert.ok(s['3,0']); assert.strictEqual(s['2,0'].atk, 1);
});
test('Brood: Honeybee Hive spawns a 1-ATK Drone every turn (max 3, stage 2 max 4) in an empty adjacent tile; Drones fire and are deterministic', () => {
  const sq = squad([[3, 1, 'honeybee_hive']]);
  let st = battle([foe(1, 1, { hp: 99, atk: 0 })]);
  let out = turn(st, sq);
  assert.ok(out.events.some((e) => e.t === 'drone' && e.key === '2,1'));
  out = turn(out.state, sq);
  assert.ok(out.events.some((e) => e.t === 'fire' && e.key === '2,1'));
  assert.ok(turn(battle([foe(1, 1, { hp: 99, atk: 0 })]), squad([[3, 1, V2.card('honeybee_hive', { stage: 2 })]])).events.some((e) => e.t === 'drone'));
  const run = () => { const q = squad([[3, 1, V2.card('honeybee_hive', { stage: 2 })]]); let s = battle([foe(1, 1, { hp: 99, atk: 0 })]); for (let i = 0; i < 6; i++) s = turn(s, q).state; return JSON.stringify(s); };
  assert.strictEqual(run(), run());
  assert.ok(JSON.parse(run()).rules.v2mem.moves.filter((m) => m.op === 'drone').length === 4, 'at most 4 drones per stage 2 hive');
  const run1 = () => { const q = squad([[3, 1, 'honeybee_hive']]); let s = battle([foe(1, 1, { hp: 99, atk: 0 })]); for (let i = 0; i < 6; i++) s = turn(s, q).state; return s; };
  assert.strictEqual(run1().rules.v2mem.moves.filter((m) => m.op === 'drone').length, 3, 'at most 3 drones per hive');
});
test('Bond: Moon Hare gives an adjacent Sun Crow +1 ATK', () => {
  const s = cs([[2, 0, 'sun_crow'], [2, 1, 'moon_hare']]);
  assert.strictEqual(s['2,0'].plus, 1);
});
test('stage numbers: Echo at full ATK minus 1, Chain jump +1 and flat 1 (Pegasus), Kunpeng chains at half', () => {
  const amounts = (card, foes) => hits(turn(battle(foes || [foe(1, 0, { hp: 99 })]), squad([[2, 0, card]])).events).map((x) => x.amount);
  const big = { level: 5, stars: 3 }; // ATK 4
  assert.deepStrictEqual(amounts(V2.card('sleipnir', big)), [4, 2]);
  assert.deepStrictEqual(amounts(V2.card('sleipnir', Object.assign({ stage: 2 }, big))), [4, 3]);
  assert.deepStrictEqual(amounts(V2.card('thor_s_goats', Object.assign({ stage: 2 }, big))), [4, 3]);
  const two = () => [foe(1, 0, { hp: 99 }), foe(1, 1, { hp: 99 })];
  assert.deepStrictEqual(amounts('raiju', two()), [2, 2]);
  assert.deepStrictEqual(amounts(V2.card('raiju', { stage: 2 }), two()), [2, 3]);
  assert.deepStrictEqual(amounts(V2.card('pegasus', { stage: 2 }), two()), [1, 1]);
  assert.deepStrictEqual(amounts(V2.card('kunpeng', { stage: 2 }), two()), [3, 2]);
  const q = (stage) => squad([[2, 0, V2.card('hongsa', big)], [3, 0, V2.card('qiuniu', { stage })]]);
  const st = () => battle([foe(1, 0, { hp: 99 })]);
  assert.deepStrictEqual(hits(turn(st(), q(1)).events).map((x) => x.amount), [4, 2]);
  assert.deepStrictEqual(hits(turn(st(), q(2)).events).map((x) => x.amount), [4, 3]);
});
test('stage buffs: Plume Herald diagonals (stage 3 +1 range for Wings), Crane, Tui and Firefly beside, Golden Turtle and Rain Dragon upper-left, Ratatoskr far unit, Divine Tortoise side columns', () => {
  assert.strictEqual(cs([[3, 1, V2.card('plume_herald', { stage: 2 })], [2, 0, 'amur_tiger']])['2,0'].plus, 1);
  assert.strictEqual(cs([[3, 1, 'plume_herald'], [2, 0, 'amur_tiger']])['2,0'].plus, 0);
  assert.strictEqual(cs([[3, 1, V2.card('plume_herald', { stage: 3 })], [2, 0, 'hongsa']])['2,0'].rangeBonus, 1); // Wings only
  assert.strictEqual(cs([[3, 1, V2.card('plume_herald', { stage: 3 })], [2, 0, 'amur_tiger']])['2,0'].rangeBonus, 0);
  assert.strictEqual(cs([[3, 1, V2.card('thousand_year_crane', { stage: 2 })], [3, 0, 'hongsa']])['3,0'].rangeBonus, 1);
  assert.strictEqual(cs([[3, 1, V2.card('tui_mimic', { stage: 2 })], [3, 2, 'hongsa']])['3,2'].plus, 1);
  assert.strictEqual(cs([[3, 1, V2.card('golden_turtle', { stage: 2 })], [2, 0, 'hongsa']])['2,0'].rangeBonus, 1);
  assert.strictEqual(cs([[4, 1, V2.card('rain_dragon_chen', { stage: 2 })], [3, 0, 'hongsa']])['3,0'].plus, 1);
  assert.strictEqual(cs([[4, 1, V2.card('ratatoskr', { stage: 2 })], [2, 1, 'hongsa']])['2,1'].plus, 2); // up2 plus the far unit's extra
  assert.strictEqual(cs([[3, 1, V2.card('divine_tortoise', { stage: 2 })], [2, 0, 'bixi']])['2,0'].block, 5);
  assert.strictEqual(cs([[3, 1, 'divine_tortoise'], [2, 0, 'bixi']])['2,0'].block, 3);
});
test('ignoreArmor behaviour works on a hand-built card', () => {
  const card = { id: 'ia', type: 'v2', v2: true, unit: 'ia', element: 'fire', family: 'wilds', pattern: 'straight', atk: 3, range: 2, beh: [{ p: 'attack', pattern: 'straight', atk: 3, range: 2 }, { p: 'ignoreArmor', n: 2 }] };
  assert.strictEqual(hits(turn(battle([foe(1, 0, { hp: 20, armor: 2 })]), squad([[2, 0, card]])).events)[0].dmg, 3);
});
test('step 3 states are deterministic across all units and stages (two runs, 4 turns, JSON equal)', () => {
  const run = (id, stage) => {
    const sq = squad([[2, 1, V2.card(id, { stage, level: 3, stars: 3 })], [3, 1, 'plume_herald'], [3, 2, 'bixi'], [2, 2, classic('swordsman')], [4, 1, 'honu']]);
    let st = battle([foe(1, 0, { hp: 9 }), foe(1, 1, { hp: 14, element: 'water' }), foe(0, 1, { hp: 14 }), foe(1, 2, { hp: 9 })]);
    for (let t = 0; t < 4 && st.status === 'playing'; t++) st = turn(st, sq).state;
    return JSON.stringify(st);
  };
  for (const u of Object.values(V2.UNITS)) for (let stage = 1; stage <= V2.maxStage(u); stage++) assert.strictEqual(run(u.id, stage), run(u.id, stage), u.id);
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
  test('fuzz: with rules.v2 on, classic cards and elementless enemies still match 33b83f5 (classic cards keep carrying overkill; Rend applies to V2 cards only)', () => fuzz(true));
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
