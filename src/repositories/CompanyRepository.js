import { SALARY_RECORD_INCLUDE } from "./salaryRecordInclude.js"

export class CompanyRepository {
  #prisma

  constructor(prisma) {
    this.#prisma = prisma
  }

  async findAll({ countryId, limit = 20, offset = 0 } = {}) {
    const where = countryId != null ? { countryId } : {}

    const [totalCount, companies] = await this.#prisma.$transaction([
      this.#prisma.company.count({ where }),
      this.#prisma.company.findMany({
        where,
        include: { country: true },
        take: limit,
        skip: offset,
        orderBy: { id: "asc" },
      }),
    ])

    return {
      companies,
      totalCount,
      hasNextPage: offset + companies.length < totalCount,
    }
  }

  async findById(id) {
    return this.#prisma.company.findUnique({
      where: { id },
      include: { country: true },
    })
  }

  async findByName(name) {
    return this.#prisma.company.findUnique({
      where: { name },
      include: { country: true },
    })
  }

  async findRecordsByCompany(companyId, { limit = 20, offset = 0 } = {}) {
    const cappedLimit = Math.min(Math.max(limit, 1), 100)
    const safeOffset = Math.max(offset, 0)
    const where = { companyId }

    const [totalCount, records] = await this.#prisma.$transaction([
      this.#prisma.salaryRecord.count({ where }),
      this.#prisma.salaryRecord.findMany({
        where,
        include: SALARY_RECORD_INCLUDE,
        take: cappedLimit,
        skip: safeOffset,
        orderBy: { id: "asc" },
      }),
    ])

    return {
      records,
      totalCount,
      hasNextPage: offset + records.length < totalCount,
    }
  }
}
