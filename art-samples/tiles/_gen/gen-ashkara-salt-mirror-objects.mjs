// Ashkara sub-area 4 Salt Mirror objects: trees (dead salt trees and palms, tamarisk, samphire, saltbush), rocks (salt pillars, boulders, crystal clusters, cairns, arch),
// grass (salt grass, brine reeds) and props (mining carts, ore piles, skulls, glass, sacks, flamingos, windlass). Runs on its own; helpers come from salt-mirror-lib.mjs.
import { T, rng, f, ell, circ, rect, path, line, ink, D, sh, pebbleD, tuft, blobPath, C, TALL, LG, tile, SLT, CLD, PNK, IRON, RUST, WOODS, BONE, mound, crust, brineEdge, crystal, bone, rib, skull, hornSkull, srock, SROCK, sblock, mix } from './salt-mirror-lib.mjs';

const TR = (n, v, size, tags, fn) => tile('trees', n, v, size, [...tags, size === TALL ? 'tall' : 'one', 'obstacle'], fn);
const RK = (n, v, size, tags, fn) => tile('rocks', n, v, size, [...tags, size === TALL ? 'tall' : size === LG ? 'large' : 'one', 'obstacle'], fn);
const GR = (n, v, size, tags, fn) => tile('grass', n, v, size, [...tags, size === TALL ? 'tall' : 'one'], fn);
const PR = (n, v, size, tags, fn) => tile('props', n, v, size, [...tags, size === TALL ? 'tall' : size === LG ? 'large' : 'one'], fn);
const salty = (t, ang = 0) => t.lg(['#ffffff', '#e8dfd4', '#a89aa4'], ang);
const wood = (t, ang = 0) => t.lg(['#c9b79a', '#9a8264', '#62503a'], ang);

