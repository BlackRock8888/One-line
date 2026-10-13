# Black Rock Talk · Telegram Mini App

The Mini App uses the same mobile-first page as the browser version.
Production URL: https://one-line-three.vercel.app/
Bot: @FOXY_TALK_BOT. Its menu Web App button opens the production URL.
No Telegram messages are sent by the setup process.

The frontend loads the official Telegram SDK only inside a Telegram launch,
sets the dark header/background, expands the viewport and applies safe areas.
It does not use unverified Telegram user data for authorization. No bot token
is bundled into frontend assets. Microphone access requires tapping Enter.

## Voice infrastructure still required

- One authoritative, always-on Node signaling server reachable over HTTPS.
  Run `npm start`; provide its HTTPS URL as Vercel `SIGNALING_ORIGIN`.
- Public coturn with a trusted TLS certificate and TCP/TLS port 443, plus
  UDP and relay ports as allowed by hosting firewall. Use a separate host/IP
  when HTTPS already occupies port 443. Configure its shared authentication
  secret and matching server-side `TURN_SECRET` and JSON `TURN_URLS`.
- Verify two physical devices across different networks, including Telegram
  on iPhone. Confirm incoming RTP, mute, leave, and third participant refusal.

Currently production room join returns `503 SERVER_UNCONFIGURED`. A menu
button opening successfully does not establish that voice works. Local TURN
tests do not verify public reachability or operation without VPN in any country.

The menu button works without a webhook. A Telegram direct Main Mini App link
requires configuring the Main Mini App in BotFather; do not assume it exists
from menu-button configuration alone. Invite-key access remains pending.
