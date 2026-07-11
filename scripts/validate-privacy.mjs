import fs from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve(process.cwd(), "src");
const blockedPatterns = [
  ["network request", /\bfetch\s*\(|\bXMLHttpRequest\b|\bsendBeacon\s*\(|\bWebSocket\s*\(|\bEventSource\s*\(/],
  ["browser persistence", /\blocalStorage\b|\bsessionStorage\b|\bdocument\.cookie\b|\bindexedDB\b/],
];

const violations = [];

for (const filePath of walk(sourceRoot)) {
  if (!/\.(?:ts|tsx|js|jsx)$/.test(filePath)) continue;
  const source = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(process.cwd(), filePath);

  for (const [label, pattern] of blockedPatterns) {
    if (pattern.test(source)) violations.push(`${relativePath}: ${label}`);
  }
}

if (violations.length) {
  console.error("Privacy validation failed:\n" + violations.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Privacy OK: no network requests or browser persistence in src/.");

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(filePath) : [filePath];
  });
}
