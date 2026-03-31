## Before running

Read `.claude/skill-config.yaml` to get project paths. Use those paths wherever this skill references `backend/src/domains`, `contracts`, `grill-me-docs`, or `CLAUDE.md`.

---

Run a structured discovery interview across the 5 branches below. Work through one

branch at a time. For each question, offer your best-guess answer based on what you
know — the user corrects or confirms. Do not move to the next branch until the
current one is resolved.

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

## Save grill-me log

After all 5 branches are complete, save the full Q&A transcript before handing off.

1. Determine the PRD brief name — a short slug of the feature (e.g. `discount-and-tax`, `loyalty-earn-restructure`). Ask the user if unclear.
2. Find the next file number: check `grill-me-docs/<prd-brief-name>/` for existing files (`grill-me-01.md`, `grill-me-02.md`, …). Use the next available number.
3. Write the transcript to `grill-me-docs/<prd-brief-name>/grill-me-<NN>.md`.
4. Each file is immutable — never overwrite. A second grill-me session on the same feature appends a new numbered file.

This folder lives outside any domain folder. It is for ad-hoc human and Claude reference, not part of the domain context loaded per ticket.

## Handoff

After the log is saved, hand off to `/update-agent-context`:

- Pass the glossary terms from Branch 5 explicitly
- Pass any new business rules surfaced in Branches 1–4
- Pass the domain name this feature belongs to

Then proceed to `/write-a-prd`.
