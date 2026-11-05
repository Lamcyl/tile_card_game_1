// Ashkara sub-area 3: Singing Erg (ashkara/singing-erg). Ground, ground-detail, four 47-blob autotile sets, two connect-4 sets.
// Objects: gen-ashkara-singing-erg-objects.mjs; interest/landmark/gate: ...-interest.mjs; decals + overlays: ...-decals.mjs. Every file runs on its own (helpers live in singing-erg-lib.mjs).
// Palette shift: warm apricot sand with violet lee shadows; rippled dune sand dominates, tall slip-face ridges, rare dune grass.
import { T, rng, f, ell, circ, rect, path, line, ink, wrapped, D, FAMS, dskel, dint, speckle, sh, pebbleD, tuft, mix, APRI, FINE, LEE, SLIP, CREST, LAG, SOASIS, LUSH, CREAM, ramp, wind, slipStreaks, ergBase, fineBase, leeBase, slipBase, crestBase, lagBase, soasBase, mkT, outT, tile, blobSet, C, pts, wscat, stroke, sides, VIO, AP, dgrass, bone, scarab, drift } from './singing-erg-lib.mjs';

const ground = (cat, name, v, base, fn, tags = []) => tile(cat, name, v, C, ['seamless', cat === 'ground' ? 'ground' : 'ground-detail', ...tags], (t, r) => base() + fn(r, t));
// ---------------- ground ----------------
const ap = (seed, o = {}) => dint(APRI, seed, { n: 3, ...o });
ground('ground', 'sand-apricot', 'a', ergBase, () => ap(9701));
ground('ground', 'sand-apricot', 'b', ergBase, () => ap(9702, { cols: ['#f8dcae', '#e0b074'] }));
ground('ground', 'sand-apricot', 'c', ergBase, (r) => ap(9703) + wind(9703, 3, '#a8703c', .4, 12, 18), ['ripples']);
ground('ground', 'sand-apricot', 'd', ergBase, (r) => ap(9704) + pts(r, 4, 10, 12).map(([x, y]) => circ(x, y, r.range(.5, .9), '#fff6dc', .8)).join(''), ['glint']);
const fi = (seed) => dint(FINE, seed, { n: 3 });
ground('ground', 'sand-windpacked', 'a', fineBase, () => fi(9711));
ground('ground', 'sand-windpacked', 'b', fineBase, () => fi(9712) + wind(9712, 2, '#cc9462', .3, 14, 20));
ground('ground', 'sand-windpacked', 'c', fineBase, (r) => fi(9713) + pts(r, 3, 12, 14).map(([x, y]) => pebbleD(x, y, r.range(.35, .5), ['#f6e6c6', '#c8a47a'])).join(''), ['pebbles']);
const le = (seed) => dint(LEE, seed, { n: 3 });
ground('ground', 'sand-lee', 'a', leeBase, () => le(9721));
ground('ground', 'sand-lee', 'b', leeBase, () => le(9722) + wind(9722, 3, '#6a5a88', .26, 14, 20, '#f6e2dc'));
ground('ground', 'sand-lee', 'c', leeBase, (r) => le(9723) + pts(r, 4, 10, 12).map(([x, y]) => circ(x, y, r.range(.5, .8), '#f6e2dc', .7)).join(''), ['glint']);
ground('ground', 'sand-slip', 'a', slipBase, () => dint(SLIP, 9731, { n: 3 }), ['slope']);
ground('ground', 'sand-slip', 'b', slipBase, () => dint(SLIP, 9732, { n: 3 }) + slipStreaks(9732, 4, '#946a52'), ['slope']);
ground('ground', 'sand-slip', 'c', slipBase, () => dint(SLIP, 9733, { n: 3, cols: ['#f2cca0', '#d29c70'] }) + slipStreaks(9733, 3, VIO[1]), ['slope']);
ground('ground', 'sand-crest', 'a', crestBase, () => dint(CREST, 9741, { n: 3 }));
ground('ground', 'sand-crest', 'b', crestBase, (r) => dint(CREST, 9742, { n: 3 }) + wind(9742, 3, '#d0a26e', .34, 12, 18));
const gt = (r, n, s = .8, c = '#9a9a4c') => pts(r, n, 12, 14).map(([x, y]) => dgrass(x, y + 4, s * r.range(.8, 1.1), c)).join('');
ground('ground', 'sand-tufted', 'a', ergBase, (r) => ap(9751) + gt(r, 3), ['tufts']);
ground('ground', 'sand-tufted', 'b', ergBase, (r) => ap(9752) + gt(r, 4, .7, '#8f9a50'), ['tufts']);
ground('ground', 'sand-tufted', 'c', fineBase, (r) => fi(9753) + gt(r, 2, 1, '#a09a50'), ['tufts']);
ground('ground', 'gravel-lag', 'a', lagBase, () => dint(LAG, 9761, { n: 3 }), ['pebbles']);
ground('ground', 'gravel-lag', 'b', lagBase, (r) => dint(LAG, 9762, { n: 3 }) + pts(r, 6, 10, 9).map(([x, y]) => pebbleD(x, y, r.range(.3, .5), ['#f0e0c0', '#a88860'])).join(''), ['pebbles']);
// ramps from apricot sand into the common desert ground, the Seven Palms ground to the south and the Salt Mirror hardpan to the east
for (const [name, to, seed] of [['fine', FAMS.sand, 9770], ['dune', FAMS.dune, 9780], ['pan', FAMS.pan, 9790], ['oasis-sand', SOASIS, 9800], ['oasis-grass', LUSH, 9810], ['cream', CREAM, 9820]])
  for (const [v, u] of [['a', .35], ['b', .7]]) ground('ground', 'apricot-' + name + '-fringe', v, () => dskel(ramp(APRI, to, u)), (r) => dint(ramp(APRI, to, u), seed + u * 10, { n: 3 }) + pts(r, 2, 12, 16).map(([x, y]) => dgrass(x, y + 4, .6, mix(APRI.tuft, to.tuft, u))).join(''), ['ramp', 'blend']);
