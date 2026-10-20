// Dependency-free, column-major matrices for the WebGL preview.
export function identity() {return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);}
export function multiply(a,b) {
  const out = new Float32Array(16);
  for (let c=0;c<4;c++) for(let r=0;r<4;r++) {
    let sum=0;
    for(let k=0;k<4;k++) sum+=a[k*4+r]*b[c*4+k];
    out[c*4+r]=sum;
  }
  return out;
}
export function translation(x,y,z) {const m=identity(); m[12]=x; m[13]=y; m[14]=z; return m;}
export function scaling(x,y,z) {const m=identity(); m[0]=x; m[5]=y; m[10]=z; return m;}
export function rotationY(a) {const m=identity(), c=Math.cos(a),s=Math.sin(a); m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m;}
export function rotationZ(a) {const m=identity(), c=Math.cos(a),s=Math.sin(a); m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return m;}
export function modelMatrix(pose, size) {
  return multiply(multiply(multiply(translation(pose.x,pose.y,pose.z),rotationY(pose.ry)),rotationZ(pose.rz)), scaling(...size));
}
export function perspective(fov,aspect,near,far) {
  const f=1/Math.tan(fov/2), range=1/(near-far);
  const out=new Float32Array(16);
  out[0]=f/aspect;out[5]=f;out[10]=(far+near)*range;out[11]=-1;out[14]=2*far*near*range;
  return out;
}
const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const normalize=a=>{const d=Math.hypot(...a)||1;return a.map(x=>x/d);};
export function lookAt(eye,center,up=[0,1,0]) {
  const z=normalize(subtract(eye,center)),x=normalize(cross(up,z)),y=cross(z,x);
  return new Float32Array([x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
}
