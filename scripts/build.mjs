import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await Promise.all([
  cp(resolve(root, "src/manifest.json"), resolve(dist, "manifest.json")),
  cp(resolve(root, "src/popup/popup.html"), resolve(dist, "popup.html")),
  cp(resolve(root, "src/options/options.html"), resolve(dist, "options.html")),
  cp(resolve(root, "src/ui/styles.css"), resolve(dist, "styles.css"))
]);

const common = {
  bundle: true,
  minify: true,
  sourcemap: true,
  target: "chrome116",
  platform: "browser",
  logLevel: "info"
};

await Promise.all([
  build({
    ...common,
    entryPoints: [resolve(root, "src/content/index.ts")],
    outfile: resolve(dist, "content.js"),
    format: "iife"
  }),
  build({
    ...common,
    entryPoints: [resolve(root, "src/popup/index.ts")],
    outfile: resolve(dist, "popup.js"),
    format: "iife"
  }),
  build({
    ...common,
    entryPoints: [resolve(root, "src/options/index.ts")],
    outfile: resolve(dist, "options.js"),
    format: "iife"
  })
]);
