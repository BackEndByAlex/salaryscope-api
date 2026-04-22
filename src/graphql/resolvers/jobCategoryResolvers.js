import { validateNameArg } from "../../validators/queryValidator.js"

export const jobCategoryResolvers = {
  Query: {
    jobCategories: (_, { limit, offset }, { jobCategoryService }) =>
      jobCategoryService.getAll({ limit, offset }),
    jobCategory: (_, { id }, { jobCategoryService }) =>
      jobCategoryService.getById(id),
    jobCategoryByName: (_, { name }, { jobCategoryService }) => {
      validateNameArg(name)
      return jobCategoryService.getByName(name)
    },
  },
  JobCategory: {
    jobCount: (parent) => parent._count?.jobs ?? null,
  },
}
