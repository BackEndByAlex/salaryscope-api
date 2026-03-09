export class UserRepository {
  #prisma

  constructor(prisma) {
    this.#prisma = prisma
  }

  async findByEmail(email) {
    return this.#prisma.user.findUnique({ where: { email } })
  }

  async findById(id) {
    return this.#prisma.user.findUnique({
      where: { id },
      omit: { passwordHash: true },
    })
  }

  async create({ email, passwordHash }) {
    return this.#prisma.user.create({
      data: { email, passwordHash },
      omit: { passwordHash: true },
    })
  }
}
