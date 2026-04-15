import { parseId } from "../utils/parseId.js"
import { NotFoundError, ForbiddenError, BadUserInputError } from "../utils/errors.js"

export class SalaryRecordService {
  #repository
  #cityRepository
  #jobRepository

  constructor(repository, cityRepository, jobRepository) {
    this.#repository = repository
    this.#cityRepository = cityRepository
    this.#jobRepository = jobRepository
  }

  async getFilterOptions({ countryId, cityId } = {}) {
    return this.#repository.getFilterOptions({ countryId, cityId })
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

  async create(data, userId) {
    const { cityName, jobTitle, ...rest } = data

    if (!rest.jobId && !jobTitle) {
      throw new BadUserInputError("Either jobId or jobTitle is required.")
    }

    if (!rest.jobId && jobTitle) {
      const job = await this.#jobRepository.findOrCreate(jobTitle)
      rest.jobId = job.id
    }

    if (cityName && rest.employeeCountryId) {
      const city = await this.#cityRepository.findOrCreate(cityName, rest.employeeCountryId)
      rest.cityId = city.id
    }

    return this.#repository.create({ ...rest, createdBy: userId })
  }

  async getByUser(userId) {
    return this.#repository.findByUser(userId)
  }

  async update(id, data, userId) {
    const numericId = parseId(id)
    const record = await this.#repository.findById(numericId)
    if (!record)
      throw new NotFoundError(`Salary record with id ${id} was not found.`)
    this.#assertOwnership(record, userId, id)
    return this.#repository.update(numericId, data)
  }

  async delete(id, userId) {
    const numericId = parseId(id)
    const record = await this.#repository.findById(numericId)
    if (!record)
      throw new NotFoundError(`Salary record with id ${id} was not found.`)
    this.#assertOwnership(record, userId, id)
    return this.#repository.delete(numericId)
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
