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

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine as production

# Set environment to production
ENV NODE_ENV=production
# Default benchmark API URL, to be overridden at deploy time
ENV BENCHMARK_API_URL=http://localhost

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Create necessary directory structure
RUN mkdir -p ./dist

# Copy built application from builder stage
COPY --from=builder /app/dist/index.js ./dist/index.js
COPY --from=builder /app/dist/public ./dist/public

# Expose the application port
EXPOSE 5000

# Start the application
CMD ["node", "dist/index.js"]