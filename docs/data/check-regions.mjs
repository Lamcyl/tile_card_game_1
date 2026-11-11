// Design-data check (no game code). Usage: node docs/data/check-regions.mjs
// Also checks the 7-element rule, flavour tags, elite/boss footprints and the big-enemy shares.
// Verifies every roster and boss base name in regions.json exists in BESTIARY.md,
// is not in "Removed for sensitivity", is Malevolent or Ambivalent, and is not flagged yellow/red.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const here = path.dirname(fileURLToPath(import.meta.url));
const bestiary = fs.readFileSync(path.join(here, "../BESTIARY.md"), "utf8").split("\n");
const data = JSON.parse(fs.readFileSync(path.join(here, "regions.json"), "utf8"));

const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[†]/g, "").replace(/\s+/g, " ").trim();
const baseOf = (s) => norm(s.replace(/\s*\(.*$/, "").replace(/\s*[　-鿿가-힯぀-ヿ（）()]+.*$/u, ""));

const removedStart = bestiary.findIndex((l) => l.startsWith("## Removed for sensitivity"));
const rows = [];
for (let i = 0; i < removedStart; i++) {
  const l = bestiary[i];
  if (!l.startsWith("| ") || l.startsWith("| Name") || l.startsWith("|---")) continue;
  const c = l.split("|").map((s) => s.trim());
  if (c.length >= 9 && /[①②③④⑤]/.test(c[3])) rows.push({ name: c[1], full: norm(c[1]), base: baseOf(c[1]), fam: c[3], nature: c[4], art: c[7], flag: c[8] });
}
const removed = new Set();
for (let i = removedStart; i < bestiary.length; i++) {
  const m = bestiary[i].match(/^- \*\*[^*]+\*\*[^:]*:\s*(.+)$/);
  if (!m || bestiary[i].includes("Sets dropped")) continue;
  // split on commas that are not inside parentheses
  let depth = 0, cur = "";
  for (const ch of m[1].replace(/\.\s*$/, "")) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { removed.add(baseOf(cur)); cur = ""; } else cur += ch;
  }
  if (cur.trim()) removed.add(baseOf(cur));
}

const ELEMENT_OF = { fire:"Fire", magma:"Fire", water:"Water", blood:"Water", frost:"Water", storm:"Wind", wind:"Wind", wood:"Wood", venom:"Wood", stone:"Earth", sand:"Earth", metal:"Earth", crystal:"Earth", light:"Light", shadow:"Shadow" };
const SEVEN = new Set(["Fire", "Water", "Wood", "Earth", "Wind", "Light", "Shadow"]);
const FLAVOUR_OF = { frost: "ice", storm: "lightning" };
const FOOTPRINTS = new Set(["1x1", "2x1", "1x2", "2x2", "3x1"]);
const STATES = new Set(["skeleton","undead","ghost","armoured","giant","swarm","lesser","elder","ancient","corrupted","crystal","clockwork","plague","mutant","mummified","whelp","adult","alpha"]);

