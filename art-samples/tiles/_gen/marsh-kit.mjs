// Shared kit for the Firefly Marsh object generators.
import { T, P, rng, hash, ink, maker, SUBS } from './sub.mjs';
export const SUB = SUBS.marsh;
export const { mk, out } = maker(SUB);
export const R = (s) => rng(hash(s));
export const prop = (cat, name, v, tags, fn, w = T, h = T) => { const t = mk(cat, name, v, w, h); fn(t, R(name + v)); out(t, cat, name, v, ['marsh', ...tags]); };
export const ST = ['#e0d9c4', '#b4ad98', '#857d6c'], ln = ink(P.inkR, .9, .8), MS = ['#a8cf86', '#6fa050'];
