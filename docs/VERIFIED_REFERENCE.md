# Verified reference investigation — Ryan Sael's Flat Pack

Date: **2026-10-20 UTC**. Subject: [the original X post](https://x.com/RyanSael/status/2112178744937103607) and [the live interactive experience](https://sael.net/flatpack/).

**Original creator and credit: [Ryan Sael](https://sael.net/).** This is an independent behavior study, not a copy of Ryan's implementation or IKEA's instructions. No proprietary source, original video, instructions, or models are committed here.

## How this was verified

Reproducible [GitHub Actions investigation](https://github.com/kvnloo/living-manuals/actions/runs/39382805312), run on Ubuntu 24.04 with Node 22.19:

1. Installed [Agent Reach](https://github.com/Panniantong/Agent-Reach) using its official `pipx` instructions and ran its installer/doctor. The `twitter tweet` backend returned `not_authenticated` because no X cookies were present; **do not claim this backend was able to read the post**.
2. Installed `yt-dlp`, which successfully retrieved the public **32-second, 1920×1080 video** without credentials. Retrieved post metadata also through the public FxTwitter endpoint and Jina Reader. Manually inspected the video across all 32 seconds, including individual high-resolution frames.
3. Installed official [REA](https://github.com/morluto/rea) via `npm install -g rea-agents@latest` and actually ran its loopback-only Chrome DevTools Protocol commands: `list-browser-targets`, `inspect-web-page`, `analyze-web-bundle` and `capture-web-screenshot` against `https://sael.net/flatpack/`. Chrome was a disposable browser profile; no logged-in sessions were attached.
4. The REA capture reported **839 DOM nodes**, **335 accessibility nodes**, **15 observed scripts**, and **13 statically analyzed scripts** (no parse failures). This is passive/bounded evidence, not a source-code recovery or proof of implementation internals.

Artifacts including tool logs, REA observations, and sampled-video source are available in the run's `original-reference-investigation` artifact for three days. The artifact is temporary; original footage must not be committed to this repository.

## What was actually observed

| Feature | Evidence | Confidence |
|---|---|---|
| Product-specific guide with 14 build steps | Video overlay and live CDP screenshot, which shows "step 3 of 14" | Observed |
| Cumulative inventory counters | Live capture displays "hardware in 28/82" and "panels in 2/11" | Observed |
| Playback, previous/next, range timeline | Live accessibility tree: Previous step, Play, Next step, Assembly timeline | Observed |
| Room / Drawing switch | Video around 14–17s; CDP shows both mode buttons | Observed |
| Camera framing of each operation | Video moves from exploded setup to very tight fastener views, then back to room | Observed |
| Animated hardware and individual parts | Video ~2–5s shows holes, cam screws and screwdriver; ~18–19s nails/back board; ~26–27s shelf pins | Observed |
| Manufacturer diagram linked to current operation | Left diagram thumbnails throughout the video; full-screen manual overlay at ~21–22s with highlighted step | Observed |
| Multiple products | "BILLY bookcase" and "LACK table" controls in live accessibility tree | Observed |
| Manual opens to a 16-page BILLY instruction document | Video around 22s shows "BILLY assembly instructions ... 16 pages" | Observed |
| Three.js runtime | REA script inventory references `https://sael.net/lib/three-0.183.2.js` | Observed |
| Original geometry generation method or source CAD | Not established by REA's bounded script/DOM analysis | Unknown |
| Ease curves, constraints, exact part measurements, all 14 per-step operations | Video is insufficient to verify fully | Unknown |

### Video storyboard

- **0–1 s:** Room overview. Flat kit distributed on a floor-scale guide; virtual bookcase outline in background.
- **2–5 s:** Close-up of predrilled boards; animated hardware insertion and a screwdriver.
- **6–13 s:** Broad view, then boards pivot/align into the case and a tool operates near the joint.
- **14–17 s:** Drawing-like monochrome 3D view; spatial assembly remains aligned to the illustrated instructions.
- **18–20 s:** Backing panel/fastener sequence; dark room presentation resumes.
- **21–22 s:** Enlarged original IKEA manual displayed beside the live 3D scene, with the current step highlighted.
- **23–25 s:** Cabinet rotates upright; assembly continues in the furnished room.
- **26–27 s:** Shelf pin close-up.
- **28–31 s:** Adjustable shelves installed; finished upright BILLY bookcase.

Frames alone cannot establish all action parameters or physical correctness.

## Gap to the independent `living-manuals` prototype

Our current sample has **9 teaching states and 9 board-like parts**, illustrative geometry, step scrubbing, orbit/zoom and deterministic interpolation. It **does not** match the original's 14-step hardware-level sequence, tool motions, step-specific camera shots, room/drawing modes, full manual alignment, second product, or scene quality. Do **not** describe the sample as a reproduction of the observed video.

### Prioritized implementation plan

1. **Evidence-backed `AssemblySpec`:** schema for product SKU/manual version, `parts`, `hardware`, fastener counts, `steps`, `manual_page`, instruction region, per-step attribution/confidence and safety review. Test sum of counters and consistent IDs.
2. **Operation timeline:** distinguish move, rotate, insert, screw, nail, and place; preserve reversible normalized motion without pretending the simulation physically certifies correct assembly.
3. **Camera director + two scene styles:** separate reproducible camera keyframes from assembly state; add high-contrast drawing mode without copying the reference's art or shader source.
4. **Manual companion:** link official manufacturer PDF for the exact SKU, label pages and highlight the relevant step from human-reviewed metadata; no copied manual images in the repo.
5. **Hardware visualization:** procedural low-poly cylinder/screw/dowel primitives and optional labels. Build fastener-count tests and contact/collision quality gates.
6. **UI and browser validation:** 14-step timeline, step/part counts, keyboard access, mobile screenshots and actual browser smoke tests. Treat LACK as an independent future fixture, not a claim of parity.
7. **Geometry plug-ins:** optionally use [img2threejs](https://github.com/kvnloo/img2threejs) and licensed/user-owned CAD/GLB inputs; keep underlying geometry provenance.

**Safety:** real assembly remains governed by the exact official IKEA instructions and anchoring requirements, not this illustrative recreation.

## Tool limitations and reproducibility

The initial ChatGPT sandbox lacked external DNS and had Node 22.16, below REA's supported Node 22.19+ requirement. Installation and observation therefore took place on an ephemeral GitHub-hosted runner. Agent Reach's cookie-requiring Twitter backend remained blocked, but `yt-dlp` independently retrieved the public media. REA observed the public site using a Chrome 155 ephemeral profile. GitHub CI logs and the retained evidence bundle document the actual results; this was **not** an unattended local desktop installation.
