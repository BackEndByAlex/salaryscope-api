# config/

Application-level configuration.

- `prismaClient.js` — creates and exports a single `PrismaClient` instance using the `PrismaPg` driver adapter. Reads `DATABASE_URL` from environment. One shared instance across the whole app to avoid multiple connection pools.
