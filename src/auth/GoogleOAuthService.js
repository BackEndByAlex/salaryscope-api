import jwt from "jsonwebtoken"
import { BadUserInputError } from "../utils/errors.js"

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

export class GoogleOAuthService {
  #userRepository
  #privateKey
  #clientId
  #clientSecret
  #redirectUri

  constructor(userRepository, privateKey) {
    this.#userRepository = userRepository
    this.#privateKey = privateKey
    this.#clientId = process.env.GOOGLE_CLIENT_ID
    this.#clientSecret = process.env.GOOGLE_CLIENT_SECRET
    this.#redirectUri = process.env.GOOGLE_REDIRECT_URI
  }

  async login({ code, codeVerifier }) {
    const accessToken = await this.#exchangeCode(code, codeVerifier)
    const { googleId, email } = await this.#fetchGoogleProfile(accessToken)

    let user = await this.#userRepository.findByGoogleId(googleId)

    if (!user) {
      const existingByEmail = await this.#userRepository.findByEmail(email)
      if (existingByEmail) {
        user = await this.#userRepository.linkGoogleId(existingByEmail.id, googleId)
      } else {
        user = await this.#userRepository.createGoogleUser({ email, googleId })
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
      grant_type: "authorization_code",
      ...(codeVerifier && { code_verifier: codeVerifier }),
    })

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })

    const data = await response.json()

    if (data.error) {
      throw new BadUserInputError(`Google OAuth error: ${data.error_description ?? data.error}`)
    }

    return data.access_token
  }

  async #fetchGoogleProfile(accessToken) {
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const user = await response.json()

    if (!user.sub) {
      throw new BadUserInputError("Failed to retrieve Google profile.")
    }

    if (!user.email || !user.email_verified) {
      throw new BadUserInputError(
        "No verified email found on your Google account.",
      )
    }

    return { googleId: user.sub, email: user.email }
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
