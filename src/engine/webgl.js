import {multiply, modelMatrix, lookAt, perspective} from '../core/matrix.js';
import {interpolatePose,visibleAtStage} from '../core/assembly.js';

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
// Unit-height, unit-diameter cylinders aligned to Y. Dedicated triangle and
// line meshes keep hardware legible even at small camera scales.
function cylinderVertices(segments = 12) {
  const points = [];
  const push = (position, normal) => points.push(...position, ...normal);
  for (let i = 0; i < segments; i++) {
    const a = 2 * Math.PI * i / segments, b = 2 * Math.PI * (i + 1) / segments;
    const x1 = Math.cos(a) * .5, z1 = Math.sin(a) * .5;
    const x2 = Math.cos(b) * .5, z2 = Math.sin(b) * .5;
    for (const point of [[x1,-.5,z1],[x2,-.5,z2],[x2,.5,z2],[x1,-.5,z1],[x2,.5,z2],[x1,.5,z1]]) {
      push(point, [point[0] * 2, 0, point[2] * 2]);
    }
    for (const y of [-.5,.5]) {
      const normal = [0, y < 0 ? -1 : 1, 0];
      for (const point of [[0,y,0],[x2,y,z2],[x1,y,z1]]) push(point,normal);
    }
  }
  return new Float32Array(points);
}
function cylinderEdges(segments = 12) {
  const points = [];
  const vertex = (x,y,z) => points.push(x,y,z,0,1,0);
  for (let i = 0; i < segments; i++) {
    const a = 2 * Math.PI * i / segments, b = 2 * Math.PI * (i+1) / segments;
    const x1 = Math.cos(a)*.5,z1=Math.sin(a)*.5,x2=Math.cos(b)*.5,z2=Math.sin(b)*.5;
    for (const y of [-.5,.5]) {vertex(x1,y,z1);vertex(x2,y,z2);}
    if (i % 3 === 0) {vertex(x1,-.5,z1);vertex(x1,.5,z1);}
  }
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
  complete:[0.90,0.90,0.85], metal:[0.58,0.64,0.64], edge:[0.38,0.42,0.39],
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
  const box={surface:bind(cubeVertices()), outline:bind(edgeVertices())};
  const cylinder={surface:bind(cylinderVertices()), outline:bind(cylinderEdges())};
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  let theta=.67,phi=1.14,distance=3.7,centerY=1.05;
  let targetCamera={theta,phi,distance,y:centerY}, currentCamera=targetCamera;
  let dragging=false,lastX=0,lastY=0,stage=0,mode='room',activeStep=manual.steps[0];
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function focusStep(step,{immediate=false}={}) {
    activeStep=step;
    targetCamera={...step.camera};
    if (immediate) {
      theta=targetCamera.theta;phi=targetCamera.phi;distance=targetCamera.distance;centerY=targetCamera.y;
    }
  }
  const onDown=e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);};
  const onMove=e=>{
    if (!dragging)return;
    theta-=(e.clientX-lastX)*.007;
    phi=clamp(phi+(e.clientY-lastY)*.006,.25,Math.PI-.18);
    lastX=e.clientX;lastY=e.clientY;
    targetCamera={theta,phi,distance,y:centerY};
  };
  const onUp=()=>{dragging=false;};
  const onWheel=e=>{
    e.preventDefault();distance=clamp(distance*Math.exp(e.deltaY*.001),1.65,7.6);
    targetCamera={theta,phi,distance,y:centerY};
  };
  const onReset=()=>focusStep(activeStep,{immediate:true});
  const setMode=value=>{if (!['room','drawing'].includes(value)) throw new Error('Unknown viewer mode');mode=value;};
  canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);
  canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onUp);
  canvas.addEventListener('wheel',onWheel,{passive:false});canvas.addEventListener('dblclick',onReset);
  function draw(progress,activeParts=[],dt=1/60) {
    stage=progress;
    // Camera keyframes interpolate independently from object transforms; any
    // manual orbit action cancels the current auto-flight until the next step.
    const easing=clamp(1-Math.exp(-5.8*clamp(dt,0,.1)),0,1);
    theta+=(targetCamera.theta-theta)*easing;
    phi+=(targetCamera.phi-phi)*easing;
    distance+=(targetCamera.distance-distance)*easing;
    centerY+=(targetCamera.y-centerY)*easing;
    const dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.floor(canvas.clientWidth*dpr)),h=Math.max(1,Math.floor(canvas.clientHeight*dpr));
    if (canvas.width!==w || canvas.height!==h) {canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const center=[0,centerY,0];
    // Portrait viewports need a wider framing without modifying saved camera
    // presets; avoid cropping the outer exploded panels on small screens.
    const frameDistance=distance*Math.max(1,Math.min(1.7,1.5/(w/h)));
    const eye=[center[0]+frameDistance*Math.sin(phi)*Math.sin(theta),center[1]+frameDistance*Math.cos(phi),center[2]+frameDistance*Math.sin(phi)*Math.cos(theta)];
    const vp=multiply(perspective(43*Math.PI/180,w/h,.05,30),lookAt(eye,center));
    gl.useProgram(p);
    const focus=new Set(activeParts);
    function drawMesh(pose,size,geometry,color,edgeColor,wire=true) {
      const mesh=geometry==='cylinder'?cylinder:box;
      const model=modelMatrix(pose,size),mvp=multiply(vp,model);
      gl.uniformMatrix4fv(locations.mvp,false,mvp);gl.uniformMatrix4fv(locations.model,false,model);
      gl.uniform1f(locations.edge,0);gl.uniform3fv(locations.color,color);
      gl.bindVertexArray(mesh.surface.vao);gl.drawArrays(gl.TRIANGLES,0,mesh.surface.length);
      if (wire) {
        gl.uniform1f(locations.edge,1);gl.uniform3fv(locations.color,edgeColor);
        gl.bindVertexArray(mesh.outline.vao);gl.drawArrays(gl.LINES,0,mesh.outline.length);
      }
    }
    // Drawing removes the environment and uses a high-contrast technical palette.
    if (mode==='room') {
      drawMesh({x:0,y:-.075,z:0},[9,.08,9],'box',[.83,.82,.75],[.83,.82,.75],false);
      drawMesh({x:0,y:-.025,z:0},[2.65,.005,2.25],'box',[.89,.85,.78],[.89,.85,.78],false);
    }
    for (const part of manual.parts) {
      if (!visibleAtStage(part,stage)) continue;
      const pose=interpolatePose(part,stage);
      const fraction=clamp(stage-part.installStep+1,0,1);
      const highlighted=focus.has(part.id);
      const color=mode==='drawing'
        ? (highlighted?[.58,.77,.36]:fraction===0?[.95,.96,.94]:part.kind==='hardware'?[.42,.47,.47]:[.98,.98,.96])
        : (highlighted?tones.active:fraction===0?tones.future:(part.tone==='back'?tones.back:(part.kind==='hardware'?tones.metal:tones.complete)));
      const edge=mode==='drawing'
        ? (highlighted?[.25,.45,.20]:fraction===0?[.66,.72,.68]:[.22,.32,.28])
        : tones.edge;
      drawMesh(pose,part.size,part.shape,color,edge);
    }
    gl.bindVertexArray(null);
  }
  function destroy() {
    canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);
    canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',onUp);
    canvas.removeEventListener('wheel',onWheel);canvas.removeEventListener('dblclick',onReset);
    for (const mesh of [box.surface,box.outline,cylinder.surface,cylinder.outline]) {
      gl.deleteVertexArray(mesh.vao);gl.deleteBuffer(mesh.vbo);
    }
    gl.deleteProgram(p);
  }
  return {draw,reset:onReset,destroy,focusStep,setMode};
}
