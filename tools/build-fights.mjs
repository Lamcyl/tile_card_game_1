#!/usr/bin/env node
// Builds the playable fights of the V2 world (docs/WORLD_PROGRESSION.md "Playable fights (dev page)").
//   node tools/build-fights.mjs
// Reads docs/data/regions.json (+ bestiary.json for art families) and writes, deterministically (no clock, no Math.random):
//   prototype/data/fights/region-01.json ... region-10.json   7 fights per sub-area: intro, intro2, combine, combine2, preelite, elite, boss
//   prototype/data/fights/art-map.json                         monster name -> placeholder drawing in prototype/assets/units (exact / close / fallback)
//   docs/data/fights-unsupported.md                            keywords the engine does not run yet (inert tags), approximations; keeps the BALANCE block written by validate-fights.mjs
// The numbers: enemy HP / ATK follow WORLD_PROGRESSION 4.1 (js/fights.js baseHp / baseAtk), times a role multiplier (as gen.js templates), elite x1.6, boss x2.1, the footprint
// budget (Engine.FOOTPRINTS), and a fight scale (TUNE below) that sets how much of the level's full stat line a step of the sub-area uses. TUNE is what the validator tunes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const Engine = require('../prototype/js/engine.js');
const F = require('../prototype/js/fights.js');
const Progress = require('../prototype/js/progress.js');
const REG = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/data/regions.json'), 'utf8'));
const BEST = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/data/bestiary.json'), 'utf8'));
const OUT = path.join(ROOT, 'prototype/data/fights');
const UNITS = fs.readdirSync(path.join(ROOT, 'prototype/assets/units')).filter((f) => f.endsWith('.svg')).map((f) => f.replace('.svg', '')).sort();

