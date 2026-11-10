// Design-data check (no game code). Usage: node docs/data/check-regions.mjs
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

const ELEMENT_OF = { fire:"Fire", magma:"Fire", water:"Water", blood:"Water", frost:"Frost", storm:"Storm", wind:"Wind", wood:"Wood", venom:"Wood", stone:"Earth", sand:"Earth", metal:"Earth", crystal:"Earth", light:"Light", shadow:"Shadow" };
const STATES = new Set(["skeleton","undead","ghost","armoured","giant","swarm","lesser","elder","ancient","corrupted","crystal","clockwork","plague","mutant","mummified","whelp","adult","alpha"]);

const misses = [], warns = [];
let entries = 0, bossFamCount = { "①-③": 0, "④-⑤": 0 };
function lookup(name) {
  const f = norm(name), b = baseOf(name);
  let hit = rows.filter((r) => r.full === f);
  if (!hit.length) hit = rows.filter((r) => r.base === b || r.full.includes("(" + f + ")") || r.full.includes(f + ")"));
  return { hit, b };
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
    const derived = new Set([...s.roster, s.boss].flatMap((e) => (e.variant || "").split(/\s+/).map((t) => ELEMENT_OF[t]).filter(Boolean)));
    for (const el of s.elements) if (!derived.has(el)) misses.push(`${s.id}: element ${el} not carried by any roster variant`);
    if (!s.elements.length) warns.push(`${s.id}: no element on any enemy`);
  }
}
console.log(`regions ${data.regions.length}, sub-areas ${data.regions.reduce((n, r) => n + r.subareas.length, 0)}, entries checked ${entries}`);
console.log(`bestiary rows ${rows.length}, removed names ${removed.size}`);
console.log(`boss familiarity: ${bossFamCount["①-③"]} at ①-③, ${bossFamCount["④-⑤"]} at ④-⑤`);
console.log(`MISSES (${misses.length})`); misses.forEach((m) => console.log("  " + m));
console.log(`WARNINGS (${warns.length})`); warns.forEach((m) => console.log("  " + m));
process.exit(misses.length ? 1 : 0);
