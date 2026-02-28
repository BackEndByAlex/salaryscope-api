# validators/

Input validation that runs before any service or database call. Each function throws a `GraphQLError` with `code: "BAD_USER_INPUT"` if input is invalid, or returns nothing if it passes.

- `authValidator.js` — `validateRegisterInput` (email format, min 8 char password), `validateLoginInput` (fields present)
- `salaryRecordValidator.js` — `validateCreateInput` (salary positive, jobId and source present), `validateUpdateInput` (at least one field), `validateFilters` (limit 1–100, offset non-negative)
