// Unit tests for Big enemies and the boss row (DESIGN_V2 section 10) on the pure rules engine.
// Usage: node tools/test-big-enemies.js      (exit code 1 on any failure)
// Also runs a differential fuzz against the engine at git HEAD~0 of this file's baseline when the original is available
// (env BASE_ENGINE=<path to the pre-change engine.js>; otherwise it is read from `git show <rev>:prototype/js/engine.js`, rev = BASE_REV or the last commit that did not touch footprints).
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const E = require('../prototype/js/engine.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('ok   ' + name); } catch (err) { failed++; console.log('FAIL ' + name + '\n     ' + String(err.stack || err).split('\n').slice(0, 4).join('\n     ')); }
}

// ---------- helpers ----------
const FOOTPRINTS = ['1x1', '2x1', '1x2', '2x2', '3x1'];
const WD = { '1x1': [1, 1], '2x1': [2, 1], '1x2': [1, 2], '2x2': [2, 2], '3x1': [3, 1] };
let uid = 0;
function foe(row, col, o) { return Object.assign({ type: 'goblin', row, col, hp: 10, atk: 2, armor: 0 }, o); }
function battle(enemies, extra) {
  const st = E.createState(Object.assign({ heroHp: 100, heroMaxHp: 100, enemies, rules: {} }, extra));
  st.enemies.forEach((e, i) => { if (enemies[i].maxHp) e.maxHp = enemies[i].maxHp; }); // createState sets maxHp = hp; tests may start wounded
  return st;
}
// An attacker card on a player tile: { placement, army }.
function squad(list) {
  const placement = {}, army = [];
  list.forEach(([r, c, card]) => { const id = 'c' + (uid++); army.push(Object.assign({ id }, card)); placement[E.key(r, c)] = id; });
  return { placement, army };
}
const atk = (pattern, a, range) => ({ type: 'swordsman', pattern, atk: a, range });
const shield = (block) => ({ type: 'shield', block });
const turn = (state, sq) => E.resolveTurn(state, sq.placement, sq.army);
const hits = (events) => events.filter((e) => e.t === 'hit');
const strikes = (events) => events.filter((e) => e.t === 'strike');
const byId = (state, id) => state.enemies.find((e) => e.id === id);

// ---------- footprints ----------
test('footprint cells: anchor is front-left, D grows toward the back', () => {
  for (const fp of FOOTPRINTS) {
    const s = battle([foe(1, 1, { footprint: fp })]), e = s.enemies[0], [w, d] = WD[fp];
    assert.strictEqual(E.footprintOf(e), fp);
    const cells = E.cellsOf(e).map((c) => c.join(',')).sort();
    const want = []; for (let dr = 0; dr < d; dr++) for (let dc = 0; dc < w; dc++) want.push((1 - dr) + ',' + (1 + dc));
    assert.deepStrictEqual(cells, want.sort(), fp);
    for (const [r, c] of E.cellsOf(e)) assert.strictEqual(E.enemyAt(s.enemies, r, c), e);
  }
});
test('classic enemies stay lean (no w / d / bossRow fields)', () => {
  const s = battle([foe(1, 0), foe(0, 1)]);
  for (const e of s.enemies) { assert.ok(!('w' in e) && !('d' in e)); assert.strictEqual(E.footprintOf(e), '1x1'); }
  assert.ok(!s.bossRow);
});
test('validateLayout: overflow, overlap, boss-row depth', () => {
  assert.deepStrictEqual(E.validateLayout([foe(1, 0, { footprint: '2x2' }), foe(1, 2, { footprint: '3x1' })]), []);
  assert.ok(E.validateLayout([foe(1, 4, { footprint: '2x1' })]).length, 'too wide');
  assert.ok(E.validateLayout([foe(0, 0, { footprint: '1x2' })]).length, 'too deep');
  assert.ok(E.validateLayout([foe(1, 0, { footprint: '2x1' }), foe(1, 1)]).length, 'overlap');
  assert.ok(E.validateLayout([foe(1, 0, { footprint: '1x2' }), foe(0, 0)]).length, 'overlap behind');
  assert.ok(E.validateLayout([foe(-1, 0, { footprint: '2x2' })]).length, 'boss row is one deep');
  assert.deepStrictEqual(E.validateLayout([foe(-1, 1, { footprint: '3x1' })]), []);
});

