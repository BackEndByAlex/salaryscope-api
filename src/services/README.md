# services/

The business logic layer. Services sit between resolvers and repositories, they handle what should happen, not how the database is queried.

Every service follows the same pattern:
- Converts string IDs from GraphQL into integers before passing them to the repository
- Throws a `NotFoundError` if a record doesn't exist instead of returning null
- Throws a `ForbiddenError` if a user tries to modify something they don't own

---

## UserService.js

- `getById` — returns a user by ID, or throws `NotFoundError` if not found

Used by the `me` query to return the currently logged-in user's profile.

---

## CountryService.js

- `getAll` — returns a paginated list of countries
- `getById` — returns a country by ID, or throws `NotFoundError`
- `getByName` — returns a country by name, or throws `NotFoundError`
- `getEmployeeRecords` — returns paginated salary records where employees live in a given country
- `getCompanyRecords` — returns paginated salary records where companies are based in a given country

---

## JobCategoryService.js

- `getAll` — returns a paginated list of job categories
- `getById` — returns a category by ID, or throws `NotFoundError`
- `getByName` — returns a category by name, or throws `NotFoundError`

---

## JobService.js

- `getAll` — returns a paginated list of jobs, with an optional category filter
- `getById` — returns a job by ID, or throws `NotFoundError`
- `getRecords` — returns paginated salary records for a given job

---

## CompanyService.js

- `getAll` — returns a paginated list of companies, with an optional country filter
- `getById` — returns a company by ID, or throws `NotFoundError`
- `getByName` — returns a company by name, or throws `NotFoundError`
- `getRecords` — returns paginated salary records for a given company

---

## CityService.js

- `getAll` — returns a paginated list of cities, with an optional country filter
- `getById` — returns a city by ID, or throws `NotFoundError`
- `getRecords` — returns paginated salary records for a given city

---

## SalaryRecordService.js

- `getAll` — returns a paginated list of salary records with optional filters
- `getById` — returns a single record by ID, or throws `NotFoundError`
- `getFilterOptions` — returns the distinct filter values that exist in the data, optionally scoped to a country or city. Passes straight through to the repository.
- `create` — creates a new record and tags it with the logged-in user's ID
- `update` — finds the record, checks ownership, then updates it
- `delete` — finds the record, checks ownership, then deletes it

Ownership rules:
- Records from the public dataset (`createdBy` is null) cannot be modified by anyone
- Records created by a user can only be modified by that same user
- Any violation throws a `ForbiddenError`
