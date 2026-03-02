import { BadUserInputError } from "./errors.js"

// GraphQL ID scalars arrive as strings — Prisma expects Int.
// /^\d+$/ rejects partial matches like "3abc" that parseInt would silently accept.
export function parseId(id) {
  if (!/^\d+$/.test(String(id))) {
    throw new BadUserInputError(`Invalid id: "${id}".`)
  }
  return parseInt(id, 10)
}
