# Tag Manager POC — Process Log

> Meta goal: Document every step taken so we can produce a final PRD-to-deployment process file.
> **Final output:** [ai-engineering-process.md](./ai-engineering-process.md) ✅

---

## STEP 1 — `/grill-me` ✅

**When used:** Phase 1 (Idea). First thing before any design or code.
**Why:** Surfaces all assumptions, edge cases, and decision branches before anything is written down.
**How long:** 4 rounds, 17 questions.
**Output:** Full shared understanding of the feature. Zero open questions going into the PRD.

### What grill-me resolved:

- One tag per advertiser (not multiple)
- SQLite as source of truth, `./tags/<advertiser>.js` as output artifact
- Table: Advertiser Name | Tag Name | Edit | Delete + Create button
- Create: 3 fields — advertiser name (unique), tag name, JS code
- Edit: advertiser name read-only, tag name + code editable
- Delete: removes DB record AND deletes the JS file
- JS file shape: IIFE wrapping user's raw code
- Code editor: CodeMirror (not plain textarea)
- Unique advertiser name: DB constraint + UI validation
- No auth, no URL pattern fields (conditions go inside raw JS code)

### Full Q&A transcript: [grill-me-qa-log.md](./grill-me-qa-log.md)

### Key principle learned:

> Don't write a PRD until grill-me has resolved every branch of the decision tree.
> Short-cutting this means the PRD will have gaps, and gaps become bugs during execution.

---

## STEP 2 — `/ubiquitous-language` ✅

**When used:** Phase 1 (Idea). Immediately after grill-me, before PRD.
**Why:** Locks down canonical terms so DB columns, API fields, and UI labels all use the same words.
**Output:** 7 canonical terms defined (Advertiser, Tag, Tag File, Tag Code, Tag Name, Create, Edit, Delete)

### Key principle learned:

> Lock terminology before writing the PRD. If you call it a "tag" in the DB, a "script" in the API, and a "pixel" in the UI, agents will produce inconsistent code that looks correct but has mismatched field names.

---

## STEP 3 — `/write-a-prd` ✅

**When used:** Phase 4 (PRD). After grill-me + ubiquitous-language.
**Why:** Formalises all decisions into a single source of truth. Every downstream step (plan, issues, build) references this document.
**Output:** [tag-manager-prd.md](./tag-manager-prd.md)
**Skill template used:** Extended beyond the default skill template with 5 additional enterprise sections.

### PRD sections used (12 total):

1. Feature Overview — 2–3 line plain-English summary
2. Problem Statement — the pain, from the user's perspective
3. Solution — what we're building, from the user's perspective
4. Ubiquitous Language — canonical terms carried in from Step 2
5. User Stories — 16 stories in "As a X, I want Y, so that Z" format
6. Acceptance Criteria — explicit pass/fail checklist for QA
7. Implementation Decisions — modules, DB schema, API contracts, file format
8. Testing Decisions — what to test, how, what good tests look like
9. Tracer Bullet Slices — 5 ordered vertical slices for implementation
10. Out of Scope — explicit list of what is NOT being built
11. Open Questions — none (all resolved in grill-me)
12. Further Notes — POC context, git-ignore rules

### Key principles learned:

> Write user-visible behaviour, not implementation detail.
> Out of Scope is as important as In Scope — it prevents scope creep during execution.
> Acceptance Criteria is what QA uses — specific enough that there is no debate about pass/fail.
> Tracer Bullet Slices connect the PRD directly to the planning step.

---

## STEP 4 — `/prd-to-plan` ✅

**When used:** Phase 5 (Kanban). After PRD is approved.
**Why:** Turns the PRD into ordered, executable phases. Each phase is a vertical slice — demo-able end-to-end, not a horizontal layer.
**Output:** [plans/tag-manager.md](./plans/tag-manager.md)

### Phases produced:

| Phase | Title      | Stories                                 |
| ----- | ---------- | --------------------------------------- |
| 1     | Foundation | 1, 2 — read-only stack wired end-to-end |
| 2     | Create     | 5, 6, 9, 10, 15, 16 — full create flow  |
| 3     | Edit       | 11, 12, 13 — full edit flow             |
| 4     | Delete     | 3, 4, 14 — full delete flow             |
| 5     | Validation | 7, 8 — error handling hardening         |

### Key principles learned:

> Vertical slices, not horizontal layers. Phase 1 touches DB + API + UI together — not "all backend then all frontend".
> Each phase has its own acceptance criteria pulled from the PRD. QA can verify each phase independently.
> Architectural decisions go in the plan header so every phase can reference them without repeating.
> The plan file is a living document — update it if architecture changes during execution.

---

## STEP 5 — `/setup-pre-commit` + `/git-guardrails-claude-code` ✅

**When used:** Phase 6 (Execution). Before writing any feature code. One-time setup.
**Output:** Husky pre-commit hook (lint-staged → typecheck → test) + global git guardrails in `~/.claude/settings.json`

