export interface ValidationResult {
  success: boolean;
  errors: Array<unknown>;
  warnings: Array<unknown>;
  scoringResult?: {
    compliance?: { total: number; rating: string };
    complianceScore?: number;
    trust?: { total: number; rating: string };
    trustScore?: number;
    availability?: {
      total?: number | null;
      rating?: string | null;
      score?: number;
      tested?: boolean;
    } | null;
    productionReady?: boolean;
  };
}

export interface ValidateInputs {
  agentCard: string;
  strict: boolean;
  testLive: boolean;
  skipSignature: boolean;
  timeout: string;
}

export interface NormalizedScores {
  complianceScore: number;
  trustScore: number;
  availabilityScore: string;
  productionReady: boolean;
}

export function normalizeTimeout(timeout: string): string {
  if (!timeout) return "";
  return /^\d+$/.test(timeout) ? `${timeout}ms` : timeout;
}

export function buildValidateArgs(inputs: ValidateInputs): string[] {
  const args = ["validate", inputs.agentCard, "--json"];
  if (inputs.strict) args.push("--strict");
  if (inputs.testLive) args.push("--test-live");
  if (inputs.skipSignature) args.push("--skip-signature");
  if (inputs.timeout) {
    args.push("--timeout", normalizeTimeout(inputs.timeout));
  }
  return args;
}

export function calculateScores(result: ValidationResult): NormalizedScores {
  const scoringResult = result.scoringResult;
  const complianceScore = scoringResult?.compliance?.total ?? scoringResult?.complianceScore ?? 0;
  const trustScore = scoringResult?.trust?.total ?? scoringResult?.trustScore ?? 0;

  let availabilityScore: string = "not-tested";
  if (scoringResult?.availability) {
    if (
      scoringResult.availability.total !== undefined &&
      scoringResult.availability.total !== null
    ) {
      availabilityScore = String(scoringResult.availability.total);
    } else if (scoringResult.availability.score !== undefined) {
      availabilityScore = scoringResult.availability.tested === false
        ? "not-tested"
        : String(scoringResult.availability.score);
    }
  }

  const productionReady =
    scoringResult?.productionReady ?? (complianceScore >= 80);

  return {
    complianceScore,
    trustScore,
    availabilityScore,
    productionReady,
  };
}

export function getRating(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 70) return "Fair";
  return "Needs Improvement";
}
