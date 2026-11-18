import test,{beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {teamSummary,unclearNeighbors,attachTeamDetail,drawTeamRanking} from './team-details.js';
import {fitRanking} from './ranking.js';
const teams=[['A','Team A'],['B','Team B'],['C','Team C'],['D','Team D']],now=Date.UTC(2026,10,18);
const row=(id,winner,loser,time=now)=>({id,winner,loser,answered_at:new Date(time).toISOString()});
class El{
 constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attrs={};this.dataset={};this.style={setProperty(){}};this.className='';this._text='';}
 set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
 append(...nodes){for(const n of nodes){this.children.push(n);n.parent=this;}}
 setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k];}
 querySelectorAll(s){const match=e=>s[0]==='.'?e.className.split(' ').includes(s.slice(1)):s==='[data-stats-toggle]'?e.dataset.statsToggle!==undefined:e.tagName===s.toUpperCase();return this.children.flatMap(c=>[...(match(c)?[c]:[]),...c.querySelectorAll(s)]);}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}remove(){this.parent.children=this.parent.children.filter(c=>c!==this);}
}
let originalDocument;
beforeEach(()=>{originalDocument=globalThis.document;globalThis.document={createElement:t=>new El(t),createTextNode:t=>{const e=new El('#text');e.textContent=t;return e;}};});
afterEach(()=>{if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;});
const fixture=(disabled=false)=>{const wrap=new El('div'),panel=new El('div');panel.className='vote-stats';wrap.append(panel);const calls=[];attachTeamDetail(wrap,{team:teams[0],teams,summary:teamSummary([row('1','A','B'),row('2','A','B'),row('3','B','A')],teams,'A'),neighbors:['C'],disabled,onCompare:p=>calls.push(p)});return {wrap,panel,calls};};
test('Counts and percentage',()=>{const s=teamSummary([row('1','A','B'),row('2','A','C'),row('3','D','A')],teams,'A');assert.deepEqual([s.wins,s.losses,s.percentage],[2,1,67]);});
test('Empty percentage',()=>assert.equal(teamSummary([],teams,'A').percentage,null));
test('Zero percent',()=>assert.equal(teamSummary([row('1','B','A')],teams,'A').percentage,0));
test('Duplicate IDs',()=>{const r=row('same','A','B');assert.equal(teamSummary([r,r],teams,'A').wins,1);});
test('Invalid rows',()=>{const rows=[null,row('1','A','A'),row('2','A','X'),{...row('3','A','B'),answered_at:'bad'},row('4','B','A')];assert.equal(teamSummary(rows,teams,'A').losses,1);assert.equal(teamSummary(rows,teams,'A').wins,0);});
test('Tied opponent',()=>{const s=teamSummary([row('1','A','B'),row('2','B','A')],teams,'A');assert.equal(s.preferred.length+s.lessPreferred.length,0);});
test('Opponent orientation',()=>{const s=teamSummary([row('1','A','B'),row('2','B','A'),row('3','B','A')],teams,'A');assert.deepEqual(s.lessPreferred.map(x=>[x.code,x.wins,x.losses]),[['B',1,2]]);});
test('Exact uncertain neighbors',()=>{const m={order:[0,1,2,3],s:[4,3.9,0,-.1],variance:()=>1,now};const result=unclearNeighbors([],teams,m);assert.deepEqual(result.get('B'),['A']);assert.deepEqual(result.get('C'),['D']);});
test('Consistent paths',()=>{const m={order:[0,1,2],s:[.3,.2,.1,0],variance:()=>1,now};const result=unclearNeighbors([row('1','A','B'),row('2','B','C')],teams,m);assert.ok([...result.values()].every(x=>x.length===0));});
test('Old raw counts',()=>{const r=row('old','A','B',now-400*86400000);assert.equal(teamSummary([r],teams,'A').wins,1);const m={order:[0,1],s:[.2,0,0,0],variance:()=>1,now};assert.deepEqual(unclearNeighbors([r],teams,m).get('A'),['B']);});
test('No self-comparison',()=>{const {panel}=fixture();const select=panel.querySelector('select');assert.ok(!select.children.some(o=>o.value==='A'));assert.equal(panel.querySelector('.detail-compare').querySelector('button').disabled,true);});
test('Preview does not vote',()=>{const {panel,calls}=fixture(),select=panel.querySelector('select');select.value='B';select.onchange();assert.match(panel.querySelector('.head-to-head').textContent,/2 : 1/);assert.equal(calls.length,0);});
test('Open selected pair',()=>{const {panel,calls}=fixture(),select=panel.querySelector('select');select.value='B';select.onchange();panel.querySelector('.detail-compare').querySelector('button').onclick();assert.deepEqual(calls,[[0,1]]);});
test('Open unresolved pair',()=>{const {panel,calls}=fixture();panel.querySelector('.detail-neighbors').querySelector('button').onclick();assert.deepEqual(calls,[[0,2]]);});
test('Disabled actions',()=>{const {panel,calls}=fixture(true);panel.querySelector('.detail-neighbors').querySelector('button').onclick();const select=panel.querySelector('select');select.value='B';select.onchange();panel.querySelector('.detail-compare').querySelector('button').onclick();assert.equal(calls.length,0);});
test('Unknown opponent',()=>{const {panel,calls}=fixture(),select=panel.querySelector('select');select.value='X';select.onchange();panel.querySelector('.detail-compare').querySelector('button').onclick();assert.equal(calls.length,0);});
test('Rank order and expansion',()=>{const all=Array.from({length:30},(_,i)=>['T'+i,'Team '+i]),rows=[];for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)rows.push(row(a+':'+b,'T'+a,'T'+b));rows.push(row('extra1','T0','T1'),row('extra2','T2','T3'));const m=fitRanking(rows,all,now),root=new El('section'),before=JSON.stringify(m.order);let expanded;drawTeamRanking(root,{teams:all,m,rows,history:[],expanded:'T0',onToggle:c=>{expanded=c;},onCompare:()=>{}});assert.equal(root.querySelectorAll('.team-stat-item').length,30);assert.equal(root.querySelectorAll('.vote-stats').filter(p=>!p.hidden).length,1);assert.equal(JSON.stringify(m.order),before);root.querySelectorAll('.rank-card')[1].onclick();assert.equal(root.querySelectorAll('.vote-stats').filter(p=>!p.hidden).length,1);assert.equal(expanded,'T1');});
