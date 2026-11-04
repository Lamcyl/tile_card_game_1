// Mossy Ruins objects: columns, lanterns, jizo, komainu, torii, gates, shrine, stairs, props, plants, overlays.
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, maker, SUBS, sh, trunk, scat, sparkle, glowC, broad, rockS, fronds, mush, shimenawa } from './sub.mjs';
import { ring } from './water-lib.mjs';
import { mossBlob, crack, ivySprig } from './ruins-lib.mjs';

const SUB = SUBS.ruins, { mk, out } = maker(SUB);
const R = (s) => rng(hash(s));
const ST = ['#e6e3d4', '#b4b09c', '#7d7a6a'], ln = ink(P.inkR, .9, .8), MS = ['#a8cf86', '#6fa050'], WOOD = ['#b08a58', '#8a6a44', '#6b4a2c'];
const prop = (cat, name, v, tags, fn, w = T, h = T) => { const t = mk(cat, name, v, w, h); fn(t, R(name + v)); out(t, cat, name, v, tags); };
const moss = (x, y, w, h = w * .5, s = 1) => mossBlob(x, y, w, h, s);
const tf = (t, y = 114) => t.add(tuft(16, y, '#5f8f4c', .8, .7), tuft(48, y + 2, '#5f8f4c', .8, .7));
const vinesOn = (r, x, y, len, n = 1) => { let o = ''; for (let i = 0; i < n; i++) o += ivySprig(r, x + i * 5, y, len, 1.5 + (i % 2 ? .3 : -.3), 7); return o; };

