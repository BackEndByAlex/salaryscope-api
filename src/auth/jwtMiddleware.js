import jwt from "jsonwebtoken"

export function buildContext({ req }) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null }
  }

  const token = authHeader.slice("Bearer ".length)

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    // jwt.verify can return a string if the token was signed with a string payload
    if (typeof payload !== "object" || payload === null) return { user: null }
    return { user: { id: payload.userId, email: payload.email } }
  } catch {
    // A bad token is not a server error — controllers decide what to do with user: null
    return { user: null }
  }
}
