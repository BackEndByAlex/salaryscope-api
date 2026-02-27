import { SALARY_RECORD_INCLUDE } from "./salaryRecordInclude.js"

export class JobRepository {
  #prisma

  constructor(prisma) {
    this.#prisma = prisma
  }

  async findAll({ categoryId, limit = 20, offset = 0 } = {}) {
    const where = categoryId != null ? { categoryId } : {}

    // transaction ensures count and page share the same snapshot — no drift if writes happen between the two queries
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

    // records.length instead of limit — the last page may return fewer rows than limit
    return { jobs, totalCount, hasNextPage: offset + jobs.length < totalCount }
  }

  async findById(id) {
    return this.#prisma.job.findUnique({
      where: { id },
      include: { category: true },
    })
  }

  async findRecordsByJob(jobId, { limit = 20, offset = 0 } = {}) {
    const where = { jobId }

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
