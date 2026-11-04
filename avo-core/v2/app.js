/* AVO Core v2 · shell, state management, math -> picture flow. No task-specific maths. */
import {MatrixFactory,clone,validateMatrix,identity} from './matrices.js';
import {Picture} from './picture.js';
import {UI,LANGS,readLang,saveLang,flag,textDirection} from './i18n.js';
const element=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
// Old 01a apps passed {A: matrix, B: matrix}; 01b also accepts arbitrary data.
const legacyMatrices=data=>Object.keys(data||{}).length>0&&Object.values(data).every(m=>Array.isArray(m)&&Array.isArray(m[0])&&m[0].every(Number.isFinite));
function sameShape(template,data,depth=0){
 if(depth>16)return false;
 if(typeof template==='number')return typeof data==='number'&&Number.isFinite(data);
 if(template===null)return data===null;
 if(Array.isArray(template))return Array.isArray(data)&&template.length===data.length&&template.every((v,i)=>sameShape(v,data[i],depth+1));
 if(typeof template==='object')return !!data&&typeof data==='object'&&!Array.isArray(data)&&Object.keys(template).length===Object.keys(data).length&&Object.keys(template).every(k=>Object.hasOwn(data,k)&&sameShape(template[k],data[k],depth+1));
 return typeof data===typeof template;
}

