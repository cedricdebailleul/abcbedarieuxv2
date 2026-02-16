# Utiliser Node.js LTS
FROM node:20-alpine AS base

# Installer pnpm avec cache
RUN npm install -g pnpm && npm cache clean --force

# Installer les dépendances seulement quand nécessaire
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copier les fichiers de configuration pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/

# Installer les dépendances avec optimisations
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline

# Builder l'application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Nettoyer les fichiers Prisma générés localement
RUN rm -rf lib/generated/prisma

# OPTIMISATIONS MÉMOIRE AJOUTÉES
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1

# Générer Prisma client et builder avec gestion mémoire
RUN pnpm prisma generate && \
    NODE_OPTIONS="--max-old-space-size=4096" \
    NEXT_TELEMETRY_DISABLED=1 \
    pnpm run build

# Image de production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/lib/generated ./lib/generated

# Créer le dossier uploads avec les bonnes permissions
RUN mkdir -p ./public/uploads && chown -R nextjs:nodejs ./public/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Commande pour démarrer l'application
CMD ["node", "server.js"]
