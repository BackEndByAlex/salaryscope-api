# config/

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

- `privateKey` — read from the path set in `PRIVATE_KEY_PATH`. Used to sign JWTs when a user logs in.
- `publicKey` — read from the path set in `PUBLIC_KEY_PATH`. Used to verify JWTs on incoming requests.

If either key file is missing, the app logs an error and exits immediately with a clear message explaining what to do.

> Locally, generate the key files with `npm run generate:keys` and set `PRIVATE_KEY_PATH` / `PUBLIC_KEY_PATH` in your `.env` to point at them. In Docker, the paths are passed in as environment variables and the key files are injected at those locations.
