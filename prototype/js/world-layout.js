// World layout: the geography of the compact, structured overworld (see docs/WORLD_SPEC.md).
// Pure data + deterministic generation (no randomness at runtime, no DOM), so it also runs under node.
// Provides: map size, camp, the 20 sub-areas (shape, landmark, entry, boss, elites, spots, poi), the terrain
// features that map.js paints (rivers, bridges, cliffs, ridges, lakes, groves, tree walls, roads, ruins ...) and blocked(x,y).
// Extras for the renderer / tools: isLand, groundAt (biome index into BIOMES), subAt (sub-area id under a point),
// grid() (the 20-unit rasters), findPath (A* on a 40-unit grid around blocked ground), outline / sound / extraLand.
//
// Scale: a 6720 x 5980 world on a ~1000-unit lattice of walled "rooms" (sub-areas, ring radius ~440). Their monster spots sit on a
// 3x3 lattice 320 units apart around the landmark; at the default exploration zoom a 390x844 phone shows ~400x866 world units
// (about 400x520 above the bottom sheet), i.e. about 2 monsters at a time.
(function (root) {
  'use strict';
  const KW = 0.84;   // the whole design (drawn on a 1200-unit pitch) is compressed by this factor; sizes of props / lattices are not
  const MAP_W = 6720, MAP_H = 5980;
  const G = 20, GW = MAP_W / G, GH = Math.ceil(MAP_H / G);       // fine raster (walk / land / ground)

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
  // Each sub-area is a walled "room" about 1050 units across (ring radius RR) on a 1200-unit lattice. Its 8 spots sit on a 3x3
  // lattice (SP = 320 apart) around the landmark in the middle. Rings of cliffs / tree lines / rivers / ridges bound every room, with
  // gates only where the unlock route (and a few passes) leave it; roads link the spots, the gates and the neighbouring rooms.
  const REGIONS = ['Greenvale', 'Azure Coast', 'Sunscorch', 'Frostveil', 'Ember Peaks'];
  const RR = 525 * KW, SP = 320, STUB = 440 * KW, GATE = 106, LS = 0.89;   // LS scales the local frame of the lattice / recipes (spots end up ~285 apart)
  const COL = { A: 850 * KW, B: 2050 * KW, C: 3350 * KW, D: 4550 * KW, E: 5850 * KW, F: 7050 * KW }, ROW = [850 * KW, 2050 * KW, 3250 * KW, 4450 * KW, 5650 * KW];
  const CAMP = { x: Math.round(4550 * KW), y: Math.round(6450 * KW) };
  // dir = unit vector from the area's centre toward the previous area (where the hero arrives from); to = where the boss should lie toward.
  const AREAS = [
    { id: 'meadow', reg: 0, cx: COL.D, cy: ROW[4], dir: [0, 1], to: [COL.C, ROW[4]], lm: ['hill', 'Blossom Hill', 84], poi: 1 },
    { id: 'forest', reg: 0, cx: COL.C, cy: ROW[4], dir: [1, 0], to: [COL.C, ROW[3]], lm: ['oak-grove', 'The Elder Oak', 86], poi: 1 },
    { id: 'bamboo', reg: 0, cx: COL.C, cy: ROW[3], dir: [0, 1], to: [COL.D, ROW[3]], lm: ['bamboo-grove', 'Whispering Bamboo', 84], poi: 1 },
    { id: 'lake', reg: 0, cx: COL.D, cy: ROW[3], dir: [-1, 0], to: [COL.E, ROW[3]], lm: ['lake', 'Mirror Lake', 104], poi: 1 },
    { id: 'beach', reg: 1, cx: COL.B, cy: ROW[3], dir: [1, 0], to: [COL.A, ROW[3]], lm: ['lighthouse', 'Pearl Lighthouse', 88], poi: 1 },
    { id: 'coral', reg: 1, cx: COL.A, cy: ROW[3], dir: [1, 0], to: [COL.A, ROW[2]], lm: ['reef-arch', 'Coral Arch', 86], poi: 0 },
    { id: 'cove', reg: 1, cx: COL.A, cy: ROW[2], dir: [0, 1], to: [COL.B, ROW[2]], lm: ['shipwreck', 'The Wrecked Galleon', 86], poi: 1 },
    { id: 'isles', reg: 1, cx: COL.B, cy: ROW[2], dir: [-1, 0], to: [COL.B, ROW[1]], lm: ['sea-stacks', 'The Mist Pillars', 86], poi: 1 },
    { id: 'dunes', reg: 2, cx: COL.E, cy: ROW[3], dir: [-1, 0], to: [COL.F, ROW[3]], lm: ['giant-dune', 'Singing Dune', 88], poi: 1 },
    { id: 'oasis', reg: 2, cx: COL.F, cy: ROW[3], dir: [-1, 0], to: [COL.F, ROW[2]], lm: ['oasis', 'Mirage Pool', 88], poi: 1 },
    { id: 'canyon', reg: 2, cx: COL.F, cy: ROW[2], dir: [0, 1], to: [COL.E, ROW[2]], lm: ['mesa', 'Crimson Mesa', 86], poi: 1 },
    { id: 'temple', reg: 2, cx: COL.E, cy: ROW[2], dir: [1, 0], to: [COL.E, ROW[1]], lm: ['pyramid', 'The Sunken Pyramid', 90], poi: 1 },
    { id: 'snow', reg: 3, cx: COL.B, cy: ROW[1], dir: [0, 1], to: [COL.A, ROW[1]], lm: ['ice-peak', 'Whitecap Peak', 84], poi: 0 },
    { id: 'frozen', reg: 3, cx: COL.A, cy: ROW[1], dir: [1, 0], to: [COL.A, ROW[0]], lm: ['frozen-lake', 'Glass Lake', 88], poi: 1 },
    { id: 'rime', reg: 3, cx: COL.A, cy: ROW[0], dir: [0, 1], to: [COL.B, ROW[0]], lm: ['ice-forest', 'The Crystal Pines', 84], poi: 1 },
    { id: 'glacier', reg: 3, cx: COL.B, cy: ROW[0], dir: [-1, 0], to: [2900 * KW, 1300 * KW], lm: ['ice-palace', 'Glacier Throne', 88], poi: 1 },
    { id: 'ash', reg: 4, cx: COL.E, cy: ROW[1], dir: [0, 1], to: [COL.F, ROW[1]], lm: ['burnt-grove', 'The Cinder Grove', 84], poi: 1 },
    { id: 'ridge', reg: 4, cx: COL.F, cy: ROW[1], dir: [-1, 0], to: [COL.F, ROW[0]], lm: ['obsidian-ridge', 'The Glass Ridge', 86], poi: 0 },
    { id: 'lavafall', reg: 4, cx: COL.F, cy: ROW[0], dir: [0, 1], to: [COL.E, ROW[0]], lm: ['lava-falls', 'Ember Falls', 88], poi: 0 },
    { id: 'caldera', reg: 4, cx: COL.E, cy: ROW[0], dir: [1, 0], to: [5000 * KW, 1300 * KW], lm: ['volcano', 'Mount Ember', 90], poi: 1 },
  ];
  const AREA_BY = Object.fromEntries(AREAS.map((a) => [a.id, a]));
  // [from, to]: the unlock / travel links (each area has exactly one link in which it is the 'to'); gates open where they cross a ring
  const LINKS = [['camp', 'meadow'], ['meadow', 'forest'], ['forest', 'bamboo'], ['bamboo', 'lake'], ['bamboo', 'beach'], ['lake', 'dunes'], ['beach', 'coral'], ['coral', 'cove'], ['cove', 'isles'], ['isles', 'snow'],
    ['snow', 'frozen'], ['frozen', 'rime'], ['rime', 'glacier'], ['dunes', 'oasis'], ['oasis', 'canyon'], ['canyon', 'temple'], ['temple', 'ash'], ['ash', 'ridge'], ['ridge', 'lavafall'], ['lavafall', 'caldera']];
  // Landmark footprints (blocked): [dx, dy, rx, ry] in landmark painter units, scaled by k = rx/58*1.1. null = walkable.
  const LM_FOOT = {
    'hill': [[0, 16, 40, 8]], 'oak-grove': [[0, 12, 24, 10]], 'bamboo-grove': [[0, 8, 30, 10]], lake: [[0, 0, 62, 42]], lighthouse: [[8, 20, 66, 18]], 'reef-arch': [[-52, 12, 16, 10], [52, 12, 16, 10]],
    shipwreck: [[0, 6, 62, 22]], 'giant-dune': [[0, 8, 46, 12]], oasis: [[0, 3, 66, 31]], pyramid: [[0, 6, 60, 26]], 'ice-peak': [[0, 10, 62, 22]], 'frozen-lake': null, 'ice-forest': null, 'burnt-grove': null,
    'obsidian-ridge': [[0, 22, 74, 12]], volcano: [[-14, 12, 66, 20]], 'sea-stacks': [[0, 8, 70, 26]], mesa: [[0, 6, 70, 24]], 'ice-palace': [[0, 8, 64, 22]], 'lava-falls': [[0, 12, 66, 26]],
  };
  const SLOT = { a0: [-SP, SP], a1: [0, SP], a2: [SP, SP], b0: [-SP, 0], b2: [SP, 0], c0: [-SP, -SP], c1: [0, -SP], c2: [SP, -SP] };
  const VARS = [
    { spots: ['a1', 'a0', 'a2', 'b0', 'b2'], elite: ['c0'], boss: 'c1', poi: 'c2' },
    { spots: ['a1', 'a2', 'a0', 'b2', 'b0'], elite: ['c2'], boss: 'c1', poi: 'c0' },
    { spots: ['a0', 'a1', 'a2', 'b0', 'c0'], elite: ['b2'], boss: 'c2', poi: 'c1' },
    { spots: ['a2', 'a1', 'a0', 'b2', 'c2'], elite: ['b0'], boss: 'c0', poi: 'c1' },
  ];

  for (const A of AREAS) {
    const ex = A.dir[0], ey = A.dir[1], px0 = ey, py0 = -ex;
    const want = [A.to[0] - A.cx, A.to[1] - A.cy], wl = Math.hypot(want[0], want[1]) || 1;
    let best = null;
    for (let v = 0; v < VARS.length; v++) for (const mir of [1, -1]) {
      const s = SLOT[VARS[v].boss], lx = s[0] * mir, ly = s[1];
      const dx = lx * px0 + ly * ex, dy = lx * py0 + ly * ey, sc = (dx * want[0] + dy * want[1]) / (Math.hypot(dx, dy) * wl) + ((hash(A.id + v + mir) % 100) / 100) * 0.02;
      if (!best || sc > best.sc) best = { v, mir, sc };
    }
    A.variant = best.v; A.mir = best.mir;
    const px = px0 * A.mir, py = py0 * A.mir;
    A.p = (lx, ly) => [A.cx + LS * (lx * px + ly * ex), A.cy + LS * (lx * py + ly * ey)];
    A.pp = (arr) => arr.map((q) => A.p(q[0], q[1]));
    A.rot = Math.atan2(py, px);
    A.ports = [];
  }
  // gates + entries from the links
  const centerOf = (id) => (id === 'camp' ? [CAMP.x, CAMP.y - 130 * KW] : [AREA_BY[id].cx, AREA_BY[id].cy]);
  const LINK_INFO = [];
  for (const [a, b] of LINKS) {
    const ca = centerOf(a), cb = centerOf(b), d = Math.hypot(cb[0] - ca[0], cb[1] - ca[1]), ax = [(cb[0] - ca[0]) / d, (cb[1] - ca[1]) / d], pe = [-ax[1], ax[0]], off = (hash(a + b) % 2 ? 150 : -150) * KW;
    const B = AREA_BY[b], Aa = AREA_BY[a];
    const info = { a, b, ax, pe, off };
    if (Aa) { const g = [Aa.cx + ax[0] * RR + pe[0] * off, Aa.cy + ax[1] * RR + pe[1] * off], s = [Aa.cx + ax[0] * STUB + pe[0] * off, Aa.cy + ax[1] * STUB + pe[1] * off]; Aa.ports.push({ g: R2(g), stub: R2(s), to: b, n: ax }); info.sa = R2(s); }
    const g = [B.cx - ax[0] * RR + pe[0] * off, B.cy - ax[1] * RR + pe[1] * off], s = [B.cx - ax[0] * STUB + pe[0] * off, B.cy - ax[1] * STUB + pe[1] * off];
    B.ports.push({ g: R2(g), stub: R2(s), to: a, entry: true, n: [-ax[0], -ax[1]] }); B.entry = R2(s); info.sb = R2(s); info.gb = R2(g);
    LINK_INFO.push(info);
  }
  // extra passes that open onto the central massif
  const KP = (p) => R2([p[0] * KW, p[1] * KW]);
  AREA_BY.lake.ports.push({ g: KP([4400, 3925]), stub: KP([4400, 4010]), to: 'massif' });
  AREA_BY.snow.ports.push({ g: KP([2575, 1900]), stub: KP([2490, 1900]), to: 'massif' });
  AREA_BY.ash.ports.push({ g: KP([5325, 1900]), stub: KP([5410, 1900]), to: 'massif' });

  // Sub-area shapes (the land the area owns; used for fog, hit tests and the ground colour)
  for (const A of AREAS) {
    const sh = A.id === 'isles' ? ellipsePoly(A.cx, A.cy, 540 * KW, 530 * KW, 'shape:isles', 0.03, 44) : blobShape(A.cx, A.cy, 545 * KW, 545 * KW, 'shape:' + A.id, 0.05, 60);
    A.shape = sh.map(R2);
  }

  // ---------- nodes: spots, elites, boss, poi, entry, landmark ----------
  for (const A of AREAS) {
    const R = rng('slots:' + A.id), V = VARS[A.variant], J = () => (R() - 0.5) * 64;
    const slot = (name) => { const s = SLOT[name]; return R2(A.p(s[0] + J(), s[1] + J())); };
    const lmJ = [(R() - 0.5) * 30, (R() - 0.5) * 30];
    const lm = A.lm, lmr = lm[2] * 0.8, k = lmr / 58 * 1.1;
    A.landmark = { x: rnd(A.cx + lmJ[0]), y: rnd(A.cy + lmJ[1]), rx: lmr, ry: Math.round(lmr * 0.62), kind: lm[0], label: lm[1], k };
    A.boss = slot(V.boss);
    A.elites = V.elite.map(slot);
    A.spots = V.spots.map(slot).sort((a, b) => dist(a, A.entry) - dist(b, A.entry));
    A.poiP = A.poi ? slot(V.poi) : null;
  }
  const PLACED = [];   // every position that must stay walkable: [x, y, r]
  for (const A of AREAS) { for (const p of [A.boss, ...A.elites, ...A.spots, A.poiP, A.entry]) if (p) PLACED.push([p[0], p[1], 46]); for (const q of A.ports) PLACED.push([q.stub[0], q.stub[1], 30]); }
  PLACED.push([CAMP.x, CAMP.y, 50]);

  // ---------- continent ----------
  const OUTLINE_RAW = [
    [260, 420], [340, 230], [800, 170], [1500, 200], [2300, 160], [3100, 210], [3900, 170], [4700, 210], [5500, 170], [6300, 200], [7000, 170], [7600, 230], [7760, 420],
    [7780, 1200], [7740, 2200], [7780, 3200], [7740, 4200], [7770, 4800], [7650, 5140],
    [7200, 5200], [6600, 5130], [6000, 5190], [5500, 5130], [5270, 5170],
    [5240, 5600], [5210, 6200], [5130, 6560], [4800, 6760], [4300, 6800], [3800, 6770], [3300, 6740],
    [2900, 6600], [2710, 6150], [2700, 5500], [2740, 5210],
    [2400, 5190], [1800, 5130], [1200, 5180], [600, 5120], [380, 5040],
    [230, 4400], [260, 3500], [230, 2600], [270, 1700], [240, 900],
  ];
  const OUTLINE = orient(wobble(OUTLINE_RAW.map((p) => [p[0] * KW, p[1] * KW]), 130, 34, 'coast').map(R2), 1);
  const SOUND = orient(ellipsePoly(COL.B, ROW[2], 545 * KW, 535 * KW, 'sound', 0.04, 44).map(R2), -1);   // the inland Mist Sea (a hole)
  const MASSIF = [[2660, 360], [3300, 300], [5200, 300], [5250, 700], [5260, 3700], [5100, 3880], [2800, 3880], [2640, 3700]].map((p) => [p[0] * KW, p[1] * KW]);

  let ABS = 1;   // while building the macro geography (absolute design coordinates) positions are compressed by KW
  const FE = [];                          // features
  const add = (f) => (FE.push(f), f);
  const extraLand = [];                   // islands + sandbars (polygons added to the land)
  const ROCKY = [];                       // [x, y, r] patches of bare mountain ground
  function nearestOn(pts, x, y) {
    let best = null;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l)) : 0;
      const qx = a[0] + dx * t, qy = a[1] + dy * t, d = Math.hypot(qx - x, qy - y);
      if (!best || d < best.d) best = { d, x: qx, y: qy, ang: Math.atan2(dy, dx), f: (i + t) / (pts.length - 1) };
    }
    return best;
  }
  const AP = (p) => R2([p[0] * ABS, p[1] * ABS]);
  const river = (pts, w0, w1, style, extra) => add(Object.assign({ k: 'river', pts: pts.map(AP), w0, w1, style: style || 'water' }, extra));
  function bridgeOn(r, x, y, style, w) {
    const n = nearestOn(r.pts, x, y), rw = r.w0 + (r.w1 - r.w0) * n.f;
    return add({ k: 'bridge', x: rnd(n.x), y: rnd(n.y), a: n.ang + Math.PI / 2, len: Math.round(rw + 110), w: w || 36, style: style || 'wood', rw });
  }
  function fordOn(r, x, y) {
    const n = nearestOn(r.pts, x, y), rw = r.w0 + (r.w1 - r.w0) * n.f;
    return add({ k: 'ford', x: rnd(n.x), y: rnd(n.y), a: n.ang + Math.PI / 2, len: Math.round(rw + 100), w: 50 });
  }
  const cliff = (pts, style, h) => add({ k: 'cliff', pts: pts.map(AP), style: style || 'rock', h: h || 34 });
  const ridge = (pts, r, style) => add({ k: 'ridge', pts: pts.map(AP), r, style: style || 'rock' });
  const lake = (x, y, rx, ry, style, rot, walk) => add({ k: 'lake', x: rnd(x * ABS), y: rnd(y * ABS), rx: rx * (ABS < 1 ? 0.85 : 1), ry: ry * (ABS < 1 ? 0.85 : 1), style: style || 'lake', rot: rot || 0, walk: !!walk });
  const mesa = (x, y, rx, ry, h, style) => add({ k: 'mesa', x: rnd(x * ABS), y: rnd(y * ABS), rx, ry, h: h || 70, style: style || 'red' });
  const grove = (x, y, rx, ry, tree, dens) => add({ k: 'grove', x: rnd(x * ABS), y: rnd(y * ABS), rx: rx * (ABS < 1 ? 0.85 : 1), ry: ry * (ABS < 1 ? 0.85 : 1), tree, dens: dens || 1 });
  const ruin = (x, y, kind, s, a) => add({ k: 'ruin', x: rnd(x * ABS), y: rnd(y * ABS), kind, s: s || 1, a: a || 0 });
  const shrine = (x, y, s) => add({ k: 'shrine', x: rnd(x * ABS), y: rnd(y * ABS), s: s || 1 });
  const lanterns = (pts, n) => add({ k: 'lanterns', pts: pts.map(AP), n: n || 6 });
  const field = (x, y, rx, ry, rot, crop) => add({ k: 'field', x: rnd(x * ABS), y: rnd(y * ABS), rx: rx * (ABS < 1 ? 0.85 : 1), ry: ry * (ABS < 1 ? 0.85 : 1), rot: rot || 0, crop: crop || 'rice' });
  const stones = (x, y, r, n) => add({ k: 'stones', x: rnd(x * ABS), y: rnd(y * ABS), r, n: n || 7 });
  const sea = (kind, x, y, s, f) => add({ k: kind, x: rnd(x * ABS), y: rnd(y * ABS), s: s || 1, f: f || 0 });
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
  const wall = (pts, style, o) => add(Object.assign({ k: 'wall', pts: pts.map(R2), style }, o));
  const prop = (x, y, kind, s, a) => add({ k: 'prop', x: rnd(x), y: rnd(y), kind, s: s || 1, a: a || 0 });
  const gateF = (x, y, a, style) => add({ k: 'gate', x: rnd(x), y: rnd(y), a, style });

  // ---------- per-area ring walls: every room is bounded by a ring with gates where the routes leave ----------
  // piece = ['cliff', style, h] | ['ridge', style, r] | ['river', style, w] | ['trees', kind] | ['hedge'] | ['fence'] | ['stone'] | ['reeds'] | ['coral'] | ['stacks'] | ['rocks']
  const RING = {
    meadow: [['hedge'], ['river', 'water', 22], ['trees', 'sakura'], ['fence'], ['trees', 'round']],
    forest: [['trees', 'oak'], ['trees', 'pine'], ['cliff', 'moss', 34], ['trees', 'oak']],
    bamboo: [['trees', 'bamboo'], ['trees', 'bamboo'], ['river', 'water', 22], ['trees', 'bamboo']],
    lake: [['trees', 'willow'], ['river', 'marsh', 26], ['trees', 'round'], ['reeds'], ['trees', 'willow']],
    beach: [['trees', 'palm'], ['cliff', 'sand', 28], ['river', 'tide', 22], ['trees', 'palm'], ['fence']],
    coral: [['coral'], ['stacks'], ['coral'], ['rocks']],
    cove: [['cliff', 'rock', 44], ['cliff', 'rock', 40], ['stacks'], ['cliff', 'rock', 44]],
    dunes: [['cliff', 'sand', 34], ['trees', 'cactus'], ['cliff', 'sand', 30], ['rocks']],
    oasis: [['trees', 'palm'], ['cliff', 'sand', 30], ['trees', 'palm'], ['river', 'water', 22]],
    canyon: [['cliff', 'red', 52], ['ridge', 'red', 52], ['cliff', 'red', 50], ['cliff', 'red', 46]],
    temple: [['stone'], ['cliff', 'sand', 28], ['stone'], ['trees', 'cactus']],
    snow: [['cliff', 'ice', 40], ['trees', 'frost'], ['ridge', 'snow', 52], ['trees', 'frost']],
    frozen: [['cliff', 'ice', 36], ['river', 'crack', 16], ['cliff', 'ice', 36], ['trees', 'frost']],
    rime: [['trees', 'frost'], ['trees', 'crystal'], ['trees', 'frost'], ['cliff', 'ice', 32]],
    glacier: [['cliff', 'ice', 44], ['river', 'crack', 18], ['ridge', 'snow', 52], ['cliff', 'ice', 44]],
    ash: [['trees', 'burnt'], ['river', 'lava', 20], ['cliff', 'ash', 34], ['trees', 'burnt']],
    ridge: [['cliff', 'obsidian', 46], ['trees', 'shard'], ['cliff', 'obsidian', 46], ['ridge', 'ash', 52]],
    lavafall: [['river', 'lava', 26], ['cliff', 'ash', 36], ['river', 'lava', 26], ['trees', 'burnt']],
    caldera: [['ridge', 'ash', 52], ['cliff', 'obsidian', 48], ['river', 'lava', 24], ['ridge', 'ash', 52]],
  };
  const GATE_STYLE = { meadow: 'torii', forest: 'torii', bamboo: 'torii', lake: 'torii', beach: 'posts', coral: 'posts', cove: 'posts', dunes: 'stone', oasis: 'stone', canyon: 'stone', temple: 'stone', snow: 'ice', frozen: 'ice', rime: 'ice', glacier: 'ice', ash: 'obsidian', ridge: 'obsidian', lavafall: 'obsidian', caldera: 'obsidian' };
  function ringWalls(A) {
    const spec = RING[A.id]; if (!spec) return;
    const N = 84, ring = blobShape(A.cx, A.cy, RR, RR, 'shape:' + A.id, 0.05, N).map(R2), gates = A.ports.map((p) => p.g);
    const open = ring.map((p) => gates.some((g) => dist(p, g) < GATE));
    let start = open.indexOf(true), closedLoop = false; if (start < 0) { start = 0; closedLoop = true; }
    const runs = []; let cur = null;
    for (let i = 0; i < N; i++) {
      const idx = (start + i) % N;
      if (open[idx]) { if (cur) { runs.push(cur); cur = null; } } else (cur = cur || []).push(ring[idx]);
    }
    if (cur) runs.push(cur);
    if (closedLoop && runs.length) runs[0].push(runs[0][0]);
    const base = hash(A.id) % spec.length; let ri = 0;
    for (const run of runs) {
      const m = run.length, n = Math.max(1, Math.round(m * 50 / 430));
      for (let i = 0; i < n; i++) {
        const a = Math.floor(i * m / n), b = Math.min(m, Math.floor((i + 1) * m / n) + 1), pts = run.slice(a, b); if (pts.length < 2) continue;
        const pc = spec[(base + ri++) % spec.length];
        if (pc[0] === 'cliff') cliff(pts, pc[1], pc[2]); else if (pc[0] === 'ridge') ridge(pts, pc[2], pc[1]); else if (pc[0] === 'river') river(pts, pc[2], pc[2], pc[1]);
        else if (pc[0] === 'trees') wall(pts, 'trees', { tree: pc[1] }); else wall(pts, pc[0], {});
      }
    }
    for (const p of A.ports) {
      if (p.to === 'massif' || A.id === 'isles') continue;
      gateF(p.g[0], p.g[1], Math.atan2(p.n[0], -p.n[1]), GATE_STYLE[A.id] || 'posts');
    }
  }

  // ---------- macro geography: the central massif, the sea dressing ----------
  function macro() {
    ABS = KW;
    // Great Divide: mountain walls along both sides of the central massif with passes where the west / east regions open onto it
    wallLine('ridge', [2700, 400], [2700, 3850], [1900], { r: 100, style: 'snow', gap: 150, wob: 40 });
    wallLine('ridge', [5240, 400], [5240, 3850], [1900], { r: 100, style: 'ash', gap: 150, wob: 40 });
    wallLine('ridge', [2800, 380], [5150, 380], [], { r: 90, style: 'snow', wob: 40 });
    // the escarpment along the south of the massif with the Skyway pass above Mirror Lake
    wallLine('cliff', [2840, 3850], [5100, 3860], [4400], { style: 'rock', h: 44, gap: 130 });
    // Skyglass tarn with a shrine island, reached by the Skyway
    lake(3950, 960, 470, 230, 'alpine', 0);
    add({ k: 'islet', x: rnd(3950 * KW), y: rnd(940 * KW), r: 52 });
    add({ k: 'bridge', x: rnd(3950 * KW), y: rnd(1160 * KW), a: Math.PI / 2, len: 170, w: 30, style: 'stone', rw: 0 });
    shrine(3950, 912, 1.5);
    ruin(4400, 3700, 'gate', 1.2, 0); torii(4400, 3790, 1.5);
    ruin(3300, 2600, 'columns', 1.1); ruin(4950, 1350, 'tower', 1.1); ruin(3100, 3150, 'hut', 1); ruin(5000, 3200, 'hut', 1); ruin(3350, 1550, 'wall', 1.1, 0.2);
    stones(3200, 1800, 70, 8); stones(4850, 2600, 70, 7); stones(3700, 3500, 60, 6); shrine(4400, 2050, 1.1);
    grove(3150, 2750, 200, 150, 'pine', 1.2); grove(4900, 2800, 170, 140, 'pine', 1.1); grove(3150, 1250, 170, 130, 'pine', 1.2); grove(4850, 1050, 180, 130, 'pine', 1.1);
    grove(3250, 3400, 150, 100, 'sakura', 0.7); grove(5000, 3450, 140, 100, 'round', 0.7); grove(3650, 2250, 130, 110, 'frost', 1);
    ridge([[2950, 1500], [3300, 1650], [3650, 1580]], 80, 'snow'); ridge([[4850, 1700], [4650, 1950], [4900, 2150]], 80, 'ash'); ridge([[3050, 2300], [3350, 2200]], 75, 'rock');
    cliff([[3500, 3050], [3800, 3000], [4100, 3080]], 'rock', 36); cliff([[4600, 2400], [4900, 2330], [5100, 2420]], 'moss', 32);
    lake(3250, 2350, 100, 62, 'alpine', 0.2); lake(5000, 2250, 90, 56, 'alpine', -0.2);
    river([[4100, 2800], [4250, 3050], [4420, 3300]], 20, 24, 'chasm');
    field(3700, 3380, 150, 80, 0.2, 'flower'); field(4750, 3550, 120, 70, -0.2, 'flower');
    for (const [x, y, r] of [[3150, 1500, 200], [4850, 1600, 200], [3100, 2500, 180], [4800, 2300, 200], [3950, 600, 260]]) ROCKY.push([x * KW, y * KW, r * 0.8]);
    shrine(2650, 1900, 1.2); shrine(5290, 1900, 1.2);
    // ocean dressing
    for (const [x, y, s, f] of [[500, 5600, 1.2, 0], [1400, 5800, 1, 1], [2200, 5700, 1.1, 0], [3500, 7000, 1, 1], [5900, 5800, 1.2, 1], [6800, 5900, 1, 0], [7500, 5700, 1.1, 1], [4300, 7050, 1, 0], [150, 3300, 1.1, 1], [3000, 7100, 1, 0]]) sea('boat', x, y, s, f);
    for (const [x, y, s] of [[200, 560, 22], [520, 90, 18], [1400, 80, 22], [2400, 70, 16], [3600, 90, 20], [5000, 80, 18], [140, 1500, 20], [90, 2400, 16], [160, 3700, 20], [6400, 100, 18], [4300, 100, 20]]) sea('floe', x, y, s);
    for (const [x, y, s] of [[6700, 90, 12], [7400, 120, 16], [7700, 60, 10], [7880, 800, 12], [7890, 2000, 14]]) sea('lavarock', x, y, s);
    for (const [x, y, s] of [[120, 4900, 9], [450, 5300, 8], [2100, 5400, 9], [3000, 6800, 9], [5200, 5400, 8], [7500, 5400, 9], [7860, 4500, 8], [100, 3400, 8], [7880, 3300, 9], [2650, 6600, 8]]) sea('stack', x, y, s);
    ABS = 1;
  }
  const torii = (x, y, s) => add({ k: 'torii', x: rnd(x * ABS), y: rnd(y * ABS), s: s || 1.4, a: 0 });

  // ---------- per-area interiors (local frame: x across, y toward the entry; lattice rows at y=-320/0/320, columns at x=-320/0/320) ----------
  const RECIPES = {
    meadow(A) {
      const p = A.p, pp = A.pp;
      const r = river(pp([[-500, -165], [-250, -150], [0, -175], [250, -150], [500, -165]]), 20, 24, 'water');
      bridgeOn(r, ...p(-320, -160), 'wood'); bridgeOn(r, ...p(320, -160), 'stone');
      field(...p(-170, 200), 95, 58, A.rot, 'rice'); grove(...p(175, 200), 85, 62, 'sakura', 0.9); lake(...p(-175, -250), 52, 30, 'pond', A.rot);
      ruin(...p(190, -250), 'hut', 1); lanterns(pp([[0, 460], [0, 360]]), 4);
    },
    forest(A) {
      const p = A.p, pp = A.pp;
      grove(...p(-170, -170), 85, 65, 'pine', 1.3); grove(...p(170, 170), 85, 65, 'oak', 1.3); grove(...p(-170, 170), 70, 55, 'oak', 1.1);
      ruin(...p(175, -175), 'gate', 1.0, A.rot); shrine(...p(0, 440), 0.9); stones(...p(0, -440), 55, 6);
      cliff(pp([[-290, -170], [-180, -140], [-60, -175]]), 'moss', 22);
    },
    bamboo(A) {
      const p = A.p, pp = A.pp;
      const r = river(pp([[-500, 170], [-250, 150], [0, 180], [250, 150], [500, 170]]), 20, 22, 'water');
      bridgeOn(r, ...p(-320, 160), 'wood'); bridgeOn(r, ...p(320, 160), 'stone');
      grove(...p(-170, -170), 85, 62, 'bamboo', 1.5); grove(...p(170, -170), 85, 62, 'bamboo', 1.5);
      field(...p(-175, 250), 80, 46, A.rot, 'tea'); shrine(...p(185, 250), 0.9); lanterns(pp([[0, 460], [0, 340]]), 4);
    },
    lake(A) {
      const p = A.p, pp = A.pp;
      grove(...p(-190, 190), 75, 55, 'willow', 0.9); grove(...p(190, 190), 75, 55, 'round', 0.9); lake(...p(-190, -190), 62, 40, 'marsh', A.rot);
      ruin(...p(190, -190), 'hut', 1.0); stones(...p(0, -440), 55, 6); shrine(...p(0, 440), 0.9);
    },
    beach(A) {
      const p = A.p, pp = A.pp;
      const r = river(pp([[-500, -165], [-250, -150], [0, -175], [250, -150], [500, -165]]), 16, 18, 'tide');
      bridgeOn(r, ...p(-320, -160), 'wood'); bridgeOn(r, ...p(320, -160), 'wood');
      grove(...p(175, 190), 80, 58, 'palm', 1.1); lake(...p(-175, 195), 66, 40, 'tide', A.rot); ruin(...p(-190, -250), 'village', 0.8, A.rot); stones(...p(190, -250), 50, 5);
      lanterns(pp([[0, 460], [0, 360]]), 3);
      add({ k: 'jetty', x: rnd(2140 * KW), y: rnd(5085 * KW), a: Math.PI / 2 });
    },
    coral(A) {
      const p = A.p;
      for (const [x, y] of [[-165, -165], [165, -165], [-165, 165], [165, 165]]) { lake(...p(x, y), 92, 72, 'deep', A.rot); add({ k: 'reef', x: rnd(p(x, y)[0]), y: rnd(p(x, y)[1]), rx: 76, ry: 56 }); }
      for (const [x, y] of [[0, -170], [0, 170], [-170, 0], [170, 0]]) sea('shell', ...p(x, y), 1, 0);
    },
    cove(A) {
      const p = A.p, pp = A.pp;
      cliff(pp([[-480, -170], [-380, -150], [-250, -190]]), 'rock', 34); cliff(pp([[200, -170], [330, -150], [480, -180]]), 'rock', 34);
      lake(...p(-175, 195), 78, 48, 'tide', A.rot); lake(...p(175, -200), 56, 36, 'tide', A.rot);
      ruin(...p(190, 195), 'hut', 0.9); stones(...p(-190, -250), 50, 5); grove(...p(0, 440), 70, 40, 'palm', 0.7);
    },
    isles(A) { islesRecipe(A); },
    dunes(A) {
      const p = A.p, pp = A.pp;
      const r = river(pp([[-170, -500], [-150, -250], [-190, 0], [-150, 250], [-170, 500]]), 30, 34, 'dry');
      fordOn(r, ...p(-170, -320)); fordOn(r, ...p(-170, 320));
      ruin(...p(190, 190), 'nomad', 1.0, A.rot); grove(...p(190, -190), 80, 56, 'cactus', 0.9); grove(...p(-290, 200), 60, 40, 'cactus', 0.8); ruin(...p(-250, -190), 'columns', 0.9); stones(...p(0, 440), 50, 5);
    },
    oasis(A) {
      const p = A.p;
      lake(...p(-185, -185), 70, 44, 'oasis', A.rot); lake(...p(185, 185), 62, 40, 'oasis', A.rot); grove(...p(185, -185), 80, 55, 'palm', 1.2); grove(...p(-185, 185), 80, 55, 'palm', 1.2);
      ruin(...p(0, 440), 'columns', 0.9); ruin(...p(0, -440), 'nomad', 0.9, A.rot);
    },
    canyon(A) {
      const p = A.p, pp = A.pp;
      const c = river(pp([[-500, -170], [-250, -150], [0, -180], [250, -150], [500, -170]]), 24, 24, 'chasm'); bridgeOn(c, ...p(-320, -160), 'rope', 34); bridgeOn(c, ...p(320, -160), 'rope', 34);
      mesa(...p(-175, 215), 85, 54, 70); mesa(...p(185, 215), 80, 50, 62); mesa(...p(185, -260), 60, 38, 46);
      ruin(...p(-190, -260), 'columns', 0.9); stones(...p(0, -450), 50, 5);
    },
    temple(A) {
      const p = A.p, pp = A.pp;
      for (const t of [0.2, 0.55]) ruin(...p(-70, 450 - 250 * t), 'statue', 1.0, 0);
      ruin(...p(190, -190), 'wall', 1.1, A.rot); ruin(...p(-190, -190), 'obelisk', 1.1); ruin(...p(-190, 190), 'columns', 1.2); ruin(...p(190, 190), 'hall', 0.9, A.rot);
      cliff(pp([[-100, -440], [0, -420], [100, -445]]), 'sand', 22);
    },
    snow(A) {
      const p = A.p, pp = A.pp;
      grove(...p(-180, 190), 80, 58, 'frost', 1.4); grove(...p(185, -185), 80, 58, 'frost', 1.3); shrine(...p(185, 195), 0.9); lake(...p(-185, -185), 55, 34, 'ice', A.rot);
      stones(...p(0, 440), 55, 6); cliff(pp([[-300, -170], [-190, -150], [-90, -180]]), 'ice', 26);
    },
    frozen(A) {
      const p = A.p, pp = A.pp;
      const c1 = river(pp([[-500, -170], [-250, -150], [0, -180], [250, -150], [500, -170]]), 14, 14, 'crack');
      bridgeOn(c1, ...p(-320, -160), 'ice', 40); bridgeOn(c1, ...p(320, -160), 'ice', 40);
      lake(...p(-175, 195), 78, 46, 'hole', A.rot); lake(...p(180, 190), 55, 34, 'hole', A.rot); ruin(...p(-190, -255), 'hut', 0.9); grove(...p(190, -255), 55, 36, 'frost', 0.8);
    },
    rime(A) {
      const p = A.p;
      grove(...p(-175, -175), 90, 62, 'frost', 1.8); grove(...p(175, -175), 90, 62, 'crystal', 1.3); grove(...p(-175, 175), 90, 62, 'crystal', 1.3); grove(...p(175, 175), 90, 62, 'frost', 1.8);
      ruin(...p(0, 450), 'hall', 1.0, A.rot); stones(...p(0, -440), 50, 5);
    },
    glacier(A) {
      const p = A.p, pp = A.pp;
      const c = river(pp([[-500, -170], [-250, -150], [0, -180], [250, -150], [500, -170]]), 16, 16, 'crack');
      bridgeOn(c, ...p(-320, -160), 'ice', 42); bridgeOn(c, ...p(320, -160), 'ice', 42);
      grove(...p(-185, 190), 75, 55, 'frost', 1); grove(...p(185, 190), 75, 55, 'crystal', 1); lake(...p(-185, -255), 55, 34, 'ice', A.rot); stones(...p(185, -255), 50, 5);
      sea('berg', 1400 * KW, 130 * KW, 1.3); sea('berg', 2700 * KW, 100 * KW, 1.1);
    },
    ash(A) {
      const p = A.p, pp = A.pp;
      const c = river(pp([[-500, -170], [-250, -150], [0, -180], [250, -150], [500, -170]]), 18, 20, 'lava');
      bridgeOn(c, ...p(-320, -160), 'obsidian', 38); bridgeOn(c, ...p(320, -160), 'obsidian', 38);
      grove(...p(-185, 190), 80, 56, 'burnt', 1.2); grove(...p(185, 190), 75, 52, 'burnt', 1.0); ruin(...p(-190, -255), 'hut', 0.9); grove(...p(190, -255), 55, 38, 'burnt', 0.9);
    },
    ridge(A) {
      const p = A.p, pp = A.pp;
      const c = river(pp([[-500, 170], [-250, 150], [0, 180], [250, 150], [500, 170]]), 16, 18, 'lava');
      bridgeOn(c, ...p(-320, 160), 'obsidian', 36); bridgeOn(c, ...p(320, 160), 'obsidian', 36);
      grove(...p(-185, -190), 80, 56, 'shard', 1.2); grove(...p(185, -190), 80, 56, 'shard', 1.0); lake(...p(185, 255), 52, 32, 'lava', A.rot); stones(...p(-190, 255), 50, 5);
    },
    lavafall(A) {
      const p = A.p, pp = A.pp;
      const c = river(pp([[-500, 170], [-250, 150], [0, 180], [250, 150], [500, 170]]), 26, 30, 'lava');
      bridgeOn(c, ...p(-320, 160), 'obsidian', 40); bridgeOn(c, ...p(320, 160), 'obsidian', 40);
      lake(...p(-185, -190), 78, 50, 'lava', A.rot); lake(...p(185, -190), 66, 44, 'lava', A.rot); grove(...p(0, 440), 60, 40, 'burnt', 0.7); ruin(...p(-190, 255), 'tower', 0.9);
    },
    caldera(A) {
      const p = A.p, pp = A.pp, L = A.landmark;
      const r = river(pp([[-500, -170], [-250, -150], [0, -180], [250, -150], [500, -170]]), 22, 26, 'lava');
      bridgeOn(r, ...p(-320, -160), 'obsidian', 38); bridgeOn(r, ...p(320, -160), 'obsidian', 38);
      lake(...p(-185, 190), 66, 42, 'lava', A.rot); lake(...p(185, 190), 66, 42, 'lava', A.rot); grove(...p(0, 440), 60, 40, 'burnt', 0.8); stones(...p(0, -440), 50, 5);
      river([[L.x + 30, L.y + 80], [L.x + 80, L.y + 150], [L.x + 70, L.y + 190]], 12, 16, 'lava');
    },
  };

  // Mist Isles: an inland sea with an island under every spot, linked by sandbars and rope bridges
  function islesRecipe(A) {
    const nodes = [A.entry, ...A.spots, ...A.elites, A.boss].concat(A.poiP ? [A.poiP] : []);
    const L = A.landmark, islands = [];
    const isl = (p, rx, ry, name, tag) => { const poly = orient(ellipsePoly(p[0], p[1], rx, ry, 'isle:' + name, 0.12, 24).map(R2), 1); extraLand.push({ poly, biome: 'isles' }); islands.push({ p, rx, ry, tag }); return poly; };
    nodes.forEach((p, i) => (p === A.entry ? isl(p, 72, 52, 'n' + i, i) : isl(p, p === A.boss ? 150 : 105, p === A.boss ? 100 : 76, 'n' + i, i)));
    isl([L.x, L.y + 10], 140, 90, 'lm', 'lm');
    const rest = islands.slice(1), order = [islands[0]];
    while (rest.length) { const last = order[order.length - 1]; rest.sort((a, b) => dist(a.p, last.p) - dist(b.p, last.p)); order.push(rest.shift()); }
    const link = (a, b, i) => {
      const d = dist(a.p, b.p), ux = (b.p[0] - a.p[0]) / d, uy = (b.p[1] - a.p[1]) / d, bridge = i % 2 === 1 && d > 270;
      if (!bridge) { extraLand.push({ poly: orient(strip(a.p, b.p, 62, 'bar' + i).map(R2), 1), biome: 'isles' }); return; }
      const ra = 1 / Math.hypot(ux / a.rx, uy / a.ry) * 0.7, rb = 1 / Math.hypot(ux / b.rx, uy / b.ry) * 0.7;
      const s = [a.p[0] + ux * ra, a.p[1] + uy * ra], e = [b.p[0] - ux * rb, b.p[1] - uy * rb];
      add({ k: 'bridge', x: rnd((s[0] + e[0]) / 2), y: rnd((s[1] + e[1]) / 2), a: Math.atan2(uy, ux), len: Math.round(dist(s, e)), w: 30, style: 'rope', rw: 0 });
    };
    for (let i = 0; i + 1 < order.length; i++) link(order[i], order[i + 1], i);
    const lmI = islands[islands.length - 1];
    for (const isle of islands) { if (isle === lmI) continue; const near = islands.filter((o) => o !== isle).sort((a, b) => dist(a.p, isle.p) - dist(b.p, isle.p))[0]; if (dist(near.p, isle.p) < 420 && isle.tag !== 'lm') extraLand.push({ poly: orient(strip(isle.p, near.p, 58, 'loop' + isle.tag).map(R2), 1), biome: 'isles' }); }
    for (const l of LINK_INFO) {
      if (l.b === 'isles') { const G = AREA_BY[l.a].ports.find((q) => q.to === 'isles').g; extraLand.push({ poly: orient(strip(A.entry, G, 62, 'cove').map(R2), 1), biome: 'isles' }); }
      if (l.a === 'isles') { const G = AREA_BY.snow.ports.find((q) => q.to === 'isles').g, nearI = islands.slice().sort((p, q) => dist(p.p, G) - dist(q.p, G))[0]; extraLand.push({ poly: orient(strip(nearI.p, G, 62, 'snowlink').map(R2), 1), biome: 'isles' }); }
    }
    sea('boat', A.cx - 300, A.cy + 480, 0.9, 0); sea('stack', L.x - 190, L.y - 150, 10); sea('stack', L.x + 200, L.y + 150, 9); sea('stack', A.cx + 470, A.cy + 360, 8); sea('stack', A.cx - 480, A.cy - 340, 8);
  }

  // props scattered next to the spots: signposts, crates, wells, bones ...
  const PROPS = { meadow: ['sign', 'hay', 'well', 'crates'], forest: ['sign', 'stump', 'crates'], bamboo: ['sign', 'well', 'crates'], lake: ['sign', 'crates', 'boatprop'], beach: ['sign', 'crates', 'boatprop', 'barrel'], coral: ['barrel', 'crates'], cove: ['crates', 'barrel', 'bones', 'sign'],
    isles: ['barrel'], dunes: ['bones', 'crates', 'sign'], oasis: ['sign', 'crates', 'well'], canyon: ['bones', 'sign', 'crates'], temple: ['bones', 'crates'], snow: ['sign', 'crates', 'stump'], frozen: ['crates', 'sign'], rime: ['sign', 'stump'], glacier: ['crates', 'bones'],
    ash: ['bones', 'sign', 'crates'], ridge: ['crates', 'bones'], lavafall: ['sign', 'bones'], caldera: ['bones', 'sign'] };
  function placeProps(A) {
    const kinds = PROPS[A.id] || ['crates'], R = rng('props:' + A.id), nodes = [A.entry, ...A.spots, ...A.elites, A.boss];
    nodes.forEach((n, i) => {
      if (i === 0) { prop(n[0] + (R() < 0.5 ? -48 : 48), n[1] + 16, 'sign', 1); return; }
      if (R() < 0.45) { const a = R() * 6.28, kd = kinds[Math.floor(R() * kinds.length)]; prop(n[0] + Math.cos(a) * 66, n[1] + Math.sin(a) * 30 + 12, kd, 0.9 + R() * 0.3, a); }
    });
  }

  // ---------- build ----------
  let built = false, roads = [];
  const WALL_R = { trees: 21, hedge: 15, fence: 8, stone: 12, reeds: 14, coral: 19, stacks: 22, rocks: 17 };
  function build() {
    if (built) return; built = true;
    macro();
    for (const A of AREAS) { RECIPES[A.id](A); ringWalls(A); placeProps(A); }
    // --- land raster ---
    fillPoly(land, OUTLINE, 1);
    fillPoly(land, SOUND, 0);
    for (const e of extraLand) fillPoly(land, e.poly, 1);
    // --- ground biome raster: nearest-site influence, then the massif, then sub-area shapes ---
    const sites = AREAS.map((A) => [A.cx, A.cy, BIO[A.id]]);
    for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
      const i = gy * GW + gx; if (!land[i]) continue;
      const X0 = (gx + 0.5) * G, Y0 = (gy + 0.5) * G, x = X0 + 90 * Math.sin(Y0 / 270 + X0 / 1100) + 50 * Math.sin(Y0 / 120 + 1), y = Y0 + 90 * Math.sin(X0 / 310 + 2) + 50 * Math.sin(X0 / 140); let bd = 1e18, bi = 1;
      for (const s of sites) { const d = (s[0] - x) * (s[0] - x) + (s[1] - y) * (s[1] - y); if (d < bd) { bd = d; bi = s[2]; } }
      ground[i] = bi;
    }
    fillPoly(ground, MASSIF, BIO.high);
    for (const [x, y, r] of ROCKY) stampEllipse(ground, x, y, r, r * 0.7, BIO.mtn);
    for (const f of FE) if (f.k === 'ridge') stampLine(ground, f.pts, f.r * 1.2, BIO.mtn);
    AREAS.forEach((A, k) => { fillPoly(subR, A.shape, k + 1); if (A.id !== 'isles') fillPoly(ground, A.shape, BIO[A.id]); });
    for (const e of extraLand) fillPoly(ground, e.poly, BIO[e.biome]);
    for (let i = 0; i < GW * GH; i++) if (!land[i]) ground[i] = 0;
    // --- blocked raster ---
    for (let i = 0; i < GW * GH; i++) blk[i] = land[i] ? 0 : 1;
    for (const f of FE) {
      if (f.k === 'river') { if (f.style === 'dry') continue; const wd = f.style === 'crack' ? 8 : 0; stampLine(blk, f.pts, (t) => (f.w0 + (f.w1 - f.w0) * t) / 2 + 6 + wd, 1); }
      else if (f.k === 'cliff') stampLine(blk, f.pts, 15, 1);
      else if (f.k === 'ridge') stampLine(blk, f.pts, f.r * 0.85, 1);
      else if (f.k === 'wall') stampLine(blk, f.pts, WALL_R[f.style] || 14, 1);
      else if (f.k === 'lake') { if (!f.walk) stampEllipse(blk, f.x, f.y, f.rx + 8, f.ry + 8, 1, f.rot); }
      else if (f.k === 'mesa') stampEllipse(blk, f.x, f.y, f.rx, f.ry, 1);
    }
    for (const A of AREAS) { const L = A.landmark, foot = LM_FOOT[L.kind]; if (foot) for (const [dx, dy, rx, ry] of foot) stampEllipse(blk, L.x + dx * L.k, L.y + dy * L.k, rx * L.k, ry * L.k, 1); }
    for (const f of FE) {
      if (f.k === 'bridge') stampRect(blk, f.x, f.y, f.len, Math.max(60, f.w + 24), f.a, 0);
      else if (f.k === 'ford') stampRect(blk, f.x, f.y, f.len, Math.max(70, f.w + 20), f.a, 0);
    }
    // the camp, spots and gates keep a small walkable clearing (checked against the design in tools)
    LAYOUT.violations = [];
    for (const [x, y, r] of PLACED) { const i = cellOf(x, y); if (i < 0 || blk[i]) LAYOUT.violations.push([x, y]); stampEllipse(blk, x, y, r, r * 0.8, 0); }
    // gates are always open
    for (const A of AREAS) for (const q of A.ports) stampEllipse(blk, q.g[0], q.g[1], 62, 62, 0);
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


  // ---------- roads and trails (A* between the spots of each area, the gates, and between areas) ----------
  function makeRoads() {
    const densify = (P) => { const o = [P[0]]; for (let i = 0; i + 1 < P.length; i++) { const a = P[i], b = P[i + 1], m = Math.max(1, Math.ceil(dist(a, b) / 120)); for (let k = 1; k <= m; k++) o.push([a[0] + (b[0] - a[0]) * k / m, a[1] + (b[1] - a[1]) * k / m]); } return o; };
    const add2 = (a, b, style, w, name) => {
      let P = findPath(a[0], a[1], b[0], b[1], { limit: 60000 }); if (!P) { LAYOUT.roadFails.push([a, b, name]); return null; }
      P = smoothPath(simplifyLOS(P).length > 1 ? densify(simplifyLOS(P)) : P, 2);
      roads.push({ k: 'road', pts: P.map(R2), w, style, name }); return P;
    };
    LAYOUT.roadFails = [];
    const STYLE = { meadow: 'dirt', forest: 'dirt', bamboo: 'stone', lake: 'plank', beach: 'plank', coral: 'sand', cove: 'plank', isles: null, dunes: 'sand', oasis: 'sand', canyon: 'sand', temple: 'stone', snow: 'snow', frozen: 'snow', rime: 'snow', glacier: 'snow', ash: 'ash', ridge: 'ash', lavafall: 'ash', caldera: 'ash' };
    // links between rooms: stub to stub through the gates
    for (const l of LINK_INFO) {
      const A0 = l.a === 'camp' ? [CAMP.x, CAMP.y] : l.sa;
      add2(A0, l.sb, 'main', 24, 'road');
    }
    // up the Skyway onto the massif
    const sky = [[4400, 4010], [4400, 3600], [4260, 3150], [4400, 2600], [4400, 2050], [4250, 1600], [3950, 1260]].map((p) => [p[0] * KW, p[1] * KW]);
    for (let i = 0; i + 1 < sky.length; i++) add2(sky[i], sky[i + 1], 'main', 22, 'skyway');
    add2([2490 * KW, 1900 * KW], [4400 * KW, 2050 * KW], 'main', 20, 'pass'); add2([5410 * KW, 1900 * KW], [4400 * KW, 2050 * KW], 'main', 20, 'pass');
    for (const A of AREAS) {
      const st = STYLE[A.id]; if (!st) continue;
      const nodes = [...A.spots, ...A.elites, A.boss].concat(A.poiP ? [A.poiP] : []);
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) if (dist(nodes[i], nodes[j]) < 430) add2(nodes[i], nodes[j], st, 12, 'trail');
      for (const q of A.ports) { const near = nodes.concat([]).sort((p, r) => dist(p, q.stub) - dist(r, q.stub)); add2(q.stub, near[0], st, 12, 'trail'); if (dist(near[1], q.stub) < 330) add2(q.stub, near[1], st, 12, 'trail'); }
      const L = A.landmark, near = nodes.slice().sort((p, q) => dist(p, [L.x, L.y]) - dist(q, [L.x, L.y]))[0], d = dist(near, [L.x, L.y]), tgt = [L.x + (near[0] - L.x) / d * (L.rx * 1.3 + 24), L.y + (near[1] - L.y) / d * (L.ry * 1.9 + 34)];
      add2(near, tgt, st, 9, 'spur');
    }
  }

  // ---------- public API ----------
  const subareas = {};
  for (const A of AREAS) {
    const sh = A.shape, b = bboxOf(sh);
    subareas[A.id] = {
      bounds: b.map(rnd), shape: sh, landmark: A.landmark, entry: A.entry, boss: A.boss, elites: A.elites, spots: A.spots, poi: A.poiP,
      region: REGIONS[A.reg], regionIndex: A.reg, center: [A.cx, A.cy], gates: A.ports.map((q) => q.g),
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
    version: 4,
  };
  // WP13: extra non-battle spots (a Shop and an Event per sub-area). Found on rings around the area centre: on walkable ground inside the
  // area's own shape, at least 150 from every other node, the landmark and the gates, and reachable from the entry (findPath).
  // Deterministic (own rng stream), so the existing node positions are untouched. Computed lazily on first read.
  const EXTRA = {};
  function placeExtras(id) {
    const A = AREA_BY[id], out = { shop: null, event: null, wp: null, secret: null }, R = rng('extras:' + id);
    const taken = [A.boss, ...A.elites, ...A.spots, A.entry].concat(A.poiP ? [A.poiP] : []);
    const L = A.landmark;
    let gap = 150;
    const clear = (p) => taken.every((q) => dist(p, q) >= gap) && A.ports.every((q) => dist(p, q.stub) >= 110) && dist(p, [L.x, L.y]) >= Math.max(L.rx, L.ry) * 1.5 + 60;
    // WP14: 'wp' (a waypoint shrine) is sought on a ring around the entry gate, 'secret' (a hidden cache) far from everything, off the trails.
    for (const kind of ['shop', 'event', 'wp', 'secret']) {
      let best = null;
      for (let t = 0; t < 900 && !best; t++) {
        gap = kind === 'secret' ? (t < 450 ? 160 : t < 700 ? 130 : 105) : t < 300 ? 150 : t < 600 ? 125 : 105;
        const ang = R() * 6.2832, rad = kind === 'wp' ? 90 + R() * 200 : 110 + R() * 380, cx = kind === 'wp' ? A.entry[0] : A.cx, cy = kind === 'wp' ? A.entry[1] : A.cy;
        const p = R2([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]);
        if (LAYOUT.subAt(p[0], p[1]) !== id || LAYOUT.blocked(p[0], p[1]) || !clear(p)) continue;
        // keep the 60 units around it walkable too, so the marker is not wedged against a cliff
        if ([[60, 0], [-60, 0], [0, 60], [0, -60]].some((d) => LAYOUT.blocked(p[0] + d[0], p[1] + d[1]))) continue;
        if (!LAYOUT.findPath(A.entry[0], A.entry[1], p[0], p[1], { limit: 40000 })) continue;
        best = p;
      }
      out[kind] = best; if (best) taken.push(best);
    }
    return out;
  }
  for (const id of Object.keys(subareas)) {
    for (const kind of ['shop', 'event', 'wp', 'secret']) Object.defineProperty(subareas[id], kind, { enumerable: true, get() { return (EXTRA[id] || (EXTRA[id] = placeExtras(id)))[kind]; } });
  }
  root.WorldLayout = LAYOUT;
  if (typeof module !== 'undefined' && module.exports) module.exports = LAYOUT;
})(typeof window !== 'undefined' ? window : globalThis);
