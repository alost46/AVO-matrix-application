/* AVO surfaces 01r. Progressively draw meshes in the EXISTING AVO Core Picture canvases.
   No changes to the common core and no replacement of its navigation/gestures. */
import * as THREE from 'three';
import {AdaptiveGrids} from './grid-scale.js?v=01r';
import {setupSurface,affine,display,visible,implicitEquationTexts,intersectionSlabs,solveIsolatedPoints,coordinateTimeEquations,parameterValues,timeImplicitAt} from './math.js?v=01r';
const nextFrame=()=>new Promise(done=>requestAnimationFrame(done));
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
export class SurfaceRenderer {
 constructor(app,onProgress){this.app=app;this.onProgress=onProgress;this.generation=0;this.layers=[];this.cameraStep=null;this.lastError=null;this.grids=new AdaptiveGrids(app);this.clickStart=null;this.pickRaycaster=new THREE.Raycaster();
  for(const id of ['input','output']){
   const view=app.pictures.get(id).view,group=new THREE.Group();view.scene.add(group);
   const surfaces=new THREE.BufferGeometry(),wires=new THREE.BufferGeometry(),dots=new THREE.BufferGeometry();
   const face=new THREE.Mesh(surfaces,new THREE.MeshBasicMaterial({color:id==='input'?0x137ca9:0x278a36,side:THREE.DoubleSide,transparent:true,opacity:.78,depthWrite:true,depthTest:true,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1}));
   const wire=new THREE.LineSegments(wires,new THREE.LineBasicMaterial({color:id==='input'?0xb1d8e8:0xbce7ae,transparent:true,opacity:.3,depthTest:true}));
   const point=new THREE.Points(dots,new THREE.PointsMaterial({color:id==='input'?0x126395:0x266c32,size:1.4,sizeAttenuation:false,transparent:true,opacity:.16,depthTest:true}));
   // Independent characteristic lines: silhouettes, cylinder generators / circular rims, etc.
   const characteristic=new THREE.BufferGeometry();
   const ink=new THREE.LineSegments(characteristic,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.98,depthTest:true}));
   ink.renderOrder=9;
   const markGeom=new THREE.BufferGeometry();
   const marker=new THREE.Points(markGeom,new THREE.PointsMaterial({color:0xef2424,size:10,sizeAttenuation:false,depthTest:false,depthWrite:false}));
   marker.renderOrder=20; // Legacy red endpoints of parametric paths.
   const chosenGeom=new THREE.BufferGeometry();
   const chosenMaterial=new THREE.PointsMaterial({map:this.markerTexture(),size:20,sizeAttenuation:false,transparent:true,alphaTest:.2,depthTest:true,depthWrite:false});
   const chosen=new THREE.Points(chosenGeom,chosenMaterial);chosen.renderOrder=21;
   // Dynamic experiments: the moving point and its completed path are
   // geometry in the same 3-D coordinate system as the original object.
   // They keep depth testing, so a back-side point can be occluded.
   const trailGeom=new THREE.BufferGeometry();
   const trail=new THREE.LineSegments(trailGeom,new THREE.LineBasicMaterial({color:0xe71921,transparent:false,depthTest:true,depthWrite:false}));
   trail.renderOrder=12;
   group.add(face,wire,point,ink,marker,trail,chosen);
   this.layers.push({id,view,group,surfaces,wires,dots,characteristic,markGeom,chosenGeom,trailGeom,face,ink,marker});
  }
  const canvas=this.layers[0].view.renderer.domElement;
  // Observe a short click/tap, but never hijack drag gestures, which belong to AVO Core.
  canvas.addEventListener('pointerdown',e=>{if(e.isPrimary&&e.button===0)this.clickStart={id:e.pointerId,x:e.clientX,y:e.clientY};});
  canvas.addEventListener('pointercancel',()=>{this.clickStart=null;});
  canvas.addEventListener('pointerup',e=>{
   const start=this.clickStart;this.clickStart=null;
   if(!start||start.id!==e.pointerId||Math.hypot(e.clientX-start.x,e.clientY-start.y)>8)return;
   const hit=this.pickAt(e.clientX,e.clientY);
   if(hit)this.selectSourcePoint(hit,true);
  });
 }
 markerTexture(){
  if(this.selectedTexture)return this.selectedTexture;
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
  const ctx=canvas.getContext('2d');ctx.beginPath();ctx.arc(32,32,27,0,Math.PI*2);
  ctx.fillStyle='#ffffff';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#111111';ctx.stroke();
  ctx.beginPath();ctx.arc(32,32,20,0,Math.PI*2);ctx.fillStyle='#e71921';ctx.fill();
  ctx.beginPath();ctx.arc(32,32,20,0,Math.PI*2);ctx.strokeStyle='#7a0b10';ctx.lineWidth=2;ctx.stroke();
  this.selectedTexture=new THREE.CanvasTexture(canvas);return this.selectedTexture;
 }
 clear(){for(const l of this.layers){for(const g of [l.surfaces,l.wires,l.dots,l.characteristic,l.markGeom,l.chosenGeom,l.trailGeom])g.setAttribute('position',new THREE.Float32BufferAttribute([],3));l.view.render();}}
 fill(arr,spec,data){const g=spec[data];g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(arr),3));g.computeBoundingSphere();}
 pushLine(list,a,b){if(visible(a)&&visible(b))list.push(...a,...b);}
 pushTri(list,a,b,c){if(visible(a)&&visible(b)&&visible(c))list.push(...a,...b,...c);}
 pickAt(clientX,clientY,geometryOnly=false){
  const layer=this.layers[0],view=layer.view,canvas=view.renderer.domElement,rect=canvas.getBoundingClientRect();
  if(!rect.width||!rect.height)return null;
  const nx=((clientX-rect.left)/rect.width)*2-1,ny=1-((clientY-rect.top)/rect.height)*2;
  if(Math.abs(nx)>1||Math.abs(ny)>1)return null;
  this.pickRaycaster.setFromCamera(new THREE.Vector2(nx,ny),view.camera);
  let hit=null;
  if(layer.surfaces.getAttribute('position')?.count>=3){
   const faces=this.pickRaycaster.intersectObject(layer.face,false);
   if(faces.length)hit=faces[0].point;
  }
  // If no surface mesh exists, the user may pick a drawn curve or a point.
  if(!hit&&!geometryOnly&&!(layer.surfaces.getAttribute('position')?.count>=3)){
   const worldPerPixel=(view.camera.top-view.camera.bottom)/rect.height;
   this.pickRaycaster.params.Line.threshold=Math.max(.02,12*worldPerPixel);
   const lines=this.pickRaycaster.intersectObject(layer.ink,false);
   if(lines.length)hit=lines[0].pointOnLine||lines[0].point;
   if(!hit){
    const points=layer.markGeom.getAttribute('position');let best=null;
    for(let i=0;i<(points?.count||0);i++){
     const v=new THREE.Vector3().fromBufferAttribute(points,i),p=v.clone().project(view.camera);
     const px=rect.left+(p.x+1)*rect.width/2,py=rect.top+(1-p.y)*rect.height/2;
     const dist=Math.hypot(px-clientX,py-clientY);
     if(dist<14&&(!best||dist<best.dist))best={v,dist};
    }
    if(best)hit=best.v;
   }
  }
  if(!hit)return null;
  const s=this.app.currentInputs();
  const modes=[s.scaleX,s.scaleY,s.scaleZ];
  const original=[hit.x,hit.y,hit.z].map((v,i)=>modes[i]==='log'?10**v:modes[i]==='symlog'?Math.sign(v)*(10**Math.abs(v)-1):v);
  return original.every(Number.isFinite)?original:null;
 }
 selectSourcePoint(p,manual){
  if(!p||!p.every(Number.isFinite))return;
  const app=this.app;
  if(manual)app.beginGesture();
  app.currentData.selectedPoint=p.map(Number);app.currentData.selectedActive=true;
  if(manual)app.finishGesture();else app.autosave();
  this.paintSelection();
 }
 paintSelection(){
  const s=this.app.currentInputs(),validSelection=s.selectedActive&&Array.isArray(s.selectedPoint)&&s.selectedPoint.length===3&&s.selectedPoint.every(Number.isFinite);
  const A=this.app.matrixFactory.getNumericMatrix('A',{x:0,y:0,z:0,t:0});
  for(let k=0;k<2;k++){
   const pt=validSelection?(k===0?s.selectedPoint:affine(A,s.t,s.selectedPoint)):null;
   const displayed=pt?display(pt,s):null;
   this.fill(visible(displayed)?displayed:[],this.layers[k],'chosenGeom');
   this.layers[k].view.render();
  }
 }
 chooseVisiblePoint(){
  const s=this.app.currentInputs();if(s.selectedActive||this.layers[0].surfaces.getAttribute('position')?.count<3)return;
  const canvas=this.layers[0].view.renderer.domElement,rect=canvas.getBoundingClientRect();
  for(const [x,y] of [[.5,.5],[.45,.5],[.55,.5],[.5,.4],[.5,.6],[.4,.4],[.6,.4],[.4,.6],[.6,.6],[.35,.5],[.65,.5]]){
   const hit=this.pickAt(rect.left+x*rect.width,rect.top+y*rect.height,true);
   if(hit){this.selectSourcePoint(hit,false);return;}
  }
 }
 async start(){this.lastError=null;const stamp=++this.generation,app=this.app,s=app.currentInputs(),A=app.matrixFactory.getNumericMatrix('A',{x:0,y:0,z:0,t:0});
  this.clear();for(const layer of this.layers)layer.group.children[3].material.color.setHex(0xffffff);const positions=[[],[]],lines=[[],[]],faces=[[],[]];
  try{
   this.grids.apply(s,A);
   if(s.shape==='time'){await this.drawParameterized(stamp,s,A);return;}
   if(s.shape==='implicit'){
    const count=implicitEquationTexts(s.implicit).length;
    if(count===3){this.drawIsolatedPoints(stamp,s,A);return;}
    if(count===2){await this.drawIntersection(stamp,s,A);return;}
   }
   const patches=setupSurface(s),globalN=s.stepMode==='auto'?40:null;
   const sparseOnly=!['explicit','implicit'].includes(s.shape);
   let expected=0,done=0,vertices=0;
   const plans=patches.map(p=>{
    const nu=globalN??Math.max(2,Math.ceil((p.u1-p.u0)/s.dx)),nv=globalN??Math.max(2,Math.ceil((p.v1-p.v0)/s.dy));
    if(!Number.isFinite(nu)||!Number.isFinite(nv)||nu*nv>32000||nu>360||nv>360)throw Error('Grid exceeds 32,000 samples per patch; increase DX or DY');
    expected+=nv+1;return {p,nu,nv};});
   // Draw low-density, high-contrast characteristic curves independently of sampling accuracy.
   // All curves are computed on the original surface and then transformed by A*p+t.
   if(!['explicit','implicit'].includes(s.shape)){
    const structural=[[],[]];
    const plotCurve=(patch,fixed,where,n=80)=>{
     let last=null;
     for(let i=0;i<=n;i++){
      const value=i/n,u=fixed==='u'?where:value,v=fixed==='v'?where:value;
      const pt=patch.eval(u,v)[0];if(!pt){last=null;continue;}
      const q=affine(A,s.t,pt),now=[display(pt,s),display(q,s)];
      if(last)for(let k=0;k<2;k++)this.pushLine(structural[k],last[k],now[k]);last=now;
     }
    };
    for(const patch of patches){
     if(/^cylinder-side$/.test(patch.name)){
      for(const where of [0,0.2,0.4,0.6,0.8])plotCurve(patch,'u',where,56);
     }else if(/^cylinder-(?:bottom|top)$/.test(patch.name)){
      plotCurve(patch,'v',1,96);
     }else if(/^cone-side$/.test(patch.name)){
      for(const where of [0,0.25,0.5,0.75])plotCurve(patch,'u',where,56);
     }else if(/^cone-bottom$/.test(patch.name)){
      plotCurve(patch,'v',1,96);
     }else if(/^frustum-side$/.test(patch.name)){
      for(const where of [0,0.25,0.5,0.75])plotCurve(patch,'u',where,56);
     }else if(/^frustum-(?:bottom|top)$/.test(patch.name)){
      plotCurve(patch,'v',1,96);
     }else if(/^(sphere|ellipsoid|hemi)$/.test(patch.name)){
      for(const where of [0,0.2,0.4,0.6,0.8])plotCurve(patch,'u',where,72);
      for(const where of [0.18,0.5,0.82])plotCurve(patch,'v',where,72);
     }else if(/^torus$/.test(patch.name)){
      for(const where of [0,0.25,0.5,0.75])plotCurve(patch,'u',where,96);
      for(const where of [0,0.25,0.5,0.75])plotCurve(patch,'v',where,96);
     }else if(/^paraboloid$/.test(patch.name)){
      for(const where of [0,0.25,0.5,0.75])plotCurve(patch,'u',where,72);
      for(const where of [0.3,0.6,1])plotCurve(patch,'v',where,72);
     }else if(/^pyramid/.test(patch.name)||/^box/.test(patch.name)){
      for(const fixed of ['u','v'])for(const where of [0,1])plotCurve(patch,fixed,where,20);
     }else{
      for(const fixed of ['u','v'])for(const where of [0,1])plotCurve(patch,fixed,where,20);
     }
    }
    for(let k=0;k<2;k++)this.fill(structural[k],this.layers[k],'characteristic');
   }
   const drawn=()=>{for(let k=0;k<2;k++){this.fill(faces[k],this.layers[k],'surfaces');this.fill(lines[k],this.layers[k],'wires');this.fill(positions[k],this.layers[k],'dots');}this.paintSelection();};
   for(const {p,nu,nv} of plans){let previous=null;
    for(let j=0;j<=nv;j++){
     if(stamp!==this.generation)return;
     const v=p.v0+(p.v1-p.v0)*j/nv,row=[];
     for(let i=0;i<=nu;i++){
      const u=p.u0+(p.u1-p.u0)*i/nu;
      const roots=p.eval(u,v).filter(visible);
      const pair=roots.map(pt=>{
       const q=affine(A,s.t,pt),w=[display(pt,s),display(q,s)];
       for(let k=0;k<2;k++)if(visible(w[k]))positions[k].push(...w[k]);
       return w;
      });
      row.push(pair);vertices+=pair.length;
      if(!sparseOnly&&i>0&&j%Math.max(1,Math.ceil(nv/10))===0){const left=row[i-1];for(let branch=0;branch<Math.min(left.length,pair.length);branch++){
       for(let k=0;k<2;k++)this.pushLine(lines[k],left[branch][k],pair[branch][k]);
      }}
      if(!sparseOnly&&previous&&i%Math.max(1,Math.ceil(nu/10))===0){const above=previous[i];for(let branch=0;branch<Math.min(above.length,pair.length);branch++){
       for(let k=0;k<2;k++)this.pushLine(lines[k],above[branch][k],pair[branch][k]);
      }}
      if(previous&&i>0){const aa=previous[i-1],bb=previous[i],cc=row[i-1],dd=pair;
       // Match only consistent branch counts, so separate Z solutions never get sewn together.
       if(aa.length===bb.length&&bb.length===cc.length&&cc.length===dd.length){
        for(let branch=0;branch<dd.length;branch++)for(let k=0;k<2;k++){
         const p00=aa[branch][k],p10=bb[branch][k],p01=cc[branch][k],p11=dd[branch][k];
         this.pushTri(faces[k],p00,p01,p10);this.pushTri(faces[k],p10,p01,p11);
        }
       }
      }
     }
     previous=row;done++;
     const delay=Math.max(0,Math.min(2000,Number(s.delay)||0));
     // Yield UI time on each requested delay; at zero, yield periodically to stay responsive.
     if(delay>0||done%3===0||done===expected){drawn();this.onProgress?.({done,expected,vertices,finished:done===expected});if(delay>0)await sleep(delay);else await nextFrame();}
    }
   }
   if(stamp!==this.generation)return;
   drawn();this.chooseVisiblePoint();this.onProgress?.({done:expected,expected,vertices,finished:true});
  }catch(e){if(stamp===this.generation){this.lastError=e;console.error(e);this.onProgress?.({error:e.message});}}
 } 
 // Pick a consistent material point from the current solution set. A
 // normalized position is used to follow shrinking/expanding intersections:
 // on a spherical slice it preserves the selected angular location instead
 // of hopping to the nearest point in absolute 3-D space.
 trackPoint(candidates,track){
  if(!candidates.length)return null;
  const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
  for(const p of candidates)for(let j=0;j<3;j++){lo[j]=Math.min(lo[j],p[j]);hi[j]=Math.max(hi[j],p[j]);}
  const center=lo.map((v,j)=>(v+hi[j])/2);
  const radius=lo.map((v,j)=>Math.max((hi[j]-v)/2,1e-6));
  const norm=p=>p.map((v,j)=>(v-center[j])/radius[j]);
  if(track.direction){
   let best=null,score=Infinity;
   for(const p of candidates){const z=norm(p);const d=z.reduce((acc,v,j)=>acc+(v-track.direction[j])**2,0);
    if(d<score){score=d;best=p;}}
   if(best){track.direction=norm(best);return best;}
  }
  if(track.initial){
   let best=null,score=Infinity;
   for(const p of candidates){const d=p.reduce((acc,v,j)=>acc+(v-track.initial[j])**2,0);
    if(d<score){score=d;best=p;}}
   if(best){track.direction=norm(best);return best;}
  }
  // First visible location: prefer the viewport center and camera-facing
  // candidates; the user can still rotate after the initial selection.
  const view=this.layers[0].view;let best=null,score=Infinity;
  for(const p of candidates){
   const v=new THREE.Vector3(...p).project(view.camera);
   if(!Number.isFinite(v.x+v.y+v.z)||v.z>1||v.z< -1)continue;
   const d=v.x*v.x+v.y*v.y+.05*v.z;
   if(d<score){score=d;best=p;}
  }
  best=best||candidates[0];track.direction=norm(best);return best;
 }
 drawTrack(p,s,A,track){
  const pts=p?[p,affine(A,s.t,p)]:[];
  for(let k=0;k<2;k++){
   const layer=this.layers[k],v=pts[k]?display(pts[k],s):null;
   this.fill(visible(v)?v:[],layer,'chosenGeom');
   if(visible(v)&&visible(track.previous[k]))this.pushLine(track.trails[k],track.previous[k],v);
   track.previous[k]=visible(v)?v:null;
   this.fill(track.trails[k],layer,'trailGeom');
  }
 }
 // The parameter t is scalar and is NEVER the affine shift vector s.t.
 // Coordinate equations trace a path; implicit equations animate snapshots at
 // increasing time. Preserve the 01i redraw and delay behaviour everywhere else.
 async drawParameterized(stamp,s,A){
  const steps=parameterValues(s),total=steps.length,delay=Math.max(0,Math.min(2000,Number(s.delay)||0));
  const track={initial:s.selectedActive&&Array.isArray(s.selectedPoint)?s.selectedPoint:null,
   direction:null,previous:[null,null],trails:[[],[]]};
  if(s.timeMode==='coordinates'){
   const equations=coordinateTimeEquations(s.timeEquations),curves=[[],[]];
   let previous=null;
   for(let i=0;i<total;i++){
    if(stamp!==this.generation)return;
    const time=steps[i],p=equations.evaluate(time),q=affine(A,s.t,p);
    const now=[display(p,s),display(q,s)];
    if(previous)for(let k=0;k<2;k++)this.pushLine(curves[k],previous[k],now[k]);
    previous=now.map(v=>visible(v)?v:null);
    this.drawTrack(p,s,A,track);
    if(this.cameraStep||delay>0||i%10===0||i===total-1){
     for(let k=0;k<2;k++){
      const layer=this.layers[k];this.fill(curves[k],layer,'characteristic');
      layer.group.children[3].material.color.setHex(k===0?0x1269ad:0x237e35);
      this.fill([],layer,'markGeom');
      // A parametric curve already defines the unique moving endpoint.
      layer.view.render();
     }
     this.onProgress?.({done:i+1,expected:total,vertices:i+1,finished:i===total-1,time});
     if(this.cameraStep)await this.cameraStep({index:i,total,time});
     else if(delay>0)await sleep(delay);else await nextFrame();
    }
   }
   return;
  }
  if(s.timeMode!=='implicit')throw Error('Unknown parameter mode / Неизвестный режим t');
  if(total>121)throw Error('Time-dependent implicit mode supports at most 120 intervals: increase Δt / Увеличьте шаг Δt (не более 120 интервалов)');
  for(let i=0;i<total;i++){
   if(stamp!==this.generation)return;
   const time=steps[i],snapshot={...s,shape:'implicit',implicit:timeImplicitAt(s.dynamicEquations,time)};
   const count=implicitEquationTexts(snapshot.implicit).length;
   const meshes=[[],[]],curves=[[],[]],marks=[[],[]],candidates=[];
   if(count===1){
    // One equation: current 3D surface at this t, sampled via the
    // established multiple-Z rule, with independent branches.
    const patch=setupSurface(snapshot)[0],N=24;
    let previous=null;
    for(let j=0;j<=N;j++){
     const yy=patch.v0+(patch.v1-patch.v0)*j/N,row=[];
     for(let k=0;k<=N;k++){
      const xx=patch.u0+(patch.u1-patch.u0)*k/N;
      const roots=patch.eval(xx,yy).filter(visible),pair=roots.map(p=>{
       if(Number.isFinite(p[0]+p[1]+p[2]))candidates.push(p);
       const q=affine(A,s.t,p);return [display(p,s),display(q,s)];
      });
      row.push(pair);
      if(previous&&k>0){
       const aa=previous[k-1],bb=previous[k],cc=row[k-1],dd=pair;
       if(aa.length===bb.length&&bb.length===cc.length&&cc.length===dd.length){
        for(let branch=0;branch<dd.length;branch++)for(let u=0;u<2;u++){
         const a=aa[branch][u],b=bb[branch][u],c=cc[branch][u],d=dd[branch][u];
         this.pushTri(meshes[u],a,c,b);this.pushTri(meshes[u],b,c,d);
        }
       }
      }
     }
     previous=row;
    }
   }else if(count===2){
    // Two equations: show the instantaneous intersection curve, not the
    // union of all curves from earlier times.
    for(const slab of intersectionSlabs(snapshot,20))for(const [a,b] of slab.segments){
     candidates.push(a.map((v,j)=>(v+b[j])/2));
     for(let k=0;k<2;k++)this.pushLine(curves[k],display(k===0?a:affine(A,s.t,a),s),display(k===0?b:affine(A,s.t,b),s));
    }
   }else if(count===3){
    const pts=solveIsolatedPoints(snapshot);candidates.push(...pts);
    for(let k=0;k<2;k++)marks[k]=pts.map(p=>display(k===0?p:affine(A,s.t,p),s)).filter(visible).flat();
   }
   // Select one point belonging to the current instantaneous solution set.
   // Keep its normalized position across t steps; append the transformed
   // pair to separate red tracks, once per completed mathematical state.
   const selected=this.trackPoint(candidates,track);
   this.drawTrack(selected,s,A,track);
   for(let k=0;k<2;k++){
    const layer=this.layers[k];
    this.fill(meshes[k],layer,'surfaces');this.fill(curves[k],layer,'characteristic');
    layer.group.children[3].material.color.setHex(k===0?0x1269ad:0x237e35);
    this.fill(marks[k],layer,'markGeom');layer.view.render();
   }
   this.onProgress?.({done:i+1,expected:total,vertices:meshes[0].length/3+curves[0].length/3+marks[0].length/3,finished:i===total-1,time});
   if(this.cameraStep)await this.cameraStep({index:i,total,time});
   else if(delay>0)await sleep(delay);else await nextFrame();
  }
 }
 // Three equations normally define isolated 3D points: draw their affine images
 // as crisp red screen-size markers. Do not invent a surface or connect points.
 drawIsolatedPoints(stamp,s,A){
  const roots=solveIsolatedPoints(s);
  if(stamp!==this.generation)return;
  for(let i=0;i<2;i++){
   const pp=roots.map(p=>display(i===0?p:affine(A,s.t,p),s)).filter(visible);
   this.fill(pp.flat(),this.layers[i],'markGeom');
   this.layers[i].view.render();
  }
  this.onProgress?.(roots.length?
   {done:1,expected:1,vertices:roots.length,finished:true}:
   {error:'No isolated solution found in bounds / Не найдена отдельная точка в заданном диапазоне'});
 }
 // Render intersections as redrawn line segments rather than a falsely filled surface.
 // The slabs progress from low to high Z. Within a slab, cells are scanned X-first, Y-next.
 async drawIntersection(stamp,s,A){
  const arrays=[[],[]];let done=0,total=1,vertices=0,chosen=false;
  const available=Math.max(12,Math.min(72,s.stepMode==='auto'?40:
    Math.ceil(Math.max((s.bounds.xmax-s.bounds.xmin)/s.dx,(s.bounds.ymax-s.bounds.ymin)/s.dy))));
  for(const slab of intersectionSlabs(s,available)){
   if(stamp!==this.generation)return;
   for(const [a,b] of slab.segments){
    if(!chosen){
     const pt=a.map((v,i)=>(v+b[i])/2),transformed=affine(A,s.t,pt);
     for(let idx=0;idx<2;idx++)this.fill(idx===0?display(pt,s):display(transformed,s),this.layers[idx],'markGeom');
     chosen=true;
    }
    const pp=[display(a,s),display(b,s)],qq=[display(affine(A,s.t,a),s),display(affine(A,s.t,b),s)];
    if(visible(pp[0])&&visible(pp[1]))arrays[0].push(...pp[0],...pp[1]);
    if(visible(qq[0])&&visible(qq[1]))arrays[1].push(...qq[0],...qq[1]);
    vertices+=2;
   }
   done=slab.done;total=slab.total;
   for(let i=0;i<2;i++){
    this.fill(arrays[i],this.layers[i],'characteristic');
    this.layers[i].group.children[3].material.color.setHex(i===0?0x125b99:0x1b7a39);
    this.layers[i].view.render();
   }
   this.onProgress?.({done,total,expected:total,vertices,finished:done===total});
   if(s.delay>0)await sleep(Math.min(2000,s.delay));else await nextFrame();
  }
  if(stamp===this.generation&&vertices===0)this.onProgress?.({error:'No intersection found in the selected bounds / Пересечение не найдено в заданном диапазоне'});
 }

}
