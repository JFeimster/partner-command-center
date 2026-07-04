# Final QA Checklist — Moonshine Partner Command Center

Batch 16 closes the static repo build with brand placeholders and a final QA pass.

## Repo completeness by batch

- [x] Batch 00 — Repo docs and roadmap
- [x] Batch 01 — Deployment and utility files
- [x] Batch 02 — Global design system
- [x] Batch 03 — Shared script layer
- [x] Batch 04 — Data layer
- [x] Batch 05 — Public acquisition pages
- [x] Batch 06 — Compliance/legal pages
- [x] Batch 07 — Partner access and welcome flow
- [x] Batch 08 — Dashboard support modules
- [x] Batch 09 — Main dashboard upgrade
- [x] Batch 10 — Tools layer
- [x] Batch 11 — Widget layer
- [x] Batch 12 — Admin/ops prototype
- [x] Batch 13 — Developer docs
- [x] Batch 14 — Integration blueprints
- [x] Batch 15 — API examples
- [x] Batch 16 — Asset placeholders and final QA

## Manual local QA

Run a static server:

```bash
python -m http.server 8080
```

Open:

```text
http://localhost:8080/index.html
```

Then verify:

- [ ] Homepage loads and routes to partner access, marketplace, resources, pricing, about, dashboard.
- [ ] `partner-access.html` saves a local demo partner profile.
- [ ] `/welcome/index.html` displays saved partner name, company, type, and partner ID.
- [ ] `dashboard.html` renders metrics, profile, leads, marketplace, resources, training, commissions, partner links, notes, integrations, and settings.
- [ ] Dashboard demo lead creation works.
- [ ] Dashboard lead status changes work.
- [ ] Dashboard export/import controls work.
- [ ] Dashboard reset works.
- [ ] `marketplace.html` renders offer cards.
- [ ] `resources.html` renders resources and training modules.
- [ ] Legal pages load: compliance, affiliate disclosure, privacy, terms.
- [ ] Tools load: commission simulator, readiness checklist, sales script generator.
- [ ] Widget loads directly at `/widgets/funding-widget.html`.
- [ ] Widget embed loader works when embedded on a test page.
- [ ] Admin prototype loads at `/admin/index.html`.
- [ ] Developer docs load under `/developers/`.
- [ ] Integration blueprint JSON files parse.
- [ ] API example files are clearly labeled `.example.js`.

## Static hosting QA

- [ ] All relative links work from root pages.
- [ ] Nested pages correctly use `../` paths.
- [ ] No page requires a build step.
- [ ] No page requires React, Next.js, npm install, or bundling.
- [ ] No backend is required for demo behavior.
- [ ] `vercel.json` behavior matches your current deployment intention.
- [ ] `robots.txt` and `sitemap.xml` match the intended domain before launch.

## Compliance QA

- [ ] No page promises guaranteed funding.
- [ ] No page promises guaranteed approval.
- [ ] No page promises guaranteed commissions or income.
- [ ] No page implies live underwriting.
- [ ] No page implies live CRM submission unless a backend is later added.
- [ ] Widget and forms include no-guarantee language.
- [ ] Static demo/localStorage caveats are visible where needed.
- [ ] API docs and examples are clearly marked as example-only.
- [ ] Admin pages are clearly marked as static prototypes.

## Security QA

- [ ] No real API keys or secrets are committed.
- [ ] No real partner or lead data is committed.
- [ ] No sensitive borrower data is included in examples.
- [ ] No production webhook secret appears in the repo.
- [ ] Admin prototype is not presented as secure production admin.
- [ ] Widget does not claim to submit to live backend.
- [ ] Future backend requirements are documented.

## Known intentional limitations

This repo is static-first and intentionally does not include:

- Authentication
- User accounts
- Real partner login
- Real CRM sync
- Real Tally webhook handling
- Real lender/provider routing
- Real underwriting
- Real lead submission API
- Real payout or commission reporting
- Secure backend storage
- Production privacy/terms review

## Recommended next work after Batch 16

1. Commit all batch files locally.
2. Run local smoke tests.
3. Push to GitHub.
4. Verify Vercel deployment settings.
5. Run a link checker or manual click-through.
6. Review visual consistency across nested pages.
7. Decide whether to enable Vercel deployments.
8. Create a production backend branch only after static flow is approved.
9. Convert `.example.js` API files only when backend requirements are ready.
10. Replace placeholder brand assets with production assets.

## Final production-readiness reminder

The static repo is now a complete partner OS prototype and implementation blueprint. It is not yet a production funding portal, CRM, underwriting system, affiliate tracking system, or commission platform.
