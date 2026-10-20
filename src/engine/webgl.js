import {multiply, modelMatrix, lookAt, perspective} from '../core/matrix.js';
import {interpolatePose,visibleAtStage,installationFraction} from '../core/assembly.js';

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
  roof:[0.42,0.53,0.47], steel:[0.57,0.63,0.64], board:[0.27,0.50,0.36],
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
  let theta=.67,phi=1.14,distance=3.7,centerY=1.05,centerX=0,centerZ=0;
  let targetCamera={theta,phi,distance,y:centerY,x:0,z:0};
  const pointers=new Map();
  let lastX=0,lastY=0,pinchDistance=0,stage=0,mode='room',activeStep=manual.steps[0],elapsed=0,drawCalls=0;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function focusStep(step,{immediate=false}={}) {
    activeStep=step;
    targetCamera={x:0,z:0,...step.camera};
    if (immediate) {
      theta=targetCamera.theta;phi=targetCamera.phi;distance=targetCamera.distance;centerY=targetCamera.y;centerX=targetCamera.x;centerZ=targetCamera.z;
    }
  }
  const saveCamera=()=>{targetCamera={theta,phi,distance,y:centerY,x:centerX,z:centerZ};};
  const pointerSeparation=()=>{
    const p=[...pointers.values()];return p.length<2?0:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
  };
  const onDown=e=>{
    e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    canvas.setPointerCapture(e.pointerId);
    lastX=e.clientX;lastY=e.clientY;
    if(pointers.size>=2)pinchDistance=pointerSeparation();
  };
  const onMove=e=>{
    if(!pointers.has(e.pointerId))return;
    e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size>=2){
      const separation=pointerSeparation();
      if(pinchDistance>0 && separation>0)distance=clamp(distance*pinchDistance/separation,.27,45);
      pinchDistance=separation;
    }else{
      theta-=(e.clientX-lastX)*.007;
      phi=clamp(phi+(e.clientY-lastY)*.006,.18,Math.PI-.18);
    }
    lastX=e.clientX;lastY=e.clientY;saveCamera();
  };
  const onUp=e=>{
    pointers.delete(e.pointerId);pinchDistance=0;
    const next=[...pointers.values()][0];if(next){lastX=next.x;lastY=next.y;}
  };
  const onWheel=e=>{
    e.preventDefault();distance=clamp(distance*Math.exp(e.deltaY*.001),.27,45);
    saveCamera();
  };
  const onReset=()=>focusStep(activeStep,{immediate:true});
  const onDblClick=()=>onReset();
  const setMode=value=>{if(!['room','drawing'].includes(value))throw new Error('Unknown viewer mode');mode=value;};
  canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);
  canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onUp);
  canvas.addEventListener('wheel',onWheel,{passive:false});canvas.addEventListener('dblclick',onDblClick);
  function draw(progress,activeParts=[],dt=1/60,step=activeStep) {
    stage=progress;elapsed+=Math.max(0,dt);drawCalls=0;
    // Camera keyframes interpolate independently from object transforms; any
    // manual orbit action cancels the current auto-flight until the next step.
    const easing=clamp(1-Math.exp(-5.8*clamp(dt,0,.1)),0,1);
    theta+=(targetCamera.theta-theta)*easing;
    phi+=(targetCamera.phi-phi)*easing;
    distance+=(targetCamera.distance-distance)*easing;
    centerY+=(targetCamera.y-centerY)*easing;
    centerX+=(targetCamera.x-centerX)*easing;
    centerZ+=(targetCamera.z-centerZ)*easing;
    const dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.floor(canvas.clientWidth*dpr)),h=Math.max(1,Math.floor(canvas.clientHeight*dpr));
    if (canvas.width!==w || canvas.height!==h) {canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const center=[centerX,centerY,centerZ];
    // Portrait viewports need a wider framing without modifying saved camera
    // presets; avoid cropping the outer exploded panels on small screens.
    const frameDistance=distance*Math.max(1,Math.min(1.85,1.5/(w/h)));
    const eye=[center[0]+frameDistance*Math.sin(phi)*Math.sin(theta),center[1]+frameDistance*Math.cos(phi),center[2]+frameDistance*Math.sin(phi)*Math.cos(theta)];
    const vp=multiply(perspective(43*Math.PI/180,w/h,.05,30),lookAt(eye,center));
    gl.useProgram(p);
    const focus=new Set(activeParts);
    function drawMesh(pose,size,geometry,color,edgeColor,wire=true) {
      const mesh=geometry==='cylinder'?cylinder:box;
      const model=modelMatrix(pose,size),mvp=multiply(vp,model);
      gl.uniformMatrix4fv(locations.mvp,false,mvp);gl.uniformMatrix4fv(locations.model,false,model);
      gl.uniform1f(locations.edge,0);gl.uniform3fv(locations.color,color);
      gl.bindVertexArray(mesh.surface.vao);gl.drawArrays(gl.TRIANGLES,0,mesh.surface.length);drawCalls++;
      if (wire) {
        gl.uniform1f(locations.edge,1);gl.uniform3fv(locations.color,edgeColor);
        gl.bindVertexArray(mesh.outline.vao);gl.drawArrays(gl.LINES,0,mesh.outline.length);drawCalls++;
      }
    }
    // The environment and decorative props are deliberately schematic; no
    // sourced room art, vendor assets or external 3D dependencies are loaded.
    if(mode==='room'){
      const bounds=manual.dimensions;
      const floorWidth=Math.max(2.65,bounds.width*1.5),floorDepth=Math.max(2.4,bounds.depth*1.8);
      const terrain=manual.category==='outdoor'||manual.category==='architecture';
      const floorY=manual.category==='electronics'?-0.14:-.075;
      drawMesh({x:0,y:floorY,z:0},[floorWidth,.06,floorDepth],'box',terrain?[.71,.77,.66]:[.84,.82,.76],terrain?[.69,.74,.65]:[.84,.82,.76],false);
      if(manual.category==='furniture'){
        drawMesh({x:0,y:floorY+.033,z:.17},[Math.min(2.7,floorWidth*.72),.006,Math.min(2.1,floorDepth*.65)],'box',[.90,.86,.75],[.90,.86,.75],false);
        // Books, lamp and plant form a recognizable but lightweight room.
        const side=manual.id==='table-concept'?1.25:1.7;
        drawMesh({x:side,y:.35,z:-.85},[.07,.7,.07],'cylinder',[.50,.52,.47],[.50,.52,.47],false);
        drawMesh({x:side,y:.75,z:-.85},[.27,.16,.27],'cylinder',[.94,.86,.69],[.80,.75,.60],false);
        drawMesh({x:-side,y:.12,z:-.8},[.23,.25,.23],'cylinder',[.59,.50,.40],[.59,.50,.40],false);
        for(const offset of [-.07,0,.08])drawMesh({x:-side+offset,y:.37+Math.abs(offset),z:-.80},[.08,.43,.12],'box',[.45,.63,.42],[.45,.63,.42],false);
      }else if(manual.category==='electronics'){
        drawMesh({x:0,y:-.18,z:0},[1.12,.07,.8],'box',[.60,.45,.33],[.60,.45,.33],false);
        for(const x of [-.45,.45])for(const z of [-.27,.27])drawMesh({x,y:-.52,z},[.04,.67,.04],'box',[.49,.51,.48],[.49,.51,.48],false);
      }
    }
    for (const part of manual.parts) {
      if (!visibleAtStage(part,stage)) continue;
      const pose=interpolatePose(part,stage);
      const fraction=clamp(stage-part.installStep+1,0,1);
      const highlighted=focus.has(part.id);
      const color=mode==='drawing'
        ? (highlighted?[.58,.77,.36]:fraction===0?[.95,.96,.94]:part.kind==='hardware'?[.42,.47,.47]:[.98,.98,.96])
        : (highlighted?tones.active:fraction===0?tones.future:(tones[part.tone]??(part.kind==='hardware'?tones.metal:tones.complete)));
      const edge=mode==='drawing'
        ? (highlighted?[.25,.45,.20]:fraction===0?[.66,.72,.68]:[.22,.32,.28])
        : tones.edge;
      drawMesh(pose,part.size,part.shape,color,edge);
    }
    // Non-instructional tool cue: independently drawn props, not inventory.
    // Driven by stage progress so scrubbing backwards reverses the motion.
    if(step?.tool && mode==='room'){
      const part=manual.parts.find(p=>p.id===step.tool.target);
      if(part){
        const t=installationFraction(part,stage);
        const at=part.end,span=Math.min(.28,Math.max(.12,manual.dimensions.height*.14));
        const x=at.x+.04,y=at.y+span*.78+(1-t)*span*.25,z=at.z+.065;
        if(step.tool.kind==='hammer'||step.tool.kind==='mallet'){
          const tilt=-.35*t;
          drawMesh({x,y,z,rz:tilt},[.023,span,.023],'cylinder',[.38,.28,.20],[.29,.23,.17],false);
          drawMesh({x,y:y+span*.43,z,rz:tilt},[.14,.04,.055],'box',[.49,.57,.55],[.32,.37,.34]);
        }else{
          drawMesh({x,y:y-span*.19,z,ry:t*Math.PI*2},[.012,span*.63,.012],'cylinder',[.56,.59,.61],[.35,.4,.42],false);
          drawMesh({x,y:y+span*.28,z,ry:t*Math.PI*2},[.043,span*.47,.043],'cylinder',step.tool.kind==='drill'?[.45,.56,.36]:[.21,.33,.28],[.18,.26,.22]);
        }
      }
    }
    gl.bindVertexArray(null);
  }
  function destroy() {
    canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);
    canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',onUp);
    canvas.removeEventListener('wheel',onWheel);canvas.removeEventListener('dblclick',onDblClick);
    for (const mesh of [box.surface,box.outline,cylinder.surface,cylinder.outline]) {
      gl.deleteVertexArray(mesh.vao);gl.deleteBuffer(mesh.vbo);
    }
    gl.deleteProgram(p);
  }
  return {draw,reset:onReset,destroy,focusStep,setMode,metrics:()=>({drawCalls,visibleParts:manual.parts.filter(p=>visibleAtStage(p,stage)).length})};
}
