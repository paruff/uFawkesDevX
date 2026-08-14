# uFawkesDevX Backstage image — DX-002
#
# NEW PREREQUISITE (not yet resolved — see plan.md P-list):
#   This directory has no Backstage app source yet (no packages/backend,
#   no yarn.lock). There is no official prebuilt `backstage/backstage` image
#   on Docker Hub — Backstage's own docs require building from a scaffolded
#   app (https://backstage.io/docs/deployment/docker/). Run
#   `npx @backstage/create-app@latest` in this directory before `docker
#   compose build` will succeed. This Dockerfile follows the pattern that
#   scaffold produces (packages/backend/Dockerfile) so it's ready once that
#   lands; it is not runnable against an empty backstage/ directory.
#
# Multi-stage: build the backend bundle, then run it on a slim runtime image.

FROM node:20-bookworm-slim AS build

WORKDIR /app
COPY package.json yarn.lock ./
COPY packages/backend/package.json packages/backend/
RUN yarn install --frozen-lockfile --network-timeout 600000

COPY . .
RUN yarn build:backend --config app-config.yaml

FROM node:20-bookworm-slim AS runtime

WORKDIR /app
COPY --from=build /app/packages/backend/dist/bundle.tar.gz .
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz

COPY app-config.yaml /app/app-config.yaml

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:7007/healthcheck || exit 1

EXPOSE 7007
CMD ["node", "packages/backend", "--config", "app-config.yaml"]