// ---------- patterns against footprints ----------
test('Straight: one hit on any covered column, none beside the body', () => {
  for (const fp of FOOTPRINTS) {
    const [w] = WD[fp];
    for (let c = 0; c < 5; c++) {
      const s = battle([foe(1, 1, { footprint: fp })]);
      const out = turn(s, squad([[2, c, atk('straight', 3, 1)]]));
      const covered = c >= 1 && c < 1 + w;
      assert.strictEqual(hits(out.events).length, covered ? 1 : 0, fp + ' col ' + c);
      if (covered) { assert.strictEqual(byId(out.state, 'e0').hp, 7); assert.strictEqual(hits(out.events)[0].col, c); }
    }
  }
});
test('Spread: every column lookup that lands on the same body is a separate hit (B3)', () => {
  const expected = { '1x1': [0, 1, 1, 1, 0], '2x1': [1, 2, 2, 1, 0], '1x2': [1, 1, 1, 0, 0], '2x2': [1, 2, 2, 1, 0], '3x1': [1, 2, 3, 2, 1] };
  for (const fp of FOOTPRINTS) {
    const [w] = WD[fp];
    for (let c = 0; c < 5; c++) {
      const s = battle([foe(1, 1, { footprint: fp, hp: 50 })]);
      const out = turn(s, squad([[2, c, atk('spread', 2, 1)]]));
      let n = 0; for (const cc of [c - 1, c, c + 1]) if (cc >= 1 && cc < 1 + w) n++;
      assert.strictEqual(hits(out.events).length, n, fp + ' attacker col ' + c);
      assert.strictEqual(byId(out.state, 'e0').hp, 50 - 2 * n);
    }
  }
  // 3x1 from the middle column is the "up to three hits" case, 2x2 hits twice
  assert.strictEqual(hits(turn(battle([foe(1, 1, { footprint: '3x1', hp: 50 })]), squad([[2, 2, atk('spread', 2, 1)]])).events).length, 3);
  assert.strictEqual(hits(turn(battle([foe(1, 1, { footprint: '2x2', hp: 50 })]), squad([[2, 1, atk('spread', 2, 1)]])).events).length, 2);
});
test('Spread: armour applies per hit (ATK 1 into armour 1 does nothing)', () => {
  const s = battle([foe(1, 0, { footprint: '3x1', hp: 20, armor: 1 })]);
  const out = turn(s, squad([[2, 1, atk('spread', 1, 1)]]));
  assert.strictEqual(hits(out.events).length, 3);
  assert.strictEqual(byId(out.state, 'e0').hp, 20);
  const s2 = battle([foe(1, 0, { footprint: '3x1', hp: 20, armor: 1 })]);
  assert.strictEqual(byId(turn(s2, squad([[2, 1, atk('spread', 2, 1)]])).state, 'e0').hp, 17); // (2-1) x 3
});
test('Spread: a body that dies mid-volley is not hit again', () => {
  const s = battle([foe(1, 0, { footprint: '3x1', hp: 3 })]);
  const out = turn(s, squad([[2, 1, atk('spread', 2, 1)]]));
  assert.strictEqual(hits(out.events).length, 2);
  assert.ok(!byId(out.state, 'e0').alive);
});
test('Pierce: every distinct body in the column once, a deep body counts once (B4)', () => {
  for (const fp of FOOTPRINTS) {
    const [w, d] = WD[fp];
    const s = battle([foe(1, 1, { footprint: fp, hp: 50 }), foe(0, 4, { hp: 50 })]);
    for (let c = 1; c < 1 + w; c++) {
      const out = turn(s, squad([[2, c, atk('pierce', 2, 3)]]));
      assert.strictEqual(hits(out.events).length, 1, fp + ' col ' + c);
    }
  }
  // a front 1x1 plus a body behind: both
  const s = battle([foe(1, 1), foe(0, 1, { footprint: '2x1' })]);
  assert.strictEqual(hits(turn(s, squad([[2, 1, atk('pierce', 2, 3)]])).events).length, 2);
  // deep body in front of a boss-row body: only the deep body
  const s2 = battle([foe(1, 1, { footprint: '1x2' }), foe(-1, 0, { footprint: '3x1' })]);
  assert.deepStrictEqual(hits(turn(s2, squad([[2, 1, atk('pierce', 2, 3)]])).events).map((h) => h.id), ['e0']);
});
test('Range uses the distance to the nearest tile of the body', () => {
  const s = battle([foe(0, 0, { footprint: '1x2' })]); // anchor row 0 is invalid for 1x2; use 1x2 anchored at row 1
  const t = battle([foe(1, 0, { footprint: '1x2' })]);
  assert.strictEqual(hits(turn(t, squad([[2, 0, atk('straight', 1, 1)]])).events).length, 1); // front tile is at distance 1
  const u = battle([foe(0, 0, { footprint: '2x1' })]);
  assert.strictEqual(hits(turn(u, squad([[2, 0, atk('straight', 1, 1)]])).events).length, 0); // back row at distance 2
  assert.strictEqual(hits(turn(u, squad([[2, 0, atk('straight', 1, 2)]])).events).length, 1);
  void s;
});
test('A Big body in the front row blocks the column behind it for Straight', () => {
  const s = battle([foe(1, 1, { footprint: '2x1', hp: 50 }), foe(0, 2, { hp: 5 })]);
  const out = turn(s, squad([[2, 2, atk('straight', 3, 3)]]));
  assert.deepStrictEqual(hits(out.events).map((h) => h.id), ['e0']);
});
test('Chain jumps to a touching body on any side, and the Big body is hit as one', () => {
  const s = battle([foe(1, 0, { footprint: '2x1', hp: 50 }), foe(0, 1, { hp: 4 })]);
  const out = turn(s, squad([[2, 0, Object.assign(atk('straight', 3, 1), { fx: { chain: true } })]]));
  assert.ok(!byId(out.state, 'e1').alive === false || byId(out.state, 'e1').hp === 1, 'the touching goblin took the chained hit');
  assert.strictEqual(byId(out.state, 'e1').hp, 1);
});

