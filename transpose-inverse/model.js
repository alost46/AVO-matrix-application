/* Mathematics plug-in only: A, transpose(A), inverse(A). AVO Core v1 unchanged. */
(function(){
const APP_MESSAGES = {
  "ru": {
    "appTitle": "Транспонированная и обратная матрицы",
    "edition": "Веб-версия 01a",
    "lead": "Введите матрицу A. Транспонированная Aᵀ и обратная A⁻¹ вычисляются автоматически.",
    "objectA": "Матрица A",
    "transformB": "Транспонированная Aᵀ",
    "resultBA": "Обратная A⁻¹",
    "matrixA": "Матрица A",
    "matrixB": "Матрица Aᵀ",
    "matrixBA": "Матрица A⁻¹",
    "descrA": "Редактируйте A численно или перетаскивайте концы векторов.",
    "descrB": "Перестановка строк и столбцов. Только обзор.",
    "descrBA": "Обратная матрица существует только при ненулевом определителе.",
    "helpTitle": "Справка: транспонирование и обращение",
    "readyResult": "Только обзор: вращайте сетку или изменяйте масштаб.",
    "baOverlay": "A⁻¹: вычисляется автоматически",
    "quickHelp": "Исходная матрица A редактируется; результаты Aᵀ и A⁻¹ рассчитываются автоматически.",
    "charEq": "Характеристическое уравнение",
    "charRoots": "Собственные значения",
    "charDet": "Определитель",
    "noInverse": "Обратная матрица не существует: det(A) = 0.",
    "helpHtml": "<p><b>Три панели:</b> A, транспонированная Aᵀ и обратная A⁻¹.</p><p><b>Редактирование:</b> только в A разрешено перетаскивать концы цветных векторов и вводить матрицу. В остальных панелях можно вращать и масштабировать графики.</p><p><b>Определитель:</b> если det(A) = 0, обратной матрицы нет. Третья панель показывает предупреждение вместо придуманного результата.</p><p><b>Управление:</b> лучи X/Y/Z, XY/Z, одинаковый обзор, увеличение, три языка, Undo, сброс, JSON и автосохранение сохранены из AVO Core 1.0.</p>"
  },
  "en": {
    "appTitle": "Matrix Transpose & Inverse",
    "edition": "Web version 01a",
    "lead": "Edit matrix A. Its transpose Aᵀ and inverse A⁻¹ are computed automatically.",
    "objectA": "Matrix A",
    "transformB": "Transpose Aᵀ",
    "resultBA": "Inverse A⁻¹",
    "matrixA": "Matrix A",
    "matrixB": "Matrix Aᵀ",
    "matrixBA": "Matrix A⁻¹",
    "descrA": "Edit A by typing or dragging vector endpoints.",
    "descrB": "Rows and columns are interchanged. View only.",
    "descrBA": "Inverse exists only when the determinant is nonzero.",
    "helpTitle": "Transpose & Inverse Help",
    "readyResult": "View only: orbit or zoom the grid.",
    "baOverlay": "A⁻¹: computed automatically",
    "quickHelp": "Edit A; Aᵀ and A⁻¹ are calculated automatically.",
    "charEq": "Characteristic equation",
    "charRoots": "Eigenvalues",
    "charDet": "Determinant",
    "noInverse": "Inverse does not exist: det(A) = 0.",
    "helpHtml": "<p><b>Three panels:</b> A, transpose Aᵀ and inverse A⁻¹.</p><p><b>Editing:</b> only A allows dragging vector endpoints or entering matrix values. Other panels permit camera rotation and zoom.</p><p><b>Determinant:</b> when det(A) = 0 the inverse does not exist; the third panel shows a warning, not a fictional result.</p><p><b>Controls:</b> X/Y/Z rays, XY/Z, Same view, expand, three languages, Undo, reset, JSON files and autosave are shared AVO Core 1.0 features.</p>"
  },
  "he": {
    "appTitle": "מטריצה משוחלפת והפוכה",
    "edition": "גרסת רשת 01a",
    "lead": "ערכו את A. המטריצה המשוחלפת Aᵀ וההפוכה A⁻¹ מחושבות אוטומטית.",
    "objectA": "מטריצה A",
    "transformB": "מטריצה משוחלפת Aᵀ",
    "resultBA": "מטריצה הפוכה A⁻¹",
    "matrixA": "מטריצה A",
    "matrixB": "מטריצה Aᵀ",
    "matrixBA": "מטריצה A⁻¹",
    "descrA": "ערכו את A במספרים או בגרירת קצות וקטורים.",
    "descrB": "החלפת שורות ועמודות. צפייה בלבד.",
    "descrBA": "מטריצה הפוכה קיימת רק כאשר הדטרמיננטה אינה אפס.",
    "helpTitle": "עזרה: שחלוף והיפוך מטריצה",
    "readyResult": "צפייה בלבד: סיבוב או שינוי קנה מידה.",
    "baOverlay": "A⁻¹: מחושב אוטומטית",
    "quickHelp": "ערכו את A; שחלוף והיפוך מחושבים אוטומטית.",
    "charEq": "המשוואה האופיינית",
    "charRoots": "ערכים עצמיים",
    "charDet": "דטרמיננטה",
    "noInverse": "אין מטריצה הפוכה: det(A) = 0.",
    "helpHtml": "<p><b>שלושה חלונות:</b> A, שחלוף Aᵀ והופכי A⁻¹.</p><p><b>עריכה:</b> רק במטריצה A ניתן לשנות וקטורים או להקליד ערכים. בחלונות האחרים ניתן לסובב ולהגדיל.</p><p><b>דטרמיננטה:</b> כאשר det(A) = 0 אין מטריצה הפוכה, ומוצגת אזהרה.</p><p><b>כלים:</b> קרני X/Y/Z, מצבי XY/Z, תצוגה זהה, שלוש שפות, ביטול, איפוס ושמירת JSON מהליבה המשותפת.</p>"
  }
};
const I18N=Object.fromEntries(['ru','en','he'].map(lang=>[lang,{...window.AVOCommonMessages[lang],...APP_MESSAGES[lang]}]));
window.AVOTransposeInverse={
 name:'Transpose & Inverse',version:'01a · Core 1.0',
 stateKey:'avo-matrix-transpose-inverse-01a-state',fileName:'Transpose_Inverse_state.json',
 labels:{a:'A',b:'Aᵀ',ba:'A⁻¹'},editable:['a'],messages:I18N,
 toolbarHTML:'',extraHTML(id){return '<div class="matrix-characteristics" id="characteristics-'+id+'"></div>';},
 createModel(ctx){
  const {THREE,matrices,t}=ctx;
  let invertible=true;
  const toRows=cols=>[0,1,2].map(r=>[cols[0].getComponent(r),cols[1].getComponent(r),cols[2].getComponent(r)]);
  function setColumns(id,rows){for(let c=0;c<3;c++)for(let r=0;r<3;r++)matrices[id][c].setComponent(r,rows[r][c]);}
  function determinant(m){return m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);}
  function compute(){
   const a=toRows(matrices.a),det=determinant(a);
   setColumns('b',a[0].map((_,c)=>a.map(row=>row[c])));
   invertible=Number.isFinite(det)&&Math.abs(det)>1e-10;
   if(!invertible){setColumns('ba',[[0,0,0],[0,0,0],[0,0,0]]);return;}
   const inverse=[
    [(a[1][1]*a[2][2]-a[1][2]*a[2][1])/det,(a[0][2]*a[2][1]-a[0][1]*a[2][2])/det,(a[0][1]*a[1][2]-a[0][2]*a[1][1])/det],
    [(a[1][2]*a[2][0]-a[1][0]*a[2][2])/det,(a[0][0]*a[2][2]-a[0][2]*a[2][0])/det,(a[0][2]*a[1][0]-a[0][0]*a[1][2])/det],
    [(a[1][0]*a[2][1]-a[1][1]*a[2][0])/det,(a[0][1]*a[2][0]-a[0][0]*a[2][1])/det,(a[0][0]*a[1][1]-a[0][1]*a[1][0])/det]
   ];
   setColumns('ba',inverse);
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
   renderPlaneEquation(id){if(id==='ba'&&!invertible){document.getElementById('plane-equation-ba').textContent=t('noInverse');return;}updatePlaneEquation(id);},
   renderCharacteristics(id){if(id==='ba'&&!invertible){const el=document.getElementById('characteristics-ba');el.textContent=t('noInverse');return;}matrixCharacteristics(id);},
   updateLabels(){},snapshotExtra(){return {};},validateExtra(){return true;},applyExtra(){},resetExtra(){},initUI(){},
   onLanguageChange(){if(!invertible){document.getElementById('characteristics-ba').textContent=t('noInverse');document.getElementById('plane-equation-ba').textContent=t('noInverse');}}
  };
 }
};
})();
