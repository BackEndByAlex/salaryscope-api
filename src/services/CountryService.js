import { NotFoundError } from "../utils/errors.js"
import { parseId } from "../utils/parseId.js"

export class CountryService {
  #repository

  constructor(repository) {
    this.#repository = repository
  }

  async getAll() {
    return this.#repository.findAll()
  }

  async getById(id) {
    const country = await this.#repository.findById(parseId(id))
    if (!country) {
      throw new NotFoundError(`Country with id ${id} was not found.`)
    }
    return country
  }

  async getByName(name) {
    const country = await this.#repository.findByName(name)
    if (!country) {
      throw new NotFoundError(`Country with name "${name}" was not found.`)
    }
    return country
  }

  async getEmployeeRecords(countryId, pagination) {
    return this.#repository.findEmployeeRecords(countryId, pagination)
  }

  async getCompanyRecords(countryId, pagination) {
    return this.#repository.findCompanyRecords(countryId, pagination)
  }
}