// ---------- attacks per column ----------
test('Attacks per column: a wide body strikes once per covered column (A1)', () => {
  const lanes = { '1x1': 1, '2x1': 2, '1x2': 1, '2x2': 2, '3x1': 3 };
  for (const fp of FOOTPRINTS) {
    const s = battle([foe(1, 1, { footprint: fp, atk: 3 })]);
    const out = E.resolveTurn(s, {}, []);
    const st = strikes(out.events);
    assert.strictEqual(st.length, lanes[fp], fp);
    assert.deepStrictEqual(st.map((x) => x.col), Array.from({ length: lanes[fp] }, (_, i) => 1 + i));
    assert.strictEqual(100 - out.state.hp, 3 * lanes[fp]);
    assert.strictEqual(E.lanesOf(s.enemies[0]), lanes[fp]);
  }
});
test('Attacks per column: each lane is absorbed by its own column Shield', () => {
  const s = battle([foe(1, 1, { footprint: '2x1', atk: 4 })]);
  const out = turn(s, squad([[3, 1, shield(3)]])); // column 1 shield 3 absorbs 3 of the first lane, column 2 has none
  const st = strikes(out.events);
  assert.deepStrictEqual(st.map((x) => [x.col, x.blocked, x.dmg]), [[1, 3, 1], [2, 0, 4]]);
  assert.strictEqual(100 - out.state.hp, 5);
});
test('Attacks per column: a deep body has one lane; the incoming preview sums lanes', () => {
  assert.deepStrictEqual(E.incomingByColumn(battle([foe(1, 1, { footprint: '1x2', atk: 3 })]).enemies), [0, 3, 0, 0, 0]);
  assert.deepStrictEqual(E.incomingByColumn(battle([foe(1, 1, { footprint: '3x1', atk: 2 }), foe(0, 4)]).enemies), [0, 2, 2, 2, 2]);
});
test('Sweep: a Big body also strikes the column beside each end of the footprint for half (A4)', () => {
  const s = battle([foe(1, 1, { footprint: '2x1', atk: 4, gimmick: 'sweep' })]);
  assert.deepStrictEqual(E.incomingByColumn(s.enemies), [2, 4, 4, 2, 0]);
  const out = E.resolveTurn(s, {}, []);
  const st = strikes(out.events);
  assert.strictEqual(st.length, 4);
  assert.deepStrictEqual(st.filter((x) => x.splash).map((x) => [x.col, x.atk]).sort(), [[0, 2], [3, 2]]);
});
test('Boss-row bodies strike like any other enemy (R5)', () => {
  const s = battle([foe(-1, 0, { footprint: '3x1', atk: 2 }), foe(1, 4, { atk: 1 })]);
  assert.strictEqual(s.bossRow, true);
  const out = E.resolveTurn(s, {}, []);
  assert.strictEqual(strikes(out.events).length, 4);
  assert.strictEqual(100 - out.state.hp, 2 * 3 + 1);
});
test('Enrage and end-of-turn gimmicks act once per body, not once per lane', () => {
  const s = battle([foe(1, 0, { footprint: '3x1', atk: 2, hp: 20, maxHp: 20, gimmick: 'rage', gp: 1 })]);
  const st = E.resolveTurn(s, {}, []).state;
  assert.strictEqual(st.enemies[0].atk, 2 + 1 + 1); // +1 enrage, +1 fury
});

