import { GraphQLError } from "graphql"

const VALID_EMAIL_PATTERN = /^[^\s\r\n@]+@[^\s\r\n@]+\.[^\s\r\n@]+$/
const MIN_PASSWORD_LENGTH = 8

export function validateRegisterInput({ email, password }) {
  if (!email || !password) {
    throw new GraphQLError("Email and password are required.", {
      extensions: { code: "BAD_USER_INPUT" },
    })
  }

  if (!VALID_EMAIL_PATTERN.test(email)) {
    throw new GraphQLError("Email must be a valid email address.", {
      extensions: { code: "BAD_USER_INPUT" },
    })
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new GraphQLError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      {
        extensions: { code: "BAD_USER_INPUT" },
      },
    )
  }
}

export function validateLoginInput({ email, password }) {
  if (!email || !password) {
    throw new GraphQLError("Email and password are required.", {
      extensions: { code: "BAD_USER_INPUT" },
    })
  }
}
