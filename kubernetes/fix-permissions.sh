#!/bin/bash

# This script fixes permissions and ensures client files are available
# Run this if you encounter permission errors in the container logs

# Check and fix /app/dist directory permissions
echo "Fixing permissions..."
if [ -d "/app/dist" ]; then
  chmod -R 755 /app/dist
  echo "Fixed permissions for /app/dist"
fi

if [ -d "/app/client/dist" ]; then
  chmod -R 755 /app/client/dist
  echo "Fixed permissions for /app/client/dist"
fi

# Create any missing directories with proper permissions
echo "Creating missing directories..."
mkdir -p /app/dist/client
mkdir -p /app/dist/public
chmod -R 755 /app/dist

# Check if client files exist and copy them to other locations
echo "Checking for client files..."
if [ -d "/app/client/dist" ] && [ -f "/app/client/dist/index.html" ]; then
  echo "Found client files in /app/client/dist, copying to other locations"
  cp -rf /app/client/dist/* /app/dist/client/
  cp -rf /app/client/dist/* /app/dist/public/
  echo "Files copied successfully"
elif [ -d "/app/dist/public" ] && [ -f "/app/dist/public/index.html" ]; then
  echo "Found client files in /app/dist/public, copying to client/dist"
  mkdir -p /app/client/dist
  cp -rf /app/dist/public/* /app/client/dist/
  echo "Files copied successfully"
fi

# Verify files exist in required locations
echo "Verifying files..."
if [ -f "/app/client/dist/index.html" ]; then
  echo "✓ Client files exist in /app/client/dist"
else
  echo "✗ Missing index.html in /app/client/dist"
fi

if [ -f "/app/dist/public/index.html" ]; then
  echo "✓ Client files exist in /app/dist/public"
else
  echo "✗ Missing index.html in /app/dist/public"
fi

if [ -f "/app/dist/client/index.html" ]; then
  echo "✓ Client files exist in /app/dist/client"
else
  echo "✗ Missing index.html in /app/dist/client"
fi

echo "Fix completed"