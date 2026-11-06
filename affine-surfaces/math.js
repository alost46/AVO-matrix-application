/* AVO affine surfaces 01c: mathematics, surface sampling and safe expression parser.
   No core code is modified. All coordinates are transformed BEFORE display scales. */
export const I=[[1,0,0],[0,1,0],[0,0,1]];
export const initialInputs={matrices:{A:I},t:[0,0,0],shape:'sphere',expr:'sin(x)*cos(y)',implicit:'x^2+y^2+z^2-1',
 bounds:{xmin:-2,xmax:2,ymin:-2,ymax:2,zmin:-2,zmax:2},stepMode:'auto',dx:0.16,dy:0.16,delay:0,
 scaleX:'linear',scaleY:'linear',scaleZ:'linear',a:1.5,b:1.1,c:1.8,minor:0.4,selectedU:0.25,selectedV:0.4};
const fns={sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,sqrt:Math.sqrt,abs:Math.abs,exp:Math.exp,log:Math.log,ln:Math.log,log10:Math.log10,floor:Math.floor,ceil:Math.ceil,round:Math.round,sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,sign:Math.sign,min:Math.min,max:Math.max,pow:Math.pow,atan2:Math.atan2};
/* Pratt parser. No eval/new Function, no property access and no arbitrary JS. */
export function compile(source){
 const raw=String(source).trim().replace(/π/g,'pi').replace(/−/g,'-');
 if(raw.length>350)throw Error('Expression is too long');
 const tokens=[];const rx=/\s*([0-9]+(?:\.[0-9]*)?(?:[eE][+-]?[0-9]+)?|\.[0-9]+(?:[eE][+-]?[0-9]+)?|[A-Za-z_][A-Za-z_0-9]*|[()+\-*/^,])\s*/gy;
 let at=0;while(at<raw.length){rx.lastIndex=at;const m=rx.exec(raw);if(!m)throw Error('Unexpected symbol: '+raw.slice(at,at+12));tokens.push(m[1]);at=rx.lastIndex;if(tokens.length>180)throw Error('Expression is too complex');}
 let p=0;function parse(min=0){const tok=tokens[p++];if(tok===undefined)throw Error('Incomplete expression');let node;
  if(tok==='+'||tok==='-'){node={op:'unary',sign:tok,arg:parse(7)};}
  else if(tok==='('){node=parse(0);if(tokens[p++]!==')')throw Error('Missing )');}
  else if(/^(?:\d|\.)/.test(tok)){node={op:'num',value:Number(tok)};}
  else if(/^[A-Za-z_]/.test(tok)){
   const name=tok.toLowerCase();if(tokens[p]==='('){if(!Object.hasOwn(fns,name))throw Error('Unknown function: '+tok);p++;const args=[];if(tokens[p]!==')'){do{args.push(parse(0));if(tokens[p]!==',')break;p++;}while(true);}if(tokens[p++]!==')')throw Error('Missing )');node={op:'fn',name,args};}
   else if(['x','y','z','pi','e'].includes(name))node={op:'var',name};else throw Error('Unknown variable: '+tok);
  }else throw Error('Unexpected: '+tok);
  while(p<tokens.length){const op=tokens[p],pr=op==='+'||op==='-'?1:op==='*'||op==='/'?3:op==='^'?6:-1;if(pr<min)break;p++;node={op,left:node,right:parse(pr+(op==='^'?0:1))};}return node;}
 const root=parse();if(p!==tokens.length)throw Error('Unexpected: '+tokens[p]);
 function value(n,x,y,z){switch(n.op){case 'num':return n.value;case 'var':return n.name==='pi'?Math.PI:n.name==='e'?Math.E:n.name==='x'?x:n.name==='y'?y:z;case 'unary':return (n.sign==='-'?-1:1)*value(n.arg,x,y,z);case 'fn':return fns[n.name](...n.args.map(a=>value(a,x,y,z)));default:{const a=value(n.left,x,y,z),b=value(n.right,x,y,z);switch(n.op){case '+':return a+b;case '-':return a-b;case '*':return a*b;case '/':return a/b;case '^':return a**b;}}}}
 return (x,y,z=0)=>value(root,x,y,z);
}
export const mul=(A,p)=>A.map(row=>row[0]*p[0]+row[1]*p[1]+row[2]*p[2]);
export const affine=(A,t,p)=>mul(A,p).map((x,i)=>x+t[i]);
export const display=(p,s)=>p.map((v,i)=>{
 const mode=[s.scaleX,s.scaleY,s.scaleZ][i];if(mode==='linear')return v;
 if(mode==='log')return v>0?Math.log10(v):NaN;
 return Math.sign(v)*Math.log10(1+Math.abs(v));});
