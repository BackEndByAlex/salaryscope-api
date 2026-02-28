# utils/

Shared utility functions with no side effects.

- `parseId.js` — converts a GraphQL string ID to a Prisma integer. Uses `/^\d+$/` to reject partial strings like `"3abc"` that `parseInt` would silently accept. Throws `BAD_USER_INPUT` on invalid input.
