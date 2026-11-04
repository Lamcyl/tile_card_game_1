// Drawing helpers shared by the Rice Terraces and Mossy Ruins generators: <symbol>-style reuse, rice clumps, paddy bases, terrace walls, connect-4 builder.
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, FAM, skeleton, inShape, maker, scat, C4, BIT, blobGeom } from './sub.mjs';
import { waterFill } from './ground.mjs';
import { wrapped } from './lib.mjs';
const EXTX = 26;

// reuse: define a group once in <defs>, then <use> it (keeps files small). Gradients referenced inside stay valid (ids are per tile).
export const sym = (t, inner) => { const id = t.id(); t.defs.push(`<g id="${id}">${inner}</g>`); return id; };
export const use = (id, x, y, sc = 1, rot = 0) => `<use href="#${id}" transform="translate(${f(x)} ${f(y)})${rot ? ` rotate(${f(rot)})` : ''}${sc !== 1 ? ` scale(${sc})` : ''}"/>`;

// ---- connect-4 builder (16 pieces, bits N1 E2 S4 W8) ----
export const connect = (sub, cat = 'fences') => (name, draw, tags = []) => {
  const { mk, out } = maker(sub);
  for (let m = 0; m < 16; m++) { const v = String(m).padStart(2, '0'), t = mk(cat, name, v); draw(t, m); out(t, cat, name, v, ['autotile', 'connect4', 'mask:' + m, ...tags]); }
};
export const armX = (m) => [m & C4.W ? 0 : 32, m & C4.E ? 64 : 32];

// ---- rice ----
// stage: young | mid | ripe | stubble | lodged. Drawn with its base at (0,0); extents x -6..6, y -11..2.
export const RICE = {
  young: { n: 5, h: 6.5, cols: ['#b6e69a', '#7fcb6a', '#4fa655'] },
  mid: { n: 7, h: 9.5, cols: ['#8fd078', '#5fae5c', '#3a8048'] },
  ripe: { n: 7, h: 9.5, cols: ['#f6d878', '#eab84a', '#c8902a'], pan: ['#f3c24f', '#d89a2c'] },
  green: { n: 7, h: 9.5, cols: ['#c8dc78', '#a8c85a', '#7aa84a'], pan: ['#d8d060', '#b8b04a'] },
  stubble: { n: 4, h: 3, cols: ['#e8d29a', '#cdb070', '#a88a4e'] },
};
export function clump(stage, seed = 1) {
  const S = RICE[stage], r = rng(seed * 7919 + 13); let g = ['', '', ''];
  for (let i = 0; i < S.n; i++) {
    const dx = (i - (S.n - 1) / 2) * (stage === 'stubble' ? 2.2 : 1.45), h = S.h * r.range(.8, 1.12), lean = dx * (stage === 'stubble' ? .3 : 1.0) + r.range(-.8, .8);
    const ex = dx + lean * .7, ey = -h, d = `M${f(dx * .6)} 0Q${f(dx + lean * .15)} ${f(-h * .55)} ${f(ex)} ${f(ey)}`;
    g[i % 3] += d;
    if (S.pan && i % 2 === 0) g[2] += `M${f(ex)} ${f(ey)}`;   // nothing; panicle below
  }
  let o = line(g[2], S.cols[2], 1.15, .95) + line(g[1], S.cols[1], 1.15, .95) + line(g[0], S.cols[0], 1.1, .95);
  if (S.pan) for (let i = 0; i < S.n; i += 2) { const dx = (i - (S.n - 1) / 2) * 1.45, ex = dx * 1.5 + (i % 4 ? 1.6 : -1.4); o += ell(ex + (dx > 0 ? 1.1 : -1.1), -S.h + 2.2, 2.2, 1, S.pan[i % 4 ? 0 : 1], 1, dx > 0 ? 55 : -55); }
  if (stage === 'stubble') o += ell(0, .4, 3.6, 1, '#6b5a38', .3);
  return o;
}
// stage rendered once per tile as a symbol; the paddy lattice (shared by every paddy tile, so neighbours never fight) is drawn as <use>
export function paddyLattice(t, stage, { omit = 0, seed = 1, wet = true } = {}) {
  const id = sym(t, (wet ? ell(0, 1.6, 5.4, 1.5, stage === 'ripe' || stage === 'stubble' ? '#7a8a6a' : '#3a8a78', .2) : ell(0, 1.4, 5, 1.2, '#6b5a38', .2)) + clump(stage, 3)), id2 = sym(t, (wet ? ell(0, 1.6, 5.4, 1.5, stage === 'ripe' || stage === 'stubble' ? '#7a8a6a' : '#3a8a78', .2) : '') + clump(stage, 5));
  const r = rng(hash('lat-' + stage)), r2 = rng(seed * 31 + 5); let o = '';
  [12, 28, 44, 60].forEach((y, row) => [8, 24, 40, 56].forEach((x, col) => {
    const jx = r.range(-1.2, 1.2), jy = r.range(-.5, .5); if (omit && row < 3 && col > 0 && col < 3 && r2() < omit) return;   // clumps that wrap over a tile edge (outer rows/columns) are never omitted, so neighbours stay seamless
    for (const dy of [-64, 0, 64]) for (const dx of [-64, 0, 64]) if (y + dy + jy + 4 > 0 && y + dy + jy - 12 < 64 && x + dx + jx + 10 > 0 && x + dx + jx - 10 < 64) o += use((row + col) % 2 ? id : id2, x + jx + dx, y + jy + dy);
  }));
  return o;
}
// the base ground of a paddy stage (seamless: only family skeletons + wrapped ripples)
export function paddyBase(stage) {
  if (stage === 'young' || stage === 'mid' || stage === 'water') return waterFill('shallow') + wrapped(20, 30, 20, (x, y) => ell(x, y, 20, 9, '#7fbf9a', stage === 'young' ? .12 : .2, 15)) ;
  if (stage === 'ripe') return skeleton(FAM.dirt) + wrapped(40, 20, 18, (x, y) => ell(x, y, 18, 8, '#8fb8c0', .14, -12));
  return skeleton(FAM.dirt);   // stubble
}
// small glints of standing water for drained paddies
export const puddleGlint = (x, y, w = 9) => ell(x, y, w, w * .35, '#a8d4d8', .75) + ell(x - 1, y - .6, w * .55, w * .14, '#fff', .6);

