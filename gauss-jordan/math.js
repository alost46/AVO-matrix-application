(function(){'use strict';
const EPS=1e-9;
function fmt(n){return Math.abs(n)<EPS?'0.00':Number(n).toFixed(2);}
function rrefSteps(input){
 const M=input.map(r=>r.slice()), steps=[{matrix:M.map(r=>r.slice()),ops:[],pivot:null}], pivots=[];
 let row=0;
 for(let col=0;col<3;col++){
  const ops=[];let best=row;
  if(row>=3){steps.push({matrix:M.map(r=>r.slice()),ops:['skip'],pivot:null});continue;}
  for(let r=row+1;r<3;r++)if(Math.abs(M[r][col])>Math.abs(M[best][col]))best=r;
  if(Math.abs(M[best][col])<EPS){ops.push('zero');steps.push({matrix:M.map(r=>r.slice()),ops,pivot:null});continue;}
  if(best!==row){[M[row],M[best]]=[M[best],M[row]];ops.push(`R${row+1} ↔ R${best+1}`);}
  const v=M[row][col];if(Math.abs(v-1)>EPS){for(let j=0;j<4;j++)M[row][j]/=v;ops.push(`R${row+1} ← R${row+1} / (${fmt(v)})`);}
  for(let r=0;r<3;r++)if(r!==row){const k=M[r][col];if(Math.abs(k)>EPS){for(let j=0;j<4;j++)M[r][j]-=k*M[row][j];ops.push(`R${r+1} ← R${r+1} − (${fmt(k)}) R${row+1}`);}}
  pivots.push(col);row++;
  steps.push({matrix:M.map(r=>r.map(x=>Math.abs(x)<EPS?0:x)),ops,pivot:[row-1,col]});
 }
 const inconsistent=M.some(r=>r.slice(0,3).every(x=>Math.abs(x)<EPS)&&Math.abs(r[3])>=EPS);
 let solution=null;
 if(!inconsistent&&pivots.length===3){solution=[0,0,0];pivots.forEach((c,i)=>solution[c]=M[i][3]);}
 const free=[0,1,2].filter(c=>!pivots.includes(c));
 const base=[0,0,0];pivots.forEach((c,i)=>base[c]=M[i][3]);
 const directions=free.map(f=>{const v=[0,0,0];v[f]=1;pivots.forEach((c,i)=>v[c]=-M[i][f]);return v;});
 return {steps,pivots,rank:pivots.length,inconsistent,solution,free,base,directions};
}
window.AVOGaussMath={rrefSteps};
})();