// ---------- boss row ----------
test('Boss row: Straight, Spread and Pierce cannot reach a boss behind a living enemy (R1)', () => {
  for (const pattern of ['straight', 'spread', 'pierce']) {
    const s = battle([foe(1, 2, { hp: 50 }), foe(-1, 2, { hp: 50, type: 'orc' })]);
    const out = turn(s, squad([[2, 2, atk(pattern, 2, 3)]]));
    assert.ok(hits(out.events).every((h) => h.id === 'e0'), pattern);
    assert.strictEqual(byId(out.state, 'e1').hp, 50);
  }
  // back-row enemy also closes the gate
  const s2 = battle([foe(0, 2, { hp: 50 }), foe(-1, 2, { hp: 50 })]);
  assert.ok(hits(turn(s2, squad([[2, 2, atk('pierce', 2, 3)]])).events).every((h) => h.id === 'e0'));
});
test('Boss row: an open column reaches it once its range allows (R3 counts it as the back row)', () => {
  const s = battle([foe(-1, 2, { hp: 50 })]);
  assert.strictEqual(hits(turn(s, squad([[2, 2, atk('straight', 2, 1)]])).events).length, 0, 'range 1 from the front row is too short');
  assert.strictEqual(hits(turn(s, squad([[2, 2, atk('straight', 2, 2)]])).events).length, 1, 'range 2 from the front row reaches it');
  assert.strictEqual(hits(turn(s, squad([[3, 2, atk('straight', 2, 2)]])).events).length, 0, 'range 2 from row 3 does not');
  assert.strictEqual(hits(turn(s, squad([[3, 2, atk('straight', 2, 3)]])).events).length, 1);
  assert.strictEqual(hits(turn(s, squad([[2, 2, atk('pierce', 2, 2)]])).events).length, 1);
});
test('Boss row: the gate is checked per column (R2); a 3x1 behind one cleared column', () => {
  const boss = foe(-1, 0, { footprint: '3x1', hp: 50, type: 'orc' });
  const s = battle([foe(1, 0), foe(0, 2), boss]); // column 1 is open, columns 0 and 2 are guarded
  const open = turn(s, squad([[2, 1, atk('straight', 2, 2)]]));
  assert.deepStrictEqual(hits(open.events).map((h) => [h.id, h.col]), [['e2', 1]]);
  for (const c of [0, 2]) assert.ok(hits(turn(s, squad([[2, c, atk('straight', 2, 2)]])).events).every((h) => h.id !== 'e2'), 'col ' + c);
  // a Spread from the middle column: guarded, open, guarded -> one hit on the boss, one on each guard
  const sp = turn(s, squad([[2, 1, atk('spread', 2, 2)]]));
  assert.strictEqual(hits(sp.events).filter((h) => h.id === 'e2').length, 1);
  assert.strictEqual(hits(sp.events).length, 3);
  // with all three columns open a Spread hits it three times
  const s3 = battle([boss]);
  assert.strictEqual(hits(turn(s3, squad([[2, 1, atk('spread', 1, 2)]])).events).length, 3);
});
test('Boss row: a kill in front opens the gate for later hits', () => {
  const s = battle([foe(1, 2, { hp: 3 }), foe(-1, 2, { hp: 20 })]);
  const t1 = turn(s, squad([[2, 2, atk('straight', 3, 2)]]));
  assert.ok(!byId(t1.state, 'e0').alive);
  assert.strictEqual(byId(t1.state, 'e1').hp, 20, 'no carry beyond a row-1 kill into a row-0 gap: the boss is two tiles back and the carry only goes to the tile behind');
});
test('Boss row: a Pierce does not skip a living enemy, even one out of its range', () => {
  const s = battle([foe(1, 2, { hp: 50 }), foe(-1, 2, { hp: 50 })]);
  const out = turn(s, squad([[3, 2, atk('pierce', 2, 1)]])); // range 1 from row 3: front enemy is at distance 2, out of range
  assert.strictEqual(hits(out.events).length, 0);
});
test('Boss row: reachableTiles lists the row only for battles that have one', () => {
  const st = { r: 2, c: 2, range: 2, pattern: 'straight', type: E.CARD_TYPES.swordsman };
  assert.deepStrictEqual(E.reachableTiles(st), ['1,2', '0,2']);
  assert.deepStrictEqual(E.reachableTiles(st, true), ['1,2', '0,2', '-1,2']);
});

