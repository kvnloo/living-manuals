const finite = n => typeof n === 'number' && Number.isFinite(n);
const fields = ['x', 'y', 'z'];

export function validateManual(manual) {
  const errors = [];
  if (!manual || typeof manual !== 'object') return ['Missing manual'];
  if (!Array.isArray(manual.steps) || manual.steps.length < 2) errors.push('At least two steps required');
  if (!Array.isArray(manual.parts) || !manual.parts.length) errors.push('No parts');
  if (errors.length) return errors;
  const ids = new Set();
  const stepIds = new Set();
  for (const [i, step] of manual.steps.entries()) {
    if (!step.id || stepIds.has(step.id)) errors.push(`Duplicate/empty step at ${i}`);
    stepIds.add(step.id);
    if (!Array.isArray(step.parts)) errors.push(`Step ${step.id} needs a parts array`);
  }
  for (const [i, p] of manual.parts.entries()) {
    if (typeof p.id !== 'string' || !p.id || ids.has(p.id)) errors.push(`Duplicate/empty part at ${i}`);
    ids.add(p.id);
    if (!Array.isArray(p.size) || p.size.length !== 3 || !p.size.every(n => finite(n) && n > 0)) errors.push(`Bad size ${p.id}`);
    for (const pose of ['start', 'end']) {
      if (!p[pose] || !fields.every(k => finite(p[pose][k]))) errors.push(`Bad ${pose} pose ${p.id}`);
      for (const k of ['ry', 'rz']) if (p[pose] && p[pose][k] !== undefined && !finite(p[pose][k])) errors.push(`Bad angle ${p.id}`);
    }
    if (!Number.isInteger(p.installStep) || p.installStep < 1 || p.installStep >= manual.steps.length) errors.push(`Bad installStep ${p.id}`);
  }
  const referenced = new Map();
  for (const [i, step] of manual.steps.entries()) for (const id of step.parts ?? []) {
    if (!ids.has(id)) errors.push(`Unknown part ${id} in step ${step.id}`);
    if (referenced.has(id)) errors.push(`Part ${id} installed twice`);
    referenced.set(id, i);
  }
  for (const part of manual.parts) {
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
  for (const k of [...fields, 'ry', 'rz']) result[k] = (part.start[k] ?? 0) * (1-u) + (part.end[k] ?? 0) * u;
  return result;
}
export function installedCount(manual, stage) {
  return manual.parts.filter(p => installationFraction(p, stage) === 1).length;
}
export function activeStepIndex(manual, stage) {
  return clamp(Math.round(stage), 0, manual.steps.length - 1);
}
