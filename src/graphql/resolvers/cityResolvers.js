import { parseId } from "../../utils/parseId.js"

export const cityResolvers = {
  Query: {
    cities: (_, { countryId, limit, offset }, { cityService }) => {
      const parsedCountryId = countryId != null ? parseId(countryId) : undefined
      return cityService.getAll({ countryId: parsedCountryId, limit, offset })
    },
    city: (_, { id }, { cityService }) => cityService.getById(id),
  },
  City: {
    recordCount: (parent) => parent._count?.records ?? null,
    records: (parent, { limit, offset }, { cityService }) =>
      cityService.getRecords(parent.id, { limit, offset }),
  },
}
