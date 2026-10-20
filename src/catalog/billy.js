/**
 * Geometric approximation inspired by a tall, flat-pack bookcase.
 * Not a reproduction of IKEA's diagrams or verified assembly sequence.
 * Product name in the demo identifies the inspiration, not an affiliation.
 * Coordinate system: metres, +Y up, +Z toward the open front.
 */
const width = 0.8;
const height = 2.02;
const depth = 0.28;
const panel = 0.018;
const innerWidth = width - panel * 2;
const innerHeight = height - panel * 2;

const part = (id, label, size, end, start, installStep, tone = 'wood') => ({
  id, label, size, end: {ry: 0, rz: 0, ...end}, start: {ry: 0, rz: 0, ...start}, installStep, tone,
});

export const bookcase = {
  id: 'bookcase-study',
  title: 'BILLY / Bookcase study',
  subtitle: 'The assembly, explained in space.',
  externalReference: 'https://sael.net/flatpack',
  units: 'metres',
  approximate: true,
  dimensions: {width, height, depth},
  parts: [
    part('base', 'Bottom panel', [innerWidth, panel, depth], {x:0, y:panel / 2, z:0}, {x:-0.82,y:0.12,z:0.68,rz:-0.08}, 1),
    part('left', 'Left upright', [panel, height, depth], {x: -width / 2 + panel / 2, y: height / 2, z: 0}, {x: -1.12, y: 1.02, z: -0.38, rz: -0.15}, 2),
    part('right', 'Right upright', [panel, height, depth], {x: width / 2 - panel / 2, y: height / 2, z: 0}, {x: 1.06, y: 0.98, z: 0.1, rz: 0.13}, 3),
    part('top', 'Top panel', [innerWidth, panel, depth], {x: 0, y: height - panel / 2, z: 0}, {x: 0.03, y: 2.54, z: -0.34, rz: -0.17}, 4),
    part('fixed', 'Fixed shelf', [innerWidth, panel, depth], {x: 0, y: 0.99, z: 0}, {x: -0.58, y: 0.62, z: 0.8, rz: 0.2}, 5),
    part('back', 'Back panel', [innerWidth, innerHeight, 0.004], {x: 0, y: height / 2, z: -depth / 2 + 0.002}, {x: 0.05, y: 1.15, z: -0.9, ry: 0.32}, 6, 'back'),
    part('shelf-1', 'Lower adjustable shelf', [innerWidth, panel, depth - 0.006], {x: 0, y: 0.36, z: 0.003}, {x: 0.80, y: 0.28, z: 0.53, rz: 0.12}, 7),
    part('shelf-2', 'Middle adjustable shelf', [innerWidth, panel, depth - 0.006], {x: 0, y: 1.32, z: 0.003}, {x: -0.61, y: 1.61, z: 0.57, rz: -0.17}, 7),
    part('shelf-3', 'Upper adjustable shelf', [innerWidth, panel, depth - 0.006], {x: 0, y: 1.66, z: 0.003}, {x: 0.74, y: 2.19, z: 0.47, rz: 0.14}, 7),
  ],
  steps: [
    {id:'inventory', title:'Meet the pieces', detail:'Orbit around the exploded view. The model separates the panels so their role is easy to understand.', parts:[], hint:'Drag to orbit · Scroll to zoom'},
    {id:'base', title:'Start at the base', detail:'Bring the lower horizontal panel into position. This is a visual study, not a hardware procedure.', parts:['base'], hint:'One piece anchors the layout'},
    {id:'left', title:'Place the first side', detail:'Follow the long left upright as it aligns with the lower panel.', parts:['left'], hint:'Watch the side align'},
    {id:'right', title:'Complete the sides', detail:'Introduce the matching upright and establish the cabinet width.', parts:['right'], hint:'Symmetry makes alignment clear'},
    {id:'top', title:'Close the frame', detail:'The top board moves down between the two uprights.', parts:['top'], hint:'The outer frame is established'},
    {id:'fixed', title:'Position the fixed shelf', detail:'A structural shelf moves into the centre of the frame.', parts:['fixed'], hint:'A visible internal landmark'},
    {id:'back', title:'Place the rear panel', detail:'Rotate to see the thin back panel move in from behind.', parts:['back'], hint:'Orbit to inspect the back'},
    {id:'adjustable', title:'Add adjustable shelves', detail:'The remaining horizontal shelves slide into their final positions.', parts:['shelf-1','shelf-2','shelf-3'], hint:'Compare different heights'},
    {id:'secure', title:'Finish safely', detail:'Real furniture must be assembled and anchored exactly as required by its official product instructions.', parts:[], hint:'Review the official manual before assembly', safety:true},
  ],
};
