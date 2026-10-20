import {bookcase} from './catalog/billy.js';
import {validateManual,installedCount,activeStepIndex,clamp} from './core/assembly.js';
import {makeViewer} from './engine/webgl.js';

const errors=validateManual(bookcase);
if (errors.length) throw new Error(`Invalid bookcase sample: ${errors.join('; ')}`);
const $=id=>document.getElementById(id);
const list=$('step-list'),slider=$('scrub'),play=$('play');
let target=0,current=0,playing=false,lastTime=null,playDwell=0,selected=0,viewer=null;
const buttons=bookcase.steps.map((step,index)=>{
  const b=document.createElement('button');b.type='button';b.className='step';
  b.setAttribute('aria-label',`Step ${index}: ${step.title}`);
  const number=document.createElement('span');number.className='step-number';number.textContent=String(index).padStart(2,'0');
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
function updateUI() {
  const step=bookcase.steps[selected];
  $('current-number').textContent=String(selected).padStart(2,'0');
  $('current-title').textContent=step.title;
  $('current-detail').textContent=step.detail;
  $('step-count').textContent=`${String(selected).padStart(2,'0')} / ${String(bookcase.steps.length-1).padStart(2,'0')}`;
  slider.value=String(target);
  slider.style.setProperty('--percent',`${100*target/(bookcase.steps.length-1)}%`);
  $('progress-parts').textContent=`${installedCount(bookcase,current)} / ${bookcase.parts.length} PARTS PLACED`;
  for(const [i,b] of buttons.entries()){
    b.classList.toggle('is-active',i===selected);
    if(i===selected)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');
  }
  $('prev').disabled=selected===0;
  $('next').disabled=selected===bookcase.steps.length-1;
}
function selectStep(index,{fromPlayback=false}={}) {
  target=clamp(index,0,bookcase.steps.length-1);
  selected=activeStepIndex(bookcase,target);
  if(!fromPlayback)setPlaying(false);
  playDwell=0;updateUI();
}
$('prev').addEventListener('click',()=>selectStep(selected-1));
$('next').addEventListener('click',()=>selectStep(selected+1));
$('reset-camera').addEventListener('click',()=>viewer?.reset());
slider.addEventListener('input',()=>{setPlaying(false);target=Number(slider.value);selected=activeStepIndex(bookcase,target);updateUI();});
play.addEventListener('click',()=>{
  if(playing){setPlaying(false);return;}
  if(target>=bookcase.steps.length-1){target=0;current=0;selected=0;}
  setPlaying(true);playDwell=0;updateUI();
});
document.addEventListener('keydown',e=>{
  const tag=e.target?.tagName;
  if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;
  if(e.key==='ArrowLeft')selectStep(selected-1);
  if(e.key==='ArrowRight')selectStep(selected+1);
  if(e.key===' '){e.preventDefault();play.click();}
});
try{viewer=makeViewer($('viewer'),bookcase);document.body.dataset.renderReady='true';}
catch(e){document.body.dataset.renderReady='false';$('render-error').textContent=String(e.message||e);$('render-error').hidden=false;}
function frame(timestamp){
  if(lastTime===null)lastTime=timestamp;
  const dt=Math.min(0.05,(timestamp-lastTime)/1000);lastTime=timestamp;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(playing){
    if(Math.abs(target-current)<0.016){
      playDwell+=dt;
      if(playDwell>0.78){
        if(selected>=bookcase.steps.length-1){setPlaying(false);}
        else selectStep(selected+1,{fromPlayback:true});
        playDwell=0;
      }
    }
  }
  const blend=reduced?1:1-Math.exp(-4.8*dt);
  current+=(target-current)*blend;
  if(Math.abs(target-current)<.002)current=target;
  const focus=bookcase.steps[activeStepIndex(bookcase,target)].parts;
  viewer?.draw(current,focus);
  $('progress-parts').textContent=`${installedCount(bookcase,current)} / ${bookcase.parts.length} PARTS PLACED`;
  document.body.dataset.step=String(selected);
  requestAnimationFrame(frame);
}
updateUI();requestAnimationFrame(frame);
