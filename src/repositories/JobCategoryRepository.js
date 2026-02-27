export class JobCategoryRepository {
  #prisma

  constructor(prisma) {
    this.#prisma = prisma
  }

  async findAll() {
    return this.#prisma.jobCategory.findMany({
      include: { _count: { select: { jobs: true } } },
    })
  }

  async findById(id) {
    return this.#prisma.jobCategory.findUnique({
      where: { id },
      include: { _count: { select: { jobs: true } } },
    })
  }

  async findByName(name) {
    return this.#prisma.jobCategory.findUnique({
      where: { name },
      include: { _count: { select: { jobs: true } } },
    })
  }
}
