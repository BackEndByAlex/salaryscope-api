import { BadUserInputError } from "../utils/errors.js"

// Both short codes and full strings exist across datasets
const ALLOWED_EXPERIENCE_LEVELS = new Set([
  "EN",
  "MI",
  "SE",
  "EX",
  "Entry-level",
  "Mid-level",
  "Senior",
  "Executive",
])
const ALLOWED_EMPLOYMENT_TYPES = new Set([
  "FT",
  "PT",
  "CT",
  "FL",
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
])
const ALLOWED_WORK_SETTINGS = new Set(["Remote", "Hybrid", "In-person"])
const ALLOWED_COMPANY_SIZES = new Set(["S", "M", "L"])
const ALLOWED_SOURCES = new Set([
  "jobs_in_data",
  "salary_extra",
  "software_pro",
  "h1b_visa",
  "user_submitted",
])

export function validateCreateInput({ salary, jobId, jobTitle, source }) {
  if (salary == null || source == null) {
    throw new BadUserInputError("salary and source are required.")
  }

  if (jobId == null && !jobTitle) {
    throw new BadUserInputError("Either jobId or jobTitle is required.")
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

  if (data.salary != null && !(Number(data.salary) > 0)) {
    throw new BadUserInputError("salary must be a positive number.")
  }

  if (data.source != null && data.source.length > 200) {
    throw new BadUserInputError("source must not exceed 200 characters.")
  }
}

export function validateFilters({
  limit,
  offset,
  experienceLevel,
  employmentType,
  workSetting,
  companySize,
  source,
} = {}) {
  if (limit != null && (limit < 1 || limit > 100)) {
    throw new BadUserInputError("limit must be between 1 and 100.")
  }

  if (offset != null && offset < 0) {
    throw new BadUserInputError("offset must not be negative.")
  }

  if (
    experienceLevel != null &&
    !ALLOWED_EXPERIENCE_LEVELS.has(experienceLevel)
  ) {
    throw new BadUserInputError(
      `Invalid experienceLevel: "${experienceLevel}".`,
    )
  }

  if (employmentType != null && !ALLOWED_EMPLOYMENT_TYPES.has(employmentType)) {
    throw new BadUserInputError(`Invalid employmentType: "${employmentType}".`)
  }

  if (workSetting != null && !ALLOWED_WORK_SETTINGS.has(workSetting)) {
    throw new BadUserInputError(`Invalid workSetting: "${workSetting}".`)
  }

  if (companySize != null && !ALLOWED_COMPANY_SIZES.has(companySize)) {
    throw new BadUserInputError(`Invalid companySize: "${companySize}".`)
  }

  if (source != null && !ALLOWED_SOURCES.has(source)) {
    throw new BadUserInputError(`Invalid source: "${source}".`)
  }
}
