// World layout: the geography of the big, sparse overworld (see docs/WORLD_SPEC.md).
// Pure data + deterministic generation (no randomness at runtime, no DOM), so it also runs under node.
// Provides: map size, camp, the 20 sub-areas (shape, landmark, entry, boss, elites, spots, poi), the terrain
// features that map.js paints (rivers, bridges, cliffs, ridges, lakes, groves, roads, ruins ...) and blocked(x,y).
// Extras for the renderer / tools: isLand, groundAt (biome index into BIOMES), subAt (sub-area id under a point),
// grid() (the 20-unit rasters), findPath (A* on a 40-unit grid around blocked ground), outline / sound / extraLand.
//
// Scale: a 12000 x 9700 world; sub-areas are ~1700 units wide and their monster spots sit on a loose 3x3
// lattice about 640 units apart. At the default exploration zoom a 390x844 phone shows ~400x866 world units,
// i.e. only 1-2 monsters at a time.
(function (root) {
  'use strict';
  const MAP_W = 12000, MAP_H = 9700;
  const G = 20, GW = MAP_W / G, GH = Math.ceil(MAP_H / G);       // fine raster (walk / land / ground)
  const CAMP = { x: 6700, y: 9250 };

  // ---------- small utilities ----------
  function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 2147483646 + 1; }
  function rng(seed) { let s = typeof seed === 'number' ? seed : hash(seed); return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  const rnd = (n) => Math.round(n);
  const R2 = (p) => [rnd(p[0]), rnd(p[1])];
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  function area2(P) { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
  const orient = (P, sign) => ((area2(P) > 0) === (sign > 0) ? P : P.slice().reverse());
  function bboxOf(P) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of P) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; } return [x0, y0, x1, y1]; }
  function inPoly(x, y, P) {
    let c = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const a = P[i], b = P[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }
  // Smooth wobble along a polygon: subdivide edges and push the points sideways by smooth noise.
  function wobble(P, step, amp, seed) {
    const R = rng(seed), out = [], n = P.length;
    for (let i = 0; i < n; i++) {
      const a = P[i], b = P[(i + 1) % n], L = dist(a, b), m = Math.max(1, Math.round(L / step));
      const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      for (let k = 0; k < m; k++) {
        const t = k / m, o = k === 0 ? 0 : (R() - 0.5) * 2 * amp;
        out.push([a[0] + (b[0] - a[0]) * t + nx * o, a[1] + (b[1] - a[1]) * t + ny * o]);
      }
    }
    return out;
  }
  function blobShape(cx, cy, hx, hy, seed, rough, n) {
    const R = rng(seed), ph = [R() * 6, R() * 6, R() * 6], pts = []; n = n || 44; rough = rough === undefined ? 0.05 : rough;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      const k = 1 + rough * (Math.sin(3 * a + ph[0]) * 0.6 + Math.sin(5 * a + ph[1]) * 0.4 + Math.sin(8 * a + ph[2]) * 0.25);
      pts.push([cx + hx * Math.sign(c) * Math.pow(Math.abs(c), 0.62) * k, cy + hy * Math.sign(s) * Math.pow(Math.abs(s), 0.62) * k]);
    }
    return pts;
  }
  const ellipsePoly = (cx, cy, rx, ry, seed, rough, n) => {
    const R = rng(seed), ph = [R() * 6, R() * 6], pts = []; n = n || 28; rough = rough === undefined ? 0.12 : rough;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, k = 1 + rough * (Math.sin(3 * a + ph[0]) * 0.6 + Math.sin(5 * a + ph[1]) * 0.4); pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return pts;
  };
  function strip(a, b, w, seed) {   // a lumpy sandbar between two points
    const R = rng(seed), L = dist(a, b), dx = (b[0] - a[0]) / L, dy = (b[1] - a[1]) / L, nx = -dy, ny = dx, m = Math.max(2, Math.round(L / 90)), top = [], bot = [];
    for (let i = 0; i <= m; i++) { const t = i / m, w1 = w * (0.5 + 0.18 * Math.sin(t * 9 + (hash(seed) % 97)) + (R() - 0.5) * 0.15) , cx = a[0] + (b[0] - a[0]) * t, cy = a[1] + (b[1] - a[1]) * t; top.push([cx + nx * w1, cy + ny * w1]); bot.push([cx - nx * w1, cy - ny * w1]); }
    return top.concat(bot.reverse());
  }

  // ---------- rasters (cell G): land, ground biome, blocked, sub-area ----------
  const BIOMES = ['sea', 'meadow', 'forest', 'bamboo', 'lake', 'beach', 'coral', 'cove', 'isles', 'dunes', 'oasis', 'canyon', 'temple', 'snow', 'frozen', 'rime', 'glacier', 'ash', 'ridge', 'lavafall', 'caldera', 'high', 'mtn'];
  const BIO = Object.fromEntries(BIOMES.map((b, i) => [b, i]));
  const land = new Uint8Array(GW * GH), ground = new Uint8Array(GW * GH), blk = new Uint8Array(GW * GH), subR = new Uint8Array(GW * GH);
  function fillPoly(arr, P, v) {
    const b = bboxOf(P), gy0 = Math.max(0, Math.floor(b[1] / G)), gy1 = Math.min(GH - 1, Math.floor(b[3] / G));
    for (let gy = gy0; gy <= gy1; gy++) {
      const y = (gy + 0.5) * G, xs = [];
      for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
        const a = P[i], c = P[j];
        if ((a[1] > y) !== (c[1] > y)) xs.push(a[0] + (y - a[1]) / (c[1] - a[1]) * (c[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const g0 = Math.max(0, Math.ceil(xs[k] / G - 0.5)), g1 = Math.min(GW - 1, Math.floor(xs[k + 1] / G - 0.5));
        for (let gx = g0; gx <= g1; gx++) arr[gy * GW + gx] = v;
      }
    }
  }
  function stampEllipse(arr, cx, cy, rx, ry, v, rot) {
    const rr = Math.max(rx, ry), g0x = Math.max(0, Math.floor((cx - rr) / G)), g1x = Math.min(GW - 1, Math.floor((cx + rr) / G)), g0y = Math.max(0, Math.floor((cy - rr) / G)), g1y = Math.min(GH - 1, Math.floor((cy + rr) / G));
    const c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    for (let gy = g0y; gy <= g1y; gy++) for (let gx = g0x; gx <= g1x; gx++) {
      const dx = (gx + 0.5) * G - cx, dy = (gy + 0.5) * G - cy, u = (dx * c + dy * s) / rx, w = (-dx * s + dy * c) / ry;
      if (u * u + w * w <= 1) arr[gy * GW + gx] = v;
    }
  }
  function stampRect(arr, cx, cy, len, wid, ang, v) {
    const rr = Math.hypot(len, wid) / 2 + G, c = Math.cos(ang), s = Math.sin(ang);
    const g0x = Math.max(0, Math.floor((cx - rr) / G)), g1x = Math.min(GW - 1, Math.floor((cx + rr) / G)), g0y = Math.max(0, Math.floor((cy - rr) / G)), g1y = Math.min(GH - 1, Math.floor((cy + rr) / G));
    for (let gy = g0y; gy <= g1y; gy++) for (let gx = g0x; gx <= g1x; gx++) {
      const dx = (gx + 0.5) * G - cx, dy = (gy + 0.5) * G - cy, u = dx * c + dy * s, w = -dx * s + dy * c;
      if (Math.abs(u) <= len / 2 && Math.abs(w) <= wid / 2) arr[gy * GW + gx] = v;
    }
  }
  function stampLine(arr, pts, rf, v) {   // thick polyline; rf = radius or function(t) -> radius
    let total = 0; for (let i = 0; i + 1 < pts.length; i++) total += dist(pts[i], pts[i + 1]);
    let run = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], L = dist(a, b), m = Math.max(1, Math.ceil(L / 8));
      for (let k = 0; k <= m; k++) {
        const t = k / m, r = typeof rf === 'function' ? rf((run + L * t) / total) : rf;
        stampEllipse(arr, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, r, r, v);
      }
      run += L;
    }
  }
  const cellOf = (x, y) => { const gx = Math.floor(x / G), gy = Math.floor(y / G); return (gx < 0 || gy < 0 || gx >= GW || gy >= GH) ? -1 : gy * GW + gx; };

  // ---------- the 20 sub-areas ----------
  const REGIONS = ['Greenvale', 'Azure Coast', 'Sunscorch', 'Frostveil', 'Ember Peaks'];
  // dir = unit vector from the area's centre toward the previous area (where the hero arrives from); to = where the boss should lie toward.
  const AREAS = [
    { id: 'meadow', reg: 0, cx: 6920, cy: 8300, dir: [0, 1], to: [5120, 8400], lm: ['hill', 'Blossom Hill', 105], poi: 1 },
    { id: 'forest', reg: 0, cx: 5120, cy: 8400, dir: [1, 0], to: [5120, 6600], lm: ['oak-grove', 'The Elder Oak', 112], poi: 1 },
    { id: 'bamboo', reg: 0, cx: 5120, cy: 6600, dir: [0, 1], to: [6920, 6600], lm: ['bamboo-grove', 'Whispering Bamboo', 108], poi: 1 },
    { id: 'lake', reg: 0, cx: 6920, cy: 6600, dir: [-1, 0], to: [9040, 6600], lm: ['lake', 'Mirror Lake', 190], poi: 1 },
    { id: 'beach', reg: 1, cx: 3000, cy: 6600, dir: [1, 0], to: [1200, 6600], lm: ['lighthouse', 'Pearl Lighthouse', 118], poi: 1 },
    { id: 'coral', reg: 1, cx: 1200, cy: 6600, dir: [1, 0], to: [1200, 4800], lm: ['reef-arch', 'Coral Arch', 116], poi: 0 },
    { id: 'cove', reg: 1, cx: 1200, cy: 4800, dir: [0, 1], to: [3000, 4800], lm: ['shipwreck', 'The Wrecked Galleon', 116], poi: 1 },
    { id: 'isles', reg: 1, cx: 3000, cy: 4800, dir: [-1, 0], to: [3000, 3000], lm: ['sea-stacks', 'The Mist Pillars', 116], poi: 1 },
    { id: 'dunes', reg: 2, cx: 9040, cy: 6600, dir: [-1, 0], to: [10840, 6600], lm: ['giant-dune', 'Singing Dune', 118], poi: 1 },
    { id: 'oasis', reg: 2, cx: 10840, cy: 6600, dir: [-1, 0], to: [10840, 4800], lm: ['oasis', 'Mirage Pool', 118], poi: 1 },
    { id: 'canyon', reg: 2, cx: 10840, cy: 4800, dir: [0, 1], to: [9040, 4800], lm: ['mesa', 'Crimson Mesa', 116], poi: 1 },
    { id: 'temple', reg: 2, cx: 9040, cy: 4800, dir: [1, 0], to: [9040, 3000], lm: ['pyramid', 'The Sunken Pyramid', 120], poi: 1 },
    { id: 'snow', reg: 3, cx: 3000, cy: 3000, dir: [0, 1], to: [1200, 3000], lm: ['ice-peak', 'Whitecap Peak', 112], poi: 0 },
    { id: 'frozen', reg: 3, cx: 1200, cy: 3000, dir: [1, 0], to: [1200, 1200], lm: ['frozen-lake', 'Glass Lake', 118], poi: 1 },
    { id: 'rime', reg: 3, cx: 1200, cy: 1200, dir: [0, 1], to: [3000, 1200], lm: ['ice-forest', 'The Crystal Pines', 112], poi: 1 },
    { id: 'glacier', reg: 3, cx: 3000, cy: 1200, dir: [-1, 0], to: [4000, 1500], lm: ['ice-palace', 'Glacier Throne', 118], poi: 1 },
    { id: 'ash', reg: 4, cx: 9040, cy: 3000, dir: [0, 1], to: [10840, 3000], lm: ['burnt-grove', 'The Cinder Grove', 112], poi: 1 },
    { id: 'ridge', reg: 4, cx: 10840, cy: 3000, dir: [-1, 0], to: [10840, 1200], lm: ['obsidian-ridge', 'The Glass Ridge', 116], poi: 0 },
    { id: 'lavafall', reg: 4, cx: 10840, cy: 1200, dir: [0, 1], to: [9040, 1200], lm: ['lava-falls', 'Ember Falls', 118], poi: 0 },
    { id: 'caldera', reg: 4, cx: 9040, cy: 1200, dir: [1, 0], to: [8000, 1500], lm: ['volcano', 'Mount Ember', 118], poi: 1 },
  ];
  const AREA_BY = Object.fromEntries(AREAS.map((a) => [a.id, a]));
  // Landmark footprints (blocked): [dx, dy, rx, ry] in landmark painter units, scaled by k = rx/58*1.1. null = walkable.
  const LM_FOOT = {
    'hill': [[0, 16, 40, 8]], 'oak-grove': [[0, 12, 24, 10]], 'bamboo-grove': [[0, 8, 30, 10]], lake: [[0, 0, 62, 42]], lighthouse: [[8, 20, 66, 18]], 'reef-arch': [[-52, 12, 16, 10], [52, 12, 16, 10]],
    shipwreck: [[0, 6, 62, 22]], 'giant-dune': [[0, 8, 46, 12]], oasis: [[0, 3, 66, 31]], pyramid: [[0, 6, 60, 26]], 'ice-peak': [[0, 10, 62, 22]], 'frozen-lake': null, 'ice-forest': null, 'burnt-grove': null,
    'obsidian-ridge': [[0, 22, 74, 12]], volcano: [[-14, 12, 66, 20]], 'sea-stacks': [[0, 8, 70, 26]], mesa: [[0, 6, 70, 24]], 'ice-palace': [[0, 8, 64, 22]], 'lava-falls': [[0, 12, 66, 26]],
  };
  const SLOT = { a0: [-640, 600], a1: [0, 600], a2: [640, 600], b0: [-640, 0], b2: [640, 0], c0: [-640, -600], c1: [0, -600], c2: [640, -600] };
  const VARS = [
    { spots: ['a1', 'a0', 'a2', 'b0', 'b2'], elite: ['c0'], boss: 'c1', poi: 'c2' },
    { spots: ['a1', 'a2', 'a0', 'b2', 'b0'], elite: ['c2'], boss: 'c1', poi: 'c0' },
    { spots: ['a0', 'a1', 'a2', 'b0', 'c0'], elite: ['b2'], boss: 'c2', poi: 'c1' },
    { spots: ['a2', 'a1', 'a0', 'b2', 'c2'], elite: ['b0'], boss: 'c0', poi: 'c1' },
  ];

  for (const A of AREAS) {
    const ex = A.dir[0], ey = A.dir[1], px0 = ey, py0 = -ex;
    // choose the variant / mirror whose boss lies most toward the next area
    const want = [A.to[0] - A.cx, A.to[1] - A.cy], wl = Math.hypot(want[0], want[1]) || 1;
    let best = null;
    for (let v = 0; v < VARS.length; v++) for (const mir of [1, -1]) {
      const s = SLOT[VARS[v].boss], lx = s[0] * mir, ly = s[1];
      const dx = lx * px0 + ly * ex, dy = lx * py0 + ly * ey, sc = (dx * want[0] + dy * want[1]) / (Math.hypot(dx, dy) * wl) + ((hash(A.id + v + mir) % 100) / 100) * 0.02;
      if (!best || sc > best.sc) best = { v, mir, sc };
    }
    A.variant = best.v; A.mir = best.mir;
    const px = px0 * A.mir, py = py0 * A.mir;
    A.p = (lx, ly) => [A.cx + lx * px + ly * ex, A.cy + lx * py + ly * ey];
    A.pp = (arr) => arr.map((q) => A.p(q[0], q[1]));
    A.rot = Math.atan2(py, px);   // angle of the local x axis in world space
  }

  // Sub-area shapes (the land the area owns; used for fog, hit tests and the ground colour)
  for (const A of AREAS) {
    let sh;
    if (A.id === 'meadow') sh = blobShape(A.cx, A.cy + 130, 810, 930, 'shape:meadow', 0.04);
    else if (A.id === 'isles') sh = ellipsePoly(A.cx, A.cy, 1010, 880, 'shape:isles', 0.03, 44);
    else sh = blobShape(A.cx, A.cy, 815, 815, 'shape:' + A.id, 0.07);
    A.shape = sh.map(R2);
  }

  // ---------- nodes: spots, elites, boss, poi, entry, landmark ----------
  for (const A of AREAS) {
    const R = rng('slots:' + A.id), V = VARS[A.variant], J = () => (R() - 0.5) * 120;
    const slot = (name) => { const s = SLOT[name]; return R2(A.p(s[0] + J(), s[1] + J())); };
    A.entry = R2(A.p(-300, 810));
    if (A.id === 'meadow') A.entry = R2(A.p(-260, 800));
    const lmJ = [(R() - 0.5) * 70, (R() - 0.5) * 70];
    const lm = A.lm, k = lm[2] / 58 * 1.1;
    A.landmark = { x: rnd(A.cx + lmJ[0]), y: rnd(A.cy + lmJ[1]), rx: lm[2], ry: Math.round(lm[2] * 0.62), kind: lm[0], label: lm[1], k };
    A.boss = slot(V.boss);
    A.elites = V.elite.map(slot);
    A.spots = V.spots.map(slot).sort((a, b) => dist(a, A.entry) - dist(b, A.entry));
    A.poiP = A.poi ? slot(V.poi) : null;
  }
  const PLACED = [];   // every position that must stay walkable: [x, y, r]
  for (const A of AREAS) { for (const p of [A.boss, ...A.elites, ...A.spots, A.poiP, A.entry]) if (p) PLACED.push([p[0], p[1], 46]); }
  PLACED.push([CAMP.x, CAMP.y, 50]);

  // ---------- continent ----------
  const OUTLINE_RAW = [
    [250, 520], [330, 330], [700, 270], [1500, 300], [2300, 260], [3100, 320], [3900, 270], [4800, 320], [5600, 260], [6400, 310], [7200, 260], [8000, 320], [8900, 270], [9700, 320], [10500, 270], [11300, 320], [11700, 500],
    [11800, 1200], [11760, 2200], [11800, 3200], [11770, 4200], [11800, 5200], [11770, 6200], [11800, 7000], [11700, 7560],
    [11300, 7760], [10900, 7700], [10300, 7810], [9800, 7720], [9200, 7810], [8700, 7730], [8300, 7860],
    [8010, 8100], [7970, 8600], [8010, 9100], [7950, 9400], [7700, 9580], [7200, 9660], [6600, 9620], [6000, 9580], [5400, 9520], [4800, 9460], [4400, 9330],
    [4180, 9000], [4130, 8300], [4200, 7900], [4120, 7770], [3800, 7750], [3300, 7810], [2800, 7730], [2300, 7810], [1800, 7710], [1300, 7800], [800, 7710], [450, 7520],
    [300, 7000], [260, 6200], [300, 5400], [260, 4600], [300, 3800], [250, 3000], [290, 2200], [250, 1400], [260, 800],
  ];
  const OUTLINE = orient(wobble(OUTLINE_RAW, 150, 40, 'coast').map(R2), 1);
  const SOUND = orient(ellipsePoly(3000, 4800, 1010, 880, 'sound', 0.05, 44).map(R2), -1);   // the inland Mist Sea (a hole)
  const MASSIF = [[3960, 520], [4600, 440], [7400, 440], [8100, 560], [8110, 5200], [7900, 5640], [4300, 5640], [3990, 5200]];

  const FE = [];                          // features
  const add = (f) => (FE.push(f), f);
  const extraLand = [];                   // islands + sandbars (polygons added to the land)
  const ROCKY = [];                       // [x, y, r] patches of bare mountain ground

  // ---------- feature builders ----------
  function nearestOn(pts, x, y) {
    let best = null;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l)) : 0;
      const qx = a[0] + dx * t, qy = a[1] + dy * t, d = Math.hypot(qx - x, qy - y);
      if (!best || d < best.d) best = { d, x: qx, y: qy, ang: Math.atan2(dy, dx), f: (i + t) / (pts.length - 1) };
    }
    return best;
  }
  const river = (pts, w0, w1, style, extra) => add(Object.assign({ k: 'river', pts: pts.map(R2), w0, w1, style: style || 'water' }, extra));
  function bridgeOn(r, x, y, style, w) {
    const n = nearestOn(r.pts, x, y), rw = r.w0 + (r.w1 - r.w0) * n.f;
    return add({ k: 'bridge', x: rnd(n.x), y: rnd(n.y), a: n.ang + Math.PI / 2, len: Math.round(rw + 110), w: w || 36, style: style || 'wood', rw });
  }
  function fordOn(r, x, y) {
    const n = nearestOn(r.pts, x, y), rw = r.w0 + (r.w1 - r.w0) * n.f;
    return add({ k: 'ford', x: rnd(n.x), y: rnd(n.y), a: n.ang + Math.PI / 2, len: Math.round(rw + 100), w: 50 });
  }
  const cliff = (pts, style, h) => add({ k: 'cliff', pts: pts.map(R2), style: style || 'rock', h: h || 34 });
  const ridge = (pts, r, style) => add({ k: 'ridge', pts: pts.map(R2), r, style: style || 'rock' });
  const lake = (x, y, rx, ry, style, rot, walk) => add({ k: 'lake', x: rnd(x), y: rnd(y), rx, ry, style: style || 'lake', rot: rot || 0, walk: !!walk });
  const mesa = (x, y, rx, ry, h, style) => add({ k: 'mesa', x: rnd(x), y: rnd(y), rx, ry, h: h || 70, style: style || 'red' });
  const grove = (x, y, rx, ry, tree, dens) => add({ k: 'grove', x: rnd(x), y: rnd(y), rx, ry, tree, dens: dens || 1 });
  const ruin = (x, y, kind, s, a) => add({ k: 'ruin', x: rnd(x), y: rnd(y), kind, s: s || 1, a: a || 0 });
  const shrine = (x, y, s) => add({ k: 'shrine', x: rnd(x), y: rnd(y), s: s || 1 });
  const lanterns = (pts, n) => add({ k: 'lanterns', pts: pts.map(R2), n: n || 6 });
  const field = (x, y, rx, ry, rot, crop) => add({ k: 'field', x: rnd(x), y: rnd(y), rx, ry, rot: rot || 0, crop: crop || 'rice' });
  const stones = (x, y, r, n) => add({ k: 'stones', x: rnd(x), y: rnd(y), r, n: n || 7 });
  const sea = (kind, x, y, s, f) => add({ k: kind, x: rnd(x), y: rnd(y), s: s || 1, f: f || 0 });
  // A wall/ridge/river along a straight-ish line with gaps (passes) at the given coordinates along its axis.
  function wallLine(kind, a, b, gaps, opt) {
    opt = opt || {};
    const horiz = Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]), R = rng('wall:' + a + b), half = opt.gap || 150, segs = [], lo = horiz ? a[0] : a[1], hi = horiz ? b[0] : b[1];
    let cur = lo;
    for (const g of (gaps || []).slice().sort((p, q) => p - q)) { if (g - half > cur) segs.push([cur, g - half]); cur = g + half; }
    if (hi > cur) segs.push([cur, hi]);
    for (const [s0, s1] of segs) {
      const pts = []; const n = Math.max(2, Math.round((s1 - s0) / 140));
      for (let i = 0; i <= n; i++) {
        const t = s0 + (s1 - s0) * i / n, f = (t - lo) / (hi - lo || 1), off = (R() - 0.5) * (opt.wob || 50);
        pts.push(horiz ? [t, a[1] + (b[1] - a[1]) * f + off] : [a[0] + (b[0] - a[0]) * f + off, t]);
      }
      if (kind === 'cliff') cliff(pts, opt.style, opt.h); else if (kind === 'ridge') ridge(pts, opt.r || 110, opt.style);
    }
  }

  // ---------- macro geography ----------
  function macro() {
    // Great Divide: mountain walls along both sides of the central massif, with gates where the west/east regions open onto it
    wallLine('ridge', [4040, 520], [4040, 5400], [3050], { r: 140, style: 'snow', gap: 190 });
    wallLine('ridge', [8130, 560], [8130, 5300], [3050], { r: 140, style: 'ash', gap: 190 });
    wallLine('ridge', [4300, 450], [7900, 450], [], { r: 110, style: 'snow' });
    // The Green Escarpment: cliffs along the north of Greenvale with the Skyway pass and the forest-bamboo path
    wallLine('cliff', [4330, 7490], [7790, 7430], [5150], { style: 'moss', h: 40, gap: 170 });
    wallLine('cliff', [4300, 5650], [7790, 5660], [6400], { style: 'rock', h: 46, gap: 140 });
    // Pilgrim ridge between Greenvale and the coast (pass for the beach road at y~6650)
    wallLine('ridge', [4080, 5800], [4090, 7600], [6680], { r: 80, style: 'rock', gap: 150 });
    // West-block borders
    wallLine('cliff', [330, 5640], [2150, 5650], [1250], { style: 'rock', h: 30, gap: 130 });       // coral | cove
    wallLine('cliff', [2100, 2250], [2100, 3750], [3000], { style: 'ice', h: 36, gap: 150 });       // snow | frozen
    wallLine('cliff', [420, 2080], [2050, 2090], [1200], { style: 'ice', h: 36, gap: 150 });        // frozen | rime
    wallLine('cliff', [2100, 420], [2100, 1950], [1250], { style: 'ice', h: 40, gap: 150 });        // rime | glacier
    wallLine('cliff', [2250, 2080], [3850, 2090], [3100], { style: 'ice', h: 38, gap: 150 });       // glacier | snow
    // East-block borders
    wallLine('cliff', [8250, 5660], [9900, 5670], [9100], { style: 'red', h: 40, gap: 140 });       // dunes | temple
    wallLine('cliff', [10000, 5660], [11650, 5670], [10840], { style: 'red', h: 44, gap: 140 });    // oasis | canyon
    wallLine('cliff', [9940, 4000], [9940, 5500], [4800], { style: 'red', h: 44, gap: 150 });       // temple | canyon
    wallLine('cliff', [8250, 3920], [11650, 3920], [9040, 10840], { style: 'ash', h: 40, gap: 150 }); // sunscorch | ember
    wallLine('cliff', [9940, 2250], [9940, 3750], [3000], { style: 'obsidian', h: 38, gap: 150 });  // ash | ridge
    wallLine('cliff', [8260, 2080], [9900, 2090], [9040], { style: 'ash', h: 36, gap: 150 });       // ash | caldera
    // Hakusui river: Skyglass lake -> the escarpment (falls) -> Mirror Lake
    const hak = river([[5900, 3590], [6060, 3900], [6300, 4300], [6720, 4660], [6640, 5080], [6880, 5420], [6930, 5700], [6935, 6000], [6925, 6330]], 26, 46, 'water', { fall: 5 });
    bridgeOn(hak, 6640, 5040, 'stone');
    // Kyokai wadi: border river east of Mirror Lake down to the south-east sea
    const wadi = river([[8010, 5720], [7960, 6100], [8050, 6480], [7990, 6860], [8060, 7260], [8010, 7700]], 40, 70, 'water');
    bridgeOn(wadi, 8010, 6640, 'wood', 40); fordOn(wadi, 8000, 6000); fordOn(wadi, 8040, 7200);
    // Skyglass lake with a shrine island, the Skyway road is generated later
    lake(5900, 3260, 560, 340, 'alpine', 0);
    add({ k: 'islet', x: 5880, y: 3230, r: 70 });
    add({ k: 'bridge', x: 5880, y: 3470, a: Math.PI / 2, len: 360, w: 34, style: 'stone', rw: 0 });
    shrine(5880, 3200, 1.6);
    ruin(5200, 4240, 'gate', 1.4, 0.3); ruin(6200, 4060, 'columns', 1.2); stones(5300, 2500, 90, 9); stones(6700, 2300, 80, 7);
    ruin(6800, 1300, 'tower', 1.3); ruin(5200, 1500, 'wall', 1.3);
    grove(5200, 3900, 220, 180, 'pine', 1); grove(6900, 3400, 240, 220, 'pine', 1); grove(5000, 1900, 300, 260, 'pine', 1.1); grove(6900, 1900, 280, 240, 'pine', 1); grove(6000, 800, 500, 120, 'pine', 0.9);
    lake(7050, 2400, 200, 120, 'alpine', 0.3); lake(5100, 2850, 150, 90, 'alpine', -0.4);
    river([[7050, 2520], [7080, 2900], [6820, 3300]], 18, 22, 'water');
    // highland dressing: crags, terraces, a tarn chain, an alpine hanami meadow, a chasm
    ridge([[4100, 1500], [4600, 1650], [5100, 1560], [5480, 1900]], 120, 'snow'); ridge([[8100, 1700], [7600, 1850], [7300, 1720], [7020, 1330]], 110, 'snow');
    ridge([[4300, 4320], [4700, 4520], [5020, 4380]], 100, 'rock'); ridge([[7400, 4200], [7700, 4500], [7950, 4300]], 100, 'rock');
    cliff([[4400, 3060], [4800, 3000], [5250, 3090]], 'rock', 38); cliff([[6650, 3850], [7000, 3930], [7450, 3840]], 'rock', 38); cliff([[6000, 2300], [6350, 2250], [6700, 2330]], 'moss', 34);
    river([[7300, 4350], [7090, 4520], [6990, 4700]], 24, 28, 'chasm');
    grove(4850, 3550, 260, 190, 'sakura', 0.6); grove(7200, 3200, 200, 160, 'round', 0.5); grove(5500, 2000, 200, 150, 'pine', 1.3);
    field(6400, 2650, 210, 120, 0.2, 'flower'); field(5000, 2300, 160, 100, -0.3, 'flower');
    lake(4700, 4000, 110, 70, 'alpine', 0.2); lake(7500, 3500, 120, 80, 'alpine', -0.2);
    ruin(7300, 2900, 'hut', 1.1); ruin(4700, 2700, 'hut', 1); ruin(6500, 3000, 'statue', 1.2); stones(7000, 4300, 80, 8); shrine(6100, 4650, 1.2);
    for (const [x, y, r] of [[5000, 2000, 240], [7200, 2000, 260], [4700, 3600, 200], [7600, 4100, 220], [6300, 1500, 280]]) ROCKY.push([x, y, r]);
    // the mountain pass torii at both ends of the Skyway
    add({ k: 'torii', x: 6450, y: 5560, s: 1.6, a: 0 });
    // Frost gate / ember gate shrines
    shrine(3990, 3000, 1.3); shrine(8140, 3000, 1.3);
    // ocean dressing
    for (const [x, y, s, f] of [[600, 8350, 1.2, 0], [1900, 8700, 1, 1], [3200, 8900, 1.1, 0], [2600, 8300, 1, 1], [9300, 8500, 1.2, 1], [10700, 8800, 1, 0], [9700, 9300, 1.1, 1], [3700, 9400, 1, 0], [200, 5000, 1.1, 1]]) sea('boat', x, y, s, f);
    for (const [x, y, s] of [[200, 600, 24], [520, 140, 18], [1400, 120, 22], [2400, 90, 16], [3600, 140, 20], [5000, 120, 18], [6600, 100, 22], [140, 1300, 20], [90, 2100, 16], [160, 3200, 22], [8600, 130, 18], [9800, 110, 20]]) sea('floe', x, y, s);
    for (const [x, y, s] of [[10400, 130, 12], [11300, 180, 16], [11700, 90, 10], [11880, 800, 12], [11890, 2000, 14]]) sea('lavarock', x, y, s);
    for (const [x, y, s] of [[120, 7400, 9], [450, 7800, 8], [3100, 7950, 9], [2100, 8000, 8], [7850, 8000, 9], [9400, 7950, 8], [11100, 7950, 9], [120, 4200, 8], [160, 5700, 9], [11880, 4500, 8], [11860, 6100, 9]]) sea('stack', x, y, s);
    // camp coast: jetty & boat are painted with the camp
  }

  // ---------- per-area recipes (local frame: x across, y toward the entry; rows at y=-600/0/600, columns at x=-640/0/640) ----------
  const RECIPES = {
    meadow(A) {
      const p = A.p, pp = A.pp;
      const r = river(pp([[-900, -330], [-640, -290], [-300, -350], [100, -300], [520, -340], [900, -310]]), 24, 30, 'water');
      bridgeOn(r, ...p(-330, -330), 'wood'); bridgeOn(r, ...p(360, -320), 'stone');
      field(...p(-330, 330), 215, 125, A.rot, 'rice'); grove(...p(330, 320), 200, 140, 'sakura', 0.8);
      lake(...p(-340, -80), 74, 46, 'pond', A.rot);
      lanterns(pp([[44, 520], [44, 215]]), 6); add({ k: 'torii', x: rnd(p(0, 320)[0]), y: rnd(p(0, 320)[1]), s: 1.7, a: 0 });
      ruin(...p(-570, 400), 'hut', 1.2); ruin(...p(520, -90), 'hut', 1); grove(...p(520, 60), 120, 90, 'round', 0.6);
    },
    forest(A) {
      const p = A.p, pp = A.pp;
      const r = river(pp([[310, -900], [300, -600], [350, -150], [320, 350], [340, 900]]), 22, 26, 'water');
      bridgeOn(r, ...p(330, -300), 'log'); bridgeOn(r, ...p(330, 300), 'wood');
      grove(...p(-330, -300), 230, 170, 'pine', 1.4); grove(...p(-330, 300), 230, 170, 'oak', 1.2); grove(...p(-40, 330), 130, 90, 'pine', 1);
      ruin(...p(480, -300), 'gate', 1.3, A.rot); shrine(...p(480, 300), 1); stones(...p(-330, 20), 70, 7);
      cliff(pp([[-420, -150], [-330, -90], [-240, -140]]), 'moss', 22);
    },
    bamboo(A) {
      const p = A.p, pp = A.pp;
      const r = river(pp([[-900, 340], [-520, 300], [0, 335], [500, 290], [900, 320]]), 22, 24, 'water');
      bridgeOn(r, ...p(-330, 310), 'wood'); bridgeOn(r, ...p(330, 300), 'stone'); fordOn(r, ...p(0, 330));
      grove(...p(-330, -300), 220, 160, 'bamboo', 1.5); grove(...p(330, -300), 220, 160, 'bamboo', 1.5); grove(...p(0, -190), 90, 60, 'bamboo', 1);
      field(...p(330, -20), 130, 85, A.rot, 'tea'); shrine(...p(-330, -30), 1); lanterns(pp([[-330, -190], [-330, 60]]), 5);
      stones(...p(-40, 440), 50, 5);
    },
    lake(A) {
      const p = A.p, pp = A.pp, L = A.landmark;
      // outflow stream south-west of the lake to the escarpment falls
      const r = river([[L.x - 190, L.y + 120], [L.x - 250, L.y + 340], [L.x - 330, L.y + 640], [L.x - 300, L.y + 830]], 20, 24, 'water', { fall: 3 });
      bridgeOn(r, L.x - 310, L.y + 460, 'wood');
      grove(...p(-330, 300), 200, 140, 'willow', 0.9); grove(...p(330, -300), 190, 130, 'willow', 0.9); grove(...p(330, 300), 190, 130, 'round', 0.8);
      lake(...p(-330, -300), 100, 64, 'marsh', A.rot); ruin(...p(-420, 100), 'hut', 1.1); stones(...p(330, 20), 70, 7);
      shrine(...p(-100, 400), 1);
    },
    beach(A) {
      const p = A.p, pp = A.pp;
      grove(...p(320, 300), 200, 130, 'palm', 1.1); grove(...p(320, -300), 200, 130, 'palm', 0.9); lake(...p(-320, 300), 110, 70, 'tide', A.rot);
      ruin(...p(-480, -110), 'village', 1, A.rot); lanterns(pp([[-330, -200], [-330, -30]]), 4); stones(...p(-20, 340), 60, 6);
      add({ k: 'jetty', x: 3040, y: 7715, a: Math.PI / 2 });
      const r = river(pp([[-900, -340], [-500, -300], [0, -350], [500, -300], [900, -330]]), 16, 20, 'tide');
      bridgeOn(r, ...p(-330, -320), 'wood'); bridgeOn(r, ...p(330, -320), 'wood');
    },
    coral(A) {
      const p = A.p;
      for (const [x, y] of [[-320, -300], [320, -300], [-320, 300], [320, 300]]) { lake(...p(x, y), 190, 125, 'deep', A.rot); add({ k: 'reef', x: rnd(p(x, y)[0]), y: rnd(p(x, y)[1]), rx: 160, ry: 100 }); }
      for (const [x, y] of [[0, -300], [0, 300]]) sea('shell', ...p(x, y), 1, 0);
      lake(...p(-860, 100), 120, 60, 'deep', A.rot); lake(...p(860, -120), 120, 60, 'deep', A.rot);
    },
    cove(A) {
      const p = A.p, pp = A.pp;
      cliff(pp([[-900, -420], [-600, -380], [-300, -440], [-100, -420]]), 'rock', 40); cliff(pp([[260, -350], [560, -390], [900, -420]]), 'rock', 40);
      lake(...p(-330, 330), 130, 80, 'tide', A.rot); lake(...p(330, 80), 90, 55, 'tide', A.rot);
      ruin(...p(330, 330), 'hut', 1); stones(...p(-330, -120), 60, 5); grove(...p(480, -250), 110, 80, 'palm', 0.7);
      sea('stack', 220, 4400, 12); sea('stack', 250, 5250, 10); sea('stack', 140, 4800, 14);
    },
    isles(A) { islesRecipe(A); },
    snow(A) {
      const p = A.p, pp = A.pp;
      cliff(pp([[-900, -340], [-620, -310], [-420, -350]]), 'ice', 32); cliff(pp([[-150, -330], [150, -350], [330, -320]]), 'ice', 32); cliff(pp([[600, -340], [900, -320]]), 'ice', 32);
      grove(...p(-330, 300), 220, 150, 'frost', 1.4); grove(...p(330, 300), 200, 150, 'frost', 1.3); grove(...p(330, -60), 150, 100, 'frost', 1);
      shrine(...p(-330, -40), 1); stones(...p(-30, 330), 70, 7); lake(...p(-60, -200), 90, 50, 'ice', A.rot);
    },
    frozen(A) {
      const p = A.p, pp = A.pp;
      const c1 = river(pp([[-900, -240], [-620, -300], [-120, -330], [380, -280], [900, -320]]), 14, 14, 'crack');
      bridgeOn(c1, ...p(-340, -300), 'ice', 40); bridgeOn(c1, ...p(420, -290), 'ice', 40);
      const c2 = river(pp([[330, 900], [310, 600], [350, 220]]), 14, 14, 'crack'); bridgeOn(c2, ...p(320, 500), 'ice', 40);
      lake(...p(-330, 320), 150, 95, 'hole', A.rot); lake(...p(340, -70), 90, 60, 'hole', A.rot); ruin(...p(-440, -90), 'hut', 1.1); ruin(...p(500, 330), 'hut', 1);
      grove(...p(-330, -60), 90, 70, 'frost', 0.8);
    },
    rime(A) {
      const p = A.p;
      grove(...p(-330, -300), 240, 170, 'frost', 1.8); grove(...p(330, -300), 240, 170, 'frost', 1.8); grove(...p(-330, 300), 240, 170, 'crystal', 1.2); grove(...p(330, 300), 240, 170, 'frost', 1.8);
      ruin(...p(0, 330), 'hall', 1.2, A.rot); stones(...p(330, 10), 60, 6); stones(...p(-330, 10), 60, 6);
    },
    glacier(A) {
      const p = A.p, pp = A.pp;
      cliff(pp([[-900, 330], [-600, 300], [-380, 350]]), 'ice', 40); cliff(pp([[-120, 340], [200, 320], [420, 350]]), 'ice', 40); cliff(pp([[700, 330], [940, 340]]), 'ice', 40);
      const c = river(pp([[-900, -320], [-600, -290], [-100, -340], [400, -290], [900, -320]]), 16, 16, 'crack');
      bridgeOn(c, ...p(-320, -320), 'ice', 44); bridgeOn(c, ...p(380, -300), 'ice', 44);
      grove(...p(-330, 20), 130, 100, 'frost', 0.9); grove(...p(330, 40), 130, 100, 'crystal', 1); stones(...p(0, 330), 60, 6); lake(...p(0, -170), 90, 55, 'ice', A.rot);
      sea('berg', 1400, 150, 1.3); sea('berg', 3000, 120, 1.1);
    },
    dunes(A) {
      const p = A.p, pp = A.pp;
      const r = river(pp([[330, -900], [300, -600], [360, -150], [320, 350], [350, 900]]), 38, 44, 'dry');
      fordOn(r, ...p(330, -300)); fordOn(r, ...p(330, 300));
      ruin(...p(-330, 300), 'nomad', 1.1, A.rot); grove(...p(-330, -300), 180, 120, 'cactus', 0.9); grove(...p(470, -300), 140, 100, 'cactus', 0.7);
      stones(...p(-330, 20), 60, 6); ruin(...p(500, 330), 'columns', 1);
    },
    oasis(A) {
      const p = A.p;
      grove(...p(-330, -300), 220, 150, 'palm', 1.3); grove(...p(330, 300), 220, 150, 'palm', 1.3); lake(...p(330, -300), 110, 70, 'oasis', A.rot); lake(...p(-330, 300), 90, 55, 'oasis', A.rot);
      ruin(...p(-110, 340), 'columns', 1.1); grove(...p(0, -250), 70, 45, 'palm', 0.8); ruin(...p(540, 60), 'nomad', 1, A.rot);
    },
    canyon(A) {
      const p = A.p, pp = A.pp;
      mesa(...p(-330, -300), 200, 125, 80); mesa(...p(340, 300), 190, 120, 70); mesa(...p(-300, 330), 120, 80, 50);
      cliff(pp([[260, -400], [520, -350], [820, -400]]), 'red', 44); cliff(pp([[-900, 70], [-640, 120], [-440, 80]]), 'red', 40);
      const c = river(pp([[300, -240], [380, 20], [320, 150]]), 28, 28, 'chasm'); bridgeOn(c, ...p(350, -60), 'rope', 36);
      ruin(...p(500, 330), 'columns', 1); stones(...p(-30, -300), 60, 6);
    },
    temple(A) {
      const p = A.p, pp = A.pp;
      lanterns(pp([[-60, 520], [-60, 190]]), 0);
      for (const t of [0.15, 0.4, 0.65]) ruin(...p(-70, 560 - 400 * t), 'statue', 1.1, 0);
      ruin(...p(330, -300), 'wall', 1.3, A.rot); ruin(...p(-330, -300), 'obelisk', 1.2); ruin(...p(-330, 300), 'columns', 1.4); ruin(...p(330, 300), 'hall', 1.1, A.rot);
      stones(...p(330, 20), 60, 7); cliff(pp([[-560, -80], [-420, -50], [-250, -90]]), 'sand', 24);
    },
    ash(A) {
      const p = A.p, pp = A.pp;
      const c = river(pp([[-900, -310], [-600, -280], [-100, -330], [400, -290], [900, -320]]), 18, 20, 'lava');
      bridgeOn(c, ...p(-320, -300), 'obsidian', 38); bridgeOn(c, ...p(390, -300), 'obsidian', 38);
      grove(...p(-330, 300), 220, 150, 'burnt', 1.2); grove(...p(330, 300), 200, 140, 'burnt', 1.0); grove(...p(330, -60), 120, 90, 'burnt', 0.9); ruin(...p(-440, -60), 'hut', 1);
      cliff(pp([[-50, 160], [120, 200], [250, 170]]), 'ash', 28);
    },
    ridge(A) {
      const p = A.p, pp = A.pp;
      cliff(pp([[-900, -400], [-600, -360], [-380, -420]]), 'obsidian', 44); cliff(pp([[-100, -380], [180, -420], [400, -370]]), 'obsidian', 44); cliff(pp([[650, -400], [920, -370]]), 'obsidian', 44);
      const c = river(pp([[-330, 900], [-300, 600], [-350, 200]]), 16, 18, 'lava'); bridgeOn(c, ...p(-320, 480), 'obsidian', 36);
      grove(...p(330, 300), 200, 150, 'shard', 1.2); grove(...p(330, -60), 130, 90, 'shard', 1); grove(...p(-330, -100), 100, 70, 'crystal', 0.9);
      lake(...p(330, -300), 90, 55, 'lava', A.rot); stones(...p(-30, 330), 60, 6);
    },
    lavafall(A) {
      const p = A.p, pp = A.pp;
      const c = river(pp([[-900, 310], [-640, 290], [-200, 340], [300, 290], [900, 320]]), 30, 34, 'lava');
      bridgeOn(c, ...p(-330, 310), 'obsidian', 40); bridgeOn(c, ...p(330, 300), 'obsidian', 40);
      lake(...p(-330, -300), 140, 90, 'lava', A.rot); lake(...p(330, -300), 120, 80, 'lava', A.rot);
      grove(...p(0, -330), 80, 60, 'burnt', 0.7); stones(...p(0, 440), 60, 5); ruin(...p(-440, 20), 'tower', 1);
    },
    caldera(A) {
      const p = A.p, pp = A.pp, L = A.landmark;
      const r = river(pp([[-900, 330], [-640, 300], [-330, 340], [330, 300], [700, 340], [900, 310]]), 26, 30, 'lava');
      bridgeOn(r, ...p(-330, 320), 'obsidian', 40); bridgeOn(r, ...p(330, 310), 'obsidian', 40);
      lake(...p(330, -300), 130, 85, 'lava', A.rot); lake(...p(-330, -300), 110, 70, 'lava', A.rot);
      river([[L.x + 40, L.y + 110], [L.x + 120, L.y + 240], [L.x + 90, L.y + 290]], 16, 22, 'lava');
      grove(...p(-330, 60), 120, 90, 'burnt', 0.9); stones(...p(330, 40), 60, 6);
    },
  };

  // Mist Isles: an inland sea with an island under every spot, linked by sandbars and rope bridges
  function islesRecipe(A) {
    const nodes = [A.entry, ...A.spots, ...A.elites, A.boss].concat(A.poiP ? [A.poiP] : []);
    const L = A.landmark, islands = [];
    const isl = (p, rx, ry, name, tag) => { const poly = orient(ellipsePoly(p[0], p[1], rx, ry, 'isle:' + name, 0.14, 26).map(R2), 1); extraLand.push({ poly, biome: 'isles' }); islands.push({ p, rx, ry, tag }); return poly; };
    nodes.forEach((p, i) => isl(p, p === A.boss ? 300 : 230, p === A.boss ? 190 : 150, 'n' + i, i));
    isl([L.x, L.y + 10], 260, 160, 'lm', 'lm');
    // link: chain from the entry to the nearest unvisited island; every 2nd link is a rope bridge when the gap is wide
    const rest = islands.slice(1), order = [islands[0]];
    while (rest.length) { const last = order[order.length - 1]; rest.sort((a, b) => dist(a.p, last.p) - dist(b.p, last.p)); order.push(rest.shift()); }
    const link = (a, b, i, forceBridge) => {
      const d = dist(a.p, b.p), ux = (b.p[0] - a.p[0]) / d, uy = (b.p[1] - a.p[1]) / d;
      const bridge = forceBridge || (i % 2 === 1 && d > 520);
      if (!bridge) { extraLand.push({ poly: orient(strip(a.p, b.p, 62, 'bar' + i).map(R2), 1), biome: 'isles' }); return; }
      const edge = (o, sx) => Math.min(o.rx, o.ry) * 0.7 + 0.3 * (1 / Math.hypot(ux / o.rx, uy / o.ry)) * 0.5 + 0 * sx;
      const ra = 1 / Math.hypot(ux / a.rx, uy / a.ry) * 0.62, rb = 1 / Math.hypot(ux / b.rx, uy / b.ry) * 0.62;
      const s = [a.p[0] + ux * ra, a.p[1] + uy * ra], e = [b.p[0] - ux * rb, b.p[1] - uy * rb]; void edge;
      add({ k: 'bridge', x: rnd((s[0] + e[0]) / 2), y: rnd((s[1] + e[1]) / 2), a: Math.atan2(uy, ux), len: Math.round(dist(s, e)), w: 30, style: 'rope', rw: 0 });
    };
    for (let i = 0; i + 1 < order.length; i++) link(order[i], order[i + 1], i);
    // landmark island hangs off the nearest island; every island also gets a second link to its nearest neighbour (loops)
    const lmI = islands[islands.length - 1];
    for (const isle of islands) { if (isle === lmI) continue; const near = islands.filter((o) => o !== isle).sort((a, b) => dist(a.p, isle.p) - dist(b.p, isle.p))[0]; if (dist(near.p, isle.p) < 700 && isle.tag !== 'lm') extraLand.push({ poly: orient(strip(isle.p, near.p, 58, 'loop' + isle.tag).map(R2), 1), biome: 'isles' }); }
    // shore links: west to Shipwreck Cove, north to the snow plains
    extraLand.push({ poly: orient(strip([A.entry[0] - 170, A.entry[1]], [A.entry[0] - 330, A.entry[1] + 10], 60, 'cove').map(R2), 1), biome: 'isles' });
    const north = islands.reduce((m, i) => (i.p[1] < m.p[1] ? i : m), islands[0]);
    extraLand.push({ poly: orient(strip(north.p, [north.p[0] - 60, 3960], 62, 'snowlink').map(R2), 1), biome: 'isles' });
    add({ k: 'bridge', x: rnd(north.p[0] - 40), y: 4020, a: Math.PI / 2, len: 160, w: 34, style: 'ice', rw: 0 });
    A.boatSpots = [[A.cx - 380, A.cy + 520], [A.cx + 520, A.cy - 40]];
    sea('boat', A.cx - 100, A.cy + 760, 1, 0);
    sea('stack', L.x - 220, L.y - 130, 11); sea('stack', L.x + 250, L.y + 80, 10); sea('stack', A.cx + 560, A.cy + 520, 9);
  }

  // ---------- build ----------
  let built = false, roads = [];
  function build() {
    if (built) return; built = true;
    macro();
    for (const A of AREAS) RECIPES[A.id](A);
    // --- land raster ---
    fillPoly(land, OUTLINE, 1);
    fillPoly(land, SOUND, 0);
    for (const e of extraLand) fillPoly(land, e.poly, 1);
    // --- ground biome raster: nearest-site influence, then the massif, then sub-area shapes ---
    const sites = AREAS.map((A) => [A.cx, A.cy, BIO[A.id]]);
    for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
      const i = gy * GW + gx; if (!land[i]) continue;
      const X0 = (gx + 0.5) * G, Y0 = (gy + 0.5) * G, x = X0 + 150 * Math.sin(Y0 / 270 + X0 / 1100) + 80 * Math.sin(Y0 / 120 + 1), y = Y0 + 150 * Math.sin(X0 / 310 + 2) + 80 * Math.sin(X0 / 140); let bd = 1e18, bi = 1;
      for (const s of sites) { const d = (s[0] - x) * (s[0] - x) + (s[1] - y) * (s[1] - y); if (d < bd) { bd = d; bi = s[2]; } }
      ground[i] = bi;
    }
    fillPoly(ground, MASSIF, BIO.high);
    for (const [x, y, r] of ROCKY) stampEllipse(ground, x, y, r, r * 0.7, BIO.mtn);
    for (const f of FE) if (f.k === 'ridge') stampLine(ground, f.pts, f.r * 1.5, BIO.mtn);
    AREAS.forEach((A, k) => { fillPoly(subR, A.shape, k + 1); if (A.id !== 'isles') fillPoly(ground, A.shape, BIO[A.id]); });
    for (const e of extraLand) fillPoly(ground, e.poly, BIO[e.biome]);
    for (let i = 0; i < GW * GH; i++) if (!land[i]) ground[i] = 0;
    // --- blocked raster ---
    for (let i = 0; i < GW * GH; i++) blk[i] = land[i] ? 0 : 1;
    for (const f of FE) {
      if (f.k === 'river') { if (f.style === 'dry') continue; const wd = f.style === 'crack' ? 8 : 0; stampLine(blk, f.pts, (t) => (f.w0 + (f.w1 - f.w0) * t) / 2 + 6 + wd, 1); }
      else if (f.k === 'cliff') stampLine(blk, f.pts, 15, 1);
      else if (f.k === 'ridge') stampLine(blk, f.pts, f.r * 0.85, 1);
      else if (f.k === 'lake') { if (!f.walk) stampEllipse(blk, f.x, f.y, f.rx + 8, f.ry + 8, 1, f.rot); }
      else if (f.k === 'mesa') stampEllipse(blk, f.x, f.y, f.rx, f.ry, 1);
    }
    for (const A of AREAS) { const L = A.landmark, foot = LM_FOOT[L.kind]; if (foot) for (const [dx, dy, rx, ry] of foot) stampEllipse(blk, L.x + dx * L.k, L.y + dy * L.k, rx * L.k, ry * L.k, 1); }
    for (const f of FE) {
      if (f.k === 'bridge') stampRect(blk, f.x, f.y, f.len, Math.max(60, f.w + 24), f.a, 0);
      else if (f.k === 'ford') stampRect(blk, f.x, f.y, f.len, Math.max(70, f.w + 20), f.a, 0);
    }
    // the camp, shrines and nodes keep a small walkable clearing (checked against the design in tools)
    LAYOUT.violations = [];
    for (const [x, y, r] of PLACED) { const i = cellOf(x, y); if (i < 0 || blk[i]) LAYOUT.violations.push([x, y]); stampEllipse(blk, x, y, r, r * 0.8, 0); }
    makeRoads();
  }

  // ---------- path finding on a coarse grid (also used by map.js for tap-to-walk) ----------
  const CG = 40, CW = MAP_W / CG, CH = Math.ceil(MAP_H / CG);
  let cpass = null;
  function coarse() {
    if (cpass) return cpass; cpass = new Uint8Array(CW * CH);
    for (let cy = 0; cy < CH; cy++) for (let cx = 0; cx < CW; cx++) {
      let ok = 1; const gx = cx * 2, gy = cy * 2;
      for (let k = 0; k < 4; k++) { const x = gx + (k & 1), y = gy + (k >> 1); if (x >= GW || y >= GH || blk[y * GW + x]) { ok = 0; break; } }
      cpass[cy * CW + cx] = ok;
    }
    return cpass;
  }
  const heapPush = (h, n, f) => { h.push([f, n]); let i = h.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (h[p][0] <= h[i][0]) break; [h[p], h[i]] = [h[i], h[p]]; i = p; } };
  const heapPop = (h) => { const top = h[0], last = h.pop(); if (h.length) { h[0] = last; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < h.length && h[l][0] < h[m][0]) m = l; if (r < h.length && h[r][0] < h[m][0]) m = r; if (m === i) break; [h[m], h[i]] = [h[i], h[m]]; i = m; } } return top; };
  const gs = new Float32Array(CW * CH), came = new Int32Array(CW * CH), seen = new Uint32Array(CW * CH), closed = new Uint32Array(CW * CH); let gen = 0;
  // returns an array of [x, y] waypoints (coarse cell centres, endpoints exact) or null. extra(x, y) -> true if additionally blocked.
  function findPath(sx, sy, ex, ey, opt) {
    build(); const pass = coarse(); opt = opt || {};
    const extra = opt.extra, lim = opt.limit || 120000;
    const cidx = (x, y) => Math.max(0, Math.min(CH - 1, Math.floor(y / CG))) * CW + Math.max(0, Math.min(CW - 1, Math.floor(x / CG)));
    const ok = (i) => pass[i] && !(extra && extra(((i % CW) + 0.5) * CG, (Math.floor(i / CW) + 0.5) * CG));
    const nearOk = (x, y) => {   // the closest passable cell to a point (in case the start/goal cell is marginal)
      let i = cidx(x, y); if (ok(i)) return i;
      const cx = i % CW, cy = (i / CW) | 0;
      for (let r = 1; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const X = cx + dx, Y = cy + dy; if (X < 0 || Y < 0 || X >= CW || Y >= CH) continue;
        if (ok(Y * CW + X)) return Y * CW + X;
      }
      return -1;
    };
    const s = nearOk(sx, sy), e = nearOk(ex, ey); if (s < 0 || e < 0) return null;
    gen++; const heap = []; seen[s] = gen; gs[s] = 0; came[s] = -1; heapPush(heap, s, 0);
    const exx = e % CW, eyy = (e / CW) | 0; let n = 0, found = false;
    while (heap.length && n++ < lim) {
      const [, cur] = heapPop(heap); if (closed[cur] === gen) continue; closed[cur] = gen; if (cur === e) { found = true; break; }
      const cx = cur % CW, cy = (cur / CW) | 0, g0 = gs[cur];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue; const X = cx + dx, Y = cy + dy; if (X < 0 || Y < 0 || X >= CW || Y >= CH) continue;
        const ni = Y * CW + X; if (!ok(ni)) continue;
        if (dx && dy && (!ok(cy * CW + X) || !ok(Y * CW + cx))) continue;
        const g = g0 + (dx && dy ? 1.414 : 1) + (opt.cost ? opt.cost(ni) : 0);
        if (seen[ni] !== gen || g < gs[ni]) { seen[ni] = gen; gs[ni] = g; came[ni] = cur; { const ddx = Math.abs(exx - X), ddy = Math.abs(eyy - Y); heapPush(heap, ni, g + (ddx + ddy) + (1.414 - 2) * Math.min(ddx, ddy)); } }
      }
    }
    if (!found) return null;
    const out = []; for (let i = e; i >= 0; i = came[i]) out.push([((i % CW) + 0.5) * CG, (Math.floor(i / CW) + 0.5) * CG]);
    out.reverse(); out[0] = [sx, sy]; out[out.length - 1] = [ex, ey];
    return out;
  }
  function smoothPath(pts, iters) {
    let P = pts;
    for (let it = 0; it < (iters === undefined ? 2 : iters); it++) {
      const Q = [P[0]]; for (let i = 0; i + 1 < P.length; i++) { const a = P[i], b = P[i + 1]; Q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
      Q.push(P[P.length - 1]); P = Q;
    }
    return P;
  }
  function simplifyLOS(pts) {   // drop waypoints that are in line of sight on the fine raster
    const free = (a, b) => { const L = dist(a, b), m = Math.ceil(L / 14); for (let i = 0; i <= m; i++) { const x = a[0] + (b[0] - a[0]) * i / m, y = a[1] + (b[1] - a[1]) * i / m, c = cellOf(x, y); if (c < 0 || blk[c]) return false; } return true; };
    const out = [pts[0]]; let i = 0;
    while (i < pts.length - 1) { let j = pts.length - 1; while (j > i + 1 && !free(pts[i], pts[j])) j--; out.push(pts[j]); i = j; }
    return out;
  }

  // ---------- roads and trails (A* between the nodes of each area, and between areas) ----------
  function makeRoads() {
    const add2 = (a, b, style, w, name) => {
      let P = findPath(a[0], a[1], b[0], b[1], { limit: 60000 }); if (!P) return null;
      P = smoothPath(simplifyLOS(P).length > 1 ? densify(simplifyLOS(P)) : P, 2);
      roads.push({ k: 'road', pts: P.map(R2), w, style, name }); return P;
    };
    const densify = (P) => { const o = [P[0]]; for (let i = 0; i + 1 < P.length; i++) { const a = P[i], b = P[i + 1], m = Math.max(1, Math.ceil(dist(a, b) / 120)); for (let k = 1; k <= m; k++) o.push([a[0] + (b[0] - a[0]) * k / m, a[1] + (b[1] - a[1]) * k / m]); } return o; };
    const STYLE = { meadow: 'dirt', forest: 'dirt', bamboo: 'stone', lake: 'dirt', beach: 'sand', coral: null, cove: 'sand', isles: null, dunes: 'sand', oasis: 'sand', canyon: 'sand', temple: 'sand', snow: 'snow', frozen: 'snow', rime: 'snow', glacier: 'snow', ash: 'ash', ridge: 'ash', lavafall: 'ash', caldera: 'ash' };
    const links = [['camp', AREA_BY.meadow.entry], [AREA_BY.meadow.boss, AREA_BY.forest.entry], [AREA_BY.forest.boss, AREA_BY.bamboo.entry], [AREA_BY.bamboo.boss, AREA_BY.lake.entry], [AREA_BY.lake.boss, AREA_BY.dunes.entry], [AREA_BY.bamboo.boss, AREA_BY.beach.entry],
      [AREA_BY.beach.boss, AREA_BY.coral.entry], [AREA_BY.coral.boss, AREA_BY.cove.entry], [AREA_BY.dunes.boss, AREA_BY.oasis.entry], [AREA_BY.oasis.boss, AREA_BY.canyon.entry], [AREA_BY.canyon.boss, AREA_BY.temple.entry], [AREA_BY.temple.boss, AREA_BY.ash.entry],
      [AREA_BY.snow.boss, AREA_BY.frozen.entry], [AREA_BY.frozen.boss, AREA_BY.rime.entry], [AREA_BY.rime.boss, AREA_BY.glacier.entry], [AREA_BY.ash.boss, AREA_BY.ridge.entry], [AREA_BY.ridge.boss, AREA_BY.lavafall.entry], [AREA_BY.lavafall.boss, AREA_BY.caldera.entry]];
    for (const [a, b] of links) { const A0 = a === 'camp' ? [CAMP.x, CAMP.y] : a; add2(A0, b, 'main', 26, 'road'); }
    add2([6400, 5730], [6920, 6000], 'main', 24, 'skyway'); add2([6400, 5730], [6080, 4700], 'main', 22, 'skyway'); add2([6080, 4700], [5900, 3620], 'main', 22, 'skyway');
    add2([4000, 6680], [3800, 6680], 'main', 24, 'pass'); add2([3860, 3040], [4300, 3040], 'main', 20, 'pass'); add2([8240, 3040], [7900, 3040], 'main', 20, 'pass');
    for (const A of AREAS) {
      const st = STYLE[A.id]; if (!st) continue;
      const nodes = [...A.spots, ...A.elites].concat(A.poiP ? [A.poiP] : []), order = []; let cur = A.entry; const rest = nodes.slice();
      while (rest.length) { rest.sort((p, q) => dist(p, cur) - dist(q, cur)); cur = rest.shift(); order.push(cur); }
      let prev = A.entry; for (const n of order) { add2(prev, n, st, 11, 'trail'); prev = n; }
      add2(prev, A.boss, st, 11, 'trail');
      // spur to the landmark foot
      const L = A.landmark, near = nodes.concat([A.entry]).sort((p, q) => dist(p, [L.x, L.y]) - dist(q, [L.x, L.y]))[0], d = dist(near, [L.x, L.y]), tgt = [L.x + (near[0] - L.x) / d * (L.rx * 1.5 + 30), L.y + (near[1] - L.y) / d * (L.ry * 2 + 40)];
      add2(near, tgt, st, 9, 'spur');
    }
  }

  // ---------- public API ----------
  const subareas = {};
  for (const A of AREAS) {
    const sh = A.shape, b = bboxOf(sh);
    subareas[A.id] = {
      bounds: b.map(rnd), shape: sh, landmark: A.landmark, entry: A.entry, boss: A.boss, elites: A.elites, spots: A.spots, poi: A.poiP,
      region: REGIONS[A.reg], regionIndex: A.reg, center: [A.cx, A.cy],
    };
  }
  const LAYOUT = {
    MAP_W, MAP_H, CAMP, REGIONS, subareas, BIOMES, BIO,
    get features() { build(); return FE.concat(roads); },
    blocked(x, y) { build(); const i = cellOf(x, y); return i < 0 || blk[i] === 1; },
    isLand(x, y) { build(); const i = cellOf(x, y); return i >= 0 && land[i] === 1; },
    groundAt(x, y) { build(); const i = cellOf(x, y); return i < 0 ? 0 : ground[i]; },
    // sub-area id whose shape contains the point (or null)
    subAt(x, y) { build(); const i = cellOf(x, y); return i < 0 || !subR[i] ? null : AREAS[subR[i] - 1].id; },
    grid() { build(); return { G, GW, GH, land, ground, blk, sub: subR, ids: AREAS.map((a) => a.id) }; },
    outline: OUTLINE, sound: SOUND, extraLand, massif: MASSIF, landmarkFoot: LM_FOOT,
    findPath, smoothPath, simplifyLOS,
    util: { rng, hash, inPoly, fillPoly, stampEllipse, stampRect, stampLine, bboxOf, wobble, dist },
    version: 3,
  };
  root.WorldLayout = LAYOUT;
  if (typeof module !== 'undefined' && module.exports) module.exports = LAYOUT;
})(typeof window !== 'undefined' ? window : globalThis);
