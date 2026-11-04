/* AVO Core v2 01b · universal Three.js view + stable screen-space editing. */
import * as THREE from 'three';
import {GeometryLayer} from './geometry.js';
import {solveXY,solveZ} from './drag-math.js';
const RAD=Math.PI/180;
const modAngle=n=>((n%360)+360)%360;
const vector=p=>new THREE.Vector3(...p);
const colorCode=n=>'#'+(n??0x265fb1).toString(16).padStart(6,'0');
export class View3D {
  constructor(root,onCameraChanged,onHandleMove,onHandleEnd){
    this.root=root;this.onCameraChanged=onCameraChanged;this.onHandleMove=onHandleMove;this.onHandleEnd=onHandleEnd;
    this.angles=[35,20,25];this.radius=14;this.mode='off';this.axis='free';this.editAxis='xy';this.target=new THREE.Vector3();
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xf6fbff);
    this.camera=new THREE.PerspectiveCamera(47,1,.08,3000);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    this.renderer.domElement.setAttribute('aria-label','3D');root.append(this.renderer.domElement);
    // Circles have fixed CSS pixel diameter and cannot inflate as they approach camera.
    this.markerLayer=document.createElement('div');this.markerLayer.className='avo-marker-layer';
    this.markerLayer.setAttribute('aria-hidden','true');root.append(this.markerLayer);this.markerElements=new Map();
    this.staticGroup=new THREE.Group();this.scene.add(this.staticGroup);this.drawAxes();
    this.geo=new GeometryLayer(this.scene);
    this.pointers=new Map();this.drag=null;this.pinchDistance=null;
    this.sizeObserver=new ResizeObserver(()=>this.resize());this.sizeObserver.observe(root);
    this.attachEvents();this.updateCamera();
  }
  drawAxes(){
    const makeLine=(from,to,color,opacity=.8)=>{
      const g=new THREE.BufferGeometry().setFromPoints([vector(from),vector(to)]);
      const l=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false}));this.staticGroup.add(l);
    };
    for(let i=-4;i<=4;i++){makeLine([-4,i,0],[4,i,0],0xaebfcb,.26);makeLine([i,-4,0],[i,4,0],0xaebfcb,.26);}
    makeLine([-5,0,0],[5,0,0],0xde3c40,1);
    makeLine([0,-5,0],[0,5,0],0xa98758,1);
    makeLine([0,0,-5],[0,0,5],0x60aa26,1);
  }
  updateCamera(){
    const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(...this.angles.map(a=>a*RAD),'XYZ'));
    this.camera.position.copy(this.target).add(new THREE.Vector3(0,0,this.radius).applyQuaternion(q));
    this.camera.up.copy(new THREE.Vector3(0,1,0).applyQuaternion(q));
    this.camera.lookAt(this.target);this.camera.updateProjectionMatrix();this.render();
  }
  render(){if(this.renderer&&!this.disposed){this.renderer.render(this.scene,this.camera);this.updateMarkers();}}
  resize(){if(this.disposed)return;
    const w=Math.max(100,this.root.clientWidth),h=Math.max(100,this.root.clientHeight);
    this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.render();
  }
  setGeometry(geometry){this.geo.update(geometry);this.render();}
  screenPosition(pos){
    if(!Array.isArray(pos)||pos.length!==3||!pos.every(Number.isFinite))return null;
    const v=vector(pos).project(this.camera),w=this.renderer.domElement.clientWidth||this.root.clientWidth,h=this.renderer.domElement.clientHeight||this.root.clientHeight;
    if(!(w>0&&h>0)||!Number.isFinite(v.x)||!Number.isFinite(v.y)||!Number.isFinite(v.z)||v.z< -1||v.z>1)return null;
    return [(v.x+1)*w/2,(1-v.y)*h/2];
  }
  updateMarkers(){
    if(!this.geo)return;
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
  }
  setAngles(angles,notify=true){if(!Array.isArray(angles)||angles.length!==3||!angles.every(Number.isFinite))return;
    this.angles=angles.map(modAngle);this.updateCamera();if(notify)this.onCameraChanged?.(this);}
  changeAngles(axis,value){const next=this.angles.slice();next[axis]=modAngle(value);this.setAngles(next);}
  setRadius(radius,notify=true){this.radius=Math.min(200,Math.max(2,Number(radius)||14));this.updateCamera();if(notify)this.onCameraChanged?.(this);}
  resetView(){this.radius=14;this.setAngles([35,20,25]);}
  setMode(mode){this.mode=mode;this.renderer.domElement.style.touchAction=mode==='off'?'pan-y':'none';}
  attachEvents(){
    const el=this.renderer.domElement;el.style.touchAction='pan-y';
    el.addEventListener('pointerdown',e=>this.onDown(e));el.addEventListener('pointermove',e=>this.onMove(e));
    el.addEventListener('pointerup',e=>this.onUp(e));el.addEventListener('pointercancel',e=>this.onUp(e));
    el.addEventListener('wheel',e=>{if(this.mode==='off')return;e.preventDefault();this.setRadius(this.radius*(e.deltaY>0?1.09:.91));},{passive:false});
    el.addEventListener('dblclick',()=>{if(this.mode!=='off')this.resetView();});
  }
  hitAt(e){
    const rect=this.renderer.domElement.getBoundingClientRect(),radius=e.pointerType==='touch'?24:17;
    let nearest=null,distance=radius*radius;
    for(const h of this.geo.handles){
      const p=this.screenPosition(h.position);if(!p)continue;
      const dx=rect.left+p[0]-e.clientX,dy=rect.top+p[1]-e.clientY,d=dx*dx+dy*dy;
      if(d<=distance){nearest=h;distance=d;}
    }
    return nearest;
  }
  onDown(e){
    if(this.mode==='off'||(e.pointerType==='mouse'&&e.button!==0))return;
    this.renderer.domElement.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(this.pointers.size===2){if(this.drag?.changed)this.onHandleEnd?.();this.drag=null;this.pinchDistance=this.dist();return;}
    const handle=this.mode==='edit'?this.hitAt(e):null;
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
    if(this.editAxis==='xy'){
      const [a,b]=solveXY(jx,jy,dx,dy);pos[0]+=a;pos[1]+=b;
    }else{
      pos[2]+=solveZ(jz,dx,dy,Math.max(Math.hypot(...jx),Math.hypot(...jy)));
    }
    if(!pos.every(Number.isFinite)||pos.every((v,i)=>v===handle.position[i]))return;
    const success=this.onHandleMove?.(drag.binding,pos);
    if(success!==false)drag.changed=true;
  }
  onMove(e){
    if(this.mode==='off'||!this.pointers.has(e.pointerId))return;
    const prev=this.pointers.get(e.pointerId);this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(this.pointers.size===2){const d=this.dist();if(this.pinchDistance&&d>5)this.setRadius(this.radius*this.pinchDistance/d);this.pinchDistance=d;e.preventDefault();return;}
    const drag=this.drag;if(!drag||drag.id!==e.pointerId)return;
    const dx=e.clientX-prev.x,dy=e.clientY-prev.y;
    if(drag.handleId)this.moveHandle(e,drag,dx,dy);
    else{
      const next=this.angles.slice();
      if(this.axis==='x')next[0]+=dy*.53;
      else if(this.axis==='y')next[1]+=dx*.53;
      else if(this.axis==='z')next[2]+=(dx-dy)*.45;
      else if(e.shiftKey)next[2]+=(dx-dy)*.45;
      else{next[0]+=dy*.43;next[1]+=dx*.43;}
      this.setAngles(next);
    }
    e.preventDefault();
  }
  onUp(e){
    if(!this.pointers.has(e.pointerId))return;
    this.pointers.delete(e.pointerId);
    if(this.drag?.id===e.pointerId){if(this.drag.changed)this.onHandleEnd?.();this.drag=null;}
    if(this.pointers.size<2)this.pinchDistance=null;
    try{if(this.renderer.domElement.hasPointerCapture?.(e.pointerId))this.renderer.domElement.releasePointerCapture(e.pointerId);}catch(_){}
  }
  state(){return {angles:this.angles.slice(),radius:this.radius,mode:this.mode,axis:this.axis,editAxis:this.editAxis};}
  applyState(s){if(!s||!Array.isArray(s.angles)||s.angles.length!==3||!s.angles.every(Number.isFinite))return;
    this.radius=Math.min(200,Math.max(2,Number(s.radius)||14));this.axis=['free','x','y','z'].includes(s.axis)?s.axis:'free';
    this.editAxis=s.editAxis==='z'?'z':'xy';this.setMode(['off','view','edit'].includes(s.mode)?s.mode:'off');this.setAngles(s.angles,false);
  }
  dispose(){this.disposed=true;this.sizeObserver.disconnect();this.geo.dispose();this.staticGroup.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
    this.renderer.dispose();this.renderer.domElement.remove();this.markerLayer.remove();}
}
