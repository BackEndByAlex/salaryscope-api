# graphql/schema/

This folder defines the shape of the entire API, what types exist, what queries and mutations are available, and what fields each type has.

Each file covers one domain. Apollo Server merges them all together at startup into one complete schema.

---

## schema.graphql

The base file. Defines the root `Query` and `Mutation` types with a placeholder field so all other files can safely extend them. You never touch this directly.

---

## auth.graphql

Types and operations for authentication.

- `User` — id, email, creation date, and two boolean flags: `githubConnected` and `googleConnected` (whether those OAuth providers are linked to the account)
- `AuthPayload` — what gets returned after login or register: the user object only. The JWT is delivered exclusively via an HttpOnly cookie — it is not included in the response body.
- `register` — creates a new account, sets an HttpOnly auth cookie valid for 24 hours
- `login` — logs in with email and password, sets an HttpOnly auth cookie valid for 24 hours
- `githubLogin` — logs in (or registers) via GitHub OAuth 2.0 PKCE. Takes `code`, `codeVerifier`, and a non-empty `state` value (login-CSRF protection). Sets the auth cookie on success.
- `googleLogin` — logs in (or registers) via Google OAuth 2.0 PKCE. Takes `code`, `codeVerifier`, and a non-empty `state` value. Sets the auth cookie on success.
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

## city.graphql

Types and operations for cities.

- `City` — id, name, optional state, and the country it belongs to
- `CityPage` — paginated result wrapper
- `cities` — paginated list of cities, filterable by country
- `city` — single city by ID
- Nested `records` field on `City` to fetch paginated salary records for that city

---

## salaryRecord.graphql

Types and operations for salary records, the main resource of the API.

- `SalaryRecord` — all salary fields plus relations to job, company, and countries. Some fields are only present for certain data sources (noted inline in the schema).
- `SalaryRecordPage` — paginated result wrapper
- `SalaryRecordFilters` — all available filters: job, category, country, company, city, source, work year, experience level, employment type, work setting, company size
- `FilterOptions` — lists the distinct values that actually exist in the data for a given region (experience levels, work settings, employment types, company sizes, and work years). Used to populate filter dropdowns dynamically.
- `CreateSalaryRecordInput` — fields required and optional when creating a new record
- `UpdateSalaryRecordInput` — same fields but all optional. Source cannot be changed after creation.
- `salaryRecords` — paginated list with filters
- `salaryRecord` — single record by ID
- `filterOptions` — returns a `FilterOptions` object, optionally scoped to a country or city. No login required.
- `createSalaryRecord` — requires login
- `updateSalaryRecord` — requires login, only the owner can update
- `deleteSalaryRecord` — requires login, only the owner can delete