// ============================ tall: pillars ============================
function pillar(t, v) {
  const cx = 32, by = 112, g = t.lg(ST, 0), top = v === 'a' ? 24 : v === 'b' ? 56 : v === 'c' ? 84 : 36;
  t.add(sh(34, by + 2, 18, 5));
  const lean = v === 'd' ? 6 : 0;
  t.add(path(`M${cx - 15} ${by + 1}Q${cx - 15} ${by - 7} ${cx - 11} ${by - 8}H${cx + 11}Q${cx + 15} ${by - 7} ${cx + 15} ${by + 1}Z`, g, 1, ln), ell(cx - 6, by - 6, 5, 1.2, '#fff', .45));
  const sw = 10;
  if (v === 'b' || v === 'c') t.add(path(`M${cx - sw} ${by - 8}L${cx - sw} ${top + 6}L${cx - sw + 3} ${top - 1}L${cx - 3} ${top + 8}L${cx + 2} ${top - 3}L${cx + 6} ${top + 5}L${cx + sw} ${top + 1}L${cx + sw} ${by - 8}Z`, g, 1, ln));
  else t.add(path(`M${cx - sw + lean * .2} ${by - 8}L${cx - sw + lean} ${top + 6}H${cx + sw + lean}L${cx + sw} ${by - 8}Z`, g, 1, ln));
  for (const dx of [-5, 0, 5]) t.add(line(`M${cx + dx} ${by - 10}V${top + 12}`, '#74786a', 1, .35));
  t.add(rect(cx - sw + 1, top + 6, 2, by - top - 14, '#fff', 0, .3));
  if (v === 'a' || v === 'd') { const L = lean; t.add(rect(cx - 14 + L, top - 2, 28, 10, g, 2, 1, ln), rect(cx - 12 + L, top - 7, 24, 6, g, 2, 1, ln), ell(cx - 6 + L, top - 4, 6, 1.2, '#fff', .5), ell(cx + L, top + 8, 11, 2, '#2e2c1a', .15)); }
  if (v === 'b') t.add(path(`M${cx - 6} ${top + 4}l4 4l3 -6l3 5l4 -2`, 'none', 1, { fill: 'none', stroke: '#fff', 'stroke-width': 1.2, 'stroke-opacity': .5 }), ell(cx + 18, by - 4, 6, 4, '#a2a596', 1, 0, ln), ell(cx - 19, by - 2, 4, 3, '#b4b09c', 1, 0, ln));
  if (v === 'c') t.add(ell(cx + 16, by - 3, 7, 4.4, '#a2a596', 1, 0, ln), ell(cx + 14, by - 4.6, 3, 1.2, '#fff', .5));
  t.add(moss(cx - 6, by - 10, 9, 4.4, 1), moss(cx + 8, by - 22, 5, 3, 2), moss(cx, top + 8 + (v === 'a' ? 6 : 0), 8, 3, 3));
  t.add(vinesOn(R('pv' + v), cx + 5, top + 10, v === 'c' ? 20 : 40, 1)); tf(t, by + 2);
}
for (const v of ['a', 'b', 'c', 'd']) prop('props', 'pillar-standing', v, ['tall', 'obstacle', 'ruin', 'pillar', v === 'a' ? 'intact' : v === 'd' ? 'leaning' : 'broken'], (t) => pillar(t, v), T, 128);
// ============================ lanterns ============================
function lantern(t, { lit = false, broken = false, wisp = false, ivy = false }) {
  const cx = 32, by = 112, g = t.lg(ST, 0), glow = lit || wisp;
  t.add(sh(34, by + 2, 15, 4.5));
  if (glow) t.add(glowC(t, cx, 82, 28, wisp ? '#d8fff0' : '#ffe6a0', wisp ? '#6fd8b8' : '#ffc45a', .75));
  t.add(path(`M${cx - 13} ${by + 1}Q${cx - 13} ${by - 7} ${cx - 8} ${by - 8}H${cx + 8}Q${cx + 13} ${by - 7} ${cx + 13} ${by + 1}Z`, g, 1, ln), ell(cx - 5, by - 6, 4, 1.2, '#fff', .45));
  t.add(path(`M${cx - 4} ${by - 8}L${cx - 3.4} ${by - 28}H${cx + 3.4}L${cx + 4} ${by - 8}Z`, g, 1, ln), rect(cx - 2.6, by - 26, 1.2, 16, '#fff', 0, .3));
  t.add(path(`M${cx - 12} ${by - 28}Q${cx} ${by - 33} ${cx + 12} ${by - 28}L${cx + 10} ${by - 25}Q${cx} ${by - 22} ${cx - 10} ${by - 25}Z`, g, 1, ln));
  const fb = wisp ? t.lg(['#e8fff4', '#7fe0c0'], 90) : lit ? t.lg(['#ffe9b0', '#ffb04a'], 90) : t.lg(['#d8d4c0', '#8f8c7a'], 0);
  if (broken) t.add(path(`M${cx - 8.5} ${by - 28}V${by - 38}L${cx - 4} ${by - 42}L${cx - 1} ${by - 36}L${cx + 4} ${by - 44}L${cx + 8.5} ${by - 38}V${by - 28}Z`, fb, 1, ln), rect(cx - 5, by - 36, 10, 8, '#4a463c', 1.5, .9), ell(cx + 14, by - 4, 7, 4, '#a2a596', 1, 0, ln), path(`M${cx + 8} ${by - 2}l8 -3l4 3l-6 3Z`, '#cfd0c4', 1, ln), moss(cx - 6, by - 42, 5, 2.6, 4));
  else {
    t.add(rect(cx - 8.5, by - 44, 17, 16, fb, 0, 1, ln), rect(cx - 5, by - 41, 10, 10, wisp ? '#f0fff8' : lit ? '#fff3c8' : '#3a463c', 1.5, 1, ink(P.inkR, .6, .7)), line(`M${cx} ${by - 41}v10M${cx - 5} ${by - 36}h10`, wisp ? '#4aa88a' : lit ? '#d89a3a' : '#1f2620', .8, .8));
    t.add(path(`M${cx - 20} ${by - 44}Q${cx - 6} ${by - 49} ${cx} ${by - 62}Q${cx + 6} ${by - 49} ${cx + 20} ${by - 44}Q${cx} ${by - 40} ${cx - 20} ${by - 44}Z`, t.lg(['#eeeadb', '#a09c88', '#74705e'], 60), 1, ln), path(`M${cx - 16} ${by - 46}Q${cx - 4} ${by - 50} ${cx} ${by - 59}Q${cx - 4} ${by - 49} ${cx - 16} ${by - 46}Z`, '#fff', .45), circ(cx, by - 63, 3.2, g, 1, ln));
    t.add(moss(cx - 8, by - 49, 8, 3.4, 5), moss(cx + 9, by - 45, 5, 2.4, 6));
  }
  t.add(moss(cx - 8, by - 1, 7, 3, 7), moss(cx + 8, by - 9, 5, 2.6, 8));
  if (ivy) t.add(vinesOn(R('lv'), cx + 6, by - 36, 28, 1));
  if (wisp) t.add(sparkle(cx + 15, by - 66, .9, '#d8fff0'), sparkle(cx - 16, by - 54, .65, '#d8fff0'), sparkle(cx + 18, by - 44, .55, '#d8fff0'));
  if (lit) t.add(sparkle(cx + 15, by - 66, .8, '#fff6c0'), sparkle(cx - 15, by - 52, .55, '#fff6c0'));
  tf(t, by + 4);
}
for (const [v, o] of [['a', {}], ['b', { lit: true }], ['c', { broken: true, ivy: true }], ['d', { wisp: true }], ['e', { lit: true, ivy: true }]]) prop('props', 'ruin-lantern', v, ['tall', 'obstacle', 'lantern', 'ruin', o.lit ? 'lit' : o.wisp ? 'wisp' : o.broken ? 'broken' : 'unlit'], (t) => lantern(t, o), T, 128);
// ============================ jizo (tall) ============================
function jizo(t, v) {
  const cx = 32, by = 112, g = t.lg(['#d8d6c6', '#a4a290', '#76766a'], 0);
  t.add(sh(34, by + 2, 15, 4.5));
  t.add(path(`M${cx - 14} ${by + 1}H${cx + 14}V${by - 9}H${cx - 14}Z`, t.lg(ST, 0), 1, ln), rect(cx - 11, by - 22, 22, 13, t.lg(ST, 0), 1, 1, ln), moss(cx - 6, by - 9, 8, 3.4, 1));
  t.add(path(`M${cx - 9} ${by - 22}Q${cx - 13} ${by - 40} ${cx - 6} ${by - 54}H${cx + 6}Q${cx + 13} ${by - 40} ${cx + 9} ${by - 22}Z`, g, 1, ln), path(`M${cx - 7} ${by - 52}l14 0l0 6q-7 4 -14 0Z`, v === 'b' ? '#8a9a78' : '#c8553f', .85, ink('#6e1a10', .6, .7)));
  if (v === 'b') t.add(path(`M${cx - 6} ${by - 54}l3 -3l4 2l3 -2l2 4Z`, g, 1, ln));
  else t.add(circ(cx, by - 62, 9, t.lg(['#e8e6d6', '#a4a290'], 45), 1, ln), line(`M${cx - 4} ${by - 63}q1.6 1.6 3.2 0M${cx + 1} ${by - 63}q1.6 1.6 3.2 0`, '#4a463c', 1, .85), line(`M${cx - 1.4} ${by - 58}q1.4 1 2.8 0`, '#8a6a5a', .8, .8), ell(cx - 3, by - 66, 3, 1.4, '#fff', .5, -30));
  if (v === 'a' || v === 'd') t.add(path(`M${cx - 10} ${by - 66}Q${cx} ${by - 78} ${cx + 10} ${by - 66}Q${cx} ${by - 62} ${cx - 10} ${by - 66}Z`, '#c8553f', .9, ink('#6e1a10', .6, .7)));
  if (v === 'c') t.add(ell(cx - 22, by - 3, 4, 2.4, '#a8cf86', 1, 0, ln), rect(cx + 14, by - 6, 8, 6, '#f6efdc', 2, 1, ink('#8a7a60', .6, .8)), ell(cx + 18, by - 6, 4, 1.4, '#7a5a3a', 1), circ(cx - 14, by - 4, 1.8, '#e8c060'), circ(cx + 26, by - 2, 1.6, '#c8553f'), line(`M${cx + 26} ${by - 2}v-5`, '#6fa050', 1, .9), ell(cx + 4, by - 3, 3.4, 1.8, '#b4ad98', 1, 0, ln), ell(cx + 4, by - 6.4, 2.8, 1.6, '#cfd0c4', 1, 0, ln));
  t.add(moss(cx - 6, by - 28, 6, 3, 2), moss(cx + 6, by - 48, 5, 2.6, 3), moss(cx - 2, by - 70 + (v === 'b' ? 14 : 0), 7, 3.2, 4));
  if (v === 'd') t.add(vinesOn(R('jd'), cx + 4, by - 52, 36, 1));
  tf(t, by + 3);
}
for (const v of ['a', 'b', 'c', 'd']) prop('props', 'jizo-mossy', v, ['tall', 'obstacle', 'statue', 'jizo', 'ruin', v === 'b' ? 'headless' : v === 'c' ? 'offerings' : 'mossy'], (t) => jizo(t, v), T, 128);
// gorinto and stele
function gorinto(t, v) {
  const cx = 32, by = 112, g = t.lg(ST, 0); t.add(sh(34, by + 2, 17, 5));
  const parts = [[cx - 13, 14, 'rect'], [cx - 10, 22, 'ball'], [cx - 13, 14, 'roof'], [cx - 8, 10, 'jewel'], [cx - 4, 12, 'tip']]; let y = by;
  t.add(rect(cx - 15, y - 10, 30, 10, g, 2, 1, ln)); y -= 10;
  t.add(rect(cx - 12, y - 14, 24, 14, g, 1, 1, ln), line(`M${cx - 12} ${y - 7}h24`, '#74786a', 1, .4)); y -= 14;
  t.add(ell(cx, y - 11, 11.6, 11, t.rg(ST, .36, .3, .9), 1, 0, ln)); y -= 22;
  t.add(path(`M${cx - 15} ${y}L${cx} ${y - 14}L${cx + 15} ${y}Z`, g, 1, ln)); y -= 14;
  t.add(ell(cx, y - 5, 7, 6, t.rg(ST, .36, .3, .9), 1, 0, ln)); y -= 11;
  t.add(path(`M${cx - 5} ${y}Q${cx} ${y - 14} ${cx + 5} ${y}Z`, g, 1, ln));
  t.add(moss(cx - 6, by - 10, 8, 3.4, 1), moss(cx + 5, by - 24, 8, 3.8, 2), moss(cx - 4, by - 48, 7, 3, 3), moss(cx + 6, by - 62, 5, 2.4, 4));
  if (v === 'b') t.add(vinesOn(R('gb'), cx - 6, by - 60, 40, 1)); tf(t, by + 3);
}
for (const v of ['a', 'b']) prop('props', 'gorinto', v, ['tall', 'obstacle', 'ruin', 'stone', 'grave'], (t) => gorinto(t, v), T, 128);
function stele(t, v) {
  const cx = 32, by = 112, g = t.lg(['#d8d6c6', '#a4a290', '#6e7064'], 0); t.add(sh(34, by + 2, 17, 5));
  t.add(path(`M${cx - 15} ${by + 1}Q${cx - 15} ${by - 6} ${cx - 11} ${by - 7}H${cx + 11}Q${cx + 15} ${by - 6} ${cx + 15} ${by + 1}Z`, t.lg(ST, 0), 1, ln));
  t.add(path(`M${cx - 11} ${by - 7}V${by - 68}Q${cx - 11} ${by - 80} ${cx} ${by - 82}Q${cx + 11} ${by - 80} ${cx + 11} ${by - 68}V${by - 7}Z`, g, 1, ln), ell(cx - 6, by - 60, 2.4, 18, '#fff', .3));
  for (let i = 0; i < 7; i++) t.add(line(`M${cx - 4} ${by - 62 + i * 8}h8${i % 2 ? 'M' + (cx - 4) + ' ' + (by - 59 + i * 8) + 'h4' : ''}`, '#4a463c', 1.1, .55));
  if (v === 'b') t.add(crack(R('sb'), cx - 2, by - 70, 26, 1.3));
  t.add(moss(cx - 4, by - 8, 9, 3.6, 1), moss(cx + 5, by - 36, 6, 3, 2), moss(cx, by - 80, 7, 3, 3));
  if (v === 'a') t.add(vinesOn(R('sa'), cx + 6, by - 60, 40, 1)); tf(t, by + 3);
}
for (const v of ['a', 'b']) prop('props', 'stele', v, ['tall', 'obstacle', 'ruin', 'stone'], (t) => stele(t, v), T, 128);
// trees: ivy snag, shrine maple
function snag(t, v) {
  t.add(sh(34, 114, 17, 5.5), trunk(t, 32, 112, 6, 3.4, v === 'a' ? 70 : 50, ['#8a8272', '#6a6252', '#4a4438'], v === 'a' ? 1 : -2));
  const R2 = R('sn' + v), br = v === 'a' ? [['M32 56L16 40L10 26', 1], ['M33 62L50 46L56 32', 1], ['M25 48L20 30', 1], ['M40 52L44 34', 1]] : [['M31 76L16 62L8 56', 1], ['M33 80L48 68L58 62', 1], ['M32 70L28 50', 1]];
  for (const [d] of br) t.add(line(d, '#4a4438', 3, .95), line(d, '#8a8272', 1, .6));
  t.add(moss(30, 100, 8, 3.4, 1), moss(34, 76, 5, 2.6, 2), vinesOn(R2, 28, v === 'a' ? 50 : 70, 50, 2), vinesOn(R2, 40, v === 'a' ? 50 : 70, 30, 1));
  for (const [x, y] of v === 'a' ? [[10, 28], [56, 34], [20, 32], [44, 36]] : [[8, 58], [58, 64], [28, 52]]) t.add(ivySprig(R2, x, y, 12, 1.6, 4));
  tf(t, 116);
}
for (const v of ['a', 'b']) prop('trees', 'snag-ivy', v, ['tall', 'tree', 'obstacle', 'ruin', 'dead'], (t) => snag(t, v), T, 128);
prop('trees', 'maple-shrine', 'a', ['tall', 'tree', 'obstacle', 'ruin', 'autumn'], (t) => broad(t, { cols: ['#f3a45a', '#d2622e', '#a03c22'], cr: 21, cy: 52, seed: 9301, trunkH: 46, barkCols: ['#8a8272', '#6a6252', '#4a4438'], extra: () => moss(30, 80, 7, 3, 3) + moss(28, 108, 6, 2.6, 4) }), T, 128);

