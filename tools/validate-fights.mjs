#!/usr/bin/env node
// Balance check of the V2 fights (prototype/data/fights) with the solver and the reference squad of each level.
//   node tools/validate-fights.mjs [--region=N] [--sub=text] [--step=boss] [--every=K] [--quick] [--write] [--suggest] [--jobs=4] [--json=file]
// Reference squad per level = js/fights.js `reference(L)`: the current units with the player's power set to the expected P(L) of WORLD_PROGRESSION 4.1
//   - every attacker's ATK is raised (run-upgrade style mods.atk) to P(L) = 2 + 0.2 L (L <= 15) / 5 + 0.14 (L - 15), or kept at its base when that is higher,
//   - the Shield's block is set to round(2 + 0.05 L), the hero has H(L) = 9 + L (L <= 15) / 24 + 0.9 (L - 15) max HP, no hero ability, no relic, no gear, no rule,
//   - the squad grows with the level: sword, archer, spear, drummer, shield (Lv1), + mage (Lv4), + second Shield (Lv6), + archer (Lv8), + storm mage (Lv12), + third Shield (Lv14). No horn / banner: P(L) counts attackers' own ATK.
// Checks per fight (cost = HP lost on the best line the annealing solver finds, turns = length of that line):
//   beatable (a line exists within the turn limit and costs less than the band's share of max HP), non-trivial (no one-turn clear from the combine fights on),
//   turns inside the band of its step, difficulty rises along the 7 fights of a sub-area (within a tolerance), bosses are harder than elites.
// --write rewrites the BALANCE block of docs/data/fights-unsupported.md. The solver is stochastic: Math.random is replaced by a generator seeded per fight, so a run is reproducible.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { fork } from 'node:child_process';

const require = createRequire(import.meta.url);
const HERE = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(HERE), '..');
const args = process.argv.slice(2);
const opt = (name, d) => { const a = args.find((x) => x.startsWith('--' + name + '=')); return a ? a.split('=')[1] : d; };
const flag = (name) => args.includes('--' + name);
const V2MODE = opt('rules', 'classic') === 'v2';          // --rules=v2: V2 fights (data/fights-v2), the V2 reference squad and rules.v2 (docs/V2_UNITS_PLAN.md step 5)
const MERGE_MODE = opt('merge', 'own');                    // --merge=best: Best of column instead of Own element (V2 only; a report, not the pass target)
const SQUAD = opt('squad', 'ref');                         // --squad=weak|neutral|resist (V2): each attacker takes an element by its multiplier against the fight's enemies (affinity study, see v2-study notes)
const MERGE_CAP = opt('mergecap', null);                   // --mergecap=0..3 (V2): the per-column merge cap (0 = merges off) for the merge study
const DATA = path.join(ROOT, V2MODE ? 'prototype/data/fights-v2' : 'prototype/data/fights');
const TUNE_SUFFIX = V2MODE ? '.v2' : '';

// Limits per step: max share of the hero's HP the best line may cost, turn band, one-turn clear allowed.
const BANDS = {
  intro:    { cost: 0.30, turns: [1, 2], oneTurn: true },
  intro2:   { cost: 0.35, turns: [1, 3], oneTurn: true },
  combine:  { cost: 0.40, turns: [1, 3], oneTurn: false },
  combine2: { cost: 0.45, turns: [2, 3], oneTurn: false },
  preelite: { cost: 0.50, turns: [2, 4], oneTurn: false },
  elite:    { cost: 0.55, turns: [2, 4], oneTurn: false },
  boss:     { cost: 0.65, turns: [2, 5], oneTurn: false },
};
const STEPS = Object.keys(BANDS);
const MAX_TURNS = 5;

