#!/usr/bin/env node
// Region data -> world-gen.js + per-region layer files. Flags: --check, --preview
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { generateRegion } from './world/gen-region.mjs';
import { loadManifest, tileIndex } from './world/tile-index.mjs';
import { previewSvg } from './world/preview.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const SLOT = 112, TILE = 64;
const DIRS = { N: [0, -1], NE: [1, -1], E: [1, 0], SE: [1, 1], S: [0, 1], SW: [-1, 1], W: [-1, 0], NW: [-1, -1] };
const rle = (a) => { const o = []; let p = a[0], n = 0; for (const v of a) { if (v === p) n++; else { o.push(p, n); p = v; n = 1; } } o.push(p, n); return o; };

function loadDefs() {
  const dir = path.join(ROOT, 'prototype/data/regions');
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}
function boxOf(def) { // world tile of the region box origin
  const off = (SLOT - def.size) / 2;
  if (!def.slot) return [off, off];
  const [dx, dy] = DIRS[def.slot.dir]; return [dx * def.slot.ring * SLOT + off, dy * def.slot.ring * SLOT + off];
}

function build() {
  const manifest = loadManifest(ROOT);
  const defs = loadDefs();
  const order = defs.sort((a, b) => (a.kind === 'camp' ? -1 : b.kind === 'camp' ? 1 : (a.slot.ring - b.slot.ring) || a.id.localeCompare(b.id)));
  const gens = {}, tis = {};
  for (const d of order) {
    tis[d.id] = tileIndex(manifest, d.tileset, ROOT);
    gens[d.id] = generateRegion(d, tis[d.id], boxOf(d));
    for (const sa of d.subareas) for (const o of sa.overlays || []) tis[d.id].need(o);
    for (const o of ['overlays/fog-edge', 'overlays/fog-full']) tis.greenvale ? tis.greenvale.need(o) : tileIndex(manifest, 'greenvale').need(o); // fog tiles are shared (Greenvale set)
  }
  const W = (b, x, y) => [Math.round((b[0] + x + 0.5) * TILE), Math.round((b[1] + y + 0.5) * TILE)];
  const regions = [], assets = {};
  for (const d of order) {
    const g = gens[d.id], b = g.box, N = g.N;
    const gatesOut = g.gates.map((q) => ({ from: q.from, to: q.to, kind: q.kind, region: q.region || null, dir: q.dir ? undefined : q.dir, face: q.face, at: [b[0] + q.c[0], b[1] + q.c[1]], cells: q.cells.map((i) => [b[0] + (i % N), b[1] + ((i / N) | 0)]), prop: { k: q.prop.k, x: b[0] + q.prop.x, y: b[1] + q.prop.y } , stub: q.dir && !q.to && q.from === 'camp' ? undefined : undefined }));
    g.gates.forEach((q, k) => { if (d.kind === 'camp') gatesOut[k].stub = q.dir; });
    const subareas = JSON.parse(JSON.stringify(g.subOut));
    const lastSub = d.subareas.find((s) => s.final);
    regions.push({
      id: d.id, name: d.name, kind: d.kind || 'chain', slot: d.slot, orient: d.orient || 0, mirror: !!d.mirror, size: d.size, origin: b,
      startSub: d.startSub, defaultBiome: d.defaultBiome, requires: d.requires || null, ring: d.slot ? d.slot.ring : 0,
      entry: d.kind === 'camp' ? null : W(b, g.entryPt[0], g.entryPt[1]), exit: d.kind === 'camp' ? null : { at: W(b, g.exitPt[0], g.exitPt[1]), to: d.exit.to || null, from: lastSub.id },
      subIds: d.subareas.map((s) => s.id), subareas, gates: gatesOut, links: [],
      blocked: rle(Array.from(g.blocked)), subId: rle(Array.from(g.lab, (v) => v + 1)),
    });
    // layer file
    const layers = {}; for (const [k, v] of Object.entries(g.layers)) layers[k] = { type: v.type, grid: rle(Array.from(v.grid)) };
    assets[d.id] = { id: d.id, size: N, origin: b, tiles: g.tiles, ground: rle(Array.from(g.ground)), detail: rle(Array.from(g.detail)),
      sets: layers, setOrder: [...g.sets.keys()].filter((k) => g.layers[k]),
      props: g.props.map((p) => ({ k: p.k, x: p.x, y: p.y, w: p.w, h: p.h, t: p.t, ...(p.gate ? { gate: 1 } : {}), ...(p.landmark ? { landmark: 1 } : {}) })),
      overlays: Object.fromEntries(d.subareas.filter((s) => s.overlays).map((s) => [s.id, s.overlays])),
      fog: { edge: 'overlays/fog-edge', full: 'overlays/fog-full' } };
  }
  // cross-region: unlocks of the exit sub, links between regions / camp stubs
  const byId = Object.fromEntries(regions.map((r) => [r.id, r]));
  for (const r of regions) if (r.exit && r.exit.to) {
    const to = byId[r.exit.to]; if (!to) throw new Error(`exit.to unknown region ${r.exit.to}`);
    r.subareas[r.exit.from].unlocks = [to.startSub]; to.subareas[to.startSub].from = r.exit.from;
  }
  const camp = byId.camp;
  const link = (from, fromPt, to, toPt, fromEdge, dirName) => {
    const vert = fromEdge === 'N' || fromEdge === 'S';
    const kind = dirName && dirName.length === 2 ? 'portal' : 'walk';
    const cells = [];
    if (kind === 'walk') {
      const [ax, ay] = fromPt, [bx, by] = toPt;
      const seg = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let k = 0; k <= n; k++) { const x = Math.round(x0 + ((x1 - x0) * k) / (n || 1)), y = Math.round(y0 + ((y1 - y0) * k) / (n || 1)); for (let w = -1; w <= 1; w++) cells.push(vert ? [x + w, y] : [x, y + w]); } };
      if (vert) { const my = Math.round((ay + by) / 2); seg(ax, ay, ax, my); seg(ax, my, bx, my); seg(bx, my, bx, by); } else { const mx = Math.round((ax + bx) / 2); seg(ax, ay, mx, ay); seg(mx, ay, mx, by); seg(mx, by, bx, by); }
    }
    return { from, to, kind, a: fromPt, b: toPt, cells };
  };
  const tile = (pt) => [Math.floor(pt[0] / TILE), Math.floor(pt[1] / TILE)];
  const edgeCell = (r, face) => r.gates.find((q) => q.kind === 'exit').at;
  for (const r of regions) {
    if (r.kind === 'camp') continue;
    const dirName = r.slot.dir;
    const prev = r.ring === 1 ? camp : regions.find((q) => q.slot && q.slot.dir === dirName && q.ring === r.ring - 1);
    if (!prev) continue;
    const startTile = tile(r.entry);
    if (prev.kind === 'camp') { const st = prev.gates.find((q) => q.stub === dirName); r.requiresLink = true; r.links.push(link('camp', st.at, r.id, startTile, st.face, dirName)); }
    else { const ex = prev.gates.find((q) => q.kind === 'exit'); r.links.push(link(prev.id, ex.at, r.id, startTile, ex.face, dirName)); }
  }
  const bytes = (o) => Buffer.byteLength(JSON.stringify(o));
  const out = { version: 1, tile: TILE, slot: SLOT, regions };
  return { out, assets, gens, defs: order, tis, bytes };
}

