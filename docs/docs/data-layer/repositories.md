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
- `findRecordsByJob` — paginated salary records for a given job (limit capped at 100)

---

## CompanyRepository.js

- `findAll` — paginated list of companies, with an optional country filter
- `findById` — single company by ID
- `findByName` — single company by name
- `findRecordsByCompany` — paginated salary records for a given company (limit capped at 100)

---

## SalaryRecordRepository.js

- `findAll` — paginated list of salary records with up to ten optional filters (job, category, country, company, experience level, employment type, work setting, company size, source, work year)
- `findById` — single salary record by ID
- `create` — creates a new salary record
- `update` — updates an existing salary record by ID
- `delete` — deletes a salary record by ID

---

## salaryRecordInclude.js

A shared Prisma `include` configuration used by every salary record query. Tells Prisma to always fetch the related job (with its category), employee country, company country, and company alongside each record — so resolvers never have to request them separately.
