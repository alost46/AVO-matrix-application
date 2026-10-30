/* AVO Core 1.0 (frozen from validated Matrix Powers 01e).
   Camera + rays + input + state + languages + rendering only.
   Math is supplied through options.createModel; keep this file unchanged for future apps.
*/
window.AVOCore = Object.freeze({
 start(options){
 const THREE=options.THREE,OrbitControls=options.OrbitControls;

const COLORS=[0xf02a28,0x2454e7,0x7ed321];
const CSS=['red','blue','green'];

const I18N=options.messages;
let lang='ru';const t=k=>I18N[lang][k]||k;

const makePoints=(array)=>array.map(v=>new THREE.Vector3(...v));
const initialA=makePoints(options.initialA||[[1,0,0],[0,1,0],[0,0,1]]);
// Output matrices are initialized before the math plug-in computes A² and Aⁿ.
const initialB=makePoints(options.initialB||[[1,0,0],[0,1,0],[0,0,1]]);
const matrices={a:initialA.map(p=>p.clone()),b:initialB.map(p=>p.clone()),ba:initialA.map(p=>p.clone())};
const charts={};
const origin=new THREE.Vector3();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const format=(x)=>!Number.isFinite(x)?'∞':Math.abs(x)<0.005?'0.00':Math.abs(x)>=10000?x.toExponential(2):x.toFixed(2);
const LABEL=options.labels||{a:'A',b:'A²',ba:'Aⁿ'};
const editableSet=new Set(options.editable||['a']);
const model=options.createModel({THREE,matrices,format,t,charts,snapshotState,recalcBA,scheduleSave,recordAction});


function newGrid(axis,at){
 const lines=[];
 for(let i=-3;i<=3;i++){
  if(axis==='xy')lines.push(-3,i,at,3,i,at,i,-3,at,i,3,at);
  else if(axis==='xz')lines.push(-3,at,i,3,at,i,i,at,-3,i,at,3);
  else lines.push(at,-3,i,at,3,i,at,i,-3,at,i,3);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));
 return new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0xa2b1bd,transparent:true,opacity:.48,depthWrite:false}));
}
function newLine(color,widthIgnored=1){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));
 return new THREE.Line(g,new THREE.LineBasicMaterial({color,depthTest:false}));
}
function updateLine(line,start,end){
 const a=line.geometry.attributes.position;
 a.setXYZ(0,start.x,start.y,start.z);a.setXYZ(1,end.x,end.y,end.z);
 a.needsUpdate=true;line.geometry.computeBoundingSphere();
}
/* Mathematical model is supplied by the application plug-in. */
function recalcBA(){
 model.compute();
 renderMatrix('b');renderMatrix('ba');
 charts.b?.updateGeometry();charts.ba?.updateGeometry();
 model.updateLabels();
}
function createMatrixTable(id){
 const tbody=document.getElementById('matrix-'+id),table=[];
 for(let r=0;r<3;r++){
  const tr=document.createElement('tr');table[r]=[];
  for(let c=0;c<3;c++){
   const td=document.createElement('td');td.className=CSS[c];
   if(!editableSet.has(id)){table[r][c]=td;}
   else{
    const input=document.createElement('input');input.type='text';input.inputMode='decimal';input.autocomplete='off';input.spellcheck=false;
    input.className=CSS[c];input.setAttribute('aria-label',`${id.toUpperCase()} ${t('vectorAria').replace('{row}',r+1).replace('{column}',c+1)}`);
    const applyInput=()=>{
     const raw=input.value.trim().replace(',','.');
     if(raw===''||raw==='-'||raw==='.'||raw==='-.')return;
     const value=Number(raw);
     if(!Number.isFinite(value))return;
     matrices[id][c].setComponent(r,clamp(value,-3,3));updateFromMatrix(id);
    };
    input.addEventListener('focus',()=>{input._undoStart=snapshotState();});
    input.addEventListener('input',applyInput);
    input.addEventListener('change',()=>{applyInput();});
    input.addEventListener('blur',()=>{input.value=format(matrices[id][c].getComponent(r));recordAction(input._undoStart);input._undoStart=null;});
    td.appendChild(input);table[r][c]=input;
   }
   tr.appendChild(td);
  }
  tbody.appendChild(tr);
 }
 return table;
}
const matrixCells={a:createMatrixTable('a'),b:createMatrixTable('b'),ba:createMatrixTable('ba')};
// Equation of the plane through transformed endpoints A_i or BA_i + t.
// The affine plane uses the translated points, not the unshifted BA columns.
// Recalculate from exact current vector coordinates, not rounded matrix inputs.
function updatePlaneEquation(id){model.renderPlaneEquation(id);}
function matrixCharacteristics(id){model.renderCharacteristics(id);}
function renderMatrix(id){
 for(let r=0;r<3;r++)for(let c=0;c<3;c++){
  const value=format(matrices[id][c].getComponent(r));
  const cell=matrixCells[id][r][c];
  if(!editableSet.has(id))cell.textContent=value;
  else if(document.activeElement!==cell)cell.value=value;
 }
 updatePlaneEquation(id);
 matrixCharacteristics(id);
}
function updateFromMatrix(id){
 renderMatrix(id);
 charts[id]?.updateGeometry();
 recalcBA();
 scheduleSave();
}


