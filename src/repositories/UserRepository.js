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
      omit: { passwordHash: true }, // safe to omit here — caller never needs the hash outside auth
    })
  }

  async create({ email, passwordHash }) {
    return this.#prisma.user.create({
      data: { email, passwordHash },
      omit: { passwordHash: true }, // return the created user without exposing the hash to the caller
    })
  }
}
