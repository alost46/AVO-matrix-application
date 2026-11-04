/* AVO Core v2 01f · one universal Picture interface for editable and calculated objects. */
import {View3D} from './view.js';
import {buildRays} from './rays.js';
const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;};
const fmt=n=>!Number.isFinite(n)?'∞':Math.abs(n)<1e-9?'0':String(Number(n.toFixed(4)));
export class Picture {
  constructor(app,config){
    this.app=app;this.config=config;this.id=config.id;this.root=el('section','picture');this.root.dataset.picture=this.id;this.root.dataset.coreVersion='01g';
    const header=el('div','picture-header');this.heading=el('h2');header.append(this.heading);
    const tools=el('div','panel-tools');
    const mainTools=el('div','primary-tools');const gestureRow=el('div','gesture-row');
    // Editable pictures use one button: Edit turns both editing AND view gestures on/off.
    if(config.editable){this.editButton=el('button');this.editButton.addEventListener('click',()=>this.switchEdit());mainTools.append(this.editButton);}
    else {this.viewButton=el('button');this.viewButton.addEventListener('click',()=>this.switchView());mainTools.append(this.viewButton);}
    this.fullButton=el('button','small');this.fullButton.addEventListener('click',()=>this.toggleFull());mainTools.append(this.fullButton);
    this.resetViewButton=el('button','small');this.resetViewButton.addEventListener('click',()=>this.view.resetView());mainTools.append(this.resetViewButton);
    // All pictures have exactly the same view controls, including XY/Z.
    // Whether a picture has editable handles never affects view gesture controls.
    this.gestureTools=el('div','gesture-tools');this.gestureTools.setAttribute('role','group');this.gestureButtons={};
    for(const axis of ['xy','z']){
      const b=el('button','small',axis==='xy'?'XY':'Z');
      b.addEventListener('click',()=>{this.view.dragAxis=axis;this.renderControls();this.app.autosave();});
      this.gestureTools.append(b);this.gestureButtons[axis]=b;
    }
    // This identical gesture row is REQUIRED for editable objects AND calculated results.
    gestureRow.append(this.gestureTools);
    if(config.matrixId){this.resetMatrixButton=el('button','small');this.resetMatrixButton.addEventListener('click',()=>app.resetMatrix(config.matrixId));gestureRow.append(this.resetMatrixButton);}
    tools.append(mainTools,gestureRow);header.append(tools);
    this.dataZone=el('section','matrix-zone');this.hasMatrix=!!(config.matrixId||config.outputMatrixId);
    if(this.hasMatrix){
      this.dataTitle=el('div','data-title');this.dataZone.append(this.dataTitle);
    }
    this.matrixRow=el('div','matrix-row');
    if(this.hasMatrix||config.orderSelect)this.dataZone.append(this.matrixRow);
    if(this.hasMatrix){this.matrixTable=el('table','matrix-table');this.matrixTable.setAttribute('aria-label','Matrix');this.matrixRow.append(this.matrixTable);}
    if(config.orderSelect){
      this.orderWrapper=el('div','order-control');this.orderLabel=el('label','order-label');this.orderSelect=el('select','order-select');
      for(const v of ['BA','AB']){const o=el('option',null,v);o.value=v;this.orderSelect.append(o);}
      this.orderSelect.id=`avo-order-${this.id}`;this.orderLabel.htmlFor=this.orderSelect.id;this.orderSelect.addEventListener('change',()=>app.setOrder(this.orderSelect.value));this.orderWrapper.append(this.orderLabel,this.orderSelect);this.matrixRow.append(this.orderWrapper);
    }
    this.metrics=el('div','metrics');this.formula=el('div','formula');this.dataZone.append(this.metrics,this.formula);
    this.viewOpts=el('div','view-opts');const axisRow=el('div','angle-row');
    this.axisLabel=el('span','tip axis-label');axisRow.append(this.axisLabel);
    const raysArea=el('div','rays');this.setRays=buildRays(raysArea,(index,value)=>{
      // Ray selector applies to ray adjustment, never to free-area drag.
      const axis=['x','y','z'][index];
      if(this.view.axis==='free'||this.view.axis===axis)this.view.changeAngles(index,value);
    });axisRow.append(raysArea);
    this.axisButtons={};const axisTools=el('div','axis-tools');
    for(const axis of ['free','x','y','z']){
      const b=el('button','small axis-btn',axis==='free'?'◎':axis.toUpperCase());b.addEventListener('click',()=>{this.view.axis=axis;this.renderControls();this.app.autosave();});axisTools.append(b);this.axisButtons[axis]=b;
    }
    axisRow.append(axisTools);this.viewOpts.append(axisRow);
    this.plotWrap=el('div','plot-wrap');this.plotCaption=el('span','plot-caption');this.overlapNotice=el('div','avo-overlap-notice');this.overlapNotice.setAttribute('role','status');this.overlapNotice.hidden=true;this.plotWrap.append(this.plotCaption,this.overlapNotice);
    this.endInfo=el('div','end-info');
    this.root.append(header,this.viewOpts,this.plotWrap,this.dataZone,this.endInfo);
    this.view=new View3D(this.plotWrap,()=>this.viewChanged(),(binding,pos)=>this.handleMove(binding,pos),()=>this.app.finishGesture(),active=>this.setOverlapNotice(active));
    this.view.resize();this.buildMatrix();this.renderLanguage();this.renderControls();
  }
  setOverlapNotice(active){
    this.overlapNotice.hidden=!active;
    if(active)this.overlapNotice.textContent=this.app.t('markerOverlap');
  }
  get matrixName(){return this.config.matrixId||this.config.outputMatrixId||'result';}
  get numericMatrix(){
    const id=this.config.matrixId;
    return id?this.app.matrixFactory?.getNumericMatrix(id):this.result?.matrix;
  }
  buildMatrix(){
    this.cells=[];if(!this.hasMatrix)return;
    this.matrixTable.replaceChildren();
    const matrix=this.numericMatrix;
    if(!matrix)return;
    for(let r=0;r<matrix.length;r++){
      const tr=el('tr');this.cells[r]=[];
      for(let c=0;c<matrix[r].length;c++){
        const td=el('td');if(this.config.matrixId){
          const input=el('input',`col-${c}`);input.type='text';input.inputMode='decimal';input.spellcheck=false;
          input.setAttribute('aria-label',`${this.config.matrixId} ${r+1},${c+1}`);
          input.addEventListener('focus',()=>this.app.beginGesture());
          input.addEventListener('input',()=>{let raw=input.value.trim().replace(',','.');if(['','-','.','-.'].includes(raw))return;const number=Number(raw);
            if(Number.isFinite(number))this.app.setCell(this.config.matrixId,r,c,number);});
          input.addEventListener('blur',()=>{this.app.finishGesture();this.renderMatrix();});
          input.addEventListener('keydown',e=>{if(e.key==='Enter')input.blur();});
          td.append(input);this.cells[r][c]=input;
        }else{const span=el('span','read');td.append(span);this.cells[r][c]=span;}
        tr.append(td);
      }
      this.matrixTable.append(tr);
    }
  }
  renderMatrix(){if(!this.hasMatrix)return;const matrix=this.numericMatrix;if(!matrix)return;
    if(!this.cells.length||matrix.length!==this.cells.length){this.buildMatrix();}
    for(let r=0;r<matrix.length;r++)for(let c=0;c<matrix[r].length;c++){
      const input=this.cells[r]?.[c];if(!input)continue;
      if(input.tagName==='INPUT'){if(document.activeElement!==input)input.value=fmt(matrix[r][c]);}
      else input.textContent=fmt(matrix[r][c]);
    }
  }
  viewChanged(){this.setRays(this.view.angles);this.app.cameraChanged(this);}
  handleMove(binding,pos){return this.app.moveHandle(binding,pos);}
  switchView(){this.view.setMode(this.view.mode==='off'?'view':'off');this.renderControls();this.app.autosave();}
  switchEdit(){this.view.setMode(this.view.mode==='edit'?'off':'edit');this.renderControls();this.app.autosave();}
  toggleFull(){const full=this.root.classList.toggle('picture-full');this.fullButton.setAttribute('aria-pressed',String(full));requestAnimationFrame(()=>this.view.resize());}
  renderControls(){
    const tr=this.app.t.bind(this.app);
    if(this.viewButton){this.viewButton.textContent=tr('view');this.viewButton.classList.toggle('active',this.view.mode!=='off');this.viewButton.setAttribute('aria-pressed',String(this.view.mode!=='off'));}
    if(this.editButton){this.editButton.textContent=tr('edit');this.editButton.classList.toggle('active',this.view.mode==='edit');this.editButton.setAttribute('aria-pressed',String(this.view.mode==='edit'));}
    this.gestureTools.setAttribute('aria-label',tr('gestureDrag'));
    for(const [name,button] of Object.entries(this.gestureButtons)){
      button.classList.toggle('active',name===this.view.dragAxis);
      button.setAttribute('aria-pressed',String(name===this.view.dragAxis));
      button.title=tr(name==='xy'?'gestureXY':'gestureZ');
    }
    for(const [name,button] of Object.entries(this.axisButtons))button.classList.toggle('active',name===this.view.axis);
    this.plotCaption.textContent=tr(this.view.mode==='edit'?'statusEdit':this.view.mode==='view'?'statusView':'statusOff');
    this.setRays(this.view.angles);
  }
  renderLanguage(){
    const t=this.app.t.bind(this.app),m=this.app.msg.bind(this.app);
    this.heading.textContent=m(this.config.titleKey);
    if(this.dataTitle)this.dataTitle.textContent=`${t('matrix')} ${this.config.matrixId||this.result?.label||this.config.displayName||this.id}`;
    this.axisLabel.textContent=t('selectAxis');
    if(!this.overlapNotice.hidden)this.overlapNotice.textContent=t('markerOverlap');
    this.fullButton.textContent=t('full');this.resetViewButton.textContent=t('resetView');
    if(this.resetMatrixButton)this.resetMatrixButton.textContent=`${this.app.lang==='ru'?'Сброс':this.app.lang==='he'?'אפס':'Reset'} ${this.config.matrixId}`;
    if(this.orderLabel)this.orderLabel.textContent=t('order')+': ';
    this.renderControls();
  }
  updateResult(result){
    this.result=result||{};
    this.view.setGeometry(this.result.geometry||{});
    if(this.orderSelect)this.orderSelect.value=this.app.order;
    this.renderMatrix();this.renderLanguage();
    this.metrics.replaceChildren();
    for(const metric of this.result.metrics||[]){const p=el('div','metric');p.textContent=`${this.app.t(metric.key)||metric.key}: ${metric.value}`;this.metrics.append(p);}
    const formulas=this.result.formulas||[];
    this.formula.textContent=[this.result.formula?(this.result.formulaLabel?this.app.t(this.result.formulaLabel)+': ':'')+this.result.formula:null,...formulas.map(f=>typeof f==='string'?f:`${this.app.t(f.key)}: ${f.value}`)].filter(Boolean).join(' · ');
    this.endInfo.textContent=this.config.descriptionKey?(this.app.msg(this.config.descriptionKey)||''):'';
  }
  state(){return this.view.state();}
  applyState(state){this.view.applyState(state);
    // Backward-compatible restoration: the old 'view only' state on editable
    // panels now corresponds to the combined Edit + View state.
    if(this.config.editable&&this.view.mode==='view')this.view.setMode('edit');
    if(!this.config.editable&&this.view.mode==='edit')this.view.setMode('view');
    this.renderControls();}
  dispose(){this.view.dispose();this.root.remove();}
}
