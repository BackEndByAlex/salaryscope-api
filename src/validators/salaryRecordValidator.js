import { BadUserInputError } from "../utils/errors.js"

export function validateCreateInput({ salary, jobId, source }) {
  if (salary == null || jobId == null || source == null) {
    throw new BadUserInputError("salary, jobId, and source are required.")
  }

  if (!(Number(salary) > 0)) {
    throw new BadUserInputError("salary must be a positive number.")
  }

  if (source.length > 200) {
    throw new BadUserInputError("source must not exceed 200 characters.")
  }
}

export function validateUpdateInput(data) {
  if (!data || Object.keys(data).length === 0) {
    throw new BadUserInputError(
      "At least one field must be provided to update.",
    )
  }
}

export function validateFilters({ limit, offset } = {}) {
  if (limit != null && (limit < 1 || limit > 100)) {
    throw new BadUserInputError("limit must be between 1 and 100.")
  }

  if (offset != null && offset < 0) {
    throw new BadUserInputError("offset must not be negative.")
  }
}
