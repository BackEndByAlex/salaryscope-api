# config

Application-level configuration shared across the codebase. Currently holds one file: the Prisma client singleton.

## Files

### `prismaClient.js`
Creates and exports a single `PrismaClient` instance configured to connect to PostgreSQL via the `@prisma/adapter-pg` driver adapter. The connection string is read from `DATABASE_URL`, loaded by `dotenv/config` at the top of the file.

## Key concepts

### Singleton pattern
Only one `PrismaClient` is created for the entire application. Every part of the codebase that needs database access imports this one instance. Prisma manages a connection pool internally — creating multiple clients would open multiple separate pools, wasting connections and potentially exhausting the database's limit under load.

### Driver adapter (PrismaPg)
This project uses `@prisma/adapter-pg` rather than Prisma's default built-in connection handling. The adapter wraps the `pg` driver and passes it into `PrismaClient`. This is the recommended approach for PostgreSQL with Prisma 7 and gives explicit control over the underlying driver.

### Environment variable for the connection string
`DATABASE_URL` is never hardcoded. In local development it is loaded from `.env` at the project root. In Docker Compose it is injected as an environment variable in the service definition. Credentials stay out of source control.

## What this folder does NOT do
- Does not define the database schema — that lives in `prisma/schema.prisma`.
- Does not run migrations — handled by the Prisma CLI (`prisma migrate dev`).
- Does not configure JWT, Apollo Server, or Express — each lives in its own module.
