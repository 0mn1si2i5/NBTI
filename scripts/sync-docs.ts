import fs from "node:fs";
import path from "node:path";
import { axes, people, questions } from "../src/data/content";
import { axisKeys } from "../src/data/schema";
import type { AxisKey } from "../src/types/nbti";

const root = process.cwd();
const mode = process.argv.includes("--write") ? "write" : "check";
const axisByKey = Object.fromEntries(axes.map((axis) => [axis.key, axis]));

const outputs = new Map([
  ["docs/people.md", renderPeople()],
  ["docs/questions.md", renderQuestions()],
]);

const stale: string[] = [];
for (const [relativePath, expected] of outputs) {
  const filePath = path.join(root, relativePath);
  if (mode === "write") {
    fs.writeFileSync(filePath, expected);
    console.log(`Updated ${relativePath}`);
  } else {
    const actual = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
    if (actual !== expected) stale.push(relativePath);
  }
}

if (stale.length) {
  console.error(`Generated docs are stale: ${stale.join(", ")}. Run npm run docs:sync.`);
  process.exit(1);
}
if (mode === "check") console.log("Docs OK: people.md and questions.md match canonical JSON data.");

function renderPeople() {
  const lines = [
    "# NBTI 人物数据",
    "",
    "> 本文件由 `src/data/people.json` 生成。请修改 JSON 后运行 `npm run docs:sync`，不要直接维护本文件。",
    "",
    `当前人物池为 ${people.length} 人。六维向量已按新题库的对称评分范围完成校准。`,
    "",
    "| # | 人物 | 结果名 | 引文 | 向量 | 头像 |",
    "|---:|---|---|---|---|---|",
  ];

  people.forEach((person, index) => {
    lines.push(
      `| ${index + 1} | ${cell(person.person)} | ${cell(person.title)} | [${cell(person.quote.text)}](${person.quote.sourceUrl}) | \`${JSON.stringify(person.vector)}\` | ${person.avatar} |`,
    );
  });

  lines.push("", "## 用户结果文案", "");
  people.forEach((person, index) => {
    lines.push(
      `### ${index + 1}. ${person.person} · ${person.title}`,
      "",
      person.why,
      "",
      `**引文：** [${person.quote.text}](${person.quote.sourceUrl})（${person.quote.locator}）`,
      "",
      "**史料边角：**",
      "",
    );
    person.facts.forEach((fact) => {
      const kind = fact.sourceKind === "primary" ? "一手材料" : "二手研究";
      lines.push(`- ${fact.text} [${fact.sourceTitle}](${fact.sourceUrl})（${kind}；${fact.locator}）`);
    });
    lines.push("");
  });

  return `${lines.join("\n").trim()}\n`;
}

function renderQuestions() {
  const lines = [
    "# NBTI 题库",
    "",
    "> 本文件由 `src/data/questions.json` 生成。请修改 JSON 后运行 `npm run docs:sync`，不要直接维护本文件。",
    "",
    `当前题库为 ${questions.length} 题：18 道情境题与 6 道五级量表题。每个维度承担 3 道情境主测和 1 道量表校准。`,
    "",
    "## 维度蓝图",
    "",
    "| 维度 | 情境主测 | 量表题 | 次维度出现 |",
    "|---|---:|---:|---:|",
  ];

  for (const axis of axes) {
    const scenarioCount = questions.filter((question) => question.type === "scenario" && question.design.primaryAxis === axis.key).length;
    const likertCount = questions.filter((question) => question.type === "likert" && question.design.primaryAxis === axis.key).length;
    const secondaryCount = questions.filter((question) => question.design.secondaryAxis === axis.key).length;
    lines.push(`| ${axis.label} | ${scenarioCount} | ${likertCount} | ${secondaryCount} |`);
  }

  lines.push("", "## 题目", "");
  questions.forEach((question, index) => {
    const primary = axisByKey[question.design.primaryAxis];
    const secondary = question.design.secondaryAxis ? axisByKey[question.design.secondaryAxis] : null;
    lines.push(
      `### ${index + 1}. ${question.text}`,
      "",
      `类型：${question.type === "scenario" ? "情境题" : "五级量表题"}。主维度：${primary.label}${secondary ? `；次维度：${secondary.label}` : ""}${question.design.keying ? `；计分：${question.design.keying === "positive" ? "正向" : "反向"}` : ""}。`,
    );
    if (question.design.distinguishes.length) lines.push(`区分：${question.design.distinguishes.join(" / ")}。`);
    lines.push("", "| 选项 | 文案 | Delta |", "|---|---|---|");
    question.options.forEach((option) => {
      lines.push(`| ${option.label} | ${cell(option.text)} | ${formatDelta(option.delta)} |`);
    });
    lines.push("");
  });

  return `${lines.join("\n").trim()}\n`;
}

function formatDelta(delta: Partial<Record<AxisKey, number>>) {
  const values = axisKeys
    .filter((axis) => delta[axis] !== undefined)
    .map((axis) => `${axisByKey[axis].label}${(delta[axis] ?? 0) > 0 ? "+" : ""}${delta[axis]}`)
    .join("，");
  return values || "0";
}

function cell(value: string) {
  return value.replaceAll("|", "\\|").replaceAll("\n", "<br>");
}