// ================= trees =================
// dead tree whitened by salt: bleached trunk, crusted branches, a pink brine stain at the foot
const dtree = (t, r, lean, nb, crooked) => {
  const fy = 118; let o = sh(32, fy, 20, 5) + mound(t, 32, fy - 2, 24, 6) + ell(32, fy - 1, 16, 3, '#e690a8', .3);
  const tx = 32 + lean, ty = 28;
  o += path(`M${25} ${fy - 4}Q${27 + lean * .3} ${fy - 40} ${tx - 4} ${ty}Q${tx} ${ty - 6} ${tx + 4} ${ty}Q${37 + lean * .3} ${fy - 40} ${39} ${fy - 4}Z`, salty(t, 0), 1, ink('#6e6480', 1, .8));
  o += line(`M${30} ${fy - 8}Q${31 + lean * .3} ${fy - 44} ${tx - 1} ${ty + 4}`, '#a89aa4', 1, .5) + line(`M${33} ${fy - 14}Q${34 + lean * .3} ${fy - 50} ${tx + 1} ${ty + 8}`, '#fff', 1.2, .8);
  const br = [[ty + 14, -1, 17, -11], [ty + 30, 1, 15, -9], [ty + 46, -1, 12, -5], [ty + 22, 1, 12, -12]].slice(0, nb);
  for (const [y, d, l, up] of br) { const bx = tx + lean * -.1 + d * 3, ex = bx + d * l, ey = y + up; o += path(`M${bx} ${y + 2}Q${bx + d * l * .5} ${y + up * .3} ${ex} ${ey}L${ex + d} ${ey - 2}Q${bx + d * l * .5} ${y + up * .3 - 4} ${bx} ${y - 2}Z`, salty(t, 0), 1, ink('#6e6480', .8, .8)) + line(`M${ex} ${ey}l${d * 5} ${crooked ? -2 : -6}M${ex} ${ey}l${d * 3} 4`, '#e8dfd4', 1.4, 1); }
  o += line(`M${tx - 2} ${ty + 1}l-5 -9M${tx + 2} ${ty + 1}l4 -10M${tx} ${ty}l0 -8`, '#e8dfd4', 1.6, 1) + ell(tx, ty + 2, 3.4, 1.6, '#6e6480', .5);
  for (let i = 0; i < 6; i++) o += circ(tx + r.range(-5, 5), r.range(ty + 4, fy - 20), r.range(.6, 1.3), '#fff', .9);
  return o;
};
TR('dead-tree-salt', 'a', TALL, ['dead', 'salt'], (t, r) => dtree(t, r, -4, 3, false));
TR('dead-tree-salt', 'b', TALL, ['dead', 'salt'], (t, r) => dtree(t, r, 6, 2, true));
TR('dead-tree-salt', 'c', TALL, ['dead', 'salt'], (t, r) => dtree(t, r, 0, 4, false));
TR('dead-tree-salt', 'd', TALL, ['dead', 'salt'], (t, r) => dtree(t, r, -8, 2, true));
// dead date palm: a lone survivor of the mirage island, fronds hanging like a rib cage
const dpalm = (t, r, lean, n) => {
  const fy = 118; let o = sh(32, fy, 18, 5) + mound(t, 32, fy - 2, 22, 5.6);
  const tx = 32 + lean;
  o += path(`M28 ${fy - 3}Q${29 + lean * .4} ${fy - 44} ${tx - 3} 30L${tx + 3} 30Q${36 + lean * .4} ${fy - 44} 37 ${fy - 3}Z`, wood(t, 0), 1, ink('#4a3a28', 1, .85));
  for (let y = 40; y < fy - 6; y += 7) o += line(`M${28 + (y - 30) * .02 + lean * .2} ${y}q4 2.4 8 0`, '#62503a', 1, .6);
  for (let i = 0; i < n; i++) { const a = -150 + i * (120 / (n - 1)), A = a * Math.PI / 180, l = r.range(22, 30), ex = tx + Math.cos(A) * l, ey = 30 + Math.sin(A) * l * .6 + 18; o += line(`M${tx} 30Q${f(tx + Math.cos(A) * l * .5)} ${f(30 - 6)} ${f(ex)} ${f(ey)}`, '#a89a78', 2.6, .95) + line(`M${tx} 30Q${f(tx + Math.cos(A) * l * .5)} ${f(30 - 6)} ${f(ex)} ${f(ey)}`, '#e8dfd4', 1, .9); for (let k = 1; k < 5; k++) { const u = k / 5, px = tx + (ex - tx) * u, py = 30 + (ey - 30) * u - Math.sin(u * 3.14) * 6; o += line(`M${f(px)} ${f(py)}l${f((ex > tx ? 1 : -1) * 2)} 5`, '#c9bca0', 1, .8); } }
  return o + circ(tx, 29, 3, '#9a8264', 1, ink('#4a3a28', .6, .8));
};
TR('dead-palm-salt', 'a', TALL, ['dead', 'palm', 'salt'], (t, r) => dpalm(t, r, -3, 7));
TR('dead-palm-salt', 'b', TALL, ['dead', 'palm', 'salt'], (t, r) => dpalm(t, r, 5, 5));
// tamarisk: feathery grey-green shrub that tolerates salt, pink flower plumes
const tama = (t, r, n, bloom) => {
  const fy = 52; let o = sh(30, fy, 15, 4) + mound(t, 32, fy - 1, 17, 4.4);
  o += path(`M29 ${fy - 2}Q28 ${fy - 12} 30 ${fy - 16}H34Q36 ${fy - 12} 35 ${fy - 2}Z`, wood(t, 0), 1, ink('#4a3a28', .9, .85));
  for (let i = 0; i < n; i++) { const cx = 32 + r.range(-14, 14), cy = fy - r.range(18, 34), rx = r.range(7, 11), ry = r.range(4, 6.5); o += ell(cx + 1.4, cy + 2, rx, ry, '#2f3a2a', .18) + ell(cx, cy, rx, ry, t.lg(['#cfe0c4', '#8fb09a', '#5f8470'], 70), 1, r.range(-12, 12), ink('#3f5a4a', .8, .7)); for (let k = 0; k < 4; k++) o += ell(cx + r.range(-rx * .6, rx * .5), cy + r.range(-ry * .5, ry * .3), 3, 1, '#d8ecd0', .7, r.range(-30, 30)); if (bloom) for (let k = 0; k < 3; k++) o += ell(cx + r.range(-rx * .7, rx * .7), cy - ry + r.range(-1, 2), 1.6, 3.2, '#f2a6bc', .95, r.range(-20, 20), ink('#b4566f', .4, .7)); }
  return o;
};
TR('tamarisk-salt', 'a', C, ['shrub', 'green'], (t, r) => tama(t, r, 4, true));
TR('tamarisk-salt', 'b', C, ['shrub', 'green'], (t, r) => tama(t, r, 3, false));
// samphire: red-pink jointed succulent sprigs on a crusty hummock
const samphire = (t, r, n, col) => {
  const fy = 52; let o = sh(30, fy, 14, 4) + ell(32, fy - 1, 17, 4.4, '#e690a8', .35) + mound(t, 32, fy - 1, 15, 4);
  for (let i = 0; i < n; i++) { const a = -90 + (i - (n - 1) / 2) * (100 / n) + r.range(-8, 8), l = r.range(14, 24); let x = 32 + r.range(-6, 6), y = fy - 2, ang = a * Math.PI / 180;
    for (let k = 0; k < 4; k++) { const ll = l / 4, nx = x + Math.cos(ang) * ll, ny = y + Math.sin(ang) * ll; o += line(`M${f(x)} ${f(y)}L${f(nx)} ${f(ny)}`, col[2], 3.6, .95) + line(`M${f(x)} ${f(y)}L${f(nx)} ${f(ny)}`, col[1], 2.4, 1) + line(`M${f(x - .4)} ${f(y - .6)}L${f(nx - .4)} ${f(ny - .6)}`, col[0], .8, .8); if (k < 3) { o += line(`M${f(nx)} ${f(ny)}l${f(Math.cos(ang + 1) * 4)} ${f(Math.sin(ang + 1) * 4)}`, col[1], 1.8, .95); } x = nx; y = ny; ang += r.range(-.35, .35); } }
  return o;
};
TR('samphire', 'a', C, ['succulent', 'brine'], (t, r) => samphire(t, r, 7, ['#f8a8c0', '#d8506e', '#8e2e4c']));
TR('samphire', 'b', C, ['succulent', 'brine'], (t, r) => samphire(t, r, 5, ['#f0b890', '#c8683c', '#7a3a24']));
TR('samphire', 'c', C, ['succulent', 'brine'], (t, r) => samphire(t, r, 9, ['#d8e0a0', '#8aa05c', '#4a6a34']));
// saltbush: silvery rounded shrub
const sbush = (t, r, k) => { const fy = 52; let o = sh(30, fy, 15, 4) + mound(t, 32, fy - 1, 17, 4.4); for (let i = 0; i < k; i++) { const cx = 32 + (i - (k - 1) / 2) * 11 + r.range(-2, 2), cy = fy - 14 - r.range(0, 8), rr = r.range(9, 13); o += ell(cx + 1.4, cy + rr * .6, rr, rr * .55, '#2f3a2a', .16) + circ(cx, cy, rr, t.lg(['#eef2e4', '#b4c0aa', '#7f9080'], 60), 1, ink('#4f604f', .8, .7)); for (let j = 0; j < 8; j++) o += ell(cx + r.range(-rr * .7, rr * .6), cy + r.range(-rr * .7, rr * .5), 2.6, 1.2, j % 2 ? '#f6f8ee' : '#98a896', .85, r.range(-60, 60)); } return o; };
TR('saltbush', 'a', C, ['shrub', 'silver'], (t, r) => sbush(t, r, 2));
TR('saltbush', 'b', C, ['shrub', 'silver'], (t, r) => sbush(t, r, 3));
for (const v of ['a', 'b']) TR('stump-salt', v, C, ['dead', 'salt'], (t, r) => { const fy = 52; let o = sh(30, fy, 14, 4) + mound(t, 32, fy - 1, 17, 4.6) + path(`M20 ${fy}Q18 ${fy - 14} ${v === 'a' ? 22 : 24} ${fy - 24}L${v === 'a' ? 27 : 30} ${fy - 20}L${v === 'a' ? 32 : 34} ${fy - 28}L38 ${fy - 18}L42 ${fy - 22}Q46 ${fy - 12} 44 ${fy}Z`, salty(t, 0), 1, ink('#6e6480', .9, .8)); o += ell(34, fy - 22, 6, 2, '#a89aa4', .5) + line(`M26 ${fy - 4}V${fy - 18}M36 ${fy - 2}V${fy - 16}`, '#a89aa4', 1, .5); return o; });
for (const v of ['a', 'b']) TR('dead-shrub-salt', v, C, ['dead', 'salt'], (t, r) => { const fy = 52; let o = sh(30, fy, 14, 4) + mound(t, 32, fy - 1, 16, 4); for (let i = 0; i < (v === 'a' ? 8 : 6); i++) { const a = (-90 + (i - 3.5) * 24 + r.range(-8, 8)) * Math.PI / 180, l = r.range(16, 26), ex = 32 + Math.cos(a) * l, ey = fy - 3 + Math.sin(a) * l; o += line(`M32 ${fy - 3}Q${f(32 + Math.cos(a) * l * .5 + 2)} ${f(fy - 3 + Math.sin(a) * l * .6)} ${f(ex)} ${f(ey)}`, '#a89aa4', 2.4, .95) + line(`M32 ${fy - 3}Q${f(32 + Math.cos(a) * l * .5 + 2)} ${f(fy - 3 + Math.sin(a) * l * .6)} ${f(ex)} ${f(ey)}`, '#fff', 1, .9) + line(`M${f(ex)} ${f(ey)}l${f(Math.cos(a + .7) * 5)} ${f(Math.sin(a + .7) * 5)}`, '#e8dfd4', 1.2, 1); } return o; });

