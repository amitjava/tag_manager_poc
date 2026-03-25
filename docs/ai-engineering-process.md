# AI-Assisted Engineering Process

## Idea → PRD → Execution → QA

> Built from running 11 Claude Code skills end-to-end on a real feature.
> Source: Tag Manager POC — a full-stack CRUD app built to document this exact process.
> For: Mid-sized engineering teams using GitHub + Claude Code.

---

## How to Use This Document

This is a prescriptive guide. Follow it in order. Each phase has:

- **Goal** — what you're trying to achieve
- **Inputs** — what must exist before you start
- **Skills** — which Claude Code skills to run
- **Output** — what you produce
- **What goes wrong if you skip it**

The phases are not waterfall — Phases 5–7 (Planning → Execution → QA) loop.
Phases 1–4 are front-loaded work that prevents rework in the loop.

---

## The Process Map

```
PHASE 0   Platform Context   read PLATFORM_CONTEXT.md  (first feature: create it)
             ↓
PHASE 1   Idea          /grill-me (from unknowns)  →  /ubiquitous-language
PHASE 2   Research      (manual — optional)
PHASE 3   Prototype     /design-an-interface  →  /improve-codebase-architecture
PHASE 4   PRD           /write-a-prd
             ↓
PHASE 5   Planning      /prd-to-plan  →  /prd-to-issues
             ↓
PHASE 6   Execution     /setup-pre-commit  →  /git-guardrails-claude-code  →  /tdd
             ↓
PHASE 7   QA            /triage-issue  →  loop back to Phase 5
             ↓
AFTER EACH FEATURE      update PLATFORM_CONTEXT.md
             ↓
MAINTENANCE             /improve-codebase-architecture  →  /request-refactor-plan
```

---

## Phase 0: Platform Context

**Goal:** Give the agent a complete picture of what already exists before it asks a single question.

**Inputs:** An existing project with at least one shipped feature. _(On the very first feature of a new project, create the file with what you know and leave Section 7 long.)_

**No skill required.** The agent reads a file. That's it.

---

### The Problem This Solves

Every time you start a new feature, the agent starts cold. It asks "what database are you using?" — you've answered that. It asks "is there auth?" — already decided. It burns grill-me rounds on questions with known answers because there's no document that tells it what already exists.

### What to Do

Maintain a file called `PLATFORM_CONTEXT.md` at the repo root. Before any session — grill-me, PRD, architecture review — the agent reads it first.

The file has 7 sections:

| Section                 | Contents                                | Agent instruction                 |
| ----------------------- | --------------------------------------- | --------------------------------- |
| 1. Platform Overview    | What it is, who uses it, current status | Calibrate the domain              |
| 2. Knowledge Sources    | Where PRDs, plans, and issues live      | Where to look for depth           |
| 3. Current State        | Modules, API contract, DB schema, tests | Do not ask about any of this      |
| 4. Infrastructure       | Hosting, DB, CI/CD                      | Constraints for any new proposal  |
| 5. Settled Decisions    | Decisions that are closed               | Do not re-open these              |
| 6. Open Backlog         | GitHub issues + unticket planned work   | Already known — do not re-surface |
| 7. **Genuine Unknowns** | Things not yet decided                  | **Start grill-me here**           |

Section 7 is the payoff. An agent that reads sections 1–6 knows exactly what's already answered. Section 7 is where grill-me begins — not from a blank slate.

### The Compounding Return

At the start of a project, Section 7 is long and Section 5 is short. Every grill-me session resolves unknowns — they move from Section 7 to Section 5. Every feature built populates Section 3. Every bug filed goes into Section 6.

After 10 features, grill-me sessions are shorter because there's less unknown territory. The document gets smarter with every cycle. The longer the project runs, the less time is spent on re-discovery.

### After Each Feature Ships — Update the File

| Event                        | What to update                                     |
| ---------------------------- | -------------------------------------------------- |
| New feature built            | Add modules to Section 3                           |
| Architectural decision made  | Add to Section 5                                   |
| GitHub issue opened          | Add to Section 6                                   |
| GitHub issue closed          | Remove from Section 6; move decisions to Section 5 |
| Grill-me resolves an unknown | Move from Section 7 → Section 5                    |
| Infrastructure changes       | Update Section 4                                   |

**The rule:** Resolved items never stay in Section 7. Section 7 only ever contains things that are genuinely still open.

