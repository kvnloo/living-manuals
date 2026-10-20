/**
 * An independent, entirely procedural *illustration* of a bookcase assembly.
 * The 14-screen pacing and two inventory categories were observed in Ryan Sael's
 * demo, not extracted from or verified against any IKEA manual or CAD model.
 * Fastener quantities/locations below are teaching props, NOT an official BOM.
 * Coordinates are metres; +Y up, +Z front. All inventory objects have IDs.
 */
const width = 0.8;
const height = 2.02;
const depth = 0.28;
const panel = 0.018;
const innerWidth = width - 2 * panel;
const innerHeight = height - 2 * panel;

const pose = (x, y, z, ry = 0, rz = 0) => ({x, y, z, ry, rz});
const panelPart = (id, label, size, end, start, installStep, tone = 'wood') => ({
  id, label, size, end, start, installStep, tone, kind: 'panel', shape: 'box',
});
const hardwareGroup = (prefix, label, count, installStep, endAt, startAt, size) =>
  Array.from({length: count}, (_, index) => {
    const end = endAt(index);
    return {
      id: `${prefix}-${String(index + 1).padStart(2, '0')}`,
      label: `${label} ${index + 1}`, kind: 'hardware', shape: 'cylinder', tone: 'metal',
      size, start: startAt(end, index), end, installStep,
    };
  });

// Visual aids only. Hardware is intentionally arranged for legibility, not
// intended as guidance about real hole locations or tightening order.
const dowels = hardwareGroup('dowel', 'Illustrative dowel', 12, 1,
  i => pose((i % 2 ? 1 : -1) * 0.36, 0.19 + Math.floor(i / 4) * 0.70, i % 4 < 2 ? 0.105 : -0.105),
  (end, i) => pose(end.x + (i % 2 ? 0.22 : -0.22), end.y + 0.14, end.z + 0.15),
  [0.012, 0.055, 0.012]);
const bolts = hardwareGroup('bolt', 'Illustrative cam bolt', 12, 2,
  i => pose((i % 2 ? 1 : -1) * 0.35, 0.22 + Math.floor(i / 4) * 0.7, i % 4 < 2 ? 0.14 : -0.14, 0, Math.PI / 2),
  (end, i) => pose(end.x + (i % 2 ? 0.19 : -0.19), end.y + 0.12, end.z + 0.12, end.ry, end.rz),
  [0.014, 0.058, 0.014]);
const locks = hardwareGroup('lock', 'Illustrative cam lock', 12, 5,
  i => pose((i % 2 ? 1 : -1) * 0.37, 0.18 + Math.floor(i / 4) * 0.7, i % 4 < 2 ? 0.147 : -0.147, Math.PI / 2, Math.PI / 2),
  (end, i) => pose(end.x + (i % 2 ? 0.12 : -0.12), end.y + 0.09, end.z + 0.25, end.ry, end.rz),
  [0.022, 0.016, 0.022]);
const nails = hardwareGroup('nail', 'Illustrative back nail', 26, 9,
  i => pose(i % 2 ? 0.37 : -0.37, 0.12 + Math.floor(i / 2) * 0.146, -0.148, Math.PI / 2, Math.PI / 2),
  end => pose(end.x, end.y, end.z - 0.19, end.ry, end.rz),
  [0.007, 0.044, 0.007]);
const shelfLevels = [0.36, 0.69, 1.28, 1.59, 1.83];
const pins = hardwareGroup('pin', 'Illustrative shelf pin', 20, 10,
  i => pose(i % 2 ? 0.371 : -0.371, shelfLevels[Math.floor(i / 4)] - 0.014, i % 4 < 2 ? 0.105 : -0.105, 0, Math.PI / 2),
  (end, i) => pose(end.x + (i % 2 ? 0.17 : -0.17), end.y + 0.07, end.z + 0.20, end.ry, end.rz),
  [0.009, 0.04, 0.009]);

const shelves = shelfLevels.map((y, i) => panelPart(
  `shelf-${i + 1}`, `${['Lower', 'Lower-middle', 'Middle', 'Upper-middle', 'Upper'][i]} adjustable shelf`,
  [innerWidth, panel, depth - 0.006], pose(0, y, 0.003),
  pose((i % 2 ? 1 : -1) * (0.56 + 0.07 * i), y + 0.27, 0.45 + i * 0.035, 0, (i % 2 ? 1 : -1) * 0.15),
  i < 2 ? 11 : 12,
));

