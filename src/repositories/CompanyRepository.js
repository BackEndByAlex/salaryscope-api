import { SALARY_RECORD_INCLUDE } from "./salaryRecordInclude.js"

export class CompanyRepository {
  #prisma

  constructor(prisma) {
    this.#prisma = prisma
  }

  async findAll({ countryId, limit = 20, offset = 0 } = {}) {
    const where = countryId != null ? { countryId } : {}

    // transaction ensures count and page share the same snapshot — no drift if writes happen between the two queries
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

    // companies.length instead of limit — the last page may return fewer rows than limit
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
    const where = { companyId }

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
}
