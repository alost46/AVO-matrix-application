'use strict';
// AVO Even/Odd 01j: independent 2D app. No modification of AVO Core.
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
// Scan for simple roots and tangencies. A double root does not change sign,
// so sign-change bisection alone cannot detect it.
function rootsAt(f,x,ymin,ymax,stepCount=440){
 const roots=[],h=(ymax-ymin)/stepCount;
 const vals=Array.from({length:stepCount+1},(_,i)=>finite(f(x,ymin+i*h)));
 function add(y){if(Number.isFinite(y)&&y>=ymin-1e-9&&y<=ymax+1e-9)roots.push(y);}
 for(let i=0;i<=stepCount;i++){
  const y=ymin+i*h,v=vals[i];
  if(Number.isFinite(v)&&Math.abs(v)<1e-10)add(y);
  if(i===0)continue;
  const prev=vals[i-1];
  if(Number.isFinite(prev)&&Number.isFinite(v)&&prev*v<0){
   const root=bisect(f,x,y-h,y,prev,v);add(root);
  }
 }
 // A local minimum of |F| can represent a tangent / multiple root.
 // Refine it and accept only a tiny equation residual, preventing near misses.
 for(let i=1;i<stepCount;i++){
  const a=vals[i-1],b=vals[i],c=vals[i+1];
  if(![a,b,c].every(Number.isFinite)||!(Math.abs(b)<=Math.abs(a)&&Math.abs(b)<=Math.abs(c)))continue;
  let lo=ymin+(i-1)*h,hi=ymin+(i+1)*h;
  const phi=(Math.sqrt(5)-1)/2;
  for(let j=0;j<36;j++){
   const u=hi-(hi-lo)*phi,v=lo+(hi-lo)*phi;
   const fu=Math.abs(f(x,u)),fv=Math.abs(f(x,v));
   if(!Number.isFinite(fu)||!Number.isFinite(fv))break;
   if(fu<fv)hi=v;else lo=u;
  }
  const y=(lo+hi)/2,res=Math.abs(f(x,y));
  const localScale=Math.max(1,Math.abs(a),Math.abs(c));
  if(Number.isFinite(res)&&res<1e-9*localScale)add(y);
 }
 roots.sort((a,b)=>a-b);
 const unique=[];for(const y of roots){if(!unique.length||Math.abs(y-unique[unique.length-1])>h*.25)unique.push(y);}
 return unique.slice(0,12);
}
const N=641;let current=null;
function selectedRoot(roots,key){if(!roots.length)return NaN;if(key==='upper')return roots[roots.length-1];if(key==='lower')return roots[0];const i=Number(key);return roots[i]??NaN;}
function derive(){const eq=parseEquation($('formula').value);let a=Number($('xmin').value),b=Number($('xmax').value);if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a)throw Error('Укажите диапазон x: левый предел меньше правого');if(!Number.isFinite(b-a))throw Error('Диапазон x слишком велик для численных вычислений');const implicit=eq.implicit;$('implicitOpts').classList.toggle('hide',!implicit);let ya=Number($('ymin').value),yb=Number($('ymax').value);if(implicit&&(!Number.isFinite(ya)||!Number.isFinite(yb)||yb<=ya))throw Error('Неверный диапазон поиска y');const branch=$('branch').value;
let xs=[],ys=[],all=[],evens=[],odds=[],found=0;const raw=new Map();function valueAt(x){let key=x.toPrecision(14);if(raw.has(key))return raw.get(key);let roots=implicit?rootsAt(eq.func,x,ya,yb):[];let v=implicit?selectedRoot(roots,branch):finite(eq.func(x));let z={roots,v:finite(v)};raw.set(key,z);return z;}
// Include uniformly spaced samples and logarithmically distributed samples
// to retain details near zero when x spans many orders of magnitude.
let samples=Array.from({length:N},(_,i)=>a+(b-a)*i/(N-1));
if(!implicit){const ta=axisTransform(a,'symlog'),tb=axisTransform(b,'symlog');
 for(let i=0;i<Math.floor(N/2);i++){const u=ta+(tb-ta)*i/(Math.floor(N/2)-1);const x=axisInverse(u,'symlog');if(Number.isFinite(x)&&x>=a&&x<=b)samples.push(x);}}
