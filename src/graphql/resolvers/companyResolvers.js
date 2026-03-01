import { parseId } from '../../utils/parseId.js'

export const companyResolvers = {
  Query: {
    companies: (_, { countryId, limit, offset }, { companyService }) =>
      companyService.getAll({
        countryId: countryId != null ? parseId(countryId) : undefined,
        limit,
        offset,
      }),
    company: (_, { id }, { companyService }) =>
      companyService.getById(id),
    companyByName: (_, { name }, { companyService }) =>
      companyService.getByName(name),
  },
  Company: {
    // Prisma Decimal serializes as a string via valueOf() — parseFloat converts it for GraphQL Float
    rating: (parent) =>
      parent.rating != null ? parseFloat(parent.rating.toString()) : null,
    records: (parent, { limit, offset }, { companyService }) =>
      companyService.getRecords(parent.id, { limit, offset }),
  },
}
