import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vibeli from "@vibeli/vite-plugin";
import path from "node:path";

export default defineConfig({
  // vibeli() precedes react(): generates ./.vibeli types from entities/*.json
  // and injects the bootstrap (appId/gatewayUrl/contractVersion). The notifier
  // flags below reserve the dev-only editor bridge (apply:'serve', never in the
  // prod bundle); the bridge hooks themselves are not implemented yet.
  plugins: [
    vibeli({
      codegen: true,
      zodValidators: true,
      hmrNotifier: true,
      navigationNotifier: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
});
