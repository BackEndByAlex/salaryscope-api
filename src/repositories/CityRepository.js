import { SALARY_RECORD_INCLUDE } from "./salaryRecordInclude.js"

const CITY_INCLUDE = {
  country: true,
  _count: {
    select: { records: true },
  },
}

export class CityRepository {
  #prisma

  constructor(prisma) {
    this.#prisma = prisma
  }

  async findAll({ countryId, limit = 20, offset = 0 } = {}) {
    const where = countryId != null ? { countryId } : {}
    const cappedLimit = Math.min(Math.max(limit, 1), 300)
    const safeOffset = Math.max(offset, 0)

    const [totalCount, cities] = await this.#prisma.$transaction([
      this.#prisma.city.count({ where }),
      this.#prisma.city.findMany({
        where,
        include: CITY_INCLUDE,
        take: cappedLimit,
        skip: safeOffset,
        orderBy: { id: "asc" },
      }),
    ])

    return {
      cities,
      totalCount,
      hasNextPage: safeOffset + cities.length < totalCount,
    }
  }

  async findOrCreate(name, countryId) {
    const existing = await this.#prisma.city.findFirst({
      where: { name, countryId },
      include: CITY_INCLUDE,
    })
    if (existing) return existing
    return this.#prisma.city.create({
      data: { name, countryId },
      include: CITY_INCLUDE,
    })
  }

  async findById(id) {
    return this.#prisma.city.findUnique({
      where: { id },
      include: CITY_INCLUDE,
    })
  }

  async findRecords(cityId, { limit = 20, offset = 0 } = {}) {
    const cappedLimit = Math.min(Math.max(limit, 1), 100)
    const safeOffset = Math.max(offset, 0)

    const [totalCount, records] = await this.#prisma.$transaction([
      this.#prisma.salaryRecord.count({ where: { cityId } }),
      this.#prisma.salaryRecord.findMany({
        where: { cityId },
        include: SALARY_RECORD_INCLUDE,
        take: cappedLimit,
        skip: safeOffset,
        orderBy: { id: "asc" },
      }),
    ])

    return {
      records,
      totalCount,
      hasNextPage: safeOffset + records.length < totalCount,
    }
  }
}
