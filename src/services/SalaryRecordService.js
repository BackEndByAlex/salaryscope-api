import { parseId } from "../utils/parseId.js"
import { NotFoundError, ForbiddenError } from "../utils/errors.js"

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
      throw new NotFoundError(`Salary record with id ${id} was not found.`)
    }

    return record
  }

  // Creates a new salary record with the provided data and associates it with the user ID of the creator.
  async create(data, userId) {
    return this.#repository.create({ ...data, createdBy: userId })
  }

  async update(id, data, userId) {
    const record = await this.#repository.findById(parseId(id))
    if (!record)
      throw new NotFoundError(`Salary record with id ${id} was not found.`)
    this.#assertOwnership(record, userId, id)
    return this.#repository.update(parseId(id), data)
  }

  async delete(id, userId) {
    const record = await this.#repository.findById(parseId(id))
    if (!record)
      throw new NotFoundError(`Salary record with id ${id} was not found.`)
    this.#assertOwnership(record, userId, id)
    return this.#repository.delete(parseId(id))
  }

  #assertOwnership(record, userId, id) {
    if (record.createdBy === null) {
      throw new ForbiddenError(
        "This record is part of the public dataset and cannot be modified.",
      )
    }
    if (record.createdBy !== userId) {
      throw new ForbiddenError(
        `You do not have permission to modify salary record with id ${id}.`,
      )
    }
  }
}
