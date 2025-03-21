// This is a shim for vite.config.ts in production mode
export default {
  plugins: [],
  server: {
    // Default values that won't be used in production
    host: '0.0.0.0',
    port: 5173
  }
};