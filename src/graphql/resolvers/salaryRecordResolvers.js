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
    filterOptions: async (
      _,
      { countryId, cityId },
      { salaryRecordService },
    ) => {
      return salaryRecordService.getFilterOptions({
        countryId: parseOptionalId(countryId),
        cityId: parseOptionalId(cityId),
      })
    },
    searchRecords: async (
      _,
      { query, limit = 10, offset = 0 },
      { searchService },
    ) => {
      return searchService.search(query, { limit, offset })
    },
  },
  Mutation: {
    createSalaryRecord: async (_, { input }, { user, salaryRecordService }) => {
      assertAuthenticated(user)
      validateCreateInput(input)
      return salaryRecordService.create(normalizeCreateInput(input), user.id)
    },
    updateSalaryRecord: async (
      _,
      { id, input },
      { user, salaryRecordService },
    ) => {
      assertAuthenticated(user)
      validateUpdateInput(input)
      return salaryRecordService.update(
        id,
        normalizeUpdateInput(input),
        user.id,
      )
    },
    deleteSalaryRecord: async (_, { id }, { user, salaryRecordService }) => {
      assertAuthenticated(user)
      await salaryRecordService.delete(id, user.id)
      return true
    },
  },
  SalaryRecord: {
    salary: (parent) => toFloatFromDecimal(parent.salary),
    salaryInUsd: (parent) =>
      parent.salaryInUsd != null
        ? toFloatFromDecimal(parent.salaryInUsd)
        : null,
  },
}

function toFloatFromDecimal(value) {
  return parseFloat(value.toString())
}

function parseOptionalId(value) {
  return value != null ? parseId(value) : undefined
}

function normalizeFilters({
  jobId,
  categoryId,
  countryId,
  companyId,
  cityId,
  ...rest
}) {
  return {
    ...rest,
    jobId: parseOptionalId(jobId),
    categoryId: parseOptionalId(categoryId),
    countryId: parseOptionalId(countryId),
    companyId: parseOptionalId(companyId),
    cityId: parseOptionalId(cityId),
  }
}

function normalizeCreateInput({
  jobId,
  employeeCountryId,
  companyCountryId,
  companyId,
  salary,
  cityName,
  jobTitle,
  ...rest
}) {
  return {
    ...rest,
    cityName,
    jobTitle,
    salary: String(salary),
    jobId: parseOptionalId(jobId),
    employeeCountryId: parseOptionalId(employeeCountryId),
    companyCountryId: parseOptionalId(companyCountryId),
    companyId: parseOptionalId(companyId),
  }
}

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
    ...(salary != null && { salary: String(salary) }),
    ...(jobId != null && { jobId: parseOptionalId(jobId) }),
    ...(employeeCountryId != null && {
      employeeCountryId: parseOptionalId(employeeCountryId),
    }),
    ...(companyCountryId != null && {
      companyCountryId: parseOptionalId(companyCountryId),
    }),
    ...(companyId != null && { companyId: parseOptionalId(companyId) }),
  }
}
