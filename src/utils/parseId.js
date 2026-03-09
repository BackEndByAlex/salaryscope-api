import { BadUserInputError } from "./errors.js"

// Validates the provided ID is a positive integer and converts it to a number. If the ID is invalid, it throws a BadUserInputError.
export function parseId(id) {
  if (!/^\d+$/.test(String(id))) {
    throw new BadUserInputError(`Invalid id: "${id}".`)
  }
  return parseInt(id, 10)
}