ground('ground', 'lee-apricot-fringe', 'a', () => dskel(ramp(LEE, APRI, .5)), () => dint(ramp(LEE, APRI, .5), 9830, { n: 3 }), ['ramp', 'blend']);
ground('ground', 'slip-apricot-fringe', 'a', () => dskel(ramp(SLIP, APRI, .5)), () => dint(ramp(SLIP, APRI, .5), 9831, { n: 3 }), ['ramp', 'blend']);

// ---------------- ground-detail ----------------
const quartz = (x, y, s = 1) => path(`M${f(x - 1.6 * s)} ${f(y + 1.2 * s)}L${f(x - .6 * s)} ${f(y - 2 * s)}L${f(x + 1.2 * s)} ${f(y - 1 * s)}L${f(x + 1.6 * s)} ${f(y + 1.2 * s)}Z`, '#fff8ec', 1, ink('#b89a78', .4, .8)) + circ(x - .4 * s, y - .6 * s, .5 * s, '#fff', .9);
const pod = (x, y, a) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + ell(.8, 1.4, 3, 1.4, '#3b3a24', .16) + path('M-3 0Q0 -2.6 3 0Q0 2.6 -3 0Z', '#a88848', 1, ink('#5a4018', .5, .8)) + line('M-2 0H2', '#e0c888', .6, .8) + `</g>`;
const feather = (x, y, a, c = '#f4eadc') => `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">` + ell(.8, 1.6, 6, 2, '#3b3a24', .14) + path('M-6 0Q0 -3.4 6 0Q0 3.4 -6 0Z', c, 1, ink('#9a8a70', .5, .8)) + line('M-6 0H6', '#9a8a70', .6, .9) + line('M-3 0l1.6 -2M0 0l1.6 -2.4M3 0l1 -1.6', '#c8b898', .5, .8) + `</g>`;
ground('ground-detail', 'wind-ripples', 'a', ergBase, () => ap(9901) + wind(9901, 6, '#a8703c', .5, 18, 28), ['ripples']);
ground('ground-detail', 'wind-ripples', 'b', fineBase, () => fi(9902) + wind(9902, 8, '#a8703c', .5, 14, 22) + wind(9903, 4, '#8a6a7c', .3, 20, 30), ['ripples']);
ground('ground-detail', 'cross-ripples', 'a', ergBase, () => ap(9911) + wind(9911, 5, '#a8703c', .5, 18, 26) + slipStreaks(9912, 4, '#a8703c'), ['ripples']);
ground('ground-detail', 'quartz-glitter', 'a', ergBase, (r) => ap(9921) + pts(r, 7, 10, 9).map(([x, y]) => quartz(x, y, r.range(.6, .9))).join(''), ['quartz', 'loot']);
ground('ground-detail', 'quartz-glitter', 'b', leeBase, (r) => le(9922) + pts(r, 5, 10, 11).map(([x, y]) => quartz(x, y, r.range(.6, .9))).join(''), ['quartz', 'loot']);
ground('ground-detail', 'dune-grass-sprigs', 'a', ergBase, (r) => ap(9931) + pts(r, 5, 10, 10).map(([x, y]) => dgrass(x, y + 4, r.range(.7, 1), '#8f9a50')).join(''), ['grass']);
ground('ground-detail', 'dune-grass-sprigs', 'b', fineBase, (r) => fi(9932) + pts(r, 7, 10, 8).map(([x, y]) => dgrass(x, y + 4, r.range(.5, .8), r.pick(['#8f9a50', '#a8a458']))).join(''), ['grass']);
ground('ground-detail', 'bone-flecks', 'a', ergBase, (r) => ap(9941) + pts(r, 5, 10, 12).map(([x, y]) => bone(x, y, r.range(6, 10), r.range(0, 180))).join(''), ['bones']);
ground('ground-detail', 'bone-flecks', 'b', leeBase, (r) => le(9942) + pts(r, 4, 12, 13).map(([x, y]) => bone(x, y, r.range(6, 9), r.range(0, 180))).join('') + ell(44, 44, 2.6, 1.8, '#f4ecd8', 1, 0, ink('#8a7458', .5, .8)), ['bones']);
ground('ground-detail', 'scarab-tracks', 'a', ergBase, (r) => ap(9951) + [[10, 50, 4], [48, 14, 44]].map(([x, y, a]) => { let o = ''; for (let i = 0; i < 9; i++) { const px = x + i * 4.6, py = y - i * 1.8 + Math.sin(i * 1.4) * 2; o += circ(px, py - 1.2, .7, '#8a5a30', .7) + circ(px + .3, py + 1.2, .7, '#8a5a30', .7); } return o; }).join(''), ['tracks']);
ground('ground-detail', 'scarab-tracks', 'b', fineBase, (r) => fi(9952) + (() => { let o = ''; for (let i = 0; i < 10; i++) { const px = 6 + i * 5.2, py = 38 + Math.sin(i * .9) * 5; o += circ(px, py - 1.2, .7, '#8a5a30', .7) + circ(px + .3, py + 1.2, .7, '#8a5a30', .7); } return o + scarab(58, 36, .9, 85); })(), ['tracks', 'insect']);
ground('ground-detail', 'sidewinder-track', 'a', ergBase, () => ap(9961) + line('M4 42q8 -9 14 -2t14 -2t14 -2t14 -2', '#a8703c', 2, .42) + line('M4 43q8 -9 14 -2t14 -2t14 -2t14 -2', '#fff3d6', .9, .55), ['tracks']);
ground('ground-detail', 'fennec-prints', 'a', fineBase, (r) => fi(9971) + (() => { let o = ''; for (let i = 0; i < 7; i++) { const x = 8 + i * 8, y = 24 + (i % 2) * 5 + i * 1.6; o += ell(x, y, 1.6, 1.3, '#a8703c', .6) + [[-1.6, -2], [0, -2.6], [1.6, -2]].map(([a, b]) => circ(x + a, y + b, .5, '#a8703c', .6)).join(''); } return o; })(), ['tracks']);
ground('ground-detail', 'sound-rings', 'a', ergBase, () => ap(9981) + [8, 14, 20, 26].map((rx, i) => ell(32, 34, rx, rx * .5, 'none', .5 - i * .08, 0, ink('#fff3d6', 1.2, .55 - i * .1))).join('') + [8, 14, 20, 26].map((rx, i) => ell(33, 35.4, rx, rx * .5, 'none', .4, 0, ink('#a8703c', .8, .3 - i * .05))).join(''), ['singing', 'magic']);
ground('ground-detail', 'seed-pods', 'a', ergBase, (r) => ap(9991) + pts(r, 5, 10, 11).map(([x, y]) => pod(x, y, r.range(0, 180))).join(''), ['loot']);
ground('ground-detail', 'feathers', 'a', fineBase, (r) => fi(9992) + [[22, 28, -20], [42, 40, 40]].map(([x, y, a]) => feather(x, y, a)).join(''), ['feather']);
ground('ground-detail', 'wind-scour', 'a', lagBase, (r) => dint(LAG, 9993, { n: 2 }) + pts(r, 9, 8, 8).map(([x, y]) => pebbleD(x, y, r.range(.3, .5), ['#f0e0c0', '#a88860'])).join('') + wind(9993, 3, '#9a7650', .4, 12, 20), ['pebbles', 'scour']);
ground('ground-detail', 'lee-shadow-streaks', 'a', ergBase, () => ap(9995) + [[8, 22, 40, 7], [18, 44, 36, 6]].map(([x, y, w, h]) => path(`M${x} ${y}Q${x + w / 2} ${y - h} ${x + w} ${y}Q${x + w / 2} ${y + h * .6} ${x} ${y}Z`, VIO[1], .22)).join(''), ['shadow']);
ground('ground-detail', 'desert-rose', 'a', ergBase, (r) => ap(9996) + pts(r, 3, 14, 18).map(([x, y]) => { let o = ell(x + 1, y + 2, 5, 2, '#3b3a24', .15); for (let i = 0; i < 5; i++) o += ell(x + Math.cos(i * 1.26) * 2, y + Math.sin(i * 1.26) * 1.2 - .6, 2.8, 1.2, '#d8a888', 1, i * 36, ink('#8a5a40', .4, .8)); return o + circ(x, y - .6, 1, '#f6d6c0'); }).join(''), ['crystal', 'loot']);

