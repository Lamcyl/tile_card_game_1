// World map UI over the tile world (WP20): camera, hero token, nodes, taps, fog notes, overview and the public WorldMap API.
//
// The ground, props, gates and fog are drawn by TileMap (js/tilemap.js, chunked tile atlases); walking uses WorldNav (js/world-nav.js,
// A* on the tile grid). World units: 1 tile = 64 units; y is negative north of the Camp. Nodes (enemies, shops, ...) come from
// window.World (js/world-data.js, generated positions). Drawn here on top of the tiles: danger rings, monsters, hero, markers,
// labels, closed-gate seals, weather and the HUD arrow.
(function () {
  'use strict';
  const World = window.World;
  const canvas = document.getElementById('map');
  const ctx = canvas.getContext('2d');
  const VIEW = 347;      // world units across the screen width at the default exploration zoom
  const FOCUS_Y = 0.36;  // focused points sit this far down the screen, above the bottom sheet
  const HERO_OFF = { x: 20, y: 14 }; // the hero stands beside a node, not on the monster
  const OV_TOP = 74, OV_BOT = 0.655;   // the overview fits between the HUD and the bottom sheet
  let ovCy = 0, ovTy = 0;
  const UZ_MIN = 0.5, UZ_MAX = 1.3;  // pinch / ctrl-wheel zoom range around the default

  const INK = '#2b3445', PAPER = '#f4ecd7', VERM = '#c8402f', INDIGO = '#3d5a80';

  let vw = 0, vh = 0, dpr = 1;
  let zBase = 1, uz = 1, zIn = 1, zOv = 0.04;   // zoom: default / user factor / exploring / overview
  let z = 1, vx = 0, vy = 0;                    // effective zoom and view centre this frame
  const cam = { x: World.CAMP.x, y: World.CAMP.y - 200 };
  let follow = null;                 // {x, y} the camera eases toward
  let st = { save: null, run: null, frontier: new Set(), selected: null };
  const token = { x: World.CAMP.x + HERO_OFF.x, y: World.CAMP.y + HERO_OFF.y, walk: null, face: 1, stride: 0 };
  const prints = [];                 // fading footprints
  let dest = null;                   // free-roam destination mark
  let onTap = () => {}, onHero = () => {};
  const lastSight = { x: -1e9, y: -1e9 };   // where the hero last revealed the fog
  let active = true;
  let T = 0, frameNo = 0;
  let ovOn = false, ovT = 0;         // overview target and animated progress 0..1
  let ovBtn = null;
  const perf = { frameMs: 0, frames: 0, worst: 0, lastWorld: 0 };

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const rgbCache = {};
  function rgb(hex) {
    if (rgbCache[hex]) return rgbCache[hex];
    const n = parseInt(hex.slice(1), 16);
    return (rgbCache[hex] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]);
  }
  const rgba = (hex, a) => { const c = rgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };

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
  Object.assign(PAL, {
    bamboo:   { base: '#a8c984', mid: '#cde0a0', dark: '#7aa66a', band: '#d9e8b8' },
    coral:    { base: '#8fd8d0', mid: '#c4f0e6', dark: '#56b8c0', band: '#e8f6e2' },
    isles:    { base: '#efdfb2', mid: '#f8efd0', dark: '#dcc690', band: '#f8efd2' },
    canyon:   { base: '#d9946a', mid: '#e8b88c', dark: '#b2603e', band: '#f0cfa6' },
    glacier:  { base: '#cfe4f0', mid: '#eaf5fa', dark: '#9cc0da', band: '#eef6fa' },
    lavafall: { base: '#6a4f4c', mid: '#8c6a62', dark: '#3c2a29', band: '#5a4340' },
    high:     { base: '#aebfa2', mid: '#cbd8bb', dark: '#8da187', band: '#d6e0c8' },
  });
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
  function torii(c, x, y, s) {
    const col = '#c8402f';
    brush(c, [[x - s * 0.62, y], [x - s * 0.6, y - s * 1.0]], s * 0.1, col, 0.85, 2);
    brush(c, [[x + s * 0.62, y], [x + s * 0.6, y - s * 1.0]], s * 0.1, col, 0.85, 2);
    brush(c, quad(x - s * 0.82, y - s * 1.12, x, y - s * 0.98, x + s * 0.82, y - s * 1.12, 8), s * 0.13, '#2b2530', 0.85, 2);
    brush(c, quad(x - s * 0.7, y - s * 0.84, x, y - s * 0.82, x + s * 0.7, y - s * 0.84, 8), s * 0.07, col, 0.85, 2);
  }
  const curve = (pts) => { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) { const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; p.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); } p.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); return p; };

  function inkText(txt, x, y, px, alpha, weight, italic) {
    const fs = px / z;
    ctx.font = (italic ? 'italic ' : '') + weight + ' ' + fs + 'px "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
    ctx.globalAlpha = alpha * 0.85; ctx.lineWidth = fs * 0.28; ctx.strokeStyle = PAPER; ctx.strokeText(txt, x, y);
    ctx.globalAlpha = alpha; ctx.fillStyle = INK; ctx.fillText(txt, x, y);
    ctx.globalAlpha = alpha * 0.55; ctx.strokeStyle = VERM; ctx.lineWidth = fs * 0.07; ctx.beginPath(); const w = ctx.measureText(txt).width; ctx.moveTo(x - w * 0.5, y + fs * 0.2); ctx.quadraticCurveTo(x, y + fs * 0.28, x + w * 0.5, y + fs * 0.16); ctx.stroke();
    ctx.globalAlpha = 1;
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
      const sl = document.createElement('canvas'); sl.width = sl.height = S; const sc = sl.getContext('2d');   // WP14: unscouted spots are drawn as ink silhouettes
      sc.drawImage(a, 0, 0); sc.globalCompositeOperation = 'source-in'; sc.fillStyle = '#56667a'; sc.fillRect(0, 0, S, S);
      m.color = a; m.grey = g; m.sil = sl;
    };
    img.src = url;
    return m;
  }
  const HALO = { forest: 0.18, bamboo: 0.1, ruins: 0.2, erg: 0.42, saltmirror: 0.62, bazaar: 0.5, citadel: 0.55 };
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

  // ================================================================================================
  //  Tile world (WP20): ground, props, gates and fog come from TileMap (js/tilemap.js); navigation from WorldNav (js/world-nav.js).
  //  This file keeps the camera, the hero, the nodes, taps and the UI drawn over the tiles.
  // ================================================================================================
  const WG = World.GEN, TM = window.TileMap, WN = window.WorldNav, TS = 64;
  const BOX = World.MAP_BOX, MAP_W = World.MAP_W, MAP_H = World.MAP_H;
  const NODES = World.nodes;
  const SUBIDS = World.SUBAREAS.map((s) => s.id);
  const FOG_TINT = '#dcdcd4';
  const startOf = Object.fromEntries(WG.regions.map((r) => [r.id, r.startSub]));
  const centreOfBox = [(BOX[0] + BOX[2]) / 2, (BOX[1] + BOX[3]) / 2];

  // Per sub-area: a walkable cell near the centre of mass (labels, fog notes).
  const SUBINFO = {};
  for (const q of WN.regions) {
    const sum = {};
    for (let i = 0; i < q.sub.length; i++) { const v = q.sub[i]; if (!v) continue; const id = q.r.subIds[v - 1], s = sum[id] || (sum[id] = { x: 0, y: 0, n: 0 }); s.x += i % q.N; s.y += Math.floor(i / q.N); s.n++; }
    for (const id in sum) {
      const s = sum[id], mx = s.x / s.n, my = s.y / s.n; let best = null, bd = 1e9;
      for (let i = 0; i < q.sub.length; i++) { if (q.r.subIds[q.sub[i] - 1] !== id || q.blocked[i]) continue; const d = Math.pow(i % q.N - mx, 2) + Math.pow(Math.floor(i / q.N) - my, 2); if (d < bd) { bd = d; best = i; } }
      SUBINFO[id] = { center: [(q.ox + best % q.N + 0.5) * TS, (q.oy + Math.floor(best / q.N) + 0.5) * TS] };
    }
  }
  // Gates: the tile prop of a link between two sub-areas (or a region exit / a Camp stub), keyed by its anchor cell.
  const GATES = [], gateOf = new Map();
  for (const r of WG.regions) for (const g of r.gates) {
    const gt = { g, target: g.to || (g.region && startOf[g.region]) || null, x: (g.prop.x + 1) * TS, y: (g.prop.y + 1) * TS - 36 };
    GATES.push(gt); gateOf.set(g.prop.x + ',' + g.prop.y, gt);
  }
  const gateCell = new Map(); for (const gt of GATES) for (const [x, y] of gt.g.cells) gateCell.set(x + ',' + y, gt);
  // Overview: the whole world as a tiny picture, 2 px per tile, rebuilt when the fog changes.
  const BIOME_COL = { meadow: '#b9d28a', forest: '#7fa56a', coral: '#8fc3c4', marsh: '#86ad8c', highlands: '#a9b8a0', dunes: '#e4c98a', saltflat: '#ebe6d8', canyon: '#d49a6a', temple: '#d9b878' };
  const OVK = 2;
  let ovImg = null, ovSig = '';
  function buildOverview() {
    const sig = st.save ? st.save.unlocked.join() : '';
    if (ovImg && sig === ovSig) return; ovSig = sig;
    const w = Math.round(MAP_W / TS * OVK), h = Math.round(MAP_H / TS * OVK);
    if (!ovImg) { ovImg = document.createElement('canvas'); ovImg.width = w; ovImg.height = h; }
    const g = ovImg.getContext('2d'), img = g.createImageData(w, h), sea = rgb('#a9c6cb'), ox = BOX[0] / TS, oy = BOX[1] / TS;
    for (let i = 0; i < img.data.length; i += 4) { img.data[i] = sea[0]; img.data[i + 1] = sea[1]; img.data[i + 2] = sea[2]; img.data[i + 3] = 255; }
    for (const q of WN.regions) {
      const cols = {};
      q.r.subIds.forEach((id) => { const sub = World.SUB_BY[id], lock = id !== 'camp' && !unlocked(id); const b = rgb(lock ? FOG_TINT : (sub ? BIOME_COL[sub.biome] : null) || '#cfd8c0'); cols[id] = [b, b.map((v) => Math.round(v * 0.62 + 40))]; });
      for (let y = 0; y < q.N; y++) for (let x = 0; x < q.N; x++) {
        const k = y * q.N + x, v = q.sub[k]; let c;
        if (v) c = cols[q.r.subIds[v - 1]][q.blocked[k] ? 1 : 0]; else if (!q.blocked[k]) c = [226, 214, 180]; else continue;
        for (let dy = 0; dy < OVK; dy++) for (let dx = 0; dx < OVK; dx++) { const o = (((q.oy + y - oy) * OVK + dy) * w + (q.ox + x - ox) * OVK + dx) * 4; img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; }
      }
    }
    g.putImageData(img, 0, 0);
  }
  const gateOpenNow = (gt) => !gateClosed(gt);
  function gateClosed(gt) { return gt.target ? !subOpen(gt.target) : !!gt.g.stub && gt.g.stub !== 'N'; }
  TM.setFog((id) => id !== 'camp' && !unlocked(id));
  TM.setGateState((q, p) => { const gt = gateOf.get((q.ox + p.x) + ',' + (q.oy + p.y)); return !gt || gateOpenNow(gt); });
  let fogSig = '';
  Promise.all(WG.regions.map((r) => TM.load(r.id))).then(() => { ready = true; });
  let ready = false;

  function bossNameFor(id) {
    const s = World.SUB_BY[id]; let from = s && s.from;
    if (!from || !World.THEMES[from]) { const p = World.SUBAREAS.find((a) => a.unlocks && a.unlocks.includes(id)); from = p && p.id; }
    return from && World.THEMES[from] ? World.THEMES[from].boss[0] : 'the guardian';
  }
  // Fog itself is drawn by TileMap (fog tiles); this adds the name of each locked area and the boss that opens it.
  function drawFogLabels() {
    const eo = ease(ovT);
    for (const id of SUBIDS) {
      if (unlocked(id) || !SUBINFO[id]) continue;
      const [cx, cy] = SUBINFO[id].center; if (!inView(cx, cy, 240)) continue;
      const sc = World.SUB_BY[id], u = 1 / z, ls = 1 - 0.45 * eo, a = 1;
      if (eo < 0.5) { ctx.save(); ctx.translate(cx, cy); ctx.scale(u * ls, u * ls); ctx.globalAlpha = a;
      ctx.fillStyle = INDIGO; ctx.beginPath(); ctx.rect(-9, -30, 18, 14); ctx.fill();
      ctx.strokeStyle = INDIGO; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -31, 6, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(0, -24, 2, 0, 7); ctx.fill();
      ctx.restore(); }
      if (eo > 0.5) { ovName(sc ? sc.name : id, cx, cy, 8.6, a * clamp01((eo - 0.5) * 3)); }
      else {
        inkText(sc ? sc.name : id, cx, cy + 4 * u * ls, 15 - 5 * eo, a, 700, true);
        const prev = sc && sc.from, frontier = !prev || prev === 'camp' || unlocked(prev);
        if (eo < 0.3 || frontier) inkText('Defeat ' + bossNameFor(id), cx, cy + 24 * u * ls, 11.5 - 3 * eo, a * 0.9, 500, true);
      }
      ctx.globalAlpha = 1;
    }
  }

  // Per-run gates: a gate to an area that is unlocked but still closed on this run keeps its sealed sprite; a vermilion seal tag and a
  // note name the boss that opens it.
  function drawClosed() {
    if (!st.run || !st.save) return;
    const eo = ease(ovT);
    for (const gt of GATES) {
      if (!gt.target || !closedSub(gt.target)) continue;
      if (!inView(gt.x, gt.y, 120)) continue;
      const u = 1 / z, ls = 1 - 0.4 * eo, sx = gt.x, sy = gt.y;
      ctx.save(); ctx.translate(sx, sy); ctx.scale(u * ls, u * ls); ctx.globalAlpha = 1;
      ctx.strokeStyle = '#4a3a2e'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-26, 10); ctx.quadraticCurveTo(0, 20, 26, 10); ctx.stroke();
      ctx.strokeStyle = '#6a2a1c'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(0, 24); ctx.stroke();
      ctx.fillStyle = VERM; ctx.strokeStyle = '#7a1f18'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.rect(-11, 24, 22, 24); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#fbeadb'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, 31); ctx.lineTo(6, 31); ctx.moveTo(0, 31); ctx.lineTo(0, 42); ctx.moveTo(-5, 37); ctx.lineTo(5, 37); ctx.stroke();
      ctx.restore();
      if (eo < 0.5) inkText('Defeat ' + bossNameFor(gt.target) + ' this run', sx, sy + 66 * u * ls, 11.5, 1 - eo * 2, 600, true);
    }
    ctx.globalAlpha = 1;
  }

  // ================================================================================================
  //  Frame
  // ================================================================================================
  const unlocked = (sub) => !st.save || st.save.unlocked.includes(sub);
  // Per-run gates: during a run only the sub-areas in run.open can be entered (fog stays lifted for every area ever unlocked).
  const runOpen = (sub) => !st.run || !st.save || (st.run.open || st.save.unlocked).includes(sub);
  const closedSub = (sub) => unlocked(sub) && !runOpen(sub);
  const subOpen = (sub) => unlocked(sub) && runOpen(sub);
  // WP14: hidden Sealed Caches only exist on the map once found; ordinary / elite spots outside the hero's sight are faint silhouettes until scouted.
  let seenSet = new Set(), secretSet = new Set();
  const visibleNode = (n) => n.type === 'camp' || (unlocked(n.sub) && (n.type !== 'secret' || secretSet.has(n.id)));
  const scoutLv = () => (st.save && st.save.upgrades && st.save.upgrades.scouting) || 0;
  const nodeSeen = (n) => !World.FOGGED.includes(n.type) || !st.save || seenSet.has(n.id) || scoutLv() >= 3 || (!!st.run && st.run.cleared.includes(n.id));
  function clampCam() {
    const hw = vw / 2 / zIn, hh2 = vh / 2 / zIn;
    cam.x = Math.max(BOX[0] + hw - 160, Math.min(BOX[2] - hw + 160, cam.x));
    cam.y = Math.max(BOX[1] + hh2 - 160, Math.min(BOX[3] - hh2 + vh * 0.45 / zIn, cam.y));
  }
  const ease = (t) => t * t * (3 - 2 * t);
  const ZMAP = { meadow: 'petal', forest: 'petal', coral: 'petal', marsh: 'petal', highlands: 'petal', dunes: 'sand', saltflat: 'sand', canyon: 'sand', temple: 'sand', snow: 'snow', glacier: 'snow', ash: 'ember', caldera: 'ember' };
  let wKind = null, wA = 0;
  let banner = { id: null, t: -9 };

  function frame(now) {
    if (!active) return;
    const t0 = performance.now();
    const dt = Math.min(0.05, (now - (frame.last || now)) / 1000); frame.last = now; T += dt; frameNo++;
    stepToken(dt);
    if (Math.hypot(token.x - lastSight.x, token.y - lastSight.y) > 40) { lastSight.x = token.x; lastSight.y = token.y; onHero(token.x, token.y); }
    zIn = zBase * uz;
    if (follow) { cam.x += (follow.x - cam.x) * Math.min(1, dt * 5); cam.y += (follow.y - cam.y) * Math.min(1, dt * 5); }
    clampCam();
    ovT = Math.max(0, Math.min(1, ovT + (ovOn ? 1 : -1) * dt * 2.6));
    const e = ease(ovT);
    z = zIn * Math.pow(zOv / zIn, e);
    vx = cam.x + (centreOfBox[0] - cam.x) * e; vy = cam.y + (ovTy - cam.y) * e;
    X0 = vx - vw / 2 / z; Y0 = vy - vh / 2 / z; WW = vw / z; WH = vh / z;
    { const sg = st.save ? st.save.unlocked.join() : ''; if (sg !== fogSig) { fogSig = sg; TM.refreshFog(); } }
    for (let i = prints.length - 1; i >= 0; i--) if (T - prints[i].t > 7) prints.splice(i, 1);
    const td = performance.now(); draw(now, dt); perf.lastDraw = performance.now() - td;
    perf.frames++; const ms = performance.now() - t0; perf.frameMs += ms; if (ms > perf.worst) perf.worst = ms;
    requestAnimationFrame(frame);
  }

  let X0 = 0, Y0 = 0, WW = 1, WH = 1;
  const inView = (x, y, m) => x > X0 - m && x < X0 + WW + m && y > Y0 - m && y < Y0 + WH + m;

  function draw(now, dt) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#a9c6cb'; ctx.fillRect(0, 0, vw, vh);
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (vw / 2 - vx * z), dpr * (vh / 2 - vy * z));
    const e = ease(ovT), detail = clamp01(1 - e * 2.2), marks = clamp01(e * 2.2 - 0.3);
    if (e > 0.02) { buildOverview(); }
    const world0 = performance.now();
    if (ready && e < 0.45) {
      const sprites = entitySprites(detail, marks);
      TM.render(ctx, { x0: X0 - 4, y0: Y0 - 4, x1: X0 + WW + 4, y1: Y0 + WH + 4 }, sprites, now);
    } else drawEntities(detail, marks);
    perf.lastWorld = performance.now() - world0;
    if (e > 0.02) { ctx.globalAlpha = clamp01(e * 2.5); ctx.imageSmoothingEnabled = true; ctx.drawImage(ovImg, BOX[0], BOX[1], MAP_W, MAP_H); ctx.globalAlpha = 1; if (e > 0.45) drawEntities(detail, marks); }
    drawPrints();
    drawGhostPaths();
    drawLabels(e);
    drawFogLabels();
    drawClosed();
    drawDest();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (e < 0.5) weather(dt, 1 - e * 2);
    drawBanner(e); drawArrow(e);
  }

  const wh = (i, j, sd) => { let h = Math.imul(i | 0, 374761393) ^ Math.imul(j | 0, 668265263) ^ Math.imul((sd | 0) + 1013, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const WP = []; for (let i = 0; i < 28; i++) WP.push({ x: wh(i, 1, 501), y: wh(i, 2, 501), s: 0.5 + wh(i, 3, 501), p: wh(i, 4, 501) * 6 });
  function weather(dt, vis) {
    const bs = World.SUB_BY[WN.subAt(vx, vy)], kind = (bs && ZMAP[bs.biome]) || null;
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
    const id = WN.subAt(cam.x, cam.y + (FOCUS_Y - 0.5) * vh / zIn);
    if (id && unlocked(id)) { if (id !== banner.id) banner = { id, t: T }; } else banner.id = null;
    if (!banner.id || e > 0.3) return;
    const age = T - banner.t, a = Math.min(1, age / 0.6) * Math.max(0, Math.min(1, (4.2 - age) / 0.8)) * (1 - e * 3); if (a <= 0.01) return;
    const sub = World.SUB_BY[banner.id], name = sub ? sub.name : banner.id, y = 108;
    ctx.save(); ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    ctx.font = 'italic 700 20px "Shippori Mincho","Hiragino Mincho ProN","Yu Mincho",Georgia,serif'; ctx.globalAlpha = a * 0.9; ctx.lineWidth = 6; ctx.strokeStyle = PAPER; ctx.strokeText(name, vw / 2, y); ctx.globalAlpha = a; ctx.fillStyle = INK; ctx.fillText(name, vw / 2, y);
    ctx.font = '600 11px "Zen Kaku Gothic New",system-ui,sans-serif'; const rg = (sub ? sub.region : '').toUpperCase(); ctx.globalAlpha = a * 0.8; ctx.lineWidth = 4; ctx.strokeText(rg, vw / 2, y + 16); ctx.fillStyle = VERM; ctx.fillText(rg, vw / 2, y + 16);
    ctx.restore();
  }

  // Ghost route of past expeditions, shown at Camp: the previous best reach (gold) and the last run (vermilion).
  function drawGhostPaths() {
    if (st.run || !st.save) return;
    const k = 1 / z, one = (ids, col, width, dash) => {
      const pts = (ids || []).map((id) => World.byId[id]).filter(Boolean);
      if (pts.length < 2) return;
      ctx.strokeStyle = col; ctx.lineWidth = width * Math.max(k, 0.5); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([dash * Math.max(k, 0.5), dash * 0.9 * Math.max(k, 0.5)]);
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - Math.hypot(b.x - a.x, b.y - a.y) * 0.08; ctx.quadraticCurveTo(mx, my, b.x, b.y); }
      ctx.stroke(); ctx.setLineDash([]);
    };
    ctx.save(); ctx.globalAlpha = 0.5;
    if (JSON.stringify(st.save.lastPath) === JSON.stringify(st.save.bestPath)) one(st.save.prevBestPath, '#7d8794', 4, 10); // the record this run just beat
    one(st.save.bestPath, '#b8892e', 5, 12);
    if (st.save.lastPath !== st.save.bestPath && JSON.stringify(st.save.lastPath) !== JSON.stringify(st.save.bestPath)) one(st.save.lastPath, VERM, 3.5, 9);
    ctx.restore();
  }
  const wrapName = (n) => { const w = n.split(' '); if (w.length < 2) return [n]; let best = 1, bd = 1e9; for (let i = 1; i < w.length; i++) { const d = Math.abs(w.slice(0, i).join(' ').length - w.slice(i).join(' ').length); if (d < bd) { bd = d; best = i; } } return [w.slice(0, best).join(' '), w.slice(best).join(' ')]; };
  function ovName(txt, x, y, px, a) {   // wrapped, centred on (x, y), screen-sized
    const lines = wrapName(txt), fs = px / z, lh = fs * 1.08, y0 = y - (lines.length - 1) * lh / 2 + fs * 0.34;
    ctx.font = 'italic 700 ' + fs + 'px "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
    lines.forEach((t, i) => { const yy = y0 + i * lh; ctx.globalAlpha = a * 0.92; ctx.lineWidth = fs * 0.34; ctx.strokeStyle = PAPER; ctx.strokeText(t, x, yy); ctx.globalAlpha = a; ctx.fillStyle = INK; ctx.fillText(t, x, yy); });
    ctx.globalAlpha = 1;
  }
  function drawLabels(e) {
    if (e < 0.35) return;
    const k = clamp01((e - 0.35) * 2.2);
    for (const id of SUBIDS) {
      if (!unlocked(id)) continue;
      const sub = World.SUB_BY[id], c = SUBINFO[id] && SUBINFO[id].center; if (!c) continue;
      ovName(sub ? sub.name : id, c[0], c[1], 8.6, k);
    }
    for (const r of WG.regions) inkText(r.name.toUpperCase(), (r.origin[0] + r.size / 2) * TS, (r.origin[1] + 2.5) * TS, 10.5, k * 0.8, 700, false);
  }

  // ---------- A brushed arrow at the screen edge pointing to the nearest monster still to fight, when none is on screen ----------
  const arrowCache = {};
  function drawArrow(e) {
    if (e > 0.02 || !st.run) return;
    const bx = vw * 0.5, by = vh * 0.33, hw = vw / 2 - 30, hhh = vh * 0.33 - 62;   // the visible box (above the bottom sheet)
    const sx = (x) => vw / 2 + (x - vx) * z, sy = (y) => vh / 2 + (y - vy) * z;
    let best = null, bd = 1e18;
    for (const n of NODES) {
      if (n.type !== 'battle' && n.type !== 'elite' && n.type !== 'boss') continue;
      if (!visibleNode(n) || (st.run.cleared && st.run.cleared.includes(n.id))) continue;
      const px = sx(n.x), py = sy(n.y - 20);
      if (px > 16 && px < vw - 16 && py > 70 && py < vh * 0.64) return;   // one is already in view
      const d = (n.x - vx) * (n.x - vx) + (n.y - vy) * (n.y - vy); if (d < bd) { bd = d; best = { n, px, py }; }
    }
    if (!best) return;
    const dx = best.px - bx, dy = best.py - by, tx = Math.abs(dx) > 1e-3 ? hw / Math.abs(dx) : 1e9, ty = Math.abs(dy) > 1e-3 ? hhh / Math.abs(dy) : 1e9, t = Math.min(tx, ty);
    const ax = bx + dx * t, ay = by + dy * t, ang = Math.atan2(dy, dx), pulse = 1 + Math.sin(T * 4) * 0.08;
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang); ctx.scale(pulse, pulse);
    ctx.globalAlpha = 0.95; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // paper halo, then an ink brush chevron with a vermilion tip
    ctx.strokeStyle = PAPER; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(0, -1.5, 13, 0); ctx.moveTo(3, -10); ctx.lineTo(14, 0); ctx.lineTo(3, 10); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(-14, 1); ctx.quadraticCurveTo(0, -2, 13, 0); ctx.stroke();
    ctx.strokeStyle = VERM; ctx.lineWidth = 4.6; ctx.beginPath(); ctx.moveTo(3, -9); ctx.quadraticCurveTo(9, -5, 14, 0); ctx.quadraticCurveTo(9, 5, 3, 9); ctx.stroke();
    ctx.restore();
    // a small skull pip and the distance, kept upright
    const dist = Math.round(Math.sqrt(bd) / 10) / 10;
    ctx.save(); ctx.translate(ax - Math.cos(ang) * 30, ay - Math.sin(ang) * 30); ctx.globalAlpha = 0.95;
    ctx.fillStyle = PAPER; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fill(); ctx.stroke();
    skull(ctx, 0, 0, 5.2, best.n.type === 'boss' ? VERM : INK, PAPER);
    ctx.restore();
    void arrowCache; void dist;
  }
  // ---------- Entities: nodes and the hero, sorted by depth ----------
  const lvlDifficulty = (n) => World.danger(n.level); // same skull rating as the sheets (design 8.1)
  function roleOf(n) { return n.role || (n.type === 'boss' ? 'boss' : n.type === 'elite' ? 'tough' : 'basic'); }
  const nodeH = (n) => (n.type === 'boss' ? 112 : n.type === 'elite' ? 84 : n.type === 'camp' ? 46 : n.type === 'battle' ? 74 : 34);

  function nodeState(n) {
    if (n.type === 'camp') return 'camp';
    const run = st.run;
    if (!run) return 'open';
    if (run.cleared.includes(n.id)) return 'done';
    if (closedSub(n.sub)) return 'closed';
    if (n.type === 'waypoint' || n.type === 'secret') return 'open';
    return st.frontier.has(n.id) ? 'near' : 'far';
  }

  // Sprites handed to TileMap.render: nodes and the hero, y-sorted together with the props.
  function entitySprites(detail, marks) {
    const out = [];
    for (const n of NODES) if (visibleNode(n) && inView(n.x, n.y - 40, 90)) out.push({ y: n.y, x: n.x, draw: () => { if (detail > 0.02) drawNode(n, detail); if (marks > 0.02) drawMarker(n, marks); } });
    out.push({ y: token.y, x: token.x, draw: () => drawHero(ease(ovT)) });
    return out;
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
    const type = n.type, state = nodeState(n), done = state === 'done', far = state === 'far' || state === 'closed';
    if (type === 'camp') return drawCamp(n, A);
    if (type === 'shrine') return drawShrine(n, A, done, far);
    if (type === 'treasure') return drawChest(n, A, done, far);
    if (type === 'shop') return drawShop(n, A, done, far);
    if (type === 'event') return drawEvent(n, A, done, far);
    if (type === 'waypoint') return drawWaypoint(n, A);
    if (type === 'secret') return drawSecret(n, A, done);
    if (!nodeSeen(n)) return drawUnseen(n, A);
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
  // WP14: an unscouted spot is a faint ink silhouette in a patch of mist; its danger pips still show (you know how deep it is, not what lives there).
  function drawUnseen(n, A) {
    const elite = n.type === 'elite', rx = elite ? 33 : 29, ry = rx * 0.4, S = elite ? 72 : 64, diff = lvlDifficulty(n);
    soft(ctx, n.x, n.y - 14, rx * 2.1, 30, '#e9eef0', A * 0.55);
    const rs = ringSprite('#8f918f', rx, ry, World.hash(n.id) % 2 === 1);
    ctx.globalAlpha = A * 0.28; ctx.drawImage(rs.c, n.x - rs.w / 2, n.y - rs.h / 2, rs.w, rs.h);
    const m = monsterSprite(n.sub + '_' + roleOf(n), false), sway = Math.sin(T * 0.9 + n.x) * 1.5;
    ctx.globalAlpha = A * 0.42;
    if (m.sil) ctx.drawImage(m.sil, n.x - S / 2 + sway, n.y + 2 - S * 0.92, S, S);
    else { ctx.fillStyle = '#56667a'; ctx.beginPath(); ctx.ellipse(n.x, n.y - S * 0.35, S * 0.22, S * 0.32, 0, 0, 7); ctx.fill(); }
    soft(ctx, n.x, n.y - S * 0.45, rx * 1.4, S * 0.35, '#eef2f2', A * 0.35);   // drifting mist over the figure
    const pl = pillSprite(diff, DANGER[diff - 1], true);
    ctx.globalAlpha = A * 0.7; ctx.drawImage(pl.c, n.x - pl.w / 2, n.y - S * 0.98 - pl.h + 4, pl.w, pl.h);
    ctx.globalAlpha = 1;
    if (st.selected === n.id) drawSelect(n.x, n.y, rx + 10, ry + 5, A);
  }
  // WP14: a Wayshrine is a small vermilion torii with a lantern; dim until lit, then it glows and a pennant flutters.
  function drawWaypoint(n, A) {
    const x = n.x, y = n.y, lit = !!st.save && st.save.waypoints.includes(n.sub);
    ctx.globalAlpha = A; soft(ctx, x, y + 3, 34, 10, '#4a3a2a', 0.3);
    if (lit) soft(ctx, x, y - 22, 46, 40, '#ffd27a', 0.22 + 0.05 * Math.sin(T * 2));
    const col = lit ? '#c8402f' : '#9b8f86', pw = 17, ph = 44;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = col; ctx.lineWidth = 4.2;
    ctx.beginPath(); ctx.moveTo(x - pw, y); ctx.lineTo(x - pw, y - ph + 6); ctx.moveTo(x + pw, y); ctx.lineTo(x + pw, y - ph + 6); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - pw - 3, y - ph + 14); ctx.lineTo(x + pw + 3, y - ph + 14); ctx.stroke();
    ctx.strokeStyle = '#2b2530'; ctx.lineWidth = 5.2; ctx.beginPath(); ctx.moveTo(x - pw - 9, y - ph + 4); ctx.quadraticCurveTo(x, y - ph - 2, x + pw + 9, y - ph + 4); ctx.stroke();
    // hanging lantern
    const sw = Math.sin(T * 1.8 + x) * (lit ? 1.4 : 0.4);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - ph + 8); ctx.lineTo(x + sw, y - ph + 15); ctx.stroke();
    ctx.fillStyle = lit ? '#ffe39a' : '#cfc8b8'; ctx.beginPath(); ctx.ellipse(x + sw, y - ph + 20, 4.4, 5.6, 0, 0, 7); ctx.fill(); ctx.lineWidth = 1.1; ctx.stroke();
    if (lit) { ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x + sw, y - ph + 20, 2.4, 0.4, 3); ctx.stroke(); }
    if (lit) { // pennant
      const fx = x + pw + 14, wv = Math.sin(T * 3 + y) * 2;
      ctx.strokeStyle = '#4a3a2e'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(fx, y); ctx.lineTo(fx, y - 36); ctx.stroke();
      ctx.fillStyle = INDIGO; ctx.beginPath(); ctx.moveTo(fx, y - 36); ctx.quadraticCurveTo(fx + 8, y - 35 + wv, fx + 15, y - 31 + wv); ctx.quadraticCurveTo(fx + 8, y - 29, fx, y - 26); ctx.closePath(); ctx.fill();
    } else { // unlit: a pulsing ring invites the hero to light it
      const k = (T * 0.9) % 1; ctx.globalAlpha = A * 0.8 * (1 - k); ctx.strokeStyle = '#e8b04a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(x, y, 26 + k * 12, 9 + k * 5, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = A;
    }
    ctx.lineCap = 'butt'; ctx.globalAlpha = 1;
    if (st.selected === n.id) drawSelect(x, y - 4, 38, 14, A);
  }
  // WP14: a hidden Sealed Cache: a small lacquered chest with a violet cord and a faint shimmer; brighter while the hero carries a key.
  function drawSecret(n, A, done) {
    const x = n.x, y = n.y, keyed = !!st.run && st.run.keys > 0;
    ctx.globalAlpha = A * (done ? 0.5 : 1); soft(ctx, x, y + 2, 26, 8, '#4a3a2a', 0.35);
    if (!done) soft(ctx, x, y - 14, 30, 24, '#c8a8f0', keyed ? 0.3 + 0.1 * Math.sin(T * 3) : 0.14);
    ctx.fillStyle = '#5a3a5c'; ctx.fillRect(x - 13, y - 13, 26, 14);
    ctx.fillStyle = '#7a4e78'; ctx.beginPath(); ctx.moveTo(x - 13, y - 13); ctx.quadraticCurveTo(x, y - 27, x + 13, y - 13); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d6b45a'; ctx.fillRect(x - 14, y - 14, 28, 2.6); ctx.fillRect(x - 2.5, y - 14, 5, 7);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.strokeRect(x - 13, y - 13, 26, 14); ctx.beginPath(); ctx.moveTo(x - 13, y - 13); ctx.quadraticCurveTo(x, y - 27, x + 13, y - 13); ctx.stroke();
    if (!done) { ctx.strokeStyle = VERM; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 14, y - 7); ctx.lineTo(x + 14, y - 7); ctx.stroke(); ctx.fillStyle = VERM; ctx.fillRect(x - 3, y - 11, 6, 8); }
    if (!done && keyed) { const k = 0.5 + 0.5 * Math.sin(T * 4); ctx.globalAlpha = A * k; ctx.fillStyle = '#fff6c4'; ctx.beginPath(); ctx.moveTo(x + 15, y - 28); ctx.lineTo(x + 17, y - 23); ctx.lineTo(x + 22, y - 21); ctx.lineTo(x + 17, y - 19); ctx.lineTo(x + 15, y - 14); ctx.lineTo(x + 13, y - 19); ctx.lineTo(x + 8, y - 21); ctx.lineTo(x + 13, y - 23); ctx.closePath(); ctx.fill(); }
    ctx.globalAlpha = 1;
    if (done) drawTick(x, y - 14, A);
    if (st.selected === n.id) drawSelect(x, y - 4, 28, 12, A);
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
  // WP13: a roadside market stall (vermilion and cream awning, a hanging coin) and an event lantern (a paper lantern with a brushed "?").
  function drawShop(n, A, done, far) {
    const x = n.x, y = n.y; ctx.globalAlpha = A * (done ? 0.5 : far ? 0.65 : 1);
    soft(ctx, x, y + 2, 32, 10, '#4a3a2a', 0.3);
    const gr = (c) => (far ? '#a3a099' : c);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.fillStyle = gr('#a56e3c'); ctx.fillRect(x - 17, y - 12, 34, 12); ctx.strokeRect(x - 17, y - 12, 34, 12);   // counter
    ctx.strokeStyle = gr('#6a4a2c'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 17, y - 12); ctx.lineTo(x - 17, y - 36); ctx.moveTo(x + 17, y - 12); ctx.lineTo(x + 17, y - 36); ctx.stroke();
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? gr('#f3e7c8') : gr(VERM); ctx.beginPath(); ctx.moveTo(x - 20 + i * 10, y - 36); ctx.lineTo(x - 10 + i * 10, y - 36); ctx.lineTo(x - 11 + i * 10, y - 28); ctx.lineTo(x - 19 + i * 10, y - 28); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x - 20, y - 36); ctx.lineTo(x + 20, y - 36); ctx.lineTo(x + 19, y - 28); ctx.lineTo(x - 19, y - 28); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = gr('#dcb450'); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x - 8 + i * 8, y - 14, 3.2, 2, 0, 0, 7); ctx.fill(); }
    if (!done && !far) { const sw = Math.sin(T * 2.4) * 1.5; ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 8, y - 28); ctx.lineTo(x + 8 + sw, y - 22); ctx.stroke(); ctx.fillStyle = '#dcb450'; ctx.beginPath(); ctx.arc(x + 8 + sw, y - 20, 3.4, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#6a4a2c'; ctx.fillRect(x + 7 + sw, y - 21, 2, 2); }
    ctx.globalAlpha = 1;
    if (done) drawTick(x, y - 18, A);
    if (st.selected === n.id) drawSelect(x, y - 4, 32, 13, A);
  }
  function drawEvent(n, A, done, far) {
    const x = n.x, y = n.y; ctx.globalAlpha = A * (done ? 0.5 : far ? 0.65 : 1);
    soft(ctx, x, y + 2, 24, 8, '#4a3a2a', 0.3);
    const gr = (c) => (far ? '#a3a099' : c), sway = Math.sin(T * 1.6 + x) * (done || far ? 0 : 1.2);
    ctx.strokeStyle = gr('#6a4a2c'); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x - 8, y - 38); ctx.quadraticCurveTo(x - 8, y - 42, x + 2, y - 42); ctx.lineTo(x + 6 + sway, y - 42); ctx.stroke();   // lantern post
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 6 + sway, y - 42); ctx.lineTo(x + 6 + sway, y - 37); ctx.stroke();
    if (!done && !far) soft(ctx, x + 6 + sway, y - 26, 20, 20, '#ffd27a', 0.35);
    ctx.fillStyle = gr('#f3d9a0'); ctx.beginPath(); ctx.ellipse(x + 6 + sway, y - 27, 9, 11, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = gr('#4a3a2e'); ctx.fillRect(x + 1 + sway, y - 39, 10, 3); ctx.fillRect(x + 1 + sway, y - 17, 10, 3);
    ctx.strokeStyle = gr(VERM); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 2.5 + sway, y - 30); ctx.quadraticCurveTo(x + 3 + sway, y - 35, x + 7 + sway, y - 33); ctx.quadraticCurveTo(x + 10 + sway, y - 31, x + 6.5 + sway, y - 27); ctx.lineTo(x + 6.5 + sway, y - 25); ctx.stroke();
    ctx.fillStyle = gr(VERM); ctx.beginPath(); ctx.arc(x + 6.5 + sway, y - 21.2, 1.3, 0, 7); ctx.fill(); ctx.lineCap = 'butt';
    ctx.globalAlpha = 1;
    if (done) drawTick(x, y - 14, A);
    if (st.selected === n.id) drawSelect(x, y - 4, 26, 12, A);
  }
  function drawChest(n, A, done, far) {
    const x = n.x, y = n.y; ctx.globalAlpha = A * (done ? 0.5 : far ? 0.65 : 1);
    soft(ctx, x, y + 2, 28, 9, '#4a3a2a', 0.35);
    const gr = (c) => (far ? '#a3a099' : c);
    ctx.fillStyle = gr('#8a5a34'); ctx.fillRect(x - 16, y - 16, 32, 17);
    ctx.fillStyle = gr('#a56e3c'); ctx.beginPath(); ctx.moveTo(x - 16, y - 16); ctx.quadraticCurveTo(x, y - 34, x + 16, y - 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = gr('#dcb450'); ctx.fillRect(x - 17, y - 17, 34, 3); ctx.fillRect(x - 12, y - 28, 3, 12); ctx.fillRect(x + 9, y - 28, 3, 12); ctx.fillRect(x - 3, y - 18, 6, 8);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(x - 16, y - 16, 32, 17); ctx.beginPath(); ctx.moveTo(x - 16, y - 16); ctx.quadraticCurveTo(x, y - 34, x + 16, y - 16); ctx.stroke();
    if (n.guarded && !done) { // a vermilion rope seal and a tiny paper tag: this cache has a guard
      ctx.globalAlpha = A * (far ? 0.65 : 1); ctx.strokeStyle = far ? '#a3a099' : VERM; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x - 17, y - 9); ctx.lineTo(x + 17, y - 9); ctx.stroke();
      ctx.fillStyle = far ? '#a3a099' : VERM; ctx.fillRect(x - 4, y - 14, 8, 10); ctx.strokeStyle = '#fbeadb'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x - 2, y - 11); ctx.lineTo(x + 2, y - 7); ctx.moveTo(x + 2, y - 11); ctx.lineTo(x - 2, y - 7); ctx.stroke();
    }
    if (!done && !far) { const k = 0.5 + 0.5 * Math.sin(T * 4); ctx.globalAlpha = A * k; ctx.fillStyle = '#fff6c4'; ctx.beginPath(); ctx.moveTo(x + 18, y - 34); ctx.lineTo(x + 20, y - 29); ctx.lineTo(x + 25, y - 27); ctx.lineTo(x + 20, y - 25); ctx.lineTo(x + 18, y - 20); ctx.lineTo(x + 16, y - 25); ctx.lineTo(x + 11, y - 27); ctx.lineTo(x + 16, y - 29); ctx.closePath(); ctx.fill(); }
    ctx.globalAlpha = 1;
    if (done) drawTick(x, y - 12, A);
    if (st.selected === n.id) drawSelect(x, y - 4, 30, 13, A);
  }

  // Overview markers: small brushed discs.
  function drawMarker(n, A) {
    const state = nodeState(n), k = 1 / z, boss = n.type === 'boss';
    const r = (boss ? 5.2 : n.type === 'camp' ? 7 : n.type === 'elite' ? 3.8 : n.type === 'shrine' || n.type === 'treasure' || n.type === 'shop' || n.type === 'event' || n.type === 'waypoint' || n.type === 'secret' ? 3.4 : 2.7) * k, x = n.x, y = n.y;
    ctx.globalAlpha = A;
    if (state === 'near') { const q = (T * 0.9) % 1; ctx.globalAlpha = A * (1 - q); ctx.strokeStyle = '#e8b04a'; ctx.lineWidth = 1.6 * k; ctx.beginPath(); ctx.arc(x, y, r + (2 + q * 4) * k, 0, 7); ctx.stroke(); ctx.globalAlpha = A; }
    let fill = '#fbf5e4', edge = '#5b4a3a';
    if (n.type === 'camp') { edge = '#8a6a3a'; fill = '#f3e7c8'; }
    else if (state === 'done') { fill = '#7fb287'; edge = '#3f7a4d'; }
    else if (state === 'far') { fill = '#cfcdc6'; edge = '#8f918f'; }
    else if (n.type === 'shrine') { fill = '#d8eef2'; edge = '#3f8fa8'; }
    else if (n.type === 'treasure') { fill = '#f3dfa0'; edge = '#b8892e'; }
    else if (n.type === 'shop') { fill = '#f3dfa0'; edge = '#c0553c'; }
    else if (n.type === 'event') { fill = '#efe4f4'; edge = '#7a5aa0'; }
    else if (n.type === 'waypoint') { const lit = !!st.save && st.save.waypoints.includes(n.sub); fill = lit ? '#f6d9d2' : '#e4e0d8'; edge = lit ? VERM : '#9b8f86'; }
    else if (n.type === 'secret') { fill = '#e6d8f2'; edge = '#7a4e78'; }
    else edge = DANGER[lvlDifficulty(n) - 1];
    ctx.fillStyle = state === 'far' || state === 'done' || r * z > 4 ? fill : edge; ctx.strokeStyle = edge; ctx.lineWidth = (boss ? 1.8 : 1.3) * k;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
    if (r * z > 4) { ctx.strokeStyle = rgba(edge, 0.5); ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.arc(x, y, r + 2.2 * k, 0.4, 5.2); ctx.stroke(); }
    if (state === 'done') { ctx.strokeStyle = '#fbf6e6'; ctx.lineWidth = 2.4 * k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - r * 0.45, y); ctx.lineTo(x - r * 0.1, y + r * 0.38); ctx.lineTo(x + r * 0.5, y - r * 0.38); ctx.stroke(); ctx.lineCap = 'butt'; }
    else if (n.type === 'camp') { ctx.fillStyle = '#c0553c'; ctx.beginPath(); ctx.moveTo(x - r * 0.6, y + r * 0.45); ctx.lineTo(x, y - r * 0.6); ctx.lineTo(x + r * 0.6, y + r * 0.45); ctx.closePath(); ctx.fill(); }
    else if (n.type === 'shrine') { ctx.fillStyle = '#3f8fa8'; ctx.beginPath(); ctx.moveTo(x, y - r * 0.6); ctx.quadraticCurveTo(x + r * 0.55, y + r * 0.05, x, y + r * 0.55); ctx.quadraticCurveTo(x - r * 0.55, y + r * 0.05, x, y - r * 0.6); ctx.fill(); }
    else if (n.type === 'treasure') { ctx.fillStyle = '#8a5a34'; ctx.fillRect(x - r * 0.55, y - r * 0.3, r * 1.1, r * 0.75); ctx.fillStyle = '#dcb450'; ctx.fillRect(x - r * 0.1, y - r * 0.3, r * 0.2, r * 0.4); }
    else if (n.type === 'shop') { ctx.fillStyle = '#c0553c'; ctx.beginPath(); ctx.moveTo(x - r * 0.7, y - r * 0.05); ctx.lineTo(x - r * 0.5, y - r * 0.6); ctx.lineTo(x + r * 0.5, y - r * 0.6); ctx.lineTo(x + r * 0.7, y - r * 0.05); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#dcb450'; ctx.fillRect(x - r * 0.5, y, r, r * 0.45); }
    else if (n.type === 'waypoint') { ctx.strokeStyle = edge; ctx.lineWidth = 1.5 * k; ctx.beginPath(); ctx.moveTo(x - r * 0.4, y + r * 0.5); ctx.lineTo(x - r * 0.4, y - r * 0.6); ctx.stroke(); ctx.fillStyle = edge; ctx.beginPath(); ctx.moveTo(x - r * 0.4, y - r * 0.6); ctx.lineTo(x + r * 0.6, y - r * 0.3); ctx.lineTo(x - r * 0.4, y); ctx.closePath(); ctx.fill(); }
    else if (n.type === 'secret') { ctx.fillStyle = '#7a4e78'; ctx.beginPath(); ctx.moveTo(x, y - r * 0.6); ctx.lineTo(x + r * 0.5, y); ctx.lineTo(x, y + r * 0.6); ctx.lineTo(x - r * 0.5, y); ctx.closePath(); ctx.fill(); }
    else if (n.type === 'event') { ctx.strokeStyle = '#7a5aa0'; ctx.lineWidth = 1.5 * k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - r * 0.35, y - r * 0.2); ctx.quadraticCurveTo(x - r * 0.3, y - r * 0.7, x, y - r * 0.55); ctx.quadraticCurveTo(x + r * 0.4, y - r * 0.4, x, y + r * 0.05); ctx.lineTo(x, y + r * 0.2); ctx.stroke(); ctx.fillStyle = '#7a5aa0'; ctx.beginPath(); ctx.arc(x, y + r * 0.52, r * 0.12, 0, 7); ctx.fill(); ctx.lineCap = 'butt'; }
    else if (r * z > 4) skull(ctx, x, y, r * 0.52, state === 'far' ? '#8f918f' : INK, fill);
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


  const tileOk = (tx, ty) => {
    if (WN.blockedTile(tx, ty)) return false;
    const gt = gateCell.get(tx + ',' + ty); if (gt && gateClosed(gt)) return false;
    const s = WN.subAtTile(tx, ty); return !s || s === 'camp' || subOpen(s);
  };
  const walkable = (x, y) => tileOk(Math.floor(x / TS), Math.floor(y / TS));
  function routeTo(sx, sy, tx, ty) {
    const P = WN.findPath(sx, sy, tx, ty, tileOk);
    if (!P) {   // no way around: walk straight until the ground ends
      const d = Math.hypot(tx - sx, ty - sy); let ex = sx, ey = sy;
      for (let s = 8; s <= d; s += 8) { const px = sx + (tx - sx) * s / d, py = sy + (ty - sy) * s / d; if (!walkable(px, py)) break; ex = px; ey = py; }
      return Math.hypot(ex - sx, ey - sy) < 6 ? [] : [{ x: ex, y: ey }];
    }
    return P.map((p) => ({ x: p[0], y: p[1] }));
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
  function placeToken(id) { const n = World.byId[id]; token.x = n.x + HERO_OFF.x; token.y = n.y + HERO_OFF.y; token.walk = null; lastSight.x = -1e9; }
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
    if (ovOn || ovT > 0.5) {
      // WP14: in the overview a tap on a lit Wayshrine flag selects it (fast travel / start position); anywhere else zooms in
      if (st.save) for (const n of NODES) if (n.type === 'waypoint' && st.save.waypoints.includes(n.sub) && Math.hypot(w.x - n.x, w.y - n.y) * z < 22) { setOverview(false, n.x, n.y); onTap(n); return; }
      setOverview(false, w.x, w.y); return;
    }
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
      position: 'absolute', right: 'max(12px, env(safe-area-inset-right, 0px))', top: 'calc(88px + env(safe-area-inset-top, 0px))',
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
    zBase = vw / VIEW; zIn = zBase * uz;
    { const availH = vh * OV_BOT - OV_TOP - 6; zOv = Math.min((vw - 10) / MAP_W, availH / MAP_H); ovCy = OV_TOP + availH / 2; ovTy = centreOfBox[1] - (ovCy - vh / 2) / zOv; }
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
  }
  window.addEventListener('resize', resize);

  window.WorldMap = {
    init(opts) { onTap = opts.onTap; onHero = opts.onHero || onHero; resize(); makeButton(); zIn = zBase * uz; z = zIn; vx = cam.x; vy = cam.y; X0 = vx - vw / 2 / z; Y0 = vy - vh / 2 / z; WW = vw / z; WH = vh / z; requestAnimationFrame(frame); },
    update(next) { Object.assign(st, next); if (st.save) { seenSet = new Set(st.save.seen || []); secretSet = new Set(st.save.secrets || []); } },
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
    // Rendering statistics (tests / tools): cached terrain chunks, frame time.
    stats() { return { chunks: TM.chunkCount(), frameMsAvg: perf.frames ? perf.frameMs / perf.frames : 0, frameMsWorst: perf.worst, frames: perf.frames, worldMs: perf.lastWorld || 0 }; },
    resetStats() { perf.frameMs = 0; perf.frames = 0; perf.worst = 0; },
  };
})();