// ============================ cell props ============================
function komainu(t, v) {
  const cx = 32; t.add(sh(34, 56, 17, 4));
  t.add(path('M12 56Q12 48 16 47H48Q52 48 52 56Z', t.lg(ST, 0), 1, ln), rect(16, 40, 32, 8, t.lg(ST, 0), 2, 1, ln));
  const g = t.lg(['#e8e6d6', '#b4b09c', '#85826f'], 30);
  t.add(path('M20 40Q18 30 22 24L26 20H38L42 24Q46 30 44 40Z', g, 1, ln), path('M44 38Q56 34 54 22Q50 30 42 30Z', '#b4b09c', 1, ln));
  t.add(rect(23, 36, 5, 5, '#b4b09c', 1, 1, ln), rect(36, 36, 5, 5, '#b4b09c', 1, 1, ln));
  if (v !== 'c') {
    t.add(circ(cx, 20, 11, t.lg(['#e8e6d6', '#9a9784'], 45), 1, ln));
    for (let i = 0; i < 6; i++) t.add(circ(cx - 12 + i * 4.8, 12 + (i % 2) * 2, 3, '#b4b09c', 1, ink(P.inkR, .6, .7)));
    t.add(path(`M${cx - 8} 14L${cx - 11} 6L${cx - 5} 10Z`, '#d8d6c6', 1, ln), path(`M${cx + 8} 14L${cx + 11} 6L${cx + 5} 10Z`, '#d8d6c6', 1, ln), circ(cx - 4, 19, 1.5, '#4a463c'), circ(cx + 4, 19, 1.5, '#4a463c'), line(`M${cx - 2} 22l2 2l2 -2`, '#4a463c', 1, .8));
    t.add(v === 'a' ? path(`M${cx - 5} 25Q${cx} 31 ${cx + 5} 25Q${cx} 27 ${cx - 5} 25Z`, '#5a1a14', 1) : line(`M${cx - 5} 25Q${cx} 27 ${cx + 5} 25`, '#4a463c', 1.2, .85));
    t.add(ell(cx - 4, 14, 3, 1.4, '#fff', .5, -25));
  } else t.add(path('M26 20L28 12L34 14L38 10L40 20Z', g, 1, ln), circ(18, 54, 0, '#fff'), ell(48, 48, 6, 4, '#a2a596', 1, 0, ln), ell(46, 46.4, 3, 1.2, '#fff', .5));
  t.add(moss(24, 40, 8, 3.2, 1), moss(44, 28, 5, 2.6, 2), moss(cx, 24 + (v === 'c' ? 0 : -14), 6, 2.6, 3), tuft(12, 56, '#5f8f4c', .8, .6));
}
for (const v of ['a', 'b', 'c']) prop('props', 'komainu-mossy', v, ['obstacle', 'statue', 'komainu', 'ruin', v === 'a' ? 'agyo' : v === 'b' ? 'ungyo' : 'broken'], (t) => komainu(t, v));
prop('props', 'pillar-toppled', 'a', ['obstacle', 'ruin', 'pillar', 'fallen'], (t) => { t.add(ell(34, 50, 28, 4, '#3b3a24', .18)); t.add(`<g transform="rotate(-12 32 38)">`, rect(4, 30, 56, 18, t.lg(['#e6e3d4', '#b4b09c', '#7d7a6a'], 90), 4, 1, ln), ...[0, 1, 2, 3].map(i => line(`M${8 + i * 14} 31v16`, '#74786a', 1, .35)), ell(60, 39, 3.6, 9, t.lg(ST, 45), 1, 0, ln), ell(60, 39, 2, 6, '#5a5a4c', .5), '</g>', moss(18, 32, 10, 3.6, 1), moss(40, 36, 7, 3, 2), tuft(10, 54, '#5f8f4c', .8, .6)); });
prop('props', 'pillar-toppled', 'b', ['obstacle', 'ruin', 'pillar', 'fallen'], (t) => { t.add(ell(34, 52, 24, 4, '#3b3a24', .18)); t.add(`<g transform="rotate(8 22 44)">`, rect(6, 34, 26, 16, t.lg(['#e6e3d4', '#b4b09c', '#7d7a6a'], 90), 4, 1, ln), '</g>', `<g transform="rotate(-20 46 36)">`, rect(32, 24, 24, 15, t.lg(['#e6e3d4', '#b4b09c', '#7d7a6a'], 90), 4, 1, ln), ell(32, 31, 3, 7, '#5a5a4c', .5), '</g>', moss(20, 36, 8, 3, 1), moss(44, 28, 6, 2.6, 2), tuft(52, 52, '#5f8f4c', .8, .6)); });
prop('props', 'pillar-base', 'a', ['obstacle', 'ruin', 'pillar'], (t) => { t.add(sh(34, 54, 16, 4)); t.add(rect(14, 40, 36, 12, t.lg(ST, 0), 3, 1, ln), ell(32, 40, 15, 5, t.lg(['#e6e3d4', '#b4b09c'], 45), 1, 0, ln), ell(32, 40, 8, 2.6, '#8a8878', .6), moss(24, 42, 9, 3, 1), moss(42, 48, 6, 2.6, 2), tuft(14, 54, '#5f8f4c', .8, .6)); });
function stairs(t, v) {   // staircase climbing north: each tread is a lighter top plus a darker riser
  const n = 5, y0 = 54, h = 8.4; t.add(ell(34, 58, 26, 3.4, '#3b3a24', .16));
  for (let i = 0; i < n; i++) { const y = y0 - i * h, w = 50 - i * 2; if (v === 'c' && i === 2) { t.add(path(`M${32 - w / 2} ${y}h${w * .35}l5 -${h * .6}l5 3l-4 ${h * .4}h-${w * .1}v${h * .2}h-${w * .35}Z`, t.lg(ST, 90), 1, ln)); continue; } t.add(rect(32 - w / 2, y - h, w, h, t.lg(['#cfd0c4', '#8a8e7c'], 90), 1, 1, ln), rect(32 - w / 2, y - h, w, 3.4, '#f0f0e4', 0, .7), line(`M${32 - w / 2 + 3} ${y - 3}h${w - 6}`, '#5e4e3e', .8, .35)); }
  t.add(rect(4, 14, 6, 44, t.lg(['#bfc0b0', '#8a8e7c'], 0), 2, 1, ln), rect(54, 14, 6, 44, t.lg(['#bfc0b0', '#8a8e7c'], 0), 2, 1, ln));
  for (let i = 0; i < n; i++) if ((i + v.charCodeAt(0)) % 2) t.add(moss(32 + (i % 3 - 1) * 10, y0 - i * h - 3, 10, 3, i + 1)); if (v === 'b') t.add(vinesOn(R('sv'), 20, 20, 30, 2)); t.add(crack(R('sc' + v), 26, 30, 16, 1), moss(7, 22, 4, 3, 5), moss(57, 18, 4, 3, 6));
}
for (const v of ['a', 'b', 'c']) prop('props', 'stairs-overgrown', v, ['obstacle', 'ruin', 'stairs', 'walkable'], (t) => stairs(t, v));
for (const v of ['a', 'b']) prop('props', 'stone-basin', v, ['obstacle', 'ruin', 'shrine', v === 'a' ? 'water' : 'dry'], (t) => { t.add(sh(34, 56, 17, 4)); t.add(path('M12 54Q10 40 18 32H46Q54 40 52 54Q32 60 12 54Z', t.lg(ST, 60), 1, ln), ell(32, 33, 15, 4.6, '#7f8a74', 1), ell(32, 34, 13, 3.4, v === 'a' ? '#7fb8b0' : '#9aab7e', 1), v === 'a' ? ell(30, 33.4, 6, 1.2, '#fff', .55) : moss(32, 34, 9, 2.4, 1), moss(20, 46, 7, 3, 2), ...(v === 'a' ? [rect(44, 16, 3, 20, '#c9a874', 1, 1, ln), rect(40, 14, 8, 4, '#a87c46', 1, 1, ln)] : [])); });
prop('props', 'offering-box', 'a', ['obstacle', 'ruin', 'shrine'], (t) => { t.add(sh(34, 56, 18, 4)); t.add(rect(14, 28, 36, 24, t.lg(WOOD, 90), 2, 1, ink(P.inkW, 1, .85)), ...[0, 1, 2, 3].map(i => line(`M${20 + i * 8} 28V52`, '#4a3220', .8, .5)), rect(14, 24, 36, 6, '#6b4a2c', 1, 1, ink(P.inkW, 1, .85)), ...[0, 1, 2, 3, 4].map(i => line(`M${18 + i * 6} 24v6`, '#2a1a0c', 1, .8)), rect(14, 36, 36, 2.4, '#2a1a0c', 0, .5), rect(14, 52, 36, 3, '#4a463c', 1), moss(24, 24, 8, 3, 1), moss(46, 38, 4, 3, 2), circ(44, 20, 1.6, '#e8c870'), line('M30 6l0 14', '#f6efdc', 3, .9), path('M26 6h8l-1 8h-6Z', '#f6efdc', 1, ink('#8a7a60', .6, .8))); });
for (const v of ['a', 'b']) prop('props', 'brazier', v, ['obstacle', 'ruin', 'light', v === 'b' ? 'lit' : 'unlit'], (t) => { t.add(sh(34, 56, 14, 3.6)); if (v === 'b') t.add(glowC(t, 32, 26, 22, '#ffe6a0', '#ff9a3a', .8)); t.add(path('M22 54L26 40H38L42 54Z', t.lg(ST, 0), 1, ln), path('M18 28Q32 44 46 28L42 38Q32 44 22 38Z', t.lg(['#cfd0c4', '#74786a'], 90), 1, ln), ell(32, 28, 14, 4, '#3a3a32', 1, 0, ln)); if (v === 'b') t.add(path('M26 28Q24 16 32 8Q34 16 38 14Q40 22 38 28Z', t.lg(['#ffe9b0', '#ff9a3a'], 90), 1, ink('#a0501a', .6, .8)), path('M30 28Q30 20 33 16Q35 22 35 28Z', '#fff6c8', 1)); else t.add(ell(32, 27, 9, 2, '#6b6a5c', 1), moss(24, 40, 6, 2.6, 1)); });
for (const v of ['a', 'b']) prop('props', 'grave-marker', v, ['obstacle', 'ruin', 'grave'], (t) => { t.add(sh(34, 56, 14, 3.6)); if (v === 'a') { for (const [x, h, lean] of [[24, 34, -4], [38, 40, 3]]) t.add(`<g transform="rotate(${lean} ${x} 54)">`, rect(x - 4, 54 - h, 8, h, t.lg(['#d8c8a0', '#a8946a', '#7a6a4a'], 0), 1, 1, ink(P.inkW, .9, .8)), path(`M${x - 4} ${54 - h}l4 -5l4 5Z`, '#d8c8a0', 1, ink(P.inkW, .9, .8)), line(`M${x - 1.4} ${50 - h}v${h - 8}`, '#4a3220', 1, .5), '</g>'); t.add(moss(24, 52, 6, 2.6, 1), tuft(46, 55, '#5f8f4c', .8, .6)); } else { t.add(path('M18 54V26Q18 14 32 14Q46 14 46 26V54Z', t.lg(['#d8d6c6', '#a4a290', '#6e7064'], 0), 1, ln), line('M26 26h12M26 32h12M28 38h8', '#4a463c', 1, .55), ell(22, 28, 2.4, 10, '#fff', .3), moss(28, 16, 8, 3, 1), moss(24, 52, 8, 3, 2), crack(R('gmb'), 36, 24, 14, 1)); } });
prop('props', 'statue-fallen', 'a', ['obstacle', 'ruin', 'statue', 'jizo'], (t) => { t.add(ell(34, 50, 24, 4, '#3b3a24', .16)); t.add(`<g transform="rotate(-84 32 40)">`, path('M23 52Q19 40 26 28H38Q45 40 41 52Z', t.lg(['#d8d6c6', '#a4a290', '#76766a'], 0), 1, ln), circ(32, 20, 8, t.lg(['#e8e6d6', '#a4a290'], 45), 1, ln), path('M24 30h16v5q-8 4 -16 0Z', '#c8553f', .85), '</g>', moss(20, 44, 8, 3, 1), moss(40, 42, 6, 2.6, 2), tuft(52, 54, '#5f8f4c', .8, .6)); });
prop('props', 'lantern-toppled', 'a', ['obstacle', 'ruin', 'lantern', 'fallen'], (t) => { t.add(ell(34, 52, 24, 4, '#3b3a24', .16)); t.add(`<g transform="rotate(-76 32 40)">`, path('M22 54Q22 46 26 45H38Q42 46 42 54Z', t.lg(ST, 0), 1, ln), rect(28, 28, 8, 17, t.lg(ST, 0), 1, 1, ln), path('M20 28Q32 24 44 28L42 31Q32 34 22 31Z', t.lg(ST, 0), 1, ln), rect(24, 16, 16, 12, t.lg(['#d8d4c0', '#8f8c7a'], 0), 0, 1, ln), rect(27, 19, 10, 7, '#3a463c', 1.4), path('M18 16Q32 12 32 4Q32 12 46 16Q32 20 18 16Z', t.lg(['#eeeadb', '#74705e'], 60), 1, ln), '</g>', moss(18, 42, 8, 3, 1), tuft(52, 54, '#5f8f4c', .8, .6)); });
prop('props', 'well-ruin', 'a', ['obstacle', 'ruin', 'well', 'water'], (t) => { t.add(sh(34, 56, 18, 4)); t.add(path('M12 52Q10 32 18 26H46Q54 32 52 52Q32 58 12 52Z', t.lg(['#cfd0c4', '#a2a596', '#74786a'], 60), 1, ln), ...[0, 1, 2].map(i => line(`M${14 + i * 4} ${30 + i * 8}q18 5 ${36 - i * 8} 0`, '#5e4e3e', .9, .4)), ell(32, 27, 15, 5, '#5e6a5c', 1, 0, ln), ell(32, 28, 12.6, 3.6, '#2a4a48', 1), ell(30, 27.4, 5, 1, '#9ad0c0', .5), moss(20, 30, 9, 3, 1), moss(44, 44, 7, 3, 2), rect(14, 6, 4, 22, '#6b4a2c', 1, 1, ink(P.inkW, .9, .8)), rect(46, 6, 4, 22, '#6b4a2c', 1, 1, ink(P.inkW, .9, .8)), line('M14 8H50', '#4a3220', 3, .9), path('M30 10v12', 'none', 1, { fill: 'none', stroke: '#5a4a32', 'stroke-width': 1.2 }), tuft(10, 55, '#5f8f4c', .8, .6)); });
// rocks
for (const [v, s] of [['a', 11], ['b', 12], ['c', 13]]) prop('rocks', 'rubble-pile', v, ['obstacle', 'ruin', 'rubble'], (t, r) => { t.add(sh(34, 54, 22, 4.4)); for (const [x, y, rx, ry] of v === 'a' ? [[22, 44, 11, 7], [40, 46, 12, 8], [32, 34, 10, 7]] : v === 'b' ? [[20, 46, 9, 6], [34, 44, 13, 9], [46, 48, 8, 5], [30, 32, 8, 5]] : [[26, 44, 14, 9], [44, 48, 9, 6], [18, 36, 7, 5]]) t.add(rockS(t, r, x, y, rx, ry, ['#e0d9c4', '#b4ad98', '#857d6c'], { moss: (x + v.charCodeAt(0)) % 2 === 0, facets: 2 })); t.add(tuft(52, 54, '#5f8f4c', .8, .6)); });
for (const [v, mo] of [['a', true], ['b', false]]) prop('rocks', 'boulder-ruin', v, ['obstacle', 'ruin', 'boulder'], (t, r) => { t.add(rockS(t, r, 32, 38, 18, 14, ['#d8d6c6', '#a4a290', '#74746a'], { moss: mo, fern: v === 'b', facets: 4 })); t.add(moss(24, 26, 7, 2.6, 3), tuft(12, 54, '#5f8f4c', .8, .6)); });
for (const v of ['a', 'b']) prop('rocks', 'wall-chunk', v, ['obstacle', 'ruin', 'rubble'], (t, r) => { t.add(sh(34, 54, 20, 4)); t.add(`<g transform="rotate(${v === 'a' ? -8 : 10} 32 40)">`, rect(10, 28, 44, 22, t.lg(['#cfd0c4', '#a2a596', '#74786a'], 90), 2, 1, ln), line('M10 38H54M26 28V38M40 38V50', '#4a463c', 1, .45), rect(10, 28, 44, 3, '#f0f0e4', 1, .5), '</g>', moss(22, 30, 9, 3, 1), moss(44, 42, 6, 2.6, 2), tuft(10, 54, '#5f8f4c', .8, .6)); });
// plants (grass category)
for (const v of ['a', 'b', 'c']) prop('grass', 'moss-clump', v, ['ruin', 'moss', 'plant'], (t, r) => { t.add(ell(34, 52, 18, 3.4, '#3b3a24', .14)); for (const [x, y, w] of v === 'a' ? [[32, 44, 15]] : v === 'b' ? [[22, 46, 11], [40, 42, 12]] : [[18, 48, 8], [32, 40, 11], [46, 48, 8]]) t.add(moss(x, y, w, w * .62, x), ...[0, 1, 2].map(i => tuft(x + (i - 1) * w * .4, y + 2, '#4d7a40', .8, .5))); });
for (const v of ['a', 'b', 'c']) prop('grass', 'fern-clump', v, ['ruin', 'fern', 'plant'], (t) => { t.add(ell(34, 52, 18, 3.4, '#3b3a24', .14), fronds(32, 52, v === 'a' ? 6 : 8, v === 'c' ? 22 : 26, v === 'b' ? ['#86cd7f', '#4a9a50'] : ['#6fb560', '#3f8048', '#86cd7f']), tuft(14, 54, '#5f8f4c', .8, .6)); });
prop('grass', 'ivy-bush', 'a', ['ruin', 'ivy', 'plant', 'obstacle'], (t, r) => { t.add(sh(34, 54, 20, 4)); for (let i = 0; i < 9; i++) t.add(ivySprig(r, r.range(14, 50), r.range(30, 52), 14, r.range(-3, 0), 4)); });
for (const [v, caps] of [['a', [['#f0b878', '#c8803a']]], ['b', [['#b8d8f0', '#7aa8c8']]]]) prop('grass', 'mushrooms-ruin', v, ['ruin', 'mushroom', 'plant'], (t) => { t.add(mush(t, 22, 52, .9, caps[0], { spots: false }), mush(t, 38, 54, .7, caps[0], { spots: false }), mush(t, 46, 46, .5, caps[0], { spots: false }), moss(30, 54, 12, 3, 1)); });

