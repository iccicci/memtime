import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const port = parseInt(process.env.PORT!);

export default defineConfig({
  build: {
    outDir:    "dist",
    sourcemap: process.env.STAGE !== "prod",
    target:    "es2020"
  },
  clearScreen: false,
  plugins:     [react()],
  server:      {
    headers: { "Cross-Origin-Embedder-Policy": "credentialless", "Cross-Origin-Opener-Policy": "same-origin" },
    hmr:     { overlay: false },
    port:    port + 1,
    proxy:   { "/api": { target: `http://localhost:${port}/` } }
  }
});
