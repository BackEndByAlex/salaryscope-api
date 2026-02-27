import { GraphQLError } from "graphql"

// GraphQL ID scalars arrive as strings — Prisma expects Int.
// /^\d+$/ rejects partial matches like "3abc" that parseInt would silently accept.
export function parseId(id) {
  if (!/^\d+$/.test(String(id))) {
    throw new GraphQLError(`Invalid id: "${id}".`, {
      extensions: { code: "BAD_USER_INPUT" },
    })
  }
  return parseInt(id, 10)
}
