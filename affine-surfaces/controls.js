import {sourceFormulaText,resultFormulaText} from './math.js?v=01m';
/* App-specific data controls. Core interface (flags, JSON, undo, view, editing) untouched. */
const TXT={
 ru:{section:'Поверхность и построение',shape:'Поверхность',sphere:'Сфера · центр (0,0,0)',ellipsoid:'Эллипсоид',box:'Прямоугольный параллелепипед · вершина (0,0,0)',cylinder:'Цилиндр · основание XY',cone:'Конус · основание XY',pyramid:'Пирамида · основание XY',torus:'Тор',paraboloid:'Параболоид',frustum:'Усечённый конус',hemisphere:'Полусфера',explicit:'Явная z = f(x,y)',implicit:'Неявная F(x,y,z) = 0',time:'С параметром t: x(t), y(t), z(t) / F(x,y,z,t)=0',timeCoordinates:'Координаты x(t), y(t), z(t)',timeImplicit:'Неявная F(x,y,z,t)=0 (1–3 уравнения)',timeKind:'Способ задания с параметром t',timeExpr:'Формулы координат (1–3, через ; или новую строку)',timeImplicitExpr:'Зависимые от t уравнения (1–3)',timeFrom:'t: начало',timeTo:'t: конец',timeStep:'Шаг Δt',timeTip:'Параметр t скалярный (например, время). Вектор смещения T задаётся отдельно, прямыми координатами.',expr:'Формула z=f(x,y)',imp:'Уравнение или система (разделитель ; или новая строка)',range:'Диапазоны исходных координат',gridMode:'Координатная сетка',gridAuto:'Автоматически по фигуре',gridManual:'Вручную (± по осям)',gridX:'X: от − до +',gridY:'Y: от − до +',gridZ:'Z: от − до +',settings:'Установки',stepMode:'Шаг сетки',auto:'Авто · 40 интервалов',manual:'Вручную',dx:'ΔX (или Δu)',dy:'ΔY (или Δv)',delay:'Задержка, мс',parameter:'Параметры фигуры',a:'a · размер / радиус',b:'b · размер / радиус',c:'c · высота / размер',minor:'r · малый радиус тора',shift:'Смещение T (абсолютные координаты и перетаскивание ⊗)',scales:'Шкалы изображения',linear:'Линейная',log:'Лог 10 (x>0)',symlog:'±Лог',selected:'Выбранная точка поверхности',u:'u / доля X',v:'v / доля Y',rebuild:'Построить заново',status:'Рисование',done:'Готово',error:'Ошибка',hint:'Масштабы меняют только изображение, не координаты для A·p+t. При логарифме неположительные координаты не отображаются. Одно уравнение задаёт поверхность, два линию пересечения, три отдельные точки. Разделите уравнения знаком ; или новой строкой.',many:'Узлов по XY',rank:'Ранг',show:'Дополнительные параметры'},
 en:{section:'Surface and construction',shape:'Surface',sphere:'Sphere · center (0,0,0)',ellipsoid:'Ellipsoid',box:'Rectangular box · corner (0,0,0)',cylinder:'Cylinder · base XY',cone:'Cone · base XY',pyramid:'Pyramid · base XY',torus:'Torus',paraboloid:'Paraboloid',frustum:'Frustum',hemisphere:'Hemisphere',explicit:'Explicit z=f(x,y)',implicit:'Implicit F(x,y,z)=0',time:'Parameter t: x(t), y(t), z(t) / F(x,y,z,t)=0',timeCoordinates:'Coordinate functions x(t), y(t), z(t)',timeImplicit:'Implicit F(x,y,z,t)=0 (1–3 equations)',timeKind:'Parameter t definition',timeExpr:'Coordinate formulas (1–3; separate with ; or newline)',timeImplicitExpr:'Time-dependent equations (1–3)',timeFrom:'t: start',timeTo:'t: end',timeStep:'Step Δt',timeTip:'Scalar parameter t (e.g. time) is independent of translation vector T, entered by absolute coordinates.',expr:'Formula z=f(x,y)',imp:'Equation or system (; or new line)',range:'Input coordinate bounds',gridMode:'Coordinate grid',gridAuto:'Fit to geometry',gridManual:'Manual (symmetric ±)',gridX:'X: ± extent',gridY:'Y: ± extent',gridZ:'Z: ± extent',settings:'Settings',stepMode:'Mesh spacing',auto:'Auto · 40 intervals',manual:'Manual',dx:'ΔX (or Δu)',dy:'ΔY (or Δv)',delay:'Delay, ms',parameter:'Shape parameters',a:'a · size / radius',b:'b · size / radius',c:'c · height / size',minor:'r · torus tube radius',shift:'Translation vector T (absolute coordinates or drag ⊗)',scales:'Display axis scales',linear:'Linear',log:'Log 10 (x>0)',symlog:'Signed log',selected:'Highlighted surface point',u:'u / X fraction',v:'v / Y fraction',rebuild:'Rebuild',status:'Drawing',done:'Finished',error:'Error',hint:'Scales alter display only, not the coordinates sent to A·p+t. Standard log hides nonpositive coordinates. One equation draws a surface; two equations draw a curve; three can define isolated points. Separate equations with ; or a new line.',many:'XY nodes',rank:'Rank',show:'Additional parameters'},
 he:{section:'משטח ובנייה',shape:'משטח',sphere:'כדור · מרכז (0,0,0)',ellipsoid:'אליפסואיד',box:'תיבה מלבנית · קודקוד (0,0,0)',cylinder:'גליל · בסיס XY',cone:'חרוט · בסיס XY',pyramid:'פירמידה · בסיס XY',torus:'טורוס',paraboloid:'פרבולואיד',frustum:'חרוט קטום',hemisphere:'חצי כדור',explicit:'מפורש z=f(x,y)',implicit:'סתום F(x,y,z)=0',time:'פרמטר t: x(t), y(t), z(t) / F(x,y,z,t)=0',timeCoordinates:'פונקציות x(t), y(t), z(t)',timeImplicit:'משוואה סתומה F(x,y,z,t)=0 (1–3)',timeKind:'שיטת פרמטר t',timeExpr:'נוסחאות הקואורדינטות (1–3)',timeImplicitExpr:'משוואות תלויות בזמן (1–3)',timeFrom:'t: התחלה',timeTo:'t: סוף',timeStep:'צעד Δt',timeTip:'הפרמטר הסקלרי t בלתי תלוי בווקטור ההזזה T; הזינו ישירות את קואורדינטות T.',expr:'נוסחה z=f(x,y)',imp:'משוואה או מערכת (; או שורה חדשה)',range:'תחומי קואורדינטות',gridMode:'רשת קואורדינטות',gridAuto:'התאמה אוטומטית',gridManual:'ידני (סימטרי ±)',gridX:'X: גבול ±',gridY:'Y: גבול ±',gridZ:'Z: גבול ±',settings:'הגדרות',stepMode:'מרווח רשת',auto:'אוטומטי · 40 מרווחים',manual:'ידני',dx:'ΔX (או Δu)',dy:'ΔY (או Δv)',delay:'השהיה, ms',parameter:'פרמטרי צורה',a:'a · גודל / רדיוס',b:'b · גודל / רדיוס',c:'c · גובה / גודל',minor:'r · רדיוס קטן של טורוס',shift:'הזזה T (קואורדינטות מוחלטות או גרירת ⊗)',scales:'קני מידה לתצוגה',linear:'ליניארי',log:'לוג 10 (x>0)',symlog:'לוג סימטרי',selected:'נקודה מסומנת',u:'u / יחס X',v:'v / יחס Y',rebuild:'בנה מחדש',status:'בניית משטח',done:'הושלם',error:'שגיאה',hint:'קני המידה משנים רק את התצוגה ולא את החישוב A·p+t. לוג רגיל מסתיר ערכים לא חיוביים. משוואה אחת מגדירה משטח, שתיים עקומה ושלוש יכולות להגדיר נקודה יחידה.',many:'נקודות XY',rank:'דרגה',show:'פרמטרים נוספים'}
};
const e=(tag,cls)=>{const d=document.createElement(tag);if(cls)d.className=cls;return d;};
export function installControls(app){const section=e('section','surface-controls');section.id='surface-controls';
 const title=e('h2');section.append(title);
 const shapeRow=e('div','surface-row'),shapeLabel=e('label');shapeRow.append(shapeLabel);section.append(shapeRow);
 const shape=e('select');shapeLabel.append(shape);
 const shapes=['sphere','ellipsoid','box','cylinder','cone','pyramid','torus','paraboloid','frustum','hemisphere','explicit','implicit','time'];
 for(const id of shapes){const opt=e('option');opt.value=id;opt.dataset.tr=id;shape.append(opt);}
 function labelWrap(row,key,wide=false){const l=e('label',wide?'wide':'');l.dataset.tr=key;row.append(l);return l;}
 function field(row,key,val='',kind='number',wide=false){const l=labelWrap(row,key,wide),input=e('input');input.type=kind;input.dataset.key=key;input.autocomplete='off';if(kind==='number'){input.step='any';input.inputMode='decimal';}input.value=val;l.append(input);return input;}
 const eqRow=e('div','surface-row'),explicit=field(eqRow,'expr','','text',true),implicit=field(eqRow,'imp','','text',true);
 const implicitArea=e('textarea');implicitArea.rows=2;implicitArea.dataset.key='imp';implicitArea.autocomplete='off';implicitArea.spellcheck=false;implicit.replaceWith(implicitArea);section.append(eqRow);
 // Parameter-dependent shapes: either a trajectory x(t),y(t),z(t) or a
 // time-varying implicit set F(x,y,z,t)=0. These are application-level controls.
 const timePanel=e('div','surface-time-panel');
 const timeModeRow=e('div','surface-row'),timeModeLabel=labelWrap(timeModeRow,'timeKind'),timeMode=e('select');
 for(const [value,key] of [['coordinates','timeCoordinates'],['implicit','timeImplicit']]){
  const option=e('option');option.value=value;option.dataset.tr=key;timeMode.append(option);
 }
 timeModeLabel.append(timeMode);timePanel.append(timeModeRow);
 const timeEqRow=e('div','surface-row'),timeEqLabel=labelWrap(timeEqRow,'timeExpr',true),timeEq=e('textarea');
 timeEq.rows=2;timeEq.spellcheck=false;timeEqLabel.append(timeEq);timePanel.append(timeEqRow);
 const dynamicEqRow=e('div','surface-row'),dynamicEqLabel=labelWrap(dynamicEqRow,'timeImplicitExpr',true),dynamicEq=e('textarea');
 dynamicEq.rows=2;dynamicEq.spellcheck=false;dynamicEqLabel.append(dynamicEq);timePanel.append(dynamicEqRow);
 const timeRange=e('div','surface-row');
 const timeMin=field(timeRange,'timeFrom'),timeMax=field(timeRange,'timeTo'),timeStep=field(timeRange,'timeStep');
 timePanel.append(timeRange);const timeNote=e('p','surface-time-note');timePanel.append(timeNote);section.append(timePanel);
 const paramRow=e('div','surface-row');const params={};for(const key of ['a','b','c','minor'])params[key]=field(paramRow,key);section.append(paramRow);
 const settingsToggle=e('button','surface-settings-toggle');settingsToggle.type='button';settingsToggle.setAttribute('aria-expanded','false');const settingsPanel=e('div','surface-settings-panel');settingsPanel.hidden=true;
 const accuracy=e('fieldset');const legend=e('legend');legend.dataset.tr='stepMode';accuracy.append(legend);
 const row=e('div','surface-row'),modeWrap=labelWrap(row,'stepMode'),mode=e('select');modeWrap.append(mode);
 for(const key of ['auto','manual']){const option=e('option');option.value=key;option.dataset.tr=key;mode.append(option);}
 const dx=field(row,'dx'),dy=field(row,'dy'),delay=field(row,'delay');accuracy.append(row);settingsPanel.append(accuracy);
 const opt=e('div','surface-settings-extra');
 const boundsWrap=e('fieldset'),rangeLegend=e('legend');rangeLegend.dataset.tr='range';boundsWrap.append(rangeLegend);
 const ranges=e('div','surface-row'),bounds={};for(const key of ['xmin','xmax','ymin','ymax','zmin','zmax'])bounds[key]=field(ranges,key);boundsWrap.append(ranges);opt.append(boundsWrap);
 const gridBox=e('fieldset'),gridLegend=e('legend');gridLegend.dataset.tr='gridMode';gridBox.append(gridLegend);
 const gridRow=e('div','surface-row'),gridLabel=labelWrap(gridRow,'gridMode'),gridMode=e('select');gridLabel.append(gridMode);
 for(const [key,modeId] of [['gridAuto','auto'],['gridManual','manual']]){const o=e('option');o.value=modeId;o.dataset.tr=key;gridMode.append(o);}
 const gridLimits={};for(const key of ['gridX','gridY','gridZ'])gridLimits[key]=field(gridRow,key);
 gridBox.append(gridRow);opt.append(gridBox);
 const shiftWrap=e('fieldset'),shiftLegend=e('legend');shiftLegend.dataset.tr='shift';shiftWrap.append(shiftLegend);
 // The translation vector T uses DIRECT ABSOLUTE coordinate entry, never +/- spinners.
 const shiftRow=e('div','surface-row'),t=[];
 for(let k=0;k<3;k++){
  const input=field(shiftRow,['tX','tY','tZ'][k],'','text');
  input.inputMode='decimal';input.spellcheck=false;
  input.setAttribute('aria-label',`T${'XYZ'[k]} (absolute coordinate)`);
  input.addEventListener('keydown',event=>{if(event.key==='Enter')input.blur();});
  t.push(input);
 }
 shiftWrap.append(shiftRow);opt.append(shiftWrap);
 const scaleWrap=e('fieldset'),scaleLegend=e('legend');scaleLegend.dataset.tr='scales';scaleWrap.append(scaleLegend);const scalesRow=e('div','surface-row'),scales=[];
 for(const axis of 'XYZ'){const lab=labelWrap(scalesRow,axis),select=e('select');for(const key of ['linear','log','symlog']){const option=e('option');option.value=key;option.dataset.tr=key;select.append(option);}lab.append(select);scales.push(select);}scaleWrap.append(scalesRow);opt.append(scaleWrap);
 // Point selection is by clicking/tapping the visible original surface.
 // Legacy u/v parameters stay in saved JSON for backward compatibility.
 settingsPanel.append(opt);section.append(settingsToggle,settingsPanel);
 settingsToggle.addEventListener('click',()=>{settingsPanel.hidden=!settingsPanel.hidden;settingsToggle.setAttribute('aria-expanded',String(!settingsPanel.hidden));settingsToggle.classList.toggle('active',!settingsPanel.hidden);});
 const actions=e('div','surface-actions'),rebuild=e('button'),progress=e('output','status-progress');progress.setAttribute('role','status');actions.append(rebuild,progress);section.append(actions);
 const hint=e('p','hint');section.append(hint);app.grid.before(section);
 const banners={};
 for(const id of ['input','transform','output']){
  const pic=app.pictures?.get(id);if(!pic)continue;
  const bar=e('div','surface-formula-banner');
  // Prominent formula immediately below the picture title, ABOVE the action buttons and angle rays.
  if(id==='transform')bar.classList.add('surface-transform-note');
  pic.heading.after(bar);banners[id]=bar;
 }
 // The shift vector is edited alongside A, not hidden inside Settings.
 const transformPic=app.pictures?.get('transform');
 // The built-in Core handle with data-handle="t" is the only cross marker.
 // Its position is already tracked by the Core in screen space, and the Core's
 // hit test drags it instead of rotating the camera. Only its CSS appearance is customized.
 const shiftColumn=e('div','surface-shift-editor');
 shiftColumn.append(e('strong','surface-shift-title'));
 const shiftFields=e('div','surface-shift-fields');
 for(const input of t)shiftFields.append(input.parentElement);
 shiftColumn.append(shiftFields);
 // Keep the two captions in the same structural row, so the editable
 // matrix and shift coordinates start at exactly matching vertical levels.
 // This reorganizes existing nodes only; the Core Picture and its event
 // handlers, refs, Save/Load and matrix editing are left unchanged.
 if(transformPic?.matrixRow&&transformPic.dataTitle&&transformPic.matrixTable){
  const matrixBlock=e('div','surface-matrix-block');
  matrixBlock.append(transformPic.dataTitle,transformPic.matrixTable);
  transformPic.matrixRow.prepend(matrixBlock);
  transformPic.matrixRow.append(shiftColumn);
  transformPic.matrixRow.classList.add('surface-transform-data-row');
 }else transformPic?.matrixRow?.append(shiftColumn);
 shiftWrap.remove();
 function setValue(input,value){if(document.activeElement!==input)input.value=String(value);}
 function visibleFields(){const id=app.currentInputs().shape,custom=id==='explicit'||id==='implicit'||id==='time';eqRow.classList.toggle('hidden',!['explicit','implicit'].includes(id));
  explicit.parentElement.classList.toggle('hidden',id!=='explicit');implicitArea.parentElement.classList.toggle('hidden',id!=='implicit');
  paramRow.classList.toggle('hidden',custom);timePanel.classList.toggle('hidden',id!=='time');
  timeEqRow.classList.toggle('hidden',timeMode.value!=='coordinates');dynamicEqRow.classList.toggle('hidden',timeMode.value!=='implicit');
  dx.parentElement.classList.toggle('hidden',mode.value==='auto');dy.parentElement.classList.toggle('hidden',mode.value==='auto');
  for(const input of Object.values(gridLimits))input.parentElement.classList.toggle('hidden',gridMode.value==='auto');
 }
 function sync(){const s=app.currentInputs();shape.value=s.shape;explicit.value=document.activeElement===explicit?explicit.value:s.expr;if(document.activeElement!==implicitArea)implicitArea.value=s.implicit;
  mode.value=s.stepMode;gridMode.value=s.gridMode;for(const [key,input] of Object.entries(gridLimits))setValue(input,s[key]);timeMode.value=s.timeMode;if(document.activeElement!==timeEq)timeEq.value=s.timeEquations;if(document.activeElement!==dynamicEq)dynamicEq.value=s.dynamicEquations;
  setValue(timeMin,s.timeMin);setValue(timeMax,s.timeMax);setValue(timeStep,s.timeStep);setValue(dx,s.dx);setValue(dy,s.dy);setValue(delay,s.delay);
  for(const [key,input] of Object.entries(params))setValue(input,s[key]);for(const [key,input] of Object.entries(bounds))setValue(input,s.bounds[key]);
  t.forEach((input,i)=>setValue(input,Number(s.t[i].toFixed(5))));scales.forEach((input,i)=>input.value=s[['scaleX','scaleY','scaleZ'][i]]);
  visibleFields();}
 function valid(s){const b=s.bounds;if(['xmin','xmax','ymin','ymax','zmin','zmax'].some(k=>!Number.isFinite(b[k])))return false;
  if(b.xmin>=b.xmax||b.ymin>=b.ymax||b.zmin>=b.zmax)return false;
  if(!(s.dx>0&&s.dy>0&&s.dx<1e4&&s.dy<1e4&&s.delay>=0&&s.delay<=2000))return false;
  if(!(s.a>0&&s.b>0&&s.c>0&&s.minor>0))return false;
  if(!['auto','manual'].includes(s.gridMode)||!['gridX','gridY','gridZ'].every(key=>Number.isFinite(s[key])&&s[key]>=.1&&s[key]<=99999))return false;
  if(!Number.isFinite(s.timeMin)||!Number.isFinite(s.timeMax)||!Number.isFinite(s.timeStep)||s.timeMin>=s.timeMax||s.timeStep<=0||s.timeStep>100000)return false;return true;}
 function change(mutator){const original=app.currentInputs(),s=structuredClone(original);mutator(s);
  if(!valid(s)){progress.textContent='Invalid values / Неверные значения';return;}
  // A and T never change the selected source point. A new source geometry does.
  const geometryKeys=['shape','a','b','c','minor','expr','implicit','timeMode','timeEquations','dynamicEquations','timeMin','timeMax','timeStep'];
  const geometryChanged=geometryKeys.some(k=>s[k]!==original[k])||JSON.stringify(s.bounds)!==JSON.stringify(original.bounds);
  if(geometryChanged)s.selectedActive=false;
  app.applyChange(()=>{Object.assign(app.currentData,s);});}
 shape.addEventListener('change',()=>change(s=>{s.shape=shape.value;}));
 gridMode.addEventListener('change',()=>change(s=>{s.gridMode=gridMode.value;}));
 for(const [key,input] of Object.entries(gridLimits))input.addEventListener('change',()=>change(s=>{s[key]=Number(input.value.replace(',','.'));}));
 timeMode.addEventListener('change',()=>change(s=>{s.timeMode=timeMode.value;}));
 timeEq.addEventListener('change',()=>change(s=>{s.timeEquations=timeEq.value;}));
 dynamicEq.addEventListener('change',()=>change(s=>{s.dynamicEquations=dynamicEq.value;}));
 for(const [key,input] of [['timeMin',timeMin],['timeMax',timeMax],['timeStep',timeStep]])input.addEventListener('change',()=>change(s=>{s[key]=Number(input.value.replace(',','.'));}));mode.addEventListener('change',()=>change(s=>{s.stepMode=mode.value;}));
 const props={...params,dx,dy,delay};const propNames={};
 for(const [key,input] of Object.entries(props))input.addEventListener('change',()=>change(s=>{s[propNames[key]||key]=Number(input.value.replace(',','.'));}));
 explicit.addEventListener('change',()=>change(s=>{s.expr=explicit.value;}));implicitArea.addEventListener('change',()=>change(s=>{s.implicit=implicitArea.value;}));
 for(const [key,input] of Object.entries(bounds))input.addEventListener('change',()=>change(s=>{s.bounds[key]=Number(input.value.replace(',','.'));}));
 t.forEach((input,i)=>input.addEventListener('change',()=>{
  // Assign T_i directly: never add a delta or infer an increment from the field.
  const raw=input.value.trim().replace(',','.');
  const coordinate=raw?Number(raw):NaN;
  if(!Number.isFinite(coordinate)||Math.abs(coordinate)>10000){
   progress.textContent=app.lang==='ru'?'Введите числовую координату T':app.lang==='he'?'הזינו קואורדינטה מספרית של T':'Enter a numeric T coordinate';
   input.value=String(app.currentInputs().t[i]);return;
  }
  change(s=>{s.t[i]=coordinate;});
 }));
 scales.forEach((input,i)=>input.addEventListener('change',()=>change(s=>{s[['scaleX','scaleY','scaleZ'][i]]=input.value;})));
 rebuild.addEventListener('click',()=>app.startSurface?.());
 function refreshAnnotations(){
  const s=app.currentInputs();
  if(banners.input)banners.input.textContent=sourceFormulaText(s);
  if(banners.output)banners.output.textContent=resultFormulaText(s, app.matrixFactory?.getNumericMatrix('A',{x:0,y:0,z:0,t:0})||[[1,0,0],[0,1,0],[0,0,1]]);
  if(banners.transform)banners.transform.textContent=app.lang==='ru'?'Редактируйте A и координаты T напрямую; ⊗ на конце T (начало в 0)' :app.lang==='he'?'ערכו את A ואת קואורדינטות T ישירות; גררו את ⊗ בקצה T (ההתחלה ב־0)' :'Edit A and T coordinates directly; drag ⊗ at the tip of T (tail fixed at 0)' ;
  if(s.shape==='time'){
   const translations={ru:['При изменении t строится траектория или текущее множество решений.','На третьей картинке показан образ при той же величине t.'],en:['The trajectory or solution set changes with scalar t.','The third panel shows its affine image at the same t.'],he:['העקומה או קבוצת הפתרונות משתנה לפי הפרמטר t.','התמונה השלישית מציגה את ההעתקה האפינית באותו t.']};
   const [left,right]=translations[app.lang]||translations.ru;
   const a=app.pictures.get('input'),b=app.pictures.get('output');if(a)a.endInfo.textContent=left;if(b)b.endInfo.textContent=right;
  }
 }
 function localize(){const lang=app.lang,dict=TXT[lang]||TXT.ru;title.textContent=dict.section;for(const node of section.querySelectorAll('[data-tr]')){
   const value=dict[node.dataset.tr]||node.dataset.tr;if(node.tagName==='OPTION')node.textContent=value;
   else if(node.tagName==='LABEL'){const txt=[...node.childNodes].find(n=>n.nodeType===3);if(txt)txt.textContent=value;else node.prepend(document.createTextNode(value));}
   else node.textContent=value;
  }
  for(const [key,input] of Object.entries(bounds))input.parentElement.firstChild.textContent=key;
  t.forEach((input,i)=>input.parentElement.firstChild.textContent='T'+('XYZ'[i]));
  scales.forEach((input,i)=>input.parentElement.firstChild.textContent='XYZ'[i]);
  {let n=[...shapeLabel.childNodes].find(n=>n.nodeType===3);if(!n){n=document.createTextNode('');shapeLabel.prepend(n);}n.textContent=dict.shape;}
  const shiftTitle=shiftColumn.querySelector('.surface-shift-title');
  if(shiftTitle)shiftTitle.textContent=app.lang==='ru'?'Вектор T':app.lang==='he'?'וקטור T':'Vector T';
  rebuild.textContent=dict.rebuild;settingsToggle.textContent='⚙ '+dict.settings;hint.textContent=dict.hint;timeNote.textContent=dict.timeTip;
  refreshAnnotations();
 }
 // Labels created without text nodes; localize() adds them before controls.
 localize();sync();refreshAnnotations();
 return {sync,localize,refreshAnnotations,report(p){const dict=TXT[app.lang]||TXT.ru;
  if(p.error){progress.textContent=`${dict.error}: ${p.error}`;return;}
  const stamp=Number.isFinite(p.time)?` · t=${Number(p.time.toFixed(5))}`:'';
  progress.textContent=p.finished?`${dict.done}: ${p.vertices.toLocaleString()} точек${stamp}`:
   `${dict.status}: ${p.done}/${p.expected} · ${p.vertices.toLocaleString()} точек${stamp}`;
 }};
}
