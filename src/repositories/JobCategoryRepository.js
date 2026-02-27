export class JobCategoryRepository {
  #prisma

  constructor(prisma) {
    this.#prisma = prisma
  }

  async findAll() {
    return this.#prisma.jobCategory.findMany({
      include: { _count: { select: { jobs: true } } }
    })
  }

  async findById(id) {
    return this.#prisma.jobCategory.findUnique({
      where: { id },
      include: { jobs: true }
    })
  }

  async findByName(name) {
    return this.#prisma.jobCategory.findUnique({
      where: { name },
      include: { jobs: true }
    })
  }
}