// ---------- kill and overkill ----------
test('Kill: a Big body dies as one, every tile clears, no backfill (B1)', () => {
  for (const fp of FOOTPRINTS) {
    const s = battle([foe(1, 1, { footprint: fp, hp: 3 }), foe(0, 4, { hp: 3 })]);
    const out = turn(s, squad([[2, 1, atk('straight', 3, 1)]]));
    assert.ok(!byId(out.state, 'e0').alive, fp);
    for (const [r, c] of E.cellsOf(s.enemies[0])) assert.strictEqual(E.enemyAt(out.state.enemies, r, c), null, fp + ' tile ' + r + ',' + c);
    assert.ok(byId(out.state, 'e1').alive);
  }
});
test('Overkill: only a kill of the whole body carries, along the struck column behind the rear edge (B5)', () => {
  // 2x1 front body, goblin behind column 2; hit through column 2 with leftover 4
  const mk = () => battle([foe(1, 1, { footprint: '2x1', hp: 3 }), foe(0, 2, { hp: 20 }), foe(0, 1, { hp: 20 })]);
  const out = turn(mk(), squad([[2, 2, atk('straight', 7, 1)]]));
  const ok = out.events.filter((e) => e.t === 'overkill');
  assert.deepStrictEqual(ok.map((e) => [e.id, e.amount, e.col]), [['e1', 4, 2]]);
  assert.strictEqual(byId(out.state, 'e1').hp, 16);
  assert.strictEqual(byId(out.state, 'e2').hp, 20, 'the other covered column does not carry');
  // a non-lethal hit never carries
  const out2 = turn(battle([foe(1, 1, { footprint: '2x1', hp: 30 }), foe(0, 2, { hp: 20 })]), squad([[2, 2, atk('straight', 7, 1)]]));
  assert.strictEqual(out2.events.filter((e) => e.t === 'overkill').length, 0);
});
test('Overkill: a deep body carries behind its REAR edge', () => {
  const s = battle([foe(1, 1, { footprint: '1x2', hp: 3 }), foe(-1, 1, { hp: 20 })]); // rear edge is row 0; the boss row is behind it
  const out = turn(s, squad([[2, 1, atk('straight', 8, 1)]]));
  assert.deepStrictEqual(out.events.filter((e) => e.t === 'overkill').map((e) => [e.id, e.amount]), [['e1', 5]]);
  assert.strictEqual(byId(out.state, 'e1').hp, 15);
});
test('Overkill: a back-row kill carries into the boss row (R4); a Bulwark blocks it', () => {
  const s = battle([foe(0, 2, { hp: 3 }), foe(-1, 2, { hp: 20 })]);
  const out = turn(s, squad([[2, 2, atk('straight', 6, 2)]]));
  assert.strictEqual(byId(out.state, 'e1').hp, 17);
  const b = battle([foe(0, 2, { hp: 3, kind: 'bulwark' }), foe(-1, 2, { hp: 20 })]);
  const out2 = turn(b, squad([[2, 2, atk('straight', 6, 2)]]));
  assert.strictEqual(byId(out2.state, 'e1').hp, 20);
  assert.ok(out2.events.some((e) => e.t === 'bulwark'));
});
test('Overkill: a Big body takes carried damage once (no re-carry)', () => {
  const s = battle([foe(1, 0, { hp: 2 }), foe(0, 0, { footprint: '2x1', hp: 4 }), foe(-1, 0, { hp: 20 })]);
  const out = turn(s, squad([[2, 0, atk('straight', 20, 1)]]));
  assert.ok(!byId(out.state, 'e1').alive);
  assert.strictEqual(byId(out.state, 'e2').hp, 20, 'overkill never chains twice');
});
test('Pierce never carries overkill (unchanged), even through a Big body', () => {
  const s = battle([foe(1, 0, { footprint: '2x1', hp: 2 }), foe(0, 0, { hp: 20 })]);
  const out = turn(s, squad([[2, 0, atk('pierce', 6, 3)]]));
  assert.strictEqual(out.events.filter((e) => e.t === 'overkill').length, 0);
});
test('Spill (relic) hits the front-row bodies beside the struck column', () => {
  const s = battle([foe(1, 1, { hp: 2 }), foe(1, 2, { footprint: '2x1', hp: 20 })], { rules: { spill: 1 } });
  const out = turn(s, squad([[2, 1, atk('straight', 5, 1)]]));
  assert.strictEqual(byId(out.state, 'e1').hp, 17);
});
test('Barrel explosion hits a neighbouring Big body once', () => {
  const s = battle([foe(1, 1, { type: 'barrel', hp: 1 }), foe(1, 2, { footprint: '2x1', hp: 20 }), foe(0, 1, { footprint: '1x2' , row: 1 })].slice(0, 2));
  const out = turn(s, squad([[2, 1, atk('straight', 3, 1)]]));
  assert.strictEqual(byId(out.state, 'e1').hp, 18); // blast 2 once
  assert.strictEqual(out.events.filter((e) => e.t === 'explode').length, 1);
});
test('Armour and Hide (ward) are per hit on a Big body', () => {
  const s = battle([foe(1, 0, { footprint: '2x1', hp: 30, gimmick: 'ward', gp: 3 })]);
  const out = turn(s, squad([[2, 0, atk('spread', 2, 1)], [2, 1, atk('straight', 3, 1)]]));
  const h = hits(out.events);
  assert.deepStrictEqual(h.map((x) => x.warded), ['ward', 'ward', null]); // spread (2 < 3) lands twice, straight (3) gets through
});
test('Veil and Guard apply to the whole body', () => {
  const guarded = battle([foe(1, 0, { footprint: '2x1', hp: 30, gimmick: 'guard' }), foe(0, 4, { guardian: true })]);
  const out = turn(guarded, squad([[2, 0, atk('straight', 9, 1)]]));
  assert.strictEqual(byId(out.state, 'e0').hp, 30);
});
test('Hero ability Ignite can target a Big body (2 damage, ignores armour)', () => {
  const s = battle([foe(1, 1, { footprint: '2x2', hp: 10, armor: 5 })], { ability: 'ignite', hero: 'x' });
  const out = E.useAbility(s, 'e0');
  assert.strictEqual(out.state.enemies[0].hp, 8);
});

