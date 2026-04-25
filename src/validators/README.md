# validators/

Input validation that runs before any service or database call. If the input is invalid, a `BadUserInputError` is thrown immediately with a clear message. If it passes, nothing happens and the request continues.

---

## authValidator.js

**`validateRegisterInput`**

- Email and password must be provided
- Email must follow a valid format (must have `@` and a domain)
- Password must be at least 8 characters
- Password must not exceed 128 characters (bcrypt silently truncates at 72 bytes, and very long passwords can cause unnecessary memory usage)

**`validateLoginInput`**

- Email and password must be provided

---

## salaryRecordValidator.js

**`validateCreateInput`**

- `salary` and `source` are required
- Either `jobId` or `jobTitle` must be provided — both together or neither is rejected
- `salary` must be a positive number
- `source` must not exceed 200 characters
- Valid source values: `jobs_in_data`, `salary_extra`, `software_pro`, `h1b_visa`, `user_submitted`

**`validateUpdateInput`**

- At least one field must be included in the update, an empty update is rejected
- If `salary` is provided, it must be a positive number
- If `source` is provided, it must not exceed 200 characters

**`validateFilters`**

- `limit` must be between 1 and 100 if provided
- `offset` must not be negative if provided
- `experienceLevel` values are checked against an allowlist: `EN`, `MI`, `SE`, `EX`
- `employmentType` values are checked against an allowlist: `FT`, `PT`, `CT`, `FL`
- `workSetting` values are checked against an allowlist: `Remote`, `Hybrid`, `In-Person`
- `companySize` values are checked against an allowlist: `S`, `M`, `L`
- `source` values are checked against an allowlist of known data sources

---

## queryValidator.js

Shared validation for query arguments that are not covered by domain-specific validators.

**`validateNameArg`**

- `name` must not exceed 255 characters
- Applied to `countryByName`, `companyByName`, and `jobCategoryByName` queries
- Prevents arbitrarily long strings from being forwarded to the database in `WHERE name = ?` clauses
