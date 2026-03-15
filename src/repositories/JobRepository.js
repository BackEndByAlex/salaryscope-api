import { SALARY_RECORD_INCLUDE } from "./salaryRecordInclude.js"

export class JobRepository {
  #prisma

  constructor(prisma) {
    this.#prisma = prisma
  }
  // Retrieves a paginated list of jobs, optionally filtered by category ID, along with the total count and pagination info.
  async findAll({ categoryId, limit = 20, offset = 0 } = {}) {
    const where = categoryId != null ? { categoryId } : {}

    const [totalCount, jobs] = await this.#prisma.$transaction([
      this.#prisma.job.count({ where }),
      this.#prisma.job.findMany({
        where,
        include: { category: true },
        take: limit,
        skip: offset,
        orderBy: { id: "asc" },
      }),
    ])

    return { jobs, totalCount, hasNextPage: offset + jobs.length < totalCount }
  }

  async findById(id) {
    return this.#prisma.job.findUnique({
      where: { id },
      include: { category: true },
    })
  }

  async findRecordsByJob(jobId, { limit = 20, offset = 0 } = {}) {
    const cappedLimit = Math.min(Math.max(limit, 1), 100)
    const safeOffset = Math.max(offset, 0)
    const where = { jobId }

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
