# Living Manuals

**Instructions that come to life — as evidence-first, reversible 3D concept studies.**

Explore the anatomy and sequencing of objects through interactive geometry,
step-by-step camera framing, independent schematic views, a browsable manual
and tool-motion cues. It is an original open-source experiment inspired by
[Ryan Sael's interactive flatpack demonstration](https://x.com/RyanSael/status/2112178744937103607)
([live demo](https://sael.net/flatpack/)); the original creator is credited
and no original source art or vendor instructions are included here.

## What is working

- **Five projects:** BILLY-inspired bookcase (14 stages, 11 panel/82 hardware
  visual placeholders); LACK-inspired table; doghouse concept; fence bay;
  modular PC workstation concept.
- **3D interaction:** independent WebGL2 rendering, orbit, wheel/pinch zoom,
  scripted camera close-ups, reversible scrub, forward/back and playback.
  Room and Drawing modes; independently drawn driver/hammer tool cues.
- **Manuals:** generated per-step SVG schematic, full-screen step browser with
  click-to-jump, phase/dependency/caution copy, material category counters.
- **Extensibility:** versioned AssemblySpec v1 JSON import/export, explicit
  provenance, ordered prerequisites, review gate and bounded geometry.
- **Accessibility:** keyboard arrows/space/M, CSS reduced motion, native
  dialog semantics, text/SVG-only fallback if WebGL is unavailable.
- **No dependencies at runtime:** ES modules + WebGL2. Node 20+ for unit tests;
  Python 3 + Playwright for browser acceptance (run in GitHub Actions).

## Get started

```sh
python3 -m http.server 4173
# open http://localhost:4173
npm run check
```

Use the project buttons to switch scenes. `OPEN INTERACTIVE MANUAL` opens the
independently generated schematic booklet, with jump links to the 3D model.
`EXPORT SPEC` produces a JSON illustration; `IMPORT JSON` accepts a bounded
versioned `AssemblySpec` after validation. Data never becomes a verified physical
plan merely because it renders successfully.

For a source-backed project, start by reviewing [AssemblySpec v1](docs/ASSEMBLY_SPEC.md)
then verify **each** material, count, source version, operation, support load,
and safety prerequisite against the actual vendor/manual or engineered plan.
A PDF-to-plan workflow is a future gated proposal, not an implemented promise.

## Documentation

- [AssemblySpec and DIY authoring](docs/ASSEMBLY_SPEC.md)
- [Observed feature coverage and limits](docs/PARITY.md)
- [Verified source investigation](docs/VERIFIED_REFERENCE.md)
- [Project roadmap](docs/ROADMAP.md)
- [Provenance](docs/PROVENANCE.md)

## Safety and licensing

Everything shipped here is illustrative; no custom JSON or built-in scene is
validated for physical use. Furniture requires exact SKU-specific instructions
and anchoring; doghouses require animal comfort/weather checks; fences require
boundary/utility/code review; PCs require component, electrical and thermal
checks. Never use a rendering to override manufacturer safety guidance.

Our original code is MIT licensed (see [LICENSE](LICENSE)). The project does
not grant a license to IKEA manuals or models, Ryan Sael's demonstration, or
any other third-party artwork. No reference video, cookies or private capture
is committed here. Open source contributions should retain original author
attribution and source provenance.