function addPlaneGeometry(chart){
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(18),3));
 const material=new THREE.MeshBasicMaterial({color:0xffc12b,side:THREE.DoubleSide,transparent:true,opacity:.12,depthWrite:false});
 chart.planeMesh=new THREE.Mesh(geometry,material);chart.planeMesh.renderOrder=2;chart.scene.add(chart.planeMesh);
 const gridGeometry=new THREE.BufferGeometry();gridGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(22*2*3),3));
 chart.planeGrid=new THREE.LineSegments(gridGeometry,new THREE.LineBasicMaterial({color:0xeeaa0a,transparent:true,opacity:.8,depthWrite:false}));
 chart.planeGrid.renderOrder=3;chart.scene.add(chart.planeGrid);
}
function updatePlaneGeometry(chart){
 const [p1,p2,p3]=matrices[chart.id].map(p=>model.displayPoint(chart.id,p));
 const u=new THREE.Vector3().subVectors(p2,p1),v=new THREE.Vector3().subVectors(p3,p1);
 if(u.clone().cross(v).length()<1e-7 || u.length()<1e-7 || v.length()<1e-7){chart.planeMesh.visible=false;chart.planeGrid.visible=false;return;}
 chart.planeMesh.visible=true;chart.planeGrid.visible=true;
 const center=p1.clone().add(p2).add(p3).multiplyScalar(1/3);
 u.normalize().multiplyScalar(2.75);v.normalize().multiplyScalar(2.75);
 const corner=(a,b)=>center.clone().addScaledVector(u,a).addScaledVector(v,b);
 const [a,b,c,d]=[corner(-1,-1),corner(1,-1),corner(1,1),corner(-1,1)];
 const tri=[a,b,c,a,c,d],attr=chart.planeMesh.geometry.attributes.position;
 tri.forEach((p,i)=>attr.setXYZ(i,p.x,p.y,p.z));attr.needsUpdate=true;chart.planeMesh.geometry.computeBoundingSphere();
 const gridAttr=chart.planeGrid.geometry.attributes.position;let idx=0;
 const put=p=>{gridAttr.setXYZ(idx++,p.x,p.y,p.z);};
 for(let i=0;i<=10;i++){
  const t=-1+2*i/10;
  put(corner(t,-1));put(corner(t,1));
  put(corner(-1,t));put(corner(1,t));
 }
 // 11 lines in each direction = 22 line segments = 44 vertices.
 gridAttr.needsUpdate=true;chart.planeGrid.geometry.computeBoundingSphere();
}
const BASE_POS=new THREE.Vector3(8,-9,7),BASE_UP=new THREE.Vector3(0,0,1);
// Absolute Euler angles of the camera in world XYZ coordinates.
// The default camera (8,-9,7) is deliberately NOT the zero orientation.
// Camera local +Z points from the target toward the eye; local +Y is camera up.
const CAMERA_BACK=new THREE.Vector3(0,0,1),CAMERA_UP=new THREE.Vector3(0,1,0);
const DEG=180/Math.PI;
let expanded=null;
let sharedView=false;
let sharedAngles=null;
const editEnabled={a:false,b:false,ba:false};
function anglesOf(chart){
 if(!chart)return [0,0,0];
 const e=new THREE.Euler().setFromQuaternion(chart.camera.quaternion,'XYZ');
 return [e.x*DEG,e.y*DEG,e.z*DEG];
}
function currentAngles(id='a'){const c=charts[id];return c?.rayAngles?c.rayAngles.slice():anglesOf(c);}
function updateControlAccess(){
 for(const id of ['a','b','ba']){
  const chart=charts[id];if(!chart)continue;
  const active=editEnabled[id];
  chart.root.closest('.panel').classList.toggle('editing',active);
  const btn=document.querySelector(`[data-edit="${id}"]`);
  btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
  chart.controls.enabled=active;
  chart.controls.enableRotate=active&&!sharedView;
  chart.controls.enableZoom=active;
  chart.canvas.style.touchAction=active?'none':'pan-y';
  chart.updateMarkerVisibility();
 }
 const button=document.getElementById('sync-view');
 button.classList.toggle('active',sharedView);button.setAttribute('aria-pressed',String(sharedView));
 document.getElementById('global-view-panel').hidden=!sharedView;
 for(const id of ['a','b','ba'])document.getElementById('local-rays-'+id).hidden=!(expanded===id||editEnabled[id]);
 updateRays();
}
function cameraOrientation(chart,angles){
 chart.rayAngles=angles.slice();
 const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(...angles.map(v=>v/DEG),'XYZ'));
 const distance=chart.camera.position.distanceTo(chart.controls.target);
 const offset=CAMERA_BACK.clone().applyQuaternion(q).multiplyScalar(distance);
 chart.camera.position.copy(chart.controls.target).add(offset);
 chart.camera.up.copy(CAMERA_UP).applyQuaternion(q);
 chart.camera.lookAt(chart.controls.target);
 chart._lastRayQuaternion=chart.camera.quaternion.clone();
 chart.refreshWarning();
}
function setAnglesByRay(axis,value,id='a'){
 const master=sharedView;
 const angles=master?(sharedAngles||currentAngles(id)).slice():currentAngles(id);
 angles[axis]=value;
 cameraSyncing=true;
 try{
  if(master){sharedAngles=angles.slice();for(const chart of Object.values(charts))cameraOrientation(chart,angles);}
  else cameraOrientation(charts[id],angles);
 }finally{cameraSyncing=false;}
 updateRays();scheduleSave();
}
function setSharedView(on){
 if(sharedView===on)return;
 const before=snapshotState();
 sharedView=on;
 if(on){
  if(!sharedAngles)sharedAngles=currentAngles('a');
  cameraSyncing=true;
  try{for(const chart of Object.values(charts))cameraOrientation(chart,sharedAngles);}
  finally{cameraSyncing=false;}
 }
 updateControlAccess();recordAction(before);
}
function setEditMode(id,on){
 for(const key of ['a','b','ba'])editEnabled[key]=key===id?on:false;
 updateControlAccess();
}
const rayGroups=[];
function installRays(){
 const contexts=[{id:'global',container:'angle-rays'},...['a','b','ba'].map(id=>({id,container:'angle-rays-'+id}))];
 for(const context of contexts){
  const wrap=document.getElementById(context.container);
  const dials=[];rayGroups.push({id:context.id,dials});
  for(let axis=0;axis<3;axis++){
   const name=['X','Y','Z'][axis];
   const dial=document.createElement('div');dial.className='ray-dial';dial.setAttribute('role','slider');
   dial.setAttribute('aria-label',t('rayAria').replace('{chart}',context.id.toUpperCase()).replace('{axis}',name));dial.setAttribute('aria-valuemin','-180');dial.setAttribute('aria-valuemax','180');dial.tabIndex=0;
   dial.innerHTML=`<svg viewBox="0 0 94 86" aria-hidden="true"><circle cx="46" cy="43" r="35" fill="none" stroke="#d3e0ed" stroke-width="1.4"/><line x1="46" y1="43" x2="83" y2="43" stroke="#8a9bab" stroke-width="2.5"/><line class="moving-ray" x1="46" y1="43" x2="81" y2="43" stroke="#2667b2" stroke-width="3.5" stroke-linecap="round"/><circle cx="46" cy="43" r="3.5" fill="#53677b"/><circle class="ray-tip" cx="81" cy="43" r="9" fill="#145fa8" stroke="white" stroke-width="4"/></svg><span class="ray-info"><strong>${name}</strong><input class="angle-input" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="${name} degrees" value="0" /><output hidden>0°</output></span>`;
   wrap.appendChild(dial);dials.push(dial);
   const field=dial.querySelector('input.angle-input');
   // Editing the number must not drag the ray or move the page.
   field.addEventListener('pointerdown',ev=>ev.stopPropagation());
   field.addEventListener('pointermove',ev=>ev.stopPropagation());
   field.addEventListener('click',ev=>ev.stopPropagation());
   field.addEventListener('focus',()=>field.select());
   const commitAngle=()=>{
    const raw=field.value.trim().replace(',', '.').replace(/°/g,'');
    const next=Number(raw);
    if(raw===''||!Number.isFinite(next)||next < -180||next > 180){
     field.value=String(Math.round((sharedView?(sharedAngles||currentAngles('a')):currentAngles(context.id==='global'?'a':context.id))[axis]*100)/100);
     return;
    }
    const before=snapshotState();
    setAnglesByRay(axis,next,sharedView?'a':context.id);
    recordAction(before);
    field.value=String(next);
   };
   field.addEventListener('keydown',ev=>{
    ev.stopPropagation();
    if(ev.key==='Enter'){ev.preventDefault();field.blur();}
    if(ev.key==='Escape'){ev.preventDefault();field.dataset.cancelled='1';field.blur();updateRays();}
   });
   field.addEventListener('blur',()=>{if(field.dataset.cancelled==='1'){delete field.dataset.cancelled;return;}commitAngle();});
   let pointerId=null,rayStart=null;
   const allowed=()=>sharedView||context.id!=='global';
   const actualId=()=>sharedView?'a':context.id;
   const doPointer=event=>{
    if(!allowed())return;
    const rect=dial.querySelector('svg').getBoundingClientRect();
    const x=(event.clientX-rect.left)*94/rect.width-46,y=43-(event.clientY-rect.top)*86/rect.height;
    if(Math.hypot(x,y)<4)return;
    setAnglesByRay(axis,Math.atan2(y,x)*DEG,actualId());
   };
   dial.addEventListener('pointerdown',ev=>{if(pointerId!==null||!allowed())return;rayStart=snapshotState();pointerId=ev.pointerId;ev.preventDefault();dial.setPointerCapture(pointerId);doPointer(ev);});
   dial.addEventListener('pointermove',ev=>{if(ev.pointerId===pointerId){ev.preventDefault();doPointer(ev);}});
   const finish=ev=>{if(ev.pointerId===pointerId){pointerId=null;recordAction(rayStart);rayStart=null;}};
   for(const type of ['pointerup','pointercancel','lostpointercapture'])dial.addEventListener(type,finish);
   dial.addEventListener('keydown',ev=>{if(['ArrowRight','ArrowUp','ArrowLeft','ArrowDown'].includes(ev.key)&&allowed()){
    ev.preventDefault();const before=snapshotState(),delta=['ArrowRight','ArrowUp'].includes(ev.key)?1:-1;
    setAnglesByRay(axis,(sharedView?(sharedAngles||currentAngles('a')):currentAngles(context.id))[axis]+delta*(ev.shiftKey?10:5),actualId());recordAction(before);
   }});
  }
 }
 updateRays();
}
function updateRays(){
 for(const group of rayGroups){
  const angles=sharedView?(sharedAngles||currentAngles('a')):currentAngles(group.id==='global'?'a':group.id);
  angles.forEach((degree,i)=>{
   const dial=group.dials[i];if(!dial)return;
   const angle=degree/DEG,x=46+35*Math.cos(angle),y=43-35*Math.sin(angle);
   dial.querySelector('.moving-ray').setAttribute('x2',x.toFixed(2));
   dial.querySelector('.moving-ray').setAttribute('y2',y.toFixed(2));
   dial.querySelector('.ray-tip').setAttribute('cx',x.toFixed(2));
   dial.querySelector('.ray-tip').setAttribute('cy',y.toFixed(2));
   dial.querySelector('output').textContent=`${Math.round(degree)}°`;
   const field=dial.querySelector('input.angle-input');
   if(document.activeElement!==field)field.value=String(Math.round(degree*100)/100||0);
   dial.setAttribute('aria-valuenow',String(Math.round(degree)));
  });
 }
}

