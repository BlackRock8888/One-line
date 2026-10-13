# Daily integration

The deployed frontend now uses Daily call-object with our existing UI.
The previous WebRTC implementation is preserved in public/voice.js.

1. Create an account at https://dashboard.daily.co/ and obtain an API key.
2. Add DAILY_API_KEY to Vercel project one-line, Production environment.
3. Redeploy production so the function receives the new variable.
4. Open the app, enter and copy Invite; open that exact link on another device.
5. Verify audio both ways, mute, third-party refusal, chat and history cleanup.

/api/daily/session creates a private room with max_participants=2, a one-hour
expiry and non-owner meeting tokens expiring no later than the room. The
random 128-bit room link acts as an invitation capability. Do not publish it.
Participant tokens are never persisted or logged. Daily transports ephemeral
app messages, but this application does not persist chat history.

The server API has mocked provider tests; these do not prove live Daily audio.
A real key, quota confirmation and physical-device tests are still required.
No billing method or paid plan is activated by this code. Monitor Daily usage
and configure available account spending controls before sharing widely.
The frontend SDK is pinned to 0.85.0, loaded only when entering a room.
