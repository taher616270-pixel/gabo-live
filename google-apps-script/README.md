# GABO LIVE Google Apps Script mail gateway

The matching mail handler is in `Code.gs`.

## Required setup

1. Create a new Google Apps Script project while signed in to the Gmail account that should send GABO LIVE emails.
2. Paste the full contents of `Code.gs`.
3. Open **Project Settings → Script Properties** and add:
   - `GAS_SHARED_SECRET`: the exact same private value configured as the Cloudflare Worker secret named `GAS_SHARED_SECRET`.
   - `SUPPORT_EMAIL`: optional; defaults to `taher616380@gmail.com`.
4. Deploy → **New deployment** → **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the deployed Web App URL ending in `/exec`. Do not paste the secret into GitHub or a chat.
6. Set that URL as the Cloudflare Worker `gabo-otp` variable `GAS_WEB_APP_URL`, then update the same URL in `wrangler.otp.toml`.
7. Ensure the Cloudflare Worker secrets `GAS_SHARED_SECRET` and `FIREBASE_SERVICE_ACCOUNT_JSON` exist. They are not stored in this repository.
8. The GitHub Actions Cloudflare API token needs **Account → Workers Scripts → Edit** as well as the existing Pages permission to deploy both the Pages site and OTP Worker.

## Supported actions

- `send`: six-digit signup verification code.
- `reset`: six-digit password reset code.
- `welcome`: new-account welcome email.
- `password_changed`: password-change notification.
- `contact`: account/admin notice, such as VIP activation.
- `host`: host application approval email.

All POST requests require the shared secret. The website calls the Cloudflare Worker; the browser never receives the shared secret.

## Email design

The template uses the requested black, purple, gold, and white GABO LIVE style, with a 3D gold G mark and a subtle animation where supported by the recipient's email client. Email clients that block animation still show the complete static design.

Google Apps Script / Gmail has daily sending quotas; this is a quota-limited free route, not unlimited bulk email.
