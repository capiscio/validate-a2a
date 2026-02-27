# validate-a2a - GitHub Copilot Instructions

## ABSOLUTE RULES - NO EXCEPTIONS

### 1. ALL WORK VIA PULL REQUESTS
- **NEVER commit directly to `main`.** All changes MUST go through PRs.

### 2. LOCAL CI VALIDATION BEFORE PUSH
- Test the action locally before pushing

### 3. NO WATCH/BLOCKING COMMANDS
- **NEVER run blocking commands** without timeout

---

## Repository Purpose

**validate-a2a** is a GitHub Action that validates A2A protocol agent cards.
It provides three-dimensional scoring, cryptographic verification, and live endpoint testing.

Users add it to their CI pipelines to validate their agent-card.json files.

**Technology Stack**: TypeScript, GitHub Actions

**Current Version**: v2.4.0
**Default Branch:** `main`

## How It Works

```yaml
# Usage in a workflow
- uses: capiscio/validate-a2a@v2
  with:
    agent-card: './agent-card.json'
    strict: 'true'
    test-live: 'false'
```

### Key Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `agent-card` | Path or URL to agent-card.json | `./agent-card.json` |
| `strict` | Strict mode for production compliance | `false` |
| `test-live` | Test live endpoint with A2A messages | `false` |
| `skip-signature` | Skip cryptographic signature checks | `false` |

## Structure

```
validate-a2a/
├── action.yml               # GitHub Action definition
├── src/                     # TypeScript source
├── dist/                    # Compiled output (committed for Actions)
├── package.json
└── tsconfig.json
```

## Critical Rules

- **`dist/` must be committed** — GitHub Actions run from the repo, not npm
- After any `src/` change: `pnpm build` then commit `dist/`
- Validation logic should use capiscio-core where possible
- Version must stay aligned with capiscio-core

## Publishing

Tag push triggers the action version update:
```bash
git tag v2.4.1 && git push origin v2.4.1
```
Also update the major version tag:
```bash
git tag -f v2 && git push origin v2 --force   # Users reference @v2
```
