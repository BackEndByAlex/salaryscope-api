# graphql/

Wires the GraphQL layer together. Contains the schema definitions, resolvers, and the composition root that builds the Apollo Server instance.

- `setup.js` — instantiates all repositories and services, loads all schema files, and exports `services` (for the request context) and `buildApolloServer` (creates the Apollo Server instance)
- `schema/` — GraphQL type definitions split by domain (see schema/README.md)
- `resolvers/` — resolver functions split by domain (see resolvers/README.md)
