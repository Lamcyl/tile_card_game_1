// Standalone viewer for the tile world (WP20 step 3): tile renderer + navigation without the game data.
// Query: r=<region> (default greenvale), at=tx,ty (hero tile), zoom=0.8, unlocked=a,b|all (default: start sub only),
// open=a,b|all (sub-areas whose gates are open this run; default = unlocked), hud=0.
// world-gen.js is UMD: the bundler treats it as CommonJS, so the global is set here before the plain scripts run.
window.WorldGen = (await import('./js/world-gen.js')).default;
await import('./js/world-nav.js');
await import('./js/tilemap.js');

const WG = window.WorldGen, WN = window.WorldNav, TM = window.TileMap, T = 64;
const Q = new URLSearchParams(location.search);
const regionId = Q.get('r') || 'greenvale';
const cv = document.getElementById('v'), ctx = cv.getContext('2d'), hud = document.getElementById('hud');
if (Q.get('hud') === '0') hud.style.display = 'none';
const dpr = Math.min(window.devicePixelRatio || 1, 3);
let vw = 0, vh = 0, zoom = +(Q.get('zoom') || 0.8);
const resize = () => { vw = innerWidth; vh = innerHeight; cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr); };
addEventListener('resize', resize); resize();

const subList = (key, def) => { const v = Q.get(key); return v === 'all' ? WG.regions.flatMap((r) => r.subIds) : v ? v.split(',') : def; };
const region = WG.regions.find((r) => r.id === regionId);
let unlocked = new Set(subList('unlocked', [region.startSub, 'camp']));
let open = new Set(subList('open', [...unlocked]));
const gateOf = new Map(); for (const r of WG.regions) for (const g of r.gates) gateOf.set(g.prop.x + ',' + g.prop.y, g);
const subOpen = (s) => open.has(s);
const closedGate = (g) => !!g.to && !subOpen(g.to);
TM.setFog((s) => !unlocked.has(s));
TM.setGateState((q, p) => { const g = gateOf.get((q.ox + p.x) + ',' + (q.oy + p.y)); return !g || !closedGate(g); });
const walkable = (tx, ty) => { if (WN.blockedTile(tx, ty)) return false; const g = WN.gateAtTile(tx, ty); return !(g && closedGate(g)); };

const start = Q.get('at') ? Q.get('at').split(',').map(Number) : (region.kind === 'camp' ? [region.origin[0] + 24, region.origin[1] + 24] : [Math.floor(region.entry[0] / T), Math.floor(region.entry[1] / T)]);
const hero = { x: (start[0] + 0.5) * T, y: (start[1] + 0.5) * T, path: [], face: 1, step: 0 };
const cam = { x: hero.x, y: hero.y - 60 };

// nodes (markers only): enemies, boss, poi, shop, event, waypoint, secret
const NODE_COL = { spot: '#c8402f', elite: '#d9822b', boss: '#7a1f6b', poi: '#d9b43a', shop: '#3d9a6b', event: '#4d639a', wp: '#4aa8c8', secret: '#8a7a62' };
const nodes = [];
for (const r of WG.regions) for (const s of Object.values(r.subareas)) {
  const add = (k, p, r2) => p && nodes.push({ k, x: p[0], y: p[1], sub: s.id, r: r2 || 15 });
  (s.spots || []).forEach((p) => add('spot', p)); (s.elites || []).forEach((p) => add('elite', p, 20)); add('boss', s.boss, 28);
  add('poi', s.poi); add('shop', s.shop); add('event', s.event); add('wp', s.wp); add('secret', s.secret);
}

function drawNode(c, n) {
  const col = NODE_COL[n.k], r = n.r;
  c.fillStyle = '#0003'; c.beginPath(); c.ellipse(n.x + 2, n.y + 3, r * 0.9, r * 0.35, 0, 0, 7); c.fill();
  c.fillStyle = col; c.strokeStyle = '#2b3445'; c.lineWidth = 2; c.beginPath(); c.arc(n.x, n.y - r * 0.8, r * 0.8, 0, 7); c.fill(); c.stroke();
}
function drawHero(c) {
  const { x, y } = hero, bob = hero.path.length ? Math.abs(Math.sin(hero.step * 0.12)) * 4 : 0;
  c.fillStyle = '#0003'; c.beginPath(); c.ellipse(x, y + 2, 15, 6, 0, 0, 7); c.fill();
  c.fillStyle = '#f4ecd7'; c.strokeStyle = '#2b3445'; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y - 22 - bob, 13, 0, 7); c.fill(); c.stroke();
  c.fillStyle = '#c8402f'; c.beginPath(); c.arc(x + hero.face * 4, y - 24 - bob, 3, 0, 7); c.fill();
}

