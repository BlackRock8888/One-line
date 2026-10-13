# Restricted-network voice transport

Reference implementations: https://github.com/coturn/coturn and
https://github.com/livekit/livekit. WebRTC can use TURN TCP/TLS port 443 when
UDP connectivity fails. Opening HTTPS port 443 on Vercel does not host TURN.

The current Daily 0.85.0 call-machine handles setIceConfig but checks the
account's advanced_firewall_control flag during active calls. Without this
flag it explicitly logs that the call is ignored. We have not confirmed this
account capability and have not enabled a forced transport mode or bought it.

A controlled TURN deployment requires a publicly reachable host, TLS cert,
authentication and firewall/relay-port configuration. src/ice.js and the
preserved public/voice.js support our own backend with such TURN credentials.
The active Daily implementation does not switch to that backend automatically.

Do not present a successful HTTPS probe as proof that audio transport works.
Verify relay candidate selection and inbound audio bytes on two real networks.
