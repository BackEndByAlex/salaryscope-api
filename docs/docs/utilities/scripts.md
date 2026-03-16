---
title: Scripts
sidebar_position: 3
---

One-time utility scripts that help set up the project. These are not part of the running API, you run them manually when needed.

---

## generate-keys.js

Generates the RSA key pair used to sign and verify JWTs (login tokens).

Here's what it does:

1. Creates a `keys/` folder at the project root if it doesn't exist
2. Generates a pair of RSA keys (2048-bit)
3. Writes them as two files:
   - `keys/private.pem` — used to sign tokens when a user logs in. Keep this secret and never commit it.
   - `keys/public.pem` — used to verify tokens on incoming requests. Safe to share.

> Run this once before starting the API for the first time. If the keys folder already exists, running it again will overwrite the existing keys.

```bash
node scripts/generate-keys.js
```
