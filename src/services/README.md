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

## SearchService.js

- `search` — accepts a query string and optional `limit`/`offset`. Returns early with an empty result if the query is blank. Otherwise delegates to `SearchRepository.search` which runs a fuzzy multi-field Elasticsearch query across job titles, categories, companies, countries, and cities.
- `indexRecord` — indexes a single salary record in Elasticsearch after it is created. Keeps the search index in sync with the database.
- `deleteRecord` — removes a record from the Elasticsearch index when it is deleted from the database.

---

## ChatService.js

Powers the AI chat assistant. Uses the Groq SDK to stream responses from `llama-3.1-8b-instant`.

- `streamResponse` — takes the full message history and an Express response object. Extracts the last user message, runs a `SearchRepository.search` with `limit: 15` to fetch the most relevant salary records as context, builds a system prompt that includes the record sample, then opens a streaming SSE connection to the Groq API. Each token chunk is forwarded to the client as a `data: {"token": "..."}` event. Ends with `data: [DONE]`.

The chat does not have direct database access — it grounds its answers in the Elasticsearch search results returned for the user's query.

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
