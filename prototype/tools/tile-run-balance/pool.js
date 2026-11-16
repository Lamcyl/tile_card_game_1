'use strict';
/* a tiny process pool: run(jobs) -> results in order */
const cp = require('child_process'), path = require('path');
function run(jobs, workers) {
  workers = Math.min(workers || require('os').cpus().length, jobs.length || 1);
  return new Promise(resolve => {
    const out = new Array(jobs.length); let next = 0, done = 0; const kids = [];
    if (!jobs.length) return resolve(out);
    const feed = k => { if (next >= jobs.length) return; const id = next++; k.send(Object.assign({ id }, jobs[id])); };
    for (let i = 0; i < workers; i++) {
      const k = cp.fork(path.join(__dirname, 'worker.js')); kids.push(k);
      k.on('message', m => { out[m.id] = m; done++; if (done === jobs.length) { kids.forEach(x => x.kill()); resolve(out); } else feed(k); });
      feed(k);
    }
  });
}
module.exports = { run };
