export declare function fetchText(url: string): Promise<string>;
export declare function computeSHA256(filePath: string): Promise<string>;
export interface ChecksumOptions {
    version: string;
    skipChecksum: boolean;
    warn: (msg: string) => void;
    info: (msg: string) => void;
}
export declare function verifyChecksum(downloadedFile: string, binaryName: string, options: ChecksumOptions): Promise<void>;
/**
 * Parse a checksums.txt string and find the hash for a given asset name.
 */
export declare function parseChecksums(text: string, assetName: string): string | null;