// ============================ large (128x128) ============================
function torii(t, v) {   // v: a = right pillar fallen + beam on ground, b = left pillar standing with the beam hanging, c = both stumps
  const g = t.lg(['#ec6a50', '#c8352b', '#8e2118'], 0), faded = t.lg(['#c8a08a', '#9a7060', '#6a4a3e'], 0), ik = ink('#5a1a14', .9, .85);
  t.add(sh(66, 116, 50, 7));
  const post = (x, h, top) => { t.add(rect(x - 6, 112 - h, 12, h, faded, 1, 1, ik), rect(x - 6, 112 - h, 12, h, g, 1, 0), rect(x - 8, 104, 16, 8, t.lg(ST, 0), 2, 1, ln), line(`M${x - 2} ${112 - h + 2}v${h - 10}`, '#fff', 1, .25)); t.add(moss(x - 2, 108, 8, 3, x), moss(x + 2, 112 - h * .5, 5, 2.6, x + 1)); };
  if (v === 'a') {
    post(32, 92); t.add(path('M20 24L32 20L40 18L38 30L24 32Z', 'none', 1, { fill: 'none' }));
    t.add(path('M20 24Q32 28 46 22L48 28Q32 34 18 30Z', t.lg(['#2a2a30', '#111'], 90), 1, ink('#000', .5, .8)), rect(24, 38, 30, 6, g, 1, 1, ik));
    t.add(`<g transform="rotate(74 92 94)">`, rect(80, 70, 12, 44, g, 1, 1, ik), '</g>', ell(96, 106, 18, 4, '#3b3a24', .18), `<g transform="rotate(-6 80 106)">`, path('M52 96Q78 102 112 96L114 102Q80 110 50 102Z', t.lg(['#2a2a30', '#111'], 90), 1, ink('#000', .5, .8)), '</g>', rect(86, 108, 16, 6, t.lg(ST, 0), 2, 1, ln), moss(72, 100, 10, 3, 5), moss(94, 104, 8, 3, 6));
  } else if (v === 'b') {
    post(34, 92); post(94, 36);
    t.add(`<g transform="rotate(10 64 24)">`, path('M14 20Q36 14 64 22Q92 14 116 20L118 28Q92 24 64 32Q36 24 12 28Z', t.lg(['#3a3a40', '#1a1a20'], 90), 1, ink('#000', .5, .8)), rect(28, 36, 72, 6, g, 1, 1, ik), '</g>');
    t.add(line('M96 78l-6 10l8 6', '#4a463c', 1.2, .8), moss(58, 28, 14, 4, 7), vinesOn(R('tb'), 46, 30, 40, 2));
  } else {
    post(34, 24); post(94, 40); t.add(`<g transform="rotate(-4 64 106)">`, path('M30 96Q64 100 98 94L100 102Q64 110 28 104Z', t.lg(['#3a3a40', '#1a1a20'], 90), 1, ink('#000', .5, .8)), '</g>', ell(104, 92, 10, 6, '#a2a596', 1, 0, ln), moss(60, 100, 14, 4, 8), moss(100, 90, 8, 3, 9));
    t.add(vinesOn(R('tc'), 100, 80, 20, 2), ...[0, 1, 2].map(i => ell(20 + i * 7, 112 - i % 2 * 2, 4, 3, '#a2a596', 1, 0, ln)));
  }
  t.add(tuft(10, 114, '#5f8f4c', .8, .8), tuft(118, 116, '#5f8f4c', .8, .7));
}
for (const v of ['a', 'b', 'c']) prop('interest', 'torii-ruin', v, ['large', 'obstacle', 'torii', 'ruin', 'waypoint', 'broken'], (t) => torii(t, v), 128, 128);
// ruined archway gate (to Firefly Marsh)
function arch(t, open) {
  t.add(sh(66, 116, 54, 8));
  const g = t.lg(['#d8d6c6', '#a4a290', '#6e7064'], 45), ik = ink(P.inkR, 1.1, .85);
  t.add(path('M18 114V70Q18 28 64 24Q110 28 110 70V114H92V74Q92 50 64 48Q36 50 36 74V114Z', g, 1, ik));
  for (let i = 0; i < 9; i++) { const a = Math.PI + (i + .5) / 9 * Math.PI, ca = Math.cos(a), sa = Math.sin(a); t.add(line(`M${f(64 + ca * 28)} ${f(74 + sa * 26)}L${f(64 + ca * 44)} ${f(74 + sa * 44)}`, '#4a463c', 1.1, .45)); }
  t.add(path('M64 24Q80 22 96 34L90 42Q78 34 64 32Z', '#fff', .3), path('M36 74Q36 50 64 48Q92 50 92 74V114H36Z', open ? t.lg(['#1d2a28', '#0e1614'], 90) : '#2a3430', 1, ink('#111', .8, .8)));
  if (open) t.add(ell(64, 106, 22, 5, '#2e3a36', 1), ell(64, 84, 14, 18, '#2f4a46', .35), sparkle(60, 80, .6, '#bff5d8'), sparkle(70, 92, .5, '#bff5d8'));
  else { for (const [x, y, w, h, rot] of [[50, 96, 14, 40, -8], [64, 90, 12, 44, 4], [78, 96, 14, 38, 10]]) t.add(`<g transform="rotate(${rot} ${x} ${y + h / 2})">`, rect(x - w / 2, y - h / 2 + 10, w, h, t.lg(['#9a7a4a', '#6b4a2c'], 0), 1, 1, ink(P.inkW, .9, .8)), '</g>'); t.add(rect(38, 84, 52, 5, '#6b4a2c', 1, 1, ink(P.inkW, .9, .8)), rect(38, 100, 52, 5, '#6b4a2c', 1, 1, ink(P.inkW, .9, .8)), ell(46, 112, 9, 5, '#a2a596', 1, 0, ln), ell(84, 112, 12, 6, '#b4ad98', 1, 0, ln), ell(68, 114, 7, 3.4, '#a2a596', 1, 0, ln)); }
  t.add(rect(14, 106, 26, 8, t.lg(ST, 0), 2, 1, ln), rect(88, 106, 26, 8, t.lg(ST, 0), 2, 1, ln), moss(28, 108, 10, 3.4, 1), moss(100, 108, 10, 3.4, 2), moss(36, 36, 14, 5, 3), moss(88, 40, 12, 4.6, 4), moss(24, 80, 8, 4, 5), moss(104, 70, 8, 4, 6));
  const r = R('arch' + open); t.add(vinesOn(r, 30, 36, 56, 2), vinesOn(r, 84, 40, 50, 2), crack(r, 52, 34, 18, 1.2), tuft(10, 116, '#5f8f4c', .8, .8), tuft(118, 116, '#5f8f4c', .8, .7));
  if (open) t.add(line('M42 62Q64 56 86 62', 'none', 1, { fill: 'none' }));
}
for (const k of ['closed', 'open']) prop('interest', 'gate-ruin-arch', k, ['large', 'obstacle', 'gate', 'ruin', 'arch', k], (t) => arch(t, k === 'open'), 128, 128);
// collapsed shrine hall
prop('interest', 'shrine-collapsed', 'a', ['large', 'obstacle', 'shrine', 'ruin'], (t, r) => {
  t.add(sh(66, 116, 54, 8));
  t.add(rect(14, 100, 100, 14, t.lg(['#cfd0c4', '#8a8e7c'], 90), 2, 1, ln), rect(18, 70, 92, 32, t.lg(['#cdb48a', '#a8885a'], 90), 0, 1, ink(P.inkW, 1, .85)));
  for (const x of [24, 50, 78, 104]) t.add(rect(x - 3, 66, 6, 38, t.lg(['#b06a4a', '#8a4a30', '#5a2a1a'], 0), 1, 1, ink('#3a1a10', .9, .85)));
  t.add(rect(54, 76, 22, 26, '#2a2420', 1, 1, ink('#111', .8, .8)), rect(30, 78, 18, 20, '#3a3028', 1), line('M38 78v20M30 88h18', '#8a6a44', 1, .7));
  t.add(path('M2 74Q10 56 34 44Q50 32 64 26L70 44L52 52L66 66L30 76Z', t.lg(['#9aa4b8', '#6f7f98', '#46546c'], 60), 1, ink('#2a3a53', 1.1, .85)), line('M16 66Q30 52 50 46M8 72Q24 60 44 54', '#2a3a53', 1, .35), path('M70 44L74 38L100 54L122 76L88 72L96 62Z', t.lg(['#9aa4b8', '#6f7f98', '#46546c'], 60), 1, ink('#2a3a53', 1.1, .85)), path('M68 40L86 62L72 70L60 52Z', '#1d1a16', .8));
  t.add(moss(30, 56, 16, 5, 1), moss(100, 66, 12, 4.4, 2), moss(64, 98, 14, 4, 3), vinesOn(r, 76, 70, 34, 2), ell(86, 100, 10, 5, '#a2a596', 1, 0, ln), ell(22, 108, 8, 4, '#b4ad98', 1, 0, ln));
  for (const [x, y] of [[64, 96], [46, 100]]) t.add(path(`M${x - 6} ${y}l12 -3l3 5l-12 3Z`, '#6f7f98', 1, ink('#2a3a53', .6, .8)));
  t.add(tuft(8, 116, '#5f8f4c', .8, .8), tuft(118, 116, '#5f8f4c', .8, .7));
}, 128, 128);

