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
# First, build just the client to ensure front-end assets are created
RUN cd client && npx vite build
# Check where client files were created
RUN echo "After client build:"
RUN find /app -name "index.html" || echo "No index.html found after client build"
RUN ls -la /app/client/dist || echo "No client/dist directory"
# Then run the full build
RUN npm run build

# Create a clean production build with proper structure
RUN mkdir -p /app/production
# Copy server dist files
RUN cp -r /app/dist /app/production/

# Ensure client files are in the right place
# Vite output should be in dist/client, not client/dist
RUN mkdir -p /app/production/client/dist

# Check where the client files actually are after the build
RUN ls -la /app/dist
RUN ls -la /app || echo "No /app directory" 
RUN find /app -name "index.html" || echo "No index.html found"

# Copy client files - check all possible locations
RUN if [ -d "/app/client/dist" ]; then \
      # Copy from client/dist (from the direct client build)
      mkdir -p /app/production/client/dist; \
      cp -r /app/client/dist/* /app/production/client/dist/; \
      echo "Copied from /app/client/dist to /app/production/client/dist"; \
    elif [ -d "/app/dist/public" ]; then \
      # Copy from dist/public (from vite.config.ts)
      mkdir -p /app/production/client/dist; \
      cp -r /app/dist/public/* /app/production/client/dist/; \
      echo "Copied from /app/dist/public to /app/production/client/dist"; \
      # Also create a copy in the original location for backward compatibility
      mkdir -p /app/production/dist/public; \
      cp -r /app/dist/public/* /app/production/dist/public/; \
    elif [ -d "/app/dist/client" ]; then \
      # Copy from dist/client
      mkdir -p /app/production/client/dist; \
      cp -r /app/dist/client/* /app/production/client/dist/; \
      echo "Copied from /app/dist/client to /app/production/client/dist"; \
    elif [ -d "/app/dist/assets" ]; then \
      # Copy from dist root if it has assets
      mkdir -p /app/production/client/dist/assets; \
      cp -r /app/dist/assets /app/production/client/dist/; \
      cp /app/dist/index.html /app/production/client/dist/ || echo "No index.html in /app/dist"; \
      echo "Copied assets and index.html to /app/production/client/dist"; \
    else \
      echo "Client files not found in expected locations"; \
      mkdir -p /app/production/client/dist; \
      echo "<html><body>Placeholder - client files not found during build</body></html>" > /app/production/client/dist/index.html; \
    fi

# Create a linked directory for better compatibility
RUN mkdir -p /app/production/dist
RUN ln -sf /app/production/client/dist /app/production/dist/client
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

# Check directory structure for debugging
RUN echo "Docker production environment file structure:"
RUN find /app -type d | sort
RUN echo "Checking for index.html files:"
RUN find /app -name "index.html" | sort

# Copy our production server file (CommonJS version)
COPY server/prodServer.cjs /app/dist/prodServer.cjs

# Expose the application port
EXPOSE 5000

# Start the application using our production server
CMD ["node", "dist/prodServer.cjs"]