// ================= rocks =================
// salt pillar: bulbous, melted column with horizontal strata, blue shade on the right, pink stain at the foot
const spillar = (t, r, h, bulb, w = 11) => {
  const fy = 118; let o = sh(32, fy, 20, 5) + ell(32, fy - 1, 22, 5, '#e690a8', .3) + mound(t, 32, fy - 1, 20, 4.6);
  const top = fy - h; const pts = []; const n = 8;
  let L = '', Rr = '';
  for (let i = 0; i <= n; i++) { const u = i / n, y = fy - 4 - u * (h - 8), wd = w + Math.sin(u * 3.14 * 1.5 + 1) * 3 + (u > .7 ? bulb * (u - .7) * 3.3 : 0); L += `${i ? 'L' : 'M'}${f(32 - wd + r.range(-1, 1))} ${f(y)}`; pts.push([32 + wd + r.range(-1, 1), y]); }
  const topR = pts.reverse().map(p => `L${f(p[0])} ${f(p[1])}`).join('');
  const d = L + `Q32 ${f(top - 10)} ${f(pts[0][0])} ${f(pts[0][1])}` + topR.slice(0).replace(/^L[^L]*/, '') + 'Z';
  o += path(d, salty(t, 20), 1, ink('#6e6480', 1, .75));
  o += path(`M${f(32 + w * .35)} ${fy - 6}V${f(top + 8)}Q${f(32 + w + 2)} ${f(top + 6)} ${f(32 + w + 2)} ${fy - 6}Z`, CLD[1], .24);
  for (let i = 0; i < 6; i++) { const y = top + 12 + i * (h - 24) / 5; o += line(`M${f(32 - w + 1)} ${f(y)}q${w} ${r.range(-2, 3)} ${f(w * 2 - 2)} ${r.range(-1, 2)}`, '#a89aa4', 1, .4); }
  o += ell(26, top + 12, 3.4, 8, '#fff', .55, 8);
  return o;
};
RK('salt-pillar', 'a', TALL, ['salt', 'formation', 'tall'], (t, r) => spillar(t, r, 78, 1.4));
RK('salt-pillar', 'b', TALL, ['salt', 'formation', 'tall'], (t, r) => spillar(t, r, 62, 2.4, 10));
RK('salt-pillar', 'c', TALL, ['salt', 'formation', 'tall'], (t, r) => spillar(t, r, 92, .8, 9));
RK('salt-pillar', 'd', TALL, ['salt', 'formation', 'tall'], (t, r) => spillar(t, r, 54, 3, 12) + (() => { let o = ''; return o; })());
for (const [v, rx, ry] of [['a', 20, 12], ['b', 15, 10], ['c', 22, 9]]) RK('salt-boulder', v, C, ['salt', 'boulder'], (t, r) => srock(t, r, 32, 46 - (ry > 10 ? 0 : -2), rx, ry, 3));
RK('salt-cluster', 'a', C, ['salt', 'crystals'], (t, r) => { let o = sh(30, 52, 16, 4) + mound(t, 32, 51, 17, 4); for (const [x, h, w, a] of [[24, 24, 7, -14], [34, 34, 8, 4], [42, 22, 6, 16], [30, 18, 5, -6], [38, 16, 5, 24]]) o += crystal(x, 52 - (a % 2), h, w, a); return o; });
RK('salt-cluster', 'b', C, ['salt', 'crystals', 'pink'], (t, r) => { let o = sh(30, 52, 15, 4) + mound(t, 32, 51, 16, 4); for (const [x, h, w, a] of [[26, 26, 8, -8], [38, 30, 8, 10], [32, 18, 6, 0]]) o += crystal(x, 52, h, w, a, ['#fff4f6', '#f2c4d2', '#c0708a']); return o; });
RK('gypsum-rose', 'a', C, ['gypsum', 'crystals'], (t, r) => { let o = sh(30, 50, 14, 4) + ell(32, 48, 15, 4.4, t.lg(SLT, 70), 1); for (let i = 0; i < 7; i++) o += ell(32 + (i - 3) * 4, 40 - Math.abs(i - 3) * 2.2, 7, 11, '#f0eaf6', 1, (i - 3) * 20, ink('#8f86a8', .7, .8)) + line(`M${f(32 + (i - 3) * 4)} ${f(46)}l${(i - 3) * 1.4} -10`, '#fff', 1.2, .8); return o; });
for (const v of ['a', 'b']) RK('salt-mushroom', v, C, ['salt', 'formation'], (t, r) => { let o = sh(30, 52, 15, 4) + mound(t, 32, 51, 17, 4) + path('M27 51Q29 40 29 32H35Q35 40 37 51Z', salty(t, 0), 1, ink('#6e6480', .9, .8)); o += path(`M${v === 'a' ? 12 : 16} 34Q${v === 'a' ? 14 : 18} 18 32 18Q${v === 'a' ? 50 : 46} 18 ${v === 'a' ? 52 : 48} 34Q32 38 ${v === 'a' ? 12 : 16} 34Z`, t.lg(['#ffffff', '#e8dfd4', '#a89aa4'], 40), 1, ink('#6e6480', 1, .8)) + ell(24, 24, 7, 2.6, '#fff', .7, -10) + path('M34 30Q46 30 50 34Q40 37 32 36Z', CLD[1], .28); return o; });
RK('petrified-log', 'a', C, ['fossil', 'wood'], (t, r) => { let o = sh(30, 50, 22, 4) + `<g transform="rotate(-6 32 40)">` + path('M8 36Q8 30 16 30H46Q56 30 56 38Q56 46 46 46H16Q8 46 8 36Z', t.lg(['#d8cdbc', '#a89a8a', '#6a5e54'], 90), 1, ink('#4a4038', 1, .8)) + ell(52, 38, 4.4, 8, '#c8baa6', 1, 0, ink('#4a4038', .8, .8)) + ell(52, 38, 2.6, 5, 'none', 1, 0, ink('#8a7a66', .8, .8)) + [14, 24, 34].map(x => line(`M${x} 31Q${x + 3} 38 ${x} 45`, '#6a5e54', 1, .4)).join('') + line('M12 33H46', '#fff', 1.2, .5) + `</g>` + mound(t, 20, 50, 10, 2.6); return o; });
for (const v of ['a', 'b']) RK('pan-slab', v, C, ['hardpan', 'slab'], (t, r) => { let o = sh(30, 52, 18, 4); const s = v === 'a' ? 1 : -1; o += `<g transform="rotate(${s * -8} 32 44)">` + path('M10 48L14 24Q32 18 52 26L54 48Z', t.lg(['#f2e6d2', '#d6c7b2', '#a8957a'], 60), 1, ink('#6a5a44', 1, .8)) + path('M54 48L52 26L56 28L58 46Z', '#8f7a62', .9) + line('M18 30Q32 26 48 30', '#fff', 1.2, .6) + line('M22 38l8 -4l6 6M36 44l4 -6', '#8f7a62', 1, .6) + `</g>` + mound(t, 18, 51, 11, 2.6); return o; });
// cairn of cut salt blocks
for (const [v, rows] of [['a', [[3, 3], [2, 2], [1, 1]]], ['b', [[2, 2], [1, 1]]], ['c', [[4, 3], [3, 2], [2, 1], [1, 1]]]]) RK('salt-block-cairn', v, C, ['salt', 'cairn', 'signature'], (t, r) => {
  let o = sh(30, 52, 15, 4) + mound(t, 32, 51, 16, 3.6); let y = 48;
  for (const [n] of rows) { const w = 11, x0 = 32 - n * w / 2 + r.range(-1, 1); for (let i = 0; i < n; i++) o += sblock(t, x0 + i * w + r.range(-.8, .8), y - 9, w - 1, 9, 3); y -= 9; }
  return o + circ(32 + r.range(-2, 2), y - 2, 2.4, '#f6dce2', 1, ink('#a8486a', .6, .8));
});
RK('halite-cube', 'a', C, ['salt', 'crystals'], (t, r) => sh(30, 52, 15, 4) + mound(t, 32, 51, 16, 3.6) + path('M16 48V28L22 21H46V41L40 48Z', '#fffdf8', 1, ink('#8f9ac0', .9, .85)) + path('M16 28L22 21H46L40 28Z', '#fff', 1, ink('#8f9ac0', .7, .8)) + path('M40 28L46 21V41L40 48Z', '#c8c4e0', .8) + line('M20 36l8 -4M22 42l10 -6', '#fff', 1.2, .8));
// natural salt arch (128)
RK('salt-arch', 'a', LG, ['salt', 'arch', 'landmark'], (t, r) => {
  const fy = 114; let o = sh(64, fy, 54, 6) + ell(64, fy - 1, 56, 6, '#e690a8', .28) + mound(t, 64, fy - 2, 52, 6);
  o += path(`M14 ${fy - 4}Q10 60 30 36Q50 14 76 22Q100 28 112 ${fy - 4}H98Q96 62 82 48Q66 34 52 48Q42 62 34 ${fy - 4}Z`, salty(t, 30), 1, ink('#6e6480', 1.1, .8));
  o += path(`M98 ${fy - 4}Q96 62 82 48Q90 52 106 ${fy - 4}Z`, CLD[1], .28) + path('M20 70Q22 46 40 32Q30 54 28 80Z', '#fff', .6);
  for (let i = 0; i < 6; i++) o += line(`M${16 + i * 3} ${fy - 14 - i * 12}q16 -3 ${24 - i * 2} -1`, '#a89aa4', 1, .36);
  return o + [[22, fy - 2], [96, fy - 1]].map(([x, y]) => crystal(x, y, 14, 4, -10)).join('');
});

