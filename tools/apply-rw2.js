const fs=require('fs'); const p='../src/az900-template.html'; let s=fs.readFileSync(p,'utf8');
const m=s.match(/(  const quizBank = \[\n)([\s\S]*?)(  \];\n)/); const items=m[2].split('\n').filter(l=>l.trim()).map(l=>eval('('+l.trim().replace(/,\s*$/,'')+')'));
const rw=require('./rewrite-opts2.js'); let n=0;
items.forEach(it=>{ const r=rw[it.id]; if(!r) return; if(r.length!==4) throw 'len '+it.id; const ci=r.findIndex(o=>o.startsWith('*')); if(ci!==it.correct) throw 'idx '+it.id; if(/[^’]'/.test(r.join(''))) throw 'quote '+it.id; it.opts=r.map(o=>o.replace(/^\*/,'')); n++; });
if(n!==Object.keys(rw).length) throw 'applied '+n;
let n20=0, n35=0, cc=[0,0,0,0]; items.forEach(it=>{const L=it.opts.map(o=>o.length); const c=L[it.correct]; const mx=Math.max(...L.filter((_,i)=>i!==it.correct)); if(c>1.2*mx) n20++; if(c>1.35*mx) n35++; cc[it.correct]++;});
console.log('rewritten',n,'| >=20% longer:',n20,'| >=35% longer:',n35,'| correct dist',cc);
const js=x=>"'"+x+"'"; const ser=t=>`    { id: ${t.id}, dom: ${js(t.dom)}, obj: ${js(t.obj)}, q: ${js(t.q)}, opts: [${t.opts.map(js).join(', ')}], correct: ${t.correct}, explain: ${js(t.explain)} },`;
s=s.replace(m[0], m[1]+items.map(ser).join('\n')+'\n'+m[3]); fs.writeFileSync(p,s); console.log('written');
