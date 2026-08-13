FROM node:18-alpine

WORKDIR /app

# Install score-compose CLI (used by server.js to generate docker-compose
# manifests from Score specs — see docs/score-integration.md)
ARG SCORE_COMPOSE_VERSION=0.45.0
ARG TARGETARCH
RUN apk add --no-cache curl && \
    curl -fsSL -o /tmp/score-compose.tar.gz \
      "https://github.com/score-spec/score-compose/releases/download/${SCORE_COMPOSE_VERSION}/score-compose_${SCORE_COMPOSE_VERSION}_linux_${TARGETARCH}.tar.gz" && \
    tar -xzf /tmp/score-compose.tar.gz -C /usr/local/bin score-compose && \
    chmod +x /usr/local/bin/score-compose && \
    rm /tmp/score-compose.tar.gz && \
    apk del curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create directories
RUN mkdir -p /app/specs /app/plugins

# Expose ports
EXPOSE 8081 8082

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the service
CMD ["node", "server.js"]
