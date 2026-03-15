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
    if (!email || !password)
      throw new BadUserInputError("Email and password are required.")

    const existingUser = await this.#userRepository.findByEmail(email)
    if (existingUser) {
      throw new BadUserInputError("Email is already registered.")
    }

    const hashedPassword = await bcrypt.hash(password, this.#saltRounds)
    const user = await this.#userRepository.create({
      email,
      passwordHash: hashedPassword,
    })

    return { token: this.#generateToken(user), user: this.#toPublicUser(user) }
  }

  async login({ email, password }) {
    if (!email || !password)
      throw new BadUserInputError("Email and password are required.")

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
    })
  }

  #toPublicUser(user) {
    return { id: user.id, email: user.email, createdAt: user.createdAt }
  }
}
