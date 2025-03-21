// This is a shim for @vitejs/plugin-react in production mode
// It provides a mock implementation

export default function reactPlugin() {
  return {
    name: 'react-shim'
  };
}