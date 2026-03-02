import { GraphQLError } from "graphql"

export class UnauthenticatedError extends GraphQLError {
  constructor(message = "You must be logged in to perform this action.") {
    super(message, {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 401 },
      },
    })
    this.name = "UnauthenticatedError"
  }
}

export class NotFoundError extends GraphQLError {
  constructor(message = "Resource not found.") {
    super(message, {
      extensions: {
        code: "NOT_FOUND",
        http: { status: 404 },
      },
    })
    this.name = "NotFoundError"
  }
}

export class BadUserInputError extends GraphQLError {
  constructor(message = "Invalid input provided.") {
    super(message, {
      extensions: {
        code: "BAD_USER_INPUT",
        http: { status: 400 },
      },
    })
    this.name = "BadUserInputError"
  }
}
