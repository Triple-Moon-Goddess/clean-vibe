# Changelog

## [1.3.1] — 2026-03-22

### Fixed
- Files where all violations are marked as false positives now show a green ✓ fp badge
- Such files count as clean in the summary totals
- Filtered correctly under the Clean filter

## [1.3.0] — 2026-03-22

### Added
- False positive reason: clicking "false positive?" now shows an inline text input
- Reason saved to `.clean-vibe-ignore` as an inline comment (e.g. `src/vite.config.ts::0  # follows Rollup naming convention`)
- Reason displayed under the struck-through violation in the report

## [1.2.0] — 2026-03-14

### Added
- `.clean-vibe-ignore` file committed to the scanned repo — false positives and ignored files are now version-controlled and shared across team members
- False positive flags and ignored files written to GitHub via API on every toggle
- Ignore file loaded automatically on connect and scan

## [1.1.0] — 2026-03-14

### Added
- False positive flagging per violation — struck through, persisted
- Per-file ignore — exclude entire files from summary counts
- Summary counts exclude dismissed violations and ignored files

## [1.0.0] — 2026-03-14

### Added
- Initial release
- Two-pass analysis: Haiku (all files) + Sonnet (blockers only)
- Full repo traversal via GitHub API
- Batch scanning with directory selection
- localStorage persistence across sessions
- Filterable interactive report
- Markdown report download
- Cloudflare Worker proxy for CORS
- Dual license: free non-commercial, commercial subscription
