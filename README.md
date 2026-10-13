# Black Rock Talk

One room. Two voices. No accounts. Product name: **Black Rock Talk**; repository technical name remains **One-line**.

## Minimal MVP

Midnight Aurora mobile interface, local polygonal SVG fox, local/remote voice levels, connect/mute/leave/invite, atomic two-place room, third participant denied, temporary session tokens, heartbeat/45-second TTL, authenticated short-lived TURN configuration. No audio recording or transcription code.

Zero runtime dependencies, Node 22+: `npm run dev` (http://localhost:3000), `npm test`, `npm run build`. External devices need HTTPS. Configure real TURN for cross-network connectivity; see [.env.example](.env.example).

One persistent Node process holds authoritative room state. Vercel hosts the interface and stateless HTTP proxies to `SIGNALING_ORIGIN`. Never scale independent copies of the in-memory room. [Deployment runbook](docs/MVP_RUNBOOK.md).

## Verified locally, 2026-10-13

- Node integration tests: ten concurrent joins accept exactly two; invalid session token rejected; leave releases capacity; TTL recovery; authenticated TURN configuration; proxy preserves capacity.
- Chromium, three isolated sessions, synthetic microphone, local coturn TCP relay: two WebRTC sessions connected and received audio RTP in both directions. Third denied and its microphone stopped. After one participant left, the replacement connected.
- Mute changes the real audio track; leave stops microphone tracks. Avatar reacts to audio. Permission denial, widths 320/390/1440 and reduced motion passed; no page JavaScript errors.
- Build and syntax checks pass.

These tests do not establish physical iPhone playback, production Vercel routes, public relay availability or Russia–Dubai connectivity. Public deployment is not claimed. GitHub push/API write return 403 despite owner-level repository permissions; local commits are not yet published. [Status](STATUS.md).

## Version 2 only

Family rooms up to 10 devices, persistent family links, subscriptions, shared prepaid balance and individual contributions are deferred until the minimal MVP is published and accepted. [v2 plan](docs/FAMILY_ROOMS_PLAN.md).
