/* AVO Affine Surfaces: application-local adaptive coordinate grids.
   Three.js native primitives; no shared AVO Core changes.
   Each panel's grid and camera fit follow its own displayed geometry.
   Manual mode applies the SAME symmetric coordinate extents to all panels.
   Input bounds used for numerical sampling remain independent. */
import * as THREE from 'three';
import {setupSurface,affine,display,visible,implicitEquationTexts,solveIsolatedPoints,coordinateTimeEquations,parameterValues} from './math.js?v=01n';
const EPS=1e-8;
const axes=['X','Y','Z'];
const near=(a,b)=>Math.abs(a-b)<1e-8;
function ceilingNice(v){
 const n=Math.max(0.3,Math.min(99999,Number(v)||3));
 const ten=10**Math.floor(Math.log10(n));
 for(const choice of [1,1.25,1.5,2,2.5,3,4,5,7.5,10])if(choice*ten>=n-EPS)return choice*ten;
 return 10*ten;
}
function tickValues(ext){
 const step=ceilingNice(ext/3.5),n=Math.floor(ext/step+EPS);
 return Array.from({length:2*n+1},(_,i)=> (i-n)*step);
}
function makeSegments(points,color,opacity,group){
 const geom=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));
 const mat=new THREE.LineBasicMaterial({color,transparent:true,opacity,depthTest:false,depthWrite:false});
 const line=new THREE.LineSegments(geom,mat);group.add(line);
}
function drawGrid(group,r){
 const [a,b,c]=r;
 const edges=[];
 // XY on z=-c; XZ on y=+b; YZ on x=-a: three calibrated planes.
 for(const x of tickValues(a)){
  edges.push([x,-b,-c],[x,b,-c]);
  edges.push([x,b,-c],[x,b,c]);
 }
 for(const y of tickValues(b)){
  edges.push([-a,y,-c],[a,y,-c]);
  edges.push([-a,y,-c],[-a,y,c]);
 }
 for(const z of tickValues(c)){
  edges.push([-a,b,z],[a,b,z]);
  edges.push([-a,-b,z],[-a,b,z]);
 }
 // Outer edges, even when the last calibrated tick is smaller than the boundary.
 for(const x of [-a,a]){edges.push([x,-b,-c],[x,b,-c]);edges.push([x,b,-c],[x,b,c]);}
 for(const y of [-b,b]){edges.push([-a,y,-c],[a,y,-c]);edges.push([-a,y,-c],[-a,y,c]);}
 for(const z of [-c,c]){edges.push([-a,b,z],[a,b,z]);edges.push([-a,-b,z],[-a,b,z]);}
 makeSegments(edges,0x9cb0c0,0.49,group);
 for(const [k,color] of [[0,0xe1333c],[1,0x987448],[2,0x64a524]]){
  const low=[0,0,0],high=[0,0,0];low[k]=-r[k];high[k]=r[k];
  makeSegments([low,high],color,1,group);
 }
}
function renderLabels(view,r){
 const ctx=view.axisCtx,w=view.root.clientWidth,h=view.root.clientHeight;
 if(!ctx||w<90||h<90)return;
 ctx.clearRect(0,0,w,h);
 const camera=view.camera;const point=new THREE.Vector3();
 const project=p=>{point.set(...p).project(camera);return [(point.x+1)*w/2,(1-point.y)*h/2,point.z];};
 const reserve=[];
 function text(txt,pt,size=12,strong=false){
  const [x,y,z]=project(pt);
  if(z < -1 || z > 1 || x<12 || x>w-12 || y<12 || y>h-12)return;
  const bw=Math.max(16,String(txt).length*size*.67),bh=size+5;
  if(reserve.some(([xx,yy,ww,hh])=>Math.abs(xx-x)<(ww+bw)/2+3&&Math.abs(yy-y)<(hh+bh)/2+3))return;
  reserve.push([x,y,bw,bh]);ctx.font=`${strong?900:750} ${size}px system-ui,Arial,sans-serif`;
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.strokeText(String(txt),x,y);
  ctx.fillStyle=strong?'#152b40':'#273f55';ctx.fillText(String(txt),x,y);
 }
 for(let i=0;i<3;i++){
  const p=[0,0,0];p[i]=r[i]*1.03;text(axes[i],p,17,true);
 }
 const fmt=n=>String(Number(n.toPrecision(5)));
 for(const [i,values] of [[0,tickValues(r[0])],[1,tickValues(r[1])],[2,tickValues(r[2])]]){
  for(const v of values){
   // place annotations on actual rendered outer edges
   const pt=i===0?[v,-r[1],-r[2]]:i===1?[-r[0],v,-r[2]]:[-r[0],r[1],v];
   text(fmt(v),pt,11);
  }
 }
}
function boundsCorners(s){
 const b=s.bounds,coords=[[b.xmin,b.xmax],[b.ymin,b.ymax],[b.zmin,b.zmax]];
 return Array.from({length:8},(_,i)=>coords.map((range,j)=>range[(i>>j)&1]));
}
function shapeSamples(s){
 if(s.shape==='time'){
  if(s.timeMode==='coordinates'){
   const fn=coordinateTimeEquations(s.timeEquations),times=parameterValues(s);
   return times.map(t=>fn.evaluate(t)).filter(visible);
  }
  return boundsCorners(s); // safe envelope for time-dependent implicit surfaces
 }
 if(s.shape==='implicit'){
  const count=implicitEquationTexts(s.implicit).length;
  if(count===3){const pts=solveIsolatedPoints(s);return pts.length?pts:boundsCorners(s);}
  if(count===2)return boundsCorners(s); // independent of numerical topology
 }
 let parts=setupSurface(s),points=[];
 for(const patch of parts){
  const N= s.shape==='implicit'?13:11;
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){
   const u=patch.u0+(patch.u1-patch.u0)*i/N,v=patch.v0+(patch.v1-patch.v0)*j/N;
   const values=patch.eval(u,v);
   for(const p of values)if(visible(p))points.push(p);
  }
 }
 return points.length?points:boundsCorners(s);
}
function extents(points){
 const r=[0,0,0];for(const p of points)if(visible(p))for(let k=0;k<3;k++)r[k]=Math.max(r[k],Math.abs(p[k]));
 return r.map(v=>ceilingNice(Math.max(3,v*1.08)));
}
export class AdaptiveGrids{
 constructor(app){
  this.app=app;this.layers=[];
  for(const id of ['input','transform','output']){
   const view=app.pictures.get(id)?.view;if(!view)continue;
   const group=new THREE.Group();view.scene.add(group);
   view.staticGroup.visible=false; // Hide only this view's inherited ±3 grid.
   const layer={id,view,group,r:[0,0,0]};this.layers.push(layer);
   // Use the existing Core annotation canvas; replace its HARD-CODED ±3 labels
   // on this application's instance only. No files in avo-core/v2 are altered.
   view.drawAxisLabels=()=>renderLabels(view,layer.r);
   const reset=view.resetView.bind(view);
   view.resetView=()=>{reset();this.fit(layer);};
  }
 }
 fit(layer){
  const {view,r}=layer;
  // Camera remains centered at the origin, and user zoom (radius) is preserved.
  const targetFit=Math.max(4.7,Math.max(...r)*1.13);
  view.fitHalf=targetFit;
  view.updateFrustum();view.render();
 }
 apply(s,A){
  let ranges;
  if(s.gridMode==='manual'){
   ranges=[s.gridX,s.gridY,s.gridZ].map(v=>Math.max(0.1,Math.min(99999,v)));
   for(const layer of this.layers)this.applyTo(layer,ranges);
   return;
  }
  const samples=shapeSamples(s);
  const input=samples.map(p=>display(p,s)).filter(visible);
  const output=samples.map(p=>display(affine(A,s.t,p),s)).filter(visible);
  const E=[[0,0,0],[1,0,0],[0,1,0],[0,0,1],[1,1,0],[1,0,1],[0,1,1],[1,1,1]];
  const transform=[...E.map(p=>A.map(row=>row.reduce((sum,v,k)=>sum+v*p[k],0))),s.t];
  const all={input:extents(input),output:extents(output),transform:extents(transform)};
  for(const layer of this.layers)this.applyTo(layer,all[layer.id]);
 }
 applyTo(layer,r){
  if(layer.r.every((v,i)=>near(v,r[i])))return;
  layer.r=r.slice();
  for(const child of [...layer.group.children]){
   layer.group.remove(child);child.geometry?.dispose();child.material?.dispose();
  }
  drawGrid(layer.group,layer.r);
  this.fit(layer);
 }
}
