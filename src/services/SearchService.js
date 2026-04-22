export class SearchService {
  #repository

  constructor(repository) {
    this.#repository = repository
  }

  async search(query, { limit = 10, offset = 0 } = {}) {
    if (!query || query.trim().length === 0) {
      return { records: [], totalCount: 0, hasNextPage: false }
    }

    return this.#repository.search(query.trim(), { limit, offset })
  }

  async indexRecord(record) {
    return this.#repository.indexRecord(record)
  }

  async deleteRecord(id) {
    return this.#repository.deleteRecord(id)
  }
}
