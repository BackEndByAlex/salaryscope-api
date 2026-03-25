---
title: Authentication
sidebar_position: 1
---

Everything that handles who a user is and whether they are allowed to do something.

---

## AuthService.js

Handles registering and logging in users.

**Register:**

1. Checks that the email is not already taken (returns a vague error message to prevent user enumeration)
2. Hashes the password (never stores it in plain text)
3. Creates the user in the database
4. Strips sensitive fields with `#toPublicUser` before returning
5. Returns a signed token and the safe user object

**Login:**

1. Looks up the user by email
2. Compares the provided password against the stored hash
3. If it matches, strips sensitive fields with `#toPublicUser` and returns a signed token and the user
4. If it doesn't, throws an "Invalid credentials" error (same message whether the email or password is wrong, intentionally)

Input validation (email/password required, format, length) is handled by `authValidator.js` in the resolver layer before the service is called. AuthService does not duplicate those checks.

Tokens are signed with the private RSA key from `config/keys.js`, use the RS256 algorithm, expire after 24 hours, and include `issuer` and `audience` claims to scope them to this API.

---

## jwtMiddleware.js

Runs on every incoming request before anything else.

Token extraction checks two places in order:

1. `Authorization: Bearer <token>` header
2. `token` cookie (set automatically on login/register)

After extracting the token, it verifies it using the public RSA key (checks algorithm, issuer, and audience). If valid, attaches `{ id, email }` to the request context so resolvers know who is making the request. If missing or invalid, sets `user: null` and continues without throwing.

Resolvers decide what to do with an unauthenticated request. This middleware never blocks a request on its own.

---

## Logout and token revocation

The API exposes `POST /auth/logout`. It clears the `token` cookie on the client side.

**Known tradeoff:** JWTs are stateless — there is no server-side revocation. A token copied before logout remains valid until it expires (24 hours). This is an accepted limitation of the stateless JWT model. A production system requiring immediate revocation would add a server-side blocklist (e.g. a Redis set keyed by `jti`) that the middleware checks on every request.

---

## authGuard.js

A single function — `assertAuthenticated(user)`.

Called at the top of any resolver that requires a logged-in user. If `user` is null, it throws an `UnauthenticatedError`. If the user is logged in, it does nothing and the resolver continues.

---

## authResolvers.js

The GraphQL entry points for authentication.

- `register` — validates input, calls `AuthService.register`, sets the `token` cookie on the response
- `login` — validates input, calls `AuthService.login`, sets the `token` cookie on the response
- `me` — checks that the user is logged in, then returns their profile from `UserService`

Input validation happens before the service layer is touched.

---

## Auth flow

```
Incoming request
  └── jwtMiddleware — reads token (header or cookie), sets context.user (or null)
        └── Resolver
              ├── mutations (create/update/delete) — assertAuthenticated(user) → blocks if not logged in
              └── queries (read) — no guard, public access

POST /auth/logout
  └── clears token cookie on the client
      (token remains valid server-side until expiry — known tradeoff)
```

---

## GraphQL schema

The types and operations (`User`, `AuthPayload`, `register`, `login`, `me`) are defined in `src/graphql/schema/auth.graphql`.
