import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { BadUserInputError } from "../utils/errors.js"

export class AuthService {
  #userRepository
  #privateKey
  #saltRounds = 12

  constructor(userRepository, privateKey) {
    this.#userRepository = userRepository
    this.#privateKey = privateKey
  }

  async register({ email, password }) {
    // last-resort guard — validator should catch this first, but bcrypt.hash accepts empty strings
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

    // user is already safe — UserRepository.create omits passwordHash via Prisma's omit
    return { token: this.#generateToken(user), user }
  }

  async login({ email, password }) {
    // last-resort guard — validator should catch this first, but bcrypt.compare accepts empty strings
    if (!email || !password)
      throw new BadUserInputError("Email and password are required.")

    const user = await this.#userRepository.findByEmail(email)
    const passwordMatches =
      user && (await bcrypt.compare(password, user.passwordHash))

    // Deliberately vague — never reveal whether email or password was wrong.
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
