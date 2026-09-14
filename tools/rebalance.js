const fs = require('fs');

const raw = fs.readFileSync('../work/quizbank-items.txt', 'utf8');
const lines = raw.split('\n').filter(l => l.trim().length > 0);

// Each line is `    { id: N, dom: 'dX', q: '...', opts: [...], correct: N, explain: '...' },`
// eval each line as JS to get an object (safe: content we authored ourselves).
const items = lines.map(line => {
  const trimmed = line.trim().replace(/,\s*$/, '');
  const obj = eval('(' + trimmed + ')');
  return obj;
});

if (items.length !== 120) throw new Error('expected 120 items, got ' + items.length);

// Build a balanced target-correct-index assignment: 30 each of 0,1,2,3, shuffled.
function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// simple seeded RNG for reproducibility
let seed = 42;
function rng() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

let targets = [];
for (let i = 0; i < 30; i++) targets.push(0, 1, 2, 3);
targets = shuffle(targets, rng);

const newItems = items.map((item, idx) => {
  const correctOpt = item.opts[item.correct];
  const others = item.opts.filter((_, i) => i !== item.correct);
  const shuffledOthers = shuffle(others, rng);
  const target = targets[idx];
  const newOpts = [];
  let oi = 0;
  for (let slot = 0; slot < 4; slot++) {
    if (slot === target) newOpts.push(correctOpt);
    else newOpts.push(shuffledOthers[oi++]);
  }
  return { ...item, opts: newOpts, correct: target };
});

// verify distribution
const counts = [0, 0, 0, 0];
newItems.forEach(it => counts[it.correct]++);
console.error('New distribution A/B/C/D:', counts);

// verify options set unchanged (as multiset) per item
for (let i = 0; i < items.length; i++) {
  const a = [...items[i].opts].sort();
  const b = [...newItems[i].opts].sort();
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('opts mismatch at id ' + items[i].id);
  if (newItems[i].opts[newItems[i].correct] !== items[i].opts[items[i].correct]) {
    throw new Error('correct answer content mismatch at id ' + items[i].id);
  }
}

function jsStr(s) {
  // wrap in single quotes; content is known not to contain raw single quotes (uses curly apostrophe)
  return "'" + s + "'";
}

function serialize(item) {
  const opts = '[' + item.opts.map(jsStr).join(', ') + ']';
  return `    { id: ${item.id}, dom: ${jsStr(item.dom)}, q: ${jsStr(item.q)}, opts: ${opts}, correct: ${item.correct}, explain: ${jsStr(item.explain)} },`;
}

const out = newItems.map(serialize).join('\n');
fs.writeFileSync('../work/quizbank-items-new.txt', out + '\n');
console.error('Wrote new items file.');
