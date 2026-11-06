/* AVO affine surfaces 01i: mathematics, surface sampling and safe expression parser.
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
// Parse one implicit equation or the intersection of TWO implicit surfaces.
// Separators may be semicolons, new lines, or (for a common one-line notation)
// whitespace before the second equation's variable expression.
export function implicitEquationTexts(source){
 let raw=String(source||'').replace(/\r\n?/g,'\n').trim();
 raw=raw.replace(/\s+(?=[xyzXYZ](?:\s*\^\s*\d+)?\s*=)/g,';');
 const items=raw.split(/[;\n]+/).map(v=>v.trim()).filter(Boolean);
 if(items.length===0)throw Error('Enter an equation / Введите уравнение');
 if(items.length>3)throw Error('This version supports up to three equations / Поддерживаются до трёх уравнений');
 return items;
}
export function compileEquation(raw){
 let expression=raw.trim().replace(/^F\s*\(\s*x\s*,\s*y\s*,\s*z\s*\)\s*=\s*/i,'');
 if(expression.includes('=')){
  const parts=expression.split('=');
  if(parts.length!==2)throw Error('Use equation of the form F(x,y,z)=0 / Проверьте знак равенства');
  expression=`(${parts[0]})-(${parts[1]})`;
 }
 return compile(expression);
}
export function compileImplicitSystem(source){
 const expressions=implicitEquationTexts(source);
 return expressions.map(compileEquation);
}
// Solve three simultaneous equations F1=F2=F3=0 as isolated points.
// A fast exact path handles three coordinate planes; otherwise use multistart
// damped Newton with a finite-difference Jacobian and residual verification.
export function solveIsolatedPoints(s){
 const expressions=implicitEquationTexts(s.implicit);
 if(expressions.length!==3)throw Error('Three equations required / Нужны три уравнения');
 const axisValues={};
 for(const text of expressions){
  const m=text.trim().match(/^([xyz])\s*=\s*([+\-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+\-]?\d+)?)$/i);
  if(m)axisValues[m[1].toLowerCase()]=Number(m[2]);
 }
 const lo=[s.bounds.xmin,s.bounds.ymin,s.bounds.zmin];
 const hi=[s.bounds.xmax,s.bounds.ymax,s.bounds.zmax];
 const inside=p=>p.every((v,k)=>Number.isFinite(v)&&v>=lo[k]-1e-7&&v<=hi[k]+1e-7);
 if(Object.keys(axisValues).length===3){
  const p=[axisValues.x,axisValues.y,axisValues.z];
  return inside(p)?[p]:[];
 }
 const fns=expressions.map(compileEquation);
 const evalAt=p=>fns.map(fn=>fn(...p));
 const norm=v=>Math.max(...v.map(x=>Math.abs(x)));
 function linearSolve(mat,rhs){
  const rows=mat.map((v,i)=>[...v,rhs[i]]);
  for(let k=0;k<3;k++){
   let imax=k;for(let j=k+1;j<3;j++)if(Math.abs(rows[j][k])>Math.abs(rows[imax][k]))imax=j;
   if(!Number.isFinite(rows[imax][k])||Math.abs(rows[imax][k])<1e-11)return null;
   [rows[imax],rows[k]]=[rows[k],rows[imax]];
   for(let j=k+1;j<3;j++){
    const scale=rows[j][k]/rows[k][k];
    for(let m=k;m<=3;m++)rows[j][m]-=scale*rows[k][m];
   }
  }
  const x=[0,0,0];
  for(let i=2;i>=0;i--){let d=rows[i][3];for(let j=i+1;j<3;j++)d-=rows[i][j]*x[j];x[i]=d/rows[i][i];}
  return x.every(Number.isFinite)?x:null;
 }
 function newton(seed){
  let p=seed.slice();
  for(let it=0;it<25;it++){
   const v=evalAt(p),old=norm(v);
   if(!Number.isFinite(old))return null;
   if(old<1e-8)return inside(p)?p:null;
   const jac=[[],[],[]];
   for(let j=0;j<3;j++){
    const h=1e-5*Math.max(1,Math.abs(p[j]));
    const up=p.slice(),down=p.slice();up[j]+=h;down[j]-=h;
    const fu=evalAt(up),fd=evalAt(down);
    for(let i=0;i<3;i++)jac[i][j]=(fu[i]-fd[i])/(2*h);
   }
   const step=linearSolve(jac,v);
   if(!step)return null;
   let accepted=false;
   for(let fraction=1;fraction>=1/256;fraction/=2){
    const trial=p.map((v,i)=>v-step[i]*fraction);
    if(!trial.every(Number.isFinite))continue;
    const r=norm(evalAt(trial));
    if(Number.isFinite(r)&&r<old){p=trial;accepted=true;break;}
   }
   if(!accepted)return null;
  }
  return norm(evalAt(p))<1e-7&&inside(p)?p:null;
 }
 // Seven samples on each axis, plus a centered start point.
 // This is a bounded approximation, not a proof that all roots were found.
 const roots=[];
 for(let ix=0;ix<=6;ix++)for(let iy=0;iy<=6;iy++)for(let iz=0;iz<=6;iz++){
  const seed=[ix,iy,iz].map((v,j)=>lo[j]+(hi[j]-lo[j])*v/6),pt=newton(seed);
  if(!pt)continue;
  if(roots.some(q=>Math.hypot(...pt.map((v,k)=>v-q[k]))<1e-3))continue;
  roots.push(pt);if(roots.length>=64)return roots;
 }
 return roots;
}