export class AVOApp {
 constructor(options){
  this.options=options;this.appId=options.appId;this.lang=readLang();textDirection(this.lang);
  const initial=options.initialInputs||{};
  this.generic=!legacyMatrices(initial);
  this.initialData=this.generic?clone(initial):null;
  this.currentData=this.generic?clone(initial):null;
  this.matrixFactory=this.generic?(initial.matrices?new MatrixFactory(initial.matrices):null):new MatrixFactory(initial);
  this.layouts=options.layoutOptions||[2,3,4];
  this.order='BA';this.initialLayout=this.layouts.includes(3)?3:this.layouts[0];this.layout=this.initialLayout;this.shared=false;this.viewsCache={};this.history=[];this.future=[];this.pending=null;
  this.pictures=new Map();this.storageKey=`avo-core-v2:${this.appId}:state-v2`;
  this.root=document.getElementById(options.mountId||'app');if(!this.root)throw new Error('Missing #app');
  this.buildShell();this.restoreLocal();
  // Every new page session starts with View/Edit OFF, even if autosave
  // remembers that a control was active in the previous session.
  // Keep angles, zoom, axis choices and all mathematical inputs intact.
  for(const state of Object.values(this.viewsCache))if(state&&typeof state==='object')state.mode='off';
  this.buildPictures();this.compute();this.refreshShell();this.notify('notice');
  window.addEventListener('pagehide',()=>this.autosave());
 }
 t(key){return UI[this.lang]?.[key]??key;}
 msg(key){return this.options.messages[this.lang]?.[key]??key;}
 buildShell(){
  const shell=element('main','shell'),top=element('header','top'),brand=element('div','brand');
  const img=element('img');img.src='../../avo-logo.png';img.alt='OA';brand.append(img);
  this.title=element('h1');brand.append(this.title);top.append(brand);
  const actions=element('div','top-actions');
  this.home=element('a','home');actions.append(this.home);
  this.flags=element('div','flags');
  this.flagButtons={};for(const lang of LANGS){const b=element('button','flag-btn');b.title=lang;b.setAttribute('aria-label',lang);b.innerHTML=flag(lang);
    b.addEventListener('click',()=>this.setLanguage(lang));this.flags.append(b);this.flagButtons[lang]=b;}
  actions.append(this.flags);this.helpButton=element('button','help-button','?');this.helpButton.addEventListener('click',()=>this.showHelp());actions.append(this.helpButton);top.append(actions);
  this.toolbar=element('div','toolbar');this.buttons={};
  for(const [key,method] of [['undo','undo'],['redo','redo'],['restart','startOver'],['resetAll','resetAll'],['save','downloadJSON'],['load','openJSON']]){
    const b=element('button');b.addEventListener('click',()=>this[method]());this.toolbar.append(b);this.buttons[key]=b;
  }
  this.fileInput=element('input','load-file');this.fileInput.type='file';this.fileInput.accept='.json,application/json';this.fileInput.addEventListener('change',async()=>{
    try{const file=this.fileInput.files?.[0];if(!file)return;if(file.size>1024*1024)throw Error('File too large');
      const obj=JSON.parse(await file.text());this.applySaved(obj,true);this.finishGesture();this.notify('loaded');}
    catch(e){console.error(e);this.notify('badFile',true);}
    finally{this.fileInput.value='';}
  });this.toolbar.append(this.fileInput);this.note=element('output','status');this.note.setAttribute('role','status');this.toolbar.append(this.note);
  // Layout count is defined by the app. There is deliberately no user-facing 'Pictures' selector.
  const opts=element('div','options');
  this.syncLabel=element('label');this.syncCheck=element('input');this.syncCheck.type='checkbox';this.syncCheck.addEventListener('change',()=>this.setShared(this.syncCheck.checked));this.syncText=element('span');this.syncLabel.append(this.syncCheck,this.syncText);opts.append(this.syncLabel);
  this.lead=element('p','tip');opts.append(this.lead);
  this.grid=element('div','layout');this.footer=element('p','tip');
  this.dialog=element('dialog');this.helpTitle=element('h2');this.helpBody=element('div','help-content');this.closeHelpButton=element('button');this.closeHelpButton.addEventListener('click',()=>this.dialog.close());this.dialog.append(this.helpTitle,this.helpBody,this.closeHelpButton);
  shell.append(top,this.toolbar,opts,this.grid,this.footer,this.dialog);this.root.append(shell);
 }
 refreshShell(){
  this.title.textContent=this.msg('appTitle');document.title=this.msg('appTitle');this.home.textContent=this.t('home');this.home.href='../../?lang='+this.lang;
  this.helpButton.title=this.t('help');this.helpButton.setAttribute('aria-label',this.t('help'));
  for(const [name,button] of Object.entries(this.buttons))button.textContent=this.t(name);
  for(const [lang,b] of Object.entries(this.flagButtons)){b.classList.toggle('active',lang===this.lang);b.setAttribute('aria-pressed',String(lang===this.lang));}
  this.syncText.textContent=this.t('sync');this.syncCheck.checked=this.shared;
  this.lead.textContent=this.msg('lead');this.footer.textContent=this.msg('testNote');
  this.helpTitle.textContent=this.msg('helpTitle');this.helpBody.replaceChildren();this.helpBody.dir=this.lang==='he'?'rtl':'ltr';
  for(const txt of [this.t('helpCommon'),this.msg('helpMath')])this.helpBody.append(element('p',null,txt));
  this.closeHelpButton.textContent=this.t('closeHelp');this.refreshHistory();
  for(const pic of this.pictures.values())pic.renderLanguage();
 }
 setLanguage(lang){if(!LANGS.includes(lang))return;this.lang=lang;textDirection(lang);saveLang(lang);this.refreshShell();this.compute();this.autosave();}
 showHelp(){if(!this.dialog.open)this.dialog.showModal();}
 notify(key,error=false){this.note.textContent=this.t(key);this.note.classList.toggle('error',error);}
 openJSON(){this.fileInput.click();}
 downloadJSON(){
  const file=new Blob([JSON.stringify(this.serialize(),null,2)],{type:'application/json'});
  const url=URL.createObjectURL(file),a=element('a');a.href=url;a.download=`${this.appId}_state_v2.json`;
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);this.notify('saved');
 }
 resetAll(){this.applyChange(()=>{
   if(this.generic){
     if(this.options.mathModel.resetInputs)this.options.mathModel.resetInputs(this.currentData);
     else this.currentData=clone(this.initialData);
     if(this.matrixFactory){this.matrixFactory.setCurrent(this.currentData.matrices);}
   }else for(const name of Object.keys(this.matrixFactory.current))this.matrixFactory.resetMatrix(name);
   this.order='BA';
 });}
 resetMatrix(name){if(!this.matrixFactory)return;this.applyChange(()=>{this.matrixFactory.resetMatrix(name);this.syncMatrices();});}
 startOver(){this.applyChange(()=>{
   if(this.generic){this.currentData=clone(this.initialData);if(this.matrixFactory)this.matrixFactory.setCurrent(this.currentData.matrices);}
   else this.matrixFactory.startOver();
   this.order='BA';for(const p of this.pictures.values())p.applyState({angles:[35,20,25],radius:14,mode:'off',axis:'free',editAxis:'xy'});
 });}
 setOrder(order){if(!['AB','BA'].includes(order))return;this.applyChange(()=>{this.order=order;});}
 setLayout(n){if(!this.layouts.includes(n))return;this.applyChange(()=>{this.layout=n;this.buildPictures();});}
 setShared(value){this.shared=!!value;if(this.shared){const source=this.pictures.values().next().value;
   if(source)this.cameraChanged(source);
  }this.refreshShell();this.autosave();}
 cameraChanged(source){
  if(this.shared){for(const p of this.pictures.values())if(p!==source){p.view.setAngles(source.view.angles,false);p.view.setRadius(source.view.radius,false);p.renderControls();}}
  this.autosave();
 }
 buildPictures(preserveOldViews=true){
  for(const p of this.pictures.values()){if(preserveOldViews)this.viewsCache[p.id]=p.state();p.dispose();}
  this.pictures.clear();this.grid.replaceChildren();
  const specs=this.options.picturesForLayout(this.layout);
  for(const spec of specs){const p=new Picture(this,spec);this.pictures.set(spec.id,p);this.grid.append(p.root);
    if(this.viewsCache[spec.id])p.applyState(this.viewsCache[spec.id]);}
  if(this.shared){const source=this.pictures.values().next().value;if(source)this.cameraChanged(source);}
  this.refreshShell();
 }
 syncMatrices(){if(this.generic&&this.matrixFactory)this.currentData.matrices=clone(this.matrixFactory.current);}
 currentInputs(){return this.generic?this.currentData:this.matrixFactory.current;}
 initialInputs(){return this.generic?this.initialData:this.matrixFactory.initial;}
 restoreInputs(initial,current){
   if(this.generic){this.initialData=clone(initial);this.currentData=clone(current);
     if(this.matrixFactory){this.matrixFactory.initial=clone(initial.matrices);this.matrixFactory.setCurrent(current.matrices);}}
   else{this.matrixFactory.initial=clone(initial);this.matrixFactory.setCurrent(current);}
 }
 compute(){
  let result;
  try{
    this.syncMatrices();
    const context={inputs:clone(this.currentInputs()),parameters:{order:this.order},t:0};
    if(this.matrixFactory)context.getNumericMatrix=(name,ctx)=>this.matrixFactory.getNumericMatrix(name,ctx);
    result=this.options.mathModel.calculate(context);
  }catch(e){console.error('Math model failed',e);this.note.textContent=e.message;return;}
  for(const [id,picture] of this.pictures)pictureSafe(picture,result.pictures?.[id]);
  this.lastResult=result;this.refreshHistory();
 }
 setCell(name,row,col,n){if(!Number.isFinite(n)||!this.matrixFactory)return;this.beginGesture();
  if(this.matrixFactory.setCell(name,row,col,n)){this.compute();this.autosave();}
 }
 moveHandle(binding,pos){if(!binding||!Array.isArray(pos)||pos.length!==3||!pos.every(Number.isFinite))return false;
  let changed=false;
  if(binding.type==='matrixColumn'&&this.matrixFactory?.current[binding.matrixId]){
    this.beginGesture();changed=this.matrixFactory.setColumn(binding.matrixId,binding.column,pos);this.syncMatrices();
  }else if(this.generic&&typeof this.options.mathModel.moveHandle==='function'){
    this.beginGesture();const before=clone(this.currentData);
    try{changed=this.options.mathModel.moveHandle({inputs:this.currentData,binding,position:pos})!==false;
      if(!sameShape(this.initialData,this.currentData)){this.currentData=before;changed=false;}}
    catch(e){console.warn('Handle edit rejected',e);this.currentData=before;changed=false;}
  }
  if(changed){this.compute();this.autosave();}return changed;
 }
 serialize(){
  const views={...clone(this.viewsCache)};for(const p of this.pictures.values())views[p.id]=p.state();
  return {schemaVersion:2,appId:this.appId,initialInputs:clone(this.initialInputs()),inputs:clone(this.currentInputs()),order:this.order,layout:this.layout,shared:this.shared,lang:this.lang,views};
 }
 applySaved(state,fromFile=false){
  this.validateSaved(state);this.beginGesture();
  this.restoreInputs(state.initialInputs,state.inputs);
  this.order=state.order;this.layout=this.initialLayout;this.shared=!!state.shared;this.viewsCache=clone(state.views||{});
  this.lang=state.lang;textDirection(this.lang);saveLang(this.lang);this.buildPictures(false);this.compute();this.refreshShell();this.autosave();
 }
 validateSaved(s){
  if(!s||s.schemaVersion!==2||s.appId!==this.appId||!this.layouts.includes(s.layout)||!['AB','BA'].includes(s.order)||!LANGS.includes(s.lang))throw Error('Schema mismatch');
  if(this.generic){
    if(!sameShape(this.options.initialInputs||{},s.inputs)||!sameShape(this.options.initialInputs||{},s.initialInputs))throw Error('Invalid object inputs');
  }else for(const [name,original] of Object.entries(this.options.initialInputs)){
    if(!validateMatrix(s.inputs?.[name],original.length,original[0].length)||!validateMatrix(s.initialInputs?.[name],original.length,original[0].length))throw Error('Invalid matrix');
  }
  if(s.views&& (typeof s.views!=='object'||Array.isArray(s.views)||Object.keys(s.views).length>50))throw Error('Bad views');
 }
 restoreLocal(){
  try{const raw=localStorage.getItem(this.storageKey);if(!raw)return;const state=JSON.parse(raw);this.validateSaved(state);
    this.restoreInputs(state.initialInputs,state.inputs);
    this.order=state.order;this.layout=this.initialLayout;this.shared=!!state.shared;this.viewsCache=clone(state.views||{});
    // ?lang=... from home must override saved application's lang.
    if(!new URLSearchParams(location.search).has('lang')){this.lang=state.lang;textDirection(this.lang);}
  }catch(e){console.warn('Ignoring invalid autosave',e);}
 }
 autosave(){try{localStorage.setItem(this.storageKey,JSON.stringify(this.serialize()));}catch(_){}}
 beginGesture(){if(!this.pending)this.pending=this.serialize();}
 finishGesture(){
  if(!this.pending)return;const before=this.pending;this.pending=null;const after=this.serialize();
  if(JSON.stringify({inputs:before.inputs,order:before.order,layout:before.layout})!==JSON.stringify({inputs:after.inputs,order:after.order,layout:after.layout})){
    this.history.push(before);if(this.history.length>100)this.history.shift();this.future.length=0;
  }
  this.refreshHistory();this.autosave();
 }
 applyChange(action){this.beginGesture();action();this.compute();this.finishGesture();this.refreshShell();}
 undo(){this.finishGesture();if(!this.history.length)return;const past=this.history.pop();this.future.push(this.serialize());this.restoreHistory(past);this.refreshHistory();}
 redo(){this.finishGesture();if(!this.future.length)return;const future=this.future.pop();this.history.push(this.serialize());this.restoreHistory(future);this.refreshHistory();}
 restoreHistory(state){this.restoreInputs(state.initialInputs,state.inputs);
  this.order=state.order;this.layout=this.initialLayout;this.shared=!!state.shared;this.viewsCache=clone(state.views||{});
  this.buildPictures(false);this.compute();this.refreshShell();this.autosave();}
 refreshHistory(){if(this.buttons?.undo)this.buttons.undo.disabled=this.history.length===0;
  if(this.buttons?.redo)this.buttons.redo.disabled=this.future.length===0;}
}
function pictureSafe(picture,data){try{picture.updateResult(data||{});}catch(e){console.error('Picture rendering failed',picture.id,e);}}
export function createApp(options){return new AVOApp(options);}
