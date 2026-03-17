---
title: Route Map
sidebar_position: 2
---

# Route Map - SalaryScope GraphQL API

A plain-language guide to what this API is, where a request goes, and how the pieces fit together.

For deeper documentation on each layer, follow the links to the folder README files.

---

## 1. What Is This API?

A **read-and-write API** for tech industry salary data. It combines four CSV datasets (~68,000 rows) into one database and exposes them over a single GraphQL endpoint.

**What you can do:**

- Browse and filter salary records, jobs, countries, companies, and job categories -- no login required
- Create, update, and delete salary records -- requires login
- Register an account and log in

**Built with:** Node.js + Express, Apollo Server, Prisma, PostgreSQL, JWT (RS256)

---

## 2. The Big Picture - One Endpoint

Unlike REST, this API has a single URL:

```
POST http://localhost:PORT/graphql
```

Every request, whether fetching a list, looking up a record, or creating one, goes to this address. The GraphQL query in the body tells the server what you want.

A browser-based sandbox is also available at `GET http://localhost:PORT/graphql`.

---

## 3. How a Request Travels Through the System

Think of the API as a building with six floors. Every request enters on the ground floor and the response comes back down the same way.

```
Your client (browser, app, etc.)
         |
         | HTTP POST /graphql
         v
┌─────────────────────────────┐
│  Floor 1: The Server        │  Applies CORS, rate limiting, security headers
│  src/server.js              │
└──────────┬──────────────────┘
           |
           v
┌─────────────────────────────┐
│  Floor 2: JWT Middleware    │  Reads the token -- sets context.user or null
│  src/auth/jwtMiddleware.js  │
└──────────┬──────────────────┘
           |
           v
┌─────────────────────────────┐
│  Floor 3: GraphQL / Apollo  │  Parses the query, matches it to a resolver
│  src/graphql/               │
└──────────┬──────────────────┘
           |
           v
┌─────────────────────────────┐
│  Floor 4: Resolver          │  Guards access, validates input, calls a service
│  src/graphql/resolvers/     │
└──────────┬──────────────────┘
           |
           v
┌─────────────────────────────┐
│  Floor 5: Service           │  Business logic -- what should happen and why
│  src/services/              │
└──────────┬──────────────────┘
           |
           v
┌─────────────────────────────┐
│  Floor 6: Repository        │  The only layer that talks to the database
│  src/repositories/          │
└──────────┬──────────────────┘
           |
           v
┌─────────────────────────────┐
│  PostgreSQL (via Prisma)    │
└─────────────────────────────┘
```

**One rule: no layer skips a floor.** Resolvers never touch the database. Repositories never apply business logic.

---

## 4. Each Layer Explained

### Layer 1 - The Server (`src/server.js`)

The entry point. Starts Express, mounts Apollo, and applies all middleware in order: security headers, CORS, body parser, rate limiters, batch blocker.

**Analogy:** The building's entrance. Opens the doors, checks everything is ready, and directs visitors to the right floor.

---

### Layer 2 - Authentication Middleware (`src/auth/jwtMiddleware.js`)

Runs on every request. Reads the `Authorization` header, verifies the token, and sets `context.user`. Never blocks a request. That decision happens in the resolver.

**Analogy:** The doorman who checks IDs. Valid ID, your name goes on the visitor list. No ID, "anonymous" goes on the list. They don't turn you away, that happens upstairs.

> See [Authentication](../auth/authentication.md)

---

### Layer 3 - The GraphQL Schema (`src/graphql/schema/`)

Defines every type, query, and mutation the API supports. Apollo enforces it, requests for anything not in the schema are rejected before any code runs.

**Analogy:** The menu. It tells clients exactly what they can order and in what format.

> See [Type Definitions](../graphql-schema/type-definitions.md)

---

### Layer 4 - Resolvers (`src/graphql/resolvers/`)

One function per query or mutation. Guards access, validates input, and hands off to the service. No business logic, no database calls.

