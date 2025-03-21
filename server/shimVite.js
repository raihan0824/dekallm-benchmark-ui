// This is a shim for Vite in production mode
// It provides mock implementations of the Vite functions used in server/vite.ts

export const createServer = async () => {
  return {
    middlewares: {
      use: () => {}
    }
  };
};

export const createLogger = () => {
  return {
    info: () => {},
    warn: () => {},
    error: () => {}
  };
};