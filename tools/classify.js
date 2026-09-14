const fs = require('fs');
const lines = fs.readFileSync('../work/quizbank-items3.txt','utf8').split('\n').filter(l=>l.trim());
const items = lines.map(l => eval('(' + l.trim().replace(/,\s*$/,'') + ')'));
if (items.length !== 120) throw new Error('count ' + items.length);
// ordered rules per domain: first match wins
const rules = {
  d1: [
    ['1.3', /\b(IaaS|PaaS|SaaS|service (type|model)s?|infrastructure as a service|platform as a service|software as a service)\b/i],
    ['1.2', /\b(high availability|scalab|elastic|reliab|predictab|manageab|agility|global reach|disaster recovery|fault tolerance|redundan|benefit)/i],
    ['1.1', /./],
  ],
  d2: [
    ['2.4', /\b(Entra|identity|identities|MFA|multi-?factor|single sign|SSO|passwordless|conditional access|RBAC|role-based|zero trust|defense in depth|Defender|Key Vault|DDoS|firewall|network security group|NSG|B2B|B2C|authenticat|authoriz|Sentinel|Bastion|encrypt|security)/i],
    ['2.3', /\b(storage|blob|redundan|LRS|ZRS|GRS|Data Box|AzCopy|File Sync|Azure Files|archive tier|hot tier|cool tier|Azure Migrate|managed disk|queue storage|table storage|Storage Explorer)/i],
    ['2.2', /\b(virtual machine|VM\b|scale set|availability set|Virtual Desktop|container|AKS|Kubernetes|Functions|App Service|serverless|VNet|virtual network|subnet|peering|VPN|ExpressRoute|DNS|load balanc|Application Gateway|Front Door|Traffic Manager|CDN|Content Delivery|compute|network)/i],
    ['2.1', /./],
  ],
  d3: [
    ['3.4', /\b(Advisor|Service Health|Azure Monitor|Log Analytics|Application Insights|alert|monitor|metrics|logs?\b|Azure Status)/i],
    ['3.1', /\b(cost|pricing|TCO|total cost|billing|invoice|spending|budget|reserv(ed|ation)|hybrid benefit|spot|tag)/i],
    ['3.3', /\b(portal|Cloud Shell|CLI|PowerShell|Azure Arc|ARM template|Bicep|infrastructure as code|IaC|Terraform|deploy|mobile app)/i],
    ['3.2', /./],
  ],
};
const out = items.map(it => {
  const text = it.q + ' ' + it.opts.join(' ') + ' ' + it.explain;
  const qtext = it.q;
  let obj = null;
  // prefer matching the question text first, then full text
  for (const [code, re] of rules[it.dom]) { if (re.test(qtext)) { obj = code; break; } }
  if (!obj) for (const [code, re] of rules[it.dom]) { if (re.test(text)) { obj = code; break; } }
  return { id: it.id, dom: it.dom, obj, q: it.q };
});
out.sort((a,b)=> a.obj.localeCompare(b.obj) || a.id-b.id);
out.forEach(o => console.log(o.obj + ' | ' + o.id + ' | ' + o.q.slice(0,150)));
const counts = {}; out.forEach(o => counts[o.obj] = (counts[o.obj]||0)+1); console.error(counts);
