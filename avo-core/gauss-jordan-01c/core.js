/* AVO four-panel extension 01a. No files of prior AVO cores are modified. */
(async function(){'use strict';
const tr={ru:{title:'Метод Гаусса — Жордана',subtitle:'Исходная система трех линейных уравнений и три шага решения',restart:'Начать заново',reset:'Сброс A',undo:'Отменить',save:'Сохранить JSON',load:'Восстановить JSON',help:'Help',views:'Одинаковый обзор',ok:'OK',initial:'Исходная система',step:'Шаг',plane:'Три плоскости: уравнения текущей системы',noPlane:'Нулевая строка или противоречие не задают плоскость',swap:'Перестановка строк',zero:'В этом столбце нет ведущего элемента',skip:'Нет ведущего элемента',none:'Нет операций: элемент уже приведён',summary:'Результат',unique:'Единственное решение',infinite:'Бесконечно много решений',incompatible:'Система несовместна: решений нет',rank:'Ранг A',axis:'Возврат',rotateOff:'Вращать',rotateOn:'✓ Вращение',xyMode:'XY',zMode:'Z',expanded:'Увеличить',close:'Свернуть',rays:'Углы XYZ',restore:'Файл восстановлен',invalid:'Неверный JSON',missing:'Не удалось загрузить графику. Проверьте интернет.',helpHtml:`<h3>1. Расширенная матрица</h3><p>Задайте 12 чисел [A | b]: девять коэффициентов и три свободных члена. Каждая строка a·x+b·y+c·z=d задаёт плоскость. Пересечение всех трёх плоскостей есть множество решений.</p><h3>2. Три шага Гаусса — Жордана</h3><p>Для каждого столбца выбирается ведущий элемент с максимальным <b>абсолютным значением</b> среди ещё не обработанных строк. При необходимости строки переставляются. Ведущая строка делится на ведущий элемент; затем все остальные элементы столбца обнуляются. В каждом из трёх следующих окон показана система после очередной обработки столбца и список фактически выполненных операций.</p><h3>3. Зачем переставлять строки?</h3><p>Так удаётся избежать деления на нуль и уменьшить численную погрешность из-за деления на слишком малое число. Это частичный выбор главного элемента. Перестановки строк и остальные допустимые преобразования сохраняют множество решений.</p><h3>4. Геометрия и особые случаи</h3><p>Плоскости меняются, но общая точка решения остаётся той же. При единственном решении конечная матрица имеет вид [I | x]. При зависимых уравнениях возможны прямая или плоскость решений; при противоречии решений нет. Нулевая строка не задаёт отдельную плоскость.</p><h3>5. Управление</h3><p>Для вращения или масштабирования нажмите «Вращать» под нужным графиком. Рядом выберите XY (свободное вращение) или Z (вращение вокруг оси Z при фиксированном наклоне). Когда вращение выключено, свайп по графику прокручивает страницу телефона. Повторное нажатие отключает вращение. «Увеличить» раскрывает окно. Лучики X/Y/Z под графиками поворачивают обзор вокруг соответствующей оси независимо от кнопки «Вращать». «Одинаковый обзор» копирует обзор первого окна в другие. Сохранение и восстановление JSON включает 12 чисел, язык и положения камер. «Начать заново» возвращает учебный пример, «Сброс A» устанавливает единичную A и сохраняет текущий вектор b.</p>`},en:{title:'Gauss–Jordan elimination',subtitle:'Initial system of three linear equations and three solution steps',restart:'Start over',reset:'Reset A',undo:'Undo',save:'Save JSON',load:'Load JSON',help:'Help',views:'Same view',ok:'OK',initial:'Original system',step:'Step',plane:'Three planes: equations of the current system',noPlane:'A zero or inconsistent row does not define a plane',swap:'Row swap',zero:'No pivot in this column',skip:'No pivot available',none:'No change required',summary:'Result',unique:'Unique solution',infinite:'Infinitely many solutions',incompatible:'Inconsistent system: no solution',rank:'Rank A',axis:'Reset view',rotateOff:'Rotate',rotateOn:'✓ Rotation on',xyMode:'XY',zMode:'Z',expanded:'Expand',close:'Collapse',rays:'XYZ angles',restore:'State restored',invalid:'Invalid JSON',missing:'3D modules failed to load. Check internet access.',helpHtml:`<h3>1. Augmented matrix</h3><p>Enter 12 numbers [A | b]. Each row a·x+b·y+c·z=d defines a plane. The intersection is the solution set.</p><h3>2. Three Gauss–Jordan stages</h3><p>For each coefficient column, choose the largest absolute available pivot, swap rows if necessary, divide the pivot row to produce 1, and eliminate that column in every other row. Each panel shows the matrix after processing another column, with its row operations.</p><h3>3. Why swap rows?</h3><p>Partial pivoting avoids division by zero and limits floating-point roundoff. Elementary row operations preserve the solution set.</p><h3>4. Special cases</h3><p>Rank 3 yields [I | x] and a unique solution. Dependent equations may yield a line or plane of solutions; inconsistent equations have no solution. Zero rows define no individual plane.</p><h3>5. Controls</h3><p>Tap Rotate below the chart to enable drag rotation and wheel/pinch zoom. Choose XY for free two-angle orbit, or Z for rotation around the Z axis at a fixed inclination. When Rotate is off, swipe on the chart to scroll the page. Tap again to disable rotation. Expand panels as needed. The X/Y/Z ray controls under each chart turn the view around the corresponding axis, even when Rotate is off. Same view copies the first camera. JSON stores inputs, language, and views. Start over restores the demo; Reset A makes A the identity and preserves b.</p>`},he:{title:'שיטת גאוס–ז׳ורדן',subtitle:'המערכת ההתחלתית של שלוש משוואות ליניאריות ושלושת שלבי הפתרון',restart:'התחלה מחדש',reset:'איפוס A',undo:'בטל',save:'שמירת JSON',load:'טעינת JSON',help:'עזרה',views:'מבט אחיד',ok:'אישור',initial:'מערכת מקורית',step:'שלב',plane:'שלוש מישורים של המערכת הנוכחית',noPlane:'שורת אפס או סתירה אינן מגדירות מישור',swap:'החלפת שורות',zero:'אין איבר ציר בעמודה',skip:'אין איבר ציר',none:'אין שינוי נדרש',summary:'תוצאה',unique:'פתרון יחיד',infinite:'אינסוף פתרונות',incompatible:'אין פתרון למערכת',rank:'דרגת A',axis:'איפוס מבט',rotateOff:'סיבוב',rotateOn:'✓ סיבוב פעיל',xyMode:'XY',zMode:'Z',expanded:'הגדלה',close:'סגירה',rays:'זוויות XYZ',restore:'הקובץ שוחזר',invalid:'קובץ JSON שגוי',missing:'טעינת גרפיקה נכשלה. בדקו חיבור אינטרנט.',helpHtml:`<h3>1. מטריצה מורחבת</h3><p>הזינו 12 מספרים [A | b]. כל משוואה מייצגת מישור במרחב.</p><h3>2. שלבי גאוס–ז׳ורדן</h3><p>בכל עמודה בוחרים את איבר הציר בעל הערך המוחלט הגדול ביותר מבין השורות הפנויות, מחליפים שורות לפי הצורך, מחלקים את שורת הציר ומאפסים את שאר העמודה.</p><h3>3. למה מחליפים שורות?</h3><p>בחירת ציר חלקית מונעת חלוקה באפס ומצמצמת שגיאות עיגול. פעולות שורה אינן משנות את קבוצת הפתרונות.</p><h3>4. תוצאות אפשריות</h3><p>פתרון יחיד, אינסוף פתרונות או חוסר פתרון. כשיש פתרון יחיד, המטריצה הסופית היא [I | x].</p><h3>5. שימוש</h3><p>לחצו על סיבוב מתחת לגרף כדי לאפשר סיבוב והתקרבות. בחרו XY לסיבוב חופשי או Z לסיבוב סביב ציר Z בזווית הטיה קבועה. כשהסיבוב כבוי, אפשר לגלול את הדף גם דרך הגרף. לחיצה נוספת מכבה את הסיבוב. מחווני X/Y/Z מסובבים את המבט סביב כל ציר גם כאשר סיבוב באצבע כבוי. ניתן לשמור ולטעון מצב ב־JSON ולשחזר את מבט המצלמות.</p>`}};
const DEFAULT=[[2,1,-1,8],[-3,-1,2,-11],[-2,1,2,-3]];
let lang='ru',input=DEFAULT.map(r=>r.slice()),history=[],result,charts=[],expanded=-1;
const $=s=>document.querySelector(s),fmt=n=>Math.abs(n)<1e-8?'0.00':Number(n).toFixed(2),fmtInput=n=>{if(Math.abs(n)<1e-8)return '0';if(Math.abs(n-Math.round(n))<1e-8)return String(Math.round(n));return Number(n.toFixed(2)).toString();};
const t=k=>tr[lang][k]||k;
const EXPAND_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`;
const COLLAPSE_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`;
function setExpandIcon(btn,isExpanded){btn.innerHTML=isExpanded?COLLAPSE_ICON:EXPAND_ICON;btn.title=isExpanded?t('close'):t('expanded');btn.setAttribute('aria-label',btn.title);} 
let THREE,OrbitControls;
try{THREE=await import('three');({OrbitControls}=await import('three/addons/controls/OrbitControls.js'));}catch(e){$('#message').textContent=t('missing');console.error(e);return;}
function clone(a){return a.map(r=>r.slice());}
function snapshot(){return {input:clone(input),lang,cameras:charts.map(c=>({p:c.camera.position.toArray(),target:c.controls.target.toArray(),zoom:c.camera.zoom,axisMode:c.axisMode,rotationMode:c.rotationMode}))};}
function validState(s){return !!s&&Array.isArray(s.input)&&s.input.length===3&&s.input.every(r=>Array.isArray(r)&&r.length===4&&r.every(n=>Number.isFinite(n)&&Math.abs(n)<1e8))&&(!s.cameras||Array.isArray(s.cameras));}
function push(){history.push(snapshot());if(history.length>50)history.shift();$('#undo').disabled=false;}
function setState(s){input=clone(s.input);lang=tr[s.lang]?s.lang:'ru';refresh();if(s.cameras)charts.forEach((c,i)=>{const v=s.cameras[i];if(v&&Array.isArray(v.p)&&v.p.length===3&&v.p.every(Number.isFinite)&&Array.isArray(v.target)&&v.target.length===3){applyCameraState(c,v);if(v.axisMode==='XY'||v.axisMode==='Z')setAxisMode(c,v.axisMode);if(typeof v.rotationMode==='boolean')setRotationMode(c,v.rotationMode);}});}
function geometryPlane(row,color){const [a,b,c,d]=row,normal=new THREE.Vector3(a,b,c);if(normal.length()<1e-8)return null;const center=normal.clone().multiplyScalar(d/normal.lengthSq()),n=normal.normalize();const helper=Math.abs(n.z)<.87?new THREE.Vector3(0,0,1):new THREE.Vector3(0,1,0);const u=new THREE.Vector3().crossVectors(n,helper).normalize(),v=new THREE.Vector3().crossVectors(n,u).normalize();const geo=new THREE.PlaneGeometry(9,9,12,12);const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.36,side:THREE.DoubleSide,depthWrite:false});const mesh=new THREE.Mesh(geo,mat);const basis=new THREE.Matrix4().makeBasis(u,v,n);mesh.quaternion.setFromRotationMatrix(basis);mesh.position.copy(center);const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color,transparent:true,opacity:.95}));mesh.add(edges);return mesh;}
const colors=[0xe12d28,0x1763c4,0x238d36];
function makeAxisLabel(letter,point){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,128,128);
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 92px Arial, sans-serif';
  ctx.lineWidth=12;ctx.strokeStyle='#ffffff';ctx.strokeText(letter,64,67);
  ctx.fillStyle='#132f4e';ctx.fillText(letter,64,67);
  const texture=new THREE.CanvasTexture(canvas);
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,depthWrite:false,transparent:true}));
  sprite.position.set(...point);sprite.scale.set(.85,.85,1);sprite.renderOrder=998;
  return sprite;
}
function makeSolutionMarker(){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.beginPath();ctx.arc(64,64,46,0,Math.PI*2);
  ctx.fillStyle='#090909';ctx.fill();ctx.lineWidth=14;ctx.strokeStyle='#ffffff';ctx.stroke();
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthTest:false,depthWrite:false}));
  sprite.scale.set(.60,.60,1);sprite.renderOrder=1000;sprite.visible=false;
  return sprite;
}
function createChart(i,host){const scene=new THREE.Scene();scene.background=new THREE.Color(0xffffff);const camera=new THREE.PerspectiveCamera(43,1,.1,500);camera.position.set(11,-13,10);camera.up.set(0,0,1);const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));host.appendChild(renderer.domElement);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;
const axes=new THREE.AxesHelper(6.4);scene.add(axes);
// Extend the Y axis in both directions and draw it above the translucent planes.
const yLineGeometry=new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0,-7.5,0), new THREE.Vector3(0,16.0,0)
]);
const yLine=new THREE.Line(yLineGeometry,new THREE.LineBasicMaterial({
  color:0x08733b,depthTest:false,depthWrite:false,transparent:true,opacity:1
}));
yLine.renderOrder=997;scene.add(yLine);
// Positive Y is drawn thicker above the translucent planes for visibility.
const yRod=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,16.0,10),
  new THREE.MeshBasicMaterial({color:0x08733b,depthTest:false,depthWrite:false}));
