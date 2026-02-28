# graphql/schema

This folder contains the full GraphQL type system for the salary API. Every type, query, mutation, and input object used by the API is defined here.

## How it is structured

The schema is split across multiple `.graphql` files, one per domain. A single large schema file becomes hard to navigate as the API grows. Splitting by domain means each file is self-contained and easy to find.

Apollo Server loads all files at startup and merges them into one schema, so from GraphQL's perspective it is still a single schema.

## Files

### `schema.graphql`
The root file. Defines the base `Query` and `Mutation` types with a placeholder `_: Boolean` field each. GraphQL requires at least one field per type — the placeholder satisfies that so every other file can use `extend type Query` and `extend type Mutation`. Clients should never call `_`.

### `auth.graphql`
Defines `User`, `AuthPayload`, `RegisterInput`, and `LoginInput`. Extends `Query` with `me` (returns the authenticated user) and `Mutation` with `register` and `login`. Both mutations return a JWT token valid for 24 hours.

### `country.graphql`
Defines the `Country` type with optional aggregate count fields (`employeeRecordCount`, `companyRecordCount`, `companyCount`) and two paginated relation fields (`employeeRecords`, `companyRecords`). The count fields are documented as only populated on the list query, not when `Country` appears nested inside another type. Extends `Query` with `countries`, `country`, and `countryByName`.

### `jobCategory.graphql`
Defines `JobCategory` with an optional `jobCount` field. The count is null when the category is loaded as a nested relation on a `Job`. Extends `Query` with `jobCategories`, `jobCategory`, and `jobCategoryByName`.

### `job.graphql`
Defines the `Job` type (links to a `JobCategory`, exposes a paginated `records` field) and `JobPage` (the paginated wrapper with `jobs`, `totalCount`, `hasNextPage`). Extends `Query` with `jobs` (paginated, filterable by category) and `job` (by ID).

### `company.graphql`
Defines `Company` (optional `rating`, optional `country`, paginated `records`) and `CompanyPage`. Extends `Query` with `companies`, `company`, and `companyByName`.

### `salaryRecord.graphql`
The most detailed file. Defines `SalaryRecord`, `SalaryRecordPage`, `SalaryRecordFilters`, `CreateSalaryRecordInput`, and `UpdateSalaryRecordInput`. Several `SalaryRecord` fields are source-specific and nullable. `source` is excluded from `UpdateSalaryRecordInput` intentionally — a record's data origin cannot change after creation. All queries and mutations on salary records require authentication.

## Key concepts

### extend type
Every domain file extends `Query` and `Mutation` rather than redefining them. The base types are declared once in `schema.graphql`; every other file adds to them.

### Paginated wrapper types
`JobPage`, `CompanyPage`, and `SalaryRecordPage` all share the same shape: items list + `totalCount` + `hasNextPage`. Clients can use these to build pagination UI without knowing the server implementation.

### Source-specific nullable fields
`SalaryRecord` covers three datasets. Fields that only apply to one source are typed as nullable and documented inline. This keeps the type unified rather than splitting into three separate types.

## What this folder does NOT do
- Does not contain resolvers — those live in `src/graphql/resolvers/`.
- Does not enforce authentication — that happens in the resolver layer.
- Does not validate input values beyond the type system — that is handled by `src/validators/`.
