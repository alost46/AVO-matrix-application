import {sourceFormulaText,resultFormulaText} from './math.js?v=01i';
/* App-specific data controls. Core interface (flags, JSON, undo, view, editing) untouched. */
const TXT={
 ru:{section:'Поверхность и построение',shape:'Поверхность',sphere:'Сфера · центр (0,0,0)',ellipsoid:'Эллипсоид',box:'Прямоугольный параллелепипед · вершина (0,0,0)',cylinder:'Цилиндр · основание XY',cone:'Конус · основание XY',pyramid:'Пирамида · основание XY',torus:'Тор',paraboloid:'Параболоид',frustum:'Усечённый конус',hemisphere:'Полусфера',explicit:'Явная z = f(x,y)',implicit:'Неявная F(x,y,z) = 0',expr:'Формула z=f(x,y)',imp:'Уравнение или система (разделитель ; или новая строка)',range:'Диапазоны исходных координат',settings:'Установки',stepMode:'Шаг сетки',auto:'Авто · 40 интервалов',manual:'Вручную',dx:'ΔX (или Δu)',dy:'ΔY (или Δv)',delay:'Задержка, мс',parameter:'Параметры фигуры',a:'a · размер / радиус',b:'b · размер / радиус',c:'c · высота / размер',minor:'r · малый радиус тора',shift:'Смещение t (также перетаскивается чёрным маркером)',scales:'Шкалы изображения',linear:'Линейная',log:'Лог 10 (x>0)',symlog:'±Лог',selected:'Выбранная точка поверхности',u:'u / доля X',v:'v / доля Y',rebuild:'Построить заново',status:'Рисование',done:'Готово',error:'Ошибка',hint:'Масштабы меняют только изображение, не координаты для A·p+t. При логарифме неположительные координаты не отображаются. Одно уравнение задаёт поверхность, два линию пересечения, три отдельные точки. Разделите уравнения знаком ; или новой строкой.',many:'Узлов по XY',rank:'Ранг',show:'Дополнительные параметры'},
 en:{section:'Surface and construction',shape:'Surface',sphere:'Sphere · center (0,0,0)',ellipsoid:'Ellipsoid',box:'Rectangular box · corner (0,0,0)',cylinder:'Cylinder · base XY',cone:'Cone · base XY',pyramid:'Pyramid · base XY',torus:'Torus',paraboloid:'Paraboloid',frustum:'Frustum',hemisphere:'Hemisphere',explicit:'Explicit z=f(x,y)',implicit:'Implicit F(x,y,z)=0',expr:'Formula z=f(x,y)',imp:'Equation or system (; or new line)',range:'Input coordinate bounds',settings:'Settings',stepMode:'Mesh spacing',auto:'Auto · 40 intervals',manual:'Manual',dx:'ΔX (or Δu)',dy:'ΔY (or Δv)',delay:'Delay, ms',parameter:'Shape parameters',a:'a · size / radius',b:'b · size / radius',c:'c · height / size',minor:'r · torus tube radius',shift:'Offset t (also drag the black handle)',scales:'Display axis scales',linear:'Linear',log:'Log 10 (x>0)',symlog:'Signed log',selected:'Highlighted surface point',u:'u / X fraction',v:'v / Y fraction',rebuild:'Rebuild',status:'Drawing',done:'Finished',error:'Error',hint:'Scales alter display only, not the coordinates sent to A·p+t. Standard log hides nonpositive coordinates. One equation draws a surface; two equations draw a curve; three can define isolated points. Separate equations with ; or a new line.',many:'XY nodes',rank:'Rank',show:'Additional parameters'},
 he:{section:'משטח ובנייה',shape:'משטח',sphere:'כדור · מרכז (0,0,0)',ellipsoid:'אליפסואיד',box:'תיבה מלבנית · קודקוד (0,0,0)',cylinder:'גליל · בסיס XY',cone:'חרוט · בסיס XY',pyramid:'פירמידה · בסיס XY',torus:'טורוס',paraboloid:'פרבולואיד',frustum:'חרוט קטום',hemisphere:'חצי כדור',explicit:'מפורש z=f(x,y)',implicit:'סתום F(x,y,z)=0',expr:'נוסחה z=f(x,y)',imp:'משוואה או מערכת (; או שורה חדשה)',range:'תחומי קואורדינטות',settings:'הגדרות',stepMode:'מרווח רשת',auto:'אוטומטי · 40 מרווחים',manual:'ידני',dx:'ΔX (או Δu)',dy:'ΔY (או Δv)',delay:'השהיה, ms',parameter:'פרמטרי צורה',a:'a · גודל / רדיוס',b:'b · גודל / רדיוס',c:'c · גובה / גודל',minor:'r · רדיוס קטן של טורוס',shift:'הזזה t (אפשר לגרור סמן שחור)',scales:'קני מידה לתצוגה',linear:'ליניארי',log:'לוג 10 (x>0)',symlog:'לוג סימטרי',selected:'נקודה מסומנת',u:'u / יחס X',v:'v / יחס Y',rebuild:'בנה מחדש',status:'בניית משטח',done:'הושלם',error:'שגיאה',hint:'קני המידה משנים רק את התצוגה ולא את החישוב A·p+t. לוג רגיל מסתיר ערכים לא חיוביים. משוואה אחת מגדירה משטח, שתיים עקומה ושלוש יכולות להגדיר נקודה יחידה.',many:'נקודות XY',rank:'דרגה',show:'פרמטרים נוספים'}
};
const e=(tag,cls)=>{const d=document.createElement(tag);if(cls)d.className=cls;return d;};
export function installControls(app){const section=e('section','surface-controls');section.id='surface-controls';
 const title=e('h2');section.append(title);
 const shapeRow=e('div','surface-row'),shapeLabel=e('label');shapeRow.append(shapeLabel);section.append(shapeRow);
 const shape=e('select');shapeLabel.append(shape);
 const shapes=['sphere','ellipsoid','box','cylinder','cone','pyramid','torus','paraboloid','frustum','hemisphere','explicit','implicit'];
 for(const id of shapes){const opt=e('option');opt.value=id;opt.dataset.tr=id;shape.append(opt);}
 function labelWrap(row,key,wide=false){const l=e('label',wide?'wide':'');l.dataset.tr=key;row.append(l);return l;}
 function field(row,key,val='',kind='number',wide=false){const l=labelWrap(row,key,wide),input=e('input');input.type=kind;input.dataset.key=key;input.autocomplete='off';if(kind==='number'){input.step='any';input.inputMode='decimal';}input.value=val;l.append(input);return input;}
 const eqRow=e('div','surface-row'),explicit=field(eqRow,'expr','','text',true),implicit=field(eqRow,'imp','','text',true);
 const implicitArea=e('textarea');implicitArea.rows=2;implicitArea.dataset.key='imp';implicitArea.autocomplete='off';implicitArea.spellcheck=false;implicit.replaceWith(implicitArea);section.append(eqRow);
 const paramRow=e('div','surface-row');const params={};for(const key of ['a','b','c','minor'])params[key]=field(paramRow,key);section.append(paramRow);
 const settingsToggle=e('button','surface-settings-toggle');settingsToggle.type='button';settingsToggle.setAttribute('aria-expanded','false');const settingsPanel=e('div','surface-settings-panel');settingsPanel.hidden=true;
 const accuracy=e('fieldset');const legend=e('legend');legend.dataset.tr='stepMode';accuracy.append(legend);
 const row=e('div','surface-row'),modeWrap=labelWrap(row,'stepMode'),mode=e('select');modeWrap.append(mode);
 for(const key of ['auto','manual']){const option=e('option');option.value=key;option.dataset.tr=key;mode.append(option);}
 const dx=field(row,'dx'),dy=field(row,'dy'),delay=field(row,'delay');accuracy.append(row);settingsPanel.append(accuracy);
 const opt=e('div','surface-settings-extra');
 const boundsWrap=e('fieldset'),rangeLegend=e('legend');rangeLegend.dataset.tr='range';boundsWrap.append(rangeLegend);
 const ranges=e('div','surface-row'),bounds={};for(const key of ['xmin','xmax','ymin','ymax','zmin','zmax'])bounds[key]=field(ranges,key);boundsWrap.append(ranges);opt.append(boundsWrap);
 const shiftWrap=e('fieldset'),shiftLegend=e('legend');shiftLegend.dataset.tr='shift';shiftWrap.append(shiftLegend);
 const shiftRow=e('div','surface-row'),t=[];for(let k=0;k<3;k++)t.push(field(shiftRow,['tX','tY','tZ'][k]));shiftWrap.append(shiftRow);opt.append(shiftWrap);
 const scaleWrap=e('fieldset'),scaleLegend=e('legend');scaleLegend.dataset.tr='scales';scaleWrap.append(scaleLegend);const scalesRow=e('div','surface-row'),scales=[];
 for(const axis of 'XYZ'){const lab=labelWrap(scalesRow,axis),select=e('select');for(const key of ['linear','log','symlog']){const option=e('option');option.value=key;option.dataset.tr=key;select.append(option);}lab.append(select);scales.push(select);}scaleWrap.append(scalesRow);opt.append(scaleWrap);
 const pointWrap=e('fieldset'),pointLegend=e('legend');pointLegend.dataset.tr='selected';pointWrap.append(pointLegend);const pointRow=e('div','surface-row'),u=field(pointRow,'u'),v=field(pointRow,'v');pointWrap.append(pointRow);opt.append(pointWrap);
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
 transformPic?.matrixRow?.append(shiftColumn);
 shiftWrap.remove();
 function setValue(input,value){if(document.activeElement!==input)input.value=String(value);}
 function visibleFields(){const id=app.currentInputs().shape,custom=id==='explicit'||id==='implicit';eqRow.classList.toggle('hidden',!custom);
  explicit.parentElement.classList.toggle('hidden',id!=='explicit');implicitArea.parentElement.classList.toggle('hidden',id!=='implicit');
  paramRow.classList.toggle('hidden',custom);dx.parentElement.classList.toggle('hidden',mode.value==='auto');dy.parentElement.classList.toggle('hidden',mode.value==='auto');
 }
 function sync(){const s=app.currentInputs();shape.value=s.shape;explicit.value=document.activeElement===explicit?explicit.value:s.expr;if(document.activeElement!==implicitArea)implicitArea.value=s.implicit;
  mode.value=s.stepMode;setValue(dx,s.dx);setValue(dy,s.dy);setValue(delay,s.delay);
  for(const [key,input] of Object.entries(params))setValue(input,s[key]);for(const [key,input] of Object.entries(bounds))setValue(input,s.bounds[key]);
  t.forEach((input,i)=>setValue(input,Number(s.t[i].toFixed(5))));scales.forEach((input,i)=>input.value=s[['scaleX','scaleY','scaleZ'][i]]);
  setValue(u,s.selectedU);setValue(v,s.selectedV);visibleFields();}
 function valid(s){const b=s.bounds;if(['xmin','xmax','ymin','ymax','zmin','zmax'].some(k=>!Number.isFinite(b[k])))return false;
  if(b.xmin>=b.xmax||b.ymin>=b.ymax||b.zmin>=b.zmax)return false;
  if(!(s.dx>0&&s.dy>0&&s.dx<1e4&&s.dy<1e4&&s.delay>=0&&s.delay<=2000))return false;
  if(!(s.a>0&&s.b>0&&s.c>0&&s.minor>0))return false;return true;}
 function change(mutator){const s=structuredClone(app.currentInputs());mutator(s);if(!valid(s)){progress.textContent='Invalid values / Неверные значения';return;}
  app.applyChange(()=>{Object.assign(app.currentData,s);});}
 shape.addEventListener('change',()=>change(s=>{s.shape=shape.value;}));mode.addEventListener('change',()=>change(s=>{s.stepMode=mode.value;}));
 const props={...params,dx,dy,delay,u,v};const propNames={u:'selectedU',v:'selectedV'};
 for(const [key,input] of Object.entries(props))input.addEventListener('change',()=>change(s=>{s[propNames[key]||key]=Number(input.value.replace(',','.'));}));
 explicit.addEventListener('change',()=>change(s=>{s.expr=explicit.value;}));implicitArea.addEventListener('change',()=>change(s=>{s.implicit=implicitArea.value;}));
 for(const [key,input] of Object.entries(bounds))input.addEventListener('change',()=>change(s=>{s.bounds[key]=Number(input.value.replace(',','.'));}));
 t.forEach((input,i)=>input.addEventListener('change',()=>change(s=>{s.t[i]=Number(input.value.replace(',','.'));})));
 scales.forEach((input,i)=>input.addEventListener('change',()=>change(s=>{s[['scaleX','scaleY','scaleZ'][i]]=input.value;})));
 rebuild.addEventListener('click',()=>app.startSurface?.());
 function refreshAnnotations(){
  const s=app.currentInputs();
  if(banners.input)banners.input.textContent=sourceFormulaText(s);
  if(banners.output)banners.output.textContent=resultFormulaText(s, app.matrixFactory?.getNumericMatrix('A',{x:0,y:0,z:0,t:0})||[[1,0,0],[0,1,0],[0,0,1]]);
  if(banners.transform)banners.transform.textContent=app.lang==='ru'?'Изменяйте A числами или маркерами; перетаскивайте ⊗ на конце t (начало в 0)' :app.lang==='he'?'ערכו את A במספרים או בסמנים; גררו את ⊗ בקצה t (ההתחלה ב־0)' :'Edit A numerically or by handles; drag ⊗ at the tip of t (tail fixed at 0)' ;
 }
 function localize(){const lang=app.lang,dict=TXT[lang]||TXT.ru;title.textContent=dict.section;for(const node of section.querySelectorAll('[data-tr]')){
   const value=dict[node.dataset.tr]||node.dataset.tr;if(node.tagName==='OPTION')node.textContent=value;
   else if(node.tagName==='LABEL'){const txt=[...node.childNodes].find(n=>n.nodeType===3);if(txt)txt.textContent=value;else node.prepend(document.createTextNode(value));}
   else node.textContent=value;
  }
  for(const [key,input] of Object.entries(bounds))input.parentElement.firstChild.textContent=key;
  t.forEach((input,i)=>input.parentElement.firstChild.textContent='t'+('XYZ'[i]));
  scales.forEach((input,i)=>input.parentElement.firstChild.textContent='XYZ'[i]);
  {let n=[...shapeLabel.childNodes].find(n=>n.nodeType===3);if(!n){n=document.createTextNode('');shapeLabel.prepend(n);}n.textContent=dict.shape;}
  const shiftTitle=shiftColumn.querySelector('.surface-shift-title');
  if(shiftTitle)shiftTitle.textContent=app.lang==='ru'?'Вектор t':app.lang==='he'?'וקטור t':'Vector t';
  rebuild.textContent=dict.rebuild;settingsToggle.textContent='⚙ '+dict.settings;hint.textContent=dict.hint;
  refreshAnnotations();
 }
 // Labels created without text nodes; localize() adds them before controls.
 localize();sync();refreshAnnotations();
 return {sync,localize,refreshAnnotations,report(p){const dict=TXT[app.lang]||TXT.ru;
  if(p.error){progress.textContent=`${dict.error}: ${p.error}`;return;}
  progress.textContent=p.finished?`${dict.done}: ${p.vertices.toLocaleString()} точек`:
   `${dict.status}: ${p.done}/${p.expected} · ${p.vertices.toLocaleString()} точек`;
 }};
}