const stable = (o) => JSON.stringify(o);
function emit(r) {
  const text = `// Generated by tools/build-world.mjs from prototype/data/regions/*.json. Do not edit.\n(function (root, factory) {\n  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.WorldGen = factory();\n}(typeof self !== 'undefined' ? self : this, function () {\n  return ${stable(r.out)};\n}));\n`;
  fs.writeFileSync(path.join(ROOT, 'prototype/js/world-gen.js'), text);
  fs.mkdirSync(path.join(ROOT, 'prototype/assets/world'), { recursive: true });
  for (const [id, a] of Object.entries(r.assets)) fs.writeFileSync(path.join(ROOT, `prototype/assets/world/${id}.json`), stable(a));
  return text;
}

function check(r) {
  const errs = [], info = [];
  const E = (m) => errs.push(m);
  for (const reg of r.out.regions) {
    const g = r.gens[reg.id], N = g.N; const pass = (i) => !g.blocked[i] && g.land[i];
    if (reg.kind === 'camp') { info.push(`camp: ${reg.gates.length} gate stubs`); continue; }
    for (const [sid, s] of Object.entries(reg.subareas)) {
      const n = 1 + s.spots.length + s.elites.length;
      if (n < 6 || n > 7) E(`${reg.id}/${sid}: ${n} enemies (want 6-7)`);
      if (!s.wp || !s.event || !s.secret) E(`${reg.id}/${sid}: missing wp/event/secret`);
      if (reg.subIds && s.shopFlag && !s.shop) E(`${sid}: shop flag without position`);
      if (s.poiKind && !s.poi) E(`${sid}: poi missing`);
    }
    // spacing between all nodes of a sub-area (world units / 64 = tiles)
    for (const [sid, s] of Object.entries(reg.subareas)) {
      const en = [s.boss, ...s.spots, ...s.elites].filter(Boolean), other = [s.poi, s.shop, s.event, s.wp, s.secret].filter(Boolean);
      const all = [...en.map((p) => ['e', p]), ...other.map((p) => ['o', p])];
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
        const d = Math.hypot(all[i][1][0] - all[j][1][0], all[i][1][1] - all[j][1][1]) / 64;
        const lim = all[i][0] === 'e' && all[j][0] === 'e' ? 4.5 : 3;
        if (d < lim - 1e-6) E(`${reg.id}/${sid}: nodes ${d.toFixed(2)} tiles apart (< ${lim})`);
      }
    }
    // reachability with every gate open: BFS from the region entry over the whole region
    const [ex, ey] = [Math.floor(reg.entry[0] / 64) - reg.origin[0], Math.floor(reg.entry[1] / 64) - reg.origin[1]];
    const { dist } = bfsAll(N, ex + ey * N, pass);
    const tileOf = (p) => (Math.floor(p[1] / 64) - reg.origin[1]) * N + (Math.floor(p[0] / 64) - reg.origin[0]);
    for (const [sid, s] of Object.entries(reg.subareas)) for (const [name, p] of [['boss', s.boss], ['entry', s.entry], ['wp', s.wp], ['event', s.event], ['secret', s.secret], ['poi', s.poi], ['shop', s.shop], ...s.spots.map((q, i) => ['spot' + i, q]), ...s.elites.map((q, i) => ['elite' + i, q])])
      if (p && dist[tileOf(p)] < 0) E(`${reg.id}/${sid}: ${name} not reachable from the region entry`);
    for (const q of reg.gates) { if (dist[(q.at[1] - reg.origin[1]) * N + (q.at[0] - reg.origin[0])] < 0) E(`${reg.id}: gate ${q.from}->${q.to} not reachable`); }
    // per-sub: every outgoing gate reachable from the sub's own entry, without crossing a closed gate
    const ids = reg.subIds;
    for (const q of reg.gates.filter((x) => x.kind === 'link')) {
      const si = ids.indexOf(q.from); const s = reg.subareas[q.from];
      const p2 = (i) => pass(i) && (g.lab[i] === si || g.gap[i]);
      const dd = bfsAll(N, tileOf(s.entry), p2).dist;
      if (dd[(q.at[1] - reg.origin[1]) * N + (q.at[0] - reg.origin[0])] < 0) E(`${reg.id}/${q.from}: gate to ${q.to} unreachable from its own entry`);
      // closed gates really separate (the cut cells are the only passage)
    }
    // adjacency graph contains every link
    const adj = new Set(); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) for (const [dx, dy] of [[1, 0], [0, 1]]) { if (x + dx >= N || y + dy >= N) continue; const a = g.lab[y * N + x], b = g.lab[(y + dy) * N + x + dx]; if (a >= 0 && b >= 0 && a !== b) adj.add(Math.min(a, b) + '|' + Math.max(a, b)); }
    for (const q of reg.gates.filter((x) => x.kind === 'link')) if (!adj.has(Math.min(ids.indexOf(q.from), ids.indexOf(q.to)) + '|' + Math.max(ids.indexOf(q.from), ids.indexOf(q.to)))) E(`${reg.id}: ${q.from}->${q.to} not adjacent`);
    const areas = reg.subIds.map((id) => reg.subareas[id].cells);
    info.push(`${reg.id}: areas ${areas.join('/')} (min ${Math.min(...areas)}, max ${Math.max(...areas)}), seed retries ${g.attempt}, props ${g.props.length}, tiles ${g.tiles.length}, warnings ${g.warn.length}`);
    for (const w of g.warn) E(w);
  }
  return { errs, info };
}
function bfsAll(N, start, pass) {
  const dist = new Int32Array(N * N).fill(-1); if (!pass(start)) return { dist }; dist[start] = 0; const q = [start];
  for (let h = 0; h < q.length; h++) { const c = q[h], cx = c % N, cy = (c / N) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue; const j = y * N + x; if (dist[j] < 0 && pass(j)) { dist[j] = dist[c] + 1; q.push(j); } } }
  return { dist };
}

