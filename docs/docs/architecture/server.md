---
title: Server
sidebar_position: 1
---

The entry point for the entire application. This file sets up Express, applies security middleware, and mounts Apollo Server on the `/graphql` endpoint.

---

## Request lifecycle

![Request lifecycle](/img/diagrams/05-request-lifecycle.svg)

> Every request passes through this pipeline top-to-bottom: Express middleware → JWT context builder → Apollo validation rules → resolver → service → repository → Prisma → Postgres.

---

## What it does

`server.js` creates an Express app with Apollo Server (via `@as-integrations/express5`) and exposes a single GraphQL endpoint. It loads environment variables from `.env`, builds the Apollo Server instance, creates all services, and wires everything together before starting the HTTP server.

---

## Middleware chain

Middleware is applied in this order. Each request passes through every layer before reaching Apollo Server:

1. **Helmet** — sets security headers (Content-Security-Policy configured to allow Apollo Sandbox)
2. **CORS** — validates the request origin against `ALLOWED_ORIGINS` from the environment; `credentials: true` allows cookies to be sent cross-origin
3. **Cookie parser** — parses the `Cookie` header so the JWT middleware can read the `token` cookie; initialized with `COOKIE_SECRET` to enable signed cookies for OAuth state verification
4. **JSON body parser** — parses incoming JSON with a 100kb size limit
5. **General rate limiter** — 500 requests per 15-minute window per IP
6. **Batch request blocker** — rejects any request where the body is an array (no batched queries allowed)
7. **Auth rate limiter** — stricter limit (10 requests per 15-minute window) applied only to `Login` and `Register` operations
8. **Apollo Server middleware** — handles the actual GraphQL request, builds the context (JWT auth + services), and returns the response

---

## How it starts up

1. `dotenv/config` loads environment variables
2. `buildApolloServer()` creates the Apollo Server instance and starts it
3. `createServices()` builds all repositories and services (called once, shared across requests)
4. Express app is created with `trust proxy` enabled (for running behind a reverse proxy)
5. All middleware is applied in the order above
6. The server listens on the port from `process.env.PORT`

If anything fails during startup, the error is logged and the process exits with code 1.