// ---------- summons, healers, heavy ----------
test('Summons never enter the boss row (R6)', () => {
  const s = battle([foe(-1, 2, { kind: 'summoner', minion: { type: 'goblin', hp: 2, atk: 1 }, hp: 30, atk: 1, footprint: '3x1', col: 1 })]);
  s.enemies[0].col = 1;
  let st = s;
  for (let i = 0; i < 4; i++) st = E.resolveTurn(st, {}, []).state;
  const spawned = st.enemies.filter((e) => e.spawned);
  assert.strictEqual(spawned.length, 4);
  assert.ok(spawned.every((e) => e.row === 0 || e.row === 1), 'rows ' + spawned.map((e) => e.row));
  assert.ok(spawned.every((e) => !E.coversTile(st.enemies[0], e.row, e.col)));
});
test('Summons fill only empty enemy tiles, never a tile covered by a Big body', () => {
  const s = battle([foe(1, 0, { footprint: '2x2', kind: 'summoner', minion: { type: 'goblin', hp: 2, atk: 1 }, hp: 30 })]);
  let st = s;
  for (let i = 0; i < 3; i++) st = E.resolveTurn(st, {}, []).state;
  for (const m of st.enemies.filter((e) => e.spawned)) assert.ok(m.col >= 2, 'minion at ' + m.row + ',' + m.col);
});
test('Splitter in the boss row splits into rows 1-0 only', () => {
  const s = battle([foe(-1, 2, { kind: 'splitter', hp: 3, minion: { type: 'goblin', hp: 1, atk: 1 } }), foe(1, 4)]);
  const out = turn(s, squad([[2, 2, atk('straight', 9, 2)]]));
  const sp = out.state.enemies.filter((e) => e.spawned);
  assert.strictEqual(sp.length, 2);
  assert.ok(sp.every((e) => e.row >= 0));
});
test('Splitter Big body splits into its own anchor tile and a free neighbour', () => {
  const s = battle([foe(1, 1, { footprint: '2x1', kind: 'splitter', hp: 3, minion: { type: 'goblin', hp: 1, atk: 1 } })]);
  const out = turn(s, squad([[2, 1, atk('straight', 9, 1)]]));
  const sp = out.state.enemies.filter((e) => e.spawned).map((e) => e.row + ',' + e.col).sort();
  assert.deepStrictEqual(sp, ['0,1', '1,1']);
});
test('Healer mends a neighbouring Big body once per turn', () => {
  const s = battle([foe(1, 0, { footprint: '2x1', hp: 5, maxHp: 20 }), foe(0, 0, { kind: 'healer', hp: 5, atk: 0 }), foe(0, 1, { hp: 5, atk: 0, kind: 'healer' })]);
  const out = E.resolveTurn(s, {}, []).state;
  assert.strictEqual(out.enemies[0].hp, 5 + 2 + 2); // each healer heals it once
  const s1 = battle([foe(1, 0, { footprint: '2x1', hp: 5, maxHp: 20 }), foe(0, 0, { kind: 'healer', hp: 5, atk: 0 })]);
  assert.strictEqual(E.resolveTurn(s1, {}, []).state.enemies[0].hp, 7);
});
test('Heavy: Big bodies and the boss row do not stride and are not swapped (B9)', () => {
  const s = battle([foe(1, 1, { footprint: '2x1', gimmick: 'stride', hp: 20 }), foe(0, 4, { gimmick: 'stride' })]);
  const out = E.resolveTurn(s, {}, []).state;
  assert.strictEqual(out.enemies[0].col, 1);
  const s2 = battle([foe(1, 0, { gimmick: 'stride' }), foe(1, 1, { footprint: '2x1', hp: 20 })]);
  const o2 = E.resolveTurn(s2, {}, []).state;
  assert.strictEqual(o2.enemies[0].col, 0, 'a 1x1 strider will not swap with a Big body');
  assert.strictEqual(o2.enemies[1].col, 1);
});
test('Heavy: Tide never carries a Big body, the boss row, or a row that holds a Big body', () => {
  const s = battle([foe(1, 0, { gimmick: 'tide', hp: 20 }), foe(1, 2, { footprint: '2x1', hp: 20 }), foe(0, 3), foe(-1, 0, { footprint: '2x1' })]);
  const out = E.resolveTurn(s, {}, []).state;
  assert.deepStrictEqual(out.enemies.map((e) => [e.row, e.col]), [[1, 0], [1, 2], [0, 2], [-1, 0]]); // front row blocked by the Big body, back row drifts left, boss row stays
});
test('Gaze: a wide gazer weakens attackers in every covered column', () => {
  const s = battle([foe(1, 1, { footprint: '2x1', gimmick: 'gaze', gp: 1 })]);
  const st = E.computeStats({ '2,1': 'a', '2,2': 'b', '2,3': 'c' }, ['a', 'b', 'c'].map((id) => ({ id, type: 'swordsman' })), s.enemies, {});
  assert.deepStrictEqual([st['2,1'].atk, st['2,2'].atk, st['2,3'].atk], [2, 2, 3]);
});
test('Regrow waits until every tile of the body is free', () => {
  const s = battle([foe(1, 0, { footprint: '2x1', hp: 3, gimmick: 'regrow', gp: 2 }), foe(0, 4)]);
  const out = turn(s, squad([[2, 0, atk('straight', 9, 1)]]));
  assert.ok(out.state.enemies[0].alive, 'regrown at the end of the turn');
  assert.strictEqual(out.state.enemies[0].hp, 2);
});