const panels = [
  panelPart('base', 'Bottom panel', [innerWidth, panel, depth], pose(0, panel / 2, 0), pose(-0.82, 0.12, 0.68, 0, -0.08), 3),
  panelPart('left', 'Left upright', [panel, height, depth], pose(-width / 2 + panel / 2, height / 2, 0), pose(-1.12, 1.02, -0.38, 0, -0.15), 4),
  panelPart('right', 'Right upright', [panel, height, depth], pose(width / 2 - panel / 2, height / 2, 0), pose(1.06, 0.98, 0.1, 0, 0.13), 4),
  panelPart('fixed', 'Fixed shelf', [innerWidth, panel, depth], pose(0, 0.99, 0), pose(-0.58, 0.62, 0.8, 0, 0.2), 6),
  panelPart('top', 'Top panel', [innerWidth, panel, depth], pose(0, height - panel / 2, 0), pose(0.03, 2.54, -0.34, 0, -0.17), 7),
  panelPart('back', 'Back panel', [innerWidth, innerHeight, 0.004], pose(0, height / 2, -depth / 2 + 0.002), pose(0.05, 1.15, -0.9, 0.32), 8, 'back'),
  ...shelves,
];

const ids = objects => objects.map(object => object.id);
const camera = (theta, phi, distance, y = 1.05) => ({theta, phi, distance, y});
export const bookcase = {
  id: 'bookcase-study-v2',
  title: 'BILLY / Bookcase study',
  subtitle: 'A visual experiment, not manufacturer instructions',
  source: {creator: 'Ryan Sael', url: 'https://x.com/RyanSael/status/2112178744937103607'},
  externalReference: 'https://sael.net/flatpack/',
  units: 'metres', approximate: true, inventoryStatus: 'ILLUSTRATIVE_NOT_VENDOR_VERIFIED',
  dimensions: {width, height, depth},
  parts: [...panels, ...dowels, ...bolts, ...locks, ...nails, ...pins],
  steps: [
    {id: 'overview', title: 'Examine the parts', detail: 'Explore an exploded model. All quantities and placements are illustrative, not a verified kit inventory.', parts: [], hint: 'Orbit or select a stage', camera: camera(.67, 1.14, 3.7)},
    {id: 'dowels', title: 'Locate the dowels', detail: 'Watch an illustrative group of small alignment pieces move into place; check your own official manual for real positions.', parts: ids(dowels), hint: '12 illustrative dowels', camera: camera(.8, 1.2, 2.6, .8)},
    {id: 'cam-bolts', title: 'Introduce cam bolts', detail: 'Inspect small connector geometry in a close-up. The depicted number and arrangement are not a hardware checklist.', parts: ids(bolts), hint: '12 illustrative bolts', camera: camera(1.05, 1.12, 2.25, .75)},
    {id: 'base', title: 'Set the base panel', detail: 'The lower board moves to its parametric position; this is a spatial explanation, not a procedural instruction.', parts: ['base'], hint: 'Frame reference', camera: camera(.7, 1.1, 2.9, .65)},
    {id: 'sides', title: 'Introduce both sides', detail: 'The upright panels establish the width of the bookcase study.', parts: ['left', 'right'], hint: 'Two matching uprights', camera: camera(.67, 1.12, 3.35)},
    {id: 'locks', title: 'Illustrate cam connections', detail: 'The connectors move near selected panel joints to demonstrate motion and scale, not actual tightening.', parts: ids(locks), hint: 'Illustrative fasteners', camera: camera(.91, 1.2, 2.35, .6)},
    {id: 'fixed', title: 'Place the fixed shelf', detail: 'A horizontal reference shelf moves between the two sides.', parts: ['fixed'], hint: 'Internal landmark', camera: camera(.7, 1.08, 2.9, 1.02)},
    {id: 'top', title: 'Close the outer frame', detail: 'The top board moves into its final position in the model.', parts: ['top'], hint: 'Frame silhouette', camera: camera(.76, 1.15, 3.4)},
    {id: 'back', title: 'Introduce the back panel', detail: 'Orbit or reframe the scene to see the thin rear panel.', parts: ['back'], hint: 'Rear view', camera: camera(3.1, 1.16, 3.05)},
    {id: 'back-nails', title: 'Study rear fixings', detail: 'A set of small nail shapes illustrates how the rear face can be explained in 3D.', parts: ids(nails), hint: '26 illustrative nails', camera: camera(3.1, 1.17, 2.6)},
    {id: 'shelf-pins', title: 'Place shelf supports', detail: 'Illustrative shelf-pin shapes become visible before the adjustable shelves.', parts: ids(pins), hint: '20 illustrative supports', camera: camera(.85, 1.22, 2.6)},
    {id: 'lower-shelves', title: 'Add lower shelves', detail: 'Two free-height shelves slide into the parametric model.', parts: ids(shelves.slice(0, 2)), hint: 'Two shelves', camera: camera(.67, 1.18, 3.15, .7)},
    {id: 'upper-shelves', title: 'Complete the shelf layout', detail: 'The remaining shelves align to the example positions.', parts: ids(shelves.slice(2)), hint: 'Three more shelves', camera: camera(.67, 1.13, 3.7)},
    {id: 'safety', title: 'Finish with the official manual', detail: 'For physical assembly and wall anchoring, use the correct manufacturer instructions, safety hardware and product variant.', parts: [], hint: 'Verification required before assembly', safety: true, camera: camera(.67, 1.14, 3.9)},
  ],
};
