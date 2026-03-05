import "dotenv/config"
import express from "express"
import cors from "cors"
import rateLimit from "express-rate-limit"
import { expressMiddleware } from "@as-integrations/express5"
import { buildContext } from "./auth/jwtMiddleware.js"
import { buildApolloServer, services } from "./graphql/setup.js"

const PORT = process.env.PORT

const apolloServer = buildApolloServer()
await apolloServer.start()

const app = express()
app.use(cors())
app.use(express.json())

// Global rate limit — covers all routes
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }))

app.use("/graphql", (req, res, next) => {
  // Reject JSON-batched requests — a single array body can contain hundreds of
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
