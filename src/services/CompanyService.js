import { NotFoundError } from "../utils/errors.js"
import { parseId } from "../utils/parseId.js"

export class CompanyService {
  #repository

  constructor(repository) {
    this.#repository = repository
  }

  async getAll(filters) {
    return this.#repository.findAll(filters)
  }

  async getById(id) {
    const company = await this.#repository.findById(parseId(id))
    if (!company) {
      throw new NotFoundError(`Company with id ${id} was not found.`)
    }
    return company
  }

  async getByName(name) {
    const company = await this.#repository.findByName(name)
    if (!company) {
      throw new NotFoundError(`Company with name "${name}" was not found.`)
    }
    return company
  }

  async getRecords(companyId, pagination) {
    return this.#repository.findRecordsByCompany(companyId, pagination)
  }
}