function loadAll() {
  const files = fs.readdirSync(DATA).filter((f) => /^region-\d+\.json$/.test(f)).sort();
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')));
}
function setup() {
  const Engine = require('../prototype/js/engine.js');
  const P = require('../prototype/js/progress.js');
  const Fights = require('../prototype/js/fights.js');
  const Solve = require('./solve.js');
  Fights.load(loadAll(), {});
  if (V2MODE) {
    const V2 = require('../prototype/js/v2.js'), rd = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/data', f), 'utf8'));
    V2.load(rd('units.json'), rd('elements.json'), rd('families.json'));
    if (MERGE_CAP !== null) { if (Number(MERGE_CAP) === 0) for (const k of Object.keys(V2.MERGES)) delete V2.MERGES[k]; else V2.MERGE_RULES.cap.perColumnPerTurn = Number(MERGE_CAP); }
  }
  return { Engine, P, Fights, Solve };
}

// ---------- worker: solve a list of fight ids ----------
function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hashStr = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

// Affinity study: give each attacker (cycling) one of the three elements that score best (weak), nearest to x1 (neutral) or worst (resist) against the fight's enemies by HP-weighted chart multiplier.
function retag(env, army, fight) {
  const aff = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/data/elements.json'), 'utf8')).affinity, els = Object.keys(aff);
  const real = fight.enemies.filter((e) => e.role !== 'barrel' && e.element).map((e) => ({ hp: e.hp, element: String(e.element).toLowerCase() }));
  const score = (x) => real.reduce((n, e) => n + e.hp * ((aff[x] || {})[e.element] || 1), 0) / Math.max(1, real.reduce((n, e) => n + e.hp, 0));
  const ranked = els.map((x) => ({ x, m: score(x) })).sort((a, b) => (SQUAD === 'weak' ? b.m - a.m : SQUAD === 'resist' ? a.m - b.m : Math.abs(a.m - 1) - Math.abs(b.m - 1)) || els.indexOf(a.x) - els.indexOf(b.x));
  const pick = ranked.slice(0, 3);
  let i = 0;
  for (const c of army) if (c.pattern && c.atk !== undefined) { c.element = pick[i % 3].x; i++; }
  fight.__m = Math.round(pick.reduce((n, p) => n + p.m, 0) / 3 * 100) / 100;
}
function mergeHist(Engine, state, line, army) {
  const h = [0, 0, 0, 0, {}]; let s = state;
  for (const pl of line) {
    const out = Engine.resolveTurn(s, pl, army);
    const per = {};
    for (const ev of out.events) if (ev.t === 'merge') { per[ev.col] = (per[ev.col] || 0) + 1; h[4][ev.id] = (h[4][ev.id] || 0) + 1; }
    for (const n of Object.values(per)) h[Math.min(3, n)]++;
    s = out.state;
    if (s.status !== 'playing') break;
  }
  return h;
}
function checkFight(env, fight, quick) {
  const { Engine, P, Fights, Solve } = env;
  const L = fight.level, rs = V2MODE ? Fights.referenceSaveV2(L, P) : Fights.referenceSave(L, P), army = rs.army, maxHp = rs.maxHp;
  const stage = Fights.stage(fight, V2MODE ? { v2: true } : undefined);
  const rules = P.rulesFor(rs.save, {});
  if (V2MODE) rules.v2 = { mergeMode: MERGE_MODE };
  if (V2MODE && SQUAD !== 'ref') retag(env, army, fight);
  const state = Engine.createState(Object.assign({ heroHp: maxHp, heroMaxHp: maxHp, rules }, stage));
  const band = BANDS[fight.step];
  const effort = quick ? { restarts: 5, iters: 900, first: 6 } : { restarts: 10, iters: 1200, first: 10 };
  Math.random = seeded(hashStr(fight.id));
  const clear = Solve.oneTurnClear(state, army, effort.restarts, effort.iters);
  const limit = band.cost * maxHp;
  let best = Solve.solve(state, army, 0, MAX_TURNS, { first: effort.first, later: 3, iters: effort.iters });
  for (let k = 1; k <= (quick ? 1 : 3) && (best.total > limit || best.line.length > band.turns[1]); k++) {
    const b2 = Solve.solve(state, army, 0, MAX_TURNS, { first: effort.first * (k + 1), later: 3 + k, iters: effort.iters + 600 * k });
    if (b2.total < best.total || (b2.total === best.total && b2.line.length < best.line.length)) best = b2;
  }
  // a found one-turn clear is real; if the search missed it but the best line is one turn long, it is a clear too
  const oneTurn = !!clear || (best.total < 99 && best.line.length === 1 && best.total === 0);
  const real = fight.enemies.filter((e) => e.role !== 'barrel');
  const volley = army.reduce((n, c) => n + (c.atk || 0), 0);
  const hpTotal = real.reduce((n, e) => n + e.hp * (1 + 0.12 * (e.armor || 0)), 0);
  const threat = real.reduce((n, e) => n + e.atk * ((Engine.FOOTPRINTS[e.fp || '1x1'] || { w: 1 }).w), 0);
  const hist = V2MODE ? mergeHist(Engine, state, best.line, army) : null;
  const rec = { id: fight.id, mult: fight.__m, hist, step: fight.step, level: L, maxHp, cost: best.total, turns: best.line.length, oneTurn, load: Math.round((hpTotal / Math.max(1, volley)) * 100) / 100, threat: Math.round((threat / maxHp) * 100) / 100, hp: hpTotal, fails: [] };
  if (best.total >= 99) rec.fails.push('unwinnable in ' + MAX_TURNS + ' turns');
  else {
    if (best.total > limit) rec.fails.push('costs ' + best.total + ' of ' + maxHp + ' HP (limit ' + Math.floor(limit) + ')');
    if (best.line.length > band.turns[1]) rec.fails.push('takes ' + best.line.length + ' turns (max ' + band.turns[1] + ')');
    if (!band.oneTurn && oneTurn) rec.fails.push('trivial: one-turn clear');
    else if (best.line.length < band.turns[0] && !band.oneTurn) rec.fails.push('too short (' + best.line.length + ' turn)');
  }
  return rec;
}

