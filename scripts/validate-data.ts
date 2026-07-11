import fs from "node:fs";
import path from "node:path";
import { axesSchema, axisKeys, peopleSchema, questionsSchema, type AxisKey } from "../src/data/schema";

const root = process.cwd();
const axesRaw: unknown = readJson("src/data/axes.json");
const peopleRaw: unknown = readJson("src/data/people.json");
const questionsRaw: unknown = readJson("src/data/questions.json");
const errors: string[] = [];

const axesResult = axesSchema.safeParse(axesRaw);
const peopleResult = peopleSchema.safeParse(peopleRaw);
const questionsResult = questionsSchema.safeParse(questionsRaw);

collectSchemaErrors("axes", axesResult);
collectSchemaErrors("people", peopleResult);
collectSchemaErrors("questions", questionsResult);

if (errors.length || !axesResult.success || !peopleResult.success || !questionsResult.success) finish();

const axes = axesResult.data;
const people = peopleResult.data;
const questions = questionsResult.data;
const personNames = new Set(people.map((person) => person.person));

checkUnique("axis key", axes.map((axis) => axis.key));
checkUnique("person id", people.map((person) => person.id));
checkUnique("person name", people.map((person) => person.person));
checkUnique("question id", questions.map((question) => question.id));

if (axes.map((axis) => axis.key).join(",") !== axisKeys.join(",")) {
  errors.push(`axis order must be ${axisKeys.join(", ")}`);
}

const sourcePngs = listFiles("assets-source/characters", ".png");
const generatedWebps = listFiles("public/assets/characters", ".webp");
if (sourcePngs.length !== 32) errors.push(`expected 32 source PNG portraits, got ${sourcePngs.length}`);
if (generatedWebps.length !== 32) errors.push(`expected 32 generated WebP portraits, got ${generatedWebps.length}; run npm run assets:build`);

for (const person of people) {
  const avatarPath = path.join(root, "public", person.avatar);
  if (!fs.existsSync(avatarPath)) errors.push(`${person.person} missing generated avatar ${person.avatar}`);
  if (!/^https:\/\//.test(person.quote.sourceUrl)) errors.push(`${person.person} quote URL must use HTTPS: ${person.quote.sourceUrl}`);
  for (const fact of person.facts) {
    if (!/^https:\/\//.test(fact.sourceUrl)) errors.push(`${person.person} source URL must use HTTPS: ${fact.sourceUrl}`);
  }
}

const scenarioQuestions = questions.filter((question) => question.type === "scenario");
const likertQuestions = questions.filter((question) => question.type === "likert");
if (scenarioQuestions.length !== 18) errors.push(`expected 18 scenario questions, got ${scenarioQuestions.length}`);
if (likertQuestions.length !== 6) errors.push(`expected 6 likert questions, got ${likertQuestions.length}`);

const primaryCounts = Object.fromEntries(axisKeys.map((axis) => [axis, { scenario: 0, likert: 0 }])) as Record<
  AxisKey,
  { scenario: number; likert: number }
>;
const secondaryCounts = Object.fromEntries(axisKeys.map((axis) => [axis, 0])) as Record<AxisKey, number>;

for (const question of questions) {
  checkUnique(`${question.id} option id`, question.options.map((option) => option.id));
  primaryCounts[question.design.primaryAxis][question.type] += 1;
  if (question.design.secondaryAxis) secondaryCounts[question.design.secondaryAxis] += 1;

  for (const name of question.design.distinguishes) {
    if (!personNames.has(name)) errors.push(`${question.id} distinguishes unknown person ${name}`);
  }

  const expectedAxes = [question.design.primaryAxis, question.design.secondaryAxis].filter(Boolean).sort();
  const primaryValues: number[] = [];
  const secondaryValues: number[] = [];

  for (const option of question.options) {
    const optionAxes = Object.keys(option.delta).sort();
    const neutralLikert = question.type === "likert" && option.id === "c";
    const requiredAxes = neutralLikert ? [] : expectedAxes;
    if (optionAxes.join(",") !== requiredAxes.join(",")) {
      errors.push(`${question.id}/${option.id} must affect exactly ${expectedAxes.join(" + ")}`);
    }
    primaryValues.push(option.delta[question.design.primaryAxis] ?? 0);
    if (question.design.secondaryAxis) secondaryValues.push(option.delta[question.design.secondaryAxis] ?? 0);
  }

  if (question.type === "scenario") {
    if (primaryValues.sort((a, b) => a - b).join(",") !== "-2,-1,1,2") {
      errors.push(`${question.id} primary deltas must be -2, -1, +1, +2`);
    }
    if (secondaryValues.sort((a, b) => a - b).join(",") !== "-1,-1,1,1") {
      errors.push(`${question.id} secondary deltas must be -1, -1, +1, +1`);
    }
  } else {
    const expectedValues = question.design.keying === "positive" ? "-2,-1,0,1,2" : "2,1,0,-1,-2";
    if (primaryValues.join(",") !== expectedValues) {
      errors.push(`${question.id} likert deltas must follow ${question.design.keying} keying (${expectedValues})`);
    }
  }

  for (const axis of axisKeys) {
    const sum = question.options.reduce((total, option) => total + (option.delta[axis] ?? 0), 0);
    if (sum !== 0) errors.push(`${question.id}/${axis} delta sum must be zero, got ${sum}`);
  }
}

for (const axis of axisKeys) {
  const counts = primaryCounts[axis];
  if (counts.scenario !== 3 || counts.likert !== 1) {
    errors.push(`${axis} must be primary in 3 scenarios and 1 likert question, got ${counts.scenario}/${counts.likert}`);
  }
  if (secondaryCounts[axis] !== 3) errors.push(`${axis} must be secondary in 3 scenarios, got ${secondaryCounts[axis]}`);
}

finish();

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function collectSchemaErrors(label: string, result: ReturnType<typeof axesSchema.safeParse>) {
  if (result.success) return;
  for (const issue of result.error.issues) {
    errors.push(`${label}.${issue.path.join(".")}: ${issue.message}`);
  }
}

function checkUnique(label: string, values: readonly string[]) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length) errors.push(`duplicate ${label}: ${[...new Set(duplicates)].join(", ")}`);
}

function listFiles(relativeDirectory: string, extension: string) {
  const directory = path.join(root, relativeDirectory);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((file) => file.endsWith(extension));
}

function finish(): never {
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log("Data OK: 32 people, 24 questions (18 scenario + 6 likert), balanced six-axis blueprint.");
  process.exit(0);
}
