# Fieldhouse Web — Cloud Run Production Build
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json packages/types/
COPY packages/validators/package.json packages/validators/
COPY packages/stats-engine/package.json packages/stats-engine/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

# Builder
FROM base AS builder
COPY --from=deps /app/ ./
COPY packages/ packages/
COPY apps/web/ apps/web/
COPY tsconfig.base.json ./

ENV NEXT_TELEMETRY_DISABLED=1
# Build-time placeholder values (overridden at runtime)
ENV NEXT_PUBLIC_SUPABASE_URL=https://dxhusmlvdonlgornovfa.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4aHVzbWx2ZG9ubGdvcm5vdmZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODAwNTcsImV4cCI6MjA5MDU1NjA1N30.vvAaNdLCcjp5ixM1rMNMBqwv0_7zNC4N40R4deCoTNs

WORKDIR /app/apps/web
RUN npx next build

# Runner
FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
