# services/

## Purpose

The service layer sits between the GraphQL resolvers and the repository layer. It owns all business rules and application-level error handling. Resolvers call services; services call repositories. Neither layer bypasses the other.

Services are the only layer that throws `GraphQLError`. Repositories return `null` on a miss; services turn that `null` into a typed error with a meaningful message and an `extensions.code` that clients can act on.

---

## Files

**`src/auth/AuthService.js`**
Handles registration and login. On registration it checks for duplicate email, hashes the password with bcrypt (12 salt rounds), persists the user via `UserRepository.create`, and returns a signed JWT alongside the new user object. On login it retrieves the user by email, runs `bcrypt.compare`, and — deliberately — returns the same vague "Invalid credentials" error whether the email is unknown or the password is wrong, to avoid leaking which field failed. Token generation is a private method. `AuthService` lives in `src/auth/` rather than `src/services/` because it also owns JWT concerns, but it is logically part of the service layer.

**`UserService.js`**
Thin wrapper around `UserRepository`. Exposes a single `getById` method that throws `NOT_FOUND` if the repository returns `null`. No mutations — user creation is handled entirely by `AuthService`.

**`CountryService.js`**
Provides `getAll`, `getById`, `getByName`, `getEmployeeRecords`, and `getCompanyRecords`. `getById` calls `parseId` to convert the GraphQL string ID to an integer before passing it to the repository. `getByName` searches by exact name. The two record methods delegate directly to the repository without additional logic — pagination is handled there.

**`JobCategoryService.js`**
Provides `getAll`, `getById`, and `getByName`. Follows the same `parseId` + null-check pattern as the other lookup services. No mutations.

**`JobService.js`**
Provides `getAll` (with optional filters forwarded to the repository), `getById`, and `getRecords` (salary records for a specific job). `getById` uses `parseId` and throws `NOT_FOUND` on a null result.

**`CompanyService.js`**
Provides `getAll`, `getById`, `getByName`, and `getRecords`. Structure is identical to `JobService` with an additional `getByName` lookup.

**`SalaryRecordService.js`**
The only service with full CRUD. `getAll` forwards filters to the repository. `getById` uses `parseId` and throws `NOT_FOUND`. `create` delegates to the repository (input validation is expected upstream from the resolver). `update` and `delete` wrap the repository call in a try/catch and convert Prisma's `P2025` error (record not found during a write) into a `NOT_FOUND` `GraphQLError` via the private `#rethrowIfNotFound` method. This is necessary because `update` and `delete` do not pre-fetch — Prisma itself raises the error when the target row does not exist.

---

## Patterns used

- **`parseId(id)`** — GraphQL ID scalars arrive as strings. `parseId` (from `src/utils/parseId.js`) rejects non-numeric strings with `BAD_USER_INPUT` and returns a parsed integer. It is called in every service method that receives an ID from a resolver, before the ID reaches the repository.
- **Null-to-error conversion** — Repositories return `null` when a record is not found. Services turn that `null` into a `GraphQLError` with `code: 'NOT_FOUND'` and a human-readable message that includes the queried value.
- **P2025 handling in `SalaryRecordService`** — For `update` and `delete`, the service catches `PrismaClientKnownRequestError` with code `P2025` and converts it to the same `NOT_FOUND` error shape used by `getById`. A pre-fetch to check existence was intentionally avoided to prevent an extra round-trip.
- **Private class fields (`#repository`)** — The injected repository is stored as a private field. Services are constructed with their dependency injected, keeping them testable in isolation.
- **Deliberate error vagueness in `AuthService`** — The login path never reveals whether the email was unknown or the password was wrong. Both cases produce "Invalid credentials."

---

## What this layer does NOT do

- Does not import from `@prisma/client` directly, except `SalaryRecordService` which needs `Prisma.PrismaClientKnownRequestError` to identify P2025 errors.
- Does not build Prisma `where` clauses or know about database schema details. Filter objects are assembled in repositories.
- Does not know about GraphQL resolvers, resolver arguments, or context shape. It receives plain values and returns plain objects.
- Does not handle authentication checks. That responsibility belongs to resolver-level guards that run before the service is called.
- Does not format responses. It returns whatever the repository returns — Decimal-to-Float conversion for GraphQL happens in field resolvers.