yRod.position.set(0,8.0,0);yRod.renderOrder=998;scene.add(yRod);
scene.add(makeAxisLabel('X',[6.9,0,0]));scene.add(makeAxisLabel('Y',[0,16.4,0]));scene.add(makeAxisLabel('Z',[0,0,6.9]));
const grid=new THREE.GridHelper(10,10,0x526a82,0xb8c8d8);grid.rotation.x=Math.PI/2;scene.add(grid);const group=new THREE.Group();scene.add(group);
const dot=makeSolutionMarker();scene.add(dot);
const chart={scene,camera,renderer,controls,group,dot,host,i,rotationMode:false,axisMode:'XY'};charts.push(chart);controls.addEventListener('change',()=>{});setRotationMode(chart,false);return chart;}

function updateChart(ch,rows,solution){ch.group.clear();rows.forEach((r,i)=>{const obj=geometryPlane(r,colors[i]);if(obj)ch.group.add(obj);});ch.dot.visible=!!solution;if(solution){ch.dot.position.set(...solution);ch.dot.scale.set(1,1,1);}}
// Use OrbitControls' built-in polar-angle limits, not custom touch handlers.
// XY: the usual two-axis orbit controlled by horizontal and vertical drags.
// Z: freeze polar inclination, so horizontal drag changes only azimuth
// around the global Z axis (camera.up is +Z).
function setAxisMode(chart,mode){
  chart.axisMode=mode==='Z'?'Z':'XY';
  const ctl=chart.controls;
  // Clear the previous Z constraint before measuring the current polar angle.
  ctl.minPolarAngle=0;
  ctl.maxPolarAngle=Math.PI;
  ctl.update();
  if(chart.axisMode==='Z'){
    const polar=ctl.getPolarAngle();
    ctl.minPolarAngle=polar;
    ctl.maxPolarAngle=polar;
  }
  const row=chart.host.closest('.panel');
  if(row)row.querySelectorAll('[data-axis-mode]').forEach(btn=>{
    const chosen=btn.dataset.axisMode===chart.axisMode;
    btn.setAttribute('aria-pressed',String(chosen));
    btn.classList.toggle('active',chosen);
  });
}
function applyCameraState(chart,v){
  // First release the Z constraint so a new copied/reset camera isn't
  // immediately snapped back to the previous inclination.
  const ctl=chart.controls;
  ctl.minPolarAngle=0;
  ctl.maxPolarAngle=Math.PI;
  chart.camera.position.fromArray(v.p);
  ctl.target.fromArray(v.target);
  if(Number.isFinite(v.zoom)&&v.zoom>0)chart.camera.zoom=v.zoom;
  chart.camera.updateProjectionMatrix();
  ctl.update();
  setAxisMode(chart,chart.axisMode);
}
// Rotation is a deliberate opt-in.  With it off, touch gestures must scroll
// the page even if the finger begins on a 3D canvas.  Use OrbitControls' own
// enabled switch, not a custom pointer/touch handler.
function setRotationMode(chart,enabled){
  chart.rotationMode=!!enabled;
  chart.controls.enabled=chart.rotationMode;
  // OrbitControls itself assigns touch-action:none to its DOM element.
  // Both the canvas AND its plot ancestor must allow pan-y when locked.
  const action=chart.rotationMode?'none':'pan-y';
  chart.renderer.domElement.style.touchAction=action;
  chart.host.style.touchAction=action;
  chart.host.classList.toggle('rotation-active',chart.rotationMode);
  const btn=document.querySelector(`[data-rotate="${chart.i}"]`);
  if(btn){
    btn.textContent=t(chart.rotationMode?'rotateOn':'rotateOff');
    btn.setAttribute('aria-pressed',String(chart.rotationMode));
    btn.title=btn.textContent;
  }
}
// Three independent ray controls. Native range inputs provide accessible drag
// and keyboard interaction; the needle shows the requested rotation.
function makeRayControls(i){
  return `<div class="ray-controls" role="group" aria-label="XYZ rotation">${['X','Y','Z'].map(axis=>`<label class="ray-control ray-${axis.toLowerCase()}"><span>${axis}</span><span class="ray-dial" aria-hidden="true"><i></i></span><input type="range" min="-45" max="45" step="1" value="0" data-ray="${axis}" data-chart="${i}" aria-label="${axis}" title="${axis}"></label>`).join('')}</div>`;
}
function turnRay(chart,axis,degrees){
  if(!degrees)return;
  const ctl=chart.controls;
  // Release the polar lock temporarily, allowing the control to work in Z mode.
  const wasZ=chart.axisMode==='Z';
  if(wasZ){ctl.minPolarAngle=0;ctl.maxPolarAngle=Math.PI;}
  const radians=degrees*Math.PI/180;
  const vec=new THREE.Vector3();
  if(axis==='X')vec.set(1,0,0);
  else if(axis==='Y')vec.set(0,1,0);
  else vec.set(0,0,1);
  const q=new THREE.Quaternion().setFromAxisAngle(vec,radians);
  chart.camera.position.sub(ctl.target).applyQuaternion(q).add(ctl.target);
  // Maintain the customary Z-up orientation used throughout the app.
  chart.camera.up.set(0,0,1);
  chart.camera.lookAt(ctl.target);
  ctl.update();
  if(wasZ)setAxisMode(chart,'Z');
}
function wireRayControls(container){
  container.querySelectorAll('[data-ray]').forEach(input=>{
    let previous=0;
    input.addEventListener('input',()=>{
      const next=Number(input.value);
      turnRay(charts[Number(input.dataset.chart)],input.dataset.ray,next-previous);
      previous=next;
      input.closest('.ray-control').querySelector('.ray-dial i').style.transform=`translateX(-50%) rotate(${next}deg)`;
    });
    const reset=()=>{
      input.value='0';previous=0;
      input.closest('.ray-control').querySelector('.ray-dial i').style.transform='translateX(-50%) rotate(0deg)';
    };
    input.addEventListener('change',reset);
    input.addEventListener('pointerup',reset);
    input.addEventListener('pointercancel',reset);
  });
}
function buildCards(){const container=$('#cards');container.innerHTML='';charts.forEach(c=>{c.controls.dispose();c.renderer.dispose()});charts=[];for(let i=0;i<4;i++){const div=document.createElement('article');div.className='panel';div.innerHTML=`<h2 id="heading${i}"></h2><div class="plot" id="plot${i}"><button class="expand" data-expand="${i}" type="button">${EXPAND_ICON}</button></div><div class="controls"><label>${t('rays')}: <span id="angle${i}"></span></label><button data-camera="${i}">↺ ${t('axis')}</button><button data-rotate="${i}" type="button" aria-pressed="false">${t('rotateOff')}</button><span class="axis-switch" role="group" aria-label="Rotation axis"><button data-axis-mode="XY" data-chart="${i}" type="button" aria-pressed="true">XY</button><button data-axis-mode="Z" data-chart="${i}" type="button" aria-pressed="false">Z</button></span>${makeRayControls(i)}</div><div class="matwrap"><div class="matpair"><table class="matrix" id="mat${i}"></table><div class="avoe-grid" id="eq${i}"></div></div></div><div class="description" id="desc${i}"></div>`;container.appendChild(div);if(i===0){const toolbar=document.querySelector('header .toolbar');if(toolbar)div.querySelector('h2').after(toolbar);}createChart(i,div.querySelector('.plot'));}
 container.querySelectorAll('[data-expand]').forEach(btn=>{setExpandIcon(btn,false);btn.onclick=()=>{const idx=+btn.dataset.expand;expanded=expanded===idx?-1:idx;container.querySelectorAll('.panel').forEach((el,n)=>el.classList.toggle('expanded',n===expanded));container.querySelectorAll('[data-expand]').forEach(other=>setExpandIcon(other,+other.dataset.expand===expanded));setTimeout(resize,10);};});
 container.querySelectorAll('[data-camera]').forEach(btn=>btn.onclick=()=>{const c=charts[+btn.dataset.camera];applyCameraState(c,{p:[11,-13,10],target:[0,0,0],zoom:c.camera.zoom});});
 wireRayControls(container);
 container.querySelectorAll('[data-rotate]').forEach(btn=>btn.onclick=()=>{const ch=charts[+btn.dataset.rotate];setRotationMode(ch,!ch.rotationMode);});container.querySelectorAll('[data-axis-mode]').forEach(btn=>btn.onclick=()=>{const ch=charts[+btn.dataset.chart];setAxisMode(ch,btn.dataset.axisMode);});}
