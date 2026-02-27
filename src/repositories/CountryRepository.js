import { SALARY_RECORD_INCLUDE } from "./salaryRecordInclude.js"

export class CountryRepository {
  #prisma

  constructor(prisma) {
    this.#prisma = prisma
  }

  async findAll() {
    return this.#prisma.country.findMany({
      include: {
        _count: {
          select: {
            employeeRecords: true,
            companyRecords: true,
            companies: true,
          },
        },
      },
    })
  }

  async findById(id) {
    return this.#prisma.country.findUnique({ where: { id } })
  }

  async findByName(name) {
    return this.#prisma.country.findUnique({ where: { name } })
  }

  async findEmployeeRecords(countryId, pagination = {}) {
    return this.#findPaginatedRecords(
      { employeeCountryId: countryId },
      pagination,
    )
  }

  async findCompanyRecords(countryId, pagination = {}) {
    return this.#findPaginatedRecords(
      { companyCountryId: countryId },
      pagination,
    )
  }

  async #findPaginatedRecords(where, { limit = 20, offset = 0 } = {}) {
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
