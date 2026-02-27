import { GraphQLError } from "graphql"
import { parseId } from "../utils/parseId.js"

export class JobService {
  #repository

  constructor(repository) {
    this.#repository = repository
  }

  async getAll(filters) {
    const { jobs, totalCount, hasNextPage } =
      await this.#repository.findAll(filters)
    return { jobs, totalCount, hasNextPage }
  }

  async getById(id) {
    const job = await this.#repository.findById(parseId(id))
    if (!job) {
      throw new GraphQLError(`Job with id ${id} was not found.`, {
        extensions: { code: "NOT_FOUND" },
      })
    }
    return job
  }

  async getRecords(jobId, pagination) {
    return this.#repository.findRecordsByJob(jobId, pagination)
  }
}
