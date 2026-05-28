import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Keep the existing public/manifest.json — don't generate a second one
      manifest: false,
      // Workbox service-worker config
      workbox: {
        // Pre-cache all build assets for offline use
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,woff2}"],
        // Exclude large static assets that aren't needed for offline kiosk operation
        globIgnores: ["screenshots/**", "splash/**"],
        // Runtime caching for Supabase REST GETs only (network-first, 5 s timeout).
        // Scoped to /rest/v1/ to avoid caching /auth/v1/* tokens or RPC writes;
        // method GET filter prevents non-idempotent calls from being cached.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            method: "GET",
            options: {
              cacheName: "supabase-rest",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 },
            },
          },
        ],
        // Don't wait for old SW to unload — update immediately
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        // Enable SW in dev mode so it can be tested locally
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    sourcemap: false,
    // Manual chunking — keeps vendor code in separate, long-cacheable bundles
    // so iPads only re-download the small app chunk on every release.
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor":  ["react", "react-dom", "react/jsx-runtime"],
          "framer-motion": ["framer-motion"],
          "supabase":      ["@supabase/supabase-js"],
          "router":        ["react-router-dom"],
          "react-query":   ["@tanstack/react-query"],
          "radix":         ["@radix-ui/react-toast", "@radix-ui/react-tooltip"],
        },
      },
    },
    // The kiosk bundle is intentionally larger than 500 KB once code-split;
    // the warning isn't useful here.
    chunkSizeWarningLimit: 800,
  },
}));
