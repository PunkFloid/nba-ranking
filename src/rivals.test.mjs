import test from 'node:test';
import assert from 'node:assert/strict';
import {teamRivals,renderRivals} from './rivals.js';
const teams=[['A','Team A'],['B','Team B'],['C','Team C']],base=Date.UTC(2026,10,18);
const vote=(id,winner='A',loser='B',time=base+Number(id)*1000)=>({id:String(id),winner,loser,answered_at:new Date(time).toISOString()});
test('Empty data and unknown team have no rivals',()=>{assert.deepEqual(teamRivals([],teams,'A'),[]);assert.deepEqual(teamRivals([vote(1)],teams,'X'),[]);});
test('One vote and unanimous votes are not rivalries',()=>{assert.equal(teamRivals([vote(1)],teams,'A').length,0);assert.equal(teamRivals([vote(1),vote(2)],teams,'A').length,0);});
test('One to one immediately qualifies',()=>{const r=teamRivals([vote(1),vote(2,'B','A')],teams,'A')[0];assert.deepEqual([r.wins,r.losses,r.recentWins,r.recentLosses,r.recentCount],[1,1,1,1,2]);});
test('Both directions qualify without an extra balance threshold',()=>{const rows=Array.from({length:20},(_,i)=>vote(i+1));rows.push(vote(21,'B','A'));assert.equal(teamRivals(rows,teams,'A').length,1);});
test('Counts are from the opened team perspective',()=>{const rows=[vote(1),vote(2),vote(3,'B','A')],r=teamRivals(rows,teams,'B')[0];assert.deepEqual([r.code,r.wins,r.losses],['A',1,2]);});
test('Last five means this pair only, not the last five overall',()=>{const rows=[vote(1),vote(2,'B','A'),vote(3),vote(4),vote(5,'B','A'),vote(6,'B','A'),vote(7,'A','C'),vote(8,'A','C'),vote(9,'A','C')],r=teamRivals(rows,teams,'A')[0];assert.deepEqual([r.wins,r.losses,r.recentWins,r.recentLosses,r.recentCount],[3,3,2,3,5]);});
test('Timestamp ordering works for shuffled input',()=>{const rows=[vote(1),vote(2),vote(3,'B','A'),vote(4,'B','A'),vote(5,'B','A'),vote(6,'B','A')];assert.deepEqual(teamRivals([...rows].reverse(),teams,'A'),teamRivals(rows,teams,'A'));assert.equal(teamRivals(rows,teams,'A')[0].recentWins,1);});
test('Duplicate queue and saved rows count once',()=>{const a=vote(1),b=vote(2,'B','A');assert.equal(teamRivals([a,a,b,b],teams,'A')[0].recentCount,2);});
test('Invalid and unrelated rows do not create rivals',()=>{const rows=[null,vote(1),vote(2,'A','A'),vote(3,'X','A'),vote(4,'B','C'),{...vote(5,'B','A'),answered_at:'bad'}];assert.deepEqual(teamRivals(rows,teams,'A'),[]);});
test('Recent balance sorts ahead of overall balance',()=>{const rows=[vote(1),vote(2,'B','A'),vote(3,'A','C'),vote(4,'C','A'),vote(5,'A','C')];assert.deepEqual(teamRivals(rows,teams,'A').map(r=>r.code),['B','C']);});
test('Overall balance breaks equal recent balance',()=>{const rows=[vote(1),vote(2,'B','A'),vote(3),vote(4,'B','A'),vote(5),vote(6,'A','C'),vote(7,'A','C'),vote(8,'A','C'),vote(9,'A','C'),vote(10,'A','C'),vote(11,'C','A'),vote(12,'C','A')];assert.deepEqual(teamRivals(rows,teams,'A').map(r=>r.code),['B','C']);});
test('Equal timestamps have stable results',()=>{const rows=Array.from({length:7},(_,i)=>vote(i+1,i%2?'B':'A',i%2?'A':'B',base));assert.deepEqual(teamRivals(rows,teams,'A'),teamRivals([...rows].reverse(),teams,'A'));});
test('Input rows are never modified',()=>{const rows=[vote(1),vote(2,'B','A')],before=JSON.stringify(rows);rows.forEach(Object.freeze);Object.freeze(rows);teamRivals(rows,teams,'A');assert.equal(JSON.stringify(rows),before);});
class El{constructor(tag){this.tag=tag;this.children=[];this.textContent='';}append(e){this.children.push(e);}setAttribute(k,v){this[k]=v;}}
function render(disabled=false,rows=[vote(1),vote(2,'B','A')]){const previous=globalThis.document,calls=[],parent=new El('div');globalThis.document={createElement:t=>new El(t)};try{renderRivals(parent,{code:'A',teams,rivals:teamRivals(rows,teams,'A'),disabled,onCompare:p=>calls.push(p)});}finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}return {parent,calls};}
const flatten=e=>[e,...e.children.flatMap(flatten)];
test('No qualifying rival means no empty section',()=>assert.equal(render(false,[vote(1)]).parent.children.length,0));
test('Two votes show actual count and totals, no vote timeline',()=>{const nodes=flatten(render().parent),text=nodes.map(n=>n.textContent).join(' ');assert.match(text,/Celkem: 1:1/);assert.match(text,/Poslední 2: 1:1/);assert.ok(!text.includes('Posledních 5'));});
test('Five recent votes have the correct label',()=>{const rows=[vote(1),vote(2),vote(3),vote(4,'B','A'),vote(5,'B','A'),vote(6)];assert.ok(flatten(render(false,rows).parent).some(n=>n.textContent==='Posledních 5: 3:2'));});
test('Compare opens the rival pair without recording a vote',()=>{const {parent,calls}=render();flatten(parent).find(n=>n.tag==='button').onclick();assert.deepEqual(calls,[[0,1]]);});
test('Disabled comparison cannot fire',()=>{const {parent,calls}=render(true);flatten(parent).find(n=>n.tag==='button').onclick();assert.equal(calls.length,0);});
test('Rivals do not shadow the existing manual comparison selector',()=>{const section=render().parent.children[0];assert.ok(section.className.split(' ').includes('team-rivals'));assert.ok(!section.className.split(' ').includes('detail-compare'));});
