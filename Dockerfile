FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code (excluding .env files)
COPY . .

# Create a default .env file for the build process
RUN echo "NODE_ENV=production" > .env
RUN echo "BENCHMARK_API_URL=http://localhost" >> .env

# Build the application
RUN npm run build

# Create a clean production build
RUN mkdir -p /app/production
RUN cp -r /app/dist /app/production/
RUN cp package*.json /app/production/

# Production stage
FROM node:20-alpine as production

# Install jq for JSON processing
RUN apk add --no-cache jq

# Set environment to production
ENV NODE_ENV=production
# Default benchmark API URL, to be overridden at deploy time
ENV BENCHMARK_API_URL=http://localhost

# Set working directory
WORKDIR /app

# Copy the prepared production build
COPY --from=builder /app/production /app

# Install production dependencies only
RUN npm ci --only=production

# Create directories for vite shims
RUN mkdir -p /app/node_modules/vite
RUN mkdir -p /app/node_modules/@vitejs/plugin-react

# Copy our Vite shims for production mode
COPY server/shimVite.js /app/node_modules/vite/index.js
COPY server/shimVitePluginReact.js /app/node_modules/@vitejs/plugin-react/index.js

# Set up environment variable to indicate we're in production/Docker
ENV IN_DOCKER=true

# Create a modified server/vite.ts that uses our shims in production mode
RUN echo 'import viteConfig from "../vite.config";' > /app/dist/vite-config-shim.js
COPY server/shimViteConfig.js /app/vite.config.js

# Expose the application port
EXPOSE 5000

# Start the application using our production server instead
CMD ["node", "dist/prodServer.js"]