# Official Node.js 24.18.0 / Debian bookworm-slim; validated locally on arm64.
FROM node@sha256:b31e7a42fdf8b8aa5f5ed477c72d694301273f1069c5a2f71d53c6482e99a2fc AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build && npm test && npm prune --omit=dev --ignore-scripts

FROM node@sha256:b31e7a42fdf8b8aa5f5ed477c72d694301273f1069c5a2f71d53c6482e99a2fc AS runtime
ENV NODE_ENV=production KDP_ENV=production PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json /app/kdp.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/server/index.js"]
