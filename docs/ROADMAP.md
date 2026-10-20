# Roadmap — manuals into executable, reviewable 3D guides

## 0. Done: deterministic, zero-dependency preview

- [x] Browser-only procedural study with nine parts and nine states
- [x] Reversible, scrubbable transforms and deterministic part IDs
- [x] WebGL orbit/zoom, step navigation, playback, keyboard and responsive layout
- [x] Authoring contract validation and fast, offline unit tests
- [x] Attribution, safety warning, and observation ledger

## 1. Next: evidence gathering and visual equivalence

- [ ] Use Agent Reach with the authorized public X post; archive link, quote, clip metadata, date and credit
- [ ] Use REA's passive, allowlisted local CDP observation on `https://sael.net/flatpack`
- [ ] Record a behavior matrix: step changes, camera, scrubbing, highlighting, accessibility, viewport
- [ ] Cross-check geometry/step details against official *specific variant* assembly instructions
- [ ] Automated browser screenshots at desktop/mobile widths and no-WebGL fallback
- [ ] Fix discrepancies and publish a demo deployment

## 2. Manual → validated AssemblySpec

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
