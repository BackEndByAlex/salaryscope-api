import { GraphQLError } from "graphql"
import { Prisma } from "@prisma/client"
import { parseId } from "../utils/parseId.js"

export class SalaryRecordService {
  #repository

  constructor(repository) {
    this.#repository = repository
  }

  async getAll(filters) {
    const { records, totalCount, hasNextPage } =
      await this.#repository.findAll(filters)
    return { records, totalCount, hasNextPage }
  }

  async getById(id) {
    const record = await this.#repository.findById(parseId(id))

    if (!record) {
      throw new GraphQLError(`Salary record with id ${id} was not found.`, {
        extensions: { code: "NOT_FOUND" },
      })
    }

    return record
  }

  async create(data) {
    return this.#repository.create(data)
  }

  async update(id, data) {
    try {
      return await this.#repository.update(parseId(id), data)
    } catch (e) {
      this.#rethrowIfNotFound(e, id)
      throw e
    }
  }

  async delete(id) {
    try {
      return await this.#repository.delete(parseId(id))
    } catch (e) {
      this.#rethrowIfNotFound(e, id)
      throw e
    }
  }

  #rethrowIfNotFound(error, id) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new GraphQLError(`Salary record with id ${id} was not found.`, {
        extensions: { code: "NOT_FOUND" },
      })
    }
  }
}
