# Stage 1: deps
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma

RUN npm ci --omit=dev


# Stage 2: runtime
FROM node:20-alpine AS runtime

WORKDIR /app

# A root process that escapes container isolation can write to the host filesystem.
# Running as a dedicated non-root user limits the blast radius of a compromised process.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY prisma/ ./prisma/
COPY src/ ./src/

COPY package.json ./

COPY prisma.config.mjs ./

RUN DATABASE_URL=postgresql://build:build@build:5432/build npx prisma generate

# The private key is injected at runtime via Docker secrets
RUN mkdir -p keys && chown -R appuser:appgroup /app

USER appuser

EXPOSE 4000

CMD ["node", "src/server.js"]
