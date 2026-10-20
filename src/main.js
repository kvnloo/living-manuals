import {projects,projectById} from './catalog/projects.js';
import {validateProject,importProjectJSON,exportProjectJSON,stepPrerequisites} from './core/project.js';
import {inventoryAtStage,activeStepIndex,clamp} from './core/assembly.js';
import {elevationPrimitives} from './core/elevation.js';
import {makeViewer} from './engine/webgl.js';

const $=id=>document.getElementById(id);
const SVGNS='http://www.w3.org/2000/svg';
const pad=index=>String(index+1).padStart(2,'0');
const list=$('step-list'),slider=$('scrub'),play=$('play'),dialog=$('manual-dialog');
const picker=$('project-picker');
const labels={panel:'PANELS',hardware:'HARDWARE',fixture:'STRUCTURE',component:'COMPONENTS',material:'MATERIALS'};
let manual=projects[0],target=0,current=0,playing=false,lastTime=null,playDwell=0,selected=0,viewer=null,buttons=[];
let sceneMode='room';
const $status=$('project-message');
function status(message='',error=false){
  $status.hidden=!message;$status.textContent=message;
  $status.dataset.error=String(error);
}
function setPlaying(value){
  playing=value;play.setAttribute('aria-pressed',String(value));
  // Only the constant UI symbols are parsed as markup; data is textContent only.
  play.innerHTML=value?'Ⅱ <span>PAUSE</span>':'▶ <span>PLAY</span>';
  play.setAttribute('aria-label',value?'Pause assembly sequence':'Play assembly sequence');
}
function makeSvgElement(primitive){
  const element=document.createElementNS(SVGNS,primitive.type);
  for(const [key,value] of Object.entries(primitive)){
    if(!['type','id','active','ghost'].includes(key))element.setAttribute(key,String(value));
  }
  element.classList.add('elevation-shape',primitive.active?'is-highlight':primitive.ghost?'is-ghost':'is-installed');
  return element;
}
function fillSchematic(svg,index){
  svg.replaceChildren(...elevationPrimitives(manual,index).map(makeSvgElement));
  svg.setAttribute('aria-label',`Independent geometry study of ${manual.title}, step ${index+1}: ${manual.steps[index].title}`);
}
function renderElevation(){
  fillSchematic($('schematic'),selected);
  fillSchematic($('fallback-svg'),selected);
  const step=manual.steps[selected];
  $('operation-summary').textContent=step.title;
  $('operation-phase').textContent=`CURRENT OPERATION · ${(step.phase??'Explore').toUpperCase()}`;
  $('operation-note').textContent=step.caution??(step.safety?
    'Before performing physical work, consult the precise verified source, applicable codes and safety instructions.':
    `${step.parts.length} illustrated ${step.parts.length===1?'part':'parts'} involved. Placement and operations are not physically verified.`);
  const prereqs=stepPrerequisites(manual,selected);
  $('operation-prerequisites').textContent=prereqs.length ?
    `Earlier context: ${prereqs.map(r=>manual.steps[r.index].title).join(' · ')}`:
    `Phase: ${step.phase??'Explore'} · ${manual.review.status.toUpperCase()} STUDY`;
  const cue=$('tool-cue');cue.hidden=!step.tool;
  if(step.tool)cue.textContent=`3D ${(step.tool.kind==='driver'?'screwdriver':step.tool.kind)} cue — motion and alignment only, never a torque or tool-use instruction.`;
}
function makeCounterItems(){
  const root=$('inventory-counters');root.replaceChildren();
  const totals=inventoryAtStage(manual,0);
  for(const kind of Object.keys(totals)){
    const item=document.createElement('span');item.id=`progress-${kind==='panel'?'panels':kind}`;
    item.dataset.kind=kind;
    root.append(item);
  }
}
function updateProgress(){
  const inventory=inventoryAtStage(manual,current);
  for(const node of $('inventory-counters').children){
    const kind=node.dataset.kind;
    const entry=inventory[kind];node.textContent=`${entry.installed} / ${entry.total} ${labels[kind]??kind.toUpperCase()}`;
  }
}
function updateUI(){
  const step=manual.steps[selected];
  $('current-number').textContent=pad(selected);
  $('current-title').textContent=step.title;
  $('current-detail').textContent=step.detail;
  $('step-count').textContent=`${pad(selected)} / ${pad(manual.steps.length-1)}`;
  slider.value=String(target);
  slider.style.setProperty('--percent',`${100*target/(manual.steps.length-1)}%`);
  slider.setAttribute('aria-valuetext',`Step ${selected+1} of ${manual.steps.length}: ${step.title}`);
  updateProgress();renderElevation();
  for(const [i,button] of buttons.entries()){
    button.classList.toggle('is-active',i===selected);
    if(i===selected)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
  }
  $('prev').disabled=selected===0;
  $('next').disabled=selected===manual.steps.length-1;
  if(buttons.length && list.scrollHeight>list.clientHeight){
    const active=buttons[selected].getBoundingClientRect(),bounds=list.getBoundingClientRect();
    if(active.bottom>bounds.bottom)list.scrollTop+=active.bottom-bounds.bottom+2;
    else if(active.top<bounds.top)list.scrollTop-=bounds.top-active.top+2;
  }
}
function selectStep(index,{fromPlayback=false,immediate=false}={}){
  target=clamp(index,0,manual.steps.length-1);
  selected=activeStepIndex(manual,target);
  if(!fromPlayback)setPlaying(false);
  if(immediate)current=target;
  viewer?.focusStep(manual.steps[selected],{immediate});
  playDwell=0;updateUI();
}
function buildSteps(){
  buttons=[];list.replaceChildren();
  for(const [index,step] of manual.steps.entries()){
    const button=document.createElement('button');button.type='button';button.className='step';
    button.setAttribute('aria-label',`Step ${index+1} of ${manual.steps.length}: ${step.title}`);
    const number=document.createElement('span');number.className='step-number';number.textContent=pad(index);
    const body=document.createElement('span');body.className='step-body';
    const title=document.createElement('span');title.className='step-title';title.textContent=step.title;
    const hint=document.createElement('span');hint.className='step-hint';hint.textContent=step.hint??step.phase??'Explore';
    body.append(title,hint);button.append(number,body);
    button.addEventListener('click',()=>selectStep(index));list.append(button);buttons.push(button);
  }
}
function fmtCm(value){return Math.round(value*100);}
function safeExternal(url){try{const a=new URL(url);if(a.protocol==='https:' && !a.username && !a.password && a.hostname.includes('.'))return a.href;}catch{}return 'https://github.com/kvnloo/living-manuals';}
function buildPicker(){
  picker.replaceChildren();
  for(const [index,project] of projects.entries()){
    const b=document.createElement('button');b.type='button';b.className='project-option';
    b.textContent=project.shortTitle??project.title;b.dataset.projectId=project.id;
    b.title=project.description??project.subtitle;b.setAttribute('aria-pressed',String(project.id===manual.id));
    b.addEventListener('click',()=>activateProject(project));picker.append(b);
  }
  if(!projects.includes(manual)){
    const b=document.createElement('button');b.type='button';b.className='project-option';
    b.textContent=manual.shortTitle??manual.title;b.dataset.projectId=manual.id;b.setAttribute('aria-pressed','true');
    b.addEventListener('click',()=>activateProject(manual));picker.append(b);
  }
  for(const b of picker.children)b.setAttribute('aria-pressed',String(b.dataset.projectId===manual.id));
}
function applyMeta(){
  const p=manual;
  $('product-category').textContent=`CONCEPT / ${p.category.toUpperCase()} · HUMAN REVIEW REQUIRED`;
  $('product-title').textContent=p.shortTitle??p.title;
  $('product-subtitle').textContent=p.subtitle??'Independent geometric study';
  const d=p.dimensions;
  $('product-dimensions').textContent=`W ${fmtCm(d.width)} × D ${fmtCm(d.depth)} × H ${fmtCm(d.height)} CM (EST.)`;
  $('manual-range').textContent=`01 — ${pad(p.steps.length-1)}`;
  $('viewer-title').textContent=p.title;
  $('project-warning').textContent=(p.cautions?.[0]??'Illustrative only.')+' Never substitute this study for manufacturer guidance or an approved construction plan.';
  $('scrub-count').textContent=String(p.steps.length);
  slider.max=String(p.steps.length-1);
  slider.value='0';
  $('viewer').setAttribute('aria-label',`Interactive 3D concept model for ${p.title}; drag or use two fingers to orbit and zoom`);
  $('source-manual-link').href=safeExternal(p.source?.url);
  $('source-manual-link').textContent=`Source / ${p.source?.creator??'contributors'} ↗`;
  buildPicker();buildSteps();makeCounterItems();
}
function activateProject(next){
  const errors=validateProject(next);
  if(errors.length){status(`Invalid project: ${errors.slice(0,3).join('; ')}`,true);return false;}
  setPlaying(false);viewer?.destroy();viewer=null;
  manual=next;target=0;current=0;selected=0;playDwell=0;
  $('render-error').hidden=true;$('viewer-fallback').hidden=true;
  applyMeta();
  try{
    viewer=makeViewer($('viewer'),manual);
    viewer.setMode(sceneMode);
    viewer.focusStep(manual.steps[0],{immediate:true});
    document.body.dataset.renderReady='true';
  }catch(error){
    document.body.dataset.renderReady='false';
    $('render-error').textContent=String(error.message||error);
    $('render-error').hidden=false;$('viewer-fallback').hidden=false;
  }
  document.body.dataset.project=manual.id;
  document.body.dataset.step='0';
  updateUI();return true;
}
function openManual(){
  const root=$('manual-steps');root.replaceChildren();
  $('manual-dialog-title').textContent=`${manual.shortTitle??manual.title} / interactive guide`;
  $('manual-dialog-subtitle').textContent=`${manual.steps.length} conceptual stages · generated schematic vectors, not source instructions.`;
  for(const [index,step] of manual.steps.entries()){
    const row=document.createElement('article');row.className='manual-card';
    const header=document.createElement('div');
    const number=document.createElement('span');number.className='manual-card-step';number.textContent=`${pad(index)} / ${step.phase??'Explore'}`;
    const title=document.createElement('h3');title.textContent=step.title;
    const copy=document.createElement('p');copy.textContent=step.caution??step.detail;
    header.append(number,title,copy);
    const fig=document.createElementNS(SVGNS,'svg');fig.setAttribute('viewBox','0 0 220 205');
    fig.setAttribute('role','img');fig.setAttribute('aria-label',`Schematic for step ${index+1}`);
    fillSchematic(fig,index);
    const jump=document.createElement('button');jump.type='button';jump.textContent='VIEW IN 3D →';
    jump.addEventListener('click',()=>{dialog.close();selectStep(index);});
    row.append(header,fig,jump);root.append(row);
  }
  dialog.showModal();
}
$('manual-open').addEventListener('click',openManual);
$('prev').addEventListener('click',()=>selectStep(selected-1));
$('next').addEventListener('click',()=>selectStep(selected+1));
$('reset-camera').addEventListener('click',()=>viewer?.reset());
slider.addEventListener('input',()=>{
  setPlaying(false);target=Number(slider.value);
  const nextIndex=activeStepIndex(manual,target);
  if(nextIndex!==selected){selected=nextIndex;viewer?.focusStep(manual.steps[selected]);}
  updateUI();
});
play.addEventListener('click',()=>{
  if(playing){setPlaying(false);return;}
  if(target>=manual.steps.length-1){target=0;current=0;selected=0;viewer?.focusStep(manual.steps[0],{immediate:true});}
  setPlaying(true);playDwell=0;updateUI();
});
for(const mode of ['room','drawing']){
  $(`view-${mode}`).addEventListener('click',()=>{
    sceneMode=mode;viewer?.setMode(mode);document.body.dataset.viewMode=mode;
    for(const m of ['room','drawing'])$(`view-${m}`).setAttribute('aria-pressed',String(m===mode));
  });
}
$('export-project').addEventListener('click',()=>{
  try{
    const data=exportProjectJSON(manual);
    const objectUrl=URL.createObjectURL(new Blob([data],{type:'application/json'}));
    const a=document.createElement('a');a.href=objectUrl;a.download=`${manual.id}-illustrative.json`;
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);
    status('Downloaded an illustrative, unverified AssemblySpec.');
  }catch(error){status(error.message,true);}
});
$('import-project').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
    if(file.size>1_000_000)throw new Error('JSON must be smaller than 1 MB');
    const project=importProjectJSON(await file.text());
    if(activateProject(project))status(`Imported ${project.title} as an UNVERIFIED concept; independent review required.`);
  }catch(error){status(`Import rejected: ${error.message}`,true);}
  finally{e.target.value='';}
});
document.body.dataset.viewMode='room';
document.addEventListener('keydown',e=>{
  if(dialog.open)return;
  const tag=e.target?.tagName;
  if(['INPUT','TEXTAREA','SELECT','BUTTON'].includes(tag) || e.target?.isContentEditable || e.altKey || e.ctrlKey || e.metaKey)return;
  if(e.key==='ArrowLeft'){e.preventDefault();selectStep(selected-1);}
  if(e.key==='ArrowRight'){e.preventDefault();selectStep(selected+1);}
  if(e.key===' '){e.preventDefault();play.click();}
  if(e.key.toLowerCase()==='m')openManual();
});
function frame(timestamp){
  if(lastTime===null)lastTime=timestamp;
  const dt=Math.min(.05,Math.max(0,(timestamp-lastTime)/1000));lastTime=timestamp;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(playing && Math.abs(target-current)<.016){
    playDwell+=dt;
    if(playDwell>.78){
      if(selected>=manual.steps.length-1)setPlaying(false);
      else selectStep(selected+1,{fromPlayback:true});
      playDwell=0;
    }
  }
  const blend=reduced?1:1-Math.exp(-4.8*dt);
  current+=(target-current)*blend;
  if(Math.abs(target-current)<.002)current=target;
  viewer?.draw(current,manual.steps[selected].parts,dt,manual.steps[selected]);
  updateProgress();
  document.body.dataset.step=String(selected);
  requestAnimationFrame(frame);
}
const query=new URLSearchParams(location.search);
const initial=projectById(query.get('project'))??projects[0];
activateProject(initial);
requestAnimationFrame(frame);
