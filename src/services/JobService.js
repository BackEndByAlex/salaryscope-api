import { NotFoundError } from "../utils/errors.js"
import { parseId } from "../utils/parseId.js"

export class JobService {
  #repository

  constructor(repository) {
    this.#repository = repository
  }

  async getAll(filters) {
    return this.#repository.findAll(filters)
  }

  async getById(id) {
    const job = await this.#repository.findById(parseId(id))
    if (!job) {
      throw new NotFoundError(`Job with id ${id} was not found.`)
    }
    return job
  }

  async getRecords(jobId, pagination) {
    return this.#repository.findRecordsByJob(jobId, pagination)
  }
}