function parseCell(text){const raw=text.trim().replace(/\s+/g,'').replace(',', '.');if(!raw || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw))return NaN;const n=Number(raw);return Number.isFinite(n)&&Math.abs(n)<=1e8?n:NaN;}
function invalidInput(field){
 field.classList.add('invalid');
 $('#summary').textContent=lang==='ru'?'Ошибка ввода: исправьте выделенную ячейку матрицы. Результат пока не вычисляется.':lang==='he'?'שגיאת קלט: תקנו את התא המסומן. התוצאה אינה מחושבת כעת.':'Invalid input: correct the highlighted matrix cell. Result is temporarily unavailable.';
 charts.forEach(ch=>{ch.dot.visible=false;ch.group.visible=false;});
 for(let i=1;i<4;i++){$(`#mat${i}`).style.visibility='hidden';$(`#eq${i}`).style.visibility='hidden';$(`#desc${i}`).style.visibility='hidden';}
}
// Matrices and equations are independent.  All three equations are rendered
// into ONE CSS grid, so columns cannot shift from one row to the next.
function matrixUI(i,rows){const table=$(`#mat${i}`);table.innerHTML='';rows.forEach((row,r)=>{const trEl=document.createElement('tr');row.forEach((v,c)=>{const cell=document.createElement('td');cell.className='matrix-number'+(c===3?' matrix-rhs':'');if(i===0){const field=document.createElement('input');field.type='text';field.inputMode='decimal';field.autocomplete='off';field.spellcheck=false;field.value=fmtInput(v);field.className=c===3?'b':'';field.setAttribute('aria-label',`row ${r+1} column ${c+1}`);
 field.onfocus=()=>{field._before=snapshot();field._changed=false;field.select();};
 field.onkeydown=ev=>{if(ev.key==='Enter'){ev.preventDefault();field.blur();}};
 field.oninput=()=>{const value=parseCell(field.value);if(!Number.isFinite(value)){invalidInput(field);return;}
   field.classList.remove('invalid');if(value!==input[r][c]){if(!field._changed){history.push(field._before||snapshot());field._changed=true;}input[r][c]=value;}refresh(true);$('#undo').disabled=history.length===0;};
 field.onblur=()=>{const value=parseCell(field.value);if(!Number.isFinite(value)){field.value=fmtInput(input[r][c]);field.classList.remove('invalid');refresh(true);return;}field.value=fmtInput(value);};
 cell.appendChild(field);}else cell.textContent=fmt(v);trEl.appendChild(cell)});table.appendChild(trEl);});}
