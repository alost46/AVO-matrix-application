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
 // Finite grid on the exact affine plane determined by all three endpoints.
 // Project into an ORTHONORMAL basis and extend the displayed patch beyond
 // all three endpoints, including when the triangle is narrow/skewed.
 const [a,b,c]=ends;
 const sub=(p,q)=>p.map((v,i)=>v-q[i]);
 const cross=(u,v)=>[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
 const dot=(u,v)=>u.reduce((sum,x,i)=>sum+x*v[i],0);
 const u=sub(b,a),v=sub(c,a),n=cross(u,v),normalLength=Math.hypot(...n);
 // A nearly collinear triple does not define a unique plane.
 if(normalLength>1e-8){
  const e1=u.map(x=>x/Math.hypot(...u)),eN=n.map(x=>x/normalLength),e2=cross(eN,e1);
  const center=[0,1,2].map(i=>(a[i]+b[i]+c[i])/3);
  const projected=ends.map(p=>[dot(sub(p,center),e1),dot(sub(p,center),e2)]);
  const bounds=[0,1].map(k=>{
   const low=Math.min(...projected.map(p=>p[k])),high=Math.max(...projected.map(p=>p[k]));
   const margin=Math.max(.45,(high-low)*.2);
   const middle=(low+high)/2,half=Math.max(1.5,(high-low)/2+margin);
   return [middle-half,middle+half];
  });
  const at=(s,t)=>center.map((x,i)=>x+s*e1[i]+t*e2[i]);
  const [[u0,u1],[v0,v1]]=bounds;
  faces.push({vertices:[at(u0,v0),at(u1,v0),at(u1,v1),at(u0,v1)],color:0xeeb51d});
  for(let i=0;i<=10;i++){
   const s=u0+(u1-u0)*i/10,t=v0+(v1-v0)*i/10;
   lines.push({from:at(s,v0),to:at(s,v1),color:0xe9ad20});
   lines.push({from:at(u0,t),to:at(u1,t),color:0xe9ad20});
  }
 }
 return {points,lines,faces,handles};
}
