# Contributing to Moonshine Partner Command Center

This repo is a static-first Funding Partners OS for Moonshine Capital. Contributions should keep the product practical, compliant, accessible, and easy to deploy.

The job is not to build a spaghetti palace. The job is to ship a clean partner operating layer that can become real infrastructure later.

## Core Contribution Rules

1. **Keep it static-first.**
   Do not introduce frameworks, package managers, build tools, backend dependencies, database clients, auth SDKs, or server-only assumptions unless the batch explicitly asks for example-only files.

2. **Generate complete files.**
   When replacing a file, provide the full replacement file unless a patch is explicitly requested.

3. **Use relative links.**
   Pages should work on static hosts and local review.

4. **Use vanilla JavaScript.**
   Prefer readable browser-safe JavaScript.

5. **Use namespaced globals.**
   Shared code should attach to:
   - `window.MoonshineOS`
   - `window.MoonshineData`

6. **Use localStorage only for demo state.**
   Do not store sensitive borrower data. Do not imply local data is synced.

7. **Use mock data honestly.**
   Mock leads, partners, commissions, events, offers, and resources must be clearly treated as examples.

8. **Avoid misleading funding claims.**
   No guaranteed approvals. No guaranteed funding. No guaranteed income. No guaranteed commissions.

9. **Make it accessible.**
   Use semantic HTML, labels, keyboard-friendly controls, visible focus states, and responsive layouts.

10. **Keep the design cohesive.**
    Use the shared design system once Batch 02 exists.

## Repo Architecture

Expected final architecture:

```text
/
  Public pages
  Dashboard shell
  Root docs and deployment files

/styles/
  Shared design system

/scripts/
  Shared JavaScript helpers

/data/
  Mock data and reusable content

/dashboard/
  Dashboard support modules

/welcome/
  Partner welcome flow

/tools/
  Partner utility tools

/widgets/
  Embeddable widget prototype

/admin/
  Static operator prototype

/developers/
  Developer documentation pages

/integrations/
  Integration blueprints

/api/
  Example-only backend/serverless files

/assets/
  Brand and visual assets
```

## Coding Standards

## HTML

Use:

- `<!doctype html>`
- `<html lang="en">`
- Responsive viewport meta tag.
- Semantic landmarks:
  - `header`
  - `nav`
  - `main`
  - `section`
  - `footer`
- Descriptive page titles.
- Meta descriptions for public pages.
- Accessible buttons and links.
- Labels for form fields.
- Helpful empty states.

Avoid:

- Inline event handlers when practical.
- Unlabeled inputs.
- Placeholder-only form labels.
- Dead links.
- Fake login claims.
- Hidden critical disclaimers.

## CSS

Use:

- CSS custom properties from `/styles/tokens.css`.
- Shared components from `/styles/components.css`.
- Utility classes from `/styles/utilities.css`.
- Mobile-first responsive patterns.
- Visible focus styles.
- High contrast.

Avoid:

- Random one-off color values when tokens exist.
- Large page-specific duplication.
- Overly fragile selectors.
- Animation that blocks usability.
- Hover-only interaction.

## JavaScript

Use:

- Plain JavaScript.
- Defensive DOM checks.
- Small reusable functions.
- Event delegation where useful.
- Safe JSON parsing.
- Namespaced globals.

Recommended pattern:

```js
window.MoonshineOS = window.MoonshineOS || {};

window.MoonshineOS.example = {
  init() {
    // Initialize feature.
  }
};
```

Avoid:

- Module imports unless explicitly required.
- External CDN dependencies unless approved.
- Hard crashes when an element is missing.
- Storing sensitive personal or borrower data.
- Pretending localStorage is secure persistence.

## localStorage Standards

Use key prefix:

```text
moonshine.partnerOS.
```

Recommended helper behavior:

- `get(key, fallback)`
- `set(key, value)`
- `remove(key)`
- `clearNamespace()`
- `exportState()`
- `importState(json)`

Important:

- Treat all localStorage data as local browser demo state.
- Never store Social Security numbers, bank account details, tax IDs, full loan applications, or sensitive documents.
- Keep sample data obviously fictional.

## Compliance Language

Do not write copy that says or implies:

- “Guaranteed approval.”
- “Guaranteed funding.”
- “Everyone qualifies.”
- “Risk-free.”
- “Guaranteed commissions.”
- “Earn X dollars automatically.”
- “Submit and get funded.”
- “We approve all businesses.”

Safer alternatives:

- “Explore funding options.”
- “Funding options may vary.”
- “Submission does not guarantee approval or funding.”
- “Projected commissions are examples only.”
- “This tool is for education and workflow planning.”
- “Partners are responsible for accurate, permission-based referrals.”

## Partner Responsibility Copy

Where relevant, include reminders that partners should:

- Refer businesses truthfully.
- Avoid making funding promises.
- Get permission before submitting contact information.
- Present funding as subject to review.
- Respect privacy and consent.
- Follow applicable marketing, lending, privacy, and referral rules.

## Accessibility Checklist

Before considering a page complete, confirm:

- Page has a logical heading structure.
- Forms use labels.
- Buttons have clear text.
- Links describe their destination.
- Keyboard focus is visible.
- Interactive controls can be reached by keyboard.
- Color contrast is strong.
- Mobile layout is usable.
- Tables have headings.
- Alerts or notices are readable without relying only on color.

## Static Deployment Checklist

Before merging deployment-related changes:

- No required build command.
- No required install command.
- No framework-specific config.
- Links work as static relative paths.
- Missing routes have `404.html`.
- `vercel.json` does not imply real backend APIs.
- Public pages can be opened directly.
- Dashboard can be opened directly.
- Tool pages can be opened directly.

## Pull Request Checklist

A contribution is ready when:

- [ ] File paths match the roadmap.
- [ ] Files are complete.
- [ ] Static-first assumptions are preserved.
- [ ] No backend dependency is added unless clearly example-only.
- [ ] No misleading funding, approval, income, or commission claims are introduced.
- [ ] localStorage use is namespaced.
- [ ] Mock data is labeled or obvious.
- [ ] HTML is semantic.
- [ ] Forms have labels.
- [ ] Focus states are visible.
- [ ] Mobile layout is considered.
- [ ] Relative links are used.
- [ ] README/ROADMAP/CHANGELOG are updated if needed.

## Commit Message Style

Use practical commit messages:

```text
Batch 02: add global design system
Batch 05: add public partner acquisition pages
Batch 09: upgrade partner dashboard
Fix: correct dashboard resource links
Docs: update integration roadmap
```

## Batch Workflow

When working batch-by-batch:

1. Start with the batch manifest.
2. Create only the files for that batch.
3. Do not jump ahead into later batches.
4. Use complete file contents.
5. Update `CHANGELOG.md` if committing completed work.
6. Confirm no backend dependencies were introduced.

## Future Backend Contributions

Backend work should not be mixed into static build batches unless explicitly requested.

When backend work begins, document:

- Runtime target.
- Environment variables.
- Auth approach.
- Data storage.
- API validation.
- Rate limiting.
- Logging.
- Error handling.
- Privacy posture.
- Security assumptions.
- Local development steps.

Until then, backend-like files under `/api/` are example-only and should say so clearly.

## Contributor Mindset

Build like this will eventually become real infrastructure.

That means:

- Keep seams clean.
- Keep copy honest.
- Keep state predictable.
- Keep UI useful.
- Keep partner workflows obvious.
- Keep the repo easy to reason about.

No vaporware cosplay. No fake enterprise fog machine. Build the thing so a partner can actually use it.