> Full proposal and structure template: [platform-context-proposal.md](../../../platform-context-proposal.md)

---

## Phase 1: Idea

**Goal:** Stress-test the concept. Surface every assumption, edge case, and decision branch before writing anything down.

**Inputs:** An idea. `PLATFORM_CONTEXT.md` already read.

**What goes wrong if you skip it:** The PRD will have gaps. Gaps become decisions made during execution — by agents, without you in the room. Those decisions will be wrong.

---

### Step 1 — `/grill-me`

Run this before anything else. Before the PRD. Before any design sketches. Before architecture conversations.

What it does: Claude interviews you with 15–50 questions across multiple rounds, covering every edge case and decision branch until full shared understanding is established.

**How to run it:** Start a Claude Code session and type `/grill-me`. Answer each round of questions. Don't rush. The quality of the answers you give here determines the quality of everything downstream.

**What you're trying to resolve:**

- What is the entity? What are its fields?
- Who can do what? What roles exist?
- What happens at each boundary? (create, edit, delete, error states)
- What's the data shape? (DB, API, file system, UI)
- What is explicitly NOT in scope?
- What happens when two operations conflict?

**Practical signal you're done:** You can answer any "what happens when X?" question without thinking. There are no open tabs in your head.

**Real example:** "I want a tag manager" → 17 questions across 4 rounds resolved: one tag per advertiser (not multiple), SQLite as source of truth, JS files as output artifacts, CodeMirror editor (not plain textarea), advertiser name read-only on edit, no auth. Every one of these was a decision that could have gone multiple ways and would have required backtracking if left open.

See the full Q&A log from the tag manager build: [grill-me-qa-log.md](./grill-me-qa-log.md)

---

### Step 2 — `/ubiquitous-language`

Run this immediately after `/grill-me`, before writing the PRD.

What it does: Extracts a DDD-style glossary from the decisions made in grill-me. Flags terms that could be interpreted multiple ways. Proposes canonical names. Saves to `UBIQUITOUS_LANGUAGE.md`.

**Why it matters:** If you call it a "tag" in the DB schema, a "script" in the API response, and a "pixel" in the UI label, agents will produce code that looks correct in isolation but has mismatched field names across the stack. This is a bug that is invisible until integration.

**What the glossary covers:**

- The core entity and its synonyms (and which one wins)
- The actions (create, update, delete — not "add", "modify", "remove")
- Any domain-specific terms that would be ambiguous to an outsider

**Practical signal you're done:** Someone reading the PRD, the DB schema, the API spec, and the UI copy would encounter zero conflicting terms.

**Rule:** Run once per domain. Re-run whenever a new concept is introduced.

---

## Phase 2: Research _(Optional)_

**Goal:** Cache external knowledge in the repo so agents can reference it during execution.

**When to use:** When your feature integrates a third-party API, unfamiliar library, or external service.

**How to do it (no dedicated skill):**

1. Read the relevant API docs or library documentation manually
2. Extract only what's relevant to your feature: endpoints, auth patterns, rate limits, constraints
3. Save to `docs/research.md` in the repo

**Critical rule:** Mark the file with a creation date. Delete it or mark it stale after the feature ships. Outdated research actively misleads agents — they will confidently use an old API contract.

**When to skip:** Pure internal features with no new external dependencies.

---

## Phase 3: Prototype _(Optional)_

**Goal:** Test design approaches before committing. Covers API shape, module boundaries, and architectural fit with existing code.

**When to use:** When the right approach is genuinely unclear — new UI pattern, unfamiliar architecture, or when multiple viable designs exist and the wrong choice will be painful to undo.

---

### `/design-an-interface`

What it does: Spawns 3+ parallel sub-agents, each producing a radically different interface design for the same module. Then compares them and recommends.

**When to use:** For any module where the wrong interface creates pain — API routes, service layer boundaries, DB access patterns, cross-service contracts.

**How it works:** You describe the problem. Three agents produce designs constrained as: (1) minimize — fewest entry points, (2) maximize — most flexible, (3) optimize for the common caller. The comparison surfaces trade-offs you wouldn't have seen from one design alone.

---

### `/improve-codebase-architecture` (first pass)

What it does: Explores the codebase like an AI navigating it cold. Finds shallow modules, tight coupling, and seams that will get worse if you add to them. Files findings as RFC GitHub issues.

