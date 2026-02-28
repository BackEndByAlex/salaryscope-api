# repositories/

## Purpose

The repository layer is the only place in the application that talks to the database. Every class in this directory wraps Prisma and exposes a clean, domain-focused interface — methods named after what the caller wants (`findById`, `findAll`, `findRecordsByCompany`) rather than raw Prisma API calls.

Keeping all Prisma usage here means the rest of the application (services, resolvers) never imports `@prisma/client` directly. If the ORM or schema changes, only this layer needs to change.

---

## Files

**`salaryRecordInclude.js`**
A single exported constant (`SALARY_RECORD_INCLUDE`) that defines the Prisma `include` shape for salary record queries — job with its category, employee country, company country, and company. It is imported by every repository that queries salary records. This prevents the four call sites from independently defining (and eventually drifting from) the same shape.

**`UserRepository.js`**
Handles user persistence. Provides `findByEmail` (used during login and duplicate-check on registration), `findById` (used when a resolver needs to return a user by ID), and `create`. Both `findById` and `create` use Prisma's `omit` to strip `passwordHash` from the returned object — the caller never needs the hash except in `findByEmail`, which is used exclusively by `AuthService` for bcrypt comparison.

**`CountryRepository.js`**
Reads countries and their associated salary records. `findAll` returns every country with aggregate counts (`_count`) of employee records, company records, and companies attached to it. `findById` and `findByName` return a single country without counts. `findEmployeeRecords` and `findCompanyRecords` are public wrappers around a private `#findPaginatedRecords` method, which runs a Prisma transaction to keep the total count and the current page consistent.

**`JobCategoryRepository.js`**
Reads job categories. All three methods (`findAll`, `findById`, `findByName`) include a `_count` of jobs belonging to each category. No mutations. No pagination — the category list is small enough that full retrieval is always appropriate.

**`JobRepository.js`**
Reads jobs and their salary records. `findAll` accepts an optional `categoryId` filter and paginates results via a Prisma transaction. `findById` returns a single job with its category relation included. `findRecordsByJob` paginates salary records filtered to a specific job, using `SALARY_RECORD_INCLUDE` for consistent relation loading.

**`CompanyRepository.js`**
Reads companies and their salary records. Mirrors the structure of `JobRepository` — `findAll` accepts an optional `countryId` filter, `findById` and `findByName` return a single company with its country included, and `findRecordsByCompany` paginates salary records for a given company using the shared include constant.

**`SalaryRecordRepository.js`**
The most complex repository. `findAll` accepts up to ten filter parameters and delegates to a private `buildSalaryRecordWhere` function that constructs the Prisma `where` clause. The `categoryId` filter requires special handling because the category is not a direct column on `salaryRecord` — it lives on the related `job`, so the filter must be expressed through `where.job`. `create`, `update`, and `delete` provide full CRUD. All read operations use `SALARY_RECORD_INCLUDE`.

---

## Patterns used

- **Private class fields (`#prisma`)** — Prisma client is injected via constructor and stored as a private field. Nothing outside the instance can reach it.
- **Prisma transactions for paginated queries** — Every method that returns a page of results runs `count` and `findMany` inside `$transaction([...])`. This ensures both queries see the same database snapshot; without it, a write between the two calls could produce a count that does not match the returned rows.
- **`records.length` over `limit` for `hasNextPage`** — The last page of results may return fewer rows than `limit`. Using `records.length` (the actual count returned) avoids reporting `hasNextPage: true` when the final partial page has been reached.
- **Shared `SALARY_RECORD_INCLUDE` constant** — Used by `CountryRepository`, `JobRepository`, `CompanyRepository`, and `SalaryRecordRepository`. A single source of truth for which relations are eagerly loaded on salary records.
- **`buildSalaryRecordWhere` (module-private function)** — Extracts the conditional `where` clause construction out of `SalaryRecordRepository.findAll`, keeping the method readable and putting the filter logic in a named, testable unit.

---

## What this layer does NOT do

- Does not validate input. Arguments are assumed to have been validated by the service layer before they arrive here.
- Does not throw application-level errors (e.g., "not found"). It returns `null` and lets the service decide what to do with that.
- Does not know about GraphQL. No `GraphQLError`, no resolver context, no schema types.
- Does not contain business rules. Whether a user is allowed to delete a record is not a concern here.
- Does not hash passwords or generate tokens. That belongs in `AuthService`.
