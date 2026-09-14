const fs = require('fs');

const raw = fs.readFileSync('../work/quizbank-items2.txt', 'utf8');
const lines = raw.split('\n').filter(l => l.trim().length > 0);

const items = lines.map(line => {
  const trimmed = line.trim().replace(/,\s*$/, '');
  return eval('(' + trimmed + ')');
});

if (items.length !== 120) throw new Error('expected 120 items, got ' + items.length);

let seed = 7;
function rng() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const doms = ['d1', 'd2', 'd3'];
const queues = {};
doms.forEach(d => { queues[d] = shuffle(items.filter(it => it.dom === d)); });

const total = items.length;
const picked = { d1: 0, d2: 0, d3: 0 };
const result = [];

for (let i = 0; i < total; i++) {
  // deficit = target share - actual share picked so far; pick domain with max deficit among non-empty queues
  let best = null, bestDeficit = -Infinity;
  const candidates = [];
  for (const d of doms) {
    if (queues[d].length === 0) continue;
    const target = items.filter(it => it.dom === d).length / total;
    const actual = picked[d] / (i || 1);
    const deficit = target - actual;
    candidates.push({ d, deficit });
  }
  // find max deficit, break ties randomly among near-ties
  const maxDeficit = Math.max(...candidates.map(c => c.deficit));
  const tiedTop = candidates.filter(c => Math.abs(c.deficit - maxDeficit) < 1e-9);
  const choice = tiedTop[Math.floor(rng() * tiedTop.length)].d;
  const item = queues[choice].shift();
  result.push(item);
  picked[choice]++;
}

// sanity: same multiset of ids, domain counts unchanged
const origIds = items.map(i => i.id).sort((a, b) => a - b);
const newIds = result.map(i => i.id).sort((a, b) => a - b);
if (JSON.stringify(origIds) !== JSON.stringify(newIds)) throw new Error('id set mismatch');

const counts = { d1: 0, d2: 0, d3: 0 };
result.forEach(it => counts[it.dom]++);
console.error('domain counts (unchanged):', counts);

// report longest same-domain run
let run = 1, maxRun = 1;
for (let i = 1; i < result.length; i++) {
  if (result[i].dom === result[i - 1].dom) { run++; maxRun = Math.max(maxRun, run); }
  else run = 1;
}
console.error('longest consecutive same-domain run:', maxRun);
console.error('first 15 domains:', result.slice(0, 15).map(i => i.dom).join(','));

function jsStr(s) { return "'" + s + "'"; }
function serialize(item) {
  const opts = '[' + item.opts.map(jsStr).join(', ') + ']';
  return `    { id: ${item.id}, dom: ${jsStr(item.dom)}, q: ${jsStr(item.q)}, opts: ${opts}, correct: ${item.correct}, explain: ${jsStr(item.explain)} },`;
}

const out = result.map(serialize).join('\n');
fs.writeFileSync('../work/quizbank-items2-new.txt', out + '\n');
console.error('wrote new items file');
