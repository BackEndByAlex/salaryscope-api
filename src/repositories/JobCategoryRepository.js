const JOB_CATEGORY_INCLUDE = { _count: { select: { jobs: true } } }

export class JobCategoryRepository {
  #prisma

  constructor(prisma) {
    this.#prisma = prisma
  }

  async findAll({ limit = 20, offset = 0 } = {}) {
    const cappedLimit = Math.min(Math.max(limit, 1), 100)
    const safeOffset = Math.max(offset, 0)

    const [totalCount, jobCategories] = await this.#prisma.$transaction([
      this.#prisma.jobCategory.count(),
      this.#prisma.jobCategory.findMany({
        include: JOB_CATEGORY_INCLUDE,
        take: cappedLimit,
        skip: safeOffset,
        orderBy: { id: "asc" },
      }),
    ])

    return {
      jobCategories,
      totalCount,
      hasNextPage: safeOffset + jobCategories.length < totalCount,
    }
  }

  async findById(id) {
    return this.#prisma.jobCategory.findUnique({
      where: { id },
      include: JOB_CATEGORY_INCLUDE,
    })
  }

  async findByName(name) {
    return this.#prisma.jobCategory.findUnique({
      where: { name },
      include: JOB_CATEGORY_INCLUDE,
    })
  }
}
