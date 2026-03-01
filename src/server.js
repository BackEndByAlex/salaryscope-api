import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { expressMiddleware } from '@as-integrations/express5'
import { buildContext } from './auth/jwtMiddleware.js'
import { buildApolloServer, services } from './graphql/setup.js'

const PORT = process.env.PORT ?? 4000

const apolloServer = buildApolloServer()
await apolloServer.start()

const app = express()
app.use(cors())
app.use(express.json())

app.use(
  '/graphql',
  expressMiddleware(apolloServer, {
    context: async ({ req }) => ({
      ...buildContext({ req }),
      ...services,
    }),
  })
)

app.listen(PORT, () => {
  console.log(`GraphQL API ready at http://localhost:${PORT}/graphql`)
})
