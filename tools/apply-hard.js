const fs=require('fs'); const p='../src/az900-template.html'; let s=fs.readFileSync(p,'utf8');
const m=s.match(/(  const quizBank = \[\n)([\s\S]*?)(  \];\n)/); if(!m) throw 'no bank';
const items=m[2].split('\n').filter(l=>l.trim()).map(l=>eval('('+l.trim().replace(/,\s*$/,'')+')'));
if(items.length!==140) throw 'expected 140, got '+items.length;
// 1. distractor rewrites
const rw=require('./rewrite-opts.js'); let rewritten=0;
items.forEach(it=>{ const r=rw[it.id]; if(!r) return; const ci=r.findIndex(o=>o.startsWith('*')); if(ci!==it.correct) throw 'correct index mismatch on '+it.id+' ('+ci+' vs '+it.correct+')';
  it.opts=r.map(o=>o.replace(/^\*/,'')); rewritten++; });
if(rewritten!==Object.keys(rw).length) throw 'rewrites applied '+rewritten;
// 2. new questions
const add=require('./new-hard.js').map(x=>{ const ci=x.opts.findIndex(o=>o.startsWith('*')); return {...x, opts:x.opts.map(o=>o.replace(/^\*/,'')), correct:ci}; });
const ids=new Set(items.map(i=>i.id)); add.forEach(a=>{ if(ids.has(a.id)) throw 'dup '+a.id; });
const all=items.concat(add); const N=all.length;
// 3. tell stats after
let longest=0, much=0; all.forEach(it=>{ const L=it.opts.map(o=>o.length); const c=L[it.correct]; const o=L.filter((_,i)=>i!==it.correct); if(c>=Math.max(...o)) longest++; if(c>1.5*Math.max(...o)) much++; });
// 4. re-interleave
let seed=13; const rng=()=>{seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff;};
const shuffle=a=>{a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a;};
const doms=['d1','d2','d3'], dc={}; all.forEach(t=>dc[t.dom]=(dc[t.dom]||0)+1);
const q={}; doms.forEach(d=>q[d]=shuffle(all.filter(t=>t.dom===d))); const picked={d1:0,d2:0,d3:0}, res=[];
for(let i=0;i<N;i++){const c=[]; for(const d of doms){ if(!q[d].length) continue; c.push({d,def:dc[d]/N-picked[d]/(i||1)}); } const mx=Math.max(...c.map(x=>x.def)); const top=c.filter(x=>Math.abs(x.def-mx)<1e-9); const ch=top[Math.floor(rng()*top.length)].d; res.push(q[ch].shift()); picked[ch]++; }
const cc=[0,0,0,0]; res.forEach(t=>cc[t.correct]++);
console.log('total',N,'domains',dc,'correct dist',cc,'| correct is longest:',longest,'('+Math.round(100*longest/N)+'%) | 1.5x longer:',much);
const js=x=>"'"+x+"'"; const ser=t=>`    { id: ${t.id}, dom: ${js(t.dom)}, obj: ${js(t.obj)}, q: ${js(t.q)}, opts: [${t.opts.map(js).join(', ')}], correct: ${t.correct}, explain: ${js(t.explain)} },`;
s=s.replace(m[0], m[1]+res.map(ser).join('\n')+'\n'+m[3]);
const rep=(o,n)=>{ if(s.split(o).length!==2) throw 'anchor '+o.slice(0,60); s=s.replace(o,n); };
rep('Full bank · 140</button>','Full bank · '+N+'</button>'); rep('<b id="bank-score">0/140</b>','<b id="bank-score">0/'+N+'</b>');
// 5. per-question record hidden until answered
rep("      '<span class=\"q-stat\">' + statText + '</span>' +\n", "      '<span class=\"q-stat\"' + (bankAnswers[item.id] ? '' : ' hidden') + '>' + statText + '</span>' +\n");
rep("        statEl.textContent = s.correct + '/' + s.attempts + ' correct';\n", "        statEl.textContent = s.correct + '/' + s.attempts + ' correct';\n        statEl.hidden = false;\n");
fs.writeFileSync(p,s); console.log('written');
