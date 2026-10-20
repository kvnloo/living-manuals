# Living Manuals

**Evidence-first, reversible 3D assembly explanations.** An independent, zero-dependency browser study that animates individually tracked panels and illustrative hardware. Inspired by [Ryan Sael's BILLY demo](https://x.com/RyanSael/status/2112178744937103607) ([live original](https://sael.net/flatpack/)).

## Run

```bash
python3 -m http.server 4173
# Open http://localhost:4173
npm run check
```

No build tool, account, API token, package install, model download, or copied manufacturer assets are required for the runtime. Requires WebGL 2 for the interactive 3D model; an accessible static elevation, operation descriptions, and all navigation remain available when WebGL 2 is unavailable.

## Implemented

- **14 fully reversible illustrated states**, with next/previous, slider, playback, arrow-key navigation, reduced-motion support and deterministic scrub interpolation.
- **11 parametric panels + 82 separately rendered pieces of hardware** (dowels, connectors, rear fasteners and shelf supports). Both counts are **illustrative demo props**, not the inventory, hole positions or assembly order of any real IKEA product.
- Procedural box and cylinder geometry in a dependency-free WebGL2 viewer; future hardware stays out of the exploded view until its demonstration step.
- **Room / Drawing** rendering modes, camera close-up presets by step, free orbit/zoom and reframe.
- An independent front-elevation SVG generated directly from the authored scene graph, linked to each step without copying manufacturer diagrams.
- Mobile layout, per-category installation counters, safety warnings and an accessible **no-WebGL fallback**.
- Deterministic validation for missing/duplicate parts, category/shape errors, invalid cameras, bad transforms and inconsistent installation ownership.
- Node unit tests and a real-browser Playwright acceptance path that exercises desktop, mobile, no-WebGL and drawing/room modes.

**Not built:** manufacturer-verified fastener geometry, PDF/image ingestion, real manual diagrams, automatic recognition, glTF, exact original-demo reproduction or safety certification. The sample must never be used to assemble real furniture. Locate the correct manufacturer instructions and wall-anchoring hardware for your specific product.

## Verification

```bash
npm run check
# Browser acceptance suite requires Python Playwright + Chromium:
python3 -m pip install playwright==1.55.0
python3 -m playwright install chromium
python3 tests/browser_smoke.py
```

A restricted local browser without WebGL can run a limited UI-only check using `python3 tests/browser_smoke.py --inline --allow-no-webgl`; this **does not verify 3D output**. The [dedicated CI workflow](.github/workflows/browser.yml) requires real WebGL2 and exports desktop/mobile screenshots. Reference research is independently recorded in [docs/VERIFIED_REFERENCE.md](docs/VERIFIED_REFERENCE.md) and in [the reproducible Actions investigation](.github/workflows/reference-investigation.yml). Agent Reach's anonymous X backend was not authenticated; the public video was retrieved via `yt-dlp` and the live website inspected with REA/CDP. Credit belongs to original creator **Ryan Sael**.

## Architecture

| Area | Contract |
|---|---|
| `src/catalog/billy.js` | Illustrative source-labeled geometry, inventory and camera keyframes; *not* vendor data |
| `src/core/assembly.js` | Deterministic validation, category counters, visibility and interpolation |
| `src/core/elevation.js` | Independent vector schematic from authored geometry |
| `src/core/matrix.js` | Self-contained column-major matrix math |
| `src/engine/webgl.js` | Box/cylinder rendering, camera and drawing/room modes |
| `src/main.js` | Timeline controls, accessible DOM and fallback coordination |
| `tests/` | Unit invariants and full-browser acceptance with intentional WebGL failure |
| `docs/` | Evidence and provenance, human safety gates and remaining roadmap |

## Why its own repo?

Living Manuals owns **assembly semantics, verification and interaction UX**. Geometry is a replaceable subsystem. A future provider can use [img2threejs](https://github.com/kvnloo/img2threejs), user-licensed glTF/CAD or explicit procedural primitives, after geometry/provenance review. No proprietary original implementation or assembly drawings are copied.

## Manual ingestion (planned)

Document -> candidate BOM and geometry -> evidence-tagged dependency graph -> deterministic validation -> human review of ambiguous or safety-related steps -> versioned `AssemblySpec` -> interactive guide. Unknowns remain unknown; a polished scene cannot certify assembly correctness.

See [research](docs/RESEARCH.md), [roadmap](docs/ROADMAP.md) and [attribution](docs/PROVENANCE.md).

## License

MIT. Copyright 2026 Living Manuals contributors.
