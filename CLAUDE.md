# clean-vibe — Full Application Documentation
Last updated: 2026-03-23 | v1.4.7

This document is the authoritative reference for a new Claude session working on clean-vibe.
Read this before touching any code.

---

## What it is

clean-vibe is an AI-powered Clean Code reviewer. It traverses any GitHub repository,
analyzes every source file against Robert C. Martin's Clean Code principles, and produces
an interactive filterable report plus a downloadable markdown file.

Single `index.html`. Zero dependencies. No build step. No server.

---

## Repo

- **GitHub:** https://github.com/Triple-Moon-Goddess/clean-vibe
- **Live app:** https://triple-moon-goddess.github.io/clean-vibe/
- **Blog:** https://triple-moon-goddess.github.io/clean-vibe/blog.html
- **License page:** https://triple-moon-goddess.github.io/clean-vibe/license.html
- **Cloudflare Worker proxy:** https://clean-vibe-proxy.lisa-f9c.workers.dev
- **Owner:** Triple Moon Goddess org (Triple-Moon-Goddess on GitHub)
- **Author:** lisa@triplemoongoddess.com

---

## Files in the repo

```
index.html        — the entire application (HTML + CSS + JS, single file)
worker.js         — Cloudflare Worker proxy source (must be manually deployed in CF dashboard)
blog.html         — blog post introducing clean-vibe
license.html      — commercial license purchase page (Stripe payment links embedded)
LICENSE           — dual license: free non-commercial, paid commercial
README.md         — public documentation
CONTRIBUTING.md   — contribution guidelines
CHANGELOG.md      — version history (at repo ROOT)
package.json      — version source of truth
.gitignore
sitemap.xml
google15980f07fff87d52.html  — Google Search Console verification
.github/ISSUE_TEMPLATE/      — bug and feature request templates
```

---

## Architecture

### Deployment
- **GitHub Pages** serves `index.html`, `blog.html`, `license.html` from `main` branch root
- **Cloudflare Worker** (`clean-vibe-proxy.lisa-f9c.workers.dev`) proxies all API calls
  because GitHub Pages origin cannot make direct cross-origin requests to Anthropic or GitHub APIs

### The proxy (worker.js)
All API calls route through the Cloudflare Worker. Two modes:

1. **GitHub API** — triggered by `?target=github&path=/repos/...`
   - Forwards GET and PUT requests to `api.github.com`
   - Passes through the `Authorization: token ...` header
   - Used for: file tree fetch, file content fetch, `.clean-vibe-ignore` read/write

2. **Anthropic API** — POST requests without `?target=github`
   - Forwards to `https://api.anthropic.com/v1/messages`
   - Passes through `x-api-key` and `anthropic-version` headers

CORS headers allow `*` origin with `Access-Control-Allow-Headers: *`.

**CRITICAL:** `worker.js` in the repo is the source. But Cloudflare does NOT auto-deploy
from GitHub. Any change to `worker.js` must ALSO be manually pasted into the Cloudflare
dashboard at https://dash.cloudflare.com → Workers & Pages → `clean-vibe-proxy` → Edit code → Deploy.

### Data flow
```
Browser (GitHub Pages)
  → Cloudflare Worker proxy
    → GitHub API (file tree, file content, .clean-vibe-ignore)
    → Anthropic API (Claude Haiku + Sonnet)
  ← Results stored in browser memory (S.results, S.sonnetResults)
  ← Scan results persisted to localStorage
  ← False positives / ignores persisted to .clean-vibe-ignore in the scanned repo
```

---

## Application state (S object)

```javascript
let S = {
  repo: '',              // 'owner/repo'
  branch: 'main',
  token: '',             // GitHub PAT
  claudeKey: '',         // Anthropic API key
  dirs: [],              // [{name, files, estMins}] — from file tree
  selectedDirs: new Set(),
  results: {},           // {path: {violations, summary}} — Haiku results
  sonnetResults: {},     // {path: {violations, summary}} — Sonnet results
  contentCache: {},      // {path: string} — file content, in-memory only (not persisted)
  dismissed: {},         // {fpKey: true|'reason string'} — false positives
  ignoredFiles: new Set(), // paths of files to ignore entirely
  scannedDirs: new Set(), // dirs already scanned
  scanning: false,
  stopRequested: false,
  ignoreFileDirty: false,
};
```

