FROM node:18-alpine

WORKDIR /app

# Install Docker CLI for managing containers
RUN apk add --no-cache docker-cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create plugin directory
RUN mkdir -p /plugins

# Expose port
EXPOSE 8083

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the service
CMD ["node", "server.js"]
