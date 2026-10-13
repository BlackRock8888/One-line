# Black Rock Talk — minimal MVP deployment

Scope: one room, exactly two participants, link entry, no signup, audio only, polygon fox, mute/leave/invite. Family rooms, subscriptions and balances are v2.

## Current architecture

- `public/`: static mobile interface.
- `src/server.js`: one persistent authoritative Node process; room leases expire after 45 seconds without polling. No horizontal replicas for the current in-memory room.
- `api/`: stateless Vercel HTTP proxies to `SIGNALING_ORIGIN`; room state remains exclusively on the authoritative process.
- TURN: externally reachable coturn with TCP/TLS fallback and expiring shared-secret credentials. Do not deploy the local QA credentials publicly.

## Server

Node 22+ (24 recommended): copy `.env.example` to `.env`, configure the environment privately, then `node --env-file=.env src/server.js`. Run one instance under a process supervisor, expose it through HTTPS, disable request-body logs. Set `TURN_URLS` to a JSON array of real TURN URLs and `TURN_SECRET` to the same private shared secret configured on coturn. Credentials issued to authenticated room participants expire in one hour. Keep the shared secret server-side.

`ICE_SERVERS_JSON` is an alternative for a controlled test with already issued temporary credentials. It must not contain public long-lived credentials. If neither TURN option is configured, cross-network audio is not assured.

A server restart drops leases and active room signaling; the browser must rejoin. Automatic ICE restart on a network change is not implemented in this minimal version. Safari backgrounding and screen locking need physical-device QA.

## Vercel

Use existing project `one-line`; never rename the GitHub repository. Set `SIGNALING_ORIGIN` to the HTTPS origin of the single server, then deploy the reviewed source. The proxy returns `SERVER_UNCONFIGURED` if this variable is missing. Production proxy rejects HTTP upstreams. Static output is built using `npm run build`.

No public deployment has been made. Deployment itself, proxy routes on Vercel, and production network access remain to be verified.

## Checks before showing a public result

1. `npm test`: capacity under concurrent requests, token authentication, TTL, leave, authenticated TURN configuration and proxy behavior.
2. Browser: `BASE_URL=https://actual-preview python scripts/call_qa.py` in a controlled QA environment with Python Playwright and Chromium. Uses synthetic microphone; does not replace physical-device testing.
3. Confirm two sessions exchange RTP in both directions; third denied; leave frees a slot; microphone stops.
4. Physical iPhone Safari + second phone, then Wi-Fi/cellular, playback permission, interruption/rejoin.
5. For Russia–Dubai, confirm permitted service provision and actual connectivity on the two operators. No universal availability claim.

## Local relay reproduction

Browser policy in the managed environment forbids non-proxied UDP. Successful QA used local coturn 4.6.3 with TCP transport; managed browser policy was preserved. Image digest: `coturn/coturn@sha256:71c3c990283385567f11794ee692e3a47b66fd9b0bb39e42afbe776e331dd888`.

Bind the local test listener only to 127.0.0.1 and use disposable local credentials. TLS was not used on this loopback-only QA listener; public deployment requires TLS and expiring credentials. Audio tests passed over the relay with real RTP packets generated from Chromium's synthetic microphone.
