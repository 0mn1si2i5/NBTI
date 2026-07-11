import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const generatedPaths = [
  "dist",
  ".playwright-cli",
  "output",
  "public/assets",
  "src/generated-assets",
  "tsconfig.tsbuildinfo",
];

for (const relativePath of generatedPaths) {
  fs.rmSync(path.join(root, relativePath), { force: true, recursive: true });
}

removeFinderMetadata(root);
console.log(`Cleaned ${generatedPaths.length} generated paths and Finder metadata.`);

function removeFinderMetadata(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;

    const entryPath = path.join(directory, entry.name);
    if (entry.name === ".DS_Store") {
      fs.rmSync(entryPath, { force: true });
    } else if (entry.isDirectory()) {
      removeFinderMetadata(entryPath);
    }
  }
}