**Analogy:** The waiter. Takes your order, checks it looks right, passes it to the kitchen.

> See [Resolver Reference](../resolvers/resolver-reference.md)

---

### Layer 5 - Services (`src/services/`)

The business logic layer. Converts IDs, checks ownership, throws meaningful errors, and coordinates repository calls.

**Analogy:** The kitchen. Does the actual work. Decides what to cook, how to prepare it, and what to do if an ingredient is missing.

> See [Services](../data-layer/services.md)

---

### Layer 6 - Repositories (`src/repositories/`)

The only layer that talks to the database. Builds Prisma queries and returns raw data. Nothing else in the app queries the database directly.

**Analogy:** The pantry and the person who fetches ingredients. The kitchen says "get me all salary records from Germany", the repository gets exactly that, no more, no less.

> See [Repositories](../data-layer/repositories.md)

---

### Layer 7 -- Prisma & PostgreSQL

Prisma translates repository calls into SQL and manages the connection pool. PostgreSQL stores everything on disk.

> See [Database](../data-layer/database.md)

---

## 5. Authentication

JWT-based authentication using RS256 (asymmetric, two keys: private to sign, public to verify). Tokens are valid for 24 hours and include `issuer` and `audience` claims to scope them to this API.

```
Register / Login
  -> validate input
  -> hash password (bcrypt, 12 rounds)
  -> sign JWT with private key
  -> return { token, user }

Subsequent requests
  -> send: Authorization: Bearer <token>
  -> middleware verifies token with public key
  -> context.user = { id, email } or null
  -> protected resolvers call assertAuthenticated(user) -- throws 401 if null
```

> See [Authentication](../auth/authentication.md) for the full flow.

---

## 6. Security Hardening

| Protection             | What it does                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Helmet + CSP**       | Sets HTTP security headers (XSS, clickjacking, HTTPS enforcement). Content Security Policy allows Apollo Studio while blocking all other external scripts. |
| **CORS**               | Only allows origins listed in `ALLOWED_ORIGINS`. Postman/curl always allowed.                                                                              |
| **Global rate limit**  | 200 requests per IP per 15 minutes                                                                                                                         |
| **Auth rate limit**    | 10 requests per IP per 15 minutes on `login` and `register`. Detects auth operations by both `operationName` and query body to prevent bypass.             |
| **Query depth limit**  | Rejects GraphQL queries deeper than 5 levels to prevent nested query abuse                                                                                 |
| **Batch blocker**      | Rejects any request body that is a JSON array                                                                                                              |
| **Body size limit**    | 100 KB max per request                                                                                                                                     |
| **Password length**    | Minimum 8, maximum 128 characters. Prevents bcrypt truncation issues and large-payload abuse.                                                              |
| **Pagination caps**    | All paginated queries (including nested fields) are capped at 100 records per page                                                                         |
| **JWT scoping**        | Tokens include `issuer` and `audience` claims, scoping them to this API only                                                                               |
| **Introspection**      | Enabled in all environments (for Postman and Apollo Sandbox)                                                                                               |
| **Error sanitization** | In production, unexpected errors are replaced with "Internal server error"                                                                                 |

---

## 7. Every Operation: What It Does and Who Can Call It

### Public (no login required)

| Operation                                             | What it does                                      |
| ----------------------------------------------------- | ------------------------------------------------- |
| `register(input)`                                     | Creates an account, returns a token               |
| `login(input)`                                        | Checks credentials, returns a token               |
| `countries` / `country` / `countryByName`             | List or look up countries                         |
| `jobCategories` / `jobCategory` / `jobCategoryByName` | List or look up job categories                    |
| `jobs` / `job`                                        | List or look up jobs (filterable by category)     |
| `companies` / `company` / `companyByName`             | List or look up companies (filterable by country) |
| `salaryRecords(filters)`                              | Paginated salary records with up to 10 filters    |
| `salaryRecord(id)`                                    | Single salary record by ID                        |

