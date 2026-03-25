import { BadUserInputError } from "../utils/errors.js"

const MAX_NAME_LENGTH = 255

export function validateNameArg(name) {
  if (name.length > MAX_NAME_LENGTH) {
    throw new BadUserInputError(
      `Name must not exceed ${MAX_NAME_LENGTH} characters.`,
    )
  }
}