export const visible=p=>p&&p.length===3&&p.every(x=>Number.isFinite(x)&&Math.abs(x)<=1e5);
const lerp=(a,b,t)=>a+(b-a)*t;
function xyz(face,u,v,s){const a=s.a,b=s.b,c=s.c,r=s.minor;const theta=2*Math.PI*u,phi=Math.PI*v;
 switch(face){
  case 'sphere':return [Math.sin(phi)*Math.cos(theta),Math.sin(phi)*Math.sin(theta),Math.cos(phi)];
  case 'ellipsoid':return [a*Math.sin(phi)*Math.cos(theta),b*Math.sin(phi)*Math.sin(theta),c*Math.cos(phi)];
  case 'torus':return [(a+r*Math.cos(2*Math.PI*v))*Math.cos(theta),(a+r*Math.cos(2*Math.PI*v))*Math.sin(theta),r*Math.sin(2*Math.PI*v)];
  case 'cylinder-side':return [a*Math.cos(theta),a*Math.sin(theta),c*v];
  case 'cylinder-bottom':return [a*v*Math.cos(theta),a*v*Math.sin(theta),0];
  case 'cylinder-top':return [a*v*Math.cos(theta),a*v*Math.sin(theta),c];
  case 'cone-side':return [a*(1-v)*Math.cos(theta),a*(1-v)*Math.sin(theta),c*v];
  case 'cone-bottom':return [a*v*Math.cos(theta),a*v*Math.sin(theta),0];
  case 'frustum-side':{const rr=a*(1-v)+b*v;return [rr*Math.cos(theta),rr*Math.sin(theta),c*v];}
  case 'frustum-bottom':return [a*v*Math.cos(theta),a*v*Math.sin(theta),0];
  case 'frustum-top':return [b*v*Math.cos(theta),b*v*Math.sin(theta),c];
  case 'hemi':return [Math.sin(Math.PI*v/2)*Math.cos(theta),Math.sin(Math.PI*v/2)*Math.sin(theta),Math.cos(Math.PI*v/2)];
  case 'hemi-bottom':return [v*Math.cos(theta),v*Math.sin(theta),0];
  case 'paraboloid':{const rr=Math.sqrt(Math.max(0,c))*v;return [rr*Math.cos(theta),rr*Math.sin(theta),v*v*c];}
  case 'paraboloid-bottom':{const rr=Math.sqrt(Math.max(0,c))*v;return [rr*Math.cos(theta),rr*Math.sin(theta),c];}
  default:{ // Box faces, pyramid triangles as bilinear/triangular patches
   const faces={
    'box0':[[0,0,0],[a,0,0],[0,b,0]],'box1':[[0,0,c],[a,0,c],[0,b,c]],
    'box2':[[0,0,0],[a,0,0],[0,0,c]],'box3':[[0,b,0],[a,b,0],[0,0,c]],
    'box4':[[0,0,0],[0,b,0],[0,0,c]],'box5':[[a,0,0],[a,b,0],[0,0,c]],
    'pyramid-base':[[0,0,0],[a,0,0],[0,b,0]]};
   if(faces[face]){const [o,U,V]=faces[face];return o.map((x,i)=>x+u*U[i]+v*V[i]);}
   const base=[[0,0,0],[a,0,0],[a,b,0],[0,b,0]],idx=Number(face.slice(-1));const p=base[idx],q=base[(idx+1)%4],tip=[a/2,b/2,c];return p.map((x,i)=>lerp(lerp(x,q[i],u),tip[i],v));
  }
 }
}
export const patches={sphere:['sphere'],ellipsoid:['ellipsoid'],box:['box0','box1','box2','box3','box4','box5'],cylinder:['cylinder-side','cylinder-bottom','cylinder-top'],cone:['cone-side','cone-bottom'],pyramid:['pyramid-base','pyramid0','pyramid1','pyramid2','pyramid3'],torus:['torus'],paraboloid:['paraboloid'],frustum:['frustum-side','frustum-bottom','frustum-top'],hemisphere:['hemi','hemi-bottom']};
export function setupSurface(s){
 if(s.shape==='explicit'){
  let exp=s.expr.trim().replace(/^z\s*=\s*/i,'');const fn=compile(exp);
  return [{name:'explicit',u0:s.bounds.xmin,u1:s.bounds.xmax,v0:s.bounds.ymin,v1:s.bounds.ymax,eval:(x,y)=>{const z=fn(x,y);return Number.isFinite(z)?[[x,y,z]]:[];}}];
 }
 if(s.shape==='implicit'){
  let exp=s.implicit.trim().replace(/^F\s*\(\s*x\s*,\s*y\s*,\s*z\s*\)\s*=\s*/i,'');
  if(/=/.test(exp)){const parts=exp.split('=');if(parts.length!==2)throw Error('Use F(x,y,z)=0');exp=`(${parts[0]})-(${parts[1]})`;}
  const fn=compile(exp),nz=70,zlo=s.bounds.zmin,zhi=s.bounds.zmax;
  return [{name:'implicit',u0:s.bounds.xmin,u1:s.bounds.xmax,v0:s.bounds.ymin,v1:s.bounds.ymax,eval:(x,y)=>{
   const found=[];let prev=fn(x,y,zlo),zprev=zlo;
   for(let k=1;k<=nz;k++){
    const z=zlo+(zhi-zlo)*k/nz,cur=fn(x,y,z);
    if(Number.isFinite(prev)&&Number.isFinite(cur)){
     if(prev===0)found.push(zprev);
     if(cur===0)found.push(z);
     if(prev*cur<0){let lo=zprev,hi=z,fl=prev;
      for(let n=0;n<9;n++){const mid=(lo+hi)/2,fm=fn(x,y,mid);if(!Number.isFinite(fm))break;if(fm*fl<=0)hi=mid;else {lo=mid;fl=fm;}}
      found.push((lo+hi)/2);
     }
    }prev=cur;zprev=z;
   }
   return found.sort((a,b)=>a-b).filter((v,i,arr)=>i===0||Math.abs(v-arr[i-1])>1e-4).map(z=>[x,y,z]);
  }}];
 }
 return patches[s.shape].map(name=>({name,u0:0,u1:1,v0:0,v1:1,eval:(u,v)=>[xyz(name,u,v,s)]}));
}
export function surfaceMarker(s){try{const part=setupSurface(s)[0],u=lerp(part.u0,part.u1,s.selectedU),v=lerp(part.v0,part.v1,s.selectedV);return part.eval(u,v)[0]||null;}catch(_){return null;}}
function line(from,to,color=0x4d6580){return {from,to,color};}
const nice=n=>Number.isFinite(n)?String(Number(n.toFixed(4))):'?';
const vecText=v=>`(${v.map(nice).join(', ')})`;
export function sourceFormulaText(s){
 const shape=s.shape;
 if(shape==='explicit')return `S: z = ${String(s.expr||'').trim().replace(/^z\s*=\s*/i,'')}`;
 if(shape==='implicit')return `S: ${String(s.implicit||'').trim()}`;
 if(shape==='sphere')return 'S: x² + y² + z² = 1';
 if(shape==='ellipsoid')return `S: (x/${nice(s.a)})² + (y/${nice(s.b)})² + (z/${nice(s.c)})² = 1`;
 if(shape==='box')return `S: 0≤x≤${nice(s.a)}, 0≤y≤${nice(s.b)}, 0≤z≤${nice(s.c)}`;
 if(shape==='cylinder')return `S: x² + y² = ${nice(s.a)}², 0≤z≤${nice(s.c)}; основания z=0 и z=${nice(s.c)}`;
 if(shape==='cone')return `S: x² + y² = (${nice(s.a)}·(1-z/${nice(s.c)}))², 0≤z≤${nice(s.c)}; основание z=0`;
 if(shape==='pyramid')return `S: основание [0,${nice(s.a)}]×[0,${nice(s.b)}], вершина (${nice(s.a/2)}, ${nice(s.b/2)}, ${nice(s.c)})`;
 if(shape==='torus')return `S: (√(x²+y²)−${nice(s.a)})² + z² = ${nice(s.minor)}²`;
 if(shape==='paraboloid')return 'S: z = x² + y²';
 if(shape==='frustum')return `S: усечённый конус, 0≤z≤${nice(s.c)}, радиусы ${nice(s.a)}→${nice(s.b)}`;
 if(shape==='hemisphere')return 'S: x² + y² + z² = 1, z ≥ 0';
 return 'S';
}
export function resultFormulaText(s,A){
 return `S′ = { A·p + t | p ∈ S }, ${sourceFormulaText(s).replace(/^S:\s*/,'')}`;
}
export function shiftVectorText(t){return `t = ${vecText(t||[0,0,0])}`;}
export function cubeGeometry(A,t){const E=[[0,0,0],[1,0,0],[0,1,0],[0,0,1],[1,1,0],[1,0,1],[0,1,1],[1,1,1]].map(p=>mul(A,p));
 const edges=[[0,1],[0,2],[0,3],[1,4],[1,5],[2,4],[2,6],[3,5],[3,6],[4,7],[5,7],[6,7]];
 const faces=[[0,1,4,2],[0,1,5,3],[0,2,6,3],[7,4,1,5],[7,4,2,6],[7,5,3,6]];
 const d=0.12;
 const cross=[line([-d,-d,0],[d,d,0],0x111111),line([-d,d,0],[d,-d,0],0x111111)];
 return {lines:[...edges.map(([a,b])=>line(E[a],E[b],0x538bb6)),line([0,0,0],t,0x151515),...cross],
 faces:faces.map(ids=>({vertices:ids.map(i=>E[i]),color:0x9adac0})),
 points:[{id:'shift',xyz:t,color:0x111111}],
 handles:[...Array.from({length:3},(_,c)=>({id:'a'+c,position:[A[0][c],A[1][c],A[2][c]],color:[0xf02a28,0xc6a77d,0x80c92f][c],binding:{type:'matrixColumn',matrixId:'A',column:c}})),{id:'t',position:t,color:0x000000,binding:{type:'shift'}}]};
}
export const mathModel={
 calculate({inputs,getNumericMatrix}){
  const A=getNumericMatrix('A',{x:0,y:0,z:0,t:0}),s=inputs,p=surfaceMarker(s),q=p?affine(A,s.t,p):null;
  const base=p?display(p,s):null,end=q?display(q,s):null;
  const marked=(point)=>point&&visible(point)?{lines:[line([0,0,0],point,0x212b37)],points:[{id:'selected',xyz:point,color:0xe44e3d}]}:{};
  return {pictures:{
   input:{geometry:marked(base),label:'S',formula:sourceFormulaText(s)},
   transform:{geometry:cubeGeometry(A,s.t),matrix:A,label:'A',metrics:[{key:'rank',value:String(rank(A))}],formulas:[shiftVectorText(s.t)]},
   output:{geometry:marked(end),label:'AS+t',formula:resultFormulaText(s,A)}
  }};
 },
 moveHandle({inputs,binding,position}){if(binding.type!=='shift')return false;inputs.t=position.map(v=>Math.max(-10000,Math.min(10000,v)));return true;},
 resetInputs(data){data.matrices.A=I.map(row=>row.slice());}
};
function rank(M){const a=M.map(x=>x.slice()),eps=1e-9;let r=0;for(let j=0;j<3;j++){let idx=r;for(let i=r+1;i<3;i++)if(Math.abs(a[i][j])>Math.abs(a[idx][j]))idx=i;if(Math.abs(a[idx][j])<eps)continue;[a[r],a[idx]]=[a[idx],a[r]];let v=a[r][j];for(let k=j;k<3;k++)a[r][k]/=v;for(let i=r+1;i<3;i++){let f=a[i][j];for(let k=j;k<3;k++)a[i][k]-=f*a[r][k];}r++;}return r;}
export function picturesForLayout(){return [
 {id:'input',titleKey:'inputTitle',descriptionKey:'inputDescr',editable:false},
 {id:'transform',titleKey:'transformTitle',descriptionKey:'transformDescr',matrixId:'A',editable:true},
 {id:'output',titleKey:'outputTitle',descriptionKey:'outputDescr',editable:false}];}
