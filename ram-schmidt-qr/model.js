/* Gram–Schmidt and QR mathematics only. No DOM, Three.js, or UI code. */
import {matrixGeometry} from '../avo-core/v2/geometry-data.js';

export const MSG={
 ru:{appTitle:'AVO · Грам–Шмидт и QR-разложение',lead:'A → ортогональные U → ортонормированные Q; R = QᵀA, A = QR.',a:'Исходные векторы A',u:'Ортогональные векторы U',q:'Ортонормированный базис Q',r:'Верхнетреугольная матрица R',aDescr:'Редактируйте исходные столбцы A цифрами или конечными маркерами.',uDescr:'Ненормированные ортогональные векторы Грама–Шмидта.',qDescr:'Единичные взаимно перпендикулярные векторы Q.',rDescr:'Коэффициенты R: A = QR. При зависимости столбцов базис Q дополняется.',testNote:'Испытание на AVO Core v2 01g. Восемь опубликованных приложений не изменены.',helpTitle:'Справка · Грам–Шмидт и QR',helpMath:'Для столбцов a₁, a₂, a₃ вычисляем u₁=a₁, u₂=a₂−(q₁·a₂)q₁, u₃=a₃−(q₁·a₃)q₁−(q₂·a₃)q₂; qᵢ=uᵢ/‖uᵢ‖. R=QᵀA, QᵀQ=I, R верхнетреугольная, A=QR. При линейной зависимости вместо нулевого нормированного вектора выбирается ортогональное дополнение, чтобы получить полную ортогональную Q; в этом случае на диагонали R появляется нуль.'},
 en:{appTitle:'AVO · Gram–Schmidt and QR decomposition',lead:'A → orthogonal U → orthonormal Q; R = QᵀA and A = QR.',a:'Input vectors A',u:'Orthogonal vectors U',q:'Orthonormal basis Q',r:'Upper-triangular matrix R',aDescr:'Edit input columns using numbers or endpoint markers.',uDescr:'Unnormalized Gram–Schmidt orthogonal vectors.',qDescr:'Unit-length mutually perpendicular vectors.',rDescr:'R coefficients: A = QR. Dependent inputs are completed to a full Q basis.',testNote:'AVO Core v2 01g sandbox. Eight published apps remain unchanged.',helpTitle:'Help · Gram–Schmidt and QR',helpMath:'For columns a₁, a₂, a₃: u₁=a₁, u₂=a₂−(q₁·a₂)q₁, u₃=a₃−(q₁·a₃)q₁−(q₂·a₃)q₂; qᵢ=uᵢ/‖uᵢ‖. Then R=QᵀA, QᵀQ=I, R is upper triangular and A=QR. If a residual is zero, use an orthogonal completion vector to form a full Q, with a corresponding zero on R’s diagonal.'},
 he:{appTitle:'AVO · גרם–שמידט ופירוק QR',lead:'A → וקטורים אורתוגונליים U → בסיס אורתונורמלי Q; ‏R = QᵀA, ‏A = QR.',a:'וקטורי קלט A',u:'וקטורים אורתוגונליים U',q:'בסיס אורתונורמלי Q',r:'מטריצה משולשת עליונה R',aDescr:'ערכו את עמודות A במספרים או בגרירת נקודות הקצה.',uDescr:'וקטורי גרם–שמידט לפני נרמול.',qDescr:'וקטורי יחידה מאונכים זה לזה.',rDescr:'המקדמים R מקיימים A = QR. במקרה של תלות משלימים בסיס אורתוגונלי.',testNote:'בדיקת AVO Core v2 01g. שמונת היישומים הקיימים לא שונו.',helpTitle:'עזרה · גרם–שמידט ופירוק QR',helpMath:'לעמודות a₁, a₂, a₃: ‏u₁=a₁, ‏u₂=a₂−(q₁·a₂)q₁, ‏u₃=a₃−(q₁·a₃)q₁−(q₂·a₃)q₂; ‏qᵢ=uᵢ/‖uᵢ‖. מתקבל R=QᵀA, ‏QᵀQ=I, ו־A=QR. במקרה של תלות לינארית משלימים את Q לבסיס אורתוגונלי מלא.'}
};
const transpose=m=>m[0].map((_,c)=>m.map(row=>row[c]));
const columns=m=>transpose(m);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const norm=v=>Math.hypot(...v);
const scale=(a,k)=>a.map(x=>x*k);
const subtract=(a,b)=>a.map((x,i)=>x-b[i]);
const fmt=x=>Math.abs(x)<1e-9?'0':Number(x.toFixed(6)).toString();
const clean=x=>Math.abs(x)<1e-12?0:x;

