import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { GraphQLError } from "graphql"

export class AuthService {
  #userRepository
  #jwtSecret
  #saltRounds = 12

  constructor(userRepository, jwtSecret) {
    this.#userRepository = userRepository
    this.#jwtSecret = jwtSecret
  }

  async register({ email, password }) {
    // last-resort guard — validator should catch this first, but bcrypt.hash accepts empty strings
    if (!email || !password)
      throw new GraphQLError("Email and password are required.", {
        extensions: { code: "BAD_USER_INPUT" },
      })

    const existingUser = await this.#userRepository.findByEmail(email)
    if (existingUser) {
      throw new GraphQLError("Email is already registered.", {
        extensions: { code: "BAD_USER_INPUT" },
      })
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
      throw new GraphQLError("Email and password are required.", {
        extensions: { code: "BAD_USER_INPUT" },
      })

    const user = await this.#userRepository.findByEmail(email)
    const passwordMatches =
      user && (await bcrypt.compare(password, user.passwordHash))

    // Deliberately vague — never reveal whether email or password was wrong.
    if (!passwordMatches) {
      throw new GraphQLError("Invalid credentials.", {
        extensions: { code: "BAD_USER_INPUT" },
      })
    }

    return {
      token: this.#generateToken(user),
      user: this.#toPublicUser(user),
    }
  }

  #generateToken(user) {
    return jwt.sign({ userId: user.id, email: user.email }, this.#jwtSecret, {
      expiresIn: "1d",
    })
  }

  #toPublicUser(user) {
    return { id: user.id, email: user.email, createdAt: user.createdAt }
  }
}
