/* Math-facing geometry descriptor generator. Pure JS, safe for headless tests. */
const colors=[0xf02a28,0xc6a77d,0x80c92f];
export function matrixGeometry(matrix,matrixId=null){
 const points=[],lines=[],handles=[],faces=[];
 const ends=[];
 for(let c=0;c<3;c++){
  const p=[matrix[0][c],matrix[1][c],matrix[2][c]],color=colors[c];ends.push(p);
  points.push({id:`column-${c}`,xyz:p,color});lines.push({from:[0,0,0],to:p,color});
  if(matrixId)handles.push({id:`${matrixId}-col-${c}`,position:p,color,binding:{type:'matrixColumn',matrixId,column:c}});
 }
 // Plane through the three column endpoints, if uniquely determined.
 const [a,b,c]=ends,u=b.map((x,i)=>x-a[i]),v=c.map((x,i)=>x-a[i]);
 const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
 if(Math.hypot(...normal)>1e-8){
  const center=[0,1,2].map(i=>(a[i]+b[i]+c[i])/3);
  const U=u.map(x=>x/Math.hypot(...u)*2.2),V=v.map(x=>x/Math.hypot(...v)*2.2);
  const at=(s,t)=>center.map((x,i)=>x+s*U[i]+t*V[i]);
  faces.push({vertices:[at(-1,-1),at(1,-1),at(1,1),at(-1,1)],color:0xeeb51d});
  for(let i=0;i<=6;i++){const t=-1+i/3;
   lines.push({from:at(t,-1),to:at(t,1),color:0xe9ad20});
   lines.push({from:at(-1,t),to:at(1,t),color:0xe9ad20});
  }
 }
 return {points,lines,faces,handles};
}
