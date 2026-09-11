# DigitPop Web Monetization SDK (`@digitpop/monetization-sdk`)

Official Web & React SDK for integrating the **DigitPop Attention Economy & Monetization Platform** into web applications, SaaS tools, job boards, and digital publisher sites.

---

## Features

- 📺 **Watch-to-Earn (Proof-of-Attention)**: Allow candidates and consumers to unlock access passes by engaging with interactive 15-30s sponsored partner clips.
- 💳 **1-Click Passes**: Instant direct checkout for subscription or pay-per-view access.
- 🪙 **PopCoin Token Vault**: Enable users to redeem accumulated attention tokens across the DigitPop network.
- 🛡️ **Shadow DOM Encapsulation**: Modal UI runs in an isolated Shadow Root — guarantees zero CSS conflicts or style leakage.
- ⚛️ **React First-Class Support**: Includes `<DigitPopProvider>`, `<DigitPopGateway>`, and `useDigitPop()` hook.
- 🌐 **CDN Drop-in**: Usable via standard `<script>` tag in vanilla HTML.

---

## Installation

### Package Manager (npm / pnpm / yarn)

```bash
pnpm add @digitpop/monetization-sdk
# or
npm install @digitpop/monetization-sdk
```

---

## Quickstart

### 1. React / Next.js Integration

Wrap your application or page with `<DigitPopProvider>` and trigger the gateway:

```tsx
import React from 'react';
import { DigitPopProvider, useDigitPop } from '@digitpop/monetization-sdk/react';

function App() {
  return (
    <DigitPopProvider
      config={{
        publicKey: 'dp_pub_live_9cc2ef63ae224a66', // Your Publisher Public Key
        userId: 'candidate_usr_123',
        environment: 'staging', // or 'production'
        userMetadata: {
          email: 'candidate@domain.com',
          fullName: 'Jane Doe',
        },
      }}
    >
      <JobApplicationPage />
    </DigitPopProvider>
  );
}

function JobApplicationPage() {
  const { openGateway } = useDigitPop();

  const handleApply = () => {
    openGateway({
      title: 'Unlock Application Access',
      onAccessGranted: (event) => {
        console.log('Access granted via:', event.accessType);
        // Candidate has unlocked access! Proceed to submit application.
      },
      onCreditEarned: (reward) => {
        console.log(`Candidate earned ${reward.credits} attention credits!`);
      },
      onDirectCheckout: (checkout) => {
        // Redirect to your Stripe checkout session if user chose 1-Click Pass
        window.location.href = `/api/billing/checkout?price=${checkout.price}`;
      },
    });
  };

  return (
    <button onClick={handleApply}>
      Apply to Opportunity
    </button>
  );
}
```

---

### 2. Vanilla JavaScript / HTML Embed

```html
<!-- Load from DigitPop CDN -->
<script src="https://cdn.digitpop.com/v1/digitpop-sdk.global.js"></script>

<script>
  const dp = DigitPopSDK.createDigitPop({
    publicKey: 'dp_pub_live_9cc2ef63ae224a66',
    userId: 'user_xyz_789',
    environment: 'staging'
  });

  document.getElementById('unlock-btn').addEventListener('click', () => {
    dp.openGateway({
      title: 'Unlock Premium Feature',
      onAccessGranted: (event) => {
        alert('Access unlocked via: ' + event.accessType);
      }
    });
  });
</script>
```

---

## Server-to-Server Webhook Verification

When users complete attention engagement or token redemptions, DigitPop dispatches an asynchronous, HMAC-SHA256 signed webhook to your registered webhook URL:

- **Header**: `X-DigitPop-Signature`
- **Header**: `X-DigitPop-Timestamp`

Verify the payload on your backend using your Publisher Secret Key (`dp_sec_live_...`) before applying entitlements.

---

## License

MIT © [Boggs Systems Corporation](https://github.com/BoggsSystems)
