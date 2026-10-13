# Daily no-card trial activation request

Status: prepared, not sent. No card, subscription or paid add-on was added.
Recipient: help@daily.co
Subject: Activate a no-card two-person voice trial for talkyest.daily.co

Hello Daily support,

We are testing Black Rock Talk, a small browser/Telegram voice-room prototype.
Our Daily domain is talkyest.daily.co.

Your pricing page advertises 10,000 free participant-minutes per month.
REST room creation and meeting-token issuance succeed, but real browser SDK
joins fail with `account-missing-payment-method`. We reproduced the same
account gate with both a private token-authenticated room and an isolated
public room limited to two participants.

We need a short, audio-only test between two people in Russia and the UAE
before supplying any payment method or selecting a paid plan. We do not need
recording, transcription, AI, SIP/PSTN or Advanced Firewall Control.

Can you activate a no-card trial on this existing account within the free
quota, with no charges or automatic paid upgrade? If verification is required,
please specify the exact non-payment information needed. If a payment method
is mandatory even for the trial, please confirm that explicitly.

Thank you.

## Evidence and interpretation

- Pricing: https://www.daily.co/pricing/video-sdk/
- Terms: https://www.daily.co/legal/terms-of-service/
- Privacy: https://www.daily.co/legal/privacy/
- Real SDK browser gate: account-missing-payment-method, reproduced twice.
- Public trial room: 15-minute expiry, two-participant limit; no successful join.
- No account activation/billing switch was found in the reviewed public API.
- Support activation is a request, not a confirmed entitlement or guarantee.
- Never include API keys, participant tokens or payment information in email.
