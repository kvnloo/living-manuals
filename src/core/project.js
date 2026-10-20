/** Generic project operations. No part of this module performs assembly work. */
import {validateManual} from './assembly.js';

export const SUPPORTED_SCHEMA_VERSION=1;
const goodId = s => typeof s==='string' && /^[a-z][a-z0-9-]{0,63}$/.test(s);
const url = text => {try {const u=new URL(text); return u.protocol==='https:' && !u.username && !u.password && !!u.hostname && u.hostname.includes('.');} catch {return false;}};

export function validateProject(project){
  const errors=validateManual(project);
  if (!project || typeof project !== 'object' || !Array.isArray(project.steps) || !Array.isArray(project.parts)) return errors;
  if (project.schemaVersion!==SUPPORTED_SCHEMA_VERSION) errors.push('Unsupported schemaVersion');
  if (!goodId(project.id)) errors.push('Invalid project ID');
  if (typeof project.title!=='string' || !project.title.trim() || project.title.length>140) errors.push('Invalid project title');
  if (!['furniture','architecture','outdoor','electronics','custom'].includes(project.category)) errors.push('Invalid project category');
  if (!project.review || project.review.status!=='illustrative' || project.review.requiresHumanApproval!==true) errors.push('Imported study must be marked illustrative and require human approval');
  if (!project.source || typeof project.source.creator!=='string' || !project.source.creator.trim() || !url(project.source.url)) errors.push('Source creator and public HTTPS URL required');
  if (project.approximate!==true || project.inventoryStatus!=='ILLUSTRATIVE_NOT_VENDOR_VERIFIED') errors.push('Unreviewed project must retain explicit illustrative status');
  if (project.units!=='metres') errors.push('Only metre-based geometry is supported');
  if (!project.dimensions || !['width','height','depth'].every(k=>typeof project.dimensions[k]==='number' && Number.isFinite(project.dimensions[k]) && project.dimensions[k]>0 && project.dimensions[k]<1000)) errors.push('Invalid project dimensions');
  if (!Array.isArray(project.parts) || project.parts.length>500) errors.push('A project supports at most 500 rendered parts');
  if (!Array.isArray(project.steps) || project.steps.length>120) errors.push('A project supports 2 to 120 steps');
  const known=new Set(project.steps?.map(s=>s?.id)??[]);
  const parts=new Set(project.parts?.map(p=>p?.id)??[]);
  const seen=new Set();
  for(const step of project.steps??[]){
    if (!step || typeof step!=='object') continue;
    if(!goodId(step.id)) errors.push(`Invalid step ID ${step.id}`);
    if(typeof step.title!=='string' || !step.title.trim() || step.title.length>140) errors.push(`Invalid title in ${step.id}`);
    if(typeof step.detail!=='string' || step.detail.length>1200) errors.push(`Invalid detail in ${step.id}`);
    if(step.phase!==undefined && (typeof step.phase!=='string' || step.phase.length>80)) errors.push(`Invalid phase in ${step.id}`);
    if(step.caution!==undefined && (typeof step.caution!=='string' || step.caution.length>1000)) errors.push(`Invalid caution in ${step.id}`);
    if(step.requires!==undefined){
      if(!Array.isArray(step.requires) || step.requires.length>30) errors.push(`Invalid prerequisites for ${step.id}`);
      else for(const r of step.requires){
        if(!known.has(r)) errors.push(`Unknown prerequisite ${r} in ${step.id}`);
        else if(!seen.has(r)) errors.push(`Prerequisite ${r} must precede ${step.id}`);
      }
    }
    if(step.tool){
      const t=step.tool;
      if(!t || !['driver','hammer','drill','mallet','wrench'].includes(t.kind) || !['align','tap','turn'].includes(t.action) || !parts.has(t.target) || !(step.parts??[]).includes(t.target)) errors.push(`Invalid tool cue in ${step.id}`);
    }
    seen.add(step.id);
  }
  return errors;
}

/** A new copy preserves provenance but can never convert an upload to 'approved'. */
export function importProjectJSON(source){
  if(typeof source!=='string' || source.length>1_000_000) throw new Error('Project JSON must be under 1 MB');
  let project;
  try{project=JSON.parse(source);}catch{throw new Error('Project must be valid JSON');}
  const errors=validateProject(project);
  if(errors.length) throw new Error(errors.slice(0,5).join('; '));
  return project;
}
export function exportProjectJSON(project){
  const errors=validateProject(project);
  if(errors.length) throw new Error(errors.slice(0,5).join('; '));
  return JSON.stringify(project,null,2)+'\n';
}
export function projectPhases(project){
  const phases=[];
  for(const step of project.steps){const phase=step.phase??'Explore';if(!phases.includes(phase))phases.push(phase);}
  return phases;
}
export function stepPrerequisites(project,stepIndex){
  const index=new Map(project.steps.map((s,i)=>[s.id,i]));
  return (project.steps[stepIndex]?.requires??[]).map(id=>({id,index:index.get(id)}));
}
