## Before running

Read `.claude/skill-config.yaml` to get project paths. Use those paths wherever this skill references `backend/src/domains`, `contracts`, `grill-me-docs`, or `CLAUDE.md`.

---

## Step 0 — Detect PRD type

Before any questions, determine what kind of PRD this is. Ask:

> "Is this a (A) new feature, (B) refactor / tech-debt cleanup, or (C) bug fix?"

The answer determines which branch set to run:

- **A — Feature**: run Branches 1–5 below (standard set).
- **B — Refactor**: skip to [Refactor branches](#refactor-branches) below.
- **C — Bug fix**: skip to [Bug fix branches](#bugfix-branches) below.
- **D — Refactor + Feature** (refactor that also adds a new capability): run all 4 Refactor branches first, then add Branch 2 (Use Cases) and Branch 3 (Workflow Actors) from the Feature set. The refactor defines what changes; the feature branches define what is being added on top of it.

---

Run a structured discovery interview across the branches for your PRD type. Work through one branch at a time. For each question, offer your best-guess answer based on what you know — the user corrects or confirms. Do not move to the next branch until the current one is resolved.

If a question can be answered by reading the codebase, read it instead of asking.

## Before starting — read any uploaded docs

If the user has attached reference documents (specs, designs, existing PRDs, data
models, Figma exports, meeting notes), read them all before asking any questions.
For each branch, skip any question that is already clearly answered in those docs —
tell the user: "Branch N, question X: answered in <doc name> — <one-line summary>."
Only ask about genuine gaps.

**No domain file is written.** The output stays in this conversation and is passed directly
to `/update-agent-context` which will write it to AGENT_CONTEXT.md.

---

## Branch 1 — Scope & Problem

1. What problem does this feature solve, and for whom?
2. What is explicitly out of scope for this iteration?
3. What does success look like? Is there a measurable signal?
4. Is this new, a replacement for something existing, or an extension of an existing flow?

---

## Branch 2 — Use Cases

1. List the primary use cases in priority order. For each: who triggers it, what they want, what the system must do.
2. What are the edge cases or exception paths? (empty states, bad input, concurrent access)
3. What use cases are intentionally deferred to a later iteration?

---

## Branch 3 — Workflow Actors

For every significant workflow in scope:

1. **Who are the actors?** Every human role, system, and potential AI agent. For each: human, automated system, or AI agent?
2. **What does each actor decide?** For AI agents: what is autonomous vs. handed to a human?
3. **What triggers the agent?** Event-driven, scheduled, or on-demand?
4. **Agent failure mode?** Blast radius if it gets it wrong. Who notices, who fixes it?
5. **What does the agent escalate?** Autonomous (AFK) vs human-in-the-loop (HITL) — draw the line explicitly.

---

## Branch 4 — Dependencies & Constraints

1. Which existing domains, services, or data models does this feature read from or write to?
2. External APIs, third-party systems, or compliance requirements?
3. Performance or scale constraints? (latency budget, data volume, concurrency)
4. Hard dependencies that must exist before this can ship?

---

## Branch 5 — Domain Terms & Open Questions

1. What domain-specific terms came up that need a precise definition?
   For each term: one-sentence definition.
   _(These go into the AGENT_CONTEXT.md Glossary section.)_
2. What decisions are still unresolved and could block design or implementation?
3. What assumptions need validation?
4. What risks should be logged in the PRD's open questions section?

---

## Refactor branches {#refactor-branches}

### Refactor Branch 1 — What is wrong now

1. What is the specific problem with the current implementation? (fragile, slow, unmaintainable, blocking future work?)
2. Who is affected? (developers working in this area, downstream consumers, end users?)
3. What has already been tried or why have previous fixes been insufficient?
4. What is the measurable signal that the refactor succeeded?

### Refactor Branch 2 — What changes

1. What code is being removed or replaced?
2. What stays exactly as-is (behavior, interfaces, contracts)?
3. What new abstractions or patterns are being introduced?
4. Which tests need to be deleted, rewritten, or newly written?

**Test deletion gate:** For each test being deleted, ask: "Is this test being deleted because it tests an implementation detail (correct — delete it), or because it tests behavior that is being removed (dangerous — confirm the behavior removal is intentional)?" Log each deleted test's rationale in the PRD's Testing Decisions section. A refactor must not silently remove behavior coverage.

### Refactor Branch 3 — Migration path

1. Is this a flag-day change (all at once) or incremental (parallel run, strangler fig)?
2. What is the sequence of steps that gets from current state to end state safely?
3. Which downstream callers need to be updated, and in what order?
4. What does rollback look like if the refactor is wrong?

### Refactor Branch 4 — Dependencies & risk

1. Which other domains or services call into the code being refactored?
2. What integration points exist? What contract tests cover them?
3. What is the blast radius if something breaks mid-refactor?
4. Are there any hard deadlines or release windows that constrain timing?

---

## Bug fix branches {#bugfix-branches}

### Bug Branch 1 — Reproduction

1. What are the exact steps to reproduce the bug?
2. What environment does it reproduce in? (prod only, staging, all envs?)
3. What is the observed behavior vs. expected behavior?
4. Is this deterministic or intermittent?

### Bug Branch 2 — Impact

1. Which users or data are affected? (all users, specific tier, specific region?)
2. What is the severity of impact? (data loss, incorrect output, cosmetic?)
3. How long has this been broken? (regression: which deploy introduced it?)
4. Are there workarounds in use today?

### Bug Branch 3 — Root cause

1. What is the hypothesis for root cause?
2. Has the root cause been confirmed (log evidence, test that reproduces it)?
3. Is this a code bug, a data bug, or a design bug?
4. Are there similar patterns elsewhere in the codebase that could have the same bug?

### Bug Branch 4 — Fix & regression

1. What is the proposed fix?
2. What is the test that proves the bug is fixed?
3. What regression risk does the fix introduce?
4. Does this fix require a business rule change? If yes, which rule and how?

---

## Branch completeness check

Before saving the log, verify all branches for your PRD type were completed:

**Feature** checklist:

- [ ] Branch 1 — Scope & Problem: resolved
- [ ] Branch 2 — Use Cases: resolved
- [ ] Branch 3 — Workflow Actors: resolved
- [ ] Branch 4 — Dependencies: resolved
- [ ] Branch 5 — Domain Terms: resolved

**Refactor** checklist:

- [ ] Refactor Branch 1 — What is wrong now: resolved
- [ ] Refactor Branch 2 — What changes: resolved
- [ ] Refactor Branch 3 — Migration path: resolved
- [ ] Refactor Branch 4 — Dependencies & risk: resolved

**Bug fix** checklist:

- [ ] Bug Branch 1 — Reproduction: resolved
- [ ] Bug Branch 2 — Impact: resolved
- [ ] Bug Branch 3 — Root cause: resolved
- [ ] Bug Branch 4 — Fix & regression: resolved

If any branch is incomplete, return to it before saving the log. Do not mark grill-me complete with open branches.

---

## Save grill-me log

After all branches for your PRD type are complete, save the full Q&A transcript before handing off.

1. Determine the PRD brief name — a short slug of the feature (e.g. `discount-and-tax`, `loyalty-earn-restructure`). Ask the user if unclear.
2. Find the next file number: check `grill-me-docs/<prd-brief-name>/` for existing files (`grill-me-01.md`, `grill-me-02.md`, …). Use the next available number.
3. Write the transcript to `grill-me-docs/<prd-brief-name>/grill-me-<NN>.md`.
4. Each file is immutable — never overwrite. A second grill-me session on the same feature appends a new numbered file.
5. **Update the search index:** After writing the log, open `grill-me-docs/INDEX.md` (create if it doesn't exist) and append one line:
   ```
   | <YYYY-MM-DD> | <prd-brief-name> | <grill-me-NN.md> | <PRD type: feature/refactor/bugfix> | <one-line summary of what the session covered> |
   ```
   The index is how humans and Claude find past sessions without grepping a folder tree. Keep each entry under 150 characters.

This folder lives outside any domain folder. It is for ad-hoc human and Claude reference, not part of the domain context loaded per ticket.

## Handoff

After the log is saved, hand off to `/update-agent-context`:

- Pass the glossary terms from Branch 5 explicitly
- Pass any new business rules surfaced in Branches 1–4
- Pass the domain name this feature belongs to

Then proceed to `/write-a-prd`.
