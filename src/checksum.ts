import * as crypto from 'crypto';
import * as fs from 'fs';
import * as https from 'https';

export function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: 30000 }, (res) => {
      // Follow redirects (GitHub releases redirect)
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchText(res.headers.location).then(resolve, reject);
        return;
      }
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
    request.on('error', reject);
    request.on('timeout', () => { request.destroy(); reject(new Error('Request timed out')); });
  });
}

export async function computeSHA256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('data', (chunk) => hash.update(chunk));
    fileStream.on('end', () => resolve(hash.digest('hex')));
    fileStream.on('error', reject);
  });
}

export interface ChecksumOptions {
  version: string;
  skipChecksum: boolean;
  warn: (msg: string) => void;
  info: (msg: string) => void;
}

export async function verifyChecksum(
  downloadedFile: string,
  binaryName: string,
  options: ChecksumOptions,
): Promise<void> {
  const checksumsUrl = `https://github.com/capiscio/capiscio-core/releases/download/v${options.version}/checksums.txt`;

  let expectedHash: string | null = null;
  try {
    const checksumsText = await fetchText(checksumsUrl);
    const lines = checksumsText.trim().split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length === 2 && parts[1] === binaryName) {
        expectedHash = parts[0] ?? null;
        break;
      }
    }
  } catch {
    if (options.skipChecksum) {
      options.warn('Could not fetch checksums.txt. Skipping integrity verification (CAPISCIO_SKIP_CHECKSUM=true).');
      return;
    }
    fs.rmSync(downloadedFile, { force: true });
    throw new Error(
      'Checksum verification failed: checksums.txt is not available. ' +
      'Cannot verify binary integrity. Set CAPISCIO_SKIP_CHECKSUM=true to bypass.'
    );
  }

  if (!expectedHash) {
    if (options.skipChecksum) {
      options.warn(`Asset ${binaryName} not found in checksums.txt. Skipping verification (CAPISCIO_SKIP_CHECKSUM=true).`);
      return;
    }
    fs.rmSync(downloadedFile, { force: true });
    throw new Error(
      `Checksum verification failed: asset ${binaryName} not found in checksums.txt. ` +
      `Set CAPISCIO_SKIP_CHECKSUM=true to bypass.`
    );
  }

  const actualHash = await computeSHA256(downloadedFile);

  if (actualHash !== expectedHash) {
    fs.rmSync(downloadedFile, { force: true });
    throw new Error(
      `Binary integrity check failed for ${binaryName}. ` +
      `Expected SHA-256: ${expectedHash}, got: ${actualHash}. ` +
      'The downloaded file does not match the published checksum.'
    );
  }

  options.info(`\u2705 Checksum verified for ${binaryName}`);
}

/**
 * Parse a checksums.txt string and find the hash for a given asset name.
 */
export function parseChecksums(text: string, assetName: string): string | null {
  const lines = text.trim().split('\n');
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length === 2 && parts[1] === assetName) {
      return parts[0] ?? null;
    }
  }
  return null;
}
