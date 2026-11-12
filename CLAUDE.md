# ShopNow QA Challenge

ShopNow is a small e-commerce site whose bugs are reaching production. This repo holds the app and the QA work: spec analysis, bug reports and Playwright regression tests.

- **App (`app/`):** an Express API (`app/server`) and a React + Vite front end (`app/web`), with data stored in JSON (`app/data`). It runs at http://localhost:4321.
- **Flows:** catalog (search, category filter), product detail, cart (quantities, one coupon), login, checkout (simulated payment), My orders / My payments.
- **References:** `SPEC.md`, `USER_REPORTS.md`, `docs/API.md`.
- **Deliverables:** `ANALYSIS.md`, `BUGS.md`, `tests/`, `ai/README.md`.

## Rules

### Repository
- Don't edit `README.md`.
- `app/` changes are only bug fixes: one commit per bug, with the bug ID in the message.
- Bugs go in `BUGS.md` using its format, with IDs `BUG-01`, `BUG-02`, … sorted by priority.
- When the spec is unclear, write the item as an assumption: "I assume X; if the PO confirms Y, this is a bug."
- Anything that can't be verified locally is written down as an assumption or a PO question.
- Automation with any tool other than Playwright goes in a separate folder, explained in `TESTING.md`.

### Tests
- The test name includes the bug ID: `test("[BUG-03] <what should happen>", ...)`.
- Each spec has `resetData` in `beforeEach`.
- Locate elements with `data-testid` only.
- Test through the UI or the documented API. Tests never read or modify `app/`.
- Tests fail today because of the bug and pass once it is fixed.
- No `test.fail`, `test.fixme`, `test.skip` or `test.only`.
- No mocking. Don't change the URL or port in `playwright.config.ts`. No new dependencies.

### Test structure (Page Object Model)
- `tests/ui/`: browser tests, which go through the page objects.
- `tests/api/`: API tests, which go through `tests/support/ShopApi.ts`.
- `tests/pages/`: one page object per screen, with `getByTestId` locators and user-intent actions. No assertions in page objects.
- Shared code: `tests/fixtures.ts`, `tests/helpers.ts`, `tests/data/testData.ts`.

## Commands
- `npm install`, `npm run dev`, `npm test`, `npm run reset`.
- Run one layer: `npx playwright test tests/ui` or `npx playwright test tests/api`.
