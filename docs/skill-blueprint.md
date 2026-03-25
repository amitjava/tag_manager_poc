# Skill Blueprint: When to Use What

> Sources: mattpocock/skills repo + aihero.dev articles on real-world feature builds,
> 5 daily skills, and 7 phases of AI development.
> Built from testing against a Tag Manager feature (frontend, backend, validation, database).
> Use as a repeatable blueprint for any enterprise feature.

---

## The 7 Phases of AI Development (aihero.dev)

```
Phase 1: Idea        → define and stress-test the concept
Phase 2: Research    → gather external knowledge agents can reference (optional)
Phase 3: Prototype   → test design approaches before committing (optional)
Phase 4: PRD         → document user-visible behaviour, not implementation
Phase 5: Kanban      → break into ranked tasks with dependency relationships
Phase 6: Execution   → agents build; you supervise or go AFK
Phase 7: QA          → verify, loop back to Phase 5-7 until production-ready
```

> "This process scales from massive projects to narrow, focused tasks."
> Key rule: Phases 5-7 loop. QA creates new tickets; execution runs again.

---

## Phase 1: Idea

**Goal:** Stress-test the concept. Surface every assumption before writing anything down.

### `/grill-me`

**When:** First thing. Before PRD, before design, before anything.
**What it does:** Claude interviews you relentlessly — every edge case, every decision branch, every dependency — until full shared understanding. Generates 16-50+ clarifying questions per session.
**Tag Manager example:** "I want a tag manager" → forces answers: What is a tag? Can tags be nested? Who can create/delete them? What happens to entities when a tag is deleted? Can tags be merged? Are they global or per-workspace?
**Rule:** Always `/grill-me` before `/write-a-prd`. It surfaces what you don't know you don't know.
**Real example:** [See the full Tag Manager grill-me Q&A log](./grill-me-qa-log.md) — 17 questions, 4 rounds, resolved every ambiguity before the PRD was written.

### `/ubiquitous-language`

**When:** Right after grill-me, before writing the PRD.
**What it does:** Extracts a DDD-style glossary from your conversation. Flags ambiguous terms. Proposes canonical names. Saves to `UBIQUITOUS_LANGUAGE.md`.
**Tag Manager example:** Is it a "tag", "label", "category", or "attribute"? Does "entity" mean a company, a contact, or both? Lock this down or your DB columns, API fields, and UI labels will all use different words.
**Rule:** Run once per domain. Re-run whenever new concepts are introduced.

---

## Phase 2: Research _(Optional)_

**Goal:** Cache external knowledge inside the repo so agents can reference it during execution.

**When to use:** Integrating a third-party API, unfamiliar library, or complex external concept.
**What to produce:** A `research.md` file committed to the repo.
**Tag Manager example:** If tags will integrate with an external service (e.g. HubSpot tags, Salesforce categories), research that API first and save the relevant endpoints, auth patterns, and constraints to `research.md`.
**Critical warning:** Research assets go stale. Mark them with a creation date and delete or refresh them after the feature ships. Outdated research actively misleads agents.

**No dedicated skill for this.** Do it manually or with a general Claude session:

- Read the API docs
- Extract only what's relevant to your feature
- Save to `research.md` in the repo root

---

## Phase 3: Prototype _(Optional)_

**Goal:** Test design approaches before committing to one. Covers UI/UX, architecture, and service integrations.

**When to use:** When the right approach is genuinely unclear — new UI pattern, unfamiliar architecture, or multiple viable API designs.

### `/design-an-interface`

**When:** Prototyping the API or service layer shape.
**What it does:** Spawns 3+ parallel sub-agents that each produce a radically different interface design. Compares them. You pick or synthesize.
**Tag Manager example:** Agent 1: `tagService.apply(entityId, tagIds[])`. Agent 2: `tag.attach(entity)`. Agent 3: event-driven via `TagApplied` domain events. Compare trade-offs before writing a line.
**Rule:** Use for any module where the wrong interface will cause pain later — API routes, service boundaries, DB access patterns.

### `/improve-codebase-architecture` _(first pass)_

