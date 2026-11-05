// Generates one region: land mask, organic sub-areas, borders, gates, tile layers, props, nodes.
import { hashStr, rng, hash2, valueNoise, fbm2 } from './noise.mjs';
import { labelCells, cleanLabels, adjacency, N4, N8 } from './voronoi.mjs';
import { blobMask, connectMask } from './autotile.mjs';
import { bfs, clearance, d2, bestCandidate } from './nodes.mjs';

const TILE = 64;
const CONTENT_KEYS = ['name', 'biome', 'lm', 'lv', 'bossLv', 'guarded', 'theme', 'final', 'bossDef', 'lmLabel', 'overlays', 'shop'];

export function generateRegion(def, ti, box) {
  const N = def.size, S = N - 1, isCamp = def.kind === 'camp';
  const sub = def.subareas;
  const idOf = Object.fromEntries(sub.map((d, i) => [d.id, i]));
  const rand = rng(hashStr('region:' + def.id));
  const warn = [];
  const fail = (m) => { throw new Error(`[${def.id}] ${m}`); };

  // ---- orientation: rotates the layout only (seeds, entry, exit, hand-placed anchors)
  const rot = def.orient || 0, mir = !!def.mirror;
  const T = ([x, y]) => {
    if (mir) x = S - x;
    for (let r = 0; r < rot / 90; r++) { const nx = S - y, ny = x; x = nx; y = ny; }
    return [Math.round(x), Math.round(y)];
  };
  const I = (x, y) => y * N + x;
  const inb = (x, y) => x >= 0 && y >= 0 && x < N && y < N;

  // ---- land mask (superellipse + rim noise), corridors for entry / exit / camp stubs
  const land = new Uint8Array(N * N), forced = new Int16Array(N * N).fill(-1);
  const rimNoise = fbm2(hashStr(def.id + ':rim'), 8);
  const lim = def.landLimit || 0.86;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (isCamp) { land[I(x, y)] = x >= 3 && y >= 3 && x <= S - 3 && y <= S - 3 ? 1 : 0; continue; }
    const u = (x - S / 2) / (N / 2), v = (y - S / 2) / (N / 2);
    const r = Math.pow(Math.pow(Math.abs(u), 4) + Math.pow(Math.abs(v), 4), 0.25);
    if (r + (rimNoise(x, y) - 0.5) * 0.5 < lim) land[I(x, y)] = 1;
  }
  const seeds0 = sub.map((d) => { const [x, y] = T(d.seed); return { x, y, weight: d.weight, angle: d.angle || 0, stretch: d.stretch || 1 }; });
  if (!isCamp) for (const s of seeds0) for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++)
    if (x * x + y * y <= 26 && inb(s.x + x, s.y + y)) land[I(s.x + x, s.y + y)] = 1;

  const carve = (p, lab, edge) => { // 3-wide corridor from p to the box edge; returns cells ordered from p outward
    const [px, py] = p; const dl = [px, S - px, py, S - py]; const e = edge || ['W', 'E', 'N', 'S'][dl.indexOf(Math.min(...dl))];
    const dir = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] }[e]; const per = [dir[1], dir[0]];
    const cells = [];
    for (let k = -4; k < N; k++) for (let w = -1; w <= 1; w++) {
      const x = px + dir[0] * k + per[0] * w, y = py + dir[1] * k + per[1] * w;
      if (!inb(x, y)) continue;
      land[I(x, y)] = 1; if (lab >= 0) forced[I(x, y)] = lab;
      if (k >= 0) cells.push([x, y, k, w]);
    }
    return { edge: e, dir, cells };
  };
  let entryPt, exitPt, entryCor, exitCor, stubs = [];
  if (!isCamp) {
    entryPt = T(def.entry); exitPt = T(def.exit.at);
    const startIdx = idOf[def.startSub], endIdx = sub.findIndex((d) => d.final);
    if (startIdx < 0 || endIdx < 0) fail('startSub / final sub missing');
    entryCor = carve(entryPt, startIdx, null); exitCor = carve(exitPt, endIdx, null);
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (inb(entryPt[0] + x, entryPt[1] + y)) forced[I(entryPt[0] + x, entryPt[1] + y)] = startIdx;
    const landLine = (p, q) => { const n = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1])); for (let k = 0; k <= n; k++) { const cx = Math.round(p[0] + ((q[0] - p[0]) * k) / n), cy = Math.round(p[1] + ((q[1] - p[1]) * k) / n); for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (x * x + y * y <= 5 && inb(cx + x, cy + y)) land[I(cx + x, cy + y)] = 1; } };
    landLine(entryPt, [seeds0[startIdx].x, seeds0[startIdx].y]); landLine(exitPt, [seeds0[endIdx].x, seeds0[endIdx].y]);
  } else {
    const DIRS = { N: [0, -1], NE: [1, -1], E: [1, 0], SE: [1, 1], S: [0, 1], SW: [-1, 1], W: [-1, 0], NW: [-1, -1] };
    for (const [name, [dx, dy]] of Object.entries(DIRS)) {
      const px = dx === 0 ? Math.floor(S / 2) : dx < 0 ? 5 : S - 5, py = dy === 0 ? Math.floor(S / 2) : dy < 0 ? 5 : S - 5;
      const edge = dy < 0 ? 'N' : dy > 0 ? 'S' : dx < 0 ? 'W' : 'E';
      stubs.push({ dir: name, p: [px, py], cor: carve([px, py], 0, edge) });
    }
  }

  if (!isCamp) { // drop detached land islands: keep the component that holds the entry
    const keep = bfs(N, [I(entryPt[0], entryPt[1])], (i) => land[i] === 1).dist;
    for (let i = 0; i < N * N; i++) if (land[i] && keep[i] < 0) land[i] = 0;
  }
  // ---- weighted, warped voronoi with the adjacency rule (retry with seed nudges, deterministic)
  const links = []; // required [fromIdx,toIdx,def]
  sub.forEach((d, i) => (d.unlocks || []).forEach((u) => { if (idOf[u.to] === undefined) fail(`unknown link target ${u.to}`); links.push([i, idOf[u.to], u]); }));
  let seeds = seeds0.map((s) => ({ ...s })), lab, attempt = 0;
  for (; attempt <= 20; attempt++) {
    lab = labelCells(N, land, seeds, forced, hashStr(def.id + ':warp'), def.warp ?? 13);
    cleanLabels(N, lab, forced, sub.length);
    const adj = adjacency(N, lab);
    const missing = links.filter(([a, b]) => (adj.get(Math.min(a, b) + '|' + Math.max(a, b)) || 0) < 16);
    // every label must still exist
    const present = new Set(lab); const gone = sub.map((_, i) => i).filter((i) => !present.has(i));
    if (process.env.WORLD_DEBUG) console.error('  try', attempt, 'missing', missing.map(([a, b]) => sub[a].id + '>' + sub[b].id).join(','), 'gone', gone.join(','));
    if (!missing.length && !gone.length) break;
    if (attempt === 20) fail(`adjacency failed after 20 tries: ${missing.map(([a, b]) => sub[a].id + '->' + sub[b].id)} gone=${gone}`);
    for (const [a, b] of missing) {
      const A = seeds[a], B = seeds[b], dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
      A.x += (dx / L) * 2; A.y += (dy / L) * 2; B.x -= (dx / L) * 2; B.y -= (dy / L) * 2;
      A.weight *= 1.04; B.weight *= 1.04;
    }
    for (const g of gone) seeds[g].weight *= 1.15;
  }
  const area = new Array(sub.length).fill(0);
  for (let i = 0; i < N * N; i++) if (lab[i] >= 0) area[lab[i]]++;

  if (def._labelOnly) return { area, attempt, seeds };
  if (process.env.WORLD_DEBUG) console.error(def.id, 'attempt', attempt, 'areas', sub.map((d, i) => d.id + ':' + area[i]).join(' '), 'land', land.reduce((a, b) => a + b, 0));
  // ---- borders: 3-wide band along every label boundary, style by pair
  const border = new Uint8Array(N * N), bpair = new Array(N * N).fill(null);
  if (!isCamp) {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = I(x, y), L = lab[i]; if (L < 0) continue;
      const cnt = {};
      for (const [dx, dy] of N8) { if (!inb(x + dx, y + dy)) continue; const M = lab[I(x + dx, y + dy)]; if (M >= 0 && M !== L) cnt[M] = (cnt[M] || 0) + 1; }
      const ks = Object.keys(cnt); if (!ks.length) continue;
      const M = +ks.sort((a, b) => cnt[b] - cnt[a] || a - b)[0];
      border[i] = 1; bpair[i] = Math.min(L, M) + '|' + Math.max(L, M);
    }
    const add = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = I(x, y); if (lab[i] < 0 || border[i]) continue;
      for (const [dx, dy] of N4) {
        if (!inb(x + dx, y + dy)) continue; const j = I(x + dx, y + dy);
        if (border[j] && lab[j] === lab[i] && bpair[j] && +bpair[j].split('|')[0] === lab[i]) { add.push([i, bpair[j]]); break; }
      }
    }
    for (const [i, p] of add) { border[i] = 1; bpair[i] = p; }
  }
  const styleOfPair = (pair) => {
    const [a, b] = pair.split('|').map(Number); const ia = sub[a].id, ib = sub[b].id;
    return (def.borders || {})[ia + '|' + ib] || (def.borders || {})[ib + '|' + ia] || def.border || 'cliff';
  };

  // main interior component per label (non-border cells): gates must connect main bodies, not pockets
  const mainComp = new Uint8Array(N * N);
  { const seen = new Uint8Array(N * N); const best = new Map();
    for (let i = 0; i < N * N; i++) { if (seen[i] || lab[i] < 0 || border[i]) continue; const comp = [i]; seen[i] = 1;
      for (let h = 0; h < comp.length; h++) { const c = comp[h]; for (const [dx, dy] of N4) { const x = (c % N) + dx, y = ((c / N) | 0) + dy; if (!inb(x, y)) continue; const j = I(x, y); if (!seen[j] && !border[j] && lab[j] === lab[i]) { seen[j] = 1; comp.push(j); } } }
      if (!best.has(lab[i]) || comp.length > best.get(lab[i]).length) best.set(lab[i], comp); }
    for (const comp of best.values()) for (const c of comp) mainComp[c] = 1; }
  const blocked0 = (i) => !land[i] || !mainComp[i]; // set-blocked cells are not known yet; sets avoid gate cells below
  // ---- gates in borders (cut a 3-wide gap, stamp the gate prop)
  const gap = new Uint8Array(N * N), gateFoot = new Uint8Array(N * N);
  const gates = [], props = [];
  const worldOf = (x, y) => [box[0] + x, box[1] + y];
  const footOf = (k, x, y) => { const [w] = ti.cells(k); const f = []; for (let i = 0; i < w; i++) f.push([x + i, y]); return f; };
  const vpick = (k, x, y) => { const vs = ti.variants(k).filter((v) => /^[a-h]$|^\d+$/.test(v)); const L = vs.length ? vs : ti.variants(k); return L[Math.floor(hash2(hashStr(k), x, y) * L.length)]; };
  const addProp = (k, x, y, extra = {}) => {
    const [w, h] = ti.cells(k); const states = ti.variants(k).filter((v) => !/^[a-h]$|^\d+$/.test(v));
    props.push({ k, x, y, w, h, foot: footOf(k, x, y), v: extra.states ? ti.variants(k) : vpick(k, x, y), ...extra, states: undefined });
    return props[props.length - 1];
  };
  for (const [a, b, u] of links) {
    const pair = Math.min(a, b) + '|' + Math.max(a, b);
    const P = []; for (let i = 0; i < N * N; i++) if (bpair[i] === pair) P.push(i);
    if (!P.length) fail(`no border cells for ${sub[a].id}->${sub[b].id}`);
    const A = seeds[a], B = seeds[b]; let dx = B.x - A.x, dy = B.y - A.y; const L = Math.hypot(dx, dy); dx /= L; dy /= L;
    // local boundary normal (A -> B) from the labels in a 9x9 window
    const normal = (i) => {
      const cx = i % N, cy = (i / N) | 0; let nx = 0, ny = 0;
      for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) { if (!inb(cx + x, cy + y)) continue; const l = lab[I(cx + x, cy + y)]; if (l === b) { nx += x; ny += y; } else if (l === a) { nx -= x; ny -= y; } }
      const m = Math.hypot(nx, ny); return m < 1 ? null : [nx / m, ny / m];
    };
    const okEnd = (x, y, l) => inb(x, y) && lab[I(x, y)] === l && land[I(x, y)] && !border[I(x, y)] && !blocked0(I(x, y));
    let c = -1;
    if (u.at) { const [x, y] = T(u.at); c = I(x, y); [dx, dy] = normal(c) || [dx, dy]; } else {
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      const ranked = P.map((i) => [Math.hypot((i % N) - mx, ((i / N) | 0) - my), i]).sort((p, q) => p[0] - q[0] || p[1] - q[1]);
      for (const [reach, ws] of [[5, [-1, 0, 1]], [4, [-1, 0, 1]], [3, [0]]]) {
        for (const [, i] of ranked) {
          const n = normal(i); if (!n) continue; const x = i % N, y = (i / N) | 0; let good = true;
          for (const w of ws) { const ox = x + -n[1] * w, oy = y + n[0] * w;
            if (!okEnd(Math.round(ox + n[0] * reach), Math.round(oy + n[1] * reach), b) || !okEnd(Math.round(ox - n[0] * reach), Math.round(oy - n[1] * reach), a)) { good = false; break; } }
          if (good) { c = i; [dx, dy] = n; break; }
        }
        if (c >= 0) break;
      }
      if (c < 0) { warn.push(`no clean gate position ${sub[a].id}->${sub[b].id}`); c = ranked[0][1]; [dx, dy] = normal(c) || [dx, dy]; }
    }
    const cx = c % N, cy = (c / N) | 0, cells = [];
    for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 4; x <= cx + 4; x++) {
      if (!inb(x, y) || !border[I(x, y)]) continue;
      const al = (x - cx) * dx + (y - cy) * dy, pe = (x - cx) * -dy + (y - cy) * dx;
      if (Math.abs(al) <= 5 && Math.abs(pe) <= 1.6) { gap[I(x, y)] = 1; cells.push(I(x, y)); }
    }
    const face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : (dy > 0 ? 'S' : 'N');
    const px = cx - 1, py = cy;
    ti.need(u.gate, 'gate prop'); const prop = addProp(u.gate, px, py, { states: true, gate: true });
    for (const [fx, fy] of prop.foot) gateFoot[I(fx, fy)] = 1;
    gates.push({ from: sub[a].id, to: sub[b].id, kind: 'link', c: [cx, cy], cells, face, prop, dir: [dx, dy] });
  }
  // region exit gate in the rim (cells near the box edge) and the stub gates of the camp
  const rimGate = (cor, key, rec) => {
    const gcells = cor.cells.filter(([, , k]) => k >= cor.cells.reduce((m, c) => Math.max(m, c[2]), 0) - 2 && k <= cor.cells.reduce((m, c) => Math.max(m, c[2]), 0) - 1).map(([x, y]) => I(x, y));
    for (const g of gcells) gap[g] = 1;
    const mid = cor.cells.filter(([, , k, w]) => w === 0 && k === cor.cells.reduce((m, c) => Math.max(m, c[2]), 0) - 2)[0];
    ti.need(key, 'gate prop');
    const prop = addProp(key, mid[0] - (cor.dir[0] === 0 ? 1 : 0), mid[1] + (cor.dir[0] === 0 ? 0 : -0), { states: true, gate: true });
    for (const [fx, fy] of prop.foot) gateFoot[I(fx, fy)] = 1;
    gates.push({ ...rec, kind: 'exit', c: [mid[0], mid[1]], cells: gcells, face: cor.edge, prop });
  };
  if (!isCamp) rimGate(exitCor, def.exit.gate, { from: sub.find((d) => d.final).id, to: null, region: def.exit.to || null });
  else for (const s of stubs) rimGate(s.cor, def.stubGate, { from: 'camp', to: null, dir: s.dir });

  const nearGate = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) if (gap[i]) for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = (i % N) + dx, y = ((i / N) | 0) + dy; if (inb(x, y)) nearGate[I(x, y)] = 1; }
  // ---- tile sets (boolean grids -> canonical masks), blocked grid
  const blocked = new Uint8Array(N * N), reserved = new Uint8Array(N * N);
  const sets = new Map(); // key -> {type, grid, blocks}
  const getSet = (k, type, blocks) => { if (!sets.has(k)) { ti.needSet(k, type); sets.set(k, { k, type, grid: new Uint8Array(N * N), blocks: !!blocks }); } const s = sets.get(k); s.blocks = s.blocks || !!blocks; return s; };
  const styleSet = (name) => { const st = def.styles[name]; if (!st) fail(`unknown style ${name}`); return st; };
  const addStyleCells = (name, cells) => {
    const st = styleSet(name); const key = st.set || st.connect; const s = getSet(key, st.connect ? 'connect' : 'blob', true);
    for (const i of cells) s.grid[i] = 1;
    if (st.deep) { const d = getSet(st.deep, 'blob', true); d.deepOf = key; }
  };
  const rimCells = []; for (let i = 0; i < N * N; i++) if (!land[i]) rimCells.push(i);
  addStyleCells(def.rim || 'forest', rimCells);
  const bByStyle = {};
  for (let i = 0; i < N * N; i++) if (border[i] && !gap[i]) (bByStyle[styleOfPair(bpair[i])] ||= []).push(i);
  for (const [st, cells] of Object.entries(bByStyle)) addStyleCells(st, cells);
  for (let i = 0; i < N * N; i++) if (!land[i] || (border[i] && !gap[i])) blocked[i] = 1;

  const cl0 = clearance(N, (i) => border[i] || !land[i]); // blocking sets keep a 3-tile walkway to the borders
  const eligibleSub = (i, si) => lab[i] === si && land[i] && !border[i] && !gap[i];
  sub.forEach((d, si) => {
    (d.sets || []).forEach((sd, k) => {
      const s = getSet(sd.k, sd.connect ? 'connect' : 'blob', sd.blocks);
      const nz = fbm2(hashStr(`${def.id}:${d.id}:set${k}`), sd.scale || 9);
      const [bx, by] = sd.at ? T(sd.at) : [0, 0];
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const i = I(x, y); if (!eligibleSub(i, si) || gateFoot[i] || (sd.blocks && (nearGate[i] || cl0[i] < 3))) continue;
        let on;
        if (sd.blob) { const q = ((x - bx) / sd.blob[0]) ** 2 + ((y - by) / sd.blob[1]) ** 2; on = q + (nz(x, y) - 0.5) * (sd.wobble ?? 0.55) < 1; }
        else on = nz(x, y) > (sd.thr ?? 0.62);
        if (on) { s.grid[i] = 1; if (sd.blocks) blocked[i] = 1; }
      }
      if (sd.deep) { const dsd = getSet(sd.deep, 'blob', true); dsd.deepOf = sd.k; }
    });
  });
  // deep grids: all 8 neighbours in the base set
  for (const s of sets.values()) if (s.deepOf) {
    const base = sets.get(s.deepOf).grid;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let ok = base[I(x, y)] === 1;
      for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if (inb(x + dx, y + dy) && !base[I(x + dx, y + dy)]) { ok = false; break; }
      if (ok) s.grid[I(x, y)] = 1;
    }
  }

  // ---- stamps (landmark and hand-placed props)
  const landmarks = {}; const usedStamp = [];
  sub.forEach((d, si) => (d.stamps || []).forEach((st) => {
    const [w] = ti.cells(st.k); ti.need(st.k, 'stamp'); const [hx, hy] = st.at ? T(st.at) : T(d.seed);
    let pos = null;
    const ok = (x, y) => { for (let i = 0; i < w; i++) { if (!inb(x + i, y)) return false; const j = I(x + i, y); if (!eligibleSub(j, si) || blocked[j] || reserved[j] || gateFoot[j]) return false; } return true; };
    if (st.force) pos = [hx, hy]; else for (let r = 0; r < 14 && !pos; r++) for (let dy = -r; dy <= r && !pos; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; if (ok(hx + dx, hy + dy)) { pos = [hx + dx, hy + dy]; break; }
    }
    if (!pos) { warn.push(`stamp ${st.k} in ${d.id} not placed`); return; }
    const p = addProp(st.k, pos[0], pos[1], { landmark: !!st.landmark });
    const [pw, ph] = ti.cells(st.k);
    for (const [fx, fy] of p.foot) if (ti.obstacle(st.k)) blocked[I(fx, fy)] = 1;
    for (let y = pos[1] - ph - 1; y <= pos[1] + 1; y++) for (let x = pos[0] - 1; x <= pos[0] + pw; x++) if (inb(x, y)) reserved[I(x, y)] = 1;
    if (st.landmark) { const [wx, wy] = worldOf(pos[0] + pw / 2, pos[1] + 1 - ph / 2); landmarks[d.id] = { x: Math.round(wx * TILE), y: Math.round(wy * TILE), rx: pw * 32 + 64, ry: ph * 32 + 64 }; }
  }));

  // ---- nodes
  const isWall = (i) => blocked[i] || border[i] || !land[i];
  const clear = clearance(N, isWall);
  const subOut = {}; const allNodes = []; const laneMask = new Uint8Array(N * N);
  const nodeInfo = {};
  if (!isCamp) sub.forEach((d, si) => {
    const r = rng(hashStr(`${def.id}:${d.id}`));
    let entryC;
    if (si === idOf[def.startSub]) entryC = I(entryPt[0], entryPt[1]);
    else {
      const g = gates.find((q) => q.kind === 'link' && q.to === d.id); if (!g) fail(`sub-area ${d.id} has no incoming gate`);
      entryC = I(Math.round(g.c[0] + g.dir[0] * 4), Math.round(g.c[1] + g.dir[1] * 4));
    }
    const pass = (i) => !blocked[i] && (lab[i] === si || gap[i]) && land[i];
    // snap entry to a passable cell
    if (!pass(entryC) || lab[entryC] !== si || border[entryC] || !mainComp[entryC]) { let best = -1, bd = 1e9; for (let i = 0; i < N * N; i++) if (lab[i] === si && mainComp[i] && pass(i) && !border[i] && !gap[i] && d2(N, i, entryC) < bd) { bd = d2(N, i, entryC); best = i; } entryC = best; }
    const { dist, parent } = bfs(N, [entryC], pass);
    const ok = (i, cl) => dist[i] >= 0 && lab[i] === si && !border[i] && !blocked[i] && !reserved[i] && !gateFoot[i] && clear[i] >= cl;
    const cells = []; for (let i = 0; i < N * N; i++) if (lab[i] === si) cells.push(i);
    const nCells = cells.length;
    const nElite = nCells > 800 ? 2 : 1, nSpot = nCells > 800 ? 4 : nCells >= 500 ? 5 : 4;
    const existing = [];
    // boss beside the outgoing gate (or the exit gate); dead-end subs: farthest cell
    const outG = gates.find((q) => q.from === d.id);
    let boss = -1;
    if (outG) {
      const gc = I(outG.c[0], outG.c[1]); let bs = 1e9;
      for (const i of cells) {
        if (!pass(i) || dist[i] < 0 || gap[i] || border[i] || gateFoot[i] || reserved[i] || clear[i] < 1) continue;
        const dd = d2(N, i, gc); if (dd < 2.4 || dd > 4.4) continue;
        const off = Math.abs(dd - 3.2) + (clear[i] < 2 ? 0.8 : 0); if (off < bs) { bs = off; boss = i; }
      }
    }
    if (boss < 0) { let md = -1; for (const i of cells) if (ok(i, 2) && dist[i] > md) { md = dist[i]; boss = i; } }
    if (boss < 0) fail(`no boss cell in ${d.id} (reach ${dist.reduce((a, v) => a + (v >= 0), 0)}, entry ${entryC % N},${(entryC / N) | 0}, cells ${cells.length})`);
    existing.push(boss);
    const need = nSpot + nElite; let picks = [];
    const candAll = cells.filter((i) => ok(i, 3) && d2(N, i, entryC) >= 3.5);
    for (let restart = 0; restart < 60 && picks.length < need; restart++) {
      const cur = [];
      while (cur.length < need) { const c = bestCandidate(N, candAll, existing.concat(cur), 4.6, r, restart < 20 ? 60 : 200); if (c < 0) break; cur.push(c); }
      if (cur.length > picks.length) picks = cur;
    }
    if (picks.length < need) warn.push(`only ${picks.length}/${need} enemy cells in ${d.id} (area ${nCells})`);
    picks.sort((a, b) => dist[a] - dist[b]);
    const spots = picks.slice(0, nSpot), elites = picks.slice(nSpot);
    const nodes = existing.concat(picks);
    const place = (pred, score, minD = 3.2) => {
      for (const [md, relax] of [[minD, false], [3.05, false], [3.05, true]]) {
        let best = -1, bs = -1e9;
        for (const i of cells) { if (!(relax ? (dist[i] >= 0 && lab[i] === si && !border[i] && !blocked[i] && !reserved[i] && !gateFoot[i] && clear[i] >= 1) : pred(i))) continue; if (nodes.some((n) => d2(N, n, i) < md)) continue; const sc = score(i); if (sc > bs) { bs = sc; best = i; } }
        if (best >= 0) { nodes.push(best); return best; }
      }
      return -1;
    };
    const spotLike = nodes.slice();
    const wp = place((i) => ok(i, 2) && dist[i] >= 4 && dist[i] <= 11, (i) => -Math.abs(dist[i] - 6) + r() * 0.1);
    const spread = (i) => Math.min(...nodes.map((n) => d2(N, n, i))) + r() * 0.5;
    const poi = d.poi ? place((i) => ok(i, 2), spread) : -1;
    const shop = d.shop ? place((i) => ok(i, 2), spread) : -1;
    const event = place((i) => ok(i, 2), spread);
    // lane = BFS tree paths from the entry to every node and gate, dilated by 1
    const lane = new Uint8Array(N * N);
    const mark = (t) => { let c = t; while (c >= 0) { lane[c] = 1; c = parent[c]; } };
    for (const n of nodes) mark(n); for (const g of gates.filter((q) => q.from === d.id)) mark(I(g.c[0], g.c[1]));
    const laneD = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) if (lane[i]) for (const [dx, dy] of [[0, 0], ...N8]) { const x = (i % N) + dx, y = ((i / N) | 0) + dy; if (inb(x, y)) laneD[I(x, y)] = 1; }
    for (let i = 0; i < N * N; i++) if (laneD[i]) laneMask[i] = 1;
    // secret: the dead end farthest from the lane
    const lb = bfs(N, cells.filter((i) => lane[i]), (i) => dist[i] >= 0), ld = lb.dist;
    const secret = place((i) => ok(i, 2) && !laneD[i] && ld[i] >= 0, (i) => ld[i] + clear[i] * 0.3);
    // the way to the secret stays free of props too (dense scatter must not seal it in)
    for (let c = secret; c >= 0; c = lb.parent[c]) for (const [dx, dy] of [[0, 0], ...N8]) { const x = (c % N) + dx, y = ((c / N) | 0) + dy; if (inb(x, y)) laneMask[I(x, y)] = 1; }
    const wpos = (i) => i < 0 ? null : (([x, y]) => [Math.round((x + 0.5) * TILE), Math.round((y + 0.5) * TILE)])(worldOf(i % N, (i / N) | 0));
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (const i of cells) { x0 = Math.min(x0, i % N); x1 = Math.max(x1, i % N); y0 = Math.min(y0, (i / N) | 0); y1 = Math.max(y1, (i / N) | 0); }
    const [bx0, by0] = worldOf(x0, y0), [bx1, by1] = worldOf(x1 + 1, y1 + 1);
    const content = {}; for (const k of CONTENT_KEYS) if (d[k] !== undefined) content[k] = d[k];
    content.shop = !!d.shop; content.poiKind = d.poi || null;
    const incoming = links.find(([, b]) => b === si);
    subOut[d.id] = {
      id: d.id, ...content, region: def.id, cells: nCells, enemies: 1 + nSpot + nElite,
      bounds: [bx0 * TILE, by0 * TILE, bx1 * TILE, by1 * TILE],
      entry: wpos(entryC), boss: wpos(boss), elites: elites.map(wpos), spots: spots.map(wpos),
      poi: wpos(poi), shopAt: wpos(shop), event: wpos(event), wp: wpos(wp), secret: wpos(secret),
      landmark: landmarks[d.id] || null,
      from: incoming ? sub[incoming[0]].id : null, unlocks: (d.unlocks || []).map((u) => u.to),
    };
    subOut[d.id].shop = subOut[d.id].shopAt; delete subOut[d.id].shopAt; subOut[d.id].shopFlag = !!d.shop;
    nodeInfo[d.id] = { boss, spots, elites, wp, poi, shop, event, secret, entry: entryC, dist };
    allNodes.push({ sub: d.id, boss, spots, elites, wp, poi, shop, event, secret });
  });
  if (isCamp) {
    const ctr = I(Math.floor(S / 2), Math.floor(S / 2));
    subOut.camp = { id: 'camp', name: def.subareas[0].name, region: def.id, cells: area[0], bounds: [box[0] * TILE, box[1] * TILE, (box[0] + N) * TILE, (box[1] + N) * TILE], entry: [Math.round((box[0] + S / 2 + 0.5) * TILE), Math.round((box[1] + S / 2 + 0.5) * TILE)], enemies: 0, from: null, unlocks: [], boss: null, elites: [], spots: [], landmark: null };
    reserved[ctr] = 1;
  }

  // ---- scatter props (avoid lanes, nodes, footprints); obstacles join the blocked grid
  const occ = new Uint8Array(N * N);
  const nodeCells = new Set(); for (const n of allNodes) for (const v of [n.boss, ...n.spots, ...n.elites, n.wp, n.poi, n.shop, n.event, n.secret]) if (v >= 0) nodeCells.add(v);
  const nearNode = new Uint8Array(N * N); for (const c of nodeCells) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = (c % N) + dx, y = ((c / N) | 0) + dy; if (inb(x, y)) nearNode[I(x, y)] = 1; }
  for (const p of props) for (const [x, y] of p.foot) occ[I(x, y)] = 1;
  const inSet = (i, key) => sets.get(key) && sets.get(key).grid[i];
  const anySet = new Uint8Array(N * N); for (const s of sets.values()) for (let i = 0; i < N * N; i++) if (s.grid[i] && !(s === sets.get(def.styles[def.rim || 'forest'].set))) anySet[i] = 1;
  sub.forEach((d, si) => (d.scatter || []).forEach((sc, k) => {
    const rr = rng(hashStr(`${def.id}:${d.id}:sc${k}`));
    for (const key of sc.k) ti.need(key, 'scatter');
    const cells = []; for (let i = 0; i < N * N; i++) if (lab[i] === si) cells.push(i);
    for (let n = cells.length - 1; n > 0; n--) { const m = Math.floor(rr() * (n + 1)); [cells[n], cells[m]] = [cells[m], cells[n]]; }
    for (const i of cells) {
      if (rr() >= sc.d) continue;
      const x = i % N, y = (i / N) | 0; const key = sc.k[Math.floor(rr() * sc.k.length)];
      const where = sc.where || 'ground';
      const [w, h] = ti.cells(key); const foot = footOf(key, x, y);
      let good = true;
      for (const [fx, fy] of foot) {
        if (!inb(fx, fy)) { good = false; break; } const j = I(fx, fy);
        if (lab[j] !== si || !land[j] || occ[j] || laneD(j) || nearNode[j] || reserved[j] || gateFoot[j] || gap[j]) { good = false; break; }
        if (where === 'ground' ? (border[j] || blocked[j] || anySet[j]) : where === 'border' ? !(border[j] && !blocked[j]) : (!inSet(j, where.slice(4)) || blocked[j])) { good = false; break; }
      }
      if (!good) continue;
      for (const [fx, fy] of foot) { occ[I(fx, fy)] = 1; if (ti.obstacle(key)) blocked[I(fx, fy)] = 1; }
      addProp(key, x, y);
    }
  }));
  function laneD(j) { return laneMask[j]; }

  // ---- layers: ground families by noise patches, ground-detail at a per-sub rate
  const tiles = []; const tileIdx = new Map();
  const tid = (path) => { if (!tileIdx.has(path)) { tileIdx.set(path, tiles.length + 1); tiles.push(path); } return tileIdx.get(path); };
  const ground = new Int32Array(N * N), detail = new Int32Array(N * N);
  // Soft ground (WP20 step 3): every sub-area is ONE primary family (`ground[0]`, its variants a..d are mutually seamless), so
  // meadows stay continuous watercolour. The other listed families are rare accents (`accentRate`, default 1.2%) and only when they
  // share a material tag and a base colour (within 14 RGB units, or an identical base for details) with the primary; ground-detail tiles are opaque, baked on one base family, and are used only when
  // they match the primary (no water/reflection bases, a shared material tag or name token), otherwise they would show as
  // hard-edged squares of another colour.
  const GENERIC = new Set(['seamless', 'ground', 'ground-detail', 'decal-baked', 'desert', 'loot', 'flowers', 'wildflowers', 'litter', 'pebbles', 'ripples', 'inlay', 'tracks', 'blend', 'dry']);
  const tokens = (k) => { const t = new Set(ti.tags(k)); for (const w of k.split('/')[1].split('-')) t.add(w); for (const g of GENERIC) t.delete(g); return t; };
  const near = (a, b, t = 14) => { const A = ti.baseFill(a), B = ti.baseFill(b); return !A || !B || Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) <= t; }; // same base colour -> no visible square
  const shares = (a, b) => { const A = tokens(a); for (const t of tokens(b)) if (A.has(t)) return true; return false; };
  sub.forEach((d, si) => {
    ti.needAll(d.ground, 'ground'); ti.needAll(d.detail || [], 'detail');
    const prim = d.ground[0];
    const accents = d.ground.slice(1).filter((k) => shares(prim, k) && near(prim, k)), accentRate = d.accentRate ?? 0.012;
    const details = (d.detail || []).filter((k) => !ti.tags(k).some((t) => t === 'water' || t === 'reflection') && (d.detailAny || (near(prim, k, 3) || (shares(prim, k) && near(prim, k)))));
    d.detailUsed = details; d.accentUsed = accents;
    const vsP = ti.variants(prim);
    for (let i = 0; i < N * N; i++) {
      if (lab[i] !== si) continue; const x = i % N, y = (i / N) | 0;
      let fam = prim; if (accents.length && hash2(23, x, y) < accentRate) fam = accents[Math.floor(hash2(29, x, y) * accents.length)];
      const vs = fam === prim ? vsP : ti.variants(fam); ground[i] = tid(ti.path(fam, vs[Math.floor(hash2(7, x, y) * vs.length)]));
      if (details.length && hash2(13, x, y) < (d.detailRate ?? 0.2)) {
        const dk = details[Math.floor(hash2(17, x, y) * details.length)]; const dv = ti.variants(dk); detail[i] = tid(ti.path(dk, dv[Math.floor(hash2(19, x, y) * dv.length)]));
      }
    }
  });
  // rim/non-land cells take the nearest-looking ground of the first sub (under the rim set)
  { const g0 = sub[0].ground[0]; const vs = ti.variants(g0); for (let i = 0; i < N * N; i++) if (!land[i]) ground[i] = tid(ti.path(g0, vs[Math.floor(hash2(7, i % N, (i / N) | 0) * vs.length)])); }
  const layers = {};
  for (const s of sets.values()) {
    const arr = new Int16Array(N * N); const has = (x, y) => (inb(x, y) ? s.grid[I(x, y)] === 1 : true);
    const [cat, name] = s.k.split('/'); let used = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!s.grid[I(x, y)]) continue;
      const m = s.type === 'blob' ? blobMask(has, x, y) : connectMask(has, x, y);
      ti.needMask(s.k, m, s.type); tid(ti.path(s.k, s.type === 'blob' ? String(m).padStart(3, '0') : String(m).padStart(2, '0'))); arr[I(x, y)] = m + 1; used++;
    }
    if (used) layers[s.k] = { type: s.type, grid: arr };
  }
  for (const p of props) { p.t = (p.v instanceof Array) ? p.v.map((v) => tid(ti.path(p.k, v))) : tid(ti.path(p.k, p.v)); }

  return { id: def.id, N, box, land, lab, border, bpair, blocked, gap, gates, props, tiles, ground, detail, layers, sets,
    subOut, nodeInfo, allNodes, area, seeds, attempt, warn, stubs, entryPt, exitPt, entryCor, exitCor, links, isCamp, laneMask,
    styleOfPair, I };
}