// ---------- Determinism helpers ----------
const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed) => { let a = hash(seed); return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const pickOf = (R, arr) => arr[Math.floor(R() * arr.length)];
const shuffle = (R, arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = (s) => String(s).toLowerCase().replace(/ð/g, 'd').replace(/þ/g, 'th').replace(/æ/g, 'ae').replace(/ø/g, 'o').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '');

// ---------- Tuning: the fight scale ----------
// A fight's enemies start from the stat rule (js/fights.js baseHp / baseAtk) times their role multiplier (elite x1.6, boss x2.1, footprint budget). Then ONE scale per fight sets its
// total (armour-weighted) HP to `target[step]` volleys of the level's reference squad (the sum of its attackers' ATK, js/fights.js referenceSave), clamped to `scale`.
// That is what makes the 7 fights of a sub-area rise, and what keeps a fight inside the "1-2 turns, boss 2-3" target of WORLD_PROGRESSION 4.1. `atk` is the ATK share per band and step.
// tools/fights-tune.json holds the numbers; tools/validate-fights.mjs is what they are tuned against. The five bands are Lv1-3, 4-7, 8-12, 13-30, 31+.
const BAND = (L) => (L <= 3 ? 0 : L <= 7 ? 1 : L <= 12 ? 2 : L <= 30 ? 3 : 4);
const TUNE = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/fights-tune.json'), 'utf8'));
const tune = (key, step, L) => { const band = TUNE[key][BAND(L)]; return Array.isArray(band) ? band[Math.min(step, band.length - 1)] : band; };
// Per-fight corrections found by `node tools/validate-fights.mjs --suggest`: { id: { atk: factor, hp: factor } } on top of the step tuning.
const ADJUST = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/fights-adjust.json'), 'utf8'));
const VOLLEY = {};
const volleyOf = (L) => (VOLLEY[L] = VOLLEY[L] || F.referenceSave(L, Progress).volley);

// ---------- Art map ----------
const CAT_IMAGES = {
  serpent: ['hydra', 'jormungandr', 'nidhogg', 'lindworm', 'typhon', 'zmey', 'orochi', 'apep', 'imugi'],
  undead: ['draugr', 'mummy', 'hel', 'gashadokuro', 'koschei', 'ushabti'],
  ghost: ['dalgyal-gwisin', 'cheonyeo-gwisin', 'mul-gwisin', 'inmyeonjo', 'bannik'],
  spirit: ['kodama', 'leshy', 'domovoi', 'bannik', 'nisse', 'alux', 'jangseung'],
  giant: ['jotunn', 'troll', 'cyclops', 'minotaur', 'taotie', 'dvergr', 'surtr', 'oni'],
  demon: ['oni', 'ah-puch', 'buluc-chabtan', 'kui', 'camazotz'],
  trickster: ['kitsune', 'gumiho', 'tanuki', 'loki', 'hitotsume-kozo', 'chochin-obake', 'kasa-obake', 'dokkaebi', 'alux', 'nisse'],
  water: ['kappa', 'rusalka', 'siren', 'scylla', 'jingwei', 'sobek', 'mul-gwisin'],
  bird: ['tengu', 'harpy', 'firebird', 'fenghuang', 'alkonost', 'bennu', 'griffin', 'ravens', 'samjok-o', 'vucub-caquix'],
  canine: ['cerberus', 'cadejo', 'komainu', 'haetae', 'kamaitachi'],
  feline: ['baihu', 'nemean-lion', 'jangsan-beom', 'balam'],
  insect: ['serket', 'shanxiao', 'khepri', 'jorogumo'],
  plant: ['kodama', 'leshy', 'shanxiao', 'jangseung'],
  construct: ['talos', 'nurikabe', 'ushabti', 'jangseung'],
  chimera: ['chimera', 'griffin', 'sphinx', 'pixiu', 'minotaur'],
  hoofed: ['sleipnir', 'baku', 'xuanwu', 'haetae', 'minotaur'],
  witch: ['jorogumo', 'medusa', 'morana', 'yuki-onna', 'ix-chel'],
  elemental: ['raijin', 'leigong', 'yuki-onna', 'surtr', 'firebird'],
  deity: ['ra', 'set', 'sekhmet', 'perun', 'poseidon', 'nezha', 'wukong'],
  beast: ['baihu', 'nemean-lion', 'jangsan-beom', 'balam', 'cadejo', 'komainu', 'haetae', 'sleipnir'],
};
const FAMILY_CAT = {
  'Dragons and great serpents': 'serpent', 'Undead and revenants': 'undead', 'Ghosts and wailing spirits': 'ghost', 'Household and object spirits': 'spirit', 'Giants and ogres': 'giant',
  'Demons and devils': 'demon', 'Goblins, imps and little folk': 'trickster', 'Shapeshifters': 'trickster', 'Tricksters': 'trickster', 'Water-folk and river spirits': 'water', 'Sea monsters': 'water',
  'Birds and winged beasts': 'bird', 'Hounds and wolves': 'canine', 'Cats': 'feline', 'Insects, spiders and scorpions': 'insect', 'Plants, trees and fungi': 'plant', 'Constructs and golems': 'construct',
  'Guardian beasts': 'beast', 'Chimeras and hybrids': 'chimera', 'Beast-men and wild men': 'giant', 'Hags, witches and lures': 'witch', 'Elementals and storm beasts': 'elemental',
  'Horned and hoofed beasts': 'hoofed', 'Death omens and psychopomps': 'undead', 'Lake monsters and cryptids': 'water', 'Swarms and vermin': 'insect', 'Real beasts': 'beast', 'Gods as bosses (🟢 only)': 'deity',
};
const KIND_CAT = { undead: 'undead', construct: 'construct', deity: 'deity', 'deity-beast': 'beast', beast: 'beast', animal: 'beast', spirit: 'spirit', monster: 'giant' };
const famOf = {}; // normalised monster name -> category
for (const fam of BEST.families) for (const names of Object.values(fam.members)) for (const n of names) if (!famOf[norm(n)] && FAMILY_CAT[fam.name]) famOf[norm(n)] = FAMILY_CAT[fam.name];
const kindOf = {}; for (const e of BEST.entries) kindOf[norm(e.name.replace(/\s*\(.*$/, ''))] = e.kind;
const STEM = Object.fromEntries(UNITS.map((u) => [norm(u), u]));
function artFor(name, variant) {
  const n = norm(name);
  if (STEM[n]) return { art: STEM[n], match: 'exact' };
  // close: a whole word of the name is a drawing's name (Karasu-tengu -> tengu), or a long drawing name starts a word (Níðhöggr -> nidhogg)
  const words = name.replace(/\(.*?\)/g, ' ').split(/[\s\-'’]+/).map(norm).filter(Boolean);
  for (const w of words) if (STEM[w]) return { art: STEM[w], match: 'close', via: 'word ' + w };
  for (const stem of Object.keys(STEM)) if (stem.length >= 6 && words.some((w) => w.startsWith(stem))) return { art: STEM[stem], match: 'close', via: 'prefix ' + stem };
  const cat = famOf[n] || KIND_CAT[kindOf[n]] || (/ghost/.test(variant) ? 'ghost' : /swarm/.test(variant) ? 'insect' : 'beast');
  const pool = CAT_IMAGES[cat].filter((u) => UNITS.includes(u));
  return { art: pool[hash(name) % pool.length], match: 'fallback', via: cat };
}

// ---------- Text features ----------
const LANE = {
  armor: /armou?r|\bshell\b/, barrel: /barrel|\bkegs?\b|cask|powder|\bfuse\b|lantern|brazier|chain-explosion|shard|geyser/, healer: /\bheal|mender|field hospital/,
  splitter: /splitter|swarm|shoal|spiderling/, summoner: /summon|\bhive\b|\bhut\b/, bulwark: /bulwark|\bwall\b|portcullis|rock stack/,
  veil: /veil|mirage|flicker/, ward: /\bhide\b/, gaze: /gaze|eye column/, sweep: /sweep|riders?\b/, stride: /stride|moving targets|rotation/, tide: /\btide\b|drift/,
  rage: /fury|enrage|\bclock\b/, regrow: /regrow|head lane|\bheads?\b|rising|haugbui/, regen: /regenerat/, harden: /harden/,
};
// Keywords the engine does not run (inert tags) with the scope they attach to: lead = the heaviest ordinary enemy, kin = enemies with the matching variant / flavour.
const INERT = [
  ['wet', /\bwet\b/, 'water'], ['chill', /chill|freeze|\bice\b/, 'ice'], ['alpha', /\balpha\b/, 'lead'], ['swarm', /swarm|shoal|spiderling/, 'swarm'], ['ghost', /\bghost/, 'ghost'],
  ['chief', /\bchief\b/, 'lead'], ['skewer', /skewer/, 'lead'], ['grudge', /grudge/, 'all'], ['leech', /leech/, 'lead'], ['thorn', /thorn/, 'lead'], ['corrupted', /corrupt/, 'lead'],
  ['venom', /venom/, 'venom'], ['hold', /\bhold\b/, 'lead'], ['mimic', /mimic|shapeshift|shifting|changes element|swaps? two/, 'lead'], ['chain', /\bchain|lightning/, 'lightning'],
  ['rise', /skeleton|rises? once|\brising|deathless/, 'lead'], ['trample', /trample/, 'lead'], ['enrage', /enrage/, 'lead'], ['phases', /phases|two phases|final exam/, 'lead'],
  ['sand-bury', /sand-bury/, 'lead'], ['crystal', /crystal: shatters/, 'lead'], ['fuse', /\bfuse\b/, 'barrel'],
];
const featuresOf = (text) => { const t = text.toLowerCase(), out = new Set(); for (const [k, re] of Object.entries(LANE)) if (re.test(t)) out.add(k); return out; };
const inertOf = (text) => INERT.filter(([, re]) => re.test(text.toLowerCase())).map(([id, , scope]) => ({ id, scope }));

// Arc -> five step texts: the arc's segments before the elite are spread over intro, intro2, combine, combine2, pre-elite.
function stepTexts(sub) {
  const arc = sub.arc.replace(/\s*Script:.*$/i, '');
  const segs = [];
  for (const raw of arc.split(/;|▸/)) {
    const t = raw.trim();
    if (!t) continue;
    if (/^(elite|boss)\b/i.test(t)) break;
    segs.push(t);
  }
  const out = [];
  const b = segs.filter((s) => /^B\d/.test(s));
  if (b.length >= 2) {
    for (let s = 0; s < 5; s++) out.push('');
    for (const seg of b) {
      const m = /^B(\d)(?:-(\d))?/.exec(seg), lo = Number(m[1]) - 1, hi = m[2] ? Number(m[2]) - 1 : lo;
      for (let s = lo; s <= hi; s++) out[Math.min(s, 4)] += ' ' + seg;
    }
    for (let s = 0; s < 5; s++) if (!out[s]) out[s] = out[s - 1] || out[s + 1] || '';
    return out;
  }
  const j = Math.max(1, segs.length);
  for (let s = 0; s < 5; s++) out.push(segs.length ? segs[Math.min(j - 1, Math.floor(((s + 0.5) * j) / 5))] : '');
  return out;
}

// ---------- Monsters ----------
const ROLE = { b: ['basic', 1, 0], w: ['weak', 0.6, 0], t: ['tough', 1.4, 1], h: ['heavy', 2.2, 1], a: ['armored', 0.9, 0], k: ['bulwark', 1.1, 0], m: ['healer', 0.8, 0], s: ['splitter', 1, 0], u: ['summoner', 0.9, 0], G: ['guard', 1.2, 1], H: ['head', 1, 0], T: ['tough', 1.4, 1] };
const armorAt = (L) => (L < 9 ? 1 : L < 35 ? 2 : 3);
const wardAt = (L) => Math.max(2, Math.min(4, Math.round(F.playerHit(L) * 0.5)));
const FOOT = Engine.FOOTPRINTS;
const cellsOf = (fp, r, c) => { const f = FOOT[fp]; const out = []; for (let dr = 0; dr < f.d; dr++) for (let dc = 0; dc < f.w; dc++) out.push([r - dr, c + dc]); return out; };

class Board {
  constructor() { this.list = []; this.occ = new Map(); }
  free(r, c) { return r >= -1 && r <= 1 && c >= 0 && c < 5 && !this.occ.has(r + ',' + c); }
  fits(fp, r, c) { const f = FOOT[fp]; if (c < 0 || c + f.w > 5) return false; if (r === -1 && f.d > 1) return false; if (r !== -1 && r - f.d + 1 < 0) return false; return cellsOf(fp, r, c).every(([rr, cc]) => this.free(rr, cc)); }
  put(e) { for (const [r, c] of cellsOf(e.fp || '1x1', e.r, e.c)) this.occ.set(r + ',' + c, e); this.list.push(e); return e; }
  at(r, c) { return this.occ.get(r + ',' + c); }
  neighbours(r, c) { return [[r, c - 1], [r, c + 1], [r - 1, c], [r + 1, c]].filter(([a, b]) => a >= 0 && a <= 1 && b >= 0 && b < 5); }
  emptyTiles(row) { return [0, 1, 2, 3, 4].filter((c) => this.free(row, c)); }
}

const COLSETS = { 1: [[2], [1], [3]], 2: [[1, 3], [0, 4], [1, 2], [2, 3]], 3: [[0, 2, 4], [1, 2, 3], [0, 1, 3], [1, 3, 4]], 4: [[0, 1, 3, 4], [0, 2, 3, 4], [0, 1, 2, 4], [1, 2, 3, 4]], 5: [[0, 1, 2, 3, 4]] };

class SubCtx {
  constructor(region, sub) {
    this.region = region; this.sub = sub; this.roster = sub.roster; this.monsters = []; this.monIdx = new Map();
    const R = this.roster;
    this.lead = R[0]; this.second = R[1] || R[0]; this.heavy = R[2] || R[0];
    this.armorMon = R.find((m) => /armou?red|stone|metal|crystal|clockwork|mummified/.test(m.variant || '')) || R[3] || R[0];
    this.supportMon = R[4] || R[R.length - 1];
    this.swarmMon = R.find((m) => /swarm/.test(m.variant || '')) || R[3] || R[0];
    this.ghostMon = R.find((m) => /ghost/.test(m.variant || '')) || null;
  }
  mon(m, isBoss) {
    const key = m.base + '|' + (m.variant || '') + '|' + (m.element || '') + '|' + (m.flavour || '');
    if (!this.monIdx.has(key)) {
      const a = artFor(m.base, m.variant || '');
      this.monIdx.set(key, this.monsters.length);
      this.monsters.push(Object.assign({ name: m.base, variant: m.variant || '', element: m.element || '', flavour: m.flavour || '', art: a.art, artMatch: a.match }));
    }
    return this.monIdx.get(key);
  }
}

// ---------- Fight building ----------
const SUPPORTED_NOTE = {}; // approximations used (from -> to) with counts
const INERT_COUNT = {};    // inert keyword -> { enemies, fights:Set, subs:Set }
const note = (tbl, key, fight, sub) => { const o = tbl[key] || (tbl[key] = { enemies: 0, fights: new Set(), subs: new Set() }); o.enemies++; o.fights.add(fight); o.subs.add(sub); };

function mkEnemy(ctx, ch, monDef, r, c, L, step, o = {}) {
  const [role, hpMul, atkAdd] = ROLE[ch];
  const k = o.k || { atk: 1 };
  const atk = Math.max(1, Math.round(F.baseAtk(L) * k.atk)) + (L >= 5 ? atkAdd : (ch === 'h' ? 1 : 0));
  const e = { m: ctx.mon(monDef), r, c, role, ch, hpf: F.baseHp(L) * hpMul * (o.hpMul || 1), atk };
  if (ch === 'a' || ch === 'k') e.armor = armorAt(L);
  if (ch === 'k') e.kind = 'bulwark';
  if (ch === 'm') e.kind = 'healer';
  if (ch === 's') e.kind = 'splitter';
  if (ch === 'u') e.kind = 'summoner';
  if (ch === 'G') e.guardian = true;
  return e;
}
function addGimmick(e, g, L, text) {
  e.gimmick = g;
  if (g === 'ward') e.gp = wardAt(L);
  else if (g === 'veil') e.gp = /turn 2|until turn 2/i.test(text || '') ? 2 : 1;
  else if (g === 'gaze') e.gp = /lose 2/i.test(text || '') ? 2 : 1;
  else if (g === 'harden') e.gp = /max 3/i.test(text || '') ? 3 : 2;
  else if (g === 'rage') e.gp = 1;
  else e.gp = 0; // regen / regrow take their parameter from the final HP (finalize)
  return e;
}

// Distribute a list of {ch, mon} over the two rows with the placement rules of the template layouts.
function layOut(ctx, items0, barrels, board, R, L, step, k) {
  const items = items0.slice(0, 9);
  const FRONT_PREF = new Set(['k', 'a', 't', 'T', 'h', 'G']), BACK_PREF = new Set(['m', 'u', 'w', 'H']);
  const front = [], back = [];
  const nonBarrel = items.length;
  const frontTarget = Math.max(1, Math.min(5, Math.ceil(nonBarrel * 0.6)));
  for (const it of items) (FRONT_PREF.has(it.ch) ? front : back).push(it);
  // plain units fill the front up to the target, the rest go back
  const plains = back.filter((it) => !BACK_PREF.has(it.ch)), others = back.filter((it) => BACK_PREF.has(it.ch));
  back.length = 0;
  for (const it of plains) (front.length < frontTarget ? front : back).push(it);
  back.push(...others);
  while (front.length > 5) back.push(front.pop());
  while (back.length > 5) front.push(back.pop());
  const place = (row, list) => {
    if (!list.length) return;
    let cols = pickOf(R, COLSETS[list.length]).slice();
    const ordered = shuffle(R, list);
    // healers / summoners take the centre-most column, bulwarks the outer ones
    ordered.sort((a, b) => (a.ch === 'm' || a.ch === 'u' ? -1 : 0) - (b.ch === 'm' || b.ch === 'u' ? -1 : 0));
    const mid = cols.slice().sort((x, y) => Math.abs(x - 2) - Math.abs(y - 2));
    const rest = cols.slice().sort((x, y) => x - y);
    ordered.forEach((it, i) => {
      const c = (it.ch === 'm' || it.ch === 'u') ? mid.shift() : null;
      if (c !== null && c !== undefined) { rest.splice(rest.indexOf(c), 1); it._c = c; }
    });
    ordered.forEach((it) => { if (it._c === undefined) it._c = rest.shift(); });
    for (const it of ordered) {
      const e = mkEnemy(ctx, it.ch, it.mon, row, it._c, L, step, { k: it.k || k, hpMul: it.hpMul });
      if (it.gimmick) addGimmick(e, it.gimmick, L);
      if (it.tags) e.tagsWanted = it.tags;
      board.put(e);
    }
  };
  place(1, front); place(0, back);
  // barrels: empty tiles next to an enemy, the front row first
  for (let i = 0; i < barrels.length; i++) {
    const cand = [];
    for (const row of [1, 0]) for (const c of board.emptyTiles(row)) {
      if (board.neighbours(row, c).some(([a, b]) => board.at(a, b) && board.at(a, b).role !== 'barrel')) cand.push([row, c, row === 1 ? 0 : 1]);
    }
    if (!cand.length) break;
    cand.sort((x, y) => x[2] - y[2] || Math.abs(x[1] - 2) - Math.abs(y[1] - 2) || x[1] - y[1]);
    const [row, c] = cand[Math.floor(R() * Math.min(cand.length, 3))];
    board.put({ m: null, r: row, c, role: 'barrel', hp: 1, atk: 0, barrelName: barrels[i] });
  }
}

const BARREL_NAME = (text) => (/lantern|brazier/i.test(text) ? 'Fuse lantern' : /cask|kitchen/i.test(text) ? 'Cask' : /crystal|shard/i.test(text) ? 'Crystal shard' : /geyser/i.test(text) ? 'Geyser vent' : 'Powder keg');

function plainMons(ctx, text) {
  const t = norm(text);
  const mentioned = ctx.roster.filter((m) => m.base.split(/[\s'’-]+/).some((w) => w.length >= 4 && t.includes(norm(w))));
  const pool = mentioned.length ? mentioned : [ctx.lead, ctx.second];
  return pool;
}

function ordinaryFight(ctx, step, feats, text, L, R) {
  const board = new Board();
  const k = { atk: tune('atk', step, L) };
  const items = [], barrels = [];
  const pool = plainMons(ctx, text);
  const pickPlain = (i) => pool[(i + Math.floor(R() * 2)) % pool.length];
  const add = (ch, mon, extra) => items.push(Object.assign({ ch, mon }, extra));
  const GIM = ['veil', 'ward', 'gaze', 'sweep', 'stride', 'tide', 'rage', 'regen', 'harden'].filter((g) => feats.has(g));
  if (feats.has('bulwark')) for (let i = 0; i < 2; i++) add('k', ctx.armorMon);
  if (feats.has('armor') && !feats.has('bulwark')) for (let i = 0; i < (step <= 1 ? 1 : 2); i++) add('a', ctx.armorMon);
  if (feats.has('healer')) add('m', ctx.supportMon);
  if (feats.has('summoner')) add('u', feats.has('healer') ? ctx.swarmMon : ctx.supportMon);
  if (feats.has('splitter')) for (let i = 0; i < (step <= 1 ? 1 : 2); i++) add('s', ctx.swarmMon);
  if (feats.has('regrow')) add('H', ctx.heavy, { gimmick: 'regrow' });
  for (const g of GIM.slice(0, step >= 4 ? 2 : 1)) add('T', ctx.heavy, { gimmick: g });
  const N = Math.max([2, 2, 3, 3, 4][step], items.length + 1);
  const toughs = items.filter((it) => it.ch === 'T' || it.ch === 'H').length;
  if (step >= 2 && toughs === 0) add('t', ctx.heavy);
  if (step >= 4 && items.filter((it) => it.ch === 't' || it.ch === 'T').length < 2) add('t', ctx.heavy);
  let i = 0;
  while (items.length < N) { add(step === 0 && items.length === 0 ? 'b' : (R() < 0.18 && step <= 1 ? 'w' : 'b'), pickPlain(i++)); }
  if (feats.has('barrel')) { const n = [1, 1, 2, 2, 3][step]; for (let j = 0; j < n; j++) barrels.push(BARREL_NAME(text)); }
  layOut(ctx, items, barrels, board, R, L, step, k);
  return board.list;
}

// ---------- Elite and boss ----------
function bigAnchor(fp, R, bossRow) {
  const f = FOOT[fp], c = f.w === 1 ? 2 : f.w === 2 ? (R() < 0.5 ? 1 : 2) : 1;
  return { r: bossRow ? -1 : 1, c };
}
function eliteFight(ctx, sub, feats, L, R, text) {
  const board = new Board();
  const fp = sub.elite.footprint || '1x1';
  const e0 = sub.elite;
  const a = bigAnchor(fp, R, false);
  const mon = { base: e0.base, variant: e0.variant, element: e0.element, flavour: e0.flavour || '' };
  const elite = { m: ctx.mon(mon), r: a.r, c: a.c, role: 'elite', ch: 'E', hpf: F.baseHp(L) * 1.6 * FOOT[fp].hp, atk: Math.max(1, Math.round(F.baseAtk(L) * tune('eliteAtk', 0, L) * FOOT[fp].atk) + 1), fp };
  if (fp === '1x1') delete elite.fp;
  const et = (sub.arc.match(/elite\s+([^▸;]*)/i) || [])[1] || '';
  if (/armou?red/i.test(et)) elite.armor = armorAt(L);
  board.put(Object.assign(elite, { fp }));
  if (fp === '1x1') delete elite.fp;
  // escorts: layout of the sub-area's lane features around the elite
  const items = [], barrels = [];
  const pool = [ctx.lead, ctx.second];
  const nEsc = Math.max(2, 4 - FOOT[fp].w * FOOT[fp].d + (FOOT[fp].w * FOOT[fp].d >= 3 ? 1 : 0));
  const kEsc = { atk: tune('eliteEscAtk', 0, L), hpMul: tune('eliteEsc', 0, L) };
  if (/\bpair\b/i.test(et)) items.push({ ch: 't', mon: { base: e0.base, variant: e0.variant, element: e0.element, flavour: e0.flavour || '' } });
  const sp = [];
  if (feats.has('armor') || feats.has('bulwark')) sp.push(['a', ctx.armorMon]);
  if (feats.has('healer')) sp.push(['m', ctx.supportMon]);
  if (feats.has('summoner')) sp.push(['u', ctx.supportMon]);
  if (feats.has('splitter')) sp.push(['s', ctx.swarmMon]);
  for (const [ch, m] of sp.slice(0, 1)) items.push({ ch, mon: m });
  let i = 0;
  while (items.length < nEsc) items.push({ ch: items.length === 0 && R() < 0.5 ? 't' : 'b', mon: pool[i++ % pool.length] });
  if (feats.has('barrel') && FOOT[fp].w * FOOT[fp].d < 4) barrels.push(BARREL_NAME(text));
  // free tiles for escorts: lay them out in the tiles the elite does not cover
  const rows = { 1: board.emptyTiles(1), 0: board.emptyTiles(0) };
  placeEscorts(ctx, board, items, rows, R, L, kEsc, 0);
  barrelsNear(board, barrels, R);
  return board.list;
}
function placeEscorts(ctx, board, items, rows, R, L, k, step) {
  const FRONT = new Set(['a', 't', 'T', 'k', 'G', 'h']);
  const free = [];
  for (const row of [1, 0]) for (const c of rows[row]) if (board.free(row, c)) free.push([row, c]);
  // keep columns spread: sort by distance from the middle so escorts flank the big body
  const bigCols = new Set(board.list.filter((e) => e.role === 'elite' || e.role === 'boss').flatMap((e) => cellsOf(e.fp || '1x1', e.r, e.c).map((x) => x[1])));
  for (const it of items) {
    const prefer = FRONT.has(it.ch) ? 1 : 0;
    let cand = free.filter(([row, c]) => row === prefer);
    if (!cand.length) cand = free.slice();
    if (!cand.length) break;
    // beside the big body first, then the edges
    cand.sort((x, y) => (Math.min(...[...bigCols].map((b) => Math.abs(b - x[1]))) - Math.min(...[...bigCols].map((b) => Math.abs(b - y[1])))) || (R() - 0.5));
    const [row, c] = cand[0];
    const e = mkEnemy(ctx, it.ch, it.mon, row, c, L, step, { k, hpMul: (k.hpMul || 1) * (it.hpMul || 1) });
    if (it.gimmick) addGimmick(e, it.gimmick, L);
    board.put(e);
    free.splice(free.findIndex((x) => x[0] === row && x[1] === c), 1);
  }
}
function barrelsNear(board, barrels, R) {
  for (const name of barrels) {
    const cand = [];
    for (const row of [1, 0]) for (const c of board.emptyTiles(row)) if (board.neighbours(row, c).some(([a, b]) => board.at(a, b) && board.at(a, b).role !== 'barrel')) cand.push([row, c]);
    if (!cand.length) break;
    const [row, c] = cand[Math.floor(R() * cand.length)];
    board.put({ m: null, r: row, c, role: 'barrel', hp: 1, atk: 0, barrelName: name });
  }
}

// Boss gimmick text -> engine kind / gimmick (closest existing rule), plus inert tags and approximations.
const G_RULES = [
  ['guard', /guarded/], ['veil', /veil|mirage|cloud cover|flicker|eclipse clock|riddle ward|until turn 2/], ['gaze', /gaze/], ['sweep', /sweep/], ['stride', /stride|sidestep|moves a column|moving/],
  ['tide', /\btide\b|drift/], ['regrow', /regrow|heads? (grow|return)|three heads|rises? once|\brise\b|deathless|skeleton/], ['regen', /regenerat/], ['harden', /harden|hoard/],
  ['rage', /\bfury\b|enrage|grows/], ['ward', /\bhide\b|armor 3|\bward\b/],
];
const G_APPROX = [ // (inert word) -> nearest engine gimmick
  ['rage', /\bchief\b|\balpha\b|grudge|phases|final exam/, 'chief/alpha/grudge/phases'], ['regen', /leech/, 'leech'], ['ward', /\bghost\b|thorn/, 'ghost/thorn'],
  ['stride', /trickster|shapeshift|mimic|swaps? two/, 'trickster/shapeshift/mimic'], ['gaze', /\bhold\b|corrupt/, 'hold/corrupted'], ['sweep', /trample/, 'trample'],
];
const K_RULES = [['summoner', /summon|brood|\bhut\b|spiderling/], ['healer', /\bheal(er)?\b/], ['splitter', /splitter|breaks into/], ['bulwark', /bulwark|portcullis/]];
function bossRules(text, L) {
  const t = text.toLowerCase(), slots = [], kinds = [];
  for (const [g, re] of G_RULES) { const m = re.exec(t); if (m) slots.push([m.index, g]); }
  slots.sort((a, b) => (a[1] === 'guard' ? -1 : b[1] === 'guard' ? 1 : a[0] - b[0]));
  for (const [k, re] of K_RULES) { const m = re.exec(t); if (m) kinds.push([m.index, k]); }
  kinds.sort((a, b) => a[0] - b[0]);
  const gimmicks = slots.map((s) => s[1]);
  let approx = null;
  if (!gimmicks.length) for (const [g, re, label] of G_APPROX) if (re.test(t)) { gimmicks.push(g); approx = label + ' -> ' + g; break; }
  const staticArmor = (/armor (\d)/.exec(t) || [])[1] ? Math.min(3, Number(/armor (\d)/.exec(t)[1])) : 0;
  return { gimmicks, kind: kinds.length ? kinds[0][1] : null, approx, staticArmor, guards: /two|three|dryads|housecarls|stacks/.test(t) ? 2 : 1, heads: /heads/.test(t) };
}

function bossFight(ctx, sub, feats, L, R, text) {
  const board = new Board();
  const b0 = sub.boss, fp = b0.footprint || '1x1', row = !!b0.bossRow;
  const rules = bossRules(b0.gimmick, L);
  const kEsc = { atk: tune('bossEscAtk', 0, L), hpMul: tune('bossEsc', 0, L) };
  const mon = { base: b0.base, variant: b0.variant, element: b0.element, flavour: b0.flavour || '' };
  const guard = rules.gimmicks[0] === 'guard';
  let a = bigAnchor(fp, R, row);
  if (guard && !row && fp === '1x1') a = { r: 0, c: 2 };
  if (FOOT[fp].d > 1 && !row) a = { r: 1, c: FOOT[fp].w === 1 ? pickOf(R, [1, 2, 3]) : a.c };
  const boss = { m: ctx.mon(mon), r: a.r, c: a.c, role: 'boss', ch: 'B', hpf: F.baseHp(L) * 2.1 * FOOT[fp].hp, atk: Math.max(1, Math.round(F.baseAtk(L) * tune('bossAtk', 0, L) * FOOT[fp].atk) + 1) };
  if (fp !== '1x1') boss.fp = fp;
  if (rules.staticArmor) boss.armor = rules.staticArmor;
  const main = rules.gimmicks[0] || null, second = rules.gimmicks.slice(1);
  if (main) addGimmick(boss, main, L, b0.gimmick);
  // A summoning boss in the (gated) boss row could never be reached once its minions fill the open columns: the call moves to an escort there.
  const movedKind = row && rules.kind === 'summoner' ? 'summoner' : null;
  if (movedKind) rules.kind = null;
  if (rules.kind) {
    boss.kind = rules.kind;
    if (rules.kind === 'bulwark') boss.armor = Math.max(boss.armor || 0, armorAt(L));
  }
  board.put(boss);
  const items = [];
  const pool = [ctx.lead, ctx.second];
  const area = FOOT[fp].w * FOOT[fp].d;
  let nEsc = row ? 4 : 4;
  if (area >= 4) nEsc = 3;
  const bossMon = mon;
  if (guard) { for (let g = 0; g < rules.guards; g++) items.push({ ch: 'G', mon: sub.roster.find((m) => /jangsan|draugr|rock|dryad/i.test(m.base)) || ctx.heavy }); }
  if (rules.heads || (main === 'regrow' && !row)) for (let h = 0; h < 2; h++) items.push({ ch: 'H', mon: bossMon, gimmick: 'regrow' });
  for (const g of second) items.push({ ch: 'T', mon: ctx.heavy, gimmick: g });
  if (movedKind) items.push({ ch: 'u', mon: ctx.supportMon });
  const sp = [];
  if (feats.has('armor')) sp.push(['a', ctx.armorMon]);
  if (feats.has('healer') && rules.kind !== 'healer') sp.push(['m', ctx.supportMon]);
  if (feats.has('barrel')) { /* barrels added below */ }
  for (const [ch, m] of sp.slice(0, 1)) items.push({ ch, mon: m });
  let i = 0;
  while (items.length < nEsc) items.push({ ch: items.length % 3 === 1 ? 't' : 'b', mon: pool[i++ % pool.length] });
  // gated boss row: every covered column needs a blocker in the rows in front
  if (row) {
    const cols = cellsOf(fp, a.r, a.c).map((x) => x[1]);
    const rest = items.slice();
    for (const c of cols) {
      const it = rest.shift(); if (!it) break;
      const e = mkEnemy(ctx, it.ch, it.mon, 1, c, L, 0, { k: kEsc, hpMul: kEsc.hpMul * (it.hpMul || 1) });
      if (it.gimmick) addGimmick(e, it.gimmick, L);
      board.put(e);
    }
    items.length = 0; items.push(...rest);
  } else if (guard && fp === '1x1') {
    // the guards stand in the front row in front of the boss
    const gs = items.filter((it) => it.ch === 'G'); const others = items.filter((it) => it.ch !== 'G');
    const cols = gs.length >= 2 ? [2, 1] : [2];
    gs.forEach((it, j) => { const e = mkEnemy(ctx, it.ch, it.mon, 1, cols[j], L, 0, { k: kEsc, hpMul: kEsc.hpMul * (it.hpMul || 1) }); board.put(e); });
    items.length = 0; items.push(...others);
  }
  const rows = { 1: board.emptyTiles(1), 0: board.emptyTiles(0) };
  placeEscorts(ctx, board, items, rows, R, L, kEsc, 0);
  if (feats.has('barrel') && area < 4) barrelsNear(board, [BARREL_NAME(text)], R);
  return { enemies: board.list, rules };
}

// Fit the fight to the level: one scale on every HP so that the armour-weighted total is target[step] volleys of the reference squad; then the parameters that depend on HP.
function finalize(enemies, L, step, id) {
  const adj = ADJUST[id] || {};
  if (adj.atk) for (const e of enemies) if (e.role !== 'barrel') e.atk = Math.max(1, Math.round(e.atk * adj.atk));
  const real = enemies.filter((e) => e.role !== 'barrel');
  const raw = real.reduce((n, e) => n + e.hpf * (1 + 0.12 * (e.armor || 0)), 0);
  const [lo, hi] = TUNE.scale;
  const want = TUNE.target[step] * TUNE.bandMul[BAND(L)] * volleyOf(L) * (adj.hp || 1);
  const scale = Math.max(lo, Math.min(hi, want / raw));
  for (const e of real) {
    e.hp = Math.max(1, Math.round(e.hpf * scale)); delete e.hpf;
    if (e.gimmick === 'regen') e.gp = Math.max(1, Math.round(e.hp * 0.12));
    if (e.gimmick === 'regrow') e.gp = Math.max(2, Math.round(e.hp * 0.6));
    if (e.kind === 'splitter') e.minion = { hp: 1, atk: Math.max(1, Math.round(e.atk * (e.role === 'boss' ? 0.5 : 0.6))) };
    if (e.kind === 'summoner') e.minion = { hp: Math.max(2, Math.round(e.role === 'boss' ? F.baseHp(L) * 0.5 * scale : e.hp * 0.4)), atk: Math.max(1, Math.round(e.atk * (e.role === 'boss' ? 0.5 : 0.6))) };
  }
  return scale;
}

// ---------- Naming and inert tags ----------
const STEP_LABEL = { intro: 'Intro', intro2: 'Intro II', combine: 'Combine', combine2: 'Combine II', preelite: 'Pre-elite', elite: 'Elite', boss: 'Boss' };
function applyInert(ctx, fightId, subId, enemies, tags) {
  const real = enemies.filter((e) => e.role !== 'barrel');
  const lead = real.filter((e) => !e.guardian).sort((a, b) => b.hp - a.hp)[0];
  const monOf = (e) => ctx.monsters[e.m];
  for (const { id, scope } of tags) {
    let targets = [];
    if (scope === 'lead') targets = lead ? [lead] : [];
    else if (scope === 'all') targets = real.filter((e) => e.role === 'basic' || e.role === 'tough');
    else if (scope === 'water') targets = real.filter((e) => monOf(e).element === 'Water');
    else if (scope === 'ice') targets = real.filter((e) => monOf(e).flavour === 'ice');
    else if (scope === 'lightning') targets = real.filter((e) => monOf(e).element === 'Lightning');
    else if (scope === 'ghost') targets = real.filter((e) => /ghost/.test(monOf(e).variant));
    else if (scope === 'swarm') targets = real.filter((e) => /swarm/.test(monOf(e).variant) || e.kind === 'splitter');
    else if (scope === 'venom') targets = real.filter((e) => /venom/.test(monOf(e).variant));
    else if (scope === 'barrel') targets = enemies.filter((e) => e.role === 'barrel');
    if (!targets.length && lead && ['ghost', 'swarm', 'venom', 'ice', 'lightning', 'water'].includes(scope)) targets = [lead];
    for (const e of targets) { (e.inert || (e.inert = [])).includes(id) || e.inert.push(id); note(INERT_COUNT, id, fightId, subId); }
  }
}
function supportedKw(e) {
  const kw = [];
  if (e.armor) kw.push('armored');
  if (e.role === 'barrel') kw.push('barrel');
  if (e.kind) kw.push(e.kind);
  if (e.guardian) kw.push('guard');
  if (e.gimmick) kw.push({ guard: 'guarded', ward: 'hide', veil: 'veiled', rage: 'fury' }[e.gimmick] || e.gimmick);
  if (e.fp && e.fp !== '1x1') kw.push('big', FOOT[e.fp].w > 1 ? 'wide' : 'deep');
  if (e.r === -1) kw.push('boss-row');
  return kw;
}

function buildSub(region, sub) {
  const ctx = new SubCtx(region, sub);
  const texts = stepTexts(sub);
  const ideaFeats = featuresOf(sub.idea);
  const stepFeats = [];
  for (let s = 0; s < 5; s++) {
    let txt = texts[s], feats = featuresOf(txt);
    if (s >= 2) feats = new Set([...feats, ...featuresOf(texts[s - 1])]);
    if (s >= 3) for (const f of ideaFeats) feats.add(f);
    if (s === 4) for (let q = 0; q < 5; q++) for (const f of featuresOf(texts[q])) feats.add(f);
    stepFeats.push(feats);
  }
  // wide / big and generic words must not be mistaken: "wall" only when bulwark intended is kept, regrow lanes only from 'heads' and similar
  const [a, b] = sub.ordinaryLv;
  const lv = [a, a, b, b, b];
  const allFeats = new Set(stepFeats.flatMap((s) => [...s]));
  const fights = [];
  const tagTexts = texts.map((t) => t);
  for (let s = 0; s < 5; s++) {
    const id = sub.id + '/' + ['intro', 'intro2', 'combine', 'combine2', 'preelite'][s], R = rng(id);
    const enemies = ordinaryFight(ctx, s, stepFeats[s], texts[s] + ' ' + (s >= 3 ? sub.idea : ''), lv[s], R);
    const scale = finalize(enemies, lv[s], ['intro', 'intro2', 'combine', 'combine2', 'preelite'][s], id);
    applyInert(ctx, id, sub.id, enemies, inertOf(s >= 2 ? texts[s] + ' ' + texts[s - 1] : texts[s]));
    fights.push(Object.assign(finish(ctx, sub, id, ['intro', 'intro2', 'combine', 'combine2', 'preelite'][s], lv[s], enemies, false, texts[s]), { scale: Math.round(scale * 100) / 100 }));
  }
  {
    const id = sub.id + '/elite', R = rng(id);
    const enemies = eliteFight(ctx, sub, allFeats, sub.eliteLv, R, texts[4] + ' ' + sub.idea);
    const scale = finalize(enemies, sub.eliteLv, 'elite', id);
    applyInert(ctx, id, sub.id, enemies, inertOf((sub.arc.match(/elite\s+([^▸;]*)/i) || [])[1] || ''));
    fights.push(Object.assign(finish(ctx, sub, id, 'elite', sub.eliteLv, enemies, false, (sub.arc.match(/elite\s+([^▸;]*)/i) || [])[1] || ''), { scale: Math.round(scale * 100) / 100 }));
  }
  {
    const id = sub.id + '/boss', R = rng(id);
    const r = bossFight(ctx, sub, allFeats, sub.bossLv, R, texts[4] + ' ' + sub.idea);
    const scale = finalize(r.enemies, sub.bossLv, 'boss', id);
    const tags = inertOf(sub.boss.gimmick + ' ' + (/boss\s+[^▸;]*/i.exec(sub.arc) || [''])[0]);
    applyInert(ctx, id, sub.id, r.enemies, tags);
    if (r.rules.approx) note(SUPPORTED_NOTE, r.rules.approx, id, sub.id);
    const fight = finish(ctx, sub, id, 'boss', sub.bossLv, r.enemies, !!sub.boss.bossRow, sub.boss.gimmick);
    fight.gimmickText = sub.boss.gimmick; fight.scale = Math.round(scale * 100) / 100;
    if (r.rules.approx) fight.approx = r.rules.approx;
    fights.push(fight);
  }
  fights.forEach((f, i) => { f.n = i + 1; });
  return { id: sub.id, slug: sub.slug, name: sub.name, theme: sub.theme, landmark: sub.landmark, elements: sub.elements, idea: sub.idea, arc: sub.arc, biome: biomeOf(region, sub),
    levels: { ordinary: sub.ordinaryLv, elite: sub.eliteLv, boss: sub.bossLv }, features: [...allFeats].sort(), monsters: ctx.monsters, fights };
}
function biomeOf(region, sub) {
  const t = (sub.theme + ' ' + sub.name).toLowerCase();
  const byRegion = ['meadow', 'dunes', 'snow', 'ash', 'beach', 'forest', 'coral', 'temple', 'glacier', 'caldera'][region.number - 1];
  if (/glacier|rime|frozen|snow|tundra|ice\b|drift/.test(t)) return /glacier|rime|ice\b/.test(t) ? 'glacier' : 'snow';
  if (/lava|magma|crater|cinder|volcan|forge|ember|sulphur|obsidian|furnace|ash\b/.test(t)) return /crater|magma|furnace|forge/.test(t) ? 'caldera' : 'ash';
  if (/forest|wood|bamboo|jungle|canopy|grove|orchard|glade|weav|orchid|ceiba|falls/.test(t)) return 'forest';
  if (/desert|dune|sand|erg|salt|oasis|wadi|bazaar|tomb approach|steppe/.test(t)) return 'dunes';
  if (/lake|marsh|fen|mere|cenote|river|reed|rice|paddy|firefly|moor|moat/.test(t)) return 'coral';
  if (/sea|coast|shore|harbou?r|strand|fjord|strait|reef|kelp|coral|trench|shipwreck|maelstrom|sound|bay/.test(t)) return 'beach';
  if (/ruin|temple|keep|hall|tomb|gate|citadel|throne|library|crypt|dungeon|palace|court|tower|spires|etemenanki|barbican|yard|armoury|kitchen|battlement|bridge|road|causeway/.test(t)) return 'temple';
  return byRegion;
}
function finish(ctx, sub, id, step, L, enemies, bossRow, ideaText) {
  const out = enemies.map((e) => {
    if (e.role === 'barrel') return { r: e.r, c: e.c, role: 'barrel', hp: 1, atk: 0, mon: e.barrelName, kw: ['barrel'] };
    const o = { m: e.m, r: e.r, c: e.c, role: e.role, hp: e.hp, atk: e.atk };
    if (e.armor) o.armor = e.armor;
    if (e.fp) o.fp = e.fp;
    if (e.kind) o.kind = e.kind;
    if (e.gimmick) { o.gimmick = e.gimmick; o.gp = e.gp; }
    if (e.guardian) o.guardian = true;
    if (e.minion) o.minion = e.minion;
    o.kw = supportedKw(e);
    if (e.inert) o.inert = e.inert;
    return o;
  });
  const layout = { top: '.....', back: '.....', front: '.....' };
  const CH = { barrel: 'x', basic: 'b', weak: 'w', tough: 't', heavy: 'h', armored: 'a', bulwark: 'k', healer: 'm', splitter: 's', summoner: 'u', guard: 'G', head: 'H', elite: 'E', boss: 'B' };
  for (const e of enemies) for (const [r, c] of cellsOf(e.fp || '1x1', e.r, e.c)) {
    const key = r === -1 ? 'top' : r === 0 ? 'back' : 'front';
    layout[key] = layout[key].slice(0, c) + (CH[e.role] || '?') + layout[key].slice(c + 1);
  }
  const probs = Engine.validateLayout(out.map((e) => ({ row: e.r, col: e.c, footprint: e.fp || '1x1' })));
  if (probs.length) throw new Error(id + ': ' + probs.join('; '));
  const lead = enemies.find((e) => e.role === step) || enemies.filter((e) => e.role !== 'barrel').sort((a, b) => b.hp - a.hp)[0];
  const names = [...new Set(enemies.filter((e) => e.role !== 'barrel' && !e.guardian).map((e) => ctx.monsters[e.m].name))];
  const label = step === 'elite' || step === 'boss' ? STEP_LABEL[step] + ': ' + ctx.monsters[lead.m].name : STEP_LABEL[step] + ': ' + names.slice(0, 2).join(' + ');
  return { id, step, n: 0, name: label, level: L, bossRow: bossRow || undefined, layout, enemies: out, note: (ideaText || '').trim() };
}

// ---------- Main ----------
fs.mkdirSync(OUT, { recursive: true });
const artMonsters = {}, unsupported = INERT_COUNT;
let totalFights = 0, totalSubs = 0;
const bigCount = { elite: 0, boss: 0, bossRow: 0 };
for (const reg of REG.regions) {
  const subs = reg.subareas.map((s) => buildSub(reg, s));
  totalSubs += subs.length;
  for (const s of subs) {
    for (const m of s.monsters) { artMonsters[m.name] = { art: m.art, match: m.artMatch }; delete m.artMatch; }
    totalFights += s.fights.length;
    for (const f of s.fights) for (const e of f.enemies) { if (e.role === 'elite' && e.fp) bigCount.elite++; if (e.role === 'boss' && e.fp) bigCount.boss++; if (e.role === 'boss' && e.r === -1) bigCount.bossRow++; }
  }
  const region = { id: reg.id, number: reg.number, name: reg.name, terrain: reg.terrain, dominantElements: reg.dominantElements, levelBand: reg.levelBand, teaches: reg.teaches };
  fs.writeFileSync(path.join(OUT, 'region-' + String(reg.number).padStart(2, '0') + '.json'), JSON.stringify({ region, subareas: subs }) + '\n');
}
// art map
const names = Object.keys(artMonsters).sort();
const stats = { exact: 0, close: 0, fallback: 0, total: names.length };
const mapOut = {};
for (const n of names) { stats[artMonsters[n].match]++; mapOut[n] = artMonsters[n]; }
fs.writeFileSync(path.join(OUT, 'art-map.json'), JSON.stringify({ note: 'Placeholder drawings (prototype/assets/units) per monster name. match: exact = same name, close = the drawing\'s name is part of the monster name (or the reverse), fallback = same family / kind, picked by name hash.', stats, monsters: mapOut }, null, 1) + '\n');

// unsupported report
const MD = path.join(ROOT, 'docs/data/fights-unsupported.md');
let kept = '<!-- BALANCE:START -->\n_Run `node tools/validate-fights.mjs` to fill this section._\n<!-- BALANCE:END -->';
if (fs.existsSync(MD)) { const m = /<!-- BALANCE:START -->[\s\S]*<!-- BALANCE:END -->/.exec(fs.readFileSync(MD, 'utf8')); if (m) kept = m[0]; }
const rows = Object.entries(unsupported).sort((x, y) => y[1].enemies - x[1].enemies || x[0].localeCompare(y[0]));
const apx = Object.entries(SUPPORTED_NOTE).sort((x, y) => y[1].fights.size - x[1].fights.size || x[0].localeCompare(y[0]));
let md = '# Fights: keywords the engine does not run yet\n\nGenerated by `node tools/build-fights.mjs` (do not edit by hand outside the BALANCE block). The V2 fights carry these keywords as **inert tags** (`inert` on the enemy, data only): they appear in the dev page lists but have no rule in `js/engine.js`. This step invents no engine rules.\n\n';
md += '## Inert keywords\n\n| Keyword | Enemies | Fights | Sub-areas | Engine status |\n|---|---|---|---|---|\n';
const STATUS = { wet: 'enemy starts Wet (no live meaning since V2.2; flavour tag only)', chill: 'Ice flavour: -1 ATK on hit', alpha: 'neighbour ATK +1', swarm: 'approximated by Splitter bodies', ghost: 'plain hits do 1 less', chief: 'neighbour ATK +1', skewer: 'ignores Shield', grudge: '+2 ATK when a neighbour dies', leech: 'heals when it hits the hero', thorn: 'hits on it cost the hero HP', corrupted: 'adjacent boosts lost', venom: 'poison on units', hold: 'hit unit cannot attack', mimic: 'element changes / swaps', chain: 'Lightning chains', rise: 'approximated by Regrow', trample: 'also hits the tile behind', enrage: 'approximated by Fury', phases: 'phases / final exam', 'sand-bury': 'bury', crystal: 'shatters', fuse: 'approximated by Barrel' };
for (const [k, v] of rows) md += `| ${k} | ${v.enemies} | ${v.fights.size} | ${v.subs.size} | ${STATUS[k] || ''} |\n`;
md += '\nElements (8, Lightning included) and the Ice flavour are data only: they are on every enemy as `element` / `flavour`; affinity, weakness hits and column merges are not in the engine yet (V2.2 design).\n\n';
md += '## Boss tricks approximated by an existing gimmick\n\nA boss whose one-line trick has no engine rule gets the closest validated gimmick and keeps the real trick as an inert tag.\n\n| Trick -> engine gimmick | Bosses |\n|---|---|\n';
for (const [k, v] of apx) md += `| ${k} | ${v.fights.size} |\n`;
md += '\n## Balance validation (tools/validate-fights.mjs)\n\n' + kept + '\n';
fs.writeFileSync(MD, md);
console.log(`built ${totalFights} fights in ${totalSubs} sub-areas; big elites ${bigCount.elite}, big bosses ${bigCount.boss}, boss-row bosses ${bigCount.bossRow}`);
console.log(`art: ${stats.exact} exact, ${stats.close} close, ${stats.fallback} fallback of ${stats.total} monsters`);
console.log('inert keywords: ' + rows.slice(0, 8).map(([k, v]) => k + ' ' + v.enemies).join(', '));
