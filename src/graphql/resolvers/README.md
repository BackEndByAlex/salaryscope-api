# graphql/resolvers/

Resolvers are the bridge between the GraphQL schema and the service layer. When a query or mutation comes in, the matching resolver handles it.

Each file covers one domain. Resolvers are kept thin on purpose, they guard access, validate input, parse IDs, and hand off to a service. No business logic lives here.

---

## companyResolvers.js

- `companies` — returns a paginated list of companies, with an optional country filter
- `company` — returns a single company by ID
- `companyByName` — returns a company by name
- `Company.rating` — converts the rating from a Prisma Decimal to a regular number before sending it to the client
- `Company.records` — returns paginated salary records that belong to that company

---

## countryResolvers.js

- `countries` — returns a paginated list of countries
- `country` — returns a single country by ID
- `countryByName` — returns a country by name
- `Country.employeeRecordCount` — total salary records where employees live in this country
- `Country.companyRecordCount` — total salary records where companies are based in this country
- `Country.companyCount` — total companies based in this country
- `Country.employeeRecords` — paginated salary records by employee country
- `Country.companyRecords` — paginated salary records by company country

---

## jobCategoryResolvers.js

- `jobCategories` — returns a paginated list of job categories
- `jobCategory` — returns a single category by ID
- `jobCategoryByName` — returns a category by name
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
- `createSalaryRecord` — creates a new salary record. Requires login.
- `updateSalaryRecord` — updates a salary record. Requires login. Only the owner can update.
- `deleteSalaryRecord` — deletes a salary record. Requires login. Only the owner can delete.
- `SalaryRecord.salary` and `SalaryRecord.salaryInUsd` — convert Prisma Decimal values to regular numbers before sending to the client

GraphQL IDs come in as strings, this file also converts all ID fields to integers before passing them to the service layer.
