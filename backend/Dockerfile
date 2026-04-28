# syntax=docker/dockerfile:1

# ======= BASE =======
FROM node:20-alpine AS base
# libc6-compat necessário para alguns binários nativos (Next.js + Prisma)
RUN apk add --no-cache libc6-compat openssl

# ======= DEPS =======
# Instala apenas as dependências, incluindo geração do Prisma Client
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

# ======= BUILDER =======
# Compila o código Next.js em modo standalone
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ======= RUNNER =======
# Imagem final e enxuta, apenas o necessário para rodar
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Prisma Client gerado
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Arquivos públicos
COPY --from=builder /app/public ./public

# Build standalone do Next.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3001

CMD ["node", "server.js"]