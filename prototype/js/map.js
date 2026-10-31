// World map renderer, Japanese watercolour theme: a big, sparse free-roam exploration map.
//
// The world is far too large for one bitmap, so terrain is painted in chunks, lazily and deterministically:
//   * L0 tiles: 512 world units square, painted at ~1.5 px/unit when they come into (or near) view, a few ms per frame,
//     cached in an LRU with a memory cap. A tile fades in over a soft placeholder wash (from the overview).
//   * L2 overview: the whole world at 0.125 px/unit, painted chunk by chunk in the background.
//   * mini: a tiny one-pixel-per-100-units biome wash, available instantly.
// Everything painted into a tile (ground washes, features, scattered decoration) is a pure function of world
// coordinates and seeded by cell, so tiles stitch seamlessly. Per frame only tiles, monsters, fog, hero and a few
// animated touches are drawn. Geometry (coast, biomes, rivers, cliffs, roads...) comes from window.WorldLayout.
(function () {
  'use strict';
  const World = window.World, WL = window.WorldLayout;
  const canvas = document.getElementById('map');
  const ctx = canvas.getContext('2d');
  const MAP_W = WL.MAP_W, MAP_H = WL.MAP_H;
  const VIEW = 400;      // world units across the screen width at the default exploration zoom
  const FOCUS_Y = 0.36;  // focused points sit this far down the screen, above the bottom sheet
  const HERO_OFF = { x: 20, y: 14 }; // the hero stands beside a node, not on the monster
  const TILE = 512, PAD = 6;         // L0 tile size (world units) and the bleed painted around it
  const CHUNK = 1024, S2 = 0.125;    // overview chunk size and its scale (1024 * 0.125 = 128 px)
  const UZ_MIN = 0.5, UZ_MAX = 1.3;  // pinch / ctrl-wheel zoom range around the default

  const INK = '#2b3445', PAPER = '#f4ecd7', VERM = '#c8402f', INDIGO = '#3d5a80';

  let vw = 0, vh = 0, dpr = 1, S0 = 1.5;
  let zBase = 1, uz = 1, zIn = 1, zOv = 0.04;   // zoom: default / user factor / exploring / overview
  let z = 1, vx = 0, vy = 0;                    // effective zoom and view centre this frame
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

  Object.assign(PAL, {
    bamboo:   { base: '#a8c984', mid: '#cde0a0', dark: '#7aa66a', band: '#d9e8b8' },
    coral:    { base: '#8fd8d0', mid: '#c4f0e6', dark: '#56b8c0', band: '#e8f6e2' },
    isles:    { base: '#efdfb2', mid: '#f8efd0', dark: '#dcc690', band: '#f8efd2' },
    canyon:   { base: '#d9946a', mid: '#e8b88c', dark: '#b2603e', band: '#f0cfa6' },
    glacier:  { base: '#cfe4f0', mid: '#eaf5fa', dark: '#9cc0da', band: '#eef6fa' },
    lavafall: { base: '#6a4f4c', mid: '#8c6a62', dark: '#3c2a29', band: '#5a4340' },
    high:     { base: '#aebfa2', mid: '#cbd8bb', dark: '#8da187', band: '#d6e0c8' },
  });
  const LANDBASE = '#ece6cc';
  function paperTexture() {
    const S = 512, s = document.createElement('canvas'); s.width = s.height = S;
    const g = s.getContext('2d'), R = R0('paper'), offs = (v) => (v < 16 ? [0, S] : v > S - 16 ? [0, -S] : [0]);
    for (let i = 0; i < 1300; i++) {
      const x = R() * S, y = R() * S, a = R() * 6.28, l = 3 + R() * 9;
      g.strokeStyle = 'rgba(' + (R() > 0.5 ? '120,95,60' : '255,250,235') + ',' + (0.05 + R() * 0.07) + ')'; g.lineWidth = 0.6 + R() * 0.6;
      for (const dx of offs(x)) for (const dy of offs(y)) { g.beginPath(); g.moveTo(x + dx, y + dy); g.lineTo(x + dx + Math.cos(a) * l, y + dy + Math.sin(a) * l); g.stroke(); }
    }
    for (let i = 0; i < 3200; i++) {
      g.fillStyle = 'rgba(' + (R() > 0.5 ? '110,90,60' : '255,255,255') + ',' + (0.04 + R() * 0.06) + ')'; const x = R() * S, y = R() * S, w = 1 + R() * 1.4;
      for (const dx of offs(x)) for (const dy of offs(y)) g.fillRect(x + dx, y + dy, w, w);
    }
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


  function inkText(txt, x, y, px, alpha, weight, italic) {
    const fs = px / z;
    ctx.font = (italic ? 'italic ' : '') + weight + ' ' + fs + 'px "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
    ctx.globalAlpha = alpha * 0.85; ctx.lineWidth = fs * 0.28; ctx.strokeStyle = PAPER; ctx.strokeText(txt, x, y);
    ctx.globalAlpha = alpha; ctx.fillStyle = INK; ctx.fillText(txt, x, y);
    ctx.globalAlpha = alpha * 0.55; ctx.strokeStyle = VERM; ctx.lineWidth = fs * 0.07; ctx.beginPath(); const w = ctx.measureText(txt).width; ctx.moveTo(x - w * 0.5, y + fs * 0.2); ctx.quadraticCurveTo(x, y + fs * 0.28, x + w * 0.5, y + fs * 0.16); ctx.stroke();
    ctx.globalAlpha = 1;
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
  }
  function lmIceForest(c, L) {
    soft(c, 0, 20, 100, 30, '#8fa4d0', 0.3); soft(c, 0, -20, 60, 60, '#dfe8ff', 0.35); soft(c, 0, 24, 80, 14, '#f6fbfd', 0.8);
    const trees = [[-36, 22, 11], [34, 24, 12], [-62, 12, 8], [60, 14, 9], [-14, 34, 8], [20, 36, 8], [0, 14, 22], [-48, -4, 8], [48, -2, 8]];
    for (const [x, y, s] of trees.sort((a, b) => a[1] - b[1])) frostPine(c, x, y, s);
    for (const [x, y, s] of [[-26, 40, 5], [30, 42, 5], [-70, 24, 5], [74, 26, 4]]) crystal(c, x, y, s, '#aed2ea', '#f4fbff');
    for (let i = 0; i < 16; i++) sparkle(c, -70 + ((i * 53) % 140), -50 + ((i * 29) % 80), 2 + (i % 3), i % 2 ? '#ffffff' : '#c8d8ff', 0.85);
  }
  function lmBurnt(c, L) {
    soft(c, 0, 16, 104, 30, '#1a1412', 0.38); soft(c, 0, 14, 76, 18, '#4a3a34', 0.45);
    for (const [x1, y1, x2, y2] of [[-40, 18, -10, 14], [-4, 22, 30, 16], [20, 8, 56, 4], [-60, 8, -30, 0]]) brush(c, quad(x1, y1, (x1 + x2) / 2, y1 - 4, x2, y2, 5), 1.8, '#f08a35', 0.8, 2);
    for (const [x, y, s] of [[-60, 6, 13], [-34, 22, 16], [-4, -6, 16], [14, 20, 17], [40, 8, 14], [60, 22, 12], [-18, 38, 10], [30, 40, 10]].sort((a, b) => a[1] - b[1])) burnt(c, x, y, s, true);
    for (const [x, y, r] of [[-10, -50, 18], [8, -66, 16], [-26, -64, 12], [24, -78, 12]]) soft(c, x, y, r, r * 0.7, '#6a5f5a', 0.28);
    for (let i = 0; i < 12; i++) dot(c, -50 + ((i * 47) % 100), -10 + ((i * 31) % 50), 1.1, '#ffb14a', 0.85);
  }
  function lmRidge(c, L) {
    soft(c, 0, 22, 108, 26, '#14101e', 0.4); soft(c, 0, 18, 90, 18, '#6a5a9a', 0.22);
    const sh = [[-88, 26, 18, 30, -2], [-70, 24, 20, 40, 4], [-48, 26, 24, 52, -4], [-26, 24, 26, 64, 5], [0, 26, 30, 78, -3], [26, 24, 26, 58, 6], [48, 26, 24, 66, -5], [70, 24, 22, 44, 3], [88, 26, 18, 32, -3]];
    for (const [x, y, w, h, l] of sh) shard(c, x * 0.88, y, w, h * 0.74, l, '#2a2640', '#8c82c0');
    for (let i = 0; i < 10; i++) { const x = -80 + i * 17; poly(c, [[x - 4, 30 + (i % 3) * 2], [x, 24 + (i % 3) * 2], [x + 4, 30 + (i % 3) * 2]], '#2f2b46', 0.9); }
    for (const [x, y, s] of [[-30, 36, 4], [20, 38, 4], [58, 34, 4]]) crystal(c, x, y, s, '#4a4470', '#a89ee0');
    brush(c, quad(-80, 8, -20, -10, 70, 6, 8), 2, '#cfc8ff', 0.2);
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
  }

  // ---------- New landmarks (same convention: painted around (0,0), in landmark units) ----------
  function lmBambooGrove(c) {
    soft(c, 0, 24, 110, 24, '#3d5a3a', 0.32);
    for (const dx of [-40, 8, 46]) brush(c, [[dx - 14, -86], [dx + 22, 26]], 18, '#f2f8c8', 0.14, 2);
    soft(c, 0, -30, 100, 56, '#c4e08a', 0.32);
    // the stone path winds in between the stalks
    for (let i = 0; i < 6; i++) { const y = 28 - i * 10, x = Math.sin(i * 1.1) * 8; ell(c, x, y, 11 - i * 0.9, 3.4 - i * 0.2, '#d9d6c4', 0.95); outline(c, [[x - 10 + i * 0.9, y], [x + 10 - i * 0.9, y]], INK, 0.7, 0.35); }
    const stalks = [[-84, 22, 20], [-66, 8, 22], [-50, 28, 19], [-34, 2, 23], [-22, 20, 21], [22, 4, 23], [34, 22, 20], [52, 0, 22], [66, 26, 19], [80, 8, 21], [-8, -10, 24], [12, -12, 23], [-98, 10, 17], [96, 20, 17]];
    for (const [x, y, s] of stalks.sort((a, b) => a[1] - b[1])) bamboo(c, x, y, s, { r: 0.5, q: ((x * 7 + 100) % 10) / 10 });
    torii(c, 0, 36, 34); stoneLantern(c, -34, 34, 14); stoneLantern(c, 34, 34, 14);
    for (let i = 0; i < 20; i++) dot(c, -70 + ((i * 41) % 140), 30 - ((i * 17) % 26), 1.4, ['#a9c47c', '#d9d08a'][i % 2], 0.8);
  }
  function lmSeaStacks(c) {
    soft(c, 0, 10, 126, 44, '#4f7f98', 0.34);
    ell(c, 0, 10, 108, 34, '#9fd4d6', 0.9); ell(c, 0, 10, 108, 34, '#ffffff', 0.0);
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 10, 110, 35, 0, 0, 7); c.stroke();
    const stacks = [[-70, 22, 15, 62, -2], [-36, 28, 20, 96, 3], [0, 32, 24, 128, -3], [40, 28, 21, 88, 4], [72, 22, 15, 56, -3], [100, 14, 11, 34, 2]];
    for (const [x, y, w, h, l] of stacks.sort((a, b) => a[1] - b[1])) {
      soft(c, x + 6, y + 2, w * 1.5, 5, '#1f2d3a', 0.3);
      const L = [[x - w * 0.55, y], [x - w * 0.42, y - h * 0.5], [x - w * 0.25, y - h * 0.9], [x + l, y - h], [x + w * 0.4, y - h * 0.62], [x + w * 0.58, y]];
      const g = c.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, '#8d97a8'); g.addColorStop(0.6, '#5b6577'); g.addColorStop(1, '#2f3846');
      poly(c, L, g, 0.98); outline(c, L, INK, 1.1, 0.7, true);
      poly(c, [[x + l, y - h], [x + w * 0.4, y - h * 0.62], [x + w * 0.58, y], [x + w * 0.1, y]], '#1f2634', 0.35);
      for (let k = 1; k < 5; k++) line(c, x - w * 0.5, y - h * k / 5, x + w * 0.45, y - h * k / 5 + 3, 1, INK, 0.2, 2);
      poly(c, [[x - w * 0.25, y - h * 0.9], [x + l, y - h], [x + w * 0.3, y - h * 0.83], [x, y - h * 0.8]], '#7b9a62', 0.9);
      line(c, x - w * 0.9, y + 2, x + w * 0.9, y + 3, 2, '#ffffff', 0.9, 2);
    }
    // an arch between the two tallest, gulls, mist
    brush(c, quad(-36, -68, 0, -88, 40, -60, 8), 3, '#5b6577', 0.55);
    for (const [x, y] of [[-60, -96], [50, -108], [20, -128]]) { c.strokeStyle = rgba(INK, 0.55); c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 5, y); c.quadraticCurveTo(x - 1.5, y - 4, x, y); c.quadraticCurveTo(x + 1.5, y - 4, x + 5, y); c.stroke(); }
    for (const [x, y, r] of [[-70, -30, 40], [40, -50, 46], [96, -20, 30], [-10, -90, 40]]) soft(c, x, y, r * 1.5, r * 0.5, '#f2f0e8', 0.5);
  }
  function lmMesa(c) {
    soft(c, 6, 26, 118, 22, '#5a2e1c', 0.34);
    const butte = (cx, w, h, a) => {
      const g = c.createLinearGradient(cx - w, 0, cx + w, 0); g.addColorStop(0, '#f0b583'); g.addColorStop(0.55, '#d27a4e'); g.addColorStop(1, '#8e432b');
      const body = [[cx - w, 28], [cx - w * 0.92, 4], [cx - w * 0.8, -h * 0.4], [cx - w * 0.72, -h], [cx + w * 0.7, -h * 1.03], [cx + w * 0.8, -h * 0.4], [cx + w * 0.95, 6], [cx + w, 28]];
      c.globalAlpha = a; poly(c, body, g, a);
      for (let k = 1; k < 9; k++) { const y = 26 - k * (h + 26) / 9; c.globalAlpha = a * 0.5; line(c, cx - w * (0.95 - 0.1 * k / 9), y, cx + w * (0.95 - 0.1 * k / 9), y + (k % 2 ? 2 : -1), 1.4 + (k % 3), k % 2 ? '#8e432b' : '#f0b583', 0.45, 2); }
      c.globalAlpha = a; for (let k = 0; k < 6; k++) brush(c, [[cx - w * 0.7 + k * w * 0.28, -h], [cx - w * 0.78 + k * w * 0.28, 26]], 1.1, '#6a2e1c', 0.3);
      outline(c, body, INK, 1.4, a * 0.7, false);
      poly(c, [[cx - w * 0.72, -h], [cx + w * 0.7, -h * 1.03], [cx + w * 0.6, -h * 1.1], [cx - w * 0.6, -h * 1.08]], '#f4d3a8', a);
      outline(c, [[cx - w * 0.72, -h], [cx - w * 0.6, -h * 1.08], [cx + w * 0.6, -h * 1.1], [cx + w * 0.7, -h * 1.03]], INK, 1.1, a * 0.6, false);
      c.globalAlpha = 1;
    };
    butte(-78, 26, 44, 0.9); butte(88, 22, 34, 0.9); butte(6, 52, 84, 1);
    soft(c, 0, 28, 100, 14, '#f0d49a', 0.9); soft(c, -50, 32, 50, 9, '#e8c488', 0.8); soft(c, 60, 32, 46, 9, '#e8c488', 0.8);
    for (const [x, y, s] of [[-96, 34, 9], [100, 34, 8], [-30, 38, 6], [52, 40, 6]]) rock(c, x, y, s, '#b8683f', '#e8a06c');
    cactus(c, -64, 36, 9); cactus(c, 70, 38, 8); ripples(c, -20, 40, 22, 2, '#a8743a', 0.4);
    // a lone eagle above the mesa
    c.strokeStyle = rgba(INK, 0.5); c.lineWidth = 1.2; c.beginPath(); c.moveTo(-18, -106); c.quadraticCurveTo(-12, -112, -6, -106); c.quadraticCurveTo(0, -112, 6, -106); c.stroke();
  }
  function lmIcePalace(c) {
    soft(c, 0, 26, 112, 20, '#5d86ab', 0.32); soft(c, 0, -40, 90, 80, '#dfeeff', 0.3);
    // a frozen moat and the stair of ice
    ell(c, 0, 28, 96, 17, '#a9d2ea', 0.9); ell(c, 0, 28, 80, 12, '#e8f5fb', 0.9); line(c, -80, 26, 80, 26, 1, '#ffffff', 0.9, 2);
    const tower = (x, w, h, a, roof) => {
      const g = c.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, '#f4fbff'); g.addColorStop(0.6, '#bcdcee'); g.addColorStop(1, '#7ea6cc');
      poly(c, [[x - w, 24], [x - w * 0.9, -h * 0.55], [x - w * 0.8, -h], [x + w * 0.8, -h], [x + w * 0.9, -h * 0.55], [x + w, 24]], g, a);
      poly(c, [[x + w * 0.3, 24], [x + w * 0.35, -h], [x + w * 0.8, -h], [x + w * 0.9, -h * 0.55], [x + w, 24]], '#4a74a8', 0.35);
      outline(c, [[x - w, 24], [x - w * 0.9, -h * 0.55], [x - w * 0.8, -h], [x + w * 0.8, -h], [x + w * 0.9, -h * 0.55], [x + w, 24]], INK, 1.2, 0.7);
      for (let k = 0; k < Math.floor(w / 6); k++) { const bx = x - w * 0.8 + k * 12; poly(c, [[bx, -h], [bx + 3, -h - 7], [bx + 6, -h]], '#eef8fc', 0.97); }
      poly(c, [[x - w * 1.1, -h], [x, -h - roof], [x + w * 1.1, -h]], '#d6ecf8', 0.98); poly(c, [[x, -h - roof], [x + w * 1.1, -h], [x + w * 0.2, -h]], '#7ea6cc', 0.5);
      outline(c, [[x - w * 1.1, -h], [x, -h - roof], [x + w * 1.1, -h]], INK, 1.1, 0.7, true);
      for (let k = 0; k < 2; k++) { const wy = -h * 0.35 - k * h * 0.3; ell(c, x, wy, 3.2, 5, '#ffe9a0', 0.95); outline(c, [[x - 3.2, wy], [x + 3.2, wy]], INK, 0.6, 0.4); }
      line(c, x, -h - roof, x, -h - roof - 12, 1.4, '#4a3a2e', 0.9, 0); poly(c, [[x, -h - roof - 12], [x + 10, -h - roof - 9], [x, -h - roof - 5]], '#4aa0d0', 0.95);
    };
    tower(-66, 14, 58, 0.97, 22); tower(66, 14, 54, 0.97, 22); tower(-36, 12, 80, 0.98, 26); tower(36, 12, 76, 0.98, 26); tower(0, 22, 114, 1, 40);
    // crenellated curtain wall and gate
    poly(c, [[-80, 24], [-80, -6], [80, -6], [80, 24]], '#cfe6f4', 0.95); outline(c, [[-80, 24], [-80, -6], [80, -6], [80, 24]], INK, 1.1, 0.6);
    for (let k = 0; k < 14; k++) poly(c, [[-78 + k * 11, -6], [-78 + k * 11, -12], [-70 + k * 11, -12], [-70 + k * 11, -6]], '#e8f5fb', 0.95);
    c.fillStyle = '#2b3a5a'; c.beginPath(); c.moveTo(-9, 24); c.lineTo(-9, 6); c.arc(0, 6, 9, Math.PI, 0); c.lineTo(9, 24); c.fill();
    for (let k = 0; k < 8; k++) { const ix = -70 + k * 20; poly(c, [[ix, -6], [ix + 2.4, 4 + (k % 3) * 3], [ix + 4.8, -6]], '#e8f5fb', 0.9); }
    for (const [x, y, s] of [[-96, 30, 9], [96, 30, 9], [-108, 20, 7], [108, 20, 7]]) frostPine(c, x, y, s);
    for (const [x, y] of [[-30, 36], [30, 38], [0, 40]]) soft(c, x, y, 30, 6, '#ffffff', 0.9);
    sparkle(c, 0, -166, 6, '#ffffff', 0.95);
  }
  function lmLavaFalls(c) {
    soft(c, 0, 30, 126, 22, '#1a1010', 0.42);
    const wall = [[-120, 30], [-116, -10], [-104, -52], [-80, -80], [-40, -96], [0, -88], [40, -100], [84, -78], [110, -48], [120, -6], [124, 30]];
    const g = c.createLinearGradient(0, -100, 0, 30); g.addColorStop(0, '#6a4a44'); g.addColorStop(0.55, '#3a2a28'); g.addColorStop(1, '#241818');
    poly(c, wall, g, 1);
    c.save(); c.beginPath(); wall.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.clip();
    for (let i = 0; i < 24; i++) soft(c, -110 + ((i * 53) % 230), -90 + ((i * 29) % 110), 18, 12, i % 2 ? '#8a625a' : '#1e1414', 0.32);
    for (let k = 0; k < 7; k++) line(c, -116, -70 + k * 17, 118, -64 + k * 17, 1.6, '#120c0c', 0.3, 3);
    c.restore();
    outline(c, wall, INK, 2, 0.75, false);
    // three lava falls pour over the lip into the pool below
    for (const [x, w, top] of [[-62, 12, -78], [-4, 18, -90], [60, 13, -72]]) {
      const pts = bez([x, top], [x - 3, top + 40], [x + 3, top + 70], [x, 22], 10);
      brush(c, pts, w + 6, '#2a1b1a', 0.5, 2); brush(c, pts, w, '#c9452a', 0.95, 2); brush(c, pts, w * 0.55, '#f4a23c', 0.95, 2); brush(c, pts, w * 0.22, '#ffe39a', 0.95, 2);
    }
    soft(c, 0, -20, 130, 70, '#ff7a3a', 0.2);
    lavaPool(c, 0, 34, 76, 15); lavaPool(c, -74, 40, 24, 7); lavaPool(c, 80, 42, 22, 6);
    for (const [x, y, s] of [[-124, 34, 10], [128, 34, 9], [-96, 42, 6], [100, 44, 6]]) rock(c, x, y, s, '#3a2c2a', '#7a625c');
    for (const [x, y, r, a] of [[-40, -108, 22, 0.4], [10, -126, 26, 0.34], [60, -140, 26, 0.28], [-12, -150, 22, 0.24]]) soft(c, x, y, r * 1.3, r * 0.9, '#8a7d78', a);
    for (let i = 0; i < 12; i++) dot(c, -70 + ((i * 29) % 140), -70 - ((i * 17) % 60), 1.3, '#ffb14a', 0.85);
  }
  const LANDMARKS = { hill: lmHill, 'oak-grove': lmOak, 'bamboo-grove': lmBambooGrove, lake: lmLake, lighthouse: lmLighthouse, 'reef-arch': lmReef, shipwreck: lmWreck, 'sea-stacks': lmSeaStacks, 'giant-dune': lmDune, oasis: lmOasis, mesa: lmMesa, pyramid: lmPyramid, 'ice-peak': lmIcePeak, 'frozen-lake': lmFrozen, 'ice-forest': lmIceForest, 'ice-palace': lmIcePalace, 'burnt-grove': lmBurnt, 'obsidian-ridge': lmRidge, 'lava-falls': lmLavaFalls, volcano: lmVolcano };

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
  const HALO = { forest: 0.18, bamboo: 0.1, cove: 0.2, ash: 0.42, ridge: 0.62, lavafall: 0.5, caldera: 0.55, glacier: 0.08 };
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

  // ================================================================================================
  //  Layout adapters: rasters, exclusion zones, feature index, decoration layers
  // ================================================================================================
  const U = WL.util, GR = WL.grid(), G = GR.G, GW = GR.GW, GH = GR.GH, BIOME = WL.BIOMES, BIO = WL.BIO;
  const PALI = BIOME.map((b) => PAL[b] || null);
  const groundAt = (x, y) => { const gx = Math.floor(x / G), gy = Math.floor(y / G); return (x < 0 || y < 0 || gx >= GW || gy >= GH) ? 0 : GR.ground[gy * GW + gx]; };
  const cellAt = (x, y) => { const gx = Math.floor(x / G), gy = Math.floor(y / G); return (x < 0 || y < 0 || gx >= GW || gy >= GH) ? -1 : gy * GW + gx; };
  // Deterministic per-cell noise in [0,1)
  function hh(i, j, s) { let h = Math.imul(i | 0, 374761393) ^ Math.imul(j | 0, 668265263) ^ Math.imul((s | 0) + 1013, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  const smoothPoly = (P, k) => smooth(P, k);

  // Nodes the map knows about (content comes from World; geometry from the layout)
  const NODES = World.nodes.filter((n) => n.type === 'camp' || WL.subareas[n.sub]);
  const SUBIDS = Object.keys(WL.subareas);
  const exR = new Uint8Array(GW * GH), exN = new Uint8Array(GW * GH);   // roads / things decoration must keep clear of
  const FEATS = WL.features;
  const roadsList = FEATS.filter((f) => f.k === 'road');
  function buildExclusions() {
    for (const f of FEATS) {
      if (f.k === 'road') U.stampLine(exR, f.pts, f.w / 2 + 14, 1);
      else if (f.k === 'bridge' || f.k === 'ford') U.stampRect(exR, f.x, f.y, f.len + 30, (f.w || 40) + 40, f.a, 1);
      else if (f.k === 'field') U.stampEllipse(exN, f.x, f.y, f.rx + 10, f.ry + 10, 1, f.rot);
      else if (f.k === 'shrine' || f.k === 'ruin' || f.k === 'torii') U.stampEllipse(exN, f.x, f.y, 70 * (f.s || 1), 50 * (f.s || 1), 1);
      else if (f.k === 'stones') U.stampEllipse(exN, f.x, f.y, f.r + 24, f.r * 0.7 + 18, 1);
      else if (f.k === 'lanterns') U.stampLine(exN, f.pts, 30, 1);
      else if (f.k === 'lake') U.stampEllipse(exN, f.x, f.y, f.rx + 30, f.ry + 30, 1, f.rot);
      else if (f.k === 'mesa') U.stampEllipse(exN, f.x, f.y, f.rx + 24, f.ry + 24, 1);
      else if (f.k === 'jetty') U.stampEllipse(exN, f.x, f.y, 60, 80, 1);
    }
    for (const n of NODES) U.stampEllipse(exN, n.x, n.y, n.type === 'camp' ? 150 : 74, n.type === 'camp' ? 70 : 54, 1);
    for (const id of SUBIDS) {
      const s = WL.subareas[id], L = s.landmark;
      U.stampEllipse(exN, L.x, L.y - 8, L.rx * 1.7 + 20, L.ry * 2.1 + 40, 1);
      U.stampEllipse(exN, s.entry[0], s.entry[1], 50, 40, 1);
      if (s.poi) U.stampEllipse(exN, s.poi[0], s.poi[1], 66, 50, 1);
    }
  }
  buildExclusions();
  const free = (x, y) => { const i = cellAt(x, y); return i >= 0 && GR.land[i] === 1 && !GR.blk[i] && !exR[i] && !exN[i]; };
  const freeLoose = (x, y) => { const i = cellAt(x, y); return i >= 0 && GR.land[i] === 1 && !GR.blk[i] && !exN[i]; };

  // ---------- Land path (coast, inland sea, islands) ----------
  function polyPath(path, P) {
    const n = P.length; if (n < 3) return;
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let m = mid(P[n - 1], P[0]); path.moveTo(m[0], m[1]);
    for (let i = 0; i < n; i++) { const m2 = mid(P[i], P[(i + 1) % n]); path.quadraticCurveTo(P[i][0], P[i][1], m2[0], m2[1]); }
    path.closePath();
  }
  const LAND = new Path2D();
  polyPath(LAND, WL.outline); polyPath(LAND, WL.sound); for (const e of WL.extraLand) polyPath(LAND, e.poly);

  // ---------- Feature index (512-unit buckets) ----------
  const NTX = Math.ceil(MAP_W / TILE), NTY = Math.ceil(MAP_H / TILE);
  const FI = new Array(NTX * NTY);
  function fbox(f) {
    let b;
    switch (f.k) {
      case 'river': b = U.bboxOf(f.pts); return [b[0] - f.w1 - 70, b[1] - f.w1 - 70, b[2] + f.w1 + 70, b[3] + f.w1 + 70];
      case 'road': b = U.bboxOf(f.pts); return [b[0] - 40, b[1] - 40, b[2] + 40, b[3] + 40];
      case 'cliff': b = U.bboxOf(f.pts); return [b[0] - 50, b[1] - 60, b[2] + 50, b[3] + f.h + 70];
      case 'ridge': b = U.bboxOf(f.pts); return [b[0] - f.r * 1.4, b[1] - f.r * 2.4, b[2] + f.r * 1.4, b[3] + f.r * 1.2];
      case 'lanterns': b = U.bboxOf(f.pts); return [b[0] - 40, b[1] - 60, b[2] + 40, b[3] + 40];
      case 'lake': case 'grove': case 'field': { const r = Math.max(f.rx, f.ry) + 70; return [f.x - r, f.y - r - 30, f.x + r, f.y + r]; }
      case 'mesa': return [f.x - f.rx - 60, f.y - f.ry - f.h - 90, f.x + f.rx + 60, f.y + f.ry + 60];
      case 'bridge': case 'ford': { const r = f.len / 2 + 60; return [f.x - r, f.y - r, f.x + r, f.y + r]; }
      case 'reef': return [f.x - f.rx - 40, f.y - f.ry - 60, f.x + f.rx + 40, f.y + f.ry + 40];
      default: { const r = 140 * (f.s || 1) + (f.r || 0); return [f.x - r, f.y - r * 1.2, f.x + r, f.y + r * 0.6]; }
    }
  }
  for (const f of FEATS) {
    f.salt = (f.salt || 0) + Math.floor(hh(f.x || (f.pts && f.pts[0][0]) || 1, f.y || (f.pts && f.pts[0][1]) || 1, 77) * 100000);
    const b = fbox(f); f._b = b;
    const tx0 = Math.max(0, Math.floor(b[0] / TILE)), tx1 = Math.min(NTX - 1, Math.floor(b[2] / TILE)), ty0 = Math.max(0, Math.floor(b[1] / TILE)), ty1 = Math.min(NTY - 1, Math.floor(b[3] / TILE));
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) (FI[ty * NTX + tx] = FI[ty * NTX + tx] || []).push(f);
  }
  let qStamp = 0;
  function featuresIn(x0, y0, x1, y1) {
    const out = [], q = ++qStamp;
    const tx0 = Math.max(0, Math.floor(x0 / TILE)), tx1 = Math.min(NTX - 1, Math.floor(x1 / TILE)), ty0 = Math.max(0, Math.floor(y0 / TILE)), ty1 = Math.min(NTY - 1, Math.floor(y1 / TILE));
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const l = FI[ty * NTX + tx]; if (!l) continue;
      for (const f of l) if (f._q !== q) { f._q = q; const b = f._b; if (b[2] >= x0 && b[0] <= x1 && b[3] >= y0 && b[1] <= y1) out.push(f); }
    }
    return out;
  }
  // Ridge peaks are generated once per ridge, in world coordinates
  const RIDGE_COL = {
    snow: ['#9aa8c8', '#4c5f93', '#d6dcea', '#a5b1cf', '#2f3f6a', 1], rock: ['#8e8b9c', '#4d4a62', '#d4d0cc', '#b4b0ae', '#2c2a3a', 0.25],
    ash: ['#8a7e7a', '#4a403e', '#bcb0a6', '#8d827c', '#221a18', 0.0], red: ['#c98260', '#8e4a34', '#f0c9a4', '#d9a07a', '#4a2218', 0],
  };
  for (const f of FEATS) if (f.k === 'ridge') {
    const R = U.rng('peaks:' + f.salt), pts = f.pts, out = []; f.peaks = out;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / (f.r * 0.5))), nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      for (let k = 0; k < n; k++) for (const row of [-1, 0, 1]) {
        if (row === 0 && R() < 0.4) continue;
        const t = (k + R()) / n, off = row * f.r * 0.5 + (R() - 0.5) * f.r * 0.4;
        out.push([a[0] + (b[0] - a[0]) * t + nx * off, a[1] + (b[1] - a[1]) * t + ny * off, f.r * (0.38 + R() * 0.34) * (row === 0 ? 1.15 : 0.9), R(), R()]);
      }
    }
    out.sort((p, q) => p[1] - q[1]);
  }

  // ================================================================================================
  //  Decoration layers: jittered-grid scatter per biome, seeded by cell (tile-independent)
  // ================================================================================================
  const tf = (c, x, y, s, col, a) => { c.globalAlpha = a || 0.6; c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath(); for (const d of [-3, 0, 3]) { c.moveTo(x + d, y); c.quadraticCurveTo(x + d * 1.3, y - s * 0.6, x + d * 1.9, y - s - Math.abs(d) * 0.4); } c.stroke(); c.globalAlpha = 1; };
  function mpk(c, x, y, s, top, bot, shade, snowy, t) {
    soft(c, x, y - 2, s * 1.5, s * 0.3, '#f0f2f7', 0.45);
    const g = c.createLinearGradient(0, y - s * 1.6, 0, y);
    g.addColorStop(0, rgba(top, 0.9)); g.addColorStop(0.6, rgba(mixh(top, bot, 0.5), 0.62)); g.addColorStop(1, rgba(bot, 0.12));
    c.fillStyle = g; c.beginPath(); c.moveTo(x - s, y); c.quadraticCurveTo(x - s * 0.55, y - s * 0.7, x - s * 0.2, y - s * 1.35); c.lineTo(x, y - s * 1.6); c.quadraticCurveTo(x + s * 0.3, y - s * 1.1, x + s * 0.55, y - s * 0.7); c.quadraticCurveTo(x + s * 0.85, y - s * 0.3, x + s, y); c.closePath(); c.fill();
    c.globalAlpha = 0.28; c.fillStyle = shade; c.beginPath(); c.moveTo(x, y - s * 1.6); c.quadraticCurveTo(x + s * 0.3, y - s * 1.1, x + s * 0.55, y - s * 0.7); c.quadraticCurveTo(x + s * 0.85, y - s * 0.3, x + s, y); c.lineTo(x + s * 0.2, y); c.quadraticCurveTo(x + s * 0.12, y - s * 0.7, x, y - s * 1.6); c.fill(); c.globalAlpha = 1;
    brush(c, quad(x - s * 0.2, y - s * 1.35, x - s * 0.5, y - s * 0.7, x - s * 0.9, y - s * 0.08, 6), 1.3 + t * 0.6, INK, 0.28 + t * 0.2);
    if (snowy) { c.globalAlpha = 0.92; c.fillStyle = '#fbfdfd'; c.beginPath(); c.moveTo(x, y - s * 1.6); c.lineTo(x - s * 0.2, y - s * 1.35); c.lineTo(x - s * 0.3, y - s * 1.02); c.lineTo(x - s * 0.1, y - s * 1.12); c.lineTo(x + s * 0.05, y - s * 0.96); c.lineTo(x + s * 0.18, y - s * 1.12); c.lineTo(x + s * 0.4, y - s * 0.85); c.quadraticCurveTo(x + s * 0.3, y - s * 1.1, x, y - s * 1.6); c.fill(); c.globalAlpha = 1; }
    soft(c, x, y - s * 0.12, s * 1.1, s * 0.2, '#f2f4f8', 0.5);
  }
  const pick = (a, r) => a[Math.min(a.length - 1, Math.floor(r * a.length))];
  // tree kinds used by groves and scattered trees: (c, x, y, o, size multiplier)
  const TREES = {
    oak: (c, x, y, o, k) => roundTree(c, x, y, (10 + o.r * 6) * k, o, '#5f9058', '#9cc474'),
    round: (c, x, y, o, k) => roundTree(c, x, y, (9 + o.r * 5) * k, o, '#7da85a', '#a9cb78'),
    pine: (c, x, y, o, k) => pine(c, x, y, (9 + o.r * 6) * k, o, o.q > 0.5 ? '#35604f' : '#4a7656', '#8fb67a', false),
    sakura: (c, x, y, o, k) => sakura(c, x, y, (10 + o.r * 4) * k, o),
    bamboo: (c, x, y, o, k) => bamboo(c, x, y, (8 + o.r * 3) * k, o),
    palm: (c, x, y, o, k) => palm(c, x, y, (10 + o.r * 6) * k),
    frost: (c, x, y, o, k) => frostPine(c, x, y, (8 + o.r * 5) * k),
    burnt: (c, x, y, o, k) => burnt(c, x, y, (8 + o.r * 5) * k, o.q > 0.6),
    willow: (c, x, y, o, k) => willow(c, x, y, (11 + o.r * 4) * k),
    cactus: (c, x, y, o, k) => cactus(c, x, y, (8 + o.r * 4) * k),
    crystal: (c, x, y, o, k) => crystal(c, x, y, (4 + o.r * 6) * k, '#aed2ea', '#ffffff'),
    shard: (c, x, y, o, k) => shard(c, x, y, (6 + o.r * 6) * k, (12 + o.q * 18) * k, (o.r - 0.5) * 6, '#2a2640', '#8c82c0'),
  };
  const LAYERS = [];
  // layer(name, biomes, step, prob, big, draw(c, x, y, o)) where o = {r, q, k}; big = also painted (larger, sparser) in the overview
  function layer(name, biomes, step, prob, big, draw) { LAYERS.push({ name, ids: biomes.map((b) => BIO[b]), step, prob, big, draw, salt: U.hash(name) % 9973 }); }
  const L = layer;
  const blobF = (c, x, y, rx, ry, col, a) => soft(c, x, y, rx, ry, col, a);
  const dotC = (cols, rr, a) => (c, x, y, o) => dot(c, x, y, rr, pick(cols, o.r), a);
  const rk = (col, hi, s0, s1) => (c, x, y, o) => rock(c, x, y, (s0 + o.r * s1) * o.k, col, hi);
  const duneF = (a, b) => (c, x, y, o) => { const s = (a + o.r * b) * o.k; soft(c, x + 4, y + 3, s * 0.9, s * 0.25, '#b9823e', 0.28); brush(c, quad(x - s, y + 6, x - s * 0.1, y - s * 0.55, x + s, y + 6, 8), 2, '#a8743a', 0.6); };
  const rippleF = (col, a) => (c, x, y, o) => ripples(c, x, y, 20, 2, col, a);
  const moundF = (lo, hi, sh) => (c, x, y, o) => { soft(c, x, y + 3, (lo + o.r * hi), 7, sh, 0.34); soft(c, x, y, (lo - 2 + o.r * (hi - 2)), 6, '#ffffff', 0.75); };
  const sparkF = (cols) => (c, x, y, o) => sparkle(c, x, y, 1.8 + o.r * 1.6, pick(cols, o.q), 0.85);
  const crackF = (w, lava) => (c, x, y, o) => { const pts = bez([x - 15, y], [x - 4, y - 6 - o.r * 6], [x + 4, y + 5], [x + 16, y - 2], 5); brush(c, pts, w, '#1e1414', 0.65, 2); brush(c, pts, w * 0.45, lava, 0.85, 2); };
  // Meadow
  L('m-grass', ['meadow'], 40, 0.95, 0, (c, x, y, o) => tf(c, x, y, 6 + o.r * 3, '#6d9a52'));
  L('m-flower', ['meadow'], 34, 0.7, 0, dotC(['#fbf7ea', '#f1c75b', '#e9a1a8', '#b8a3d6'], 1.9, 0.9));
  L('m-mound', ['meadow'], 150, 0.8, 0, (c, x, y, o) => { soft(c, x + 4, y + 4, 24 + o.r * 18, 7, '#6f9a52', 0.28); soft(c, x - 4, y - 1, 22 + o.r * 14, 7, '#e6f0b8', 0.6); });
  L('m-tree', ['meadow'], 170, 0.75, 1, (c, x, y, o) => TREES.round(c, x, y, o, o.k));
  L('m-sakura', ['meadow'], 330, 0.7, 1, (c, x, y, o) => TREES.sakura(c, x, y, o, o.k));
  L('m-pine', ['meadow'], 230, 0.5, 0, (c, x, y, o) => pine(c, x, y, (9 + o.r * 4) * o.k, o, '#4f7a5a', '#8fb67a', false));
  // Old Oak Wood
  L('f-moss', ['forest'], 110, 0.7, 0, (c, x, y, o) => soft(c, x, y, 30 + o.r * 24, 12, '#3f6a4c', 0.26));
  L('f-leaf', ['forest'], 30, 0.55, 0, dotC(['#b88a46', '#d9a050', '#8a6a3a', '#cf7a3a'], 1.5, 0.65));
  L('f-pine', ['forest'], 78, 0.85, 1, (c, x, y, o) => TREES.pine(c, x, y, o, o.k));
  L('f-oak', ['forest'], 128, 0.7, 1, (c, x, y, o) => TREES.oak(c, x, y, o, o.k));
  L('f-grass', ['forest'], 50, 0.7, 0, (c, x, y, o) => tf(c, x, y, 6, '#4f7a4a', 0.55));
  L('f-bamboo', ['forest'], 300, 0.5, 0, (c, x, y, o) => TREES.bamboo(c, x, y, o, o.k));
  // Bamboo Valley
  L('b-grass', ['bamboo'], 40, 0.9, 0, (c, x, y, o) => tf(c, x, y, 6 + o.r * 3, '#6a9a52'));
  L('b-bamboo', ['bamboo'], 84, 0.65, 1, (c, x, y, o) => TREES.bamboo(c, x, y, o, o.k));
  L('b-tree', ['bamboo'], 200, 0.6, 0, (c, x, y, o) => TREES.round(c, x, y, o, o.k));
  L('b-rock', ['bamboo'], 160, 0.6, 0, rk('#6f8a70', '#b6c8b4', 5, 5));
  L('b-flower', ['bamboo'], 52, 0.5, 0, dotC(['#fbf7ea', '#e9a1c0', '#b8a3d6'], 1.7, 0.85));
  // Mirror Lake shore
  L('l-puddle', ['lake'], 210, 0.6, 0, (c, x, y, o) => { ell(c, x, y, 12 + o.r * 10, 4 + o.r * 2, '#cfe4d2', 0.7); ell(c, x, y, 9 + o.r * 8, 3 + o.r * 1.4, '#8fc4d0', 0.85); });
  L('l-grass', ['lake'], 38, 0.95, 0, (c, x, y, o) => tf(c, x, y, 6 + o.r * 3, '#5f9a56'));
  L('l-reed', ['lake'], 120, 0.5, 0, (c, x, y, o) => reed(c, x, y, (10 + o.r * 4) * o.k));
  L('l-flower', ['lake'], 52, 0.55, 0, dotC(['#fbf7ea', '#b8a3d6', '#f1c75b', '#e9a1c0'], 1.7, 0.85));
  L('l-willow', ['lake'], 320, 0.55, 1, (c, x, y, o) => TREES.willow(c, x, y, o, o.k));
  L('l-tree', ['lake'], 210, 0.55, 1, (c, x, y, o) => TREES.round(c, x, y, o, o.k));
  // Shell Beach
  L('be-dune', ['beach'], 70, 0.65, 0, (c, x, y, o) => brush(c, quad(x - 16, y, x, y - 8, x + 16, y, 6), 1.6, '#c9a672', 0.55));
  L('be-palm', ['beach'], 160, 0.6, 1, (c, x, y, o) => TREES.palm(c, x, y, o, o.k));
  L('be-shell', ['beach'], 52, 0.5, 0, (c, x, y, o) => { c.fillStyle = o.r > 0.5 ? '#eaa8a0' : '#d8c08a'; c.globalAlpha = 0.85; c.beginPath(); c.ellipse(x, y, 2.4, 1.6, o.q, 0, 7); c.fill(); c.globalAlpha = 1; });
  L('be-star', ['beach'], 260, 0.55, 0, (c, x, y, o) => { c.fillStyle = '#e9786a'; c.globalAlpha = 0.9; c.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + o.r, r = i % 2 ? 1.8 : 4; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.fill(); c.globalAlpha = 1; });
  L('be-wood', ['beach'], 230, 0.55, 0, (c, x, y, o) => { brush(c, [[x - 9, y], [x + 9, y - 3]], 3.2, '#8a7a62', 0.9, 2); line(c, x - 2, y - 1, x + 4, y - 6, 1.4, '#8a7a62', 0.8, 0); });
  L('be-grass', ['beach'], 60, 0.6, 0, (c, x, y, o) => tf(c, x, y, 7, '#8a9a4a', 0.65));
  // Coral Shallows: reef lanes
  L('co-reef', ['coral'], 46, 0.7, 0, (c, x, y, o) => { c.globalAlpha = 0.78; c.strokeStyle = pick(['#e9877f', '#f0b26a', '#d86f93', '#b78ad0'], o.r); c.lineWidth = 1.8; c.lineCap = 'round'; c.beginPath(); for (const d of [-3, 0, 3]) { c.moveTo(x + d, y); c.lineTo(x + d * 1.5, y - 5 - o.q * 5); } c.stroke(); c.globalAlpha = 1; c.lineCap = 'butt'; });
  L('co-sand', ['coral'], 110, 0.7, 0, (c, x, y, o) => soft(c, x, y, 40 + o.r * 30, 12, '#f6ebc4', 0.5));
  L('co-fish', ['coral'], 230, 0.5, 0, (c, x, y, o) => { c.save(); c.translate(x, y); c.scale(o.q > 0.5 ? 1 : -1, 1); poly(c, [[0, 0], [-4, -1.4], [-6, 1.2], [-3, 1.8]], '#f0904a', 0.85); poly(c, [[-6, 0], [-9, -2], [-9, 2.6]], '#f0904a', 0.85); c.restore(); });
  L('co-palm', ['coral'], 400, 0.4, 0, (c, x, y, o) => TREES.palm(c, x, y, o, o.k));
  // Shipwreck Cove
  L('cv-wet', ['cove'], 110, 0.65, 0, (c, x, y, o) => soft(c, x, y, 26 + o.r * 22, 9, '#8a7c66', 0.3));
  L('cv-pool', ['cove'], 230, 0.5, 0, (c, x, y, o) => { ell(c, x, y, 13 + o.r * 8, 5 + o.r * 2, '#f6efdc', 0.7); ell(c, x, y, 10 + o.r * 7, 3.6 + o.r * 1.6, '#6fa4ae', 0.9); });
  L('cv-rock', ['cove'], 66, 0.65, 1, rk('#58606c', '#98a2ae', 5, 9));
  L('cv-weed', ['cove'], 90, 0.5, 0, (c, x, y, o) => { for (const d of [-2, 0, 2]) line(c, x + d, y, x + d * 2, y - 6 - o.q * 4, 1.6, '#3f5a3a', 0.8, d); });
  L('cv-bone', ['cove'], 420, 0.5, 0, (c, x, y, o) => { brush(c, [[x - 5, y], [x + 5, y - 2]], 2.4, '#f4ecd7', 0.9, 2); dot(c, x - 5, y, 1.6, '#f4ecd7', 0.95); dot(c, x + 5, y - 2, 1.6, '#f4ecd7', 0.95); });
  L('cv-wood', ['cove'], 230, 0.5, 0, (c, x, y, o) => brush(c, [[x - 10, y], [x + 10, y - 3]], 3.4, '#6a5a46', 0.92, 2));
  // Mist Isles
  L('is-palm', ['isles'], 100, 0.6, 1, (c, x, y, o) => TREES.palm(c, x, y, o, o.k));
  L('is-shell', ['isles'], 60, 0.5, 0, (c, x, y, o) => { c.fillStyle = o.r > 0.5 ? '#eaa8a0' : '#d8c08a'; c.globalAlpha = 0.85; c.beginPath(); c.ellipse(x, y, 2.4, 1.6, o.q, 0, 7); c.fill(); c.globalAlpha = 1; });
  L('is-grass', ['isles'], 56, 0.7, 0, (c, x, y, o) => tf(c, x, y, 6, '#8a9a4a', 0.65));
  L('is-rock', ['isles'], 120, 0.5, 0, rk('#58606c', '#98a2ae', 4, 6));
  // Dune Sea
  L('d-ripple', ['dunes'], 64, 0.7, 0, rippleF('#b9823e', 0.4));
  L('d-dune', ['dunes'], 96, 0.85, 1, duneF(18, 14));
  L('d-cactus', ['dunes'], 270, 0.6, 1, (c, x, y, o) => TREES.cactus(c, x, y, o, o.k));
  L('d-rock', ['dunes'], 190, 0.5, 0, rk('#c79a62', '#e8cfa0', 5, 4));
  L('d-bush', ['dunes'], 72, 0.55, 0, (c, x, y, o) => tf(c, x, y, 6, '#8a7a3a', 0.7));
  L('d-skull', ['dunes'], 800, 0.4, 0, (c, x, y, o) => { dot(c, x, y, 3.4, '#f4ecd7', 0.95); dot(c, x - 1.2, y - 0.4, 0.8, INK, 0.8); dot(c, x + 1.2, y - 0.4, 0.8, INK, 0.8); });
  // Palm Oasis
  L('o-ripple', ['oasis'], 70, 0.5, 0, rippleF('#b9823e', 0.38));
  L('o-green', ['oasis'], 150, 0.65, 0, (c, x, y, o) => { soft(c, x, y, 24 + o.r * 16, 9, '#8fb25a', 0.4); tf(c, x - 6, y, 6, '#4f8a3a', 0.7); tf(c, x + 6, y + 2, 6, '#4f8a3a', 0.7); });
  L('o-palm', ['oasis'], 280, 0.65, 1, (c, x, y, o) => TREES.palm(c, x, y, o, o.k));
  L('o-dune', ['oasis'], 124, 0.65, 1, duneF(16, 12));
  L('o-rock', ['oasis'], 250, 0.5, 0, rk('#c79a62', '#e8cfa0', 5, 4));
  // Red Canyon
  L('cn-ripple', ['canyon'], 70, 0.55, 0, rippleF('#a8603a', 0.4));
  L('cn-rock', ['canyon'], 84, 0.6, 1, rk('#b8683f', '#e8a06c', 5, 6));
  L('cn-cactus', ['canyon'], 300, 0.5, 0, (c, x, y, o) => TREES.cactus(c, x, y, o, o.k));
  L('cn-dune', ['canyon'], 150, 0.55, 0, duneF(14, 10));
  L('cn-bush', ['canyon'], 80, 0.5, 0, (c, x, y, o) => tf(c, x, y, 6, '#8a6a3a', 0.7));
  // Buried Temple
  L('t-pave', ['temple'], 230, 0.5, 0, (c, x, y, o) => { c.save(); c.translate(x, y); c.scale(1, 0.5); c.rotate(0.3); for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++) { c.fillStyle = (i + j) % 2 ? 'rgba(196,150,100,.5)' : 'rgba(240,215,170,.55)'; c.fillRect(i * 12 - 6, j * 12 - 6, 11, 11); } c.restore(); });
  L('t-column', ['temple'], 120, 0.55, 0, (c, x, y, o) => { const h = 8 + o.r * 12; soft(c, x + 3, y + 1, 7, 2.4, '#6a4a2a', 0.3); brush(c, [[x, y], [x, y - h]], 5, '#efd9ab', 0.95, 2); brush(c, [[x - 4, y - h - 1], [x + 4, y - h - 1]], 2.4, '#b88a58', 0.9, 2); line(c, x + 1.8, y, x + 1.8, y - h, 1.2, '#a8744a', 0.4, 0); });
  L('t-block', ['temple'], 74, 0.5, 0, (c, x, y, o) => { poly(c, [[x - 6, y], [x - 5, y - 5], [x + 5, y - 6], [x + 6, y]], '#e0c08a', 0.95); outline(c, [[x - 6, y], [x - 5, y - 5], [x + 5, y - 6], [x + 6, y]], INK, 0.8, 0.5, true); });
  L('t-dune', ['temple'], 100, 0.7, 1, (c, x, y, o) => brush(c, quad(x - 16, y, x, y - 7, x + 16, y, 6), 1.8, '#a8744a', 0.5));
  L('t-drift', ['temple'], 130, 0.6, 0, (c, x, y, o) => soft(c, x, y, 28 + o.r * 20, 8, '#f3dca8', 0.65));
  L('t-mini', ['temple'], 560, 0.4, 0, (c, x, y, o) => { const s = 12 + o.r * 6; soft(c, x + 5, y + 2, s * 1.2, s * 0.24, '#6a4a2a', 0.25); poly(c, [[x - s, y], [x, y - s * 0.95], [x + s * 0.2, y]], '#e4bf80', 0.92); poly(c, [[x, y - s * 0.95], [x + s, y], [x + s * 0.2, y]], '#c0885a', 0.92); outline(c, [[x - s, y], [x, y - s * 0.95], [x + s, y]], INK, 1, 0.55, true); });
  // Snow, frozen, rime, glacier
  L('s-mound', ['snow'], 62, 0.95, 0, moundF(18, 14, '#9cb4c6'));
  L('s-pine', ['snow'], 80, 0.8, 1, (c, x, y, o) => pine(c, x, y, (8 + o.r * 5) * o.k, o, '#3d6560', '#7fa8a0', true));
  L('s-rock', ['snow'], 130, 0.55, 0, (c, x, y, o) => { rock(c, x, y, (5 + o.r * 5) * o.k, '#8a98aa', '#d0dae4'); soft(c, x, y - 5 - o.r * 4, 6 + o.r * 4, 2.6, '#ffffff', 0.85); });
  L('s-spark', ['snow'], 38, 0.6, 0, sparkF(['#ffffff']));
  L('z-plate', ['frozen'], 84, 0.6, 0, (c, x, y, o) => { const s = 14 + o.r * 16, pts = []; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + o.q; pts.push([x + Math.cos(a) * s, y + Math.sin(a) * s * 0.42]); } poly(c, pts, '#f2fafc', 0.5); outline(c, pts, '#7fa8c8', 1, 0.45, true); });
  L('z-crystal', ['frozen'], 56, 0.7, 1, (c, x, y, o) => crystal(c, x, y, (4 + o.r * 5) * o.k, '#9ec6e2', '#ffffff'));
  L('z-crack', ['frozen'], 66, 0.5, 0, (c, x, y, o) => brush(c, [[x, y], [x + 8, y + 2 - o.r * 8], [x + 18, y + 2]], 1.5, '#5d86ab', 0.5));
  L('z-reed', ['frozen'], 120, 0.55, 0, (c, x, y, o) => { for (let i = -1; i <= 1; i++) brush(c, [[x + i * 3, y], [x + i * 4, y - 10 - i * i * 3]], 1.6, '#b4cfe0', 0.9, 2); dot(c, x, y - 12, 1.5, '#ffffff', 0.9); });
  L('z-spark', ['frozen'], 38, 0.6, 0, sparkF(['#ffffff']));
  L('r-mound', ['rime'], 90, 0.75, 0, moundF(18, 14, '#a3b0d2'));
  L('r-frost', ['rime'], 54, 0.6, 0, (c, x, y, o) => { for (let i = 0; i < 3; i++) brush(c, [[x, y], [x + (i - 1) * 6, y - 7 - (i % 2) * 3]], 1.2, '#8fa4d0', 0.6, 2); });
  L('r-pine', ['rime'], 64, 0.9, 1, (c, x, y, o) => TREES.frost(c, x, y, o, o.k));
  L('r-crystal', ['rime'], 100, 0.6, 0, (c, x, y, o) => crystal(c, x, y, 3 + o.r * 4, '#b8c6ee', '#ffffff'));
  L('r-spark', ['rime'], 32, 0.8, 0, sparkF(['#ffffff', '#c8d8ff']));
  L('g-plate', ['glacier'], 74, 0.6, 0, (c, x, y, o) => { const s = 14 + o.r * 18, pts = []; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + o.q; pts.push([x + Math.cos(a) * s, y + Math.sin(a) * s * 0.42]); } poly(c, pts, '#f6fbfd', 0.55); outline(c, pts, '#7fa8c8', 1, 0.5, true); });
  L('g-crystal', ['glacier'], 74, 0.6, 1, (c, x, y, o) => crystal(c, x, y, (4 + o.r * 6) * o.k, '#aed2ea', '#ffffff'));
  L('g-mound', ['glacier'], 104, 0.7, 0, moundF(18, 14, '#9cb4c6'));
  L('g-spark', ['glacier'], 36, 0.7, 0, sparkF(['#ffffff', '#cfe8ff']));
  L('g-rock', ['glacier'], 160, 0.4, 0, rk('#8a98aa', '#d0dae4', 5, 5));
  // Ash, ridge, lavafall, caldera
  L('a-pool', ['ash'], 66, 0.7, 0, (c, x, y, o) => soft(c, x, y, 20 + o.r * 18, 8, '#4d4440', 0.3));
  L('a-crack', ['ash'], 110, 0.6, 0, crackF(2, '#f08a35'));
  L('a-rock', ['ash'], 50, 0.8, 1, rk('#5f5652', '#9a8f88', 4, 7));
  L('a-dead', ['ash'], 120, 0.7, 1, (c, x, y, o) => TREES.burnt(c, x, y, o, o.k));
  L('a-ember', ['ash'], 42, 0.6, 0, (c, x, y, o) => dot(c, x, y, 1.1, '#ffb14a', 0.8));
  L('rg-sheen', ['ridge'], 96, 0.6, 0, (c, x, y, o) => brush(c, quad(x - 20, y, x, y - 5, x + 20, y + 1, 6), 2, '#9a8fc8', 0.3));
  L('rg-glow', ['ridge'], 110, 0.5, 0, (c, x, y, o) => soft(c, x, y, 24 + o.r * 14, 8, '#6a5aa0', 0.3));
  L('rg-shard', ['ridge'], 74, 0.7, 1, (c, x, y, o) => TREES.shard(c, x, y, o, o.k));
  L('rg-crystal', ['ridge'], 96, 0.6, 0, (c, x, y, o) => crystal(c, x, y, 3 + o.r * 3, '#4a4470', '#a89ee0'));
  L('rg-rock', ['ridge'], 76, 0.5, 0, rk('#2e2a40', '#6e6890', 4, 6));
  L('lf-crack', ['lavafall'], 80, 0.7, 0, crackF(2.4, '#f08a35'));
  L('lf-rock', ['lavafall'], 52, 0.8, 1, rk('#3a2c2a', '#7a625c', 4, 6));
  L('lf-ember', ['lavafall'], 38, 0.7, 0, (c, x, y, o) => dot(c, x, y, 1.2, '#ffb14a', 0.85));
  L('lf-pool', ['lavafall'], 300, 0.5, 0, (c, x, y, o) => lavaPool(c, x, y, 9 + o.r * 6, 4 + o.r * 2));
  L('cl-crack', ['caldera'], 70, 0.8, 0, crackF(2.4, '#f08a35'));
  L('cl-pool', ['caldera'], 320, 0.5, 1, (c, x, y, o) => lavaPool(c, x, y, (12 + o.r * 8) * o.k, (5 + o.r * 3) * o.k));
  L('cl-vent', ['caldera'], 300, 0.45, 0, (c, x, y, o) => { rock(c, x, y, 5, '#3a2c2a', '#7a625c'); soft(c, x, y - 12, 14, 10, '#8a7d78', 0.4); soft(c, x + 5, y - 24, 12, 9, '#a89a94', 0.3); });
  L('cl-rock', ['caldera'], 48, 0.8, 1, rk('#3a2c2a', '#7a625c', 4, 6));
  // The high massif: alpine meadow and the mountain skirts
  L('h-grass', ['high'], 40, 0.8, 0, (c, x, y, o) => tf(c, x, y, 6 + o.r * 3, '#7f9a72', 0.6));
  L('h-flower', ['high'], 60, 0.5, 0, dotC(['#ffffff', '#c9d6f0', '#f1e6a0'], 1.7, 0.85));
  L('h-pine', ['high'], 88, 0.7, 1, (c, x, y, o) => pine(c, x, y, (9 + o.r * 5) * o.k, o, '#3d6560', '#8fb0a0', o.q > 0.6));
  L('h-rock', ['high'], 110, 0.6, 1, rk('#8a9088', '#c8ceca', 5, 7));
  L('h-mound', ['high'], 140, 0.6, 0, moundF(20, 16, '#8da187'));
  L('mt-rock', ['mtn'], 80, 0.7, 1, rk('#7d8398', '#c4c9d8', 5, 7));
  L('mt-pine', ['mtn'], 110, 0.45, 0, (c, x, y, o) => pine(c, x, y, (8 + o.r * 4) * o.k, o, '#4d6e68', '#9bb7a0', o.q > 0.5));
  L('mt-grass', ['mtn'], 60, 0.5, 0, (c, x, y, o) => tf(c, x, y, 5, '#8a9a8a', 0.5));

  // ================================================================================================
  //  Feature painters (ground level)
  // ================================================================================================
  const LAKE = {
    lake: { g: ['#d8f0f0', '#8cc6d4', '#4b8dae'], ring: '#d4e4b0', ring2: '#a9c492', ink: INK },
    alpine: { g: ['#d6f2ee', '#7fc0c8', '#3a7f9c'], ring: '#e6efe0', ring2: '#b7cfc0', ink: INK },
    oasis: { g: ['#c4f2e8', '#58b9b4', '#2f8ca2'], ring: '#a2c86e', ring2: '#f1dca0', ink: '#2b6a5a' },
    tide: { g: ['#e4faf4', '#8fdcd2', '#4fb8c0'], ring: '#fbf3d6', ring2: '#efe0b0', ink: '#3f8f98' },
    deep: { g: ['#7fdad2', '#2f9cb4', '#1d6f95'], ring: '#d5f4ea', ring2: '#a8e8dc', ink: '#2f7f98' },
    marsh: { g: ['#cfe8d8', '#8fc4b4', '#5f9a8a'], ring: '#cfe0a8', ring2: '#a9c88a', ink: '#4a6a4a' },
    pond: { g: ['#d8f0f0', '#9acbd8', '#5a98b8'], ring: '#d4e4b0', ring2: '#a9c492', ink: INK },
    ice: { g: ['#ffffff', '#cfe6f4', '#9cc2dc'], ring: '#ffffff', ring2: '#e6f2f8', ink: '#6f98bc' },
    hole: { g: ['#9cc6e0', '#4f86b0', '#2f5a85'], ring: '#ffffff', ring2: '#dcecf6', ink: '#3d5a80' },
    lava: { g: ['#ffd27a', '#f08a35', '#c9452a'], ring: '#3a2c2a', ring2: '#5a4340', ink: '#1e1414' },
  };
  function paintLake(c, f, lod) {
    const S = LAKE[f.style] || LAKE.lake, rx = f.rx, ry = f.ry, rim = Math.min(24, 7 + ry * 0.09);
    c.save(); c.translate(f.x, f.y); c.rotate(f.rot || 0);
    soft(c, 0, 6, rx * 1.3, ry * 1.4, S.ring2, 0.4);
    ell(c, 0, 2, rx + rim * 1.5, ry + rim, S.ring, 0.9); ell(c, 0, 2, rx + rim * 0.6, ry + rim * 0.5, S.ring2, 0.85);
    const g = c.createRadialGradient(-rx * 0.15, -ry * 0.2, 2, 0, 0, Math.max(rx, ry));
    g.addColorStop(0, S.g[0]); g.addColorStop(0.55, S.g[1]); g.addColorStop(1, S.g[2]);
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, 7); c.fill();
    if (lod < 2) {
      c.save(); c.beginPath(); c.ellipse(0, 0, rx - 1, ry - 1, 0, 0, 7); c.clip();
      if (f.style === 'lava') { soft(c, -rx * 0.2, -ry * 0.2, rx * 0.7, ry * 0.6, '#ffe39a', 0.8); for (let i = 0; i < 9; i++) soft(c, ((i * 53) % 100 - 50) / 50 * rx * 0.8, ((i * 31) % 100 - 50) / 50 * ry * 0.7, rx * 0.25, ry * 0.2, '#2a1b1a', 0.4); }
      else if (f.style === 'hole') { soft(c, -rx * 0.3, -ry * 0.3, rx * 0.5, ry * 0.4, '#cfe6f4', 0.5); }
      else {
        soft(c, -rx * 0.3, -ry * 0.35, rx * 0.55, ry * 0.2, '#ffffff', 0.55); soft(c, rx * 0.35, -ry * 0.1, rx * 0.4, ry * 0.18, '#ffffff', 0.35); soft(c, 0, ry * 0.5, rx * 0.5, ry * 0.15, '#ffffff', 0.25);
        c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1; c.lineCap = 'round';
        const n = Math.round(rx * ry / 2400) + 3;
        for (let i = 0; i < n; i++) { const x = (hh(i, f.salt, 1) - 0.5) * rx * 1.6, y = (hh(i, f.salt, 2) - 0.5) * ry * 1.5, w = 5 + hh(i, f.salt, 3) * 8; c.beginPath(); c.moveTo(x - w, y); c.lineTo(x + w, y); c.stroke(); }
        c.lineCap = 'butt';
      }
      c.restore();
      if (f.style === 'marsh' || f.style === 'pond' || f.style === 'oasis') {
        const n = Math.round(rx / 14) + 3;
        for (let i = 0; i < n; i++) { const a = hh(i, f.salt, 4) * 6.28, d = 0.82 + hh(i, f.salt, 5) * 0.3; if (f.style !== 'pond' || i % 2) reed(c, Math.cos(a) * rx * d, Math.sin(a) * ry * d, 9 + hh(i, f.salt, 6) * 6); }
        for (let i = 0; i < 4; i++) { const x = (hh(i, f.salt, 7) - 0.5) * rx, y = (hh(i, f.salt, 8) - 0.5) * ry; ell(c, x, y, 5, 2.7, '#5f9a58', 0.9); ell(c, x + 1, y - 1, 3.4, 1.6, '#8cc474', 0.7); }
      }
    }
    c.strokeStyle = rgba(S.ink, f.style === 'lava' ? 0.8 : 0.45); c.lineWidth = 1.4; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, 7); c.stroke();
    c.restore();
  }
  const RIVER = {
    water: { bank: '#e9f1ea', w: '#8fb8c8', d: '#6f9fba', hi: '#e8f4f6' }, tide: { bank: '#fbf3d6', w: '#8fdcd2', d: '#4fb8c0', hi: '#e4faf4' },
    lava: { bank: '#2a1b1a', w: '#c9452a', d: '#f08a35', hi: '#ffd27a' }, crack: { bank: '#ffffff', w: '#4a74a0', d: '#2f5a85', hi: '#cfe6f4' },
    dry: { bank: '#d4b278', w: '#e8cf9c', d: '#dcc088', hi: '#f6e6bc' }, chasm: { bank: '#8a4a30', w: '#3a2218', d: '#1e100c', hi: '#6a3a28' },
  };
  function ribW(c, pts, wf, col, a) {
    const n = pts.length, L = [], Rr = [];
    for (let i = 0; i < n; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)];
      let dx = p1[0] - p0[0], dy = p1[1] - p0[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const hw = wf(i / (n - 1)) / 2;
      L.push([pts[i][0] - dy * hw, pts[i][1] + dx * hw]); Rr.push([pts[i][0] + dy * hw, pts[i][1] - dx * hw]);
    }
    c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < n; i++) c.lineTo(L[i][0], L[i][1]);
    for (let i = n - 1; i >= 0; i--) c.lineTo(Rr[i][0], Rr[i][1]);
    c.closePath(); c.fill(); c.globalAlpha = 1;
  }
  function paintRiver(c, f, lod) {
    const S = RIVER[f.style] || RIVER.water, sm = f._sm || (f._sm = smooth(f.pts, f.style === 'crack' ? 2 : 6));
    const w0 = f.w0, w1 = f.w1, tp = (t) => 0.4 + 0.6 * Math.min(1, t / 0.07, (1 - t) / 0.07);
    const wf = (k) => (t) => (w0 + (w1 - w0) * t) * tp(t) + k;
    if (f.style === 'dry') {
      ribW(c, sm, wf(10), S.bank, 0.35); ribW(c, sm, wf(0), S.w, 0.85); ribW(c, sm, wf(-14), S.hi, 0.5);
      if (lod < 2) for (let i = 0; i < sm.length; i += 2) { const p = sm[i]; dot(c, p[0] + Math.sin(i * 2.3) * 10, p[1] + Math.cos(i * 1.7) * 8, 1.4, '#b89458', 0.6); }
      return;
    }
    if (f.style === 'chasm') {
      ribW(c, sm, wf(14), '#c98a5c', 0.5); ribW(c, sm, wf(4), S.bank, 0.9); ribW(c, sm, wf(-6), S.w, 0.95); ribW(c, sm, wf(-18), S.d, 0.9);
      for (const sd of [-1, 1]) { c.strokeStyle = rgba(INK, 0.6); c.lineWidth = 1.4; c.beginPath(); sm.forEach((p, i) => { const q = sm[Math.min(sm.length - 1, i + 1)], pr = sm[Math.max(0, i - 1)]; let dx = q[0] - pr[0], dy = q[1] - pr[1]; const l = Math.hypot(dx, dy) || 1; const off = sd * (w0 * 0.55); const X = p[0] - dy / l * off, Y = p[1] + dx / l * off; if (i) c.lineTo(X, Y); else c.moveTo(X, Y); }); c.stroke(); }
      return;
    }
    if (f.style === 'crack') {
      ribW(c, sm, wf(10), S.bank, 0.7); ribW(c, sm, wf(2), S.hi, 0.9); ribW(c, sm, wf(-4), S.w, 0.95); ribW(c, sm, wf(-9), S.d, 0.9);
      return;
    }
    if (f.style === 'lava') {
      soft(c, sm[Math.floor(sm.length / 2)][0], sm[Math.floor(sm.length / 2)][1], 60, 40, '#ff7a3a', 0.0);
      ribW(c, sm, wf(26), '#ff7a3a', 0.16); ribW(c, sm, wf(10), S.bank, 0.8); ribW(c, sm, wf(0), S.w, 0.95); ribW(c, sm, wf(-w1 * 0.4), S.d, 0.95); ribW(c, sm, wf(-w1 * 0.75), S.hi, 0.9);
      return;
    }
    ribW(c, sm, wf(16), S.bank, 0.5); ribW(c, sm, wf(5), S.w, 0.62); ribW(c, sm, wf(-w1 * 0.35), S.d, 0.55);
    if (lod < 2) {
      brush(c, sm.map((p, i) => [p[0] + Math.sin(i) * 2, p[1] - 3]), 4, S.hi, 0.6);
      c.strokeStyle = rgba(INK, 0.28); c.lineWidth = 1;
      for (const sd of [-1, 1]) { c.beginPath(); sm.forEach((p, i) => { const q = sm[Math.min(sm.length - 1, i + 1)], pr = sm[Math.max(0, i - 1)]; let dx = q[0] - pr[0], dy = q[1] - pr[1]; const l = Math.hypot(dx, dy) || 1; const off = sd * (((w0 + (w1 - w0) * i / (sm.length - 1)) / 2) + 8); const X = p[0] - dy / l * off, Y = p[1] + dx / l * off; if (i) c.lineTo(X, Y); else c.moveTo(X, Y); }); c.stroke(); }
    }
    // spring pool at the source and a widening at the mouth
    const a = sm[0], b = sm[sm.length - 1];
    ell(c, a[0], a[1], w0 * 0.9, w0 * 0.55, S.bank, 0.6); ell(c, a[0], a[1], w0 * 0.7, w0 * 0.4, S.d, 0.85);
    // waterfall where the river spills over a cliff
    if (f.fall !== undefined && lod < 2) {
      const p = f.pts[f.fall], q = f.pts[Math.max(0, f.fall - 1)], wdt = (w0 + (w1 - w0) * f.fall / (f.pts.length - 1)) * 0.8;
      void q;
      soft(c, p[0], p[1] + 70, wdt * 1.3, 30, '#ffffff', 0.85);
      for (let i = -2; i <= 2; i++) brush(c, [[p[0] + i * wdt * 0.2, p[1] - 4], [p[0] + i * wdt * 0.22, p[1] + 66]], wdt * 0.3, '#ffffff', 0.8, 2);
      for (let i = -1; i <= 1; i++) line(c, p[0] + i * wdt * 0.26, p[1] - 4, p[0] + i * wdt * 0.28, p[1] + 64, 1, '#7fa8c8', 0.5, 0);
    }
  }
  const ROAD_COL = { meadow: '#ead9a8', forest: '#e0cfa0', bamboo: '#dcd8c4', lake: '#ead9a8', beach: '#f6e9c0', coral: '#f6e9c0', cove: '#eadcb8', isles: '#f6e9c0', dunes: '#f9ecc2', oasis: '#f9ecc2', canyon: '#f3d6ae', temple: '#f2dcae', snow: '#fbfdff', frozen: '#fbfdff', rime: '#fbfdff', glacier: '#fbfdff', ash: '#8a7e78', ridge: '#7a7090', lavafall: '#7e6a64', caldera: '#8a6a64', high: '#e8e2cc', mtn: '#e0dcd0' };
  function paintRoad(c, f, lod) {
    if (!f._sm) { f._sm = f.pts; const mid = f.pts[Math.floor(f.pts.length / 2)]; f._col = ROAD_COL[BIOME[groundAt(mid[0], mid[1])]] || '#ead9a8'; }
    const dark = f._col === '#fbfdff' ? '#9cb4cc' : (f._col.charAt(1) < '9' && f._col.charAt(1) !== 'e' && f._col.charAt(1) !== 'd' ? '#2a2220' : '#8a6a3a');
    const main = f.name === 'road' || f.name === 'skyway' || f.name === 'pass', w = f.w, a = main ? 0.97 : f.name === 'spur' ? 0.5 : 0.62;
    const wf = (k) => (t) => (w + k) * (0.18 + 0.82 * Math.min(1, t / 0.06, (1 - t) / 0.06));
    ribW(c, f._sm, wf(main ? 9 : 6), dark, main ? 0.28 : 0.16);
    ribW(c, f._sm, wf(main ? 3 : 0), f._col, a);
    if (main && lod < 2) { c.save(); c.setLineDash([7, 15]); c.strokeStyle = rgba(dark, 0.3); c.lineWidth = 1.4; c.beginPath(); f._sm.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); c.restore(); }
  }
  function paintField(c, f) {
    const crop = { rice: ['#a6c870', '#c8e08a', '#6f9a52'], tea: ['#5f8f58', '#79a86a', '#3f6a40'], wheat: ['#e6c76a', '#f4dc8a', '#b8963a'], flower: ['#b8d890', '#e9a1a8', '#7aa660'] }[f.crop] || ['#a6c870', '#c8e08a', '#6f9a52'];
    c.save(); c.translate(f.x, f.y); c.rotate(f.rot || 0);
    soft(c, 6, 8, f.rx * 1.05, f.ry * 1.1, '#6a5a3a', 0.2);
    c.beginPath(); c.ellipse(0, 0, f.rx, f.ry, 0, 0, 7); c.clip();
    c.fillStyle = crop[0]; c.fillRect(-f.rx, -f.ry, f.rx * 2, f.ry * 2);
    for (let y = -f.ry; y < f.ry; y += f.crop === 'tea' ? 14 : 11) { const k = Math.floor((y + f.ry) / 11); c.fillStyle = k % 2 ? crop[1] : crop[2]; c.globalAlpha = f.crop === 'rice' ? 0.35 : 0.5; c.fillRect(-f.rx, y, f.rx * 2, f.crop === 'tea' ? 7 : 5.5); }
    c.globalAlpha = 1;
    if (f.crop === 'rice') for (let i = 0; i < 10; i++) soft(c, (hh(i, f.salt, 1) - 0.5) * f.rx * 1.6, (hh(i, f.salt, 2) - 0.5) * f.ry * 1.6, 22, 3, '#ffffff', 0.5);
    c.restore();
    c.save(); c.translate(f.x, f.y); c.rotate(f.rot || 0); c.strokeStyle = rgba('#6a5a3a', 0.55); c.lineWidth = 2; c.beginPath(); c.ellipse(0, 0, f.rx, f.ry, 0, 0, 7); c.stroke(); c.restore();
  }
  const CLIFF = {
    rock: ['#d4d1c6', '#9a958f', '#5f5b5c'], moss: ['#bcc89a', '#80886a', '#4a5642'], red: ['#eec096', '#c06f48', '#82402c'], ice: ['#fbfdff', '#b0d0e4', '#6f98bc'],
    ash: ['#8a7e78', '#51484a', '#2d2725'], obsidian: ['#7d74a6', '#352f50', '#1a1628'], sand: ['#f4e0b0', '#d1a771', '#a97c4a'],
  };
  function paintCliff(c, f, lod) {
    const S = CLIFF[f.style] || CLIFF.rock, sm = f._sm || (f._sm = smooth(f.pts, 4)), h = f.h, n = sm.length;
    const topP = sm, botP = sm.map((p, i) => [p[0], p[1] + h * (0.85 + 0.3 * hh(i, f.salt, 3))]);
    const b = f._b, g = c.createLinearGradient(0, b[1], 0, b[3] - 40);
    // shadow on the ground below
    brush(c, botP.map((p) => [p[0] + 3, p[1] + 5]), h * 0.7, '#1a1a22', 0.2, 2);
    const grad = c.createLinearGradient(0, Math.min(...topP.map((p) => p[1])), 0, Math.max(...botP.map((p) => p[1])));
    grad.addColorStop(0, S[0]); grad.addColorStop(0.35, S[1]); grad.addColorStop(1, S[2]);
    c.globalAlpha = 0.97; c.fillStyle = grad; c.beginPath(); topP.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); for (let i = n - 1; i >= 0; i--) c.lineTo(botP[i][0], botP[i][1]); c.closePath(); c.fill(); c.globalAlpha = 1;
    void g;
    // top ledge
    brush(c, topP.map((p) => [p[0], p[1] - 2]), 8, S[0], 0.95, 2);
    if (lod < 2) {
      c.strokeStyle = rgba(S[2], 0.5); c.lineWidth = 1.3; c.beginPath();
      for (let i = 1; i < n - 1; i += 1) { const hh2 = h * (0.45 + 0.5 * hh(i, f.salt, 4)); c.moveTo(topP[i][0], topP[i][1] + 5); c.lineTo(topP[i][0] + (hh(i, f.salt, 5) - 0.5) * 3, topP[i][1] + hh2); }
      c.stroke();
      c.strokeStyle = rgba(S[0], 0.55); c.beginPath(); for (let i = 2; i < n - 1; i += 2) { c.moveTo(topP[i][0] + 3, topP[i][1] + 6); c.lineTo(topP[i][0] + 3, topP[i][1] + h * 0.5); } c.stroke();
    }
    c.strokeStyle = rgba(INK, 0.55); c.lineWidth = 1.5; c.beginPath(); topP.forEach((p, i) => (i ? c.lineTo(p[0], p[1] - 2) : c.moveTo(p[0], p[1] - 2))); c.stroke();
    c.strokeStyle = rgba(INK, 0.3); c.lineWidth = 1.1; c.beginPath(); botP.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
  }
  function plank(c, len, w, col, edge, n) {
    c.fillStyle = col; c.fillRect(-len / 2, -w / 2, len, w);
    c.strokeStyle = rgba(edge, 0.55); c.lineWidth = 0.9; c.beginPath(); for (let i = 1; i < n; i++) { const x = -len / 2 + len * i / n; c.moveTo(x, -w / 2); c.lineTo(x, w / 2); } c.stroke();
  }
  function paintBridge(c, f, lod) {
    c.save(); c.translate(f.x, f.y); c.rotate(f.a);
    const len = f.len, w = f.w;
    const sh = (alpha) => { c.globalAlpha = alpha; c.fillStyle = '#1a2a36'; c.fillRect(-len / 2 + 3, -w / 2 + 6, len, w); c.globalAlpha = 1; };
    switch (f.style) {
      case 'stone': {
        sh(0.2); c.fillStyle = '#d6d2c4'; c.beginPath(); c.moveTo(-len / 2, -w / 2); c.quadraticCurveTo(0, -w / 2 - 8, len / 2, -w / 2); c.lineTo(len / 2, w / 2); c.quadraticCurveTo(0, w / 2 + 8, -len / 2, w / 2); c.closePath(); c.fill();
        c.strokeStyle = rgba(INK, 0.6); c.lineWidth = 1.5; c.stroke(); c.strokeStyle = rgba('#8a8678', 0.7); c.lineWidth = 3; c.beginPath(); c.moveTo(-len / 2, -w / 2 + 2); c.quadraticCurveTo(0, -w / 2 - 6, len / 2, -w / 2 + 2); c.moveTo(-len / 2, w / 2 - 2); c.quadraticCurveTo(0, w / 2 + 6, len / 2, w / 2 - 2); c.stroke();
        c.strokeStyle = rgba('#8a8678', 0.5); c.lineWidth = 0.9; c.beginPath(); for (let i = 1; i < 9; i++) { const x = -len / 2 + len * i / 9; c.moveTo(x, -w / 2); c.lineTo(x, w / 2); } c.stroke(); break;
      }
      case 'rope': {
        c.strokeStyle = rgba('#d9c28a', 0.95); c.lineWidth = 2; c.beginPath(); c.moveTo(-len / 2, -w / 2); c.quadraticCurveTo(0, -w / 2 + 8, len / 2, -w / 2); c.moveTo(-len / 2, w / 2); c.quadraticCurveTo(0, w / 2 + 8, len / 2, w / 2); c.stroke();
        sh(0.18); const n = Math.max(6, Math.round(len / 9)); c.fillStyle = '#9a7248'; for (let i = 0; i < n; i++) { const x = -len / 2 + len * (i + 0.5) / n, sag = Math.sin((i + 0.5) / n * Math.PI) * 6; c.fillRect(x - 2.6, -w / 2 + 2 + sag * 0.3, 5, w - 3); c.strokeStyle = rgba('#4a3320', 0.6); c.lineWidth = 0.7; c.strokeRect(x - 2.6, -w / 2 + 2 + sag * 0.3, 5, w - 3); }
        c.fillStyle = '#4a3320'; for (const sx of [-len / 2, len / 2]) for (const sy of [-w / 2, w / 2]) c.fillRect(sx - 2, sy - 2, 4, 4); break;
      }
      case 'ice': { sh(0.22); const g = c.createLinearGradient(0, -w / 2, 0, w / 2); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#bcd8ea'); c.fillStyle = g; c.beginPath(); c.moveTo(-len / 2, -w / 2); c.quadraticCurveTo(0, -w / 2 - 7, len / 2, -w / 2); c.lineTo(len / 2, w / 2); c.quadraticCurveTo(0, w / 2 + 7, -len / 2, w / 2); c.closePath(); c.fill(); c.strokeStyle = '#6f98bc'; c.lineWidth = 1.6; c.stroke(); c.strokeStyle = 'rgba(111,152,188,.5)'; c.lineWidth = 1; c.beginPath(); for (let i = 1; i < len / 9; i++) { c.moveTo(-len / 2 + i * 9, -w / 2 + 1); c.lineTo(-len / 2 + i * 9, w / 2 - 1); } c.stroke(); for (const sy of [-w / 2 - 3, w / 2 + 3]) { brush(c, [[-len / 2 + 4, sy], [len / 2 - 4, sy]], 3, '#e8f5fb', 0.95, 2); for (let i = 0; i <= 4; i++) { const px = -len / 2 + 4 + (len - 8) * i / 4; poly(c, [[px - 2, sy], [px, sy - 6], [px + 2, sy]], '#ffffff', 0.95); } } break; }
      case 'obsidian': { sh(0.3); const g = c.createLinearGradient(0, -w / 2, 0, w / 2); g.addColorStop(0, '#5a4f86'); g.addColorStop(1, '#241e3a'); c.fillStyle = g; c.fillRect(-len / 2, -w / 2, len, w); c.strokeStyle = '#c8c0ea'; c.lineWidth = 1.3; c.globalAlpha = 0.7; c.strokeRect(-len / 2, -w / 2, len, w); c.globalAlpha = 1; c.strokeStyle = 'rgba(200,192,234,.35)'; c.lineWidth = 1; c.beginPath(); for (let i = 1; i < len / 7; i++) { c.moveTo(-len / 2 + i * 7, -w / 2); c.lineTo(-len / 2 + i * 7, w / 2); } c.stroke(); brush(c, [[-len * 0.4, 0], [len * 0.4, -2]], 1.2, '#a89ee0', 0.6, 2); for (const sy of [-w / 2 - 2, w / 2 + 2]) brush(c, [[-len / 2, sy], [len / 2, sy]], 2.4, '#1a1628', 0.95, 2); break; }
      case 'log': { sh(0.2); for (let i = 0; i < 3; i++) { const y = -w / 2 + (i + 0.5) * w / 3; brush(c, [[-len / 2, y], [len / 2, y + (i - 1) * 1.5]], w / 3 + 1, i % 2 ? '#7a5a3a' : '#8a6a44', 0.97, 2); } c.strokeStyle = rgba(INK, 0.5); c.lineWidth = 1; c.strokeRect(-len / 2, -w / 2, len, w); break; }
      default: {
        sh(0.2); plank(c, len, w, '#b88a58', '#5a3d22', Math.max(6, Math.round(len / 7)));
        c.strokeStyle = rgba(INK, 0.7); c.lineWidth = 1.6; c.strokeRect(-len / 2, -w / 2, len, w);
        c.fillStyle = '#4a3320'; for (let i = 0; i <= 4; i++) for (const sy of [-w / 2 - 1.2, w / 2 + 1.2]) c.fillRect(-len / 2 + len * i / 4 - 1.3, sy - 1.3, 2.6, 2.6);
      }
    }
    c.restore();
  }
  function paintFord(c, f) {
    c.save(); c.translate(f.x, f.y); c.rotate(f.a);
    const n = Math.max(5, Math.round(f.len / 16));
    for (let i = 0; i < n; i++) {
      const x = -f.len / 2 + f.len * (i + 0.5) / n, y = (i % 2 ? 6 : -6) + (hh(i, f.salt, 9) - 0.5) * 8;
      line(c, x - 9, y + 5, x + 9, y + 5, 1.2, '#ffffff', 0.6, 0);
      ell(c, x, y, 7.5, 5, '#9a978e', 0.97); ell(c, x - 1.5, y - 1.2, 5, 3, '#cfccc0', 0.8); outline(c, [[x - 7, y + 1], [x + 7, y + 1]], INK, 0.7, 0.4);
    }
    c.restore();
  }
  function paintReef(c, f) {
    const cols = ['#e9877f', '#f0b26a', '#d86f93', '#b78ad0'];
    for (let i = 0; i < 46; i++) {
      const a = hh(i, f.salt, 21) * 6.283, d = Math.sqrt(hh(i, f.salt, 22)) * 0.95, x = f.x + Math.cos(a) * f.rx * d, y = f.y + Math.sin(a) * f.ry * d, col = cols[i % 4], s = 6 + hh(i, f.salt, 23) * 8;
      c.strokeStyle = rgba(col, 0.88); c.lineWidth = 2; c.lineCap = 'round';
      for (const d2 of [-3, 0, 3]) { c.beginPath(); c.moveTo(x + d2, y); c.quadraticCurveTo(x + d2 * 1.8, y - s * 0.6, x + d2 * 2.4, y - s); c.stroke(); dot(c, x + d2 * 2.4, y - s, 1.4, col, 0.95); }
    }
    c.lineCap = 'butt';
  }
  function paintJetty(c, f) {
    c.save(); c.translate(f.x, f.y); c.rotate(f.a - Math.PI / 2);
    c.fillStyle = rgba('#b88a58', 0.97); c.fillRect(-9, 0, 18, 120); c.strokeStyle = rgba('#5a3d22', 0.6); c.lineWidth = 0.9;
    for (let k = 3; k < 120; k += 5) { c.beginPath(); c.moveTo(-9, k); c.lineTo(9, k); c.stroke(); }
    c.strokeStyle = rgba(INK, 0.65); c.lineWidth = 1.3; c.strokeRect(-9, 0, 18, 120);
    for (const k of [2, 40, 80, 118]) for (const sx of [-10, 10]) { c.fillStyle = '#4a3320'; c.fillRect(sx - 1.6, k - 1.6, 3.2, 3.2); }
    c.restore();
  }
  function paintIslet(c, f) {
    ell(c, f.x, f.y + 4, f.r * 1.5, f.r * 1.0, '#fbf3d6', 0.95); ell(c, f.x, f.y, f.r * 1.3, f.r * 0.85, '#a2c88a', 0.97); ell(c, f.x - 6, f.y - 4, f.r * 0.8, f.r * 0.5, '#c4e0a0', 0.8);
    c.strokeStyle = rgba(INK, 0.4); c.lineWidth = 1.2; c.beginPath(); c.ellipse(f.x, f.y, f.r * 1.3, f.r * 0.85, 0, 0, 7); c.stroke();
  }

  // ================================================================================================
  //  Feature painters (objects, sorted by y with the scattered decoration)
  // ================================================================================================
  function drawRuin(c, x, y, o) {
    const s = o.s, k = o.kind;
    soft(c, x + 4 * s, y + 2, 34 * s, 8 * s, '#3a3020', 0.25);
    const stone = '#d9d2bc', shade = '#a9a28a';
    const col = (cx, h, w) => { brush(c, [[cx, y], [cx, y - h]], w, stone, 0.97, 2); brush(c, [[cx + w * 0.3, y], [cx + w * 0.3, y - h]], w * 0.35, shade, 0.5, 2); poly(c, [[cx - w * 0.75, y - h], [cx + w * 0.75, y - h], [cx + w * 0.55, y - h - 3], [cx - w * 0.55, y - h - 3]], '#c4bda6', 0.97); };
    if (k === 'columns') { for (let i = 0; i < 4; i++) col(x - 30 * s + i * 20 * s, (22 - (i % 2) * 8 - (i === 2 ? 10 : 0)) * s, 6 * s); poly(c, [[x + 6 * s, y + 4], [x + 28 * s, y + 3], [x + 29 * s, y - 3 * s], [x + 7 * s, y - 2 * s]], stone, 0.97); outline(c, [[x + 6 * s, y + 4], [x + 28 * s, y + 3], [x + 29 * s, y - 3 * s], [x + 7 * s, y - 2 * s]], INK, 0.8, 0.5, true); }
    else if (k === 'wall') { for (let i = 0; i < 4; i++) { const bx = x - 40 * s + i * 22 * s, h = (14 + ((i * 7) % 3) * 8) * s; poly(c, [[bx, y], [bx, y - h], [bx + 10 * s, y - h - 3 * s], [bx + 20 * s, y - h + 2 * s], [bx + 20 * s, y]], stone, 0.97); poly(c, [[bx + 10 * s, y - h - 3 * s], [bx + 20 * s, y - h + 2 * s], [bx + 20 * s, y], [bx + 12 * s, y]], shade, 0.5); outline(c, [[bx, y], [bx, y - h], [bx + 10 * s, y - h - 3 * s], [bx + 20 * s, y - h + 2 * s], [bx + 20 * s, y]], INK, 0.9, 0.5); } }
    else if (k === 'gate') { col(x - 26 * s, 42 * s, 7 * s); col(x + 26 * s, 30 * s, 7 * s); brush(c, [[x - 32 * s, y - 40 * s], [x - 4 * s, y - 38 * s]], 6 * s, stone, 0.97, 2); brush(c, [[x + 4 * s, y - 30 * s], [x + 30 * s, y - 26 * s]], 5 * s, '#c4bda6', 0.9, 2); for (let i = 0; i < 5; i++) tf(c, x - 28 * s + i * 14 * s, y, 5, '#5f8a48', 0.7); torii(c, x, y + 2, 10 * s); }
    else if (k === 'hall') { poly(c, [[x - 36 * s, y + 4], [x + 36 * s, y + 4], [x + 30 * s, y - 14 * s], [x - 30 * s, y - 14 * s]], '#cfc7ad', 0.97); outline(c, [[x - 36 * s, y + 4], [x + 36 * s, y + 4], [x + 30 * s, y - 14 * s], [x - 30 * s, y - 14 * s]], INK, 1, 0.55, true); for (let i = 0; i < 4; i++) col(x - 27 * s + i * 18 * s, (24 - (i % 3) * 7) * s, 5 * s); brush(c, [[x - 24 * s, y - 28 * s], [x - 2 * s, y - 24 * s]], 4 * s, '#7a5a3a', 0.9, 2); }
    else if (k === 'statue') { poly(c, [[x - 14 * s, y], [x - 14 * s, y - 8 * s], [x + 16 * s, y - 8 * s], [x + 16 * s, y]], stone, 0.97); poly(c, [[x - 10 * s, y - 8 * s], [x - 12 * s, y - 20 * s], [x - 2 * s, y - 26 * s], [x + 10 * s, y - 20 * s], [x + 12 * s, y - 8 * s]], '#e8dcb8', 0.97); ell(c, x - 3 * s, y - 29 * s, 5 * s, 5.5 * s, '#e8dcb8', 0.97); outline(c, [[x - 10 * s, y - 8 * s], [x - 12 * s, y - 20 * s], [x - 2 * s, y - 26 * s], [x + 10 * s, y - 20 * s], [x + 12 * s, y - 8 * s]], INK, 0.9, 0.55); dot(c, x - 4 * s, y - 29 * s, 0.9, INK, 0.7); }
    else if (k === 'obelisk') { poly(c, [[x - 7 * s, y], [x - 5 * s, y - 48 * s], [x, y - 56 * s], [x + 5 * s, y - 48 * s], [x + 7 * s, y]], '#e8d6a8', 0.98); poly(c, [[x, y - 56 * s], [x + 5 * s, y - 48 * s], [x + 7 * s, y], [x + 1 * s, y]], '#b88a58', 0.6); outline(c, [[x - 7 * s, y], [x - 5 * s, y - 48 * s], [x, y - 56 * s], [x + 5 * s, y - 48 * s], [x + 7 * s, y]], INK, 1, 0.6, true); for (let i = 0; i < 6; i++) line(c, x - 3, y - 8 * s - i * 6 * s, x + 2, y - 8 * s - i * 6 * s, 1, '#8a6a3a', 0.6, 0); poly(c, [[x, y - 56 * s], [x - 2.4 * s, y - 52 * s], [x + 2.4 * s, y - 52 * s]], '#f6cf4a', 0.98); }
    else if (k === 'tower') { poly(c, [[x - 16 * s, y], [x - 14 * s, y - 56 * s], [x - 6 * s, y - 62 * s], [x + 2 * s, y - 54 * s], [x + 10 * s, y - 64 * s], [x + 15 * s, y - 56 * s], [x + 16 * s, y]], '#cfc7ad', 0.98); poly(c, [[x + 4 * s, y], [x + 6 * s, y - 56 * s], [x + 15 * s, y - 56 * s], [x + 16 * s, y]], '#8a8268', 0.45); outline(c, [[x - 16 * s, y], [x - 14 * s, y - 56 * s], [x - 6 * s, y - 62 * s], [x + 2 * s, y - 54 * s], [x + 10 * s, y - 64 * s], [x + 15 * s, y - 56 * s], [x + 16 * s, y]], INK, 1.1, 0.6); c.fillStyle = '#2a1a10'; c.beginPath(); c.moveTo(x - 4 * s, y); c.lineTo(x - 4 * s, y - 10 * s); c.arc(x, y - 10 * s, 4 * s, Math.PI, 0); c.lineTo(x + 4 * s, y); c.fill(); for (let i = 0; i < 3; i++) tf(c, x - 12 * s + i * 12 * s, y - 56 * s, 6, '#5f8a48', 0.7); }
    else if (k === 'village') { for (const [dx, dy, ss] of [[-34, 0, 1], [6, 8, 1.1], [38, -4, 0.9]]) hut(c, x + dx * s, y + dy * s, ss * s, '#c9a870'); }
    else if (k === 'nomad') { for (const [dx, dy, ss, col] of [[-26, 0, 1, '#f3e7c8'], [22, 6, 0.9, '#e8c890']]) { const X = x + dx * s, Y = y + dy * s, q = ss * s; poly(c, [[X - 20 * q, Y], [X, Y - 34 * q], [X + 20 * q, Y]], col, 0.98); poly(c, [[X, Y - 34 * q], [X + 20 * q, Y], [X + 6 * q, Y]], '#8a6a3a', 0.4); outline(c, [[X - 20 * q, Y], [X, Y - 34 * q], [X + 20 * q, Y]], INK, 1.1, 0.65, true); c.fillStyle = '#4a3320'; c.beginPath(); c.moveTo(X - 4 * q, Y); c.lineTo(X, Y - 12 * q); c.lineTo(X + 4 * q, Y); c.fill(); brush(c, [[X, Y - 34 * q], [X, Y - 42 * q]], 1.6, '#4a3a2e', 0.9, 2); poly(c, [[X, Y - 42 * q], [X + 9 * q, Y - 40 * q], [X, Y - 37 * q]], VERM, 0.95); } ell(c, x, y + 12 * s, 6 * s, 3 * s, '#6a5a46', 0.8); }
    else hut(c, x, y, s, '#c9a870');
  }
  function hut(c, x, y, s, wall) {
    soft(c, x + 3 * s, y + 1, 20 * s, 5 * s, '#3a3020', 0.25);
    poly(c, [[x - 15 * s, y], [x - 15 * s, y - 14 * s], [x + 15 * s, y - 14 * s], [x + 15 * s, y]], wall, 0.98); poly(c, [[x + 4 * s, y], [x + 4 * s, y - 14 * s], [x + 15 * s, y - 14 * s], [x + 15 * s, y]], '#6a4a2a', 0.3);
    poly(c, [[x - 20 * s, y - 12 * s], [x, y - 30 * s], [x + 20 * s, y - 12 * s]], '#7a5a3a', 0.98); poly(c, [[x, y - 30 * s], [x + 20 * s, y - 12 * s], [x + 6 * s, y - 12 * s]], '#4a3320', 0.4);
    outline(c, [[x - 20 * s, y - 12 * s], [x, y - 30 * s], [x + 20 * s, y - 12 * s]], INK, 1.1, 0.65, true); outline(c, [[x - 15 * s, y], [x - 15 * s, y - 12 * s], [x + 15 * s, y - 12 * s], [x + 15 * s, y]], INK, 1, 0.55);
    c.fillStyle = '#3a2a1a'; c.fillRect(x - 3 * s, y - 9 * s, 6 * s, 9 * s);
  }
  function drawShrineF(c, x, y, o) {
    const s = o.s;
    soft(c, x, y + 2, 40 * s, 9 * s, '#3a3020', 0.2);
    // stepping stones, the little hokora, lanterns and the gate in front
    for (let i = 0; i < 4; i++) ell(c, x + (i % 2 ? 3 : -3), y + 14 * s - i * 4.5 * s, 5 * s, 2.6 * s, '#cfccc0', 0.95);
    poly(c, [[x - 12 * s, y - 2], [x - 12 * s, y - 18 * s], [x + 12 * s, y - 18 * s], [x + 12 * s, y - 2]], '#f1e6c8', 0.98); poly(c, [[x + 3 * s, y - 2], [x + 3 * s, y - 18 * s], [x + 12 * s, y - 18 * s], [x + 12 * s, y - 2]], '#8a6a3a', 0.25);
    poly(c, [[x - 17 * s, y - 16 * s], [x, y - 32 * s], [x + 17 * s, y - 16 * s]], '#6a4a30', 0.98); outline(c, [[x - 17 * s, y - 16 * s], [x, y - 32 * s], [x + 17 * s, y - 16 * s]], INK, 1.1, 0.65, true);
    c.fillStyle = '#3a2a1a'; c.fillRect(x - 3.5 * s, y - 14 * s, 7 * s, 12 * s);
    stoneLantern(c, x - 26 * s, y + 8 * s, 12 * s); stoneLantern(c, x + 26 * s, y + 8 * s, 12 * s);
    torii(c, x, y + 26 * s, 34 * s);
  }
  function menhir(c, X, Y, w, h) {
    soft(c, X + 3, Y + 1, w * 1.4, 2.6, '#2a2a2a', 0.22);
    c.fillStyle = '#a3a9ad'; c.beginPath(); c.moveTo(X - w, Y); c.quadraticCurveTo(X - w * 1.15, Y - h * 0.8, X - w * 0.2, Y - h); c.quadraticCurveTo(X + w * 1.1, Y - h * 0.85, X + w, Y); c.closePath(); c.fill();
    c.fillStyle = 'rgba(60,70,84,.38)'; c.beginPath(); c.moveTo(X + w * 0.15, Y - h * 0.98); c.quadraticCurveTo(X + w * 1.1, Y - h * 0.85, X + w, Y); c.lineTo(X + w * 0.2, Y); c.closePath(); c.fill();
    c.strokeStyle = rgba(INK, 0.55); c.lineWidth = 0.9; c.beginPath(); c.moveTo(X - w, Y); c.quadraticCurveTo(X - w * 1.15, Y - h * 0.8, X - w * 0.2, Y - h); c.quadraticCurveTo(X + w * 1.1, Y - h * 0.85, X + w, Y); c.stroke();
    soft(c, X - w * 0.2, Y - 1, w * 1.1, 2.6, '#7fa05a', 0.75); soft(c, X - w * 0.3, Y - h * 0.55, w * 0.5, 2, '#8fb070', 0.55);
  }
  function drawStones(c, x, y, o) {
    const n = o.n, r = o.r;
    for (let i = 0; i < n; i++) { const a = i / n * 6.283 + 0.4; if (Math.sin(a) < 0) continue; menhir(c, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6, 4.5 + hh(i, o.salt, 32) * 2.5, 14 + hh(i, o.salt, 31) * 10); }
  }
  function drawStonesBack(c, x, y, o) {
    const n = o.n, r = o.r;
    ell(c, x, y, r * 0.8, r * 0.45, '#cfccc0', 0.2);
    for (let i = 0; i < n; i++) { const a = i / n * 6.283 + 0.4; if (Math.sin(a) >= 0) continue; menhir(c, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6, 4.5 + hh(i, o.salt, 32) * 2.5, 14 + hh(i, o.salt, 31) * 10); }
  }
  function drawMesa(c, x, y, o) {
    const f = o.f, rx = f.rx, ry = f.ry, h = f.h, sd = f.salt, n = 30;
    const rad = (i) => 0.94 + 0.1 * hh(i % n, sd, 41) + 0.05 * Math.sin(i * 0.9 + sd);
    soft(c, x + 14, y + ry * 0.55, rx * 1.35, ry * 0.8, '#4a2a1a', 0.3);
    // body: front wall between the base arc and the rim arc, with jagged terraces
    const rim = [], base = [];
    for (let i = 0; i <= n / 2; i++) { const a = i / (n / 2) * Math.PI, r = rad(i); rim.push([x + Math.cos(a) * rx * 0.94 * r, y - h + Math.sin(a) * ry * 0.9 * r]); base.push([x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r]); }
    const g = c.createLinearGradient(x - rx, 0, x + rx, 0); g.addColorStop(0, '#f2bb8a'); g.addColorStop(0.5, '#d27a4e'); g.addColorStop(1, '#8e432b');
    c.fillStyle = g; c.beginPath(); c.moveTo(x + rx * 0.94 * rad(0), y - h); c.lineTo(x + rx * rad(0), y);
    for (let i = 0; i < base.length; i++) c.lineTo(base[i][0], base[i][1]);
    c.lineTo(rim[rim.length - 1][0], rim[rim.length - 1][1]);
    for (let i = rim.length - 1; i >= 0; i--) c.lineTo(rim[i][0], rim[i][1]);
    c.closePath(); c.fill();
    // strata and vertical weathering streaks
    c.save(); c.clip();
    for (let k = 1; k < 8; k++) { const t = k / 8; c.strokeStyle = rgba(k % 2 ? '#8e432b' : '#f4c9a0', 0.38); c.lineWidth = 1.2 + (k % 3) * 0.9; c.beginPath(); for (let i = 0; i <= n / 2; i++) { const a = i / (n / 2) * Math.PI, r = rad(i), px = x + Math.cos(a) * rx * (0.94 + 0.06 * t) * r, py = y - h * (1 - t) + Math.sin(a) * ry * (0.9 + 0.1 * t) * r; if (i) c.lineTo(px, py); else c.moveTo(px, py); } c.stroke(); }
    c.strokeStyle = rgba('#5a2412', 0.3); c.lineWidth = 1.3; c.beginPath(); for (let i = 1; i < n / 2; i++) { const px = rim[i][0], py = rim[i][1]; c.moveTo(px, py + 3); c.lineTo(px + (hh(i, sd, 5) - 0.5) * 6, py + h * (0.5 + 0.5 * hh(i, sd, 6)) + 4); } c.stroke();
    soft(c, x + rx * 0.6, y - h * 0.4, rx * 0.5, h * 0.7, '#4a1c10', 0.28);
    c.restore();
    // the flat top with a lighter sandstone cap
    c.beginPath(); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, r = rad(i); const px = x + Math.cos(a) * rx * 0.94 * r, py = y - h + Math.sin(a) * ry * 0.9 * r; if (i) c.lineTo(px, py); else c.moveTo(px, py); } c.closePath();
    c.fillStyle = '#f4d3a8'; c.fill(); c.save(); c.clip(); soft(c, x - rx * 0.2, y - h - ry * 0.2, rx * 0.8, ry * 0.6, '#fbe8cc', 0.9); soft(c, x + rx * 0.4, y - h + ry * 0.3, rx * 0.5, ry * 0.4, '#d9a070', 0.5); c.restore();
    c.strokeStyle = rgba(INK, 0.55); c.lineWidth = 1.5; c.stroke();
    outline(c, base.map((p) => [p[0], p[1]]), INK, 1.2, 0.45); outline(c, [[x - rx * rad(0) * 0.0 + rx * rad(0), y], [x + rx * 0.94 * rad(0), y - h]], INK, 1.3, 0.55);
    outline(c, [[x - rx * rad(n / 2), y], [x - rx * 0.94 * rad(n / 2), y - h]], INK, 1.3, 0.55);
    for (let i = 0; i < 3; i++) tf(c, x - rx * 0.4 + i * rx * 0.35, y - h + ry * 0.1, 5, '#8a7a3a', 0.7);
    soft(c, x, y + ry * 0.55, rx * 1.1, 9, '#f0d49a', 0.9);
  }
  function drawTorii(c, x, y, o) { soft(c, x, y + 2, 30 * o.s, 5, '#3a3020', 0.2); torii(c, x, y, 40 * o.s); }
  function drawLanterns(c, x, y, o) { stoneLantern(c, x, y, 12); }
  function drawBoat(c, x, y, o) { sailboat(c, x, y, o.s, !!o.fl); }
  function drawFloe(c, x, y, o) { floe(c, x, y, o.s); }
  function drawStack(c, x, y, o) { const s = o.s; soft(c, x + 4, y + 1, s * 1.2, s * 0.3, '#2a2a2a', 0.25); poly(c, [[x - s * 0.8, y], [x - s * 0.5, y - s * 2.6], [x - s * 0.1, y - s * 3], [x + s * 0.4, y - s * 2.2], [x + s * 0.9, y]], '#59606c', 0.95); poly(c, [[x - s * 0.1, y - s * 3], [x + s * 0.4, y - s * 2.2], [x + s * 0.9, y], [x + s * 0.1, y]], '#2e333c', 0.45); outline(c, [[x - s * 0.8, y], [x - s * 0.5, y - s * 2.6], [x - s * 0.1, y - s * 3], [x + s * 0.4, y - s * 2.2], [x + s * 0.9, y]], INK, 1, 0.55); line(c, x - s * 1.2, y + 2, x + s * 1.2, y + 3, 1.6, '#ffffff', 0.85, 2); }
  function drawBerg(c, x, y, o) { const s = o.s; soft(c, x + 6, y + 3, 60 * s, 14 * s, '#5d86ab', 0.28); const pts = [[x - 44 * s, y], [x - 36 * s, y - 20 * s], [x - 20 * s, y - 34 * s], [x - 4 * s, y - 56 * s], [x + 12 * s, y - 38 * s], [x + 30 * s, y - 28 * s], [x + 46 * s, y]]; poly(c, pts, '#f4fafc', 0.96); poly(c, [[x - 4 * s, y - 56 * s], [x + 12 * s, y - 38 * s], [x + 30 * s, y - 28 * s], [x + 46 * s, y], [x + 4 * s, y]], '#9cc2dc', 0.6); outline(c, pts, '#6f98bc', 1.3, 0.7, true); soft(c, x, y + 1, 54 * s, 6 * s, '#ffffff', 0.9); }
  function drawLavaRock(c, x, y, o) { rock(c, x, y, o.s, '#3a3a40', '#7a7a84'); soft(c, x, y - o.s * 1.4, o.s * 1.2, o.s * 0.9, '#8a7d78', 0.3); }
  function drawShell(c, x, y, o) { for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#eaa8a0' : '#d8c08a'; c.globalAlpha = 0.85; c.beginPath(); c.ellipse(x + (i - 2) * 9, y + (i % 3) * 3, 2.4, 1.6, i, 0, 7); c.fill(); } c.globalAlpha = 1; }
  function drawGroveTree(c, x, y, o) { TREES[o.t](c, x, y, o, o.k); }
  function drawPeak(c, x, y, o) {
    const C = RIDGE_COL[o.style] || RIDGE_COL.rock, t = o.q;
    mpk(c, x, y, o.s, mixh(C[0], C[1], t), mixh(C[2], C[3], t), C[4], o.r < C[5], t);
  }
  const LM_DRAW = (c, x, y, o) => { const L = o.L, fn = LANDMARKS[L.kind]; if (!fn) return; c.save(); c.translate(L.x, L.y); c.scale(L.k, L.k); fn(c, L); c.restore(); inkLabel(c, L.label, L.x, L.y + L.ry + 54, o.lod ? 40 : 17, 0.62); };
  const CAMP_DRAW = (c) => paintCamp(c);

  // ================================================================================================
  //  The tile painter: paints the world rectangle [X0,X1]x[Y0,Y1] (c already has the world transform)
  // ================================================================================================
  let deadline = 0;
  const tick = () => performance.now() > deadline;
  const seaTint = (x, y) => {
    if (x > 2000 && x < 4050 && y > 3900 && y < 5700) return ['#9fc8c8', '#d3e6e0'];     // the misty inland sea
    if (y < 1000) return ['#c4dce8', '#e8f2f6'];                                           // icy north
    if (x > 9300 && y < 2600) return ['#8d93a8', '#aeb4c4'];                              // sooty ember sea
    if (x < 2600 && y > 3400) return ['#78c8cc', '#b4e4de'];                              // turquoise coast
    if (x > 8000 && y > 7500) return ['#9ccdc0', '#cfe4cc'];                              // gold-green shallows
    if (y > 9000) return ['#4f86ac', '#7fa5b6'];
    return ['#7fa5b6', '#d7e6e2'];
  };
  function paintSea(c, X0, Y0, X1, Y1, lod) {
    const CS = lod ? 240 : 150;
    for (let y = Math.floor((Y0 - 120) / CS) * CS; y < Y1 + 120; y += CS) for (let x = Math.floor((X0 - 120) / CS) * CS; x < X1 + 120; x += CS) {
      const ix = Math.round(x / CS), iy = Math.round(y / CS);
      const px = x + hh(ix, iy, 1) * CS, py = y + hh(ix, iy, 2) * CS, tn = seaTint(px, py);
      soft(c, px, py, CS * 1.1 + hh(ix, iy, 3) * CS, CS * 0.7 + hh(ix, iy, 4) * CS * 0.5, hh(ix, iy, 5) > 0.5 ? tn[0] : tn[1], 0.32 + hh(ix, iy, 6) * 0.2);
    }
    if (lod) return;
    c.lineCap = 'round';
    const st = 120;
    for (let j = Math.floor((Y0 - 20) / st); j * st < Y1 + 20; j++) for (let i = Math.floor((X0 - 20) / st); i * st < X1 + 20; i++) {
      if (hh(i, j, 7) > 0.42) continue;
      const x = (i + hh(i, j, 8)) * st, y = (j + hh(i, j, 9)) * st; if (groundAt(x, y) !== 0 && GR.land[cellAt(x, y)]) continue;
      c.strokeStyle = rgba('#3d5a80', 0.33); c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - 10, y + 2); c.quadraticCurveTo(x - 4, y - 7, x + 3, y - 2); c.quadraticCurveTo(x + 7, y + 1, x + 5, y - 3); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(x - 14, y + 5); c.lineTo(x + 12, y + 5); c.stroke();
    }
    c.lineCap = 'butt';
  }
  function paintLandBase(c, X0, Y0, X1, Y1, lod) {
    c.lineJoin = 'round';
    c.strokeStyle = rgba('#fffaf0', 0.8); c.lineWidth = 36; c.stroke(LAND);
    c.strokeStyle = rgba('#efe4c4', 0.85); c.lineWidth = 22; c.stroke(LAND);
    c.strokeStyle = rgba(INK, 0.3); c.lineWidth = 3; c.stroke(LAND);
    c.fillStyle = LANDBASE; c.fill(LAND);
    c.save(); c.clip(LAND);
    const CS = lod ? 80 : 40;
    for (let y = Math.floor((Y0 - 80) / CS) * CS; y < Y1 + 80; y += CS) for (let x = Math.floor((X0 - 80) / CS) * CS; x < X1 + 80; x += CS) {
      const ix = Math.round(x / CS), iy = Math.round(y / CS), b = groundAt(x + CS / 2, y + CS / 2); if (!b) continue;
      const pal = PALI[b]; if (!pal) continue;
      const px = x + CS / 2 + (hh(ix, iy, 1) - 0.5) * CS * 0.8, py = y + CS / 2 + (hh(ix, iy, 2) - 0.5) * CS * 0.8;
      soft(c, px, py, CS * 1.55 + hh(ix, iy, 3) * CS * 0.7, CS * 1.2 + hh(ix, iy, 4) * CS * 0.5, pal.base, b === BIO.coral ? 0.8 : 0.66);
      if (hh(ix, iy, 5) > 0.3) soft(c, x + hh(ix, iy, 6) * CS, y + hh(ix, iy, 7) * CS, CS * (0.6 + hh(ix, iy, 8) * 1.5), CS * (0.4 + hh(ix, iy, 9) * 0.9), hh(ix, iy, 10) > 0.5 ? pal.mid : pal.dark, 0.18 + hh(ix, iy, 11) * 0.3);
      if (!lod && hh(ix, iy, 12) > 0.86) { const br = 14 + hh(ix, iy, 13) * 28; c.strokeStyle = rgba(pal.dark, 0.14); c.lineWidth = 2.5; c.beginPath(); c.ellipse(px, py, br, br * 0.7, hh(ix, iy, 14) * 3, 0, 7); c.stroke(); c.fillStyle = rgba(pal.mid, 0.12); c.fill(); }
    }
    c.restore();
  }
  // Stage 1: painted into the tile in order. Returns nothing; yields when the frame budget is used.
  function* paintRegion(c, X0, Y0, X1, Y1, lod) {
    const ls = lod ? 2.2 : 1, M = 140;
    c.fillStyle = SEA; c.fillRect(X0 - 2, Y0 - 2, X1 - X0 + 4, Y1 - Y0 + 4);
    paintSea(c, X0, Y0, X1, Y1, lod);
    if (tick()) yield;
    paintLandBase(c, X0, Y0, X1, Y1, lod);
    if (tick()) yield;
    const feats = featuresIn(X0 - 20, Y0 - 20, X1 + 20, Y1 + 20);
    const kinds = {}; for (const f of feats) (kinds[f.k] = kinds[f.k] || []).push(f);
    const each = (k, fn) => { for (const f of (kinds[k] || [])) fn(c, f, lod); };
    each('lake', paintLake); each('islet', paintIslet); each('river', paintRiver); each('road', paintRoad); each('field', paintField); each('reef', paintReef);
    if (tick()) yield;
    for (const n of CORAL_NODES) if (n.x > X0 - 80 && n.x < X1 + 80 && n.y > Y0 - 60 && n.y < Y1 + 60) {   // sand islets under the monsters standing in the shallows
      const k = n.type === 'boss' ? 1.5 : n.type === 'elite' ? 1.25 : 1;
      ell(c, n.x, n.y + 2, 62 * k, 26 * k, '#ffffff', 0.7); ell(c, n.x, n.y + 2, 54 * k, 21 * k, '#f2e3b8', 0.97); soft(c, n.x - 8, n.y - 2, 36 * k, 14 * k, '#fbf1d2', 0.8); soft(c, n.x + 14, n.y + 8, 30 * k, 10 * k, '#e0c28e', 0.5);
    }
    each('cliff', paintCliff); each('ford', paintFord); each('bridge', paintBridge); each('jetty', paintJetty);
    if (tick()) yield;
    // ---- objects: scattered decoration, grove trees, peaks, buildings, landmarks ----
    const objs = [];
    const biomesHere = new Set();
    for (let y = Y0 - 60; y < Y1 + 60; y += 60) for (let x = X0 - 60; x < X1 + 60; x += 60) biomesHere.add(groundAt(x, y));
    for (const Ly of LAYERS) {
      if (lod && !Ly.big) continue;
      let any = false; for (const id of Ly.ids) if (biomesHere.has(id)) { any = true; break; }
      if (!any) continue;
      const st = lod ? Ly.step * 2.4 : Ly.step, i0 = Math.floor((X0 - 40) / st), i1 = Math.floor((X1 + 40) / st), j0 = Math.floor((Y0 - 40) / st), j1 = Math.floor((Y1 + 60) / st);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        if (hh(i, j, Ly.salt) >= Ly.prob * (lod ? 0.9 : 1)) continue;
        const x = (i + hh(i, j, Ly.salt + 1)) * st, y = (j + hh(i, j, Ly.salt + 2)) * st;
        if (Ly.ids.indexOf(groundAt(x, y)) < 0 || !free(x, y)) continue;
        objs.push({ y, x, r: hh(i, j, Ly.salt + 3), q: hh(i, j, Ly.salt + 4), k: ls, fn: Ly.draw });
      }
      if (objs.length > 6000) break;
    }
    if (tick()) yield;
    for (const f of (kinds.grove || [])) {
      const dens = f.dens, st = (lod ? 60 : 34) / Math.sqrt(dens), i0 = Math.floor((Math.max(X0, f.x - f.rx) - 20) / st), i1 = Math.floor((Math.min(X1, f.x + f.rx) + 20) / st), j0 = Math.floor((Math.max(Y0, f.y - f.ry) - 20) / st), j1 = Math.floor((Math.min(Y1 + 60, f.y + f.ry) + 20) / st);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const x = (i + hh(i, j, f.salt)) * st, y = (j + hh(i, j, f.salt + 1)) * st, u = (x - f.x) / f.rx, v = (y - f.y) / f.ry, d = u * u + v * v;
        if (d > 1 || hh(i, j, f.salt + 2) > Math.min(1, 1.35 - d)) continue;
        if (!freeLoose(x, y) || exR[cellAt(x, y)]) continue;
        objs.push({ y, x, r: hh(i, j, f.salt + 3), q: hh(i, j, f.salt + 4), k: lod ? 2.2 : 0.9 + hh(i, j, f.salt + 5) * 0.4, t: f.tree, fn: drawGroveTree });
      }
    }
    for (const f of (kinds.ridge || [])) for (const p of f.peaks) { if (p[0] < X0 - 120 || p[0] > X1 + 120 || p[1] < Y0 - 40 || p[1] > Y1 + 220) continue; objs.push({ y: p[1], x: p[0], s: p[2], r: p[3], q: p[4], style: f.style, fn: drawPeak }); }
    for (const f of (kinds.mesa || [])) objs.push({ y: f.y, x: f.x, f, fn: drawMesa });
    for (const f of (kinds.ruin || [])) objs.push({ y: f.y, x: f.x, s: f.s, kind: f.kind, fn: drawRuin });
    for (const f of (kinds.shrine || [])) objs.push({ y: f.y, x: f.x, s: f.s, fn: drawShrineF });
    for (const f of (kinds.torii || [])) objs.push({ y: f.y, x: f.x, s: f.s, fn: drawTorii });
    for (const f of (kinds.stones || [])) { objs.push({ y: f.y - 1, x: f.x, n: f.n, r: f.r, salt: f.salt, fn: drawStonesBack }); objs.push({ y: f.y + 1, x: f.x, n: f.n, r: f.r, salt: f.salt, fn: drawStones }); }
    for (const f of (kinds.lanterns || [])) { const p = f.pts; for (let i = 0; i < f.n; i++) { const t = (i + 0.5) / f.n, seg = p.length - 1, k = Math.min(seg - 1, Math.floor(t * seg)), tt = t * seg - k; for (const side of [-1, 1]) objs.push({ y: p[k][1] + (p[k + 1][1] - p[k][1]) * tt, x: p[k][0] + (p[k + 1][0] - p[k][0]) * tt + side * 22, fn: drawLanterns }); } }
    for (const f of (kinds.boat || [])) objs.push({ y: f.y, x: f.x, s: f.s, fl: f.f, fn: drawBoat });
    for (const f of (kinds.floe || [])) objs.push({ y: f.y, x: f.x, s: f.s, fn: drawFloe });
    for (const f of (kinds.stack || [])) objs.push({ y: f.y, x: f.x, s: f.s, fn: drawStack });
    for (const f of (kinds.berg || [])) objs.push({ y: f.y, x: f.x, s: f.s, fn: drawBerg });
    for (const f of (kinds.lavarock || [])) objs.push({ y: f.y, x: f.x, s: f.s, fn: drawLavaRock });
    for (const f of (kinds.shell || [])) objs.push({ y: f.y, x: f.x, fn: drawShell });
    for (const id of SUBIDS) { const L = LMS[id]; if (L.x + L.rx * 3.2 > X0 && L.x - L.rx * 3.2 < X1 && L.y + L.rx * 1.6 > Y0 && L.y - L.rx * 3.6 < Y1) objs.push({ y: L.y + L.ry * 0.7, x: L.x, L, lod, fn: LM_DRAW }); }
    { const cp = World.CAMP; if (cp.x + 150 > X0 && cp.x - 150 < X1 && cp.y + 60 > Y0 && cp.y - 80 < Y1) objs.push({ y: cp.y + 4, x: cp.x, fn: CAMP_DRAW }); }
    objs.sort((a, b) => a.y - b.y);
    for (let i = 0; i < objs.length; i++) {
      const o = objs[i];
      if (o.x < X0 - 260 || o.x > X1 + 260) { if (o.fn !== LM_DRAW) continue; }
      o.fn(c, o.x, o.y, o);
      if ((i & 31) === 31 && tick()) yield;
    }
    // ---- soft mist drifting along the foot of the mountains and the massif, then the paper grain ----
    if (!lod) {
      for (let y = Math.floor(Y0 / 180) * 180; y < Y1; y += 180) for (let x = Math.floor(X0 / 180) * 180; x < X1; x += 180) {
        const ix = x / 180, iy = y / 180, b = groundAt(x + 90, y + 90);
        if ((b === BIO.mtn || b === BIO.high) && hh(ix, iy, 3) > 0.55) soft(c, x + hh(ix, iy, 4) * 180, y + hh(ix, iy, 5) * 180, 90 + hh(ix, iy, 6) * 80, 14 + hh(ix, iy, 7) * 8, '#f6f0e0', 0.4);
      }
    }
    // paper-edge vignette at the borders of the world (blends into the colour beyond the map)
    { const E = 90, edge = (x, y, w, h, x0, y0, x1, y1) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(169,198,203,1)'); g.addColorStop(1, 'rgba(169,198,203,0)'); c.fillStyle = g; c.fillRect(x, y, w, h); };
      c.fillStyle = '#a9c6cb';
      if (Y0 < E) { edge(X0, 0, X1 - X0, E, 0, 0, 0, E); if (Y0 < 0) c.fillRect(X0, Y0, X1 - X0, -Y0); }
      if (Y1 > MAP_H - E) { edge(X0, MAP_H - E, X1 - X0, E, 0, MAP_H, 0, MAP_H - E); if (Y1 > MAP_H) c.fillRect(X0, MAP_H, X1 - X0, Y1 - MAP_H); }
      if (X0 < E) { edge(0, Y0, E, Y1 - Y0, 0, 0, E, 0); if (X0 < 0) c.fillRect(X0, Y0, -X0, Y1 - Y0); }
      if (X1 > MAP_W - E) { edge(MAP_W - E, Y0, E, Y1 - Y0, MAP_W, 0, MAP_W - E, 0); if (X1 > MAP_W) c.fillRect(MAP_W, Y0, X1 - MAP_W, Y1 - Y0); } }
    c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = lod ? 0.35 : 0.5; c.fillStyle = grainPattern(c); c.fillRect(X0, Y0, X1 - X0, Y1 - Y0); c.restore();
  }
  let grainCv = null;
  function grainPattern(c) {
    if (!grainCv) { grainCv = paperTexture(); }
    const pat = c.createPattern(grainCv, 'repeat');
    if (pat.setTransform) pat.setTransform(new DOMMatrix().scale(0.5));
    return pat;
  }
  const CORAL_NODES = NODES.filter((n) => n.sub === 'coral' && n.type !== 'camp');
  const LMS = {};
  for (const id of SUBIDS) {
    const L = Object.assign({}, WL.subareas[id].landmark), sub = World.SUB_BY && World.SUB_BY[id];
    if (sub && sub.landmark && sub.landmark.label) { L.label = sub.landmark.label; if (sub.landmark.kind) L.kind = sub.landmark.kind; }
    LMS[id] = L;
  }

  // ================================================================================================
  //  Tile manager: L0 tiles (cached, LRU), overview chunks, placeholder wash
  // ================================================================================================
  const tiles = new Map();           // 'i,j' -> { cv, t0, last, i, j }
  const perf = { lap: {}, tileMs: [], chunkMs: [], tilesPainted: 0, chunksPainted: 0, frameMs: 0, frames: 0, worst: 0 };
  let TILE_CAP = (navigator.deviceMemory && navigator.deviceMemory <= 2) ? 24 : 32;
  let frameNo = 0;
  let ovCv = null, ovCtx = null;
  const ovDone = new Set();
  const NCX = Math.ceil(MAP_W / CHUNK), NCY = Math.ceil(MAP_H / CHUNK);
  const mini = (() => {
    const w = Math.ceil(MAP_W / 100), h = Math.ceil(MAP_H / 100), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'), img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const b = groundAt(x * 100 + 50, y * 100 + 50), col = rgb(b ? (PALI[b] ? PALI[b].base : '#cfd8c0') : '#a9c6cb'), o = (y * w + x) * 4;
      img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
    }
    g.putImageData(img, 0, 0); return cv;
  })();
  let cur = null;                    // the job being painted: { kind, gen, i, j, cv, t0 }
  function startJob(job) {
    job.t0 = performance.now();
    if (job.kind === 'tile') {
      const px = Math.ceil((TILE + 2 * PAD) * S0), sc = px / (TILE + 2 * PAD), x0 = job.i * TILE, y0 = job.j * TILE;
      const cv = document.createElement('canvas'); cv.width = cv.height = px;
      const c = cv.getContext('2d'); c.setTransform(sc, 0, 0, sc, -(x0 - PAD) * sc, -(y0 - PAD) * sc);
      job.cv = cv; job.gen = paintRegion(c, x0 - PAD, y0 - PAD, x0 + TILE + PAD, y0 + TILE + PAD, 0);
    } else {
      if (!ovCv) { ovCv = document.createElement('canvas'); ovCv.width = Math.round(MAP_W * S2); ovCv.height = Math.round(MAP_H * S2); ovCtx = ovCv.getContext('2d'); }
      const x0 = job.i * CHUNK, y0 = job.j * CHUNK, c = ovCtx;
      c.save(); c.setTransform(S2, 0, 0, S2, 0, 0); c.beginPath(); c.rect(x0, y0, CHUNK, CHUNK); c.clip();
      job.gen = paintRegion(c, x0 - 10, y0 - 10, x0 + CHUNK + 10, y0 + CHUNK + 10, 2);
    }
  }
  function finishJob(job) {
    const ms = job.cpu || 0;
    if (job.kind === 'tile') { tiles.set(job.i + ',' + job.j, { cv: job.cv, t0: performance.now(), last: frameNo, i: job.i, j: job.j }); perf.tilesPainted++; perf.tileMs.push(ms); if (perf.tileMs.length > 200) perf.tileMs.shift(); evict(); }
    else { ovCtx.restore(); ovDone.add(job.i + ',' + job.j); perf.chunksPainted++; perf.chunkMs.push(ms); }
  }
  function evict() {
    if (tiles.size <= TILE_CAP) return;
    for (const [k, t] of tiles) { if (tiles.size <= TILE_CAP) break; if (t.last < frameNo - 2) { t.cv.width = t.cv.height = 0; tiles.delete(k); } }
  }
  function nextJob() {
    const rho = z * dpr;
    if (rho >= 0.45 && !(ovT > 0.6)) {
      const m = rho > 0.9 ? TILE * 0.45 : 0, ti0 = Math.max(0, Math.floor((X0 - m) / TILE)), ti1 = Math.min(NTX - 1, Math.floor((X0 + WW + m) / TILE)), tj0 = Math.max(0, Math.floor((Y0 - m) / TILE)), tj1 = Math.min(NTY - 1, Math.floor((Y0 + WH + m) / TILE));
      let best = null, bd = 1e18;
      for (let j = tj0; j <= tj1; j++) for (let i = ti0; i <= ti1; i++) {
        if (tiles.has(i + ',' + j)) continue;
        const inside = (i + 1) * TILE > X0 && i * TILE < X0 + WW && (j + 1) * TILE > Y0 && j * TILE < Y0 + WH;
        const d = Math.hypot((i + 0.5) * TILE - vx, (j + 0.5) * TILE - vy) + (inside ? 0 : 5000);
        if (d < bd) { bd = d; best = { kind: 'tile', i, j }; }
      }
      if (best) return best;
    }
    let best = null, bd = 1e18;
    for (let j = 0; j < NCY; j++) for (let i = 0; i < NCX; i++) {
      if (ovDone.has(i + ',' + j)) continue;
      const d = Math.hypot((i + 0.5) * CHUNK - vx, (j + 0.5) * CHUNK - vy);
      if (d < bd) { bd = d; best = { kind: 'chunk', i, j }; }
    }
    return best;
  }
  function pump(budget) {
    const t0 = performance.now(); deadline = t0 + budget;
    while (performance.now() < deadline) {
      if (!cur) { cur = nextJob(); if (!cur) { prebuildFog(); return; } startJob(cur); }
      const g0 = performance.now(), r = cur.gen.next(); cur.cpu = (cur.cpu || 0) + performance.now() - g0;
      if (r.done) { finishJob(cur); cur = null; }
    }
  }
  // 0 = every visible tile is ready, 1 = some are missing, 2 = none of the visible tiles is ready yet
  const needsTiles = () => {
    if (z * dpr < 0.45) return 0;
    const ti0 = Math.max(0, Math.floor(X0 / TILE)), ti1 = Math.min(NTX - 1, Math.floor((X0 + WW) / TILE)), tj0 = Math.max(0, Math.floor(Y0 / TILE)), tj1 = Math.min(NTY - 1, Math.floor((Y0 + WH) / TILE));
    let miss = 0, have = 0;
    for (let j = tj0; j <= tj1; j++) for (let i = ti0; i <= ti1; i++) { if (tiles.has(i + ',' + j)) have++; else miss++; }
    return !miss ? 0 : have ? 1 : 2;
  };

  function drawTerrain(now) {
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'low';
    const sx0 = Math.max(0, X0), sy0 = Math.max(0, Y0), sx1 = Math.min(MAP_W, X0 + WW), sy1 = Math.min(MAP_H, Y0 + WH);
    if (sx1 <= sx0 || sy1 <= sy0) return;
    const rho = z * dpr, full = TILE + 2 * PAD;
    let covered = false, list = null;
    if (rho >= 0.45) {
      const ti0 = Math.max(0, Math.floor(X0 / TILE)), ti1 = Math.min(NTX - 1, Math.floor((X0 + WW) / TILE)), tj0 = Math.max(0, Math.floor(Y0 / TILE)), tj1 = Math.min(NTY - 1, Math.floor((Y0 + WH) / TILE));
      list = []; covered = true;
      for (let j = tj0; j <= tj1; j++) for (let i = ti0; i <= ti1; i++) {
        const key = i + ',' + j, t = tiles.get(key);
        if (!t) { covered = false; continue; }
        t.last = frameNo; tiles.delete(key); tiles.set(key, t);   // LRU order
        const age = (now - t.t0) / 260; if (age < 1) covered = false;
        list.push(t, age);
      }
    }
    // the placeholder washes only show while some tile is still missing or fading in
    if (!covered) {
      const mk = 0.01;   // mini: 1 px = 100 units
      ctx.drawImage(mini, sx0 * mk, sy0 * mk, (sx1 - sx0) * mk, (sy1 - sy0) * mk, sx0, sy0, sx1 - sx0, sy1 - sy0);
      if (ovCv) ctx.drawImage(ovCv, sx0 * S2, sy0 * S2, (sx1 - sx0) * S2, (sy1 - sy0) * S2, sx0, sy0, sx1 - sx0, sy1 - sy0);
    }
    if (!list) return;
    for (let k = 0; k < list.length; k += 2) { const t = list[k], age = list[k + 1]; ctx.globalAlpha = age >= 1 ? 1 : age; ctx.drawImage(t.cv, t.i * TILE - PAD, t.j * TILE - PAD, full, full); }
    ctx.globalAlpha = 1;
  }

  // ================================================================================================
  //  Fog over locked sub-areas
  // ================================================================================================
  const FOG_TINT = { meadow: '#cfe0b0', forest: '#b4cba8', bamboo: '#bcd4a0', lake: '#bcd4d6', beach: '#f0e2c0', coral: '#bde4e0', cove: '#d8cdb8', isles: '#c8dcd8', dunes: '#f0d8a8', oasis: '#e8dcae', canyon: '#eec8a8', temple: '#e6c8a0', snow: '#eaf2f8', frozen: '#d2e6f0', rime: '#dde2f2', glacier: '#d8eaf6', ash: '#bdb5b0', ridge: '#a9a2bc', lavafall: '#c4a49c', caldera: '#c4a49c' };
  const fogTex = {}, FS = 0.22;
  let fogBuiltThisFrame = false;
  function buildFog(id) {
    const sub = WL.subareas[id], R = R0('fog:' + id), b = [sub.bounds[0] - 270, sub.bounds[1] - 270, sub.bounds[2] + 270, sub.bounds[3] + 270], w = b[2] - b[0], h = b[3] - b[1];
    const cv = document.createElement('canvas'); cv.width = Math.ceil(w * FS); cv.height = Math.ceil(h * FS);
    const g = cv.getContext('2d'); g.scale(FS, FS); g.translate(-b[0], -b[1]);
    const puffs = [];
    for (let y = sub.bounds[1] - 40; y <= sub.bounds[3] + 40; y += 84) for (let x = sub.bounds[0] - 40; x <= sub.bounds[2] + 40; x += 88) {
      const px = x + (R() - 0.5) * 50, py = y + (R() - 0.5) * 50;
      if (!U.inPoly(px, py, sub.shape)) continue;
      puffs.push({ x: px, y: py, r: 130 + R() * 80 });
    }
    g.globalAlpha = 0.75; for (const p of puffs) g.drawImage(shadeSprite, p.x + 6 - p.r, p.y + 24 - p.r, p.r * 2, p.r * 2);
    g.globalAlpha = 0.93; for (const p of puffs) g.drawImage(mistSprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    g.globalAlpha = 1;
    for (const p of puffs) if (R() > 0.45) soft(g, p.x, p.y, p.r * 1.1, p.r * 0.8, FOG_TINT[id] || '#dcdcd4', 0.34);
    for (let i = 0; i < 6; i++) {
      const px = sub.bounds[0] + (sub.bounds[2] - sub.bounds[0]) * (0.1 + 0.8 * R()), py = sub.bounds[1] + (sub.bounds[3] - sub.bounds[1]) * (0.5 + 0.35 * R()), s = 90 + R() * 80;
      if (!U.inPoly(px, py, sub.shape)) continue;
      g.globalAlpha = 0.17; g.fillStyle = '#5b6a92'; g.beginPath(); g.moveTo(px - s, py); g.quadraticCurveTo(px - s * 0.4, py - s * 0.7, px - s * 0.08, py - s * 1.3); g.lineTo(px + s * 0.1, py - s * 1.25); g.quadraticCurveTo(px + s * 0.4, py - s * 0.6, px + s, py); g.closePath(); g.fill();
      g.globalAlpha = 1; soft(g, px, py - s * 0.15, s * 1.3, s * 0.4, '#ecebe4', 0.6);
    }
    g.globalAlpha = 1;
    return (fogTex[id] = { cv, b, w, h });
  }
  const wisps = []; { const R = R0('wisps'); for (let i = 0; i < 40; i++) wisps.push({ x: R() * MAP_W, y: R() * MAP_H, w: 160 + R() * 160, sp: 8 + R() * 10, ph: R() * 6 }); }
  function bossNameFor(id) {
    const s = World.SUB_BY[id]; let from = s && s.from;
    if (!from || !World.THEMES[from]) { const p = World.SUBAREAS.find((a) => a.unlocks && a.unlocks.includes(id)); from = p && p.id; }
    return from && World.THEMES[from] ? World.THEMES[from].boss[0] : 'the guardian';
  }
  // idle time: build the fog textures of locked areas, nearest first
  function prebuildFog() {
    let best = null, bd = 1e18;
    for (const id of SUBIDS) { if (fogTex[id] || unlocked(id)) continue; const c = WL.subareas[id].center, d = Math.hypot(c[0] - vx, c[1] - vy); if (d < bd) { bd = d; best = id; } }
    if (best) buildFog(best);
  }
  function drawFog() {
    fogBuiltThisFrame = false;
    for (const id of SUBIDS) {
      const a = fogA[id] || 0; if (a <= 0.01) continue;
      const sub = WL.subareas[id], b = sub.bounds; if (b[2] + 270 < X0 || b[0] - 270 > X0 + WW || b[3] + 270 < Y0 || b[1] - 270 > Y0 + WH) continue;
      let f = fogTex[id];
      if (!f) { if (fogBuiltThisFrame) continue; fogBuiltThisFrame = true; f = buildFog(id); }
      ctx.globalAlpha = a * 0.97; ctx.drawImage(f.cv, f.b[0], f.b[1], f.w, f.h);
      for (let i = 0; i < 4; i++) {
        const wx = b[0] + ((T * (9 + i * 3) + i * 400) % (b[2] - b[0] + 400)) - 200, wy = b[1] + 200 + i * 350 + Math.sin(T * 0.4 + i) * 14;
        ctx.globalAlpha = a * 0.4; ctx.drawImage(mistSprite, wx - 160, wy - 36, 320, 72);
      }
      const cx = sub.center[0], cy = sub.center[1], u = 1 / z, sc = World.SUB_BY[id], eo = ease(ovT), ls = 1 - 0.45 * eo;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(u * ls, u * ls); ctx.globalAlpha = a;
      ctx.fillStyle = INDIGO; ctx.beginPath(); ctx.rect(-9, -30, 18, 14); ctx.fill();
      ctx.strokeStyle = INDIGO; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -31, 6, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(0, -24, 2, 0, 7); ctx.fill();
      ctx.restore();
      inkText(sc ? sc.name : id, cx, cy + 4 * u * ls, 15 - 5 * eo, a, 700, true);
      const prev = sc && sc.from, frontier = !prev || prev === 'camp' || unlocked(prev);
      if (eo < 0.3 || frontier) inkText('Defeat ' + bossNameFor(id), cx, cy + 24 * u * ls, 11.5 - 3 * eo, a * 0.9, 500, true);
      ctx.globalAlpha = 1;
    }
  }

  // ================================================================================================
  //  Frame
  // ================================================================================================
  const unlocked = (sub) => !st.save || st.save.unlocked.includes(sub);
  const visibleNode = (n) => n.type === 'camp' || unlocked(n.sub);
  function clampCam() {
    const hw = vw / 2 / zIn, hh2 = vh / 2 / zIn;
    cam.x = Math.max(hw - 160, Math.min(MAP_W - hw + 160, cam.x));
    cam.y = Math.max(hh2 - 160, Math.min(MAP_H - hh2 + vh * 0.45 / zIn, cam.y));
  }
  const ease = (t) => t * t * (3 - 2 * t);
  const ZMAP = { meadow: 'petal', bamboo: 'petal', lake: 'petal', forest: 'petal', dunes: 'sand', oasis: 'sand', canyon: 'sand', temple: 'sand', snow: 'snow', frozen: 'snow', rime: 'snow', glacier: 'snow', high: 'snow', ash: 'ember', ridge: 'ember', lavafall: 'ember', caldera: 'ember' };
  let wKind = null, wA = 0;
  let banner = { id: null, t: -9 };

  function frame(now) {
    if (!active) return;
    const t0 = performance.now();
    const dt = Math.min(0.05, (now - (frame.last || now)) / 1000); frame.last = now; T += dt; frameNo++;
    stepToken(dt);
    zIn = zBase * uz;
    if (follow) { cam.x += (follow.x - cam.x) * Math.min(1, dt * 5); cam.y += (follow.y - cam.y) * Math.min(1, dt * 5); }
    clampCam();
    ovT = Math.max(0, Math.min(1, ovT + (ovOn ? 1 : -1) * dt * 2.6));
    const e = ease(ovT);
    z = zIn * Math.pow(zOv / zIn, e);
    vx = cam.x + (MAP_W / 2 - cam.x) * e; vy = cam.y + (MAP_H / 2 + 20 - cam.y) * e;
    X0 = vx - vw / 2 / z; Y0 = vy - vh / 2 / z; WW = vw / z; WH = vh / z;
    for (const id of SUBIDS) {
      const target = unlocked(id) ? 0 : 1;
      if (fogA[id] === undefined) fogA[id] = target;
      fogA[id] += Math.sign(target - fogA[id]) * Math.min(Math.abs(target - fogA[id]), dt * 0.6);
    }
    for (let i = prints.length - 1; i >= 0; i--) if (T - prints[i].t > 7) prints.splice(i, 1);
    const nt = needsTiles(), tp = performance.now(); pump(nt === 2 ? 15 : nt === 1 ? 7 : 4); perf.lastPump = performance.now() - tp;
    const td = performance.now(); draw(now, dt); perf.lastDraw = performance.now() - td;
    perf.frames++; const ms = performance.now() - t0; perf.frameMs += ms; if (ms > perf.worst) perf.worst = ms; if (ms > 30) { (perf.slow = perf.slow || []).push([frameNo, Math.round(ms), Math.round(frame.dtLast || 0), Math.round(perf.lastPump || 0), Math.round(perf.lastDraw || 0), JSON.stringify(perf.lap, (k, v) => (typeof v === 'number' ? Math.round(v) : v))]); if (perf.slow.length > 20) perf.slow.shift(); }
    requestAnimationFrame(frame);
  }

  let X0 = 0, Y0 = 0, WW = 1, WH = 1;
  const inView = (x, y, m) => x > X0 - m && x < X0 + WW + m && y > Y0 - m && y < Y0 + WH + m;

  function draw(now, dt) {
    let lt = performance.now(); const lap = (k) => { const n = performance.now(); perf.lap[k] = n - lt; lt = n; };
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#a9c6cb'; ctx.fillRect(0, 0, vw, vh);
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (vw / 2 - vx * z), dpr * (vh / 2 - vy * z));
    drawTerrain(now); lap('terrain');
    const e = ease(ovT), detail = clamp01(1 - e * 2.2), marks = clamp01(e * 2.2 - 0.3);
    if (e < 0.6) { drawWater(e); drawSparks(); } lap('water');
    drawLabels(e);
    drawPrints();
    drawEntities(detail, marks); lap('entities');
    drawWisps(e);
    drawFog(); lap('fog');
    drawDest();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (e < 0.5) weather(dt, 1 - e * 2);
    drawBanner(e); lap('hud');
  }

  // ---------- Animated touches ----------
  const rivers = FEATS.filter((f) => f.k === 'river' && (f.style === 'water' || f.style === 'tide' || f.style === 'lava'));
  function drawWater(e) {
    ctx.lineCap = 'round';
    if (z * dpr > 0.5) {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
      const st = 240, i0 = Math.floor(X0 / st), i1 = Math.floor((X0 + WW) / st), j0 = Math.floor(Y0 / st), j1 = Math.floor((Y0 + WH) / st);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        if (hh(i, j, 91) > 0.55) continue;
        const x = (i + hh(i, j, 92)) * st, y = (j + hh(i, j, 93)) * st;
        if (groundAt(x, y) !== 0) continue;
        const a = Math.sin(T * 1.2 + hh(i, j, 94) * 6); if (a < 0.1) continue;
        ctx.globalAlpha = (a - 0.1) * 0.7; const dx = Math.sin(T * 0.8 + hh(i, j, 95) * 6) * 4;
        ctx.beginPath(); ctx.arc(x + dx, y, 7, 3.6, 5.8); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    // river flow: pale dashes sliding along the current (lava glows instead)
    for (const f of rivers) {
      const b = f._b; if (b[2] < X0 || b[0] > X0 + WW || b[3] < Y0 || b[1] > Y0 + WH) continue;
      if (!f._sm) f._sm = smooth(f.pts, 6);
      if (!f._path) f._path = curve(f._sm);
      if (f.style === 'lava') { ctx.globalAlpha = 0.18 + 0.12 * Math.sin(T * 2 + f.salt); ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = f.w1 * 0.7; ctx.stroke(f._path); continue; }
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.setLineDash([7, 22]); ctx.lineDashOffset = -T * 16; ctx.globalAlpha = 1; ctx.stroke(f._path); ctx.setLineDash([]);
    }
    ctx.lineCap = 'butt'; ctx.globalAlpha = 1;
  }
  // landmark sparkles, built once from the landmark kinds
  const sparks = [];
  for (const id of SUBIDS) {
    const L = LMS[id], k = L.k, add = (dx, dy, ph, kind) => sparks.push({ x: L.x + dx * k, y: L.y + dy * k, ph, kind, sub: id, k });
    switch (L.kind) {
      case 'lake': for (let i = 0; i < 6; i++) add(-40 + i * 16, -14 + ((i * 17) % 28), i * 1.1, 'glint'); break;
      case 'lighthouse': add(24, -52, 0, 'beacon'); break;
      case 'reef-arch': add(-10, -8, 1, 'glint'); add(24, 6, 2.4, 'glint'); break;
      case 'giant-dune': add(8, -52, 0, 'glint'); break;
      case 'oasis': for (let i = 0; i < 5; i++) add(-36 + i * 18, -6 + ((i * 17) % 22), i * 1.3, 'glint'); break;
      case 'ice-peak': add(4, -62, 0, 'star'); break;
      case 'frozen-lake': for (let i = 0; i < 4; i++) add(-30 + i * 22, -8 + ((i * 13) % 20), i * 1.7, 'star'); break;
      case 'ice-forest': for (let i = 0; i < 6; i++) add(-50 + i * 20, -40 + ((i * 19) % 50), i * 1.2, 'star'); break;
      case 'ice-palace': for (let i = 0; i < 5; i++) add(-60 + i * 30, -90 + ((i * 23) % 60), i * 1.4, 'star'); break;
      case 'burnt-grove': for (let i = 0; i < 4; i++) add(-30 + i * 20, -4 + (i % 2) * 14, i * 1.4, 'ember'); break;
      case 'obsidian-ridge': for (let i = 0; i < 5; i++) add(-50 + i * 24, -30 + ((i * 17) % 40), i * 1.3, 'star'); break;
      case 'volcano': add(-28, -62, 0, 'crater'); break;
      case 'lava-falls': for (let i = 0; i < 3; i++) add(-40 + i * 40, 30, i * 1.1, 'ember'); break;
      case 'sea-stacks': for (let i = 0; i < 4; i++) add(-70 + i * 46, 14 + (i % 2) * 8, i * 1.7, 'glint'); break;
      default: break;
    }
  }
  function drawSparks() {
    for (const s of sparks) {
      if (!unlocked(s.sub) || !inView(s.x, s.y, 120 * s.k)) continue;
      const a = Math.sin(T * 1.6 + s.ph), k = s.k;
      if (s.kind === 'glint') {
        if (a < 0.2) continue;
        ctx.globalAlpha = (a - 0.2) * 0.85; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(s.x + Math.sin(T * 0.6 + s.ph) * 3 * k, s.y, 5.5 * k, 1.2 * k, 0, 0, 7); ctx.fill();
      } else if (s.kind === 'star') {
        if (a < 0) continue;
        const r = (2 + a * 2.6) * k * 0.8; ctx.globalAlpha = a * 0.9; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(s.x, s.y - r); ctx.lineTo(s.x + r * 0.22, s.y - r * 0.22); ctx.lineTo(s.x + r, s.y); ctx.lineTo(s.x + r * 0.22, s.y + r * 0.22); ctx.lineTo(s.x, s.y + r); ctx.lineTo(s.x - r * 0.22, s.y + r * 0.22); ctx.lineTo(s.x - r, s.y); ctx.lineTo(s.x - r * 0.22, s.y - r * 0.22); ctx.closePath(); ctx.fill();
      } else if (s.kind === 'ember') {
        const q = (T * 0.35 + s.ph) % 1; ctx.globalAlpha = (1 - q) * 0.9; ctx.fillStyle = '#ffb14a'; ctx.beginPath(); ctx.arc(s.x + Math.sin(T + s.ph * 3) * 4 * k, s.y - q * 34 * k, 1.5 * k, 0, 7); ctx.fill();
      } else if (s.kind === 'beacon') {
        soft(ctx, s.x, s.y, 34 * k, 26 * k, '#fff2b0', 0.28 + 0.22 * Math.sin(T * 2));
        const b = Math.cos(T * 0.9);
        if (Math.abs(b) > 0.1) { ctx.globalAlpha = Math.abs(b) * 0.22; ctx.fillStyle = '#fff7c8'; const d = b > 0 ? -1 : 1, L2 = 120 * k * Math.abs(b); ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + d * L2, s.y - 22 * k); ctx.lineTo(s.x + d * L2, s.y + 14 * k); ctx.closePath(); ctx.fill(); }
      } else if (s.kind === 'crater') {
        soft(ctx, s.x, s.y, 46 * k, 26 * k, '#ff8a3a', 0.2 + 0.16 * Math.sin(T * 2.2));
        for (let i = 0; i < 3; i++) { const q = (T * 0.3 + i / 3) % 1; ctx.globalAlpha = (1 - q) * 0.85; ctx.fillStyle = '#ffb14a'; ctx.beginPath(); ctx.arc(s.x + (Math.sin(T * 1.3 + i * 2) * 8 + q * 6) * k, s.y - q * 44 * k, 1.6 * k, 0, 7); ctx.fill(); }
      }
    }
    ctx.globalAlpha = 1;
  }
  // Weather in screen space: petals, snow, sand motes or embers depending on the ground under the camera
  const WN = 28, WP = []; for (let i = 0; i < WN; i++) WP.push({ x: hh(i, 1, 501), y: hh(i, 2, 501), s: 0.5 + hh(i, 3, 501), p: hh(i, 4, 501) * 6 });
  function weather(dt, vis) {
    const kind = ZMAP[BIOME[groundAt(vx, vy)]] || null;
    if (wKind !== kind) { wA -= dt * 1.5; if (wA <= 0) { wA = 0; wKind = kind; } } else wA = Math.min(1, wA + dt * 1.2);
    if (!wKind || wA <= 0.02) return;
    ctx.save();
    for (const p of WP) {
      const sp = wKind === 'snow' ? 28 : wKind === 'ember' ? -36 : wKind === 'sand' ? 12 : 22;
      let y = ((p.y * vh + T * sp * p.s) % vh + vh) % vh, x = (p.x * vw + Math.sin(T * 0.8 * p.s + p.p) * 16 + (wKind === 'sand' ? T * 60 * p.s : 0)) % vw;
      if (x < 0) x += vw;
      ctx.globalAlpha = wA * vis * 0.8;
      if (wKind === 'snow') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, 1.6 * p.s, 0, 7); ctx.fill(); }
      else if (wKind === 'ember') { ctx.fillStyle = '#ff9a4a'; ctx.beginPath(); ctx.arc(x, y, 1.3 * p.s, 0, 7); ctx.fill(); }
      else if (wKind === 'sand') { ctx.fillStyle = '#e4c98a'; ctx.fillRect(x, y, 2.2 * p.s, 1.1); }
      else { ctx.fillStyle = p.s > 1 ? '#f0b6c2' : '#f8d5da'; ctx.translate(x, y); ctx.rotate(T + p.p); ctx.beginPath(); ctx.ellipse(0, 0, 3 * p.s, 1.5 * p.s, 0, 0, 7); ctx.fill(); ctx.rotate(-(T + p.p)); ctx.translate(-x, -y); }
    }
    ctx.restore();
  }
  function drawBanner(e) {
    // name of the sub-area the camera is in, fading in when entered
    const id = WL.subAt(cam.x, cam.y + (FOCUS_Y - 0.5) * vh / zIn);
    if (id && unlocked(id)) { if (id !== banner.id) banner = { id, t: T }; } else banner.id = null;
    if (!banner.id || e > 0.3) return;
    const age = T - banner.t, a = Math.min(1, age / 0.6) * Math.max(0, Math.min(1, (4.2 - age) / 0.8)) * (1 - e * 3); if (a <= 0.01) return;
    const sub = World.SUB_BY[banner.id], name = sub ? sub.name : banner.id, y = 108;
    ctx.save(); ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    ctx.font = 'italic 700 20px "Shippori Mincho","Hiragino Mincho ProN","Yu Mincho",Georgia,serif'; ctx.globalAlpha = a * 0.9; ctx.lineWidth = 6; ctx.strokeStyle = PAPER; ctx.strokeText(name, vw / 2, y); ctx.globalAlpha = a; ctx.fillStyle = INK; ctx.fillText(name, vw / 2, y);
    ctx.font = '600 11px "Zen Kaku Gothic New",system-ui,sans-serif'; const rg = (sub ? sub.region : '').toUpperCase(); ctx.globalAlpha = a * 0.8; ctx.lineWidth = 4; ctx.strokeText(rg, vw / 2, y + 16); ctx.fillStyle = VERM; ctx.fillText(rg, vw / 2, y + 16);
    ctx.restore();
  }

  function drawPaths(e) { /* free exploration: no path graph, roads are painted into the terrain */ }
  const REGION_AT = (() => { const out = {}; for (const id of SUBIDS) { const s = WL.subareas[id]; (out[s.region] = out[s.region] || []).push(s.center); } return Object.entries(out).map(([r, cs]) => [r, cs.reduce((a, c) => a + c[0], 0) / cs.length, cs.reduce((a, c) => a + c[1], 0) / cs.length]); })();
  function drawLabels(e) {
    if (e < 0.35) return;
    const k = clamp01((e - 0.35) * 2.2);
    for (const id of SUBIDS) {
      if (!unlocked(id)) continue;
      const sub = World.SUB_BY[id], s = WL.subareas[id], L = LMS[id];
      inkText(sub ? sub.name : id, L.x, L.y + L.ry * 2.6 + 40 / z, 11.5, 0.92 * k * (1 - (fogA[id] || 0)), 600, true);
    }
    for (const [r, x, y] of REGION_AT) inkText(r.toUpperCase(), x, y, 19, k * 0.5, 700, false);
  }
  function drawWisps(e) {
    if (e > 0.5) return;
    for (const w of wisps) {
      const x = ((w.x + T * w.sp) % (MAP_W + 400)) - 200, y = w.y + Math.sin(T * 0.3 + w.ph) * 12;
      if (!inView(x, y, w.w)) continue;
      ctx.globalAlpha = 0.24 * (1 - e * 2); ctx.drawImage(mistSprite, x - w.w, y - w.w * 0.16, w.w * 2, w.w * 0.32);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- Entities: nodes and the hero, sorted by depth ----------
  const lvlDifficulty = (n) => {
    if (n.type === 'boss') return 5;
    if (n.type === 'elite') return 4;
    const sub = World.SUB_BY[n.sub] || { lv: [n.level, n.level + 1] }, span = Math.max(1, sub.lv[1] - sub.lv[0]);
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
    for (const n of NODES) if (visibleNode(n) && inView(n.x, n.y - 40, 90)) list.push({ y: n.y, n });
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
    const r = (boss ? 8 : n.type === 'camp' ? 8 : 5.6) * k, x = n.x, y = n.y;
    ctx.globalAlpha = A;
    if (state === 'near') { const q = (T * 0.9) % 1; ctx.globalAlpha = A * (1 - q); ctx.strokeStyle = '#e8b04a'; ctx.lineWidth = 2.2 * k; ctx.beginPath(); ctx.arc(x, y, r + (3 + q * 9) * k, 0, 7); ctx.stroke(); ctx.globalAlpha = A; }
    let fill = '#fbf5e4', edge = '#5b4a3a';
    if (n.type === 'camp') { edge = '#8a6a3a'; fill = '#f3e7c8'; }
    else if (state === 'done') { fill = '#7fb287'; edge = '#3f7a4d'; }
    else if (state === 'far') { fill = '#cfcdc6'; edge = '#8f918f'; }
    else if (n.type === 'shrine') { fill = '#d8eef2'; edge = '#3f8fa8'; }
    else if (n.type === 'treasure') { fill = '#f3dfa0'; edge = '#b8892e'; }
    else edge = DANGER[lvlDifficulty(n) - 1];
    ctx.fillStyle = fill; ctx.strokeStyle = edge; ctx.lineWidth = (boss ? 2.2 : 1.7) * k;
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


  // ================================================================================================
  //  Hero walking: tap-to-walk follows A* around water, cliffs and fog; stops where the ground ends
  // ================================================================================================
  const lockedAt = (x, y) => { const s = WL.subAt(x, y); return !!s && !unlocked(s); };
  const walkable = (x, y) => !WL.blocked(x, y) && !lockedAt(x, y);
  function losFree(a, b) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.ceil(L / 10)); for (let i = 1; i <= m; i++) if (!walkable(a[0] + (b[0] - a[0]) * i / m, a[1] + (b[1] - a[1]) * i / m)) return false; return true; }
  function routeTo(sx, sy, tx, ty) {
    let P = WL.findPath(sx, sy, tx, ty, { extra: lockedAt, limit: 160000 });
    if (!P) {   // no way around: walk straight until the ground ends
      const d = Math.hypot(tx - sx, ty - sy); let ex = sx, ey = sy;
      for (let s = 8; s <= d; s += 8) { const px = sx + (tx - sx) * s / d, py = sy + (ty - sy) * s / d; if (!walkable(px, py)) break; ex = px; ey = py; }
      return Math.hypot(ex - sx, ey - sy) < 6 ? [] : [{ x: ex, y: ey }];
    }
    const out = [P[0]]; let i = 0;
    while (i < P.length - 1) { let j = P.length - 1; while (j > i + 1 && !losFree(P[i], P[j])) j--; out.push(P[j]); i = j; }
    return out.slice(1).map((p) => ({ x: p[0], y: p[1] }));
  }
  function stepToken(dt) {
    const w = token.walk; if (!w) return;
    if (w.total === undefined) { let L = 0, px = token.x, py = token.y; for (const p of w.pts) { L += Math.hypot(p.x - px, p.y - py); px = p.x; py = p.y; } w.total = L; }
    const speed = w.route ? Math.max(340, w.total / 2.6) : Math.max(300, Math.min(900, w.total / 3));
    let left = dt * speed;
    while (left > 0 && w.pts.length) {
      const p = w.pts[0], d = Math.hypot(p.x - token.x, p.y - token.y);
      if (d <= left) { token.x = p.x; token.y = p.y; left -= d; w.pts.shift(); }
      else { const dx = (p.x - token.x) / d, dy = (p.y - token.y) / d; token.x += dx * left; token.y += dy * left; left = 0; }
      if (d > 0.5) { const dx = p.x - token.x; if (Math.abs(dx) > 0.5) token.face = dx > 0 ? 1 : -1; }
    }
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
      const targets = ids.map((id) => World.byId[id]).filter(Boolean).map((n) => ({ x: n.x + HERO_OFF.x, y: n.y + HERO_OFF.y }));
      if (!targets.length) return done();
      let pts = [], at = { x: token.x, y: token.y };
      for (const t of targets) { const seg = routeTo(at.x, at.y, t.x, t.y); pts = pts.concat(seg.length ? seg : [t]); at = t; }
      if (token.walk) token.walk.done();
      token.walk = { pts, done, route: true };
    });
  }
  function placeToken(id) { const n = World.byId[id]; token.x = n.x + HERO_OFF.x; token.y = n.y + HERO_OFF.y; token.walk = null; }
  // Free roam: walk toward a tapped point, around obstacles; a tap on water or a cliff goes to the nearest shore
  function roamTo(x, y) {
    if (token.walk && token.walk.route) return;
    let tx = x, ty = y;
    if (!walkable(tx, ty)) {
      const dx = token.x - x, dy = token.y - y, d = Math.hypot(dx, dy) || 1; let ok = false;
      for (let s = 10; s <= Math.min(d, 420); s += 10) { const px = x + dx / d * s, py = y + dy / d * s; if (walkable(px, py)) { tx = px; ty = py; ok = true; break; } }
      if (!ok) return;
    }
    if (Math.hypot(tx - token.x, ty - token.y) < 6) return;
    const pts = routeTo(token.x, token.y, tx, ty); if (!pts.length) return;
    const end = pts[pts.length - 1];
    token.walk = { pts, done() {}, route: false }; dest = { x: end.x, y: end.y, t: T };
  }

  // ================================================================================================
  //  Input: drag to pan, pinch / ctrl-wheel to zoom, tap to walk or select
  // ================================================================================================
  const toWorld = (ev) => { const r = canvas.getBoundingClientRect(); return { x: (ev.clientX - r.left - vw / 2) / z + vx, y: (ev.clientY - r.top - vh / 2) / z + vy }; };
  let pan = null, pinch = null; const ptrs = new Map();
  canvas.addEventListener('pointerdown', (ev) => {
    ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY }); try { canvas.setPointerCapture(ev.pointerId); } catch (err) { /* synthetic events */ }
    if (ptrs.size === 1) pan = { x: ev.clientX, y: ev.clientY, cx: cam.x, cy: cam.y, moved: false };
    else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, uz0: uz }; if (pan) pan.moved = true; }
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (ptrs.has(ev.pointerId)) ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pinch && ptrs.size >= 2 && !ovOn) { const [a, b] = [...ptrs.values()]; uz = Math.max(UZ_MIN, Math.min(UZ_MAX, pinch.uz0 * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.d0))); return; }
    if (!pan || ovOn || ptrs.size > 1) return;
    const dx = ev.clientX - pan.x, dy = ev.clientY - pan.y;
    if (!pan.moved && Math.hypot(dx, dy) > 8) pan.moved = true;
    if (pan.moved) { follow = null; cam.x = pan.cx - dx / zIn; cam.y = pan.cy - dy / zIn; }
  });
  const endPtr = (ev) => { ptrs.delete(ev.pointerId); if (ptrs.size < 2) pinch = null; };
  canvas.addEventListener('pointercancel', (ev) => { endPtr(ev); if (!ptrs.size) pan = null; });
  canvas.addEventListener('pointerup', (ev) => {
    const p = pan; endPtr(ev); if (ptrs.size) return; pan = null;
    if (!p || p.moved) return;
    const w = toWorld(ev);
    if (ovOn || ovT > 0.5) { setOverview(false, w.x, w.y); return; }
    let best = null;
    for (const n of NODES) {
      if (!visibleNode(n)) continue;
      const H = nodeH(n), hw = n.type === 'boss' ? 46 : 34;
      if (Math.abs(w.x - n.x) > hw + 6 || w.y < n.y - H - 6 || w.y > n.y + 30) continue;
      const ex = (w.x - n.x) / hw, ey = (w.y - (n.y - H * 0.42)) / (H * 0.62);
      const d = ex * ex + ey * ey;
      if (d < 1 && (!best || d < best.d)) best = { n, d };
    }
    if (best) { onTap(best.n); return; }
    if (!(token.walk && token.walk.route)) roamTo(w.x, w.y);
    onTap(null);
  });
  canvas.addEventListener('wheel', (ev) => {
    ev.preventDefault(); if (ovOn) return;
    if (ev.ctrlKey) { uz = Math.max(UZ_MIN, Math.min(UZ_MAX, uz * Math.exp(-ev.deltaY * 0.01))); return; }
    follow = null; cam.x += ev.deltaX / zIn; cam.y += ev.deltaY / zIn;
  }, { passive: false });

  // ---------- Overview toggle ----------
  function setOverview(on, tx, ty) {
    ovOn = on;
    if (!on && tx !== undefined) { uz = Math.max(uz, 0.85); zIn = zBase * uz; cam.x = tx; cam.y = ty + (0.5 - FOCUS_Y) * vh / zIn; follow = null; clampCam(); }
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
    const s0 = dpr > 1.2 ? 1.5 : 1.0;
    if (s0 !== S0) { S0 = s0; for (const t of tiles.values()) t.cv.width = t.cv.height = 0; tiles.clear(); cur = null; }
    zBase = vw / VIEW; zIn = zBase * uz; zOv = Math.min(vw / (MAP_W + 300), vh / (MAP_H + 400));
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
  }
  window.addEventListener('resize', resize);

  window.WorldMap = {
    init(opts) { onTap = opts.onTap; resize(); makeButton(); zIn = zBase * uz; z = zIn; vx = cam.x; vy = cam.y; X0 = vx - vw / 2 / z; Y0 = vy - vh / 2 / z; WW = vw / z; WH = vh / z; pump(40); requestAnimationFrame(frame); },
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
    // World point under a screen position (CSS px).
    worldAt(sx, sy) { const r = canvas.getBoundingClientRect(); return { x: (sx - r.left - vw / 2) / z + vx, y: (sy - r.top - vh / 2) / z + vy }; },
    setOverview, isOverview() { return ovOn; },
    heroAt() { return { x: token.x, y: token.y, walking: !!token.walk }; },
    tapWorld(x, y) { roamTo(x, y); },
    setZoom(f) { uz = Math.max(UZ_MIN, Math.min(UZ_MAX, f)); },
    getZoom() { return uz; },
    setActive(on) { if (on === active) return; active = on; if (on) { frame.last = 0; requestAnimationFrame(frame); } },
    resize,
    // Rendering statistics (tests / tools): painted tiles, cache size, per-tile cost, frame time.
    stats() {
      const avg = (a) => (a.length ? a.reduce((p, q) => p + q, 0) / a.length : 0), srt = (a) => a.slice().sort((p, q) => p - q);
      const tm = srt(perf.tileMs);
      return { tiles: tiles.size, cap: TILE_CAP, tilesPainted: perf.tilesPainted, chunksPainted: perf.chunksPainted, chunksTotal: NCX * NCY, tileMsAvg: avg(perf.tileMs), tileMsP90: tm[Math.floor(tm.length * 0.9)] || 0, tileMsMax: tm[tm.length - 1] || 0, chunkMsAvg: avg(perf.chunkMs), frameMsAvg: perf.frames ? perf.frameMs / perf.frames : 0, frameMsWorst: perf.worst, frames: perf.frames, jobPending: !!cur, slow: perf.slow || [], ovReady: ovDone.size, tileMB: tiles.size * (Math.ceil((TILE + 2 * PAD) * S0) ** 2 * 4) / 1048576 };
    },
    resetStats() { perf.tileMs = []; perf.chunkMs = []; perf.frameMs = 0; perf.frames = 0; perf.worst = 0; },
  };
})();
