# Commands Reference

All available npm scripts for development, deployment, and database management.

---

## Local Development (Host Machine)

### `npm run dev`

**What it does:** Starts the API server in development mode with auto-reload.

**What it's for:** Local development and testing during coding.

**Why use it:** Nodemon watches for file changes and restarts the server automatically, so you don't have to manually restart after each edit.

**Requires:** `.env` configured + Postgres running (via `npm run docker:dev:up`)

```bash
npm run dev
```

---

### `npm start`

**What it does:** Starts the API server in production mode (no auto-reload).

**What it's for:** Running the server when file watching is not needed.

**Why use it:** Lighter weight than `npm run dev`; used in Docker containers and production deployments.

```bash
npm start
```

---

## Database Management (Prisma)

### `npm run db:migrate`

**What it does:** Creates a new database migration from `schema.prisma` changes, then applies it to the database.

**What it's for:** Updating the database schema when you've edited `schema.prisma`.

**Why use it:** Tracks schema changes in `prisma/migrations/` so they're version-controlled and reproducible.

**Requires:** `.env` configured + Postgres running

```bash
npm run db:migrate
# When prompted, describe your change (e.g., "add_salary_index")
```

---

### `npm run db:seed`

**What it does:** Loads all four CSV files from `data/` and inserts ~69,000 salary records into the database.

**What it's for:** Populating the database with sample data after migrations.

**Why use it:** Lets you query real-world data during development and testing.

**Requires:**

- `.env` configured + Postgres running
- CSV files in `data/` folder
- Database schema already applied (run `db:migrate` first)

```bash
npm run db:seed
```

---

### `npm run db:studio`

**What it does:** Starts Prisma Studio — a browser UI to view and edit database records.

**What it's for:** Visually inspecting and manipulating database data without writing SQL.

**Why use it:** Better UX than command-line SQL; easy to browse relations and edit records interactively.

**Requires:**

- `.env` configured + Postgres running on `localhost:5432`
- Run `npm run docker:dev:up` to ensure DB port is exposed

```bash
npm run db:studio
# Opens http://localhost:5555 in browser
```

---

### `npm run db:reset`

**What it does:** Drops all tables, re-applies all migrations from scratch, then prompts to seed.

**What it's for:** Starting over with a clean database.

**Why use it:** Fixes migration drift or removes all data between test runs. **Destructive — deletes everything.**

**Requires:** Confirm when prompted

```bash
npm run db:reset
```

---

### `npm run generate`

**What it does:** Regenerates the Prisma Client (`@prisma/client`) from the schema.

**What it's for:** Updating TypeScript types and Prisma API after schema changes.

**Why use it:** Usually runs automatically after `db:migrate`, but use this if you manually edited schema files.

```bash
npm run generate
```

---

## Docker Development (Local)

### `npm run docker:dev:up`

**What it does:** Starts all services (Postgres, migrations, API) with development settings.

**What it's for:** Spinning up the full local stack in Docker.

**Why use it:**

- Postgres is exposed on `127.0.0.1:5432` for local tooling (`db:studio`, host seeding)
- API runs on `127.0.0.1:4000`
- Automatic migrations on startup
- Good for team consistency: same environment for everyone

```bash
npm run docker:dev:up
```

---

### `npm run docker:up` (alias)

**What it does:** Same as `docker:dev:up`.

**What it's for:** Shorthand for local development.

**Why use it:** Simpler to type; defaults to dev settings.

```bash
npm run docker:up
```

---

### `npm run docker:seed`

**What it does:** Runs the seed script inside a Docker container against dev compose services.

**What it's for:** Populating the database using Docker (no local Node.js required).

**Why use it:** Ensures CSV files are found and DB connection works in the same Docker network.

**Requires:**

- `docker:dev:up` already running
- CSV files in `data/` folder

```bash
npm run docker:seed
```

---

### `npm run docker:dev:seed`

**What it does:** Same as `docker:seed` — explicit dev version.

**What it's for:** Clarity that you're seeding in development.

**Why use it:** When using both dev and prod setups; makes your intent clear.

```bash
npm run docker:dev:seed
```

---

### `npm run docker:dev:logs`

**What it does:** Streams live Postgres container logs to your terminal.

**What it's for:** Debugging database issues in real time.

**Why use it:** See connection errors, query slowness, migration failures as they happen.

```bash
npm run docker:dev:logs
```

---

### `npm run docker:logs` (alias)

**What it does:** Same as `docker:dev:logs`.

**What it's for:** Shorthand; defaults to dev logs.

```bash
npm run docker:logs
```

---

## Docker Production (Cumulus + Caddy)

### `npm run docker:prod:up`

**What it does:** Starts all services with production settings.

**What it's for:** Deploying to Cumulus or production environments.

**Why use it:**

- Postgres is **not** exposed on host ports (only internal Docker network)
- API runs on `127.0.0.1:4000` for Caddy reverse proxy
- Stricter restart policies (`always`)
- No development convenience features

```bash
npm run docker:prod:up
```

---

### `npm run docker:prod:seed`

**What it does:** Runs the seed script inside a Docker container against production compose services.

**What it's for:** Populating the database after deploying to production.

**Why use it:** Ensures seeding works in the same production Docker network.

**Requires:**

- `docker:prod:up` already running
- CSV files in `data/` folder (must be deployed with project)

```bash
npm run docker:prod:seed
```

---

## Utilities

### `npm run docker:down`

**What it does:** Stops and removes all running containers.

**What it's for:** Cleaning up after local testing.

**Why use it:**

- Frees up ports
- Removes temporary containers
- Note: `postgres_data` volume persists (data is not deleted)

```bash
npm run docker:down
```

---

### `npm run generate:keys`

**What it does:** Generates RSA key pair for JWT signing (`keys/private.pem`, `keys/public.pem`).

**What it's for:** Creating authentication keys for the first time.

**Why use it:** JWT tokens need asymmetric keys; this generates them securely.

**Requires:** Run once per environment; keys are git-ignored.

```bash
npm run generate:keys
```

---

## Typical Workflows

### First-Time Setup (Local)

```bash
npm run generate:keys              # Create auth keys
npm run docker:dev:up              # Start all services
npm run db:migrate                 # (auto-runs, but just in case)
npm run docker:seed                # Populate data
npm run db:studio                  # Verify data loaded
npm run dev                        # Start server with auto-reload
```

### Deployment to Cumulus

```bash
npm run generate:keys              # (once per server)
npm run docker:prod:up             # Start services
npm run docker:prod:seed           # Populate data
# Caddy proxies host traffic to api:127.0.0.1:4000
```

### Resetting Local Database

```bash
npm run docker:down
npm run docker:dev:up
npm run db:reset                   # Destructive! Wipes all data
npm run docker:seed                # Repopulate
```

### Debugging Production

```bash
npm run docker:logs                # (switch to prod logs if running prod)
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f postgres
```
