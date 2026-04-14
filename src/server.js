import "dotenv/config"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import rateLimit from "express-rate-limit"
import { expressMiddleware } from "@as-integrations/express5"
import { buildContext } from "./auth/jwtMiddleware.js"
import { buildApolloServer, createServices } from "./graphql/setup.js"

const PORT = process.env.PORT
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const GENERAL_RATE_LIMIT_MAX = 500
const AUTH_RATE_LIMIT_MAX = 10
const AUTH_OPERATIONS = ["Login", "Register"]

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .filter(Boolean)

function corsOriginValidator(origin, callback) {
  if (!origin) return callback(null, true)
  if (allowedOrigins.includes(origin)) return callback(null, true)
  callback(new Error(`CORS: origin "${origin}" is not allowed.`))
}

function blockBatchedRequests(req, res, next) {
  if (Array.isArray(req.body)) {
    return res.status(400).json({ error: "Batched requests are not allowed." })
  }
  next()
}

function applyAuthRateLimit(authRateLimit) {
  return (req, res, next) => {
    const op = req.body?.operationName
    const query = req.body?.query ?? ""

    const isAuthOperation =
      AUTH_OPERATIONS.includes(op) || /\b(login|register)\b/i.test(query)

    if (isAuthOperation) return authRateLimit(req, res, next)
    next()
  }
}

try {
  const apolloServer = buildApolloServer()
  await apolloServer.start()

  const services = createServices()
  const app = express()

  app.set("trust proxy", 1)

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://embeddable-sandbox.cdn.apollographql.com",
          ],
          frameSrc: ["'self'", "https://sandbox.embed.apollographql.com"],
          connectSrc: ["'self'", "https://*.apollographql.com"],
          imgSrc: [
            "'self'",
            "data:",
            "https://apollo-server-landing-page.cdn.apollographql.com",
          ],
        },
      },
    }),
  )
  app.use(cors({ origin: corsOriginValidator, credentials: true }))
  app.use(cookieParser(process.env.COOKIE_SECRET))
  app.use(express.json({ limit: "100kb" }))
  app.use(
    rateLimit({
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: GENERAL_RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  )


  app.use("/graphql", blockBatchedRequests)
  app.use(
    "/graphql",
    applyAuthRateLimit(
      rateLimit({
        windowMs: RATE_LIMIT_WINDOW_MS,
        max: AUTH_RATE_LIMIT_MAX,
        standardHeaders: true,
        legacyHeaders: false,
      }),
    ),
  )

  app.use(
    "/graphql",
    expressMiddleware(apolloServer, {
      context: async ({ req, res }) => ({
        ...buildContext({ req }),
        req,
        res,
        ...services,
      }),
    }),
  )

  app.listen(PORT, () => {
    console.log(`GraphQL API ready at http://localhost:${PORT}/graphql`)
  })
} catch (error) {
  console.error("Failed to start server:", error)
  process.exit(1)
}
