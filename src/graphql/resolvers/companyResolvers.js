import { parseId } from "../../utils/parseId.js"
import { validateNameArg } from "../../validators/queryValidator.js"

export const companyResolvers = {
  Query: {
    companies: (_, { countryId, limit, offset }, { companyService }) =>
      companyService.getAll({
        countryId: countryId != null ? parseId(countryId) : undefined,
        limit,
        offset,
      }),
    company: (_, { id }, { companyService }) => companyService.getById(id),
    companyByName: (_, { name }, { companyService }) => {
      validateNameArg(name)
      return companyService.getByName(name)
    },
  },
  Company: {
    rating: (parent) =>
      parent.rating != null ? parseFloat(parent.rating.toString()) : null,
    records: (parent, { limit, offset }, { companyService }) =>
      companyService.getRecords(parent.id, { limit, offset }),
  },
}
