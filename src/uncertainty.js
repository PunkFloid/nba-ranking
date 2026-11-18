export const UNCERTAINTY_RULE='evidence-aware-v2';
// Display heuristic; numerical uncertainty used by pair selection is unchanged.
export function uncertaintyRelations(order,scores,variance,pairs,size=30){
 const support=Array.from({length:size},()=>Array(size).fill(0));
 for(const [a,b,w]of pairs)if(w>=.25)support[a][b]+=w;
 const reaches=Array.from({length:size},()=>Array(size).fill(false));
 for(let a=0;a<size;a++)for(let b=0;b<size;b++)if(a!==b){const forward=support[a][b],backward=support[b][a];reaches[a][b]=forward>=.75&&forward>=3*backward&&forward-backward>=.5;}
 for(let k=0;k<size;k++)for(let a=0;a<size;a++)if(reaches[a][k])for(let b=0;b<size;b++)if(reaches[k][b])reaches[a][b]=true;
 const close=[];
 for(let i=1;i<order.length;i++){
  const a=order[i-1],b=order[i],forward=support[a][b],backward=support[b][a];
  const contested=Math.min(forward,backward)>=.25&&Math.max(forward,backward)<3*Math.min(forward,backward);
  const contrary=reaches[b][a]&&!reaches[a][b];
  const overlap=Math.abs(scores[a]-scores[b])<Math.sqrt(Math.max(0,variance(a,b)));
  if(contrary||(overlap&&(contested||!reaches[a][b]||reaches[b][a])))close.push([a,b]);
 }
 return close;
}
export function uncertainNeighbors(...args){return new Set(uncertaintyRelations(...args).flat());}
