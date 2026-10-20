import test from 'node:test';
import assert from 'node:assert/strict';
import {projects,projectById} from '../src/catalog/projects.js';
import {validateProject,importProjectJSON,exportProjectJSON,projectPhases,stepPrerequisites} from '../src/core/project.js';
import {inventoryAtStage,installationFraction,interpolatePose,installedCount} from '../src/core/assembly.js';
import {elevationPrimitives} from '../src/core/elevation.js';

const copy=value=>structuredClone(value);
test('all five independent studies pass the versioned schema, part ownership and step graph',()=>{
  assert.equal(projects.length,5);
  assert.equal(new Set(projects.map(p=>p.id)).size,5);
  for(const p of projects){
    assert.deepEqual(validateProject(p),[],p.id);
    assert.equal(projectById(p.id),p);
    assert.equal(installedCount(p,0),0,p.id);
    assert.equal(installedCount(p,p.steps.length-1),p.parts.length,p.id);
    assert.ok(projectPhases(p).length>=1,p.id);
    for(let s=0;s<p.steps.length;s++){
      const sheet=elevationPrimitives(p,s);
      assert.ok(sheet.length<=p.parts.length,p.id);
      for(const vector of sheet){
        for(const key of ['x','y','width','height','cx','cy','r']){
          if(key in vector) assert.ok(Number.isFinite(vector[key]),`${p.id}: ${vector.id}.${key}`);
        }
      }
      for(const dep of stepPrerequisites(p,s)) assert.ok(dep.index<s,`${p.id}: forward prerequisite`);
    }
  }
});

test('final category counts sum to all parts and never decrease during reverse scrubbing',()=>{
  for(const p of projects){
    let prev=inventoryAtStage(p,0);
    for(let step=1;step<=p.steps.length-1;step++){
      const next=inventoryAtStage(p,step);
      for(const category of Object.keys(next)){
        assert.ok(next[category].installed>=prev[category].installed,`${p.id}/${category}`);
      }
      prev=next;
    }
    const end=inventoryAtStage(p,p.steps.length-1);
    assert.equal(Object.values(end).reduce((count,group)=>count+group.total,0),p.parts.length);
    assert.equal(Object.values(end).reduce((count,group)=>count+group.installed,0),p.parts.length);
    for(const part of p.parts){
      assert.deepEqual(interpolatePose(part,part.installStep-1),part.start);
      assert.deepEqual(interpolatePose(part,part.installStep),part.end);
      assert.equal(installationFraction(part,part.installStep-.5),.5);
    }
  }
});

test('manual JSON roundtrips but does not silently upgrade its source or approval',()=>{
  for(const project of projects){
    const raw=exportProjectJSON(project);
    const parsed=importProjectJSON(raw);
    assert.deepEqual(parsed,project);
    assert.equal(parsed.review.status,'illustrative');
    assert.equal(parsed.review.requiresHumanApproval,true);
    assert.equal(parsed.inventoryStatus,'ILLUSTRATIVE_NOT_VENDOR_VERIFIED');
  }
});

test('reject malformed, untrusted or non-versioned project imports',()=>{
  assert.throws(()=>importProjectJSON('{'),/valid JSON/);
  assert.throws(()=>importProjectJSON(' '.repeat(1_000_001)),/under 1 MB/);
  assert.throws(()=>importProjectJSON(JSON.stringify({steps:'bad',parts:'bad'})),/steps|parts|manual/);
  for(const field of [
    p=>{p.schemaVersion=2},
    p=>{p.id='bad id<script>'},
    p=>{p.category='nuclear-reactor'},
    p=>{p.review.status='verified'},
    p=>{p.review.requiresHumanApproval=false},
    p=>{p.source.url='javascript:alert(1)'},
    p=>{p.source.url='https://user:pass@example.com'},
    p=>{p.units='inches'},
    p=>{p.dimensions.width=-1},
    p=>{p.steps[1].requires=['missing-step']},
    p=>{p.steps[1].requires=['check']},
    p=>{p.steps[2].tool={kind:'driver',target:'not-present',action:'turn'}},
    p=>{p.parts[0].size=[1,0,1]},
    p=>{p.parts[0].start.x=Number.POSITIVE_INFINITY},
  ]){
    const candidate=copy(projects[1]);field(candidate);
    assert.ok(validateProject(candidate).length>0,'rejected invalid field');
    assert.throws(()=>importProjectJSON(JSON.stringify(candidate)));
  }
});

test('representative large projects include explicit safety gates and phase dependencies',()=>{
  for(const id of ['doghouse-concept','fence-concept','pc-concept']){
    const p=projectById(id);
    assert.ok(p.steps.some(s=>s.safety),`${id} missing safety review`);
    assert.ok(p.steps.some(s=>s.requires?.length),`${id} missing prerequisites`);
    assert.ok(p.steps.some(s=>s.caution),`${id} missing project-specific cautions`);
    assert.ok(p.review.requiresHumanApproval);
  }
  assert.ok(projectById('fence-concept').steps[0].caution.includes('utility'));
  assert.ok(projectById('pc-concept').steps.some(s=>s.caution?.includes('PSU')));
});
