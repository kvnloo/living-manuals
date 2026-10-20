# Evidence-based feature coverage · Ryan Sael flatpack study

**Reference:** [Ryan Sael's original public demo](https://x.com/RyanSael/status/2112178744937103607)
(viewed frame by frame, 2026-10-20), [interactive site](https://sael.net/flatpack/)
(passively inspected via REA/CDP). Credit goes to the original creator.
Our independent implementation does not reuse source code, images, original
manual pages, room assets or IKEA models. [Source evidence](VERIFIED_REFERENCE.md).

## Feature checklist

| Observed behavior | Independent implementation | Boundaries |
| --- | --- | --- |
| Multi-step BILLY timeline (14 stages) | **Yes**: reversible indexed interpolation and animated playback | Illustrative step contents; not vendor operations |
| Two product options (BILLY, LACK) | **Yes**: BILLY and LACK-inspired independent model; also doghouse, fence, PC | LACK dimensions/parts not vendor verified |
| Panel and hardware counters | **Yes**: per-category individual part instances, time-based counts and configurable fence bays | 11/82 are parity placeholders, not IKEA bill of materials |
| Room and Drawing switches | **Yes**: warm procedural context plus technical high contrast | Not photorealistic or physically identical to the reference room |
| Close-up cameras per operation | **Yes**: scripted camera framing, projected labels, part inspector, orbit/reset, wheel/pinch zoom | Authored viewpoints approximate the source's behavior |
| Animated small connectors | **Yes**: separate box/cylinder fasteners | Connector locations do not assert real drilling or tightening locations |
| Animated tools beside connectors | **Yes**: driver/hammer/drill visual props tied to the active step | Motion is a teaching cue, not actual safe tool usage |
| Manual thumbnail and expanded manual | **Yes**: generated per-stage 2D vector schematic and full-screen browsable overlay | No original IKEA drawings may be reproduced without permission |
| Next/previous/play/scrub | **Yes** | Verified in real browser tests |
| Mobile and accessible fallback | **Yes**: responsive control layout, reduced motion, keyboard navigation, no-WebGL vector viewer | Touch hardware device testing remains separately recommended |
| Precise physical sequence, BOM or tolerances | **No** | Requires exact manufacturer edition and human review |
| Photorealistic environment and animation fidelity | **No** | Independent procedural room; screenshot parity would require licensed models/textures |

**Interpretation:** feature *coverage* is not pixel-level, physical, artistic or
instructional parity. Do not call this a validated guide to building a real
product. Each visually inspired behavior is implemented independently and
checked with unit and browser tests; mechanical correctness remains unclaimed.