/** Full 3×3 QR with modified Gram–Schmidt, second-pass reorthogonalization,
 * and deterministic orthogonal completion for rank-deficient columns.
 * R is upper triangular, QᵀQ≈I, A≈QR even for singular A. */
export function matrixRank(A){
 const a=A.map(row=>row.slice());
 const eps=1e-10*Math.max(1,...A.flat().map(Math.abs));
 let rank=0;
 for(let col=0;col<3&&rank<3;col++){
  let pivot=rank;for(let row=rank+1;row<3;row++)if(Math.abs(a[row][col])>Math.abs(a[pivot][col]))pivot=row;
  if(Math.abs(a[pivot][col])<=eps)continue;
  [a[rank],a[pivot]]=[a[pivot],a[rank]];
  for(let row=rank+1;row<3;row++){
    const factor=a[row][col]/a[rank][col];
    for(let c=col;c<3;c++)a[row][c]-=factor*a[rank][c];
  }
  rank++;
 }
 return rank;
}
export function gramSchmidtQR(A){
 if(!Array.isArray(A)||A.length!==3||A.some(row=>!Array.isArray(row)||row.length!==3||row.some(v=>!Number.isFinite(v))))throw Error('Expected finite 3×3 matrix');
 const a=columns(A),q=[],u=[],R=Array.from({length:3},()=>[0,0,0]);
 const threshold=1e-10*Math.max(1,...a.map(norm));
 for(let j=0;j<3;j++){
   let v=a[j].slice();
   for(let i=0;i<j;i++){const k=dot(q[i],v);R[i][j]+=k;v=subtract(v,scale(q[i],k));}
   for(let i=0;i<j;i++){const k=dot(q[i],v);R[i][j]+=k;v=subtract(v,scale(q[i],k));}
   const residual=v.slice();
   let magnitude=norm(v);
   if(magnitude>threshold){R[j][j]=magnitude;q.push(scale(v,1/magnitude));u.push(residual);}
   else{
     // A zero residual cannot be normalized. Keep U's column zero, and
     // complete Q with a direction orthogonal to previous q vectors.
     u.push([0,0,0]);R[j][j]=0;
     let best=null,bestLen=-1;
     for(const basis of [[1,0,0],[0,1,0],[0,0,1]]){
       let w=basis.slice();
       for(let pass=0;pass<2;pass++)for(const prev of q)w=subtract(w,scale(prev,dot(prev,w)));
       const size=norm(w);if(size>bestLen){bestLen=size;best=w;}
     }
     if(bestLen<1e-12)throw Error('Cannot complete orthonormal basis');
     q.push(scale(best,1/bestLen));
   }
 }
 const rank=matrixRank(A);
 return {U:transpose(u.map(v=>v.map(clean))),Q:transpose(q.map(v=>v.map(clean))),R:R.map(row=>row.map(clean)),rank,dependent:rank<3};
}
export function multiply(A,B){return A.map(row=>B[0].map((_,j)=>row.reduce((s,v,k)=>s+v*B[k][j],0)));}
export function maxError(A,B){return Math.max(...A.flatMap((row,i)=>row.map((v,j)=>Math.abs(v-B[i][j]))));}
function picture(matrix,label,matrixId=null,extra=[]){return {matrix,label,geometry:matrixGeometry(matrix,matrixId),metrics:extra};}
export const initialInputs={A:[[1,1,1],[1,0,1],[0,1,1]]};
export const mathModel={calculate({getNumericMatrix}){
 const A=getNumericMatrix('A',{x:0,y:0,z:0,t:0});const {U,Q,R,rank,dependent}=gramSchmidtQR(A);
 const err=maxError(multiply(Q,R),A),orthErr=maxError(multiply(transpose(Q),Q),[[1,0,0],[0,1,0],[0,0,1]]);
 const status=dependent?'rank < 3 · dependent columns':'rank = 3';
 return {pictures:{a:picture(A,'A','A',[{key:'rank',value:String(rank)}]),u:picture(U,'U',[{key:'rank',value:String(rank)}]),q:picture(Q,'Q',[{key:'orthogonality',value:fmt(orthErr)}]),r:picture(R,'R',[{key:'reconstruction',value:fmt(err)},{key:'rank',value:String(rank)}])},rank,dependent,status,error:err};
}};
const configs={
 a:{id:'a',titleKey:'a',descriptionKey:'aDescr',matrixId:'A',editable:true},
 u:{id:'u',titleKey:'u',descriptionKey:'uDescr',outputMatrixId:'u',editable:false},
 q:{id:'q',titleKey:'q',descriptionKey:'qDescr',outputMatrixId:'q',editable:false},
 r:{id:'r',titleKey:'r',descriptionKey:'rDescr',outputMatrixId:'r',editable:false}
};
export function picturesForLayout(){return ['a','u','q','r'].map(k=>configs[k]);}
