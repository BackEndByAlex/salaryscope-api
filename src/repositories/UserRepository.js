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

  async findByGithubId(githubId) {
    return this.#prisma.user.findUnique({ where: { githubId } })
  }

  async createGithubUser({ email, githubId }) {
    return this.#prisma.user.create({
      data: { email, githubId },
      omit: { passwordHash: true },
    })
  }

  async linkGithubId(userId, githubId) {
    return this.#prisma.user.update({
      where: { id: userId },
      data: { githubId },
      omit: { passwordHash: true },
    })
  }

  async findByGoogleId(googleId) {
    return this.#prisma.user.findUnique({ where: { googleId } })
  }

  async createGoogleUser({ email, googleId }) {
    return this.#prisma.user.create({
      data: { email, googleId },
      omit: { passwordHash: true },
    })
  }

  async linkGoogleId(userId, googleId) {
    return this.#prisma.user.update({
      where: { id: userId },
      data: { googleId },
      omit: { passwordHash: true },
    })
  }
}
