import jwt from "jsonwebtoken"
import { publicKey } from "../config/keys.js"

export function buildContext({ req }) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null }
  }

  const token = authHeader.slice("Bearer ".length)

  try {
    const payload = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
      issuer: "salaryscope-api",
      audience: "salaryscope-client",
    })
    if (typeof payload !== "object" || payload === null) return { user: null }
    return { user: { id: payload.userId, email: payload.email } }
  } catch {
    return { user: null }
  }
}