class Chart{
 constructor(id){
  this.id=id;this.editable=editableSet.has(id);this.mode='xy';this.selected=-1;this.gesture=null;this.lastOrbit=false;
  this.root=document.getElementById('plot-'+id);this.status=document.getElementById('status-'+id);
  this.live=document.getElementById('live-'+id);
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xffffff);
  this.camera=new THREE.OrthographicCamera(-4.7,4.7,4.7,-4.7,.1,100);
  this.camera.up.set(0,0,1);this.resetCamera(true);
  try{this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'default'});}catch(err){this.status.textContent=t('webglUnavailable');throw err;}
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  this.renderer.setSize(Math.max(1,this.root.clientWidth),Math.max(1,this.root.clientHeight),false);
  this.root.prepend(this.renderer.domElement);this.canvas=this.renderer.domElement;
  this.labelsCanvas=document.createElement('canvas');
  this.labelsCanvas.className='axis-label-layer';
  this.labelsCanvas.setAttribute('aria-hidden','true');
  this.root.appendChild(this.labelsCanvas);
  this.labelsCtx=this.labelsCanvas.getContext('2d');
  this.controls=new OrbitControls(this.camera,this.canvas);
  this.controls.enableDamping=true;this.controls.dampingFactor=.09;this.controls.enablePan=false;
  this.controls.minZoom=.55;this.controls.maxZoom=5;this.controls.target.set(0,0,0);this.controls.update();
  this.scene.add(newGrid('xy',-3),newGrid('xz',3),newGrid('yz',-3));
  for(const [a,b] of [[[-3,0,0],[3,0,0]],[[0,-3,0],[0,3,0]],[[0,0,-3],[0,0,3]]]){
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]),new THREE.LineBasicMaterial({color:0x273747,depthTest:false}));
   line.renderOrder=1;this.scene.add(line);
  }
  this.shafts=[];this.markers=[];
  for(let c=0;c<3;c++){
   const line=newLine(COLORS[c]);line.renderOrder=6;this.scene.add(line);this.shafts.push(line);
   const marker=new THREE.Mesh(new THREE.SphereGeometry(.125,22,14),new THREE.MeshBasicMaterial({color:COLORS[c],depthTest:false}));
   marker.renderOrder=11;this.scene.add(marker);this.markers.push(marker);
  }
   this.halo=new THREE.Mesh(new THREE.SphereGeometry(.195,24,16),new THREE.MeshBasicMaterial({color:0x1c3040,transparent:true,opacity:.22,depthTest:false,depthWrite:false}));
  this.halo.renderOrder=10;this.halo.visible=false;this.scene.add(this.halo);
  addPlaneGeometry(this);
  if(this.editable)this.attachPointerEvents();
  else this.attachResultRotation();
  this._lastRayQuaternion=this.camera.quaternion.clone();
  this.controls.addEventListener('change',()=>{
   if(!cameraSyncing){
    // Actual OrbitControls rotation takes precedence over manually entered ray angles.
    // Zoom-only changes keep those values, because the orientation is unchanged.
    const oldQ=this._lastRayQuaternion;
    const changedOrientation=!oldQ||1-Math.abs(oldQ.dot(this.camera.quaternion))>1e-10;
    if(changedOrientation)this.rayAngles=null;
    this._lastRayQuaternion=this.camera.quaternion.clone();
    if(webReady){updateRays();scheduleSave();}
   }
  });
  this.controls.addEventListener('start',()=>{if(!this.gesture){this.rayAngles=null;this._orbitStart=snapshotState();this.lastOrbit=true;this.status.textContent=t('orbitStart');}});
  this.controls.addEventListener('end',()=>{if(this.lastOrbit&&!this.gesture){this.status.textContent=t('orbitEnd');this.lastOrbit=false;recordAction(this._orbitStart);this._orbitStart=null;}});
  new ResizeObserver(()=>this.resize()).observe(this.root);
  this.resize();this.updateGeometry();
  this.status.textContent=t(this.editable?'readyEdit':'readyResult');
 }
 // A one-time frustum fit for opening a compact mobile plot.
 // It does not change camera position, Euler angles, saved zoom or matrix data.
 // Subsequent finger/wheel zoom still uses the existing OrbitControls mechanism.
 computeExpandedFitSpan(){
  const w=Math.max(1,this.root.clientWidth),h=Math.max(1,this.root.clientHeight),aspect=w/h;
  const inv=this.camera.quaternion.clone().invert();
  const target=this.controls.target;
  let mx=0,my=0;
  for(const x of [-3,3])for(const y of [-3,3])for(const z of [-3,3]){
   const p=new THREE.Vector3(x,y,z).sub(target).applyQuaternion(inv);
   mx=Math.max(mx,Math.abs(p.x));my=Math.max(my,Math.abs(p.y));
  }
  // 14% breathing room also helps keep axis labels inside the canvas.
  const required=aspect>=1?Math.max(my,mx/aspect):Math.max(mx,my*aspect);
  return Math.max(4.6,required*this.camera.zoom*1.14);
 }
 resetCamera(beforeControls=false){
  this.camera.position.set(8,-9,7);this.camera.lookAt(0,0,0);this.camera.zoom=1;this.camera.updateProjectionMatrix();
  if(!beforeControls){this.controls.target.set(0,0,0);this.controls.update();this.status.textContent=t('resetViewDone');this.refreshWarning();}
 }
 resize(){
  const w=Math.max(1,this.root.clientWidth),h=Math.max(1,this.root.clientHeight),aspect=w/h,span=this.expandedFitSpan||4.6;
  if(aspect>=1){this.camera.left=-span*aspect;this.camera.right=span*aspect;this.camera.top=span;this.camera.bottom=-span;}
  else{this.camera.left=-span;this.camera.right=span;this.camera.top=span/aspect;this.camera.bottom=-span/aspect;}
  this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);
  const dpr=Math.min(window.devicePixelRatio||1,2);
  this.labelsCanvas.width=Math.round(w*dpr);
  this.labelsCanvas.height=Math.round(h*dpr);
  this.labelsCtx.setTransform(dpr,0,0,dpr,0,0);
  this.updateMarkerVisibility();
  this.refreshWarning();
 }
 updateMarkerVisibility(){
  if(!this.editable)return;
  const panel=this.root.closest('.panel');
  const compact=panel && !panel.classList.contains('expanded');
  const editing=editEnabled[this.id];
  const minPixels=compact && editing?11:7;
  const worldPerPixel=(this.camera.top-this.camera.bottom)/(Math.max(1,this.root.clientHeight)*this.camera.zoom);
  const radius=Math.max(.125,Math.min(.24,minPixels*worldPerPixel));
  for(const marker of this.markers){marker.scale.setScalar(radius/.125);}
  this.markerRadius=radius;
 }
 updateGeometry(){
  for(let c=0;c<3;c++){
   const start=origin;
   const end=model.displayPoint(this.id,matrices[this.id][c]);
   updateLine(this.shafts[c],start,end);this.markers[c].position.copy(end);
  }
  if(this.planeMesh)updatePlaneGeometry(this);
  if(this.id!=='a')updatePlaneEquation(this.id);
  this.updateMarkerVisibility();
  this.halo.visible=this.selected>=0;
  if(this.selected>=0)this.halo.position.copy(matrices[this.id][this.selected]);
  if(this.live){
   this.live.style.display=this.gesture?'block':'none';
   if(this.selected<0)this.live.textContent=LABEL[this.id]+': '+t('tapMarker');
   else{const p=matrices[this.id][this.selected];this.live.textContent=`${LABEL[this.id]+(this.selected+1)} = (${format(p.x)}, ${format(p.y)}, ${format(p.z)})`;}
  }
  this.refreshWarning();
 }
 screenPos(point){
  const p=point.clone().project(this.camera),b=this.canvas.getBoundingClientRect();
  return {x:b.left+(p.x+1)*b.width/2,y:b.top+(1-p.y)*b.height/2,z:p.z};
 }
 pickMarker(ev){
  const rad=ev.pointerType==='mouse'?21:31;let found=-1,best=rad*rad;
  for(let i=0;i<3;i++){
   const p=this.screenPos(matrices[this.id][i]);if(p.z < -1||p.z>1)continue;
   const d2=(p.x-ev.clientX)**2+(p.y-ev.clientY)**2;
   if(d2<=best){best=d2;found=i;}
  }
  return found;
 }
 screenBasis(point){
  const base=this.screenPos(point);
  return [new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)]
   .map(axis=>{const p=this.screenPos(point.clone().add(axis));return [p.x-base.x,p.y-base.y];});
 }
 constrainedPosition(g,dx,dy){
  const next=g.start.clone(),a=g.basis[0],b=g.basis[1],z=g.basis[2];
  const damping=12*12,maximum=.035*Math.hypot(dx,dy);
  if(g.mode==='xy'){
   const aa=a[0]*a[0]+a[1]*a[1]+damping,bb=b[0]*b[0]+b[1]*b[1]+damping;
   const ab=a[0]*b[0]+a[1]*b[1],ra=a[0]*dx+a[1]*dy,rb=b[0]*dx+b[1]*dy,det=aa*bb-ab*ab;
   let u=(ra*bb-rb*ab)/det,v=(rb*aa-ra*ab)/det;
   const dist=Math.hypot(u,v);if(dist>maximum&&dist>1e-9){u*=maximum/dist;v*=maximum/dist;}
   next.x=clamp(g.start.x+u,-3,3);next.y=clamp(g.start.y+v,-3,3);
  }else{
   // Move along the visible Z projection without the heavy XY damping.
   // If Z points almost directly toward the camera, vertical drag remains usable.
   const length2=z[0]*z[0]+z[1]*z[1];
   const dz=length2>64
    ? (z[0]*dx+z[1]*dy)/length2
    : -dy*0.015;
   next.z=clamp(g.start.z+clamp(dz,-3,3),-3,3);
  }
  return next;
 }
 endGesture(ev){
  if(!this.gesture||(ev&&ev.pointerId!==this.gesture.pointerId))return;
  try{if(this.canvas.hasPointerCapture(this.gesture.pointerId))this.canvas.releasePointerCapture(this.gesture.pointerId);}catch(_){ }
  recordAction(this.gesture.undoStart);
  this.gesture=null;this.controls.enabled=editEnabled[this.id];this.root.classList.remove('dragging');
  if(this.live)this.live.style.display='none';
  if(this.selected>=0)this.status.textContent=`${LABEL[this.id]+(this.selected+1)}: ${t('vectorFinished')}`;
 }
 attachPointerEvents(){
  const canvas=this.canvas;
  canvas.addEventListener('pointerdown',ev=>{
   if(!editEnabled[this.id])return;
   if(this.gesture){ev.preventDefault();ev.stopImmediatePropagation();return;}
   if(ev.pointerType==='mouse'&&ev.button!==0)return;
   const i=this.pickMarker(ev);
   if(i<0){this.lastOrbit=true;return;}
   ev.preventDefault();ev.stopImmediatePropagation();this.selected=i;this.controls.enabled=false;
   const point=matrices[this.id][i];
   this.gesture={pointerId:ev.pointerId,index:i,mode:this.mode,start:point.clone(),x:ev.clientX,y:ev.clientY,basis:this.screenBasis(point),undoStart:snapshotState()};
   canvas.setPointerCapture(ev.pointerId);this.root.classList.add('dragging');
   this.status.textContent=`${t('selectedMarker')} ${i===3?'t':LABEL[this.id]+(i+1)}. ${this.mode.toUpperCase()}; ${t('cameraStill')}`;
   this.updateGeometry();
  },true);
  canvas.addEventListener('pointermove',ev=>{
   if(!this.gesture||ev.pointerId!==this.gesture.pointerId)return;
   ev.preventDefault();ev.stopImmediatePropagation();
   const dx=ev.clientX-this.gesture.x,dy=ev.clientY-this.gesture.y;
   matrices[this.id][this.gesture.index].copy(this.constrainedPosition(this.gesture,dx,dy));updateFromMatrix(this.id);
  },true);
  canvas.addEventListener('pointerup',ev=>{
   if(!this.gesture||ev.pointerId!==this.gesture.pointerId)return;
   ev.preventDefault();ev.stopImmediatePropagation();this.endGesture(ev);
  },true);
  canvas.addEventListener('pointercancel',ev=>{if(!this.gesture||ev.pointerId!==this.gesture.pointerId)return;ev.stopImmediatePropagation();this.endGesture(ev);},true);
  canvas.addEventListener('lostpointercapture',ev=>{if(this.gesture&&ev.pointerId===this.gesture.pointerId)this.endGesture(ev);});
 }
 attachResultRotation(){
  // Result BA has no editable endpoints. XY uses the existing OrbitControls;
  // Z rotates the common camera around the world Z axis without changing data.
  const canvas=this.canvas;
  const touches=new Map();
  let lastX=null, lastDistance=null,rotationStart=null;
  const distance=()=>{
   const a=[...touches.values()];
   return a.length>=2?Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y):null;
  };
  canvas.addEventListener('pointerdown',ev=>{
   if(!editEnabled[this.id]||this.mode!=='z'||sharedView||(ev.pointerType==='mouse'&&ev.button!==0))return;
   ev.preventDefault();ev.stopImmediatePropagation();
   if(touches.size===0)rotationStart=snapshotState();
   touches.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
   try{canvas.setPointerCapture(ev.pointerId);}catch(_){}
   lastX=touches.size===1?ev.clientX:null;
   lastDistance=distance();
  },true);
  canvas.addEventListener('pointermove',ev=>{
   if(!touches.has(ev.pointerId))return;
   ev.preventDefault();ev.stopImmediatePropagation();
   touches.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
   if(touches.size>=2){
    const next=distance();
    if(lastDistance&&next){
     this.camera.zoom=clamp(this.camera.zoom*next/lastDistance,.55,5);
     this.camera.updateProjectionMatrix();
     updateRays();scheduleSave();
    }
    lastDistance=next;lastX=null;
   }else if(lastX!==null){
    const delta=ev.clientX-lastX;lastX=ev.clientX;
    const axis=new THREE.Vector3(0,0,1);
    const q=new THREE.Quaternion().setFromAxisAngle(axis,-delta*.009);
    const offset=this.camera.position.clone().sub(this.controls.target).applyQuaternion(q);
    this.camera.position.copy(this.controls.target).add(offset);
    this.camera.up.applyQuaternion(q);
    this.camera.lookAt(this.controls.target);
    updateRays();scheduleSave();
   }else lastX=ev.clientX;
   this.status.textContent=t('orbitEnd');
  },true);
  const release=ev=>{
   if(!touches.has(ev.pointerId))return;
   ev.preventDefault();ev.stopImmediatePropagation();
   touches.delete(ev.pointerId);
   if(touches.size===0){recordAction(rotationStart);rotationStart=null;}
   lastDistance=distance();lastX=touches.size===1?[...touches.values()][0].x:null;
   try{if(canvas.hasPointerCapture(ev.pointerId))canvas.releasePointerCapture(ev.pointerId);}catch(_){}
  };
  canvas.addEventListener('pointerup',release,true);
  canvas.addEventListener('pointercancel',release,true);
 }
 setMode(next){
  this.mode=next;
  for(const btn of document.querySelectorAll(`.mode[data-chart="${this.id}"]`)){
   const active=btn.dataset.mode===next;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
  }
  this.status.textContent=this.id==='ba'?(next==='xy'?'BA: XY · '+t('orbitStart'):'BA: Z · '+t('orbitStart')):t(next==='xy'?'modeXY':'modeZ');
  scheduleSave();
 }
 refreshWarning(){
  if(!this.editable)return;
  const warning=document.getElementById('warn-'+this.id);
  if(!warning)return;
  // The markers are spheres of radius 0.125 world units. In orthographic
  // projection their visible circle radius is independent of orientation.
  // Warn only when two actual visible circles touch or overlap on screen.
  const points=[...matrices[this.id]].map(p=>this.screenPos(p));
  const radius=(this.markerRadius||.125)*this.root.clientHeight*this.camera.zoom/(this.camera.top-this.camera.bottom);
  let intersects=false;
  for(let i=0;i<points.length&&!intersects;i++)for(let j=i+1;j<points.length;j++){
   const d=Math.hypot(points[i].x-points[j].x,points[i].y-points[j].y);
   if(d<=2*radius){intersects=true;break;}
  }
  warning.hidden=!intersects;
 }
 drawAxisLabels(){
  // Only the 2D annotation layer is changed in 03d. The 3D scene, gesture
  // handlers, view synchronization and matrices are exactly as in 03b.
  const ctx=this.labelsCtx;if(!ctx)return;
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
 animate(){this.controls.update();this.refreshWarning();this.renderer.render(this.scene,this.camera);this.drawAxisLabels();}
}

