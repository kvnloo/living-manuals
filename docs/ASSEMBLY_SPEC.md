# AssemblySpec v1 · verified rendering, not verified construction

The engine now renders an **illustrative assembly project** with one structured,
serializable contract. Its unit of composition is a project with parts, steps,
resources, prerequisites, a camera, evidence status and source ownership.

An `AssemblySpec` is **not** an installation permit, construction plan,
manufacturer manual, electrical diagram or source-certified bill of materials.
This repo deliberately **rejects imported projects claiming to be verified**.

## Shape

```json
{
  "schemaVersion": 1,
  "id": "shed-concept",
  "title": "Example conceptual shelter",
  "category": "architecture",
  "shortTitle": "SHELTER",
  "subtitle": "Concept study; no structural calculations",
  "source": {
    "creator": "Your original author or project team",
    "url": "https://example.org/project-source"
  },
  "review": {"status": "illustrative", "requiresHumanApproval": true},
  "inventoryStatus": "ILLUSTRATIVE_NOT_VENDOR_VERIFIED",
  "approximate": true,
  "units": "metres",
  "dimensions": {"width": 1.5, "height": 1.8, "depth": 1.2},
  "cautions": ["Check local codes, site constraints, loads and weather."],
  "parts": [
    {
      "id": "floor",
      "label": "Conceptual floor",
      "kind": "panel",
      "shape": "box",
      "tone": "wood",
      "size": [1.5, 0.08, 1.2],
      "start": {"x": -2, "y": 0.5, "z": 1},
      "end": {"x": 0, "y": 0.04, "z": 0},
      "installStep": 1
    }
  ],
  "steps": [
    {
      "id": "overview", "title": "Inspect the concept",
      "detail": "Spatial study only.", "phase": "Plan",
      "parts": [], "camera": {"theta": 0.6, "phi": 1.1, "distance": 3.0, "y": 0.9}
    },
    {
      "id": "floor-view", "title": "Visualize the floor",
      "detail": "This animation does not specify building methods.",
      "phase": "Structure", "parts": ["floor"], "requires": ["overview"],
      "camera": {"theta": 0.6, "phi": 1.1, "distance": 2.5, "y": 0.5}
    }
  ]
}
```

To import, save a valid project JSON file and select **IMPORT JSON**. Export
returns the same versioned contract with provenance intact. Data is parsed with
`JSON.parse`, checked by `validateProject`, then rendered using DOM text nodes;
no JavaScript from a project file is executed. Import is capped at 1 MB, 500
parts and 120 stages to bound client resource consumption.

## Authoring rules

- One unique lowercase `id` per project, part and stage. Step `parts` lists each
  part **exactly once**, on the step matching the part's `installStep` index.
- Step 0 starts an exploded/preview scene and installs no physical parts.
  Reversible `installationFraction` only interpolates between authored `start`
  and `end` poses. It cannot determine real-world fit or safe sequence.
- Steps may declare a `phase`, a list of prior step IDs in `requires`, a
  `caution`, and optional `tool: {kind, target, action}` (driver/hammer/drill/
  mallet/wrench; align/turn/tap). Tool meshes are **illustrative UI cues**; never
  treat their rotation or alignment as a torque or technique recommendation.
- Cameras are in radians (`theta`, `phi`), meters (`distance`, `y`, optional
  `x` and `z`). Model coordinates use meters, +Y up, +Z front.
- Part categories: `panel`, `hardware`, `fixture`, `component`, `material`.
  Geometry supports boxes and cylinders; unrecognized shapes are rejected.
- Preserve original creator attribution and a public HTTPS source link. All
  diagrams in the UI are generated from these authored shapes; do not embed
  third-party vendor drawings, photos or models without permission.
- The v1 importer **only accepts `review.status: illustrative`**. The spec
  contract does not have a way to claim a project is ready for actual work.
  This prevents an arbitrary JSON file from silently bypassing review.

## Project extensions

| Study | Required evidence before physical instructions |
| --- | --- |
| Doghouse | animal size, climate, drainage, ventilation, materials, weather and structural requirements |
| Fence | survey/property boundaries, utilities, local codes/permits, load, soils, setbacks |
| PC | specific component compatibility, ESD controls, PSU safety, connectors, thermal and airflow specs |
| Furniture | precise SKU, revision, supplied BOM, official assembly and anchoring instructions |

Future ingestion pipeline: **source PDF / user photography / CAD** → candidate
parts, steps and links with confidence scores → human corrections/review →
source-pinned versioned model → independent simulation / assembly visualization.
Importing a project cannot skip human checks; any future `reviewed` state must
be tied to an auditable source, variant, date and reviewer outside this v1
visual-only format.

## Determinism and tests

`npm run check` validates all five built-in projects, roundtrip imports,
prerequisite order, category conservation, reverse scrubbing, malicious
or malformed inputs and mathematically bounded camera geometry. The Playwright
browser suite exercises all project modes and steps in both desktop/mobile
layouts, plus a deliberate WebGL-off context.