// ---------------- autotiles (47-blob) ----------------
// 1. slip-face-ridge: a tall dune ridge, bright windward face upper-left, a sharp crest, a steep violet slip face on the lower right
const ridgeFill = () => dskel({ ...CREST, b: '#f6d8a8' }) + wind(401, 9, '#c48a5a', .42, 14, 22);
blobSet('slip-face-ridge', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['dune', 'ridge', 'obstacle'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(ergBase(), `<path d="${G.d}" transform="translate(5 6)" fill="#6a5a88" opacity=".28"/>`, `<path d="${G.d}" transform="translate(3 4)" fill="#8e7aa8" opacity=".22"/>`);
    t.add(`<g clip-path="${clip}">`, ridgeFill(), slipStreaks(402, 8, '#8a6a7c'), sides(G, [VIO[2], .46], ['#fff8e0', .75], 14, 8), sides(G, [VIO[1], .3], ['#fffaf0', .5], 8, 3.4), '</g>');
    t.add(path(G.d, 'none', 1, { stroke: '#b07a52', 'stroke-width': 1.2, 'stroke-opacity': .55, 'stroke-linejoin': 'round' }));
  },
});
// 2. lee-hollow: a sunken, violet-shaded hollow between ridges (cast shadow top-left, light creeping up the far side)
blobSet('lee-hollow', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['dune', 'shadow', 'hollow'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(ergBase(), `<path d="${G.d}" transform="translate(-2 -2)" fill="#8e7aa8" opacity=".18"/>`);
    t.add(`<g clip-path="${clip}">`, leeBase(), wind(411, 5, '#6a5a88', .3, 14, 20, '#f6e2dc'), sides(G, ['#fff0e0', .4], [VIO[2], .46], 7, 14), sides(G, ['#fff0e0', .3], [VIO[1], .3], 3, 8), stroke(G.d, '#6a5a88', 12, .12), '</g>');
    t.add(path(G.d, 'none', 1, { stroke: '#7a6288', 'stroke-width': 1.1, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }));
  },
});
// 3. dune-grass-patch: rare tussocks of pale dune grass on rippled sand
const tussock = (x, y, s = 1, c = '#8f9a50') => `<g>` + ell(x + 1, y + 1.4, 5 * s, 1.8 * s, '#3b3a24', .16) + line(`M${f(x - 4 * s)} ${f(y)}q${f(1 * s)} ${f(-6 * s)} ${f(-1 * s)} ${f(-9 * s)}M${f(x - 2 * s)} ${f(y)}q0 ${f(-8 * s)} ${f(-2 * s)} ${f(-11 * s)}M${f(x)} ${f(y)}q${f(1 * s)} ${f(-8 * s)} ${f(2 * s)} ${f(-12 * s)}M${f(x + 2 * s)} ${f(y)}q${f(2 * s)} ${f(-6 * s)} ${f(4 * s)} ${f(-9 * s)}M${f(x + 4 * s)} ${f(y)}q${f(3 * s)} ${f(-4 * s)} ${f(6 * s)} ${f(-6 * s)}`, c, 1.3, .98) + line(`M${f(x - 1 * s)} ${f(y)}q0 ${f(-6 * s)} ${f(-3 * s)} ${f(-9 * s)}M${f(x + 1 * s)} ${f(y)}q${f(2 * s)} ${f(-5 * s)} ${f(5 * s)} ${f(-8 * s)}`, '#d8d490', .9, .8) + `</g>`;
const grassFill = () => ergBase() + wscat(421, 10, (r) => ({ s: r.range(.7, 1.05), c: r.pick(['#8f9a50', '#a09a50', '#7f8e48']) }), (x, y, p) => tussock(x, y + 4, p.s, p.c), 8) + wscat(422, 8, () => ({}), (x, y) => ell(x, y + 6, 6, 2, '#a8703c', .14), 6);
blobSet('dune-grass-patch', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['grass', 'vegetation'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(ergBase(), stroke(G.d, '#a8703c', 8, .16));
    t.add(`<g clip-path="${clip}">`, grassFill(), stroke(G.d, '#fff0cc', 5, .35, -1, -1), '</g>');
    t.add(stroke(G.d, '#9a8a48', 1.1, .45));
  },
});
// 4. ripple-field: deep, regular wind ripples (a corrugated patch of sand)
const corr = () => { let o = dskel({ ...APRI, b: '#f2cc96' }); for (let y = 3; y < T + 4; y += 8) { o += line(`M-2 ${y + 2}q8 -4 16 0t16 0t16 0t16 0t6 0`, '#fff3d6', 2.2, .6) + line(`M-2 ${y + 4.4}q8 -4 16 0t16 0t16 0t16 0t6 0`, '#b87a4a', 1.8, .5); } return o; };
blobSet('ripple-field', {
  mg: { n: 8, e: 8, s: 8, w: 8 }, R: 24, tags: ['ripples', 'dune'], build(t, G) {
    const clip = t.clip(G.d);
    t.add(ergBase(), stroke(G.d, '#a8703c', 8, .15));
    t.add(`<g clip-path="${clip}">`, corr(), sides(G, [VIO[1], .26], ['#fff8e0', .4], 8, 5), '</g>');
    t.add(stroke(G.d, '#b07a52', 1.1, .5));
  },
});

