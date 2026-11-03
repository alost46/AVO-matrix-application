/* AVO Core v2 · circular angle rays, not range sliders. */
const COLORS=['#d03e45','#ad8651','#62a51a'];
const MOD=n=>((n%360)+360)%360;
export function buildRays(container, onChange){
  const widgets=[];
  ['X','Y','Z'].forEach((name,index)=>{
    const root=document.createElement('div');root.className='ray-widget';
    const label=document.createElement('label');label.className='rays-label';label.textContent=name;
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 80 80');svg.setAttribute('role','slider');svg.setAttribute('tabindex','0');svg.setAttribute('aria-label',`${name} angle`);
    const circle=document.createElementNS(svg.namespaceURI,'circle');circle.setAttribute('cx','40');circle.setAttribute('cy','40');circle.setAttribute('r','32');circle.setAttribute('class','ray-ring');svg.append(circle);
    const line=document.createElementNS(svg.namespaceURI,'line');line.setAttribute('x1','40');line.setAttribute('y1','40');line.setAttribute('class','ray-line');line.setAttribute('stroke',COLORS[index]);svg.append(line);
    const dot=document.createElementNS(svg.namespaceURI,'circle');dot.setAttribute('r','6');dot.setAttribute('class','ray-dot');dot.setAttribute('fill',COLORS[index]);svg.append(dot);
    const input=document.createElement('input');input.type='number';input.step='1';input.min='-360000';input.max='360000';input.inputMode='decimal';input.setAttribute('aria-label',`${name} degrees`);
    let value=0;
    function set(v){value=MOD(v);const a=value*Math.PI/180,x=40+28*Math.sin(a),y=40-28*Math.cos(a);
      line.setAttribute('x2',x);line.setAttribute('y2',y);dot.setAttribute('cx',x);dot.setAttribute('cy',y);
      svg.setAttribute('aria-valuenow',String(Math.round(value)));svg.setAttribute('aria-valuemin','0');svg.setAttribute('aria-valuemax','360');
      if(document.activeElement!==input)input.value=Number(value.toFixed(1));
    }
    function updatePointer(e){const r=svg.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      const a=Math.atan2(e.clientX-cx,cy-e.clientY)*180/Math.PI;onChange(index,MOD(a));e.preventDefault();}
    svg.addEventListener('pointerdown',e=>{svg.setPointerCapture(e.pointerId);updatePointer(e);});
    svg.addEventListener('pointermove',e=>{if(svg.hasPointerCapture(e.pointerId))updatePointer(e);});
    svg.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowUp'){onChange(index,MOD(value+5));e.preventDefault();}else if(e.key==='ArrowLeft'||e.key==='ArrowDown'){onChange(index,MOD(value-5));e.preventDefault();}});
    input.addEventListener('change',()=>{const n=Number(input.value);if(Number.isFinite(n)){onChange(index,MOD(n));input.value=String(Number(MOD(n).toFixed(1)));}else set(value);});
    root.append(label,svg,input);container.append(root);widgets.push({set});
  });
  return angles=>angles.forEach((v,i)=>widgets[i].set(v));
}