// ============================ overlays ============================
const ov = (name, v, w, h, fn, tags = []) => { const t = mk('overlays', name, v, w, h); fn(t, R(name + v)); out(t, 'overlays', name, v, ['overlay', 'mossy-ruins', ...tags]); };
const wisp = (t, x, y, s = 1, c = ['#e8fff4', '#7fe0c0']) => t.add(glowC(t, x, y, 13 * s, c[0], c[1], .85), circ(x, y, 2.2 * s, '#fff', .95), line(`M${f(x)} ${f(y)}q${f(-6 * s)} ${f(5 * s)} ${f(-12 * s)} ${f(3 * s)}`, c[0], 1.2, .5), ell(x - 1, y - 1, 1, 1, '#fff', 1));
for (const [v, cols, n] of [['a', [['#e8fff4', '#7fe0c0']], 2], ['b', [['#e8fff4', '#7fe0c0'], ['#e0f0ff', '#8ab4f0']], 3], ['c', [['#fff0d0', '#ffb04a']], 2], ['d', [['#e8fff4', '#7fe0c0'], ['#fff0d0', '#ffb04a']], 3]]) ov('wisp-glow', v, T, T, (t, r) => { scat(r, n, 14, 20).forEach(([x, y], i) => wisp(t, x, y, r.range(.7, 1.1), cols[i % cols.length])); }, ['light', 'wisp', 'ambient']);
for (const v of ['a', 'b', 'c']) ov('ruin-mist', v, 128, 128, (t, r) => { for (let i = 0; i < 9; i++) { const x = r.range(26, 102), y = r.range(30, 98), rx = r.range(20, 36); t.add(ell(x, y, rx, rx * r.range(.22, .34), '#eef2e6', r.range(.16, .28)), ell(x + 4, y - 2, rx * .6, rx * .14, '#fff', .16)); } }, ['mist', 'large']);
for (const v of ['a', 'b', 'c']) ov('ivy-hang', v, T, T, (t, r) => { for (let i = 0; i < 4; i++) { const x = 8 + i * 15 + r.range(-3, 3), len = r.range(16, 40); t.add(line(`M${f(x)} 0q${f(r.range(-3, 3))} ${f(len / 2)} ${f(r.range(-2, 2))} ${f(len)}`, '#3a5a2a', 1, .9)); for (let k = 0; k < len / 5; k++) t.add(`<path d="M${f(x + (k % 2 ? 1.6 : -1.6))} ${f(k * 5 + 3)}q${k % 2 ? 4 : -4} -2 ${k % 2 ? 5 : -5} 0q${k % 2 ? -2 : 2} 3.4 ${k % 2 ? -5 : 5} 1Z" fill="${k % 3 ? '#4a9a50' : '#6fb560'}" stroke="#1d4a26" stroke-width=".4" stroke-opacity=".6"/>`); } }, ['ivy', 'hanging']);
for (const v of ['a', 'b']) ov('light-shafts-ruin', v, T, 128, (t, r) => { for (let i = 0; i < 3; i++) { const x = 12 + i * 15 + r.range(-3, 3), w = r.range(6, 10); t.add(path(`M${f(x)} 6L${f(x + w)} 6L${f(x + w + 26)} 122L${f(x + 14)} 122Z`, '#f6f6d0', .1 + r() * .1)); } for (let i = 0; i < 9; i++) t.add(circ(r.range(10, 54), r.range(14, 112), r.range(.7, 1.3), '#fff6c0', .8)); }, ['light', 'tall']);
for (const v of ['a', 'b']) ov('spirit-motes', v, T, T, (t, r) => { for (let i = 0; i < 9; i++) t.add(circ(r.range(6, 58), r.range(6, 58), r.range(.7, 1.4), r.pick(['#bff5d8', '#e8fff4', '#d8f0ff']), r.range(.6, .95))); t.add(sparkle(r.range(14, 50), r.range(14, 50), .6, '#e8fff4')); }, ['ambient', 'wisp']);
