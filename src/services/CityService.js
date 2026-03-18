import { NotFoundError } from "../utils/errors.js"
import { parseId } from "../utils/parseId.js"

export class CityService {
  #repository

  constructor(repository) {
    this.#repository = repository
  }

  async getAll({ countryId, limit, offset } = {}) {
    return this.#repository.findAll({ countryId, limit, offset })
  }

  async getById(id) {
    const city = await this.#repository.findById(parseId(id))
    if (!city) {
      throw new NotFoundError(`City with id ${id} was not found.`)
    }
    return city
  }

  async getRecords(cityId, pagination) {
    return this.#repository.findRecords(cityId, pagination)
  }
}
