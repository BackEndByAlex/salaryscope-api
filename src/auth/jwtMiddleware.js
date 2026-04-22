import jwt from "jsonwebtoken"
import { publicKey } from "../config/keys.js"

function extractToken(req) {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length)
  }

  const cookieHeader = req.headers.cookie ?? ""
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function buildContext({ req }) {
  const token = extractToken(req)

  if (!token) return { user: null }

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
