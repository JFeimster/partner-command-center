import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const publicDir = join(root, "public");
const copiedDirectories = [
  "assets",
  "styles",
  "scripts",
  "dashboard",
  "developers",
  "tools",
  "widgets",
  "welcome",
  "admin",
  "data",
];
const excludedHtmlFiles = new Set();

await rm(publicDir, { recursive: true, force: true });
await mkdir(publicDir, { recursive: true });

for (const directory of copiedDirectories) {
  const source = join(root, directory);
  try {
    if ((await stat(source)).isDirectory()) {
      await cp(source, join(publicDir, directory), { recursive: true, force: true });
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  if (!/\.(?:html|css|js|xml|txt|webmanifest)$/i.test(entry.name)) continue;
  if (excludedHtmlFiles.has(entry.name)) continue;
  await cp(join(root, entry.name), join(publicDir, basename(entry.name)), { force: true });
}

console.log("Prepared the legacy static routes and assets for the Next.js deployment.");