**Run this before prototyping if your feature will touch existing code.** Prevents compounding existing debt.

**Deep module principle (John Ousterhout):** A well-designed module has a small interface hiding a large implementation. The opposite — a large interface hiding trivial implementation — is a shallow module. Shallow modules require callers to understand the internals. Deep modules are testable at the boundary.

---

## Phase 4: PRD

**Goal:** A single written document of user-visible behaviour. Not implementation decisions — what the user sees and does.

**Inputs:** Completed grill-me, completed ubiquitous language.

**What goes wrong if you skip it:** Agents make implementation decisions without a reference. "Should edit be optimistic or confirm-on-save?" is an implementation decision that should have been in the PRD — if it's not, the agent picks one and you find out during QA.

---

### Step 3 — `/write-a-prd`

What it does: Conducts a structured interview, explores the codebase, and produces a PRD as a file in the repo. The PRD references the ubiquitous language from Phase 1 and becomes the single source of truth for all downstream steps.

---

### The PRD Template (12 Sections)

This is the template used on the tag manager. Every section has a purpose. Do not skip sections.

---

**Section 1: Feature Overview**

2–3 sentences. Plain English. What does this feature do, for whom, and why now?

> Not: "We will build a CRUD API with SQLite backend and React frontend."
> Yes: "Operations teams need to manage JavaScript tags per advertiser. Today they do this manually via a shared folder. This feature provides a web UI for creating, editing, and deleting tags without touching the file system directly."

---

**Section 2: Problem Statement**

The pain, from the user's perspective. One paragraph. No solution language.

> "When a new advertiser is onboarded, someone has to manually create a JavaScript file, name it correctly, wrap it in an IIFE, and drop it in the right directory. Mistakes result in the wrong tag firing on the wrong site. There is no audit trail and no way to recover a deleted file."

---

**Section 3: Solution**

What you're building, from the user's perspective. Still no implementation detail.

> "A web interface where the operations team can create advertisers with one tag each, edit tag code in a syntax-highlighted editor, and delete advertisers — with the system handling file management automatically."

---

**Section 4: Ubiquitous Language**

Copy the canonical terms from Phase 1. Include definitions. Every term that appears in the DB schema, API, or UI must appear here first.

Format:

```
Advertiser — a company identified by a unique name
Tag — a single JavaScript snippet associated with one Advertiser
Tag Code — the raw JavaScript the user writes in the editor
Tag File — the .js file written to disk from Tag Code
Tag Name — a human-readable label for the Tag (not the filename)
```

---

**Section 5: User Stories**

Format: "As a [role], I want [capability], so that [outcome]."

Write one story per user-visible action. Aim for 10–20. Include:

- Happy path stories (the expected usage)
- Error path stories (what happens when it fails)
- Boundary stories (empty state, maximum, edge cases)

Do not write stories about backend internals ("As the system, I want to write a file..."). If a user can't see it, it doesn't belong here.

---

**Section 6: Acceptance Criteria**

A pass/fail checklist. Each criterion is unambiguous — a QA engineer can verify it with no interpretation.

Good criterion: "When the user submits Create with an empty Advertiser Name, a red validation message appears below the field and the form does not submit."

Bad criterion: "Validation should work correctly."

Write one criterion per condition. Cover: happy path, validation errors, duplicate entries, not-found states, empty states.

**This section is what QA uses.** Write it to that standard.

---

**Section 7: Implementation Decisions**

This is the one place in the PRD where you go below user-visible behaviour. Cover:

- **Modules:** Which files/services will exist and what each owns
- **DB Schema:** Table name, columns, types, constraints
- **API Contract:** Endpoints, request bodies, response shapes, status codes
- **File/Storage format:** If relevant (e.g. the IIFE wrapper format for tag files)

Example API contract entry:

```
POST /api/advertisers
Body: { name: string, tag_name: string, tag_code: string }
201: { id, name, tag_name, tag_code, created_at }
400: { error: "field is required" }
409: { error: "Advertiser name already exists" }
```

---

**Section 8: Testing Decisions**

What to test, how, and what a good test looks like for this feature.

Specify:

- Unit tests: which modules, what they cover
- Integration tests: which routes, what state they verify
- What makes a good test here (only external behaviour, not internals)
- What's not worth testing (pure UI layout, trivial getters)

Example:

> "A good TagFileService test: given a name and tag code, the correct file exists on disk with the correct content. Not: verifying which internal methods were called."

---

**Section 9: Tracer Bullet Slices**

Break the feature into 3–7 ordered vertical slices. Each slice:

- Touches DB + API + UI together (never horizontal)
- Is demo-able end-to-end when complete
- Has its own mini acceptance criteria

**Tracer bullet principle:** The first slice is the highest-risk, lowest-feature path through the entire stack. It proves the stack works together before you build anything on top.

Example slices for the tag manager:

```
Slice 1: Foundation — DB table + GET /advertisers + empty table page
Slice 2: Create — POST /advertisers + TagFileService.write() + Create form
Slice 3: Edit — PUT /advertisers/:id + TagFileService.write() + Edit page
Slice 4: Delete — DELETE /advertisers/:id + TagFileService.delete() + Delete button
Slice 5: Validation — all error states hardened front-to-back
```

---

**Section 10: Out of Scope**

Explicit list of things NOT being built. Be specific.

This section prevents scope creep during execution. Agents will add features that "seem obvious" unless you explicitly exclude them.

Example:

```
Out of scope for this version:
- Authentication or role-based access
- Multiple tags per advertiser
- Tag activation/deactivation
- Audit log
- Soft delete
- Tag preview/execution sandbox
```

---

**Section 11: Open Questions**

Anything not yet resolved. The goal is for this section to be empty when the PRD is approved. If it's not empty, don't start execution — resolve the questions first.

If you ran `/grill-me` properly, this section will be empty.

---

**Section 12: Further Notes**

POC context, technical constraints, deployment environment, team conventions, anything that doesn't fit above.

---

## Phase 5: Planning

**Goal:** Turn the PRD into ordered, executable tasks in GitHub. Connect work items back to the PRD.

**Inputs:** Approved PRD.

**What goes wrong if you skip it:** Agents build in no particular order. Slice 3 depends on Slice 1 being complete. If that dependency isn't explicit, you get broken intermediate states.

---

### Step 4 — `/prd-to-plan`

What it does: Takes the PRD's Tracer Bullet Slices and produces a detailed implementation plan saved to `plans/<feature>.md`. Each phase includes: which user stories it covers, what to build, and acceptance criteria to verify when done.

**Key output format:**

```
## Architectural Decisions
(stack choices, dependency decisions — referenced by all phases)

## Phase 1: Foundation
User stories: #1, #2
Build: [specific files and what they do]
Acceptance criteria:
- [ ] GET /api/advertisers returns []
- [ ] Table page renders with empty state
```

**Why the architectural decisions header matters:** Phase 5 shouldn't need to re-decide what SQLite client to use. Decisions made once in the header flow down to all phases.

---

### Step 5 — `/prd-to-issues`

What it does: Creates one GitHub Issue per tracer bullet slice. Each issue has:

- Title with a `[FEATURE-N]` prefix (enables consistent branch naming)
- User stories covered (links execution back to the PRD)
- Acceptance criteria as checkboxes (enables QA to verify per-issue)
- Dependencies noted ("Depends on #1")

**Branch naming convention:** `feature/FEATURE-N-short-description`
Example: `feature/TM-1-foundation`, `feature/TM-2-create`

**Closing convention:** Include `Closes #N` in the PR description or commit message. This auto-closes the GitHub Issue on merge.

**GitHub Projects:** Create a Kanban board with columns: Backlog → In Progress → In Review → Done. Move issues as they progress.

---

## Phase 6: Execution

**Goal:** Build each slice. One branch per issue. Pre-commit gates quality. TDD keeps agents on track.

**Setup (one-time, before first feature commit):**

---

### Step 6 — `/setup-pre-commit`

Installs Husky with three gates that run on every `git commit`:

1. `lint-staged` — runs Prettier on staged files
2. TypeScript typecheck — `tsc --noEmit` on backend and frontend
3. Test runner — Vitest on affected files

**Critical implementation note:** The pre-commit hook runs in a subshell. Use absolute paths with `$ROOT`:

```bash
ROOT=$(git rev-parse --show-toplevel)
(cd "$ROOT/backend" && npx tsc --noEmit) || exit 1
(cd "$ROOT/frontend" && npx tsc --noEmit) || exit 1
```

Do NOT chain `cd` commands — if one fails, the shell state shifts silently.

---

### Step 7 — `/git-guardrails-claude-code`

