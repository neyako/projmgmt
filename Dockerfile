# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

COPY package.json package-lock.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npm ci

FROM deps AS builder

ARG DATABASE_URL="file:./build.db"
ARG NEXTAUTH_URL="http://localhost:3000"
ARG NEXTAUTH_SECRET="docker-build-secret"
ARG NEXT_PUBLIC_NAS_IP=""
ARG NEXT_PUBLIC_NAS_SHARE=""
ARG NEXT_PUBLIC_NAS_ROOT_DIR=""

ENV DATABASE_URL=${DATABASE_URL}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXT_PUBLIC_NAS_IP=${NEXT_PUBLIC_NAS_IP}
ENV NEXT_PUBLIC_NAS_SHARE=${NEXT_PUBLIC_NAS_SHARE}
ENV NEXT_PUBLIC_NAS_ROOT_DIR=${NEXT_PUBLIC_NAS_ROOT_DIR}

COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev && npm cache clean --force

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL="file:/app/data/projmgmt.db"
ENV PRISMA_DB_PUSH=true

RUN apt-get update \
  && apt-get install -y --no-install-recommends gosu \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && mkdir -p /app/data /app/public/avatars \
  && chown -R nextjs:nodejs /app

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./package-lock.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint

RUN chmod +x /usr/local/bin/docker-entrypoint

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint"]
CMD ["node", "server.js"]
