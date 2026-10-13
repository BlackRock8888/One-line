# Black Rock Talk

One room. Two voices. No accounts. Product name: **Black Rock Talk**. Repository technical name: **One-line**; repository and existing source documents are not renamed.

## Stage 1

Midnight Aurora mobile interface, local polygonal orange SVG fox, reduced motion, microphone permission handling, voice-reactive local avatar, mute/leave and preview sharing. The interface explicitly labels microphone preview: **there is no two-person call yet**.

Zero runtime dependencies. Node 22+: `npm run dev` (http://localhost:3000), `npm run build` (static `dist/`). Vercel uses the included configuration. HTTPS is required for microphone access outside localhost.

## Next stages

Authoritative atomic two-slot occupancy with leases and TTL, authenticated signaling, WebRTC audio, separate local/remote levels, configured STUN/TURN, deployment and real iPhone/cross-network QA. Never use a PeerJS name collision as room capacity enforcement. Stateless frontend hosting must not use process-local occupancy as global state; use a single authoritative signaling process or atomic shared storage.

No recording code. No audio upload in this stage. Browser audio samples are analyzed locally and discarded. Infrastructure metadata is outside that claim.

## Audit — 2026-10-13

Read both Drive Markdown handoffs and Project Archive, Claude Execution Handoff and source backup. Existing `main` head: `cc354a09bc8c681e7c1da26b1617b59157d4b481`; only README existed. GitHub reports push/admin access. Local clone failed because the configured proxy was unreachable; writes use the authorized GitHub API with an expected-head lease.

Existing Vercel project `one-line`: `prj_YUDyS3oOLUjmonNBIgdsHy1Ed1tX`. Deployment read returned 403 for team `team_DJwz0Obl3bTRiMY44onnjRGe`; Vercel CLI is absent. No deployment is claimed.

Stage 1 validation: build and syntax checks passed; Chromium browser QA passed at 320/390/1440px, synthetic microphone amplitude response, mute, leave, permission denial and reduced motion; no page errors. Physical iPhone and real microphone are not yet tested. Vercel project read confirms live=false and latestDeployment=null.
