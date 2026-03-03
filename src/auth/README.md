# auth/

Handles all authentication concerns: JWT generation and verification, request context, and access control.

## Files

### `AuthService.js`
Registers and logs in users. Hashes passwords with bcrypt (12 salt rounds), signs JWTs with RS256 using the private key from `config/keys.js`. Tokens expire after 24 hours.

### `jwtMiddleware.js`
Express middleware that runs on every request. Reads the `Authorization: Bearer <token>` header, verifies the token against the public RSA key, and attaches the decoded user (`{ id, email }`) to the Apollo context. An invalid or missing token sets `user: null` — it does not throw. Resolvers decide what to do with an unauthenticated context.

### `authGuard.js`
Single function — `assertAuthenticated(user)`. Called at the top of any resolver that requires a logged-in user. Throws `UnauthenticatedError` (HTTP 401) if `user` is null.

### `authResolvers.js`
GraphQL resolvers for `register`, `login`, and `me`. Delegates all logic to `AuthService` and `UserService`. Validates input via `authValidator` before touching the service layer.

## Auth flow

```
Request
  └── jwtMiddleware (sets context.user or null)
        └── Resolver
              ├── [mutation] assertAuthenticated(user) → throws 401 if not logged in
              └── [query] no guard — reads are public
```

## Schema

The GraphQL types (`User`, `AuthPayload`, `register`, `login`, `me`) are defined in `src/graphql/schema/auth.graphql`.
