---
title: Repositories
sidebar_position: 1
---

The only layer that talks directly to the database. Every query and write goes through here, nothing else in the app uses Prisma directly.

Each repository wraps one database table and exposes named methods. Services call these methods, they never write database queries themselves.

---

## UserRepository.js

- `findByEmail` — looks up a user by email (used during login)
- `findById` — looks up a user by ID (password hash is never returned)
- `create` — creates a new user (password hash is never returned)

---

## CountryRepository.js

- `findAll` — paginated list of countries, each with aggregate counts (employee records, company records, companies)
- `findById` — single country by ID
- `findByName` — single country by name
- `findEmployeeRecords` — paginated salary records where employees live in a given country (limit capped at 100)
- `findCompanyRecords` — paginated salary records where companies are based in a given country (limit capped at 100)

---

## JobCategoryRepository.js

- `findAll` — paginated list of job categories, each with a job count
- `findById` — single category by ID, with job count
- `findByName` — single category by name, with job count

---

## JobRepository.js

- `findAll` — paginated list of jobs, with an optional category filter
- `findById` — single job by ID
- `findOrCreate(title)` — finds a job by title using `findFirst`. If none exists, creates a new one with that title and no category. Used when a user submits a salary record with a job title rather than a job ID.
- `findRecordsByJob` — paginated salary records for a given job (limit capped at 100)

---

## CompanyRepository.js

- `findAll` — paginated list of companies, with an optional country filter
- `findById` — single company by ID
- `findByName` — single company by name
- `findRecordsByCompany` — paginated salary records for a given company (limit capped at 100)

---

## CityRepository.js

- `findAll` — paginated list of cities, with an optional country filter
- `findById` — single city by ID
- `findOrCreate(name, countryId)` — finds a city by name and country using `findFirst`. If none exists, creates a new one. Used when a user submits a salary record for a city that does not yet exist in the database.
- `findRecords` — paginated salary records for a given city (limit capped at 100)

---

## SalaryRecordRepository.js

- `findAll` — paginated list of salary records with up to eleven optional filters (job, category, country, company, city, experience level, employment type, work setting, company size, source, work year)
- `findById` — single salary record by ID
- `getFilterOptions(countryId, cityId)` — runs five queries in parallel and returns the distinct values that actually exist in the data for experience levels, work settings, employment types, company sizes, and work years. Both arguments are optional — if a `countryId` is provided the results are scoped to records where the employee country matches, if a `cityId` is provided they are scoped to that city. Null values are excluded from all five lists.
- `create` — creates a new salary record
- `update` — updates an existing salary record by ID
- `delete` — deletes a salary record by ID
- `findByUser(userId)` — returns all salary records created by a given user, ordered by creation date descending. Used by the `User.salaryRecords` resolver to populate the profile page.

---

## salaryRecordInclude.js

A shared Prisma `include` configuration used by every salary record query. Tells Prisma to always fetch the related job (with its category), employee country, company country, company, and city (with its country) alongside each record, so resolvers never have to request them separately.