// Marching tetrahedra: first equation defines a triangulated implicit surface;
// each triangle is then intersected with the second equation. This approach
// handles curves with any orientation (including x=0;y=0 and circular sections),
// without requiring z to be a function of x,y.
export function *intersectionSlabs(s,N=40){
 const [f,g]=compileImplicitSystem(s.implicit);
 if(!g)throw Error('Two equations are needed / Нужны два уравнения');
 const b=s.bounds,lo=[b.xmin,b.ymin,b.zmin],hi=[b.xmax,b.ymax,b.zmax],
 step=lo.map((v,i)=>(hi[i]-v)/N),L=N+1;
 const at=(i,j)=>j*L+i;
 const evalSlice=k=>{
  const vals=new Float64Array(L*L*2),z=lo[2]+k*step[2];
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){
   const x=lo[0]+i*step[0],y=lo[1]+j*step[1],ind=2*at(i,j);
   vals[ind]=f(x,y,z);vals[ind+1]=g(x,y,z);
  }
  return vals;
 };
 const TET=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 const safe=v=>Number.isFinite(v)?(Math.abs(v)<1e-12?1e-12:v):NaN;
 const segments=[];
 const vtx=(positions,p,q,first,second)=>{
  const w=first[p]/(first[p]-first[q]);
  return {p:[0,1,2].map(k=>positions[p][k]*(1-w)+positions[q][k]*w),v:second[p]*(1-w)+second[q]*w};
 };
 const cutTriangle=(aa,bb,cc)=>{
  const tri=[aa,bb,cc],hits=[];
  for(const [a,b] of [[0,1],[1,2],[2,0]]){
   const va=safe(tri[a].v),vb=safe(tri[b].v);
   if(!Number.isFinite(va)||!Number.isFinite(vb)||((va<0)===(vb<0)))continue;
   const w=va/(va-vb),p=tri[a].p.map((v,k)=>v+(tri[b].p[k]-v)*w);
   hits.push(p);
  }
  if(hits.length===2&&hits[0].every(Number.isFinite)&&hits[1].every(Number.isFinite))segments.push(hits);
 };
 let below=evalSlice(0);
 for(let k=0;k<N;k++){
  const above=evalSlice(k+1);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
   const positions=[],first=[],second=[];
   for(let n=0;n<8;n++){
    const ii=i+(n===1||n===2||n===5||n===6?1:0),
          jj=j+(n===2||n===3||n===6||n===7?1:0),
          kk=(n>=4?1:0), slice=kk?above:below,ind=2*at(ii,jj);
    positions.push([lo[0]+ii*step[0],lo[1]+jj*step[1],lo[2]+(k+kk)*step[2]]);
    first.push(safe(slice[ind]));second.push(safe(slice[ind+1]));
   }
   if(!first.every(Number.isFinite)||!second.every(Number.isFinite))continue;
   for(const tet of TET){
    const ins=tet.filter(id=>first[id]<0),outs=tet.filter(id=>first[id]>=0);
    if(!ins.length||!outs.length)continue;
    if(ins.length===1||outs.length===1){
     const a=ins.length===1?ins[0]:outs[0],other=ins.length===1?outs:ins;
     cutTriangle(...other.map(v=>vtx(positions,a,v,first,second)));
    }else{
     const [a,b]=ins,[c,d]=outs;
     const q0=vtx(positions,a,c,first,second),q1=vtx(positions,a,d,first,second),
           q2=vtx(positions,b,d,first,second),q3=vtx(positions,b,c,first,second);
     cutTriangle(q0,q1,q2);cutTriangle(q0,q2,q3);
    }
   }
  }
  yield {segments:segments.splice(0,segments.length),done:k+1,total:N};
  below=above;
 }
}
export function setupSurface(s){
 if(s.shape==='explicit'){
  let exp=s.expr.trim().replace(/^z\s*=\s*/i,'');const fn=compile(exp);
  return [{name:'explicit',u0:s.bounds.xmin,u1:s.bounds.xmax,v0:s.bounds.ymin,v1:s.bounds.ymax,eval:(x,y)=>{const z=fn(x,y);return Number.isFinite(z)?[[x,y,z]]:[];}}];
 }
 if(s.shape==='implicit'){
  const formulas=compileImplicitSystem(s.implicit);
  if(formulas.length>=2)return []; // Curves or isolated points are drawn by the dedicated renderer.
  const fn=formulas[0],nz=70,zlo=s.bounds.zmin,zhi=s.bounds.zmax;
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
function crossMarker(p,size=0.08,color=0xe44e3d){
 const [x,y,z]=p;
 return [
  line([x-size,y,z],[x+size,y,z],color),
  line([x,y-size,z],[x,y+size,z],color),
  line([x,y,z-size],[x,y,z+size],color)
 ];
}
const nice=n=>Number.isFinite(n)?String(Number(n.toFixed(4))):'?';
const vecText=v=>`(${v.map(nice).join(', ')})`;
export function sourceFormulaText(s){
 const shape=s.shape;
 if(shape==='explicit')return `S: z = ${String(s.expr||'').trim().replace(/^z\s*=\s*/i,'')}`;
 if(shape==='implicit'){try{return `S: ${implicitEquationTexts(s.implicit).join('; ')}`;}catch(_){return `S: ${String(s.implicit||'').trim()}`;}}
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
// Express the transformed surface in the DISPLAYED coordinates (X,Y,Z).
// For invertible A, the original coordinates are u = A^{-1}((X,Y,Z)-t).
// This gives a true transformed equation for each source formula, including caps.
export function resultFormulaText(s,A){
 const t=s.t||[0,0,0],d=
 A[0][0]*(A[1][1]*A[2][2]-A[1][2]*A[2][1])
 -A[0][1]*(A[1][0]*A[2][2]-A[1][2]*A[2][0])
 +A[0][2]*(A[1][0]*A[2][1]-A[1][1]*A[2][0]);
 const coords=['X','Y','Z'];
 const terms=row=>{
  const parts=[];
  for(let j=0;j<3;j++){
   const v=row[j];if(Math.abs(v)<1e-10)continue;
   const coef=Math.abs(v),variable=coords[j];
   const item=(Math.abs(coef-1)<1e-9?'':nice(coef)+'·')+variable;
   parts.push((v<0?'-':parts.length?'+':'')+item);
  }
  const offset=-row.reduce((sum,v,i)=>sum+v*t[i],0);
  if(Math.abs(offset)>1e-9)parts.push((offset<0?'-':parts.length?'+':'')+nice(Math.abs(offset)));
  return parts.join(' ')||'0';
 };
 const source=sourceFormulaText(s).replace(/^S:\s*/,'');
 if(!Number.isFinite(d)||Math.abs(d)<1e-9){
  const rows=A.map((row,i)=>terms(row.map(Number))+
    (Math.abs(t[i])>1e-10?` ${t[i]<0?'-':'+'} ${nice(Math.abs(t[i]))}`:''));
  // Exact parametric image, valid even when A is singular.
  return `S′: X=${nice(A[0][0])}·x + ${nice(A[0][1])}·y + ${nice(A[0][2])}·z ${t[0]<0?'-':'+'} ${nice(Math.abs(t[0]))}; `+
    `Y=${nice(A[1][0])}·x + ${nice(A[1][1])}·y + ${nice(A[1][2])}·z ${t[1]<0?'-':'+'} ${nice(Math.abs(t[1]))}; `+
    `Z=${nice(A[2][0])}·x + ${nice(A[2][1])}·y + ${nice(A[2][2])}·z ${t[2]<0?'-':'+'} ${nice(Math.abs(t[2]))}; ${source} (вырожденная A)`;
 }
 const B=[
  [(A[1][1]*A[2][2]-A[1][2]*A[2][1])/d,(A[0][2]*A[2][1]-A[0][1]*A[2][2])/d,(A[0][1]*A[1][2]-A[0][2]*A[1][1])/d],
  [(A[1][2]*A[2][0]-A[1][0]*A[2][2])/d,(A[0][0]*A[2][2]-A[0][2]*A[2][0])/d,(A[0][2]*A[1][0]-A[0][0]*A[1][2])/d],
  [(A[1][0]*A[2][1]-A[1][1]*A[2][0])/d,(A[0][1]*A[2][0]-A[0][0]*A[2][1])/d,(A[0][0]*A[1][1]-A[0][1]*A[1][0])/d]
 ];
 const sourceInU=source.replace(/\b([xyz])\b/g,(_,axis)=>({x:'u₁',y:'u₂',z:'u₃'})[axis]);
 // Always display calculated numeric inverse substitutions: changing any matrix
 // entry or shift changes the actual equation shown, not merely the geometry.
 return `S′: ${sourceInU};  u₁=${terms(B[0])}; u₂=${terms(B[1])}; u₃=${terms(B[2])}`;
}
export function shiftVectorText(t){return `t = ${vecText(t||[0,0,0])}`;}
export function cubeGeometry(A,t){const E=[[0,0,0],[1,0,0],[0,1,0],[0,0,1],[1,1,0],[1,0,1],[0,1,1],[1,1,1]].map(p=>mul(A,p));
 const edges=[[0,1],[0,2],[0,3],[1,4],[1,5],[2,4],[2,6],[3,5],[3,6],[4,7],[5,7],[6,7]];
 const faces=[[0,1,4,2],[0,1,5,3],[0,2,6,3],[7,4,1,5],[7,4,2,6],[7,5,3,6]];
 const originMark=[]; // The fixed origin is a small black point, not a draggable cross.
 return {lines:[...edges.map(([a,b])=>line(E[a],E[b],0x538bb6)),line([0,0,0],t,0x151515),...originMark],
 faces:faces.map(ids=>({vertices:ids.map(i=>E[i]),color:0x9adac0})),
 points:[{id:'origin',xyz:[0,0,0],color:0x111111},{id:'shift',xyz:t,color:0x111111}],
 handles:[...Array.from({length:3},(_,c)=>({id:'a'+c,position:[A[0][c],A[1][c],A[2][c]],color:[0xf02a28,0xc6a77d,0x80c92f][c],binding:{type:'matrixColumn',matrixId:'A',column:c}})),{id:'t',position:t,color:0x000000,binding:{type:'shift'}}]};
}
export const mathModel={
 calculate({inputs,getNumericMatrix}){
  const A=getNumericMatrix('A',{x:0,y:0,z:0,t:0}),s=inputs,p=surfaceMarker(s),q=p?affine(A,s.t,p):null;
  const base=p?display(p,s):null,end=q?display(q,s):null;
  const marked=(point)=>point&&visible(point)?{lines:[line([0,0,0],point,0x212b37),...crossMarker(point,0.11,0xe44e3d)],points:[{id:'selected',xyz:point,color:0xe44e3d}]}:{};
  return {pictures:{
   input:{geometry:marked(base),label:'S'},
   transform:{geometry:cubeGeometry(A,s.t),matrix:A,label:'A',metrics:[{key:'rank',value:String(rank(A))}]},
   output:{geometry:marked(end),label:'AS+t'}
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
 ru:{appTitle:'AVO · Аффинные преобразования поверхностей · 01i',lead:'Поверхность S → матрица A и смещение t → образ AS+t. Управление построением находится над картинками.',inputTitle:'Исходная поверхность S',transformTitle:'Матрица A и вектор t',outputTitle:'Результат AS+t',inputDescr:'Выберите поверхность и шаг сетки. Выбранная точка поверхности показана красным маркером.',transformDescr:'Редактируйте столбцы A числами или маркерами; перемещайте кружок с крестиком ⊗ на конце вектора t. Его начало остаётся в (0,0,0).',outputDescr:'Построение идёт вслед за исходной поверхностью. Все подходящие Z отображаются сразу.',helpTitle:'Аффинные преобразования поверхностей',helpMath:'Одно неявное уравнение строит поверхность; два уравнения через ; или новую строку строят линию пересечения; три уравнения могут задавать отдельные точки. Например: x^2+y^2=1; z=0. Каждая точка p поверхности преобразуется в Ap+t. Для z=f(x,y) и F(x,y,z)=0: при фиксированном Y X растёт слева направо, затем Y увеличивается. Для неявного уравнения показываются все найденные корни Z в заданном диапазоне. Шаги DX и DY влияют на детализацию. Задержка 0 означает максимальную скорость. Логарифмический масштаб применяется только к показу, не к исходной математике. Обычный логарифм скрывает неположительные координаты; симметричный логарифм позволяет показывать и ноль, и отрицательные значения.'},
 en:{appTitle:'AVO · Affine Surface Transformations · 01i',lead:'Surface S → matrix A and shift t → image AS+t. Construction controls are above the panels.',inputTitle:'Original surface S',transformTitle:'Matrix A and shift t',outputTitle:'Result AS+t',inputDescr:'Choose a surface and mesh spacing. The selected surface point is shown in red.',transformDescr:'Edit columns of A with numbers or markers; drag the circled cross ⊗ at the tip of t. The tail stays at (0,0,0).',outputDescr:'The output is built alongside the input. Every matching Z is drawn immediately.',helpTitle:'Affine surface transformations',helpMath:'One equation draws a surface; two equations draw an intersection curve; three equations can define isolated points. Separate equations with ; or a new line. For example: x^2+y^2=1; z=0. Each point p is transformed to Ap+t. For z=f(x,y) and F(x,y,z)=0, scan X at fixed Y, then advance Y. For implicit equations, find all Z roots in the chosen range. DX and DY determine mesh density. Delay 0 means full speed. Nonlinear axis scales change only the display, never the affine calculation. Standard log hides nonpositive coordinates; signed log includes zero and negatives.'},
 he:{appTitle:'AVO · טרנספורמציות אפיניות של משטחים · 01i',lead:'משטח S ← מטריצה A והזזה t ← התמונה AS+t. כלי הבנייה מעל האיורים.',inputTitle:'המשטח המקורי S',transformTitle:'מטריצה A ווקטור הזזה t',outputTitle:'התוצאה AS+t',inputDescr:'בחרו משטח ומרווח רשת. הנקודה הנבחרת על המשטח מסומנת באדום.',transformDescr:'ערכו את עמודות A במספרים או בסמנים; גררו את סימן ⊗ שבקצה הווקטור t. תחילת הווקטור נשארת ב־(0,0,0).',outputDescr:'התוצאה נבנית לצד המקור. כל ערכי Z האפשריים מוצגים מיד.',helpTitle:'טרנספורמציות אפיניות של משטחים',helpMath:'משוואה אחת מגדירה משטח, שתי משוואות מגדירות עקומת חיתוך, ושלוש משוואות יכולות להגדיר נקודה בודדת. כל נקודה p עוברת אל Ap+t. עבור z=f(x,y) או F(x,y,z)=0 סורקים X עבור Y קבוע, ומתקדמים ל-Y הבא. עבור משוואה סתומה מוצאים את כל שורשי Z בטווח. המרווחים DX,DY קובעים את צפיפות הרשת. השהיה 0 פירושה מהירות מרבית. קנה מידה לוגריתמי משנה רק את התצוגה ולא את החישוב.'}
};
