import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { BadUserInputError } from "../utils/errors.js"

// This file defines the AuthService class, which encapsulates the business logic for user authentication, including registration and login.
export class AuthService {
  #userRepository
  #privateKey
  #saltRounds = 12

  constructor(userRepository, privateKey) {
    this.#userRepository = userRepository
    this.#privateKey = privateKey
  }

  async register({ email, password }) {
    const existingUser = await this.#userRepository.findByEmail(email)
    if (existingUser) {
      throw new BadUserInputError("Registration failed. Please try a different email or log in.")
    }

    const hashedPassword = await bcrypt.hash(password, this.#saltRounds)
    const user = await this.#userRepository.create({
      email,
      passwordHash: hashedPassword,
    })

    return { token: this.#generateToken(user), user: this.#toPublicUser(user) }
  }

  async login({ email, password }) {
    const user = await this.#userRepository.findByEmail(email)
    const passwordMatches =
      user && (await bcrypt.compare(password, user.passwordHash))

    if (!passwordMatches) {
      throw new BadUserInputError("Invalid credentials.")
    }

    return {
      token: this.#generateToken(user),
      user: this.#toPublicUser(user),
    }
  }

  #generateToken(user) {
    return jwt.sign({ userId: user.id, email: user.email }, this.#privateKey, {
      algorithm: "RS256",
      expiresIn: "1d",
      issuer: "salaryscope-api",
      audience: "salaryscope-client",
    })
  }

  #toPublicUser(user) {
    return { id: user.id, email: user.email, createdAt: user.createdAt }
  }
}
