import { parseId } from '../../utils/parseId.js'
import { assertAuthenticated } from '../../auth/authGuard.js'
import {
  validateCreateInput,
  validateUpdateInput,
  validateFilters,
} from '../../validators/salaryRecordValidator.js'

export const salaryRecordResolvers = {
  Query: {
    salaryRecords: (_, { filters = {} }, { user, salaryRecordService }) => {
      assertAuthenticated(user)
      validateFilters(filters)
      return salaryRecordService.getAll(parseFilters(filters))
    },
    salaryRecord: (_, { id }, { user, salaryRecordService }) => {
      assertAuthenticated(user)
      return salaryRecordService.getById(id)
    },
  },
  Mutation: {
    createSalaryRecord: (_, { input }, { user, salaryRecordService }) => {
      assertAuthenticated(user)
      validateCreateInput(input)
      return salaryRecordService.create(parseCreateInput(input))
    },
    updateSalaryRecord: (_, { id, input }, { user, salaryRecordService }) => {
      assertAuthenticated(user)
      validateUpdateInput(input)
      return salaryRecordService.update(id, parseUpdateInput(input))
    },
    deleteSalaryRecord: async (_, { id }, { user, salaryRecordService }) => {
      assertAuthenticated(user)
      await salaryRecordService.delete(id)
      return true
    },
  },
  SalaryRecord: {
    // Prisma Decimal serializes as a string via valueOf() — parseFloat converts it for GraphQL Float
    salary: (parent) => parseFloat(parent.salary.toString()),
    salaryInUsd: (parent) =>
      parent.salaryInUsd != null ? parseFloat(parent.salaryInUsd.toString()) : null,
  },
}

// Convert GraphQL ID strings to integers for all filter fields
function parseFilters({ jobId, categoryId, countryId, companyId, ...rest }) {
  return {
    ...rest,
    jobId: jobId != null ? parseId(jobId) : undefined,
    categoryId: categoryId != null ? parseId(categoryId) : undefined,
    countryId: countryId != null ? parseId(countryId) : undefined,
    companyId: companyId != null ? parseId(companyId) : undefined,
  }
}

// Convert IDs to integers and salary to string for Prisma Decimal precision
function parseCreateInput({ jobId, employeeCountryId, companyCountryId, companyId, salary, ...rest }) {
  return {
    ...rest,
    salary: String(salary),
    jobId: parseId(jobId),
    employeeCountryId: employeeCountryId != null ? parseId(employeeCountryId) : undefined,
    companyCountryId: companyCountryId != null ? parseId(companyCountryId) : undefined,
    companyId: companyId != null ? parseId(companyId) : undefined,
  }
}

// Convert only the fields that were provided (partial update)
function parseUpdateInput({ jobId, employeeCountryId, companyCountryId, companyId, salary, ...rest }) {
  return {
    ...rest,
    ...(salary != null && { salary: String(salary) }),
    ...(jobId != null && { jobId: parseId(jobId) }),
    ...(employeeCountryId != null && { employeeCountryId: parseId(employeeCountryId) }),
    ...(companyCountryId != null && { companyCountryId: parseId(companyCountryId) }),
    ...(companyId != null && { companyId: parseId(companyId) }),
  }
}
