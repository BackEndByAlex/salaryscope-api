---
title: Overview
sidebar_position: 1
slug: /
---

# API Design Assignment

## Project Name

**SalaryScope**

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- CSV files already downloaded, more instructions below.

**Step 1 — Set up environment and keys**

```bash
cp .env.example .env
```

Fill in the credentials in `.env` (database user, password, allowed origins).

Then generate the RSA key pair used for JWT authentication:

```bash
npm run generate:keys
```

This creates `keys/private.pem` and `keys/public.pem` at the project root.

**Step 2 — Download CSV files**

Download the datasets from Kaggle:

- https://www.kaggle.com/datasets/murilozangari/jobs-and-salaries-in-data-field-2024
- https://www.kaggle.com/code/lucasgalanti/jobs-in-data
- https://www.kaggle.com/code/iamsouravbanerjee/software-professional-salaries/input
- https://www.kaggle.com/code/iamsouravbanerjee/software-professional-salaries/input

Then create a `/data` folder in the root of the project (outside `/src`) and add the CSV
files into it. The `/data` folder is not included in the repository, you need to create it locally.
Check that the file names match exactly as shown below, the seed script has hardcoded
file names:

- data/jobs_in_data_2024.csv
- data/jobs_in_data.csv
- data/Salary_Dataset_with_Extra_Features.csv
- data/Software_Professional_Salaries.csv

**Step 3 — Start Postgres**

The database runs inside the server compose stack. For local development, create the shared Docker network and start Postgres:

```bash
docker network create salaryscope-network
docker compose -f docker-compose.server.yml up -d postgres
```

The database lives in a Docker volume and survives restarts.

**Step 4 — Run migrations and seed (once)**

```bash
docker compose -f docker-compose.db.yml up
```

This runs Prisma migrations and seeds the database with CSV data (~68,000 rows). Postgres must already be running on the `salaryscope-network`.

To re-seed later: `docker compose -f docker-compose.db.yml run --rm seed`

**Step 5 — Start the API**

Local development (with hot reload):

```bash
docker compose -f docker-compose.dev.yml up --build
```

The API connects to the database over the shared Docker network (`salaryscope-network`). Open `http://localhost:4000/graphql` to access the Apollo Sandbox.

## Objective

_Describe your API in a few sentences: what dataset does it serve, what are its main resources, and what can users do with it?_

---

SalaryScope is a GraphQL API that serves salary data from the tech industry, combined from four
Kaggle datasets with around 68,000 records. The main resources are salary records, jobs, job
categories, companies, and countries. Users can browse and filter salary data without logging
in. Registered users can also create, update, and delete their own salary records. The API
includes JWT authentication, pagination, nested queries, and is deployed with full documentation
on a cloud server.

---

## Implementation Type

GraphQL

## Links and Testing

|                                       | URL / File                            |
| ------------------------------------- | ------------------------------------- |
| **Production API**                    | https://cu0080.camp.lnu.se/graphql    |
| **API Documentation**                 | [Route Map](./route-map.md)           |
| **GraphQL Playground** (GraphQL only) | https://cu0080.camp.lnu.se/graphql    |
| **Postman Collection**                | `postman/salary-api.postman_collection.json` |
| **Production Environment**            | `postman/production.postman_environment.json` |

**Examiner can verify tests in one of the following ways:**

1. **CI/CD pipeline** — check the pipeline output in GitLab for test results.
2. **Run manually** — no setup needed:
   ```
   npx newman run postman/salary-api.postman_collection.json -e postman/production.postman_environment.json
   ```

## Dataset

_Describe the dataset you chose:_

| Field                                | Description       |
| ------------------------------------ | ----------------- |
| **Dataset source**                   | Kaggle            |
| **Primary resource (CRUD)**          | SalaryRecord      |
| **Secondary resource 1 (read-only)** | Job / JobCategory |
| **Secondary resource 2 (read-only)** | Country           |
| **Secondary resource 3 (read-only)** | Company           |

## Design Decisions

### Authentication

_Describe your JWT authentication solution. Why did you choose this approach? What alternatives exist, and what are their trade-offs?_

The API uses JWT with RS256.

User registers or logs in, the server signs a token with a private RSA key. Every request inclues the token in the **Authorization: Bearer &lt;token&gt;** header. Then the server verifies it, using the public key.

Passowrds are hashed with bcryt at 12 salt rounds before storage, then the token expires after 24 hours. Each token also includes `issuer` and `audience` claims, scoping it to this API only. This prevents tokens from being accepted by other services that might share the same RSA keys.

**Why RS256 over HS256 and Ed25519 ?**

In my case I used **RS256**. THe way it works, the server holds the private key for signing, while the public key can be shared freely for verification.

**HS256** uses a single shared secret for both. It would be simpler, but any service that can verify tokens can also forget them.

More over **Ed25519**, become a option later but because the implementation was done with RS256 the idea using Ed25519 become not necesery because the API works well with RS256 in this case. I did not verify if the project and the dependencies works with Ed25519. If the time is there I way changed, because Ed25519 is faster and produces shorter signatures and has also a better algorithm.

I've documented the authentication structure and how it works depper:

HERE: [Authentication](../auth/authentication.md)

### API Design

**GraphQL students:**

- _How did you design your schema (types, queries, mutations)?_

The schema is split into one file per domain:

- auth.graphql,
- country.graphql,
- job.graphql,
- jobCategory.graphql,
- company.graphql
- **salaryRecord.graphql**