### Persistence
`persist()` saves to `localStorage` key `clean_vibe_v1`:
- `repo`, `branch`, `results`, `sonnetResults`, `scannedDirs`
- Does NOT persist: `token`, `claudeKey`, `contentCache`, `dismissed`, `ignoredFiles`

`dismissed` and `ignoredFiles` are persisted to `.clean-vibe-ignore` in the **scanned repo**
via GitHub API. They are loaded via `loadIgnoreFile()` on every connect.

---

## UI phases

The app has 5 phases, only one visible at a time via `.phase.active`:

1. **phase-connect** — credential input form + previous session card
2. **phase-estimate** — directory list, batch selection, scan start
3. **phase-scan** — Haiku pass progress, live stats, scan log
4. **phase-sonnet** — Sonnet pass progress log
5. **phase-report** — interactive report with filters, download button, Sonnet CTA

Navigation: `showPhase(name)`, `goConnect()`, `goEstimate()`, `goReport()`

---

## Scan flow

### Pass 1 — Haiku (fast, all files)
1. `doConnect()` — validates inputs, fetches file tree via `ghGet()`, builds `S.dirs`
2. User selects directories
3. `doScan()` — loops through files in selected dirs:
   - Fetches file content via `fetchContent()` (3 retries with 2s/4s/fail backoff)
   - Stores content in `S.contentCache[path]` (in-memory, for Sonnet reuse)
   - Calls `callClaude(HAIKU_SYSTEM, prompt, 'claude-haiku-4-5-20251001')`
   - Prompt includes `buildFalsePositiveContext(path)` — tells AI what was already dismissed
   - Stores result in `S.results[path]`
   - Persists to localStorage after every file
   - 180ms delay between files
   - Aborts on 401/403 errors

### Pass 2 — Sonnet (deep, blockers only)
1. `doSonnetPass()` — runs on files with blockers not yet in `S.sonnetResults`
2. Uses `S.contentCache[path]` if available (same session), otherwise re-fetches
3. Prompt includes: known blockers from Haiku pass + false positive context + full file
4. 1000ms delay between files
5. Stores result in `S.sonnetResults[path]`

### AI prompts

**HAIKU_SYSTEM** — enforces:
- Meaningful names, no abbreviations
- Functions do one thing, one level of abstraction, max ~20 lines, max 3 args, no flag args
- Comments explain why not what
- DRY, SRP, KISS
- No silent failures
- Exceptions not error codes, never return null, never pass null
- No hardcoded magic values
Returns: `{violations:[{severity, principle, section, issue, fix}], summary}`

