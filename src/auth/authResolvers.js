import {
  validateRegisterInput,
  validateLoginInput,
} from "../validators/authValidator.js"
import { assertAuthenticated } from "./authGuard.js"

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
