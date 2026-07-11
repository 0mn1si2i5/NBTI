import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const people = JSON.parse(fs.readFileSync(path.join(root, "src/data/people.json"), "utf8"));
const allFiles = walk(dist);
const totalBytes = allFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0);
const showcaseNames = new Set(["曹丕", "嵇康", "侯景"]);
const showcasePaths = people
  .filter((person) => showcaseNames.has(person.person))
  .map((person) => path.join(dist, person.avatar));
const shellFiles = allFiles.filter((file) => {
  const relative = path.relative(dist, file);
  return (
    relative === "index.html" ||
    /assets\/index-.+\.(?:js|css)$/.test(relative) ||
    /assets\/nbti-ink-bg-.+\.webp$/.test(relative)
  );
});
const initialBytes = [...shellFiles, ...showcasePaths].reduce((sum, file) => sum + fs.statSync(file).size, 0);
const totalLimit = 15 * 1024 * 1024;
const initialLimit = 2.5 * 1024 * 1024;
const errors = [];

if (totalBytes > totalLimit) errors.push(`dist is ${format(totalBytes)}, above 15 MB`);
if (initialBytes > initialLimit) errors.push(`home initial assets are ${format(initialBytes)}, above 2.5 MB`);

if (errors.length) {
  console.error(`Build budget failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exit(1);
}
console.log(`Build budget OK: dist ${format(totalBytes)}, home initial assets ${format(initialBytes)}.`);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(filePath) : [filePath];
  });
}

function format(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