samples=[...new Set(samples)].sort((p,q)=>p-q);
for(const x of samples){const v=valueAt(x);xs.push(x);ys.push(v.v);all.push(v.roots);if(Number.isFinite(v.v))found++;const neg=valueAt(-x).v;
const e=Number.isFinite(v.v)&&Number.isFinite(neg)?finite((v.v+neg)/2):NaN;const o=Number.isFinite(v.v)&&Number.isFinite(neg)?finite((v.v-neg)/2):NaN;
// Decomposition only shown on symmetric part of the requested range.
const mirrored=-x>=a-1e-10&&-x<=b+1e-10;evens.push(mirrored?e:NaN);odds.push(mirrored?o:NaN);
}
return {implicit,xs,ys,all,evens,odds,a,b,found,branch};}
function bounds(arrays){let vals=arrays.flatMap(a=>a).filter(Number.isFinite).sort((a,b)=>a-b);if(!vals.length)return [-1,1];let lo=vals[Math.floor(vals.length*.01)],hi=vals[Math.floor(vals.length*.99)];if(!(hi>lo)){const d=Math.max(1,Math.abs(lo)*.2);return [lo-d,hi+d];}let pad=(hi-lo)*.12;return [lo-pad,hi+pad];}
// Stable data coordinates are mapped to axis coordinates, then to the canvas.
// Symmetric logarithm has a linear neighbourhood of zero and retains both signs.
const axisTransform=(v,mode)=>mode==='symlog'?Math.sign(v)*Math.log10(1+Math.abs(v)):v;
const axisInverse=(u,mode)=>mode==='symlog'?Math.sign(u)*(Math.pow(10,Math.min(Math.abs(u),300))-1):u;
const chartViews=Array.from({length:3},()=>({xMode:'linear',yMode:'linear',zoom:1,dx:0,dy:0,zoomEnabled:false,navAxis:null}));
const redraw=()=>{if(current)for(let k=0;k<3;k++)graph($('graph'+k),current,k);};
function graph(canvas,data,kind){
 const view=chartViews[kind],w=canvas.clientWidth||450,h=canvas.clientHeight||390,dpr=Math.min(window.devicePixelRatio||1,2);
 if(w<10||h<10)return;
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
 const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
 const pad={l:Math.min(66,Math.max(48,w*.16)),r:22,t:24,b:47};
 const values=kind===0?[data.ys,...(data.implicit?Array.from({length:Math.max(0,...data.all.map(a=>a.length))},(_,j)=>data.all.map(r=>r[j]??NaN)):[])]:kind===1?[data.evens]:[data.odds];
 const [baseY0,baseY1]=bounds(values);
 const baseX0=axisTransform(data.a,view.xMode),baseX1=axisTransform(data.b,view.xMode);
 let baseTransformedY=values.flatMap(v=>v).filter(Number.isFinite).map(v=>axisTransform(v,view.yMode)).sort((a,b)=>a-b);
 let ty0=baseTransformedY.length?baseTransformedY[Math.floor(baseTransformedY.length*.01)]:axisTransform(baseY0,view.yMode);
 let ty1=baseTransformedY.length?baseTransformedY[Math.floor(baseTransformedY.length*.99)]:axisTransform(baseY1,view.yMode);
 if(!(ty1>ty0)){let delta=Math.max(.1,Math.abs(ty0)*.2);ty0-=delta;ty1+=delta;}else{let d=(ty1-ty0)*.12;ty0-=d;ty1+=d;}
 const spanX=(baseX1-baseX0)/view.zoom,spanY=(ty1-ty0)/view.zoom;
 view.lastBaseX=(baseX0+baseX1)/2;view.lastBaseY=(ty0+ty1)/2;
 const midX=view.lastBaseX+view.dx,midY=view.lastBaseY+view.dy;
 const x0=midX-spanX/2,x1=midX+spanX/2,y0=midY-spanY/2,y1=midY+spanY/2;
 const pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;
 const px=x=>pad.l+(axisTransform(x,view.xMode)-x0)/(x1-x0)*pw;
 const py=y=>h-pad.b-(axisTransform(y,view.yMode)-y0)/(y1-y0)*ph;
 // Store geometry for mouse/touch panning.
 view.lastSpanX=spanX;view.lastSpanY=spanY;view.lastW=pw;view.lastH=ph;
 syncCenterInputs(kind);
 ctx.font='600 12px Arial';ctx.fillStyle='#56677e';ctx.strokeStyle='#e5ebf2';ctx.lineWidth=1;
 function label(v){if(Math.abs(v)<1e-12)return '0';const abs=Math.abs(v);return abs>=1e5||(abs<.001&&abs>0)?v.toExponential(1):Number(v.toPrecision(3)).toString();}
 for(let i=0;i<=5;i++){const u=x0+(x1-x0)*i/5,p=pad.l+pw*i/5;ctx.beginPath();ctx.moveTo(p,pad.t);ctx.lineTo(p,h-pad.b);ctx.stroke();ctx.textAlign='center';ctx.fillText(label(axisInverse(u,view.xMode)),p,h-23);}
 for(let i=0;i<=5;i++){const u=y0+(y1-y0)*i/5,p=h-pad.b-ph*i/5;ctx.beginPath();ctx.moveTo(pad.l,p);ctx.lineTo(w-pad.r,p);ctx.stroke();ctx.textAlign='right';ctx.fillText(label(axisInverse(u,view.yMode)),pad.l-7,p+4);}
 // Coordinate axes: dark, with arrowheads and X/Y beside the actual axes.
 const zeroX=axisTransform(0,view.xMode),zeroY=axisTransform(0,view.yMode);
 const visibleYaxis=x0<=zeroX&&x1>=zeroX;
 const visibleXaxis=y0<=zeroY&&y1>=zeroY;
 const axisXP=visibleYaxis?px(0):pad.l;
 const axisYP=visibleXaxis?py(0):h-pad.b;
 ctx.strokeStyle='#526b8b';ctx.fillStyle='#203650';ctx.lineWidth=1.8;
 function arrow(x1,y1,x2,y2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
 if(visibleYaxis){arrow(axisXP,h-pad.b,axisXP,pad.t+5);arrow(axisXP-5,pad.t+12,axisXP,pad.t+5);arrow(axisXP+5,pad.t+12,axisXP,pad.t+5);}
 if(visibleXaxis){arrow(pad.l,axisYP,w-pad.r-5,axisYP);arrow(w-pad.r-12,axisYP-5,w-pad.r-5,axisYP);arrow(w-pad.r-12,axisYP+5,w-pad.r-5,axisYP);}
 // Axes names remain visible even when the origin is outside the window.
 // The X label sits next to the positive arrow; Y at the top of its axis.
 ctx.font='700 17px Arial';ctx.fillStyle='#17283d';
 ctx.textAlign='right';ctx.fillText('X',w-pad.r-5,Math.min(h-5,Math.max(pad.t+20,axisYP-11)));
 ctx.textAlign='left';ctx.fillText('Y',Math.min(w-pad.r-15,axisXP+9),pad.t+14);
 ctx.save();ctx.beginPath();ctx.rect(pad.l,pad.t,pw,ph);ctx.clip();
 function draw(ys,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();let started=false,prev=null;
 for(let i=0;i<data.xs.length;i++){let x=data.xs[i],y=ys[i];if(!Number.isFinite(y)||!Number.isFinite(x)){started=false;prev=null;continue;}
 const xp=px(x),yp=py(y);if(!Number.isFinite(xp)||!Number.isFinite(yp)||Math.abs(yp)>1e6){started=false;prev=null;continue;}
 if(prev!==null&&Math.abs(yp-prev)>ph*.19)started=false;
 if(!started){ctx.moveTo(xp,yp);started=true;}else ctx.lineTo(xp,yp);prev=yp;
 }ctx.stroke();}
 if(kind===0&&data.implicit){const max=Math.max(0,...data.all.map(a=>a.length));for(let j=0;j<Math.min(max,12);j++)draw(data.all.map(r=>r[j]??NaN),'#bdc5d0',1.3);}
 draw(kind===0?data.ys:kind===1?data.evens:data.odds,kind===0?'#225bb5':kind===1?'#bd6a0a':'#7CFC00',2.8);ctx.restore();
}
// Numbers in the fields are the actual coordinate of the view centre.
function coordinateLabel(v){if(!Number.isFinite(v))return '';if(Math.abs(v)<0.005)return '0';return v.toFixed(2);}
function syncCenterInputs(k){
 const v=chartViews[k];
 for(const axis of ['x','y']){
  const el=document.querySelector('.pan-coordinate[data-chart="'+k+'"][data-axis="'+axis+'"]');
  if(!el||document.activeElement===el)continue;
  const base=axis==='x'?v.lastBaseX:v.lastBaseY;
  const offset=axis==='x'?v.dx:v.dy;
  const mode=axis==='x'?v.xMode:v.yMode;
  if(Number.isFinite(base))el.value=coordinateLabel(axisInverse(base+offset,mode));
 }
}
function chooseCenter(k,axis,raw){
 const v=chartViews[k],value=Number(raw);
 if(!String(raw).trim()||!Number.isFinite(value)) {syncCenterInputs(k);return;}
 const mode=axis==='x'?v.xMode:v.yMode;
 const base=axis==='x'?v.lastBaseX:v.lastBaseY;
 const transformed=axisTransform(value,mode);
 if(!Number.isFinite(base)||!Number.isFinite(transformed))return;
 if(axis==='x')v.dx=transformed-base;else v.dy=transformed-base;
 redraw();
}
function stepOrZoom(k,direction){
 const v=chartViews[k];
 if(v.navAxis){
  // One press moves one fifth of the CURRENT visible span on the chosen axis.
  const amount=(v.navAxis==='x'?v.lastSpanX:v.lastSpanY)*0.2*direction;
  if(!Number.isFinite(amount))return;
  if(v.navAxis==='x')v.dx+=amount;else v.dy+=amount;
  redraw();
 }else zoomChart(k,direction>0?1.5:1/1.5);
}
function zoomChart(k,factor){const v=chartViews[k];if(!v.zoomEnabled)return;v.zoom=Math.max(.1,Math.min(500,v.zoom*factor));redraw();}
function resetChart(k,resetAxes=false){
 const v=chartViews[k];v.zoom=1;v.dx=0;v.dy=0;v.navAxis=null;
 if(resetAxes){
  v.xMode='linear';v.yMode='linear';
  for(const cls of ['axis-x','axis-y']){
   const el=document.querySelector('.'+cls+'[data-chart="'+k+'"]');
   if(el)el.value='linear';
  }
 }
 setZoomEnabled(k,false);
 redraw();
}
function updateControlState(k){
 const v=chartViews[k];
 for(const b of document.querySelectorAll('.pan-axis[data-chart="'+k+'"]'))b.setAttribute('aria-pressed',String(b.dataset.axis===v.navAxis));
 const btn=document.querySelector('.zoom-reset[data-chart="'+k+'"]');
 if(btn){btn.setAttribute('aria-pressed',String(v.zoomEnabled));btn.title=v.zoomEnabled?'Выключить масштабирование':'Включить масштабирование';btn.setAttribute('aria-label',btn.title);}
 for(const b of document.querySelectorAll('.zoom-in[data-chart="'+k+'"],.zoom-out[data-chart="'+k+'"]')){
  b.disabled=!v.zoomEnabled&&!v.navAxis;
  b.title=v.navAxis?('Сдвинуть центр по '+v.navAxis.toUpperCase()+' ('+(b.classList.contains('zoom-in')?'+':'−')+')'):(b.classList.contains('zoom-in')?'Увеличить':'Уменьшить');
 }
 const cvs=$('graph'+k);cvs.classList.toggle('zoom-enabled',v.zoomEnabled);cvs.classList.toggle('zoom-disabled',!v.zoomEnabled);
}
function setZoomEnabled(k,enabled){
 const v=chartViews[k];v.zoomEnabled=enabled;if(enabled)v.navAxis=null;
 updateControlState(k);
 if(!enabled)$('graph'+k).dispatchEvent(new Event('avo-zoom-disabled'));
}
function selectPanAxis(k,axis){
 const v=chartViews[k];v.navAxis=v.navAxis===axis?null:axis;
 if(v.navAxis)v.zoomEnabled=false;
 updateControlState(k);
 if(v.navAxis)$('graph'+k).dispatchEvent(new Event('avo-zoom-disabled'));
}
function resetAllCharts(){for(let k=0;k<3;k++)resetChart(k,true);}
function installChartControls(){
 document.querySelectorAll('.zoom-in').forEach(b=>b.addEventListener('click',()=>stepOrZoom(Number(b.dataset.chart),+1)));
 document.querySelectorAll('.zoom-out').forEach(b=>b.addEventListener('click',()=>stepOrZoom(Number(b.dataset.chart),-1)));
 document.querySelectorAll('.pan-axis').forEach(b=>b.addEventListener('click',()=>selectPanAxis(Number(b.dataset.chart),b.dataset.axis)));
 document.querySelectorAll('.pan-coordinate').forEach(el=>{el.addEventListener('change',()=>chooseCenter(Number(el.dataset.chart),el.dataset.axis,el.value));el.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();el.blur();}});});
 document.querySelectorAll('.zoom-reset').forEach(b=>b.addEventListener('click',()=>{const k=Number(b.dataset.chart);setZoomEnabled(k,!chartViews[k].zoomEnabled);}));
 document.querySelectorAll('.axis-x,.axis-y').forEach(el=>el.addEventListener('change',()=>{const k=Number(el.dataset.chart),v=chartViews[k];if(el.classList.contains('axis-x'))v.xMode=el.value;else v.yMode=el.value;resetChart(k); }));
 document.querySelectorAll('.fullscreen-toggle').forEach(b=>b.addEventListener('click',async()=>{
 const card=b.closest('.chart');if(document.fullscreenElement===card){await document.exitFullscreen();return;}
 if(card.classList.contains('fullscreen-fallback')){card.classList.remove('fullscreen-fallback');redraw();return;}
 try{if(card.requestFullscreen){await card.requestFullscreen();}else throw Error('Fullscreen API not available');}
 catch{card.classList.add('fullscreen-fallback');}
 setTimeout(redraw,50);
 }));
 document.addEventListener('fullscreenchange',()=>setTimeout(redraw,40));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.fullscreen-fallback').forEach(e=>e.classList.remove('fullscreen-fallback'));redraw();}});
 for(let k=0;k<3;k++){
 const canvas=$('graph'+k),active=new Map();let lastOne=null,lastPinch=null;
 canvas.addEventListener('avo-zoom-disabled',()=>{active.clear();lastOne=null;lastPinch=null;});
 canvas.addEventListener('pointerdown',e=>{if(!chartViews[k].zoomEnabled)return;if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();canvas.setPointerCapture?.(e.pointerId);active.set(e.pointerId,{x:e.clientX,y:e.clientY});lastOne=active.size===1?{x:e.clientX,y:e.clientY}:null;lastPinch=null;});
 canvas.addEventListener('pointermove',e=>{if(!chartViews[k].zoomEnabled||!active.has(e.pointerId))return;e.preventDefault();active.set(e.pointerId,{x:e.clientX,y:e.clientY});const v=chartViews[k];
 if(active.size===1){if(lastOne&&v.lastW&&v.lastH){v.dx-=(e.clientX-lastOne.x)*v.lastSpanX/v.lastW;v.dy+=(e.clientY-lastOne.y)*v.lastSpanY/v.lastH;redraw();}lastOne={x:e.clientX,y:e.clientY};lastPinch=null;}
 else if(active.size===2){const a=[...active.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(lastPinch&&d>3)zoomChart(k,d/lastPinch);lastPinch=d;lastOne=null;}
 });
 const stop=e=>{active.delete(e.pointerId);lastOne=null;lastPinch=null;};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);canvas.addEventListener('lostpointercapture',stop);
 canvas.addEventListener('wheel',e=>{if(!chartViews[k].zoomEnabled)return;e.preventDefault();zoomChart(k,e.deltaY<0?1.18:1/1.18);},{passive:false});
 }
}