**SONNET_SYSTEM** — adds:
- Root cause analysis
- Code smell category (Martin's taxonomy)
- Concrete refactored code example
- Additional blockers the Haiku pass may have missed
Returns: `{violations:[{severity, principle, section, issue, fix, rootCause, smellCategory, example}], summary, additionalBlockers}`

**False positive context** — `buildFalsePositiveContext(path)`:
- Reads `S.dismissed` for entries matching this file
- Injects into prompt: "PREVIOUSLY REVIEWED AS FALSE POSITIVES — do NOT re-raise..."
- AI may add a single "FP note:" sentence if strong technical objection
- FP notes render in amber italic with ⚠ prefix

---

## False positive / ignore system

### Per-violation: false positive
- Click `false positive?` button → inline text input appears
- Type reason (optional) + Enter → violation struck through, reason shown in amber
- Stored as `S.dismissed['path/to/file.ts::0'] = true | 'reason string'`

### Per-file: ignore
- Click `ignore this file` → entire file excluded from counts
- Stored in `S.ignoredFiles`

### .clean-vibe-ignore
Both are written to `.clean-vibe-ignore` in the **scanned repo** on every toggle.
Format:
```
# clean-vibe ignore file
# Lines without :: ignore the whole file
# Lines with :: ignore a specific violation (path::index)

src/vite.config.ts
src/constants.ts::0  # follows Rollup naming convention
src/constants.ts::2
```

Loaded on every `doConnect()` call via `loadIgnoreFile()`.
Saved via `saveIgnoreFile()` after every toggle.

### Counts
- `countAll(results)` — excludes dismissed violations and ignored files
- Per-file badge counts also exclude dismissed violations
- Files where all violations are dismissed show green `✓ fp` badge and count as clean
- Files with some dismissed show amber `N fp` badge

---

## Versioning — MANDATORY RULES

**Every version bump must update ALL FIVE of these:**
1. `const VERSION = 'x.x.x'` in `index.html` (JS constant)
2. `>vx.x.x<` version display div in `index.html` (HTML)
3. `"version": "x.x.x"` in `package.json`
4. `vx.x.x` in `blog.html`
5. `vx.x.x` in `license.html`
6. New entry in `CHANGELOG.md`

Version format: MAJOR.MINOR.PATCH
- PATCH: bug fixes
- MINOR: new features
- MAJOR: breaking changes

Current version: **1.4.7**

---

## Deployment — MANDATORY RULES

All changes are pushed via GitHub Contents API using the token.
GitHub Pages auto-deploys from `main` branch root (~1-2 min after push).

**Before every push:**
1. Fetch the current file SHA from GitHub API
2. Read the current content
3. Make targeted changes
4. Push with the correct SHA

**Never use string replacement on the live file without first reading and verifying structure.**

**After every push, verify:**
- `<!DOCTYPE` count = 1
- `<html` count = 1
- `<head>` count = 1
- `<body` count = 1
- `<script>` count = 1
- `id="phase-connect"` count = 1
- `<div class="app">` count = 1
- `const PROXY` count = 1 (must be TOP-LEVEL, not inside a function)
- `const VERSION` count = 1

**Cloudflare Worker** must be manually redeployed after any `worker.js` change.

---

## Known issues to fix (as of v1.4.7)

### CRITICAL: CORS on GitHub API calls
**Error:** `Access-Control-Allow-Headers` in preflight does not allow `Authorization` header.
**Root cause:** The Cloudflare Worker's `OPTIONS` response has `'Access-Control-Allow-Headers': '*'`
but some browsers don't accept wildcard for credentialed requests with `Authorization` header.
**Fix needed:** In `worker.js`, change CORS header to explicit list:
```javascript
'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version, Authorization, Accept',
```
Then **redeploy the worker** in the Cloudflare dashboard — this CANNOT be done from code alone.

### favicon 404
`GET https://triple-moon-goddess.github.io/favicon.ico 404`
**Root cause:** `index.html` references `favicon.ico` but no `favicon.ico` file is in the repo.
The SVG inline favicon fallback is there and works — the 404 is the browser trying the `.ico` path.
**Fix:** Either add a `favicon.ico` file to the repo, or remove the `<link rel="icon" href="favicon.ico">` line.

---

## File extension / skip rules

**Scanned:** `.ts` `.tsx` `.js` `.jsx` `.py` `.java` `.cs` `.go`

**Skipped (SKIP_PATTERNS):**
`node_modules`, `dist/`, `build/`, `*.min.js`, lockfiles, `.map`, `.svg`, `.png`,
`.ico`, `.json`, `.md`, `.css`, `.html`, `.env`, `CHANGELOG`, `vite-env`, `.d.ts`,
`.jpg`, `.jpeg`, `.gif`, `.woff`, `.ttf`, `.eot`, `public/`, `coverage/`

---

## License

Dual license:
- **Free** for personal projects, academic research, open source (non-revenue)
- **Paid** for commercial use (for-profit orgs, client work, products)

Tiers:
- Individual: $100/year (1 developer)
- Team: $500/year (up to 10 developers)
- Organization: $1,500/year (unlimited)

Purchase: https://triple-moon-goddess.github.io/clean-vibe/license.html
Contact: lisa@triplemoongoddess.com

---

## GitHub token

Lisa shares her GitHub token in sessions for deployment work.
The token used throughout development: stored in session memory.
Repo ID for workflow API calls: `1149369458` (not used by clean-vibe itself, but relevant for TMG main app).

---

## What NOT to do

- **Never** make string replacements without reading the file from GitHub first
- **Never** inject content into HTML tags (the corruptions in this session came from bad str_replace)
- **Never** assume the local `/home/claude/clean-vibe/` files are current — always fetch from GitHub
- **Never** forget to update ALL FIVE version locations on a bump
- **Never** push worker.js changes without also updating the Cloudflare dashboard manually
- **Never** use `sed` or simple string operations on the HTML — the file has complex nested JS strings
  Use Python with explicit line-number surgery or full file replacement instead
