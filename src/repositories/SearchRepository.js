import esClient from "../config/elasticsearchClient.js"

export const INDEX = "salary_records"

export class SearchRepository {
  async search(query, { limit = 10, offset = 0 } = {}) {
    const response = await esClient.search({
      index: INDEX,
      from: offset,
      size: limit,
      query: {
        multi_match: {
          query,
          fields: ["jobTitle^3", "jobCategory^2", "companyName", "city", "country"],
          fuzziness: "AUTO",
          operator: "or",
        },
      },
      highlight: {
        fields: {
          jobTitle: {},
          city: {},
          country: {},
        },
      },
    })

    const hits = response.hits.hits
    const totalCount = typeof response.hits.total === "number"
      ? response.hits.total
      : response.hits.total.value

    return {
      records: hits.map((hit) => ({
        id: hit._id,
        score: hit._score,
        highlight: hit.highlight ?? {},
        ...hit._source,
      })),
      totalCount,
      hasNextPage: offset + limit < totalCount,
    }
  }

  async indexRecord(record) {
    await esClient.index({
      index: INDEX,
      id: String(record.id),
      document: toDocument(record),
    })
  }

  async bulkIndex(records) {
    if (records.length === 0) return

    const operations = records.flatMap((record) => [
      { index: { _index: INDEX, _id: String(record.id) } },
      toDocument(record),
    ])

    const response = await esClient.bulk({ operations, refresh: true })

    if (response.errors) {
      const failed = response.items.filter((i) => i.index?.error)
      console.error(`ES bulk index: ${failed.length} failures`)
    }
  }

  async deleteRecord(id) {
    await esClient.delete({ index: INDEX, id: String(id) }).catch(() => {})
  }

  async ensureIndex() {
    const exists = await esClient.indices.exists({ index: INDEX })
    if (exists) return

    await esClient.indices.create({
      index: INDEX,
      mappings: {
        properties: {
          jobTitle:       { type: "text",    analyzer: "standard" },
          jobCategory:    { type: "keyword" },
          salary:         { type: "float" },
          salaryInUsd:    { type: "float" },
          country:        { type: "keyword" },
          countryId:      { type: "integer" },
          city:           { type: "keyword" },
          cityId:         { type: "integer" },
          companyName:    { type: "text" },
          experienceLevel:{ type: "keyword" },
          workSetting:    { type: "keyword" },
          employmentType: { type: "keyword" },
          companySize:    { type: "keyword" },
          workYear:       { type: "integer" },
          source:         { type: "keyword" },
        },
      },
    })

    console.log(`Created Elasticsearch index: ${INDEX}`)
  }
}

function toDocument(record) {
  return {
    jobTitle:        record.job?.title ?? record.jobTitle ?? null,
    jobCategory:     record.job?.category?.name ?? record.jobCategory ?? null,
    salary:          record.salary != null ? Number(record.salary) : null,
    salaryInUsd:     record.salaryInUsd != null ? Number(record.salaryInUsd) : null,
    country:         record.employeeCountry?.name ?? record.country ?? null,
    countryId:       record.employeeCountryId ?? record.countryId ?? null,
    city:            record.city?.name ?? record.city ?? null,
    cityId:          record.cityId ?? null,
    companyName:     record.company?.name ?? record.companyName ?? null,
    experienceLevel: record.experienceLevel ?? null,
    workSetting:     record.workSetting ?? null,
    employmentType:  record.employmentType ?? null,
    companySize:     record.companySize ?? null,
    workYear:        record.workYear ?? null,
    source:          record.source ?? null,
  }
}
