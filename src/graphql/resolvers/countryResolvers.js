export const countryResolvers = {
  Query: {
    countries: (_, __, { countryService }) =>
      countryService.getAll(),
    country: (_, { id }, { countryService }) =>
      countryService.getById(id),
    countryByName: (_, { name }, { countryService }) =>
      countryService.getByName(name),
  },
  Country: {
    // _count is only included on findAll — returns null when Country is loaded as a nested relation
    employeeRecordCount: (parent) => parent._count?.employeeRecords ?? null,
    companyRecordCount: (parent) => parent._count?.companyRecords ?? null,
    companyCount: (parent) => parent._count?.companies ?? null,
    employeeRecords: (parent, { limit, offset }, { countryService }) =>
      countryService.getEmployeeRecords(parent.id, { limit, offset }),
    companyRecords: (parent, { limit, offset }, { countryService }) =>
      countryService.getCompanyRecords(parent.id, { limit, offset }),
  },
}