const misses = [], warns = [];
const stats = { eliteBig: 0, bossBig: 0, bossRow: 0, bossMulti: 0, firstWideElite: null };
const perRegion = {};
let entries = 0, bossFamCount = { "①-③": 0, "④-⑤": 0 };
function lookup(name) {
  const f = norm(name), b = baseOf(name);
  let hit = rows.filter((r) => r.full === f);
  if (!hit.length) hit = rows.filter((r) => r.base === b || r.full.includes("(" + f + ")") || r.full.includes(f + ")"));
  return { hit, b };
}
function checkShape(where, e, isBoss, region, idx, n) {
  const fp = e.footprint;
  if (!FOOTPRINTS.has(fp)) misses.push(`${where}: bad footprint "${fp}"`);
  if (typeof e.bossRow !== "boolean") misses.push(`${where}: bossRow flag missing`);
  if (e.bossRow && /x[2-9]/.test(fp)) misses.push(`${where}: a boss-row body must be 1 deep, got ${fp}`);
  if (e.bossRow && !isBoss) misses.push(`${where}: only bosses sit in the boss row`);
  if (!isBoss && fp === "3x1" && region < 8) misses.push(`${where}: 3x1 elites start in region 8`);
  if (!isBoss && fp === "2x2" && region < 4) misses.push(`${where}: 2x2 elites start in region 4`);
  if (fp !== "1x1" && !isBoss) { stats.eliteBig++; if (!stats.firstWideElite) stats.firstWideElite = `${where}`; }
  if (isBoss && (fp !== "1x1" || e.bossRow)) stats.bossBig++;
  if (isBoss && e.bossRow) stats.bossRow++;
  if (isBoss && fp !== "1x1") stats.bossMulti++;
  if (e.element && !SEVEN.has(e.element)) misses.push(`${where}: element ${e.element} is not one of the 7`);
}
function checkEntry(where, e, isBoss) {
  entries++;
  const { hit, b } = lookup(e.base);
  if (removed.has(b)) { misses.push(`${where}: "${e.base}" is in Removed for sensitivity`); return; }
  if (!hit.length) { misses.push(`${where}: "${e.base}" not found in BESTIARY.md`); return; }
  const ok = hit.filter((r) => ["Malevolent", "Ambivalent"].includes(r.nature) && !/[🟡🔴]/u.test(r.flag));
  if (!ok.length) { misses.push(`${where}: "${e.base}" is ${hit[0].nature} / flag ${hit[0].flag} (need Malevolent or Ambivalent, not yellow/red)`); return; }
  if (ok.every((r) => r.art.includes("✕"))) warns.push(`${where}: "${e.base}" art is dropped (✕)`);
  if (ok.some((r) => r.flag.includes("🟢"))) warns.push(`${where}: "${e.base}" is a green-flag deity (allowed)`);
  if (isBoss) bossFamCount[/[①②③]/.test(ok[0].fam) ? "①-③" : "④-⑤"]++;
  // variant tokens
  for (const t of (e.variant || "").split(/\s+/).filter(Boolean)) if (!(t in ELEMENT_OF) && !STATES.has(t)) misses.push(`${where}: unknown variant token "${t}"`);
}
const ids = new Set();
for (const r of data.regions) {
  if (ids.has(r.id)) misses.push(`duplicate region id ${r.id}`); ids.add(r.id);
  if (r.status !== "proposed") misses.push(`${r.id}: status must be proposed`);
  if (r.subareas.length < 8 || r.subareas.length > 12) misses.push(`${r.id}: ${r.subareas.length} sub-areas (need 8-12)`);
  for (const s of r.subareas) {
    if (ids.has(s.id)) misses.push(`duplicate sub-area id ${s.id}`); ids.add(s.id);
    if (s.status !== "proposed") misses.push(`${s.id}: status must be proposed`);
    if (s.roster.length < 4 || s.roster.length > 6) misses.push(`${s.id}: roster size ${s.roster.length} (need 4-6)`);
    s.roster.forEach((e) => checkEntry(s.id, e, false));
    checkEntry(s.id + " (boss)", s.boss, true);
    s.roster.forEach((e) => { if (e.element && !SEVEN.has(e.element)) misses.push(`${s.id}: roster element ${e.element} is not one of the 7`); });
    if (!s.elite) misses.push(`${s.id}: elite missing`);
    else {
      if (!s.roster.some((e) => e.base === s.elite.base)) misses.push(`${s.id}: elite ${s.elite.base} not in roster`);
      checkEntry(s.id + " (elite)", s.elite, false); entries--;
      checkShape(s.id + " (elite)", s.elite, false, r.number, 0, 0);
    }
    checkShape(s.id + " (boss)", s.boss, true, r.number, 0, 0);
    const pr = (perRegion[r.number] ||= { n: 0, eliteBig: 0, bossBig: 0 });
    pr.n++; if (s.elite && s.elite.footprint !== "1x1") pr.eliteBig++; if (s.boss.footprint !== "1x1" || s.boss.bossRow) pr.bossBig++;
    if (s.elements.some((el) => !SEVEN.has(el))) misses.push(`${s.id}: sub-area elements outside the 7`);
    for (const t of [...s.roster, s.boss]) { const f = (t.variant || "").split(/\s+/).map((v) => FLAVOUR_OF[v]).find(Boolean); if ((f || null) !== (t.flavour || null)) misses.push(`${s.id}: ${t.base} flavour ${t.flavour} does not match variant "${t.variant}"`); }
    const derived = new Set([...s.roster, s.boss].flatMap((e) => (e.variant || "").split(/\s+/).map((t) => ELEMENT_OF[t]).filter(Boolean)));
    for (const el of s.elements) if (!derived.has(el)) misses.push(`${s.id}: element ${el} not carried by any roster variant`);
    if (!s.elements.length) warns.push(`${s.id}: no element on any enemy`);
  }
}
console.log(`regions ${data.regions.length}, sub-areas ${data.regions.reduce((n, r) => n + r.subareas.length, 0)}, entries checked ${entries}`);
console.log(`bestiary rows ${rows.length}, removed names ${removed.size}`);
console.log(`boss familiarity: ${bossFamCount["①-③"]} at ①-③, ${bossFamCount["④-⑤"]} at ④-⑤`);
const totE = Object.values(perRegion).reduce((n, p) => n + p.n, 0);
console.log(`big elites ${stats.eliteBig}/${totE} (${Math.round(100 * stats.eliteBig / totE)}%), big bosses ${stats.bossBig}/${totE} (${Math.round(100 * stats.bossBig / totE)}%): ${stats.bossMulti} multi-tile, ${stats.bossRow} in the boss row; first wide elite: ${stats.firstWideElite}`);
console.log("per region (big elites / big bosses of sub-areas): " + Object.entries(perRegion).map(([k, p]) => `${k}: ${p.eliteBig}/${p.bossBig} of ${p.n}`).join("; "));
const pe = stats.eliteBig / totE, pb = stats.bossBig / totE;
if (pe < 0.25 || pe > 0.35) misses.push(`big elite share ${Math.round(pe * 100)}% outside 25-35%`);
if (pb < 0.5 || pb > 0.6) misses.push(`big boss share ${Math.round(pb * 100)}% outside 50-60%`);
if (!/^greenvale/.test(stats.firstWideElite || "")) misses.push("first wide elite must appear in region 1");
console.log(`MISSES (${misses.length})`); misses.forEach((m) => console.log("  " + m));
console.log(`WARNINGS (${warns.length})`); warns.forEach((m) => console.log("  " + m));
process.exit(misses.length ? 1 : 0);
