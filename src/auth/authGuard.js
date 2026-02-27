import { GraphQLError } from "graphql"

export function assertAuthenticated(user) {
  if (!user) {
    throw new GraphQLError("You must be logged in to perform this action.", {
      extensions: { code: "UNAUTHENTICATED" },
    })
  }
}
