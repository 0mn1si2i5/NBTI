import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceAssets = path.join(root, "assets-source");
const sourceCharacters = path.join(sourceAssets, "characters");
const publicCharacters = path.join(root, "public/assets/characters");
const generatedAssets = path.join(root, "src/generated-assets");
const publicAssets = path.join(root, "public/assets");

fs.mkdirSync(publicCharacters, { recursive: true });
fs.mkdirSync(generatedAssets, { recursive: true });
fs.mkdirSync(publicAssets, { recursive: true });

const sourceFiles = fs
  .readdirSync(sourceCharacters)
  .filter((file) => file.endsWith(".png"))
  .sort();

const expectedCharacterFiles = new Set(sourceFiles.map((file) => file.replace(/\.png$/, ".webp")));
for (const file of fs.readdirSync(publicCharacters)) {
  if (file.endsWith(".webp") && !expectedCharacterFiles.has(file)) {
    fs.rmSync(path.join(publicCharacters, file));
  }
}

await Promise.all(
  sourceFiles.map(async (file) => {
    await sharp(path.join(sourceCharacters, file))
      .resize(640, 960, { fit: "cover", position: "centre" })
      .webp({ quality: 84, effort: 5 })
      .toFile(path.join(publicCharacters, file.replace(/\.png$/, ".webp")));
  }),
);

const backgroundOutput = path.join(generatedAssets, "nbti-ink-bg.webp");
await sharp(path.join(sourceAssets, "nbti-ink-bg.png"))
  .resize(1536, 1024, { fit: "cover" })
  .webp({ quality: 78, effort: 5 })
  .toFile(backgroundOutput);

await buildShareImage(sourceFiles);

const characterBytes = fs
  .readdirSync(publicCharacters)
  .filter((file) => file.endsWith(".webp"))
  .reduce((sum, file) => sum + fs.statSync(path.join(publicCharacters, file)).size, 0);
const backgroundBytes = fs.statSync(backgroundOutput).size;
console.log(
  `Assets OK: ${sourceFiles.length} portraits ${(characterBytes / 1024 / 1024).toFixed(1)} MB, background ${(backgroundBytes / 1024).toFixed(0)} KB.`,
);

async function buildShareImage(files) {
  const selected = [files[0], files[6], files[26]];
  const portraits = await Promise.all(
    selected.map((file) =>
      sharp(path.join(sourceCharacters, file))
        .resize(250, 375, { fit: "cover" })
        .webp({ quality: 82 })
        .toBuffer(),
    ),
  );

  const overlay = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="rgba(245,239,228,0.86)"/>
      <text x="68" y="168" fill="#a6402e" font-size="28" font-family="sans-serif" font-weight="700">NBTI / 魏晋南北朝人格测试</text>
      <text x="68" y="278" fill="#171914" font-size="76" font-family="serif" font-weight="800">测测你的精神</text>
      <text x="68" y="372" fill="#171914" font-size="76" font-family="serif" font-weight="800">出厂设置</text>
      <text x="72" y="450" fill="#5d625b" font-size="28" font-family="sans-serif">24 个处境，32 面历史镜子</text>
    </svg>
  `);

  await sharp(path.join(sourceAssets, "nbti-ink-bg.png"))
    .resize(1200, 630, { fit: "cover" })
    .composite([
      { input: overlay, left: 0, top: 0 },
      { input: portraits[0], left: 805, top: 175 },
      { input: portraits[1], left: 900, top: 120 },
      { input: portraits[2], left: 995, top: 175 },
    ])
    .webp({ quality: 82, effort: 5 })
    .toFile(path.join(publicAssets, "nbti-share.webp"));
}
