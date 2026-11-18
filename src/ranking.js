export const MODEL_VERSION='bt-decay-56d-v1';
const DAY=86400000,N=30;
const key=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;
export function fitRanking(rows,teams,now=Date.now()){
 const ids=new Map(teams.map((t,i)=>[t[0],i])),s=Array(N).fill(0),n=Array(N).fill(0),last=Array(N).fill(0),op=Array.from({length:N},()=>new Set()),pairs=[];
 const unique=new Map(rows.map(r=>[r.id,r]));
 for(const r of unique.values()){
  const a=ids.get(r.winner),b=ids.get(r.loser),time=Date.parse(r.answered_at);
  if(a===undefined||b===undefined||a===b||!Number.isFinite(time))continue;
  const w=2**(-Math.max(0,now-time)/(56*DAY));
  pairs.push([a,b,w]);n[a]+=w;n[b]+=w;last[a]=Math.max(last[a],time);last[b]=Math.max(last[b],time);
  if(w>=.25){op[a].add(b);op[b].add(a);}
 }
 for(let k=0;k<120;k++){
  const g=s.map(x=>-.6*x),h=Array(N).fill(.6);
  for(const [a,b,w]of pairs){const p=1/(1+Math.exp(s[b]-s[a])),v=w*p*(1-p);g[a]+=w*(1-p);g[b]-=w*(1-p);h[a]+=v;h[b]+=v;}
  for(let i=0;i<N;i++)s[i]+=.35*g[i]/h[i];
 }
 const components=[],seen=new Set();
 for(let i=0;i<N;i++){if(seen.has(i))continue;const todo=[i],c=[];seen.add(i);while(todo.length){const a=todo.pop();c.push(a);for(const b of op[a])if(!seen.has(b)){seen.add(b);todo.push(b);}}components.push(c);}
 components.sort((a,b)=>b.length-a.length||a[0]-b[0]);
 const connected=new Set(components.length===1||components[0].length>components[1].length?components[0]:[]),eligible=teams.map((_,i)=>connected.has(i)&&n[i]>=2.5&&op[i].size>=3);
 const order=teams.map((_,i)=>i).filter(i=>eligible[i]).sort((a,b)=>s[b]-s[a]||teams[a][1].localeCompare(teams[b][1],'en'));
 const pending=teams.map((_,i)=>i).filter(i=>!eligible[i]).sort((a,b)=>teams[a][1].localeCompare(teams[b][1],'en'));
 const h=Array.from({length:N},(_,i)=>Array.from({length:N},(_,j)=>i===j?.6:0));
 for(const [a,b,w]of pairs){const p=1/(1+Math.exp(s[b]-s[a])),v=w*p*(1-p);h[a][a]+=v;h[b][b]+=v;h[a][b]-=v;h[b][a]-=v;}
 const aug=h.map((r,i)=>[...r,...Array.from({length:N},(_,j)=>i===j?1:0)]);
 for(let i=0;i<N;i++){const d=aug[i][i];for(let j=0;j<2*N;j++)aug[i][j]/=d;for(let k=0;k<N;k++)if(k!==i){const f=aug[k][i];for(let j=0;j<2*N;j++)aug[k][j]-=f*aug[i][j];}}
 const covariance=aug.map(r=>r.slice(N)),variance=(a,b)=>Math.max(0,covariance[a][a]+covariance[b][b]-2*covariance[a][b]);
 const close=new Set();for(let k=1;k<order.length;k++){const a=order[k-1],b=order[k];if(Math.abs(s[a]-s[b])<Math.sqrt(variance(a,b))){close.add(a);close.add(b);}}
 return {s,n,last,op,order,pending,eligible,close,variance,seen:op.filter(o=>o.size).length,total:pairs.length,now};
}
export function pickPair(m,{recent=[],previous=[],rng=Math.random}={}){
 const mode=rng(),blocked=new Set(recent.slice(-12));let best=-Infinity,result=null;
 for(let a=0;a<N;a++)for(let b=a+1;b<N;b++){
  if(blocked.has(key(a,b)))continue;
  const p=1/(1+Math.exp(m.s[b]-m.s[a]));let u;
  if(mode<.6)u=Math.log1p(p*(1-p)*m.variance(a,b));
  else if(mode<.85){const age=i=>Math.min(1,Math.max(0,m.now-m.last[i])/(28*DAY));u=1/(m.n[a]+.5)+1/(m.n[b]+.5)+.4*(age(a)+age(b));}
  else u=1;
  u*=.9+.2*rng();if(previous.includes(a)||previous.includes(b))u*=.6;
  if(u>best){best=u;result=[a,b];}
 }
 if(!result)throw Error('Není dostupná dvojice.');
 return {pair:rng()<.5?result:result.slice().reverse(),key:key(...result)};
}