// ---------- classic battles are unchanged ----------
function baseEngine() {
  if (process.env.BASE_ENGINE) return process.env.BASE_ENGINE;
  const rev = process.env.BASE_REV || 'HEAD';
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'base-engine-'));
  const file = path.join(dir, 'engine.js');
  try { fs.writeFileSync(file, execSync('git show ' + rev + ':prototype/js/engine.js', { cwd: path.join(__dirname, '..'), stdio: ['ignore', 'pipe', 'ignore'] })); } catch (err) { return null; }
  return file;
}
test('Differential fuzz: 1x1 battles without a boss row match the pre-change engine exactly', () => {
  const file = baseEngine();
  if (!file) { console.log('     (skipped: no base engine)'); return; }
  const Old = require(file);
  if (Old.hitsFor) { console.log('     (skipped: HEAD already has big enemies)'); return; }
  let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const ri = (n) => Math.floor(rnd() * n);
  const kinds = [null, null, null, 'healer', 'splitter', 'summoner', 'bulwark'];
  const gimmicks = [null, null, null, 'guard', 'ward', 'veil', 'gaze', 'sweep', 'stride', 'tide', 'regrow', 'regen', 'rage', 'harden'];
  const strip = (v) => JSON.parse(JSON.stringify(v, (k, x) => (k === 'col' && false ? undefined : x)));
  const clean = (evs) => evs.map((ev) => { const o = Object.assign({}, ev); if (o.t === 'hit' || o.t === 'overkill') delete o.col; if (o.t === 'fire') delete o.cols; return o; });
  let compared = 0;
  for (let n = 0; n < 400; n++) {
    const enemies = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) if (rnd() < 0.45) {
      const e = { type: rnd() < 0.15 ? 'barrel' : 'goblin', row: r, col: c, hp: 1 + ri(12), atk: 1 + ri(4), armor: rnd() < 0.2 ? 1 : 0 };
      if (e.type !== 'barrel') {
        const k = kinds[ri(kinds.length)]; if (k) { e.kind = k; e.minion = { type: 'goblin', hp: 2, atk: 1 }; }
        const g = gimmicks[ri(gimmicks.length)]; if (g && n % 3 === 0) { e.gimmick = g; e.gp = 1 + ri(3); if (g === 'guard') e.guardian = false; }
        if (rnd() < 0.08) e.guardian = true;
      }
      enemies.push(e);
    }
    if (!enemies.length) continue;
    const rules = {}; for (const k of ['spill', 'blast', 'echo', 'feast', 'opening', 'sunder', 'reach', 'plate', 'soften', 'aegis']) if (rnd() < 0.2) rules[k] = 1;
    const stage = { heroHp: 40, heroMaxHp: 40, enemies, rules };
    let a = Old.createState(JSON.parse(JSON.stringify(stage))), b = E.createState(JSON.parse(JSON.stringify(stage)));
    const army = [], placement = {};
    const types = [['swordsman'], ['archer'], ['spearman'], ['mage'], ['drummer'], ['horn'], ['shield'], ['banner'], ['spyglass']];
    for (let i = 0; i < 6; i++) { const t = types[ri(types.length)][0]; const id = 'u' + i; const card = { id, type: t }; if (t === 'mage' && rnd() < 0.3) card.fx = { chain: true }; if (rnd() < 0.2) card.fx = { chain: true, ignoreArmor: true }; army.push(card); placement[(2 + ri(3)) + ',' + ri(5)] = id; }
    for (let t = 0; t < 5 && a.status === 'playing'; t++) {
      const ra = Old.resolveTurn(a, placement, army), rb = E.resolveTurn(b, placement, army);
      assert.deepStrictEqual(clean(strip(rb.events)), strip(ra.events), 'events, battle ' + n + ' turn ' + t);
      assert.deepStrictEqual(strip(Object.assign({}, rb.state, { bossRow: undefined })), strip(ra.state), 'state, battle ' + n + ' turn ' + t);
      a = ra.state; b = rb.state; compared++;
    }
  }
  assert.ok(compared > 400);
  console.log('     compared ' + compared + ' turns');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
