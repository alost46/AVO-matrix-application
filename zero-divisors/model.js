/* Mathematical plug-in: nonzero B satisfying AB=0 for singular nonzero A. AVO Core v1 unchanged. */
(function(){
const APP_MESSAGES = {
 ru:{imageLine:'Уравнение прямой',imagePoint:'Образ матрицы — точка',appTitle:'Делители нуля матрицы',edition:'Веб-версия 02h',lead:'Изменяйте A и выбирайте базисные правые и левые аннуляторы. Нулевое произведение проверяется вычислением.',objectA:'Исходная A',transformB:'Правый делитель Rₖ',resultBA:'Левый делитель Lₖ',matrixA:'Матрица A',matrixB:'Матрица Rₖ',matrixBA:'Матрица Lₖ',descrA:'Изменяйте A численно или перетаскиванием векторов.',descrB:'Ненулевая Rₖ удовлетворяет ARₖ = 0.',descrBA:'Ненулевая Lₖ удовлетворяет LₖA = 0.',helpTitle:'Справка: делители нуля',readyResult:'Только обзор: вращение и масштабирование.',baOverlay:'Lₖ: левый делитель нуля',quickHelp:'Правые R удовлетворяют AR = 0, левые L удовлетворяют LA = 0. Подробное объяснение — в справке (?).',charEq:'Характеристическое уравнение',charRoots:'Собственные значения',charDet:'Определитель',noInverse:'Ненулевых делителей для этой матрицы нет.',rightCountLabel:'Правых базисных делителей',leftCountLabel:'Левых базисных делителей',rightChooser:'Правый базисный делитель',leftChooser:'Левый базисный делитель',countText:'Базисных: {n}',none:'Нет',rank:'Ранг A',checkRight:'Проверка AR',checkLeft:'Проверка LA',noDivisors:'Ненулевых делителей нет: A обратима.',zeroCase:'A = 0: все 9 базисных матриц обращают произведение в нуль, но нулевая A сама не является делителем нуля.',helpHtml:'<p><b>Определение.</b> Ненулевые матрицы A и R являются делителями нуля, если AR = 0. Для левого делителя L выполняется LA = 0.</p><p><b>Правые делители.</b> Каждый столбец R лежит в ядре A: AR = 0, R = UC, где столбцы U образуют базис ker(A).</p><p><b>Левые делители.</b> Каждая строка L лежит в левом ядре A: LA = 0, L = DVᵀ, где столбцы V образуют базис ker(Aᵀ).</p><p><b>Выбор номера.</b> Показываются линейно независимые базисные матрицы, а не все делители: произвольный делитель является их линейной комбинацией. Для ранга r пространство правых и левых аннуляторов имеет размерность 3(3 − r). Ранг 3: 0; ранг 2: 3; ранг 1: 6; ранг 0: 9.</p><p>При A = 0 обе коллекции содержат девять базисных матриц, но само A = 0 не считается делителем нуля по определению «ненулевой A». Проверка AR и LA приводится под соответствующими матрицами. Численные расчёты выполняются с допуском округления. Геометрия: ранг 0 даёт точку, ранг 1 прямую, ранг 2 плоскость. При ранге 3 показано сечение образа двумерной плоскости.</p><p>Инструменты AVO Core: вращение, масштаб, лучи X/Y/Z, три языка, Undo, автосохранение и JSON.</p>'},
 en:{imageLine:'Line equation',imagePoint:'Matrix image: point',appTitle:'Matrix Zero Divisors',edition:'Web version 02h',lead:'Edit A and select a basis right or left annihilator.',objectA:'Input A',transformB:'Right divisor Rₖ',resultBA:'Left divisor Lₖ',matrixA:'Matrix A',matrixB:'Matrix Rₖ',matrixBA:'Matrix Lₖ',descrA:'Edit A numerically or drag vectors.',descrB:'Nonzero Rₖ satisfies ARₖ = 0.',descrBA:'Nonzero Lₖ satisfies LₖA = 0.',helpTitle:'Help: Matrix Zero Divisors',readyResult:'View only: rotate and zoom.',baOverlay:'Lₖ: left zero divisor',quickHelp:'Right R satisfies AR = 0; left L satisfies LA = 0. See Help (?) for details.',charEq:'Characteristic polynomial',charRoots:'Eigenvalues',charDet:'Determinant',noInverse:'No nonzero annihilator exists.',rightCountLabel:'Right basis zero divisors',leftCountLabel:'Left basis zero divisors',rightChooser:'Right basis divisor',leftChooser:'Left basis divisor',countText:'Basis matrices: {n}',none:'None',rank:'Rank of A',checkRight:'Check AR',checkLeft:'Check LA',noDivisors:'No nonzero divisors: A is invertible.',zeroCase:'A = 0: all 9 basis matrices annihilate A, but the zero matrix A is not itself a zero divisor.',helpHtml:'<p><b>Definition.</b> Nonzero matrices A and R are zero divisors if AR = 0. A left divisor L satisfies LA = 0.</p><p><b>Right annihilators.</b> Each column of R lies in ker(A). If U is a basis matrix for ker(A), then R = UC.</p><p><b>Left annihilators.</b> Each row of L lies in the left kernel. If V spans ker(Aᵀ), then L = DVᵀ.</p><p><b>Selection.</b> These are basis matrices, not all zero divisors: all annihilators are their linear combinations. Their vector-space dimension is 3(3 − rank(A)): 0, 3, 6 or 9.</p><p>For A = 0 there are nine basis annihilators, but the zero A is not a zero divisor under the nonzero definition. Numerical checks use a small tolerance.</p>'},
 he:{imageLine:'משוואת הישר',imagePoint:'תמונת המטריצה: נקודה',appTitle:'מחלקי אפס של מטריצות',edition:'גרסת רשת 02h',lead:'ערכו את A ובחרו מאפס ימני או שמאלי מתוך בסיס המרחב.',objectA:'מטריצה A',transformB:'מאפס ימני Rₖ',resultBA:'מאפס שמאלי Lₖ',matrixA:'מטריצה A',matrixB:'מטריצה Rₖ',matrixBA:'מטריצה Lₖ',descrA:'ערכו את A במספרים או בגרירת וקטורים.',descrB:'Rₖ שאינה אפס מקיימת ARₖ = 0.',descrBA:'Lₖ שאינה אפס מקיימת LₖA = 0.',helpTitle:'עזרה: מחלקי אפס',readyResult:'תצוגה בלבד: סיבוב וזום.',baOverlay:'Lₖ: מאפס שמאלי',quickHelp:'R מקיימת AR = 0, ו־L מקיימת LA = 0. הסברים נוספים בעזרה (?).',charEq:'המשוואה האופיינית',charRoots:'ערכים עצמיים',charDet:'דטרמיננטה',noInverse:'לא קיימים מאפסים שאינם אפס.',rightCountLabel:'מחלקי אפס ימניים בבסיס',leftCountLabel:'מחלקי אפס שמאליים בבסיס',rightChooser:'מאפס ימני בבסיס',leftChooser:'מאפס שמאלי בבסיס',countText:'מספר בבסיס: {n}',none:'אין',rank:'דרגת A',checkRight:'בדיקת AR',checkLeft:'בדיקת LA',noDivisors:'אין מחלקי אפס שאינם אפס: A הפיכה.',zeroCase:'A = 0: יש 9 מטריצות בסיס שמאפסות את המכפלה, אבל A האפס אינה מחלק אפס בעצמה.',helpHtml:'<p><b>הגדרה.</b> מטריצות לא־אפס A ו־R הן מחלקי אפס כאשר AR = 0. מאפס שמאלי L מקיים LA = 0.</p><p><b>מימין.</b> העמודות של R נמצאות בגרעין של A: ‏R = UC, כאשר U מכילה בסיס לגרעין ker(A).</p><p><b>משמאל.</b> השורות של L שייכות לגרעין השמאלי: ‏L = DVᵀ, כאשר V מכילה בסיס של ker(Aᵀ).</p><p><b>בחירה.</b> מוצגות מטריצות בסיס, לא כל מחלקי האפס. הממד של מרחב המאפסים הוא 3(3 − rank(A)): ‏0, 3, 6 או 9.</p><p>כאשר A = 0 יש תשע מטריצות בסיס שמאפסות את המכפלה, אך A עצמה אינה מחלק אפס לפי הגדרת מטריצה לא־אפס.</p>'}
};
const I18N=Object.fromEntries(['ru','en','he'].map(lang=>[lang,{...window.AVOCommonMessages[lang],...APP_MESSAGES[lang]}]));
window.AVOZeroDivisors={
 name:'Zero Divisors',version:'02h · Core 1.0',
 stateKey:'avo-matrix-zero-divisors-02a-state',fileName:'Zero_Divisors_state.json',
 labels:{a:'A',b:'Rₖ',ba:'Lₖ'},initialA:[[1,0,0],[0,1,0],[0,0,0]],editable:['a'],messages:I18N,
toolbarHTML:'<div class="zero-toolbar" style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;padding:10px 4px;font-weight:600"><strong id="rank-label">Ранг A: 2</strong><span id="right-count"></span><span id="left-count"></span></div>',extraHTML(id){return '<div class="matrix-characteristics" id="characteristics-'+id+'"></div>'+(id==='b'?'<div id="check-b"></div>':id==='ba'?'<div id="check-ba"></div>':'');},
 createModel(ctx){
  const {THREE,matrices,t,charts,snapshotState,recalcBA,scheduleSave,recordAction}=ctx;
  const toRows=cols=>[0,1,2].map(r=>[cols[0].getComponent(r),cols[1].getComponent(r),cols[2].getComponent(r)]);
  function setColumns(id,rows){for(let c=0;c<3;c++)for(let r=0;r<3;r++)matrices[id][c].setComponent(r,rows[r][c]);}
  function determinant(m){return m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);}
  let rightIndex=1,leftIndex=1,rank=3,rightCount=0,leftCount=0,zeroA=false;
  const zeros=()=>Array.from({length:3},()=>[0,0,0]);
  const transpose=m=>[0,1,2].map(i=>[0,1,2].map(j=>m[j][i]));
  function nullspace(m){
    const a=m.map(row=>row.slice());
    const scale=Math.max(1,...a.flat().map(Math.abs));
    const tol=1e-9*scale,pivots=[];let pr=0;
    for(let col=0;col<3&&pr<3;col++){
      let best=pr;for(let r=pr+1;r<3;r++)if(Math.abs(a[r][col])>Math.abs(a[best][col]))best=r;
      if(Math.abs(a[best][col])<=tol)continue;
      [a[pr],a[best]]=[a[best],a[pr]];
      const d=a[pr][col];for(let c=0;c<3;c++)a[pr][c]/=d;
      for(let r=0;r<3;r++)if(r!==pr){const factor=a[r][col];for(let c=0;c<3;c++)a[r][c]-=factor*a[pr][c];}
      pivots.push(col);pr++;
    }
    const free=[0,1,2].filter(i=>!pivots.includes(i));
    const vectors=free.map(col=>{
      const v=[0,0,0];v[col]=1;
      pivots.forEach((pc,i)=>v[pc]=-a[i][col]);
      const norm=Math.hypot(...v);return v.map(x=>Math.abs(x/norm)<1e-12?0:x/norm);
    });
    return {rank:pivots.length,vectors};
  }
  const product=(a,b)=>a.map(row=>[0,1,2].map(j=>row.reduce((sum,val,k)=>sum+val*b[k][j],0)));
  function updateChooser(id,count,current){
    const el=document.getElementById(id);if(!el)return;
    if(el.options.length!==count){el.replaceChildren();for(let k=1;k<=count;k++){const opt=document.createElement('option');opt.value=String(k);opt.textContent=String(k);el.append(opt);}}
    el.disabled=count===0;el.value=count?String(current):'';
  }
  function chooserLabels(){
    const set=(id,key)=>{const e=document.getElementById(id);if(e)e.textContent=t(key);};
    set('right-label','rightChooser');set('left-label','leftChooser');
    const r=document.getElementById('right-count'),l=document.getElementById('left-count');
    if(r)r.textContent=t('rightCountLabel')+': '+rightCount;
    if(l)l.textContent=t('leftCountLabel')+': '+leftCount;
    set('rank-label','rank');const re=document.getElementById('rank-label');if(re)re.textContent=t('rank')+': '+rank;
  }
  function compute(){
    const a=toRows(matrices.a);zeroA=a.flat().every(v=>Math.abs(v)<1e-9);
    const nr=nullspace(a),nl=nullspace(transpose(a));rank=nr.rank;
    rightCount=3*nr.vectors.length;leftCount=3*nl.vectors.length;
    rightIndex=Math.min(Math.max(1,rightIndex),Math.max(1,rightCount));
    leftIndex=Math.min(Math.max(1,leftIndex),Math.max(1,leftCount));
    let R=zeros(),L=zeros();
    if(rightCount){const k=rightIndex-1;const v=nr.vectors[Math.floor(k/3)];const col=k%3;R=v.map(x=>[0,1,2].map(j=>j===col?x:0));}
    if(leftCount){const k=leftIndex-1;const v=nl.vectors[Math.floor(k/3)];const row=k%3;L=[0,1,2].map(i=>i===row?v.slice():[0,0,0]);}
    setColumns('b',R);setColumns('ba',L);
    const residual=(m)=>Math.max(0,...m.flat().map(Math.abs));
    const fmt=x=>x<1e-9?'0':x.toExponential(2);
    const rb=document.getElementById('check-b'),lb=document.getElementById('check-ba');
    if(rb)rb.textContent=t('checkRight')+' = 0; max |AR| = '+(rightCount?fmt(residual(product(a,R))):'—');
    if(lb)lb.textContent=t('checkLeft')+' = 0; max |LA| = '+(leftCount?fmt(residual(product(L,a))):'—');
    updateChooser('right-index',rightCount,rightIndex);updateChooser('left-index',leftCount,leftIndex);chooserLabels();
  }
  function displayPoint(id,p){
   if(id==='a')return p.clone();
   const max=Math.max(...matrices[id].flatMap(v=>[Math.abs(v.x),Math.abs(v.y),Math.abs(v.z)]));
   return p.clone().multiplyScalar(max>3?3/max:1);
  }
// Represent the image (column space) of the matrix rather than the affine
// plane through three vector endpoints. Rank 2 is a plane, rank 1 is a line,
// rank 0 is the origin. For full-rank matrices show a representative image
// plane spanned by the first two independent columns.
function imageBasis(id){
 const vectors=matrices[id].map(v=>v.clone());
 const scale=Math.max(1,...vectors.map(v=>v.length()));
 const tol=1e-8*scale;
 const orth=[];
 for(const v of vectors){
  const q=v.clone();
  for(const e of orth)q.addScaledVector(e,-q.dot(e));
  if(q.length()>tol)orth.push(q.normalize());
 }
 return orth;
}
const format3=x=>Math.abs(x)<0.0005?'0':Number(x.toFixed(3)).toString();
function formulaLine(coeffs){
 let result='';
 coeffs.forEach((v,i)=>{
  if(Math.abs(v)<0.0005)return;
  const n=Math.abs(v),term=(Math.abs(n-1)<0.0005?'':format3(n))+['x','y','z'][i];
  result+=(result?(v<0?' − ':' + '):(v<0?'−':''))+term;
 });
 return result||'0';
}
function updatePlaneEquation(id){
 const el=document.getElementById('plane-equation-'+id);
 if(!el)return;
 if(id!=='a'&&rightCount===0){el.textContent=t('noDivisors');return;}
 const basis=imageBasis(id),dim=basis.length;
 let formula;
 let heading;
 if(dim===0){heading=t('imagePoint');formula='(0, 0, 0)';}
 else if(dim===1){
  heading=t('imageLine');
  const u=basis[0];formula='(x, y, z) = s·('+[u.x,u.y,u.z].map(format3).join(', ')+'),  s ∈ ℝ';
 }else{
  heading=t('planeLabel');
  const n=basis[0].clone().cross(basis[1]).normalize();
  formula=formulaLine([n.x,n.y,n.z])+' = 0';
 }
 el.replaceChildren();
 const label=document.createElement('strong');label.textContent=heading+':';
 const value=document.createElement('span');value.className='formula';value.textContent=formula;
 el.append(label,value);
}
function addImageGeometry(chart){
 const mesh=new THREE.Mesh(
  new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(18),3)),
  new THREE.MeshBasicMaterial({color:0xffc12b,side:THREE.DoubleSide,transparent:true,opacity:.14,depthWrite:false})
 );
 mesh.renderOrder=2;chart.scene.add(mesh);
 const grid=new THREE.LineSegments(
  new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(44*3),3)),
  new THREE.LineBasicMaterial({color:0xe99d00,transparent:true,opacity:.85,depthWrite:false})
 );
 grid.renderOrder=3;chart.scene.add(grid);
 const line=new THREE.Line(
  new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3)),
  new THREE.LineBasicMaterial({color:0xf2a20b,depthTest:false})
 );
 line.renderOrder=5;chart.scene.add(line);
 chart._imageShape={mesh,grid,line};
}
function drawImageGeometry(chart){
 const id=chart.id;
 // Disable core's endpoint-plane; the image geometry below is authoritative.
 chart.planeMesh.visible=false;chart.planeGrid.visible=false;
 if(!chart._imageShape)addImageGeometry(chart);
 const {mesh,grid,line}=chart._imageShape,basis=imageBasis(id);
 mesh.visible=false;grid.visible=false;line.visible=false;
 if(basis.length===0)return;
 if(basis.length===1){
  line.visible=true;
  const d=basis[0].clone().multiplyScalar(3);
  const pos=line.geometry.attributes.position;
  pos.setXYZ(0,-d.x,-d.y,-d.z);pos.setXYZ(1,d.x,d.y,d.z);
  pos.needsUpdate=true;line.geometry.computeBoundingSphere();return;
 }
 mesh.visible=true;grid.visible=true;
 const u=basis[0].clone().multiplyScalar(2.65),v=basis[1].clone().multiplyScalar(2.65);
 const corner=(x,y)=>u.clone().multiplyScalar(x).addScaledVector(v,y);
 const a=corner(-1,-1),b=corner(1,-1),c=corner(1,1),d=corner(-1,1);
 const triangles=[a,b,c,a,c,d],pa=mesh.geometry.attributes.position;
 triangles.forEach((pt,i)=>pa.setXYZ(i,pt.x,pt.y,pt.z));pa.needsUpdate=true;
 mesh.geometry.computeBoundingSphere();
 const ga=grid.geometry.attributes.position;let i=0;
 const put=pt=>ga.setXYZ(i++,pt.x,pt.y,pt.z);
 for(let k=0;k<=10;k++){
  const t=-1+2*k/10;
  put(corner(t,-1));put(corner(t,1));put(corner(-1,t));put(corner(1,t));
 }
 ga.needsUpdate=true;grid.geometry.computeBoundingSphere();
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
    renderCharacteristics(id){if(id!=='a'&&rightCount===0){document.getElementById('characteristics-'+id).textContent=t('noDivisors');return;}matrixCharacteristics(id);},
    updateLabels(){},snapshotExtra(){return {rightIndex,leftIndex};},
    validateExtra(value){return Number.isInteger(value.rightIndex)&&value.rightIndex>=1&&value.rightIndex<=9&&Number.isInteger(value.leftIndex)&&value.leftIndex>=1&&value.leftIndex<=9;},
    applyExtra(value){rightIndex=value.rightIndex;leftIndex=value.leftIndex;},
    resetExtra(){rightIndex=1;leftIndex=1;},
    initUI(){
      // Decorate the charts, without modifying the shared AVO Core.
      for(const chart of Object.values(charts)){
        const coreUpdate=chart.updateGeometry.bind(chart);
        chart.updateGeometry=()=>{coreUpdate();drawImageGeometry(chart);};
        chart.updateGeometry();
      }
      for(const [id,side] of [['right-index','right'],['left-index','left']]){
        const selector=document.getElementById(id);
        if(!selector)throw new Error('Missing divisor selector: '+id);
        let previousSelection=side==='right'?rightIndex:leftIndex;
        const applySelection=()=>{
          const selected=Number(selector.value);
          if(!Number.isInteger(selected)||selected<1)return;
          const count=side==='right'?rightCount:leftCount;
          if(selected>count)return;
          const current=side==='right'?rightIndex:leftIndex;
          if(selected===current)return;
          const before=snapshotState();
          if(side==='right')rightIndex=selected;else leftIndex=selected;
          // The core owns both table rendering and WebGL chart refresh.
          // Recalculate immediately for both pointer and keyboard selection.
          recalcBA();
          recordAction(before);
          scheduleSave();
          previousSelection=selected;
        };
        selector.addEventListener('input',applySelection);
        selector.addEventListener('change',applySelection);
      }
      chooserLabels();
    },
    onLanguageChange(){chooserLabels();}
  };
 }
};
})();
