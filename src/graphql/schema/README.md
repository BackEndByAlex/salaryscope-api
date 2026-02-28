# graphql/schema/

GraphQL type definitions for the entire API. Split into one file per domain, all merged by Apollo Server at startup.

- `schema.graphql` — base `Query` and `Mutation` types with a `_: Boolean` placeholder so other files can use `extend type`
- `auth.graphql` — `User`, `AuthPayload`, `RegisterInput`, `LoginInput`; `me` query, `register` and `login` mutations
- `country.graphql` — `Country` type with optional aggregate counts and paginated relation fields; `countries`, `country`, `countryByName` queries
- `jobCategory.graphql` — `JobCategory` type with optional `jobCount`; `jobCategories`, `jobCategory`, `jobCategoryByName` queries
- `job.graphql` — `Job` and `JobPage` types; `jobs` (filterable by category) and `job` queries
- `company.graphql` — `Company` and `CompanyPage` types; `companies` (filterable by country), `company`, `companyByName` queries
- `salaryRecord.graphql` — `SalaryRecord`, `SalaryRecordPage`, `SalaryRecordFilters`, `CreateSalaryRecordInput`, `UpdateSalaryRecordInput`; `salaryRecords` and `salaryRecord` queries (auth required), `createSalaryRecord`, `updateSalaryRecord`, `deleteSalaryRecord` mutations (auth required)
