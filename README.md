# Validate A2A Agent Card

> GitHub Action to validate A2A protocol agent cards with three-dimensional scoring, cryptographic verification, and live endpoint testing

**Powered by [capiscio-core](https://github.com/capiscio/capiscio-core)** - High-performance Go binary (v2.1.2)

## Features

✅ **Three-Dimensional Scoring** - Compliance, Trust, and Availability evaluation  
✅ **JWS Signature Verification** - Cryptographic authenticity validation  
✅ **Live Endpoint Testing** - Real A2A protocol message testing  
✅ **Production Readiness** - Clear thresholds for deployment decisions  
✅ **Rich Outputs** - Scores, errors, warnings available for downstream steps  
✅ **Zero Dependencies** - Uses standalone binary, no npm install required

## Usage

### Basic Validation

```yaml
name: Validate Agent Card
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate A2A Agent Card
        uses: capiscio/validate-a2a@v1
        with:
          agent-card: './agent-card.json'
```

### Strict Mode for Production

```yaml
- name: Validate for Production
  uses: capiscio/validate-a2a@v1
  with:
    agent-card: './agent-card.json'
    strict: true
    test-live: true
```

### Use Outputs in Downstream Steps

```yaml
- name: Validate Agent Card
  id: validate
  uses: capiscio/validate-a2a@v1
  with:
    agent-card: './agent-card.json'

- name: Check Production Readiness
  run: |
    echo "Result: ${{ steps.validate.outputs.result }}"
    echo "Compliance Score: ${{ steps.validate.outputs.compliance-score }}"
    echo "Trust Score: ${{ steps.validate.outputs.trust-score }}"
    echo "Production Ready: ${{ steps.validate.outputs.production-ready }}"
```

### Validate Remote Agent Card

```yaml
- name: Validate Remote Agent
  uses: capiscio/validate-a2a@v1
  with:
    agent-card: 'https://example.com/agent-card.json'
    test-live: true
```

### Full Example with All Options

```yaml
- name: Comprehensive Validation
  uses: capiscio/validate-a2a@v1
  with:
    agent-card: './agent-card.json'
    strict: true
    test-live: true
    skip-signature: false
    timeout: 15000
    fail-on-warnings: true
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `agent-card` | Path to agent-card.json or URL | No | `./agent-card.json` |
| `strict` | Enable strict validation mode | No | `false` |
| `test-live` | Test live endpoint with real messages | No | `false` |
| `skip-signature` | Skip JWS signature verification | No | `false` |
| `timeout` | Request timeout in milliseconds | No | `10000` |
| `fail-on-warnings` | Fail action on validation warnings | No | `false` |

## Outputs

| Output | Description | Example |
|--------|-------------|---------|
| `result` | Validation result | `passed` or `failed` |
| `compliance-score` | Compliance score (0-100) | `95` |
| `trust-score` | Trust score (0-100) | `72` |
| `availability-score` | Availability score or "not-tested" | `88` or `not-tested` |
| `production-ready` | Meets production thresholds | `true` or `false` |
| `error-count` | Number of validation errors | `0` |
| `warning-count` | Number of validation warnings | `2` |

## Scoring System

### Three Quality Dimensions

**Compliance (0-100)** - A2A v0.3.0 specification adherence
- Core fields, skills quality, format compliance, data quality

**Trust (0-100)** - Security and authenticity
- Cryptographic signatures, provider trust, security posture, documentation
- **Trust Confidence Multiplier**: 1.0x (valid sig), 0.6x (no sig), 0.4x (invalid sig)

**Availability (0-100)** - Operational readiness (requires `test-live: true`)
- Primary endpoint, transport support, response quality

### Production Readiness Thresholds
- **Compliance ≥95** - Specification adherence sufficient
- **Trust ≥60** - Minimum trust level  
- **Availability ≥80** - Operational stability sufficient

[Learn more about scoring →](https://github.com/capiscio/capiscio-cli/blob/main/docs/scoring-system.md)

## Examples

### Post-Deployment Verification

```yaml
name: Post-Deploy Validation
on:
  deployment_status:

jobs:
  validate:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    steps:
      - name: Validate Deployed Agent
        uses: capiscio/validate-a2a@v1
        with:
          agent-card: ${{ secrets.DEPLOYED_AGENT_URL }}
          strict: true
          test-live: true
```

### PR Validation with Comments

```yaml
name: PR Validation
on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate Agent Card
        id: validate
        uses: capiscio/validate-a2a@v1
        with:
          agent-card: './agent-card.json'
      
      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Validation Results
              
              📊 **Scores:**
              - Compliance: ${{ steps.validate.outputs.compliance-score }}/100
              - Trust: ${{ steps.validate.outputs.trust-score }}/100
              - Availability: ${{ steps.validate.outputs.availability-score }}
              
              🎯 **Production Ready:** ${{ steps.validate.outputs.production-ready }}
              `
            })
```

### Matrix Testing Multiple Environments

```yaml
name: Multi-Environment Validation
on: [push]

jobs:
  validate:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [dev, staging, prod]
    steps:
      - name: Validate ${{ matrix.environment }}
        uses: capiscio/validate-a2a@v1
        with:
          agent-card: https://api-${{ matrix.environment }}.example.com/agent-card.json
          strict: ${{ matrix.environment == 'prod' }}
          test-live: true
```

## License

Apache-2.0 - See [LICENSE](LICENSE) for details

## Related

- [capiscio-core](https://github.com/capiscio/capiscio-core) - The underlying validation engine
- [capiscio-python](https://github.com/capiscio/capiscio-python) - Python CLI wrapper
- [A2A Protocol](https://capisc.io) - Learn about the A2A protocol
- [Web Validator](https://capisc.io/validator) - Browser-based validation tool
