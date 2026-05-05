import path from "node:path";

/**
 * Absolute path to the monorepo `public/` (served at `/static/*`).
 * Uses `process.cwd()` (API package = `apps/api` in dev and in Docker) so it is
 * correct for the esbuild **single** `dist/index.js` output: in bundled code,
 * `import.meta.url` always refers to that file, and a `../` chain matched to the
 * *source* path (`src/modules/uploads/...`) would overshoot to `/public/*` on
 * the filesystem instead of `/app/public` with Dokploy’s `/app/public` volume.
 */
export function getRepoPublicDir(): string {
  return path.resolve(process.cwd(), "../../public");
}

export function getPublicUploadsDir(): string {
  return path.join(getRepoPublicDir(), "uploads");
}