// Display symbolic components whenever the input is a single-valued explicit formula.
// Polynomial expressions are simplified exactly; general elementary expressions use
// transparent substitution x -> (-x), with no unsupported symbolic claims.
function polynomialCoefficients(src){
 const toks=tokenize(src);let pos=0;const peek=()=>toks[pos];const next=()=>toks[pos++];
 const add=(a,b,sign=1)=>{const c=new Map(a);for(const [k,v] of b)c.set(k,(c.get(k)||0)+sign*v);return c;};
 const mult=(a,b)=>{const c=new Map();for(const [k,v] of a)for(const [l,w] of b){if(k+l>24)throw Error('high degree');c.set(k+l,(c.get(k+l)||0)+v*w);}return c;};
 const constant=v=>new Map([[0,v]]);
 function parse(min=0){const t=next();if(!t)throw Error('incomplete');let a;
 if(t.type==='num')a=constant(t.value);
 else if(t.type==='name'){if(t.value==='x')a=new Map([[1,1]]);else if(t.value==='pi')a=constant(Math.PI);else if(t.value==='e')a=constant(Math.E);else throw Error('not polynomial');}
 else if(t.type==='('){a=parse(0);if(next()?.type!==')')throw Error('parentheses');}
 else if(t.type==='+'||t.type==='-'){a=parse(3);if(t.type==='-')a=mult(a,constant(-1));}
 else throw Error('not polynomial');
 const prec={'+':1,'-':1,'*':2,'/':2,'^':4};
 while(peek()&&prec[peek().type]>=min){const op=next().type,b=parse(prec[op]+(op==='^'?0:1));
 if(op==='+')a=add(a,b);else if(op==='-')a=add(a,b,-1);else if(op==='*')a=mult(a,b);
 else if(op==='/'){if(b.size!==1||!b.has(0)||Math.abs(b.get(0))<1e-14)throw Error('rational');a=mult(a,constant(1/b.get(0)));}
 else if(op==='^'){if(b.size!==1||!b.has(0)||!Number.isInteger(b.get(0))||b.get(0)<0||b.get(0)>16)throw Error('power');let r=constant(1);for(let j=0;j<b.get(0);j++)r=mult(r,a);a=r;}
 }return a;}
 const result=parse(0);if(pos!==toks.length)throw Error('trailing');return result;
}
function formatPolynomial(terms){
 const clean=[...terms].filter(([k,v])=>Number.isFinite(v)&&Math.abs(v)>1e-10).sort((a,b)=>b[0]-a[0]);
 if(!clean.length)return '0';let text='';
 for(const [power,c] of clean){const neg=c<0,abs=Math.abs(c),n=Number(abs.toPrecision(10)).toString();const coeff=(power!==0&&Math.abs(abs-1)<1e-10)?'':n;
 const monomial=power===0?n:coeff+(power===1?'x':'x^'+power);
 text+=(text?(neg?' − ':' + '):(neg?'−':''))+monomial;
 }return text;
}
function expressionParts(){
 const source=$('formula').value.trim(),parsed=parseEquation(source);
 if(parsed.implicit){
  const flat=source.replace(/\s+/g,'').toLowerCase();
  const cc=flat.match(/^(?:x\^2\+y\^2|y\^2\+x\^2)=([0-9]+(?:\.[0-9]+)?)$/);
  if(cc){
   const radiusSquared=Number(cc[1]);const branch=$('branch').value;
   const positive=branch==='upper'||branch==='1';
   const sign=positive?'':'−';
   if(radiusSquared>=0)return ['fₑ(x) = '+sign+'sqrt('+radiusSquared+' − x^2)','fₒ(x) = 0'];
  }
  const side=flat==='x=y^2-1'||flat==='y^2-1=x';
  if(side){const positive=$('branch').value==='upper'||$('branch').value==='1';const sg=positive?'':'−';
   return ['fₑ(x) = '+sg+'(sqrt(x+1) + sqrt(1−x))/2', 'fₒ(x) = '+sg+'(sqrt(x+1) − sqrt(1−x))/2'];
  }
  return [
   'Явное выражение для выбранной ветви не найдено; построение численное.',
   'Явное выражение для выбранной ветви не найдено; построение численное.'
  ];
 }
 const pieces=source.split('=');const f=(pieces.length===1?pieces[0]:pieces[0].trim().toLowerCase()==='y'?pieces[1]:pieces[0]).trim();
 try{
  const poly=polynomialCoefficients(f);const even=new Map(),odd=new Map();for(const [power,v] of poly)(power%2===0?even:odd).set(power,v);
  return ['fₑ(x) = '+formatPolynomial(even),'fₒ(x) = '+formatPolynomial(odd)];
 }catch{
  // Explicit expression, but not necessarily simplifiable by the polynomial engine.
  const mirrored=f.replace(/\bx\b/gi,'(-x)');
  return ['fₑ(x) = (('+f+') + ('+mirrored+')) / 2', 'fₒ(x) = (('+f+') − ('+mirrored+')) / 2'];
 }
}
function updateExpressionLabels(){const [even,odd]=expressionParts();$('evenFormula').textContent=even;$('oddFormula').textContent=odd;
 $('evenFormula').classList.toggle('note',even.startsWith('Явное выражение'));
 $('oddFormula').classList.toggle('note',odd.startsWith('Явное выражение'));
}

