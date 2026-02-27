import { GraphQLError } from "graphql"

// GraphQL ID scalars arrive as strings — Prisma expects Int. Parse at the service boundary.
export function parseId(id) {
  const parsed = parseInt(id, 10)
  if (isNaN(parsed)) {
    throw new GraphQLError(`Invalid id: ${id}`, {
      extensions: { code: "BAD_USER_INPUT" },
    })
  }
  return parsed
}
