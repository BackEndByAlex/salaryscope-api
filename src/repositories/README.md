# repositories/

The only layer that talks directly to the database. Every query and write goes through here, nothing else in the app uses Prisma directly.

Each repository wraps one database table and exposes named methods. Services call these methods, they never write database queries themselves.

---

## UserRepository.js

- `findByEmail` — looks up a user by email (used during login)
- `findById` — looks up a user by ID (password hash is never returned)
- `create` — creates a new user (password hash is never returned)
- `findByGithubId` — looks up a user by their GitHub ID
- `createGithubUser` — creates a new user from a GitHub OAuth profile (no password hash)
- `linkGithubId` — attaches a GitHub ID to an existing user account
- `findByGoogleId` — looks up a user by their Google ID
- `createGoogleUser` — creates a new user from a Google OAuth profile (no password hash)
- `linkGoogleId` — attaches a Google ID to an existing user account

---

## CountryRepository.js

- `findAll` — paginated list of countries, each with aggregate counts (employee records, company records, companies). Limit is capped between 1 and 100; offset cannot be negative.
- `findById` — single country by ID
- `findByName` — single country by name
- `findEmployeeRecords` — paginated salary records where employees live in a given country (limit capped at 100)
- `findCompanyRecords` — paginated salary records where companies are based in a given country (limit capped at 100)

---

## JobCategoryRepository.js

- `findAll` — paginated list of job categories, each with a job count. Limit is capped between 1 and 100; offset cannot be negative.
- `findById` — single category by ID, with job count
- `findByName` — single category by name, with job count

---

## JobRepository.js

- `findAll` — paginated list of jobs, with an optional category filter. Limit is capped between 1 and 100; offset cannot be negative.
- `findById` — single job by ID
- `findRecordsByJob` — paginated salary records for a given job (limit capped at 100)

---

## CompanyRepository.js

- `findAll` — paginated list of companies, with an optional country filter. Limit is capped between 1 and 100; offset cannot be negative.
- `findById` — single company by ID
- `findByName` — single company by name
- `findRecordsByCompany` — paginated salary records for a given company (limit capped at 100)

---

## CityRepository.js

- `findAll` — paginated list of cities, with an optional country filter
- `findById` — single city by ID
- `findRecords` — paginated salary records for a given city (limit capped at 100)

---

## SalaryRecordRepository.js

- `findAll` — paginated list of salary records with up to eleven optional filters (job, category, country, company, city, experience level, employment type, work setting, company size, source, work year)
- `findById` — single salary record by ID
- `create` — creates a new salary record
- `update` — updates an existing salary record by ID
- `delete` — deletes a salary record by ID
- `getFilterOptions` — returns the distinct values that actually exist in the data for experience levels, work settings, employment types, company sizes, and work years. Accepts optional `countryId` and `cityId` to scope the results to a region. Runs five queries in parallel using `distinct` to keep it fast.

---

## salaryRecordInclude.js

A shared Prisma `include` configuration used by every salary record query. Tells Prisma to always fetch the related job (with its category), employee country, company country, company, and city (with its country) alongside each record, so resolvers never have to request them separately.
