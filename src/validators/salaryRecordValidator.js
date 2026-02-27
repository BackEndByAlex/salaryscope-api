import { GraphQLError } from "graphql"

export function validateCreateInput({ salary, jobId, source }) {
  if (salary == null || jobId == null || source == null) {
    throw new GraphQLError("salary, jobId, and source are required.", {
      extensions: { code: "BAD_USER_INPUT" },
    })
  }

  if (!(Number(salary) > 0)) {
    throw new GraphQLError("salary must be a positive number.", {
      extensions: { code: "BAD_USER_INPUT" },
    })
  }
}

export function validateUpdateInput(data) {
  if (!data || Object.keys(data).length === 0) {
    throw new GraphQLError("At least one field must be provided to update.", {
      extensions: { code: "BAD_USER_INPUT" },
    })
  }
}

export function validateFilters({ limit, offset } = {}) {
  if (limit != null && (limit < 1 || limit > 100)) {
    throw new GraphQLError("limit must be between 1 and 100.", {
      extensions: { code: "BAD_USER_INPUT" },
    })
  }

  if (offset != null && offset < 0) {
    throw new GraphQLError("offset must not be negative.", {
      extensions: { code: "BAD_USER_INPUT" },
    })
  }
}
