const fs = require('fs');
const lines = fs.readFileSync('../work/quizbank-items3.txt','utf8').split('\n').filter(l=>l.trim());
const items = lines.map(l => eval('(' + l.trim().replace(/,\s*$/,'') + ')'));
if (items.length !== 120) throw new Error('count');
const M = {
 '1.1':[1,7,8,10,12,13,14,15,63,66,95,96,61,68,69,4],
 '1.2':[3,5,9,18,62,91,92,93,94,6,16,17,64,67,45],
 '1.3':[2,11,65],
 '2.1':[19,39,41,70,72,80,81,36,71,23,44],
 '2.2':[20,27,35,77,78,98,22,24,25,37,38,73,74,97,99,100,102,28],
 '2.3':[26,110,21,29,30,31,40,75,76,101,108,109],
 '2.4':[34,103,104,105,106,107,79,42,47,48,49,50,51,52,60,115,116,117],
 '3.1':[55,56,57,87,90,112,84],
 '3.2':[111,43,54,58,59,82,83,88,89,114,113,53],
 '3.3':[32,33,86,118],
 '3.4':[46,120,85,119],
};
const byId = {}; for (const [obj, ids] of Object.entries(M)) ids.forEach(id => { if (byId[id]) throw new Error('dup '+id); byId[id]=obj; });
const missing = items.filter(it => !byId[it.id]).map(it=>it.id); if (missing.length) throw new Error('missing '+missing);
if (Object.keys(byId).length !== 120) throw new Error('mapped ' + Object.keys(byId).length);
const moved = [];
const tagged = items.map(it => { const obj = byId[it.id]; const dom = 'd'+obj[0]; if (dom !== it.dom) moved.push(it.id+':'+it.dom+'→'+dom); return { id: it.id, dom, obj, q: it.q, opts: it.opts, correct: it.correct, explain: it.explain }; });
console.error('moved:', moved.join(' '));
const dc = {}, oc = {}; tagged.forEach(t => { dc[t.dom]=(dc[t.dom]||0)+1; oc[t.obj]=(oc[t.obj]||0)+1; });
console.error('domains', dc); console.error('objectives', oc);
// interleave domains (same deficit algorithm as mix-domains.js, seed 7)
let seed = 7; const rng = () => { seed = (seed*1103515245+12345) & 0x7fffffff; return seed/0x7fffffff; };
const shuffle = a => { a=a.slice(); for (let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; };
const doms=['d1','d2','d3'], queues={}; doms.forEach(d=>queues[d]=shuffle(tagged.filter(t=>t.dom===d)));
const picked={d1:0,d2:0,d3:0}, result=[];
for (let i=0;i<120;i++){ const c=[]; for (const d of doms){ if(!queues[d].length) continue; c.push({d, def: dc[d]/120 - picked[d]/(i||1)}); }
  const mx=Math.max(...c.map(x=>x.def)); const top=c.filter(x=>Math.abs(x.def-mx)<1e-9); const ch=top[Math.floor(rng()*top.length)].d; result.push(queues[ch].shift()); picked[ch]++; }
let run=1,maxRun=1; for(let i=1;i<result.length;i++){ if(result[i].dom===result[i-1].dom){run++;maxRun=Math.max(maxRun,run);} else run=1; }
console.error('max same-domain run:', maxRun);
const cc=[0,0,0,0]; result.forEach(t=>cc[t.correct]++); console.error('correct dist:', cc);
const js = s => "'" + s + "'";
const ser = t => `    { id: ${t.id}, dom: ${js(t.dom)}, obj: ${js(t.obj)}, q: ${js(t.q)}, opts: [${t.opts.map(js).join(', ')}], correct: ${t.correct}, explain: ${js(t.explain)} },`;
fs.writeFileSync('../work/quizbank-items3-new.txt', result.map(ser).join('\n')+'\n');
console.error('written', result.length);
