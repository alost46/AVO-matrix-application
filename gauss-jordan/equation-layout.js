/* 01ab: simple readable equations as three natural, unaligned text strings.
   No column grid, padding, or artificial alignment. */
(function(){
  'use strict';
  const EPS=1e-9;
  const fmt=n => (Math.abs(n)<EPS?0:Number(n)).toFixed(2);
  function equationText(row){
    let expression='';
    for(let i=0;i<3;i++){
      const v=row[i];
      if(Math.abs(v)<EPS)continue;
      const sign= v<0?'-':'+';
      const prefix = expression ? sign : (v<0?'-':'');
      expression += prefix + fmt(Math.abs(v)) + ['x','y','z'][i];
    }
    if(!expression)expression='0';
    return expression + '=' + fmt(row[3]);
  }
  function render(container,rows){
    if(!container || !Array.isArray(rows) || rows.length!==3)return;
    const block=document.createElement('div');
    block.className='avoe-plain';
    block.setAttribute('aria-label','Уравнения плоскостей');
    for(const row of rows){
      const line=document.createElement('div');
      line.className='avoe-line';
      line.textContent=equationText(row);
      block.appendChild(line);
    }
    container.replaceChildren(block);
  }
  window.AVOEquationLayout={render};
})();
