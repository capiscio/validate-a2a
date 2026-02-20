export interface ValidationResult {
    success: boolean;
    errors: Array<unknown>;
    warnings: Array<unknown>;
    scoringResult?: {
        compliance?: {
            total: number;
            rating: string;
        };
        complianceScore?: number;
        trust?: {
            total: number;
            rating: string;
        };
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
export declare function normalizeTimeout(timeout: string): string;
export declare function buildValidateArgs(inputs: ValidateInputs): string[];
export declare function calculateScores(result: ValidationResult): NormalizedScores;
export declare function getRating(score: number): string;
