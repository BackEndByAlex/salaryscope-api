import { SALARY_RECORD_INCLUDE } from "./salaryRecordInclude.js"

const COUNTRY_COUNT_INCLUDE = {
  _count: {
    select: {
      employeeRecords: true,
      companyRecords: true,
      companies: true,
    },
  },
}

export class CountryRepository {
  #prisma

  constructor(prisma) {
    this.#prisma = prisma
  }

  async findAll({ limit = 20, offset = 0 } = {}) {
    const cappedLimit = Math.min(Math.max(limit, 1), 100)
    const safeOffset = Math.max(offset, 0)

    const [totalCount, countries] = await this.#prisma.$transaction([
      this.#prisma.country.count(),
      this.#prisma.country.findMany({
        include: COUNTRY_COUNT_INCLUDE,
        take: cappedLimit,
        skip: safeOffset,
        orderBy: { id: "asc" },
      }),
    ])

    return {
      countries,
      totalCount,
      hasNextPage: safeOffset + countries.length < totalCount,
    }
  }

  async findById(id) {
    return this.#prisma.country.findUnique({
      where: { id },
      include: COUNTRY_COUNT_INCLUDE,
    })
  }

  async findByName(name) {
    return this.#prisma.country.findUnique({
      where: { name },
      include: COUNTRY_COUNT_INCLUDE,
    })
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
    const cappedLimit = Math.min(Math.max(limit, 1), 100)
    const safeOffset = Math.max(offset, 0)

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
