import fs from "node:fs";
import path from "node:path";

const people = JSON.parse(fs.readFileSync("src/data/people.json", "utf8"));
const questions = JSON.parse(fs.readFileSync("src/data/questions.json", "utf8"));
const discouraged = ["系统", "接口", "插件", "内存", "加载", "权限", "发票", "过载", "KPI", "流程", "截图", "下线", "版本"];
const texts = [
  ...people.flatMap((person) => [person.title, person.why, person.quote.text, ...person.facts.map((fact) => fact.text)]),
  ...questions.flatMap((question) => [question.text, ...question.options.map((option) => option.text)]),
];
const corpus = texts.join("\n");
const termCounts = Object.fromEntries(
  discouraged
    .map((term) => [term, corpus.split(term).length - 1])
    .filter(([, count]) => count > 0),
);
const lengthWarnings = people.flatMap((person) => {
  const warnings = [];
  if (person.why.length < 110 || person.why.length > 180) warnings.push(`${person.person}.why=${person.why.length}`);
  return warnings;
});
const report = {
  generatedAt: new Date().toISOString(),
  status: "advisory_only",
  termCounts,
  lengthWarnings,
  note: "Literary acceptance requires human review; this report never approves or rejects copy.",
};

fs.mkdirSync("output", { recursive: true });
fs.writeFileSync(path.join("output", "copy-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Copy audit (advisory): ${Object.keys(termCounts).length} discouraged terms present, ${lengthWarnings.length} length warnings.`);
