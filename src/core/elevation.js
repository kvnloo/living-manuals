import {installationFraction} from './assembly.js';

/**
 * Project the *authored* geometry onto a simplified front elevation.
 * These independent vectors are NOT vendor instruction diagrams or an
 * assertion of real hole locations. The projection never depends on WebGL.
 */
export function elevationPrimitives(manual, stageIndex) {
  const activeIds = new Set(manual.steps[stageIndex].parts);
  const primitives = [];
  const ordered = [...manual.parts].sort((a,b) => {
    // The rear sheet should be drawn beneath all other projected geometry.
    const pa = a.id === 'back' ? -1 : a.kind === 'panel' ? 0 : 1;
    const pb = b.id === 'back' ? -1 : b.kind === 'panel' ? 0 : 1;
    return pa - pb;
  });
  for (const part of ordered) {
    const installed = installationFraction(part, stageIndex) === 1;
    const active = activeIds.has(part.id);
    const ghost = stageIndex === 0 && part.kind === 'panel';
    if (!installed && !active && !ghost) continue;
    const x = 110 + part.end.x * 129;
    const y = 187 - part.end.y * 65;
    if (part.kind === 'hardware') {
      // Small circles are legible at compact sizes, even for tiny fasteners.
      primitives.push({type:'circle',id:part.id,cx:x,cy:y,r:active?2.7:1.65,active,ghost});
    } else {
      primitives.push({type:'rect',id:part.id,
        x:x-part.size[0]*129/2, y:y-part.size[1]*65/2,
        width:Math.max(1.2,part.size[0]*129), height:Math.max(1.2,part.size[1]*65),
        active,ghost});
    }
  }
  return primitives;
}
