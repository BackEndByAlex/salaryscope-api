# repositories/

The only layer that talks to the database. Each class wraps Prisma for one domain (User, Country, Job, JobCategory, Company, SalaryRecord) and exposes named methods like `findById`, `findAll`, and `findRecordsByCompany`.

- `salaryRecordInclude.js` — shared Prisma `include` shape used by all salary record queries
- `UserRepository.js` — find by email or ID, create user (passwordHash omitted on return)
- `CountryRepository.js` — list with aggregate counts, find by ID/name, paginated salary records by employee or company country
- `JobCategoryRepository.js` — list, find by ID/name, all return job count via `_count`
- `JobRepository.js` — paginated list with optional category filter, find by ID, paginated records per job
- `CompanyRepository.js` — paginated list with optional country filter, find by ID/name, paginated records per company
- `SalaryRecordRepository.js` — full CRUD plus a paginated list with up to ten filters
