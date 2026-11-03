/* Pure mathematics: no DOM, Three.js, storage, camera or UI controls. */
import {matrixGeometry} from '../../avo-core/v2/geometry-data.js';
export const MSG={
 ru:{appTitle:'AVO · Произведение матриц · испытание v2',lead:'Независимые матрицы A и B, автоматически вычисляемые AB и BA.',a:'Первый множитель A',b:'Второй множитель B',result:'Результат умножения',result2:'Второе произведение',aDescr:'Изменяйте столбцы матрицы A числами или кружочками.',bDescr:'Изменяйте столбцы матрицы B числами или кружочками.',resultDescr:'Результат пересчитывается автоматически.',testNote:'Испытательный стенд. Опубликованные приложения не изменены.',helpTitle:'Справка · произведение матриц',helpMath:'В третьей картинке переключайте BA и AB. По умолчанию A = I, а B имеет единицы на побочной диагонали. Для разных матриц порядок произведения обычно имеет значение. Матрицы A и B редактируются независимо.'},
 en:{appTitle:'AVO · Matrix multiplication · v2 test',lead:'Independent matrices A and B with automatically computed AB and BA.',a:'First factor A',b:'Second factor B',result:'Matrix product',result2:'Other product',aDescr:'Change columns of A through numbers or draggable circles.',bDescr:'Change columns of B through numbers or draggable circles.',resultDescr:'The product is recomputed immediately.',testNote:'Test sandbox. Published apps are unchanged.',helpTitle:'Help · matrix multiplication',helpMath:'Switch BA and AB in the third picture. Initially A = I and B has ones on the anti-diagonal. In general order matters. Matrices A and B can be edited separately.'},
 he:{appTitle:'AVO · כפל מטריצות · בדיקת v2',lead:'מטריצות A ו־B עצמאיות, והמכפלות AB ו־BA מחושבות מייד.',a:'גורם ראשון A',b:'גורם שני B',result:'תוצאת הכפל',result2:'מכפלה נוספת',aDescr:'אפשר לשנות את עמודות A במספרים או בגרירת העיגולים.',bDescr:'אפשר לשנות את עמודות B במספרים או בגרירת העיגולים.',resultDescr:'התוצאה מחושבת מחדש באופן מיידי.',testNote:'סביבת בדיקה. האפליקציות הקיימות לא שונו.',helpTitle:'עזרה · כפל מטריצות',helpMath:'בחרו BA או AB בתמונה השלישית. בהתחלה A היא מטריצת היחידה ו־B בעלת אחדות באלכסון המשני. בדרך כלל הסדר חשוב. ניתן לערוך את A ואת B בנפרד.'}
};
const fmt=n=>Math.abs(n)<1e-9?'0':Number(n.toFixed(4)).toString();
export function multiply(a,b){return a.map(row=>b[0].map((_,j)=>row.reduce((s,v,k)=>s+v*b[k][j],0)));}
export function det3(m){return m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);}
export function rank3(m){const a=m.map(r=>r.slice());let rank=0;
 for(let c=0;c<3;c++){let pivot=rank;for(let i=rank+1;i<3;i++)if(Math.abs(a[i][c])>Math.abs(a[pivot]?.[c]||0))pivot=i;
   if(rank>=3||!a[pivot]||Math.abs(a[pivot][c])<1e-9)continue;
   [a[rank],a[pivot]]=[a[pivot],a[rank]];
   for(let i=rank+1;i<3;i++){let f=a[i][c]/a[rank][c];for(let j=c;j<3;j++)a[i][j]-=f*a[rank][j];}
   rank++;
 }return rank;
}
function plane(m){
 const p=[m[0][0],m[1][0],m[2][0]],q=[m[0][1],m[1][1],m[2][1]],r=[m[0][2],m[1][2],m[2][2]],u=q.map((x,i)=>x-p[i]),v=r.map((x,i)=>x-p[i]);
 const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
 const len=Math.hypot(...n);if(len<1e-9)return '∅';
 const unit=n.map(x=>x/len),d=unit.reduce((s,x,i)=>s+x*p[i],0);
 return `${fmt(unit[0])}x + ${fmt(unit[1])}y + ${fmt(unit[2])}z = ${fmt(d)}`;
}
const make=(m,id,matrixId=null)=>({matrix:m,label:id,geometry:matrixGeometry(m,matrixId),formulaLabel:'plane',metrics:[{key:'det',value:fmt(det3(m))},{key:'rank',value:String(rank3(m))}],formula:`${plane(m)}`});
export const mathModel={
 calculate({getNumericMatrix,parameters}){
   const A=getNumericMatrix('A',{x:0,y:0,z:0,t:0}),B=getNumericMatrix('B',{x:0,y:0,z:0,t:0});
   const AB=multiply(A,B),BA=multiply(B,A),order=parameters.order==='AB'?'AB':'BA';
   return {pictures:{a:make(A,'A','A'),b:make(B,'B','B'),result:make(order==='AB'?AB:BA,order),extra:make(order==='AB'?BA:AB,order==='AB'?'BA':'AB')},commutes:AB.every((row,i)=>row.every((x,j)=>Math.abs(x-BA[i][j])<1e-8))};
 }
};
export const initialInputs={A:[[1,0,0],[0,1,0],[0,0,1]],B:[[0,0,1],[0,1,0],[1,0,0]]};
export const configs={
 a:{id:'a',titleKey:'a',descriptionKey:'aDescr',matrixId:'A',editable:true},
 b:{id:'b',titleKey:'b',descriptionKey:'bDescr',matrixId:'B',editable:true},
 result:{id:'result',titleKey:'result',descriptionKey:'resultDescr',outputMatrixId:'result',orderSelect:true,editable:false},
 extra:{id:'extra',titleKey:'result2',descriptionKey:'resultDescr',outputMatrixId:'extra',editable:false}
};
export function picturesForLayout(count){return (count===2?['a','result']:count===4?['a','b','result','extra']:['a','b','result']).map(id=>configs[id]);}
