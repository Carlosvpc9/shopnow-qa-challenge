# AI session log

Raw material for `ai/README.md` (see CLAUDE.md, "AI usage log").

### 2026-11-12 — Automated tests for BUG-01…BUG-11 (POM)
- Tool/model: Claude Opus 5.5 (Claude app, agent mode with access to the repo folder).
- Delegated: writing the Playwright suite with a Page Object Model (`tests/pages`, `tests/api/ShopApi.ts`, `tests/data/testData.ts`, `tests/fixtures.ts`) and one spec per area (cart, coupons, checkout, stock, orders); strengthening the team's existing cart test.
- Claude checked:
  - Ran the full suite against the app as shipped: 23 bug tests failed, each on an assertion that matches its bug (e.g. BUG-09 `$25.04` vs `$25.05`, BUG-04 `200` vs `404`, BUG-01 lands on `/checkout` instead of the order). The 2 non-bug tests passed.
  - Applied throwaway fixes for every bug in a separate copy of the app (not in the repo) and re-ran: 25/25 passed. This shows each test fails only because of its bug.
  - Runs were in Claude's Linux workspace with system Chrome, because the repo's `node_modules` are Windows builds and the Playwright browser download was blocked there.
- QA checked: pending (run `npm test` on your machine).
- Discarded/corrected:
  - Constructor parameter properties (`constructor(readonly page: Page)`) crashed Node's TypeScript loader; replaced with explicit fields.
  - A first version of the "never charged while told it failed" test used a convoluted `expect.poll`; simplified to an explicit wait plus an API check.
  - BUG-12…14 got no tests, because they depend on PO answers.
- Evidence: test run output (23 failed / 2 passed on the shipped app; 25 passed with the fixes).

### 2026-11-12 — Separate UI tests from API tests
- Tool/model: Claude Opus 5.5.
- Delegated: reorganize the suite into `tests/ui/` (browser + page objects) and `tests/api/` (`request` + `ShopApi`); move the API client to `tests/support/ShopApi.ts`; move the team's `login.spec.ts` into `tests/ui/`.
- Claude checked: the same 25 tests ran after the move. On the shipped app: 23 failed (all bug tests) and 2 passed. With throwaway fixes in a separate copy of the app: 25 passed. Each test kept its name and assertions.
- QA checked: pending.
- Discarded/corrected: nothing.
- Evidence: test run output.
