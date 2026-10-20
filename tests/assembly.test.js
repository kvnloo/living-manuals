import test from 'node:test';
import assert from 'node:assert/strict';
import {bookcase} from '../src/catalog/billy.js';
import {validateManual,interpolatePose,installationFraction,installedCount,inventoryAtStage,visibleAtStage,activeStepIndex} from '../src/core/assembly.js';
import {elevationPrimitives} from '../src/core/elevation.js';
import {identity,multiply,translation,modelMatrix} from '../src/core/matrix.js';

const last = bookcase.steps.length - 1;
test('14 authored states and distinct, counted inventory are internally consistent',()=>{
  assert.deepEqual(validateManual(bookcase),[]);
  assert.equal(bookcase.steps.length,14);
  assert.equal(bookcase.parts.length,93);
  assert.equal(bookcase.inventoryStatus,'ILLUSTRATIVE_NOT_VENDOR_VERIFIED');
  const end=inventoryAtStage(bookcase,last);
  assert.deepEqual(end,{panel:{installed:11,total:11},hardware:{installed:82,total:82}});
  assert.equal(new Set(bookcase.parts.map(p=>p.id)).size,bookcase.parts.length);
});
test('all parts begin uninstalled and end installed',()=>{
  assert.equal(installedCount(bookcase,0),0);
  assert.equal(installedCount(bookcase,last),bookcase.parts.length);
});
test('parts never move before their own stage',()=>{
  for(const part of bookcase.parts){
    assert.deepEqual(interpolatePose(part,part.installStep-1),part.start);
    assert.deepEqual(interpolatePose(part,part.installStep),part.end);
  }
});
test('halfway interpolation is smooth, bounded and reversible',()=>{
  for(const part of bookcase.parts){
    const halfway=interpolatePose(part,part.installStep-.5);
    assert.equal(installationFraction(part,part.installStep-.5),.5);
    for(const axis of ['x','y','z','ry','rz']){
      assert.ok(Math.abs(halfway[axis]-((part.start[axis]??0)+(part.end[axis]??0))/2)<1e-9);
    }
    assert.deepEqual(interpolatePose(part,part.installStep-.5),halfway);
  }
});
test('progressive stages cannot uninstall earlier pieces or decrease category counts',()=>{
  let before=inventoryAtStage(bookcase,0);
  for(let n=0;n<=130;n++){
    const now=inventoryAtStage(bookcase,n/10);
    for(const kind of ['panel','hardware'])assert.ok(now[kind].installed>=before[kind].installed);
    before=now;
  }
});
test('future hardware stays hidden until its own transition and later remains visible',()=>{
  for(const part of bookcase.parts.filter(p=>p.kind==='hardware')){
    assert.equal(visibleAtStage(part,0),false);
    assert.equal(visibleAtStage(part,part.installStep-1),false);
    assert.equal(visibleAtStage(part,part.installStep-.5),true);
    assert.equal(visibleAtStage(part,last),true);
  }
  assert.ok(bookcase.parts.filter(p=>p.kind==='panel').every(p=>visibleAtStage(p,0)));
});
test('validation rejects contradictory authoring data without throwing',()=>{
  const duplicate=structuredClone(bookcase);
  duplicate.parts[0].id=duplicate.parts[1].id;
  assert.ok(validateManual(duplicate).some(e=>e.includes('Duplicate')));
  const dupInstall=structuredClone(bookcase);
  dupInstall.steps[3].parts.push(bookcase.parts[0].id);
  assert.ok(validateManual(dupInstall).some(e=>e.includes('installed twice')));
  const size=structuredClone(bookcase);
  size.parts[0].size[0]=-1;
  assert.ok(validateManual(size).some(e=>e.includes('Bad size')));
  const badCamera=structuredClone(bookcase);
  badCamera.steps[3].camera.phi=NaN;
  assert.ok(validateManual(badCamera).some(e=>e.includes('Bad camera')));
  const missingParts=structuredClone(bookcase);
  missingParts.steps[7].parts='oops';
  assert.ok(validateManual(missingParts).some(e=>e.includes('needs a parts array')));
  const shape=structuredClone(bookcase);
  shape.parts[0].shape='unknown';
  assert.ok(validateManual(shape).some(e=>e.includes('Bad shape')));
});
test('step selection clamps to current sequence',()=>{
  assert.equal(activeStepIndex(bookcase,-9),0);
  assert.equal(activeStepIndex(bookcase,999),last);
  assert.equal(activeStepIndex(bookcase,3.55),4);
});
test('derived vector elevation uses only step and authored geometry',()=>{
  assert.equal(elevationPrimitives(bookcase,0).length,11);
  assert.ok(elevationPrimitives(bookcase,0).every(p=>p.ghost));
  const first=elevationPrimitives(bookcase,1);
  assert.equal(first.length,12);
  assert.ok(first.every(p=>p.type==='circle'&&p.active));
  const atEnd=elevationPrimitives(bookcase,last);
  assert.equal(atEnd.length,93);
  assert.equal(elevationPrimitives(bookcase,last).length,93);
  for(const p of atEnd){
    for(const key of ['x','y','width','height','cx','cy','r']){
      if(key in p) assert.ok(Number.isFinite(p[key]),`${p.id} ${key}`);
    }
  }
});
test('model matrices preserve identity and translation',()=>{
  assert.deepEqual(Array.from(multiply(identity(),translation(2,3,4))),Array.from(translation(2,3,4)));
  const m=modelMatrix({x:2,y:3,z:4,ry:0,rz:0},[.5,1,2]);
  assert.equal(m[0],.5);assert.equal(m[5],1);assert.equal(m[10],2);
  assert.equal(m[12],2);assert.equal(m[13],3);assert.equal(m[14],4);
});
