import {rankCard,stats,weeklyMovement} from './presentation.js';
import {manualPair,expandableStats} from './interactions.js';
import {uncertaintyRelations} from './uncertainty.js';
const DAY=86400000;
const add=(parent,tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;parent.append(e);return e;};
function validAnswers(rows,teams){const codes=new Set(teams.map(t=>t[0])),unique=new Map();for(const r of rows)if(r&&typeof r.id==='string'&&r.id)unique.set(r.id,r);return [...unique.values()].filter(r=>codes.has(r.winner)&&codes.has(r.loser)&&r.winner!==r.loser&&Number.isFinite(Date.parse(r.answered_at)));}
export function teamSummary(rows,teams,code){
 const opponents=new Map(teams.filter(t=>t[0]!==code).map(([code,name])=>[code,{code,name,wins:0,losses:0}]));let wins=0,losses=0;
 for(const r of validAnswers(rows,teams)){if(r.winner===code){wins++;opponents.get(r.loser).wins++;}else if(r.loser===code){losses++;opponents.get(r.winner).losses++;}}
 const all=[...opponents.values()],sort=(a,b)=>Math.abs(b.wins-b.losses)-Math.abs(a.wins-a.losses)||(b.wins+b.losses)-(a.wins+a.losses)||a.code.localeCompare(b.code,'en');
 return {wins,losses,percentage:wins+losses?Math.round(100*wins/(wins+losses)):null,opponents:all,preferred:all.filter(x=>x.wins>x.losses).sort(sort).slice(0,3),lessPreferred:all.filter(x=>x.losses>x.wins).sort(sort).slice(0,3)};
}
export function unclearNeighbors(rows,teams,m){
 const ids=new Map(teams.map((t,i)=>[t[0],i])),pairs=validAnswers(rows,teams).map(r=>[ids.get(r.winner),ids.get(r.loser),2**(-Math.max(0,m.now-Date.parse(r.answered_at))/(56*DAY))]);
 const result=new Map(teams.map(t=>[t[0],[]]));
 for(const [a,b]of uncertaintyRelations(m.order,m.s,m.variance,pairs,teams.length)){result.get(teams[a][0]).push(teams[b][0]);result.get(teams[b][0]).push(teams[a][0]);}
 return result;
}
export function attachTeamDetail(wrap,{team,teams,summary,neighbors=[],onCompare,disabled=false}){
 const panel=wrap.querySelector('.vote-stats'),body=add(panel,'div');body.className='team-detail-body';const code=team[0];
 add(body,'p',summary.percentage===null?'Zatím bez hlasování.':`Podíl výher v hlasování: ${summary.percentage} %`);
 for(const [label,list]of [['Častěji před',summary.preferred],['Častěji za',summary.lessPreferred]]){const p=add(body,'p',label+': ');if(!list.length)p.append(document.createTextNode('—'));else list.forEach((o,i)=>{if(i)p.append(document.createTextNode(', '));const span=add(p,'span',`${o.code} (${o.wins}:${o.losses})`);span.title=`${o.name}: ${o.wins}W ${o.losses}L`;});}
 if(neighbors.length){const section=add(body,'div');section.className='detail-neighbors';add(section,'p','Nejasné pořadí');for(const other of neighbors){const b=add(section,'button',`Porovnat ${code} / ${other}`);b.type='button';b.disabled=disabled;b.onclick=()=>{if(!disabled)onCompare(manualPair(code,other,teams));};}}
 const compare=add(body,'div');compare.className='detail-compare';const label=add(compare,'label','Porovnat s…'),select=add(label,'select');select.setAttribute('aria-label',`Porovnat ${team[1]} s jiným týmem`);select.disabled=disabled;const blank=add(select,'option','Vyber druhý tým');blank.value='';for(const [other,name]of teams)if(other!==code){const o=add(select,'option',name);o.value=other;}select.value='';
 const preview=add(compare,'p');preview.className='head-to-head';preview.setAttribute('aria-live','polite');const start=add(compare,'button','Otevřít porovnání');start.type='button';start.disabled=true;
 select.onchange=()=>{const other=summary.opponents.find(o=>o.code===select.value);start.disabled=disabled||!other;preview.textContent=!other?'':other.wins+other.losses?`Vzájemně ${code} : ${other.code} — ${other.wins} : ${other.losses}`:'Zatím bez vzájemného hlasování.';};
 start.onclick=()=>{if(disabled||!summary.opponents.some(o=>o.code===select.value))return;onCompare(manualPair(code,select.value,teams));};return wrap;
}
export function drawTeamRanking(c,{teams,m,rows,history,expanded,onToggle,onCompare,disabled=false}){
 add(c,'h2','Žebříček');stats(c,[[m.total,'odpovědí'],[`${m.seen}/${teams.length}`,'porovnávaných týmů'],[m.pending.length,'nezařazených']]);const neighbors=unclearNeighbors(rows,teams,m);
 const comparable=m.order.length===30&&m.order.every((i,k)=>weeklyMovement(history,30,teams[i][0],k+1)!==null);
 function append(i,rank,delta=null){const team=teams[i],related=neighbors.get(team[0]),note=related.length?'Nejisté vůči '+related.join(' / '):'',summary=teamSummary(rows,teams,team[0]),card=rankCard(team,rank,note,delta);if(!note)card.querySelector('small')?.remove();const wrap=expandableStats(card,team,summary,expanded===team[0],c,open=>onToggle(open?team[0]:null));c.append(attachTeamDetail(wrap,{team,teams,summary,neighbors:related,onCompare,disabled}));}
 if(m.order.length){add(c,'h2',`Pořadí mezi ${m.order.length} týmy`);if(comparable)add(c,'p','Proti týdnu od '+new Date(history.at(-1).week_start+'T12:00:00').toLocaleDateString('cs-CZ',{day:'numeric',month:'numeric',year:'numeric'}));m.order.forEach((i,k)=>append(i,`${k+1}.`,comparable?weeklyMovement(history,30,teams[i][0],k+1):null));}else add(c,'p','Zatím bez pořadí.');
 if(m.pending.length){add(c,'h2',`Nezařazené (${m.pending.length})`);m.pending.forEach(i=>append(i,'-.'));}
}
