# QA Challenge — ShopNow

You are part of the QA team at **ShopNow**, a small e-commerce site. The team ships fast and builds with AI agents, and bugs are reaching production. Your job: find what is broken before users do, and leave tests that keep it from happening again.

We are not looking for lots of code. We want to see **how you think** when facing a product that works "almost right", and **how you use AI** to work better.

## Time

There is no fixed time limit, but **the time you take is part of the evaluation**. We record when you click "Start challenge" on The Flock's platform and when you submit. Work focused and submit when you consider your work done: a well-prioritized delivery in less time is worth more than an exhaustive one that takes much longer.

You still have to submit before the deadline shown on the platform.

## Setup (about 5 minutes — it counts toward your time)

1. At the top right of this repo, click **"Use this template" → "Create a new repository"**.
2. Choose **Public** and create the repo in your account. We need to read it to evaluate your work.
3. Clone your repo and start the app (you need **Node 22 or later** and git):

```bash
git clone <your-repo-url> && cd <your-repo>
npm install      # installs everything, including the browser for the tests
npm run dev      # app at http://localhost:4321
```

**No Node, or trouble with your machine?** In your repo, click **Code → Codespaces → Create codespace**. A browser-based environment opens with everything installed; run `npm run dev` and the app opens automatically. Tests (`npm test`) work the same way.

Test users:

| User | Email | Password |
|---|---|---|
| Ana | `ana@shopnow.test` | `Ana12345` |
| Bruno | `bruno@shopnow.test` | `Bruno12345` |

If you mess up the data, `npm run reset` restores it to a fresh install.

**About this environment:** this is a local version of ShopNow. Some things the spec describes may not be available or verifiable here. If you can't verify something, don't spend time working around it: write it down as an assumption or a question for the PO.

## What to do

### 1. Analyze the spec → `ANALYSIS.md`

Read [`SPEC.md`](SPEC.md). Write down the questions you would ask the PO (prioritized), the ambiguities you find and the assumptions you make to move forward.

### 2. Find bugs → `BUGS.md`

- Investigate the 3 user reports in [`USER_REPORTS.md`](USER_REPORTS.md).
- **Look for other bugs nobody reported.** There are several.
- Test through the UI and also through the API ([`docs/API.md`](docs/API.md)).
- Report each bug in `BUGS.md` using the format there, with an ID `BUG-01`, `BUG-02`, etc.
- Optionally save screenshots or videos in `evidence/`.

If something looks like a bug but the spec is unclear, say it as an assumption: "I assume X; if the PO confirms Y, this is a bug." That counts in your favor.

### 3. Automate → `tests/`

Write automated tests that **fail** because of the bugs you found. Once the team fixes them, those tests must pass and stay as regression tests.

- Playwright is already set up. `npm test` runs the suite (it starts the app by itself if it isn't running).
- Each test resets the data, so orders or carts you created by hand are gone after `npm test`. Restarting the app logs you out.
- Check `tests/helpers.ts`: it has functions to reset the data and log in.
- The team left a few tests in `tests/`. Review them.

**Test rules** (we use them to run your tests automatically):

- Put the bug ID in the test name: `test("[BUG-03] <what should happen>", ...)`.
- Every test starts from a clean state (`resetData` in `beforeEach`).
- Use the app's `data-testid` attributes to locate elements.
- Test the app through the UI or the documented API. Don't read or modify the app's internal files (`app/`) from your tests.
- Write plain tests that **fail today** because of the bug. Don't mark them with `test.fail`, `test.fixme`, `test.skip` or `test.only`: we also run them against the fixed version, where they must pass.
- Don't mock the app, and don't change the URL or port in `playwright.config.ts`.
- Only use the dependencies already in the repo.

The automation we evaluate is the Playwright tests in `tests/`. If you also want to show work with another tool, put it in a separate folder and explain how to run it in a `TESTING.md` file. Don't edit this `README.md`: it is the challenge statement.

### 4. Explain how you used AI → `ai/README.md`

Using AI is **mandatory**: this certification validates that you know how to work with it. Fill in `ai/README.md` with the tools you used, what for, what you verified and what you discarded. If you can, add exports, links or snippets of your sessions.

### Optional: technical extension

Not required to pass. If you have time left and you're interested:

- In `BUGS.md`, point out where in the code (`app/`) you think each bug's root cause is.
- Fix one or more bugs in `app/`, in separate commits (one commit per bug, with the ID in the message), and check that your test passes with your fix.

## Submission

1. Commit and push everything to your repo.
2. On The Flock's platform, enter your repo URL and answer the 3 questions: what you did, which AI you used and for what, and what you didn't do and why.

We evaluate the last commit pushed when you submit. Anything pushed after submitting is ignored.

## What we evaluate

- How well you read the spec and spot its gaps.
- Which bugs you find, especially the most severe ones.
- How clear and reproducible your reports are, and whether you classify and prioritize well.
- Whether your tests really detect the bugs.
- How you use AI: what you delegate and how you verify what it gives you.

Good luck!
