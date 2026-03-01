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
      experienceLevel,
      employmentType,
      workSetting,
      companySize,
      source,
    })

    // transaction ensures count and page share the same snapshot — no drift if writes happen between the two queries
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

    // records.length instead of limit — the last page may return fewer rows than limit
    return {
      records,
      totalCount,
      hasNextPage: offset + records.length < totalCount,
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
}

function buildSalaryRecordWhere({
  workYear,
  jobId,
  categoryId,
  countryId,
  companyId,
  experienceLevel,
  employmentType,
  workSetting,
  companySize,
  source,
}) {
  const where = {}

  if (workYear != null) where.workYear = workYear
  // categoryId lives on the job relation, not on salaryRecord directly — both filters must go through where.job
  if (jobId != null && categoryId != null) where.job = { id: jobId, categoryId }
  else if (jobId != null) where.jobId = jobId
  else if (categoryId != null) where.job = { categoryId }
  if (countryId != null) where.employeeCountryId = countryId
  if (companyId != null) where.companyId = companyId
  if (experienceLevel != null) where.experienceLevel = experienceLevel
  if (employmentType != null) where.employmentType = employmentType
  if (workSetting != null) where.workSetting = workSetting
  if (companySize != null) where.companySize = companySize
  if (source != null) where.source = source

  return where
}
