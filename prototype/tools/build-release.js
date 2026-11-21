'use strict';
/* Release build: node prototype/tools/build-release.js
   Copies samples/tile-run.html to release/tilewhist-v<VERSION>.html with every dev tool removed:
   DEV is hard-wired to false, the window.TR test hooks, the dev settings menu, the advanced (scored)
   encyclopedia and the test-helper actions are cut out. The source file keeps them (?dev=1) for the test kit. */
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', 'samples', 'tile-run.html');
let s = fs.readFileSync(SRC, 'utf8');
const ver = (s.match(/var VERSION = '([^']+)'/) || [])[1]; if (!ver) throw new Error('no VERSION');

function cutBlock(startText, label) {   /* remove from startText through the brace block that follows it (and a trailing ;) */
  const i = s.indexOf(startText); if (i < 0) throw new Error('not found: ' + label);
  let j = s.indexOf('{', i), d = 0, q = null;
  for (; j < s.length; j++) {
    const ch = s[j];
    if (q) { if (ch === '\\') { j++; continue; } if (ch === q) q = null; continue; }
    if (ch === "'" || ch === '"') { q = ch; continue; }
    if (ch === '{') d++; else if (ch === '}') { d--; if (!d) break; }
  }
  let end = j + 1; if (s[end] === ';') end++;
  s = s.slice(0, i) + s.slice(end);
}
function rep(a, b, label) { if (s.indexOf(a) < 0) throw new Error('not found: ' + label); s = s.split(a).join(b); }

rep(s.match(/var DEV = [^\n]*/)[0], 'var DEV = false;', 'DEV flag');
cutBlock('if (DEV) window.TR = {', 'TR hooks');
cutBlock('function settingsHTML() {', 'settings menu');
cutBlock('function openEnc() {', 'advanced encyclopedia');
rep("case 'settings': if (DEV) openModal(settingsHTML()); break;", '', 'settings act');
rep("case 'enc': if (DEV) { closeModal(); openEnc(); } break;", '', 'enc act');
/* the test-helper actions: drop their case lines from the click switch */
const acts = (s.match(/var DEV_ACTS = \[([^\]]*)\]/) || [])[1].split(',').map(x => x.trim().replace(/'/g, ''));
acts.forEach(a => { s = s.replace(new RegExp("\\n[ \\t]*case '" + a + "':[\\s\\S]*?(?=\\n[ \\t]*case '|\\n[ \\t]*\\}\\n)"), ''); });

const out = path.join(__dirname, '..', 'release', 'tilewhist-v' + ver + '.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, s);
const left = ['window.TR', 'settingsHTML', 'openEnc('].filter(k => s.indexOf(k) >= 0);
console.log('wrote', out, (s.length / 1024).toFixed(0) + ' KB', left.length ? 'LEFTOVER: ' + left.join(', ') : 'dev tools removed');
