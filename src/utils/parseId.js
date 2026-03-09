import { BadUserInputError } from "./errors.js"

export function parseId(id) {
  if (!/^\d+$/.test(String(id))) {
    throw new BadUserInputError(`Invalid id: "${id}".`)
  }
  return parseInt(id, 10)
}
