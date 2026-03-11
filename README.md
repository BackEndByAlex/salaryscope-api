# API Design Assignment

## Project Name

SalaryScope

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- CSV files already downloaded, more instructions below.

**First deploy (includes seeding)**

docker compose -f docker-compose.prod.yml up --build -d

This will start Postgres, run migrations, seed the database, and start the API.

**OBS:**

To download the CSV files:

- https://www.kaggle.com/datasets/murilozangari/jobs-and-salaries-in-data-field-2024
- https://www.kaggle.com/code/lucasgalanti/jobs-in-data
- https://www.kaggle.com/code/iamsouravbanerjee/software-professional-salaries/input
- https://www.kaggle.com/code/iamsouravbanerjee/software-professional-salaries/input

Then make sure you create a /data folder in the root of the project (outside /src) and add the CSV
files into it. The /data folder is not included in the repository, you need to create it locally.
Check that the file names match exactly as shown below, the reason is the seed script has hardcoded
file names:

- data/jobs_in_data_2024.csv
- data/jobs_in_data.csv
- data/Salary_Dataset_with_Extra_Features.csv
- data/Software_Professional_Salaries.csv

**Subsequent deploys (skip seeding)**

docker compose -f docker-compose.prod.yml up --build -d --scale seed=0

**Run seed manually (if needed)**

docker compose -f docker-compose.prod.yml run --rm seed

**Local development**

docker compose -f docker-compose.dev.yml up --build

## Objective

Design and develop a robust, well-documented API (REST or GraphQL) that allows users to retrieve and manage information from a dataset of your choice. The API must include JWT authentication, automated testing via Postman/Newman in a CI/CD pipeline, and be publicly deployed.

Choose a dataset (10000+ data points) that interests you — it should include at least one primary CRUD resource and two additional read-only resources. Sources like [Kaggle](https://www.kaggle.com/datasets), public APIs, or CSV files work well. Pick something you find interesting, as you will reuse this API in the next assignment (WT dashboard).

_Describe your API in a few sentences: what dataset does it serve, what are its main resources, and what can users do with it?_

## Implementation Type

GraphQL

## Links and Testing

|                                       | URL / File                            |
| ------------------------------------- | ------------------------------------- |
| **Production API**                    | https://cu0080.camp.lnu.se/graphql    |
| **API Documentation**                 | [ROUTE_MAP](/ROUTE_MAP.md)            |
| **GraphQL Playground** (GraphQL only) | https://cu0080.camp.lnu.se/graphql    |
| **Postman Collection**                | `*.postman_collection.json`           |
| **Production Environment**            | `production.postman_environment.json` |

**Examiner can verify tests in one of the following ways:**

1. **CI/CD pipeline** — check the pipeline output in GitLab for test results.
2. **Run manually** — no setup needed:
   ```
   npx newman run <collection.json> -e production.postman_environment.json
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

User registers or logs in, the server signs a token with a private RSA key. Every request inclues the token in the **Authorization: Bearer <token>** header. Then the server verifies it, using the public key.

Passowrds are hashed with bcryt at 12 salt rounds before storage, then the token expires after 24 hours.

**Why RS256 over HS256 and Ed25519 ?**

In my case I used **RS256**. THe way it works, the server holds the private key for signing, while the public key can be shared freely for verification.

**HS256** uses a single shared secret for both. It would be simpler, but any service that can verify tokens can also forget them.

More over **Ed25519**, become a option later but because the implementation was done with RS256 the idea using Ed25519 become not necesery because the API works well with RS256 in this case. I did not verify if the project and the dependencies works with Ed25519. If the time is there I way changed, because Ed25519 is faster and produces shorter signatures and has also a better algorithm.

I've documented the authentication structure and how it works depper:

HERE: [Authentication Structure](/src/auth/README.md)

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

HERE: [graphql](/src/graphql/README.md)

HERE: [schema](/src/graphql/schema/README.md)

HERE: [resolvers](/src/graphql/resolvers/README.md)

### Error Handling

_How does your API handle errors? Describe the format and consistency of your error responses._

All the errors in the API use Graphql error format. Every error response contains a message and an extensions object with a code field.

Validation runs before any service or database call. Thre resoane is invalid input is rehected immediately with a descriptive massage. iD parsing is also validated strictly, rejecting values like "3abc" that parseINT would silently accept.

I've documented the error classes, validators, and ID parsing in more detail here:

HERE: [Utility Functions + Error](/src/utils/README.md)

HERE: [Validators Functions](/src/validators/README.md)

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
**helmet** - Secure HTTP
**express-rate-limit** - Limits request rate per IP. Used for reduce brute force risks.
**cors** - Restricts which oridins can call the API in a browser context.
**docker + docker compose** - Deployment. Postgres, migrations, seeding, and the API all start with a single command.

## Reflection

_What was hard? What did you learn? What would you do differently?_

## Acknowledgements

_Resources, attributions, or shoutouts._

## Requirements

See [all requirements in Issues](../../issues/). Close issues as you implement them. Create additional issues for any custom functionality. See [TESTING.md](TESTING.md) for detailed testing requirements.

### Functional Requirements — Common

| Requirement                                                          | Issue                  | Status               |
| -------------------------------------------------------------------- | ---------------------- | -------------------- |
| Data acquisition — choose and document a dataset (1000+ data points) | [#1](../../issues/1)   | :white_large_square: |
| Full CRUD for primary resource, read-only for secondary resources    | [#2](../../issues/2)   | :white_large_square: |
| JWT authentication for write operations                              | [#3](../../issues/3)   | :white_large_square: |
| Error handling (400, 401, 404 with consistent format)                | [#4](../../issues/4)   | :white_large_square: |
| Filtering and pagination for large result sets                       | [#17](../../issues/17) | :white_large_square: |

### Functional Requirements — REST

| Requirement                                                 | Issue                  | Status               |
| ----------------------------------------------------------- | ---------------------- | -------------------- |
| RESTful endpoints with proper HTTP methods and status codes | [#12](../../issues/12) | :white_large_square: |
| HATEOAS (hypermedia links in responses)                     | [#13](../../issues/13) | :white_large_square: |

### Functional Requirements — GraphQL

| Requirement                                          | Issue                  | Status               |
| ---------------------------------------------------- | ---------------------- | -------------------- |
| Queries and mutations via single `/graphql` endpoint | [#14](../../issues/14) | :white_large_square: |
| At least one nested query                            | [#15](../../issues/15) | :white_large_square: |
| GraphQL Playground available                         | [#16](../../issues/16) | :white_large_square: |

### Non-Functional Requirements

| Requirement                                                 | Issue                  | Status               |
| ----------------------------------------------------------- | ---------------------- | -------------------- |
| API documentation (Swagger/OpenAPI or Postman)              | [#6](../../issues/6)   | :white_large_square: |
| Automated Postman tests (20+ test cases, success + failure) | [#7](../../issues/7)   | :white_large_square: |
| CI/CD pipeline running tests on every commit/MR             | [#8](../../issues/8)   | :white_large_square: |
| Seed script for sample data                                 | [#5](../../issues/5)   | :white_large_square: |
| Code quality (consistent standard, modular, documented)     | [#10](../../issues/10) | :white_large_square: |
| Deployed and publicly accessible                            | [#9](../../issues/9)   | :white_large_square: |
| Peer review reflection submitted on merge request           | [#11](../../issues/11) | :white_large_square: |
