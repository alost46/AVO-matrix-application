/* Mathematics plug-in only: A, transpose(A), inverse(A). AVO Core v1 unchanged. */
(function(){
const APP_MESSAGES = {
 "ru": {
  "resetB": "Сброс B",
  "appTitle": "Произведение матриц",
  "edition": "Веб-версия 01c",
  "lead": "Изменяйте сомножители A и B. Переключайте BA / AB в третьем окне и сравнивайте результаты.",
  "objectA": "Первый сомножитель A",
  "transformB": "Второй сомножитель B",
  "resultBA": "Произведение",
  "matrixA": "Матрица A",
  "matrixB": "Матрица B",
  "matrixBA": "Матрица BA",
  "descrA": "Введите значения A или перетаскивайте цветные векторы.",
  "descrB": "Введите значения B или перетаскивайте цветные векторы.",
  "descrBA": "Произведение вычисляется автоматически. График можно вращать и масштабировать.",
  "helpTitle": "Справка: произведение матриц",
  "readyResult": "Вращайте график мышью или пальцем; значения результата вычисляются.",
  "baOverlay": "BA / AB: результат рассчитывается автоматически",
  "quickHelp": "Изменяйте A и B. Справа выберите BA или AB. Порядок сомножителей важен.",
  "charEq": "Характеристическое уравнение",
  "charRoots": "Собственные значения",
  "charDet": "Определитель",
  "prodOrder": "Порядок произведения",
  "commuteYes": "Для этих матриц AB = BA",
  "commuteNo": "Для этих матриц AB ≠ BA",
  "helpHtml": "<p><b>Три окна:</b> сомножители A и B и результат BA либо AB.</p><p><b>Порядок:</b> (BA)ᵢⱼ = Σₖ BᵢₖAₖⱼ, (AB)ᵢⱼ = Σₖ AᵢₖBₖⱼ. Обычно BA ≠ AB.</p><p><b>Начальные значения:</b> A = I, B — единицы на побочной диагонали. Для них AB = BA = B; измените элементы матриц, чтобы увидеть некоммутативность.</p><p><b>Графики:</b> A и B редактируются, третья матрица вычисляется. Во всех окнах можно вращать и масштабировать изображение. В результате мышью изменяется только обзор, но не произведение.</p><p><b>Управление:</b> выбор XY/Z, лучи X/Y/Z, Help, Undo, начало заново, сохранение и загрузка JSON. Сброс A/B устанавливает единичную матрицу.</p>"
 },
 "en": {
  "resetB": "Reset B",
  "appTitle": "Matrix Multiplication",
  "edition": "Web version 01b",
  "lead": "Edit factors A and B; switch BA / AB in the third panel to compare the results.",
  "objectA": "First factor A",
  "transformB": "Second factor B",
  "resultBA": "Product",
  "matrixA": "Matrix A",
  "matrixB": "Matrix B",
  "matrixBA": "Matrix BA",
  "descrA": "Edit A numerically or drag colored vectors.",
  "descrB": "Edit B numerically or drag colored vectors.",
  "descrBA": "The product is calculated automatically. Rotate and zoom its graph.",
  "helpTitle": "Help: matrix multiplication",
  "readyResult": "Rotate and zoom; the product values are calculated.",
  "baOverlay": "BA / AB: calculated result",
  "quickHelp": "Edit A and B; select BA or AB in the third panel. Order matters.",
  "charEq": "Characteristic equation",
  "charRoots": "Eigenvalues",
  "charDet": "Determinant",
  "prodOrder": "Product order",
  "commuteYes": "For these matrices AB = BA",
  "commuteNo": "For these matrices AB ≠ BA",
  "helpHtml": "<p><b>Panels:</b> factors A and B, and their product BA or AB.</p><p><b>Products:</b> (BA)ᵢⱼ = Σₖ BᵢₖAₖⱼ; (AB)ᵢⱼ = Σₖ AᵢₖBₖⱼ. Generally BA ≠ AB.</p><p><b>Defaults:</b> A = I; B has ones on the anti-diagonal. Thus AB = BA initially; edit a factor to see different products.</p><p>A and B are editable. The last graph allows camera rotation and zoom without modifying the calculated result.</p>"
 },
 "he": {
  "resetB": "איפוס B",
  "appTitle": "כפל מטריצות",
  "edition": "גרסת רשת 01b",
  "lead": "ערכו את הגורמים A ו־B ובחרו BA או AB בחלון השלישי.",
  "objectA": "גורם ראשון A",
  "transformB": "גורם שני B",
  "resultBA": "מכפלה",
  "matrixA": "מטריצה A",
  "matrixB": "מטריצה B",
  "matrixBA": "מטריצה BA",
  "descrA": "ערכו את A במספרים או בגרירת וקטורים.",
  "descrB": "ערכו את B במספרים או בגרירת וקטורים.",
  "descrBA": "המכפלה מחושבת אוטומטית. אפשר לסובב ולהגדיל את הגרף.",
  "helpTitle": "עזרה: כפל מטריצות",
  "readyResult": "סובבו והגדילו את הגרף; הערכים מחושבים.",
  "baOverlay": "BA / AB: תוצאה מחושבת",
  "quickHelp": "ערכו את A ואת B. בחרו BA או AB בחלון השלישי. סדר הגורמים חשוב.",
  "charEq": "המשוואה האופיינית",
  "charRoots": "ערכים עצמיים",
  "charDet": "דטרמיננטה",
  "prodOrder": "סדר הכפל",
  "commuteYes": "עבור מטריצות אלה AB = BA",
  "commuteNo": "עבור מטריצות אלה AB ≠ BA",
  "helpHtml": "<p><b>שלושה חלונות:</b> A, B והמכפלה BA או AB.</p><p><b>סדר הכפל:</b> בדרך כלל BA ≠ AB. המטריצות ההתחלתיות מקיימות שוויון, אך אפשר לשנות אותן כדי לראות הבדל.</p><p>אפשר לערוך את A ו־B, ולסובב את המצלמה בחלון התוצאה בלי לשנות את המכפלה.</p>"
 }
};
const I18N=Object.fromEntries(['ru','en','he'].map(lang=>[lang,{...window.AVOCommonMessages[lang],...APP_MESSAGES[lang]}]));
window.AVOMatrixProduct={
 name:'Matrix Product',version:'01c · Core matrix-product-01c',
 stateKey:'avo-matrix-product-01a-state',fileName:'Matrix_Product_state.json',
 labels:{a:'A',b:'B',ba:'BA'},editable:['a','b'],messages:I18N,
 initialA:[[1,0,0],[0,1,0],[0,0,1]],initialB:[[0,0,1],[0,1,0],[1,0,0]],
 toolbarHTML:'',extraHTML(id){return (id==='ba'?'<div class="product-options" style="padding:8px 0"><p id="commutativity" style="font-weight:700;margin:6px 0"></p></div>':'')+'<div class="matrix-characteristics" id="characteristics-'+id+'"></div>';},
 createModel(ctx){
  const {THREE,matrices,t}=ctx;
  let order='BA';
  const initialB=[[0,0,1],[0,1,0],[1,0,0]];
  const toRows=cols=>[0,1,2].map(r=>[cols[0].getComponent(r),cols[1].getComponent(r),cols[2].getComponent(r)]);
  function setColumns(id,rows){for(let c=0;c<3;c++)for(let r=0;r<3;r++)matrices[id][c].setComponent(r,rows[r][c]);}
  const mul=(x,y)=>x.map(row=>[0,1,2].map(j=>row.reduce((s,v,k)=>s+v*y[k][j],0)));
  let commutes=true;
  function updateProductLabels(){
   const head=document.querySelector('#panel-ba .bar strong');if(head)head.textContent=t('resultBA')+' '+order;
   const title=document.querySelector('#panel-ba .data h2');if(title)title.textContent=t('matrixBA').replace(/(BA|AB)$/,order);
   const label=document.getElementById('product-order-label');if(label)label.textContent=t('prodOrder')+':';
   const result=document.getElementById('commutativity');if(result)result.textContent=t(commutes?'commuteYes':'commuteNo');
  }
  function compute(){
   const A=toRows(matrices.a),B=toRows(matrices.b),AB=mul(A,B),BA=mul(B,A);
   commutes=AB.every((row,i)=>row.every((v,j)=>Math.abs(v-BA[i][j])<1e-8));
   setColumns('ba',order==='BA'?BA:AB);
   updateProductLabels();
  }
  function displayPoint(id,p){
   if(id==='a')return p.clone();
   const max=Math.max(...matrices[id].flatMap(v=>[Math.abs(v.x),Math.abs(v.y),Math.abs(v.z)]));
   return p.clone().multiplyScalar(max>3?3/max:1);
  }
function updatePlaneEquation(id){
 const label=t('planeLabel');
 const degenerate=t('planeDegenerate');
 const [p,q,r]=matrices[id];
 const u=new THREE.Vector3().subVectors(q,p),v=new THREE.Vector3().subVectors(r,p);
 const n=u.cross(v);
 const el=document.getElementById('plane-equation-'+id);
 if(n.length()<1e-8){el.textContent=label+': '+degenerate;return;}
 // Unit normal gives stable, human-readable coefficients even for large normals.
 n.normalize();const d=n.dot(p);
 const clean=x=>Math.abs(x)<0.000005?0:Number(x.toFixed(3));
 const ns=[clean(n.x),clean(n.y),clean(n.z)];
 const build=()=>{
  let formula='';
  for(let i=0;i<3;i++){
   const v=ns[i],a=Math.abs(v),variable=['x','y','z'][i];
   if(a===0)continue;
   const term=(Math.abs(a-1)<0.000001?'':String(a)) + variable;
   formula+=(formula?(v<0?' − ':' + '):(v<0?'−':''))+term;
  }
  return (formula||'0')+' = '+clean(d);
 };
 el.replaceChildren();
 const b=document.createElement('strong');b.textContent=label+':';
 const f=document.createElement('span');f.className='formula';f.textContent=build();
 el.append(b,f);
}

// Invariants and all three characteristic roots of a real 3x3 matrix.
// Scale the matrix first to reduce intermediate overflow for high powers.
function matrixCharacteristics(id){
 const m=matrices[id],rows=[0,1,2].map(r=>[m[0].getComponent(r),m[1].getComponent(r),m[2].getComponent(r)]);
 const entries=rows.flat(),scale=Math.max(...entries.map(Math.abs));
 const box=document.getElementById('characteristics-'+id);
 const span=(title,value)=>{const line=document.createElement('div');const strong=document.createElement('strong');strong.textContent=title+': ';line.append(strong);const content=document.createElement('span');content.className='math-line';content.textContent=value;line.append(content);box.append(line);};
 box.replaceChildren();
 if(!Number.isFinite(scale)){span(t('charEq'),'overflow');span(t('charRoots'),'not finite');span(t('charDet'),'not finite');return;}
 if(scale===0){span(t('charEq'),'λ³ = 0');span(t('charRoots'),'0, 0, 0');span(t('charDet'),'0');return;}
 const a=rows.map(row=>row.map(v=>v/scale));
 const p=a[0][0]+a[1][1]+a[2][2];
 const q=a[0][0]*a[1][1]+a[0][0]*a[2][2]+a[1][1]*a[2][2]-a[0][1]*a[1][0]-a[0][2]*a[2][0]-a[1][2]*a[2][1];
 const r=a[0][0]*(a[1][1]*a[2][2]-a[1][2]*a[2][1])-a[0][1]*(a[1][0]*a[2][2]-a[1][2]*a[2][0])+a[0][2]*(a[1][0]*a[2][1]-a[1][1]*a[2][0]);
 const P=p*scale,Q=q*scale*scale,R=r*scale*scale*scale;
 const fm=v=>{if(!Number.isFinite(v))return String(v);if(Math.abs(v)<1e-11)return '0';const z=Math.abs(v);return z>=1e6||z<1e-4?v.toExponential(4):Number(v.toPrecision(7)).toString();};
 const eq=`λ³ ${P<0?'+':'−'} ${fm(Math.abs(P))}λ² ${Q<0?'−':'+'} ${fm(Math.abs(Q))}λ ${R<0?'+':'−'} ${fm(Math.abs(R))} = 0`;
 const shift=p/3, c=q-p*p/3, d=-2*p*p*p/27+p*q/3-r;
 const discriminant=(d/2)**2+(c/3)**3;
 let roots=[];
 const tolerance=1e-12*Math.max(1,Math.abs(d*d/4),Math.abs((c/3)**3));
 if(discriminant>tolerance){
  const u=Math.cbrt(-d/2+Math.sqrt(discriminant)),v=Math.cbrt(-d/2-Math.sqrt(discriminant));
  const real=u+v+shift,otherReal=-(u+v)/2+shift,imag=Math.abs(Math.sqrt(3)*(u-v)/2);
  roots=[fm(real*scale),`${fm(otherReal*scale)} + ${fm(imag*scale)}i`,`${fm(otherReal*scale)} − ${fm(imag*scale)}i`];
 }else if(discriminant < -tolerance){
  const radius=2*Math.sqrt(Math.max(0,-c/3));
  const denom=Math.sqrt(Math.max(0,-((c/3)**3)));
  const angle=Math.acos(Math.max(-1,Math.min(1,-d/(2*denom))))/3;
  roots=[0,1,2].map(k=>fm((shift+radius*Math.cos(angle-2*Math.PI*k/3))*scale));
 }else{
  const u=Math.cbrt(-d/2);
  roots=[fm((shift+2*u)*scale),fm((shift-u)*scale),fm((shift-u)*scale)];
 }
 span(t('charEq'),eq);
 span(t('charRoots'),roots.map((v,i)=>`λ${i+1} = ${v}`).join(' ; '));
 span(t('charDet'),fm(R));
}

  return {compute,displayPoint,
    renderPlaneEquation(id){updatePlaneEquation(id);},
    renderCharacteristics(id){matrixCharacteristics(id);},
    updateLabels(){updateProductLabels();},
    snapshotExtra(){return {b:matrices.b.map(v=>[v.x,v.y,v.z]),order};},
    validateExtra(state){return Array.isArray(state.b)&&state.b.length===3&&state.b.every(v=>Array.isArray(v)&&v.length===3&&v.every(x=>Number.isFinite(x)&&Math.abs(x)<=3))&&['AB','BA'].includes(state.order);},
    applyExtra(state){for(let i=0;i<3;i++)matrices.b[i].fromArray(state.b[i]);order=state.order;const sel=document.getElementById('product-order');if(sel)sel.value=order;},
    resetExtra(){setColumns('b',initialB);order='BA';const sel=document.getElementById('product-order');if(sel)sel.value=order;},
    initUI(){const sel=document.getElementById('product-order');sel.value=order;sel.addEventListener('change',()=>{const old=ctx.snapshotState();order=sel.value;ctx.recalcBA();ctx.recordAction(old);ctx.scheduleSave();});updateProductLabels();},
    onLanguageChange(){updateProductLabels();}
  };
 }
};
})();
