# CapiscIO GitHub Action

The **CapiscIO GitHub Action** (`validate-a2a`) allows you to automatically validate your Agent-to-Agent (A2A) Protocol implementation in your CI/CD pipeline. It performs three-dimensional scoring, cryptographic verification, and optional live endpoint testing.

## Usage

Add the following step to your GitHub Actions workflow:

```yaml
- name: Validate Agent Card
  uses: capiscio/validate-a2a@v2
  with:
    agent-card: './agent-card.json'
    strict: 'true'
    test-live: 'true'
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `agent-card` | Path to `agent-card.json` file or URL to validate. | No | `./agent-card.json` |
| `strict` | Enable strict validation mode for production compliance. | No | `false` |
| `test-live` | Test live agent endpoint with real A2A protocol messages. | No | `false` |
| `skip-signature` | Skip JWS signature verification (not recommended for production). | No | `false` |
| `timeout` | Request timeout in milliseconds. | No | `10000` |
| `fail-on-warnings` | Fail the action if there are validation warnings. | No | `false` |

## Outputs

| Output | Description |
| :--- | :--- |
| `result` | Validation result: `"passed"` or `"failed"`. |
| `compliance-score` | Compliance score (0-100). |
| `trust-score` | Trust score (0-100). |
| `availability-score` | Availability score (0-100) or `"not-tested"` if `--test-live` not used. |
| `production-ready` | Whether agent meets production readiness thresholds: `"true"` or `"false"`. |
| `error-count` | Number of validation errors. |
| `warning-count` | Number of validation warnings. |

## Example Workflow

Here is a complete example of a workflow that validates an agent card on every push:

```yaml
name: Validate Agent

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate Agent Card
        id: validation
        uses: capiscio/validate-a2a@v2
        with:
          agent-card: './agent.json'
          strict: 'true'
          
      - name: Check Scores
        run: |
          echo "Compliance: ${{ steps.validation.outputs.compliance-score }}"
          echo "Trust: ${{ steps.validation.outputs.trust-score }}"
```