// ---- raised terrace: blob47 builder that reads as a height step (wall on the S side) ----
export function terracePiece(t, G, { top, wall, lip, bund = false, seed = 'ter' }) {
  const clip = t.clip(G.d), id = clip.slice(5, -1), WALL = 22, hasS = G.h(BIT.S), wy = T - G.mg.s;
  t.add(skeleton(FAM.grass));
  if (!hasS) t.add(rect(G.x0, wy - 1, G.x1 - G.x0, 8, '#3b3a24', 0, .2), rect(G.x0 + 2, wy, G.x1 - G.x0 - 4, 5, '#2e2c1a', 0, .14));
  t.add(path(G.d, 'none', 1, { stroke: '#7a5c3c', 'stroke-width': 5, 'stroke-opacity': .16, 'stroke-linejoin': 'round' }));
  t.add(`<g clip-path="url(#${id})">`, top(t, G));
  if (bund) t.add(path(G.d, 'none', 1, { stroke: '#7a5c3c', 'stroke-width': 17, 'stroke-opacity': .16, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#d9c08c', 'stroke-width': 12, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#ecdcae', 'stroke-width': 5, 'stroke-opacity': .7, 'stroke-linejoin': 'round' }));
  else t.add(path(G.d, 'none', 1, { stroke: '#f1e9d3', 'stroke-width': 7, 'stroke-opacity': .4, 'stroke-linejoin': 'round' }));
  const walls = []; if (!hasS) walls.push([G.x0, G.x1]);
  if (G.notches.length) { if (G.h(BIT.S) && G.h(BIT.W) && !G.h(BIT.SW)) walls.push([-EXTX, G.mg.w]); if (G.h(BIT.S) && G.h(BIT.E) && !G.h(BIT.SE)) walls.push([T - G.mg.e, T + EXTX]); }
  for (const [a, b] of walls) { t.add(wall(t, a, b, wy, WALL)); t.add(lip(t, a, b, wy - WALL)); t.add(rect(a, wy - 5, b - a, 5, '#3b3a24', 0, .16)); }
  t.add('</g>', path(G.d, 'none', 1, { stroke: '#6e4c30', 'stroke-width': 1.2, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }));
}
// ---- wall styles (period 64 in x so neighbouring pieces continue) ----
export const earthWall = (cols = ['#cfae7c', '#a98458', '#7a5c3c'], tone = 'earth') => (t, a, b, wy, WALL) => {
  const r = rng(hash('ew' + tone)); let o = rect(a, wy - WALL, b - a, WALL + 1, t.lg(cols, 90));
  for (let k = 0; k < 3; k++) o += rect(a, wy - WALL + 6 + k * 6, b - a, 1.2, cols[2], 0, .3);
  for (let i = 0; i < 5; i++) { const x = r.range(2, 62), y = wy - WALL + r.range(6, 16); o += wrapped(x, y, 6, (p, q) => ell(p, q, r.range(2, 3.4), r.range(1.2, 2), '#c8b494', .8, r.range(-20, 20), ink('#6e4c30', .5, .5)) + line(`M${f(p - 4)} ${f(q + 4)}q3 -1 7 1`, cols[2], 1, .4));
  }
  for (let i = 0; i < 3; i++) { const x = r.range(2, 62); o += wrapped(x, wy - WALL + 6, 4, (p, q) => line(`M${f(p)} ${f(q)}q2 5 -1 9`, '#6b4a2c', 1, .5)); }
  return o;
};
const STN = ['#d8d2bc', '#aaa48e', '#7d7766'];
export const stoneWall = (moss = 0, cols = STN, tone = 'sw') => (t, a, b, wy, WALL) => {
  let o = rect(a, wy - WALL, b - a, WALL + 1, '#6e6a58'); const r = rng(hash('sw' + tone)), rows = 3, rh = (WALL + 1) / rows;
  for (let row = 0; row < rows; row++) {
    const n = row % 2 ? 5 : 4, ws = Array.from({ length: n }, () => r.range(.7, 1.3)), tot = ws.reduce((x, y) => x + y, 0); let x = row % 2 ? -6 : 0;
    ws.forEach((w, i) => { const ww = w / tot * 64; o += rect(x + .5, wy - WALL + row * rh + .5, ww - 1, rh - 1, t.lg(cols, 90), 3, 1, ink('#4a463c', .6, .55)) + rect(x + 2, wy - WALL + row * rh + 1.5, ww - 5, 1.4, '#fff', 1, .3); x += ww; });
  }
  if (moss) { const m = rng(hash('swm' + tone)); for (let i = 0; i < moss; i++) { const x = m.range(2, 62), y = wy - WALL + m.range(0, 14), w = m.range(6, 12); o += wrapped(x, y, w, (p, q) => path(`M${f(p)} ${f(q)}q${f(w / 2)} -3 ${f(w)} 0q-1 5 ${f(-w * .3)} 6q${f(-w * .3)} -3 ${f(-w * .7)} -1Z`, '#86b865', .95)); } }
  return o;
};
// lip drawn along the top of a wall (y = top of the wall)
export const grassLip = (t, a, b, y) => { let o = rect(a, y, b - a, 3, '#f1e9d3', 0, .5); for (let x = Math.ceil(a / 8) * 8 + 3; x < b; x += 8) o += line(`M${x} ${y + 1}q-1.5 4 .5 7M${x + 2.5} ${y + 1}q1 3 0 5`, '#7fae5e', 1.1, .85); return o; };
export const bundLip = (t, a, b, y) => rect(a, y - 2, b - a, 6, t.lg(['#efe0b4', '#cfae7c'], 90)) + rect(a, y - 2, b - a, 1.2, '#fff', 0, .5) + rect(a, y + 3.4, b - a, 1, '#7a5c3c', 0, .35);
export const stoneLip = (t, a, b, y) => rect(a, y - 1, b - a, 4, '#eeeadb') + rect(a, y - 1, b - a, 1, '#fff', 0, .7) + rect(a, y + 2.8, b - a, 1, '#4a463c', 0, .4);
