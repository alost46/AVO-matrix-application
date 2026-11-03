/* AVO Core v2 · universal geometry conversion: points, segments, triangle faces, editable handles. */
import * as THREE from 'three';
const palette=[0xf02a28,0xc6a77d,0x80c92f,0x348dc1,0xa264cb,0xeea929];
export function matrixGeometry(matrix, matrixId=null){
  const origin=[0,0,0], points=[],lines=[],handles=[];
  for(let c=0;c<3;c++){
    const end=[matrix[0][c],matrix[1][c],matrix[2][c]];
    points.push({id:`v${c+1}`,xyz:end,color:palette[c],label:`${c+1}`});
    lines.push({from:origin,to:end,color:palette[c]});
    if(matrixId)handles.push({id:`${matrixId}-column-${c}`,position:end,binding:{type:'matrixColumn',matrixId,column:c},color:palette[c]});
  }
  return {points,lines,faces:[],handles};
}
export class GeometryLayer {
  constructor(scene){this.scene=scene;this.group=new THREE.Group();scene.add(this.group);this.hit=[];}
  clear(){
    this.group.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});
    this.scene.remove(this.group);this.group=new THREE.Group();this.scene.add(this.group);this.hit=[];
  }
  update(data={}) {
    this.clear();
    const add=o=>this.group.add(o);
    for(const line of data.lines||[]){
      if(!validPoint(line.from)||!validPoint(line.to))continue;
      const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...line.from),new THREE.Vector3(...line.to)]);
      add(new THREE.Line(g,new THREE.LineBasicMaterial({color:line.color??0x3665b4,depthTest:false})));
    }
    for(const face of data.faces||[]){
      if(!Array.isArray(face.vertices)||face.vertices.length<3||!face.vertices.every(validPoint))continue;
      const arr=[];for(let j=1;j<face.vertices.length-1;j++)arr.push(...face.vertices[0],...face.vertices[j],...face.vertices[j+1]);
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));g.computeVertexNormals();
      add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:face.color??0xeba72d,side:THREE.DoubleSide,transparent:true,opacity:0.23,depthWrite:false})));
    }
    for(const p of data.points||[]){
      if(!validPoint(p.xyz))continue;
      const g=new THREE.SphereGeometry(.055,12,8),m=new THREE.MeshBasicMaterial({color:p.color??0x275da1});
      const point=new THREE.Mesh(g,m);point.position.fromArray(p.xyz);add(point);
    }
    for(const handle of data.handles||[]){
      if(!validPoint(handle.position))continue;
      const color=handle.color??0x265fb1;
      const rim=new THREE.Mesh(new THREE.SphereGeometry(.19,16,12),new THREE.MeshBasicMaterial({color}));
      const white=new THREE.Mesh(new THREE.SphereGeometry(.128,16,12),new THREE.MeshBasicMaterial({color:0xffffff}));
      rim.add(white);rim.position.fromArray(handle.position);rim.userData.handle=handle;add(rim);this.hit.push(rim);
    }
  }
  dispose(){this.clear();this.scene.remove(this.group);}
}
function validPoint(p){return Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);}
