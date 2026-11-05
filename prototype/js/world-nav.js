// Navigation over the tile world (WP20): same API shape as WorldLayout (blocked, subAt) plus findPath.
// Data comes from window.WorldGen (js/world-gen.js): per region an RLE `blocked` bitset and `subId` grid.
// World units: 1 tile = 64 units; tile (tx,ty) is world x in [tx*64, tx*64+64). Negative coordinates are fine.
(function () {
  'use strict';
  const G = window.WorldGen, T = G.tile || 64;
  const unrle = (a, N) => { const o = new Uint8Array(N); let k = 0; for (let i = 0; i < a.length; i += 2) { o.fill(a[i], k, k + a[i + 1]); k += a[i + 1]; } return o; };
  const regions = G.regions.map((r) => ({ r, id: r.id, ox: r.origin[0], oy: r.origin[1], N: r.size, blocked: unrle(r.blocked, r.size * r.size), sub: unrle(r.subId, r.size * r.size) }));
  const byId = Object.fromEntries(regions.map((q) => [q.id, q]));
  const links = new Set(); // causeway cells between regions are always walkable
  const gateCell = new Map(); // "tx,ty" -> gate
  for (const q of regions) {
    for (const g of q.r.gates) for (const [x, y] of g.cells) gateCell.set(x + ',' + y, g);
  }
  for (const q of regions) for (const l of q.r.links || []) for (const [x, y] of l.cells || []) links.add(x + ',' + y);
  for (const l of G.links || []) for (const [x, y] of l.cells || []) links.add(x + ',' + y);

  function regionAtTile(tx, ty) { for (const q of regions) if (tx >= q.ox && ty >= q.oy && tx < q.ox + q.N && ty < q.oy + q.N) return q; return null; }
  function blockedTile(tx, ty) {
    const q = regionAtTile(tx, ty);
    if (!q) return !links.has(tx + ',' + ty);
    return q.blocked[(ty - q.oy) * q.N + (tx - q.ox)] === 1 && !links.has(tx + ',' + ty);
  }
  const blocked = (x, y) => blockedTile(Math.floor(x / T), Math.floor(y / T));
  function subAtTile(tx, ty) { const q = regionAtTile(tx, ty); if (!q) return null; const v = q.sub[(ty - q.oy) * q.N + (tx - q.ox)]; return v ? q.r.subIds[v - 1] : null; }
  const subAt = (x, y) => subAtTile(Math.floor(x / T), Math.floor(y / T));
  const gateAtTile = (tx, ty) => gateCell.get(tx + ',' + ty) || null;

  // A* over tiles (8 neighbours, no corner cutting). walkable(tx,ty) defaults to !blockedTile and may add closed gates / fog.
  function findPath(sx, sy, tx, ty, walkable) {
    const ok = walkable || ((a, b) => !blockedTile(a, b));
    let s0 = [Math.floor(sx / T), Math.floor(sy / T)], g0 = [Math.floor(tx / T), Math.floor(ty / T)];
    if (!ok(g0[0], g0[1])) { let best = null, bd = 1e9; for (let r = 1; r <= 5 && !best; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !ok(g0[0] + dx, g0[1] + dy)) continue; const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = [g0[0] + dx, g0[1] + dy]; } } if (!best) return null; g0 = best; tx = (g0[0] + 0.5) * T; ty = (g0[1] + 0.5) * T; }
    const key = (a, b) => a * 100003 + b + 5e7, open = [[0, s0[0], s0[1]]], came = new Map(), gs = new Map([[key(s0[0], s0[1]), 0]]);
    const h = (a, b) => { const dx = Math.abs(a - g0[0]), dy = Math.abs(b - g0[1]); return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy); };
    let n = 0, found = false;
    while (open.length && n++ < 60000) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
      const [, cx, cy] = open[bi]; open[bi] = open[open.length - 1]; open.pop();
      if (cx === g0[0] && cy === g0[1]) { found = true; break; }
      const cg = gs.get(key(cx, cy));
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue; const nx = cx + dx, ny = cy + dy;
        if (!ok(nx, ny) || (dx && dy && (!ok(cx + dx, cy) || !ok(cx, cy + dy)))) continue;
        const ng = cg + (dx && dy ? Math.SQRT2 : 1), k = key(nx, ny);
        if (gs.has(k) && gs.get(k) <= ng) continue; gs.set(k, ng); came.set(k, [cx, cy]); open.push([ng + h(nx, ny), nx, ny]);
      }
    }
    if (!found) return null;
    const cells = [[g0[0], g0[1]]]; let c = came.get(key(g0[0], g0[1]));
    while (c) { cells.push(c); c = came.get(key(c[0], c[1])); }
    cells.reverse();
    let pts = cells.map((c2) => [(c2[0] + 0.5) * T, (c2[1] + 0.5) * T]); pts[0] = [sx, sy]; pts.push([tx, ty]);
    // line-of-sight smoothing: sample the segment at 12 unit steps (the hero is a point, props are tile-blocked)
    const los = (a, b) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.ceil(L / 12)); for (let i = 1; i <= m; i++) if (!ok(Math.floor((a[0] + (b[0] - a[0]) * i / m) / T), Math.floor((a[1] + (b[1] - a[1]) * i / m) / T))) return false; return true; };
    const out = [pts[0]]; let i = 0;
    while (i < pts.length - 1) { let j = pts.length - 1; while (j > i + 1 && !los(pts[i], pts[j])) j--; out.push(pts[j]); i = j; }
    return out.slice(1);
  }
  window.WorldNav = { T, regions, byId, regionAtTile, blockedTile, blocked, subAt, subAtTile, gateAtTile, findPath };
})();