export const MSG={
 ru:{appTitle:'AVO · Аффинные преобразования поверхностей · 01c',lead:'Поверхность S → матрица A и смещение t → образ AS+t. Управление построением находится над картинками.',inputTitle:'Исходная поверхность S',transformTitle:'Матрица A и вектор t',outputTitle:'Результат AS+t',inputDescr:'Выберите поверхность и шаг сетки. Точка на поверхности выделена.',transformDescr:'Редактируйте столбцы A числами или маркерами; перемещайте чёрный маркер t.',outputDescr:'Построение идёт вслед за исходной поверхностью. Все подходящие Z отображаются сразу.',helpTitle:'Аффинные преобразования поверхностей',helpMath:'Каждая точка p поверхности преобразуется в Ap+t. Для z=f(x,y) и F(x,y,z)=0: при фиксированном Y X растёт слева направо, затем Y увеличивается. Для неявного уравнения показываются все найденные корни Z в заданном диапазоне. Шаги DX и DY влияют на детализацию. Задержка 0 означает максимальную скорость. Логарифмический масштаб применяется только к показу, не к исходной математике. Обычный логарифм скрывает неположительные координаты; симметричный логарифм позволяет показывать и ноль, и отрицательные значения.'},
 en:{appTitle:'AVO · Affine Surface Transformations · 01c',lead:'Surface S → matrix A and shift t → image AS+t. Construction controls are above the panels.',inputTitle:'Original surface S',transformTitle:'Matrix A and shift t',outputTitle:'Result AS+t',inputDescr:'Choose a surface and mesh spacing. A point is highlighted.',transformDescr:'Edit columns of A with numbers or markers; drag the black t marker.',outputDescr:'The output is built alongside the input. Every matching Z is drawn immediately.',helpTitle:'Affine surface transformations',helpMath:'Each point p is transformed to Ap+t. For z=f(x,y) and F(x,y,z)=0, scan X at fixed Y, then advance Y. For implicit equations, find all Z roots in the chosen range. DX and DY determine mesh density. Delay 0 means full speed. Nonlinear axis scales change only the display, never the affine calculation. Standard log hides nonpositive coordinates; signed log includes zero and negatives.'},
 he:{appTitle:'AVO · טרנספורמציות אפיניות של משטחים · 01c',lead:'משטח S ← מטריצה A והזזה t ← התמונה AS+t. כלי הבנייה מעל האיורים.',inputTitle:'המשטח המקורי S',transformTitle:'מטריצה A ווקטור הזזה t',outputTitle:'התוצאה AS+t',inputDescr:'בחרו משטח ומרווח רשת. נקודה על המשטח מסומנת.',transformDescr:'ערכו את עמודות A במספרים או בסמנים; גררו את הסמן השחור של t.',outputDescr:'התוצאה נבנית לצד המקור. כל ערכי Z האפשריים מוצגים מיד.',helpTitle:'טרנספורמציות אפיניות של משטחים',helpMath:'כל נקודה p עוברת אל Ap+t. עבור z=f(x,y) או F(x,y,z)=0 סורקים X עבור Y קבוע, ומתקדמים ל-Y הבא. עבור משוואה סתומה מוצאים את כל שורשי Z בטווח. המרווחים DX,DY קובעים את צפיפות הרשת. השהיה 0 פירושה מהירות מרבית. קנה מידה לוגריתמי משנה רק את התצוגה ולא את החישוב.'}
};
