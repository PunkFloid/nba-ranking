import {teamRivals} from './rivals.js';
// Volume multiplied by squared balance; a balanced pair scores its vote count.
export const rivalryScore=(wins,losses)=>wins>0&&losses>0?4*Math.min(wins,losses)**2/(wins+losses):0;
export function topRivalries(rows,teams){
 const ids=new Map(teams.map((t,i)=>[t[0],i])),pairs=[];
 for(let first=0;first<teams.length;first++)for(const rival of teamRivals(rows,teams,teams[first][0])){
  const second=ids.get(rival.code);if(second<=first)continue;
  pairs.push({...rival,first,second,total:rival.wins+rival.losses,score:rivalryScore(rival.wins,rival.losses)});
 }
 return pairs.sort((a,b)=>b.score-a.score||Math.abs(a.wins-a.losses)/a.total-Math.abs(b.wins-b.losses)/b.total||b.total-a.total||a.first-b.first||a.second-b.second).slice(0,3);
}
const openState=new WeakMap();
export function drawTopRivalries(parent,{rows,teams,onCompare,disabled=false}){
 const add=(p,tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;p.append(e);return e;};
 const section=add(parent,'details');section.className='top-rivalries';section.open=openState.get(parent)||false;section.ontoggle=()=>openState.set(parent,section.open);
 add(section,'summary','Top 3 rivalries');const list=add(section,'div');list.className='top-rivalries-list team-detail-body';const top=topRivalries(rows,teams);
 if(!top.length)add(list,'p','Zatím žádné rivality.');
 top.forEach((r,i)=>{const a=teams[r.first],b=teams[r.second],item=add(list,'article');item.className='top-rivalry detail-neighbors';const title=add(item,'h3',`${i+1}. ${a[0]} / ${b[0]}`);title.title=`${a[1]} / ${b[1]}`;
  add(item,'p',`Celkem: ${r.wins}:${r.losses}`);add(item,'p',`${r.recentCount===5?'Posledních 5':'Poslední '+r.recentCount}: ${r.recentWins}:${r.recentLosses}`);
  const button=add(item,'button',`Porovnat ${a[0]} / ${b[0]}`);button.type='button';button.disabled=disabled;button.setAttribute('aria-label',`Porovnat ${a[1]} a ${b[1]}`);button.onclick=()=>{if(!button.disabled)onCompare([r.first,r.second]);};
 });return section;
}
