import { cp, mkdir, readdir, stat } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const publicDir = resolve(root, "public");
if (!publicDir.startsWith(root + sep)) {
  throw new Error("Refusing to prepare assets outside the repository");
}

const directories = [
  "assets", "styles", "scripts", "dashboard", "developers", "tools",
  "widgets", "welcome", "admin", "data"
];

await mkdir(publicDir, { recursive: true });

for (const directory of directories) {
  const source = join(root, directory);
  try {
    if ((await stat(source)).isDirectory()) {
      await cp(source, join(publicDir, directory), { recursive: true });
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isFile() || !/\.(?:html|css|js|xml|txt|webmanifest)$/i.test(entry.name)) continue;
  await cp(join(root, entry.name), join(publicDir, entry.name));
}
