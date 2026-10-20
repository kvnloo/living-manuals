const finite = n => typeof n === 'number' && Number.isFinite(n);
const fields = ['x', 'y', 'z'];
const kinds = new Set(['panel', 'hardware']);
const shapes = new Set(['box', 'cylinder']);

export function validateManual(manual) {
  const errors = [];
  if (!manual || typeof manual !== 'object') return ['Missing manual'];
  if (!Array.isArray(manual.steps) || manual.steps.length < 2) errors.push('At least two steps required');
  if (!Array.isArray(manual.parts) || !manual.parts.length) errors.push('No parts');
  if (errors.length) return errors;
  const ids = new Set();
  const stepIds = new Set();
  for (const [i, step] of manual.steps.entries()) {
    if (!step || typeof step !== 'object') {errors.push(`Invalid step ${i}`);continue;}
    if (typeof step.id !== 'string' || !step.id || stepIds.has(step.id)) errors.push(`Duplicate/empty step at ${i}`);
    stepIds.add(step.id);
    if (!Array.isArray(step.parts)) errors.push(`Step ${step.id} needs a parts array`);
    const c = step.camera;
    if (c && (!['theta', 'phi', 'distance', 'y'].every(k => finite(c[k])) || c.phi <= 0 || c.phi >= Math.PI || c.distance < 1.5)) {
      errors.push(`Bad camera for step ${step.id}`);
    }
  }
  for (const [i, p] of manual.parts.entries()) {
    if (!p || typeof p !== 'object') {errors.push(`Invalid part ${i}`);continue;}
    if (typeof p.id !== 'string' || !p.id || ids.has(p.id)) errors.push(`Duplicate/empty part at ${i}`);
    ids.add(p.id);
    if (!kinds.has(p.kind)) errors.push(`Bad kind ${p.id}`);
    if (!shapes.has(p.shape)) errors.push(`Bad shape ${p.id}`);
    if (!Array.isArray(p.size) || p.size.length !== 3 || !p.size.every(n => finite(n) && n > 0)) errors.push(`Bad size ${p.id}`);
    for (const pose of ['start', 'end']) {
      if (!p[pose] || !fields.every(k => finite(p[pose][k]))) errors.push(`Bad ${pose} pose ${p.id}`);
      for (const k of ['ry', 'rz']) if (p[pose] && p[pose][k] !== undefined && !finite(p[pose][k])) errors.push(`Bad angle ${p.id}`);
    }
    if (!Number.isInteger(p.installStep) || p.installStep < 1 || p.installStep >= manual.steps.length) errors.push(`Bad installStep ${p.id}`);
  }
  const referenced = new Map();
  for (const [i, step] of manual.steps.entries()) {
    if (!Array.isArray(step?.parts)) continue;
    for (const id of step.parts) {
      if (!ids.has(id)) errors.push(`Unknown part ${id} in step ${step.id}`);
      if (referenced.has(id)) errors.push(`Part ${id} installed twice`);
      referenced.set(id, i);
    }
  }
  for (const part of manual.parts) {
    if (!part || typeof part !== 'object') continue;
    if (!referenced.has(part.id)) errors.push(`Unreferenced part ${part.id}`);
    if (referenced.get(part.id) !== part.installStep) errors.push(`Part ${part.id} has inconsistent installStep`);
  }
  return errors;
}

export const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
export function installationFraction(part, stage) {
  return clamp(stage - part.installStep + 1, 0, 1);
}
export function interpolatePose(part, stage) {
  const t = installationFraction(part, stage);
  // Cubic easing is continuous and reversible: scrubbing backwards is deterministic.
  const u = t * t * (3 - 2 * t);
  const result = {};
  for (const k of [...fields, 'ry', 'rz']) result[k] = (part.start[k] ?? 0) * (1 - u) + (part.end[k] ?? 0) * u;
  return result;
}
export function installedCount(manual, stage) {
  return manual.parts.filter(p => installationFraction(p, stage) === 1).length;
}
export function inventoryAtStage(manual, stage) {
  const result = {panel: {installed: 0, total: 0}, hardware: {installed: 0, total: 0}};
  for (const part of manual.parts) {
    result[part.kind].total++;
    if (installationFraction(part, stage) === 1) result[part.kind].installed++;
  }
  return result;
}
export function visibleAtStage(part, stage) {
  // Keep large panels in the exploded view, but don't swamp the scene with
  // 82 unplaced fasteners. Hardware appears just before its insertion step.
  return part.kind !== 'hardware' || stage >= part.installStep - 1;
}
export function activeStepIndex(manual, stage) {
  return clamp(Math.round(stage), 0, manual.steps.length - 1);
}
