# Roadmap — manuals into executable, reviewable 3D guides

## 0. Done: deterministic, zero-dependency preview

- [x] Browser-only procedural study with nine parts and nine states
- [x] Reversible, scrubbable transforms and deterministic part IDs
- [x] WebGL orbit/zoom, step navigation, playback, keyboard and responsive layout
- [x] Authoring contract validation and fast, offline unit tests
- [x] Attribution, safety warning, and observation ledger

## 1. Next: evidence gathering and visual equivalence

- [x] Install Agent Reach and run doctor on an ephemeral GitHub runner; its X client required cookies, so public media was instead retrieved with yt-dlp and post metadata with FxTwitter/Jina
- [x] Run REA on `https://sael.net/flatpack/`: confirmed HTTP 200, passive CDP/DOM/A11y/screenshot and 13-script static analysis
- [x] Record directly observed 32-second video storyboard, 14-step timeline, hardware/panel totals, manual, view modes and camera behavior in [VERIFIED_REFERENCE.md](VERIFIED_REFERENCE.md)
- [ ] Capture every step individually and test camera/animation transition equivalence with an interactive browser scenario
- [ ] Cross-check geometry/step details against official *specific variant* assembly instructions
- [ ] Automated browser screenshots at desktop/mobile widths and no-WebGL fallback
- [ ] Fix discrepancies and publish a demo deployment

## 2. Manual → validated AssemblySpec

**Verified fidelity gap to close:** original supports 14 steps, 82 hardware and 11 panels, Room/Drawing, step-aligned manual thumbnails, fastener/tool animation and a second LACK fixture. Our 9-state / 9-part sample does not. Reimplement behavior independently, without reusing the author's JS/assets.

- [ ] PDF/image page reader; respect copyright, persist provenance not redistributable source
- [ ] Visual part/hardware detection + labels + quantities + dimensions + uncertainty
- [ ] Step graph (prerequisites, operations, human safety gates), versioned JSON schema
- [ ] Independent deterministic validations: unique IDs, tolerances, BOM coverage, conflicts, graph acyclicity, collision/clearance checks
- [ ] Review UI allowing a person to correct extracted part count, transform, graph, safety warnings
- [ ] Never mark an inferred operation verified without source and reviewer

## 3. Geometry providers, then reuse everywhere

- [ ] Adapter to **img2threejs** for procedural part shape and animation-ready pivots
- [ ] Optional Three.js + glTF/GLB loader for user-owned/licensed CAD assets; no involuntary scraping
- [ ] Model-quality gates: exact dimensions when verified, topology/contacts, repeatability, runtime budget
- [ ] Camera keyframes, ghost parts, socket/fastener details, exploded views, highlighting and AR handoff
- [ ] Export JSON timeline and optional glTF/GLB for ACE / built-environment twins / construction demos

## Success criteria

- **Correctness:** each assembly operation explains why/where a part moves; explicit uncertainty and manual version.
- **Repeatability:** same AssemblySpec → identical transforms at any normalized step time.
- **Usability:** play, reverse, skip, mobile and keyboard work with low latency.
- **Safety:** no invented fastener or anchoring instruction; manufacturer documents govern real assembly.
- **Provenance:** every source, borrowed asset, contributor and original author receives credit.
