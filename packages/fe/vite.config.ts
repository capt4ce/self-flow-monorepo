import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@self-flow/common': path.resolve(__dirname, '../common'),
      '@self-flow/common/types': path.resolve(__dirname, '../common/types'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Proxy API requests to the backend server to avoid CORS issues
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
        // Preserve the /api prefix when forwarding to backend
        rewrite: (path) => path,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});

