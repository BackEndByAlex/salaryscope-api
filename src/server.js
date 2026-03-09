import "dotenv/config"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import { expressMiddleware } from "@as-integrations/express5"
import { buildContext } from "./auth/jwtMiddleware.js"
import { buildApolloServer, services } from "./graphql/setup.js"

const PORT = process.env.PORT

// Requests with no Origin header (Postman, server-to-server) are allowed.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "").split(",").filter(Boolean)

const apolloServer = buildApolloServer()
await apolloServer.start()

const app = express()

// Set to 1 to trust only the first proxy (Caddy)
app.set('trust proxy', 1)

// CSP is disabled — Apollo Sandbox uses inline scripts that a strict CSP would block.
app.use(helmet({ contentSecurityPolicy: false }))

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no Origin (Postman, curl, server-to-server calls)
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      callback(new Error(`CORS: origin "${origin}" is not allowed.`))
    },
  }),
)

app.use(express.json({ limit: "100kb" }))

// Global rate limit
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }))

app.use("/graphql", (req, res, next) => {
  // Reject JSON-batched requests:
  // REASON:
  // A single array body can contain hundreds of
  // login mutations, bypassing per-request rate limits entirely
  if (Array.isArray(req.body)) {
    return res.status(400).json({ error: "Batched requests are not allowed." })
  }
  next()
})

// Strict limit on auth operations — 10 attempts per 15 min per IP
const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false })

app.use("/graphql", (req, res, next) => {
  const op = req.body?.operationName
  if (op === "Login" || op === "Register") return authRateLimit(req, res, next)
  next()
})

app.use(
  "/graphql",
  expressMiddleware(apolloServer, {
    context: async ({ req }) => ({
      ...buildContext({ req }),
      ...services,
    }),
  }),
)

app.listen(PORT, () => {
  console.log(`GraphQL API ready at http://localhost:${PORT}/graphql`)
})
