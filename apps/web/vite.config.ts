import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

/** Monorepo root so `VITE_*` from `<repo>/.env` is loaded (same file as the API uses). */
const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig({
  envDir: monorepoRoot,
  server: {
    /** Listen on all interfaces so both `localhost` and `127.0.0.1` work in dev. */
    host: true,
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": { target: "http://127.0.0.1:3001", changeOrigin: true },
      "/static": { target: "http://127.0.0.1:3001", changeOrigin: true },
    },
  },
  plugins: [
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});
