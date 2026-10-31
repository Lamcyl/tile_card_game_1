// World map renderer, Japanese watercolour theme: a free-roam exploration map.
// The whole world is painted once to an offscreen canvas (washes, brush-mark
// trees, mist); every frame only draws that bitmap plus cheap animated layers
// (rivers, weather, footprints, monsters standing on danger rings, fog, hero).
// An overview mode zooms out to the whole world for fast travel.
(function () {
  'use strict';
  const World = window.World;
  const canvas = document.getElementById('map');
  const ctx = canvas.getContext('2d');
  const VIEW = 400;      // world units across the screen width when exploring
  const FOCUS_Y = 0.36;  // focused points sit this far down the screen, above the bottom sheet
  const EXT = 560;       // extra sea painted below the map so the south edge can scroll above the sheet
  const LO = 0.9, MID = 0.45;   // scales of the two zoomed-out terrain copies
  const HERO_OFF = { x: 20, y: 14 }; // the hero stands beside a node, not on the monster

  const INK = '#2b3445', PAPER = '#f4ecd7', VERM = '#c8402f', INDIGO = '#3d5a80';

  let vw = 0, vh = 0, dpr = 1, TS = 2;
  let zIn = 1, zOv = 0.4;            // zoom when exploring / in overview
  let z = 1, vx = 0, vy = 0;         // effective zoom and view centre this frame
  let terrain = null, terrainLo = null, terrainMid = null;
  const cam = { x: World.CAMP.x, y: World.CAMP.y - 200 };
  let follow = null;                 // {x, y} the camera eases toward
  let st = { save: null, run: null, frontier: new Set(), selected: null };
  const fogA = {};                   // per sub-area fog opacity, animated
  const token = { x: World.CAMP.x + HERO_OFF.x, y: World.CAMP.y + HERO_OFF.y, walk: null, face: 1, stride: 0 };
  const prints = [];                 // fading footprints
  let dest = null;                   // free-roam destination mark
  let onTap = () => {};
  let active = true;
  let T = 0;
  let ovOn = false, ovT = 0;         // overview target and animated progress 0..1
  let ovBtn = null;

  // ---------- Small helpers ----------
  const R0 = World.rng;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const hit = document.createElement('canvas').getContext('2d');
  const rgbCache = {};
  function rgb(hex) {
    if (rgbCache[hex]) return rgbCache[hex];
    const n = parseInt(hex.slice(1), 16);
    return (rgbCache[hex] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]);
  }
  const rgba = (hex, a) => { const c = rgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };

  function blob(seed, b, pad, rough) {
    const R = R0('blob:' + seed);
    const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, rx = (b[2] - b[0]) / 2 + pad, ry = (b[3] - b[1]) / 2 + pad;
    const n = 56, raw = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      const k = 1 + (R() - 0.5) * rough;
      raw.push([cx + rx * Math.sign(c) * Math.pow(Math.abs(c), 0.45) * k, cy + ry * Math.sign(s) * Math.pow(Math.abs(s), 0.45) * k]);
    }
    const pts = raw.map((p, i) => { const a = raw[(i + n - 1) % n], c = raw[(i + 1) % n]; return [(a[0] + p[0] * 2 + c[0]) / 4, (a[1] + p[1] * 2 + c[1]) / 4]; });
    const path = new Path2D();
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      if (i === 0) path.moveTo(m[0], m[1]); else path.quadraticCurveTo(p[0], p[1], m[0], m[1]);
    }
    const p0 = pts[0], m0 = [(pts[n - 1][0] + p0[0]) / 2, (pts[n - 1][1] + p0[1]) / 2];
    path.quadraticCurveTo(pts[n - 1][0], pts[n - 1][1], m0[0], m0[1]);
    path.closePath();
    return path;
  }
  function segDist(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy;
    const t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0;
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
  }
  const grow = (b, p) => [b[0] - p, b[1] - p, b[2] + p, b[3] + p];

  // Soft round paint sprites: one small canvas per colour, stretched when drawn.
  const blobSprites = {};
  function blobSprite(hex) {
    if (blobSprites[hex]) return blobSprites[hex];
    const s = document.createElement('canvas'); s.width = s.height = 96;
    const g = s.getContext('2d'), gr = g.createRadialGradient(48, 48, 0, 48, 48, 48);
    gr.addColorStop(0, rgba(hex, 1)); gr.addColorStop(0.5, rgba(hex, 0.55)); gr.addColorStop(1, rgba(hex, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 96, 96);
    return (blobSprites[hex] = s);
  }
  function soft(c, x, y, rx, ry, hex, a) {
    c.globalAlpha = a; c.drawImage(blobSprite(hex), x - rx, y - ry, rx * 2, ry * 2); c.globalAlpha = 1;
  }
  // Points along a quadratic curve.
  function quad(x0, y0, cx, cy, x1, y1, n) {
    const out = []; n = n || 8;
    for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]); }
    return out;
  }
  // A tapered brush stroke along points. mode 1 = heavy start fading out.
  function brush(c, pts, w, col, a, mode) {
    const n = pts.length, L = [], Rr = [];
    for (let i = 0; i < n; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)];
      let dx = p1[0] - p0[0], dy = p1[1] - p0[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const t = i / (n - 1), k = mode === 1 ? 1 - t * 0.85 : mode === 2 ? 1 : 0.18 + 0.82 * Math.pow(Math.sin(Math.PI * t), 0.6);
      const hw = (w * k) / 2;
      L.push([pts[i][0] - dy * hw, pts[i][1] + dx * hw]); Rr.push([pts[i][0] + dy * hw, pts[i][1] - dx * hw]);
    }
    c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < n; i++) c.lineTo(L[i][0], L[i][1]);
    for (let i = n - 1; i >= 0; i--) c.lineTo(Rr[i][0], Rr[i][1]);
    c.closePath(); c.fill(); c.globalAlpha = 1;
  }
  const line = (c, x0, y0, x1, y1, w, col, a, bend) => brush(c, quad(x0, y0, (x0 + x1) / 2 + (bend || 0), (y0 + y1) / 2 - Math.abs(bend || 0) * 0.3, x1, y1, 6), w, col, a);

  // ---------- Obstacles for scatter ----------
  const obstacles = [];   // river segments kept clear of scattered decoration
  const zones = [];       // ellipses kept clear of scattered decoration (landmarks, camp)
  const noDecor = [];     // Path2Ds where scattered land decoration must not appear
  // Nodes sit in a coarse grid so decoration tests only look at their neighbours.
  const nodeGrid = {};
  for (const n of World.nodes) { const k = Math.floor(n.x / 64) + ',' + Math.floor(n.y / 64); (nodeGrid[k] = nodeGrid[k] || []).push(n); }
  function clearOfRoutes(x, y, gap, nodeGap) {
    const p = { x, y }, ng = nodeGap || Math.max(gap + 18, 44), cx = Math.floor(x / 64), cy = Math.floor(y / 64), r = Math.ceil((ng + 14) / 64);
    for (let i = cx - r; i <= cx + r; i++) for (let j = cy - r; j <= cy + r; j++) {
      const cell = nodeGrid[i + ',' + j]; if (!cell) continue;
      for (const n of cell) if (Math.hypot(n.x - x, (n.y - 14 - y) * 0.8) < ng) return false;
    }
    for (const z of zones) { const ex = (x - z.x) / z.rx, ey = (y - z.y) / z.ry; if (ex * ex + ey * ey < 1) return false; }
    for (const o of obstacles) if (segDist(p, o[0], o[1]) < o[2] + gap * 0.5) return false;
    if (noDecor.length && x < 470 && y > 1080 && y < 1420) for (const q of noDecor) if (hit.isPointInPath(q, x, y)) return false;
    return true;
  }
  function scatter(seed, path, bounds, count, gap, fn, nodeGap) {
    const R = R0('dec:' + seed), out = [];
    for (let i = 0, tries = 0; i < count && tries < count * 14; tries++) {
      const x = bounds[0] + R() * (bounds[2] - bounds[0]), y = bounds[1] + R() * (bounds[3] - bounds[1]);
      if (!clearOfRoutes(x, y, gap, nodeGap)) continue;
      if (path && !hit.isPointInPath(path, x, y)) continue;
      out.push({ x, y, r: R(), q: R() }); i++;
    }
    out.sort((a, b) => a.y - b.y).forEach((p) => fn(p));
  }

  // ---------- Watercolour palette ----------
  // Ground wash per sub-area (base = main pigment, mid = light pooling, dark = shadow pooling, band = shore colour).
  const PAL = {
    meadow:  { base: '#b9d184', mid: '#d9e6a6', dark: '#93b36a', band: '#e3ecba' },
    forest:  { base: '#7fa06c', mid: '#a1bb84', dark: '#557c5c', band: '#c4d4a2' },
    lake:    { base: '#9cc28c', mid: '#bfd8a6', dark: '#6b9a78', band: '#d3e3b6' },
    beach:   { base: '#efdbaa', mid: '#f7ebc9', dark: '#e0c188', band: '#f8efd2' },
    cove:    { base: '#d6c8aa', mid: '#e6dcc3', dark: '#aa9c84', band: '#e9dfc6' },
    dunes:   { base: '#ecc27a', mid: '#f4d99e', dark: '#d4a258', band: '#f4dfae' },
    oasis:   { base: '#e8c880', mid: '#f1daa0', dark: '#c9a35a', band: '#f4e2b4' },
    temple:  { base: '#dcae78', mid: '#ebc99a', dark: '#bc8658', band: '#efd7ae' },
    snow:    { base: '#e3edf2', mid: '#f8fbfb', dark: '#b3c8d8', band: '#f6fafb' },
    frozen:  { base: '#c4dfeb', mid: '#e2f1f5', dark: '#8fb6d0', band: '#e8f4f8' },
    rime:    { base: '#d2d9ec', mid: '#ecf0f8', dark: '#a3b0d2', band: '#eef2f9' },
    ash:     { base: '#a29790', mid: '#bfb4ab', dark: '#766b68', band: '#8d827c' },
    ridge:   { base: '#585369', mid: '#767089', dark: '#3a3648', band: '#5c566a' },
    caldera: { base: '#7e5650', mid: '#9d746c', dark: '#483231', band: '#6a4a46' },
    mtn:     { base: '#a7b3cb', mid: '#c9d1e1', dark: '#7a88aa', band: '#cfd6e4' },
  };
  const SEA = '#a9c6cb';
  const LANDBASE = '#ece6cc';
  const MOUNTAINS = [[425, 860, 575, 1600], [440, 130, 560, 840]];
  // Rivers: [points, width at the source, width at the mouth]
  const RIVERS = [
    { pts: [[190, 2118], [250, 2112], [330, 2120], [405, 2124], [470, 2116], [540, 2122], [620, 2116], [700, 2122], [790, 2112]], w0: 30, w1: 30 },
    { pts: [[498, 905], [474, 960], [510, 1030], [482, 1110], [516, 1200], [490, 1300], [506, 1400], [498, 1500], [504, 1570], [502, 1622]], w0: 14, w1: 30 },
  ];
  const BRIDGE = { x: 500, y: 2118 };
  const MARSH = { x: 504, y: 1630, rx: 40, ry: 11 };    // where the mountain river ends, above Mirror Lake
  const landPaths = {};   // walkable ground per sub-area
  let lagoonPath = null;
  const islandPaths = [];
  const water = [];       // animated sea glints
  const riverPaths = [];  // {path, pts} for animated flow
  const lava = [];        // animated lava polylines
  const ponds = [];       // water that cannot be walked on: ellipses {x, y, rx, ry}
  const sparks = [];      // animated landmark glints {x, y, ph, kind, sub}

  function paperTexture() {
    const s = document.createElement('canvas'); s.width = s.height = 384;
    const g = s.getContext('2d'), R = R0('paper');
    for (let i = 0; i < 700; i++) {
      const x = R() * 384, y = R() * 384, a = R() * 6.28, l = 3 + R() * 9;
      g.strokeStyle = 'rgba(' + (R() > 0.5 ? '120,95,60' : '255,250,235') + ',' + (0.05 + R() * 0.07) + ')'; g.lineWidth = 0.6 + R() * 0.6;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    for (let i = 0; i < 1800; i++) { g.fillStyle = 'rgba(' + (R() > 0.5 ? '110,90,60' : '255,255,255') + ',' + (0.04 + R() * 0.06) + ')'; g.fillRect(R() * 384, R() * 384, 1 + R() * 1.4, 1 + R() * 1.4); }
    return s;
  }

  // ----- Small painting primitives -----
  const ell = (c, x, y, rx, ry, col, a, rot) => { c.globalAlpha = a === undefined ? 1 : a; c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, 7); c.fill(); c.globalAlpha = 1; };
  const dot = (c, x, y, r, col, a) => ell(c, x, y, r, r, col, a);
  const poly = (c, pts, col, a) => { c.globalAlpha = a === undefined ? 1 : a; c.fillStyle = col; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); c.globalAlpha = 1; };
  const outline = (c, pts, col, w, a, close) => { c.globalAlpha = a === undefined ? 1 : a; c.strokeStyle = col; c.lineWidth = w; c.lineJoin = 'round'; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); if (close) c.closePath(); c.stroke(); c.globalAlpha = 1; };
  function bez(a, b, d, e, n) { const o = []; n = n || 10; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * d[0] + t * t * t * e[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * d[1] + t * t * t * e[1]]); } return o; }
  // A ribbon along points whose width eases from w0 to w1.
  function ribbon(c, pts, w0, w1, col, a) {
    const n = pts.length, L = [], Rr = [];
    for (let i = 0; i < n; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)];
      let dx = p1[0] - p0[0], dy = p1[1] - p0[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const hw = (w0 + (w1 - w0) * i / (n - 1)) / 2;
      L.push([pts[i][0] - dy * hw, pts[i][1] + dx * hw]); Rr.push([pts[i][0] + dy * hw, pts[i][1] - dx * hw]);
    }
    c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < n; i++) c.lineTo(L[i][0], L[i][1]);
    for (let i = n - 1; i >= 0; i--) c.lineTo(Rr[i][0], Rr[i][1]);
    c.closePath(); c.fill(); c.globalAlpha = 1;
  }
  const smooth = (pts, k) => { const sm = []; for (let i = 0; i < pts.length - 1; i++) sm.push(...quad(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2 + (i % 2 ? k : -k), (pts[i][1] + pts[i + 1][1]) / 2, pts[i + 1][0], pts[i + 1][1], 6)); return sm; };
  const ellHit = (e, x, y, m) => { const ex = (x - e.x) / (e.rx + (m || 0)), ey = (y - e.y) / (e.ry + (m || 0)); return ex * ex + ey * ey < 1; };

  // ----- Brush-mark decorations -----
  function pine(c, x, y, s, p, col, hi, cap) {
    soft(c, x + s * 0.3, y + 1, s * 1.0, s * 0.3, '#2e3b30', 0.2);
    brush(c, [[x, y + 1], [x + 0.4, y - s * 1.0]], Math.max(1.4, s * 0.2), '#4b3b30', 0.85, 2);
    const tiers = 4;
    for (let i = 0; i < tiers; i++) {
      const t = i / (tiers - 1), by = y - s * 0.5 - i * s * 0.72, hw = s * (1.05 - 0.62 * t) * (0.92 + p.q * 0.16), ty = by - s * 1.0;
      c.globalAlpha = 0.8; c.fillStyle = col; c.beginPath(); c.moveTo(x, ty);
      c.quadraticCurveTo(x + hw * 0.3, by - s * 0.4, x + hw, by); c.quadraticCurveTo(x + hw * 0.1, by + s * 0.2, x - hw, by); c.quadraticCurveTo(x - hw * 0.3, by - s * 0.4, x, ty); c.fill();
      c.globalAlpha = 0.45; c.fillStyle = hi; c.beginPath(); c.moveTo(x - 0.5, ty + 1); c.quadraticCurveTo(x - hw * 0.3, by - s * 0.4, x - hw * 0.85, by - 1); c.lineTo(x - hw * 0.2, by - s * 0.15); c.fill();
      c.globalAlpha = 1;
      line(c, x - hw * 0.9, by + 0.5, x + hw * 0.9, by + 1, Math.max(1, s * 0.16), INK, 0.35, 1);
      if (cap) { c.globalAlpha = 0.9; c.fillStyle = '#fbfdfd'; c.beginPath(); c.moveTo(x, ty); c.quadraticCurveTo(x + hw * 0.18, by - s * 0.75, x + hw * 0.45, by - s * 0.5); c.quadraticCurveTo(x, by - s * 0.55, x - hw * 0.4, by - s * 0.5); c.quadraticCurveTo(x - hw * 0.18, by - s * 0.75, x, ty); c.fill(); c.globalAlpha = 1; }
    }
  }
  function roundTree(c, x, y, s, p, col, hi) {
    soft(c, x + s * 0.3, y + 1, s * 1.1, s * 0.32, '#2e3b30', 0.2);
    brush(c, [[x, y + 1], [x - 0.5, y - s * 0.9]], Math.max(1.4, s * 0.22), '#5a4636', 0.85, 2);
    soft(c, x, y - s * 1.35, s * 1.15, s * 0.95, col, 0.7);
    soft(c, x - s * 0.35, y - s * 1.6, s * 0.7, s * 0.55, hi, 0.65);
    soft(c, x + s * 0.4, y - s * 1.1, s * 0.6, s * 0.45, '#486a46', 0.35);
  }
  function sakura(c, x, y, s, p) {
    brush(c, quad(x, y + 1, x + 2, y - s * 0.7, x - 1, y - s * 1.3, 5), s * 0.28, '#5a4636', 0.85, 1);
    soft(c, x, y - s * 1.5, s * 1.3, s * 0.95, '#e9b4be', 0.6);
    soft(c, x - s * 0.5, y - s * 1.3, s * 0.8, s * 0.6, '#f3cdd3', 0.65);
    soft(c, x + s * 0.5, y - s * 1.7, s * 0.7, s * 0.55, '#d98a9e', 0.4);
    c.fillStyle = 'rgba(255,245,245,.85)';
    for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(x + (((p.r * 97 + i * 37) % 100) / 100 - 0.5) * s * 2.2, y - s * (1.1 + ((i * 53) % 10) / 14), 0.9, 0, 7); c.fill(); }
  }
  function bamboo(c, x, y, s, p) {
    const n = 5 + Math.floor(p.q * 4);
    for (let i = 0; i < n; i++) {
      const bx = x + (i - n / 2) * 4.2 + (((i * 31) % 7) - 3) * 0.5, h = s * (2.8 + ((i * 17) % 10) / 6), tilt = (((i * 13) % 5) - 2) * 0.8;
      brush(c, [[bx, y], [bx + tilt, y - h]], 2.6, i % 2 ? '#a9c47c' : '#8fb169', 0.85, 2);
      c.strokeStyle = rgba(INK, 0.4); c.lineWidth = 0.7;
      for (let k = 1; k < 5; k++) { const ty = y - h * k / 5; c.beginPath(); c.moveTo(bx + tilt * k / 5 - 1.4, ty); c.lineTo(bx + tilt * k / 5 + 1.4, ty); c.stroke(); }
      for (let k = 0; k < 3; k++) line(c, bx + tilt, y - h + k * 4, bx + tilt + (k % 2 ? 9 : -9), y - h + 6 + k * 4, 2.2, '#5d8a4c', 0.7, 0);
    }
  }
  function palm(c, x, y, s) {
    soft(c, x + 4, y + 1, s * 0.9, s * 0.25, '#6a5a3a', 0.2);
    const top = [x + 3, y - s * 1.5];
    brush(c, quad(x, y, x + 5, y - s * 0.8, top[0], top[1], 6), 3, '#7a5b3a', 0.9, 1);
    for (const a of [-2.8, -2.2, -1.5, -0.8, -0.2, 0.1]) {
      const ex = top[0] + Math.cos(a) * s * 1.0, ey = top[1] + Math.sin(a) * s * 0.35 + s * 0.45;
      brush(c, quad(top[0], top[1], top[0] + Math.cos(a) * s * 0.6, top[1] - s * 0.4, ex, ey, 6), 3.4, '#4f8f56', 0.85);
    }
  }
  function cactus(c, x, y, s) {
    soft(c, x + 2, y + 1, s * 0.6, s * 0.2, '#7a6a3a', 0.2);
    brush(c, [[x, y], [x, y - s * 1.6]], 4.5, '#6a9a58', 0.9, 2);
    brush(c, quad(x, y - s * 0.6, x - s * 0.7, y - s * 0.6, x - s * 0.7, y - s * 1.1, 4), 3, '#6a9a58', 0.9, 2);
    brush(c, quad(x, y - s * 0.9, x + s * 0.7, y - s * 0.9, x + s * 0.7, y - s * 1.3, 4), 3, '#6a9a58', 0.9, 2);
    line(c, x - 1.2, y, x - 1.2, y - s * 1.5, 0.9, INK, 0.3, 0);
  }
  function rock(c, x, y, s, col, hi) {
    soft(c, x + 2, y + 1, s * 1.1, s * 0.3, '#2a2a2a', 0.2);
    c.globalAlpha = 0.85; c.fillStyle = col; c.beginPath(); c.moveTo(x - s, y); c.lineTo(x - s * 0.6, y - s * 0.8); c.lineTo(x + s * 0.2, y - s * 1.0); c.lineTo(x + s * 0.9, y - s * 0.45); c.lineTo(x + s, y); c.closePath(); c.fill();
    c.globalAlpha = 0.5; c.fillStyle = hi; c.beginPath(); c.moveTo(x - s * 0.6, y - s * 0.8); c.lineTo(x + s * 0.2, y - s * 1.0); c.lineTo(x - s * 0.05, y - s * 0.4); c.lineTo(x - s * 0.7, y - s * 0.2); c.fill();
    c.globalAlpha = 1; c.strokeStyle = rgba(INK, 0.45); c.lineWidth = 0.9; c.beginPath(); c.moveTo(x - s, y); c.lineTo(x - s * 0.6, y - s * 0.8); c.lineTo(x + s * 0.2, y - s * 1.0); c.lineTo(x + s * 0.9, y - s * 0.45); c.lineTo(x + s, y); c.stroke();
  }
  function peak(c, x, y, s, snowy) {
    soft(c, x, y - 2, s * 1.5, s * 0.35, '#e8eef0', 0.5);
    const g = c.createLinearGradient(0, y - s * 1.6, 0, y);
    g.addColorStop(0, 'rgba(86,104,138,.78)'); g.addColorStop(0.65, 'rgba(120,138,164,.5)'); g.addColorStop(1, 'rgba(176,190,204,.1)');
    c.fillStyle = g; c.beginPath(); c.moveTo(x - s, y); c.quadraticCurveTo(x - s * 0.5, y - s * 0.7, x - s * 0.18, y - s * 1.35); c.lineTo(x, y - s * 1.6); c.quadraticCurveTo(x + s * 0.3, y - s * 1.1, x + s * 0.55, y - s * 0.7); c.quadraticCurveTo(x + s * 0.85, y - s * 0.3, x + s, y); c.closePath(); c.fill();
    c.globalAlpha = 0.28; c.fillStyle = '#35466a'; c.beginPath(); c.moveTo(x, y - s * 1.6); c.quadraticCurveTo(x + s * 0.3, y - s * 1.1, x + s * 0.55, y - s * 0.7); c.quadraticCurveTo(x + s * 0.85, y - s * 0.3, x + s, y); c.lineTo(x + s * 0.2, y); c.quadraticCurveTo(x + s * 0.15, y - s * 0.7, x, y - s * 1.6); c.fill(); c.globalAlpha = 1;
    brush(c, quad(x - s * 0.18, y - s * 1.35, x - s * 0.5, y - s * 0.7, x - s * 0.95, y - s * 0.05, 6), 1.6, INK, 0.5);
    brush(c, quad(x, y - s * 1.6, x + s * 0.1, y - s * 1.0, x + s * 0.2, y - s * 0.3, 6), 1.4, INK, 0.35);
    if (snowy) { c.globalAlpha = 0.9; c.fillStyle = '#fbfdfd'; c.beginPath(); c.moveTo(x, y - s * 1.6); c.lineTo(x - s * 0.18, y - s * 1.35); c.lineTo(x - s * 0.3, y - s * 1.0); c.lineTo(x - s * 0.1, y - s * 1.1); c.lineTo(x + s * 0.05, y - s * 0.95); c.lineTo(x + s * 0.18, y - s * 1.12); c.lineTo(x + s * 0.4, y - s * 0.85); c.quadraticCurveTo(x + s * 0.3, y - s * 1.1, x, y - s * 1.6); c.fill(); c.globalAlpha = 1; }
  }
  function torii(c, x, y, s) {
    const col = '#c8402f';
    brush(c, [[x - s * 0.62, y], [x - s * 0.6, y - s * 1.0]], s * 0.1, col, 0.85, 2);
    brush(c, [[x + s * 0.62, y], [x + s * 0.6, y - s * 1.0]], s * 0.1, col, 0.85, 2);
    brush(c, quad(x - s * 0.82, y - s * 1.12, x, y - s * 0.98, x + s * 0.82, y - s * 1.12, 8), s * 0.13, '#2b2530', 0.85, 2);
    brush(c, quad(x - s * 0.7, y - s * 0.84, x, y - s * 0.82, x + s * 0.7, y - s * 0.84, 8), s * 0.07, col, 0.85, 2);
  }
  const curve = (pts) => { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) { const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; p.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); } p.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); return p; };

  // ----- More brush-mark decorations -----
  const hex2 = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  const mixh = (a, b, t) => { const A = rgb(a), B = rgb(b); return '#' + hex2(A[0] + (B[0] - A[0]) * t) + hex2(A[1] + (B[1] - A[1]) * t) + hex2(A[2] + (B[2] - A[2]) * t); };
  function tuft(c, x, y, s, col, a) { for (const d of [-3, 0, 3]) line(c, x + d, y, x + d * 1.8, y - s - Math.abs(d) * 0.4, 1.5, col, a || 0.6, d); }
  function reed(c, x, y, s) {
    for (let i = -1; i <= 1; i++) brush(c, quad(x + i * 3, y, x + i * 3 + i * 2, y - s * 0.6, x + i * 5 + i * 3, y - s * (0.85 + (i + 1) * 0.1), 5), 1.8, '#6d8f4e', 0.85, 2);
    brush(c, [[x + 0.5, y - s * 0.5], [x + 1, y - s * 1.05]], 3.2, '#7a5a3a', 0.9, 2);
  }
  function willow(c, x, y, s) {
    soft(c, x + s * 0.3, y + 1, s * 1.2, s * 0.3, '#2e3b30', 0.2);
    brush(c, quad(x, y + 1, x - 2, y - s * 0.7, x + 1, y - s * 1.2, 5), s * 0.26, '#5a4636', 0.85, 1);
    soft(c, x, y - s * 1.45, s * 1.15, s * 0.7, '#8fb878', 0.6);
    for (let i = -3; i <= 3; i++) brush(c, quad(x + i * s * 0.3, y - s * 1.55, x + i * s * 0.4, y - s * 0.9, x + i * s * 0.42 + (i % 2), y - s * (0.2 + (i * i % 3) * 0.12), 5), 1.7, i % 2 ? '#7aa768' : '#9bc484', 0.7, 1);
  }
  function mpeak(c, x, y, s, t, snowy) {
    const top = mixh('#9aa8c8', '#4c5f93', t), bot = mixh('#d6dcea', '#a5b1cf', t);
    soft(c, x, y - 2, s * 1.5, s * 0.3, '#f0f2f7', 0.5);
    const g = c.createLinearGradient(0, y - s * 1.6, 0, y);
    g.addColorStop(0, rgba(top, 0.86)); g.addColorStop(0.6, rgba(mixh(top, bot, 0.5), 0.6)); g.addColorStop(1, rgba(bot, 0.1));
    c.fillStyle = g; c.beginPath(); c.moveTo(x - s, y); c.quadraticCurveTo(x - s * 0.55, y - s * 0.7, x - s * 0.2, y - s * 1.35); c.lineTo(x, y - s * 1.6); c.quadraticCurveTo(x + s * 0.3, y - s * 1.1, x + s * 0.55, y - s * 0.7); c.quadraticCurveTo(x + s * 0.85, y - s * 0.3, x + s, y); c.closePath(); c.fill();
    c.globalAlpha = 0.26; c.fillStyle = '#2f3f6a'; c.beginPath(); c.moveTo(x, y - s * 1.6); c.quadraticCurveTo(x + s * 0.3, y - s * 1.1, x + s * 0.55, y - s * 0.7); c.quadraticCurveTo(x + s * 0.85, y - s * 0.3, x + s, y); c.lineTo(x + s * 0.2, y); c.quadraticCurveTo(x + s * 0.12, y - s * 0.7, x, y - s * 1.6); c.fill(); c.globalAlpha = 1;
    brush(c, quad(x - s * 0.2, y - s * 1.35, x - s * 0.5, y - s * 0.7, x - s * 0.9, y - s * 0.08, 6), 1.3 + t * 0.6, INK, 0.28 + t * 0.25);
    brush(c, quad(x, y - s * 1.6, x + s * 0.1, y - s * 1.0, x + s * 0.2, y - s * 0.3, 6), 1.2, INK, 0.2 + t * 0.2);
    if (snowy) { c.globalAlpha = 0.92; c.fillStyle = '#fbfdfd'; c.beginPath(); c.moveTo(x, y - s * 1.6); c.lineTo(x - s * 0.2, y - s * 1.35); c.lineTo(x - s * 0.3, y - s * 1.02); c.lineTo(x - s * 0.1, y - s * 1.12); c.lineTo(x + s * 0.05, y - s * 0.96); c.lineTo(x + s * 0.18, y - s * 1.12); c.lineTo(x + s * 0.4, y - s * 0.85); c.quadraticCurveTo(x + s * 0.3, y - s * 1.1, x, y - s * 1.6); c.fill(); c.globalAlpha = 1; }
    soft(c, x, y - s * 0.12, s * 1.1, s * 0.2, '#f2f4f8', 0.55);
  }
  function sailboat(c, x, y, s, flip) {
    c.save(); c.translate(x, y); c.scale(flip ? -s : s, s);
    soft(c, 0, 3, 15, 3.5, '#2a4a60', 0.25);
    poly(c, [[-12, -2], [-8, 3], [8, 3], [13, -3]], '#6b4a30', 0.92);
    brush(c, [[0, -3], [0.4, -27]], 1.5, '#4a3a2e', 0.9, 2);
    c.fillStyle = '#f6efdc'; c.beginPath(); c.moveTo(1.5, -26); c.quadraticCurveTo(11, -17, 9.5, -5); c.lineTo(1.5, -5); c.closePath(); c.fill();
    c.fillStyle = '#ebdfc2'; c.beginPath(); c.moveTo(-1, -24); c.quadraticCurveTo(-8, -14, -9, -6); c.lineTo(-1, -6); c.closePath(); c.fill();
    c.strokeStyle = rgba(INK, 0.55); c.lineWidth = 0.9; c.beginPath(); c.moveTo(1.5, -26); c.quadraticCurveTo(11, -17, 9.5, -5); c.lineTo(1.5, -5); c.moveTo(-1, -24); c.quadraticCurveTo(-8, -14, -9, -6); c.lineTo(-1, -6); c.stroke();
    c.fillStyle = VERM; c.fillRect(-0.4, -30, 4, 2.4);
    c.restore();
    line(c, x - 18 * s, y + 5 * s, x + 18 * s, y + 5 * s, 1.2, '#ffffff', 0.7, 2);
  }
  function floe(c, x, y, s) {
    soft(c, x + 2, y + 3, s * 1.3, s * 0.4, '#5d86ab', 0.25);
    const pts = []; for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283; pts.push([x + Math.cos(a) * s * (0.8 + ((i * 37) % 5) / 12), y + Math.sin(a) * s * 0.42 * (0.8 + ((i * 53) % 5) / 12)]); }
    poly(c, pts, '#f4fafc', 0.95); outline(c, pts, '#7aa0bc', 1, 0.6, true);
    line(c, x - s * 0.4, y - 1, x + s * 0.2, y - 2, 1.2, '#b7d2e2', 0.8, 0);
  }
  function frostPine(c, x, y, s, a) {
    soft(c, x + s * 0.3, y + 1, s * 1.0, s * 0.3, '#5d6f94', 0.22);
    brush(c, [[x, y + 1], [x, y - s * 0.9]], Math.max(1.4, s * 0.18), '#6a5a66', 0.8, 2);
    for (let i = 0; i < 4; i++) {
      const t = i / 3, by = y - s * 0.5 - i * s * 0.72, hw = s * (1.0 - 0.6 * t), ty = by - s * 0.95;
      c.globalAlpha = a || 0.9; c.fillStyle = mixh('#b4d2e6', '#e6f2fa', t); c.beginPath(); c.moveTo(x, ty); c.quadraticCurveTo(x + hw * 0.3, by - s * 0.4, x + hw, by); c.quadraticCurveTo(x, by + s * 0.22, x - hw, by); c.quadraticCurveTo(x - hw * 0.3, by - s * 0.4, x, ty); c.fill();
      c.globalAlpha = 0.4; c.fillStyle = '#7f78b8'; c.beginPath(); c.moveTo(x + 0.5, ty + 1); c.quadraticCurveTo(x + hw * 0.3, by - s * 0.4, x + hw * 0.9, by - 0.5); c.lineTo(x + hw * 0.1, by - s * 0.1); c.fill();
      c.globalAlpha = 1; line(c, x - hw * 0.9, by + 0.5, x + hw * 0.9, by + 1, Math.max(0.9, s * 0.12), '#4a5e8c', 0.4, 1);
    }
    c.fillStyle = '#ffffff'; c.globalAlpha = 0.95; c.beginPath(); c.moveTo(x, y - s * 3.4); c.lineTo(x + 1.3, y - s * 3.4 + 4); c.lineTo(x - 1.3, y - s * 3.4 + 4); c.fill(); c.globalAlpha = 1;
  }
  function sparkle(c, x, y, s, col, a) {
    c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s * 0.2, y - s * 0.2); c.lineTo(x + s, y); c.lineTo(x + s * 0.2, y + s * 0.2); c.lineTo(x, y + s); c.lineTo(x - s * 0.2, y + s * 0.2); c.lineTo(x - s, y); c.lineTo(x - s * 0.2, y - s * 0.2); c.closePath(); c.fill(); c.globalAlpha = 1;
  }
  function burnt(c, x, y, s, glow) {
    soft(c, x + 3, y + 1, s * 0.9, s * 0.25, '#1a1412', 0.35);
    brush(c, quad(x, y + 1, x + 1, y - s * 0.6, x - 1, y - s * 1.4, 5), Math.max(2.6, s * 0.28), '#2f2825', 0.92, 1);
    line(c, x, y - s * 0.6, x + s * 0.7, y - s * 1.05, 1.7, '#2f2825', 0.9, 0); line(c, x, y - s * 0.9, x - s * 0.65, y - s * 1.35, 1.6, '#2f2825', 0.9, 0); line(c, x + 0.5, y - s * 1.2, x + s * 0.3, y - s * 1.7, 1.2, '#2f2825', 0.85, 0);
    if (glow) { line(c, x + 1.4, y - 1, x + 1.2, y - s * 0.9, 1, '#f08a35', 0.85, 0); dot(c, x + s * 0.7, y - s * 1.05, 1.4, '#ffb14a', 0.9); }
  }
  function shard(c, x, y, w, h, lean, dark, hi) {
    soft(c, x + 3, y + 1, w * 1.1, w * 0.28, '#120e1c', 0.35);
    const tx = x + lean, ty = y - h;
    poly(c, [[x - w * 0.5, y], [x - w * 0.3, y - h * 0.55], [tx - w * 0.08, ty], [x + w * 0.05, y - h * 0.5], [x + w * 0.5, y]], dark, 0.95);
    poly(c, [[x + w * 0.05, y - h * 0.5], [tx - w * 0.08, ty], [x + w * 0.5, y], [x + w * 0.1, y]], '#1a1626', 0.6);
    poly(c, [[x - w * 0.3, y - h * 0.55], [tx - w * 0.08, ty], [x - w * 0.02, y - h * 0.45], [x - w * 0.34, y - h * 0.08]], hi, 0.5);
    outline(c, [[x - w * 0.5, y], [x - w * 0.3, y - h * 0.55], [tx - w * 0.08, ty], [x + w * 0.05, y - h * 0.5], [x + w * 0.5, y]], '#c8c0ea', 0.9, 0.5, false);
    line(c, tx - w * 0.08, ty, x - w * 0.12, y - h * 0.5, 1, '#e8e2ff', 0.55, 0);
  }
  function lavaPool(c, x, y, rx, ry) {
    soft(c, x, y, rx * 2.0, ry * 2.0, '#ff7a3a', 0.28);
    ell(c, x, y, rx * 1.12, ry * 1.12, '#2a1b1a', 0.8);
    ell(c, x, y, rx, ry, '#c9452a', 0.95); ell(c, x - rx * 0.1, y - ry * 0.1, rx * 0.65, ry * 0.62, '#f08a35', 0.95); ell(c, x - rx * 0.2, y - ry * 0.2, rx * 0.3, ry * 0.3, '#ffd27a', 0.95);
  }
  function crystal(c, x, y, s, col, hi) {
    poly(c, [[x - s * 0.4, y], [x - s * 0.3, y - s * 1.2], [x, y - s * 1.9], [x + s * 0.3, y - s * 1.2], [x + s * 0.4, y]], col, 0.85);
    poly(c, [[x - s * 0.3, y - s * 1.2], [x, y - s * 1.9], [x - s * 0.02, y], [x - s * 0.4, y]], hi, 0.7);
    outline(c, [[x - s * 0.4, y], [x - s * 0.3, y - s * 1.2], [x, y - s * 1.9], [x + s * 0.3, y - s * 1.2], [x + s * 0.4, y]], '#3d5a80', 0.9, 0.5, true);
  }
  function stoneLantern(c, x, y, s) {
    soft(c, x + 2, y + 1, s * 0.8, s * 0.22, '#2b3445', 0.22);
    const g = '#c9ccc6';
    c.fillStyle = g; c.fillRect(x - s * 0.18, y - s * 0.55, s * 0.36, s * 0.55);
    c.fillRect(x - s * 0.34, y - s * 0.62, s * 0.68, s * 0.1);
    c.fillStyle = '#e8c870'; c.fillRect(x - s * 0.22, y - s * 1.0, s * 0.44, s * 0.38);
    c.fillStyle = '#b9bdb7'; c.beginPath(); c.moveTo(x - s * 0.5, y - s * 1.0); c.lineTo(x, y - s * 1.3); c.lineTo(x + s * 0.5, y - s * 1.0); c.closePath(); c.fill();
    c.strokeStyle = rgba(INK, 0.55); c.lineWidth = 0.8; c.strokeRect(x - s * 0.22, y - s * 1.0, s * 0.44, s * 0.38); c.beginPath(); c.moveTo(x - s * 0.5, y - s * 1.0); c.lineTo(x, y - s * 1.3); c.lineTo(x + s * 0.5, y - s * 1.0); c.closePath(); c.stroke();
  }
  function inkLabel(c, txt, x, y, px, a) {
    c.save(); c.font = 'italic 600 ' + px + 'px "Hiragino Mincho ProN","Yu Mincho","Shippori Mincho",Georgia,serif'; c.textAlign = 'center'; c.lineJoin = 'round';
    c.globalAlpha = a * 0.9; c.lineWidth = px * 0.3; c.strokeStyle = PAPER; c.strokeText(txt, x, y);
    c.globalAlpha = a; c.fillStyle = INK; c.fillText(txt, x, y);
    c.restore();
  }
  // Wavy sand/snow ripple: a few parallel curves.
  function ripples(c, x, y, w, n, col, a) { for (let i = 0; i < n; i++) brush(c, quad(x - w, y + i * 4.5, x, y + i * 4.5 - 4 - (i % 2) * 2, x + w, y + i * 4.5, 6), 1.2, col, a); }

  // Wash a region of ground: big soft pigment pools, light/dark mottling and back-run blooms.
  function wash(c, p) {
    const b = p.b, pal = p.pal, R = R0('wash2:' + p.id), a = p.a || 0.62, w = b[2] - b[0], h = b[3] - b[1];
    for (let y = b[1] - 16; y < b[3] + 26; y += 42) for (let x = b[0] - 16; x < b[2] + 26; x += 52)
      soft(c, x + (R() - 0.5) * 28, y + (R() - 0.5) * 24, 56 + R() * 30, 42 + R() * 22, pal.base, a);
    const n = Math.round(w * h / 1700);
    for (let i = 0; i < n; i++) soft(c, b[0] + R() * w, b[1] + R() * h, 26 + R() * 60, 16 + R() * 34, R() > 0.5 ? pal.mid : pal.dark, 0.2 + R() * 0.3);
    for (let i = 0; i < n / 6; i++) {
      const bx = b[0] + R() * w, by = b[1] + R() * h, br = 14 + R() * 30;
      c.strokeStyle = rgba(pal.dark, 0.14); c.lineWidth = 2.5; c.beginPath(); c.ellipse(bx, by, br, br * 0.7, R() * 3, 0, 7); c.stroke();
      c.fillStyle = rgba(pal.mid, 0.12); c.fill();
    }
  }
  // ---------- Landmarks: each is painted around (0,0) = landmark centre, in landmark units ----------
  function lmHill(c) {
    soft(c, 6, 20, 104, 24, '#4d6a3a', 0.3);
    const top = -40, g = c.createLinearGradient(0, top, 0, 24);
    g.addColorStop(0, '#d2e895'); g.addColorStop(0.5, '#a6c86a'); g.addColorStop(1, '#6f9a52');
    c.fillStyle = g; c.beginPath(); c.moveTo(-86, 22); c.bezierCurveTo(-62, -2, -40, top, 2, top); c.bezierCurveTo(44, top, 66, -2, 88, 22); c.quadraticCurveTo(0, 34, -86, 22); c.closePath(); c.fill();
    c.globalAlpha = 0.42; c.fillStyle = '#3d6a3a'; c.beginPath(); c.moveTo(2, top); c.bezierCurveTo(44, top, 66, -2, 88, 22); c.quadraticCurveTo(46, 28, 18, 26); c.bezierCurveTo(26, 0, 18, top + 12, 2, top); c.fill(); c.globalAlpha = 1;
    brush(c, bez([-86, 22], [-62, -2], [-40, top], [2, top], 10).concat(bez([2, top], [44, top], [66, -2], [88, 22], 10)), 2.6, INK, 0.65);
    // a pale trodden path winds up the slope
    brush(c, bez([-6, 28], [-22, 14], [14, 2], [2, top + 4], 12), 7, '#f1e6bd', 0.85, 1);
    for (let i = 0; i < 9; i++) tuft(c, -70 + i * 17 + (i % 2) * 6, 10 + (i % 3) * 5 - Math.abs(i - 4) * 4, 5, '#5d8a48', 0.55);
    for (let i = 0; i < 26; i++) dot(c, -60 + ((i * 53) % 120), -4 + ((i * 29) % 22) - Math.abs(((i * 53) % 120) - 60) * 0.18, 1.7, ['#fbf7ea', '#f1c75b', '#e9a1a8', '#b8a3d6'][i % 4], 0.9);
    // lone blossom tree on the crown and a little shrine at its foot
    sakura(c, 6, top + 6, 17, { r: 0.5 });
    torii(c, -52, 22, 24);
    stoneLantern(c, -34, 24, 12);
    for (let i = 0; i < 12; i++) dot(c, -30 + i * 8 + (i % 3) * 3, top + 34 + ((i * 17) % 40), 1.2, '#f6cdd4', 0.85);
  }
  function lmOak(c) {
    soft(c, 0, 16, 92, 20, '#2b3b2a', 0.32);
    // sun shafts through the canopy
    for (const dx of [-30, 2, 34]) brush(c, [[dx - 12, -50], [dx + 20, 22]], 15, '#fff3b0', 0.13, 2);
    // roots and trunk
    poly(c, [[-26, 24], [-14, 8], [-9, -20], [9, -20], [14, 8], [28, 24], [14, 18], [0, 14], [-12, 18]], '#5a4636', 0.96);
    poly(c, [[2, -20], [9, -20], [14, 8], [28, 24], [14, 18], [4, 14]], '#352a22', 0.55);
    for (const y of [-12, -2, 8]) line(c, -8, y, 4, y + 5, 1, '#2d221a', 0.5, 2);
    outline(c, [[-26, 24], [-14, 8], [-9, -20]], INK, 1.2, 0.6); outline(c, [[9, -20], [14, 8], [28, 24]], INK, 1.2, 0.6);
    // shimenawa rope with paper streamers
    brush(c, quad(-12, 0, 0, 4, 13, -1, 6), 3.2, '#efe3c0', 0.95, 2);
    for (const sx of [-7, 0, 7]) { c.fillStyle = '#fbf7ea'; c.globalAlpha = 0.95; c.beginPath(); c.moveTo(sx, 3); c.lineTo(sx + 3, 8); c.lineTo(sx, 12); c.lineTo(sx - 3, 15); c.lineTo(sx - 1, 3); c.fill(); c.globalAlpha = 1; }
    // canopy: scalloped lobes (outline first so only the silhouette shows), shaded, then sunlit
    const lobes = [[-44, -22, 20], [-20, -34, 22], [16, -34, 23], [44, -20, 20], [0, -24, 24], [-28, -10, 17], [30, -8, 17]];
    c.strokeStyle = rgba(INK, 0.6); c.lineWidth = 2.6; for (const [x, y, r] of lobes) { c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke(); }
    c.fillStyle = '#35603f'; for (const [x, y, r] of lobes) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    for (const [x, y, r] of lobes) { ell(c, x - r * 0.1, y - r * 0.14, r * 0.88, r * 0.84, '#5f9a58', 0.96); }
    for (const [x, y, r] of lobes) { ell(c, x - r * 0.3, y - r * 0.38, r * 0.56, r * 0.46, '#9fcf74', 0.9); ell(c, x - r * 0.42, y - r * 0.5, r * 0.26, r * 0.2, '#d8f0a0', 0.8); }
    for (let i = 0; i < 40; i++) { const a = i * 2.4, rr = 12 + (i * 13) % 52; brush(c, [[Math.cos(a) * rr * 1.1 - 3, -26 + Math.sin(a) * rr * 0.5], [Math.cos(a) * rr * 1.1 + 3, -26 + Math.sin(a) * rr * 0.5 - 1.5]], 2, i % 3 ? '#cbe49a' : '#2f5a3e', 0.7, 2); }
    soft(c, 0, -6, 70, 10, '#244a30', 0.35);
    // small acorns oaks and stone lanterns
    roundTree(c, -64, 14, 8, { r: 0.4 }, '#6a9a58', '#9cc474'); roundTree(c, 66, 10, 7, { r: 0.3 }, '#5f9558', '#9cc474'); roundTree(c, -58, -18, 6, { r: 0.3 }, '#5f9558', '#9cc474'); roundTree(c, 58, -22, 6, { r: 0.6 }, '#5f9558', '#9cc474');
    stoneLantern(c, -34, 28, 13); stoneLantern(c, 38, 30, 13);
    for (let i = 0; i < 14; i++) dot(c, -50 + ((i * 41) % 100), 14 + ((i * 17) % 22), 1.3, ['#8a6a3a', '#b88a46', '#d9a050'][i % 3], 0.7);
  }
  function lmLake(c, L) {
    c.scale(0.84, 1);
    soft(c, 0, 6, 110, 60, '#6f9a68', 0.34);
    ell(c, 0, 2, 82, 49, '#d4e4b0', 0.9); ell(c, 0, 2, 76, 45, '#a9c492', 0.75);
    c.save(); c.beginPath(); c.ellipse(0, 0, 70, 40, 0, 0, 7); c.clip();
    const g = c.createRadialGradient(-10, -8, 4, 0, 0, 76); g.addColorStop(0, '#d8f0f0'); g.addColorStop(0.5, '#8cc6d4'); g.addColorStop(1, '#4b8dae');
    c.fillStyle = g; c.fillRect(-80, -50, 160, 100);
    soft(c, -26, -18, 42, 9, '#ffffff', 0.6); soft(c, 30, -6, 36, 8, '#ffffff', 0.42); soft(c, 6, 22, 40, 7, '#ffffff', 0.28);
    // the far peaks and a blossom tree, mirrored in the still water
    for (const [px, ph, pw] of [[-34, 28, 26], [2, 36, 32], [38, 24, 24]]) { poly(c, [[px - pw, -40], [px, -40 + ph], [px + pw, -40]], '#566ea4', 0.3); }
    soft(c, 40, 16, 16, 9, '#e9a1b4', 0.45); soft(c, -44, 14, 14, 8, '#6a9a58', 0.4);
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1; c.lineCap = 'round';
    for (let i = 0; i < 14; i++) { const x = -58 + ((i * 37) % 112), y = -30 + ((i * 23) % 62); c.beginPath(); c.moveTo(x - 7, y); c.lineTo(x + 7, y); c.stroke(); }
    c.lineCap = 'butt'; c.restore();
    c.strokeStyle = rgba(INK, 0.4); c.lineWidth = 1.3; c.beginPath(); c.ellipse(0, 0, 70, 40, 0, 0, 7); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1; for (const k of [0.3, 0.55]) { c.beginPath(); c.ellipse(-12, 4, 70 * k, 40 * k, 0, 0, 7); c.globalAlpha = 0.5; c.stroke(); c.globalAlpha = 1; }
    for (const [x, y, r] of [[-44, 20, 6], [-34, 26, 5], [-22, 28, 5], [-50, 10, 4.5], [46, 22, 5]]) { ell(c, x, y, r, r * 0.55, '#5f9a58', 0.92); ell(c, x + 1, y - 1, r * 0.7, r * 0.35, '#8cc474', 0.7); }
    dot(c, -40, 21, 2, '#f0a8bc', 0.95); dot(c, -26, 27, 1.8, '#fbf7ea', 0.95);
    for (const [x, y, s] of [[-66, -14, 13], [-56, -30, 12], [-30, -42, 12], [58, -22, 13], [66, -8, 12], [30, -42, 11], [66, 10, 11]]) reed(c, x, y, s);
    for (const [x, y, s] of [[-72, 22, 12], [78, 24, 12]]) willow(c, x, y, s);
    // a little wooden jetty on the south bank
    c.fillStyle = rgba('#b88a58', 0.95); c.fillRect(-14, 36, 12, 18); c.strokeStyle = rgba('#5a3d22', 0.6); c.lineWidth = 0.8; for (let y = 38; y < 54; y += 4) { c.beginPath(); c.moveTo(-14, y); c.lineTo(-2, y); c.stroke(); }
    c.strokeStyle = rgba(INK, 0.6); c.strokeRect(-14, 36, 12, 18);
    ponds.push({ x: L.x, y: L.y, rx: 62, ry: 41 });
    for (let i = 0; i < 6; i++) sparks.push({ x: L.x - 40 + i * 16, y: L.y - 14 + ((i * 17) % 28), ph: i * 1.1, kind: 'glint', sub: 'lake' });
  }
  function lmLighthouse(c, L) {
    soft(c, 6, 20, 104, 32, '#4f7f98', 0.36);
    ell(c, 6, 18, 74, 21, '#9fd4d6', 0.95);
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3.2; c.beginPath(); c.ellipse(6, 18, 76, 22, 0, 0, 7); c.stroke();
    c.lineWidth = 1.2; c.strokeStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(6, 18, 58, 15, 0, 0.2, 5.8); c.stroke();
    for (const [x, y, s] of [[-52, 16, 11], [-30, 22, 16], [-4, 28, 18], [22, 30, 17], [48, 25, 15], [62, 16, 10], [-12, 16, 9]]) rock(c, x, y, s, '#66768a', '#a9b7c6');
    for (const x of [-34, -6, 24, 50]) line(c, x - 14, 30, x + 14, 31, 2, '#ffffff', 0.85, 2);
    const tx = 24, by = 18, H = 60, wb = 12, wt = 7.5, ty = by - H;
    const wAt = (y) => wb + (wt - wb) * (by - y) / H;
    soft(c, tx + 14, by + 2, 30, 6, '#1f2d3a', 0.3);
    for (let i = 0; i < 5; i++) {
      const y1 = by - i * H / 5, y2 = by - (i + 1) * H / 5, w1 = wAt(y1), w2 = wAt(y2);
      poly(c, [[tx - w1, y1], [tx - w2, y2], [tx + w2, y2], [tx + w1, y1]], i % 2 ? '#c8402f' : '#f8f2e4', 0.97);
    }
    poly(c, [[tx + 1, by], [tx + 1, ty], [tx + wt, ty], [tx + wb, by]], '#2b3445', 0.2);
    outline(c, [[tx - wb, by], [tx - wt, ty], [tx + wt, ty], [tx + wb, by]], INK, 1.2, 0.8, false);
    c.fillStyle = '#2b3445'; c.beginPath(); c.moveTo(tx - 3.4, by); c.lineTo(tx - 3.4, by - 8); c.arc(tx, by - 8, 3.4, Math.PI, 0); c.lineTo(tx + 3.4, by); c.fill();
    c.fillRect(tx - 1.6, by - 34, 3.2, 5);
    c.fillStyle = '#3d4a60'; c.fillRect(tx - wt - 4, ty - 3, (wt + 4) * 2, 4);
    c.strokeStyle = rgba(INK, 0.7); c.lineWidth = 0.9; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(tx + i * 3.8, ty - 3); c.lineTo(tx + i * 3.8, ty - 8); c.stroke(); }
    c.beginPath(); c.moveTo(tx - wt - 4, ty - 8); c.lineTo(tx + wt + 4, ty - 8); c.stroke();
    soft(c, tx, ty - 14, 34, 26, '#ffe9a0', 0.5);
    c.fillStyle = '#fff2b8'; c.fillRect(tx - 5.5, ty - 16, 11, 12); c.strokeStyle = rgba(INK, 0.75); c.lineWidth = 1.1; c.strokeRect(tx - 5.5, ty - 16, 11, 12); c.beginPath(); c.moveTo(tx, ty - 16); c.lineTo(tx, ty - 4); c.stroke();
    poly(c, [[tx - 9, ty - 16], [tx, ty - 28], [tx + 9, ty - 16]], '#c8402f', 0.97); outline(c, [[tx - 9, ty - 16], [tx, ty - 28], [tx + 9, ty - 16]], INK, 1, 0.7, true);
    dot(c, tx, ty - 29.5, 1.6, '#2b3445', 0.9);
    poly(c, [[tx - 5, ty - 10], [tx - 95, ty - 30], [tx - 95, ty + 8]], '#fff7c8', 0.13);
    for (const [x, y] of [[-40, -30], [-24, -40], [-52, -18]]) { c.strokeStyle = rgba(INK, 0.55); c.lineWidth = 1.1; c.beginPath(); c.moveTo(x - 4, y); c.quadraticCurveTo(x - 1, y - 3, x, y); c.quadraticCurveTo(x + 1, y - 3, x + 4, y); c.stroke(); }
    sparks.push({ x: L.x + tx, y: L.y + ty - 10, ph: 0, kind: 'beacon', sub: 'beach' });
  }
  function lmReef(c, L) {
    soft(c, 0, 14, 104, 38, '#c4f0e2', 0.6); soft(c, 0, 20, 76, 22, '#f5e8c0', 0.55); ell(c, 0, 22, 74, 11, '#2a8a96', 0.22);
    const arch = new Path2D(); arch.moveTo(-64, 22); arch.bezierCurveTo(-68, -22, -44, -52, 0, -52); arch.bezierCurveTo(44, -52, 68, -22, 64, 22); arch.lineTo(38, 22); arch.bezierCurveTo(40, -8, 26, -28, 0, -28); arch.bezierCurveTo(-26, -28, -40, -8, -38, 22); arch.closePath();
    c.save(); c.clip(arch);
    const g = c.createLinearGradient(0, -52, 0, 24); g.addColorStop(0, '#f8bda4'); g.addColorStop(0.5, '#e98c72'); g.addColorStop(1, '#b4587c');
    c.fillStyle = g; c.fillRect(-70, -56, 140, 82);
    soft(c, 40, -6, 36, 40, '#7a3a58', 0.32); soft(c, -30, -34, 40, 14, '#ffe4d0', 0.5);
    for (let i = 0; i < 60; i++) { const x = -66 + ((i * 47) % 132), y = -52 + ((i * 31) % 74); dot(c, x, y, 1 + (i % 3) * 0.5, i % 2 ? '#ffd6c0' : '#c4607a', 0.55); }
    c.fillStyle = 'rgba(70,200,196,.42)'; c.fillRect(-70, 8, 140, 24);
    c.restore();
    c.strokeStyle = rgba(INK, 0.55); c.lineWidth = 1.4; c.stroke(arch);
    for (const x of [-52, -2, 52]) line(c, x - 12, 12, x + 12, 12, 1.6, '#ffffff', 0.85, 2);
    line(c, -72, 24, -30, 26, 1.4, '#ffffff', 0.8, 2); line(c, 30, 26, 74, 24, 1.4, '#ffffff', 0.8, 2);
    // coral garden around the feet
    const cols = ['#e9877f', '#f0b26a', '#d86f93', '#b78ad0'];
    for (let i = 0; i < 26; i++) {
      const x = -82 + ((i * 53) % 164), y = 18 + ((i * 29) % 20), s = 6 + (i % 4) * 2.4, col = cols[i % 4];
      c.strokeStyle = rgba(col, 0.88); c.lineWidth = 2; c.lineCap = 'round';
      for (const d of [-3, 0, 3]) { c.beginPath(); c.moveTo(x + d, y); c.quadraticCurveTo(x + d * 1.8, y - s * 0.6, x + d * 2.4, y - s); c.stroke(); dot(c, x + d * 2.4, y - s, 1.4, col, 0.95); }
    }
    c.lineCap = 'butt';
    for (const [x, y, f] of [[-22, 6, 1], [28, 14, -1], [-8, -4, 1]]) { c.save(); c.translate(x, y); c.scale(f, 1); poly(c, [[0, 0], [-6, -2], [-9, 1], [-5, 2]], '#f0904a', 0.95); poly(c, [[-9, 1], [-13, -2], [-13, 4]], '#f0904a', 0.95); dot(c, -1.5, -0.6, 0.7, INK, 0.9); c.restore(); }
    sparks.push({ x: L.x - 10, y: L.y - 8, ph: 1, kind: 'glint', sub: 'coral' }, { x: L.x + 24, y: L.y + 6, ph: 2.4, kind: 'glint', sub: 'coral' });
  }
  function lmWreck(c) {
    soft(c, 4, 24, 96, 18, '#6a5a3a', 0.32);
    c.save(); c.rotate(-0.1);
    const hull = new Path2D(); hull.moveTo(-60, -8); hull.lineTo(62, -30); hull.quadraticCurveTo(74, -12, 60, 8); hull.quadraticCurveTo(24, 32, -28, 28); hull.quadraticCurveTo(-58, 24, -60, -8); hull.closePath();
    c.save(); c.clip(hull);
    const g = c.createLinearGradient(0, -30, 0, 30); g.addColorStop(0, '#8a6444'); g.addColorStop(1, '#4e3422');
    c.fillStyle = g; c.fillRect(-70, -34, 150, 70);
    for (const k of [0.3, 0.55, 0.8]) { c.strokeStyle = rgba('#2d1c10', 0.5); c.lineWidth = 1; c.beginPath(); c.moveTo(-60, -8 + 36 * k); c.quadraticCurveTo(0, 6 + 34 * k, 70, -30 + 34 * k); c.stroke(); }
    for (const x of [-34, -8, 20, 44]) { dot(c, x, -2 - (x + 34) * 0.1 + 4, 2.6, '#1f140c', 0.9); dot(c, x, -2 - (x + 34) * 0.1 + 4, 3.6, '#c9a870', 0.0); }
    soft(c, 30, 18, 60, 18, '#2a1a10', 0.3);
    c.restore();
    c.strokeStyle = rgba(INK, 0.7); c.lineWidth = 1.4; c.stroke(hull);
    line(c, -60, -8, 62, -30, 2.2, '#3a2616', 0.9, 0);
    // the broken stern shows bare ribs
    for (let i = 0; i < 6; i++) { const x = -56 + i * 8; brush(c, quad(x, -9 - i * 1.4, x - 2, -20 - i * 2, x + 1, -26 - (i % 3) * 3 - i, 5), 2.4, '#3a2616', 0.9, 1); }
    // masts, yard and a torn sail
    brush(c, [[16, -20], [26, -58]], 3.4, '#4a3020', 0.95, 2);
    brush(c, [[2, -48], [58, -40]], 2.4, '#4a3020', 0.95, 2);
    c.fillStyle = '#efe6cf'; c.globalAlpha = 0.93; c.beginPath(); c.moveTo(4, -47); c.lineTo(56, -39); c.lineTo(54, -28); c.lineTo(47, -23); c.lineTo(43, -30); c.lineTo(36, -19); c.lineTo(28, -27); c.lineTo(20, -17); c.lineTo(12, -26); c.lineTo(4, -22); c.closePath(); c.fill(); c.globalAlpha = 1;
    dot(c, 34, -35, 2, '#8a7a5a', 0.35); dot(c, 20, -36, 1.6, '#8a7a5a', 0.3);
    outline(c, [[4, -47], [56, -39], [54, -28], [47, -23], [43, -30], [36, -19], [28, -27], [20, -17], [12, -26], [4, -22]], INK, 0.9, 0.5, true);
    brush(c, [[48, -22], [52, -34]], 3, '#4a3020', 0.9, 2);
    poly(c, [[26, -58], [42, -54], [26, -50]], '#2b2530', 0.95); dot(c, 32, -54, 1.4, '#f4ecd7', 0.95);
    c.strokeStyle = rgba(INK, 0.45); c.lineWidth = 0.8; c.beginPath(); c.moveTo(26, -57); c.lineTo(64, -26); c.moveTo(26, -57); c.lineTo(-4, -12); c.stroke();
    c.restore();
    // sand banked against the hull, weed and spilled barrels
    soft(c, -36, 28, 40, 9, '#e6d4ac', 0.85); soft(c, 40, 26, 36, 8, '#e6d4ac', 0.8);
    for (let i = 0; i < 8; i++) tuft(c, -54 + i * 14, 30 + (i % 2) * 3, 5, '#4f6a3a', 0.6);
    ell(c, 72, 22, 7, 5, '#7a5230', 0.95); ell(c, 72, 22, 7, 5, INK, 0.0); outline(c, [[65, 20], [79, 20]], INK, 0.8, 0.5); ell(c, 56, 34, 6, 4, '#6a4528', 0.9);
    brush(c, quad(-70, 34, -78, 26, -74, 18, 5), 1.6, '#4a4a4a', 0.8, 2); outline(c, [[-80, 16], [-72, 16], [-76, 12]], '#4a4a4a', 1.4, 0.8);
  }
  function lmDune(c, L) {
    soft(c, 4, 24, 108, 16, '#a8743a', 0.28);
    // two smaller dunes behind
    for (const [x, s] of [[-72, 0.55], [78, 0.5]]) { c.save(); c.translate(x, 20); c.scale(s, s); poly(c, [[-60, 0], [-10, -34], [10, -34], [60, 0]], '#e8c07a', 0.8); poly(c, [[10, -34], [60, 0], [14, 0]], '#c4893f', 0.6); c.restore(); }
    const lit = new Path2D(); lit.moveTo(-96, 26); lit.bezierCurveTo(-68, 8, -38, -24, 8, -50); lit.lineTo(16, 26); lit.closePath();
    const lee = new Path2D(); lee.moveTo(8, -50); lee.bezierCurveTo(26, -24, 56, 4, 98, 26); lee.lineTo(16, 26); lee.closePath();
    let g = c.createLinearGradient(-90, 0, 12, 0); g.addColorStop(0, '#f4d487'); g.addColorStop(1, '#fdebb6'); c.fillStyle = g; c.fill(lit);
    g = c.createLinearGradient(8, -50, 40, 26); g.addColorStop(0, '#c98a3e'); g.addColorStop(1, '#9a6226'); c.globalAlpha = 0.96; c.fillStyle = g; c.fill(lee); c.globalAlpha = 1;
    brush(c, bez([-96, 26], [-68, 8], [-38, -24], [8, -50], 12).concat(bez([8, -50], [26, -24], [56, 4], [98, 26], 10)), 2.6, '#6a3e18', 0.7);
    brush(c, [[8, -50], [14, -4], [16, 26]], 1.4, '#7a4c22', 0.35);
    c.save(); c.clip(lit);
    for (let i = 0; i < 9; i++) brush(c, quad(-100, 24 - i * 3, -50 + i * 2, 6 - i * 5.6, 12, -46 + i * 5.2, 8), 1.2, '#c4893f', 0.38);
    c.restore();
    brush(c, [[10, -50], [44, -62], [80, -58], [100, -66]], 8, '#fbeccb', 0.4, 1);
    brush(c, [[14, -44], [48, -50], [82, -44]], 4, '#fbeccb', 0.4, 1);
    for (let i = 0; i < 9; i++) ell(c, -60 + i * 8, 20 - i * 3.5 - Math.sin(i) * 3, 1.5, 2.4, '#7a4c22', 0.4, 0.5);
    for (let i = 1; i <= 3; i++) { c.strokeStyle = rgba('#a8743a', 0.35 - i * 0.07); c.lineWidth = 1.1; c.beginPath(); c.arc(8, -60, 10 + i * 7, -2.3, -0.9); c.stroke(); }
    sparks.push({ x: L.x + 8, y: L.y - 52, ph: 0, kind: 'glint', sub: 'dunes' });
  }
  function lmOasis(c, L) {
    soft(c, 0, 4, 126, 62, '#7fa850', 0.34);
    ell(c, 0, 3, 86, 43, '#a2c86e', 0.78); ell(c, 0, 3, 76, 37, '#f1dca0', 0.95);
    c.save(); c.beginPath(); c.ellipse(0, 3, 66, 31, 0, 0, 7); c.clip();
    const g = c.createRadialGradient(-8, -2, 3, 0, 3, 68); g.addColorStop(0, '#c4f2e8'); g.addColorStop(0.55, '#58b9b4'); g.addColorStop(1, '#2f8ca2');
    c.fillStyle = g; c.fillRect(-70, -34, 140, 72);
    for (const [x, w] of [[-44, 14], [-18, 16], [14, 14], [40, 16]]) poly(c, [[x - 2, -28], [x + w * 0.3, -2], [x - w * 0.3, -2]], '#1f6a4a', 0.35);
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1; c.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const x = -54 + ((i * 41) % 104), y = -16 + ((i * 23) % 40); c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x + 6, y); c.stroke(); }
    c.lineCap = 'butt'; c.restore();
    c.strokeStyle = rgba('#2b6a5a', 0.55); c.lineWidth = 1.3; c.beginPath(); c.ellipse(0, 3, 66, 31, 0, 0, 7); c.stroke();
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; tuft(c, Math.cos(a) * 74, 3 + Math.sin(a) * 38, 5, '#4f8a3a', 0.7); }
    for (const [x, y, s] of [[-66, -12, 13], [-40, -34, 14], [-6, -38, 13], [34, -34, 14], [64, -12, 12], [-58, 30, 11], [50, 34, 11], [4, 44, 10]]) palm(c, x, y, s);
    for (const [x, y] of [[-76, 14], [78, 20], [-24, 42]]) rock(c, x, y, 5, '#c79a62', '#e8cfa0');
    for (const [x, y] of [[62, 16], [-62, 10]]) reed(c, x, y, 11);
    c.strokeStyle = 'rgba(255,248,230,.5)'; c.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-60, -48 - i * 5); for (let x = -60; x <= 60; x += 10) c.lineTo(x, -48 - i * 5 + Math.sin(x / 7 + i) * 1.6); c.globalAlpha = 0.5 - i * 0.12; c.stroke(); c.globalAlpha = 1; }
    ponds.push({ x: L.x, y: L.y + 3, rx: 68, ry: 31 });
    for (let i = 0; i < 5; i++) sparks.push({ x: L.x - 36 + i * 18, y: L.y - 6 + ((i * 17) % 22), ph: i * 1.3, kind: 'glint', sub: 'oasis' });
  }
  function lmPyramid(c) {
    soft(c, 16, 24, 100, 14, '#6a4a2a', 0.32);
    const A = [2, -50], BL = [-64, 22], BC = [8, 30], BR = [68, 18];
    let g = c.createLinearGradient(-60, -40, 0, 30); g.addColorStop(0, '#f6dcae'); g.addColorStop(1, '#e0b57a'); poly(c, [A, BL, BC], g, 1);
    g = c.createLinearGradient(8, -40, 60, 30); g.addColorStop(0, '#d29a62'); g.addColorStop(1, '#a9703f'); poly(c, [A, BC, BR], g, 1);
    for (let k = 1; k < 10; k++) {
      const t = k / 10, lx = A[0] + (BL[0] - A[0]) * t, ly = A[1] + (BL[1] - A[1]) * t, mx = A[0] + (BC[0] - A[0]) * t, my = A[1] + (BC[1] - A[1]) * t, rx = A[0] + (BR[0] - A[0]) * t, ry = A[1] + (BR[1] - A[1]) * t;
      outline(c, [[lx, ly], [mx, my]], '#7a4c22', 0.8, 0.28); outline(c, [[mx, my], [rx, ry]], '#5a3416', 0.8, 0.3);
    }
    outline(c, [BL, A, BR, BC], INK, 1.3, 0.75, true); outline(c, [A, BC], INK, 1, 0.5);
    poly(c, [A, [A[0] - 6.5, A[1] + 10], [A[0] + 6.5, A[1] + 10]], '#f6cf4a', 0.98); outline(c, [[A[0] - 6.5, A[1] + 10], A, [A[0] + 6.5, A[1] + 10]], INK, 0.9, 0.6);
    sparkle(c, A[0], A[1] - 2, 5, '#fff6c4', 0.9);
    // the lower courses are swallowed by sand; a dark doorway is half-buried
    soft(c, -30, 22, 56, 13, '#f0d49a', 0.95); soft(c, 38, 24, 52, 12, '#e8c488', 0.9); soft(c, 6, 31, 64, 8, '#f0d49a', 0.8);
    c.fillStyle = '#2a1a10'; c.beginPath(); c.moveTo(0, 28); c.lineTo(0, 18); c.quadraticCurveTo(8, 12, 16, 18); c.lineTo(16, 28); c.closePath(); c.globalAlpha = 0.88; c.fill(); c.globalAlpha = 1;
    ripples(c, -34, 26, 26, 2, '#a8743a', 0.4); ripples(c, 50, 28, 22, 2, '#a8743a', 0.4);
    for (const [x, y, h] of [[-78, 22, 32], [82, 22, 28]]) { poly(c, [[x - 3.4, y], [x - 2.4, y - h], [x, y - h - 6], [x + 2.4, y - h], [x + 3.4, y]], '#e3c490', 0.97); poly(c, [[x, y - h - 6], [x + 2.4, y - h], [x + 3.4, y], [x + 0.4, y]], '#a8744a', 0.5); outline(c, [[x - 3.4, y], [x - 2.4, y - h], [x, y - h - 6], [x + 2.4, y - h], [x + 3.4, y]], INK, 0.8, 0.6); soft(c, x + 4, y + 1, 9, 2.6, '#6a4a2a', 0.3); }
    for (const [x, y] of [[-54, 32], [58, 34], [26, 36]]) { poly(c, [[x - 6, y], [x - 5, y - 5], [x + 5, y - 6], [x + 6, y]], '#e0c08a', 0.95); outline(c, [[x - 6, y], [x - 5, y - 5], [x + 5, y - 6], [x + 6, y]], INK, 0.8, 0.5, true); }
  }
  function lmIcePeak(c, L) {
    soft(c, 6, 24, 104, 14, '#5d86ab', 0.3);
    const pk = (cx, base, w, h, a) => {
      const g = c.createLinearGradient(0, base - h, 0, base); g.addColorStop(0, '#eef7fb'); g.addColorStop(1, '#9bbdd6');
      c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.moveTo(cx - w, base); c.quadraticCurveTo(cx - w * 0.4, base - h * 0.7, cx, base - h); c.quadraticCurveTo(cx + w * 0.4, base - h * 0.6, cx + w, base); c.closePath(); c.fill();
      c.fillStyle = '#5f84b2'; c.globalAlpha = a * 0.4; c.beginPath(); c.moveTo(cx, base - h); c.quadraticCurveTo(cx + w * 0.4, base - h * 0.6, cx + w, base); c.lineTo(cx + w * 0.1, base); c.closePath(); c.fill(); c.globalAlpha = 1;
      outline(c, [[cx - w, base], [cx, base - h], [cx + w, base]], INK, 1, a * 0.5);
    };
    pk(-58, 26, 36, 46, 0.9); pk(62, 26, 38, 40, 0.9);
    const body = [[-70, 26], [-44, -8], [-30, -22], [-18, -42], [-4, -58], [3, -66], [14, -52], [22, -36], [34, -18], [46, -4], [76, 26]];
    const g = c.createLinearGradient(0, -66, 0, 26); g.addColorStop(0, '#f2f9fc'); g.addColorStop(0.5, '#cfe4ef'); g.addColorStop(1, '#8fb2cc');
    poly(c, body, g, 1);
    poly(c, [[3, -66], [14, -52], [22, -36], [34, -18], [46, -4], [76, 26], [10, 26], [8, -10], [10, -40]], '#3d6a9e', 0.55);
    poly(c, [[3, -66], [-4, -58], [-18, -42], [-12, -44], [-6, -34], [2, -42], [8, -30], [14, -42], [22, -36], [14, -52]], '#ffffff', 0.97);
    outline(c, body, INK, 2, 0.8, false);
    brush(c, [[3, -66], [6, -30], [8, 8], [10, 26]], 1.4, INK, 0.35);
    brush(c, quad(-18, -42, -30, -16, -50, 14, 6), 1.2, INK, 0.3);
    for (const [x, y] of [[-26, -8], [30, -4], [-8, 10]]) brush(c, quad(x, y, x + 8, y + 6, x + 4, y + 16, 5), 1.1, '#4a6a98', 0.5);
    soft(c, 0, 24, 84, 8, '#f6fbfd', 0.8);
    brush(c, [[6, -66], [40, -74], [74, -70]], 7, '#ffffff', 0.55, 1);
    for (const [x, y, s] of [[-54, 30, 7], [-40, 34, 6], [56, 32, 7], [70, 30, 6]]) frostPine(c, x, y, s);
    sparkle(c, 4, -64, 5, '#ffffff', 0.9);
    sparks.push({ x: L.x + 4, y: L.y - 62, ph: 0, kind: 'star', sub: 'snow' });
  }
  function lmFrozen(c, L) {
    soft(c, 0, 6, 100, 52, '#9cb8cc', 0.35);
    ell(c, 0, 2, 78, 42, '#f6fbfd', 0.95); ell(c, 0, 2, 72, 38, '#d8ecf4', 0.8);
    c.save(); c.beginPath(); c.ellipse(0, 0, 66, 34, 0, 0, 7); c.clip();
    const g = c.createRadialGradient(-12, -8, 3, 0, 0, 70); g.addColorStop(0, '#f2fbfe'); g.addColorStop(0.6, '#c6e4f0'); g.addColorStop(1, '#8cbcd8');
    c.fillStyle = g; c.fillRect(-70, -40, 140, 80);
    soft(c, -24, -14, 34, 8, '#ffffff', 0.7);
    // cracks fan out from a pressure point
    const cr = (pts, w, a) => brush(c, pts, w, '#4a74a0', a, 2);
    cr([[8, 2], [-8, -6], [-30, -12], [-52, -20]], 1.5, 0.7); cr([[8, 2], [26, -8], [44, -10], [64, -20]], 1.4, 0.7); cr([[8, 2], [14, 16], [30, 22], [50, 30]], 1.4, 0.7); cr([[8, 2], [-6, 14], [-20, 22], [-38, 30]], 1.4, 0.7);
    cr([[-30, -12], [-34, -2], [-48, 4]], 1, 0.55); cr([[26, -8], [30, 4], [44, 10]], 1, 0.55); cr([[14, 16], [4, 26]], 1, 0.5);
    cr([[8, 2], [8, -12], [14, -28]], 1.2, 0.6);
    // skate tracks: looping white curves
    c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 1.5; c.lineCap = 'round';
    c.beginPath(); c.ellipse(-24, 8, 22, 9, -0.2, 0.3, 6.0); c.stroke();
    c.beginPath(); c.ellipse(-8, 12, 26, 10, 0.2, 3.5, 9.4); c.stroke();
    c.beginPath(); c.moveTo(-50, 18); c.bezierCurveTo(-20, -16, 20, 30, 56, 2); c.stroke();
    c.strokeStyle = 'rgba(90,130,170,.35)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-50, 20); c.bezierCurveTo(-20, -14, 20, 32, 56, 4); c.stroke();
    c.lineCap = 'butt';
    ell(c, 34, 12, 4.6, 2.6, '#2f5a80', 0.85); ell(c, 34, 12, 6, 3.6, '#ffffff', 0.0); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(34, 12, 6.4, 3.8, 0, 0, 7); c.stroke();
    c.restore();
    c.strokeStyle = rgba('#3d5a80', 0.5); c.lineWidth = 1.2; c.beginPath(); c.ellipse(0, 0, 66, 34, 0, 0, 7); c.stroke();
    for (const [x, y, h] of [[-68, 4, 14], [-62, -16, 12], [66, -12, 13], [70, 8, 11], [-24, -40, 12], [28, -40, 11]]) crystal(c, x, y, h * 0.5, '#aed2ea', '#f4fbff');
    for (const [x, y] of [[-34, 40], [40, 42], [0, 46]]) soft(c, x, y, 30, 7, '#ffffff', 0.9);
    for (let i = 0; i < 4; i++) sparks.push({ x: L.x - 30 + i * 22, y: L.y - 8 + ((i * 13) % 20), ph: i * 1.7, kind: 'star', sub: 'frozen' });
  }
  function lmIceForest(c, L) {
    soft(c, 0, 20, 100, 30, '#8fa4d0', 0.3); soft(c, 0, -20, 60, 60, '#dfe8ff', 0.35); soft(c, 0, 24, 80, 14, '#f6fbfd', 0.8);
    const trees = [[-36, 22, 11], [34, 24, 12], [-62, 12, 8], [60, 14, 9], [-14, 34, 8], [20, 36, 8], [0, 14, 22], [-48, -4, 8], [48, -2, 8]];
    for (const [x, y, s] of trees.sort((a, b) => a[1] - b[1])) frostPine(c, x, y, s);
    for (const [x, y, s] of [[-26, 40, 5], [30, 42, 5], [-70, 24, 5], [74, 26, 4]]) crystal(c, x, y, s, '#aed2ea', '#f4fbff');
    for (let i = 0; i < 16; i++) sparkle(c, -70 + ((i * 53) % 140), -50 + ((i * 29) % 80), 2 + (i % 3), i % 2 ? '#ffffff' : '#c8d8ff', 0.85);
    for (let i = 0; i < 6; i++) sparks.push({ x: L.x - 50 + i * 20, y: L.y - 40 + ((i * 19) % 50), ph: i * 1.2, kind: 'star', sub: 'rime' });
  }
  function lmBurnt(c, L) {
    soft(c, 0, 16, 104, 30, '#1a1412', 0.38); soft(c, 0, 14, 76, 18, '#4a3a34', 0.45);
    for (const [x1, y1, x2, y2] of [[-40, 18, -10, 14], [-4, 22, 30, 16], [20, 8, 56, 4], [-60, 8, -30, 0]]) brush(c, quad(x1, y1, (x1 + x2) / 2, y1 - 4, x2, y2, 5), 1.8, '#f08a35', 0.8, 2);
    for (const [x, y, s] of [[-60, 6, 13], [-34, 22, 16], [-4, -6, 16], [14, 20, 17], [40, 8, 14], [60, 22, 12], [-18, 38, 10], [30, 40, 10]].sort((a, b) => a[1] - b[1])) burnt(c, x, y, s, true);
    for (const [x, y, r] of [[-10, -50, 18], [8, -66, 16], [-26, -64, 12], [24, -78, 12]]) soft(c, x, y, r, r * 0.7, '#6a5f5a', 0.28);
    for (let i = 0; i < 12; i++) dot(c, -50 + ((i * 47) % 100), -10 + ((i * 31) % 50), 1.1, '#ffb14a', 0.85);
    for (let i = 0; i < 4; i++) sparks.push({ x: L.x - 30 + i * 20, y: L.y - 4 + (i % 2) * 14, ph: i * 1.4, kind: 'ember', sub: 'ash' });
  }
  function lmRidge(c, L) {
    soft(c, 0, 22, 108, 26, '#14101e', 0.4); soft(c, 0, 18, 90, 18, '#6a5a9a', 0.22);
    const sh = [[-88, 26, 18, 30, -2], [-70, 24, 20, 40, 4], [-48, 26, 24, 52, -4], [-26, 24, 26, 64, 5], [0, 26, 30, 78, -3], [26, 24, 26, 58, 6], [48, 26, 24, 66, -5], [70, 24, 22, 44, 3], [88, 26, 18, 32, -3]];
    for (const [x, y, w, h, l] of sh) shard(c, x * 0.88, y, w, h * 0.74, l, '#2a2640', '#8c82c0');
    for (let i = 0; i < 10; i++) { const x = -80 + i * 17; poly(c, [[x - 4, 30 + (i % 3) * 2], [x, 24 + (i % 3) * 2], [x + 4, 30 + (i % 3) * 2]], '#2f2b46', 0.9); }
    for (const [x, y, s] of [[-30, 36, 4], [20, 38, 4], [58, 34, 4]]) crystal(c, x, y, s, '#4a4470', '#a89ee0');
    brush(c, quad(-80, 8, -20, -10, 70, 6, 8), 2, '#cfc8ff', 0.2);
    for (let i = 0; i < 5; i++) sparks.push({ x: L.x - 50 + i * 24, y: L.y - 30 + ((i * 17) % 40), ph: i * 1.3, kind: 'star', sub: 'ridge' });
  }
  function lmVolcano(c, L) {
    c.translate(-14, 6);
    soft(c, 4, 26, 112, 18, '#1a1010', 0.42);
    soft(c, 0, -70, 62, 36, '#ff8a3a', 0.4);
    const cone = new Path2D(); cone.moveTo(-84, 28); cone.quadraticCurveTo(-52, -6, -32, -46); cone.quadraticCurveTo(-24, -62, -15, -68); cone.lineTo(15, -68); cone.quadraticCurveTo(24, -62, 32, -46); cone.quadraticCurveTo(54, -6, 84, 28); cone.closePath();
    let g = c.createLinearGradient(0, -68, 0, 28); g.addColorStop(0, '#6e4c46'); g.addColorStop(1, '#2e2020'); c.fillStyle = g; c.fill(cone);
    c.save(); c.clip(cone);
    c.globalAlpha = 0.45; c.fillStyle = '#1a1010'; c.beginPath(); c.moveTo(14, -68); c.quadraticCurveTo(24, -62, 32, -46); c.quadraticCurveTo(54, -6, 84, 28); c.lineTo(10, 28); c.quadraticCurveTo(14, -20, 14, -68); c.fill(); c.globalAlpha = 1;
    for (let i = 0; i < 20; i++) soft(c, -50 + ((i * 41) % 100), -50 + ((i * 29) % 76), 12, 8, i % 2 ? '#8a625a' : '#1e1414', 0.3);
    c.restore();
    c.strokeStyle = rgba(INK, 0.7); c.lineWidth = 1.4; c.stroke(cone);
    ell(c, 0, -68, 16, 5, '#2a1b1a', 0.95); ell(c, 0, -68, 13, 3.6, '#f08a35', 1); ell(c, -2, -68.5, 7, 2, '#ffd27a', 1);
    for (const pts of [bez([-6, -66], [-10, -48], [-20, -30], [-26, -4], 8), bez([4, -66], [8, -44], [6, -26], [14, 0], 8), bez([10, -66], [26, -48], [34, -30], [46, -12], 8)]) {
      brush(c, pts, 6.5, '#2a1b1a', 0.55, 1); brush(c, pts, 4.2, '#d9452a', 0.92, 1); brush(c, pts, 1.8, '#ffc864', 0.95, 1);
    }
    for (const [x, y, s] of [[-92, 28, 8], [90, 30, 8], [-70, 34, 6], [70, 36, 6]]) rock(c, x, y, s, '#3a2c2a', '#7a625c');
    for (const [x, y, r, a, col] of [[8, -88, 20, 0.5, '#4a3f3c'], [26, -106, 24, 0.42, '#6f625e'], [50, -122, 26, 0.34, '#8a7d78'], [78, -134, 24, 0.26, '#a89a94'], [-8, -100, 16, 0.38, '#5a4e4a']]) soft(c, x, y, r * 1.2, r * 0.85, col, a);
    for (let i = 0; i < 10; i++) dot(c, -20 + ((i * 29) % 60), -76 - ((i * 17) % 40), 1.3, '#ffb14a', 0.85);
    lava.push(bez([L.x - 20, L.y - 60], [L.x - 24, L.y - 42], [L.x - 34, L.y - 24], [L.x - 40, L.y + 2], 8));
    sparks.push({ x: L.x - 14, y: L.y - 64, ph: 0, kind: 'crater', sub: 'caldera' });
  }
  const LANDMARKS = { hill: lmHill, 'oak-grove': lmOak, lake: lmLake, lighthouse: lmLighthouse, 'reef-arch': lmReef, shipwreck: lmWreck, 'giant-dune': lmDune, oasis: lmOasis, pyramid: lmPyramid, 'ice-peak': lmIcePeak, 'frozen-lake': lmFrozen, 'ice-forest': lmIceForest, 'burnt-grove': lmBurnt, 'obsidian-ridge': lmRidge, volcano: lmVolcano };
  const TALL = { lighthouse: 1, volcano: 1, 'ice-peak': 1, 'ice-forest': 1, 'obsidian-ridge': 1, shipwreck: 1, 'oak-grove': 1, pyramid: 1, 'reef-arch': 1, 'burnt-grove': 1 };
  const LAVA_FLOWS = [[[709, 262], [713, 280], [716, 298]], [[722, 262], [758, 268], [790, 282], [814, 292]], [[694, 262], [662, 260], [632, 264], [604, 258]]];

  function paintCamp(c) {
    const x = World.CAMP.x, y = World.CAMP.y;
    soft(c, x, y + 4, 96, 30, '#a07a4a', 0.5); soft(c, x, y + 2, 68, 21, '#cfae7c', 0.7); soft(c, x - 10, y, 40, 12, '#e3caa0', 0.6);
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + 0.2; rock(c, x + Math.cos(a) * 84, y + 4 + Math.sin(a) * 25, 2.4 + (i % 3) * 0.7, '#8c8a86', '#c5c3bc'); }
    for (let i = 0; i < 7; i++) { const px = x - 92 + i * 9; brush(c, [[px, y - 22], [px, y - 36 - (i % 2) * 2]], 3, '#8a6a44', 0.95, 2); }
    brush(c, [[x - 94, y - 32], [x - 32, y - 33]], 1.6, '#5a4630', 0.9, 2); brush(c, [[x - 94, y - 26], [x - 32, y - 27]], 1.6, '#5a4630', 0.9, 2);
    for (const [px, py] of [[x - 62, y + 12], [x + 70, y + 10]]) {
      brush(c, [[px, py], [px, py - 34]], 2.4, '#5a4630', 0.95, 2); soft(c, px, py - 26, 20, 20, '#ffd27a', 0.38);
      ell(c, px, py - 28, 5.4, 6.6, '#d9452a', 0.96); ell(c, px - 1.4, py - 29.5, 2.2, 3, '#ff9a6a', 0.7); outline(c, [[px - 2.4, py - 34], [px + 2.4, py - 34]], INK, 1.2, 0.8); outline(c, [[px - 2.4, py - 22], [px + 2.4, py - 22]], INK, 1.2, 0.8);
    }
    for (const [px, py] of [[x - 76, y + 6], [x - 68, y + 14], [x + 84, y + 14]]) { c.fillStyle = '#9a6a3a'; c.globalAlpha = 0.95; c.fillRect(px - 5, py - 9, 10, 9); c.globalAlpha = 1; c.strokeStyle = rgba(INK, 0.65); c.lineWidth = 0.9; c.strokeRect(px - 5, py - 9, 10, 9); line(c, px - 5, py - 4.5, px + 5, py - 4.5, 0.9, INK, 0.4, 0); }
    // a little jetty and a moored boat on the sea south of the camp
    c.save(); c.translate(x + 66, y + 24); c.rotate(-0.28);
    c.fillStyle = rgba('#b88a58', 0.97); c.fillRect(-7, 0, 14, 54); c.strokeStyle = rgba('#5a3d22', 0.6); c.lineWidth = 0.9;
    for (let k = 3; k < 54; k += 5) { c.beginPath(); c.moveTo(-7, k); c.lineTo(7, k); c.stroke(); }
    c.strokeStyle = rgba(INK, 0.65); c.lineWidth = 1.3; c.strokeRect(-7, 0, 14, 54);
    for (const k of [2, 26, 52]) for (const sx of [-8, 8]) { c.fillStyle = '#4a3320'; c.fillRect(sx - 1.4, k - 1.4, 2.8, 2.8); }
    c.restore();
    sailboat(c, x + 118, y + 70, 1.1, false);
    brush(c, quad(x - 120, y + 36, x - 90, y + 26, x - 60, y + 38, 6), 1.2, '#fbf7ea', 0.7);
  }

  function paintTerrain(c) {
    const { MAP_W, MAP_H } = World, H2 = MAP_H + EXT, R = R0('wash'), S = (id) => World.SUB_BY[id];
    c.fillStyle = PAPER; c.fillRect(0, 0, MAP_W, H2);
    const grain = paperTexture(), pat = c.createPattern(grain, 'repeat');
    c.fillStyle = pat; c.fillRect(0, 0, MAP_W, H2);

    // ----- Sea: pale indigo washes with regional tints and flowing strokes -----
    c.fillStyle = SEA; c.globalAlpha = 0.9; c.fillRect(0, 0, MAP_W, H2); c.globalAlpha = 1;
    for (let i = 0; i < 70; i++) soft(c, R() * MAP_W, R() * H2, 70 + R() * 130, 40 + R() * 70, R() > 0.5 ? '#7fa5b6' : '#d7e6e2', 0.22 + R() * 0.2);
    for (let i = 0; i < 26; i++) soft(c, R() * MAP_W, R() * H2, 110 + R() * 120, 60 + R() * 60, '#6b8eb0', 0.12);
    for (let i = 0; i < 20; i++) soft(c, R() * MAP_W, MAP_H - 80 + R() * (H2 - MAP_H + 80), 130 + R() * 100, 60 + R() * 40, '#4f86ac', 0.22);   // deep southern sea
    for (let i = 0; i < 26; i++) soft(c, R() * 260, 1000 + R() * 1400, 90 + R() * 60, 50 + R() * 40, R() > 0.5 ? '#78c8cc' : '#b4e4de', 0.3);   // turquoise coast
    for (let i = 0; i < 18; i++) soft(c, 760 + R() * 260, 1620 + R() * 760, 90 + R() * 60, 50 + R() * 40, R() > 0.5 ? '#9ccdc0' : '#cfe4cc', 0.28);   // green-gold shallows
    for (let i = 0; i < 16; i++) soft(c, R() * 300, 40 + R() * 860, 90, 50, '#e4eff3', 0.4);                  // pale icy sea
    for (let i = 0; i < 16; i++) soft(c, 700 + R() * 300, 20 + R() * 800, 90, 50, '#8d93a8', 0.3);            // sooty sea
    c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 1.4;
    for (let y = 12; y < H2; y += 28) { c.beginPath(); for (let x = 0; x <= MAP_W; x += 16) c.lineTo(x, y + Math.sin(x / 55 + y * 0.7) * 5); c.stroke(); }

    // ----- Land: one painted continent made of sub-area blobs + the mountain spine -----
    const parts = [];
    MOUNTAINS.forEach((b, i) => parts.push({ id: 'mtn' + i, path: blob('mtn' + i, b, 30, 0.2), pal: PAL.mtn, b: grow(b, 8), a: 0.7, band: PAL.mtn.band }));
    for (const sub of World.SUBAREAS.slice().reverse()) {
      if (sub.id === 'coral') continue;
      const sb = sub.bounds.slice();
      if (sub.id === 'meadow') sb[3] = World.CAMP.y + 15;
      if (sub.regionIndex === 1 || sub.regionIndex === 3) sb[0] += 56;   // left column keeps a strip of sea at the west edge
      if (sub.regionIndex === 2 || sub.regionIndex === 4) sb[2] -= 56;   // right column likewise on the east
      const path = blob(sub.id, sb, sub.id === 'meadow' ? 40 : 46, 0.22);
      landPaths[sub.id] = path;
      const pal = PAL[sub.id];
      parts.push({ id: sub.id, path, pal, b: grow(sub.bounds, 22), a: ['ash', 'ridge', 'caldera'].includes(sub.id) ? 0.82 : 0.64, band: pal.band });
    }
    const landAll = new Path2D(); parts.forEach((p) => landAll.addPath(p.path));
    // Any spot whose ring would hang over the sea gets a small patch of ground under it.
    for (const n of World.nodes) {
      if (n.sub === 'coral') continue;
      let out = false;
      for (let k = 0; k < 8; k++) { const a = k * 0.785; if (!hit.isPointInPath(landAll, n.x + Math.cos(a) * 32, n.y + Math.sin(a) * 14)) out = true; }
      if (!out) continue;
      const pp = blob('patch' + n.id, [n.x - 30, n.y - 14, n.x + 30, n.y + 14], 10, 0.3);
      landPaths[n.sub].addPath(pp); landAll.addPath(pp);
      parts.push({ id: 'patch' + n.id, path: pp, pal: PAL[n.sub], b: [n.x - 60, n.y - 44, n.x + 60, n.y + 44], a: 0.7, band: PAL[n.sub].band });
    }
    // shore skirt (outer half of each outline survives under the opaque ground)
    c.save(); c.lineJoin = 'round';
    for (const p of parts) {
      c.strokeStyle = rgba('#fffaf0', 0.8); c.lineWidth = 30; c.stroke(p.path);
      c.strokeStyle = rgba(p.band, 0.85); c.lineWidth = 18; c.stroke(p.path);
      c.strokeStyle = rgba(INK, 0.3); c.lineWidth = 2.6; c.stroke(p.path);
    }
    c.restore();
    c.fillStyle = LANDBASE; c.fill(landAll);
    c.save(); c.clip(landAll);
    for (const p of parts) wash(c, p);
    // region identity: warm sunlight over Greenvale, crisp frost above Frostveil, soot over Ember Peaks
    for (let i = 0; i < 14; i++) soft(c, 300 + R() * 420, 1650 + R() * 700, 90, 40, '#fff4b8', 0.16);
    for (let i = 0; i < 18; i++) soft(c, R() * 420, 120 + R() * 760, 90, 34, '#ffffff', 0.22);
    for (let i = 0; i < 18; i++) soft(c, 590 + R() * 400, 120 + R() * 760, 100, 30, '#3a2e2c', 0.12);
    for (let i = 0; i < 14; i++) soft(c, 590 + R() * 400, 880 + R() * 740, 100, 34, '#fff0b0', 0.16);
    // gentle seams between regions: sand drifting into grass, snow dusting the cliffs, ash over sand
    for (const [x, y, w, col] of [[330, 1636, 70, '#f1dca8'], [670, 1636, 70, '#ecc27a'], [215, 872, 90, '#ffffff'], [785, 872, 90, '#8d827c'], [215, 1118, 70, '#d6c8aa'], [215, 1366, 70, '#efdbaa']])
      for (let i = 0; i < 9; i++) soft(c, x + (R() - 0.5) * w * 2.2, y + (R() - 0.5) * 36, 40 + R() * 40, 20 + R() * 12, col, 0.4);
    c.restore();

    // ----- Coral lagoon: a turquoise bay cut out of the coast, with sand islets for each spot -----
    const coral = S('coral');
    lagoonPath = blob('lagoon', [coral.bounds[0], coral.bounds[1], coral.bounds[2] - 14, coral.bounds[3]], 32, 0.24);
    noDecor.push(lagoonPath);
    c.save(); c.strokeStyle = rgba('#fffaf0', 0.9); c.lineWidth = 18; c.lineJoin = 'round'; c.stroke(lagoonPath); c.restore();
    c.save(); c.clip(lagoonPath);
    c.fillStyle = '#bfe3dc'; c.fillRect(0, 1080, 500, 330);
    for (let y = 1090; y < 1400; y += 34) for (let x = -10; x < 460; x += 42) soft(c, x + (R() - 0.5) * 26, y + (R() - 0.5) * 22, 56 + R() * 26, 38 + R() * 16, R() > 0.45 ? '#7fcfc8' : '#5fb8c0', 0.5);
    for (let i = 0; i < 26; i++) soft(c, 10 + R() * 410, 1110 + R() * 270, 40 + R() * 60, 22 + R() * 30, R() > 0.5 ? '#a8ece0' : '#3f9cb4', 0.3);
    for (let i = 0; i < 12; i++) soft(c, 20 + R() * 400, 1130 + R() * 230, 30 + R() * 50, 8 + R() * 8, '#f3e7c0', 0.55);   // sandbars
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.2;
    for (let y = 1140; y < 1360; y += 16) { c.beginPath(); for (let x = 0; x <= 430; x += 14) c.lineTo(x, y + Math.sin(x / 30 + y) * 3); c.stroke(); }
    c.restore();
    c.save(); c.strokeStyle = rgba('#ffffff', 0.7); c.lineWidth = 2.4; c.stroke(lagoonPath); c.strokeStyle = rgba(INK, 0.22); c.lineWidth = 1.2; c.stroke(lagoonPath); c.restore();
    const isleLand = [];
    World.nodes.filter((n) => n.sub === 'coral').forEach((n, i) => {
      const k = n.type === 'boss' ? 1.45 : n.type === 'elite' ? 1.2 : 1;
      const p = blob('isle' + i, [n.x - 26 * k, n.y - 15 * k, n.x + 26 * k, n.y + 15 * k], 12, 0.4);
      islandPaths.push(p); isleLand.push(p);
      c.save(); c.strokeStyle = rgba('#ffffff', 0.8); c.lineWidth = 12; c.lineJoin = 'round'; c.stroke(p); c.strokeStyle = rgba('#cfeee4', 0.8); c.lineWidth = 7; c.stroke(p); c.restore();
      c.save(); c.clip(p); c.fillStyle = '#f2e3b8'; c.fillRect(n.x - 60, n.y - 40, 120, 80); soft(c, n.x - 6, n.y - 4, 36, 18, '#fbf1d2', 0.8); soft(c, n.x + 14, n.y + 8, 30, 12, '#e0c28e', 0.55); c.restore();
      c.save(); c.strokeStyle = rgba(INK, 0.25); c.lineWidth = 1; c.stroke(p); c.restore();
    });

    // ----- Rivers -----
    for (const r of RIVERS) for (let i = 0; i < r.pts.length - 1; i++) obstacles.push([{ x: r.pts[i][0], y: r.pts[i][1] }, { x: r.pts[i + 1][0], y: r.pts[i + 1][1] }, 22]);
    for (const r of RIVERS) {
      const sm = smooth(r.pts, 8), n = sm.length;
      ribbon(c, sm, r.w0 + 14, r.w1 + 14, '#e9f1ea', 0.5);
      ribbon(c, sm, r.w0 + 4, r.w1 + 4, '#8fb8c8', 0.6);
      ribbon(c, sm, (r.w0 + 4) * 0.62, (r.w1 + 4) * 0.62, '#6f9fba', 0.55);
      brush(c, sm.map((p, i) => [p[0] + Math.sin(i) * 2, p[1] - 3]), 4, '#e8f4f6', 0.6);
      c.strokeStyle = rgba(INK, 0.3); c.lineWidth = 1;
      for (const sd of [-1, 1]) {
        c.beginPath();
        sm.forEach((p, i) => { const q = sm[Math.min(n - 1, i + 1)], pr = sm[Math.max(0, i - 1)]; let dx = q[0] - pr[0], dy = q[1] - pr[1]; const l = Math.hypot(dx, dy) || 1; const off = sd * ((r.w0 + (r.w1 - r.w0) * i / (n - 1)) / 2 + 9); const X = p[0] - dy / l * off, Y = p[1] + dx / l * off; if (i) c.lineTo(X, Y); else c.moveTo(X, Y); });
        c.stroke();
      }
      riverPaths.push({ path: curve(sm), pts: sm });
    }
    // spring pool where the mountain river starts, and the reed marsh where it ends above Mirror Lake
    ell(c, 498, 898, 22, 11, '#e9f1ea', 0.6); ell(c, 498, 898, 17, 8, '#6f9fba', 0.85); ell(c, 495, 896, 7, 3, '#e8f4f6', 0.8);
    ell(c, MARSH.x, MARSH.y, MARSH.rx + 8, MARSH.ry + 5, '#cfe0a8', 0.8); ell(c, MARSH.x, MARSH.y, MARSH.rx, MARSH.ry, '#7fb0c0', 0.95); ell(c, MARSH.x - 8, MARSH.y - 2, MARSH.rx * 0.55, MARSH.ry * 0.5, '#a9d4de', 0.85);
    c.strokeStyle = rgba(INK, 0.3); c.lineWidth = 1; c.beginPath(); c.ellipse(MARSH.x, MARSH.y, MARSH.rx, MARSH.ry, 0, 0, 7); c.stroke();
    for (const [dx, dy] of [[-36, 4], [-28, 12], [30, 10], [38, 2], [-14, -10], [18, -11]]) reed(c, MARSH.x + dx, MARSH.y + dy, 11);
    for (const [dx, dy] of [[-12, 2], [10, 3], [22, -2]]) { ell(c, MARSH.x + dx, MARSH.y + dy, 4.4, 2.4, '#5f9a58', 0.9); }
    zones.push({ x: MARSH.x, y: MARSH.y, rx: MARSH.rx + 20, ry: MARSH.ry + 20 }, { x: 498, y: 898, rx: 30, ry: 20 });
    // wooden bridge where the road crosses the first river
    c.save(); c.translate(BRIDGE.x, BRIDGE.y); c.rotate(0.04);
    c.fillStyle = rgba('#b88a58', 0.95); c.fillRect(-11, -26, 22, 52);
    c.strokeStyle = rgba('#5a3d22', 0.6); c.lineWidth = 1;
    for (let y = -24; y < 26; y += 5) { c.beginPath(); c.moveTo(-11, y); c.lineTo(11, y); c.stroke(); }
    c.strokeStyle = rgba(INK, 0.7); c.lineWidth = 1.6; c.strokeRect(-11, -26, 22, 52);
    for (const sx of [-12, 12]) for (const sy of [-24, 0, 24]) { c.fillStyle = '#4a3320'; c.fillRect(sx - 1.2, sy - 1.2, 2.4, 2.4); }
    c.restore();
    zones.push({ x: BRIDGE.x, y: BRIDGE.y, rx: 24, ry: 34 });
    for (const sub of World.SUBAREAS) { const L = sub.landmark, t = TALL[L.kind]; zones.push({ x: L.x, y: L.y - (t ? 14 : 4), rx: L.rx + 34, ry: t ? 70 : 54 }); }
    zones.push({ x: World.CAMP.x, y: World.CAMP.y - 6, rx: 100, ry: 40 });

    // ----- Region decorations -----
    const dec = (key, id, count, gap, fn, nodeGap, g) => scatter(key, landPaths[id], grow(S(id).bounds, g === undefined ? 30 : g), count, gap, fn, nodeGap);
    const pick = (a, r) => a[Math.min(a.length - 1, Math.floor(r * a.length))];
    // The mountain spine between the coast and Sunscorch: layered misty indigo peaks.
    scatter('mtn0', parts[0].path, MOUNTAINS[0], 54, 12, (p) => mpeak(c, p.x, p.y, 24 + p.r * 24, 0.2 + p.q * 0.7, p.r > 0.4), 50);
    scatter('mtn1', parts[1].path, MOUNTAINS[1], 40, 12, (p) => mpeak(c, p.x, p.y, 22 + p.r * 20, 0.2 + p.q * 0.7, p.r > 0.4), 50);
    scatter('mtnpine', parts[0].path, MOUNTAINS[0], 26, 12, (p) => pine(c, p.x, p.y, 5 + p.r * 3, p, '#4d6e68', '#9bb7a0', false), 50);
    scatter('mtnpine1', parts[1].path, MOUNTAINS[1], 14, 12, (p) => pine(c, p.x, p.y, 5 + p.r * 3, p, '#4d6e68', '#9bb7a0', true), 50);

    // Meadow: sunny rolling grass with wildflowers, round trees and cherry blossom.
    dec('mmound', 'meadow', 16, 30, (p) => { soft(c, p.x + 4, p.y + 4, 24 + p.r * 18, 7, '#6f9a52', 0.28); soft(c, p.x - 4, p.y - 1, 22 + p.r * 14, 7, '#e6f0b8', 0.6); }, 30, 10);
    dec('mgrass', 'meadow', 110, 10, (p) => tuft(c, p.x, p.y, 6 + p.r * 3, '#6d9a52'), 26, 40);
    dec('mflower', 'meadow', 100, 10, (p) => dot(c, p.x, p.y, 1.8, pick(['#fbf7ea', '#f1c75b', '#e9a1a8', '#b8a3d6'], p.r), 0.88), 26, 40);
    dec('mtree', 'meadow', 16, 22, (p) => roundTree(c, p.x, p.y, 10 + p.r * 5, p, '#7da85a', '#a9cb78'), 44, 20);
    dec('msakura', 'meadow', 8, 24, (p) => sakura(c, p.x, p.y, 10 + p.r * 4, p), 44, 20);
    dec('mpine', 'meadow', 12, 22, (p) => pine(c, p.x, p.y, 9 + p.r * 4, p, '#4f7a5a', '#8fb67a', false), 44, 30);
    paintCamp(c);
    // Old Oak Wood: tall dark pines, oaks, a bamboo thicket and leaf litter.
    const F = S('forest');
    dec('fmoss', 'forest', 30, 20, (p) => soft(c, p.x, p.y, 30 + p.r * 24, 12, '#3f6a4c', 0.26), 30, 10);
    dec('fleaf', 'forest', 70, 8, (p) => dot(c, p.x, p.y, 1.5, pick(['#b88a46', '#d9a050', '#8a6a3a', '#cf7a3a'], p.r), 0.65), 22, 30);
    scatter('fbamboo', landPaths.forest, [F.bounds[0] + 250, F.bounds[1] + 10, F.bounds[2] + 10, F.bounds[3] - 10], 12, 20, (p) => bamboo(c, p.x, p.y, 8 + p.r * 3, p));
    dec('fpine', 'forest', 130, 14, (p) => pine(c, p.x, p.y, 9 + p.r * 6, p, p.q > 0.5 ? '#35604f' : '#4a7656', '#8fb67a', false), 44, 40);
    dec('ftree', 'forest', 26, 18, (p) => roundTree(c, p.x, p.y, 10 + p.r * 5, p, '#5f9058', '#9cc474'), 44, 40);
    dec('fsakura', 'forest', 6, 22, (p) => sakura(c, p.x, p.y, 10 + p.r * 4, p), 44, 40);
    dec('fgrass', 'forest', 40, 10, (p) => tuft(c, p.x, p.y, 6, '#4f7a4a', 0.55), 26, 40);
    // Mirror Lake shore: damp meadow with reeds, willows and puddles.
    dec('lpuddle', 'lake', 12, 36, (p) => { ell(c, p.x, p.y, 12 + p.r * 10, 4 + p.r * 2, '#cfe4d2', 0.7); ell(c, p.x, p.y, 9 + p.r * 8, 3 + p.r * 1.4, '#8fc4d0', 0.85); }, 40, 20);
    dec('lgrass', 'lake', 90, 10, (p) => tuft(c, p.x, p.y, 6 + p.r * 3, '#5f9a56'), 26, 40);
    dec('lreed', 'lake', 26, 18, (p) => reed(c, p.x, p.y, 10 + p.r * 4), 40, 30);
    dec('lflower', 'lake', 50, 10, (p) => dot(c, p.x, p.y, 1.7, pick(['#fbf7ea', '#b8a3d6', '#f1c75b', '#e9a1c0'], p.r), 0.85), 26, 40);
    dec('lwillow', 'lake', 8, 36, (p) => willow(c, p.x, p.y, 11 + p.r * 4), 44, 20);
    dec('ltree', 'lake', 10, 22, (p) => roundTree(c, p.x, p.y, 10 + p.r * 4, p, '#6fa05a', '#a2cb78'), 44, 20);
    // Shell Beach: pale sand, palms, shells, starfish, driftwood and surf-combed ripples.
    dec('bdune', 'beach', 26, 10, (p) => brush(c, quad(p.x - 16, p.y, p.x, p.y - 8, p.x + 16, p.y, 6), 1.6, '#c9a672', 0.55), 26, 40);
    dec('bpalm', 'beach', 16, 20, (p) => palm(c, p.x, p.y, 10 + p.r * 6), 44, 40);
    dec('bshell', 'beach', 46, 8, (p) => { c.fillStyle = p.r > 0.5 ? '#eaa8a0' : '#d8c08a'; c.globalAlpha = 0.85; c.beginPath(); c.ellipse(p.x, p.y, 2.4, 1.6, p.q, 0, 7); c.fill(); c.globalAlpha = 1; }, 26, 40);
    dec('bstar', 'beach', 7, 30, (p) => { c.fillStyle = '#e9786a'; c.globalAlpha = 0.9; c.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + p.r, r = i % 2 ? 1.8 : 4; c.lineTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r); } c.fill(); c.globalAlpha = 1; }, 30, 40);
    dec('bwood', 'beach', 6, 30, (p) => { brush(c, [[p.x - 9, p.y], [p.x + 9, p.y - 3]], 3.2, '#8a7a62', 0.9, 2); line(c, p.x - 2, p.y - 1, p.x + 4, p.y - 6, 1.4, '#8a7a62', 0.8, 0); }, 30, 40);
    dec('bgrass', 'beach', 30, 12, (p) => tuft(c, p.x, p.y, 7, '#8a9a4a', 0.65), 28, 40);
    // Coral Shallows: coral gardens and palms on the islets.
    World.nodes.filter((n) => n.sub === 'coral').forEach((n, i) => palm(c, n.x + (i % 2 ? 26 : -28), n.y + 4, 11));
    scatter('coralreef', lagoonPath, grow(coral.bounds, 20), 90, 12, (p) => {
      c.globalAlpha = 0.75; c.strokeStyle = ['#e9877f', '#f0b26a', '#d86f93', '#b78ad0'][Math.floor(p.r * 4)]; c.lineWidth = 1.8; c.lineCap = 'round';
      for (const d of [-3, 0, 3]) { c.beginPath(); c.moveTo(p.x + d, p.y); c.lineTo(p.x + d * 1.5, p.y - 5 - p.q * 5); c.stroke(); }
      c.globalAlpha = 1; c.lineCap = 'butt';
    }, 28);
    scatter('lagfish', lagoonPath, grow(coral.bounds, 0), 14, 30, (p) => { c.save(); c.translate(p.x, p.y); c.scale(p.q > 0.5 ? 1 : -1, 1); poly(c, [[0, 0], [-4, -1.4], [-6, 1.2], [-3, 1.8]], '#f0904a', 0.85); poly(c, [[-6, 0], [-9, -2], [-9, 2.6]], '#f0904a', 0.85); c.restore(); }, 30);
    // Shipwreck Cove: wet grey sand, black rocks, tide pools, weed and bones.
    dec('cwet', 'cove', 22, 26, (p) => soft(c, p.x, p.y, 26 + p.r * 22, 9, '#8a7c66', 0.3), 30, 20);
    dec('cpool', 'cove', 9, 34, (p) => { ell(c, p.x, p.y, 13 + p.r * 8, 5 + p.r * 2, '#f6efdc', 0.7); ell(c, p.x, p.y, 10 + p.r * 7, 3.6 + p.r * 1.6, '#6fa4ae', 0.9); }, 40, 20);
    dec('crock', 'cove', 26, 12, (p) => rock(c, p.x, p.y, 5 + p.r * 9, '#58606c', '#98a2ae'), 40, 40);
    dec('cweed', 'cove', 16, 16, (p) => { for (const d of [-2, 0, 2]) line(c, p.x + d, p.y, p.x + d * 2, p.y - 6 - p.q * 4, 1.6, '#3f5a3a', 0.8, d); }, 26, 30);
    dec('cbone', 'cove', 5, 40, (p) => { brush(c, [[p.x - 5, p.y], [p.x + 5, p.y - 2]], 2.4, '#f4ecd7', 0.9, 2); dot(c, p.x - 5, p.y, 1.6, '#f4ecd7', 0.95); dot(c, p.x + 5, p.y - 2, 1.6, '#f4ecd7', 0.95); }, 40, 30);
    dec('cwood', 'cove', 7, 30, (p) => { brush(c, [[p.x - 10, p.y], [p.x + 10, p.y - 3]], 3.4, '#6a5a46', 0.92, 2); }, 30, 30);
    dec('cstack', 'cove', 4, 70, (p) => { const s = 9 + p.r * 5; soft(c, p.x + 4, p.y + 1, s * 1.2, s * 0.3, '#2a2a2a', 0.25); poly(c, [[p.x - s * 0.8, p.y], [p.x - s * 0.5, p.y - s * 2.6], [p.x - s * 0.1, p.y - s * 3], [p.x + s * 0.4, p.y - s * 2.2], [p.x + s * 0.9, p.y]], '#59606c', 0.95); poly(c, [[p.x - s * 0.1, p.y - s * 3], [p.x + s * 0.4, p.y - s * 2.2], [p.x + s * 0.9, p.y], [p.x + s * 0.1, p.y]], '#2e333c', 0.45); outline(c, [[p.x - s * 0.8, p.y], [p.x - s * 0.5, p.y - s * 2.6], [p.x - s * 0.1, p.y - s * 3], [p.x + s * 0.4, p.y - s * 2.2], [p.x + s * 0.9, p.y]], INK, 1, 0.55); }, 56, 30);
    // Dune Sea: ripples, crescent dunes, cacti and dry bones.
    dec('dripple', 'dunes', 40, 20, (p) => ripples(c, p.x, p.y, 20, 2, '#b9823e', 0.4), 36, 40);
    dec('dune', 'dunes', 32, 10, (p) => { const s = 18 + p.r * 14; soft(c, p.x + 4, p.y + 3, s * 0.9, s * 0.25, '#b9823e', 0.28); brush(c, quad(p.x - s, p.y + 6, p.x - s * 0.1, p.y - s * 0.55, p.x + s, p.y + 6, 8), 2, '#a8743a', 0.6); }, 30, 40);
    dec('cactus', 'dunes', 9, 16, (p) => cactus(c, p.x, p.y, 8 + p.r * 4), 44, 30);
    dec('drock', 'dunes', 8, 14, (p) => rock(c, p.x, p.y, 5 + p.r * 4, '#c79a62', '#e8cfa0'), 40, 40);
    dec('dbush', 'dunes', 16, 16, (p) => tuft(c, p.x, p.y, 6, '#8a7a3a', 0.7), 28, 40);
    dec('dskull', 'dunes', 2, 90, (p) => { dot(c, p.x, p.y, 3.4, '#f4ecd7', 0.95); dot(c, p.x - 1.2, p.y - 0.4, 0.8, INK, 0.8); dot(c, p.x + 1.2, p.y - 0.4, 0.8, INK, 0.8); }, 60, 30);
    // Palm Oasis: sand with green islands, shrubs, a few palms.
    dec('oripple', 'oasis', 28, 20, (p) => ripples(c, p.x, p.y, 20, 2, '#b9823e', 0.38), 36, 40);
    dec('ogreen', 'oasis', 14, 26, (p) => { soft(c, p.x, p.y, 24 + p.r * 16, 9, '#8fb25a', 0.4); tuft(c, p.x - 6, p.y, 6, '#4f8a3a', 0.7); tuft(c, p.x + 6, p.y + 2, 6, '#4f8a3a', 0.7); }, 34, 30);
    dec('opalm', 'oasis', 7, 30, (p) => palm(c, p.x, p.y, 10 + p.r * 5), 46, 30);
    dec('odune', 'oasis', 14, 12, (p) => { const s = 16 + p.r * 12; soft(c, p.x + 4, p.y + 3, s * 0.9, s * 0.25, '#b9823e', 0.26); brush(c, quad(p.x - s, p.y + 6, p.x - s * 0.1, p.y - s * 0.55, p.x + s, p.y + 6, 8), 2, '#a8743a', 0.55); }, 30, 40);
    dec('orock', 'oasis', 6, 14, (p) => rock(c, p.x, p.y, 5 + p.r * 4, '#c79a62', '#e8cfa0'), 40, 40);
    // Buried Temple: broken columns, paving, drifts and half-buried statues.
    dec('tpave', 'temple', 8, 40, (p) => { c.save(); c.translate(p.x, p.y); c.scale(1, 0.5); c.rotate(0.3); for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++) { c.fillStyle = (i + j) % 2 ? 'rgba(196,150,100,.5)' : 'rgba(240,215,170,.55)'; c.fillRect(i * 12 - 6, j * 12 - 6, 11, 11); } c.restore(); }, 40, 30);
    dec('tcolumns', 'temple', 16, 14, (p) => { const h = 8 + p.r * 12; soft(c, p.x + 3, p.y + 1, 7, 2.4, '#6a4a2a', 0.3); brush(c, [[p.x, p.y], [p.x, p.y - h]], 5, '#efd9ab', 0.95, 2); brush(c, [[p.x - 4, p.y - h - 1], [p.x + 4, p.y - h - 1]], 2.4, '#b88a58', 0.9, 2); line(c, p.x + 1.8, p.y, p.x + 1.8, p.y - h, 1.2, '#a8744a', 0.4, 0); }, 36, 30);
    dec('tblock', 'temple', 12, 20, (p) => { poly(c, [[p.x - 6, p.y], [p.x - 5, p.y - 5], [p.x + 5, p.y - 6], [p.x + 6, p.y]], '#e0c08a', 0.95); outline(c, [[p.x - 6, p.y], [p.x - 5, p.y - 5], [p.x + 5, p.y - 6], [p.x + 6, p.y]], INK, 0.8, 0.5, true); }, 36, 30);
    dec('tdune', 'temple', 22, 10, (p) => brush(c, quad(p.x - 16, p.y, p.x, p.y - 7, p.x + 16, p.y, 6), 1.8, '#a8744a', 0.5), 28, 40);
    dec('tdrift', 'temple', 12, 26, (p) => soft(c, p.x, p.y, 28 + p.r * 20, 8, '#f3dca8', 0.65), 30, 20);
    dec('tmini', 'temple', 3, 70, (p) => { const s = 12 + p.r * 6; soft(c, p.x + 5, p.y + 2, s * 1.2, s * 0.24, '#6a4a2a', 0.25); poly(c, [[p.x - s, p.y], [p.x, p.y - s * 0.95], [p.x + s * 0.2, p.y]], '#e4bf80', 0.92); poly(c, [[p.x, p.y - s * 0.95], [p.x + s, p.y], [p.x + s * 0.2, p.y]], '#c0885a', 0.92); outline(c, [[p.x - s, p.y], [p.x, p.y - s * 0.95], [p.x + s, p.y]], INK, 1, 0.55, true); }, 56, 30);
    // Snowdrift Plains: drifts, frosted pines, boulders under snow.
    dec('smound', 'snow', 34, 12, (p) => { soft(c, p.x, p.y + 3, 18 + p.r * 14, 6, '#9cb4c6', 0.38); soft(c, p.x, p.y, 16 + p.r * 12, 6, '#ffffff', 0.75); }, 28, 40);
    dec('spine', 'snow', 70, 14, (p) => pine(c, p.x, p.y, 8 + p.r * 5, p, '#3d6560', '#7fa8a0', true), 44, 40);
    dec('srock', 'snow', 10, 20, (p) => { rock(c, p.x, p.y, 5 + p.r * 5, '#8a98aa', '#d0dae4'); soft(c, p.x, p.y - 5 - p.r * 4, 6 + p.r * 4, 2.6, '#ffffff', 0.85); }, 36, 30);
    dec('ssparkle', 'snow', 40, 14, (p) => sparkle(c, p.x, p.y, 1.8 + p.r * 1.4, '#ffffff', 0.85), 26, 40);
    // Frozen Lake shore: ice plates, blue crystals, cracks and frosted reeds.
    dec('iceplate', 'frozen', 22, 22, (p) => { const s = 14 + p.r * 16, pts = []; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + p.q; pts.push([p.x + Math.cos(a) * s, p.y + Math.sin(a) * s * 0.42]); } poly(c, pts, '#f2fafc', 0.5); outline(c, pts, '#7fa8c8', 1, 0.45, true); }, 26, 40);
    dec('ice', 'frozen', 40, 12, (p) => crystal(c, p.x, p.y, 4 + p.r * 5, '#9ec6e2', '#ffffff'), 36, 40);
    dec('cracks', 'frozen', 20, 8, (p) => { brush(c, [[p.x, p.y], [p.x + 8, p.y + 2 - p.r * 8], [p.x + 18, p.y + 2]], 1.5, '#5d86ab', 0.5); }, 28, 30);
    dec('freed', 'frozen', 16, 18, (p) => { for (let i = -1; i <= 1; i++) brush(c, [[p.x + i * 3, p.y], [p.x + i * 4, p.y - 10 - i * i * 3]], 1.6, '#b4cfe0', 0.9, 2); dot(c, p.x, p.y - 12, 1.5, '#ffffff', 0.9); }, 28, 30);
    dec('fsparkle', 'frozen', 36, 14, (p) => sparkle(c, p.x, p.y, 1.8 + p.r * 1.4, '#ffffff', 0.85), 26, 40);
    // Rime Forest: lilac hoarfrost, glassy pines, ice crystals.
    dec('rmound', 'rime', 18, 18, (p) => { soft(c, p.x, p.y + 3, 18 + p.r * 14, 6, '#a3b0d2', 0.38); soft(c, p.x, p.y, 16 + p.r * 12, 6, '#ffffff', 0.78); }, 28, 40);
    dec('rfrost', 'rime', 26, 18, (p) => { for (let i = 0; i < 3; i++) brush(c, [[p.x, p.y], [p.x + (i - 1) * 6, p.y - 7 - (i % 2) * 3]], 1.2, '#8fa4d0', 0.6, 2); }, 26, 40);
    dec('rpine', 'rime', 56, 15, (p) => frostPine(c, p.x, p.y, 8 + p.r * 5), 44, 40);
    dec('rcrystal', 'rime', 18, 20, (p) => crystal(c, p.x, p.y, 3 + p.r * 4, '#b8c6ee', '#ffffff'), 36, 40);
    dec('rsparkle', 'rime', 54, 12, (p) => sparkle(c, p.x, p.y, 1.8 + p.r * 1.8, p.q > 0.5 ? '#ffffff' : '#c8d8ff', 0.9), 26, 40);
    // Ash Fields: cinder drifts, cracked ground with embers, burnt snags.
    dec('ashpool', 'ash', 22, 12, (p) => soft(c, p.x, p.y, 20 + p.r * 18, 8, '#4d4440', 0.3), 28, 40);
    dec('acrack', 'ash', 16, 24, (p) => { const pts = bez([p.x - 14, p.y], [p.x - 4, p.y - 6 - p.r * 6], [p.x + 4, p.y + 5], [p.x + 15, p.y - 2], 5); brush(c, pts, 2, '#2f2825', 0.6, 2); brush(c, pts, 0.9, '#f08a35', 0.7, 2); }, 30, 30);
    dec('arock', 'ash', 38, 10, (p) => rock(c, p.x, p.y, 4 + p.r * 7, '#5f5652', '#9a8f88'), 40, 40);
    dec('adead', 'ash', 14, 16, (p) => burnt(c, p.x, p.y, 8 + p.r * 5, p.q > 0.6), 44, 30);
    dec('aember', 'ash', 40, 12, (p) => dot(c, p.x, p.y, 1.1, '#ffb14a', 0.8), 26, 40);
    // Obsidian Ridge: black glass shards, violet sheen and pale crystals.
    dec('rgsheen', 'ridge', 22, 24, (p) => brush(c, quad(p.x - 20, p.y, p.x, p.y - 5, p.x + 20, p.y + 1, 6), 2, '#9a8fc8', 0.3), 26, 40);
    dec('rgglow', 'ridge', 16, 30, (p) => soft(c, p.x, p.y, 24 + p.r * 14, 8, '#6a5aa0', 0.3), 30, 30);
    dec('rgshard', 'ridge', 34, 18, (p) => shard(c, p.x, p.y, 6 + p.r * 6, 12 + p.q * 18, (p.r - 0.5) * 6, '#2a2640', '#8c82c0'), 44, 40);
    dec('rgcrystal', 'ridge', 20, 22, (p) => crystal(c, p.x, p.y, 3 + p.r * 3, '#4a4470', '#a89ee0'), 36, 40);
    dec('rgrock', 'ridge', 14, 18, (p) => rock(c, p.x, p.y, 4 + p.r * 6, '#2e2a40', '#6e6890'), 40, 40);
    // Magma Caldera: scorched rock, glowing cracks, lava pools and vents.
    const cal = S('caldera');
    c.save(); c.clip(landPaths.caldera);
    for (const pts of LAVA_FLOWS) { const sm = smooth(pts, 4); brush(c, sm, 18, '#2a1b1a', 0.55, 2); brush(c, sm, 11, '#c9452a', 0.88, 2); brush(c, sm, 5, '#f4a23c', 0.92, 2); lava.push(pts); obstacles.push(...pts.slice(0, -1).map((p, i) => [{ x: p[0], y: p[1] }, { x: pts[i + 1][0], y: pts[i + 1][1] }, 18])); }
    c.restore();
    dec('cgcrack', 'caldera', 30, 22, (p) => { const pts = bez([p.x - 16, p.y], [p.x - 4, p.y - 6 - p.r * 6], [p.x + 4, p.y + 5], [p.x + 17, p.y - 2], 5); brush(c, pts, 2.4, '#1e1414', 0.7, 2); brush(c, pts, 1.1, '#f08a35', 0.85, 2); }, 30, 40);
    dec('cgpool', 'caldera', 6, 60, (p) => lavaPool(c, p.x, p.y, 12 + p.r * 8, 5 + p.r * 3), 56, 30);
    dec('cgvent', 'caldera', 4, 70, (p) => { rock(c, p.x, p.y, 5, '#3a2c2a', '#7a625c'); soft(c, p.x, p.y - 12, 14, 10, '#8a7d78', 0.4); soft(c, p.x + 5, p.y - 24, 12, 9, '#a89a94', 0.3); }, 50, 30);
    dec('cgrock', 'caldera', 28, 10, (p) => rock(c, p.x, p.y, 4 + p.r * 6, '#3a2c2a', '#7a625c'), 40, 40);

    // Brushed torii gates behind each boss.
    for (const sub of World.SUBAREAS) { const bn = World.byId[sub.id + '-boss']; c.globalAlpha = 0.62; torii(c, bn.x, bn.y - 14, 60); c.globalAlpha = 1; }

    // ----- Landmarks (the big memorable thing each sub-area is named for) -----
    for (const sub of World.SUBAREAS.slice().sort((a, b) => a.landmark.y - b.landmark.y)) {
      const L = sub.landmark, fn = LANDMARKS[L.kind]; if (!fn) continue;
      c.save(); c.translate(L.x, L.y); const k = L.rx / 58 * 1.1; c.scale(k, k); fn(c, L); c.restore();
      inkLabel(c, L.label, L.x, L.y + L.ry + 24, 10.5, 0.5);
    }

    // ----- Sea: wave curls, sails, ice floes -----
    const R2 = R0('waves');
    let curls = 0;
    for (let i = 0; i < 5000 && curls < 80; i++) {
      const x = R2() * MAP_W, y = R2() * H2;
      if (hit.isPointInPath(landAll, x, y) || hit.isPointInPath(lagoonPath, x, y)) continue;
      curls++;
      c.strokeStyle = rgba('#3d5a80', 0.35); c.lineWidth = 1.4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x - 10, y + 2); c.quadraticCurveTo(x - 4, y - 7, x + 3, y - 2); c.quadraticCurveTo(x + 7, y + 1, x + 5, y - 3); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(x - 14, y + 5); c.lineTo(x + 12, y + 5); c.stroke(); c.lineCap = 'butt';
      if (water.length < 80) water.push({ x, y: y - 2, ph: R2() * 6 });
    }
    for (const [x, y, s, f] of [[104, 1790, 1.1, 0], [906, 1980, 1, 1], [96, 2190, 1.2, 1], [900, 2290, 1.1, 0], [250, 2470, 1.2, 0], [760, 2500, 1, 1], [920, 1750, 1, 0], [80, 1700, 0.9, 1]])
      if (!hit.isPointInPath(landAll, x, y)) sailboat(c, x, y, s, f);
    for (const [x, y, s] of [[110, 52, 18], [250, 62, 14], [370, 44, 20], [180, 100, 10], [60, 30, 12]]) floe(c, x, y, s);
    for (const [x, y, s] of [[780, 40, 9], [900, 60, 12], [860, 24, 7]]) { rock(c, x, y, s, '#3a3a40', '#7a7a84'); soft(c, x, y - s * 1.4, s * 1.2, s * 0.9, '#8a7d78', 0.3); }
    // the pair of sea-stacks guarding the cove
    for (const [x, y, s] of [[26, 1110, 6], [30, 880, 7], [980, 880, 7]]) if (!hit.isPointInPath(landAll, x, y)) rock(c, x, y, s, '#58606c', '#98a2ae');

    // ----- Mist between regions: kasumi bands drifting across the seams and through the mountain pass -----
    for (const sub of World.SUBAREAS) {
      const b = sub.bounds;
      for (let x = b[0] - 20; x < b[2] + 30; x += 70) soft(c, x + R() * 20, b[1] - 6 + R() * 18, 60 + R() * 30, 12 + R() * 8, '#f6f0e0', 0.42);
    }
    for (let y = 150; y < 1620; y += 70) soft(c, 500 + (R() - 0.5) * 80, y + R() * 30, 90 + R() * 40, 14 + R() * 8, '#f3eee0', 0.42);
    for (let i = 0; i < 12; i++) soft(c, 480 + R() * 80, 40 + R() * 100, 80, 16, '#f3eee0', 0.4);
    // Edge vignette of washi paper.
    const edge = (x, y, w, h, x0, y0, x1, y1) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(169,198,203,.9)'); g.addColorStop(1, 'rgba(169,198,203,0)'); c.fillStyle = g; c.fillRect(x, y, w, h); };
    edge(0, 0, MAP_W, 40, 0, 0, 0, 40); edge(0, H2 - 50, MAP_W, 50, 0, H2, 0, H2 - 50); edge(0, 0, 32, H2, 0, 0, 32, 0); edge(MAP_W - 32, 0, 32, H2, MAP_W, 0, MAP_W - 32, 0);
    // Granulation: grain multiplied over the pigments.
    c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.55; c.fillStyle = pat; c.fillRect(0, 0, MAP_W, H2); c.restore();
  }

  function buildTerrain() {
    if (terrain) return;
    // Keep the offscreen painting within phone canvas limits (about 2048 x 4960 px).
    TS = Math.min(dpr > 1 ? 2 : 1.4, 2048 / World.MAP_W, 4960 / (World.MAP_H + EXT));
    terrain = document.createElement('canvas');
    terrain.width = Math.round(World.MAP_W * TS); terrain.height = Math.round((World.MAP_H + EXT) * TS);
    const c = terrain.getContext('2d');
    c.scale(TS, TS);
    paintTerrain(c);
    initFog();
    setTimeout(ensureLo, 800);
  }

  function ensureMid() {
    if (terrainMid) return;
    ensureLo();
    terrainMid = document.createElement('canvas'); terrainMid.width = Math.round(World.MAP_W * MID); terrainMid.height = Math.round((World.MAP_H + EXT) * MID);
    const g = terrainMid.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(terrainLo, 0, 0, terrainMid.width, terrainMid.height);
  }
  function ensureLo() {
    if (terrainLo) return;
    terrainLo = document.createElement('canvas'); terrainLo.width = Math.round(World.MAP_W * LO); terrainLo.height = Math.round((World.MAP_H + EXT) * LO);
    const g = terrainLo.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(terrain, 0, 0, terrainLo.width, terrainLo.height);
  }

  // ---------- Walkable ground ----------
  const unlocked = (sub) => !st.save || st.save.unlocked.includes(sub);
  const visibleNode = (n) => n.type === 'camp' || unlocked(n.sub);
  function walkable(x, y) {
    for (const pd of ponds) if (ellHit(pd, x, y, 0)) return false;   // mirror lake and oasis pool: look, don't wade
    for (const sub of World.SUBAREAS) if (unlocked(sub.id) && landPaths[sub.id] && hit.isPointInPath(landPaths[sub.id], x, y)) return true;
    if (unlocked('coral') && lagoonPath && hit.isPointInPath(lagoonPath, x, y)) return true;
    return false;
  }

  // ---------- Sprites: monsters, danger rings, pips ----------
  const monCache = {};
  function monsterSprite(key, big) {
    if (monCache[key]) return monCache[key];
    const m = (monCache[key] = { color: null, grey: null });
    const url = window.Art && window.Art.enemy(key);
    if (!url) return m;
    const img = new Image(), S = big ? 256 : 192;
    img.onload = () => {
      const a = document.createElement('canvas'); a.width = a.height = S;
      a.getContext('2d').drawImage(img, 0, 0, S, S);
      const g = document.createElement('canvas'); g.width = g.height = S;
      const gc = g.getContext('2d');
      gc.drawImage(a, 0, 0);
      gc.globalCompositeOperation = 'saturation'; gc.fillStyle = '#808080'; gc.fillRect(0, 0, S, S);
      gc.globalCompositeOperation = 'destination-in'; gc.drawImage(a, 0, 0);
      gc.globalCompositeOperation = 'source-over'; gc.globalAlpha = 0.18; gc.fillStyle = '#9fb0b8'; gc.globalCompositeOperation = 'source-atop'; gc.fillRect(0, 0, S, S);
      m.color = a; m.grey = g;
    };
    img.src = url;
    return m;
  }
  const HALO = { forest: 0.18, cove: 0.2, ash: 0.42, ridge: 0.62, caldera: 0.55 };
  const DANGER = ['#5f9f6a', '#a9b24a', '#e0a23a', '#d0582f', '#7b4a9c'];
  const ringCache = {};
  function ringSprite(col, rx, ry, flip) {
    const key = col + rx + (flip ? 'f' : ''); if (ringCache[key]) return ringCache[key];
    const K = 3, pad = 10, w = Math.ceil((rx + pad) * 2), h = Math.ceil((ry + pad) * 2);
    const s = document.createElement('canvas'); s.width = w * K; s.height = h * K;
    const g = s.getContext('2d'); g.scale(K, K); if (flip) { g.translate(w, 0); g.scale(-1, 1); }
    g.translate(w / 2, h / 2);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, rgba(col, 0.1)); gr.addColorStop(0.7, rgba(col, 0.28)); gr.addColorStop(1, rgba(col, 0.04));
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 7); g.fill();
    const ring = (a0, sweep, wd, a, rr) => {
      const n = 36, o = [], inn = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, an = a0 + sweep * t, k = (0.2 + 0.8 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.08)), 0.55)) * (1 - t * 0.35) * wd / 2;
        const rrx = rx * rr, rry = ry * rr;
        o.push([(rrx + k) * Math.cos(an), (rry + k * ry / rx) * Math.sin(an)]); inn.push([(rrx - k) * Math.cos(an), (rry - k * ry / rx) * Math.sin(an)]);
      }
      g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.moveTo(o[0][0], o[0][1]);
      o.forEach((p) => g.lineTo(p[0], p[1])); for (let i = n; i >= 0; i--) g.lineTo(inn[i][0], inn[i][1]); g.closePath(); g.fill(); g.globalAlpha = 1;
    };
    ring(2.4, 5.6, 5.5, 0.85, 1); ring(2.9, 5.0, 2.6, 0.55, 0.9); ring(0.6, 2.2, 1.6, 0.4, 1.08);
    g.fillStyle = col; for (let i = 0; i < 7; i++) { const a = i * 2.3 + 0.7; g.globalAlpha = 0.35; g.beginPath(); g.arc((rx + 4 + (i % 3) * 2) * Math.cos(a), (ry + 3 + (i % 3)) * Math.sin(a), 0.9, 0, 7); g.fill(); }
    ringCache[key] = { c: s, w, h };
    return ringCache[key];
  }
  function skull(g, x, y, r, col, eye) {
    g.fillStyle = col; g.beginPath(); g.arc(x, y - r * 0.12, r, Math.PI * 0.9, Math.PI * 2.1); g.lineTo(x + r * 0.55, y + r * 0.62); g.lineTo(x - r * 0.55, y + r * 0.62); g.closePath(); g.fill();
    g.fillStyle = eye; g.beginPath(); g.arc(x - r * 0.38, y - r * 0.1, r * 0.25, 0, 7); g.arc(x + r * 0.38, y - r * 0.1, r * 0.25, 0, 7); g.fill();
  }
  const pillCache = {};
  function pillSprite(n, col, grey) {
    const key = n + col + grey; if (pillCache[key]) return pillCache[key];
    const K = 3, w = 9 + n * 10.5, h = 17, s = document.createElement('canvas'); s.width = Math.ceil(w * K) + 6; s.height = Math.ceil(h * K) + 6;
    const g = s.getContext('2d'); g.scale(K, K); g.translate(1, 1);
    g.fillStyle = grey ? '#e9e5da' : '#fbf5e4'; g.strokeStyle = grey ? '#9b9a96' : col; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(h / 2, 0); g.lineTo(w - h / 2, 0); g.arc(w - h / 2, h / 2, h / 2, -Math.PI / 2, Math.PI / 2); g.lineTo(h / 2, h); g.arc(h / 2, h / 2, h / 2, Math.PI / 2, Math.PI * 1.5); g.closePath(); g.fill(); g.stroke();
    for (let i = 0; i < n; i++) skull(g, 4.5 + 4.6 + i * 10.5, h / 2 + 0.2, 3.9, grey ? '#9a9a96' : INK, grey ? '#e9e5da' : '#fbf5e4');
    return (pillCache[key] = { c: s, w: w + 6 / K, h: h + 6 / K });
  }

  // ---------- Fog ----------
  const mistSprite = (() => {
    const s = document.createElement('canvas'); s.width = s.height = 128;
    const g = s.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(236,234,226,1)'); gr.addColorStop(0.5, 'rgba(232,230,222,.72)'); gr.addColorStop(1, 'rgba(228,228,222,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return s;
  })();
  const shadeSprite = (() => {
    const s = document.createElement('canvas'); s.width = s.height = 128;
    const g = s.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(104,120,150,.7)'); gr.addColorStop(1, 'rgba(104,120,150,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return s;
  })();
  // Fog over locked sub-areas is painted once into a small texture per sub-area (tinted mist, faint ink-wash peaks),
  // so a frame only costs one drawImage per locked area plus a few drifting wisps.
  const FOG_TINT = { meadow: '#cfe0b0', forest: '#b4cba8', lake: '#bcd4d6', beach: '#f0e2c0', coral: '#bde4e0', cove: '#d8cdb8', dunes: '#f0d8a8', oasis: '#e8dcae', temple: '#e6c8a0', snow: '#eaf2f8', frozen: '#d2e6f0', rime: '#dde2f2', ash: '#bdb5b0', ridge: '#a9a2bc', caldera: '#c4a49c' };
  const fogTex = {};
  const FS = 0.6;
  function initFog() {
    for (const sub of World.SUBAREAS) {
      const R = R0('fog:' + sub.id), b = grow(sub.bounds, 112), w = b[2] - b[0], h = b[3] - b[1], lp = landPaths[sub.id] || lagoonPath, pb = grow(sub.bounds, 22);
      const cv = document.createElement('canvas'); cv.width = Math.ceil(w * FS); cv.height = Math.ceil(h * FS);
      const g = cv.getContext('2d'); g.scale(FS, FS); g.translate(-b[0], -b[1]);
      const puffs = [];
      for (let y = pb[1]; y <= pb[3]; y += 30) for (let x = pb[0]; x <= pb[2]; x += 34) {
        const px = x + (R() - 0.5) * 24, py = y + (R() - 0.5) * 24;
        if (lp && !hit.isPointInPath(lp, px, py)) continue;
        puffs.push({ x: px, y: py, r: 40 + R() * 30 });
      }
      g.globalAlpha = 0.75; for (const p of puffs) g.drawImage(shadeSprite, p.x + 3 - p.r, p.y + 12 - p.r, p.r * 2, p.r * 2);
      g.globalAlpha = 0.93; for (const p of puffs) g.drawImage(mistSprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      // the land's own colour tints the mist; faint ink-wash peaks loom through it
      g.globalAlpha = 1;
      for (const p of puffs) if (R() > 0.45) soft(g, p.x, p.y, p.r * 1.1, p.r * 0.8, FOG_TINT[sub.id] || '#dcdcd4', 0.34);
      for (let i = 0; i < 5; i++) {
        const px = sub.bounds[0] + (sub.bounds[2] - sub.bounds[0]) * (0.1 + 0.8 * R()), py = sub.bounds[1] + (sub.bounds[3] - sub.bounds[1]) * (0.5 + 0.35 * R()), s = 36 + R() * 34;
        g.globalAlpha = 0.17; g.fillStyle = '#5b6a92'; g.beginPath(); g.moveTo(px - s, py); g.quadraticCurveTo(px - s * 0.4, py - s * 0.7, px - s * 0.08, py - s * 1.3); g.lineTo(px + s * 0.1, py - s * 1.25); g.quadraticCurveTo(px + s * 0.4, py - s * 0.6, px + s, py); g.closePath(); g.fill();
        g.globalAlpha = 1; soft(g, px, py - s * 0.15, s * 1.3, s * 0.4, '#ecebe4', 0.6);
      }
      for (let i = 0; i < 6; i++) { g.globalAlpha = 0.5; g.drawImage(shadeSprite, b[0] + R() * w - 60, b[1] + R() * h - 7, 120 + R() * 60, 14); }
      g.globalAlpha = 1;
      fogTex[sub.id] = { cv, b, w, h };
    }
  }
  const wisps = []; { const R = R0('wisps'); for (let i = 0; i < 16; i++) wisps.push({ x: R() * World.MAP_W, y: R() * World.MAP_H, w: 90 + R() * 80, sp: 4 + R() * 6, ph: R() * 6 }); }
  function bossNameFor(subId) { return World.THEMES[World.SUB_BY[subId].from] ? World.THEMES[World.SUB_BY[subId].from].boss[0] : ''; }

  // ---------- Frame ----------
  function clampCam() {
    const hw = vw / 2 / zIn, hh = vh / 2 / zIn;
    cam.x = World.MAP_W < hw * 2 ? World.MAP_W / 2 : Math.max(hw, Math.min(World.MAP_W - hw, cam.x));
    // Extra room at the bottom so the southern edge can scroll above the bottom sheet.
    cam.y = Math.max(hh - 40, Math.min(World.MAP_H - hh + vh * 0.45 / zIn, cam.y));
  }
  const ease = (t) => t * t * (3 - 2 * t);

  function frame(now) {
    if (!active) return;
    const dt = Math.min(0.05, (now - (frame.last || now)) / 1000); frame.last = now; T += dt;
    stepToken(dt);
    if (follow) { cam.x += (follow.x - cam.x) * Math.min(1, dt * 5); cam.y += (follow.y - cam.y) * Math.min(1, dt * 5); }
    clampCam();
    ovT = Math.max(0, Math.min(1, ovT + (ovOn ? 1 : -1) * dt * 2.6));
    const e = ease(ovT);
    z = zIn * Math.pow(zOv / zIn, e);
    vx = cam.x + (World.MAP_W / 2 - cam.x) * e; vy = cam.y + (World.MAP_H / 2 + 20 - cam.y) * e;
    for (const sub of World.SUBAREAS) {
      const target = unlocked(sub.id) ? 0 : 1;
      if (fogA[sub.id] === undefined) fogA[sub.id] = target;
      fogA[sub.id] += Math.sign(target - fogA[sub.id]) * Math.min(Math.abs(target - fogA[sub.id]), dt * 0.6);
    }
    for (let i = prints.length - 1; i >= 0; i--) if (T - prints[i].t > 7) prints.splice(i, 1);
    draw();
    requestAnimationFrame(frame);
  }

  let X0, Y0, WW, WH;
  const inView = (x, y, m) => x > X0 - m && x < X0 + WW + m && y > Y0 - m && y < Y0 + WH + m;

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#a9c6cb'; ctx.fillRect(0, 0, vw, vh);
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (vw / 2 - vx * z), dpr * (vh / 2 - vy * z));
    X0 = vx - vw / 2 / z; Y0 = vy - vh / 2 / z; WW = vw / z; WH = vh / z;
    const sx0 = Math.max(0, X0), sy0 = Math.max(0, Y0), sx1 = Math.min(World.MAP_W, X0 + WW), sy1 = Math.min(World.MAP_H + EXT, Y0 + WH);
    if (sx1 > sx0 && sy1 > sy0) {
      // Zoomed out: use a pre-shrunk copy of the painting so the big bitmap is not resampled every frame.
      let src = terrain, k = TS;
      if (z * dpr < 0.5) { ensureMid(); src = terrainMid; k = MID; }
      else if (z * dpr < 0.95) { ensureLo(); src = terrainLo; k = LO; }
      ctx.drawImage(src, sx0 * k, sy0 * k, (sx1 - sx0) * k, (sy1 - sy0) * k, sx0, sy0, sx1 - sx0, sy1 - sy0);
    }
    const e = ease(ovT), detail = clamp01(1 - e * 2.2), marks = clamp01(e * 2.2 - 0.3);

    drawWater();
    if (e < 0.5) drawSparks();
    weather();
    drawPaths(e);
    drawLabels(e);
    drawPrints();
    drawEntities(detail, marks);
    drawWisps();
    drawFog();
    drawDest();
  }

  function drawWater() {
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
    for (const w of water) {
      if (!inView(w.x, w.y, 20)) continue;
      const a = Math.sin(T * 1.2 + w.ph); if (a < 0.1) continue;
      ctx.globalAlpha = (a - 0.1) * 0.7; const dx = Math.sin(T * 0.8 + w.ph) * 4;
      ctx.beginPath(); ctx.arc(w.x + dx, w.y, 7, 3.6, 5.8); ctx.stroke();
    }
    // River flow: pale dashes sliding along the current.
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.setLineDash([7, 22]); ctx.lineDashOffset = -T * 16;
    ctx.globalAlpha = 1;
    for (const r of riverPaths) { const p0 = r.pts[0], p1 = r.pts[r.pts.length - 1]; if (Math.max(p0[1], p1[1]) < Y0 - 30 || Math.min(p0[1], p1[1]) > Y0 + WH + 30) continue; ctx.stroke(r.path); }
    ctx.setLineDash([]); ctx.lineCap = 'butt'; ctx.globalAlpha = 1;
    if (unlocked('caldera') && lava.length) {
      ctx.save(); ctx.globalAlpha = 0.3 + 0.25 * Math.sin(T * 2); ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
      for (const pts of lava) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); }
      ctx.restore();
    }
  }

  // Small animated touches on the landmarks: water glints, the lighthouse beam, frost sparkle, embers, the crater glow.
  function drawSparks() {
    for (const s of sparks) {
      if (!unlocked(s.sub) || !inView(s.x, s.y, 50)) continue;
      const a = Math.sin(T * 1.6 + s.ph);
      if (s.kind === 'glint') {
        if (a < 0.2) continue;
        ctx.globalAlpha = (a - 0.2) * 0.85; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(s.x + Math.sin(T * 0.6 + s.ph) * 3, s.y, 5.5, 1.2, 0, 0, 7); ctx.fill();
      } else if (s.kind === 'star') {
        if (a < 0) continue;
        const r = 2 + a * 2.6; ctx.globalAlpha = a * 0.9; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(s.x, s.y - r); ctx.lineTo(s.x + r * 0.22, s.y - r * 0.22); ctx.lineTo(s.x + r, s.y); ctx.lineTo(s.x + r * 0.22, s.y + r * 0.22); ctx.lineTo(s.x, s.y + r); ctx.lineTo(s.x - r * 0.22, s.y + r * 0.22); ctx.lineTo(s.x - r, s.y); ctx.lineTo(s.x - r * 0.22, s.y - r * 0.22); ctx.closePath(); ctx.fill();
      } else if (s.kind === 'ember') {
        const k = (T * 0.35 + s.ph) % 1; ctx.globalAlpha = (1 - k) * 0.9; ctx.fillStyle = '#ffb14a'; ctx.beginPath(); ctx.arc(s.x + Math.sin(T + s.ph * 3) * 4, s.y - k * 34, 1.5, 0, 7); ctx.fill();
      } else if (s.kind === 'beacon') {
        soft(ctx, s.x, s.y, 34, 26, '#fff2b0', 0.28 + 0.22 * Math.sin(T * 2));
        const b = Math.cos(T * 0.9);
        if (b > 0.1) { ctx.globalAlpha = b * 0.22; ctx.fillStyle = '#fff7c8'; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - 120 * b, s.y - 22); ctx.lineTo(s.x - 120 * b, s.y + 14); ctx.closePath(); ctx.fill(); }
        else if (b < -0.1) { ctx.globalAlpha = -b * 0.22; ctx.fillStyle = '#fff7c8'; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + 120 * -b, s.y - 22); ctx.lineTo(s.x + 120 * -b, s.y + 14); ctx.closePath(); ctx.fill(); }
      } else if (s.kind === 'crater') {
        soft(ctx, s.x, s.y, 46, 26, '#ff8a3a', 0.2 + 0.16 * Math.sin(T * 2.2));
        for (let i = 0; i < 3; i++) { const k = (T * 0.3 + i / 3) % 1; ctx.globalAlpha = (1 - k) * 0.85; ctx.fillStyle = '#ffb14a'; ctx.beginPath(); ctx.arc(s.x + Math.sin(T * 1.3 + i * 2) * 8 + k * 6, s.y - k * 44, 1.6, 0, 7); ctx.fill(); }
      }
    }
    ctx.globalAlpha = 1;
  }

  function weather() {
    const p = (id, n, fn) => {
      if (!unlocked(id)) return;
      const b = World.SUB_BY[id].bounds; if (b[2] < X0 || b[0] > X0 + WW || b[3] < Y0 || b[1] > Y0 + WH) return;
      const h = b[3] - b[1];
      for (let i = 0; i < n; i++) fn(b, h, i);
      ctx.globalAlpha = 1;
    };
    // Sakura petals drift across the green lands.
    for (const id of ['meadow', 'forest', 'lake']) p(id, 14, (b, h, i) => {
      const sp = 10 + (i * 7) % 12, x = b[0] + ((i * 97) % (b[2] - b[0])) + Math.sin(T * 0.7 + i) * 14;
      let y = (i * 53 + T * sp) % h; const yy = b[1] + y;
      ctx.globalAlpha = 0.8; ctx.fillStyle = i % 2 ? '#f0b6c2' : '#f8d5da';
      ctx.save(); ctx.translate(x + y * 0.25 % (b[2] - b[0]) * 0.1, yy); ctx.rotate(T + i); ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 1.4, 0, 0, 7); ctx.fill(); ctx.restore();
    });
    for (const id of ['snow', 'frozen', 'rime']) p(id, 26, (b, h, i) => {
      const sp = 12 + (i * 7) % 18, x = b[0] + ((i * 97) % (b[2] - b[0])) + Math.sin(T + i) * 8; let y = (i * 53 + T * sp) % h;
      ctx.globalAlpha = 0.85; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, b[1] + y, 1.8, 0, 7); ctx.fill();
    });
    for (const id of ['ash', 'ridge', 'caldera']) p(id, 18, (b, h, i) => {
      const sp = 14 + (i * 7) % 20, x = b[0] + ((i * 97) % (b[2] - b[0])) + Math.sin(T + i) * 8; let y = (i * 53 - T * sp) % h; if (y < 0) y += h;
      ctx.globalAlpha = 0.75; ctx.fillStyle = id === 'ash' ? '#f0a45c' : '#ff7a3a'; ctx.beginPath(); ctx.arc(x, b[1] + y, 1.4, 0, 7); ctx.fill();
    });
  }

  function drawPaths(e) {
    const run = st.run, cleared = new Set(run ? run.cleared : []);
    ctx.lineCap = 'round';
    for (const [a, b] of World.edges) {
      const A = World.byId[a], B = World.byId[b];
      if (!visibleNode(A) || !visibleNode(B)) continue;
      if (Math.max(A.x, B.x) < X0 - 20 || Math.min(A.x, B.x) > X0 + WW + 20 || Math.max(A.y, B.y) < Y0 - 20 || Math.min(A.y, B.y) > Y0 + WH + 20) continue;
      if (A.sub === 'coral' && B.sub === 'coral') continue; // bridges are painted
      const walked = cleared.has(a) && cleared.has(b);
      const mx = (A.x + B.x) / 2 + ((World.hash(a + b) % 11) - 5), my = (A.y + B.y) / 2 + ((World.hash(b + a) % 9) - 4);
      ctx.strokeStyle = 'rgba(120,88,52,.28)'; ctx.lineWidth = 8 + e * 3; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(mx, my, B.x, B.y); ctx.stroke();
      ctx.strokeStyle = walked ? '#fff5d2' : '#f4e6bd'; ctx.lineWidth = walked ? 4 : 3 + e * 1.5; ctx.setLineDash(walked ? [] : [2, 8 + e * 6]);
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(mx, my, B.x, B.y); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.lineCap = 'butt';
  }

  const labelCache = {};
  // Best spot inside the union of `subs` for a label about 2*hw wide: clear of monsters, landmarks and other labels.
  function clearSpot(key, subs, dir, hw, hh, ov) {
    if (labelCache[key]) return labelCache[key];
    hw = hw || 46; hh = hh || 8;
    let x0 = Math.min(...subs.map((s) => s.bounds[0])) + 30, x1 = Math.max(...subs.map((s) => s.bounds[2])) - 30;
    const mx = (x0 + x1) / 2; x0 = Math.min(x0 + Math.max(0, hw - 30), mx); x1 = Math.max(x1 - Math.max(0, hw - 30), mx);
    const y0 = Math.min(...subs.map((s) => s.bounds[1])) - 14, y1 = Math.max(...subs.map((s) => s.bounds[3])) - 10;
    const boxes = [];
    // exploring: the monsters stand tall; overview: they are small discs
    for (const n of World.nodes) boxes.push(ov ? { x: n.x, y: n.y, w: 23, h: 23 } : { x: n.x, y: n.y - 36, w: n.type === 'boss' ? 54 : 36, h: n.type === 'boss' ? 62 : 46 });
    if (!ov) for (const sub of World.SUBAREAS) { const L = sub.landmark; boxes.push({ x: L.x, y: L.y - 12, w: L.rx + 20, h: 42 }); }
    let best = null;
    for (let y = y0; y <= y1; y += 10) for (let x = x0; x <= x1; x += 10) {
      let clear = 999;
      for (const q of boxes) { const dx = Math.max(0, Math.abs(x - q.x) - q.w - hw), dy = Math.max(0, Math.abs(y - q.y) - q.h - hh); clear = Math.min(clear, Math.hypot(dx * 0.6, dy)); }
      for (const k in labelCache) { const l = labelCache[k]; clear = Math.min(clear, Math.hypot(Math.max(0, Math.abs(l.x - x) - l.hw - hw) * 0.6, Math.max(0, Math.abs(l.y - y) - 14))); }
      const score = Math.min(clear, 30) + (dir < 0 ? y0 - y : dir > 0 ? y - y1 : -Math.abs(y - (y0 + y1) / 2)) * 0.02;
      if (!best || score > best.score) best = { x, y, score, hw };
    }
    return (labelCache[key] = best);
  }
  function inkText(txt, x, y, px, alpha, weight, italic) {
    const fs = px / z;
    ctx.font = (italic ? 'italic ' : '') + weight + ' ' + fs + 'px "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
    ctx.globalAlpha = alpha * 0.85; ctx.lineWidth = fs * 0.28; ctx.strokeStyle = PAPER; ctx.strokeText(txt, x, y);
    ctx.globalAlpha = alpha; ctx.fillStyle = INK; ctx.fillText(txt, x, y);
    ctx.globalAlpha = alpha * 0.55; ctx.strokeStyle = VERM; ctx.lineWidth = fs * 0.07; ctx.beginPath(); const w = ctx.measureText(txt).width; ctx.moveTo(x - w * 0.5, y + fs * 0.2); ctx.quadraticCurveTo(x, y + fs * 0.28, x + w * 0.5, y + fs * 0.16); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function drawLabels(e) {
    const done = new Set();
    for (const sub of World.SUBAREAS) {
      if (!unlocked(sub.id)) continue;
      const ov = e > 0.5, at = ov ? clearSpot('subov:' + sub.id, [sub], -1, sub.name.length * 0.25 * 10.4 / zOv, 6.6 / zOv, true) : clearSpot('sub:' + sub.id, [sub], -1, sub.name.length * 3.3, 8);
      if (inView(at.x, at.y, 120)) {
        const px = 12 - e * 1.6, w = (sub.name.length * px * 0.5) / z;
        inkText(sub.name, Math.max(w / 2 + 14, Math.min(World.MAP_W - w / 2 - 14, at.x)), at.y, px, 0.9 * (1 - (fogA[sub.id] || 0)), 600, true);
      }
      if (!done.has(sub.region)) {
        done.add(sub.region);
        if (e > 0.15) {
          const subs = World.SUBAREAS.filter((s) => s.region === sub.region), at2 = clearSpot('reg:' + sub.region, subs, 0, 150, 30, true);
          inkText(sub.region.toUpperCase(), Math.max(190, Math.min(World.MAP_W - 190, at2.x)), at2.y, 19, clamp01((e - 0.15) * 2) * 0.55, 700, false);
        }
      }
    }
  }

  // ---------- Entities: nodes and the hero, sorted by depth ----------
  const lvlDifficulty = (n) => {
    if (n.type === 'boss') return 5;
    if (n.type === 'elite') return 4;
    const sub = World.SUB_BY[n.sub], span = Math.max(1, sub.lv[1] - sub.lv[0]);
    return 1 + Math.round(clamp01((n.level - sub.lv[0]) / span) * 2);
  };
  function roleOf(n) { return n.role || (n.type === 'boss' ? 'boss' : n.type === 'elite' ? 'tough' : 'basic'); }
  const nodeH = (n) => (n.type === 'boss' ? 112 : n.type === 'elite' ? 84 : n.type === 'camp' ? 46 : n.type === 'battle' ? 74 : 34);

  function nodeState(n) {
    if (n.type === 'camp') return 'camp';
    const run = st.run;
    if (!run) return 'open';
    if (run.cleared.includes(n.id)) return 'done';
    return st.frontier.has(n.id) ? 'near' : 'far';
  }

  function drawEntities(detail, marks) {
    const list = [];
    for (const n of World.nodes) if (visibleNode(n) && inView(n.x, n.y - 40, 90)) list.push({ y: n.y, n });
    const hy = token.y;
    list.push({ y: hy, hero: true });
    list.sort((a, b) => a.y - b.y);
    for (const it of list) {
      if (it.hero) { drawHero(ease(ovT)); continue; }
      if (detail > 0.02) drawNode(it.n, detail);
      if (marks > 0.02) drawMarker(it.n, marks);
    }
  }

  function drawNode(n, A) {
    const type = n.type, state = nodeState(n), done = state === 'done', far = state === 'far';
    if (type === 'camp') return drawCamp(n, A);
    if (type === 'shrine') return drawShrine(n, A, done, far);
    if (type === 'treasure') return drawChest(n, A, done, far);
    const boss = type === 'boss', elite = type === 'elite';
    const rx = boss ? 46 : elite ? 33 : 29, ry = rx * 0.4, S = boss ? 96 : elite ? 72 : 64;
    const diff = lvlDifficulty(n), col = DANGER[diff - 1], grey = far || done;
    const flip = World.hash(n.id) % 2 === 1;
    const near = state === 'near';
    // frontier pulse
    if (near) {
      const k = (T * 0.9) % 1;
      ctx.globalAlpha = A * 0.8 * (1 - k); ctx.strokeStyle = '#e8b04a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(n.x, n.y, rx + 6 + k * 14, ry + 3 + k * 6, 0, 0, 7); ctx.stroke();
    }
    // a soft paper halo keeps rings and monsters readable on dark ground
    const hz = HALO[n.sub];
    if (hz) soft(ctx, n.x, n.y - 2, rx * 1.7, ry * 2.6, PAPER, A * hz * (done ? 0.5 : 1));
    // danger ring
    const rs = ringSprite(grey ? '#8f918f' : col, rx, ry, flip);
    ctx.globalAlpha = A * (done ? 0.35 : far ? 0.55 : 1);
    const br = near ? 1 + Math.sin(T * 3) * 0.015 : 1;
    ctx.drawImage(rs.c, n.x - rs.w / 2 * br, n.y - rs.h / 2 * br, rs.w * br, rs.h * br);
    if (boss && !done) { // vermilion pennants flank the boss
      for (const sd of [-1, 1]) {
        const fx = n.x + sd * (rx + 8), sway = Math.sin(T * 2.5 + sd) * 2;
        ctx.globalAlpha = A * (far ? 0.5 : 0.9); ctx.strokeStyle = '#4a3a2e'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(fx, n.y + 4); ctx.lineTo(fx, n.y - 46); ctx.stroke();
        ctx.fillStyle = far ? '#9b9a96' : VERM; ctx.beginPath(); ctx.moveTo(fx, n.y - 46); ctx.quadraticCurveTo(fx + sd * 9, n.y - 44 + sway, fx + sd * 16, n.y - 40 + sway); ctx.quadraticCurveTo(fx + sd * 9, n.y - 38, fx, n.y - 34); ctx.closePath(); ctx.fill();
      }
    }
    // monster standing in the world
    const m = monsterSprite(n.sub + '_' + roleOf(n), boss), spr = m.color ? (grey ? m.grey : m.color) : null;
    const idle = 1 + Math.sin(T * (near ? 3.2 : 1.8) + n.x) * (near ? 0.025 : 0.012);
    ctx.globalAlpha = A * (done ? 0.4 : far ? 0.72 : 1);
    if (spr) {
      ctx.save(); ctx.translate(n.x, n.y + 2); ctx.scale(1 / idle, idle);
      ctx.fillStyle = 'rgba(40,30,20,.16)';
      ctx.drawImage(spr, -S / 2, -S * 0.92, S, S); ctx.restore();
    } else {
      const th = World.THEMES[n.sub][roleOf(n)]; ctx.font = (S * 0.5) + 'px system-ui, "Apple Color Emoji", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(th[1], n.x, n.y - S * 0.35);
    }
    ctx.globalAlpha = 1;
    // pips above the monster
    if (!done) {
      const pl = pillSprite(diff, col, far);
      ctx.globalAlpha = A * (far ? 0.7 : 1); ctx.drawImage(pl.c, n.x - pl.w / 2, n.y - S * 0.98 - pl.h + 4, pl.w, pl.h);
      if (boss && !far) { // vermilion seal
        const sx = n.x + pl.w / 2 + 3, sy = n.y - S * 0.98 - pl.h + 3;
        ctx.globalAlpha = A; ctx.fillStyle = VERM; ctx.fillRect(sx, sy, 11, 11);
        ctx.strokeStyle = '#fbeadb'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx + 3, sy + 2.5); ctx.lineTo(sx + 8, sy + 2.5); ctx.moveTo(sx + 5.5, sy + 2.5); ctx.lineTo(sx + 5.5, sy + 8.5); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else drawTick(n.x, n.y - 14, A);
    if (st.selected === n.id) drawSelect(n.x, n.y, rx + 10, ry + 5, A);
  }
  function drawTick(x, y, A) {
    ctx.globalAlpha = A * 0.95; ctx.fillStyle = '#5f9f6a'; ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(40,70,45,.6)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.strokeStyle = '#fbf6e6'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - 5.5, y); ctx.lineTo(x - 1.5, y + 4.5); ctx.lineTo(x + 6, y - 4.5); ctx.stroke(); ctx.lineCap = 'butt'; ctx.globalAlpha = 1;
  }
  function drawSelect(x, y, rx, ry, A) {
    ctx.save(); ctx.globalAlpha = A * 0.95; ctx.strokeStyle = VERM; ctx.lineWidth = 2.2; ctx.setLineDash([9, 6]); ctx.lineDashOffset = -T * 18;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.stroke(); ctx.restore();
  }
  function drawCamp(n, A) {
    const x = n.x, y = n.y;
    ctx.globalAlpha = A;
    soft(ctx, x, y + 3, 44, 14, '#6a5a3a', 0.3);
    // tent
    ctx.fillStyle = '#f3e7c8'; ctx.beginPath(); ctx.moveTo(x - 24, y + 2); ctx.lineTo(x - 2, y - 38); ctx.lineTo(x + 24, y + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(160,120,70,.4)'; ctx.beginPath(); ctx.moveTo(x - 2, y - 38); ctx.lineTo(x + 24, y + 2); ctx.lineTo(x + 6, y + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6a4a30'; ctx.beginPath(); ctx.moveTo(x - 4, y + 2); ctx.lineTo(x + 3, y - 14); ctx.lineTo(x + 10, y + 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - 24, y + 2); ctx.lineTo(x - 2, y - 38); ctx.lineTo(x + 24, y + 2); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 2, y - 38); ctx.lineTo(x - 2, y - 52); ctx.stroke();
    const sw = Math.sin(T * 3) * 2; ctx.fillStyle = VERM; ctx.beginPath(); ctx.moveTo(x - 2, y - 52); ctx.quadraticCurveTo(x + 6, y - 50 + sw, x + 14, y - 46 + sw); ctx.lineTo(x - 2, y - 42); ctx.closePath(); ctx.fill();
    // campfire
    const fx = x + 34, fy = y + 4;
    ctx.fillStyle = '#8c8a86'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(fx + Math.cos(i * 1.26) * 7, fy + Math.sin(i * 1.26) * 3, 2.2, 0, 7); ctx.fill(); }
    line(ctx, fx - 6, fy, fx + 6, fy - 3, 2.4, '#4a3320', 0.9, 0); line(ctx, fx + 6, fy, fx - 6, fy - 3, 2.4, '#4a3320', 0.9, 0);
    const f = Math.sin(T * 9) * 1.5; ctx.fillStyle = '#e8592a'; ctx.beginPath(); ctx.moveTo(fx - 4, fy - 2); ctx.quadraticCurveTo(fx - 3, fy - 10, fx + f, fy - 15 - f); ctx.quadraticCurveTo(fx + 4, fy - 8, fx + 4, fy - 2); ctx.fill();
    ctx.fillStyle = '#f6b43c'; ctx.beginPath(); ctx.moveTo(fx - 2, fy - 2); ctx.quadraticCurveTo(fx - 1, fy - 7, fx + f * 0.5, fy - 9); ctx.quadraticCurveTo(fx + 2, fy - 5, fx + 2, fy - 2); ctx.fill();
    ctx.globalAlpha = 1;
    if (st.selected === n.id) drawSelect(x, y - 6, 42, 16, A);
  }
  function drawShrine(n, A, done, far) {
    const x = n.x, y = n.y; ctx.globalAlpha = A * (done ? 0.5 : far ? 0.65 : 1);
    soft(ctx, x, y + 3, 40, 14, '#6a8a9a', 0.3);
    ctx.fillStyle = '#c5c9c4'; ctx.strokeStyle = rgba(INK, 0.5); ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 25, y + Math.sin(a) * 10, 5, 3.4, 0, 0, 7); ctx.fill(); ctx.stroke(); }
    const g = ctx.createLinearGradient(x, y - 10, x, y + 10); g.addColorStop(0, far ? '#b4c4c8' : '#8fd0dc'); g.addColorStop(1, far ? '#9fb0b4' : '#4aa0b8');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, 22, 8.5, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.2; for (let i = 0; i < 2; i++) { const k = (T * 0.5 + i * 0.5) % 1; ctx.globalAlpha = A * (1 - k) * 0.8; ctx.beginPath(); ctx.ellipse(x, y, 4 + k * 16, 1.6 + k * 6, 0, 0, 7); ctx.stroke(); }
    if (!done && !far) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (let i = 0; i < 3; i++) { const k = (T * 0.4 + i / 3) % 1; ctx.globalAlpha = A * (1 - k) * 0.7; ctx.beginPath(); ctx.moveTo(x + (i - 1) * 8 + Math.sin(T + i) * 3, y - 6 - k * 34); ctx.quadraticCurveTo(x + (i - 1) * 8 + 5, y - 14 - k * 34, x + (i - 1) * 8, y - 22 - k * 34); ctx.stroke(); } ctx.lineCap = 'butt'; }
    ctx.globalAlpha = 1;
    if (done) drawTick(x, y - 14, A);
    if (st.selected === n.id) drawSelect(x, y, 36, 15, A);
  }
  function drawChest(n, A, done, far) {
    const x = n.x, y = n.y; ctx.globalAlpha = A * (done ? 0.5 : far ? 0.65 : 1);
    soft(ctx, x, y + 2, 28, 9, '#4a3a2a', 0.35);
    const gr = (c) => (far ? '#a3a099' : c);
    ctx.fillStyle = gr('#8a5a34'); ctx.fillRect(x - 16, y - 16, 32, 17);
    ctx.fillStyle = gr('#a56e3c'); ctx.beginPath(); ctx.moveTo(x - 16, y - 16); ctx.quadraticCurveTo(x, y - 34, x + 16, y - 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = gr('#dcb450'); ctx.fillRect(x - 17, y - 17, 34, 3); ctx.fillRect(x - 12, y - 28, 3, 12); ctx.fillRect(x + 9, y - 28, 3, 12); ctx.fillRect(x - 3, y - 18, 6, 8);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(x - 16, y - 16, 32, 17); ctx.beginPath(); ctx.moveTo(x - 16, y - 16); ctx.quadraticCurveTo(x, y - 34, x + 16, y - 16); ctx.stroke();
    if (!done && !far) { const k = 0.5 + 0.5 * Math.sin(T * 4); ctx.globalAlpha = A * k; ctx.fillStyle = '#fff6c4'; ctx.beginPath(); ctx.moveTo(x + 18, y - 34); ctx.lineTo(x + 20, y - 29); ctx.lineTo(x + 25, y - 27); ctx.lineTo(x + 20, y - 25); ctx.lineTo(x + 18, y - 20); ctx.lineTo(x + 16, y - 25); ctx.lineTo(x + 11, y - 27); ctx.lineTo(x + 16, y - 29); ctx.closePath(); ctx.fill(); }
    ctx.globalAlpha = 1;
    if (done) drawTick(x, y - 12, A);
    if (st.selected === n.id) drawSelect(x, y - 4, 30, 13, A);
  }

  // Overview markers: small brushed discs.
  function drawMarker(n, A) {
    const state = nodeState(n), k = 1 / z, boss = n.type === 'boss';
    const r = (boss ? 11 : n.type === 'camp' ? 10 : 8) * k, x = n.x, y = n.y;
    ctx.globalAlpha = A;
    if (state === 'near') { const q = (T * 0.9) % 1; ctx.globalAlpha = A * (1 - q); ctx.strokeStyle = '#e8b04a'; ctx.lineWidth = 2.2 * k; ctx.beginPath(); ctx.arc(x, y, r + (3 + q * 9) * k, 0, 7); ctx.stroke(); ctx.globalAlpha = A; }
    let fill = '#fbf5e4', edge = '#5b4a3a';
    if (n.type === 'camp') { edge = '#8a6a3a'; fill = '#f3e7c8'; }
    else if (state === 'done') { fill = '#7fb287'; edge = '#3f7a4d'; }
    else if (state === 'far') { fill = '#cfcdc6'; edge = '#8f918f'; }
    else if (n.type === 'shrine') { fill = '#d8eef2'; edge = '#3f8fa8'; }
    else if (n.type === 'treasure') { fill = '#f3dfa0'; edge = '#b8892e'; }
    else edge = DANGER[lvlDifficulty(n) - 1];
    ctx.fillStyle = fill; ctx.strokeStyle = edge; ctx.lineWidth = (boss ? 3.2 : 2.4) * k;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = rgba(edge, 0.5); ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.arc(x, y, r + 2.2 * k, 0.4, 5.2); ctx.stroke();
    if (state === 'done') { ctx.strokeStyle = '#fbf6e6'; ctx.lineWidth = 2.4 * k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - r * 0.45, y); ctx.lineTo(x - r * 0.1, y + r * 0.38); ctx.lineTo(x + r * 0.5, y - r * 0.38); ctx.stroke(); ctx.lineCap = 'butt'; }
    else if (n.type === 'camp') { ctx.fillStyle = '#c0553c'; ctx.beginPath(); ctx.moveTo(x - r * 0.6, y + r * 0.45); ctx.lineTo(x, y - r * 0.6); ctx.lineTo(x + r * 0.6, y + r * 0.45); ctx.closePath(); ctx.fill(); }
    else if (n.type === 'shrine') { ctx.fillStyle = '#3f8fa8'; ctx.beginPath(); ctx.moveTo(x, y - r * 0.6); ctx.quadraticCurveTo(x + r * 0.55, y + r * 0.05, x, y + r * 0.55); ctx.quadraticCurveTo(x - r * 0.55, y + r * 0.05, x, y - r * 0.6); ctx.fill(); }
    else if (n.type === 'treasure') { ctx.fillStyle = '#8a5a34'; ctx.fillRect(x - r * 0.55, y - r * 0.3, r * 1.1, r * 0.75); ctx.fillStyle = '#dcb450'; ctx.fillRect(x - r * 0.1, y - r * 0.3, r * 0.2, r * 0.4); }
    else skull(ctx, x, y, r * 0.52, state === 'far' ? '#8f918f' : INK, fill);
    if (boss) { ctx.fillStyle = state === 'far' ? '#9b9a96' : VERM; ctx.fillRect(x + r * 0.55, y - r * 1.5, 5 * k, 5 * k); ctx.strokeStyle = '#4a3a2e'; ctx.lineWidth = 1.3 * k; ctx.beginPath(); ctx.moveTo(x + r * 0.55, y - r * 1.5); ctx.lineTo(x + r * 0.55, y - r * 0.6); ctx.stroke(); }
    if (st.selected === n.id) { ctx.strokeStyle = VERM; ctx.lineWidth = 2 * k; ctx.setLineDash([5 * k, 4 * k]); ctx.beginPath(); ctx.arc(x, y, r + 6 * k, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    ctx.globalAlpha = 1;
  }

  // ---------- The kasa-hat traveller ----------
  function drawHero(e) {
    const s = 1.25 + e * 1.2, moving = !!token.walk, ph = token.stride, bob = moving ? Math.abs(Math.sin(ph)) * 2 : Math.sin(T * 2) * 0.6;
    const x = token.x, y = token.y, f = token.face;
    ctx.save(); ctx.translate(x, y); ctx.scale(f * s, s);
    soft(ctx, 0, 1, 13, 4.5, '#3a3020', 0.4);
    // legs
    const sw = moving ? Math.sin(ph) * 3.5 : 0;
    ctx.strokeStyle = '#3a3a48'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-2, -9 - bob); ctx.lineTo(-2 + sw, 0); ctx.moveTo(2.5, -9 - bob); ctx.lineTo(2.5 - sw, 0); ctx.stroke();
    // staff
    ctx.strokeStyle = '#6a4a2c'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(10, 1 + (moving ? sw * 0.2 : 0)); ctx.lineTo(8, -26 - bob); ctx.stroke();
    // robe
    ctx.fillStyle = '#3d5a80'; ctx.beginPath(); ctx.moveTo(-6.5, -9 - bob); ctx.quadraticCurveTo(-7, -19 - bob, -3.5, -22 - bob); ctx.lineTo(3.5, -22 - bob); ctx.quadraticCurveTo(7, -19 - bob, 7, -8 - bob); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.moveTo(-6, -10 - bob); ctx.quadraticCurveTo(-6.5, -19 - bob, -3.5, -21.5 - bob); ctx.lineTo(-1, -21.5 - bob); ctx.lineTo(-2, -10 - bob); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = '#c8402f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6.5, -14 - bob); ctx.lineTo(7, -14 - bob); ctx.stroke();
    // satchel + scarf tail
    ctx.fillStyle = '#9a7248'; ctx.fillRect(-9.5, -17 - bob, 4, 6);
    ctx.strokeStyle = VERM; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3, -22 - bob); ctx.quadraticCurveTo(-9, -21 - bob + Math.sin(T * 8) * (moving ? 1.5 : 0.5), -12, -19 - bob); ctx.stroke();
    // face
    ctx.fillStyle = '#ecd0b0'; ctx.beginPath(); ctx.arc(0, -25 - bob, 3.4, 0, 7); ctx.fill();
    // kasa hat
    ctx.fillStyle = '#dcb468'; ctx.beginPath(); ctx.moveTo(-12, -26 - bob); ctx.quadraticCurveTo(0, -30 - bob, 12, -26 - bob); ctx.quadraticCurveTo(5, -42 - bob, 0, -43 - bob); ctx.quadraticCurveTo(-5, -42 - bob, -12, -26 - bob); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(120,80,30,.3)'; ctx.beginPath(); ctx.moveTo(0, -43 - bob); ctx.quadraticCurveTo(5, -42 - bob, 12, -26 - bob); ctx.lineTo(3, -28 - bob); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = 'rgba(90,60,20,.5)'; ctx.lineWidth = 0.7; for (const k of [-6, -2, 3]) { ctx.beginPath(); ctx.moveTo(0, -43 - bob); ctx.lineTo(k * 1.7, -27.5 - bob); ctx.stroke(); }
    ctx.restore(); ctx.lineCap = 'butt';
    // vermilion marker above the hero
    const my = y - (46 + Math.sin(T * 3) * 2) * s;
    ctx.fillStyle = VERM; ctx.beginPath(); ctx.moveTo(x, my + 6); ctx.lineTo(x - 3.2, my - 2); ctx.lineTo(x + 3.2, my - 2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 1.4, my - 3); ctx.lineTo(x + 1.4, my - 3); ctx.lineTo(x + 1, my - 11); ctx.lineTo(x - 1, my - 11); ctx.fill();
  }
  function drawPrints() {
    ctx.fillStyle = '#5b4a3a';
    for (const p of prints) {
      const age = (T - p.t) / 7; if (age >= 1 || !inView(p.x, p.y, 10)) continue;
      ctx.globalAlpha = 0.75 * (1 - age);
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 2.3, 4, p.a, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function drawDest() {
    if (!dest) return;
    const age = T - dest.t; if (age > 2.2 || !token.walk) { if (!token.walk || age > 2.2) dest = null; return; }
    ctx.globalAlpha = Math.max(0, 1 - age / 2.2) * 0.85; ctx.strokeStyle = VERM; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(dest.x, dest.y, 9 + Math.sin(T * 6) * 1.5, 4, 0, 0.3, 5.9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(dest.x - 4, dest.y - 2); ctx.lineTo(dest.x + 4, dest.y + 2); ctx.moveTo(dest.x + 4, dest.y - 2); ctx.lineTo(dest.x - 4, dest.y + 2); ctx.stroke();
    ctx.globalAlpha = 1; ctx.lineCap = 'butt';
  }

  // ---------- Mist ----------
  function drawWisps() {
    for (const w of wisps) {
      const x = ((w.x + T * w.sp) % (World.MAP_W + 200)) - 100, y = w.y + Math.sin(T * 0.3 + w.ph) * 8;
      if (!inView(x, y, w.w)) continue;
      ctx.globalAlpha = 0.28; ctx.drawImage(mistSprite, x - w.w, y - w.w * 0.16, w.w * 2, w.w * 0.32);
    }
    ctx.globalAlpha = 1;
  }
  function drawFog() {
    for (const sub of World.SUBAREAS) {
      const a = fogA[sub.id] || 0; if (a <= 0.01) continue;
      const b = sub.bounds; if (b[2] + 80 < X0 || b[0] - 80 > X0 + WW || b[3] + 80 < Y0 || b[1] - 80 > Y0 + WH) continue;
      const f = fogTex[sub.id]; if (!f) continue;
      ctx.globalAlpha = a * 0.97; ctx.drawImage(f.cv, f.b[0], f.b[1], f.w, f.h);
      // slow drifting wisps keep the mist alive
      for (let i = 0; i < 3; i++) {
        const wx = b[0] + ((T * (5 + i * 2) + i * 150) % (b[2] - b[0] + 160)) - 80, wy = b[1] + 40 + i * 70 + Math.sin(T * 0.4 + i) * 6;
        ctx.globalAlpha = a * 0.4; ctx.drawImage(mistSprite, wx - 70, wy - 16, 140, 32);
      }
      // painted sign: a brushed padlock, the area name and what unlocks it (drawn in screen-size units)
      const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2 + (sub.id === 'caldera' ? 56 : 0), u = 1 / z;   // Magma Caldera's sign sits lower, clear of the overview button
      ctx.save(); ctx.translate(cx, cy); ctx.scale(u, u); ctx.globalAlpha = a;
      ctx.fillStyle = INDIGO; ctx.beginPath(); ctx.rect(-9, -30, 18, 14); ctx.fill();
      ctx.strokeStyle = INDIGO; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -31, 6, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(0, -24, 2, 0, 7); ctx.fill();
      ctx.restore();
      inkText(sub.name, cx, cy + 4 * u, 15, a, 700, true);
      inkText('Defeat ' + bossNameFor(sub.id), cx, cy + 24 * u, 11.5, a * 0.9, 500, true);
      ctx.globalAlpha = 1;
    }
  }

  // ---------- Hero walking ----------
  function stepToken(dt) {
    const w = token.walk; if (!w) return;
    const speed = w.route ? 260 : 190;
    let left = dt * speed;
    while (left > 0 && w.pts.length) {
      const p = w.pts[0], d = Math.hypot(p.x - token.x, p.y - token.y);
      if (d <= left) { token.x = p.x; token.y = p.y; left -= d; w.pts.shift(); }
      else { const dx = (p.x - token.x) / d, dy = (p.y - token.y) / d; token.x += dx * left; token.y += dy * left; left = 0; }
      if (d > 0.5) { const dx = p.x - token.x, dy = p.y - token.y; if (Math.abs(dx) > 0.5) token.face = dx > 0 ? 1 : -1; }
    }
    // footprints
    const moved = Math.hypot(token.x - (w.lx ?? token.x), token.y - (w.ly ?? token.y));
    if (w.lx === undefined) { w.lx = token.x; w.ly = token.y; w.side = 1; }
    token.stride += dt * 11;
    if (moved > 13) {
      const a = Math.atan2(token.y - w.ly, token.x - w.lx) + Math.PI / 2;
      w.side = -w.side; prints.push({ x: token.x + Math.cos(a) * 3 * w.side, y: token.y - 1 + Math.sin(a) * 3 * w.side, a: a, t: T });
      if (prints.length > 90) prints.shift();
      w.lx = token.x; w.ly = token.y;
    }
    follow = { x: token.x, y: token.y + (0.5 - FOCUS_Y) * vh / zIn };
    if (!w.pts.length) { token.walk = null; w.done(); }
  }
  function walk(ids) {
    return new Promise((done) => {
      const pts = ids.map((id) => World.byId[id]).filter(Boolean).map((n) => ({ x: n.x + HERO_OFF.x, y: n.y + HERO_OFF.y }));
      if (!pts.length) return done();
      if (token.walk) token.walk.done();
      token.walk = { pts, done, route: true };
    });
  }
  function placeToken(id) { const n = World.byId[id]; token.x = n.x + HERO_OFF.x; token.y = n.y + HERO_OFF.y; token.walk = null; }
  // Free roam: walk toward a point, stopping where the ground ends.
  function roamTo(x, y) {
    if (token.walk && token.walk.route) return;
    const dx = x - token.x, dy = y - token.y, d = Math.hypot(dx, dy); if (d < 4) return;
    let tx = token.x, ty = token.y;
    for (let s = 6; s <= d; s += 6) { const px = token.x + dx * s / d, py = token.y + dy * s / d; if (!walkable(px, py)) break; tx = px; ty = py; }
    if (walkable(x, y)) { tx = x; ty = y; }
    if (Math.hypot(tx - token.x, ty - token.y) < 4) return;
    token.walk = { pts: [{ x: tx, y: ty }], done() {}, route: false };
    dest = { x: tx, y: ty, t: T };
  }

  // ---------- Input: drag to pan, tap to walk or select ----------
  const toWorld = (ev) => { const r = canvas.getBoundingClientRect(); return { x: (ev.clientX - r.left - vw / 2) / z + vx, y: (ev.clientY - r.top - vh / 2) / z + vy }; };
  let pan = null;
  canvas.addEventListener('pointerdown', (ev) => { pan = { x: ev.clientX, y: ev.clientY, cx: cam.x, cy: cam.y, moved: false }; canvas.setPointerCapture(ev.pointerId); });
  canvas.addEventListener('pointermove', (ev) => {
    if (!pan || ovOn) return;
    const dx = ev.clientX - pan.x, dy = ev.clientY - pan.y;
    if (!pan.moved && Math.hypot(dx, dy) > 8) pan.moved = true;
    if (pan.moved) { follow = null; cam.x = pan.cx - dx / zIn; cam.y = pan.cy - dy / zIn; }
  });
  canvas.addEventListener('pointerup', (ev) => {
    const p = pan; pan = null;
    if (!p || p.moved) return;
    const w = toWorld(ev);
    if (ovOn || ovT > 0.5) { setOverview(false, w.x, w.y); return; }
    let best = null;
    for (const n of World.nodes) {
      if (!visibleNode(n)) continue;
      const H = nodeH(n), hw = n.type === 'boss' ? 46 : 34;
      const ex = (w.x - n.x) / hw, ey = (w.y - (n.y - H * 0.42)) / (H * 0.62);
      const d = ex * ex + ey * ey;
      if (d < 1 && (!best || d < best.d)) best = { n, d };
    }
    if (best) { onTap(best.n); return; }
    if (!(token.walk && token.walk.route)) roamTo(w.x, w.y);
    onTap(null);
  });
  canvas.addEventListener('wheel', (ev) => { ev.preventDefault(); if (ovOn) return; follow = null; cam.x += ev.deltaX / zIn; cam.y += ev.deltaY / zIn; }, { passive: false });

  // ---------- Overview toggle ----------
  function setOverview(on, tx, ty) {
    ovOn = on;
    if (!on && tx !== undefined) { cam.x = tx; cam.y = ty + (0.5 - FOCUS_Y) * vh / zIn; follow = null; clampCam(); }
    if (ovBtn) { ovBtn.setAttribute('aria-pressed', on ? 'true' : 'false'); ovBtn.innerHTML = btnIcon(on); ovBtn.title = on ? 'Back to exploring' : 'Overview map'; }
  }
  const btnIcon = (on) => '<svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">' +
    '<path d="M24 4.5C12.5 4 4.6 12.6 5 24.5c.4 11 9 19.2 19.6 18.8 10.8-.4 18.8-8.6 18.4-19.6" fill="none" stroke="#2b3445" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>' +
    '<path d="M25 6.5c9.5.6 16.2 6 17.2 14" fill="none" stroke="#2b3445" stroke-width="1.5" stroke-linecap="round" opacity=".5"/>' +
    (on
      ? '<path d="M15 31l5-9 4 6 4-8 6 11z" fill="#7d9a5c" stroke="#2b3445" stroke-width="1.6" stroke-linejoin="round"/><circle cx="33" cy="15" r="3.2" fill="#c8402f"/>'
      : '<path d="M12 33l7-12 5 8 5-10 7 14z" fill="#8fa3bf" stroke="#2b3445" stroke-width="1.6" stroke-linejoin="round"/><path d="M19 21l2 3-3-1z M29 19l-2 4 4-1z" fill="#fff"/><path d="M12 35h24" stroke="#2b3445" stroke-width="1.4" stroke-linecap="round"/><circle cx="35" cy="14" r="3.4" fill="#c8402f"/>') +
    '</svg>';
  function makeButton() {
    ovBtn = document.createElement('button');
    ovBtn.type = 'button'; ovBtn.className = 'wc-overview-btn';
    ovBtn.setAttribute('aria-label', 'Toggle overview map');
    Object.assign(ovBtn.style, {
      position: 'absolute', right: 'max(12px, env(safe-area-inset-right, 0px))', top: 'calc(62px + env(safe-area-inset-top, 0px))',
      width: '48px', height: '48px', padding: '0', borderRadius: '50%', border: '0',
      background: 'radial-gradient(circle at 40% 35%, #fbf5e2, #ecdfbd)', boxShadow: '0 2px 8px rgba(40,50,70,.35), inset 0 0 0 1px rgba(255,255,255,.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation',
    });
    ovBtn.innerHTML = btnIcon(false);
    ovBtn.addEventListener('click', () => setOverview(!ovOn));
    canvas.insertAdjacentElement('afterend', ovBtn);
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    vw = r.width; vh = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    zIn = vw / VIEW; zOv = Math.min(vw / (World.MAP_W + 30), vh / (World.MAP_H + 40));
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
    buildTerrain();
  }
  window.addEventListener('resize', resize);

  window.WorldMap = {
    init(opts) { onTap = opts.onTap; resize(); makeButton(); requestAnimationFrame(frame); },
    update(next) { Object.assign(st, next); },
    focus(x, y, instant) {
      if (ovOn) setOverview(false);
      const t = { x, y: y + (0.5 - FOCUS_Y) * vh / zIn };
      if (instant) { cam.x = t.x; cam.y = t.y; follow = null; } else follow = t;
    },
    walk, placeToken,
    // Screen position of a node's monster in CSS pixels (used by automated tests).
    screenOf(id) { const n = World.byId[id], r = canvas.getBoundingClientRect(), H = nodeH(n); return { x: r.left + (n.x - vx) * z + vw / 2, y: r.top + (n.y - H * 0.42 - vy) * z + vh / 2 }; },
    // Screen position of a world point (tests / tools).
    screenAt(x, y) { const r = canvas.getBoundingClientRect(); return { x: r.left + (x - vx) * z + vw / 2, y: r.top + (y - vy) * z + vh / 2 }; },
    setOverview, isOverview() { return ovOn; },
    setActive(on) { if (on === active) return; active = on; if (on) { frame.last = 0; requestAnimationFrame(frame); } },
    resize,
  };
})();
