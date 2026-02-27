import { GraphQLError } from "graphql"
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
      throw new GraphQLError(`Country with id ${id} was not found.`, {
        extensions: { code: "NOT_FOUND" },
      })
    }
    return country
  }

  async getByName(name) {
    const country = await this.#repository.findByName(name)
    if (!country) {
      throw new GraphQLError(`Country with name ${name} was not found.`, {
        extensions: { code: "NOT_FOUND" },
      })
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
