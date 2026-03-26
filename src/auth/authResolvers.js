import {
  validateRegisterInput,
  validateLoginInput,
} from "../validators/authValidator.js"
import { assertAuthenticated } from "./authGuard.js"

const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000

function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: TOKEN_MAX_AGE_MS,
    path: "/",
  })
}

export const authResolvers = {
  Query: {
    me: (_, __, { user, userService }) => {
      assertAuthenticated(user)
      return userService.getById(user.id)
    },
  },
  Mutation: {
    register: async (_, { input }, { authService, res }) => {
      validateRegisterInput(input)
      const result = await authService.register(input)
      setAuthCookie(res, result.token)
      return result
    },
    login: async (_, { input }, { authService, res }) => {
      validateLoginInput(input)
      const result = await authService.login(input)
      setAuthCookie(res, result.token)
      return result
    },
    logout: (_, __, { res }) => {
      res.clearCookie("token", { path: "/" })
      return true
    },
  },
}
