import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

const CAPISCIO_VERSION = '2.2.0';

interface ValidationResult {
  success: boolean;
  errors: any[];
  warnings: any[];
  scoringResult?: {
    // Support both legacy and new output formats
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

async function setupCapiscio(): Promise<string> {
  // Determine OS and Arch
  const platform = os.platform();
  const arch = os.arch();

  let osName = '';
  if (platform === 'linux') osName = 'linux';
  else if (platform === 'darwin') osName = 'darwin';
  else if (platform === 'win32') osName = 'windows';
  else throw new Error(`Unsupported platform: ${platform}`);

  let archName = '';
  if (arch === 'x64') archName = 'amd64';
  else if (arch === 'arm64') archName = 'arm64';
  else throw new Error(`Unsupported architecture: ${arch}`);

  const binaryName = platform === 'win32' ? `capiscio-${osName}-${archName}.exe` : `capiscio-${osName}-${archName}`;
  const downloadUrl = `https://github.com/capiscio/capiscio-core/releases/download/v${CAPISCIO_VERSION}/${binaryName}`;

  core.info(`⬇️ Downloading CapiscIO Core v${CAPISCIO_VERSION} from ${downloadUrl}`);

  // Download
  const downloadPath = await tc.downloadTool(downloadUrl);
  
  // Rename and make executable
  const binPath = path.join(path.dirname(downloadPath), platform === 'win32' ? 'capiscio.exe' : 'capiscio');
  fs.renameSync(downloadPath, binPath);
  fs.chmodSync(binPath, '755');

  // Add to PATH
  core.addPath(path.dirname(binPath));
  
  return binPath;
}

async function run(): Promise<void> {
  try {
    // Get inputs
    const agentCard = core.getInput('agent-card');
    const strict = core.getBooleanInput('strict');
    const testLive = core.getBooleanInput('test-live');
    const skipSignature = core.getBooleanInput('skip-signature');
    const timeout = core.getInput('timeout');
    const failOnWarnings = core.getBooleanInput('fail-on-warnings');

    core.info(`🚀 Validating A2A agent card: ${agentCard}`);

    // Install capiscio-core
    await setupCapiscio();

    // Build command arguments
    const args = ['validate', agentCard, '--json'];
    
    if (strict) args.push('--strict');
    if (testLive) args.push('--test-live');
    if (skipSignature) args.push('--skip-signature');
    if (timeout) {
      // Ensure timeout has units (default to ms if just a number)
      const timeoutVal = /^\d+$/.test(timeout) ? `${timeout}ms` : timeout;
      args.push('--timeout', timeoutVal);
    }

    // Run validation
    let output = '';
    let errorOutput = '';
    
    const options = {
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
        stderr: (data: Buffer) => {
          errorOutput += data.toString();
        }
      },
      ignoreReturnCode: true
    };

    core.info(`🔍 Running: capiscio ${args.join(' ')}`);
    const exitCode = await exec.exec('capiscio', args, options);

    // Log raw output for debugging
    if (output) {
      core.debug(`CLI Output: ${output}`);
    }
    if (errorOutput) {
      core.debug(`CLI Error Output: ${errorOutput}`);
    }

    // Parse JSON output
    let result: ValidationResult;
    try {
      result = JSON.parse(output);
    } catch (error) {
      // If JSON parsing fails, show the raw output
      core.error('Failed to parse validation output as JSON');
      core.error(`Raw output: ${output}`);
      core.error(`Error output: ${errorOutput}`);
      core.setFailed(`Validation failed with exit code ${exitCode}`);
      return;
    }

    // Set basic outputs
    core.setOutput('result', result.success ? 'passed' : 'failed');
    core.setOutput('error-count', (result.errors?.length || 0).toString());
    core.setOutput('warning-count', (result.warnings?.length || 0).toString());

    // Set scoring outputs (handle undefined gracefully)
    if (result.scoringResult) {
      // Normalize scores from different versions
      const complianceScore = result.scoringResult.compliance?.total ?? result.scoringResult.complianceScore ?? 0;
      const trustScore = result.scoringResult.trust?.total ?? result.scoringResult.trustScore ?? 0;
      
      let availabilityScore: number | string = 'not-tested';
      if (result.scoringResult.availability) {
        if (result.scoringResult.availability.total !== undefined && result.scoringResult.availability.total !== null) {
          availabilityScore = result.scoringResult.availability.total;
        } else if (result.scoringResult.availability.score !== undefined) {
          // Check if tested is false
          if (result.scoringResult.availability.tested === false) {
            availabilityScore = 'not-tested';
          } else {
            availabilityScore = result.scoringResult.availability.score;
          }
        }
      }

      // Calculate production ready if missing (simple heuristic: compliance >= 80)
      const productionReady = result.scoringResult.productionReady ?? (complianceScore >= 80);

      core.setOutput('compliance-score', complianceScore.toString());
      core.setOutput('trust-score', trustScore.toString());
      core.setOutput('availability-score', availabilityScore.toString());
      core.setOutput('production-ready', productionReady.toString());

      // Display scores
      core.info('');
      core.info('📊 Quality Scores:');
      
      const getRating = (score: number) => {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Good';
        if (score >= 70) return 'Fair';
        return 'Needs Improvement';
      };

      const compRating = result.scoringResult.compliance?.rating ?? getRating(complianceScore);
      core.info(`  Compliance: ${complianceScore}/100 (${compRating})`);

      const trustRating = result.scoringResult.trust?.rating ?? getRating(trustScore);
      core.info(`  Trust: ${trustScore}/100 (${trustRating})`);

      if (availabilityScore !== 'not-tested') {
        const availScoreNum = Number(availabilityScore);
        const availRating = result.scoringResult.availability?.rating ?? getRating(availScoreNum);
        core.info(`  Availability: ${availScoreNum}/100 (${availRating})`);
      } else {
        core.info(`  Availability: Not Tested`);
      }

      core.info('');
      core.info(`🎯 Production Ready: ${productionReady ? '✅ YES' : '❌ NO'}`);
    } else {
      // No scoring result available
      core.setOutput('compliance-score', 'N/A');
      core.setOutput('trust-score', 'N/A');
      core.setOutput('availability-score', 'N/A');
      core.setOutput('production-ready', 'false');
    }

    // Display errors
    if (result.errors && result.errors.length > 0) {
      core.info('');
      core.error(`❌ Found ${result.errors.length} error(s):`);
      result.errors.forEach((err: any) => {
        core.error(`  - ${err.message || err}`);
      });
    }

    // Display warnings
    if (result.warnings && result.warnings.length > 0) {
      core.info('');
      core.warning(`⚠️  Found ${result.warnings.length} warning(s):`);
      result.warnings.forEach((warn: any) => {
        core.warning(`  - ${warn.message || warn}`);
      });
    }

    // Determine if action should fail
    if (!result.success) {
      const errorCount = result.errors?.length || 0;
      core.setFailed(`Validation failed with ${errorCount} error(s)`);
    } else if (failOnWarnings && result.warnings && result.warnings.length > 0) {
      core.setFailed(`Validation passed but found ${result.warnings.length} warning(s) (fail-on-warnings enabled)`);
    } else {
      core.info('');
      core.info('✅ Validation passed!');
    }

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

run();
