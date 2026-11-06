/* Progressively draw surface meshes in the EXISTING AVO Core Picture canvases.
   No changes to the common core and no replacement of its navigation/gestures. */
import * as THREE from 'three';
import {setupSurface,affine,display,visible} from './math.js';
const nextFrame=()=>new Promise(done=>requestAnimationFrame(done));
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
export class SurfaceRenderer {
 constructor(app,onProgress){this.app=app;this.onProgress=onProgress;this.generation=0;this.layers=[];
  for(const id of ['input','output']){
   const view=app.pictures.get(id).view,group=new THREE.Group();view.scene.add(group);
   const surfaces=new THREE.BufferGeometry(),wires=new THREE.BufferGeometry(),dots=new THREE.BufferGeometry();
   const face=new THREE.Mesh(surfaces,new THREE.MeshBasicMaterial({color:id==='input'?0x5bafd1:0x87c879,side:THREE.DoubleSide,transparent:true,opacity:.36,depthWrite:false,depthTest:true}));
   const wire=new THREE.LineSegments(wires,new THREE.LineBasicMaterial({color:id==='input'?0x27789f:0x337b37,transparent:true,opacity:.72,depthTest:true}));
   const point=new THREE.Points(dots,new THREE.PointsMaterial({color:id==='input'?0x126395:0x266c32,size:3.0,sizeAttenuation:false,depthTest:false}));
   group.add(face,wire,point);this.layers.push({id,view,group,surfaces,wires,dots});
  }
 }
 clear(){for(const l of this.layers){for(const g of [l.surfaces,l.wires,l.dots])g.setAttribute('position',new THREE.Float32BufferAttribute([],3));l.view.render();}}
 fill(arr,spec,data){const g=spec[data];g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(arr),3));g.computeBoundingSphere();}
 pushLine(list,a,b){if(visible(a)&&visible(b))list.push(...a,...b);}
 pushTri(list,a,b,c){if(visible(a)&&visible(b)&&visible(c))list.push(...a,...b,...c);}
 async start(){const stamp=++this.generation,app=this.app,s=app.currentInputs(),A=app.matrixFactory.getNumericMatrix('A',{x:0,y:0,z:0,t:0});
  this.clear();const positions=[[],[]],lines=[[],[]],faces=[[],[]];
  try{
   const patches=setupSurface(s),globalN=s.stepMode==='auto'?40:null;
   let expected=0,done=0,vertices=0;
   const plans=patches.map(p=>{
    const nu=globalN??Math.max(2,Math.ceil((p.u1-p.u0)/s.dx)),nv=globalN??Math.max(2,Math.ceil((p.v1-p.v0)/s.dy));
    if(!Number.isFinite(nu)||!Number.isFinite(nv)||nu*nv>32000||nu>360||nv>360)throw Error('Grid exceeds 32,000 samples per patch; increase DX or DY');
    expected+=nv+1;return {p,nu,nv};});
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
      if(i>0){const left=row[i-1];for(let branch=0;branch<Math.min(left.length,pair.length);branch++){
       for(let k=0;k<2;k++)this.pushLine(lines[k],left[branch][k],pair[branch][k]);
      }}
      if(previous){const above=previous[i];for(let branch=0;branch<Math.min(above.length,pair.length);branch++){
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
}
