# Assignment Issues

All open issues for 1DV027 API Design — GraphQL track.
Issues #12 (REST endpoints) and #13 (HATEOAS) are excluded — REST-only, not applicable.

---

## #1 — Dataset
**As a developer, I want to find and prepare a dataset to serve through my API.**

- [ ] Dataset has at least 10 000 data points
- [ ] Contains at least three distinct entities/resources
- [ ] One entity is the primary CRUD resource
- [ ] At least two entities are read-only
- [ ] Dataset, source, entities, and key fields are documented in the README
- [ ] Data is loaded via the seed script

---

## #2 — CRUD
**As a user, I want to create, read, update, and delete the primary resource via the API.**

- [ ] Primary resource supports Create, Read (single + list), Update, Delete
- [ ] At least two additional resources are available as read-only
- [ ] All responses use `application/json`
- [ ] Create/Update/Delete return appropriate responses

---

## #3 — JWT Authentication
**As a developer, I want the API to require JWT authentication for modifying resources.**

- [ ] Users can register with valid credentials
- [ ] Users can log in and receive a JWT token
- [ ] Create, Update, Delete require a valid JWT in `Authorization` header
- [ ] Requests without a valid token receive a `401 Unauthorized` response
- [ ] Read operations are accessible without authentication

---

## #4 — Error Handling
**As a user, I want the API to return clear and consistent error responses.**

- [ ] Invalid input returns `400 Bad Request` with a descriptive error message
- [ ] Authentication failures return `401 Unauthorized`
- [ ] Missing resources return `404 Not Found`
- [ ] Error responses follow a consistent format

---

## #5 — Seed Script
**As a developer, I want a seed script to populate the database with sample data.**

- [ ] A seed script is included in the project
- [ ] Running the script populates the database with meaningful sample data
- [ ] Instructions for running the script are documented in the README

---

## #6 — API Documentation
**As a developer, I want the API to be documented so I can understand and use it.**

- [ ] API is documented using Swagger/OpenAPI or Postman documentation
- [ ] Documentation is accessible via a public URL
- [ ] Covers all operations, request/response formats, and authentication requirements
- [ ] Documentation is interactive (try-it-out / playground)

---

## #7 — Automated Testing
**As a developer, I want automated API tests to ensure the API works correctly.**

The examiner must be able to verify tests **without** setting up the project locally:
1. CI/CD pipeline — tests run on every commit/MR, results visible in pipeline output
2. Production environment file — pre-configured with production URL, zero config:
   ```
   npx newman run <collection.json> -e production.postman_environment.json
   ```
   Must not contain secrets — only base URL. Tests handle their own auth.

- [ ] Postman collection (JSON) is included in the repository
- [ ] At least 20 test cases covering all operations
- [ ] Both success and failure scenarios tested for each operation
- [ ] Tests use randomly generated data (no dependency on DB state)
- [ ] JWT tokens and IDs managed via Postman environment variables
- [ ] Tests include sequence tests (register → login → create → read → update → delete)
- [ ] Tests automated via Newman in CI/CD pipeline
- [ ] Pipeline fails if critical tests do not pass
- [ ] `production.postman_environment.json` included with production URL pre-configured

---

## #8 — CI/CD Pipeline
**As a developer, I want a CI/CD pipeline that runs tests automatically.**

- [ ] A CI/CD pipeline is configured (`.gitlab-ci.yml`)
- [ ] Postman/Newman tests run automatically on every commit and merge request
- [ ] Pipeline reports test results and fails on test failures
- [ ] Test results (pass/fail counts) are visible in the pipeline job output

---

## #9 — Deployment
**As a user, I want to access the API over the internet.**

- [ ] API is deployed and accessible via a public URL (or campus URL if using Cumulus)
- [ ] Production URL is documented in the README

---

## #10 — Code Quality
**As a developer, I want the code to be clear, well-structured, and documented.**

- [ ] Code follows a consistent coding standard (linter configured)
- [ ] Code is modular and well-structured
- [ ] Source code includes meaningful comments and documentation
- [ ] Dependencies managed via package manager with a lock file (or Docker image)

---

## #11 — Peer Review
**As a student, I want to review the opposite group's API and reflect on trade-offs.**

Two parts:

**Part 1 — Run their tests:**
```
npx newman run <their-collection.json> -e <their-production.postman_environment.json>
```
Report pass/fail results.

**Part 2 — Compare approaches (pick at least 3):**
1. Ease of use — which API is more intuitive?
2. Flexibility — over-fetching vs. under-fetching
3. Error handling — how are errors communicated?
4. Documentation and testing — how easy to understand and verify?

- [ ] Ran the other group's tests against their production API and reported results
- [ ] Peer review reflection submitted as commentary on the merge request
- [ ] Reflection covers at least 3 comparison points
- [ ] Reflection includes specific examples from both APIs

---

## #14 — GraphQL Queries and Mutations
**As a user, I want the GraphQL API to support queries and mutations for all resources.**

- [ ] All required queries and mutations are implemented
- [ ] A single `/graphql` endpoint handles all operations
- [ ] Mutations require a valid JWT in the `Authorization` header

---

## #15 — Nested Queries
**As a user, I want to fetch related data in a single GraphQL request.**

- [ ] At least one nested query is implemented (e.g. fetch a job with its salary records)
- [ ] The nested data is correctly resolved and returned

---

## #16 — GraphQL Playground
**As a developer, I want a GraphQL Playground to explore and test the API.**

- [ ] A GraphQL Playground is available at a public URL
- [ ] Queries and mutations can be executed interactively
- [ ] The schema is browsable in the playground

---

## #17 — Filtering and Pagination
**As a user, I want to filter and paginate results when querying large collections.**

- [ ] At least one list query supports filtering by one or more fields
- [ ] Pagination is implemented for list queries
- [ ] Pagination metadata included in responses (total count, hasNextPage)