// ================= grass =================
const sgrass = (t, r, n, col, h0 = 12, h1 = 24) => { const fy = 52; let o = sh(30, fy, 13, 3.4) + ell(32, fy - 1, 15, 3.6, '#e690a8', .28); for (let i = 0; i < n; i++) { const x = 32 + (i - (n - 1) / 2) * (22 / n) + r.range(-1.4, 1.4), h = r.range(h0, h1), bend = r.range(-7, 7); o += line(`M${f(x)} ${fy}Q${f(x + bend * .3)} ${f(fy - h * .6)} ${f(x + bend)} ${f(fy - h)}`, col[2], 2.4, .95) + line(`M${f(x)} ${fy}Q${f(x + bend * .3)} ${f(fy - h * .6)} ${f(x + bend)} ${f(fy - h)}`, col[1], 1.4, 1) + line(`M${f(x - .5)} ${fy}Q${f(x + bend * .3 - .5)} ${f(fy - h * .6)} ${f(x + bend - .5)} ${f(fy - h)}`, col[0], .6, .8); } return o; };
GR('salt-grass', 'a', C, ['grass', 'pale'], (t, r) => sgrass(t, r, 11, ['#f4f0d8', '#b8c090', '#7f8c60']));
GR('salt-grass', 'b', C, ['grass', 'pale'], (t, r) => sgrass(t, r, 8, ['#f0ecd0', '#c8c88a', '#8f9460'], 8, 16));
GR('salt-grass', 'c', C, ['grass', 'pink'], (t, r) => sgrass(t, r, 9, ['#fadcd8', '#d89ab0', '#9a5a74']));
GR('pickleweed', 'a', C, ['succulent', 'green'], (t, r) => sgrass(t, r, 10, ['#d8ecc0', '#90b878', '#4f7f5a'], 6, 14));
GR('pickleweed', 'b', C, ['succulent', 'red'], (t, r) => sgrass(t, r, 10, ['#f8c8b8', '#d86a50', '#8a3a34'], 6, 14));
GR('brine-reed', 'a', TALL, ['reed', 'tall'], (t, r) => { const fy = 118; let o = sh(30, fy, 16, 4) + ell(32, fy - 1, 18, 4, '#e690a8', .28); for (let i = 0; i < 9; i++) { const x = 32 + (i - 4) * 3.4, h = r.range(56, 92), bend = r.range(-9, 9); o += line(`M${f(x)} ${fy}Q${f(x + bend * .3)} ${f(fy - h * .6)} ${f(x + bend)} ${f(fy - h)}`, '#7f8c60', 2.6, .95) + line(`M${f(x)} ${fy}Q${f(x + bend * .3)} ${f(fy - h * .6)} ${f(x + bend)} ${f(fy - h)}`, '#d8d8a8', 1.2, 1); if (i % 3 === 0) o += ell(x + bend, fy - h - 4, 2.4, 7, '#c8a878', 1, bend, ink('#7a5a3a', .6, .8)); } return o; });
GR('brine-reed', 'b', TALL, ['reed', 'tall', 'dry'], (t, r) => { const fy = 118; let o = sh(30, fy, 14, 4) + ell(32, fy - 1, 16, 4, '#e690a8', .28); for (let i = 0; i < 7; i++) { const x = 32 + (i - 3) * 4, h = r.range(48, 80), bend = r.range(-12, 12); o += line(`M${f(x)} ${fy}Q${f(x + bend * .3)} ${f(fy - h * .6)} ${f(x + bend)} ${f(fy - h)}`, '#a89a78', 2.2, .95) + line(`M${f(x)} ${fy}Q${f(x + bend * .3)} ${f(fy - h * .6)} ${f(x + bend)} ${f(fy - h)}`, '#f2ead0', 1, 1) + line(`M${f(x + bend)} ${f(fy - h)}l${bend > 0 ? 6 : -6} 8`, '#f2ead0', 1.4, .9); } return o; });
GR('dry-sedge', 'a', C, ['grass', 'pale'], (t, r) => sgrass(t, r, 13, ['#fffaf0', '#d8cfae', '#a89a78'], 10, 20));

