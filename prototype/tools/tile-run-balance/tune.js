'use strict';
/* HP tuner: repeats journeys (skilled and casual bots) and moves each tier's enemy HP until a mix of the two bots' win rates (weights WC) hits TARGET.
   Usage: node tune.js <override.json> <iterations> [players per skill]   (the override file is read and rewritten each round; it holds the starting stage hp)
   Targets (average of skilled and casual): see TARGET. */
const fs = require('fs'), J = require('./journeys.js');
const TARGET = [0.96, 0.92, 0.86, 0.80, 0.74, 0.68, 0.62, 0.57, 0.52, 0.46];   /* mixed win rate */
const WC = [0.8, 0.8, 0.7, 0.6, 0.5, 0.4, 0.35, 0.3, 0.3, 0.3];             /* weight of the casual bot in the mix (new players matter early, skilled play late) */
(async () => {
  const file = process.argv[2], iters = +(process.argv[3] || 3), n = +(process.argv[4] || 6);
  for (let it = 0; it < iters; it++) {
    process.env.TR_OVERRIDE = file;
    const ov = JSON.parse(fs.readFileSync(file, 'utf8'));
    const sk = await J.runAll('skilled', n, 100 + it * 50, 300), ca = await J.runAll('casual', Math.max(4, n - 2), 500 + it * 50, 300);
    const a = J.summary('skilled', sk), b = J.summary('casual', ca);
    console.log('iteration', it); console.log(a.text); console.log(b.text);
    for (let t = 1; t <= 10; t++) {
      const x = a.T[t]; if (!x) continue;
      const y = b.T[t], wc = y ? WC[t - 1] : 0, w = (1 - wc) * (x.win / x.runs) + wc * (y ? y.win / y.runs : 0), tg = TARGET[t - 1];
      let f = Math.exp(Math.max(-0.25, Math.min(0.3, 1.1 * (w - tg))));
      
      const st = ov.stages[String(t - 1)]; st.hp = Math.max(3, Math.round(st.hp * f * 10) / 10);
    }
    fs.writeFileSync(file, JSON.stringify(ov));
    console.log('hp now', JSON.stringify(Object.keys(ov.stages).map(k => ov.stages[k].hp)));
  }
})();
