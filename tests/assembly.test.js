import test from 'node:test';
import assert from 'node:assert/strict';
import {bookcase} from '../src/catalog/billy.js';
import {validateManual,interpolatePose,installationFraction,installedCount,activeStepIndex} from '../src/core/assembly.js';
import {identity,multiply,translation,modelMatrix} from '../src/core/matrix.js';

test('sample is a valid, complete assembly graph',()=>{
  assert.deepEqual(validateManual(bookcase),[]);
  assert.equal(bookcase.parts.length,9);
  assert.equal(bookcase.steps.length,9);
});
test('all parts begin uninstalled and end installed',()=>{
  assert.equal(installedCount(bookcase,0),0);
  assert.equal(installedCount(bookcase,8),bookcase.parts.length);
});
test('parts never move before their own step',()=>{
  for(const part of bookcase.parts){
    assert.deepEqual(interpolatePose(part,part.installStep-1),part.start);
    assert.deepEqual(interpolatePose(part,part.installStep),part.end);
  }
});
test('halfway interpolation is smooth and reversible',()=>{
  for(const part of bookcase.parts){
    const halfway=interpolatePose(part,part.installStep-.5);
    assert.equal(installationFraction(part,part.installStep-.5),.5);
    for(const axis of ['x','y','z','ry','rz']){
      assert.ok(Math.abs(halfway[axis]-((part.start[axis]??0)+(part.end[axis]??0))/2)<1e-9);
    }
    assert.deepEqual(interpolatePose(part,part.installStep-.5),halfway);
  }
});
test('progressive steps cannot uninstall an earlier piece',()=>{
  let prev=0;
  for(let n=0;n<=80;n++){
    const count=installedCount(bookcase,n/10);
    assert.ok(count>=prev);
    prev=count;
  }
});
test('validation catches contradictory authoring data',()=>{
  const mutated=structuredClone(bookcase);
  mutated.parts[0].id=mutated.parts[1].id;
  assert.ok(validateManual(mutated).some(e=>e.includes('Duplicate')));
  const mutated2=structuredClone(bookcase);
  mutated2.steps[3].parts.push('base');
  assert.ok(validateManual(mutated2).some(e=>e.includes('installed twice')));
  const mutated3=structuredClone(bookcase);
  mutated3.parts[0].size[0]=-1;
  assert.ok(validateManual(mutated3).some(e=>e.includes('Bad size')));
});
test('step selection clamps to the available sequence',()=>{
  assert.equal(activeStepIndex(bookcase,-9),0);
  assert.equal(activeStepIndex(bookcase,999),8);
  assert.equal(activeStepIndex(bookcase,3.55),4);
});
test('matrices preserve identity and translation',()=>{
  assert.deepEqual(Array.from(multiply(identity(),translation(2,3,4))),Array.from(translation(2,3,4)));
  const m=modelMatrix({x:2,y:3,z:4,ry:0,rz:0},[.5,1,2]);
  assert.equal(m[0],.5);assert.equal(m[5],1);assert.equal(m[10],2);
  assert.equal(m[12],2);assert.equal(m[13],3);assert.equal(m[14],4);
});
