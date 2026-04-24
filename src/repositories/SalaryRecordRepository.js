import { SALARY_RECORD_INCLUDE } from "./salaryRecordInclude.js"

export class SalaryRecordRepository {
  #prisma

  constructor(prisma) {
    this.#prisma = prisma
  }

  async findAll({
    workYear,
    jobId,
    categoryId,
    countryId,
    companyId,
    cityId,
    experienceLevel,
    employmentType,
    workSetting,
    companySize,
    source,
    limit = 20,
    offset = 0,
  } = {}) {
    const where = buildSalaryRecordWhere({
      workYear,
      jobId,
      categoryId,
      countryId,
      companyId,
      cityId,
      experienceLevel,
      employmentType,
      workSetting,
      companySize,
      source,
    })

    const [totalCount, records] = await this.#prisma.$transaction([
      this.#prisma.salaryRecord.count({ where }),
      this.#prisma.salaryRecord.findMany({
        where,
        include: SALARY_RECORD_INCLUDE,
        take: limit,
        skip: offset,
        orderBy: { id: "asc" },
      }),
    ])

    return {
      records,
      totalCount,
      hasNextPage: offset + records.length < totalCount,
    }
  }

  async getFilterOptions({ countryId, cityId } = {}) {
    const where = {}
    if (countryId != null) where.employeeCountryId = countryId
    if (cityId != null) where.cityId = cityId

    const [expRows, settingRows, typeRows, sizeRows, yearRows] =
      await Promise.all([
        this.#prisma.salaryRecord.findMany({
          where: { ...where, experienceLevel: { not: null } },
          distinct: ["experienceLevel"],
          select: { experienceLevel: true },
          orderBy: { experienceLevel: "asc" },
        }),
        this.#prisma.salaryRecord.findMany({
          where: { ...where, workSetting: { not: null } },
          distinct: ["workSetting"],
          select: { workSetting: true },
          orderBy: { workSetting: "asc" },
        }),
        this.#prisma.salaryRecord.findMany({
          where: { ...where, employmentType: { not: null } },
          distinct: ["employmentType"],
          select: { employmentType: true },
          orderBy: { employmentType: "asc" },
        }),
        this.#prisma.salaryRecord.findMany({
          where: { ...where, companySize: { not: null } },
          distinct: ["companySize"],
          select: { companySize: true },
          orderBy: { companySize: "asc" },
        }),
        this.#prisma.salaryRecord.findMany({
          where: { ...where, workYear: { not: null } },
          distinct: ["workYear"],
          select: { workYear: true },
          orderBy: { workYear: "desc" },
        }),
      ])

    return {
      experienceLevels: expRows.map((r) => r.experienceLevel),
      workSettings: settingRows.map((r) => r.workSetting),
      employmentTypes: typeRows.map((r) => r.employmentType),
      companySizes: sizeRows.map((r) => r.companySize),
      workYears: yearRows.map((r) => r.workYear),
    }
  }

  async findById(id) {
    return this.#prisma.salaryRecord.findUnique({
      where: { id },
      include: SALARY_RECORD_INCLUDE,
    })
  }

  async create(data) {
    return this.#prisma.salaryRecord.create({
      data,
      include: SALARY_RECORD_INCLUDE,
    })
  }

  async update(id, data) {
    return this.#prisma.salaryRecord.update({
      where: { id },
      data,
      include: SALARY_RECORD_INCLUDE,
    })
  }

  async delete(id) {
    return this.#prisma.salaryRecord.delete({ where: { id } })
  }

  async findByUser(userId) {
    return this.#prisma.salaryRecord.findMany({
      where: { createdBy: userId },
      include: SALARY_RECORD_INCLUDE,
      orderBy: { createdAt: "desc" },
    })
  }
}

// Both datasets store the same concept with different string formats.
// jobs_in_data uses full strings ("Entry-level", "Full-time"), while
// eu_survey_2020 and h1b_visa use short codes ("EN", "FT").
// Expand each value to match both so a single filter works across all datasets.
const EXPERIENCE_LEVEL_ALIASES = {
  EN: ["EN", "Entry-level"],
  MI: ["MI", "Mid-level"],
  SE: ["SE", "Senior"],
  EX: ["EX", "Executive"],
  "Entry-level": ["Entry-level", "EN"],
  "Mid-level": ["Mid-level", "MI"],
  Senior: ["Senior", "SE"],
  Executive: ["Executive", "EX"],
}

const EMPLOYMENT_TYPE_ALIASES = {
  FT: ["FT", "Full-time"],
  PT: ["PT", "Part-time"],
  CT: ["CT", "Contract"],
  FL: ["FL", "Freelance"],
  "Full-time": ["Full-time", "FT"],
  "Part-time": ["Part-time", "PT"],
  Contract: ["Contract", "CT"],
  Freelance: ["Freelance", "FL"],
}

function buildSalaryRecordWhere({
  workYear,
  jobId,
  categoryId,
  countryId,
  companyId,
  cityId,
  experienceLevel,
  employmentType,
  workSetting,
  companySize,
  source,
}) {
  const where = {}

  if (workYear != null) where.workYear = workYear
  if (jobId != null && categoryId != null) where.job = { id: jobId, categoryId }
  else if (jobId != null) where.jobId = jobId
  else if (categoryId != null) where.job = { categoryId }
  if (countryId != null) where.employeeCountryId = countryId
  if (companyId != null) where.companyId = companyId
  if (cityId != null) where.cityId = cityId
  if (experienceLevel != null) {
    const aliases = EXPERIENCE_LEVEL_ALIASES[experienceLevel]
    where.experienceLevel = aliases ? { in: aliases } : experienceLevel
  }
  if (employmentType != null) {
    const aliases = EMPLOYMENT_TYPE_ALIASES[employmentType]
    where.employmentType = aliases ? { in: aliases } : employmentType
  }
  if (workSetting != null) where.workSetting = workSetting
  if (companySize != null) where.companySize = companySize
  if (source != null) where.source = source

  return where
}