// Durable state: local browser auto-save, portable JSON, and gesture-level undo.
// Never store BA directly: the result is always recomputed as B × A.
const STATE_KEY=options.stateKey;
const HISTORY_LIMIT=60;
const undoHistory=[];
let persistenceReady=false,restoringState=false,saveTimer=null;
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const roundState=v=>Number(v.toFixed(8));
function cameraData(chart){const c=chart.camera;return {position:c.position.toArray().map(roundState),up:c.up.toArray().map(roundState),zoom:roundState(c.zoom),target:chart.controls.target.toArray().map(roundState)};}
function validCamera(c){
 const xyz=arr=>Array.isArray(arr)&&arr.length===3&&arr.every(n=>finite(n)&&Math.abs(n)<10000);
 return !!c&&xyz(c.position)&&xyz(c.up)&&xyz(c.target)&&finite(c.zoom)&&c.zoom>=.55&&c.zoom<=5&&Math.hypot(...c.up)>.001&&Math.hypot(...c.position.map((n,i)=>n-c.target[i]))>.001;
}
function snapshotState(){
 const c=charts.a;
 return {version:1,
  a:matrices.a.map(p=>[roundState(p.x),roundState(p.y),roundState(p.z)]),
  ...model.snapshotExtra(),
  camera:c?cameraData(c):null,
  cameras:Object.fromEntries(['a','b','ba'].map(id=>[id,cameraData(charts[id])])),
  sameView:sharedView,
  sharedAngles:sharedAngles?.map(roundState)||null,
  modes:Object.fromEntries(['a','b','ba'].map(id=>[id,charts[id]?.mode||'xy'])),
  language:lang
 };
}
function isValidState(value){
 if(!value||value.version!==1)return false;
 const validColumns=cols=>Array.isArray(cols)&&cols.length===3&&cols.every(col=>
  Array.isArray(col)&&col.length===3&&col.every(n=>finite(n)&&Math.abs(n)<=3));
 if(!validColumns(value.a)||!model.validateExtra(value))return false;
 if(!validCamera(value.camera))return false;
 if(value.cameras && !['a','b','ba'].every(id=>validCamera(value.cameras[id])))return false;
 if(value.sharedAngles && (!Array.isArray(value.sharedAngles)||value.sharedAngles.length!==3||!value.sharedAngles.every(finite)))return false;
 return true;
}
function setSaveMessage(msg){
 const out=document.getElementById('save-status');if(out)out.textContent=msg;
}
function scheduleSave(){
 if(!persistenceReady||restoringState)return;
 clearTimeout(saveTimer);
 saveTimer=setTimeout(()=>{
  try{localStorage.setItem(STATE_KEY,JSON.stringify(snapshotState()));setSaveMessage(t('autoSaved'));}
  catch(_){setSaveMessage(t('storageUnavailable'));}
 },400);
}
function storeImmediately(){
 if(!persistenceReady||restoringState)return;
 clearTimeout(saveTimer);
 try{localStorage.setItem(STATE_KEY,JSON.stringify(snapshotState()));setSaveMessage(t('autoSaved'));}
 catch(_){setSaveMessage(t('storageUnavailable'));}
}
function recordAction(before){
 if(!before||restoringState)return;
 if(JSON.stringify(before)===JSON.stringify(snapshotState()))return;
 undoHistory.push(before);
 if(undoHistory.length>HISTORY_LIMIT)undoHistory.shift();
 updateUndoButton();storeImmediately();
}
function updateUndoButton(){document.getElementById('undo-action').disabled=undoHistory.length===0;}
function applyState(state){
 if(!isValidState(state))throw new Error('Invalid matrix state');
 restoringState=true;
 try{
  for(let i=0;i<3;i++)matrices.a[i].fromArray(state.a[i]);
  model.applyExtra(state);
  for(const id of ['a','b','ba']){
   const ch=charts[id],c=state.cameras?.[id]||state.camera;
   ch.camera.position.fromArray(c.position);
   ch.camera.up.fromArray(c.up);
   ch.controls.target.fromArray(c.target);
   ch.camera.zoom=c.zoom;
   ch.camera.lookAt(ch.controls.target);
   ch.rayAngles=null;
   ch.camera.updateProjectionMatrix();
   const damping=ch.controls.enableDamping;ch.controls.enableDamping=false;
   ch.controls.update();ch.controls.enableDamping=damping;
   ch.setMode(['xy','z'].includes(state.modes?.[id])?state.modes[id]:'xy');
   ch.selected=-1;ch.updateGeometry();ch.refreshWarning();
  }
  sharedView=!!state.sameView;
  // Rebuild from the restored camera: earlier JSON stored angles relative to the old base view.
  sharedAngles=sharedView?currentAngles('a'):null;
  for(const id of ['a','b','ba'])editEnabled[id]=false;
  renderMatrix('a');recalcBA();updateControlAccess();
  if(['ru','en','he'].includes(state.language))setLanguage(state.language);
  updateRays();
 }finally{restoringState=false;}
}
// Explicit factory reset. Do not derive defaults from a browser-restored state.
// Keep the current language, record one undo step, and save the fresh state.
function restartApplication(){
 const before=snapshotState();
 if(expanded)setExpanded(expanded);
 restoringState=true;
 try{
  for(let i=0;i<3;i++)matrices.a[i].copy(initialA[i]);
  model.resetExtra();
  sharedView=false;
  sharedAngles=null;
  for(const id of ['a','b','ba']){
   editEnabled[id]=false;
   const chart=charts[id];
   chart.gesture=null;
   chart.selected=-1;
   chart.root.classList.remove('dragging');
   chart.camera.up.copy(BASE_UP);
   chart.resetCamera();
   const damping=chart.controls.enableDamping;
   chart.controls.enableDamping=false;chart.controls.update();chart.controls.enableDamping=damping;
   chart.setMode('xy');
   chart.updateGeometry();
  }
  renderMatrix('a');recalcBA();
  updateControlAccess();
  updateRays();
 }finally{restoringState=false;}
 recordAction(before);
 storeImmediately();
 setSaveMessage(t('restartDone'));
}
function undoAction(){
 if(!undoHistory.length){setSaveMessage(t('nothingToUndo'));return;}
 const state=undoHistory.pop();
 applyState(state);updateUndoButton();storeImmediately();
}
function exportState(){
 const data=JSON.stringify(snapshotState(),null,2);
 const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=options.fileName||'AVO_state.json';
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
 setSaveMessage(t('exported'));
}
function setupStateControls(){
 document.getElementById('undo-action').addEventListener('click',undoAction);
 document.getElementById('restart-action').addEventListener('click',restartApplication);
 document.getElementById('save-state').addEventListener('click',exportState);
 const chooser=document.getElementById('load-state-input');
 document.getElementById('load-state').addEventListener('click',()=>chooser.click());
 chooser.addEventListener('change',async()=>{
  const file=chooser.files?.[0];if(!file)return;
  try{
   if(file.size>250000)throw new Error('File too large');
   const parsed=JSON.parse(await file.text());
   if(!isValidState(parsed))throw new Error('Invalid state');
   const before=snapshotState();applyState(parsed);recordAction(before);storeImmediately();setSaveMessage(t('imported'));
  }catch(err){setSaveMessage(t('invalidFile'));}
  finally{chooser.value='';}
 });
 window.addEventListener('keydown',ev=>{
  if((ev.ctrlKey||ev.metaKey)&&!ev.shiftKey&&ev.key.toLowerCase()==='z' &&
     !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){
   ev.preventDefault();undoAction();
  }
 });
}
function restoreBrowserState(){
 let saved=null;
 try{saved=localStorage.getItem(STATE_KEY);}catch(_){setSaveMessage(t('storageUnavailable'));return;}
 if(!saved)return;
 try{const parsed=JSON.parse(saved);applyState(parsed);setSaveMessage(t('restored'));}
 catch(_){setSaveMessage(t('invalidFile'));}
}
let webReady=false,cameraSyncing=false;
for(const id of ['a','b','ba']){charts[id]=new Chart(id);}
webReady=true;
installRays();
updateControlAccess();
renderMatrix('a');recalcBA();
model.initUI();
document.getElementById('sync-view').addEventListener('click',()=>setSharedView(!sharedView));
for(const btn of document.querySelectorAll('[data-edit]'))btn.addEventListener('click',()=>setEditMode(btn.dataset.edit,!editEnabled[btn.dataset.edit]));
for(const btn of document.querySelectorAll('.mode'))btn.addEventListener('click',()=>charts[btn.dataset.chart].setMode(btn.dataset.mode));
for(const btn of document.querySelectorAll('[data-reset]'))btn.addEventListener('click',()=>{
 const before=snapshotState();
 const id=btn.dataset.reset;
 if(id==='camera-ba'||id==='camera-b'){charts[id==='camera-b'?'b':'ba'].resetCamera();updateRays();recordAction(before);return;}
 const source=id==='b'?initialB:initialA;
 for(let c=0;c<3;c++)matrices[id][c].copy(source[c]);
 
 charts[id].selected=-1;updateFromMatrix(id);
 charts[id].status.textContent=`${t('matrixRestored')} ${id.toUpperCase()}.`;recordAction(before);
});
function setExpanded(id){
 const current=document.getElementById('panel-'+id);
 if(expanded===id){current.classList.remove('expanded');document.body.classList.remove('has-expanded');expanded=null;charts[id].expandedFitSpan=null;}
 else{
  if(expanded){document.getElementById('panel-'+expanded).classList.remove('expanded');charts[expanded].expandedFitSpan=null;}
  current.classList.add('expanded');document.body.classList.add('has-expanded');expanded=id;
 }
 for(const btn of document.querySelectorAll('[data-expand]'))btn.textContent=btn.dataset.expand===expanded?t('collapse'):t('expand');
 for(const id of ['a','b','ba'])updatePlaneEquation(id);
 updateControlAccess();
 requestAnimationFrame(()=>{
  if(expanded && window.matchMedia('(max-width:690px)').matches){
   const chart=charts[expanded];chart.expandedFitSpan=null;
   chart.expandedFitSpan=chart.computeExpandedFitSpan();
  }
  for(const chart of Object.values(charts))chart.resize();
 });
}
for(const btn of document.querySelectorAll('[data-expand]'))btn.addEventListener('click',()=>setExpanded(btn.dataset.expand));
window.addEventListener('keydown',ev=>{if(ev.key==='Escape'){if(document.getElementById('help-dialog').open)document.getElementById('help-dialog').close();else if(expanded)setExpanded(expanded);}});

