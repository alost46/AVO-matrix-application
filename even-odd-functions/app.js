'use strict';
// AVO Even/Odd 01a: independent 2D app. No modification of AVO Core.
const $=id=>document.getElementById(id);
const ALLOWED_FUNCS={sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,exp:Math.exp,ln:Math.log,log:Math.log10,sqrt:Math.sqrt,abs:Math.abs,floor:Math.floor,ceil:Math.ceil,round:Math.round,sign:Math.sign};
function tokenize(s){s=s.replace(/π/g,'pi').replace(/−/g,'-').replace(/²/g,'^2').replace(/³/g,'^3').replace(/\s+/g,'');const result=[];let i=0;while(i<s.length){let rem=s.slice(i);let m=rem.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);if(m){result.push({type:'num',value:Number(m[0])});i+=m[0].length;continue;}m=rem.match(/^[a-zA-Z_][a-zA-Z_0-9]*/);if(m){result.push({type:'name',value:m[0].toLowerCase()});i+=m[0].length;continue;}let c=s[i];if('+-*/^(),'.includes(c)){result.push({type:c,value:c});i++;continue;}throw Error('Недопустимый символ «'+c+'»');}
// Support implicit multiplication: 2x, 2(x+1), (x+1)(x-1), but not sin(x).
const out=[];for(const t of result){let p=out[out.length-1];if(p&&((p.type==='num'||p.type==='name'||p.type===')')&&(t.type==='num'||t.type==='name'||t.type==='('))&&!(p.type==='name'&&t.type==='('&&p.value in ALLOWED_FUNCS))out.push({type:'*',value:'*'});out.push(t);}return out;}
function compile(src){const tokens=tokenize(src);let at=0;const peek=()=>tokens[at];const take=()=>tokens[at++];function expression(min=0){let t=take();if(!t)throw Error('Неполное выражение');let a;
if(t.type==='num')a=()=>t.value;
else if(t.type==='name'){
 if(peek()?.type==='('&&t.value in ALLOWED_FUNCS){take();const arg=expression(0);if(take()?.type!==')')throw Error('Нет закрывающей скобки');const fn=ALLOWED_FUNCS[t.value];a=(x,y)=>fn(arg(x,y));}
 else if(t.value==='x')a=(x)=>x;
 else if(t.value==='y')a=(_,y)=>y;
 else if(t.value==='pi')a=()=>Math.PI;
 else if(t.value==='e')a=()=>Math.E;
 else throw Error('Неизвестная переменная или функция: '+t.value);
}else if(t.type==='('){a=expression(0);if(take()?.type!==')')throw Error('Нет закрывающей скобки');}
else if(t.type==='+'||t.type==='-'){const r=expression(3);a=t.type==='-'?(x,y)=>-r(x,y):r;}
else throw Error('Неожиданный знак '+t.value);
const prec={'+':1,'-':1,'*':2,'/':2,'^':4};while(peek()&&prec[peek().type]>=min){let op=take().type;let b=expression(prec[op]+(op==='^'?0:1));let left=a;switch(op){case '+':a=(x,y)=>left(x,y)+b(x,y);break;case '-':a=(x,y)=>left(x,y)-b(x,y);break;case '*':a=(x,y)=>left(x,y)*b(x,y);break;case '/':a=(x,y)=>left(x,y)/b(x,y);break;case '^':a=(x,y)=>Math.pow(left(x,y),b(x,y));break;}}return a;}
const result=expression();if(at<tokens.length)throw Error('Неожиданный текст в формуле');return result;}
function parseEquation(s){const pieces=s.trim().split('=');if(pieces.length>2)throw Error('В уравнении может быть только один знак =');if(pieces.length===1){let explicit=compile(pieces[0]);return {implicit:false,func:x=>explicit(x,0)};}
const left=pieces[0].trim(),right=pieces[1].trim();if(!left||!right)throw Error('Неполное уравнение');if(left==='y'&&!/\by\b/.test(right)) {const fn=compile(right);return {implicit:false,func:x=>fn(x,0)};}
if(right==='y'&&!/\by\b/.test(left)){const fn=compile(left);return {implicit:false,func:x=>fn(x,0)};}
const l=compile(left),r=compile(right);return {implicit:true,func:(x,y)=>l(x,y)-r(x,y)};}
function finite(v){return typeof v==='number'&&Number.isFinite(v)?v:NaN;}
function bisect(f,x,a,b,fa,fb){for(let n=0;n<38;n++){let m=(a+b)/2,vm=f(x,m);if(!Number.isFinite(vm))return NaN;if(Math.abs(vm)<1e-11)return m;if((vm>0)===(fa>0)){a=m;fa=vm;}else{b=m;fb=vm;}}return (a+b)/2;}
function rootsAt(f,x,ymin,ymax,stepCount=440){const roots=[];const h=(ymax-ymin)/stepCount;let prevY=ymin,prev=f(x,prevY);for(let i=1;i<=stepCount;i++){const y=ymin+i*h,v=f(x,y);if(Number.isFinite(prev)&&Number.isFinite(v)){if(prev===0)roots.push(prevY);if(v===0||prev*v<0){const root=v===0?y:bisect(f,x,prevY,y,prev,v);if(Number.isFinite(root))roots.push(root);}
// A tangent root may not change sign. Probe midpoint near local minimum.
if(i>1&&Math.abs(v)<0.000002&&Math.abs(v)<Math.abs(prev))roots.push(y);
}prevY=y;prev=v;}
roots.sort((a,b)=>a-b);return roots.filter((v,i)=>i===0||Math.abs(v-roots[i-1])>h*.4).slice(0,12);}
const N=641;let current=null;
function selectedRoot(roots,key){if(!roots.length)return NaN;if(key==='upper')return roots[roots.length-1];if(key==='lower')return roots[0];const i=Number(key);return roots[i]??NaN;}
function derive(){const eq=parseEquation($('formula').value);let a=Number($('xmin').value),b=Number($('xmax').value);if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a)throw Error('Укажите диапазон x: левый предел меньше правого');if(b-a>1e6)throw Error('Слишком широкий диапазон x');const implicit=eq.implicit;$('implicitOpts').classList.toggle('hide',!implicit);let ya=Number($('ymin').value),yb=Number($('ymax').value);if(implicit&&(!Number.isFinite(ya)||!Number.isFinite(yb)||yb<=ya))throw Error('Неверный диапазон поиска y');const branch=$('branch').value;
let xs=[],ys=[],all=[],evens=[],odds=[],found=0;const raw=new Map();function valueAt(x){let key=x.toPrecision(14);if(raw.has(key))return raw.get(key);let roots=implicit?rootsAt(eq.func,x,ya,yb):[];let v=implicit?selectedRoot(roots,branch):finite(eq.func(x));let z={roots,v:finite(v)};raw.set(key,z);return z;}
for(let i=0;i<N;i++){let x=a+(b-a)*i/(N-1);const v=valueAt(x);xs.push(x);ys.push(v.v);all.push(v.roots);if(Number.isFinite(v.v))found++;const neg=valueAt(-x).v;
const e=Number.isFinite(v.v)&&Number.isFinite(neg)?finite((v.v+neg)/2):NaN;const o=Number.isFinite(v.v)&&Number.isFinite(neg)?finite((v.v-neg)/2):NaN;
// Decomposition only shown on symmetric part of the requested range.
const mirrored=-x>=a-1e-10&&-x<=b+1e-10;evens.push(mirrored?e:NaN);odds.push(mirrored?o:NaN);
}
return {implicit,xs,ys,all,evens,odds,a,b,found,branch};}
function bounds(arrays){let vals=arrays.flatMap(a=>a).filter(Number.isFinite).sort((a,b)=>a-b);if(!vals.length)return [-1,1];let lo=vals[Math.floor(vals.length*.01)],hi=vals[Math.floor(vals.length*.99)];if(!(hi>lo)){const d=Math.max(1,Math.abs(lo)*.2);return [lo-d,hi+d];}let pad=(hi-lo)*.12;return [lo-pad,hi+pad];}
function graph(canvas,data,kind){const w=canvas.clientWidth||450,h=canvas.clientHeight||390,dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);const pad={l:52,r:15,t:17,b:36};let x0=data.a,x1=data.b;
const values=kind===0?[data.ys,...(data.implicit?Array.from({length:Math.max(0,...data.all.map(a=>a.length))},(_,j)=>data.all.map(r=>r[j]??NaN)):[])]:kind===1?[data.evens]:[data.odds];let [y0,y1]=bounds(values);const px=x=>pad.l+(x-x0)/(x1-x0)*(w-pad.l-pad.r),py=y=>h-pad.b-(y-y0)/(y1-y0)*(h-pad.t-pad.b);ctx.font='12px Arial';ctx.fillStyle='#607189';ctx.strokeStyle='#e5ebf2';ctx.lineWidth=1;
function label(v){if(Math.abs(v)<1e-8)return '0';return Number(v.toPrecision(3)).toString();}
for(let i=0;i<=4;i++){const x=x0+(x1-x0)*i/4,p=px(x);ctx.beginPath();ctx.moveTo(p,pad.t);ctx.lineTo(p,h-pad.b);ctx.stroke();ctx.textAlign='center';ctx.fillText(label(x),p,h-15);}for(let i=0;i<=4;i++){const y=y0+(y1-y0)*i/4,p=py(y);ctx.beginPath();ctx.moveTo(pad.l,p);ctx.lineTo(w-pad.r,p);ctx.stroke();ctx.textAlign='right';ctx.fillText(label(y),pad.l-7,p+4);}
ctx.strokeStyle='#8498b3';ctx.lineWidth=1.3;if(x0<=0&&x1>=0){ctx.beginPath();ctx.moveTo(px(0),pad.t);ctx.lineTo(px(0),h-pad.b);ctx.stroke();}if(y0<=0&&y1>=0){ctx.beginPath();ctx.moveTo(pad.l,py(0));ctx.lineTo(w-pad.r,py(0));ctx.stroke();}
ctx.save();ctx.beginPath();ctx.rect(pad.l,pad.t,w-pad.l-pad.r,h-pad.t-pad.b);ctx.clip();function draw(ys,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();let started=false,prev=null;for(let i=0;i<data.xs.length;i++){const y=ys[i];if(!Number.isFinite(y)||y<y0-(y1-y0)*3||y>y1+(y1-y0)*3){started=false;prev=null;continue;}const x=px(data.xs[i]),yp=py(y);if(started&&prev!==null&&Math.abs(y-prev)>(y1-y0)*.4){started=false;}if(!started){ctx.moveTo(x,yp);started=true;}else ctx.lineTo(x,yp);prev=y;}ctx.stroke();}
if(kind===0&&data.implicit){const max=Math.max(0,...data.all.map(a=>a.length));for(let j=0;j<Math.min(max,12);j++)draw(data.all.map(r=>r[j]??NaN),'#bdc5d0',1.3);}draw(kind===0?data.ys:kind===1?data.evens:data.odds,kind===0?'#225bb5':kind===1?'#bd6a0a':'#13805d',2.8);ctx.restore();}
function plot(){try{const data=derive();current=data;const eCount=data.evens.filter(Number.isFinite).length;const status=$('status');status.classList.remove('error');if(!data.found)status.textContent='В заданной области не найдено точек графика. Для неявного уравнения попробуйте увеличить диапазон поиска y или выбрать другую ветвь.';
else if(!eCount)status.textContent='Исходная ветвь найдена, но f(x) и f(−x) не определены одновременно в заданном интервале. Разложение здесь не отображается.';
else status.textContent=(data.implicit?'Неявное уравнение: показана выбранная ветвь и другие найденные ветви. ':'Явная функция. ')+`Точек исходного графика: ${data.found} из ${N}. Точек разложения: ${eCount}.`;
$('labelOriginal').textContent=$('formula').value;const symmetry=Math.min(data.b,-data.a)-Math.max(data.a,-data.b);$('note').textContent=(data.implicit?'Для неявного уравнения чётная и нечётная части определяются для выбранной ветви y(x), а не для всего множества решений. ':'')+(symmetry<=0?'Заданный интервал не содержит ненулевого симметричного отрезка. ':'Разложение вычисляется там, где одновременно определены f(x) и f(−x). ')+ 'Для неявного случая численное нахождение корней может пропускать касания и сложные ветвления.';
requestAnimationFrame(()=>{for(let k=0;k<3;k++)graph($('graph'+k),data,k);});}catch(err){$('status').classList.add('error');$('status').textContent='Ошибка: '+err.message;}}
function example(which){const set={poly:['y = x^3 - 2*x^2 + x',-4,4,-8,8],sin:['y = sin(x) + x^2/4',-7,7,-8,8],circle:['x^2 + y^2 = 9',-3.5,3.5,-4,4],cubic:['y^3 - 3*y + x = 0',-3,3,-4,4],parabola:['x = y^2 - 1',-2,6,-4,4]};const v=set[which]||set.poly;$('formula').value=v[0];$('xmin').value=v[1];$('xmax').value=v[2];$('ymin').value=v[3];$('ymax').value=v[4];$('branch').value='upper';plot();}
$('plot').addEventListener('click',plot);$('reset').addEventListener('click',()=>{$('examples').value='poly';example('poly');});$('examples').addEventListener('change',e=>{if(e.target.value)example(e.target.value);});$('branch').addEventListener('change',plot);$('ymin').addEventListener('change',plot);$('ymax').addEventListener('change',plot);window.addEventListener('resize',()=>{if(current)requestAnimationFrame(()=>{for(let k=0;k<3;k++)graph($('graph'+k),current,k);});});
window.AVO_EVEN_ODD_TEST={compile,parseEquation,rootsAt,derive};example('poly');
