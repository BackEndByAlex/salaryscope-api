---
title: Helpers
sidebar_position: 1
---

Small shared functions used across the entire codebase. No business logic — just helpers that solve one specific problem each.

---

## parseId.js

Converts a GraphQL string ID into an integer before it reaches the database.

GraphQL IDs are always strings. Prisma expects integers. This function bridges the gap, and does it safely. It rejects anything that isn't a plain positive number (e.g. `"3abc"` or `""`) and throws a `BadUserInputError` with a clear message. Without this, `parseInt` would silently accept `"3abc"` and return `3`, which could cause subtle bugs.

---

## errors.js

Custom error classes used across the entire API. Each one maps to a specific situation and carries both an error code and an HTTP status so clients get consistent, meaningful responses.

| Class | Code | HTTP | When it's used |
|---|---|---|---|
| `UnauthenticatedError` | `UNAUTHENTICATED` | 401 | The request requires login but no valid token was provided |
| `NotFoundError` | `NOT_FOUND` | 404 | A requested record doesn't exist |
| `ForbiddenError` | `FORBIDDEN` | 403 | The user is logged in but not allowed to perform this action |
| `BadUserInputError` | `BAD_USER_INPUT` | 400 | The input provided is invalid (missing fields, bad ID, etc.) |

All four extend `GraphQLError` — so Apollo Server handles them correctly and includes the code and status in the response automatically.
