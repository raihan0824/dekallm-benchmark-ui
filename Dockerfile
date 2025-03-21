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

# Create a package.json that explicitly includes vite as a production dependency
RUN cat package.json | jq '.dependencies.vite = .devDependencies.vite | .dependencies["@vitejs/plugin-react"] = .devDependencies["@vitejs/plugin-react"]' > /tmp/package.json && mv /tmp/package.json package.json

# Install production dependencies (now including vite)
RUN npm ci --only=production

# Expose the application port
EXPOSE 5000

# Start the application
CMD ["node", "dist/index.js"]