# Black Rock Talk — prototype requirements and provider review

Reviewed 14 October 2026. Product: Black Rock Talk, within BLACKROCK LAB.
Repository: One-line. Preserve existing code and approved assets. A separate
Lagutiny family brand was requested; it does not rename the repository.

## Acceptance criteria

- First live voice call between two people, without VPN, using one invitation link.
- No participant registration, payment data, subscription or paid add-ons for testing.
- Creator gets a created room and share/copy link before microphone join completes.
- Browser permission remains mandatory for microphone capture.
- Two simultaneous participants; provider must refuse a third atomically.
- A 60-second waiting deadline closes the client session if no guest arrives.
- Show call duration after guest arrival; no fake connected state before joining.
- Clear landing, preparation, SDK load, microphone, room and failure states.
- Stable element dimensions for each viewport; long text stays inside its box.
- Premium dark Aurora interface, visible floating gradients, subtle avatar motion.
- Shared mobile-first website/Telegram Mini App UI, iPhone/Android safe areas.
- Russian, English, Arabic, device-locale default, manual override, Arabic RTL.
- Text chat overlay; no durable chat history or audio recording.
- Logs contain technical stages and safe reason codes, not tokens/audio/messages.
- Invitation capability model must eventually enforce creator/admitted-member access.
- V2: up to ten family members, paid larger rooms, USD prices, shared family payment.
- Do not claim Russian/UAE reachability until real network and physical-device tests.
- No automatic purchases, billing upgrades, card entry or secret publication.

## Verified existing state

Daily REST room creation and meeting-token issuance succeed. Real Chromium SDK
entry fails with `account-missing-payment-method`. This is an account gate,
not evidence of blocked media routes. Standalone API success is not voice proof.
The SDK supports managed voice and ephemeral messages. Own WebRTC/Node/coturn
implementation is preserved; its local RTP/chat tests passed, not public reachability.

## Candidate review

| Candidate | Free offer observed | No-card evidence | Integration and suitability |
|---|---|---|---|
| LiveKit Cloud Build | 5,000 WebRTC minutes, 50GB downstream transfer; $0/mo | Pricing explicitly says no credit card; official GitHub README agrees | Best verified no-card candidate; API tokens/SFU/SDK; own frontend can stay |
| Daily | 10,000 participant-minutes/month | Current account refuses calls without payment method; pricing does not resolve this | Existing integration; ask provider to activate a no-card trial before further use |
| Agora | First 10,000 combined RTC minutes/month | Not confirmed from page | Mature managed RTC; token backend and new client integration required |
| 100ms | 10,000 conferencing minutes/month | Not confirmed from page | Managed rooms/SDK; must verify actual account activation before adopting |
| Cloudflare Realtime SFU/TURN | Shared first 1,000GB/month, then $0.05/GB | Not confirmed | Lower-level implementation; Russian access requires particular scrutiny/tests |
| PeerJS + Metered | Public signaling; Metered advertises 20GB TURN/month | Metered no-card registration not confirmed | More own admission/signaling logic, two independent services |
| meet.jit.si | Hosted public service | No card is not proof of anonymous hosting | Official notice requires creator authentication; clashes with no-registration flow |
| Self-hosted LiveKit | OSS software | No subscription for software | Requires an actual public host and media/TURN ports; hosting is not guaranteed free |
| MiroTalk P2P | OSS and demo | Hosting terms/availability unverified | Useful reference for small-room UX and WebRTC; own public backend required |
| Peer Calls | OSS | Hosting needed | Reference for P2P/SFU, invitations and media; not free infrastructure by itself |
| coturn | OSS TURN/STUN | Hosting needed | Relay component only, not room service or frontend |
| OpenVidu Community | Free software | Paid PRO trial requires card on reviewed legacy page | Own hosting needed; legacy PRO page is not a current Cloud free-trial guarantee |

No candidate has been verified for a Russia ↔ Dubai voice call here.
No paid plan or payment method was added in this review.

## Daily billing constraints

The first 10,000 participant-minutes are advertised free. FAQ says calls do not
stop automatically after this quota; usage becomes billable. Advanced Firewall
Control (IP Proxy/TURN override) is a $500/month add-on, not included voice minutes.
Do not enable it for this free test. Forced ICE customization is account gated
in the inspected SDK call-machine implementation.

A 5-minute test with two people consumes 10 participant-minutes if it joins.
This is below a new untouched quota but does not prove the account's remaining
balance or eligibility. Provider activation is distinct from advertised quota.

## Evidence sources

- https://livekit.io/pricing
- https://github.com/livekit/livekit
- https://livekit.io/legal/terms-of-service
- https://www.daily.co/pricing/video-sdk/
- https://www.daily.co/legal/terms-of-service/
- https://www.daily.co/legal/privacy/
- https://www.agora.io/en/pricing/
- https://www.100ms.live/pricing
- https://developers.cloudflare.com/realtime/sfu/platform/pricing/
- https://www.metered.ca/tools/openrelay/
- https://peerjs.com/
- https://jitsi.org/blog/authentication-on-meet-jit-si/
- https://github.com/miroslavpejic85/mirotalk
- https://github.com/peer-calls/peer-calls
- https://github.com/coturn/coturn
- https://openvidu.io/pricing/ (page explicitly labels itself old-version docs)

## Latest Daily no-card trial experiment

An isolated public room with max_participants=2 and 15-minute expiry was
created via the real REST API. A real browser SDK join without a meeting token
(public-room mode) also failed with account-missing-payment-method. The earlier
private-token room produced the same error. Room privacy does not remove the
account gate. No successful voice minutes were established in this test.
A provider request is prepared in DAILY_FREE_TRIAL_REQUEST.md; it was not sent.