function walkTo(x, y) {
  const p = WN.findPath(hero.x, hero.y, x, y, walkable); if (!p) return 0; hero.path = p; return p.length;
}
let down = null;
cv.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false }; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.hypot(dx, dy) > 6) down.moved = true; if (down.moved) { cam.x = down.cx - dx / zoom; cam.y = down.cy - dy / zoom; follow = false; } });
cv.addEventListener('pointerup', (e) => { if (down && !down.moved) { walkTo((e.clientX - vw / 2) / zoom + cam.x, (e.clientY - vh * 0.5) / zoom + cam.y); follow = true; } down = null; });
let follow = true;

let last = performance.now(); const times = [];
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (hero.path.length) {
    let rest = 280 * dt;
    while (rest > 0 && hero.path.length) { const [tx, ty] = hero.path[0], d = Math.hypot(tx - hero.x, ty - hero.y); if (d <= rest) { hero.x = tx; hero.y = ty; hero.path.shift(); rest -= d; } else { hero.x += (tx - hero.x) / d * rest; hero.y += (ty - hero.y) / d * rest; if (Math.abs(tx - hero.x) > 1) hero.face = tx > hero.x ? 1 : -1; rest = 0; } }
    hero.step++;
  }
  if (follow) { const k = 1 - Math.pow(0.001, dt); cam.x += (hero.x - cam.x) * k; cam.y += (hero.y - 30 - cam.y) * k; }
  const t0 = performance.now();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#2b3445'; ctx.fillRect(0, 0, vw, vh);
  ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, dpr * (vw / 2 - cam.x * zoom), dpr * (vh * 0.5 - cam.y * zoom));
  const view = { x0: cam.x - vw / 2 / zoom - 2, y0: cam.y - vh * 0.5 / zoom - 2, x1: cam.x + vw / 2 / zoom + 2, y1: cam.y + vh * 0.5 / zoom + 2 };
  const sprites = [{ y: hero.y, x: hero.x, draw: drawHero }];
  for (const n of nodes) if (n.x > view.x0 - 40 && n.x < view.x1 + 40 && n.y > view.y0 - 40 && n.y < view.y1 + 80 && unlocked.has(n.sub)) sprites.push({ y: n.y, x: n.x, draw: (c) => drawNode(c, n) });
  TM.render(ctx, view, sprites, now);
  const ms = performance.now() - t0; times.push(ms); if (times.length > 240) times.shift();
  if (hud.style.display !== 'none') hud.textContent = `${regionId} tile ${Math.floor(hero.x / T)},${Math.floor(hero.y / T)} sub ${WN.subAt(hero.x, hero.y) || '-'} | ${ms.toFixed(1)} ms | chunks ${TM.chunkCount()}`;
  requestAnimationFrame(frame);
}
const ids = [...new Set([regionId, ...WG.regions.filter((r) => r.id !== regionId && Math.abs(r.origin[0] - region.origin[0]) < 130 && Math.abs(r.origin[1] - region.origin[1]) < 130).map((r) => r.id)])];
Promise.all(ids.map((id) => TM.load(id))).then(() => { window.__ready = true; requestAnimationFrame(frame); });

window.TilesDbg = {
  hero, cam, walkTo: (tx, ty) => walkTo((tx + 0.5) * T, (ty + 0.5) * T), isWalking: () => hero.path.length > 0,
  teleport(tx, ty) { hero.x = (tx + 0.5) * T; hero.y = (ty + 0.5) * T; hero.path = []; cam.x = hero.x; cam.y = hero.y - 30; follow = true; },
  look(tx, ty) { cam.x = (tx + 0.5) * T; cam.y = (ty + 0.5) * T; follow = false; },
  setZoom(z) { zoom = z; },
  setUnlocked(l) { unlocked = new Set(l); TM.refreshFog(); }, setOpen(l) { open = new Set(l); },
  stats: () => ({ p95: [...times].sort((a, b) => a - b)[Math.floor(times.length * 0.95)], avg: times.reduce((a, b) => a + b, 0) / Math.max(1, times.length), max: Math.max(0, ...times), n: times.length }),
  WG, WN,
};
