# clean-vibe

> AI-powered Clean Code reviewer for GitHub repositories.

Traverses any GitHub repo, analyzes every source file against Robert C. Martin's *Clean Code* principles, tags violations by severity (blocker / warning / suggestion), deep-dives blockers with a Sonnet pass, and produces an interactive filterable report plus a downloadable markdown file.

Built by [Triple Moon Goddess](https://triplemoongoddess.com) · Free for non-commercial use · [Commercial license](https://triplemoongoddess.com/clean-vibe/license)

---

## Features

- **Full repo traversal** via GitHub API — any public or private repo
- **Batch scanning** — estimates time per directory, scan in runs, results persist across sessions
- **Two-pass analysis**
  - Haiku pass: fast scan of every file
  - Sonnet re-analysis: deep dive on all blocker-level violations
- **Severity tagging** — blocker / warning / suggestion
- **Interactive report** — filter by severity, search by filename, expand per-file violations
- **Downloadable markdown** — full report as `.md` at any point
- **localStorage persistence** — resume across browser sessions
- **Zero dependencies** — single `index.html`, no build step, no server

---

## Quickstart

```bash
git clone https://github.com/triplemoongoddess/clean-vibe.git
cd clean-vibe
open index.html
# or serve locally:
npx serve .
```

1. Enter your GitHub repo (`owner/repo`), branch, and a [GitHub personal access token](https://github.com/settings/tokens) with `repo` scope
2. Enter your [Anthropic API key](https://console.anthropic.com/)
3. Click **Connect + estimate**
4. Select directories and click **Start scan**
5. After the Haiku pass, click **Re-analyze blockers with Sonnet**
6. Download the markdown report

---

## Two-pass analysis

### Pass 1 — Haiku (fast, full coverage)
Every scannable file analyzed for Clean Code violations. Returns severity, principle label, section reference, and fix suggestion.

Skipped: `node_modules`, `dist`, `*.min.js`, lockfiles, `.map`, `.svg`, `.json`, `.css`, `.html`, `.env`, `.d.ts`

Scanned: `.ts` `.tsx` `.js` `.jsx` `.py` `.java` `.cs` `.go`

### Pass 2 — Sonnet (deep, blockers only)
All blocker files re-analyzed with expanded prompt covering root cause, Martin's code smell taxonomy, and a concrete refactored example.

---

## Clean Code principles enforced

Martin ch. 2 — Meaningful names · ch. 3 — Functions (SRP, max args, no side effects) · ch. 4 — Comments (why not what) · ch. 7 — Error handling (no null, exceptions not codes) · ch. 10 — Classes (SRP, cohesion) · ch. 17 — DRY, KISS, Boy Scout Rule

---

## API cost estimates

| Repo size | Haiku pass | Sonnet blocker pass | Total |
|-----------|-----------|---------------------|-------|
| 50 files  | ~$0.04    | ~$0.10              | ~$0.15 |
| 200 files | ~$0.15    | ~$0.30              | ~$0.45 |
| 500 files | ~$0.35    | ~$0.60              | ~$1.00 |

---

## Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

Roadmap: GitHub Action, VS Code extension, JSON/CSV export, additional languages.

---

## License

Free for non-commercial use. See [LICENSE](LICENSE).

Commercial use requires an annual subscription.
→ [Purchase license](https://triplemoongoddess.com/clean-vibe/license) · lisa@triplemoongoddess.com