### Key principles learned:

> Set these up before the first feature commit, not after. Retrofitting is painful.
> Pre-commit runs in a subshell — use absolute paths (`$ROOT/backend`) not relative `cd` chains or failures cascade silently.
> `node:sqlite` (Node built-in) requires special Vite config or a different library. `@libsql/client` was the pragmatic fix for Node v25 + Vite 5.
> Git guardrails block Claude from `git push`. User must push manually — this is intentional and correct.

---

## STEP 6 — `/prd-to-issues` ✅

**When used:** Phase 5 (Kanban). After `/prd-to-plan`, before execution.
**Output:** 5 GitHub Issues created (#1–#5), one per tracer bullet slice
**Ticket format:** Title with `[TM-N]` prefix, user stories listed, acceptance criteria as checkboxes, branch name, dependency noted

### Key principles learned:

> Ticket titles use `[TM-N]` prefix for easy branch naming: `feature/TM-1-foundation`
> Each ticket lists which user stories it covers — connects execution back to the PRD
> Dependency noted on ticket (`Depends on #1`) — enables parallel work later
> `Closes #N` in the PR/commit message auto-closes the GitHub Issue on merge

---

## STEP 7 — `/tdd` Phase 1: Foundation ✅

**Branch:** `feature/TM-1-foundation` → closes #1
**When used:** Every feature slice, every bug fix. Red → Green → Refactor.

### TDD loop executed:

1. **RED** — wrote failing tests for AdvertiserRepository (all 5 operations: list, create, findById, update, delete)
2. **GREEN** — implemented AdvertiserRepository, database.ts, routes, controller
3. **Typecheck** — fixed type errors before commit (caught `unknown[]` arg type)
4. **Commit** — pre-commit hook ran: lint-staged ✅ → typecheck ✅ → tests ✅

### What was built:

- `AdvertiserRepository` — async CRUD over SQLite
- `database.ts` — connection singleton + migrations
- `AdvertiserController` — thin Express handlers
- `routes/advertisers.ts` — 5 REST routes
- `TablePage.tsx` — table with Edit/Delete/Create, empty state
- 10 unit tests, all passing

### Blockers encountered and resolved:

| Blocker                              | Root cause                                     | Fix                                       |
| ------------------------------------ | ---------------------------------------------- | ----------------------------------------- | ---------- |
| `better-sqlite3` native build failed | Node v25 has no prebuilt binaries              | Switched to `@libsql/client` (pure JS)    |
| `node:sqlite` unresolvable in Vitest | Vite 5 strips `node:` prefix before resolution | Switched to `@libsql/client`              |
| Pre-commit `cd frontend` failed      | `cd` chain breaks when tsc fails, cwd shifts   | Used subshells with `$ROOT` absolute path |
| TypeScript `unknown[]` arg error     | `@libsql/client` requires typed args array     | Changed to `(string                       | number)[]` |

### Key principle learned:

> Validate dependency compatibility with your Node version BEFORE writing code. `better-sqlite3` + `node:sqlite` both failed on Node v25. Spending 10 mins checking compatibility up front saves hours of iterating errors.

---

## STEP 8 — `/tdd` Phases 2–5 ✅

### Phase 2: Create (branch: feature/TM-2-create → closes #2)

**Tests added:** 8 unit (TagFileService) + 10 integration API = 18 new, 28 total
**Built:** TagFileService, ValidationMiddleware, app.ts extracted, CreatePage with CodeMirror

### Phase 3: Edit (branch: feature/TM-3-edit → closes #3)

**Tests added:** 8 integration (PUT, DELETE) = 8 new, 36 total
**Built:** EditPage (pre-filled, read-only advertiser name), PUT + DELETE integration tests

### Phase 4: Delete (branch: feature/TM-4-delete → closes #4)

**Tests:** 36 passing (no new — delete already covered in Phase 3)
**Built:** `lib/api.ts` — centralized typed API client, all pages refactored to use it

### Phase 5: Validation (branch: feature/TM-5-validation → closes #5)

**Tests:** 36 passing
**Built:** `lib/validate.ts` — shared `validateCreate()`, `validateUpdate()`, `hasErrors()`

### Key principles learned across phases:

> Extract `app.ts` from `index.ts` early — Supertest needs to import the Express app without starting the server. If you don't do this, integration tests can't run.
> Use `process.env.TAGS_DIR` in TagFileService so tests can redirect file writes to a temp dir without touching real disk state.
> `beforeEach(resetDb + runMigrations)` + `afterEach(rmSync temp dir)` = perfectly isolated integration tests. No shared state between tests.
> Phases often complete earlier than expected when architecture is done right. Phases 4 and 5 were structural improvements (api.ts, validate.ts), not new functionality — the functionality was already there from Phases 2 and 3.

---

## STEP 9 — `/triage-issue` ✅

**When used:** Post-execution. When a bug or inconsistency is found during testing/review.
**Why:** Turns a fuzzy "something is wrong" observation into a well-scoped GitHub issue with root cause, impact, and a clear acceptance criterion.
**Output:** GitHub Issue #6 — "Slug collision: DB unique constraint on `name` ≠ file system uniqueness"

### What was triaged:

- **Bug found:** `AdvertiserRepository` enforces uniqueness on the raw `name` field in SQLite. `TagFileService.slugify()` strips special characters and collapses spaces before writing files. Two distinct names (e.g. "Acme Corp" and "Acme-Corp") could produce the same slug (`acme-corp.js`), causing silent file overwrites.
- **Impact:** The file on disk would silently overwrite — no DB error, no 409, no feedback to the user.
- **Root cause:** Constraint lives in DB on raw name; file path is computed from slug. No cross-check exists.

### Key principle learned:

> Don't wait until QA to find bugs. After every slice, do a lightweight triage pass: look for places where two subsystems make different assumptions about the same entity. The slug vs. name mismatch is a classic example — two layers each had a "uniqueness" invariant that weren't aligned.

---

## STEP 10 — `/improve-codebase-architecture` ✅

**When used:** After feature-complete. When you want to surface architectural friction before it compounds.
**Why:** Forces you to read the codebase as an AI would — looking for shallow modules, tight coupling, and untestable seams.
**Output:** 7 friction points identified; 3 parallel interface designs produced for `AdvertiserService`; GitHub Issue #7 — RFC filed.

### Friction points identified:

1. `AdvertiserController` orchestrates DB + file with no atomic boundary ← **chosen**
2. `TagFileService` uses static methods — untestable without process.env hack
3. `AdvertiserRepository` has no interface — can't stub in unit tests
4. Error classification by string-sniffing in controller
5. `createPage.tsx` + `editPage.tsx` duplicate `Field` component + style constants
6. `lib/api.ts` vs `fetch()` usage inconsistency across pages
7. Slug collision (also filed as #6)

### Interface comparison:

| Design      | Approach                              | Verdict                             |
| ----------- | ------------------------------------- | ----------------------------------- |
| Minimize    | 3 write methods, factory fn           | Good, but reads still in controller |
| Maximize    | OperationResult, hooks, OutputTargets | Over-engineered                     |
| **Drop-in** | **Full CRUD, factory fn**             | **✅ Recommended**                  |

### Recommendation:

Design 3 (drop-in) + factory function from Design 1. Controller swaps one import, zero signature changes.

### Key principles learned:

> The friction you experience while exploring IS the signal. Where you have to bounce between 3 files to understand one operation — that's a shallow module.
> Deep module = small interface, large implementation. The AdvertiserController is the opposite: large interface (6 concerns), thin implementation (delegate + hope).
> Don't propose interfaces during exploration. Explore first, let the problem space settle, then design.

---

## STEP 11 — `/request-refactor-plan` ✅

**When used:** After RFC is approved (or in this case, immediately after `/improve-codebase-architecture`). Turns an interface design into a sequence of tiny, safe commits.
**Why:** Martin Fowler: "Make each refactoring step as small as possible, so that you can always see the program working." Without this, refactors become big-bang rewrites that break everything mid-flight.
**Output:** GitHub Issue #8 — 6-commit refactor plan for `AdvertiserService` extraction.

### Commits planned:

| Commit | Change                                                                          | State after               |
| ------ | ------------------------------------------------------------------------------- | ------------------------- |
| 1      | Add typed domain errors (`DuplicateAdvertiserError`, `AdvertiserNotFoundError`) | Green                     |
| 2      | Extract `IAdvertiserRepository` interface                                       | Green                     |
| 3      | Add `AdvertiserService` stub + unit tests (RED)                                 | Red                       |
| 4      | Implement `AdvertiserService` (GREEN)                                           | Green                     |
| 5      | Refactor controller to use service                                              | Green (all 36 tests pass) |
| 6      | Remove dead imports from controller                                             | Green                     |

### Key principles learned:

> Every commit leaves the app in a working state. Never strand the codebase in red.
> Write the tests before the implementation even in refactoring (not just new features) — they define the contract before you touch anything.
> The delete ordering is intentionally asymmetric: file-first (so orphaned files can't exist if DB delete succeeds). Document asymmetry explicitly in comments.
> Test the service's public behavior, not its internal call ordering. "Does create throw DuplicateAdvertiserError?" — not "does create call repo before tagFileService?"

---

## FINAL TOTALS

- **36 tests** (10 unit repo, 8 unit TagFileService, 18 integration API)
- **8 GitHub Issues** (#1–#5 closed via commits, #6 triage, #7 RFC, #8 refactor plan)
- **5 feature branches**, each with a PR
- **0 open questions** — all resolved before code was written

---

## Stack decided:

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: SQLite (via @libsql/client — switched from better-sqlite3 due to Node v25 incompatibility)
- Code editor: CodeMirror
- Testing: Vitest + Supertest
- Storage: ./tags/ folder (hardcoded, local)