if (process.argv[2] === '--worker') {
  const env = setup();
  process.on('message', (m) => {
    if (m.done) process.exit(0);
    const f = env.Fights.byId(m.id);
    process.send({ rec: checkFight(env, f, m.quick) });
  });
  process.send({ ready: true });
} else {
  main();
}

// ---------- main ----------
async function main() {
  const env = setup();
  const quick = flag('quick'), jobs = Number(opt('jobs', 4));
  const reg = opt('region', null), subq = opt('sub', null), stepq = opt('step', null), every = Number(opt('every', 1));
  let list = env.Fights.all.filter((f) => (!reg || env.Fights.sub(f.sub).regionId && env.Fights.regions.findIndex((r) => r.id === env.Fights.sub(f.sub).regionId) + 1 === Number(reg)) && (!subq || f.sub.includes(subq)) && (!stepq || f.step === stepq));
  if (every > 1) { const subs = [...new Set(list.map((f) => f.sub))].filter((_, i) => i % every === 0); list = list.filter((f) => subs.includes(f.sub)); }
  console.log(`solving ${list.length} fights with ${jobs} workers${quick ? ' (quick)' : ''}`);
  const recs = {};
  const queue = list.map((f) => f.id);
  let done = 0; const t0 = Date.now();
  await new Promise((resolve) => {
    let alive = jobs;
    for (let j = 0; j < jobs; j++) {
      const w = fork(HERE, ['--worker', ...args.filter((a) => a !== '--worker')], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'] });
      const next = () => { const id = queue.shift(); if (id === undefined) { w.send({ done: true }); return; } w.send({ id, quick }); };
      w.on('message', (m) => { if (m.ready) next(); else { recs[m.rec.id] = m.rec; if (++done % 50 === 0) console.log(`  ${done}/${list.length} (${Math.round((Date.now() - t0) / 1000)}s)`); next(); } });
      w.on('exit', () => { if (--alive === 0) resolve(); });
    }
  });
  report(env, list, recs, t0);
}

function report(env, list, recs, t0) {
  const out = [];
  const ok = (r) => !r.fails.length;
  const all = list.map((f) => recs[f.id]).filter(Boolean);
  // sub-area level checks: difficulty rises, bosses harder than elites
  const bySub = {};
  for (const f of list) (bySub[f.sub] = bySub[f.sub] || []).push(recs[f.id]);
  const diff = (r) => r.cost / r.maxHp + 0.07 * (r.turns - 1) + 0.04 * (r.load + r.threat);
  const subFails = [];
  for (const [sub, rs] of Object.entries(bySub)) {
    rs.sort((a, b) => STEPS.indexOf(a.step) - STEPS.indexOf(b.step));
    for (let i = 1; i < rs.length; i++) {
      const a = rs[i - 1], b = rs[i];
      if (b.load + 0.05 < a.load && !(a.step === 'preelite' && b.step === 'elite')) { subFails.push({ sub, kind: 'rise', msg: `${b.step} (load ${b.load}) easier than ${a.step} (load ${a.load})` }); }
      else if (diff(b) + 0.3 < diff(a) && !(b.step === 'elite' && a.step === 'preelite')) subFails.push({ sub, kind: 'rise', msg: `${b.step} (cost ${b.cost}/${b.maxHp}, ${b.turns}t) easier than ${a.step} (cost ${a.cost}/${a.maxHp}, ${a.turns}t)` });
    }
    const el = rs.find((r) => r.step === 'elite'), bo = rs.find((r) => r.step === 'boss');
    if (el && bo && !(bo.load > el.load && diff(bo) + 0.12 >= diff(el))) subFails.push({ sub, kind: 'boss<elite', msg: `boss (load ${bo.load}, cost ${bo.cost}, ${bo.turns}t) not harder than elite (load ${el.load}, cost ${el.cost}, ${el.turns}t)` });
  }
  const pass = all.filter(ok).length;
  out.push(`Fights solved: ${all.length}; pass ${pass}/${all.length} (${(100 * pass / Math.max(1, all.length)).toFixed(1)}%) in ${Math.round((Date.now() - t0) / 1000)}s`);
  const stepRows = [];
  for (const st of STEPS) {
    const rs = all.filter((r) => r.step === st);
    if (!rs.length) continue;
    const avg = (k) => (rs.reduce((n, r) => n + r[k], 0) / rs.length);
    const costPct = rs.reduce((n, r) => n + r.cost / r.maxHp, 0) / rs.length;
    stepRows.push({ step: st, n: rs.length, pass: rs.filter(ok).length, cost: avg('cost'), costPct, turns: avg('turns'), oneTurn: rs.filter((r) => r.oneTurn).length });
  }
  out.push('step       n   pass   avg cost (% HP)   avg turns   one-turn clears');
  for (const r of stepRows) out.push(`${r.step.padEnd(9)} ${String(r.n).padStart(4)} ${String(r.pass).padStart(5)}   ${r.cost.toFixed(1).padStart(5)} (${(100 * r.costPct).toFixed(0).padStart(2)}%)      ${r.turns.toFixed(2)}        ${r.oneTurn}`);
  if (V2MODE) {
    const H = [0, 0, 0, 0]; for (const r of all) if (r.hist) for (let i = 1; i < 4; i++) H[i] += r.hist[i];
    const MID = {}; for (const r of all) if (r.hist) for (const [k, v] of Object.entries(r.hist[4] || {})) MID[k] = (MID[k] || 0) + v;
    const midTotal = Object.values(MID).reduce((n, x) => n + x, 0) || 1, midTop = Object.entries(MID).sort((a, b) => b[1] - a[1]).slice(0, 6);
    out.push(`merge use in the best lines (${midTotal} merge events, ${Object.keys(MID).length} different merges): ` + midTop.map(([k, v]) => `${k} ${(100 * v / midTotal).toFixed(0)}%`).join(', '));
    const costAll = all.reduce((n, r) => n + r.cost / r.maxHp, 0) / Math.max(1, all.length), turnsAll = all.reduce((n, r) => n + r.turns, 0) / Math.max(1, all.length);
    const m = all.filter((r) => r.mult); 
    out.push(`V2 study: squad=${SQUAD} merge mode=${MERGE_MODE} merge cap=${MERGE_CAP === null ? 'data' : MERGE_CAP}; mean cost ${(100 * costAll).toFixed(1)}% of max HP, mean turns ${turnsAll.toFixed(2)}, win ${all.filter((r) => r.cost < 99).length}/${all.length}` + (m.length ? `, mean enemy multiplier of the squad's elements x${(m.reduce((n, r) => n + r.mult, 0) / m.length).toFixed(2)}` : '') + `; merge columns in the best lines (1 / 2 / 3 merges): ${H[1]} / ${H[2]} / ${H[3]}`);
  }
  const subTotal = Object.keys(bySub).length;
  const risePass = subTotal - new Set(subFails.filter((x) => x.kind === 'rise').map((x) => x.sub)).size;
  const bossPass = subTotal - subFails.filter((x) => x.kind === 'boss<elite').length;
  out.push(`sub-areas where difficulty rises along the 7 fights: ${risePass}/${subTotal}; boss harder than elite: ${bossPass}/${subTotal}`);
  const regionOf = (id) => env.Fights.regions.findIndex((r) => r.id === env.Fights.sub(id.split('/')[0]).regionId) + 1;
  const perRegion = {};
  for (const r of all) { const k = regionOf(r.id); (perRegion[k] = perRegion[k] || { n: 0, ok: 0 }); perRegion[k].n++; if (ok(r)) perRegion[k].ok++; }
  out.push('by region: ' + Object.entries(perRegion).map(([k, v]) => `R${k} ${v.ok}/${v.n}`).join(', '));
  const bad = all.filter((r) => !ok(r));
  const lines = bad.map((r) => `  ${r.id} Lv${r.level}: ${r.fails.join('; ')} [cost ${r.cost}/${r.maxHp}, ${r.turns}t]`);
  if (lines.length) out.push('\nFAILING FIGHTS (' + bad.length + '):\n' + lines.join('\n'));
  if (subFails.length) out.push('\nSUB-AREA CHECKS (' + subFails.length + '):\n' + subFails.map((x) => `  ${x.sub}: ${x.kind}: ${x.msg}`).join('\n'));
  console.log(out.join('\n'));
  if (flag('suggest')) suggest(bad, subFails, all);
  if (opt('json', null)) fs.writeFileSync(opt('json'), JSON.stringify({ recs: all, subFails }, null, 1));
  if (flag('write') && all.length > 600) {
    const MD = path.join(ROOT, 'docs/data/fights-unsupported.md');
    let md = fs.readFileSync(MD, 'utf8');
    const TAG = V2MODE ? 'BALANCE_V2' : 'BALANCE';
    if (V2MODE && !md.includes('<!-- BALANCE_V2:START -->')) md = md.replace(/\s*$/, '\n') + '\n## Balance validation, V2 rules (tools/validate-fights.mjs --rules=v2)\n\n<!-- BALANCE_V2:START -->\n<!-- BALANCE_V2:END -->\n';
    let b = `<!-- ${TAG}:START -->\n`;
    if (V2MODE) b += `Last run of \`node tools/validate-fights.mjs --rules=v2 --write\` over ${all.length} V2 fights (\`prototype/data/fights-v2\`, tuned by \`tools/fights-tune.v2.json\` and \`fights-adjust.v2.json\`) with the V2 reference squad of each level (js/fights.js \`referenceV2(L)\`), rules.v2 with Own element merges and the default chart.\n\n`;
    else b += `Last run of \`node tools/validate-fights.mjs --write\` over ${all.length} fights with the reference squad of each level (js/fights.js \`reference(L)\`, P(L) of WORLD_PROGRESSION 4.1 mapped onto the current units).\n\n`;
    b += `- Fights passing every check (beatable, non-trivial from the combine fights on, turns in band): **${pass}/${all.length}** (${(100 * pass / all.length).toFixed(1)}%).\n`;
    b += `- Sub-areas where difficulty rises along the 7 fights: **${risePass}/${subTotal}**; boss harder than elite: **${bossPass}/${subTotal}**.\n\n`;
    b += '| Step | Fights | Pass | Avg cost (HP, % of max) | Avg turns | One-turn clears |\n|---|---|---|---|---|---|\n';
    for (const r of stepRows) b += `| ${r.step} | ${r.n} | ${r.pass} | ${r.cost.toFixed(1)} (${(100 * r.costPct).toFixed(0)}%) | ${r.turns.toFixed(2)} | ${r.oneTurn} |\n`;
    b += '\nBy region: ' + Object.entries(perRegion).map(([k, v]) => `R${k} ${v.ok}/${v.n}`).join(', ') + '.\n';
    if (bad.length) b += `\n### Remaining failing fights (${bad.length})\n\n` + lines.map((l) => '-' + l.slice(1)).join('\n') + '\n';
    if (subFails.length) b += `\n### Remaining sub-area check failures (${subFails.length})\n\n` + subFails.map((x) => `- ${x.sub}: ${x.kind}: ${x.msg}`).join('\n') + '\n';
    b += `<!-- ${TAG}:END -->`;
    md = md.replace(new RegExp(`<!-- ${TAG}:START -->[\\s\\S]*<!-- ${TAG}:END -->`), () => b);
    fs.writeFileSync(MD, md);
    console.log('wrote the ' + TAG + ' block of docs/data/fights-unsupported.md');
  }
  process.exitCode = bad.length ? 1 : 0;
}

// --suggest: turn the failures into per-fight corrections (tools/fights-adjust.json: atk / hp factors) for the next `node tools/build-fights.mjs`.
function suggest(bad, subFails, all) {
  const file = path.join(ROOT, 'tools/fights-adjust' + TUNE_SUFFIX + '.json');
  const adj = JSON.parse(fs.readFileSync(file, 'utf8'));
  const bump = (id, key, f) => { const a = adj[id] || (adj[id] = {}); const lim = key === 'atk' ? [0.4, 1.7] : [0.6, 1.5]; a[key] = Math.round(Math.max(lim[0], Math.min(lim[1], (a[key] || 1) * f)) * 100) / 100; };
  let n = 0;
  for (const r of bad) {
    const costM = /costs (\d+) of (\d+) HP \(limit (\d+)\)/.exec(r.fails.join(';'));
    if (costM) { bump(r.id, 'atk', Math.max(0.5, Math.min(0.95, 0.85 * Number(costM[3]) / Number(costM[1])))); n++; }
    if (r.fails.some((f) => /unwinnable/.test(f))) { bump(r.id, 'atk', 0.6); bump(r.id, 'hp', 0.85); n++; }
    if (r.fails.some((f) => /takes \d+ turns/.test(f))) { bump(r.id, 'hp', 0.85); n++; }
    if (r.fails.some((f) => /trivial|too short/.test(f))) { bump(r.id, 'hp', 1.2); n++; }
  }
  for (const x of subFails) {
    const m = /^(\w+) \(/.exec(x.msg), id = x.sub + '/' + (x.kind === 'boss<elite' ? 'boss' : (m || [])[1]);
    if (id.endsWith('undefined')) continue;
    bump(id, 'atk', 1.15); n++;
  }
  fs.writeFileSync(file, JSON.stringify(adj, null, 0).replace(/},"/g, '},\n"') + '\n');
  console.log('suggested ' + n + ' corrections; fights-adjust' + TUNE_SUFFIX + '.json now holds ' + Object.keys(adj).length + ' entries');
}
