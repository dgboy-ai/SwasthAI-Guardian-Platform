# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ── Stage 2: Production Runtime ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

ENV NODE_ENV=production

# Copy only production deps and source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create data directory for SQLite volume mount
RUN mkdir -p /app/data

EXPOSE 5000

# Use non-root user for security
RUN addgroup -S swasthai && adduser -S swasthai -G swasthai
USER swasthai

CMD ["node", "server.js"]
