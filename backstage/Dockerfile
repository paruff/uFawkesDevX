# uFawkesDevX Backstage image — DX-002
#
# Packaging-only image for the Yarn 4 app scaffolded by @backstage/create-app
# (https://backstage.io/docs/deployment/docker#host-build). Build the bundle on
# the host first; `make backstage-bundle` does it (Node 22 or 24):
#
#   yarn install --immutable && yarn tsc && yarn build:backend
#
# The full dependency install and TypeScript build are too heavy for a small
# Docker VM, so only the production install runs here.

FROM node:24-trixie-slim

# better-sqlite3 falls back to a source build when no prebuilt binary matches
RUN apt-get update && apt-get install -y --no-install-recommends python3 g++ make libsqlite3-dev curl \
    && rm -rf /var/lib/apt/lists/*

USER node
WORKDIR /app
ENV NODE_ENV=production

COPY --chown=node:node .yarn ./.yarn
COPY --chown=node:node .yarnrc.yml backstage.json ./
COPY --chown=node:node yarn.lock package.json packages/backend/dist/skeleton.tar.gz ./
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz
RUN yarn workspaces focus --all --production && rm -rf "$(yarn cache clean)"

COPY --chown=node:node packages/backend/dist/bundle.tar.gz ./
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz
COPY --chown=node:node app-config.yaml ./
COPY --chown=node:node catalog ./catalog

# /data is mounted from the backstage-data volume (SQLite files, see app-config.yaml)
USER root
RUN mkdir -p /data && chown node:node /data
USER node

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:7007/.backstage/health/v1/liveness || exit 1

EXPOSE 7007
CMD ["node", "packages/backend", "--config", "app-config.yaml"]
