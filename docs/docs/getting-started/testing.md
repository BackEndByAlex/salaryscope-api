---
title: Testing
sidebar_position: 3
---

# Postman Tests

Automated API tests for SalaryScope using Postman and Newman.

## Files

- **salary-api.postman_collection.json** - The full test collection with 22 test cases
- **production.postman_environment.json** - Environment file pointing to the production API at `https://cu0080.camp.lnu.se/graphql`

## Running the tests

No setup needed. Just run:

```bash
npx newman run postman/salary-api.postman_collection.json -e postman/production.postman_environment.json --unsecure
```

Tests also run automatically in the GitLab CI/CD pipeline on every push.

## How the tests work

All requests go to a single GraphQL endpoint. The collection uses Postman's GraphQL body mode, so queries and variables are defined separately in each request.

### Random data

The Register test generates a random email and password before each run using a pre-request script. This means the tests do not depend on any existing database state and can run repeatedly without conflicts.

### Collection variables

Tests pass data between requests using collection variables:

| Variable      | Set by                 | Used by                                 |
| ------------- | ---------------------- | --------------------------------------- |
| `email`       | Register (pre-request) | Login, Me                               |
| `password`    | Register (pre-request) | Login                                   |
| `token`       | Register, Login        | Me, Create, Update, Delete              |
| `userId`      | Register               | -                                       |
| `countryId`   | Countries list         | Country by ID                           |
| `countryName` | Countries list         | Country by ID                           |
| `jobId`       | Jobs list              | Create record                           |
| `recordId`    | Create record          | Get record, Update, Delete, Get deleted |

## Test structure

The collection is organized into three folders that run in order:

### 01 - Auth (7 tests)

| Test                       | What it checks                                            |
| -------------------------- | --------------------------------------------------------- |
| Register                   | Creates a new user, returns token and user                |
| Login                      | Logs in with the same credentials, returns token          |
| Register - duplicate email | Rejects duplicate email with `BAD_USER_INPUT`             |
| Register - short password  | Rejects password under 8 characters with `BAD_USER_INPUT` |
| Login - wrong password     | Rejects wrong password with `BAD_USER_INPUT`              |
| Me - authenticated         | Returns the logged-in user's profile                      |
| Me - no token              | Returns `UNAUTHENTICATED` without a token                 |

### 02 - Public Queries (9 tests)

| Test                           | What it checks                                              |
| ------------------------------ | ----------------------------------------------------------- |
| Countries list                 | Returns paginated countries with totalCount and hasNextPage |
| Country by ID                  | Returns the correct country by ID                           |
| Country - not found            | Returns `NOT_FOUND` for a non-existent ID                   |
| Job Categories list            | Returns paginated job categories                            |
| Jobs list                      | Returns paginated jobs with nested category                 |
| Companies list                 | Returns paginated companies                                 |
| Salary Records list            | Returns paginated salary records with nested job            |
| Salary Records - with filters  | Filters by source and verifies all results match            |
| Salary Records - invalid limit | Rejects limit over 100 with `BAD_USER_INPUT`                |

### 03 - CRUD Sequence (8 tests)

A full create, read, update, delete cycle on a salary record:

| Test                           | What it checks                                         |
| ------------------------------ | ------------------------------------------------------ |
| Create record                  | Creates a record with auth, returns id, salary, source |
| Create record - no auth        | Rejects creation without token (`UNAUTHENTICATED`)     |
| Create record - missing fields | Rejects incomplete input                               |
| Get created record             | Fetches the created record by ID                       |
| Update record                  | Updates the salary, verifies new value                 |
| Update record - no auth        | Rejects update without token (`UNAUTHENTICATED`)       |
| Delete record                  | Deletes the record, returns true                       |
| Get deleted record             | Confirms the record is gone (`NOT_FOUND`)              |

## Assertions

Every test checks at least one of:

- **Status codes** through GraphQL error codes (`BAD_USER_INPUT`, `UNAUTHENTICATED`, `NOT_FOUND`, `FORBIDDEN`)
- **Response structure** verifying `data` or `errors` fields exist
- **Data correctness** comparing returned values against expected values or stored variables
