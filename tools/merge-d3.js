const fs=require('fs');
const p='../src/az900-template.html'; let s=fs.readFileSync(p,'utf8');
const m=s.match(/(  const quizBank = \[\n)([\s\S]*?)(  \];\n)/); if(!m) throw 'no bank';
const items=m[2].split('\n').filter(l=>l.trim()).map(l=>eval('('+l.trim().replace(/,\s*$/,'')+')'));
if(items.length!==120) throw 'expected 120, got '+items.length;
const add=require('./new-d3.js'); const ids=new Set(items.map(i=>i.id)); add.forEach(a=>{ if(ids.has(a.id)) throw 'dup id '+a.id; });
const all=items.concat(add); const N=all.length;
let seed=11; const rng=()=>{seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff;};
const shuffle=a=>{a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a;};
const doms=['d1','d2','d3'], dc={}; all.forEach(t=>dc[t.dom]=(dc[t.dom]||0)+1);
const q={}; doms.forEach(d=>q[d]=shuffle(all.filter(t=>t.dom===d)));
const picked={d1:0,d2:0,d3:0}, res=[];
for(let i=0;i<N;i++){const c=[]; for(const d of doms){ if(!q[d].length) continue; c.push({d,def:dc[d]/N-picked[d]/(i||1)}); }
 const mx=Math.max(...c.map(x=>x.def)); const top=c.filter(x=>Math.abs(x.def-mx)<1e-9); const ch=top[Math.floor(rng()*top.length)].d; res.push(q[ch].shift()); picked[ch]++; }
let run=1,mr=1; for(let i=1;i<res.length;i++){ if(res[i].dom===res[i-1].dom){run++; mr=Math.max(mr,run);} else run=1; }
const cc=[0,0,0,0]; res.forEach(t=>cc[t.correct]++);
const oc={}; res.forEach(t=>oc[t.obj]=(oc[t.obj]||0)+1);
console.log('total',N,'domains',dc,'pct d3',(100*dc.d3/N).toFixed(1),'max run',mr,'correct dist',cc); console.log('objectives',oc);
const js=x=>"'"+x+"'";
const ser=t=>`    { id: ${t.id}, dom: ${js(t.dom)}, obj: ${js(t.obj)}, q: ${js(t.q)}, opts: [${t.opts.map(js).join(', ')}], correct: ${t.correct}, explain: ${js(t.explain)} },`;
s=s.replace(m[0], m[1]+res.map(ser).join('\n')+'\n'+m[3]);
const rep=(o,n)=>{ if(s.split(o).length!==2) throw 'anchor '+o; s=s.replace(o,n); };
rep('<button class="subtab-btn" data-subview="bank">Full bank · 120</button>','<button class="subtab-btn" data-subview="bank">Full bank · '+N+'</button>');
rep('<b id="bank-score">0/120</b>','<b id="bank-score">0/'+N+'</b>');
fs.writeFileSync(p,s); console.log('written');
