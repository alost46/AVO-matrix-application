/* AVO Core v2 · Three.js view controller. Camera maths only, never edits matrices. */
import * as THREE from 'three';
import { GeometryLayer } from './geometry.js';
const RAD=Math.PI/180;
const modAngle=n=>((n%360)+360)%360;
const vector=p=>new THREE.Vector3(...p);
export class View3D {
  constructor(root, onCameraChanged, onHandleMove, onHandleEnd){
    this.root=root;this.onCameraChanged=onCameraChanged;this.onHandleMove=onHandleMove;this.onHandleEnd=onHandleEnd;
    this.angles=[35,20,25];this.radius=14;this.mode='off';this.axis='free';this.editAxis='xy';this.target=new THREE.Vector3();
    this.scene=new THREE.Scene();
    this.scene.background=new THREE.Color(0xf6fbff);
    this.camera=new THREE.PerspectiveCamera(47,1,.08,3000);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    this.renderer.domElement.setAttribute('aria-label','3D');root.append(this.renderer.domElement);
    this.staticGroup=new THREE.Group();this.scene.add(this.staticGroup);this.drawAxes();
    this.geo=new GeometryLayer(this.scene);
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.pointers=new Map();this.drag=null;this.pinchDistance=null;
    this.sizeObserver=new ResizeObserver(()=>this.resize());this.sizeObserver.observe(root);
    this.attachEvents();this.updateCamera();
  }
  drawAxes(){
    const makeLine=(from,to,color,opacity=.8)=>{
      const g=new THREE.BufferGeometry().setFromPoints([vector(from),vector(to)]);
      const l=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false}));this.staticGroup.add(l);
    };
    for(let i=-4;i<=4;i++){
      makeLine([-4,i,0],[4,i,0],0xaebfcb,.26);
      makeLine([i,-4,0],[i,4,0],0xaebfcb,.26);
    }
    makeLine([-5,0,0],[5,0,0],0xde3c40,1);
    makeLine([0,-5,0],[0,5,0],0xa98758,1);
    makeLine([0,0,-5],[0,0,5],0x60aa26,1);
  }
  updateCamera(){
    const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(...this.angles.map(a=>a*RAD),'XYZ'));
    this.camera.position.copy(this.target).add(new THREE.Vector3(0,0,this.radius).applyQuaternion(q));
    this.camera.up.copy(new THREE.Vector3(0,1,0).applyQuaternion(q));
    this.camera.lookAt(this.target);
    this.camera.updateProjectionMatrix();this.render();
  }
  render(){if(this.renderer && !this.disposed)this.renderer.render(this.scene,this.camera);}
  resize(){if(this.disposed)return;const w=Math.max(100,this.root.clientWidth),h=Math.max(100,this.root.clientHeight);
    this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.render();}
  setGeometry(geometry){this.geo.update(geometry);this.render();}
  setAngles(angles,notify=true){if(!Array.isArray(angles)||angles.length!==3||!angles.every(Number.isFinite))return;
    this.angles=angles.map(modAngle);this.updateCamera();if(notify)this.onCameraChanged?.(this);}
  changeAngles(axis,value){const next=this.angles.slice();next[axis]=modAngle(value);this.setAngles(next);}
  setRadius(radius,notify=true){this.radius=Math.min(200,Math.max(2,Number(radius)||14));this.updateCamera();if(notify)this.onCameraChanged?.(this);}
  resetView(){this.radius=14;this.setAngles([35,20,25]);}
  setMode(mode){this.mode=mode;this.renderer.domElement.style.touchAction=mode==='off'?'pan-y':'none';}
  attachEvents(){
    const el=this.renderer.domElement;
    el.style.touchAction='pan-y';
    el.addEventListener('pointerdown',e=>this.onDown(e));
    el.addEventListener('pointermove',e=>this.onMove(e));
    el.addEventListener('pointerup',e=>this.onUp(e));
    el.addEventListener('pointercancel',e=>this.onUp(e));
    el.addEventListener('wheel',e=>{e.preventDefault();this.setRadius(this.radius*(e.deltaY>0?1.09:.91));},{passive:false});
    el.addEventListener('dblclick',()=>{if(this.mode!=='off')this.resetView();});
  }
  hitAt(e){
    const rect=this.renderer.domElement.getBoundingClientRect();
    this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    return this.raycaster.intersectObjects(this.geo.hit,false)?.[0]?.object?.userData?.handle||null;
  }
  onDown(e){
    if(this.mode==='off')return;
    if(e.pointerType==='mouse'&&e.button!==0)return;
    this.renderer.domElement.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(this.pointers.size===2){this.drag=null;this.pinchDistance=this.dist();return;}
    const handle=this.mode==='edit'?this.hitAt(e):null;
    this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,handle,startPos:handle?.position?.slice(),changed:false};
    e.preventDefault();
  }
  dist(){const p=[...this.pointers.values()];return p.length===2?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0;}
  rayToPlane(e,z){
    const rect=this.renderer.domElement.getBoundingClientRect();
    const ndc=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
    this.raycaster.setFromCamera(ndc,this.camera);
    const plane=new THREE.Plane(new THREE.Vector3(0,0,1),-z);
    const p=new THREE.Vector3();return this.raycaster.ray.intersectPlane(plane,p)?p:null;
  }
  moveHandle(e,drag){
    const h=drag.handle;if(!h)return;
    let pos=h.position.slice();
    if(this.editAxis==='xy'){
      const p=this.rayToPlane(e,pos[2]);if(!p)return;pos=[p.x,p.y,pos[2]];
    }else{
      // Project the world Z axis onto screen to translate pointer motion to elevation.
      const bottom=vector(pos).project(this.camera);
      const top=vector([pos[0],pos[1],pos[2]+1]).project(this.camera);
      const rect=this.renderer.domElement.getBoundingClientRect();
      const sx=(top.x-bottom.x)*rect.width/2,sy=-(top.y-bottom.y)*rect.height/2;
      const denom=sx*sx+sy*sy;
      const delta=denom>20?((e.clientX-drag.x)*sx+(e.clientY-drag.y)*sy)/denom:-(e.clientY-drag.y)*.027;
      pos[2]+=delta;
    }
    pos=pos.map(v=>Math.max(-10000,Math.min(10000,Math.round(v*10000)/10000)));
    const change=this.onHandleMove?.(h.binding,pos);
    if(change!==false){drag.changed=true;if(this.editAxis==='xy'){drag.x=e.clientX;drag.y=e.clientY;}}
  }
  onMove(e){
    if(this.mode==='off'||!this.pointers.has(e.pointerId))return;
    const prev=this.pointers.get(e.pointerId);this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(this.pointers.size===2){const d=this.dist();if(this.pinchDistance&&d>5)this.setRadius(this.radius*this.pinchDistance/d);this.pinchDistance=d;e.preventDefault();return;}
    const drag=this.drag;if(!drag||drag.id!==e.pointerId)return;
    if(drag.handle){this.moveHandle(e,drag);}else{
      const dx=e.clientX-prev.x,dy=e.clientY-prev.y;
      const next=this.angles.slice();
      if(this.axis==='x')next[0]+=dy*.53;
      else if(this.axis==='y')next[1]+=dx*.53;
      else if(this.axis==='z')next[2]+=(dx-dy)*.45;
      else if(e.shiftKey)next[2]+=(dx-dy)*.45;
      else {next[0]+=dy*.43;next[1]+=dx*.43;}
      this.setAngles(next);
    }
    e.preventDefault();
  }
  onUp(e){
    if(!this.pointers.has(e.pointerId))return;
    this.pointers.delete(e.pointerId);
    if(this.drag?.id===e.pointerId){if(this.drag.changed)this.onHandleEnd?.();this.drag=null;}
    if(this.pointers.size<2)this.pinchDistance=null;
  }
  state(){return {angles:this.angles.slice(),radius:this.radius,mode:this.mode,axis:this.axis,editAxis:this.editAxis};}
  applyState(s){if(!s||!Array.isArray(s.angles)||s.angles.length!==3||!s.angles.every(Number.isFinite))return;
    this.radius=Math.min(200,Math.max(2,Number(s.radius)||14));this.axis=['free','x','y','z'].includes(s.axis)?s.axis:'free';
    this.editAxis=s.editAxis==='z'?'z':'xy';this.setMode(['off','view','edit'].includes(s.mode)?s.mode:'off');this.setAngles(s.angles,false);
  }
  dispose(){this.disposed=true;this.sizeObserver.disconnect();this.geo.dispose();this.staticGroup.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
    this.renderer.dispose();this.renderer.domElement.remove();}
}
