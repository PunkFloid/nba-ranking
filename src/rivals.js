export function teamRivals(rows,teams,code){
 const names=new Map(teams),unique=new Map(),groups=new Map();if(!names.has(code))return [];
 for(const r of rows)if(r&&typeof r.id==='string'&&r.id)unique.set(r.id,r);
 for(const r of unique.values()){
  const time=Date.parse(r.answered_at);if(!names.has(r.winner)||!names.has(r.loser)||r.winner===r.loser||!Number.isFinite(time)||(r.winner!==code&&r.loser!==code))continue;
  const won=r.winner===code,other=won?r.loser:r.winner;
  if(!groups.has(other))groups.set(other,{code:other,name:names.get(other),wins:0,losses:0,votes:[]});
  const group=groups.get(other);if(won)group.wins++;else group.losses++;group.votes.push({id:r.id,time,won});
 }
 const result=[];
 for(const {votes,...group}of groups.values())if(group.wins&&group.losses){
  votes.sort((a,b)=>b.time-a.time||b.id.localeCompare(a.id,'en'));
  const recent=votes.slice(0,5),recentWins=recent.filter(v=>v.won).length;
  result.push({...group,recentWins,recentLosses:recent.length-recentWins,recentCount:recent.length});
 }
 const recentBalance=r=>Math.abs(r.recentWins-r.recentLosses)/r.recentCount,totalBalance=r=>Math.abs(r.wins-r.losses)/(r.wins+r.losses);
 return result.sort((a,b)=>recentBalance(a)-recentBalance(b)||totalBalance(a)-totalBalance(b)||(b.wins+b.losses)-(a.wins+a.losses)||a.code.localeCompare(b.code,'en'));
}
export function renderRivals(parent,{code,teams,rivals=[],onCompare,disabled=false}){
 if(!rivals.length)return;const ids=new Map(teams.map((t,i)=>[t[0],i]));if(!ids.has(code))return;
 const add=(p,tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;p.append(e);return e;};
 const section=add(parent,'section');section.className='detail-neighbors team-rivals';section.setAttribute('aria-label','Rivalové '+code);add(section,'p','Rivalové');
 for(const rival of rivals){
  const item=add(section,'div');item.className='detail-neighbors';const name=add(item,'p',rival.code);name.title=rival.name;
  add(item,'p',`Celkem: ${rival.wins}:${rival.losses}`);
  add(item,'p',`${rival.recentCount===5?'Posledních 5':'Poslední '+rival.recentCount}: ${rival.recentWins}:${rival.recentLosses}`);
  const button=add(item,'button',`Porovnat ${code} / ${rival.code}`);button.type='button';button.disabled=disabled||!ids.has(rival.code)||code===rival.code;
  button.onclick=()=>{if(!button.disabled)onCompare([ids.get(code),ids.get(rival.code)]);};
 }
}
