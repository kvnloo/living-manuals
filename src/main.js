import {bookcase} from './catalog/billy.js';
import {validateManual,inventoryAtStage,activeStepIndex,clamp} from './core/assembly.js';
import {elevationPrimitives} from './core/elevation.js';
import {makeViewer} from './engine/webgl.js';

const errors=validateManual(bookcase);
if (errors.length) throw new Error(`Invalid bookcase sample: ${errors.join('; ')}`);
const $=id=>document.getElementById(id);
const list=$('step-list'),slider=$('scrub'),play=$('play');
const pad=n=>String(n+1).padStart(2,'0');
const SVGNS='http://www.w3.org/2000/svg';
let target=0,current=0,playing=false,lastTime=null,playDwell=0,selected=0,viewer=null;

const buttons=bookcase.steps.map((step,index)=>{
  const b=document.createElement('button');b.type='button';b.className='step';
  b.setAttribute('aria-label',`Step ${index+1} of ${bookcase.steps.length}: ${step.title}`);
  const number=document.createElement('span');number.className='step-number';number.textContent=pad(index);
  const body=document.createElement('span');body.className='step-body';
  const title=document.createElement('span');title.className='step-title';title.textContent=step.title;
  const hint=document.createElement('span');hint.className='step-hint';hint.textContent=step.hint;
  body.append(title,hint);b.append(number,body);
  b.addEventListener('click',()=>selectStep(index));list.append(b);return b;
});
function setPlaying(value) {
  playing=value;play.setAttribute('aria-pressed',String(value));
  play.innerHTML=value?'Ⅱ <span>PAUSE</span>':'▶ <span>PLAY</span>';
  play.setAttribute('aria-label',value?'Pause assembly sequence':'Play assembly sequence');
}
function renderElevation() {
  const svg=$('schematic');
  svg.replaceChildren();
  for (const primitive of elevationPrimitives(bookcase,selected)) {
    const element=document.createElementNS(SVGNS,primitive.type);
    for (const [key,value] of Object.entries(primitive)) {
      if (!['type','id','active','ghost'].includes(key)) element.setAttribute(key,String(value));
    }
    element.classList.add('elevation-shape',primitive.active?'is-highlight':primitive.ghost?'is-ghost':'is-installed');
    svg.append(element);
  }
  const step=bookcase.steps[selected];
  svg.setAttribute('aria-label',`Illustrative front elevation at step ${selected+1}: ${step.title}`);
  $('operation-summary').textContent=step.title;
  $('operation-note').textContent=step.safety
    ? 'Safety is not shown as a build step. Consult the exact manufacturer manual.'
    : `${step.parts.length} individual illustrative ${step.parts.length===1?'object':'objects'} in this step. Their placement is not a physical assembly instruction.`;
}
function updateProgress() {
  const {panel,hardware}=inventoryAtStage(bookcase,current);
  $('progress-panels').textContent=`${panel.installed} / ${panel.total} PANELS`;
  $('progress-hardware').textContent=`${hardware.installed} / ${hardware.total} HARDWARE`;
}
function updateUI() {
  const step=bookcase.steps[selected];
  $('current-number').textContent=pad(selected);
  $('current-title').textContent=step.title;
  $('current-detail').textContent=step.detail;
  $('step-count').textContent=`${pad(selected)} / ${pad(bookcase.steps.length-1)}`;
  slider.value=String(target);
  slider.style.setProperty('--percent',`${100*target/(bookcase.steps.length-1)}%`);
  slider.setAttribute('aria-valuetext',`Step ${selected+1} of ${bookcase.steps.length}: ${step.title}`);
  updateProgress();
  renderElevation();
  for(const [i,b] of buttons.entries()){
    b.classList.toggle('is-active',i===selected);
    if(i===selected)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');
  }
  $('prev').disabled=selected===0;
  $('next').disabled=selected===bookcase.steps.length-1;
  if(list.scrollHeight>list.clientHeight){
    const active=buttons[selected].getBoundingClientRect(),bounds=list.getBoundingClientRect();
    if(active.bottom>bounds.bottom)list.scrollTop+=active.bottom-bounds.bottom+2;
    else if(active.top<bounds.top)list.scrollTop-=bounds.top-active.top+2;
  }
}
function selectStep(index,{fromPlayback=false}={}) {
  target=clamp(index,0,bookcase.steps.length-1);
  selected=activeStepIndex(bookcase,target);
  if(!fromPlayback)setPlaying(false);
  viewer?.focusStep(bookcase.steps[selected]);
  playDwell=0;updateUI();
}
$('prev').addEventListener('click',()=>selectStep(selected-1));
$('next').addEventListener('click',()=>selectStep(selected+1));
$('reset-camera').addEventListener('click',()=>viewer?.reset());
slider.addEventListener('input',()=>{
  setPlaying(false);target=Number(slider.value);
  const nextIndex=activeStepIndex(bookcase,target);
  if(nextIndex!==selected){selected=nextIndex;viewer?.focusStep(bookcase.steps[selected]);}
  updateUI();
});
play.addEventListener('click',()=>{
  if(playing){setPlaying(false);return;}
  if(target>=bookcase.steps.length-1){target=0;current=0;selected=0;viewer?.focusStep(bookcase.steps[0],{immediate:true});}
  setPlaying(true);playDwell=0;updateUI();
});
for(const mode of ['room','drawing']){
  $(`view-${mode}`).addEventListener('click',()=>{
    viewer?.setMode(mode);
    document.body.dataset.viewMode=mode;
    for(const m of ['room','drawing'])$(`view-${m}`).setAttribute('aria-pressed',String(m===mode));
  });
}
document.body.dataset.viewMode='room';
document.addEventListener('keydown',e=>{
  const tag=e.target?.tagName;
  if(['INPUT','TEXTAREA','SELECT','BUTTON'].includes(tag) || e.target?.isContentEditable || e.altKey || e.ctrlKey || e.metaKey)return;
  if(e.key==='ArrowLeft')selectStep(selected-1);
  if(e.key==='ArrowRight')selectStep(selected+1);
  if(e.key===' '){e.preventDefault();play.click();}
});
try{
  viewer=makeViewer($('viewer'),bookcase);
  viewer.focusStep(bookcase.steps[0],{immediate:true});
  document.body.dataset.renderReady='true';
}catch(e){
  document.body.dataset.renderReady='false';
  $('render-error').textContent=String(e.message||e);
  $('render-error').hidden=false;
  $('viewer-fallback').hidden=false;
}
function frame(timestamp){
  if(lastTime===null)lastTime=timestamp;
  const dt=Math.min(0.05,Math.max(0,(timestamp-lastTime)/1000));lastTime=timestamp;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(playing && Math.abs(target-current)<0.016){
    playDwell+=dt;
    if(playDwell>0.78){
      if(selected>=bookcase.steps.length-1)setPlaying(false);
      else selectStep(selected+1,{fromPlayback:true});
      playDwell=0;
    }
  }
  const blend=reduced?1:1-Math.exp(-4.8*dt);
  current+=(target-current)*blend;
  if(Math.abs(target-current)<.002)current=target;
  const focus=bookcase.steps[activeStepIndex(bookcase,target)].parts;
  viewer?.draw(current,focus,dt);
  updateProgress();
  document.body.dataset.step=String(selected);
  requestAnimationFrame(frame);
}
updateUI();requestAnimationFrame(frame);
