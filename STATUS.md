# Black Rock Talk — execution status

2026-10-13. Repository technical name remains One-line.

## Completed and verified

- Read all five Drive source documents.
- Audited main at cc354a09bc8c681e7c1da26b1617b59157d4b481; only README existed.
- Stage 1 local commit 37ca194: interface, SVG fox, microphone preview. Build, JS syntax, responsive Chromium layouts, synthetic microphone levels, mute/leave cleanup, permission denial and reduced motion passed.
- Single-process authoritative occupancy and signaling implemented. Node tests passed: 10 concurrent HTTP joins accept exactly two; third denied, invalid token denied, leave releases a slot, TTL expires stale participants.

## Implemented, not yet fully verified

- WebRTC audio frontend, offer/answer signaling, candidate queues, local/remote level monitoring, mute/leave, autoplay recovery.
- Browser attempt did not connect: managed Chromium policy /etc/chromium/policies/managed/misc.json sets WebRtcIPHandling=disable_non_proxied_udp. SDP offer and answer arrive at both browsers; no ICE candidates are gathered. Need an authorized TURN TCP/TLS configuration to test media in this environment. Do not alter managed policy.
- Current npm build passes. Voice calls are not claimed working.

## External blockers

- GitHub API create_tree returns 403 Resource not accessible by integration. Standard git push with gh auth also returns 403 Permission denied. Owner permissions push/admin do not prove credential write scopes. Local commit not published. APIs list zero visible app installations, which does not establish the absence of installations in the user's account.
- Vercel existing project one-line prj_YUDyS3oOLUjmonNBIgdsHy1Ed1tX belongs to team_DJwz0Obl3bTRiMY44onnjRGe (blackrocksource-9947s-projects). Project read says live=false, latestDeployment=null. Scoped deployments and integrations reads return 403. Vercel CLI absent.
- No configured STUN/TURN credentials or authoritative production backend are available in this managed environment.

## Deployment plan

Current local server is a **single authoritative Node process** with in-memory leases. It must not be deployed as stateless autoscaled functions with independent room state. Either deploy one persistent process plus TURN on an authorized server, or adapt room state to an atomic shared store for Vercel. Static Vercel deployment alone will not implement /api/room endpoints.

Do not deploy current connect UI as a working public call until backend and media QA pass. Re-run tests after infrastructure is connected; physical iPhone and cross-network Russia/Dubai remain acceptance checks.

## Latest scope decision

Family rooms up to 10 devices, persistent family links, subscriptions and shared prepaid balance are **v2 only**. Current release remains one global two-person audio room with link entry, no registration, mute/leave, third participant denied. Aim for the first verified call within 1–2 hours, conditional on infrastructure access. Do not publish unverified voice claims.

## Verified relay milestone

The earlier media test blocker is resolved for **local QA** using coturn TCP. Browser policy was not changed. Three isolated Chromium sessions were tested: two connected with inbound audio RTP counters (first run: 3796 bytes/75 packets and 8512 bytes/152 packets); third denied and microphone stopped; leaving released the slot; a replacement participant connected. Mute, cleanup, permission denial, responsive layout and reduced motion passed. This is synthetic local audio, not a physical-phone or production-network acceptance test.

Authenticated configuration endpoint and one-hour coturn shared-secret credentials added. Stateless Vercel proxies added and integration-tested against the authoritative local server. Actual Vercel deployment remains untested and unauthorized at the existing team scope. GitHub push still returns 403; no published commit claimed.
