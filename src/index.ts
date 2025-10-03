import * as core from '@actions/core';
import * as exec from '@actions/exec';

interface ValidationResult {
  valid: boolean;
  errors: any[];
  warnings: any[];
  scoringResult?: {
    compliance: { score: number; rating: string };
    trust: { score: number; rating: string };
    availability: { score: number; rating: string } | null;
    productionReady: boolean;
  };
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

    // Install capiscio-cli globally
    core.info('📦 Installing capiscio-cli@2.0.0...');
    await exec.exec('npm', ['install', '-g', 'capiscio-cli@2.0.0']);

    // Build command arguments
    const args = ['validate', agentCard, '--json'];
    
    if (strict) args.push('--strict');
    if (testLive) args.push('--test-live');
    if (skipSignature) args.push('--skip-signature');
    if (timeout) args.push('--timeout', timeout);

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
    core.setOutput('result', result.valid ? 'passed' : 'failed');
    core.setOutput('error-count', (result.errors?.length || 0).toString());
    core.setOutput('warning-count', (result.warnings?.length || 0).toString());

    // Set scoring outputs (handle undefined gracefully)
    if (result.scoringResult) {
      core.setOutput('compliance-score', result.scoringResult.compliance?.score?.toString() || '0');
      core.setOutput('trust-score', result.scoringResult.trust?.score?.toString() || '0');
      core.setOutput(
        'availability-score',
        result.scoringResult.availability?.score?.toString() || 'not-tested'
      );
      core.setOutput('production-ready', (result.scoringResult.productionReady || false).toString());

      // Display scores
      core.info('');
      core.info('📊 Quality Scores:');
      if (result.scoringResult.compliance) {
        core.info(`  Compliance: ${result.scoringResult.compliance.score}/100 (${result.scoringResult.compliance.rating})`);
      }
      if (result.scoringResult.trust) {
        core.info(`  Trust: ${result.scoringResult.trust.score}/100 (${result.scoringResult.trust.rating})`);
      }
      if (result.scoringResult.availability) {
        core.info(`  Availability: ${result.scoringResult.availability.score}/100 (${result.scoringResult.availability.rating})`);
      }
      core.info('');
      core.info(`🎯 Production Ready: ${result.scoringResult.productionReady ? '✅ YES' : '❌ NO'}`);
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
    if (!result.valid) {
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
