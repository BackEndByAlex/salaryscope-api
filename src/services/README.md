# services/

Business logic layer between resolvers and repositories. Converts `null` returns from repositories into `NOT_FOUND` GraphQL errors, and calls `parseId` to convert string IDs from GraphQL into integers before hitting the database.

- `AuthService.js` — register (hash password, create user, return JWT), login (compare hash, return JWT)
- `UserService.js` — get user by ID for the `me` query
- `CountryService.js` — get all, by ID, by name, paginated salary records by employee or company country
- `JobCategoryService.js` — get all, by ID, by name
- `JobService.js` — get all with optional filters, by ID, paginated salary records per job
- `CompanyService.js` — get all with optional filters, by ID, by name, paginated salary records per company
- `SalaryRecordService.js` — full CRUD; `update` and `delete` catch Prisma P2025 errors and rethrow as `NOT_FOUND`
