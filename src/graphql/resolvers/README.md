# graphql/resolvers/

The resolver layer connects the GraphQL schema to the service layer. Each file handles one domain. Resolvers are thin — they guard, validate, parse input, and delegate to a service. No business logic lives here.

- `authResolvers.js` — `me` (auth guard + userService), `register` and `login` (validate input + authService)
- `countryResolvers.js` — country queries + `Country` field resolvers for aggregate counts and nested paginated salary records
- `jobCategoryResolvers.js` — job category queries + `jobCount` field resolver (reads from `_count`)
- `jobResolvers.js` — job queries + `Job.records` field resolver; parses `categoryId` filter from string to integer
- `companyResolvers.js` — company queries + `Company.rating` field resolver (Prisma Decimal → Float) + `Company.records`; parses `countryId` filter
- `salaryRecordResolvers.js` — all salary record queries and mutations (auth required on all); parses filter IDs, create/update input IDs, and converts `salary`/`salaryInUsd` Decimal fields to Float
