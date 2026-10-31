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
  const LO = 0.9;        // scale of the zoomed-out terrain copy
  const HERO_OFF = { x: 20, y: 14 }; // the hero stands beside a node, not on the monster

  const INK = '#2b3445', PAPER = '#f4ecd7', VERM = '#c8402f', INDIGO = '#3d5a80';

  let vw = 0, vh = 0, dpr = 1, TS = 2;
  let zIn = 1, zOv = 0.4;            // zoom when exploring / in overview
  let z = 1, vx = 0, vy = 0;         // effective zoom and view centre this frame
  let terrain = null, terrainLo = null;
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

  // ---------- Obstacles for scatter (rivers) ----------
  const obstacles = [];
  function clearOfRoutes(x, y, gap, nodeGap) {
    const p = { x, y }, ng = nodeGap || Math.max(gap + 18, 44);
    for (const n of World.nodes) if (Math.hypot(n.x - x, (n.y - 14 - y) * 0.8) < ng) return false;
    for (const [a, b] of World.edges) if (segDist(p, World.byId[a], World.byId[b]) < gap) return false;
    for (const o of obstacles) if (segDist(p, o[0], o[1]) < o[2] + gap * 0.5) return false;
    return true;
  }
  function scatter(seed, path, bounds, count, gap, fn, nodeGap) {
    const R = R0('dec:' + seed), out = [];
    for (let i = 0, tries = 0; i < count && tries < count * 14; tries++) {
      const x = bounds[0] + R() * (bounds[2] - bounds[0]), y = bounds[1] + R() * (bounds[3] - bounds[1]);
      if (path && !hit.isPointInPath(path, x, y)) continue;
      if (!clearOfRoutes(x, y, gap, nodeGap)) continue;
      out.push({ x, y, r: R(), q: R() }); i++;
    }
    out.sort((a, b) => a.y - b.y).forEach((p) => fn(p));
  }

  // ---------- Watercolour palette ----------
  const BIOME = {
    meadow:  { base: '#b6cc82', mid: '#d3dca0', dark: '#8fae68', rim: '#7c9a5a' },
    forest:  { base: '#86a672', mid: '#a8c08a', dark: '#5f8764', rim: '#4d7157' },
    beach:   { base: '#efdcae', mid: '#f4e8c6', dark: '#e0c28e', rim: '#c9a672' },
    coral:   { base: '#eedcb0', mid: '#f4e8c6', dark: '#e0c28e', rim: '#c9a672' },
    dunes:   { base: '#e8c27e', mid: '#f0d49a', dark: '#d6a65c', rim: '#bd8a45' },
    temple:  { base: '#d9b07c', mid: '#e6c898', dark: '#c18f5e', rim: '#a8744a' },
    snow:    { base: '#e4edf0', mid: '#f4f8f8', dark: '#b9ccd8', rim: '#9cb4c6' },
    glacier: { base: '#c3dbe6', mid: '#dcecf2', dark: '#94b8d0', rim: '#7aa0bc' },
    ash:     { base: '#a79b92', mid: '#bdb2a8', dark: '#7f7570', rim: '#665c58' },
    caldera: { base: '#7a5e58', mid: '#957770', dark: '#4e3a38', rim: '#3c2c2c' },
  };
  const SEA = '#a9c6cb';
  const MOUNTAINS = [[425, 860, 575, 1600], [440, 130, 560, 840]];
  const RIVERS = [
    [[255, 2112], [330, 2118], [405, 2122], [470, 2116], [540, 2122], [620, 2116], [700, 2122], [780, 2112]],
    [[494, 840], [472, 920], [512, 1010], [482, 1100], [516, 1200], [490, 1300], [506, 1400], [498, 1520], [502, 1625]],
  ];
  const BRIDGE = { x: 500, y: 2118 };
  const landPaths = {};   // walkable ground per sub-area
  let lagoonPath = null;
  const islandPaths = [];
  const water = [];       // animated sea glints
  const riverPaths = [];  // {path, bb} for animated flow
  const lava = [];

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

  function paintTerrain(c) {
    const { MAP_W, MAP_H } = World, H2 = MAP_H + EXT, R = R0('wash');
    c.fillStyle = PAPER; c.fillRect(0, 0, MAP_W, H2);
    const grain = paperTexture(), pat = c.createPattern(grain, 'repeat');
    c.fillStyle = pat; c.fillRect(0, 0, MAP_W, H2);

    // ----- Sea: pale indigo washes with flowing strokes -----
    c.fillStyle = SEA; c.globalAlpha = 0.9; c.fillRect(0, 0, MAP_W, H2); c.globalAlpha = 1;
    for (let i = 0; i < 70; i++) soft(c, R() * MAP_W, R() * H2, 70 + R() * 130, 40 + R() * 70, R() > 0.5 ? '#7fa5b6' : '#d7e6e2', 0.22 + R() * 0.2);
    for (let i = 0; i < 26; i++) soft(c, R() * MAP_W, R() * H2, 110 + R() * 120, 60 + R() * 60, '#6b8eb0', 0.12);
    c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 1.4;
    for (let y = 12; y < H2; y += 28) { c.beginPath(); for (let x = 0; x <= MAP_W; x += 16) c.lineTo(x, y + Math.sin(x / 55 + y * 0.7) * 5); c.stroke(); }

    // ----- Land shapes -----
    const land = [];
    const mountainPaths = MOUNTAINS.map((b, i) => blob('mtn' + i, b, 30, 0.2));
    mountainPaths.forEach((p) => land.push({ path: p, pal: { base: '#aab7b0', mid: '#c8d2cc', dark: '#8c9aa0', rim: '#7a8794' }, id: 'mtn' }));
    // Land for every sub-area (the Coral Shallows are a lagoon on the sea, painted below). Palette comes from the sub-area's id or biome.
    for (const sub of World.SUBAREAS.slice().reverse()) {
      const id = sub.id;
      if (id === 'coral') continue;
      const b = id === 'meadow' ? [sub.bounds[0], sub.bounds[1], sub.bounds[2], World.CAMP.y + 15] : sub.bounds;
      landPaths[id] = blob(id, b, id === 'meadow' ? 40 : 46, 0.22);
      land.push({ path: landPaths[id], pal: BIOME[id] || BIOME[sub.biome] || BIOME.meadow, id, b });
    }
    // Coral: a lagoon wash on the sea, with small sand islets around each node.
    const coral = World.SUB_BY.coral;
    lagoonPath = blob('lagoon', coral.bounds, 38, 0.24);
    const isleLand = [];
    World.nodes.filter((n) => n.sub === 'coral').forEach((n, i) => {
      const p = blob('isle' + i, [n.x - 24, n.y - 16, n.x + 24, n.y + 16], 12, 0.4);
      islandPaths.push(p); isleLand.push({ path: p, pal: BIOME.coral, id: 'isle' + i, b: [n.x - 36, n.y - 28, n.x + 36, n.y + 28] });
    });
    // shore foam first
    for (const l of land.concat(isleLand)) {
      c.save(); c.strokeStyle = 'rgba(250,246,232,.7)'; c.lineWidth = 18; c.lineJoin = 'round'; c.stroke(l.path); c.restore();
    }
    for (let i = 0; i < 4; i++) { c.save(); c.translate((R() - 0.5) * 5, (R() - 0.5) * 5); c.fillStyle = rgba('#5fb1b8', 0.2); c.fill(lagoonPath); c.restore(); }
    c.save(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.stroke(lagoonPath); c.restore();
    for (let i = 0; i < 9; i++) { const x = coral.bounds[0] + R() * 300, y = coral.bounds[1] + R() * 265; line(c, x - 14, y, x + 14, y, 2, '#ffffff', 0.4, 3); }

    for (const l of land.concat(isleLand)) {
      const pal = l.pal, big = l.id !== 'mtn' && !l.id.startsWith('isle');
      for (let i = 0; i < 4; i++) { c.save(); c.translate((R() - 0.5) * 7, (R() - 0.5) * 7); c.globalAlpha = 0.34; c.fillStyle = pal.base; c.fill(l.path); c.restore(); }
      c.save(); c.clip(l.path);
      const b = l.b || [0, 0, 0, 0];
      if (l.id === 'mtn') {
        const mb = l.path === mountainPaths[0] ? MOUNTAINS[0] : MOUNTAINS[1];
        for (let i = 0; i < 26; i++) soft(c, mb[0] + R() * (mb[2] - mb[0]), mb[1] + R() * (mb[3] - mb[1]), 40 + R() * 60, 30 + R() * 40, R() > 0.5 ? pal.mid : pal.dark, 0.3);
      } else {
        const n = big ? 46 : 3;
        for (let i = 0; i < n; i++) soft(c, b[0] + R() * (b[2] - b[0]), b[1] + R() * (b[3] - b[1]), 30 + R() * 70, 22 + R() * 40, R() > 0.45 ? pal.mid : pal.dark, 0.3 + R() * 0.3);
        if (big) for (let i = 0; i < 16; i++) { const bx = b[0] + R() * (b[2] - b[0]), by = b[1] + R() * (b[3] - b[1]), br = 14 + R() * 30; c.strokeStyle = rgba(pal.dark, 0.16); c.lineWidth = 2.5; c.beginPath(); c.ellipse(bx, by, br, br * 0.7, R() * 3, 0, 7); c.stroke(); c.fillStyle = rgba(pal.dark, 0.06); c.fill(); }
      }
      c.strokeStyle = rgba(pal.rim, 0.5); c.lineWidth = 9; c.stroke(l.path);
      c.strokeStyle = rgba(pal.rim, 0.4); c.lineWidth = 3; c.stroke(l.path);
      c.restore();
      c.save(); c.strokeStyle = rgba(INK, 0.22); c.lineWidth = 1.1; c.lineJoin = 'round'; c.stroke(l.path); c.restore();
    }

    // Coral bridges: planks between the islets.
    for (const [a, b] of World.edges) {
      const A = World.byId[a], B = World.byId[b];
      if (A.sub === 'coral' && B.sub === 'coral') {
        brush(c, [[A.x, A.y], [B.x, B.y]], 11, '#c9a672', 0.8, 2);
        const L = Math.hypot(B.x - A.x, B.y - A.y), nx = (B.x - A.x) / L, ny = (B.y - A.y) / L;
        c.strokeStyle = rgba('#6a4a2a', 0.5); c.lineWidth = 1;
        for (let d = 4; d < L; d += 6) { c.beginPath(); c.moveTo(A.x + nx * d - ny * 5, A.y + ny * d + nx * 5); c.lineTo(A.x + nx * d + ny * 5, A.y + ny * d - nx * 5); c.stroke(); }
      }
    }

    // ----- Rivers -----
    for (const pts of RIVERS) for (let i = 0; i < pts.length - 1; i++) obstacles.push([{ x: pts[i][0], y: pts[i][1] }, { x: pts[i + 1][0], y: pts[i + 1][1] }, 20]);
    for (const pts of RIVERS) {
      const sm = []; for (let i = 0; i < pts.length - 1; i++) sm.push(...quad(pts[i][0], pts[i][1], pts[i][0] + (pts[i + 1][0] - pts[i][0]) / 2 + (i % 2 ? 8 : -8), pts[i][1] + (pts[i + 1][1] - pts[i][1]) / 2, pts[i + 1][0], pts[i + 1][1], 6));
      brush(c, sm, 34, '#e9f1ea', 0.5, 2);
      brush(c, sm, 26, '#8fb8c8', 0.55, 2);
      brush(c, sm, 18, '#6f9fba', 0.5, 2);
      brush(c, sm.map((p, i) => [p[0] + Math.sin(i) * 2, p[1] - 3]), 5, '#e8f4f6', 0.6);
      c.strokeStyle = rgba(INK, 0.3); c.lineWidth = 1;
      for (const off of [-13, 13]) { c.beginPath(); sm.forEach((p, i) => { const q = sm[Math.min(sm.length - 1, i + 1)], pr = sm[Math.max(0, i - 1)]; let dx = q[0] - pr[0], dy = q[1] - pr[1]; const l = Math.hypot(dx, dy) || 1; const X = p[0] - dy / l * off, Y = p[1] + dx / l * off; if (i) c.lineTo(X, Y); else c.moveTo(X, Y); }); c.stroke(); }
      riverPaths.push({ path: curve(sm), pts: sm });
    }
    // Wooden bridge where the road crosses the first river.
    c.save(); c.translate(BRIDGE.x, BRIDGE.y); c.rotate(0.04);
    c.fillStyle = rgba('#b88a58', 0.95); c.fillRect(-11, -26, 22, 52);
    c.strokeStyle = rgba('#5a3d22', 0.6); c.lineWidth = 1;
    for (let y = -24; y < 26; y += 5) { c.beginPath(); c.moveTo(-11, y); c.lineTo(11, y); c.stroke(); }
    c.strokeStyle = rgba(INK, 0.7); c.lineWidth = 1.6; c.strokeRect(-11, -26, 22, 52);
    for (const sx of [-12, 12]) for (const sy of [-24, 0, 24]) { c.fillStyle = '#4a3320'; c.fillRect(sx - 1.2, sy - 1.2, 2.4, 2.4); }
    c.restore();

    // ----- Region decorations -----
    const S = (id) => World.SUB_BY[id];
    // Mountains: layered misty peaks.
    scatter('mtn0', mountainPaths[0], MOUNTAINS[0], 24, 14, (p) => peak(c, p.x, p.y, 26 + p.r * 22, p.r > 0.35), 50);
    scatter('mtn1', mountainPaths[1], MOUNTAINS[1], 11, 12, (p) => peak(c, p.x, p.y, 22 + p.r * 16, p.r > 0.35), 50);
    scatter('mtnpine', mountainPaths[0], MOUNTAINS[0], 30, 12, (p) => pine(c, p.x, p.y, 5 + p.r * 3, p, '#4d6e68', '#9bb7a0', false), 50);

    // Meadow: grass tufts, flowers, round trees and sakura.
    const M = S('meadow'), mb = grow(M.bounds, 40);
    scatter('mgrass', landPaths.meadow, mb, 90, 10, (p) => { for (const d of [-3, 0, 3]) line(c, p.x + d, p.y, p.x + d * 1.8, p.y - 6 - p.r * 3, 1.6, '#6d9a52', 0.6, d); }, 26);
    scatter('mflower', landPaths.meadow, mb, 80, 10, (p) => { c.fillStyle = ['#fbf7ea', '#f1c75b', '#e9a1a8', '#b8a3d6'][Math.floor(p.r * 4)]; c.globalAlpha = 0.85; c.beginPath(); c.arc(p.x, p.y, 1.8, 0, 7); c.fill(); c.globalAlpha = 1; }, 26);
    scatter('mtree', landPaths.meadow, grow(M.bounds, 20), 16, 22, (p) => roundTree(c, p.x, p.y, 10 + p.r * 5, p, '#7da85a', '#a9cb78'));
    scatter('msakura', landPaths.meadow, grow(M.bounds, 20), 7, 24, (p) => sakura(c, p.x, p.y, 10 + p.r * 4, p));
    scatter('mpine', landPaths.meadow, grow(M.bounds, 30), 12, 22, (p) => pine(c, p.x, p.y, 9 + p.r * 4, p, '#4f7a5a', '#8fb67a', false));
    // Forest: pines, sakura, bamboo grove.
    const F = S('forest'), fb = grow(F.bounds, 40);
    scatter('fbamboo', landPaths.forest, [F.bounds[0] + 250, F.bounds[1] + 10, F.bounds[2] + 20, F.bounds[3] - 10], 14, 20, (p) => bamboo(c, p.x, p.y, 8 + p.r * 3, p));
    scatter('fpine', landPaths.forest, fb, 120, 14, (p) => pine(c, p.x, p.y, 9 + p.r * 6, p, p.q > 0.5 ? '#3f6a55' : '#4f7a5a', '#8fb67a', false));
    scatter('ftree', landPaths.forest, fb, 24, 18, (p) => roundTree(c, p.x, p.y, 10 + p.r * 5, p, '#6a9a58', '#9cc474'));
    scatter('fsakura', landPaths.forest, fb, 9, 22, (p) => sakura(c, p.x, p.y, 10 + p.r * 4, p));
    scatter('fgrass', landPaths.forest, fb, 40, 10, (p) => { for (const d of [-3, 0, 3]) line(c, p.x + d, p.y, p.x + d * 1.8, p.y - 6, 1.5, '#4f7a4a', 0.55, d); }, 26);
    // Beach: palms, shells, waves.
    const B = S('beach'), bb = grow(B.bounds, 40);
    scatter('bdune', landPaths.beach, bb, 22, 10, (p) => { brush(c, quad(p.x - 16, p.y, p.x, p.y - 8, p.x + 16, p.y, 6), 1.6, '#c9a672', 0.55); }, 26);
    scatter('bpalm', landPaths.beach, bb, 16, 20, (p) => palm(c, p.x, p.y, 10 + p.r * 6));
    scatter('bshell', landPaths.beach, bb, 40, 8, (p) => { c.fillStyle = p.r > 0.5 ? '#eaa8a0' : '#d8c08a'; c.globalAlpha = 0.8; c.beginPath(); c.ellipse(p.x, p.y, 2.4, 1.6, p.q, 0, 7); c.fill(); c.globalAlpha = 1; }, 26);
    World.nodes.filter((n) => n.sub === 'coral').forEach((n, i) => palm(c, n.x + (i % 2 ? 24 : -26), n.y + 4, 11));
    scatter('coralreef', lagoonPath, grow(coral.bounds, 30), 70, 12, (p) => {
      c.globalAlpha = 0.6; c.strokeStyle = ['#e9877f', '#f0b26a', '#d86f93'][Math.floor(p.r * 3)]; c.lineWidth = 1.6; c.lineCap = 'round';
      for (const d of [-3, 0, 3]) { c.beginPath(); c.moveTo(p.x + d, p.y); c.lineTo(p.x + d * 1.5, p.y - 5 - p.q * 4); c.stroke(); }
      c.globalAlpha = 1; c.lineCap = 'butt';
    }, 26);
    // Dunes & temple.
    const D = S('dunes'), db = grow(D.bounds, 40);
    scatter('dune', landPaths.dunes, db, 34, 10, (p) => { const s = 18 + p.r * 14; soft(c, p.x + 4, p.y + 3, s * 0.9, s * 0.25, '#b9823e', 0.28); brush(c, quad(p.x - s, p.y + 6, p.x - s * 0.1, p.y - s * 0.55, p.x + s, p.y + 6, 8), 2, '#a8743a', 0.6); }, 30);
    scatter('cactus', landPaths.dunes, grow(D.bounds, 30), 12, 16, (p) => cactus(c, p.x, p.y, 8 + p.r * 4));
    scatter('drock', landPaths.dunes, db, 8, 14, (p) => rock(c, p.x, p.y, 5 + p.r * 4, '#c79a62', '#e8cfa0'));
    const Tm = S('temple'), tb = grow(Tm.bounds, 30);
    scatter('pyramids', landPaths.temple, tb, 5, 30, (p) => {
      const s = 22 + p.r * 14; soft(c, p.x + 8, p.y + 2, s * 1.3, s * 0.28, '#6a4a2a', 0.25);
      c.globalAlpha = 0.9; c.fillStyle = '#e4bf80'; c.beginPath(); c.moveTo(p.x - s, p.y); c.lineTo(p.x - s * 0.05, p.y - s * 0.95); c.lineTo(p.x + s * 0.2, p.y); c.closePath(); c.fill();
      c.fillStyle = '#c0885a'; c.beginPath(); c.moveTo(p.x - s * 0.05, p.y - s * 0.95); c.lineTo(p.x + s, p.y); c.lineTo(p.x + s * 0.2, p.y); c.closePath(); c.fill(); c.globalAlpha = 1;
      c.strokeStyle = rgba(INK, 0.6); c.lineWidth = 1.2; c.beginPath(); c.moveTo(p.x - s, p.y); c.lineTo(p.x - s * 0.05, p.y - s * 0.95); c.lineTo(p.x + s, p.y); c.closePath(); c.stroke();
    }, 56);
    scatter('columns', landPaths.temple, tb, 16, 14, (p) => { const h = 8 + p.r * 12; brush(c, [[p.x, p.y], [p.x, p.y - h]], 5, '#efd9ab', 0.95, 2); brush(c, [[p.x - 4, p.y - h - 1], [p.x + 4, p.y - h - 1]], 2.4, '#b88a58', 0.9, 2); line(c, p.x + 1.8, p.y, p.x + 1.8, p.y - h, 1.2, '#a8744a', 0.4, 0); });
    scatter('tdune', landPaths.temple, tb, 16, 10, (p) => brush(c, quad(p.x - 16, p.y, p.x, p.y - 7, p.x + 16, p.y, 6), 1.6, '#a8744a', 0.5), 28);
    // Snow & glacier.
    const Sn = S('snow'), sb = grow(Sn.bounds, 40);
    scatter('smound', landPaths.snow, sb, 30, 12, (p) => { soft(c, p.x, p.y + 3, 18 + p.r * 14, 6, '#9cb4c6', 0.38); soft(c, p.x, p.y, 16 + p.r * 12, 6, '#ffffff', 0.7); }, 28);
    scatter('spine', landPaths.snow, sb, 70, 14, (p) => pine(c, p.x, p.y, 8 + p.r * 5, p, '#3d6560', '#7fa8a0', true));
    const Gl = S('frozen'), gb = grow(Gl.bounds, 40);
    scatter('ice', landPaths.frozen, gb, 44, 12, (p) => {
      const s = 7 + p.r * 11;
      c.globalAlpha = 0.85; c.fillStyle = '#9ec6e2'; c.beginPath(); c.moveTo(p.x, p.y - s * 1.9); c.lineTo(p.x + s * 0.55, p.y); c.lineTo(p.x - s * 0.55, p.y); c.closePath(); c.fill();
      c.fillStyle = '#ffffff'; c.globalAlpha = 0.7; c.beginPath(); c.moveTo(p.x, p.y - s * 1.9); c.lineTo(p.x - s * 0.55, p.y); c.lineTo(p.x - s * 0.08, p.y); c.closePath(); c.fill(); c.globalAlpha = 1;
      c.strokeStyle = rgba('#3d5a80', 0.55); c.lineWidth = 1; c.beginPath(); c.moveTo(p.x - s * 0.55, p.y); c.lineTo(p.x, p.y - s * 1.9); c.lineTo(p.x + s * 0.55, p.y); c.stroke();
    });
    scatter('cracks', landPaths.frozen, grow(Gl.bounds, 30), 18, 8, (p) => { brush(c, [[p.x, p.y], [p.x + 8, p.y + 2 - p.r * 8], [p.x + 18, p.y + 2]], 1.5, '#5d86ab', 0.5); }, 28);
    // Ash & caldera.
    const A = S('ash'), ab = grow(A.bounds, 40);
    scatter('ashpool', landPaths.ash, ab, 20, 12, (p) => soft(c, p.x, p.y, 20 + p.r * 18, 8, '#5d5450', 0.3), 28);
    scatter('arock', landPaths.ash, ab, 40, 10, (p) => rock(c, p.x, p.y, 4 + p.r * 7, '#5f5652', '#9a8f88'));
    scatter('adead', landPaths.ash, grow(A.bounds, 30), 16, 14, (p) => { brush(c, [[p.x, p.y], [p.x, p.y - 15]], 2.4, '#2f2825', 0.85, 1); line(c, p.x, p.y - 8, p.x + 7, p.y - 14, 1.5, '#2f2825', 0.8, 0); line(c, p.x, p.y - 11, p.x - 6, p.y - 17, 1.5, '#2f2825', 0.8, 0); });
    const cal = S('caldera'), LR = R0('lava');
    for (let i = 0; i < 4; i++) {
      const pts = []; let x = cal.bounds[0] + 40 + LR() * (cal.bounds[2] - cal.bounds[0] - 80), y = cal.bounds[1] + 10;
      while (y < cal.bounds[3] + 20) { pts.push([x, y]); x += (LR() - 0.5) * 50; y += 26; }
      lava.push(pts);
    }
    c.save(); c.clip(landPaths.caldera);
    for (const pts of lava) {
      const sm = []; for (let i = 0; i < pts.length - 1; i++) sm.push(...quad(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2 + 6, (pts[i][1] + pts[i + 1][1]) / 2, pts[i + 1][0], pts[i + 1][1], 5));
      brush(c, sm, 18, '#2a1b1a', 0.55, 2); brush(c, sm, 11, '#c9452a', 0.85, 2); brush(c, sm, 5, '#f4a23c', 0.9, 2);
      obstacles.push(...pts.slice(0, -1).map((p, i) => [{ x: p[0], y: p[1] }, { x: pts[i + 1][0], y: pts[i + 1][1] }, 14]));
    }
    c.restore();
    scatter('volcano', landPaths.caldera, grow(cal.bounds, 10), 3, 40, (p) => {
      const s = 34 + p.r * 14;
      soft(c, p.x + 6, p.y + 2, s * 1.2, s * 0.25, '#1a1010', 0.3);
      c.globalAlpha = 0.88; c.fillStyle = '#4a3532'; c.beginPath(); c.moveTo(p.x - s, p.y); c.quadraticCurveTo(p.x - s * 0.4, p.y - s * 0.7, p.x - s * 0.22, p.y - s); c.lineTo(p.x + s * 0.22, p.y - s); c.quadraticCurveTo(p.x + s * 0.4, p.y - s * 0.7, p.x + s, p.y); c.closePath(); c.fill();
      c.fillStyle = '#2a1b1a'; c.globalAlpha = 0.5; c.beginPath(); c.moveTo(p.x + s * 0.22, p.y - s); c.quadraticCurveTo(p.x + s * 0.4, p.y - s * 0.7, p.x + s, p.y); c.lineTo(p.x + s * 0.3, p.y); c.closePath(); c.fill(); c.globalAlpha = 1;
      c.fillStyle = '#f08a35'; c.beginPath(); c.ellipse(p.x, p.y - s, s * 0.24, s * 0.07, 0, 0, 7); c.fill();
      brush(c, quad(p.x - 2, p.y - s, p.x - s * 0.2, p.y - s * 0.6, p.x - s * 0.34, p.y - s * 0.2, 6), 3.4, '#e8592a', 0.85, 1);
      soft(c, p.x, p.y - s * 1.35, s * 0.5, s * 0.35, '#8a7770', 0.35);
    }, 56);
    scatter('crock', landPaths.caldera, grow(cal.bounds, 30), 26, 10, (p) => rock(c, p.x, p.y, 4 + p.r * 6, '#3a2c2a', '#7a625c'));

    // Brushed torii gates behind each boss.
    for (const sub of World.SUBAREAS) { const bn = World.byId[sub.id + '-boss']; c.globalAlpha = 0.6; torii(c, bn.x, bn.y - 14, 60); c.globalAlpha = 1; }

    // ----- Sea marks: wave curls and tiny sails of foam -----
    const R2 = R0('waves'), allLand = land.map((l) => l.path).concat(isleLand.map((l) => l.path), [lagoonPath]);
    let curls = 0;
    for (let i = 0; i < 4000 && curls < 70; i++) {
      const x = R2() * MAP_W, y = R2() * H2;
      if (allLand.some((p) => hit.isPointInPath(p, x, y))) continue;
      curls++;
      c.strokeStyle = rgba('#3d5a80', 0.35); c.lineWidth = 1.4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x - 10, y + 2); c.quadraticCurveTo(x - 4, y - 7, x + 3, y - 2); c.quadraticCurveTo(x + 7, y + 1, x + 5, y - 3); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(x - 14, y + 5); c.lineTo(x + 12, y + 5); c.stroke(); c.lineCap = 'butt';
      if (water.length < 70) water.push({ x, y: y - 2, ph: R2() * 6 });
    }

    // ----- Mist between regions -----
    for (const sub of World.SUBAREAS) {
      const b = sub.bounds;
      for (let x = b[0] - 20; x < b[2] + 30; x += 70) soft(c, x + R() * 20, b[1] - 6 + R() * 18, 60 + R() * 30, 12 + R() * 8, '#f6f0e0', 0.42);
    }
    for (let i = 0; i < 22; i++) soft(c, 300 + R() * 400, 620 + R() * 500, 90, 16, '#f3eee0', 0.35);
    for (let i = 0; i < 8; i++) soft(c, 480 + R() * 80, 40 + R() * 560, 80, 16, '#f3eee0', 0.4);
    // Edge vignette of washi paper.
    const edge = (x, y, w, h, x0, y0, x1, y1) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(169,198,203,.95)'); g.addColorStop(1, 'rgba(169,198,203,0)'); c.fillStyle = g; c.fillRect(x, y, w, h); };
    edge(0, 0, MAP_W, 50, 0, 0, 0, 50); edge(0, H2 - 50, MAP_W, 50, 0, H2, 0, H2 - 50); edge(0, 0, 50, H2, 0, 0, 50, 0); edge(MAP_W - 50, 0, 50, H2, MAP_W, 0, MAP_W - 50, 0);
    // Granulation: grain multiplied over the pigments.
    c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.55; c.fillStyle = pat; c.fillRect(0, 0, MAP_W, H2); c.restore();
  }

  function buildTerrain() {
    if (terrain) return;
    TS = dpr > 1 ? 2 : 1.4;
    terrain = document.createElement('canvas');
    terrain.width = Math.round(World.MAP_W * TS); terrain.height = Math.round((World.MAP_H + EXT) * TS);
    const c = terrain.getContext('2d');
    c.scale(TS, TS);
    paintTerrain(c);
    initFog();
    setTimeout(ensureLo, 800);
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
    for (const sub of World.SUBAREAS) if (unlocked(sub.id) && landPaths[sub.id] && hit.isPointInPath(landPaths[sub.id], x, y)) return true;
    if (unlocked('coral') && lagoonPath && hit.isPointInPath(lagoonPath, x, y)) return true;
    const p = { x, y };
    for (const [a, b] of World.edges) { const A = World.byId[a], B = World.byId[b]; if (visibleNode(A) && visibleNode(B) && segDist(p, A, B) < 14) return true; }
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
  const fogPuffs = {};
  function initFog() {
    for (const sub of World.SUBAREAS) {
      const R = R0('fog:' + sub.id), b = grow(sub.bounds, 22), puffs = [], strokes = [];
      for (let y = b[1]; y <= b[3]; y += 30) for (let x = b[0]; x <= b[2]; x += 34) {
        const px = x + (R() - 0.5) * 24, py = y + (R() - 0.5) * 24;
        if (landPaths[sub.id] && !hit.isPointInPath(landPaths[sub.id], px, py)) continue;
        puffs.push({ x: px, y: py, r: 40 + R() * 30, ph: R() * 6 });
      }
      for (let i = 0; i < 6; i++) strokes.push({ x: b[0] + R() * (b[2] - b[0]), y: b[1] + R() * (b[3] - b[1]), w: 70 + R() * 70, ph: R() * 6, sp: 3 + R() * 4 });
      fogPuffs[sub.id] = { puffs, strokes };
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
      if (z * dpr < 0.95) { ensureLo(); src = terrainLo; k = LO; }
      ctx.drawImage(src, sx0 * k, sy0 * k, (sx1 - sx0) * k, (sy1 - sy0) * k, sx0, sy0, sx1 - sx0, sy1 - sy0);
    }
    const e = ease(ovT), detail = clamp01(1 - e * 2.2), marks = clamp01(e * 2.2 - 0.3);

    drawWater();
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
  function clearSpot(key, subs, dir) {
    if (labelCache[key]) return labelCache[key];
    const x0 = Math.min(...subs.map((s) => s.bounds[0])) + 70, x1 = Math.max(...subs.map((s) => s.bounds[2])) - 70;
    const y0 = Math.min(...subs.map((s) => s.bounds[1])) + 10, y1 = Math.max(...subs.map((s) => s.bounds[3])) - 10;
    let best = null;
    for (let y = y0; y <= y1; y += 12) for (let x = x0; x <= x1; x += 12) {
      let clear = 999;
      for (const n of World.nodes) clear = Math.min(clear, Math.hypot((n.x - x) * 0.55, n.y - 8 - y) - (n.type === 'boss' ? 62 : 44));
      for (const [a, b] of World.edges) clear = Math.min(clear, segDist({ x, y }, World.byId[a], World.byId[b]) - 12);
      for (const k in labelCache) clear = Math.min(clear, Math.hypot((labelCache[k].x - x) * 0.4, labelCache[k].y - y) - 26);
      const score = Math.min(clear, 26) + (dir < 0 ? y0 - y : y - y1) * 0.02;
      if (!best || score > best.score) best = { x, y, score };
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
      const at = clearSpot('sub:' + sub.id, [sub], 1);
      if (inView(at.x, at.y, 120)) {
        const px = 12 - e * 1.6, w = (sub.name.length * px * 0.5) / z;
        inkText(sub.name, Math.max(w / 2 + 14, Math.min(World.MAP_W - w / 2 - 14, at.x)), at.y, px, 0.9 * (1 - (fogA[sub.id] || 0)), 600, true);
      }
      if (!done.has(sub.region)) {
        done.add(sub.region);
        const subs = World.SUBAREAS.filter((s) => s.region === sub.region);
        const rx = (Math.min(...subs.map((s) => s.bounds[0])) + Math.max(...subs.map((s) => s.bounds[2]))) / 2;
        const ry = (Math.min(...subs.map((s) => s.bounds[1])) + Math.max(...subs.map((s) => s.bounds[3]))) / 2;
        if (e > 0.15) inkText(sub.region.toUpperCase(), Math.max(120, Math.min(World.MAP_W - 120, rx)), ry, 19, clamp01((e - 0.15) * 2) * 0.5, 700, false);
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
      const fp = fogPuffs[sub.id]; if (!fp) continue;
      ctx.globalAlpha = a * 0.75;
      for (const p of fp.puffs) { const dx = Math.sin(T * 0.25 + p.ph) * 7, r = p.r * 1.05; ctx.drawImage(shadeSprite, p.x + dx + 3 - r, p.y + 12 - r, r * 2, r * 2); }
      ctx.globalAlpha = a * 0.93;
      for (const p of fp.puffs) { const dx = Math.sin(T * 0.25 + p.ph) * 7, dy = Math.cos(T * 0.2 + p.ph) * 3, r = p.r * (1 + Math.sin(T * 0.4 + p.ph) * 0.04); ctx.drawImage(mistSprite, p.x + dx - r, p.y + dy - r, r * 2, r * 2); }
      // brushed ink-wash drifts on the mist
      ctx.globalAlpha = a * 0.5;
      for (const q of fp.strokes) { const x = q.x + Math.sin(T * 0.15 + q.ph) * q.sp * 3; ctx.drawImage(shadeSprite, x - q.w, q.y - 7, q.w * 2, 14); }
      // painted sign: a brushed padlock, the area name and what unlocks it (drawn in screen-size units)
      const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, u = 1 / z;
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
