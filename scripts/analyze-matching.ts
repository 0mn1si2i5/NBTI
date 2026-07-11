import fs from "node:fs";
import path from "node:path";
import { axes, people, questions } from "../src/data/content";
import { axisKeys } from "../src/data/schema";
import { findBestAnswerPath } from "../src/logic/calibration";
import { calculateResult, roundTo } from "../src/logic/scoring";
import type { AxisKey } from "../src/types/nbti";

const SAMPLE_COUNT = 100_000;
const TOP_SHARE_LIMIT = 0.15;
const ALL_NEUTRAL_TOP_SHARE_LIMIT = 0.17;
const RANDOM_REACH_MIN = 28;
const ciMode = process.argv.includes("--ci");
const samplingTolerance = 2 * Math.sqrt((TOP_SHARE_LIMIT * (1 - TOP_SHARE_LIMIT)) / SAMPLE_COUNT);

const coverage = Object.fromEntries(axisKeys.map((axis) => [axis, { pos: 0, neg: 0 }])) as Record<
  AxisKey,
  { pos: number; neg: number }
>;
for (const question of questions) {
  for (const option of question.options) {
    for (const [axis, value] of Object.entries(option.delta)) {
      if (value > 0) coverage[axis as AxisKey].pos += 1;
      if (value < 0) coverage[axis as AxisKey].neg += 1;
    }
  }
}

const randomCounts = sampleDistribution(null);
const randomRanking = [...randomCounts.entries()].sort((a, b) => b[1] - a[1]);
const randomReached = randomCounts.size;
const topShare = (randomRanking[0]?.[1] ?? 0) / SAMPLE_COUNT;
const missingRandom = people.filter((person) => !randomCounts.has(person.person)).map((person) => person.person);
const neutralStress = [0.5, 1].map((neutralRate) => {
  const counts = sampleDistribution(neutralRate);
  const ranking = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return {
    neutralRate,
    reached: counts.size,
    topResult: ranking[0]?.[0] ?? null,
    topShare: (ranking[0]?.[1] ?? 0) / SAMPLE_COUNT,
  };
});

const reachability = people.map((person) => findBestAnswerPath(questions, people, person, axes));
const constructedMisses = reachability.filter((item) => !item.reached);

const report = {
  generatedAt: new Date().toISOString(),
  sampleCount: SAMPLE_COUNT,
  thresholds: {
    topShare: TOP_SHARE_LIMIT,
    allNeutralTopShare: ALL_NEUTRAL_TOP_SHARE_LIMIT,
    samplingTolerance: roundTo(samplingTolerance, 5),
  },
  coverage,
  random: {
    reached: randomReached,
    total: people.length,
    topResult: randomRanking[0]?.[0] ?? null,
    topShare: roundTo(topShare, 4),
    missing: missingRandom,
    distribution: Object.fromEntries(randomRanking.map(([name, count]) => [name, roundTo(count / SAMPLE_COUNT, 5)])),
  },
  neutralStress: neutralStress.map((item) => ({ ...item, topShare: roundTo(item.topShare, 4) })),
  constructed: {
    reached: people.length - constructedMisses.length,
    total: people.length,
    misses: constructedMisses.map((item) => `${item.target}->${item.actual}`),
  },
};

fs.mkdirSync(path.resolve("output"), { recursive: true });
fs.writeFileSync(path.resolve("output/matching-analysis.json"), `${JSON.stringify(report, null, 2)}\n`);

console.log("Axis coverage:");
for (const axis of axes) {
  console.log(`- ${axis.label}: pos=${coverage[axis.key].pos}, neg=${coverage[axis.key].neg}`);
}
console.log(`\nRandom samples: ${SAMPLE_COUNT}`);
console.log(`Reached people: ${randomReached}/${people.length}`);
console.log(`Top share: ${randomRanking[0]?.[0] ?? "n/a"} ${roundTo(topShare * 100, 2)}%`);
console.log(`Sampling tolerance: ${roundTo(samplingTolerance * 100, 2)} percentage points (2 SE)`);
for (const stress of neutralStress) {
  console.log(
    `Neutral stress ${stress.neutralRate * 100}%: ${stress.reached}/${people.length}, ${stress.topResult} ${roundTo(stress.topShare * 100, 2)}%`,
  );
}
console.log(`Constructed reachability: ${people.length - constructedMisses.length}/${people.length}`);
if (missingRandom.length) console.log(`Random missing: ${missingRandom.join(", ")}`);
if (constructedMisses.length) console.log(`Constructed misses: ${report.constructed.misses.join(", ")}`);

const failures: string[] = [];
for (const axis of axisKeys) {
  const { pos, neg } = coverage[axis];
  if (Math.abs(pos - neg) / Math.max(pos, neg, 1) > 0.1) failures.push(`${axis} positive/negative triggers differ by more than 10%`);
}
if (randomReached < RANDOM_REACH_MIN) failures.push(`random reach ${randomReached}/${people.length} is below ${RANDOM_REACH_MIN}`);
if (topShare > TOP_SHARE_LIMIT + samplingTolerance) {
  failures.push(`top share ${roundTo(topShare * 100, 2)}% materially exceeds ${TOP_SHARE_LIMIT * 100}%`);
}
if (neutralStress[0].topShare > TOP_SHARE_LIMIT + samplingTolerance) {
  failures.push(`50% neutral top share ${roundTo(neutralStress[0].topShare * 100, 2)}% exceeds ${TOP_SHARE_LIMIT * 100}%`);
}
if (neutralStress[1].topShare > ALL_NEUTRAL_TOP_SHARE_LIMIT + samplingTolerance) {
  failures.push(
    `100% neutral top share ${roundTo(neutralStress[1].topShare * 100, 2)}% exceeds ${ALL_NEUTRAL_TOP_SHARE_LIMIT * 100}%`,
  );
}
if (constructedMisses.length) failures.push(`constructed reachability is ${people.length - constructedMisses.length}/${people.length}`);

if (ciMode && failures.length) {
  console.error(`\nMatching validation failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exit(1);
}

console.log("\nMatching OK: distribution, axis balance, and reachability meet CI thresholds.");

function sampleDistribution(forcedNeutralRate: number | null) {
  const rng = mulberry32(20260710);
  const counts = new Map<string, number>();

  for (let index = 0; index < SAMPLE_COUNT; index += 1) {
    const answers = questions.map((question) => {
      if (question.type === "likert" && forcedNeutralRate !== null) {
        if (rng() < forcedNeutralRate) return "c";
        const directional = question.options.filter((option) => option.id !== "c");
        return directional[Math.floor(rng() * directional.length)].id;
      }
      return question.options[Math.floor(rng() * question.options.length)].id;
    });
    const resultName = calculateResult(questions, people, answers).primary.person.person;
    counts.set(resultName, (counts.get(resultName) ?? 0) + 1);
  }

  return counts;
}

function mulberry32(initialSeed: number) {
  let seed = initialSeed;
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
