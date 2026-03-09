import {
  validateRegisterInput,
  validateLoginInput,
} from "../validators/authValidator.js"
import { assertAuthenticated } from "./authGuard.js"

// This file defines the GraphQL resolvers for 
// authentication-related operations, 
// including user registration, 
// login, and fetching the current user's profile.
export const authResolvers = {
  Query: {
    me: (_, __, { user, userService }) => {
      assertAuthenticated(user)
      return userService.getById(user.id)
    },
  },
  Mutation: {
    register: (_, { input }, { authService }) => {
      validateRegisterInput(input)
      return authService.register(input)
    },
    login: (_, { input }, { authService }) => {
      validateLoginInput(input)
      return authService.login(input)
    },
  },
}