Installs a global hook in `~/.claude/settings.json` that blocks Claude from running:

- `git push` (including `--force`)
- `git reset --hard`
- `git clean -f`
- `git branch -D`

**Why:** Agents push code before you've reviewed it. They reset state you needed. These operations are hard to reverse. Install once, globally — it protects all projects.

**Correct workflow:** Agent writes code → agent commits → you review → you push manually.

---

### Step 8 — `/tdd`

Run this for every feature slice and every bug fix. No exceptions.

**The TDD loop:**

```
RED    → Write a failing test that specifies the behaviour
GREEN  → Write the minimum code to make it pass
REFACTOR → Clean up — extract, rename, simplify. Tests stay green.
COMMIT → Pre-commit hook runs all gates. If anything fails, fix before committing.
```

**Why TDD matters in agent-driven development:** TDD is the single highest-leverage practice when working with agents. Tests define what "done" means before a line of implementation is written. Agents that have a failing test to satisfy produce better code than agents working from a description alone.

**Test types and what they cover:**

_Unit tests_ — test a single module in isolation. No DB, no HTTP, no filesystem.

```
Who:    AdvertiserRepository (logic), TagFileService (slugify, write, delete)
What:   Given known inputs → expected outputs
State:  In-memory DB (NODE_ENV=test), temp dir for file tests
```

_Integration tests_ — test the HTTP boundary end-to-end. Real DB, real filesystem, no browser.

```
Who:    All routes via Supertest
What:   HTTP request → response status + body + side effects (file exists?)
State:  resetDb() + runMigrations() in beforeEach; rmSync(tempDir) in afterEach
```

**Test isolation pattern (no shared state between tests):**

```typescript
beforeEach(async () => {
  await resetDb()
  await runMigrations()
  fs.mkdirSync(TEST_DIR, { recursive: true })
  process.env.TAGS_DIR = TEST_DIR
})
afterEach(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true })
  delete process.env.TAGS_DIR
})
```

**How to make TagFileService testable:** Use `process.env.TAGS_DIR` to redirect file writes to a temp directory. Never hardcode the output directory.

**How to make Express apps testable with Supertest:** Extract the Express app into `app.ts`, separate from the server startup in `index.ts`. Supertest imports the app, not the server.

```typescript
// app.ts — exports app, no listen()
export const app = express()

// index.ts — starts the server
import { app } from './app'
app.listen(3000)
```

**The AFK principle:** When research + PRD + tickets + tests are all in place, agents can run multiple slices without constant supervision. The context quality determines how long you can stay hands-off. Missing any of these means the agent will improvise — and you'll need to be watching.

---

### The Execution Loop (per slice)

```
1. Check out branch:  git checkout -b feature/TM-N-name
2. Run /tdd:          Write failing tests → implement → green → refactor
3. Typecheck:         tsc --noEmit passes
4. Commit:            git commit -m "feat: [TM-N] ..." (Closes #N in PR)
5. Push:              You push manually — git push origin feature/TM-N-name
6. PR:                gh pr create — title, description, links to issue
7. Merge:             Review → merge → issue auto-closes
```

---

## Phase 7: QA

**Goal:** Verify implementation against acceptance criteria. Find what's wrong. Create tickets for it. Loop.

**Inputs:** Completed slice or feature.

**How to verify:** Go through the Acceptance Criteria in the PRD line by line. For each criterion: pass or fail.

**What happens when something fails:**

1. Run `/triage-issue` on the failure
2. A new GitHub Issue is created with root cause + fix plan
3. That issue enters Phase 5 (Planning) → becomes a ticket → executes in Phase 6
4. QA again

---

### `/triage-issue`

What it does: Takes a bug description, explores the codebase to find root cause, creates a GitHub Issue with a TDD-based fix plan.

**The rule:** Never patch without triaging. Patching without understanding the root cause means the same bug manifests differently two weeks later.

**What the issue should contain:**

- Root cause (not just symptoms)
- Which layer owns the bug (DB constraint? Service? Controller? UI?)
- A failing test that would have caught it
- Fix approach

**Real example from the tag manager:** The DB uniqueness constraint lives on the raw `name` field. The file system path is computed from a slug (lowercase, special chars stripped). Two different names — "Acme Corp" and "Acme-Corp" — could produce the same slug `acme-corp.js`, causing a silent file overwrite. The DB wouldn't reject it. The user wouldn't see an error. The file would just be gone.