function plot(){try{const data=derive();current=data;const eCount=data.evens.filter(Number.isFinite).length;const status=$('status');status.classList.remove('error');if(!data.found)status.textContent='В заданной области не найдено точек графика. Для неявного уравнения попробуйте увеличить диапазон поиска y или выбрать другую ветвь.';
else if(!eCount)status.textContent='Исходная ветвь найдена, но f(x) и f(−x) не определены одновременно в заданном интервале. Разложение здесь не отображается.';
else status.textContent=(data.implicit?'Неявное уравнение F(x,y)=0: синяя линия — выбранная ветвь, серые — другие ветви. ':'Явная функция y=f(x). ')+`Точек исходного графика: ${data.found} из ${data.xs.length}. Точек разложения: ${eCount}.`;
$('labelOriginal').textContent=$('formula').value;updateExpressionLabels();const symmetry=Math.min(data.b,-data.a)-Math.max(data.a,-data.b);$('note').textContent=(data.implicit?'Для неявного уравнения чётная и нечётная части определяются для выбранной ветви y(x), а не для всего множества решений. ':'')+(symmetry<=0?'Заданный интервал не содержит ненулевого симметричного отрезка. ':'Разложение вычисляется там, где одновременно определены f(x) и f(−x). ')+ 'Если уравнение имеет много ветвей (например, sin(x)+sin(y)=0), выбор «Верхняя» означает наибольший корень в заданном диапазоне Y. Такая ветвь может иметь разрывы при смене корня. Линии в местах резких переходов разделяются; для непрерывной ветви следует задать подходящий диапазон Y. Численный поиск может пропускать сложные касания.';
requestAnimationFrame(()=>{for(let k=0;k<3;k++)graph($('graph'+k),data,k);});}catch(err){$('status').classList.add('error');$('status').textContent='Ошибка: '+err.message;}}
function example(which){const set={poly:['y = x^3 - 2*x^2 + x',-4,4,-8,8],sin:['y = sin(x) + x^2/4',-7,7,-8,8],circle:['x^2 + y^2 = 9',-3.5,3.5,-4,4],cubic:['y^3 - 3*y + x = 0',-3,3,-4,4],parabola:['x = y^2 - 1',-2,6,-4,4],tangent:['y^2 = x^2',-3,3,-4,4],periodic:['sin(x)+sin(y)=0',-4,4,-8,8]};const v=set[which]||set.poly;$('formula').value=v[0];$('xmin').value=v[1];$('xmax').value=v[2];$('ymin').value=v[3];$('ymax').value=v[4];$('branch').value='upper';plot();}
$('plot').addEventListener('click',()=>{resetAllCharts();plot();});$('reset').addEventListener('click',()=>{resetAllCharts();$('examples').value='poly';example('poly');});$('examples').addEventListener('change',e=>{if(e.target.value){resetAllCharts();example(e.target.value);}});$('branch').addEventListener('change',plot);$('ymin').addEventListener('change',plot);$('ymax').addEventListener('change',plot);window.addEventListener('resize',()=>{if(current)requestAnimationFrame(()=>{for(let k=0;k<3;k++)graph($('graph'+k),current,k);});});
window.AVO_EVEN_ODD_TEST={compile,parseEquation,rootsAt,derive,axisTransform,axisInverse,chartViews,polynomialCoefficients,formatPolynomial,expressionParts,setZoomEnabled,chooseCenter,stepOrZoom,selectPanAxis};installChartControls();for(let k=0;k<3;k++)setZoomEnabled(k,false);example('poly');