Then all merged by Apollo Server at startup. Then each domain owns its typs, inputs, and query/mutation extensions. I feld this keept the schema modular and easy to undestand and navigate thru.

The primary resource **salaryRecord** is the only fully mutable type. It has **createSalaryRecord**,
**updateSalaryRecord**, and **deleteSalaryRecord** mutations. All those require a valid JWT. Then the remainings types (Country, Job, JobCategory, Company) are read-only and exposed through queries only.

Additional implemntation, list queries support filtering and pagination via limit, offset, and filter arguments.

Another implementation if paginated responses that include a **SalaryRecordPage** or **_JobPage_** wrapper type that carries both the items and pagination metadata **totalCount** and **hasNextPage**.

- _How did you implement nested queries? How does the single-endpoint approach affect your design?_

The nested queries are implemented through field resolvers.

Exemple:

- A **Jobb** type exposes a records field that returns a paginated list for salary records for that job.
- A **Country** can resolve its nested salary records in a simgle request.

Each neted field is resolved lazily, only fetched if the client actually requests it.

The single /graphql endpoint means there are no route hierarchies to design. Instead, the shape of the API response is entirely driven by the client's query.

More documentation about schema and nested queries:

HERE: [GraphQL Setup](../architecture/graphql-setup.md)

HERE: [Type Definitions](../graphql-schema/type-definitions.md)

HERE: [Resolver Reference](../resolvers/resolver-reference.md)

### Error Handling

_How does your API handle errors? Describe the format and consistency of your error responses._

All the errors in the API use Graphql error format. Every error response contains a message and an extensions object with a code field.

Validation runs before any service or database call. Thre resoane is invalid input is rehected immediately with a descriptive massage. iD parsing is also validated strictly, rejecting values like "3abc" that parseINT would silently accept.

I've documented the error classes, validators, and ID parsing in more detail here:

HERE: [Helpers](../utilities/helpers.md)

HERE: [Validators](../utilities/validators.md)

## Core Technologies Used

_List the technologies you chose and briefly explain why:_

**Node.js** - Javascript runtime
**Express 5** - Have the most experince with it for HTTP server
**Apollo Server 5** - Industry standard Graphql server (from my research). Built in schema merging, error formatting and apollo Sandbox playground
**GraphQL** - Assingment requirment, Single endpoint, client driven queries.
**Prisma 7** - Type safe ORM, built in migrations and clean query API for postgreSQL
**PostgresSQL** - Relational database, suited for my structured salary data with relations between jobs, companies and countries.
**jsonwebtoken** - JWT signing and verification. RS256 for stateless authentication
**bcryptjs** - Password hasing with configurable salt rounds.
**helmet** - Secure HTTP headers with a targeted Content Security Policy that allows Apollo Studio while blocking everything else.
**express-rate-limit** - Limits request rate per IP. General limit of 200 requests and a stricter limit of 10 for auth operations (login/register), with query body detection to prevent bypass.
**graphql-depth-limit** - Prevents deeply nested query abuse by rejecting queries deeper than 5 levels.
**cors** - Restricts which oridins can call the API in a browser context.
**docker + docker compose** - Deployment. Split into separate compose files: `docker-compose.db.yml` (database + migrations + seed) and `docker-compose.prod.yml` (API only). CI/CD only rebuilds the API.

## Reflection

_What was hard? What did you learn? What would you do differently?_

It was hard starting a project with the ambition of creating something real, not only
a school project that will be left aside. My goal was and is to create something useful and
interesting to me.

After a lot of research I stumbled on salary CSV files that track the salaries from worldwide
companies embedded with information about the job, country, type of work remote, on site or
hybrid. Then using the new techniques was hard:

- GraphQL
- PostgreSQL
- New architecture
- New dependencies
- Migration and seeding a database
- Security
- Rate limiting
- Nested queries
- Prisma
- Apollo
- Postman collections and tests
- Docusaurus
- Caddy

And beside those, we have learned before about clean code and applying it on this level of
coding was hard.

It was hard to adapt myself to this environment of programming where everything needs to work
otherwise everything will break down. But with time the project was growing like a wall brick by
brick and the understanding of everything was possible, maybe not on the deeper side but
generally and how it is used and works on this API.

Next time I create an API that will use GraphQL the architecture will not be as hard anymore.
I needed to research a lot, watching online how other companies and developers structure their
code for this type of API. It took some time but in the end the API gott "complete" and the
documentation is on point with help of Docusaurus. It helped a lot because at the size of the
API remembering everything was not an option and updating documentation after every major update
was a "must" otherwise I could lose myself through the files.

## Acknowledgements

_Resources, attributions, or shoutouts._

- https://www.kaggle.com/ for the salary datasets
- https://graphql.org/learn/
- https://www.apollographql.com/docs/apollo-server/
- https://www.prisma.io/docs
- https://www.postgresql.org/docs/
- https://expressjs.com/
- https://caddyserver.com/docs/
- https://docusaurus.io/docs
- https://www.postman.com/ and course lectures for API testing and Newman CI/CD integration
- Security hardening was done through research into OWASP best practices, covering query depth
  limiting, rate limiter bypass prevention, JWT issuer/audience claims, Content Security Policy,
  password length validation, user enumeration prevention, and nested pagination caps
- course lectures about API
- gitlab exemples
- moodle documentation
