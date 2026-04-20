import { NotFoundError } from "../utils/errors.js"

export class UserService {
  #repository

  constructor(repository) {
    this.#repository = repository
  }

  async getById(id) {
    const user = await this.#repository.findById(id)
    if (!user) {
      throw new NotFoundError(`User with id ${id} was not found.`)
    }
    return user
  }

  async deleteById(id) {
    const user = await this.#repository.findById(id)
    if (!user) {
      throw new NotFoundError(`User with id ${id} was not found.`)
    }
    return this.#repository.deleteById(id)
  }
}
