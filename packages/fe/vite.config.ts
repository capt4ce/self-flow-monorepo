import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@self-flow/common": path.resolve(__dirname, "../common"),
      "@self-flow/common/types": path.resolve(__dirname, "../common/types"),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Proxy API requests to the backend server to avoid CORS issues
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
        secure: false,
        // Preserve the /api prefix when forwarding to backend
        rewrite: (path) => path,
      },
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes("node_modules")) {
            return;
          }

          const isPackage = (pkg: string) =>
            id.includes(`node_modules/${pkg}/`) ||
            id.endsWith(`node_modules/${pkg}`);

          if (
            isPackage("react") ||
            isPackage("react-dom") ||
            isPackage("scheduler")
          ) {
            return "vendor-react";
          }

          if (id.includes("@radix-ui")) {
            return "vendor-react";
          }

          if (id.includes("react-router") || id.includes("react-router-dom")) {
            return "vendor-router";
          }

          if (
            id.includes("date-fns") ||
            id.includes("react-day-picker") ||
            id.includes("lucide-react")
          ) {
            return "vendor-date-charts";
          }

          if (
            id.includes("@hello-pangea/dnd") ||
            id.includes("cmdk") ||
            id.includes("@stackframe/react") ||
            id.includes("embla-carousel-react")
          ) {
            return "vendor-ui-extras";
          }

          if (id.includes("react-hook-form")) {
            return "vendor-forms";
          }

          return "vendor";
        },
      },
    },
  },
});