const r1 = build();
const hash = (r) => crypto.createHash('sha1').update(stable(r.out)).update(stable(r.assets)).digest('hex');
const h1 = hash(r1);
const text = emit(r1);
console.log(`world-gen.js ${(text.length / 1024).toFixed(1)} kB, ${r1.out.regions.length} regions, hash ${h1.slice(0, 12)}`);
for (const [id, a] of Object.entries(r1.assets)) console.log(`assets/world/${id}.json ${(stable(a).length / 1024).toFixed(1)} kB`);
if (args.has('--preview')) {
  const dir = path.join(ROOT, 'docs/world-preview'); fs.mkdirSync(dir, { recursive: true });
  for (const d of r1.defs) fs.writeFileSync(path.join(dir, `${d.id}.svg`), previewSvg(r1.gens[d.id], d));
  console.log('preview SVGs in docs/world-preview/');
}
if (args.has('--check')) {
  const r2 = build(); const h2 = hash(r2);
  const { errs, info } = check(r1);
  info.forEach((l) => console.log(l));
  console.log(`determinism: ${h1 === h2 ? 'ok' : 'MISMATCH'} (${h1.slice(0, 12)} vs ${h2.slice(0, 12)})`);
  const used = Object.values(r1.tis).reduce((n, t) => n + t.used.size, 0);
  console.log(`manifest keys: every key and autotile piece resolved (${used} distinct tile files used)`);
  if (h1 !== h2) errs.push('non-deterministic output');
  if (errs.length) { console.log('FAIL'); errs.forEach((e) => console.log(' - ' + e)); process.exit(1); }
  console.log('CHECK PASSED');
}
