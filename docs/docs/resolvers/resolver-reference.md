---
title: Resolver Reference
sidebar_position: 1
---

Resolvers are the bridge between the GraphQL schema and the service layer. When a query or mutation comes in, the matching resolver handles it.

Each file covers one domain. Resolvers are kept thin on purpose, they guard access, validate input, parse IDs, and hand off to a service. No business logic lives here.

---

## companyResolvers.js

- `companies` — returns a paginated list of companies, with an optional country filter
- `company` — returns a single company by ID
- `companyByName` — returns a company by name (name argument validated: max 255 characters)
- `Company.rating` — converts the rating from a Prisma Decimal to a regular number before sending it to the client
- `Company.records` — returns paginated salary records that belong to that company

---

## countryResolvers.js

- `countries` — returns a paginated list of countries
- `country` — returns a single country by ID
- `countryByName` — returns a country by name (name argument validated: max 255 characters)
- `Country.employeeRecordCount` — total salary records where employees live in this country
- `Country.companyRecordCount` — total salary records where companies are based in this country
- `Country.companyCount` — total companies based in this country
- `Country.employeeRecords` — paginated salary records by employee country
- `Country.companyRecords` — paginated salary records by company country

---

## jobCategoryResolvers.js

- `jobCategories` — returns a paginated list of job categories
- `jobCategory` — returns a single category by ID
- `jobCategoryByName` — returns a category by name (name argument validated: max 255 characters)
- `JobCategory.jobCount` — total number of jobs that belong to this category

---

## jobResolvers.js

- `jobs` — returns a paginated list of jobs, with an optional category filter
- `job` — returns a single job by ID
- `Job.records` — returns paginated salary records for that job

---

## cityResolvers.js

- `cities` — returns a paginated list of cities, with an optional country filter
- `city` — returns a single city by ID
- `City.recordCount` — total salary records in this city
- `City.records` — returns paginated salary records for that city

---

## salaryRecordResolvers.js

- `salaryRecords` — returns a paginated list of salary records, with optional filters (job, category, country, company, city, experience level, etc.)
- `salaryRecord` — returns a single salary record by ID
- `filterOptions` — returns the distinct filter values that actually exist in the data (experience levels, work settings, employment types, company sizes, work years). Accepts optional `countryId` and `cityId` to scope the results to a region. No login required.
- `createSalaryRecord` — creates a new salary record. Requires login. Accepts either `jobId` or `jobTitle` (the service handles findOrCreate for jobs). Accepts `cityName` alongside `employeeCountryId` to find or create a city.
- `updateSalaryRecord` — updates a salary record. Requires login. Only the owner can update.
- `deleteSalaryRecord` — deletes a salary record. Requires login. Only the owner can delete.
- `SalaryRecord.salary` and `SalaryRecord.salaryInUsd` — convert Prisma Decimal values to regular numbers before sending to the client

GraphQL IDs come in as strings, this file also converts all ID fields to integers before passing them to the service layer.

---

## authResolvers.js

Handles registration, login, OAuth, and session management. Lives in `src/auth/` rather than `src/graphql/resolvers/` because it sits closer to the auth infrastructure.

- `register` — creates a new account. Input is validated before being passed to the auth service. On success, a signed JWT is set as an `httpOnly` cookie.
- `login` — checks credentials and, if correct, sets the same kind of auth cookie.
- `githubLogin` — completes a GitHub OAuth login. Accepts `code`, `codeVerifier`, and `state` (login-CSRF protection). Sets the auth cookie on success, returns the user object.
- `googleLogin` — same as above but for Google OAuth.
- `logout` — clears the auth cookie. No auth check required — if there is no cookie there is nothing to do.
- `me` — returns the currently logged-in user. Requires login.
- `User.githubConnected` — returns `true` if the user's account has a GitHub ID linked, `false` otherwise.
- `User.googleConnected` — returns `true` if the user's account has a Google ID linked, `false` otherwise.
- `User.salaryRecords` — returns all salary records submitted by this user, delegating to `salaryRecordService.getByUser(parent.id)`.
- `deleteAccount` — permanently deletes the current user's account. Requires login. Calls `userService.deleteById(user.id)`, clears the auth cookie, and returns `true`. Salary records remain in the dataset with `createdBy` set to `null`.