// ---------------- connect-4 (N1 E2 S4 W8) ----------------
const arms = (m, cx, cy) => { const a = []; if (m & 8) a.push([0, cy, cx, cy]); if (m & 2) a.push([cx, cy, 64, cy]); if (m & 1) a.push([cx, 0, cx, cy]); if (m & 4) a.push([cx, cy, cx, 64]); return a; };
// 1. chime-line: wind-chime poles joined by a cord hung with small bells
for (let m = 0; m < 16; m++) {
  const v = String(m).padStart(2, '0'), t = mkT('fences', 'fence-chime-line', v), cx = 32, cy = 42;
  t.add(ell(cx + 2, cy + 2, 8, 2.6, '#3b3a24', .18), ell(cx, cy + 1, 9, 3, t.lg(AP, 70), 1), ell(cx + 2, cy + 1.6, 5, 1.4, VIO[1], .3));
  const cord = (x0, y0, x1, y1, h) => { const mx = (x0 + x1) / 2, my = (y0 + y1) / 2; let o = line(`M${x0} ${y0 - h}Q${mx} ${my - h + 5} ${x1} ${y1 - h}`, '#5a3c20', 1.3, .95) + line(`M${x0} ${y0 - h - .8}Q${mx} ${my - h + 4.2} ${x1} ${y1 - h - .8}`, '#e8c890', .6, .8); for (const u of [.33, .66]) { const bx = x0 + (x1 - x0) * u, by = (1 - u) * (1 - u) * (y0 - h) + 2 * u * (1 - u) * (my - h + 5) + u * u * (y1 - h) + 1; o += line(`M${f(bx)} ${f(by)}v2`, '#5a3c20', .6, .9) + path(`M${f(bx - 1.6)} ${f(by + 2)}h3.2l.8 3.4h-4.8Z`, '#d8a040', 1, ink('#5a3a0a', .5, .85)); } return o; };
  for (const [a, b, c, d] of arms(m, cx, cy)) for (const h of [20, 28]) t.add(cord(a, b, c, d, h * (a === c ? .6 : 1)));
  t.add(path(`M${cx - 2.6} ${cy}L${cx - 2} ${cy - 34}Q${cx} ${cy - 36.4} ${cx + 2} ${cy - 34}L${cx + 2.6} ${cy}Z`, t.lg(['#b8905c', '#8a6238', '#5a3c20'], 0), 1, ink(D.inkS, .8, .85)), line(`M${cx - 8} ${cy - 30}H${cx + 8}`, '#5a3c20', 2, 1), circ(cx, cy - 35, 1.6, '#f3c24f', 1, ink('#5a3a0a', .5, .8)));
  for (const [dx, l] of [[-6, 8], [-2, 12], [2, 9], [6, 13]]) t.add(line(`M${cx + dx} ${cy - 30}v3`, '#5a3c20', .6, .9), rect(cx + dx - 1.2, cy - 27, 2.4, l, t.lg(['#f5d886', '#c8923a', '#7a5420'], 0), 1, 1, ink('#4a3220', .5, .85)));
  outT(t, 'fences', 'fence-chime-line', v, ['autotile', 'connect4', 'mask:' + m, 'fence', 'chime', 'obstacle']);
}
// 2. sand-fence: low brushwood slat fence half-buried in drifted sand
for (let m = 0; m < 16; m++) {
  const v = String(m).padStart(2, '0'), t = mkT('fences', 'fence-sand-slat', v), cx = 32, cy = 40, r = rng(7100 + m);
  const segs = arms(m, cx, cy);
  for (const [a, b, c, d] of segs) t.add(path(`M${a} ${b + 2}L${c} ${d + 2}`, 'none', 1, { stroke: '#8e7aa8', 'stroke-width': 9, 'stroke-opacity': .22, 'stroke-linecap': 'round', transform: 'translate(2 3)' }), path(`M${a} ${b + 2}L${c} ${d + 2}`, 'none', 1, { stroke: '#f6dcae', 'stroke-width': 10, 'stroke-opacity': .95, 'stroke-linecap': 'round' }));
  t.add(ell(cx + 2, cy + 3, 8, 2.8, '#8e7aa8', .3), ell(cx, cy + 2, 9, 3.4, t.lg(AP, 70), 1));
  for (const [a, b, c, d] of segs) {
    const horiz = b === d, n = 6;
    if (horiz) {
      for (let k = 0; k <= n; k++) { const u = k / n, x = a + (c - a) * u, hh = 15 + r.range(-2, 2); t.add(rect(x - 1.2, b - hh + 2, 2.4, hh, t.lg(['#cfa878', '#a07848', '#6a4a28'], 0), .6, 1, ink(D.inkS, .5, .8))); }
      t.add(line(`M${a} ${b - 6}L${c} ${d - 6}`, '#6a4a28', 1.4, .95), line(`M${a} ${b - 11}L${c} ${d - 11}`, '#6a4a28', 1.2, .9), line(`M${a} ${b - 6.8}L${c} ${d - 6.8}`, '#e8c890', .5, .7));
    } else {   // seen end-on along the fence: a run of staggered slat tops
      const y0 = Math.min(b, d), y1 = Math.max(b, d);
      for (let y = y0 + 3; y < y1; y += 8) { t.add(ell(a + 1, y + 1.4, 6, 2.4, '#3b3a24', .14), rect(a - 6, y - 2.4, 12, 4.8, t.lg(['#cfa878', '#a07848', '#6a4a28'], 0), 1.6, 1, ink(D.inkS, .5, .8)), line(`M${a - 4} ${y - 1}H${a + 4}`, '#e8c890', .6, .7)); }
    }
  }
  t.add(path(`M${cx - 3.2} ${cy + 2}L${cx - 2.6} ${cy - 20}H${cx + 2.6}L${cx + 3.2} ${cy + 2}Z`, t.lg(['#cfa878', '#8a6238', '#5a3c20'], 0), 1, ink(D.inkS, .8, .85)), ell(cx + 4, cy + 3, 6, 2, t.lg(AP, 70), .95));
  outT(t, 'fences', 'fence-sand-slat', v, ['autotile', 'connect4', 'mask:' + m, 'fence', 'obstacle']);
}
