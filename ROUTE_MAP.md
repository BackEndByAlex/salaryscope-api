# Route Map — Tech Salary GraphQL API

A plain-language guide to everything that happens in this API: what it is, where your request goes, what each piece of code does, and how the database is organized.

---

## Table of Contents

1. [What Is This API?](#1-what-is-this-api)
2. [The Big Picture — One Endpoint](#2-the-big-picture--one-endpoint)
3. [How a Request Travels Through the System](#3-how-a-request-travels-through-the-system)
4. [Each Layer Explained](#4-each-layer-explained)
   - [Layer 1 — The Server](#layer-1--the-server-srcserverjs)
   - [Layer 2 — Authentication Middleware](#layer-2--authentication-middleware-srcauthjwtmiddlewarejs)
   - [Layer 3 — The GraphQL Schema](#layer-3--the-graphql-schema-srcgraphqlschema)
   - [Layer 4 — Resolvers](#layer-4--resolvers-srcgraphqlresolvers)
   - [Layer 5 — Services](#layer-5--services-srcservices)
   - [Layer 6 — Repositories](#layer-6--repositories-srcrepositories)
   - [Layer 7 — Prisma & PostgreSQL](#layer-7--prisma--postgresql)
5. [The Composition Root](#5-the-composition-root-srcgraphqlsetupjs)
6. [Authentication In Depth](#6-authentication-in-depth)
7. [Security Hardening](#7-security-hardening)
8. [Every Operation: What It Does and Who Can Call It](#8-every-operation-what-it-does-and-who-can-call-it)
9. [Ownership Model](#9-ownership-model)
10. [Pagination — How List Responses Work](#10-pagination--how-list-responses-work)
11. [Error Handling](#11-error-handling)
12. [The Database](#12-the-database)
13. [Input Validation and ID Parsing](#13-input-validation-and-id-parsing)
14. [Folder and File Reference](#14-folder-and-file-reference)
15. [Running the Project](#15-running-the-project)

---

## 1. What Is This API?

This is a **read-and-write API** for tech industry salary data. It combines four different salary datasets (from CSV files) into one unified database, then exposes that data over a GraphQL interface so clients can query it in a flexible way.

**What the data covers:**

- Salary records from tech jobs — job title, salary, country, company, year, experience level, work setting, etc.
- Four source datasets, each with slightly different fields: `jobs_in_data` (2023–2024 data), `salary_extra`, and `software_pro`.

**What the API lets you do:**

- Browse and filter salary records (public — no login required)
- Browse jobs, countries, companies, and job categories (public)
- Create, update, and delete salary records (requires being logged in)
- Register an account and log in

**Built with:**

- **Node.js + Express** — the web server
- **Apollo Server** — the GraphQL engine
- **Prisma** — the database toolkit
- **PostgreSQL** — the database
- **JWT (RS256)** — login tokens using RSA cryptography

---

## 2. The Big Picture — One Endpoint

Unlike a REST API that has many URLs (`/users`, `/jobs`, `/records/123`), this API has **a single URL**:

```
POST http://localhost:PORT/graphql
```

Every request — whether you are fetching a list of jobs, looking up a single salary record, or creating a new one — goes to this same address. The GraphQL query in the request body tells the server what you want.

There is also a browser-based sandbox at:

```
GET http://localhost:PORT/graphql
```

Open that URL in a browser and you get an interactive tool where you can write and run queries without any other client.

---

## 3. How a Request Travels Through the System

Think of the API as a building with six floors. Every request enters on the ground floor and goes up — and the response comes back down the same way.

```
Your client (browser, app, etc.)
         |
         | HTTP POST /graphql
         v
┌─────────────────────────────┐
│  Floor 1: The Server        │  Express receives the request
│  src/server.js              │  Applies CORS + JSON parsing
└──────────┬──────────────────┘
           |
           v
┌─────────────────────────────┐
│  Floor 2: JWT Middleware    │  Reads the Authorization header
│  src/auth/jwtMiddleware.js  │  Sets context.user = { id, email } or null
└──────────┬──────────────────┘
           |
           v
┌─────────────────────────────┐
│  Floor 3: GraphQL / Apollo  │  Parses the query, matches it to a resolver
│  src/graphql/               │  Checks types, validates the shape of the request
└──────────┬──────────────────┘
           |
           v
┌─────────────────────────────┐
│  Floor 4: Resolver          │  Checks auth if needed, validates input,
│  src/graphql/resolvers/     │  then hands off to the right service
└──────────┬──────────────────┘
           |
           v
┌─────────────────────────────┐
│  Floor 5: Service           │  Contains the business logic
│  src/services/              │  Converts errors, transforms data, coordinates calls
└──────────┬──────────────────┘
           |
           v
┌─────────────────────────────┐
│  Floor 6: Repository        │  The only layer that talks to the database
│  src/repositories/          │  Builds Prisma queries and returns raw data
└──────────┬──────────────────┘
           |
           v
┌─────────────────────────────┐
│  PostgreSQL (via Prisma)    │  Stores and retrieves the actual data
└─────────────────────────────┘
```

The response travels back up the same stack and is returned to your client as JSON.

**One important rule: no layer skips a floor.** Resolvers never talk directly to the database. Repositories never apply business logic. This keeps each layer small, focused, and easy to reason about.

---

## 4. Each Layer Explained

### Layer 1 — The Server (`src/server.js`)

This is the entry point — the first file that runs when you start the application.

**What it does:**

1. Loads all environment variables from the `.env` file (database URL, port, allowed origins, etc.)
2. Creates the Express web server
3. Starts Apollo Server (the GraphQL engine)
4. Applies middleware in order:
   - **Helmet** — sets HTTP security headers on every response (X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy, etc.). CSP is disabled because Apollo Sandbox uses inline scripts.
   - **CORS** — only allows requests from origins listed in the `ALLOWED_ORIGINS` environment variable. Requests with no `Origin` header (Postman, curl, server-to-server calls) are always allowed.
   - **JSON body parser** — reads the request body as JSON, capped at 100 KB to prevent oversized payloads from reaching the application.
   - **Global rate limiter** — limits every IP to 200 requests per 15 minutes across all routes.
   - **Batch request blocker** — rejects any request to `/graphql` whose body is a JSON array. A single batched request can contain hundreds of mutations, which would bypass per-request rate limits entirely.
   - **Auth rate limiter** — applies a stricter limit of 10 requests per 15 minutes specifically on `login` and `register` mutations, identified by the `operationName` field in the request body.
   - **Apollo at `/graphql`** — mounts the GraphQL engine at that URL
5. Starts listening for connections on the configured port

**Analogy:** The server is the building's entrance. It opens the doors, checks that everything inside is ready, and directs visitors to the right floor.

---

### Layer 2 — Authentication Middleware (`src/auth/jwtMiddleware.js`)

Runs automatically on **every single request**, before any resolver sees it.

**What it does:**

- Looks at the `Authorization` header in the HTTP request
- If it finds a valid Bearer token (a JWT), it decodes and verifies it using the public RSA key
- Sets `context.user` to `{ id, email }` if the token is valid
- Sets `context.user` to `null` if there is no token, the token has expired, or the token is malformed

**Critically, it never throws an error.** It just sets `user` to `null` and moves on. The decision of whether to reject the request is made one floor up, in the resolver.

**Analogy:** This is the doorman who checks IDs. If your ID is valid, they write your name on the visitor list (`context.user`). If you have no ID or a fake one, they write "anonymous" on the list. They do not turn you away — that happens upstairs.

---

### Layer 3 — The GraphQL Schema (`src/graphql/schema/`)

The schema is a formal description of everything the API can do. It defines every type of data, every query that can be made, and every mutation (create/update/delete) available. It is written in GraphQL's schema definition language across several files.

**Files and what they define:**

| File                   | What it adds                                                         |
| ---------------------- | -------------------------------------------------------------------- |
| `schema.graphql`       | The base `Query` and `Mutation` types — all other files extend these |
| `auth.graphql`         | User type, login/register mutations, `me` query                      |
| `country.graphql`      | Country type, country list/lookup queries                            |
| `jobCategory.graphql`  | Job category type, category list/lookup queries                      |
| `job.graphql`          | Job type, job list/lookup queries                                    |
| `company.graphql`      | Company type, company list/lookup queries                            |
| `salaryRecord.graphql` | SalaryRecord type, all salary queries and mutations                  |

**Analogy:** The schema is a menu. It tells clients exactly what they can order and in what format. Apollo enforces the menu — if a client asks for something not on it, the request is rejected immediately, before any code runs.

---

### Layer 4 — Resolvers (`src/graphql/resolvers/`)

Each query and mutation in the schema has a matching resolver function. The resolver is what actually runs when a client sends that query.

**What resolvers do (and do not do):**

- Check whether the user is logged in (for protected operations)
- Validate the shape and values of the incoming arguments
- Call the appropriate service method
- Return the result

Resolvers contain **no business logic and no database calls**. They are thin coordinators.

**Files:**

| File                       | Handles                                                             |
| -------------------------- | ------------------------------------------------------------------- |
| `authResolvers.js`         | `me`, `register`, `login`                                           |
| `countryResolvers.js`      | `countries`, `country`, `countryByName` + nested fields             |
| `jobCategoryResolvers.js`  | `jobCategories`, `jobCategory`, `jobCategoryByName` + nested fields |
| `jobResolvers.js`          | `jobs`, `job` + nested salary records                               |
| `companyResolvers.js`      | `companies`, `company`, `companyByName` + nested salary records     |
| `salaryRecordResolvers.js` | `salaryRecords`, `salaryRecord` + all mutations                     |

**Analogy:** The resolver is a waiter. They take your order, check that everything looks right, and pass it to the kitchen (service). They do not cook anything themselves.

---

### Layer 5 — Services (`src/services/`)

Services contain the business rules — the "thinking" part of the application.

**What services do:**

- Convert GraphQL ID strings to real database integers
- Check whether a record actually exists before trying to use it (and throw a clean "not found" error if it does not)
- Handle Prisma-specific error codes and translate them into meaningful GraphQL errors (e.g., "record not found on delete" becomes a `NotFoundError`)
- Coordinate multiple repository calls if needed

**Files and what they handle:**

| File                     | Responsibility                                                     |
| ------------------------ | ------------------------------------------------------------------ |
| `AuthService.js`         | Hashing passwords, signing JWT tokens, checking credentials        |
| `UserService.js`         | Looking up the current user by their ID                            |
| `CountryService.js`      | Country lookups, paginated employee and company records by country |
| `JobCategoryService.js`  | Job category lookups                                               |
| `JobService.js`          | Job lookups, paginated salary records by job                       |
| `CompanyService.js`      | Company lookups, paginated salary records by company               |
| `SalaryRecordService.js` | All salary record CRUD, filter delegation, error mapping           |

**Analogy:** The service is the kitchen — it does the actual work based on the waiter's order. It decides what to cook, how to prepare it, and what to do if an ingredient is missing.

---

### Layer 6 — Repositories (`src/repositories/`)

Repositories are the only part of the application that communicate with the database. Everything database-related lives here and nowhere else.

**What repositories do:**

- Build and execute Prisma queries (`findMany`, `findFirst`, `create`, `update`, `delete`)
- Handle pagination (count + fetch in a single atomic transaction)
- Define which related data to load alongside a record (e.g., always load the job and countries when fetching a salary record)

**Files:**

| File                        | Talks to DB table                                                  |
| --------------------------- | ------------------------------------------------------------------ |
| `UserRepository.js`         | `User`                                                             |
| `CountryRepository.js`      | `Country` + salary records by employee country and company country |
| `JobCategoryRepository.js`  | `JobCategory`                                                      |
| `JobRepository.js`          | `Job` + salary records by job                                      |
| `CompanyRepository.js`      | `Company` + salary records by company                              |
| `SalaryRecordRepository.js` | `SalaryRecord` with all filters and relations                      |

**Shared constant `SALARY_RECORD_INCLUDE`:**
Any query that returns salary records needs to load the related job, categories, countries, and company in the same query. A shared constant defines this set of relations once, and every repository that fetches salary records imports it. This means if a new relation is added, there is only one place to update.

**Analogy:** The repository is the pantry and the person who fetches ingredients. The kitchen (service) says "get me all salary records from Germany" and the repository goes and gets exactly that — no more, no less.

---

### Layer 7 — Prisma & PostgreSQL

**Prisma** is the toolkit that sits between the application code and PostgreSQL. It provides:

- A type-safe query builder (so queries are checked at development time, not only at runtime)
- Automatic handling of the database connection pool
- A migration system for evolving the database schema over time
- A seed script for populating the database from CSV files

**PostgreSQL** is the database that stores all the data on disk.

When a repository calls `this.#prisma.salaryRecord.findMany(...)`, Prisma translates that into a SQL query and sends it to PostgreSQL. The result comes back as JavaScript objects.

---

## 5. The Composition Root (`src/graphql/setup.js`)

This file is the "wiring diagram" of the whole application. It is the only place where repositories, services, and resolvers are created and connected to each other.

**What it does:**

1. Loads all `.graphql` schema files in order and merges them into one schema
2. Creates one Prisma client instance (shared across the entire app)
3. Creates every repository, passing it the Prisma client
4. Creates every service, passing it the relevant repository
5. Creates the Apollo Server with all resolvers merged
6. Returns all service instances so they can be passed into every request's context

**Why this matters:** Because all dependencies are created once here and passed down, every layer is easy to test in isolation — you can swap a real repository for a fake one without changing any other file.

---

## 6. Authentication In Depth

This API uses **JWT (JSON Web Token)** authentication with **RS256** — an asymmetric cryptographic algorithm. Two keys are used:

- **Private key** (`keys/private.pem`) — kept secret on the server. Used to _sign_ tokens when a user logs in.
- **Public key** (`keys/public.pem`) — can be shared. Used to _verify_ tokens on incoming requests.

### Register flow

```
Client sends: { email, password }
         |
         v
Validator checks: email format, password length (min 8 chars)
         |
         v
AuthService checks: is this email already registered? → error if yes
         |
         v
bcrypt hashes the password (12 rounds — deliberately slow to resist brute force)
         |
         v
UserRepository saves the new user to the database
         |
         v
AuthService signs a JWT (valid for 24 hours) with the private key
         |
         v
Client receives: { token, user: { id, email, createdAt } }
```

### Login flow

```
Client sends: { email, password }
         |
         v
Validator checks: both fields are present
         |
         v
UserRepository loads the user by email
         |
         v
bcrypt compares the submitted password to the stored hash
  → If wrong: "Invalid credentials." (deliberately vague — never says which field was wrong)
         |
         v
AuthService signs a new JWT
         |
         v
Client receives: { token, user }
```

### Using the token

Every subsequent request that requires authentication must include:

```
Authorization: Bearer <your-token-here>
```

The JWT middleware reads this on every request, verifies the signature using the public key, and places the user's `{ id, email }` into the request context. If there is no token or it has expired, `context.user` is set to `null`.

### Auth guard

Protected resolvers call `assertAuthenticated(user)` as their first line. If `context.user` is `null`, this immediately throws an `UnauthenticatedError` (HTTP 401) and the resolver stops.

---

## 7. Security Hardening

Several protections were added on top of the base GraphQL setup. They are all applied at the Express layer, before Apollo ever sees the request.

### Helmet — HTTP security headers

Helmet sets a collection of HTTP response headers that instruct browsers to behave more securely:

| Header | What it does |
|---|---|
| `X-Content-Type-Options: nosniff` | Prevents the browser from guessing the content type (stops MIME-type sniffing attacks) |
| `X-Frame-Options: DENY` | Blocks the page from being embedded in an `<iframe>` (prevents clickjacking) |
| `Strict-Transport-Security` | Tells the browser to only use HTTPS for this domain in future visits |
| `Referrer-Policy` | Controls what URL is sent in the `Referer` header when following links |

Content Security Policy (CSP) is disabled for this API because Apollo Sandbox uses inline scripts, which a strict CSP would block.

### CORS — origin allowlist

CORS headers control which websites are allowed to make requests to the API from a browser. The `ALLOWED_ORIGINS` environment variable is a comma-separated list of trusted origins (e.g. `https://yourdashboard.lnu.se`).

- Requests from listed origins: allowed
- Requests with no `Origin` header (Postman, curl, server-to-server): always allowed
- Requests from unlisted origins: blocked with a CORS error before they reach Apollo

### Rate limiting

Two rate limits are in place to prevent brute-force attacks and API abuse:

| Limit | Applies to | Maximum | Window |
|---|---|---|---|
| Global | Every route, every IP | 200 requests | 15 minutes |
| Auth | `login` and `register` mutations only | 10 requests | 15 minutes |

The auth limit is applied by checking the `operationName` field in the request body. Clients can name their operations to trigger this: `mutation Login { ... }` or `mutation Register { ... }`.

### Batch request blocking

GraphQL supports batched requests — sending an array of queries in a single HTTP request. This would allow an attacker to send 100 login attempts in one request, bypassing the per-request rate limit.

Any request to `/graphql` whose body is a JSON array is rejected immediately with a `400` error before it reaches Apollo.

### Body size limit

The JSON body parser accepts a maximum of **100 KB** per request. This prevents memory exhaustion from clients sending very large request bodies.

### Introspection disabled in production

GraphQL introspection lets clients query the full schema — every type, field, query, and mutation. This is useful during development but in production it gives attackers a complete map of the API for free.

Introspection is disabled when `NODE_ENV=production`. The interactive Apollo Sandbox is also replaced with a minimal production landing page.

### Production error sanitization

In production, unexpected errors (Prisma internals, stack traces, unhandled exceptions) are never returned to the client. Only errors with a known, safe code are passed through:

| Code | Passed to client? |
|---|---|
| `UNAUTHENTICATED` | Yes |
| `BAD_USER_INPUT` | Yes |
| `NOT_FOUND` | Yes |
| `FORBIDDEN` | Yes |
| Anything else | Replaced with `"Internal server error"` |

All errors are still logged on the server so nothing is lost — clients just do not see the internal details.

---

## 8. Every Operation: What It Does and Who Can Call It

### Public operations (no login required)

| Operation                             | What it does                                        |
| ------------------------------------- | --------------------------------------------------- |
| `register(input)`                     | Creates a new account, returns a token              |
| `login(input)`                        | Checks credentials, returns a token                 |
| `countries(limit, offset)`            | Paginated list of all countries                     |
| `country(id)`                         | Single country by ID                                |
| `countryByName(name)`                 | Single country by name                              |
| `jobCategories(limit, offset)`        | Paginated list of job categories                    |
| `jobCategory(id)`                     | Single job category by ID                           |
| `jobCategoryByName(name)`             | Single job category by name                         |
| `jobs(categoryId, limit, offset)`     | Paginated jobs, optionally filtered by category     |
| `job(id)`                             | Single job by ID                                    |
| `companies(countryId, limit, offset)` | Paginated companies, optionally filtered by country |
| `company(id)`                         | Single company by ID                                |
| `companyByName(name)`                 | Single company by name                              |
| `salaryRecords(filters)`              | Paginated salary records with up to 9 filter fields |
| `salaryRecord(id)`                    | Single salary record by ID                          |

### Protected operations (login required)

| Operation                       | What it does                                     |
| ------------------------------- | ------------------------------------------------ |
| `me`                            | Returns the currently logged-in user's profile   |
| `createSalaryRecord(input)`     | Adds a new salary record to the database         |
| `updateSalaryRecord(id, input)` | Updates one or more fields on an existing record |
| `deleteSalaryRecord(id)`        | Permanently removes a salary record              |

### Nested queries

Some types support requesting related data in the same query:

- `country { employeeRecords { ... } }` — all salary records where employees are in that country
- `country { companyRecords { ... } }` — all salary records where companies are in that country
- `job { records { ... } }` — all salary records for that job title
- `company { records { ... } }` — all salary records for that company

These nested lists also support `limit` and `offset` and return the same paginated structure.

### Filters on `salaryRecords`

The `salaryRecords` query accepts an optional `filters` object with these fields:

| Filter            | Type   | What it matches                                                     |
| ----------------- | ------ | ------------------------------------------------------------------- |
| `jobId`           | ID     | Records for a specific job                                          |
| `categoryId`      | ID     | Records where the job belongs to this category                      |
| `countryId`       | ID     | Records where the employee is in this country                       |
| `companyId`       | ID     | Records for a specific company                                      |
| `workYear`        | Int    | Records from a specific year (e.g. `2023`)                          |
| `experienceLevel` | String | e.g. `"SE"`, `"MI"`, `"EN"`, `"EX"`                                 |
| `employmentType`  | String | e.g. `"FT"`, `"PT"`, `"CT"`, `"FL"`                                 |
| `workSetting`     | String | e.g. `"Remote"`, `"Hybrid"`, `"In-person"`                          |
| `companySize`     | String | e.g. `"S"`, `"M"`, `"L"`                                            |
| `source`          | String | Which dataset: `"jobs_in_data"`, `"salary_extra"`, `"software_pro"` |

---

## 9. Ownership Model

When an authenticated user creates a salary record, that record is stamped with their user ID in the `createdBy` field. This field is the basis for all mutation permissions.

**The rules:**

| `createdBy` value | Who can modify it? |
|---|---|
| `null` | Nobody — these are seeded public dataset records |
| A user ID | Only the user with that ID |

**Why seeded records are immutable:**

The ~69,000 records loaded from the CSV files have `createdBy: null`. This means no user owns them. Attempting to update or delete a seeded record returns a `403 FORBIDDEN` error with the message: `"This record is part of the public dataset and cannot be modified."` This prevents the public dataset from being corrupted through the API.

**How it is enforced:**

`SalaryRecordService` calls `#assertOwnership()` on every `update` and `delete` before touching the database. It checks:

1. Is `createdBy` null? → throw `ForbiddenError` (public data)
2. Is `createdBy` different from the current user's ID? → throw `ForbiddenError` (someone else's record)
3. Both pass → proceed with the database operation

Authentication (`assertAuthenticated`) is checked in the resolver before the service is even called, so by the time `#assertOwnership` runs, `userId` is always a valid integer.

---

## 10. Pagination — How List Responses Work

Every list query returns a page object, not a raw array. This tells the client how much data exists in total and whether there is more to fetch.

**Response shape for any list:**

```
{
  items: [...]       — the records in this page
  totalCount: 1500   — total matching records across all pages
  hasNextPage: true  — whether there is at least one more page after this one
}
```

**Query arguments:**

| Argument | Default | Maximum | Meaning                                             |
| -------- | ------- | ------- | --------------------------------------------------- |
| `limit`  | 20      | 100     | How many records to return in this response         |
| `offset` | 0       | —       | How many records to skip (for moving through pages) |

**Example: getting page 3 with 50 records per page:**
Send `limit: 50, offset: 100` — skip the first 100, return the next 50.

**How `hasNextPage` is calculated:**
`offset + (number of records returned) < totalCount`

This means if you are on the last page and only 8 records came back (even though you asked for 50), `hasNextPage` will correctly be `false`.

**Database consistency:** The count query and the fetch query run inside a single transaction, so the total count and the returned records always match the same snapshot of the database. A concurrent write cannot cause them to drift apart.

---

## 11. Error Handling

When something goes wrong, the API returns a structured error — never a raw crash or a leaked database error.

### Error types

| Error                  | HTTP status | Code in response        | When it is thrown                                               |
| ---------------------- | ----------- | ----------------------- | --------------------------------------------------------------- |
| `UnauthenticatedError` | 401         | `UNAUTHENTICATED`       | Calling a protected operation without a valid token             |
| `ForbiddenError`       | 403         | `FORBIDDEN`             | Trying to modify a record you did not create, or a seeded record |
| `NotFoundError`        | 404         | `NOT_FOUND`             | Looking up a record by ID or name that does not exist           |
| `BadUserInputError`    | 400         | `BAD_USER_INPUT`        | Invalid input format, duplicate email, non-numeric ID           |
| (unexpected)           | 500         | `INTERNAL_SERVER_ERROR` | Any unhandled error — details hidden in production              |

### What the client receives

```json
{
  "errors": [
    {
      "message": "Salary record with id 99 was not found.",
      "extensions": {
        "code": "NOT_FOUND"
      }
    }
  ]
}
```

The HTTP status code on the response will also be set correctly (404, not 200), which is unusual for GraphQL APIs and intentional here.

### What clients never see

- Raw Prisma error messages
- Database error codes
- Stack traces
- Whether an email exists in the system (login errors are always "Invalid credentials.")

### How Prisma errors are converted

When you try to update or delete a record that does not exist, Prisma throws a specific error code (`P2025`). The `SalaryRecordService` catches this and converts it to a clean `NotFoundError` before it reaches the client.

---

## 12. The Database

The database has six tables. Here is what each one stores and how they relate.

### Tables

**`SalaryRecord`** — the primary resource

Every salary entry from all three datasets ends up here. Each record belongs to one job, and optionally belongs to one employee country, one company country, and one company.

Key fields:

| Field              | What it is                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `salary`           | The reported salary (exact decimal, e.g. 120000.00)                                      |
| `salaryInUsd`      | Converted salary in USD (only from `jobs_in_data`)                                       |
| `salaryCurrency`   | The original currency (only from `jobs_in_data`)                                         |
| `workYear`         | Year the data was collected (only from `jobs_in_data`)                                   |
| `experienceLevel`  | e.g. SE (senior), MI (mid), EN (entry), EX (executive)                                   |
| `employmentType`   | e.g. FT (full-time), PT (part-time), CT (contract), FL (freelance)                       |
| `workSetting`      | Remote / Hybrid / In-person                                                              |
| `companySize`      | S / M / L                                                                                |
| `salariesReported` | Number of responses this data point represents (only from `salary_extra`/`software_pro`) |
| `source`           | Which dataset this record came from                                                      |

**`Job`** — job titles

| Field        | What it is                                                       |
| ------------ | ---------------------------------------------------------------- |
| `title`      | Job title (e.g. "Machine Learning Engineer")                     |
| `categoryId` | Optional: which category this job belongs to                     |
| `roles`      | Alternative role names (only from `salary_extra`/`software_pro`) |

**`JobCategory`** — groups of related jobs

| Field  | What it is                                       |
| ------ | ------------------------------------------------ |
| `name` | Category name (e.g. "Data Science and Research") |

**`Country`** — countries

Countries appear twice on salary records — once for the employee's country, once for the company's country. These are different relations but point to the same `Country` table.

**`Company`** — companies

| Field       | What it is                                   |
| ----------- | -------------------------------------------- |
| `name`      | Company name                                 |
| `rating`    | Rating out of 5.0 (only from `salary_extra`) |
| `countryId` | Which country the company is in              |

**`User`** — registered accounts

| Field          | What it is                                                  |
| -------------- | ----------------------------------------------------------- |
| `email`        | Login email (must be unique)                                |
| `passwordHash` | bcrypt-hashed password — the plain password is never stored |

### Relationships

```
JobCategory
  └── has many Jobs
        └── SalaryRecord (via jobId)
              ├── Country (as employee country)
              ├── Country (as company country)
              └── Company
                    └── Country (company's home country)
```

### Why salaries are stored as Decimal, not Float

Floating-point numbers (the default in most programming languages) can introduce tiny rounding errors. A salary of `123456.78` might be stored as `123456.78000000001`. For financial data, this is unacceptable.

The database stores salaries as `Decimal(12, 2)` — exact decimal values with up to 12 digits total and exactly 2 decimal places. The trade-off is that Prisma returns these as special Decimal objects rather than plain JavaScript numbers, so there is a conversion step (`parseFloat(value.toString())`) in the salary field resolvers.

### Where the data comes from

The database is populated from four CSV files via a seed script (`prisma/seed.js`). The seed:

1. Extracts and inserts all unique countries
2. Extracts and inserts all unique job categories (from `jobs_in_data` only)
3. Extracts and inserts all unique jobs (linked to categories where available)
4. Extracts and inserts all unique companies (from `salary_extra` and `software_pro`)
5. Inserts all salary records in batches of 500, skipping any duplicates

The seed is safe to re-run at any time.

---

## 13. Input Validation and ID Parsing

### Validators

Two validator files run before any service logic:

**`authValidator.js`** — checks register and login input:

- Email must be present and match a valid email format
- Password must be present and at least 8 characters long (for registration)

**`salaryRecordValidator.js`** — checks salary record input:

- `salary`, `jobId`, and `source` are required when creating a record
- `salary` must be a positive number
- When updating, at least one field must be provided (empty updates are rejected)
- `limit` must be between 1 and 100; `offset` must be zero or positive

### ID parsing

GraphQL IDs arrive as strings (e.g. `"42"`). The database expects integers. The `parseId` utility converts them safely.

The key detail: `parseInt("3abc")` in JavaScript silently returns `3`, which would look up the wrong record. Instead, `parseId` first checks that the entire string contains only digits, then converts it. Any non-numeric ID (`"abc"`, `"3abc"`, `""`) throws a `BadUserInputError` before any database call is made.

---

## 14. Folder and File Reference

```
src/
  server.js                  — Entry point. Starts Express and Apollo.

  auth/
    AuthService.js           — Password hashing, JWT signing, login/register logic
    jwtMiddleware.js         — Reads JWT from every request, sets context.user
    authGuard.js             — assertAuthenticated() — throws 401 if user is null

  graphql/
    setup.js                 — Composition root. Wires all dependencies together.

    schema/
      schema.graphql         — Base Query and Mutation types
      auth.graphql           — User, AuthPayload, register, login, me
      country.graphql        — Country type and queries
      jobCategory.graphql    — JobCategory type and queries
      job.graphql            — Job type and queries
      company.graphql        — Company type and queries
      salaryRecord.graphql   — SalaryRecord type, all queries and mutations

    resolvers/
      authResolvers.js       — me, register, login
      countryResolvers.js    — countries, country, countryByName + nested fields
      jobCategoryResolvers.js— jobCategories, jobCategory, jobCategoryByName
      jobResolvers.js        — jobs, job + nested records
      companyResolvers.js    — companies, company, companyByName + nested records
      salaryRecordResolvers.js — salaryRecords, salaryRecord + all mutations

  services/
    AuthService.js           — See auth/
    UserService.js           — getById for the me query
    CountryService.js        — Country business logic
    JobCategoryService.js    — JobCategory business logic
    JobService.js            — Job business logic
    CompanyService.js        — Company business logic
    SalaryRecordService.js   — Salary record CRUD + Prisma error mapping

  repositories/
    UserRepository.js        — findById, findByEmail, create
    CountryRepository.js     — findAll, findById, findByName, findEmployeeRecords, findCompanyRecords
    JobCategoryRepository.js — findAll, findById, findByName
    JobRepository.js         — findAll (with categoryId filter), findById, findRecordsByJob
    CompanyRepository.js     — findAll (with countryId filter), findById, findByName, findRecordsByCompany
    SalaryRecordRepository.js— findAll (9 filters), findById, create, update, delete
    salaryRecordInclude.js   — Shared constant: which relations to load with salary records

  validators/
    authValidator.js         — Validates register and login inputs
    salaryRecordValidator.js — Validates salary record inputs and filters

  utils/
    errors.js                — UnauthenticatedError, NotFoundError, BadUserInputError
    parseId.js               — Safe string-to-integer conversion for GraphQL IDs

prisma/
  schema.prisma              — Database schema: all 6 tables and their relations
  seed.js                    — Populates the database from CSV files
  migrations/                — Migration history (applied automatically)

scripts/
  generate-keys.js           — Generates the RSA key pair (run once on setup)

keys/
  private.pem                — Signs JWT tokens (never committed to git)
  public.pem                 — Verifies JWT tokens (safe to commit)

data/
  jobs_in_data.csv           — Dataset A (2023)
  jobs_in_data_2024.csv      — Dataset A (2024)
  Salary_Dataset_with_Extra_Features.csv — Dataset B
  Software_Professional_Salaries.csv     — Dataset C
```

---

## 15. Running the Project

### First-time setup

```bash
# 1. Install dependencies
npm install

# 2. Copy .env.example to .env and fill in DATABASE_URL and PORT
cp .env.example .env

# 3. Start PostgreSQL (requires Docker)
npm run docker:up

# 4. Apply the database schema
npm run db:migrate

# 5. Generate RSA keys (required for auth)
npm run generate:keys

# 6. Populate the database from CSV files
npm run db:seed
```

### Day-to-day commands

| Command                 | What it does                                                         |
| ----------------------- | -------------------------------------------------------------------- |
| `npm run dev`           | Start the server in development mode (auto-restarts on file changes) |
| `npm start`             | Start the server in production mode                                  |
| `npm run db:seed`       | Re-populate the database (safe to re-run)                            |
| `npm run db:migrate`    | Apply any pending schema migrations                                  |
| `npm run db:studio`     | Open a browser-based database browser at `http://localhost:5555`     |
| `npm run db:reset`      | Wipe all data and re-apply migrations (destructive)                  |
| `npm run generate:keys` | Re-generate the RSA key pair (invalidates all existing tokens)       |
| `npm run docker:up`     | Start the local PostgreSQL database container                        |

### Where to find the API

After starting the server, open `http://localhost:PORT/graphql` in a browser to access the interactive Apollo Sandbox where you can explore the schema and run queries.
