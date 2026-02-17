FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies (including dev for build)
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile 2>/dev/null || bun install

# Build the application with SWC
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production image - minimal footprint
FROM base AS production
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --production --frozen-lockfile 2>/dev/null || bun install --production

COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "run", "dist/main.js"]