// ================= props =================
// mining cart (side view, riveted iron bucket on a bit of rail)
const cart = (t, r, kind) => {
  let o = sh(30, 52, 22, 4); const rot = kind === 'c' ? ' rotate(-16 32 40)' : '';
  o += `<g transform="translate(0 ${kind === 'c' ? 4 : 0})${rot}">`;
  o += line('M6 51H58', '#3b3a3c', 3, .9) + line('M6 51H58', '#8a8084', 1.4, 1);
  o += circ(20, 46, 5, '#4a4448', 1, ink('#1a1618', .9, .85)) + circ(20, 46, 2, '#b8aeb0') + circ(44, 46, 5, '#4a4448', 1, ink('#1a1618', .9, .85)) + circ(44, 46, 2, '#b8aeb0');
  if (kind === 'b') o += ell(32, 26, 20, 7, t.lg(SLT, 60), 1, 0, ink('#a89aa4', .7, .7)) + ell(26, 22, 7, 2.6, '#fff', .8);
  o += path('M10 26H54L50 44H14Z', t.lg(['#d89a74', '#a8603c', '#6a3a24'], 20), 1, ink('#3a1a0c', 1, .85)) + rect(8, 24, 48, 4, '#7e7478', 1, 1, ink('#2a2024', .8, .85)) + line('M13 34H51', '#6a3a24', 1.2, .6) + line('M12 27H52', '#e8c8b0', .8, .6);
  for (const x of [16, 28, 40, 49]) o += circ(x, 31, .9, '#3a1a0c', .8);
  if (kind === 'b') o += [[16, 22], [30, 18], [44, 21]].map(([x, y]) => path(`M${x - 4} ${y + 3}Q${x} ${y - 4} ${x + 4} ${y + 3}Z`, '#fff', 1, ink('#a89aa4', .5, .8))).join('');
  o += line('M36 38l6 3', '#e690a8', 2.4, .5) + `</g>`;
  if (kind === 'c') o += [[8, 52], [4, 56]].map(([x, y]) => ell(x + 2, y - 3, 6, 2.2, '#fff', .9)).join('');
  return o;
};
for (const v of ['a', 'b', 'c']) PR('mining-cart', v, C, ['cart', 'mine', 'signature', 'obstacle'], (t, r) => cart(t, r, v));
for (const [v, n] of [['a', 1], ['b', 2], ['c', 3]]) PR('salt-pile', v, C, ['salt', 'pile'], (t, r) => { let o = sh(30, 52, 17, 4); for (let i = 0; i < n; i++) o += ell(32 + (i - (n - 1) / 2) * 12, 46 - (i === 1 ? 4 : 0), 12 - (n - 1) * 1.4, 8 + (i === 1 ? 3 : 0), t.lg(SLT, 70), 1, 0, ink('#a89aa4', .7, .7)) + ell(30 + (i - (n - 1) / 2) * 12, 40 - (i === 1 ? 4 : 0), 5, 2.2, '#fff', .9); return o + (v === 'c' ? path('M44 50l6 -6l4 6Z', '#a8603c', 1, ink('#5a2a14', .6, .85)) : ''); });
for (const [v, c] of [['a', 0], ['b', 1]]) PR('skull-ox', v, C, ['bones', 'skull'], (t, r) => mound(t, 32, 50, 14, 3) + hornSkull(32, 38, 1.5, c ? -12 : 0) + (c ? bone(46, 52, 9, 20) : ''));
PR('skull-human', 'a', C, ['bones', 'skull'], (t, r) => mound(t, 32, 50, 12, 3) + skull(30, 42, 1.6, -8) + bone(46, 52, 10, 30) + rib(18, 52, 12, -10));
PR('skull-camel', 'a', C, ['bones', 'skull'], (t, r) => mound(t, 32, 50, 16, 3.4) + `<g transform="translate(32 40)">${ell(1, 7, 16, 3, '#3b3a24', .15)}${path('M-16 4Q-18 -4 -8 -8Q4 -10 10 -4L16 2L12 6L4 4Q-6 8 -12 8Z', BONE[0], 1, ink('#8a7458', .8, .85))}${ell(-3, -2, 2.4, 2.8, '#4a3a2a')}${path('M-10 -6L-12 -12L-6 -8Z', BONE[1], 1, ink('#8a7458', .6, .8))}${line('M6 2l5 1M8 4l4 0', '#8a7458', .8, .8)}</g>` + bone(48, 52, 9, 10));
PR('bone-pile', 'a', C, ['bones'], (t, r) => mound(t, 32, 50, 15, 3.4) + bone(22, 44, 14, -20) + bone(40, 46, 12, 28) + bone(30, 52, 10, 80) + rib(32, 40, 18, -6));
PR('bone-pile', 'b', C, ['bones'], (t, r) => mound(t, 32, 50, 14, 3.2) + rib(26, 46, 20, -8) + rib(32, 41, 18, 2) + rib(38, 46, 20, 8) + bone(18, 52, 10, 30) + skull(48, 48, .7, 14));
PR('glass-shards', 'a', C, ['glass', 'loot'], (t, r) => { let o = sh(30, 50, 14, 3.6); for (const [x, y, h, a, c] of [[26, 50, 16, -18, 0], [34, 50, 22, 6, 1], [42, 51, 12, 22, 0], [31, 52, 9, -40, 1]]) o += `<g transform="translate(${x} ${y}) rotate(${a})">` + path(`M-4 0L-1 ${-h}L4 -2L3 0Z`, ['rgba(176,226,214,.88)', 'rgba(130,200,186,.9)'][c], 1, ink('#2f7f7a', .8, .85)) + line(`M-2 -2L0 ${-h + 3}`, '#fff', 1, .9) + `</g>`; return o; });
PR('glass-shards', 'b', C, ['glass', 'loot'], (t, r) => { let o = sh(30, 50, 15, 3.6) + mound(t, 32, 50, 14, 3); for (const [x, y, h, a] of [[20, 50, 12, -30], [30, 51, 18, -8], [40, 50, 20, 14], [48, 51, 10, 34]]) o += `<g transform="translate(${x} ${y}) rotate(${a})">` + path(`M-3 0L0 ${-h}L3.6 0Z`, 'rgba(200,230,240,.85)', 1, ink('#4a7a98', .8, .85)) + line(`M-1 -2L0 ${-h + 3}`, '#fff', 1, .9) + `</g>`; return o; });
for (const v of ['a', 'b']) PR('salt-sack', v, C, ['sack', 'salt'], (t, r) => { const s = v === 'a' ? 1 : .86; let o = sh(30, 52, 14 * s, 3.6) + path(`M${32 - 11 * s} 50Q${32 - 14 * s} 34 ${32 - 7 * s} 24Q${32} 20 ${32 + 7 * s} 24Q${32 + 14 * s} 34 ${32 + 11 * s} 50Q32 54 ${32 - 11 * s} 50Z`, t.lg(['#f2e6d0', '#d6c4a4', '#a8936e'], 30), 1, ink('#6a5438', .9, .8)) + path(`M${32 - 6 * s} 24Q32 28 ${32 + 6 * s} 24L${32 + 4 * s} 20Q32 22 ${32 - 4 * s} 20Z`, '#c8b48e', 1, ink('#6a5438', .7, .8)) + line(`M${32 - 5 * s} 26Q32 30 ${32 + 5 * s} 26`, '#8a7050', 1.6, .9); o += ell(30, 36, 4, 6, '#fff', .4, 10); if (v === 'b') o += ell(24, 52, 8, 2.4, t.lg(SLT, 70), .95); return o; });
PR('pick-shovel', 'a', C, ['tools', 'mine'], (t, r) => mound(t, 32, 51, 17, 3.4) + `<g transform="rotate(-30 28 40)">` + line('M28 12V50', '#8a6a44', 3, 1) + path('M16 12Q28 4 40 12Q28 9 16 12Z', '#7e7478', 1, ink('#2a2024', .9, .85)) + `</g>` + `<g transform="rotate(34 40 40)">` + line('M40 22V52', '#8a6a44', 3, 1) + path('M34 50H46L44 58H36Z', '#a89aa0', 1, ink('#2a2024', .9, .85)) + `</g>`);
for (const v of ['a', 'b']) PR('barrel-brine', v, C, ['barrel', 'brine'], (t, r) => { let o = sh(30, 52, 14, 4) + path('M18 48Q16 34 20 22H44Q48 34 46 48Q32 54 18 48Z', wood(t, 0), 1, ink('#3a2a1a', 1, .85)) + ell(32, 22, 12, 4, v === 'a' ? '#f0a6bc' : '#4a3a28', 1, 0, ink('#3a2a1a', .9, .85)) + [28, 42].map(y => line(`M18.4 ${y}Q32 ${y + 5} 45.6 ${y}`, '#4a4448', 2, .95)).join('') + line('M24 24V46', '#e8dcc0', 1, .5); if (v === 'a') o += ell(30, 21.5, 7, 2, '#fbd5de', .8); if (v === 'b') o += path('M42 40Q46 46 44 52', 'none', 1, { stroke: '#e690a8', 'stroke-width': 2, 'stroke-opacity': .8 }) + ell(46, 53, 5, 1.6, '#e690a8', .6); return o; });
PR('crate-wood', 'a', C, ['crate'], (t, r) => sh(30, 52, 16, 4) + mound(t, 40, 52, 10, 2.4) + path('M14 50V26L18 21H46V45L42 50Z', wood(t, 40), 1, ink('#3a2a1a', 1, .85)) + path('M14 26L18 21H46L42 26Z', '#d8c8a8', 1, ink('#3a2a1a', .7, .8)) + line('M14 38H42M28 26V50', '#62503a', 1.4, .8) + path('M42 26L46 21V45L42 50Z', '#62503a', .7) + rect(31, 32, 8, 6, '#e06a90', 0, .9));
PR('lantern-rusty', 'a', C, ['lantern', 'mine'], (t, r) => sh(30, 52, 10, 3) + mound(t, 32, 51, 10, 2.4) + path('M24 50V26L28 22H36L40 26V50Z', t.lg(['#d89a74', '#a8603c', '#6a3a24'], 0), 1, ink('#3a1a0c', 1, .85)) + rect(27, 28, 10, 16, '#fff3c0', 1, .9, ink('#3a1a0c', .8, .85)) + circ(32, 36, 3.4, '#f3c24f') + path('M26 22Q32 10 38 22', 'none', 1, { stroke: '#3a1a0c', 'stroke-width': 1.6 }) + line('M32 14v-3', '#3a1a0c', 1.4, 1));
PR('wheelbarrow', 'a', C, ['tools', 'mine'], (t, r) => sh(30, 52, 22, 4) + `<g>` + path('M10 24L44 24L38 40H18Z', t.lg(['#d89a74', '#a8603c', '#6a3a24'], 20), 1, ink('#3a1a0c', 1, .85)) + ell(26, 24, 16, 3, t.lg(SLT, 60), 1) + line('M40 30L58 22M40 34L58 26', '#8a6a44', 2.6, 1) + line('M16 40L12 52M36 40L40 52', '#62503a', 2.4, 1) + circ(14, 46, 6, '#4a4448', 1, ink('#1a1618', .9, .85)) + circ(14, 46, 2.2, '#b8aeb0') + `</g>`);
PR('boots', 'a', C, ['loot', 'clothing'], (t, r) => mound(t, 32, 51, 14, 3) + [[22, 0], [38, 18]].map(([x, a]) => `<g transform="translate(${x} 44) rotate(${a})">` + ell(1, 7, 9, 2.4, '#3b3a24', .16) + path('M-5 -12H4V0Q10 2 10 6H-8Q-8 2 -5 0Z', '#8a5a3c', 1, ink('#3a2210', .9, .85)) + rect(-5, -12, 9, 2.4, '#5a3a24') + line('M-8 5H10', '#3a2210', 1.4, .9) + `</g>`).join(''));
PR('evaporation-tray', 'a', C, ['salt-works', 'brine'], (t, r) => sh(30, 52, 20, 4) + path('M8 30L52 30L58 46H4Z', wood(t, 90), 1, ink('#3a2a1a', 1, .85)) + path('M12 32L50 32L54 42H8Z', '#f0a6bc', 1, ink('#8e3a5e', .7, .8)) + ell(30, 36, 16, 3, '#fbd5de', .8) + path('M30 34L44 34L46 38H26Z', '#fff', .9) + line('M12 33H50', '#fff', 1.2, .6));
PR('salt-rake', 'a', C, ['tools', 'salt-works'], (t, r) => mound(t, 32, 51, 17, 3.4) + `<g transform="rotate(-20 32 40)">` + line('M32 8V50', '#8a6a44', 3, 1) + rect(18, 46, 28, 4, '#8a6a44', 1, 1, ink('#3a2a1a', .8, .85)) + [20, 25, 30, 35, 40, 44].map(x => line(`M${x} 50v5`, '#6a5a44', 1.6, 1)).join('') + `</g>`);
PR('rope-coil', 'a', C, ['rope'], (t, r) => sh(30, 50, 12, 3.4) + [0, 1, 2].map(i => ell(32, 46 - i * 3, 11 - i, 4.4 - i * .4, 'none', 1, 0, ink('#7a6a4a', 3.2, .95)) + ell(32, 45 - i * 3, 11 - i, 4.4 - i * .4, 'none', 1, 0, ink('#e8dcc0', 1, .8))).join('') + line('M42 46Q52 48 50 52', '#7a6a4a', 3, .95));
// flamingos (pink birds that feed in the brine)
const flamingo = (t, kind, lean = 0) => {
  let o = sh(30, 54, 10, 2.6) + ell(32, 54, 12, 3, '#e690a8', .3);
  const bx = 32 + lean, by = 30;
  if (kind === 'feed') { o += line('M30 54V40M34 54V42', '#d86a8a', 1.6, 1) + path(`M20 34Q30 26 40 32Q44 38 36 42Q26 44 20 34Z`, t.lg(['#fbd5de', '#f08aa8', '#c0486e'], 40), 1, ink('#8e2e4c', .9, .8)) + path('M22 33Q14 22 10 40Q8 52 14 52', 'none', 1, { stroke: '#f08aa8', 'stroke-width': 3.6, 'stroke-linecap': 'round' }) + path('M22 33Q14 22 10 40Q8 52 14 52', 'none', 1, { stroke: '#fbd5de', 'stroke-width': 1, 'stroke-linecap': 'round', transform: 'translate(-.6 -.6)' }) + path('M10 52L16 53L13 50Z', '#2a2024') + path('M30 32Q38 30 44 34', 'none', 1, { stroke: '#fff', 'stroke-width': 1.4, 'stroke-opacity': .6 }); }
  else if (kind === 'stand') { o += line(`M${bx} 54V36`, '#d86a8a', 1.8, 1) + line(`M${bx + 5} 54V38L${bx + 8} 44`, '#d86a8a', 1.6, 1) + path(`M${bx - 12} 28Q${bx} 20 ${bx + 12} 26Q${bx + 14} 36 ${bx + 2} 38Q${bx - 10} 38 ${bx - 12} 28Z`, t.lg(['#fbd5de', '#f08aa8', '#c0486e'], 40), 1, ink('#8e2e4c', .9, .8)) + path(`M${bx - 10} 27Q${bx - 22} 22 ${bx - 18} 8Q${bx - 14} 2 ${bx - 10} 6`, 'none', 1, { stroke: '#f08aa8', 'stroke-width': 3.2, 'stroke-linecap': 'round' }) + circ(bx - 11, 6, 3, '#f8b8cc', 1, ink('#8e2e4c', .7, .8)) + path(`M${bx - 13} 5L${bx - 19} 9L${bx - 12} 8Z`, '#f2e6d6', 1, ink('#2a2024', .5, .8)) + path(`M${bx - 16} 7L${bx - 19} 9L${bx - 14} 8Z`, '#2a2024') + path(`M${bx + 4} 26Q${bx + 12} 26 ${bx + 14} 30Q${bx + 6} 34 ${bx + 2} 32Z`, '#e86a8a', .8); }
  else { o += line(`M${bx - 4} 54V36M${bx + 4} 54V36`, '#d86a8a', 1.6, 1) + ell(bx, 30, 11, 8, t.lg(['#fbd5de', '#f08aa8', '#c0486e'], 40), 1, 0, ink('#8e2e4c', .9, .8)) + path(`M${bx - 4} 24Q${bx - 12} 14 ${bx - 4} 8Q${bx + 4} 4 ${bx + 2} 12`, 'none', 1, { stroke: '#f08aa8', 'stroke-width': 3, 'stroke-linecap': 'round' }) + circ(bx + 2, 12, 2.8, '#f8b8cc', 1, ink('#8e2e4c', .7, .8)) + path(`M${bx + 3} 12L${bx + 9} 15L${bx + 2} 15Z`, '#2a2024') + path(`M${bx + 4} 28Q${bx + 14} 26 ${bx + 14} 34Q${bx + 6} 36 ${bx + 3} 32Z`, '#e86a8a', .85); }
  return o;
};
PR('flamingo', 'a', C, ['bird', 'flamingo', 'signature'], (t) => flamingo(t, 'stand', 0));
PR('flamingo', 'b', C, ['bird', 'flamingo'], (t) => flamingo(t, 'feed'));
PR('flamingo', 'c', C, ['bird', 'flamingo'], (t) => flamingo(t, 'sit'));
PR('flamingo-nest', 'a', C, ['bird', 'nest'], (t, r) => sh(30, 52, 14, 4) + ell(32, 52, 15, 4, '#e690a8', .35) + path('M16 50Q18 38 32 38Q46 38 48 50Q32 56 16 50Z', t.lg(['#d8b8a0', '#a8846c', '#6a4a3a'], 90), 1, ink('#3a2a1a', .9, .85)) + ell(32, 38, 12, 3, '#6a4a3a', 1) + ell(30, 36, 4, 5.4, '#fff', 1, 0, ink('#a89aa4', .6, .8)));
// windlass over a shaft (tall)
PR('windlass', 'a', TALL, ['mine', 'tall'], (t, r) => { const fy = 118; let o = sh(32, fy, 24, 5) + mound(t, 32, fy - 2, 26, 6) + ell(32, fy - 6, 14, 5, '#2a2024', 1, 0, ink('#62503a', 3, .9)); o += path('M10 ' + (fy - 4) + 'L20 54L24 54L16 ' + (fy - 4) + 'Z', wood(t, 0), 1, ink('#3a2a1a', .8, .85)) + path('M54 ' + (fy - 4) + 'L44 54L40 54L48 ' + (fy - 4) + 'Z', wood(t, 0), 1, ink('#3a2a1a', .8, .85)) + path('M18 ' + (fy - 4) + 'L22 54H42L46 ' + (fy - 4) + 'Z', 'none', 1, { stroke: '#62503a', 'stroke-width': 1.4 }) + line('M18 56H46', '#4a3a28', 3, 1) + ell(32, 56, 14, 4, wood(t, 0), 1, 0, ink('#3a2a1a', .9, .85)) + line('M18 56h-8M46 56h8M54 56l4 12', '#4a3a28', 2.4, 1) + circ(58, 70, 3, '#8a8084', 1, ink('#2a2024', .8, .85)) + line('M26 58V100', '#9a8264', 1.4, .9) + path('M22 100H30L28 112H24Z', t.lg(['#d89a74', '#a8603c', '#6a3a24'], 20), 1, ink('#3a1a0c', .9, .85)); return o; });
PR('mirage-pole', 'a', TALL, ['marker', 'tall'], (t, r) => { const fy = 118; let o = sh(32, fy, 12, 4) + mound(t, 32, fy - 2, 18, 4.6) + path(`M29 ${fy - 3}L30 24H34L35 ${fy - 3}Z`, wood(t, 0), 1, ink('#3a2a1a', .9, .85)); for (const y of [34, 50, 66]) o += rect(30, y, 4, 8, '#f0a6bc', 0, 1, ink('#8e3a5e', .5, .85)); o += path('M34 26Q46 24 52 30Q46 34 34 34Z', '#e06a90', 1, ink('#7a2c4e', .8, .85)) + circ(32, 22, 2.4, '#f3c24f', 1, ink('#5a3a0a', .6, .85)); return o; });
PR('signpost-brine', 'a', C, ['sign'], (t, r) => sh(30, 52, 10, 3) + mound(t, 32, 51, 12, 2.8) + path('M30 50V14H34V50Z', wood(t, 0), 1, ink('#3a2a1a', .9, .85)) + path('M16 16H46L52 22L46 28H16Z', '#f0e2c0', 1, ink('#3a2a1a', .9, .85)) + circ(31, 22, 3.6, '#e06a90', 1, ink('#7a2c4e', .6, .85)) + line('M36 20h8M36 24h6', '#62503a', 1.2, .8));
PR('salt-brick-stack', 'a', C, ['salt', 'bricks'], (t, r) => { let o = sh(30, 52, 18, 4) + mound(t, 32, 51, 18, 3); for (let row = 0; row < 3; row++) for (let i = 0; i < 3 - row; i++) o += sblock(t, 12 + row * 6 + i * 13, 48 - row * 10, 12, 9, 3); return o; });
PR('salt-brick-stack', 'b', C, ['salt', 'bricks'], (t, r) => { let o = sh(30, 52, 17, 4); for (let row = 0; row < 2; row++) for (let i = 0; i < 2; i++) o += sblock(t, 15 + i * 14 + (row ? 5 : 0), 48 - row * 10, 13, 9, 3); return o + sblock(t, 42, 48, 12, 9, 3) + sblock(t, 22, 28, 12, 9, 3).replace('<path', '<path'); });
PR('ore-bucket', 'a', C, ['mine'], (t, r) => sh(30, 52, 12, 3.6) + path('M18 48L20 26H44L46 48Q32 52 18 48Z', t.lg(['#b8aeb0', '#7e7478', '#4a4448'], 0), 1, ink('#1a1618', 1, .85)) + ell(32, 26, 12, 3.6, '#4a4448', 1, 0, ink('#1a1618', .8, .85)) + ell(32, 25, 10, 2.6, t.lg(SLT, 70), 1) + path('M20 26Q32 6 44 26', 'none', 1, { stroke: '#4a4448', 'stroke-width': 2 }) + line('M22 34V46', '#e0d8dc', 1, .6));
PR('tent-ruin', 'a', C, ['camp'], (t, r) => sh(30, 52, 20, 4) + mound(t, 32, 51, 22, 3.4) + path('M8 50L28 18L50 50Z', t.lg(['#f2e6d0', '#d6c4a4', '#a8936e'], 20), 1, ink('#6a5438', 1, .8)) + path('M28 18L38 50H50Z', '#8f7a62', .55) + path('M26 50L32 36L40 50Z', '#4a3a28', 1) + line('M14 44l-4 8M44 44l6 7', '#62503a', 1.2, .9) + line('M28 18L30 12', '#62503a', 2, 1));