**When:** Before prototyping if there's existing code the feature will touch.
**What it does:** Explores the codebase, finds shallow modules and tight coupling, flags what will get worse if you add to it.
**Tag Manager example:** Finds that `EntityService` is already doing validation + DB + business logic in one place. Flags this before you add tag logic on top.
**Rule:** Run before starting any feature that touches an existing module. Prevents compounding existing debt.

---

## Phase 4: PRD

**Goal:** Formal document of user-visible behaviour. Not implementation details — what the user sees and does.

### `/write-a-prd`

**When:** After grill-me + ubiquitous-language + any prototyping. You know what you're building.
**What it does:** Conducts a structured interview, explores the codebase, and produces a PRD as a GitHub issue. Includes user stories, module sketches, and acceptance criteria.
**Tag Manager example:** PRD covers: tag CRUD, bulk tagging UI, tag filtering on entity list, tag permissions by role, DB schema, API contract, validation rules, error states.
**Rule:** Focus on user-visible behaviour, not implementation. "The user can filter entities by tag" not "add a WHERE clause to the query".
**Key insight (aihero.dev):** Grill yourself on every decision point during PRD writing — not just during grill-me. The PRD is where edge cases get resolved, not during execution.

---

## Phase 5: Kanban / Implementation Planning

**Goal:** Convert the PRD into a ranked task list with dependency relationships. Enables parallel agent work.

### `/prd-to-plan`

**When:** After PRD is approved. Before creating GitHub issues.
**What it does:** Turns the PRD into a phased implementation plan using tracer-bullet vertical slices. Saved as `./plans/*.md`.
**Tag Manager tracer bullets:**

- Slice 1: DB migration + `GET /tags` endpoint + tags list UI (proves the stack end-to-end)
- Slice 2: `POST /tags` + validation + create form
- Slice 3: Apply tag to entity + tag badge on entity card
- Slice 4: Filter entities by tag
- Slice 5: Bulk tagging
  **Rule:** Vertical slices (tracer bullets), not horizontal layers. Don't build all of DB, then all of API, then all of frontend. Each slice should be demo-able.

### `/prd-to-issues`

**When:** After `/prd-to-plan`. When working in a team or tracking progress in GitHub.
**What it does:** Breaks the plan into independently-grabbable GitHub issues with dependency relationships noted.
**Rule:** Use in teams. For solo work, a plan file is enough. The dependency mapping is what enables parallelising agent work.

---

## Phase 6: Execution

**Goal:** Agents write the code. You supervise or go AFK.

### `/setup-pre-commit`

**When:** Once, at repo creation or the start of a new codebase. Not per-feature.
**What it does:** Installs Husky with lint-staged (Prettier), TypeScript type checking, and test runner on every commit.
**Tag Manager example:** Every commit automatically: formats code → type-checks → runs affected tests. Bad code never enters the repo.
**Rule:** Set this up before any code is written. Never skip. Broken types that pass CI cost hours later.

### `/git-guardrails-claude-code`

**When:** Once, globally. Install in `~/.claude/settings.json`.
**What it does:** Blocks destructive git commands — `git push --force`, `git reset --hard`, `git clean -f`, `git branch -D` — before Claude executes them.
**Rule:** Install globally so it covers all projects. This is a one-time setup, not per-feature.

### `/tdd`

**When:** Every feature slice. Every bug fix. No exceptions.
**What it does:** Enforces red-green-refactor loop.
**Tag Manager TDD flow:**

- Red: `POST /tags` with empty name returns 400
- Green: add validation
- Refactor: extract to `tagValidationSchema`
- Red: `GET /entities?tagId=X` returns only tagged entities
- Green: add JOIN query
- Refactor: move to `EntityRepository.findByTag()`
  **Key insight (aihero.dev):** "Doing really good TDD has been the most consistent way to improve agent outputs." TDD is the single highest-leverage practice in agent-driven development.
  **Rule:** TDD for all business logic, validation, API handlers. Less critical for pure UI layout.

**The AFK principle (aihero.dev):** With research.md + prototype + PRD + tickets in place, agents can work autonomously without constant supervision. Context quality determines how long you can stay hands-off.

---

## Phase 7: QA

**Goal:** Verify the implementation. Identify what needs fixing. Loop back to Phase 5.

### What happens here:

- Agent produces a QA plan
- Human verifies implementation against acceptance criteria
- Logic errors, security issues, performance problems, maintainability reviewed
- New tickets created for anything that fails
- Loop back to Phase 5 → 6 → 7 until production-ready

