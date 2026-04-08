/**
 * Load monorepo root `.env` before any other module reads `process.env`.
 * `tsx`/Node `--env-file` may run after imports that call `getEnv()`; this is deterministic.
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(here, "../../../.env") });
