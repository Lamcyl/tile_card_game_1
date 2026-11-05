// Weighted, anisotropic, domain-warped Voronoi labelling of the land cells, plus clean-up.
import { valueNoise } from './noise.mjs';

const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];

/**
 * land: Uint8Array(N*N); seeds: [{x,y,weight,angle,stretch}]; forced: Int16Array (-1 = free).
 * Returns Int16Array labels (index into seeds, -1 = not land).
 */
export function labelCells(N, land, seeds, forced, warpSeed, warpAmp) {
  const nx1 = valueNoise(warpSeed + 11), nx2 = valueNoise(warpSeed + 12);
  const ny1 = valueNoise(warpSeed + 21), ny2 = valueNoise(warpSeed + 22);
  const pre = seeds.map((s) => {
    const a = ((s.angle || 0) * Math.PI) / 180;
    return { s, c: Math.cos(a), sn: Math.sin(a), st: s.stretch || 1, w: s.weight || 1 };
  });
  const lab = new Int16Array(N * N).fill(-1);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    if (!land[i]) continue;
    if (forced[i] >= 0) { lab[i] = forced[i]; continue; }
    // two octaves of warp, amplitude about warpAmp tiles
    const wx = x + warpAmp * ((nx1(x / 13, y / 13) - 0.5) * 1.3 + (nx2(x / 6, y / 6) - 0.5) * 0.7);
    const wy = y + warpAmp * ((ny1(x / 13, y / 13) - 0.5) * 1.3 + (ny2(x / 6, y / 6) - 0.5) * 0.7);
    let best = 1e9, bi = -1;
    for (let k = 0; k < pre.length; k++) {
      const p = pre[k];
      const dx = wx - p.s.x, dy = wy - p.s.y;
      const u = dx * p.c + dy * p.sn, v = -dx * p.sn + dy * p.c;
      const d = Math.sqrt((u / p.st) * (u / p.st) + (v * p.st) * (v * p.st)) / p.w;
      if (d < best) { best = d; bi = k; }
    }
    lab[i] = bi;
  }
  return lab;
}

/** Keep the largest 4-connected component per label, reassign orphans, smooth twice. */
export function cleanLabels(N, lab, forced, count) {
  fixOrphans(N, lab, forced, count);
  smooth(N, lab, forced);
  fixOrphans(N, lab, forced, count);
  return lab;
}
function fixOrphans(N, lab, forced, count) {
  for (let pass = 0; pass < 8; pass++) {
    const comp = new Int32Array(N * N).fill(-1);
    const sizes = [];
    const owner = [];
    for (let i = 0; i < N * N; i++) {
      if (lab[i] < 0 || comp[i] >= 0) continue;
      const id = sizes.length; let n = 0; const st = [i]; comp[i] = id;
      while (st.length) {
        const c = st.pop(); n++;
        const cx = c % N, cy = (c / N) | 0;
        for (const [dx, dy] of N4) {
          const x = cx + dx, y = cy + dy;
          if (x < 0 || y < 0 || x >= N || y >= N) continue;
          const j = y * N + x;
          if (comp[j] < 0 && lab[j] === lab[i]) { comp[j] = id; st.push(j); }
        }
      }
      sizes.push(n); owner.push(lab[i]);
    }
    const best = new Array(count).fill(-1);
    sizes.forEach((n, id) => { const l = owner[id]; if (best[l] < 0 || n > sizes[best[l]]) best[l] = id; });
    let orphans = 0;
    const next = Int16Array.from(lab);
    for (let i = 0; i < N * N; i++) {
      if (lab[i] < 0 || forced[i] >= 0) continue;
      if (best[lab[i]] === comp[i]) continue;
      // longest shared edge among 8 neighbours belonging to a kept component
      const cnt = {}; const cx = i % N, cy = (i / N) | 0;
      for (const [dx, dy] of N8) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= N || y >= N) continue;
        const j = y * N + x; const l = lab[j];
        if (l >= 0 && l !== lab[i] && best[l] === comp[j]) cnt[l] = (cnt[l] || 0) + 1;
      }
      let bl = -1, bc = 0;
      for (const k of Object.keys(cnt)) if (cnt[k] > bc) { bc = cnt[k]; bl = +k; }
      if (bl >= 0) { next[i] = bl; orphans++; }
    }
    lab.set(next);
    if (!orphans) break;
  }
}
function smooth(N, lab, forced) {
  for (let pass = 0; pass < 2; pass++) {
    const next = Int16Array.from(lab);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x;
      if (lab[i] < 0 || forced[i] >= 0) continue;
      const cnt = {};
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue;
        const l = lab[yy * N + xx]; if (l >= 0) cnt[l] = (cnt[l] || 0) + 1;
      }
      let bl = lab[i], bc = cnt[lab[i]] || 0;
      for (const k of Object.keys(cnt)) if (cnt[k] > bc) { bc = cnt[k]; bl = +k; }
      next[i] = bl;
    }
    lab.set(next);
  }
}

/** Set of "a|b" (a<b) label pairs that touch along an edge, with shared edge length. */
export function adjacency(N, lab) {
  const m = new Map();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const a = lab[y * N + x]; if (a < 0) continue;
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const xx = x + dx, yy = y + dy; if (xx >= N || yy >= N) continue;
      const b = lab[yy * N + xx]; if (b < 0 || b === a) continue;
      const k = Math.min(a, b) + '|' + Math.max(a, b);
      m.set(k, (m.get(k) || 0) + 1);
    }
  }
  return m;
}
export { N4, N8 };
