import { parseId } from "../../utils/parseId.js"

export const jobResolvers = {
  Query: {
    jobs: (_, { categoryId, limit, offset }, { jobService }) =>
      jobService.getAll({
        categoryId: categoryId != null ? parseId(categoryId) : undefined,
        limit,
        offset,
      }),
    job: (_, { id }, { jobService }) => jobService.getById(id),
  },
  Job: {
    records: (parent, { limit, offset }, { jobService }) =>
      jobService.getRecords(parent.id, { limit, offset }),
  },
}
