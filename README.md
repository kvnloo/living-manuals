# Living Manuals

**Evidence-first, interactive 3D assembly guides.** A browser-only proof of concept that animates parts between a documented exploded layout and their final placement, with reversible scrubbing and orbit controls.

[Original inspiration: Ryan Sael's interactive BILLY demo](https://x.com/RyanSael/status/2112178744937103607) · [Try Ryan's original](https://sael.net/flatpack)

## Run

```bash
python3 -m http.server 4173
# visit http://localhost:4173
node --test tests/*.test.js
```

No bundler, paid API, cookies, downloads, model weights, or JavaScript dependencies are required for the example. A WebGL 2 browser is needed for the 3D canvas. Use arrow keys or the step list, drag to orbit, scroll to zoom, use the scrubber to move backwards and forwards, and hit Play for the sequence.

## Status

- **Implemented:** a parametric nine-part bookcase approximation, nine pedagogical states (including intro and safety), procedural cuboids, GPU rendering, camera controls, animation timeline, playback, responsive controls, reduced-motion support, validation, tests.
- **Not implemented:** PDF/image ingestion, exact recreation of the real IKEA assembly manual, fastener-level geometry, matching the original demonstration's source/behavior, automatic part inference, GLB import, safety certification.
- **Caution:** this sample is **not** an assembly manual. Consult official instructions and wall-anchoring requirements before building furniture.

The sample's panel placements and order are illustrative. The `BILLY` label identifies the design study; it does not imply affiliation or verified manufacturer geometry. No IKEA drawings, assets, code, models, or documents are copied into this repository.

## Architecture

| Module | Purpose |
|---|---|
| `src/catalog/billy.js` | Declarative part dimensions, initial/final transforms, step association, human-readable hints |
| `src/core/assembly.js` | Validates the full part graph, computes reversible pose interpolation; **deterministic** |
| `src/core/matrix.js` | Small matrix kernel |
| `src/engine/webgl.js` | Self-contained WebGL2 preview rendering; no model downloads |
| `src/main.js` | Step navigation, playback, accessibility and viewer coordination |
| `docs/RESEARCH.md` | Sources, what was observed, what remains unverified |
| `docs/ROADMAP.md` | Extraction → review → assembly-engine roadmap and integration decisions |

### Why a separate repo?

This repo owns **manual understanding, assembly semantics, timeline UX and validation**. Geometry providers are plugins later: [img2threejs](https://github.com/kvnloo/img2threejs) for agent-generated procedural shapes, [Three.js](https://threejs.org/) / glTF for production runtime, optional legally usable CAD/GLB assets. It does not fork an existing author demo or duplicate the reverse-engineering and social retrieval tools.

## Proposed ingestion contract

Input is a manual document or a reference plus an evidence record. An agent may propose `parts[]`, `steps[]`, camera keyframes, and geometry. A deterministic validator checks ID uniqueness, step ownership, dimensions, finite transforms, and referential integrity. A human validates safety-sensitive actions, fit and tolerances before anyone may treat it as authoritative. The output is a versioned `AssemblySpec` plus a 3D replay; unknowns remain unknown rather than being hallucinated.

See [research notes](docs/RESEARCH.md), [roadmap](docs/ROADMAP.md) and [attribution](docs/PROVENANCE.md).

## License

MIT. Copyright 2026 Living Manuals contributors.
