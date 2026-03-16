---
title: Configuration
sidebar_position: 2
---

Shared setup that the rest of the app depends on. These files run once at startup and export the things other files need.

---

## prismaClient.js

Creates a single database connection and exports it so the whole app shares it.

1. Reads `DATABASE_URL` from the environment
2. Creates a Prisma client using the Postgres driver
3. Exports one shared instance

> Only one instance is created. This avoids opening multiple database connection pools by accident.

---

## keys.js

Loads the RSA keys from disk and exports them so auth can use them to sign and verify tokens.

- `privateKey` — loaded from `keys/private.pem` (or the path in `PRIVATE_KEY_PATH` if set). Used to sign JWTs when a user logs in.
- `publicKey` — loaded from `keys/public.pem`. Used to verify JWTs on incoming requests.

If either key file is missing, the app logs an error and exits immediately with a clear message explaining what to do.

> In Docker, the private key is injected as a secret via `PRIVATE_KEY_PATH`. Locally, generate the keys with `npm run generate:keys`.