### `/triage-issue`

**When:** When a specific bug is found during QA or reported post-launch.
**What it does:** Explores the codebase to find root cause, creates a GitHub issue with a TDD-based fix plan.
**Tag Manager example:** "Tags not showing after bulk import" → traces to a missing JOIN in the bulk import query path → writes failing test → plans fix.
**Rule:** Never patch without triaging. Root cause first, then fix with a test.

---

## Ongoing Maintenance

These skills run on a cadence, not triggered by a specific phase:

### `/improve-codebase-architecture` _(recurring)_

**Cadence:** Weekly or after every 3-5 features.
**What it does:** Finds shallow modules and tight coupling that have accumulated. Files architectural improvement RFCs as GitHub issues.
**Key insight (aihero.dev):** "If you have a garbage codebase, the AI will produce garbage." Architecture health directly determines agent output quality.
**Rule:** This is not optional. Technical debt compounds faster with agents than with humans because agents don't notice the smell.

### `/request-refactor-plan`

**When:** When a specific module has grown painful — too large, too coupled, too hard to test.
**What it does:** User interview → detailed refactor plan with tiny safe commits → filed as GitHub issue RFC.
**Tag Manager example:** `TagService` at 400 lines handling creation + validation + caching + events → split into focused modules.
**Rule:** Use for refactors larger than a single file. The tiny-commits approach prevents half-refactored states from breaking production.

---

## Skills Outside the Build Cycle

| Skill                  | What it's for                   | When to use                           |
| ---------------------- | ------------------------------- | ------------------------------------- |
| `/edit-article`        | Editing written content         | Blog posts, docs, README rewrites     |
| `/migrate-to-shoehorn` | TypeScript test migration       | When tests use `as` type assertions   |
| `/obsidian-vault`      | Obsidian note management        | When knowledge base lives in Obsidian |
| `/scaffold-exercises`  | Coding exercise directories     | Course or workshop creation           |
| `/write-a-skill`       | Creating new Claude Code skills | Extending this skill library          |

---

## The Full Enterprise Blueprint (Quick Reference)

```
PHASE 1 — IDEA
  /grill-me                    ← stress-test the concept first
  /ubiquitous-language         ← lock down terminology

PHASE 2 — RESEARCH (optional)
  manual research.md           ← cache external API/library knowledge in repo

PHASE 3 — PROTOTYPE (optional)
  /design-an-interface         ← explore 3+ API/module shapes in parallel
  /improve-codebase-architecture (pass 1) ← check what existing code will break

PHASE 4 — PRD
  /write-a-prd                 ← user-visible behaviour as GitHub issue

PHASE 5 — KANBAN
  /prd-to-plan                 ← tracer-bullet vertical slices → plans/*.md
  /prd-to-issues               ← GitHub tickets with dependency mapping

PHASE 6 — EXECUTION
  /setup-pre-commit            ← once per repo (Prettier + typecheck + tests)
  /git-guardrails-claude-code  ← once globally (block destructive git ops)
  /tdd                         ← every feature, every bug fix, no exceptions

PHASE 7 — QA
  /triage-issue                ← root-cause before patching any bug
  → loop back to Phase 5-7 until production-ready

MAINTENANCE (recurring)
  /improve-codebase-architecture ← weekly / after every 3-5 features
  /request-refactor-plan         ← when a module becomes painful
```

---

## Key Principles (synthesised from all sources)

1. **Context quality = agent output quality.** Research + prototype + PRD + tickets = you can go AFK. Missing any of these = constant supervision needed.
2. **Vertical slices, not horizontal layers.** Each slice is demo-able end-to-end. No "all DB done" milestones.
3. **TDD is the highest-leverage practice.** More than any other single thing, TDD improves what agents produce.
4. **Architecture health is not optional.** Garbage codebase → garbage AI output. Run architecture review on a cadence.
5. **QA is a loop, not a gate.** Expect to cycle through phases 5-7 multiple times. That's normal, not failure.
6. **Lock terminology before coding.** Domain terms that drift between DB, API, and UI create bugs that are invisible to agents.
7. **Research assets go stale.** Delete or refresh `research.md` after the feature ships.
