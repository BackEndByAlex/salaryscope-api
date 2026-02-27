import { GraphQLError } from "graphql"
import { parseId } from "../utils/parseId.js"

export class CompanyService {
  #repository

  constructor(repository) {
    this.#repository = repository
  }

  async getAll(filters) {
    const { companies, totalCount, hasNextPage } =
      await this.#repository.findAll(filters)
    return { companies, totalCount, hasNextPage }
  }

  async getById(id) {
    const company = await this.#repository.findById(parseId(id))
    if (!company) {
      throw new GraphQLError(`Company with id ${id} was not found.`, {
        extensions: { code: "NOT_FOUND" },
      })
    }
    return company
  }

  async getByName(name) {
    const company = await this.#repository.findByName(name)
    if (!company) {
      throw new GraphQLError(`Company with name ${name} was not found.`, {
        extensions: { code: "NOT_FOUND" },
      })
    }
    return company
  }

  async getRecords(companyId, pagination) {
    return this.#repository.findRecordsByCompany(companyId, pagination)
  }
}
