---
title: Services
sidebar_position: 2
---

The business logic layer. Services sit between resolvers and repositories, they handle what should happen, not how the database is queried.

Every service follows the same pattern:

- Converts string IDs from GraphQL into integers before passing them to the repository
- Throws a `NotFoundError` if a record doesn't exist instead of returning null
- Throws a `ForbiddenError` if a user tries to modify something they don't own

---

## UserService.js

- `getById` — returns a user by ID, or throws `NotFoundError` if not found
- `deleteById` — finds the user by ID (throws `NotFoundError` if not found), then deletes them via the repository

Used by the `me` query to return the currently logged-in user's profile, and by `deleteAccount` to permanently remove a user.

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

Constructed with three repositories: **`SalaryRecordRepository`**, **`CityRepository`**, and **`JobRepository`**. The extra two are needed to handle city and job creation when a user submits free-text values rather than IDs.

- `getAll` — returns a paginated list of salary records with optional filters
- `getById` — returns a single record by ID, or throws `NotFoundError`
- `create` — creates a new record tagged with the logged-in user's ID. Before writing to the database it resolves two optional free-text fields:
  1. If `jobTitle` is provided instead of `jobId`, calls `jobRepository.findOrCreate(jobTitle)` to get or create the matching job
  2. If `cityName` and `employeeCountryId` are both provided, calls `cityRepository.findOrCreate(cityName, countryId)` to get or create the city and attaches its ID to the record
- `getByUser(userId)` — returns all salary records created by a given user, used to populate the profile page
- `update` — finds the record, checks ownership, then updates it
- `delete` — finds the record, checks ownership, then deletes it

Ownership rules:

- Records from the public dataset (`createdBy` is null) cannot be modified by anyone
- Records created by a user can only be modified by that same user
- Any violation throws a `ForbiddenError`

---

## SearchService.js

Bridges the Elasticsearch index and the API. All full-text search and indexing goes through here.

- `search(query, limit, offset)` — runs a full-text search against the Elasticsearch index and returns a `{ records, totalCount, hasNextPage }` page object. Used by the `searchRecords` resolver.
- `indexRecord(record)` — indexes a single salary record after it is created via `createSalaryRecord`.
- `deleteRecord(id)` — removes a document from the index when a salary record is deleted.

---

## ChatService.js

Streams AI responses from the Groq LLM, grounded in salary data from Elasticsearch.

- `streamResponse(messages, res)` — takes the full conversation history and an Express response object. Searches Elasticsearch for the 15 most relevant records using the last user message as the query. Prepends them as system context, then opens an SSE stream to the Groq API (`llama-3.1-8b-instant` model). Writes each token to `res` as a `data:` event. Sends `[DONE]` when the stream ends. Sends `[ERROR]` if Groq returns an error.

Used by `POST /api/chat` — the REST endpoint that serves the frontend chat feature.
