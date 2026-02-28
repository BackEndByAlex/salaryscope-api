# validators

This folder contains input validation logic for the API. Validators run before any database call is made and throw a `GraphQLError` immediately if the input is invalid.

## Files

### `authValidator.js`
Exports two functions:
- `validateRegisterInput({ email, password })` — checks both fields are present, the email matches a basic format pattern, and the password is at least 8 characters.
- `validateLoginInput({ email, password })` — checks only that both fields are present. Format checking is not repeated; wrong credentials are rejected by the service at the database level.

### `salaryRecordValidator.js`
Exports three functions:
- `validateCreateInput({ salary, jobId, source })` — confirms the three required fields are present and that `salary` is a positive number.
- `validateUpdateInput(data)` — confirms at least one field is included. Rejects empty objects so a no-op update cannot be submitted.
- `validateFilters({ limit, offset })` — enforces `limit` is between 1–100 and `offset` is not negative, if provided.

## Key concepts

### Validators throw GraphQLError, not plain Error
Every validator throws `GraphQLError` with `extensions.code: "BAD_USER_INPUT"`. This is the Apollo Server convention for client input failures. Apollo uses the code to shape the error response so clients can handle different failure types programmatically.

### Validators do not return a value
They are guard functions. Valid input → function returns normally. Invalid input → throws. The caller either continues or the error propagates through Apollo's error handling.

### Validators run before the database
Their job is to reject obviously bad input as early and cheaply as possible. Anything requiring a database lookup (e.g. checking whether a `jobId` exists) is handled in the service layer.

## What this folder does NOT do
- Does not handle authentication or authorization — that happens in the resolver layer.
- Does not sanitize input for XSS or SQL injection — Prisma's parameterized queries handle injection safety.
- Does not validate that referenced IDs exist in the database.
