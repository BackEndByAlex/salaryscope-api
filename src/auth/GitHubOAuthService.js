import jwt from "jsonwebtoken"
import { BadUserInputError } from "../utils/errors.js"

const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
const GITHUB_USER_URL = "https://api.github.com/user"
const GITHUB_EMAILS_URL = "https://api.github.com/user/emails"

export class GitHubOAuthService {
  #userRepository
  #privateKey
  #clientId
  #clientSecret
  #redirectUri

  constructor(userRepository, privateKey) {
    this.#userRepository = userRepository
    this.#privateKey = privateKey
    this.#clientId = process.env.GITHUB_CLIENT_ID
    this.#clientSecret = process.env.GITHUB_CLIENT_SECRET
    this.#redirectUri = process.env.GITHUB_REDIRECT_URI
  }

  async login({ code, codeVerifier, state }) {
    if (!state || typeof state !== "string" || state.trim().length === 0) {
      throw new BadUserInputError("Missing or invalid OAuth state parameter.")
    }
    const accessToken = await this.#exchangeCode(code, codeVerifier)
    const { githubId, email } = await this.#fetchGithubProfile(accessToken)

    let user = await this.#userRepository.findByGithubId(githubId)

    if (!user) {
      const existingByEmail = await this.#userRepository.findByEmail(email)
      if (existingByEmail) {
        // Email already registered — link GitHub to the existing account
        user = await this.#userRepository.linkGithubId(
          existingByEmail.id,
          githubId,
        )
      } else {
        user = await this.#userRepository.createGithubUser({ email, githubId })
      }
    }

    return { token: this.#generateToken(user), user }
  }

  async #exchangeCode(code, codeVerifier) {
    const body = new URLSearchParams({
      client_id: this.#clientId,
      client_secret: this.#clientSecret,
      code,
      redirect_uri: this.#redirectUri,
      ...(codeVerifier && { code_verifier: codeVerifier }),
    })

    const response = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    })

    const data = await response.json()

    if (data.error) {
      throw new BadUserInputError(
        `GitHub OAuth error: ${data.error_description ?? data.error}`,
      )
    }

    return data.access_token
  }

  async #fetchGithubProfile(accessToken) {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    }

    const [userRes, emailsRes] = await Promise.all([
      fetch(GITHUB_USER_URL, { headers }),
      fetch(GITHUB_EMAILS_URL, { headers }),
    ])

    const [user, emails] = await Promise.all([userRes.json(), emailsRes.json()])

    if (!user.id) {
      throw new BadUserInputError("Failed to retrieve GitHub profile.")
    }

    // Pick the primary verified email, fall back to the public profile email
    const primaryEmail =
      emails.find((e) => e.primary && e.verified)?.email ?? user.email

    if (!primaryEmail) {
      throw new BadUserInputError(
        "No verified email found on your GitHub account. Please add a verified email in GitHub settings.",
      )
    }

    return { githubId: String(user.id), email: primaryEmail }
  }

  #generateToken(user) {
    return jwt.sign({ userId: user.id, email: user.email }, this.#privateKey, {
      algorithm: "RS256",
      expiresIn: "1d",
      issuer: "salaryscope-api",
      audience: "salaryscope-client",
    })
  }
}
