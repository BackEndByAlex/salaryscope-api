import { GraphQLError } from 'graphql'

export class UserService {
  #repository

  constructor(repository) {
    this.#repository = repository
  }

  async getById(id) {
    const user = await this.#repository.findById(id)
    if (!user) {
      throw new GraphQLError(`User with id ${id} was not found.`, {
        extensions: { code: 'NOT_FOUND' },
      })
    }
    return user
  }
}
