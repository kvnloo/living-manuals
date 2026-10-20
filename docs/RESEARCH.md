# Source investigation / evidence ledger

Captured: 2026-10-20 (UTC). Scope: public presentation, not private source or licensing bypass.

| Claim | Evidence | Confidence |
|---|---|---|
| Ryan Sael published an interactive 3D IKEA BILLY assembly study on Oct 19, 2026 | https://x.com/RyanSael/status/2112178744937103607 ; indexed quotation: “IKEA manuals, but they come to life ...” | High for stated intent |
| Public demo advertised by the author | https://sael.net/flatpack (link recovered from the post via public search index) | High for public URL; runtime inaccessible to this environment |
| Original animation curve, internal asset types, frame graph, step count, PDF alignment, and renderer | Not obtained. Do **not** infer from the video/post. | Unknown |
| Reverse Engineer Anything (REA) can record approved browser observations using local CDP | https://github.com/morluto/rea (official project). See its browser-observation guide; CDP must be explicitly enabled/allowlisted. | Supported tooling, **not run** here |
| Agent Reach routes public X reads via twitter-cli / OpenCLI and validates available backends | https://github.com/Panniantong/Agent-Reach | Supported tooling, **not run** here |
| `img2threejs` reconstructs procedural, animation-ready Three.js from images | https://github.com/kvnloo/img2threejs | Existing integration target, **not integrated** yet |
| User's IKEA GLB tool is a third-party fork intended for downloading product visualizations | https://github.com/kvnloo/IKEA-3D-Model-Download-Button | Research only. Asset usage subject to permission/ToS. |

## Limitations and decisions

The original demo page and X page were not available to this environment for direct source/DOM/CDP observation. Only indexed public descriptions and the extracted demo URL were obtained. We therefore built an **independent, illustrative functional prototype**. No copies of the original author's site, bundles, models or IKEA instructions are included.

### Agent Reach: obtain public reference evidence locally

Install after reviewing its official instructions. On a trusted user-owned computer with an authorized X browser session:

```bash
agent-reach doctor --json
# Agent Reach is the installer/doctor; its chosen X client is used to read the post.
# Current documented twitter-cli command (after supplying credentials locally):
twitter tweet 'https://x.com/RyanSael/status/2112178744937103607'
```

**Do not** commit cookies, bearer tokens, network captures with personal session metadata, or download protected assets. Prefer public metadata and manually approved observations. The X client may need credentials; the sandbox running this study did not have such access.

### REA: compare the public demo without guessing at the stack

Use the official [REA setup](https://github.com/morluto/rea) on a local supported Node.js installation (`22.19+`, `24.11+`, or `26+` at the time of writing). Open `https://sael.net/flatpack` yourself in a dedicated Chrome/Chromium profile with a **loopback-only** CDP port, then explicitly approve the target origin:

```bash
npx rea-agents@latest setup
# Restart the coding agent after reviewing setup changes.
# In a dedicated shell whose browser is under your control:
export REA_BROWSER_OBSERVE_ENABLED=true
export REA_BROWSER_CDP_ENDPOINTS_JSON='["http://127.0.0.1:9222"]'
export REA_BROWSER_ALLOWED_ORIGINS_JSON='["https://sael.net"]'
# Use the REA version's documented browser list/inspect commands.
rea list-browser-targets http://127.0.0.1:9222 --approved --json
rea inspect-web-page http://127.0.0.1:9222 TARGET_ID --approved --json
```

Only if these exact commands exist on the installed REA version. Record approved screenshot/DOM/JS/network metadata with redaction, then answer one bounded question at a time: 1) what changes when advancing one step? 2) how are parts identified? 3) how does the camera reposition? 4) which interactions are accessible? Store observations as source URLs, screenshots with permission, structured step states and *confidence*, not lifted source code.

## Reverse-engineering comparison protocol

1. Human opens the original and exercises one control. Capture frame and URL with timestamp, test scenario, viewport, and user-approved evidence.
2. Write behavior assertions in `observations/*.json`: action, input, observed output, unknowns, attribution.
3. Implement independently using our own scene geometry and animation layer. Do not reuse proprietary drawings, disallowed 3D models, branding assets or code.
4. Execute same steps in this prototype; compare qualitative transitions. Attach screenshots only with permission. File differences between *observations* and *inferences* explicitly.
5. Mark unknown/unsafe instructions as needing human verification. Never auto-approve a safety-critical assembly step from a single drawing.
