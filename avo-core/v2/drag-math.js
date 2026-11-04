/* AVO Core v2 01b · screen-space editing, independent of any mathematical model.
   The damped inverse handles singular and nearly edge-on camera projections. */
const magnitude=(a,b)=>Math.hypot(a,b);
export function solveXY(jx,jy,dx,dy){
  const nx=magnitude(...jx),ny=magnitude(...jy),scale=Math.max(nx,ny);
  if(!Number.isFinite(scale)||!Number.isFinite(dx)||!Number.isFinite(dy)||scale<1e-8)return [0,0];
  // Damping prevents the inverse Jacobian from exploding when XY is edge-on.
  const damping=Math.max(1.5,.16*scale),d2=damping*damping;
  const a=nx*nx+d2,b=jx[0]*jy[0]+jx[1]*jy[1],c=ny*ny+d2;
  const u=jx[0]*dx+jx[1]*dy,v=jy[0]*dx+jy[1]*dy,det=a*c-b*b;
  if(!(det>0)||!Number.isFinite(det))return [0,0];
  let x=(c*u-b*v)/det,y=(a*v-b*u)/det;
  // Bound a single step relative to the *visible* projection, not coordinates.
  const maxStep=2.5*magnitude(dx,dy)/Math.max(1,scale);
  const length=magnitude(x,y);
  if(length>maxStep){x*=maxStep/length;y*=maxStep/length;}
  return [Number.isFinite(x)?x:0,Number.isFinite(y)?y:0];
}
export function solveZ(jz,dx,dy,referenceScale){
  const n=magnitude(...jz);
  if(!Number.isFinite(n)||!Number.isFinite(dx)||!Number.isFinite(dy))return 0;
  // End-on Z axis: the depth direction cannot be inferred from perspective.
  // Use a stable vertical gesture at the current camera scale instead.
  if(n<2)return -dy/Math.max(2,referenceScale||2);
  const damping=Math.max(1.5,n*.16);
  const value=(jz[0]*dx+jz[1]*dy)/(n*n+damping*damping);
  return Number.isFinite(value)?value:0;
}
