# Black Rock Talk — room tiers

BlackRockLab is the ecosystem; Black Rock Talk is the voice-room product.

Product model clarified by the owner:
- Free tier: a small room, currently at most 2 simultaneously connected devices.
- Subscription tier: a family room, planned at up to 10 simultaneously connected devices.
- Invitations/admitted members and concurrent participants are distinct concepts. A family can include more invited members than can connect at once under the current tier.
- The product must not be positioned as universally limited to two people. The two-slot implementation is the current free MVP, not the product's final scope.

Current implementation still enforces exactly two slots on the server. Paid room expansion, payments, subscriptions and family balance remain v2 after the minimal call is deployed and verified. Do not show a functional checkout or claim a 10-person call works before implementation and QA.

Pricing amounts and billing units are not final. Server-side entitlement and occupancy checks are required; changing a UI label must never unlock a paid tier. Access by creator/member invitation key and repeat access are separately agreed requirements and are not yet implemented in this revision.
