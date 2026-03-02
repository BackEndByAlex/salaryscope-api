import { BadUserInputError } from "../utils/errors.js"

const VALID_EMAIL_PATTERN = /^[^\s\r\n@]+@[^\s\r\n@]+\.[^\s\r\n@]+$/
const MIN_PASSWORD_LENGTH = 8

export function validateRegisterInput({ email, password }) {
  if (!email || !password) {
    throw new BadUserInputError("Email and password are required.")
  }

  if (!VALID_EMAIL_PATTERN.test(email)) {
    throw new BadUserInputError("Email must be a valid email address.")
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new BadUserInputError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    )
  }
}

export function validateLoginInput({ email, password }) {
  if (!email || !password) {
    throw new BadUserInputError("Email and password are required.")
  }
}
