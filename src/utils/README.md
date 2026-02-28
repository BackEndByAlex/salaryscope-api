# utils

Small, focused utility functions used across the application. Each utility solves one specific problem and has no side effects.

## Files

### `parseId.js`
Exports a single function: `parseId(id)`.

GraphQL represents the `ID` scalar as a string. Prisma expects integer primary keys. `parseId` bridges that gap — it takes a string ID from a GraphQL argument and returns a JavaScript integer for Prisma.

It does not use `parseInt` alone. `parseInt("3abc", 10)` returns `3` without error, which would silently match the wrong record. Instead, `parseId` first tests the input against `/^\d+$/` to confirm it is digits only. If the string contains anything else, it throws a `GraphQLError` with `code: "BAD_USER_INPUT"` before `parseInt` is called.

## Key concepts

### Why not just use parseInt?
`parseInt` accepts strings like `"42abc"` and returns `42`. In a GraphQL API where IDs come from client input, that leniency is a hazard — a malformed ID would silently look up the wrong record or produce a cryptic Prisma error. `parseId` fails fast with a clear, structured error the client can act on.

### Why GraphQLError instead of plain Error?
`GraphQLError` with `extensions.code` gives Apollo Server the information it needs to format a well-structured error response. A plain `Error` would still reach the client but without the `code` field that lets clients distinguish bad input from server errors.

## What this folder does NOT do
- No business logic, no database calls.
- Does not check whether the parsed ID exists in the database — that is the service layer's job.
