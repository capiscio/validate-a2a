const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeTimeout,
  buildValidateArgs,
  calculateScores,
  getRating,
} = require("../.test-dist/validation.js");

test("normalizeTimeout appends ms for raw numeric values", () => {
  assert.equal(normalizeTimeout("10000"), "10000ms");
});

test("normalizeTimeout keeps explicit duration units", () => {
  assert.equal(normalizeTimeout("10s"), "10s");
});

test("buildValidateArgs includes selected flags and timeout", () => {
  const args = buildValidateArgs({
    agentCard: "./agent-card.json",
    strict: true,
    testLive: true,
    skipSignature: true,
    timeout: "5000",
  });

  assert.deepEqual(args, [
    "validate",
    "./agent-card.json",
    "--json",
    "--strict",
    "--test-live",
    "--skip-signature",
    "--timeout",
    "5000ms",
  ]);
});

test("calculateScores handles new scoring format", () => {
  const scores = calculateScores({
    success: true,
    errors: [],
    warnings: [],
    scoringResult: {
      compliance: { total: 92, rating: "Excellent" },
      trust: { total: 86, rating: "Good" },
      availability: { total: 88, rating: "Good" },
      productionReady: true,
    },
  });

  assert.deepEqual(scores, {
    complianceScore: 92,
    trustScore: 86,
    availabilityScore: "88",
    productionReady: true,
  });
});

test("calculateScores handles legacy availability with tested false", () => {
  const scores = calculateScores({
    success: true,
    errors: [],
    warnings: [],
    scoringResult: {
      complianceScore: 81,
      trustScore: 77,
      availability: { score: 0, tested: false },
    },
  });

  assert.deepEqual(scores, {
    complianceScore: 81,
    trustScore: 77,
    availabilityScore: "not-tested",
    productionReady: true,
  });
});

test("calculateScores defaults when scoring is missing", () => {
  const scores = calculateScores({
    success: true,
    errors: [],
    warnings: [],
  });

  assert.deepEqual(scores, {
    complianceScore: 0,
    trustScore: 0,
    availabilityScore: "not-tested",
    productionReady: false,
  });
});

test("getRating maps score bands", () => {
  assert.equal(getRating(95), "Excellent");
  assert.equal(getRating(85), "Good");
  assert.equal(getRating(75), "Fair");
  assert.equal(getRating(65), "Needs Improvement");
});
