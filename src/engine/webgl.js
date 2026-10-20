import {multiply, modelMatrix, lookAt, perspective} from '../core/matrix.js';
import {interpolatePose} from '../core/assembly.js';

const VERTEX = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
uniform mat4 uMVP;
uniform mat4 uModel;
out vec3 vNormal;
void main() {
  vNormal = normalize(mat3(uModel) * aNormal);
  gl_Position = uMVP * vec4(aPosition, 1.0);
}`;
const FRAGMENT = `#version 300 es
precision mediump float;
in vec3 vNormal;
uniform vec3 uColor;
uniform float uEdge;
out vec4 finalColor;
void main() {
  float diffuse = max(0.0, dot(normalize(vNormal), normalize(vec3(-0.4, 0.85, 0.65))));
  float illumination = mix(0.75, 1.08, diffuse);
  vec3 color = uEdge > 0.5 ? uColor : uColor * illumination;
  finalColor = vec4(color, 1.0);
}`;
const faces = [
  [[-1,0,0], [[-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5]]],
  [[1,0,0], [[.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5]]],
  [[0,-1,0], [[-.5,-.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5]]],
  [[0,1,0], [[-.5,.5,-.5],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5]]],
  [[0,0,-1], [[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]]],
  [[0,0,1], [[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]]],
];
function cubeVertices() {
  const points = [];
  for (const [n,quad] of faces) for (const i of [0,1,2,0,2,3]) points.push(...quad[i],...n);
  return new Float32Array(points);
}
function edgeVertices() {
  const corners = [
    [-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5],
    [-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],
  ];
  const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  const points = [];
  for (const [a,b] of edges) for (const i of [a,b]) points.push(...corners[i],0,1,0);
  return new Float32Array(points);
}
function shader(gl,type,source) {
  const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function program(gl) {
  const p=gl.createProgram(),v=shader(gl,gl.VERTEX_SHADER,VERTEX),f=shader(gl,gl.FRAGMENT_SHADER,FRAGMENT);
  gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);
  gl.deleteShader(v);gl.deleteShader(f);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}
const tones = {
  wood:[0.93,0.92,0.87], back:[0.79,0.79,0.74],
  future:[0.74,0.76,0.74], active:[0.75,0.89,0.58],
  complete:[0.90,0.90,0.85], edge:[0.38,0.42,0.39],
};

export function makeViewer(canvas, manual) {
  const gl=canvas.getContext('webgl2',{antialias:true,alpha:true,preserveDrawingBuffer:false});
  if (!gl) throw new Error('WebGL 2 is unavailable on this device.');
  const p=program(gl);gl.useProgram(p);
  const locations={mvp:gl.getUniformLocation(p,'uMVP'),model:gl.getUniformLocation(p,'uModel'),color:gl.getUniformLocation(p,'uColor'),edge:gl.getUniformLocation(p,'uEdge')};
  const position=gl.getAttribLocation(p,'aPosition'),normal=gl.getAttribLocation(p,'aNormal');
  const bind=(vertices)=>{
    const vao=gl.createVertexArray(),vbo=gl.createBuffer();gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
    gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,3,gl.FLOAT,false,24,0);
    gl.enableVertexAttribArray(normal);gl.vertexAttribPointer(normal,3,gl.FLOAT,false,24,12);
    return {vao,vbo,length:vertices.length/6};
  };
  const surface=bind(cubeVertices()), outline=bind(edgeVertices());
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  let theta=0.67,phi=1.14,distance=3.7;
  let dragging=false,lastX=0,lastY=0,stage=0,focus=[];
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const onDown=(e)=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);};
  const onMove=(e)=>{if(!dragging)return;theta-=(e.clientX-lastX)*.007;phi=clamp(phi+(e.clientY-lastY)*.006,.25,Math.PI-.18);lastX=e.clientX;lastY=e.clientY;};
  const onUp=()=>{dragging=false;};
  const onWheel=(e)=>{e.preventDefault();distance=clamp(distance*Math.exp(e.deltaY*.001),2.25,6.8);};
  const onReset=()=>{theta=.67;phi=1.14;distance=3.7;};
  canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);
  canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onUp);
  canvas.addEventListener('wheel',onWheel,{passive:false});canvas.addEventListener('dblclick',onReset);
  function draw(progress,activeParts=[]) {
    stage=progress;focus=activeParts;
    const dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.floor(canvas.clientWidth*dpr)),h=Math.max(1,Math.floor(canvas.clientHeight*dpr));
    if (canvas.width!==w || canvas.height!==h) {canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const center=[0,1.08,0];
    const eye=[center[0]+distance*Math.sin(phi)*Math.sin(theta),center[1]+distance*Math.cos(phi),center[2]+distance*Math.sin(phi)*Math.cos(theta)];
    const vp=multiply(perspective(43*Math.PI/180,w/h,.05,30),lookAt(eye,center));
    gl.useProgram(p);
    // Draw opaque surfaces, then dark wireframe outlines with depth test retained.
    for (const part of manual.parts) {
      const pose=interpolatePose(part,stage), model=modelMatrix(pose,part.size),mvp=multiply(vp,model);
      const fraction=clamp(stage-part.installStep+1,0,1);
      const color=focus.includes(part.id)?tones.active:(fraction===0?tones.future:(part.tone==='back'?tones.back:tones.complete));
      gl.uniformMatrix4fv(locations.mvp,false,mvp);gl.uniformMatrix4fv(locations.model,false,model);
      gl.uniform1f(locations.edge,0);gl.uniform3fv(locations.color,color);
      gl.bindVertexArray(surface.vao);gl.drawArrays(gl.TRIANGLES,0,surface.length);
      gl.uniform1f(locations.edge,1);gl.uniform3fv(locations.color,tones.edge);
      gl.bindVertexArray(outline.vao);gl.drawArrays(gl.LINES,0,outline.length);
    }
    gl.bindVertexArray(null);
  }
  function destroy() {
    canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);
    canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',onUp);
    canvas.removeEventListener('wheel',onWheel);canvas.removeEventListener('dblclick',onReset);
    for (const b of [surface,outline]){gl.deleteVertexArray(b.vao);gl.deleteBuffer(b.vbo);}gl.deleteProgram(p);
  }
  return {draw,reset:onReset,destroy};
}
