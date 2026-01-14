# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.3.1] - 2025-01-14

### Changed
- **CORE VERSION**: Now downloads `capiscio-core` v2.3.1

### Fixed
- Aligned all version references across package metadata

## [2.3.0] - 2025-01-13

### Changed
- **CORE VERSION**: Now downloads `capiscio-core` v2.3.0
- **RFC-002 v1.3**: Badge validation now includes staleness fail-closed behavior

## [2.2.0] - 2025-12-10

### Changed
- **VERSION ALIGNMENT**: All CapiscIO packages now share the same version number.
- **CORE VERSION**: Now downloads `capiscio-core` v2.2.0

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
