// Grid helpers for node placement: BFS, clearance, best-candidate (Poisson-like) sampling.
import { N4, N8 } from './voronoi.mjs';

/** 4-neighbour BFS. passable(i) -> bool. Returns {dist, parent}. */
export function bfs(N, starts, passable) {
  const dist = new Int32Array(N * N).fill(-1), parent = new Int32Array(N * N).fill(-1);
  const q = [];
  for (const s of starts) if (s >= 0 && passable(s) && dist[s] < 0) { dist[s] = 0; q.push(s); }
  for (let h = 0; h < q.length; h++) {
    const c = q[h]; const cx = c % N, cy = (c / N) | 0;
    for (const [dx, dy] of N4) {
      const x = cx + dx, y = cy + dy;
      if (x < 0 || y < 0 || x >= N || y >= N) continue;
      const j = y * N + x;
      if (dist[j] < 0 && passable(j)) { dist[j] = dist[c] + 1; parent[j] = c; q.push(j); }
    }
  }
  return { dist, parent };
}

/** Chebyshev-ish (8-neighbour BFS) distance to the nearest cell where isWall(i) is true. */
export function clearance(N, isWall) {
  const dist = new Int32Array(N * N).fill(-1); const q = [];
  for (let i = 0; i < N * N; i++) if (isWall(i)) { dist[i] = 0; q.push(i); }
  for (let h = 0; h < q.length; h++) {
    const c = q[h]; const cx = c % N, cy = (c / N) | 0;
    for (const [dx, dy] of N8) {
      const x = cx + dx, y = cy + dy;
      if (x < 0 || y < 0 || x >= N || y >= N) continue;
      const j = y * N + x;
      if (dist[j] < 0) { dist[j] = dist[c] + 1; q.push(j); }
    }
  }
  return dist;
}

export const d2 = (N, a, b) => Math.hypot((a % N) - (b % N), ((a / N) | 0) - ((b / N) | 0));

/**
 * Mitchell best-candidate: sample `tries` cells from cands (indices), keep those at least minD from all
 * `existing`, return the one with the largest nearest-distance (spread), or -1.
 */
export function bestCandidate(N, cands, existing, minD, rand, tries = 48) {
  let best = -1, bd = -1;
  for (let t = 0; t < tries && cands.length; t++) {
    const c = cands[Math.floor(rand() * cands.length)];
    let nd = 1e9;
    for (const e of existing) { const d = d2(N, c, e); if (d < nd) nd = d; }
    if (nd < minD) continue;
    if (nd > bd) { bd = nd; best = c; }
  }
  return best;
}