function describe(i){if(i===0)return t('plane');const s=result.steps[i],o=s.ops.map(x=>x==='zero'||x==='skip'?t('zero'):x);return (o.length?o.join('; '):t('none'));}
function present(keepInputs=false){result=AVOGaussMath.rrefSteps(input);for(let i=0;i<4;i++){const rows=result.steps[i].matrix;$(`#heading${i}`).textContent=i===0?t('initial'):`${t('step')} ${i}`;if(!(keepInputs&&i===0))matrixUI(i,rows);window.AVOEquationLayout.render($(`#eq${i}`),rows);charts[i].group.visible=true;if(i>0){$(`#mat${i}`).style.visibility='visible';$(`#eq${i}`).style.visibility='visible';$(`#desc${i}`).style.visibility='visible';}updateChart(charts[i],rows,result.solution);$(`#desc${i}`).textContent=describe(i);}
const s=$('#summary');const answer=result.inconsistent?t('incompatible'):result.solution?`${t('unique')}: x=${fmt(result.solution[0])}, y=${fmt(result.solution[1])}, z=${fmt(result.solution[2])}`:`${t('infinite')}: (x,y,z)=(${result.base.map(fmt).join(', ')})${result.directions.map((v,i)=>` + t${i+1}·(${v.map(fmt).join(', ')})`).join('')}`;s.innerHTML=`<span class="summary-label">${t('summary')}:</span><span class="summary-value">${answer}</span> <span class="summary-rank">· ${t('rank')}: ${result.rank}</span>`;}
function translate(){document.documentElement.lang=lang;document.documentElement.dir=lang==='he'?'rtl':'ltr';document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));document.querySelectorAll('[data-lang]').forEach(el=>el.classList.toggle('active',el.dataset.lang===lang));document.querySelectorAll('[data-camera]').forEach(btn=>{btn.textContent='↺ '+t('axis');});charts.forEach(ch=>{setRotationMode(ch,ch.rotationMode);setAxisMode(ch,ch.axisMode);});$('#helpContent').innerHTML=t('helpHtml');}
function refresh(keepInputs=false){translate();present(keepInputs);try{localStorage.setItem('avo-gauss-jordan-01a',JSON.stringify(snapshot()));}catch(e){}}
function resize(){charts.forEach(c=>{const w=c.host.clientWidth,h=c.host.clientHeight;if(w&&h){c.camera.aspect=w/h;c.camera.updateProjectionMatrix();c.renderer.setSize(w,h,false);}});}
buildCards();refresh();resize();addEventListener('resize',resize);
function animate(){requestAnimationFrame(animate);charts.forEach(c=>{c.controls.update();c.renderer.render(c.scene,c.camera);const p=c.camera.position.clone().sub(c.controls.target);const a=[Math.atan2(p.y,p.x)*180/Math.PI,Math.atan2(p.z,Math.hypot(p.x,p.y))*180/Math.PI];const el=$(`#angle${c.i}`);if(el)el.textContent=a.map(n=>n.toFixed(0)+'°').join(' / ');});}animate();
$('#restart').onclick=()=>{push();input=clone(DEFAULT);refresh();};
$('#reset').onclick=()=>{push();for(let r=0;r<3;r++)for(let c=0;c<3;c++)input[r][c]=r===c?1:0;refresh();};
$('#undo').disabled=true;$('#undo').onclick=()=>{if(!history.length)return;const previous=history.pop();setState(previous);$('#undo').disabled=!history.length;};
$('#views').onclick=()=>{push();const source=charts[0];const v={p:source.camera.position.toArray(),target:source.controls.target.toArray(),zoom:source.camera.zoom};charts.slice(1).forEach(c=>applyCameraState(c,v));};
$('#save').onclick=()=>{const a=document.createElement('a');const blob=new Blob([JSON.stringify({schema:'avo-gauss-jordan-01a',...snapshot()},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);a.href=url;a.download='AVO_Gauss_Jordan_state.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);};
$('#load').onclick=()=>$('#file').click();$('#file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!validState(data))throw Error('invalid');push();setState(data);$('#message').textContent=t('restore');}catch(err){$('#message').textContent=t('invalid');}e.target.value='';};
$('#help').onclick=()=>$('#helpDialog').showModal();$('#closeHelp').onclick=$('#okHelp').onclick=()=>$('#helpDialog').close();document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{lang=b.dataset.lang;refresh();});
try{const stored=JSON.parse(localStorage.getItem('avo-gauss-jordan-01a'));if(validState(stored))setState(stored);}catch(e){}
})();
