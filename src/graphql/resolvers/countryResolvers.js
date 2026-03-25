import { validateNameArg } from "../../validators/queryValidator.js"

export const countryResolvers = {
  Query: {
    countries: (_, { limit, offset }, { countryService }) =>
      countryService.getAll({ limit, offset }),
    country: (_, { id }, { countryService }) => countryService.getById(id),
    countryByName: (_, { name }, { countryService }) => {
      validateNameArg(name)
      return countryService.getByName(name)
    },
  },
  Country: {
    employeeRecordCount: (parent) => parent._count?.employeeRecords ?? null,
    companyRecordCount: (parent) => parent._count?.companyRecords ?? null,
    companyCount: (parent) => parent._count?.companies ?? null,
    employeeRecords: (parent, { limit, offset }, { countryService }) =>
      countryService.getEmployeeRecords(parent.id, { limit, offset }),
    companyRecords: (parent, { limit, offset }, { countryService }) =>
      countryService.getCompanyRecords(parent.id, { limit, offset }),
  },
}
