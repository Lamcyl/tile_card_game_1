// World map renderer: a painted overworld (drawn once to an offscreen
// canvas) plus animated water, weather, fog, paths, nodes and the hero.
(function () {
  'use strict';
  const World = window.World;
  const canvas = document.getElementById('map');
  const ctx = canvas.getContext('2d');
  const VIEW = 540; // world units across the screen width
  const FOCUS_Y = 0.36; // focused points sit this far down the screen, above the bottom sheet

  let vw = 0, vh = 0, z = 1, dpr = 1, TS = 1;
  let terrain = null;
  const cam = { x: World.CAMP.x, y: World.CAMP.y - 200 };
  let follow = null;              // {x, y} the camera eases toward
  let st = { save: null, run: null, frontier: new Set(), selected: null };
  const fogA = {};                // per sub-area fog opacity, animated
  const token = { x: World.CAMP.x, y: World.CAMP.y, walk: null };
  let onTap = () => {};
  let active = true;
  let T = 0;

  // ---------- Helpers ----------
  const R0 = World.rng;
  const hit = document.createElement('canvas').getContext('2d');
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
  function clearOfRoutes(x, y, gap) {
    const p = { x, y };
    for (const n of World.nodes) if (Math.hypot(n.x - x, n.y - y) < gap + 18) return false;
    for (const [a, b] of World.edges) if (segDist(p, World.byId[a], World.byId[b]) < gap) return false;
    return true;
  }
  function scatter(seed, path, bounds, count, gap, fn) {
    const R = R0('dec:' + seed), out = [];
    for (let i = 0, tries = 0; i < count && tries < count * 12; tries++) {
      const x = bounds[0] + R() * (bounds[2] - bounds[0]), y = bounds[1] + R() * (bounds[3] - bounds[1]);
      if (path && !hit.isPointInPath(path, x, y)) continue;
      if (!clearOfRoutes(x, y, gap)) continue;
      out.push({ x, y, r: R(), q: R() }); i++;
    }
    out.sort((a, b) => a.y - b.y).forEach((p) => fn(p));
  }
  const grow = (b, p) => [b[0] - p, b[1] - p, b[2] + p, b[3] + p];

  // ---------- Painted terrain ----------
  const BIOME = {
    meadow:  { fill: '#a5d36e', edge: '#8cbf58' },
    forest:  { fill: '#6aa04a', edge: '#578a3b' },
    beach:   { fill: '#efdca6', edge: '#e0c98a' },
    dunes:   { fill: '#f1c97c', edge: '#e2b462' },
    temple:  { fill: '#e2b56c', edge: '#cf9f55' },
    snow:    { fill: '#eef4f9', edge: '#d9e5ef' },
    glacier: { fill: '#d4e8f6', edge: '#b9d6ec' },
    ash:     { fill: '#8a7f79', edge: '#766b65' },
    caldera: { fill: '#5d4a45', edge: '#4c3b37' },
  };
  const SEA = '#3279a8';
  const MOUNTAINS = [[330, 600, 670, 1135], [445, 20, 555, 620]];
  const water = [];
  const lava = [];

  function paintTerrain(c) {
    const { MAP_W, MAP_H } = World;
    c.fillStyle = SEA; c.fillRect(0, 0, MAP_W, MAP_H);
    // Subtle depth bands in the sea.
    c.save(); c.globalAlpha = 0.08; c.strokeStyle = '#ffffff'; c.lineWidth = 2;
    for (let y = 20; y < MAP_H; y += 46) { c.beginPath(); for (let x = 0; x <= MAP_W; x += 20) c.lineTo(x, y + Math.sin(x / 60 + y) * 6); c.stroke(); }
    c.restore();

    // Land shapes: rocky mountains, then each biome (lower areas drawn last).
    const land = [];
    const mountainPaths = MOUNTAINS.map((b, i) => blob('mtn' + i, b, 26, 0.18));
    mountainPaths.forEach((p) => land.push({ path: p, fill: '#9aa184', edge: '#868d70' }));
    const order = ['glacier', 'caldera', 'snow', 'ash', 'temple', 'dunes', 'beach', 'forest', 'meadow'];
    const subPath = {};
    for (const id of order) {
      const sub = World.SUB_BY[id];
      const b = id === 'meadow' ? [sub.bounds[0], sub.bounds[1], sub.bounds[2], 1690] : sub.bounds;
      subPath[id] = blob(id, b, id === 'meadow' ? 40 : 46, 0.16);
      land.push({ path: subPath[id], ...BIOME[id] });
    }
    // Coral: shallow lagoon with islands around each node.
    const coral = World.SUB_BY.coral;
    const lagoon = blob('lagoon', coral.bounds, 38, 0.2);
    c.fillStyle = '#4fb0c6'; c.fill(lagoon);
    c.save(); c.globalAlpha = 0.25; c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.stroke(lagoon); c.restore();
    scatter('coralreef', lagoon, grow(coral.bounds, 30), 60, 12, (p) => { c.fillStyle = ['#ff8a80', '#ffb74d', '#f06292'][Math.floor(p.r * 3)]; c.globalAlpha = 0.7; c.beginPath(); c.arc(p.x, p.y, 2.5 + p.q * 2.5, 0, 7); c.fill(); c.globalAlpha = 1; });
    const islands = [];
    World.nodes.filter((n) => n.sub === 'coral').forEach((n, i) => islands.push({ path: blob('isle' + i, [n.x - 22, n.y - 18, n.x + 22, n.y + 18], 14, 0.35), fill: '#f0dfac', edge: '#dcc78f' }));
    for (const [a, b] of World.edges) {
      const A = World.byId[a], B = World.byId[b];
      if (A.sub === 'coral' && B.sub === 'coral') {
        const bridge = new Path2D(); bridge.moveTo(A.x, A.y); bridge.lineTo(B.x, B.y);
        c.save(); c.strokeStyle = '#e8d29a'; c.lineWidth = 16; c.lineCap = 'round'; c.globalAlpha = 0.9; c.stroke(bridge); c.restore();
      }
    }
    // Foam outlines first, then fills, so shorelines read clearly.
    c.save(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 9;
    for (const l of land.concat(islands)) c.stroke(l.path);
    c.restore();
    for (const l of land.concat(islands)) {
      c.fillStyle = l.fill; c.fill(l.path);
      c.save(); c.strokeStyle = l.edge; c.lineWidth = 3; c.stroke(l.path); c.restore();
    }
    // Camp clearing.
    c.save(); c.fillStyle = '#c9b07a'; c.beginPath(); c.ellipse(World.CAMP.x, World.CAMP.y + 6, 46, 24, 0, 0, 7); c.fill(); c.restore();

    // ----- Decorations -----
    const tree = (p, s, col, dark) => {
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(p.x + 3, p.y + 3, s * 0.9, s * 0.45, 0, 0, 7); c.fill();
      c.fillStyle = '#6d4c2f'; c.fillRect(p.x - 1.5, p.y - 2, 3, 6);
      c.fillStyle = dark; c.beginPath(); c.arc(p.x, p.y - s * 0.6, s, 0, 7); c.fill();
      c.fillStyle = col; c.beginPath(); c.arc(p.x - s * 0.25, p.y - s * 0.8, s * 0.75, 0, 7); c.fill();
    };
    const pine = (p, s, col, snow) => {
      c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(p.x + 3, p.y + 2, s * 0.7, s * 0.3, 0, 0, 7); c.fill();
      c.fillStyle = col; c.beginPath(); c.moveTo(p.x, p.y - s * 2); c.lineTo(p.x + s * 0.8, p.y); c.lineTo(p.x - s * 0.8, p.y); c.fill();
      if (snow) { c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(p.x, p.y - s * 2); c.lineTo(p.x + s * 0.35, p.y - s * 1.1); c.lineTo(p.x - s * 0.35, p.y - s * 1.1); c.fill(); }
    };
    const palm = (p, s) => {
      c.strokeStyle = '#8a6239'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(p.x, p.y); c.quadraticCurveTo(p.x + 4, p.y - s, p.x + 2, p.y - s * 1.6); c.stroke();
      c.strokeStyle = '#3f9a4a'; c.lineWidth = 3; c.lineCap = 'round';
      for (const a of [-2.6, -2, -1.2, -0.5, 0.2]) { c.beginPath(); c.moveTo(p.x + 2, p.y - s * 1.6); c.quadraticCurveTo(p.x + 2 + Math.cos(a) * s * 0.6, p.y - s * 1.9 + Math.sin(a) * s * 0.3, p.x + 2 + Math.cos(a) * s * 0.9, p.y - s * 1.4 + Math.sin(a) * s * 0.5); c.stroke(); }
      c.lineCap = 'butt';
    };
    const rock = (p, s, col) => {
      c.fillStyle = col; c.beginPath(); c.moveTo(p.x - s, p.y); c.lineTo(p.x - s * 0.5, p.y - s * 0.9); c.lineTo(p.x + s * 0.6, p.y - s * 0.7); c.lineTo(p.x + s, p.y); c.fill();
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(p.x - s * 0.5, p.y - s * 0.9); c.lineTo(p.x + s * 0.6, p.y - s * 0.7); c.lineTo(p.x, p.y - s * 0.3); c.fill();
    };
    const mountain = (p, s) => {
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(p.x + 6, p.y + 2, s * 1.1, s * 0.3, 0, 0, 7); c.fill();
      c.fillStyle = '#7b7f86'; c.beginPath(); c.moveTo(p.x - s, p.y); c.lineTo(p.x, p.y - s * 1.3); c.lineTo(p.x + s, p.y); c.fill();
      c.fillStyle = '#5f636b'; c.beginPath(); c.moveTo(p.x, p.y - s * 1.3); c.lineTo(p.x + s, p.y); c.lineTo(p.x + s * 0.2, p.y); c.fill();
      c.fillStyle = '#f5f7fa'; c.beginPath(); c.moveTo(p.x, p.y - s * 1.3); c.lineTo(p.x + s * 0.32, p.y - s * 0.88); c.lineTo(p.x + s * 0.05, p.y - s * 0.95); c.lineTo(p.x - s * 0.3, p.y - s * 0.86); c.fill();
    };

    MOUNTAINS.forEach((b, i) => scatter('mtn' + i, mountainPaths[i], b, i ? 22 : 46, 10, (p) => mountain(p, 18 + p.r * 16)));

    const S = (id) => World.SUB_BY[id];
    scatter('meadowflowers', subPath.meadow, grow(S('meadow').bounds, 40), 90, 10, (p) => {
      c.fillStyle = ['#ffffff', '#ffd54f', '#ff8a80', '#ce93d8'][Math.floor(p.r * 4)]; c.beginPath(); c.arc(p.x, p.y, 2, 0, 7); c.fill();
    });
    scatter('meadowgrass', subPath.meadow, grow(S('meadow').bounds, 40), 40, 12, (p) => {
      c.strokeStyle = '#7fb24f'; c.lineWidth = 1.5; for (const d of [-3, 0, 3]) { c.beginPath(); c.moveTo(p.x + d, p.y); c.lineTo(p.x + d * 1.6, p.y - 6); c.stroke(); }
    });
    scatter('meadowtrees', subPath.meadow, grow(S('meadow').bounds, 30), 14, 22, (p) => tree(p, 8 + p.r * 4, '#7cbf4f', '#5f9a3c'));
    scatter('forest', subPath.forest, grow(S('forest').bounds, 40), 190, 16, (p) => tree(p, 8 + p.r * 6, p.q > 0.5 ? '#4e8c39' : '#5c9a42', '#3b6f2c'));
    scatter('beachpalm', subPath.beach, grow(S('beach').bounds, 40), 18, 18, (p) => palm(p, 12 + p.r * 6));
    scatter('beachdots', subPath.beach, grow(S('beach').bounds, 40), 40, 8, (p) => { c.fillStyle = p.r > 0.5 ? '#f7b2a8' : '#d8c08a'; c.beginPath(); c.arc(p.x, p.y, 2, 0, 7); c.fill(); });
    World.nodes.filter((n) => n.sub === 'coral').forEach((n, i) => palm({ x: n.x + (i % 2 ? 24 : -26), y: n.y - 8 }, 11));
    scatter('dunearcs', subPath.dunes, grow(S('dunes').bounds, 40), 40, 10, (p) => { c.strokeStyle = '#d9a85a'; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y + 10, 14 + p.r * 10, -2.4, -0.7); c.stroke(); });
    scatter('cactus', subPath.dunes, grow(S('dunes').bounds, 30), 14, 16, (p) => {
      c.fillStyle = '#5a9a4a'; c.fillRect(p.x - 2.5, p.y - 16, 5, 16); c.fillRect(p.x - 8, p.y - 11, 4, 7); c.fillRect(p.x + 4, p.y - 13, 4, 7);
    });
    scatter('pyramids', subPath.temple, grow(S('temple').bounds, 30), 6, 30, (p) => {
      const s = 20 + p.r * 14;
      c.fillStyle = '#d6a45a'; c.beginPath(); c.moveTo(p.x - s, p.y); c.lineTo(p.x, p.y - s); c.lineTo(p.x + s, p.y); c.fill();
      c.fillStyle = '#b8873f'; c.beginPath(); c.moveTo(p.x, p.y - s); c.lineTo(p.x + s, p.y); c.lineTo(p.x + s * 0.25, p.y); c.fill();
    });
    scatter('columns', subPath.temple, grow(S('temple').bounds, 30), 18, 14, (p) => { const h = 6 + p.r * 12; c.fillStyle = '#efd6a2'; c.fillRect(p.x - 3, p.y - h, 6, h); c.fillStyle = '#c99e5c'; c.fillRect(p.x - 4, p.y - h - 2, 8, 2); });
    scatter('snowmounds', subPath.snow, grow(S('snow').bounds, 40), 25, 12, (p) => { c.fillStyle = '#dce8f2'; c.beginPath(); c.ellipse(p.x, p.y, 12 + p.r * 8, 5, 0, 0, 7); c.fill(); });
    scatter('snowpines', subPath.snow, grow(S('snow').bounds, 40), 70, 14, (p) => pine(p, 7 + p.r * 4, '#3f6f5a', true));
    scatter('ice', subPath.glacier, grow(S('glacier').bounds, 40), 50, 12, (p) => {
      const s = 6 + p.r * 10; c.fillStyle = '#a9d2ef'; c.beginPath(); c.moveTo(p.x, p.y - s * 1.6); c.lineTo(p.x + s * 0.5, p.y); c.lineTo(p.x - s * 0.5, p.y); c.fill();
      c.fillStyle = '#ffffff'; c.globalAlpha = 0.7; c.beginPath(); c.moveTo(p.x, p.y - s * 1.6); c.lineTo(p.x - s * 0.5, p.y); c.lineTo(p.x - s * 0.1, p.y); c.fill(); c.globalAlpha = 1;
    });
    scatter('cracks', subPath.glacier, grow(S('glacier').bounds, 30), 18, 8, (p) => { c.strokeStyle = '#9cc3e0'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + 10, p.y + 4 - p.r * 8); c.lineTo(p.x + 18, p.y + 2); c.stroke(); });
    scatter('ashrocks', subPath.ash, grow(S('ash').bounds, 40), 50, 10, (p) => rock(p, 5 + p.r * 7, '#5c524d'));
    scatter('deadtrees', subPath.ash, grow(S('ash').bounds, 30), 16, 14, (p) => { c.strokeStyle = '#3b302b'; c.lineWidth = 2; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, p.y - 14); c.moveTo(p.x, p.y - 8); c.lineTo(p.x + 6, p.y - 13); c.moveTo(p.x, p.y - 11); c.lineTo(p.x - 5, p.y - 16); c.stroke(); });
    // Caldera: lava rivers and volcano cones.
    const cal = S('caldera');
    const LR = R0('lava');
    for (let i = 0; i < 4; i++) {
      const pts = []; let x = cal.bounds[0] + 40 + LR() * (cal.bounds[2] - cal.bounds[0] - 80), y = cal.bounds[1] + 10;
      while (y < cal.bounds[3] + 20) { pts.push([x, y]); x += (LR() - 0.5) * 50; y += 26; }
      lava.push(pts);
    }
    c.save(); c.clip(subPath.caldera);
    for (const pts of lava) {
      c.strokeStyle = '#3a2420'; c.lineWidth = 11; c.lineJoin = 'round'; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
      c.strokeStyle = '#e8592a'; c.lineWidth = 5; c.stroke();
    }
    c.restore();
    scatter('volcano', subPath.caldera, grow(cal.bounds, 10), 3, 40, (p) => {
      const s = 34 + p.r * 14;
      c.fillStyle = '#3d2f2b'; c.beginPath(); c.moveTo(p.x - s, p.y); c.lineTo(p.x - s * 0.25, p.y - s); c.lineTo(p.x + s * 0.25, p.y - s); c.lineTo(p.x + s, p.y); c.fill();
      c.fillStyle = '#ff7a2f'; c.beginPath(); c.ellipse(p.x, p.y - s, s * 0.25, s * 0.08, 0, 0, 7); c.fill();
      c.strokeStyle = '#ff7a2f'; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x - 2, p.y - s); c.lineTo(p.x - s * 0.3, p.y - s * 0.4); c.stroke();
    });
    scatter('calrocks', subPath.caldera, grow(cal.bounds, 30), 30, 10, (p) => rock(p, 5 + p.r * 6, '#2f2421'));

    // Points of open sea for animated wave glints.
    const R = R0('waves');
    const allLand = land.concat(islands).map((l) => l.path).concat([lagoon]);
    for (let i = 0; water.length < 90 && i < 2000; i++) {
      const x = R() * World.MAP_W, y = R() * World.MAP_H;
      if (!allLand.some((p) => hit.isPointInPath(p, x, y))) water.push({ x, y, ph: R() * 6 });
    }
    World.nodes.filter((n) => n.sub === 'coral').forEach((n) => water.push({ x: n.x + 34, y: n.y + 26, ph: n.x }));
  }

  function buildTerrain() {
    const want = Math.min(2, Math.max(1, z * dpr));
    if (terrain && Math.abs(want - TS) < 0.25) return;
    TS = want;
    terrain = document.createElement('canvas');
    terrain.width = Math.round(World.MAP_W * TS); terrain.height = Math.round(World.MAP_H * TS);
    const c = terrain.getContext('2d');
    c.scale(TS, TS);
    water.length = 0; lava.length = 0;
    paintTerrain(c);
  }

  // ---------- Fog ----------
  const fogPuffs = {};
  for (const sub of World.SUBAREAS) {
    const R = R0('fog:' + sub.id), b = grow(sub.bounds, 8), puffs = [];
    for (let y = b[1]; y <= b[3]; y += 30) for (let x = b[0]; x <= b[2]; x += 34) puffs.push({ x: x + (R() - 0.5) * 14, y: y + (R() - 0.5) * 14, r: 26 + R() * 12, ph: R() * 6 });
    fogPuffs[sub.id] = puffs;
  }
  function bossNameFor(subId) {
    const sub = World.SUB_BY[subId];
    return World.THEMES[sub.from][ 'boss'][0] + ' (' + World.SUB_BY[sub.from].name + ')';
  }

  // ---------- Frame ----------
  const toScreen = (x, y) => [(x - cam.x) * z + vw / 2, (y - cam.y) * z + vh / 2];
  function clampCam() {
    const hw = vw / 2 / z, hh = vh / 2 / z;
    cam.x = World.MAP_W < hw * 2 ? World.MAP_W / 2 : Math.max(hw, Math.min(World.MAP_W - hw, cam.x));
    // Extra room at the bottom so the southern edge can scroll above the bottom sheet.
    cam.y = Math.max(hh - 40, Math.min(World.MAP_H - hh + vh * 0.45 / z, cam.y));
  }
  const unlocked = (sub) => !st.save || st.save.unlocked.includes(sub);
  const visibleNode = (n) => n.type === 'camp' || unlocked(n.sub);

  function frame(now) {
    if (!active) return;
    const dt = Math.min(0.05, (now - (frame.last || now)) / 1000); frame.last = now; T += dt;
    stepToken(dt);
    if (follow) { cam.x += (follow.x - cam.x) * Math.min(1, dt * 5); cam.y += (follow.y - cam.y) * Math.min(1, dt * 5); }
    clampCam();
    for (const sub of World.SUBAREAS) {
      const target = unlocked(sub.id) ? 0 : 1;
      if (fogA[sub.id] === undefined) fogA[sub.id] = target;
      fogA[sub.id] += Math.sign(target - fogA[sub.id]) * Math.min(Math.abs(target - fogA[sub.id]), dt * 0.6);
    }
    draw();
    requestAnimationFrame(frame);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = SEA; ctx.fillRect(0, 0, vw, vh);
    // World transform.
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (vw / 2 - cam.x * z), dpr * (vh / 2 - cam.y * z));
    const x0 = cam.x - vw / 2 / z, y0 = cam.y - vh / 2 / z, ww = vw / z, wh = vh / z;
    ctx.drawImage(terrain, Math.max(0, x0 * TS), Math.max(0, y0 * TS), ww * TS, wh * TS, Math.max(0, x0), Math.max(0, y0), ww, wh);
    const inView = (x, y, m) => x > x0 - m && x < x0 + ww + m && y > y0 - m && y < y0 + wh + m;

    // Water glints.
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
    for (const w of water) {
      if (!inView(w.x, w.y, 20)) continue;
      const a = Math.sin(T * 1.2 + w.ph); if (a < 0.2) continue;
      ctx.globalAlpha = (a - 0.2) * 0.6; const dx = Math.sin(T * 0.8 + w.ph) * 4;
      ctx.beginPath(); ctx.arc(w.x + dx, w.y, 6, 3.6, 5.8); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Lava pulse.
    if (unlocked('caldera')) {
      ctx.save(); ctx.globalAlpha = 0.35 + 0.3 * Math.sin(T * 2); ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
      for (const pts of lava) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); }
      ctx.restore();
    }
    // Weather particles.
    weather('snow', '#ffffff', 1, 26); weather('glacier', '#ffffff', 1, 34);
    weather('ash', '#ffa04d', -1, 16); weather('caldera', '#ff7a2f', -1, 26);

    drawPaths(); drawLabels(); drawNodes(); drawToken(); drawFog();
  }

  function weather(id, col, dir, n) {
    if (!unlocked(id)) return;
    const b = World.SUB_BY[id].bounds, h = b[3] - b[1];
    ctx.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const sp = 14 + (i * 7) % 20, x = b[0] + ((i * 97) % (b[2] - b[0])) + Math.sin(T + i) * 8;
      let y = (i * 53 + T * sp * dir) % h; if (y < 0) y += h;
      ctx.globalAlpha = 0.75; ctx.beginPath(); ctx.arc(x, b[1] + y, dir > 0 ? 1.8 : 1.4, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawPaths() {
    const run = st.run, cleared = new Set(run ? run.cleared : []);
    for (const [a, b] of World.edges) {
      const A = World.byId[a], B = World.byId[b];
      if (!visibleNode(A) || !visibleNode(B)) continue;
      const walked = cleared.has(a) && cleared.has(b);
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(70,50,30,.45)'; ctx.lineWidth = 7; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      ctx.strokeStyle = walked ? '#fff3c8' : '#f1dfb2'; ctx.lineWidth = walked ? 4.5 : 3.5; ctx.setLineDash(walked ? [] : [7, 7]);
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function drawLabels() {
    const done = new Set();
    for (const sub of World.SUBAREAS) {
      if (!unlocked(sub.id)) continue;
      const at = clearSpot('sub:' + sub.id, [sub], 1);
      ctx.font = 'italic 600 13px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(40,30,20,.55)'; ctx.fillStyle = '#fff8e6';
      ctx.strokeText(sub.name, at.x, at.y); ctx.fillText(sub.name, at.x, at.y);
      if (!done.has(sub.region)) {
        done.add(sub.region);
        const at = clearSpot('region:' + sub.region, World.SUBAREAS.filter((s) => s.region === sub.region), -1);
        ctx.font = '700 20px Georgia, serif'; ctx.textAlign = 'center';
        ctx.lineWidth = 5; ctx.strokeText(sub.region.toUpperCase(), at.x, at.y); ctx.fillText(sub.region.toUpperCase(), at.x, at.y);
      }
    }
  }

  // Labels go in the open spot (far from nodes and paths) nearest the top (dir -1)
  // or bottom (dir 1) of their area.
  const labelCache = {};
  function clearSpot(key, subs, dir) {
    if (labelCache[key]) return labelCache[key];
    const x0 = Math.min(...subs.map((s) => s.bounds[0])) + 70, x1 = Math.max(...subs.map((s) => s.bounds[2])) - 70;
    const y0 = Math.min(...subs.map((s) => s.bounds[1])) + 10, y1 = Math.max(...subs.map((s) => s.bounds[3])) - 10;
    let best = null;
    for (let y = y0; y <= y1; y += 12) for (let x = x0; x <= x1; x += 12) {
      let clear = 999;
      for (const n of World.nodes) clear = Math.min(clear, Math.hypot((n.x - x) * 0.55, n.y - y) - (n.type === 'boss' ? 52 : 34));
      for (const [a, b] of World.edges) clear = Math.min(clear, segDist({ x, y }, World.byId[a], World.byId[b]) - 12);
      for (const k in labelCache) clear = Math.min(clear, Math.hypot((labelCache[k].x - x) * 0.4, labelCache[k].y - y) - 26);
      const score = Math.min(clear, 26) + (dir < 0 ? y0 - y : y - y1) * 0.02;
      if (!best || score > best.score) best = { x, y, score };
    }
    return (labelCache[key] = best);
  }

  const lvColor = (L) => (L <= 3 ? '#3f9a46' : L <= 6 ? '#d9a21b' : L <= 9 ? '#e0731f' : '#c63b31');
  function drawNodes() {
    const run = st.run, cleared = new Set(run ? run.cleared : []);
    for (const n of World.nodes) {
      if (!visibleNode(n)) continue;
      const isBoss = n.type === 'boss', isCamp = n.type === 'camp';
      const r = isBoss ? 27 : isCamp ? 22 : n.type === 'elite' ? 19 : 17;
      const done = cleared.has(n.id) && !isCamp;
      const frontier = st.frontier.has(n.id);
      // Frontier pulse and selection ring.
      if (frontier) {
        const k = (T * 1.1) % 1;
        ctx.strokeStyle = 'rgba(255,214,90,' + (0.95 * (1 - k)) + ')'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(n.x, n.y, r + 3 + k * 14, 0, 7); ctx.stroke();
        ctx.strokeStyle = '#ffd65a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(n.x, n.y, r + 3, 0, 7); ctx.stroke();
      }
      if (isBoss && !done) {
        const g = ctx.createRadialGradient(n.x, n.y, r, n.x, n.y, r + 22);
        g.addColorStop(0, 'rgba(255,214,90,' + (0.45 + 0.2 * Math.sin(T * 2.5)) + ')'); g.addColorStop(1, 'rgba(255,214,90,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, r + 22, 0, 7); ctx.fill();
      }
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(n.x + 2, n.y + r * 0.75, r * 0.9, r * 0.35, 0, 0, 7); ctx.fill();
      const ring = { boss: '#c8962e', elite: '#c0392b', shrine: '#2f8fb3', treasure: '#b8860b', camp: '#5b4630', battle: '#5b4630' }[n.type];
      const fill = done ? '#cfc8b8' : { boss: '#fff1c2', elite: '#ffe9e4', shrine: '#e3f6ff', treasure: '#fff3d6', camp: '#fffaf0', battle: '#fffaf0' }[n.type];
      ctx.fillStyle = fill; ctx.strokeStyle = ring; ctx.lineWidth = isBoss ? 4 : 3;
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.fill(); ctx.stroke();
      const theme = World.THEMES[n.sub];
      const icon = isCamp ? '⛺' : n.type === 'shrine' ? '⛲' : n.type === 'treasure' ? '🎁' : isBoss ? theme.boss[1] : n.type === 'elite' ? theme.tough[1] : theme.basic[1];
      ctx.globalAlpha = done ? 0.4 : 1;
      ctx.font = (isBoss ? 28 : 18) + 'px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(icon, n.x, n.y + 1);
      ctx.globalAlpha = 1;
      if (isBoss) { ctx.font = '18px system-ui, "Apple Color Emoji", sans-serif'; ctx.fillText(st.save && st.save.bossesBeaten.includes(n.sub) ? '🏳️' : '👑', n.x, n.y - r - 8); }
      if (n.type === 'elite' && !done) { ctx.font = '11px system-ui, sans-serif'; ctx.fillText('☠', n.x + r - 2, n.y - r + 3); }
      if (done) { ctx.fillStyle = '#2e7d32'; ctx.font = '700 14px system-ui, sans-serif'; ctx.fillText('✓', n.x + r - 3, n.y - r + 4); }
      // Level pill.
      if (!isCamp && n.type !== 'shrine' && n.type !== 'treasure') {
        const label = 'Lv' + n.level, w = isBoss ? 34 : 28, y = n.y + r + 8;
        ctx.fillStyle = done ? '#9b9486' : lvColor(n.level);
        ctx.beginPath(); ctx.roundRect(n.x - w / 2, y - 7, w, 14, 7); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.font = '700 10px system-ui, sans-serif'; ctx.fillText(label, n.x, y + 0.5);
      }
      if (st.selected === n.id) {
        ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 5]); ctx.lineDashOffset = -T * 20;
        ctx.beginPath(); ctx.arc(n.x, n.y, r + 7, 0, 7); ctx.stroke(); ctx.restore();
      }
    }
  }

  function drawToken() {
    const bob = Math.sin(T * 4) * 2 - (token.walk ? Math.abs(Math.sin(T * 12)) * 4 : 0);
    const x = token.x + 16, y = token.y - 20 + bob;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(token.x + 16, token.y - 4, 11, 4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3d5afe'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, 14, 0, 7); ctx.fill(); ctx.stroke();
    ctx.font = '17px system-ui, "Apple Color Emoji", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🧙', x, y + 1);
  }

  function drawFog() {
    for (const sub of World.SUBAREAS) {
      const a = fogA[sub.id] || 0; if (a <= 0.01) continue;
      ctx.save(); ctx.globalAlpha = a;
      for (const p of fogPuffs[sub.id]) {
        const dx = Math.sin(T * 0.25 + p.ph) * 6;
        ctx.fillStyle = '#c9ccd3'; ctx.beginPath(); ctx.arc(p.x + dx + 3, p.y + 6, p.r, 0, 7); ctx.fill();
      }
      for (const p of fogPuffs[sub.id]) {
        const dx = Math.sin(T * 0.25 + p.ph) * 6;
        ctx.fillStyle = '#eef0f4'; ctx.beginPath(); ctx.arc(p.x + dx, p.y, p.r, 0, 7); ctx.fill();
      }
      const b = sub.bounds, cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#56596a';
      ctx.font = '22px system-ui, sans-serif'; ctx.fillText('🔒', cx, cy - 24);
      ctx.font = '700 16px Georgia, serif'; ctx.fillText(sub.name, cx, cy + 2);
      ctx.font = '13px Georgia, serif'; ctx.fillText('Defeat the ' + bossNameFor(sub.id).split(' (')[0], cx, cy + 22);
      ctx.restore();
    }
  }

  // ---------- Hero walking ----------
  function stepToken(dt) {
    const w = token.walk; if (!w) return;
    let left = dt * 300;
    while (left > 0 && w.pts.length) {
      const p = w.pts[0], d = Math.hypot(p.x - token.x, p.y - token.y);
      if (d <= left) { token.x = p.x; token.y = p.y; left -= d; w.pts.shift(); }
      else { token.x += (p.x - token.x) / d * left; token.y += (p.y - token.y) / d * left; left = 0; }
    }
    follow = { x: token.x, y: token.y + (0.5 - FOCUS_Y) * vh / z };
    if (!w.pts.length) { token.walk = null; w.done(); }
  }
  function walk(ids) {
    return new Promise((done) => {
      const pts = ids.map((id) => World.byId[id]).filter(Boolean);
      if (!pts.length) return done();
      token.walk = { pts, done };
    });
  }
  function placeToken(id) { const n = World.byId[id]; token.x = n.x; token.y = n.y; }

  // ---------- Input: drag to pan, tap to select ----------
  let pan = null;
  canvas.addEventListener('pointerdown', (ev) => { pan = { x: ev.clientX, y: ev.clientY, cx: cam.x, cy: cam.y, moved: false }; canvas.setPointerCapture(ev.pointerId); });
  canvas.addEventListener('pointermove', (ev) => {
    if (!pan) return;
    const dx = ev.clientX - pan.x, dy = ev.clientY - pan.y;
    if (!pan.moved && Math.hypot(dx, dy) > 8) pan.moved = true;
    if (pan.moved) { follow = null; cam.x = pan.cx - dx / z; cam.y = pan.cy - dy / z; }
  });
  canvas.addEventListener('pointerup', (ev) => {
    const p = pan; pan = null;
    if (!p || p.moved) return;
    const r = canvas.getBoundingClientRect();
    const wx = (ev.clientX - r.left - vw / 2) / z + cam.x, wy = (ev.clientY - r.top - vh / 2) / z + cam.y;
    let best = null;
    for (const n of World.nodes) {
      if (!visibleNode(n)) continue;
      const d = Math.hypot(n.x - wx, n.y - wy);
      if (d < (n.type === 'boss' ? 38 : 30) && (!best || d < best.d)) best = { n, d };
    }
    onTap(best ? best.n : null);
  });
  canvas.addEventListener('wheel', (ev) => { ev.preventDefault(); follow = null; cam.x += ev.deltaX / z; cam.y += ev.deltaY / z; }, { passive: false });

  function resize() {
    const r = canvas.getBoundingClientRect();
    vw = r.width; vh = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    z = vw / VIEW;
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
    buildTerrain();
  }
  window.addEventListener('resize', resize);

  window.WorldMap = {
    init(opts) { onTap = opts.onTap; resize(); requestAnimationFrame(frame); },
    update(next) { Object.assign(st, next); },
    focus(x, y, instant) {
      const t = { x, y: y + (0.5 - FOCUS_Y) * vh / z };
      if (instant) { cam.x = t.x; cam.y = t.y; follow = null; } else follow = t;
    },
    walk, placeToken,
    // Screen position of a node in CSS pixels (used by automated tests).
    screenOf(id) { const n = World.byId[id], r = canvas.getBoundingClientRect(); return { x: r.left + (n.x - cam.x) * z + vw / 2, y: r.top + (n.y - cam.y) * z + vh / 2 }; },
    setActive(on) { if (on === active) return; active = on; if (on) { frame.last = 0; requestAnimationFrame(frame); } },
    resize,
  };
})();
