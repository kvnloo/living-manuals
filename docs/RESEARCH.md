# Evidence ledger

**Verified October 20, 2026:** [Actual video + live browser/REA investigation](VERIFIED_REFERENCE.md). This replaces the early second-hand-only research status.

| Claim | Direct evidence | Confidence |
|---|---|---|
| Ryan Sael authored a BILLY animated instructional demo | Original [X post](https://x.com/RyanSael/status/2112178744937103607), captured metadata, directly inspected 32-second video | Observed |
| Live demo address is real and accessible | [sael.net/flatpack/](https://sael.net/flatpack/) returned HTTP 200 and a matching page in the REA browser | Observed |
| Guided timeline uses 14 steps, with hardware and panel counters | Live screenshot and video (3/14; 28/82 hardware; 2/11 panels) | Observed |
| Room/drawing views, tool/hardware animation, step-linked manufacturer diagrams | Direct video frames and REA accessibility snapshot | Observed |
| Site loads Three.js 0.183.2 | REA script inventory: `/lib/three-0.183.2.js` | Observed |
| Internal geometry pipeline, exact model measurements, easing implementation, licensing of source assets | Not established from bounded public observation | Unknown |
| Our independent 9-part, 9-state prototype matches all original behavior | False; large verified fidelity gap | Rejected |

## Tool execution and limitations

The [networked GitHub Actions research run](https://github.com/kvnloo/living-manuals/actions/runs/39382805312) installed [Agent Reach](https://github.com/Panniantong/Agent-Reach) and [REA](https://github.com/morluto/rea) on an ephemeral Ubuntu runner.

- Agent Reach: installed, installer/doctor executed. Its direct `twitter tweet` client **failed because no authorized account cookies existed**. Never describe that command as a successful retrieval.
- The public video was instead obtained by `yt-dlp` without X login, and its metadata cross-checked with an unauthenticated FxTwitter response.
- REA: successful Chrome/CDP target discovery, web-page inspection, 13-script static-bundle analysis and screenshot of the **live original site**. These are observations, not proof of original authoring decisions or recovered source.
- Local sandbox: outbound DNS was unavailable; Node 22.16 was below REA's current 22.19+ requirement. The two installations on the ephemeral runner are **not** persistent ChatGPT plugins or tools across future sessions.
- GitHub Actions evidence artifacts are retained for three days. They are not committed to source control.

Reproduce using the checked-in [reference investigation workflow](../.github/workflows/reference-investigation.yml) through manual dispatch from the default branch. When using REA on your own computer, follow the official [CDP browser-observation guide](https://github.com/morluto/rea/blob/main/docs/browser-observation.md): open a dedicated Chrome profile exposing **loopback-only** CDP; call `rea list-browser-targets http://127.0.0.1:9222 --json` then `rea inspect-web-page http://127.0.0.1:9222 TARGET_ID --json`. Do not use guessed `--approved` flags or unverified env settings.

## Implementation policy

Maintain separate evidence, inferred design decisions, and implementation tests. Preserve [Ryan's authorship](PROVENANCE.md); use original video and manufacturer instructions only as references. No proprietary JS, IKEA instruction scans, video, or source 3D models are bundled. Physical assembly and anchoring instructions require validation against an exact manufacturer manual and human review.
