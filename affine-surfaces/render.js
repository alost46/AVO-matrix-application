/* Progressively draw surface meshes in the EXISTING AVO Core Picture canvases.
   No changes to the common core and no replacement of its navigation/gestures. */
import * as THREE from 'three';
import {setupSurface,affine,display,visible,implicitEquationTexts,intersectionSlabs} from './math.js';
const nextFrame=()=>new Promise(done=>requestAnimationFrame(done));
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
export class SurfaceRenderer {
 constructor(app,onProgress){this.app=app;this.onProgress=onProgress;this.generation=0;this.layers=[];
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
   marker.renderOrder=20;
   group.add(face,wire,point,ink,marker);
   this.layers.push({id,view,group,surfaces,wires,dots,characteristic,markGeom});
  }
 }
 clear(){for(const l of this.layers){for(const g of [l.surfaces,l.wires,l.dots,l.characteristic,l.markGeom])g.setAttribute('position',new THREE.Float32BufferAttribute([],3));l.view.render();}}
 fill(arr,spec,data){const g=spec[data];g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(arr),3));g.computeBoundingSphere();}
 pushLine(list,a,b){if(visible(a)&&visible(b))list.push(...a,...b);}
 pushTri(list,a,b,c){if(visible(a)&&visible(b)&&visible(c))list.push(...a,...b,...c);}
 async start(){const stamp=++this.generation,app=this.app,s=app.currentInputs(),A=app.matrixFactory.getNumericMatrix('A',{x:0,y:0,z:0,t:0});
  this.clear();for(const layer of this.layers)layer.group.children[3].material.color.setHex(0xffffff);const positions=[[],[]],lines=[[],[]],faces=[[],[]];
  try{
   if(s.shape==='implicit' && implicitEquationTexts(s.implicit).length===2){
    await this.drawIntersection(stamp,s,A);
    return;
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
   const drawn=()=>{for(let k=0;k<2;k++){this.fill(faces[k],this.layers[k],'surfaces');this.fill(lines[k],this.layers[k],'wires');this.fill(positions[k],this.layers[k],'dots');this.layers[k].view.render();}};
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
   drawn();this.onProgress?.({done:expected,expected,vertices,finished:true});
  }catch(e){if(stamp===this.generation){console.error(e);this.onProgress?.({error:e.message});}}
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
