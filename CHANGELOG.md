# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-21

### Changed
- **Core Migration**: Migrated from legacy Node.js CLI (`capiscio-cli`) to high-performance Go binary (`capiscio-core` v1.0.2).
- **Performance**: Removed `npm install -g` step, significantly reducing action startup time.
- **Platform Support**: Added native support for Linux, macOS, and Windows runners (AMD64/ARM64).
- **License**: Changed license from MIT to Apache-2.0 to align with the CapiscIO ecosystem.

### Fixed
- Improved error handling during binary download and execution.

## [1.0.0] - 2025-10-15

### Added
- Initial release of `validate-a2a` GitHub Action.
- Support for `agent-card.json` validation.
- Three-dimensional scoring (Compliance, Trust, Availability).
- Inputs for `strict`, `test-live`, `skip-signature`, `timeout`, and `fail-on-warnings`.
