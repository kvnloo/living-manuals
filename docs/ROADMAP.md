# Roadmap — manual evidence -> interactive assembly -> reviewed twins

## 0. Completed: baseline and verified source investigation

- [x] 9-state deterministic WebGL study, camera orbit/zoom and scrub
- [x] Source/provenance ledger, MIT runtime and tests
- [x] Reference video retrieved with `yt-dlp` and frames **actually inspected**
- [x] REA/CDP observation of the live Ryan Sael demo; original author credited
- [x] Separate what was observed (14 steps, two inventories, drawing/room) from what is inferred

See [VERIFIED_REFERENCE.md](VERIFIED_REFERENCE.md). Agent Reach installed, but its anonymous X backend was not authenticated; don't claim it fetched the original tweet.

## 1. Implemented: independent feature-parity experiment

- [x] 14 teaching states with reversible deterministic animations
- [x] Illustrated 11-panel / 82-hardware **placeholder model**, individual fastener meshes and two inventory counters
- [x] Room / Drawing visual modes; authored camera close-ups + manual orbit/reset
- [x] Procedural SVG operation card showing the stage's modeled parts
- [x] WebGL-unavailable fallback preserving user control and text
- [x] Offline validation including invalid camera, duplicate IDs, contradictory ownership, hardware visibility
- [x] Desktop/mobile browser regression suite in CI (strict real WebGL2) and local limited tests

**Caveat:** Model counts/placements deliberately imitate demonstration categories for a rendering experiment; they are **not** measurements, vendor inventory or instructions. No official images, documents, meshes or code are bundled. The reference's feature names do not establish behavior/visual parity.

## 2. Next: browser visual QA and accurate reference provenance

- [ ] Review GitHub Actions browser screenshots at desktop and mobile sizes with real WebGL2; fix any gaps
- [ ] Verify camera/drag/wheel/pinch/keyboard behavior on real mobile touch hardware
- [ ] Add subtle tool representation and in-scene alignment callouts, without inventing assembly steps
- [ ] Measure draw-call count, p50/p95 frame intervals and rendering throughput for many hardware pieces
- [ ] Match camera transitions against time-coded observed scenes, while retaining accessible alternatives
- [ ] Deploy static preview, archive screenshot diff and performance budget in the canonical issue

## 3. Source-backed assembly specifications

- [ ] Choose exact product and manual version (manufacturer document link, SKU, dimensions)
- [ ] Human-review the real BOM, geometry, hardware category and operation sequence
- [ ] Define versioned `AssemblySpec` JSON Schema; evidence/provenance fields per part and safety prerequisite
- [ ] Validate step DAG, dimensions, ID uniqueness, bill-of-materials coverage, pose and socket tolerances
- [ ] PDF/image importer proposes candidates with uncertainty; preserve legal source link rather than source assets
- [ ] Review UI for ambiguous connections, fastener counts, instructions and anchoring rules
- [ ] Explicit release gate: do not label any physical assembly instructions *verified* without human approval

## 4. Geometry integrations and reuse

- [ ] `img2threejs` procedural geometry provider with deterministic scene contract
- [ ] User-owned or expressly licensed glTF/GLB/CAD adapters
- [ ] Automatic collision/clearance checks and physical scale gate
- [ ] Export JSON operation timelines for ACE, construction twins and spatial training

## Safety and source integrity

The 14-stage study is exploratory UX, **not** the IKEA assembly sequence. Use official product instructions and correct wall anchoring for actual furniture. Cite original creators and separate observed facts from assumptions. No authentication cookies, copyrighted original video/manual artwork or proprietary source in git.