Root cause: Two subsystems each had a uniqueness invariant that weren't aligned. Fix: the slug uniqueness check needs to happen before write, cross-referencing the DB.

---

### The QA Loop

```
QA pass → fails acceptance criteria
  → /triage-issue → GitHub issue created
  → Phase 5: issue triaged into correct sprint
  → Phase 6: implemented with TDD
  → Phase 7: QA pass again
  → repeat until all acceptance criteria pass
```

This loop is not failure — it is the process working correctly.

---

## Deployment _(Not Covered in This POC)_

Deployment was out of scope for this tag manager POC. The following phases would follow QA:

- **Environment setup:** Staging environment matching production configuration
- **Environment variables:** No hardcoded paths, ports, or credentials
- **Database migration strategy:** How DB schema changes apply safely on deploy
- **CI/CD pipeline:** GitHub Actions or equivalent — run tests on PR, deploy on merge to main
- **Smoke test:** One end-to-end verification that the deployed app is alive

These will be documented in a future process extension as those phases are executed.

---

## Maintenance Cadence

These are not triggered by a feature — they run on a schedule.

---

### `/improve-codebase-architecture` _(weekly / after every 3–5 features)_

What it does: Explores the codebase fresh — the way an AI would see it on first contact. Finds shallow modules, tight coupling, and seams that have accumulated. Files RFC GitHub issues.

**Why it can't be skipped:** Technical debt compounds faster with agents than with humans. Agents don't notice the smell. They work with what's there. If the codebase has a controller doing DB + file + error classification all inline, the agent will add the next feature on top of that pattern. After 5 features, you have 5 controllers with the same problem, all slightly different.

**The exploration question to ask at each file:** "If I were an agent reading this for the first time, what would I have to understand before I could add to it safely?" The answer is the interface cost.

**Output:** RFC GitHub issue with:

- The current problem (what's tightly coupled and why it hurts)
- 3 competing interface designs
- A recommendation with reasoning
- Acceptance criteria for the refactor

---

### `/request-refactor-plan` _(when a module becomes painful)_

What it does: User interview → scope definition → tiny-commit plan → filed as GitHub issue.

**The tiny-commit principle (Martin Fowler):** Make each refactoring step as small as possible so the program is always working. Never strand the codebase in a half-refactored state.

**Commit structure for a refactor:**

```
Commit 1: Add typed domain errors (additive — green)
Commit 2: Add interface (additive — green)
Commit 3: Add new module stub + tests (RED)
Commit 4: Implement new module (GREEN)
Commit 5: Refactor callers to use new module (GREEN — all existing tests pass)
Commit 6: Delete dead code (GREEN)
```

Every commit is green except the RED test commit. If a commit is not green, don't push it.

---

## When to Skip Phases

**Phase 2 (Research):** Skip if the feature uses only internal systems or libraries you know well.

**Phase 3 (Prototype):** Skip if the right approach is obvious or the feature is small enough that getting it wrong is cheap to fix.

**Phase 3 `/design-an-interface`:** Skip if you're not introducing a new module boundary.

**Phase 3 `/improve-codebase-architecture` (first pass):** Do not skip if your feature touches existing modules. You need to know what you're adding to.

**Phases 5–7 loop:** This loop always runs. Even for small features, a ticket exists and QA verifies it.

---

## Key Principles

These are laws derived from actually running this process, not from theory.

---

**1. Context quality determines how long you can go AFK.**

Research + PRD + tickets + tests = you can hand off a slice and come back to working code.
Missing one of these = the agent improvises = you supervise every step.

---

**2. Grill yourself before writing anything down.**

The PRD is not where you discover open questions. Grill-me is. If you write a PRD and then discover open questions during execution, you skipped Phase 1.

---

**3. Lock terminology before writing the PRD.**

"Tag" in the DB, "script" in the API, "pixel" in the UI = a bug that's invisible until integration. Ubiquitous language is not a nice-to-have — it's a build-time type error prevention system.

---

**4. Vertical slices, not horizontal layers.**

Phase 1 touches DB + API + UI together. Not "all backend, then all frontend." A horizontal layer is never demo-able on its own. It gives you false confidence that things work until the integration day.

---

**5. TDD is the single highest-leverage practice.**

Not tests after the fact — tests first. A failing test tells the agent exactly what done means. It constrains the solution space. It catches the 10% case the happy-path description missed.

---

**6. Out of Scope is as important as In Scope.**

Agents add features that "seem obvious." A scope section that says "no authentication" is explicit. Without it, an agent might add a login page because the PRD mentioned "users."

---

**7. Pre-commit gates prevent compound errors.**

A type error committed in Slice 1 might only surface as a runtime crash in Slice 3. Pre-commit typecheck catches it at the source. The cost of fixing a type error at commit time is 30 seconds. At QA time it's an hour.

---

**8. Check dependency compatibility before writing code.**

Node v25 + `better-sqlite3` = no prebuilt binaries, native compilation fails. 10 minutes checking compatibility up front saves hours of iterating through build errors. Check: does this library support my runtime version? Does it require native compilation? Are there alternatives?

---

**9. Architecture health doesn't maintain itself.**

Run `/improve-codebase-architecture` on a cadence. Not because something is obviously wrong — because it will be, and you won't notice until you're 5 features deep in a pattern that makes everything harder.

---

**10. Root cause before patching.**

A patch without a root cause is a time-delayed version of the same bug. Every bug fix starts with a failing test that reproduces the bug. The fix makes the test pass.

---

## Skills Quick Reference

| Skill                            | Phase         | When                                  | What it produces                                       |
| -------------------------------- | ------------- | ------------------------------------- | ------------------------------------------------------ |
| `/grill-me`                      | 1 — Idea      | First. Before everything.             | Resolved assumptions, zero open questions              |
| `/ubiquitous-language`           | 1 — Idea      | After grill-me, before PRD            | `UBIQUITOUS_LANGUAGE.md` — canonical terms             |
| `/design-an-interface`           | 3 — Prototype | When module shape is unclear          | 3 competing interface designs + recommendation         |
| `/improve-codebase-architecture` | 3 + ongoing   | Before touching existing code; weekly | RFC GitHub issues for architectural improvements       |
| `/write-a-prd`                   | 4 — PRD       | After grill-me + ubiquitous-language  | PRD file (12 sections)                                 |
| `/prd-to-plan`                   | 5 — Planning  | After PRD is approved                 | `plans/<feature>.md` — phased tracer bullet plan       |
| `/prd-to-issues`                 | 5 — Planning  | After plan is approved                | GitHub Issues with dependencies + acceptance criteria  |
| `/setup-pre-commit`              | 6 — Execution | Once per repo, before first commit    | Husky hook: lint → typecheck → test                    |
| `/git-guardrails-claude-code`    | 6 — Execution | Once globally                         | `~/.claude/settings.json` — blocks destructive git ops |
| `/tdd`                           | 6 — Execution | Every feature, every bug fix          | Code + tests, red → green → refactor                   |
| `/triage-issue`                  | 7 — QA        | On bug discovery                      | GitHub Issue with root cause + TDD fix plan            |
| `/request-refactor-plan`         | Maintenance   | When a module is painful              | GitHub Issue with 6-commit refactor plan               |

---

## Appendix: Real Numbers from the Tag Manager Build

| Metric                                        | Value                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------- |
| Features built                                | 5 tracer bullet slices                                                                |
| Tests written                                 | 36 (10 unit repo, 8 unit service, 18 integration)                                     |
| GitHub Issues                                 | 8 (#1–5 feature, #6 triage, #7 RFC, #8 refactor)                                      |
| Open questions at PRD time                    | 0                                                                                     |
| Blockers during execution                     | 4 (all resolved in Phase 1 by checking compatibility first)                           |
| Phases that completed earlier than expected   | 2 (Phases 4 and 5 — architecture was right so they were structural, not new features) |
| Pre-commit hook failures caught before commit | 4 type errors                                                                         |

The zero open questions at PRD time is the most important number. It came directly from `/grill-me` and `/ubiquitous-language` running before the PRD was written.

---

_Built during: Tag Manager POC, March 2026_
_Skills source: [mattpocock/skills](https://github.com/mattpocock/skills)_
_Process source: [aihero.dev](https://aihero.dev) (7-phase AI development model)_
_Real Q&A log: [grill-me-qa-log.md](./grill-me-qa-log.md)_
_PRD example: [tag-manager-prd.md](./tag-manager-prd.md)_
_Plan example: [plans/tag-manager.md](./plans/tag-manager.md)_
