export const jobCategoryResolvers = {
  Query: {
    jobCategories: (_, { limit, offset }, { jobCategoryService }) =>
      jobCategoryService.getAll({ limit, offset }),
    jobCategory: (_, { id }, { jobCategoryService }) =>
      jobCategoryService.getById(id),
    jobCategoryByName: (_, { name }, { jobCategoryService }) =>
      jobCategoryService.getByName(name),
  },
  JobCategory: {
    jobCount: (parent) => parent._count?.jobs ?? null,
  },
}