function setLanguage(next){
 lang=next;document.documentElement.lang=next;document.title=t('appTitle')+' · '+(options.version||'AVO Core 1.0');
 for(const el of document.querySelectorAll('[data-i18n]'))el.textContent=t(el.dataset.i18n);
 for(const el of document.querySelectorAll('[data-lang]'))el.classList.toggle('active',el.dataset.lang===next);
 const body=document.getElementById('help-body');body.innerHTML=I18N[next].helpHtml;body.dir=next==='he'?'rtl':'ltr';
 for(const btn of document.querySelectorAll('[data-expand]'))btn.textContent=btn.dataset.expand===expanded?t('collapse'):t('expand');
 // Refresh content created at runtime, not just elements marked data-i18n.
 for(const id of ['a','b','ba']){
  updatePlaneEquation(id);
  matrixCharacteristics(id);
  const ch=charts[id];
  if(ch){
   ch.status.textContent=t(id!=='a'?'readyResult':editEnabled[id]?'readyEdit':'readyIdle');
   ch.updateGeometry();
  }
  const panel=document.getElementById('panel-'+id);
  panel.setAttribute('aria-label',t(id==='a'?'chartAriaA':id==='b'?'chartAriaB':'chartAriaBA'));
 }
 document.querySelector('#plot-ba .overlay').textContent=t('baOverlay');model.onLanguageChange();
 const output=document.getElementById('save-status');
 if(output)output.textContent=t('autoSaved');
 document.getElementById('open-help').setAttribute('aria-label',t('helpButton'));
 document.getElementById('close-help').setAttribute('aria-label',t('closeHelp'));
 document.querySelector('.state-toolbar').setAttribute('aria-label',t('stateToolbar'));
 document.getElementById('global-view-panel').setAttribute('aria-label',t('globalViewAria'));
 document.querySelector('#panel-ba .mode-group')?.setAttribute('aria-label',t('resultModeAria'));
 for(const input of document.querySelectorAll('.matrix input')){
  const cell=input.closest('td'),row=cell?.parentElement,body=row?.parentElement;
  if(!row||!body)continue;
  const r=Array.from(body.children).indexOf(row),c=Array.from(row.children).indexOf(cell);
  
  const chartId=body.id.slice(7).toUpperCase();
  input.setAttribute('aria-label',chartId+' '+t('vectorAria').replace('{row}',r+1).replace('{column}',c+1));
 }
 for(const group of rayGroups){
  for(let i=0;i<group.dials.length;i++){
   const axis=['X','Y','Z'][i],dial=group.dials[i];
   dial.setAttribute('aria-label',t('rayAria').replace('{chart}',group.id.toUpperCase()).replace('{axis}',axis));
   dial.querySelector('input.angle-input').setAttribute('aria-label',t('angleAria').replace('{axis}',axis));
  }
 }
 // Keep math, camera controls and layout LTR; right-align only Hebrew prose.
 document.querySelector('.shell').classList.toggle('hebrew-text',next==='he');
 scheduleSave();
}
for(const btn of document.querySelectorAll('[data-lang]'))btn.addEventListener('click',()=>setLanguage(btn.dataset.lang));
const helpDialog=document.getElementById('help-dialog');
document.getElementById('open-help').addEventListener('click',()=>helpDialog.showModal());
document.getElementById('close-help').addEventListener('click',()=>helpDialog.close());
helpDialog.addEventListener('click',ev=>{if(ev.target===helpDialog)helpDialog.close();});
setLanguage('ru');
setupStateControls();restoreBrowserState();persistenceReady=true;
let focusedInput=null;
function updateVisualViewport(){
 const vv=window.visualViewport;
 const top=vv?vv.offsetTop:0;
 const height=vv?vv.height:window.innerHeight;
 document.documentElement.style.setProperty('--visual-top',top+'px');
 document.documentElement.style.setProperty('--visual-height',height+'px');
 const occlusion=Math.max(0,window.innerHeight-(top+height));
 document.documentElement.style.setProperty('--keyboard-occlusion',occlusion+'px');
 if(focusedInput){ensureInputVisible();}
 if(expanded)requestAnimationFrame(()=>charts[expanded]?.resize());
}
function ensureInputVisible(){
 if(!focusedInput || document.activeElement!==focusedInput)return;
 const vv=window.visualViewport;
 const top=(vv?.offsetTop??0)+20;
 const bottom=(vv?(vv.offsetTop+vv.height):window.innerHeight)-Math.min(65,Math.max(30,(vv?.height??innerHeight)*.10));
 const rect=focusedInput.getBoundingClientRect();
 let delta=0;
 if(rect.bottom>bottom)delta=rect.bottom-bottom;
 else if(rect.top<top)delta=rect.top-top;
 if(!delta)return;
 const panel=focusedInput.closest('.panel.expanded');
 if(panel)panel.scrollTop+=delta;
 else window.scrollBy({top:delta,left:0,behavior:'instant'});
}
for(const input of document.querySelectorAll('.matrix input')){
 input.addEventListener('focus',()=>{
  focusedInput=input;document.body.classList.add('keyboard-focus');
  updateVisualViewport();
  [60,210,450,750].forEach(ms=>setTimeout(()=>{
   if(document.activeElement===input){updateVisualViewport();ensureInputVisible();}
  },ms));
 });
 input.addEventListener('blur',()=>{
  if(focusedInput!==input)return;focusedInput=null;document.body.classList.remove('keyboard-focus');
  updateVisualViewport();
 });
}
window.visualViewport?.addEventListener('resize',updateVisualViewport);
window.visualViewport?.addEventListener('scroll',updateVisualViewport);
window.addEventListener('resize',updateVisualViewport);
updateVisualViewport();

function loop(){requestAnimationFrame(loop);for(const chart of Object.values(charts))chart.animate();}
loop();
 return Object.freeze({charts, getState:snapshotState, reset:restartApplication,
  save:exportState, load:applyState, setLanguage, redraw:()=>{renderMatrix('a');recalcBA();}});
 }
});
