# Contributing to clean-vibe

Thanks for your interest. A few ground rules.

## Before you open a PR

- Check open issues first — your idea may already be tracked
- For significant changes, open an issue to discuss before writing code
- All contributions are subject to the project license (non-commercial free, commercial paid)
  By submitting a PR you agree your contribution may be included in commercial releases

## Code standards

This project enforces its own rules on itself. Before submitting:

- Run the scanner on your changes
- Zero new blockers permitted
- Warnings require a written justification in the PR description

## What we want

- Additional language support (Ruby, Rust, Swift, Kotlin)
- New Clean Code rule categories with citations from the book
- Report export formats (JSON, CSV, HTML)
- GitHub Action for CI integration
- Performance improvements for large repos
- Accessibility improvements

## What we don't want

- Dependencies — this is intentionally zero-dep
- Build steps — single `index.html` is a feature
- Rule opinions not grounded in Martin's book or widely accepted clean code literature

## Commit messages

Plain English. What changed and why, not what files were touched.

Good: `Add Ruby support to file extension filter — closes #12`
Bad: `Update index.html`

## Questions

lisa@triplemoongoddess.com
