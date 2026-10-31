// Balancing helper: searches for strong placements for each stage.
// Usage: node tools/solve.js [stageId]
'use strict';
const Engine = require('../prototype/js/engine.js');
const STAGES = require('../prototype/js/stages.js');

const TILES = [];
for (const r of Engine.PLAYER_ROWS) for (let c = 0; c < Engine.COLS; c++) TILES.push(Engine.key(r, c));

function randomPlacement(army) {
  const tiles = TILES.slice().sort(() => Math.random() - 0.5);
  const p = {};
  army.forEach((card, i) => { p[tiles[i]] = card.id; });
  return p;
}

function mutate(p) {
  const q = Object.assign({}, p);
  const used = Object.keys(q);
  const from = used[Math.floor(Math.random() * used.length)];
  const to = TILES[Math.floor(Math.random() * TILES.length)];
  const a = q[from];
  const b = q[to];
  q[to] = a;
  if (b) q[from] = b; else delete q[from];
  return q;
}

// Lower is better. A clear scores just below zero; otherwise damage this turn
// plus a rough estimate of what the survivors will cost next turn.
function score(state, placement, army) {
  const { state: s } = Engine.resolveTurn(state, placement, army);
  if (s.status === 'cleared') return { value: -1, s };
  const threat = s.enemies.filter(Engine.isThreat);
  const atk = threat.reduce((n, e) => n + e.atk, 0);
  const hp = threat.reduce((n, e) => n + e.hp, 0);
  const dmg = state.hp - s.hp;
  return { value: dmg + 0.6 * atk + 0.15 * hp + (s.status === 'defeated' ? 100 : 0), s };
}

function anneal(state, army, iters = 4000) {
  let cur = randomPlacement(army);
  let curScore = score(state, cur, army).value;
  let best = cur, bestScore = curScore;
  for (let i = 0; i < iters; i++) {
    const temp = 2 * (1 - i / iters) + 0.01;
    const next = mutate(cur);
    const v = score(state, next, army).value;
    if (v < curScore || Math.random() < Math.exp((curScore - v) / temp)) {
      cur = next; curScore = v;
      if (v < bestScore) { best = next; bestScore = v; }
    }
  }
  return { placement: best, value: bestScore };
}

// Best total damage to finish the stage, exploring a few turn-1 lines.
function solve(state, army, depth = 0, maxTurns = 4) {
  const candidates = [];
  for (let i = 0; i < (depth === 0 ? 30 : 12); i++) candidates.push(anneal(state, army));
  candidates.sort((a, b) => a.value - b.value);
  const seen = new Set();
  let best = null;
  for (const cand of candidates) {
    const { state: s } = Engine.resolveTurn(state, cand.placement, army);
    const sig = JSON.stringify(s.enemies.map((e) => [e.alive, e.hp, e.atk])) + s.hp;
    if (seen.has(sig)) continue;
    seen.add(sig);
    if (seen.size > 4) break;
    const dmg = state.hp - s.hp;
    let total = dmg, line = [cand.placement];
    if (s.status === 'playing') {
      if (depth + 1 >= maxTurns) total += 99;
      else {
        const sub = solve(s, army, depth + 1, maxTurns);
        total += sub.total;
        line = line.concat(sub.line);
      }
    } else if (s.status === 'defeated') total += 99;
    if (!best || total < best.total) best = { total, line };
  }
  return best;
}

function draw(placement, army) {
  const byId = Object.fromEntries(army.map((c) => [c.id, c]));
  const rows = [];
  for (const r of Engine.PLAYER_ROWS) {
    const cells = [];
    for (let c = 0; c < Engine.COLS; c++) {
      const id = placement[Engine.key(r, c)];
      cells.push((id ? byId[id].type.slice(0, 6) : '.').padEnd(7));
    }
    rows.push('   ' + cells.join(''));
  }
  return rows.join('\n');
}


// Is there a placement that clears the whole battle this turn (so 0 damage)? Anneals with restarts.
function oneTurnClear(state, army, restarts = 12, iters = 1500) {
  for (let k = 0; k < restarts; k++) {
    const r = anneal(state, army, iters);
    if (score(state, r.placement, army).s.status === 'cleared') return r.placement;
  }
  return null;
}

// Share of uniformly random placements that clear this turn ("how obvious is it").
function randomClearRate(state, army, n = 200) {
  let ok = 0;
  for (let i = 0; i < n; i++) if (Engine.resolveTurn(state, randomPlacement(army), army).state.status === 'cleared') ok++;
  return ok / n;
}

module.exports = { anneal, solve, score, oneTurnClear, randomClearRate, randomPlacement, draw };

if (require.main === module) {
  const only = process.argv[2];
  for (const stage of STAGES) {
    if (only && stage.id !== only) continue;
    const state = Engine.createState(stage);
    const result = solve(state, stage.army);
    console.log(`\n== Stage ${stage.number}: ${stage.name} (HP ${stage.heroHp}) ==`);
    console.log(`best total damage: ${result.total}, turns: ${result.line.length}`);
    let s = state;
    result.line.forEach((p, i) => {
      const out = Engine.resolveTurn(s, p, stage.army).state;
      console.log(` turn ${i + 1}: took ${s.hp - out.hp}, status ${out.status}`);
      console.log(draw(p, stage.army));
      s = out;
    });
  }
}
