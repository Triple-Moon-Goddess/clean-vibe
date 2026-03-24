# Changelog

## [1.5.8] — 2026-03-24

### Fixed
- Large files were showing truncation warnings without blockers: the blocker was injected after the AI call, but if the AI call threw an error (common on large files due to token limits), the catch block stored an empty violations array — no blocker. Fixed: AI call is now skipped entirely for files over 14KB. The blocker is recorded unconditionally before any AI call. Sonnet pass also skips large files since the Haiku blocker is already present.

## [1.5.7] — 2026-03-24

### Added
- Large file blocker: files exceeding 14KB now get a blocker violation injected — "File too large to review — only first 14KB analysed, remainder unreviewed" — surfacing as a blocker in the report rather than just a warning in the scan log. Applies to both Haiku and Sonnet passes. The violation is dismissable as a false positive if intentional.

## [1.5.6] — 2026-03-24

### Fixed
- "Maximum call stack size exceeded" when saving `.clean-vibe-ignore` with many entries: `String.fromCharCode(...bytes)` spread operator passes every byte as a separate function argument — exceeds JS call stack on large files. Replaced with `Array.from(bytes, b => String.fromCharCode(b)).join('')` which is safe at any size.

## [1.5.5] — 2026-03-23

### Fixed
- Unicode corruption in `.clean-vibe-ignore`: em dashes, curly quotes, and any non-ASCII characters in false positive reasons were saved correctly but loaded back as mojibake (e.g. `—` became `ÃÂÃÂ...`)
- Root cause: `saveIgnoreFile` used `btoa(unescape(encodeURIComponent()))` which encodes UTF-8 correctly, but `loadIgnoreFile` used bare `atob()` which decodes base64 to raw Latin-1 bytes without converting back to UTF-8
- Fix: save now uses `TextEncoder` to get UTF-8 bytes before base64; load now uses `TextDecoder` to decode bytes back to a proper UTF-8 string

## [1.5.4] — 2026-03-23

### Fixed
- JSON parse error on files with many violations: `max_tokens` raised from 1200 to 2048 — large TypeScript files were causing the AI to hit the token limit mid-response, producing truncated JSON that failed to parse

## [1.5.3] — 2026-03-23

### Fixed
- False positives being ignored by AI: dismissed violations were listed before the code in the prompt — after 14KB of code the AI had lost the instruction by the time it generated its response. Moved FP context to after the code in both Haiku and Sonnet prompts so it's the last thing the AI reads before responding.

## [1.5.2] — 2026-03-23

### Fixed
- False positives re-appearing on re-scan — two root causes:
  1. `renderReport` iterated `visVs` (filter-filtered array) for violation indices — when filters hid earlier violations, `vi` in `visVs` didn't match the `vs` index stored in `S.dismissed`, so `isDismissed` lookups silently failed. Fixed: now iterates `vs` (full array) with original indices, skipping non-visible violations inline.
  2. `buildFalsePositiveContext` sent index numbers to the AI (e.g. "violation 0") — if the AI returned violations in a different order on re-scan, index 0 no longer matched the dismissed item. Fixed: now sends the actual violation issue text so the AI matches by content.

## [1.5.1] — 2026-03-23

### Fixed
- GitHub token validation false-positive: token/key inputs now strip Unicode non-breaking spaces (\u00a0) and zero-width characters (\u200b etc.) that .trim() misses — common when copying from password managers or mobile keyboards
- Token validation error now shows the first 6 characters of what was received, making hidden-character issues visible to the user

## [1.5.0] — 2026-03-23

### Fixed
- False positives were being re-raised on re-scan despite being dismissed — root cause: system prompts had no FP rules, so the AI's "strict reviewer" persona overrode the user-message hint
- Added explicit FALSE POSITIVES section to both HAIKU_SYSTEM and SONNET_SYSTEM: dismissed violations must be omitted from the violations array entirely, not reworded or re-raised at lower severity
- Strengthened `buildFalsePositiveContext` wording from "treat as false positives" to "DO NOT raise these again under any circumstances" with explicit instruction to omit from violations array

## [1.4.9] — 2026-03-23

