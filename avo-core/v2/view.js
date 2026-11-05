/* AVO Core v2 01h · unified Picture: editing capability controls endpoint markers. */
import * as THREE from 'three';
import {GeometryLayer} from './geometry.js';
import {solveXY,solveZ} from './drag-math.js';
const RAD=Math.PI/180;
const modAngle=n=>((n%360)+360)%360;
const vector=p=>new THREE.Vector3(...p);
const colorCode=n=>'#'+(n??0x265fb1).toString(16).padStart(6,'0');
export class View3D {
  constructor(root,onCameraChanged,onHandleMove,onHandleEnd,onOverlapChanged,editable=true){
    this.root=root;this.showEditMarkers=!!editable;this.onCameraChanged=onCameraChanged;this.onHandleMove=onHandleMove;this.onHandleEnd=onHandleEnd;this.onOverlapChanged=onOverlapChanged;this.overlapActive=false;
    this.angles=[35,20,25];this.radius=14;this.fitHalf=4.7;this.latestGeometry=null;this.mode='off';this.axis='free';this.dragAxis='xy';this.editAxis='xy';this.target=new THREE.Vector3();
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xffffff);
    this.camera=new THREE.OrthographicCamera(-4.7,4.7,4.7,-4.7,.08,3000);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    this.renderer.domElement.setAttribute('aria-label','3D');root.append(this.renderer.domElement);
    this.axisLabels=document.createElement('canvas');this.axisLabels.className='avo-axis-labels';
    this.axisLabels.setAttribute('aria-hidden','true');root.append(this.axisLabels);
    this.axisCtx=this.axisLabels.getContext('2d');
    // Circles have fixed CSS pixel diameter and cannot inflate as they approach camera.
    this.markerLayer=document.createElement('div');this.markerLayer.className='avo-marker-layer';
    this.markerLayer.setAttribute('aria-hidden','true');root.append(this.markerLayer);this.markerElements=new Map();
    this.staticGroup=new THREE.Group();this.scene.add(this.staticGroup);this.drawAxes();
    this.geo=new GeometryLayer(this.scene);
    this.pointers=new Map();this.drag=null;this.pinchDistance=null;this.nativeTouchEnabled=("ontouchstart" in window);
    this.sizeObserver=new ResizeObserver(()=>this.resize());this.sizeObserver.observe(root);
    this.attachEvents();this.updateCamera();
  }
  drawAxes(){
    const grid=(plane,at)=>{
      const verts=[];
      for(let i=-3;i<=3;i++){
        if(plane==='xy')verts.push([-3,i,at],[3,i,at],[i,-3,at],[i,3,at]);
        else if(plane==='xz')verts.push([-3,at,i],[3,at,i],[i,at,-3],[i,at,3]);
        else verts.push([at,-3,i],[at,3,i],[at,i,-3],[at,i,3]);
      }
      const geom=new THREE.BufferGeometry().setFromPoints(verts.map(vector));
      this.staticGroup.add(new THREE.LineSegments(geom,new THREE.LineBasicMaterial({color:0xa2b1bd,transparent:true,opacity:.48,depthWrite:false})));
    };
    // Same three boundary coordinate grids as the established AVO applications.
    grid('xy',-3);grid('xz',3);grid('yz',-3);
    for(const [axis,color] of [[0,0xe1333c],[1,0x987448],[2,0x64a524]]){
      const a=[0,0,0],b=[0,0,0];a[axis]=-3;b[axis]=3;
      const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([vector(a),vector(b)]),new THREE.LineBasicMaterial({color,depthTest:false}));
      this.staticGroup.add(line);
    }
  }
  updateFrustum(){
    const w=Math.max(100,this.root.clientWidth),h=Math.max(100,this.root.clientHeight),aspect=w/h;
    const half=this.fitHalf*this.radius/14;
    if(aspect>=1){this.camera.left=-half*aspect;this.camera.right=half*aspect;this.camera.top=half;this.camera.bottom=-half;}
    else {this.camera.left=-half;this.camera.right=half;this.camera.top=half/aspect;this.camera.bottom=-half/aspect;}
    this.camera.updateProjectionMatrix();
  }
  updateCamera(){
    const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(...this.angles.map(a=>a*RAD),'XYZ'));
    this.camera.position.copy(this.target).add(new THREE.Vector3(0,0,Math.max(30,this.radius)).applyQuaternion(q));
    this.camera.up.copy(new THREE.Vector3(0,1,0).applyQuaternion(q));
    this.camera.lookAt(this.target);this.updateFrustum();this.render();
  }
  render(){if(this.renderer&&!this.disposed){this.renderer.render(this.scene,this.camera);this.updateMarkers();this.drawAxisLabels();}}
  resize(){if(this.disposed)return;
    const w=Math.max(100,this.root.clientWidth),h=Math.max(100,this.root.clientHeight);
    this.renderer.setSize(w,h,false);this.updateFrustum();
    const dpr=Math.min(devicePixelRatio||1,2);
    this.axisLabels.width=Math.round(w*dpr);this.axisLabels.height=Math.round(h*dpr);
    this.axisCtx?.setTransform(dpr,0,0,dpr,0,0);this.render();
  }
 drawAxisLabels(){
  // Only the 2D annotation layer is changed in 03d. The 3D scene, gesture
  // handlers, view synchronization and matrices are exactly as in 03b.
  const ctx=this.axisCtx;if(!ctx)return;
  const w=this.root.clientWidth,h=this.root.clientHeight;
  ctx.clearRect(0,0,w,h);
  if(w<70||h<70)return;
  const camera=this.camera;
  const v=new THREE.Vector3();
  const xy=(x,y,z)=>{
   v.set(x,y,z).project(camera);
   return {x:(v.x+1)*w/2,y:(1-v.y)*h/2,visible:v.z>=-1&&v.z<=1};
  };
  const origin2=xy(0,0,0);
  const cubeCorners=[
   [-3,-3,-3],[-3,3,-3],[-3,-3,3],
   [3,3,-3],[-3,3,3],[3,3,3],[3,-3,-3]
  ].map(p=>xy(...p));
  // All candidates are REAL outside edges of one of the three rendered grids:
  // XY(z=-3), XZ(y=3), YZ(x=-3). We never draw numbers on imaginary edges.
  const grids={
   x:[[-3,-3],[3,-3],[3,3]],
   y:[[-3,-3],[3,-3],[-3,3]],
   z:[[-3,-3],[-3,3],[3,3]]
  };
  const edgePoint=(axis,fix,k)=>axis==='x'?xy(k,fix[0],fix[1]):
    axis==='y'?xy(fix[0],k,fix[1]):xy(fix[0],fix[1],k);
  const padding=10, tickSize=11.5, labelOffset=17;
  const bbox=(value,x,y,size)=>({
   x:x-Math.max(11,String(value).length*size*.34)-2,
   y:y-size*.65-2,
   x2:x+Math.max(11,String(value).length*size*.34)+2,
   y2:y+size*.65+2
  });
  const fits=b=>b.x>=padding&&b.x2<=w-padding&&b.y>=padding&&b.y2<=h-padding;
  const overlaps=(a,b)=>a.x<b.x2&&a.x2>b.x&&a.y<b.y2&&a.y2>b.y;
  const reserved=[{x:6,y:4,x2:Math.min(235,w*.70),y2:39}]; // live readout at top-left
  // Keep the current 03b placement of X/Y/Z letters. Reserve their space
  // before distributing numeric graduations so digits do not collide with them.
  const letters=[];
  for(const [letter,axis] of [['X','x'],['Y','y'],['Z','z']]){
   const p=axis==='x'?xy(3,0,0):axis==='y'?xy(0,3,0):xy(0,0,3);
   const n=axis==='x'?xy(-3,0,0):axis==='y'?xy(0,-3,0):xy(0,0,-3);
   const chosen=Math.abs(p.x-n.x)>5?(p.x>n.x?p:n):(p.y<n.y?p:n);
   const dx=chosen.x-origin2.x,dy=chosen.y-origin2.y;
   const d=Math.max(1,Math.hypot(dx,dy));
   const x=Math.max(11,Math.min(w-11,chosen.x+dx/d*14));
   const y=Math.max(11,Math.min(h-11,chosen.y+dy/d*14));
   if(chosen.visible){letters.push({value:letter,x,y,size:17});reserved.push(bbox(letter,x,y,17));}
  }
  const options={};
  for(const axis of ['x','y','z']){
   options[axis]=[];
   for(const fixed of grids[axis]){
    const a=edgePoint(axis,fixed,-3),b=edgePoint(axis,fixed,3);
    if(!a.visible||!b.visible)continue;
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
    if(len<27)continue;
    let nx=-dy/len,ny=dx/len;
    // Choose the outward normal of a real rendered grid edge.
    if((origin2.x-a.x)*nx+(origin2.y-a.y)*ny>0){nx=-nx;ny=-ny;}
    const outside=Math.max(...cubeCorners.map(p=>(p.x-a.x)*nx+(p.y-a.y)*ny));
    if(outside>1.5)continue;
    let ticks;
    if(len/6>=31)ticks=[-3,-2,-1,0,1,2,3];
    else if(len/3>=30)ticks=[-3,-1,1,3];
    else if(len/2>=29)ticks=[-3,0,3];
    else ticks=[-3,3];
    // On narrow phone graphs the OUTSIDE of a Z edge often lies beyond
    // the canvas boundary. Keep the same visible, outermost vertical edge,
    // but put its numbers a few pixels INSIDE the plot when necessary.
    // X and Y retain exactly the successful 03c outside-label strategy.
    const sides=axis==='z'?[1,-1]:[1];
    for(const side of sides){
     const items=[];
     for(const k of ticks){
      const p=edgePoint(axis,fixed,k);
      const x=p.x+nx*labelOffset*side;
      const y=p.y+ny*labelOffset*side;
      const box=bbox(k,x,y,tickSize);
      if(p.visible&&fits(box)&&!reserved.some(r=>overlaps(box,r)))
       items.push({value:String(k),x,y,size:tickSize,box});
     }
     if(items.length){
      const insetPenalty=side<0?45:0;
      const score=items.length*100+Math.min(len,500)*.08-insetPenalty;
      options[axis].push({items,score});
     }
    }
   }
   options[axis].sort((a,b)=>b.score-a.score);
  }
  // There are at most three outside edges per axis: evaluate <=27 layouts.
  // The joint choice avoids crowding at corners where numeric axes meet.
  let best=null;
  // Prefer a valid Z scale over extra X/Y labels. In the old layout
  // Z could be silently omitted on both desktops and phones.
  const candidates=axis=>[...(options[axis]||[]),{items:[],score:axis==='z'?-1000:-200}];
  for(const x of candidates('x'))for(const y of candidates('y'))for(const z of candidates('z')){
   const combined=[...x.items,...y.items,...z.items];
   let clashes=0;
   for(let i=0;i<combined.length;i++)for(let j=i+1;j<combined.length;j++)
    if(overlaps(combined[i].box,combined[j].box))clashes++;
   const score=x.score+y.score+z.score-clashes*180;
   if(!best||score>best.score)best={score,axes:[x,y,z]};
  }
  const occupied=[...reserved];
  const draw=(value,x,y,size,emph=false)=>{
   ctx.font=`${emph?900:750} ${size}px system-ui, Arial, sans-serif`;
   ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.lineJoin='round';ctx.strokeStyle='#ffffff';ctx.lineWidth=emph?4.5:3.8;
   ctx.strokeText(value,x,y);
   ctx.fillStyle=emph?'#152b40':'#273f55';ctx.fillText(value,x,y);
  };
  // Paint Z first so a neighboring X/Y tick cannot hide the entire Z scale.
  if(best)for(const selected of [best.axes[2],best.axes[0],best.axes[1]])for(const item of selected.items){
   if(occupied.some(r=>overlaps(item.box,r)))continue;
   occupied.push(item.box);
   draw(item.value,item.x,item.y,item.size);
  }
  for(const letter of letters)draw(letter.value,letter.x,letter.y,letter.size,true);
 }
  updateFit(geometry){
    // Preserve the successful original scale for ordinary objects. For larger
    // user-defined objects, fit their actual geometry rather than cutting off
    // endpoints. Dragging never changes the camera scale mid-gesture.
    if(this.drag?.handleId)return;
    let extent=0;
    const include=p=>{if(Array.isArray(p)&&p.length===3&&p.every(Number.isFinite))extent=Math.max(extent,Math.hypot(...p));};
    for(const p of geometry?.points||[])include(p.xyz);
    for(const h of geometry?.handles||[])include(h.position);
    for(const l of geometry?.lines||[]){include(l.from);include(l.to);}
    for(const f of geometry?.faces||[])for(const p of f.vertices||[])include(p);
    this.fitHalf=Math.max(this.fitHalf,4.7,extent*1.12);
  }
  setGeometry(geometry){this.latestGeometry=geometry;this.updateFit(geometry);this.geo.update(geometry,{showVectorEndpoints:this.showEditMarkers});this.updateFrustum();this.render();}
  screenPosition(pos){
    if(!Array.isArray(pos)||pos.length!==3||!pos.every(Number.isFinite))return null;
    const v=vector(pos).project(this.camera),w=this.renderer.domElement.clientWidth||this.root.clientWidth,h=this.renderer.domElement.clientHeight||this.root.clientHeight;
    if(!(w>0&&h>0)||!Number.isFinite(v.x)||!Number.isFinite(v.y)||!Number.isFinite(v.z)||v.z< -1||v.z>1)return null;
    return [(v.x+1)*w/2,(1-v.y)*h/2];
  }
  updateMarkers(){
    if(!this.geo)return;
    // Non-editable Picture results keep their geometry but never display or hit-test
    // the endpoint handle circles. The mode button does not affect this property.
    if(!this.showEditMarkers){
      for(const marker of this.markerElements.values())marker.remove();
      this.markerElements.clear();
      if(this.overlapActive){this.overlapActive=false;this.onOverlapChanged?.(false);}
      return;
    }
    const ids=new Set();
    for(const handle of this.geo.handles){
      const id=String(handle.id),p=this.screenPosition(handle.position);ids.add(id);
      let el=this.markerElements.get(id);
      if(!el){el=document.createElement('span');el.className='avo-marker';el.dataset.handle=id;this.markerLayer.append(el);this.markerElements.set(id,el);}
      const w=this.root.clientWidth||0,h=this.root.clientHeight||0;
      el.hidden=!p||p[0]<-12||p[0]>w+12||p[1]<-12||p[1]>h+12;
      if(!el.hidden){el.style.left=p[0]+'px';el.style.top=p[1]+'px';}
      el.style.borderColor=colorCode(handle.color);
    }
    for(const [id,el] of this.markerElements)if(!ids.has(id)){el.remove();this.markerElements.delete(id);}
    // A genuine 3D separation does not guarantee separable screen projections.
    this.checkMarkerOverlap();
  }
  checkMarkerOverlap(){
    if(!this.showEditMarkers){
      if(this.overlapActive){this.overlapActive=false;this.onOverlapChanged?.(false);}
      return;
    }
    const points=this.geo?.handles.map(h=>this.screenPosition(h.position)).filter(Boolean)||[];
    const threshold=this.nativeTouchEnabled?26:17;
    let close=false;
    for(let i=0;i<points.length&&!close;i++)for(let j=i+1;j<points.length;j++){
      if(Math.hypot(points[i][0]-points[j][0],points[i][1]-points[j][1])<threshold){close=true;break;}
    }
    const active=this.mode==='edit'&&close;
    if(this.overlapActive!==active){this.overlapActive=active;this.onOverlapChanged?.(active);}
  }
  setAngles(angles,notify=true){if(!Array.isArray(angles)||angles.length!==3||!angles.every(Number.isFinite))return;
    this.angles=angles.map(modAngle);this.updateCamera();if(notify)this.onCameraChanged?.(this);}
  changeAngles(axis,value){const next=this.angles.slice();next[axis]=modAngle(value);this.setAngles(next);}
  setRadius(radius,notify=true){this.radius=Math.min(200,Math.max(0.75,Number(radius)||14));this.updateCamera();if(notify)this.onCameraChanged?.(this);}
  resetView(){this.radius=14;this.fitHalf=4.7;this.updateFit(this.latestGeometry);this.setAngles([35,20,25]);}
  setMode(mode){this.mode=mode;this.checkMarkerOverlap();const action=mode==='off'?'pan-y':'none';this.renderer.domElement.style.touchAction=action;this.root.style.touchAction=action;}
  attachEvents(){
    const el=this.renderer.domElement;el.style.touchAction='pan-y';
    el.addEventListener('pointerdown',e=>this.onDown(e));el.addEventListener('pointermove',e=>this.onMove(e));
    el.addEventListener('pointerup',e=>this.onUp(e));el.addEventListener('pointercancel',e=>this.onUp(e));
    el.addEventListener('wheel',e=>{if(this.mode==='off')return;e.preventDefault();this.setRadius(this.radius*(e.deltaY>0?1.09:.91));},{passive:false});
    el.addEventListener('dblclick',()=>{if(this.mode!=='off')this.resetView();});
    // Safari/iOS can cancel Pointer Events when a touch is interpreted as
    // page scroll/zoom. Use native Touch Events as the sole touch input when
    // available; mouse/pen continue to use Pointer Events unchanged.
    if(this.nativeTouchEnabled){
      const synthetic=(touch)=>({pointerId:100000+touch.identifier,pointerType:'touch',
        clientX:touch.clientX,clientY:touch.clientY,button:0,nativeTouch:true,
        preventDefault(){}});
      el.addEventListener('touchstart',e=>{
        if(this.mode==='off')return;
        e.preventDefault();
        for(const t of e.changedTouches)this.onDown(synthetic(t));
      },{passive:false});
      el.addEventListener('touchmove',e=>{
        if(this.mode==='off')return;
        e.preventDefault();
        for(const t of e.changedTouches)this.onMove(synthetic(t));
      },{passive:false});
      const end=e=>{
        if(this.mode!=='off')e.preventDefault();
        for(const t of e.changedTouches)this.onUp(synthetic(t));
      };
      el.addEventListener('touchend',end,{passive:false});
      el.addEventListener('touchcancel',end,{passive:false});
    }
  }
  hitAt(e){
    const rect=this.renderer.domElement.getBoundingClientRect(),radius=e.pointerType==='touch'?36:17;
    const candidates=[];
    for(const h of this.geo.handles){
      const p=this.screenPosition(h.position);if(!p)continue;
      const dx=rect.left+p[0]-e.clientX,dy=rect.top+p[1]-e.clientY,d=Math.hypot(dx,dy);
      if(d<=radius)candidates.push({handle:h,point:p,distance:d});
    }
    candidates.sort((a,b)=>a.distance-b.distance);
    if(candidates.length>1){
      const a=candidates[0].point,b=candidates[1].point;
      // A wide touch target is helpful, but must not silently pick one
      // of two almost superimposed projected endpoints.
      if(Math.hypot(a[0]-b[0],a[1]-b[1])<(e.pointerType==='touch'?26:17))return {ambiguous:true};
    }
    return candidates[0]?{handle:candidates[0].handle,ambiguous:false}:null;
  }
  onDown(e){
    if(this.mode==='off'||(e.pointerType==='mouse'&&e.button!==0))return;
    if(this.nativeTouchEnabled&&e.pointerType==='touch'&&!e.nativeTouch)return;
    if(!e.nativeTouch)this.renderer.domElement.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(this.pointers.size===2){if(this.drag?.changed)this.onHandleEnd?.();this.drag=null;this.pinchDistance=this.dist();return;}
    const picked=this.mode==='edit'&&this.showEditMarkers?this.hitAt(e):null;
    if(picked?.ambiguous){
      this.onOverlapChanged?.(true);
      // Do not turn an ambiguous marker drag into either editing or rotation.
      this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,handleId:null,binding:null,changed:false,blocked:true};
      e.preventDefault();return;
    }
    const handle=picked?.handle;
    this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,handleId:handle?String(handle.id):null,binding:handle?.binding,changed:false};
    e.preventDefault();
  }
  dist(){const p=[...this.pointers.values()];return p.length===2?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0;}
  moveHandle(e,drag,dx,dy){
    const handle=this.geo.handles.find(h=>String(h.id)===drag.handleId);
    if(!handle)return;
    const pos=handle.position.slice(),base=this.screenPosition(pos);if(!base)return;
    // Project local unit vectors. Never divide by ray/plane incidence angle.
    const projection=(axis)=>{const q=pos.slice();q[axis]+=1;const p=this.screenPosition(q);return p?[p[0]-base[0],p[1]-base[1]]:[0,0];};
    const jx=projection(0),jy=projection(1),jz=projection(2);
    // Editing endpoints is separate from XY/Z VIEW gestures.
    // Existing saved endpoint-edit mode is preserved. Shift+drag on a marker
    // temporarily edits its Z-coordinate without changing the view mode.
    if(this.editAxis==='xy'&&!e.shiftKey){
      const [a,b]=solveXY(jx,jy,dx,dy);pos[0]+=a;pos[1]+=b;
    }else{
      pos[2]+=solveZ(jz,dx,dy,Math.max(Math.hypot(...jx),Math.hypot(...jy)));
    }
    if(!pos.every(Number.isFinite)||pos.every((v,i)=>v===handle.position[i]))return;
    const success=this.onHandleMove?.(drag.binding,pos);
    if(success!==false)drag.changed=true;
  }
  onMove(e){
    if(this.nativeTouchEnabled&&e.pointerType==='touch'&&!e.nativeTouch)return;
    if(this.mode==='off'||!this.pointers.has(e.pointerId))return;
    const prev=this.pointers.get(e.pointerId);this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(this.pointers.size===2){const d=this.dist();if(this.pinchDistance&&d>5)this.setRadius(this.radius*this.pinchDistance/d);this.pinchDistance=d;e.preventDefault();return;}
    const drag=this.drag;if(!drag||drag.id!==e.pointerId)return;
    if(drag.blocked){e.preventDefault();return;}
    const dx=e.clientX-prev.x,dy=e.clientY-prev.y;
    if(drag.handleId)this.moveHandle(e,drag,dx,dy);
    else{
      // XY/Z view gestures are identical for editable and calculated pictures.
      // Ray-axis selector (this.axis) is independent of free-area drag mode.
      const next=this.angles.slice();
      if(this.dragAxis==='z'||e.shiftKey)next[2]+=(dx-dy)*.45;
      else {next[0]+=dy*.43;next[1]+=dx*.43;}
      this.setAngles(next);
    }
    e.preventDefault();
  }
  onUp(e){
    if(this.nativeTouchEnabled&&e.pointerType==='touch'&&!e.nativeTouch)return;
    if(!this.pointers.has(e.pointerId))return;
    this.pointers.delete(e.pointerId);
    if(this.drag?.id===e.pointerId){if(this.drag.changed)this.onHandleEnd?.();this.drag=null;}
    if(this.pointers.size<2)this.pinchDistance=null;
    if(!e.nativeTouch)try{if(this.renderer.domElement.hasPointerCapture?.(e.pointerId))this.renderer.domElement.releasePointerCapture(e.pointerId);}catch(_){}
  }
  state(){return {angles:this.angles.slice(),radius:this.radius,mode:this.mode,axis:this.axis,dragAxis:this.dragAxis,editAxis:this.editAxis};}
  applyState(s){if(!s||!Array.isArray(s.angles)||s.angles.length!==3||!s.angles.every(Number.isFinite))return;
    this.radius=Math.min(200,Math.max(0.75,Number(s.radius)||14));this.axis='free'; // 01i: legacy axis-selection states no longer restrict angle rays
    // Old JSON states only contained editAxis. Preserve them on load.
    this.dragAxis=(s.dragAxis==='xy'||s.dragAxis==='z')?s.dragAxis:(s.editAxis==='z'?'z':'xy');
    this.editAxis=s.editAxis==='z'?'z':'xy';this.setMode(['off','view','edit'].includes(s.mode)?s.mode:'off');this.setAngles(s.angles,false);
  }
  dispose(){this.disposed=true;this.sizeObserver.disconnect();this.geo.dispose();this.staticGroup.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
    this.renderer.dispose();this.renderer.domElement.remove();this.axisLabels.remove();this.markerLayer.remove();}
}
