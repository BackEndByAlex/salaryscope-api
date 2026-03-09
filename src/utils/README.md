# utils/

Shared utility functions with no side effects.

- `parseId.js` — converts a GraphQL string ID to a Prisma integer. Uses `/^\d+$/` to reject partial strings like `"3abc"` that `parseInt` would silently accept. Throws `BAD_USER_INPUT` on invalid input.
- `errors.js` — custom GraphQL error classes used across the entire API. Each class extends `GraphQLError` and sets both an error `code` and an HTTP status code via `extensions`.
  - `UnauthenticatedError` — code `UNAUTHENTICATED`, HTTP 401
  - `NotFoundError` — code `NOT_FOUND`, HTTP 404
  - `ForbiddenError` — code `FORBIDDEN`, HTTP 403
  - `BadUserInputError` — code `BAD_USER_INPUT`, HTTP 400