### Fixed
- Network offline / proxy unreachable now shows friendly error ("check your internet connection") instead of raw `TypeError: Failed to fetch` — applies to both GitHub API calls and Claude API calls
- AI malformed JSON response now shows friendly error instead of raw `SyntaxError` from `JSON.parse`
- Sonnet pass now aborts on 401/403 auth errors (same behaviour as Haiku scan) instead of silently logging per-file and continuing

## [1.4.8] — 2026-03-23

### Fixed
- `loadIgnoreFile` no longer wipes `S.dismissed` and `S.ignoredFiles` before the fetch completes — if the load fails for any reason, existing in-memory state is preserved
- `persist()` now saves `dismissed` and `ignoredFiles` to localStorage — previously these were lost on page reload and `loadPrior` could not restore them
- CORS on GET requests now fixed (Cloudflare Worker redeployed)

## [1.4.7] — 2026-03-23

### Fixed
- `buildFalsePositiveContext` was called but never defined — caused "is not a function" crash on every file scan
- `.clean-vibe-ignore` 404 on first use no longer emits a spurious console warning (expected when file doesn't exist yet)

## [1.4.6] — 2026-03-23

### Improved
- Input validation: repo format auto-normalised (paste full GitHub URL or owner/repo)
- Input validation: GitHub token format check (must start with ghp_ or github_pat_)
- Input validation: Anthropic key format check (must start with sk-ant-)
- GitHub errors translated to plain English: 401 → token expired/wrong scope, 403 → no permission, 404 → repo/branch not found, 429 → rate limit
- Claude API errors translated: 401 → bad key, 429 → rate limit, 500/529 → overloaded
- Zero scannable files: explicit error with supported extensions listed
- File truncation: logged in scan/sonnet log when file exceeds 14KB limit
- Auth errors (401/403) during scan now abort the whole scan immediately
- saveIgnoreFile failures now shown to user as toast notification (previously silent)

## [1.4.5] — 2026-03-23

### Fixed
- Favicon 404: added `favicon.ico` (16×16, ✦ star in clean-vibe blue) to repo root; browsers now resolve `/favicon.ico` without console errors
- CORS: deployed Cloudflare Worker now matches `worker.js` — GET/PUT requests to `?target=github` correctly return `Access-Control-Allow-Origin: *` on all response codes

## [1.4.4] — 2026-03-23

### Fixed
- CORS preflight now passes: worker uses wildcard for Access-Control-Allow-Headers
- Favicon 404 resolved with inline SVG data URI — no separate file needed

## [1.4.3] — 2026-03-23

### Fixed
- Removed duplicate script block — JS was being loaded twice causing double execution
- Removed duplicate version display div in header
- PROXY constant moved to correct top-level scope — fixes "PROXY is not defined" error
- GitHub API calls now routed through Cloudflare Worker proxy — fixes CORS on GitHub Pages

## [1.4.2] — 2026-03-22

### Fixed
- GitHub API calls now routed through Cloudflare Worker proxy — fixes CORS errors on GitHub Pages
- Affects file tree fetch, file content fetch, and .clean-vibe-ignore read/write

## [1.4.1] — 2026-03-22

### Changed
- AI now acknowledges false positive decisions but may add a single "FP note:" if it has a strong technical objection
- FP notes render in amber italic with a ⚠ prefix — distinct from regular fix suggestions
- Developer decision is always respected — FP notes are informational only, not re-raised violations

## [1.4.0] — 2026-03-22

### Added
- False positive context fed into both Haiku and Sonnet analysis prompts
- AI is told which violations were previously dismissed and why, preventing re-raising of already-reviewed items
- Eliminates the cycling problem where the AI contradicts prior session decisions

## [1.3.3] — 2026-03-22

### Changed
- False positive counts shown separately in file header badges (amber `N fp`) and summary row
- Per-file B/W/S counts now exclude dismissed violations
- Files with all violations dismissed show green `✓ fp` badge and count as clean

## [1.3.2] — 2026-03-22

### Fixed
- File violation panels no longer close when marking a false positive — open state is preserved across re-renders

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
