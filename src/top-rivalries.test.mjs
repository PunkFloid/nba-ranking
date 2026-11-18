import test from 'node:test';
import assert from 'node:assert/strict';
import {rivalryScore,topRivalries,drawTopRivalries} from './top-rivalries.js';
const teams=[['A','Team A'],['B','Team B'],['C','Team C'],['D','Team D']];let seq=0;
const pair=(a,b,w,l)=>[...Array.from({length:w},()=>[a,b]),...Array.from({length:l},()=>[b,a])].map(([winner,loser])=>({id:String(++seq),winner,loser,answered_at:new Date(Date.UTC(2026,10,18)+seq*1000).toISOString()}));
test('Balanced score equals the number of votes',()=>{assert.equal(rivalryScore(1,1),2);assert.equal(rivalryScore(5,5),10);});
test('Repeated close rivalry beats a single split',()=>assert.ok(rivalryScore(10,9)>rivalryScore(1,1)));
test('Many one-sided votes cannot dominate a balanced pair',()=>assert.ok(rivalryScore(100,1)<rivalryScore(1,1)));
test('Volume helps a sufficiently balanced pair',()=>assert.ok(rivalryScore(6,4)>rivalryScore(2,2)));
test('Both sides must have won',()=>{assert.equal(rivalryScore(10,0),0);assert.deepEqual(topRivalries(pair('A','B',10,0),teams),[]);});
test('A one-to-one pair is eligible immediately',()=>{const r=topRivalries(pair('A','B',1,1),teams);assert.equal(r.length,1);assert.equal(r[0].total,2);});
test('Each pair appears only once',()=>{const result=topRivalries(pair('A','B',5,4),teams);assert.equal(result.length,1);assert.deepEqual([result[0].first,result[0].second],[0,1]);});
test('Selects only the highest three scores',()=>{const rows=[...pair('A','B',10,9),...pair('A','C',5,5),...pair('B','C',2,2),...pair('A','D',100,1)];const r=topRivalries(rows,teams);assert.deepEqual(r.map(x=>[x.first,x.second]),[[0,1],[0,2],[1,2]]);});
test('All-time and last-five records preserve the displayed orientation',()=>{const r=topRivalries(pair('B','A',4,2),teams)[0];assert.deepEqual([r.wins,r.losses,r.recentWins,r.recentLosses,r.recentCount],[2,4,2,3,5]);});
test('Duplicate IDs do not inflate rivalry scores',()=>{const rows=pair('A','B',1,1);assert.equal(topRivalries([...rows,...rows],teams)[0].total,2);});
test('Invalid rows cannot create a rivalry',()=>{const r=pair('A','B',1,0);r.push(null,{id:'bad',winner:'B',loser:'A',answered_at:'bad'});assert.deepEqual(topRivalries(r,teams),[]);});
test('Input arrays and objects remain unchanged',()=>{const rows=pair('A','B',2,1),before=JSON.stringify(rows);rows.forEach(Object.freeze);Object.freeze(rows);topRivalries(rows,teams);assert.equal(JSON.stringify(rows),before);});
test('Equal scores prefer better balance',()=>{const rows=[...pair('A','B',2,6),...pair('A','C',1,1)];assert.equal(topRivalries(rows,teams)[0].second,2);});
class El{constructor(tag){this.tag=tag;this.children=[];this.textContent='';}append(e){this.children.push(e);}setAttribute(k,v){this[k]=v;}}
const all=e=>[e,...e.children.flatMap(all)];
function draw(rows=pair('A','B',1,1),disabled=false,parent=new El('div')){const previous=globalThis.document,calls=[];globalThis.document={createElement:t=>new El(t)};try{const section=drawTopRivalries(parent,{rows,teams,disabled,onCompare:p=>calls.push(p)});return {parent,section,calls};}finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}}
test('Category is a separate initially collapsed details element',()=>{const {section}=draw();assert.equal(section.tag,'details');assert.equal(section.open,false);assert.equal(section.children[0].tag,'summary');assert.equal(section.children[0].textContent,'Top 3 rivalries');});
test('An empty category shows a concise empty state',()=>assert.ok(all(draw([]).section).some(e=>e.textContent==='Zatím žádné rivality.')));
test('Less than five votes show the actual count',()=>assert.ok(all(draw().section).some(e=>e.textContent==='Poslední 2: 1:1')));
test('Compare opens exactly the displayed pair without voting',()=>{const {section,calls}=draw();all(section).find(e=>e.tag==='button').onclick();assert.deepEqual(calls,[[0,1]]);});
test('Disabled action cannot open a pair',()=>{const {section,calls}=draw(undefined,true);all(section).find(e=>e.tag==='button').onclick();assert.equal(calls.length,0);});
test('Expanded state survives rendering again',()=>{const first=draw();first.section.open=true;first.section.ontoggle();first.parent.children=[];assert.equal(draw(undefined,false,first.parent).section.open,true);});
