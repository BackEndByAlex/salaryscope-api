import { GraphQLError } from "graphql"
import { parseId } from "../utils/parseId.js"

export class JobCategoryService {
  #repository

  constructor(repository) {
    this.#repository = repository
  }

  async getAll() {
    return this.#repository.findAll()
  }

  async getById(id) {
    const jobCategory = await this.#repository.findById(parseId(id))
    if (!jobCategory) {
      throw new GraphQLError(`Job category with id ${id} was not found.`, {
        extensions: { code: "NOT_FOUND" },
      })
    }
    return jobCategory
  }

  async getByName(name) {
    const jobCategory = await this.#repository.findByName(name)
    if (!jobCategory) {
      throw new GraphQLError(
        `Job category with name "${name}" was not found.`,
        {
          extensions: { code: "NOT_FOUND" },
        },
      )
    }
    return jobCategory
  }
}
