# Changelog

All notable changes to the Moonshine Partner Command Center repo will be documented in this file.

This project follows a batch-based build process. Each batch should produce complete, repo-ready files.

## [Unreleased]

### Planned

- Batch 01 — Deployment and Root Utility Files
- Batch 02 — Global Design System
- Batch 03 — Shared Script Layer
- Batch 04 — Data Layer
- Batch 05 — Public Acquisition Pages
- Batch 06 — Compliance and Legal Pages
- Batch 07 — Partner Access and Welcome Flow
- Batch 08 — Dashboard Modular Support Files
- Batch 09 — Dashboard Main File Upgrade
- Batch 10 — Tools Layer
- Batch 11 — Embeddable Widget Layer
- Batch 12 — Admin / Ops Static Prototype
- Batch 13 — Developer Documentation Pages
- Batch 14 — Integration Blueprints
- Batch 15 — API Example Layer
- Batch 16 — Asset Placeholders and Final QA

## [Batch 00] — Repo Build Map and Implementation Rules

### Added

- `README.md`
  - Defines product identity, static-first architecture, target repo structure, localStorage behavior, compliance guardrails, accessibility expectations, design direction, deployment notes, and future backend upgrade path.

- `ROADMAP.md`
  - Defines phased implementation plan, batch order, acceptance criteria, priority sequence, future backend milestones, compliance roadmap, and definition of done.

- `CHANGELOG.md`
  - Adds batch-based project history tracking.

- `CONTRIBUTING.md`
  - Defines contribution rules, coding standards, static-first requirements, accessibility expectations, compliance rules, naming conventions, local review process, and pull request checklist.

### Notes

- This batch is documentation-only.
- No backend dependency was added.
- No framework dependency was added.
- No package manager dependency was added.
- No build step was added.

## Versioning Notes

This repo does not need formal semantic versioning during early static buildout.

Recommended version rhythm:

- `0.1.x` — Static foundation and public pages.
- `0.2.x` — Dashboard and partner tools.
- `0.3.x` — Widgets, admin prototype, developer docs.
- `0.4.x` — Integration blueprints and API examples.
- `1.0.0` — Static product demo considered complete and ready for real backend planning.

## Changelog Rules

For each future batch, add a new section using this format:

```markdown
## [Batch XX] — Batch Name

### Added

- New files created.

### Changed

- Existing files replaced or meaningfully modified.

### Fixed

- Bugs, broken links, bad assumptions, or static deployment issues corrected.

### Notes

- Important implementation notes.
- Known limitations.
- Follow-up work.
```

## Compliance Note

Changelog entries should not imply that example files provide real funding decisions, real underwriting, real commissions, real API processing, or guaranteed partner outcomes.

Use clear labels:

- Static demo.
- Mock data.
- Example only.
- Local browser storage.
- Future backend placeholder.