### Protected (login required)

| Operation                       | What it does                                   |
| ------------------------------- | ---------------------------------------------- |
| `me`                            | Returns the currently logged-in user's profile |
| `createSalaryRecord(input)`     | Adds a new salary record                       |
| `updateSalaryRecord(id, input)` | Updates a salary record (owner only)           |
| `deleteSalaryRecord(id)`        | Deletes a salary record (owner only)           |

### Available filters on `salaryRecords`

`jobId`, `categoryId`, `countryId`, `companyId`, `workYear`, `experienceLevel`, `employmentType`, `workSetting`, `companySize`, `source`

> See [Type Definitions](../graphql-schema/type-definitions.md) for full type definitions.

---

## 8. Ownership Model

Every record created through the API is stamped with the user's ID in `createdBy`.

| `createdBy` | Who can modify                                    |
| ----------- | ------------------------------------------------- |
| `null`      | Nobody -- public dataset records, seeded from CSV |
| A user ID   | Only that user                                    |

Attempting to modify a seeded record returns `403 FORBIDDEN`.

> See [Services](../data-layer/services.md) for how this is enforced.

---

## 9. Pagination

Every list query returns a page object:

```
{
  records: [...]      -- the records in this page
  totalCount: 1500    -- total matching records across all pages
  hasNextPage: true   -- whether there is more after this page
}
```

Use `limit` (default 20, max 100) and `offset` to move through pages.

**Example:** page 3 with 50 per page -> `limit: 50, offset: 100`

---

## 10. Error Handling

| Error                  | HTTP | Code                    | When                                          |
| ---------------------- | ---- | ----------------------- | --------------------------------------------- |
| `UnauthenticatedError` | 401  | `UNAUTHENTICATED`       | No valid token on a protected operation       |
| `ForbiddenError`       | 403  | `FORBIDDEN`             | Modifying a record you don't own              |
| `NotFoundError`        | 404  | `NOT_FOUND`             | Record doesn't exist                          |
| `BadUserInputError`    | 400  | `BAD_USER_INPUT`        | Invalid input, bad ID, duplicate email        |
| Unexpected             | 500  | `INTERNAL_SERVER_ERROR` | Anything else -- details hidden in production |

> See [Helpers](../utilities/helpers.md) for the error classes.

---

## 11. Running the Project

Docker Compose is split into separate files so the database and API can be managed independently.

| File                        | What it runs                                                         |
| --------------------------- | -------------------------------------------------------------------- |
| `docker-compose.server.yml` | Postgres + Caddy + API + Watchtower -- production server only        |
| `docker-compose.db.yml`     | Migrations + seed -- expects Postgres already running on the network |
| `docker-compose.dev.yml`    | API only (development) -- with hot reload via `--watch`              |
| `docker-compose.prod.yml`   | API + Caddy (production) -- rebuilt on every deploy                  |

All compose files share the same Docker network (`salaryscope-network`), so the API can reach the database across compose files.

### First-time setup

```bash
cp .env.example .env                                        # fill in credentials
npm run generate:keys                                        # create RSA key pair
docker network create salaryscope-network                    # create shared network
docker compose -f docker-compose.server.yml up -d postgres   # start Postgres
docker compose -f docker-compose.db.yml up                   # run migrations + seed
docker compose -f docker-compose.dev.yml up --build          # start API (dev mode)
```

### Day-to-day commands

| Command                                                 | What it does                                           |
| ------------------------------------------------------- | ------------------------------------------------------ |
| `docker compose -f docker-compose.dev.yml up --build`   | Start API in dev mode (hot reload)                     |
| `docker compose -f docker-compose.db.yml run --rm seed` | Re-seed the database manually                          |
| `npm run db:studio`                                     | Open database browser at `http://localhost:5555`       |
| `npm run generate:keys`                                 | Re-generate RSA keys (invalidates all existing tokens) |

After starting, open `http://localhost:4000/graphql` to access the Apollo Sandbox.
