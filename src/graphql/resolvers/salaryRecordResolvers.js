import { parseId } from "../../utils/parseId.js"
import { assertAuthenticated } from "../../auth/authGuard.js"
import {
  validateCreateInput,
  validateUpdateInput,
  validateFilters,
} from "../../validators/salaryRecordValidator.js"

export const salaryRecordResolvers = {
  Query: {
    salaryRecords: async (_, { filters = {} }, { salaryRecordService }) => {
      validateFilters(filters)
      return salaryRecordService.getAll(normalizeFilters(filters))
    },
    salaryRecord: async (_, { id }, { salaryRecordService }) => {
      return salaryRecordService.getById(id)
    },
  },
  Mutation: {
    createSalaryRecord: async (_, { input }, { user, salaryRecordService }) => {
      assertAuthenticated(user)
      validateCreateInput(input)
      return salaryRecordService.create(normalizeCreateInput(input))
    },
    updateSalaryRecord: async (_, { id, input }, { user, salaryRecordService }) => {
      assertAuthenticated(user)
      validateUpdateInput(input)
      return salaryRecordService.update(id, normalizeUpdateInput(input))
    },
    deleteSalaryRecord: async (_, { id }, { user, salaryRecordService }) => {
      assertAuthenticated(user)
      await salaryRecordService.delete(id)
      return true
    },
  },
  SalaryRecord: {
    // Prisma Decimal serializes as a string via valueOf() — parseFloat converts it for GraphQL Float
    salary: (parent) => toFloatFromDecimal(parent.salary),
    salaryInUsd: (parent) =>
      parent.salaryInUsd !== null && parent.salaryInUsd !== undefined
        ? toFloatFromDecimal(parent.salaryInUsd)
        : null,
  },
}

// Converts a Prisma Decimal value to a JS float for GraphQL Float fields
function toFloatFromDecimal(value) {
  return parseFloat(value.toString())
}

// Parses an ID string to integer only when the value is present; returns undefined otherwise
function parseOptionalId(value) {
  return value !== null && value !== undefined ? parseId(value) : undefined
}

// Normalizes GraphQL ID strings to integers for Prisma query filters
function normalizeFilters({ jobId, categoryId, countryId, companyId, ...rest }) {
  return {
    ...rest,
    jobId: parseOptionalId(jobId),
    categoryId: parseOptionalId(categoryId),
    countryId: parseOptionalId(countryId),
    companyId: parseOptionalId(companyId),
  }
}

// Normalizes IDs to integers and salary to string for Prisma Decimal precision
function normalizeCreateInput({
  jobId,
  employeeCountryId,
  companyCountryId,
  companyId,
  salary,
  ...rest
}) {
  return {
    ...rest,
    salary: String(salary),
    jobId: parseId(jobId),
    employeeCountryId: parseOptionalId(employeeCountryId),
    companyCountryId: parseOptionalId(companyCountryId),
    companyId: parseOptionalId(companyId),
  }
}

// Normalizes only the provided fields for a partial update (Prisma Decimal and ID coercion)
function normalizeUpdateInput({
  jobId,
  employeeCountryId,
  companyCountryId,
  companyId,
  salary,
  ...rest
}) {
  return {
    ...rest,
    ...(salary !== null && salary !== undefined && { salary: String(salary) }),
    ...(jobId !== null && jobId !== undefined && { jobId: parseId(jobId) }),
    ...(employeeCountryId !== null &&
      employeeCountryId !== undefined && {
        employeeCountryId: parseId(employeeCountryId),
      }),
    ...(companyCountryId !== null &&
      companyCountryId !== undefined && {
        companyCountryId: parseId(companyCountryId),
      }),
    ...(companyId !== null &&
      companyId !== undefined && { companyId: parseId(companyId) }),
  }
}
