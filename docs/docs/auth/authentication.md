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

Logout is handled by the `logout` GraphQL mutation. It clears the `token` cookie server-side via `res.clearCookie()`.

**Known tradeoff:** JWTs are stateless — there is no server-side revocation. A token copied before logout remains valid until it expires (24 hours). This is an accepted limitation of the stateless JWT model. A production system requiring immediate revocation would add a server-side blocklist (e.g. a Redis set keyed by `jti`) that the middleware checks on every request.

---

## authGuard.js

A single function — `assertAuthenticated(user)`.

Called at the top of any resolver that requires a logged-in user. If `user` is null, it throws an `UnauthenticatedError`. If the user is logged in, it does nothing and the resolver continues.

---

## GitHubOAuthService.js

Handles the code exchange step of logging in (or registering) a user via GitHub OAuth 2.0 with PKCE. The CSRF state check happens in `authResolvers.js` before this service is called; this service only deals with the provider exchange.

1. Sends the authorization code and PKCE `code_verifier` to GitHub's token endpoint to exchange for an access token
2. Uses the access token to fetch the user's GitHub profile (id, login, email)
3. Looks up an existing user by their GitHub ID
4. If no match is found, checks whether an account with the same email already exists and links the GitHub ID to it; otherwise creates a new user
5. Issues an RS256 JWT (same format as password login) and returns it with the user object

OAuth users created through this flow have no password — the `passwordHash` field is null for their account.

---

## GoogleOAuthService.js

Handles the code exchange step of logging in (or registering) a user via Google OAuth 2.0 with PKCE. Follows the same pattern as `GitHubOAuthService.js`.

1. Sends the authorization code and PKCE `code_verifier` to Google's token endpoint (`https://oauth2.googleapis.com/token`)
2. Uses the returned access token to fetch the user's profile from `https://www.googleapis.com/oauth2/v3/userinfo`
3. Looks up an existing user by their Google ID
4. If no match is found, checks whether an account with the same email already exists and links the Google ID to it; otherwise creates a new user
5. Issues an RS256 JWT and returns it with the user object

---

## authResolvers.js

The GraphQL entry points for authentication.

- `register` — validates input, calls `AuthService.register`, sets a signed JWT as an HttpOnly `token` cookie, returns the user object
- `login` — validates input, calls `AuthService.login`, sets the auth cookie, returns the user object
- `beginGoogleLogin` — takes a PKCE `codeChallenge`, generates a cryptographically random `state`, stores it in a signed HttpOnly `oauth_google_state` cookie (10-minute TTL), and returns the full Google authorization URL to redirect the user to
- `googleLogin` — verifies the `state` in the request against the signed cookie (constant-time comparison), clears the cookie, then calls `GoogleOAuthService` with only `code` and `codeVerifier`; sets the auth cookie on success
- `beginGithubLogin` — same as `beginGoogleLogin` but for GitHub; stores state in `oauth_github_state` cookie
- `githubLogin` — same as `googleLogin` but for GitHub OAuth
- `logout` — clears the `token` cookie server-side, returns `true`
- `me` — checks that the user is logged in, then returns their profile from `UserService`
- `User.githubConnected` — returns `true` if the user has a GitHub ID linked to their account
- `User.googleConnected` — returns `true` if the user has a Google ID linked to their account

The JWT is never returned in the response body — all auth mutations deliver it exclusively via the HttpOnly cookie.

CSRF state verification (`verifyOAuthState`) runs at the resolver boundary where `req` and `res` are available. It reads the signed cookie, clears it immediately (making it single-use), then compares the expected and provided values with `crypto.timingSafeEqual` (length-checked first to avoid the function throwing). If the cookie is missing or the values don't match, a `BAD_USER_INPUT` error is thrown before any OAuth service code runs.

Input validation happens before the service layer is touched.

---

## Auth flow

```
Incoming request
  └── jwtMiddleware — reads token (header or cookie), sets context.user (or null)
        └── Resolver
              ├── mutations (create/update/delete) — assertAuthenticated(user) → blocks if not logged in
              └── queries (read) — no guard, public access

mutation logout
  └── clears token cookie on the client via res.clearCookie()
      (token remains valid server-side until expiry — known tradeoff)
```

---

## User model — database fields

The `User` model in the Prisma schema has been updated to support OAuth accounts:

- `passwordHash` is now nullable — users who sign up through GitHub or Google have no password
- `githubId` — optional, unique — stores the GitHub user ID when a GitHub account is linked
- `googleId` — optional, unique — stores the Google user ID when a Google account is linked

---

## OAuth flow

```
Client                          Backend
  |                                |
  |-- beginGoogleLogin({           |
  |     codeChallenge })  -------> | generates random state
  |                                | sets signed oauth_google_state cookie (10 min)
  |                                | returns full Google auth URL
  | <-- { authUrl }                |
  |                                |
  | -- redirect user to authUrl -> Google
  | <-- Google callback with code + state
  |                                |
  |-- googleLogin({                |
  |     code, codeVerifier, }) --> | reads oauth_google_state cookie
  |     state                      | clears cookie (single-use)
  |                                | timingSafeEqual(cookie, input.state)
  |                                | calls GoogleOAuthService(code, codeVerifier)
  |                                | sets token cookie
  | <-- { user }                   |
```

The same pattern applies for GitHub (`beginGithubLogin` / `githubLogin`).

---

## GraphQL schema

The types and operations (`User`, `AuthPayload`, `BeginOAuthPayload`, `register`, `login`, `beginGoogleLogin`, `googleLogin`, `beginGithubLogin`, `githubLogin`, `logout`, `me`) are defined in `src/graphql/schema/auth.graphql`.
