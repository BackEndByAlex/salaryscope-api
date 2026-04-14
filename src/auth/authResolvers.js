import crypto from "crypto"
import {
  validateRegisterInput,
  validateLoginInput,
} from "../validators/authValidator.js"
import { assertAuthenticated } from "./authGuard.js"
import { BadUserInputError } from "../utils/errors.js"

const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000 // 10 minutes

function oauthStateCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    sameSite: "lax",
    maxAge: OAUTH_STATE_MAX_AGE_MS,
  }
}

function verifyOAuthState(req, res, cookieName, inputState) {
  const expected = req.signedCookies[cookieName]
  res.clearCookie(cookieName) // single-use regardless of outcome

  if (!expected) {
    throw new BadUserInputError("OAuth session expired or missing. Please start the login flow again.")
  }

  const a = Buffer.from(expected)
  const b = Buffer.from(inputState)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new BadUserInputError("OAuth state mismatch. Possible CSRF attack.")
  }
}

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
  User: {
    githubConnected: (parent) => parent.githubId != null,
    googleConnected: (parent) => parent.googleId != null,
  },
  Query: {
    me: (_, __, { user, userService }) => {
      assertAuthenticated(user)
      return userService.getById(user.id)
    },
  },
  Mutation: {
    register: async (_, { input }, { authService, res }) => {
      validateRegisterInput(input)
      const { token, user } = await authService.register(input)
      setAuthCookie(res, token)
      return { user }
    },
    login: async (_, { input }, { authService, res }) => {
      validateLoginInput(input)
      const { token, user } = await authService.login(input)
      setAuthCookie(res, token)
      return { user }
    },
    beginGoogleLogin: (_, { input }, { res }) => {
      const state = crypto.randomBytes(32).toString("hex")
      res.cookie("oauth_google_state", state, oauthStateCookieOptions())

      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth")
      url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID)
      url.searchParams.set("redirect_uri", process.env.GOOGLE_REDIRECT_URI)
      url.searchParams.set("response_type", "code")
      url.searchParams.set("scope", "openid email")
      url.searchParams.set("state", state)
      url.searchParams.set("code_challenge", input.codeChallenge)
      url.searchParams.set("code_challenge_method", "S256")

      return { authUrl: url.toString() }
    },
    googleLogin: async (_, { input }, { googleOAuthService, req, res }) => {
      verifyOAuthState(req, res, "oauth_google_state", input.state)
      const { token, user } = await googleOAuthService.login({
        code: input.code,
        codeVerifier: input.codeVerifier,
      })
      setAuthCookie(res, token)
      return { user }
    },
    beginGithubLogin: (_, { input }, { res }) => {
      const state = crypto.randomBytes(32).toString("hex")
      res.cookie("oauth_github_state", state, oauthStateCookieOptions())

      const url = new URL("https://github.com/login/oauth/authorize")
      url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID)
      url.searchParams.set("redirect_uri", process.env.GITHUB_REDIRECT_URI)
      url.searchParams.set("scope", "user:email")
      url.searchParams.set("state", state)
      url.searchParams.set("code_challenge", input.codeChallenge)
      url.searchParams.set("code_challenge_method", "S256")

      return { authUrl: url.toString() }
    },
    githubLogin: async (_, { input }, { githubOAuthService, req, res }) => {
      verifyOAuthState(req, res, "oauth_github_state", input.state)
      const { token, user } = await githubOAuthService.login({
        code: input.code,
        codeVerifier: input.codeVerifier,
      })
      setAuthCookie(res, token)
      return { user }
    },
    logout: (_, __, { res }) => {
      res.clearCookie("token", { path: "/" })
      return true
    },
  },
}
