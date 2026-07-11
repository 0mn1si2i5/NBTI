import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const sourcePath = path.resolve("src/data/people.json");
const outputPath = path.resolve("docs/editorial/baseline-text-v1.json");
if (fs.existsSync(outputPath) && !process.argv.includes("--force")) {
  console.log("Editorial baseline already exists; leaving it unchanged.");
  process.exit(0);
}

const source = fs.readFileSync(sourcePath, "utf8");
const people = JSON.parse(source);
const snapshot = {
  snapshotId: crypto.createHash("sha256").update(source).digest("hex"),
  source: "src/data/people.json",
  ruleVersion: "legacy-pre-text-v1",
  people: people.map(({ id, person, title, why, quote, facts }) => ({ id, person, title, why, quote, facts })),
};

fs.writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Saved editorial baseline for ${snapshot.people.length} people.`);
