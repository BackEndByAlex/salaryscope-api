---
title: Type Definitions
sidebar_position: 1
---

This folder defines the shape of the entire API — what types exist, what queries and mutations are available, and what fields each type has.

Each file covers one domain. Apollo Server merges them all together at startup into one complete schema.

---

## schema.graphql

The base file. Defines the root `Query` and `Mutation` types with a placeholder field so all other files can safely extend them. You never touch this directly.

---

## auth.graphql

Types and operations for authentication.

- `User` — id, email, and creation date
- `AuthPayload` — what gets returned after login or register: a token and the user
- `register` — creates a new account, returns a token valid for 24 hours
- `login` — logs in with email and password, returns a token valid for 24 hours
- `me` — returns the currently logged-in user (requires a valid token)

---

## country.graphql

Types and operations for countries.

- `Country` — id, name, and optional aggregate counts (how many salary records and companies belong to it)
- `countries` — paginated list of all countries
- `country` — single country by ID
- `countryByName` — single country by name
- Nested fields on `Country` to fetch paginated salary records filtered by employee country or company country

---

## jobCategory.graphql

Types and operations for job categories.

- `JobCategory` — id, name, and optional job count
- `jobCategories` — paginated list of all categories
- `jobCategory` — single category by ID
- `jobCategoryByName` — single category by name

---

## job.graphql

Types and operations for jobs.

- `Job` — id, title, optional category, and optional roles description
- `JobPage` — paginated result wrapper (records + totalCount + hasNextPage)
- `jobs` — paginated list of jobs, filterable by category
- `job` — single job by ID
- Nested `records` field on `Job` to fetch paginated salary records for that job

---

## company.graphql

Types and operations for companies.

- `Company` — id, name, optional rating, and optional country
- `CompanyPage` — paginated result wrapper
- `companies` — paginated list of companies, filterable by country
- `company` — single company by ID
- `companyByName` — single company by name
- Nested `records` field on `Company` to fetch paginated salary records for that company

---

## salaryRecord.graphql

Types and operations for salary records — the main resource of the API.

- `SalaryRecord` — all salary fields plus relations to job, company, and countries. Some fields are only present for certain data sources (noted inline in the schema).
- `SalaryRecordPage` — paginated result wrapper
- `SalaryRecordFilters` — all available filters: job, category, country, company, source, work year, experience level, employment type, work setting, company size
- `CreateSalaryRecordInput` — fields required and optional when creating a new record
- `UpdateSalaryRecordInput` — same fields but all optional. Source cannot be changed after creation.
- `salaryRecords` — paginated list with filters
- `salaryRecord` — single record by ID
- `createSalaryRecord` — requires login
- `updateSalaryRecord` — requires login, only the owner can update
- `deleteSalaryRecord` — requires login, only the owner can delete
