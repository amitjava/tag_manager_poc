# Proposal: Platform Context as a Pre-Read for Every Feature Session

---

## The Problem

Every time you start a new feature, the agent starts cold.

It asks: "What database are you using?" You've answered that. It asks: "Is there auth?" Already decided. It asks: "How are errors handled?" In the PRD. It asks: "What's the file format?" Documented.

This means grill-me burns rounds on questions with already-known answers. The agent is doing discovery on things that aren't actually unknown — it just doesn't know where to look.

The root cause: there is no canonical document that tells an agent _what already exists_ before it starts asking questions.

---

## The Proposal

Every project maintains a single file: **`PLATFORM_CONTEXT.md`**

It lives at the repo root. It is the first thing any agent reads at the start of any session — before `/grill-me`, before `/write-a-prd`, before `/improve-codebase-architecture`, before anything.

It has one job: **separate what is already known from what is genuinely unknown.**

---

## The Flow

```
START OF ANY FEATURE WORK
         │
         ▼
┌─────────────────────────────────────────────────┐
│  Agent reads PLATFORM_CONTEXT.md                │
│                                                 │
│  Learns:                                        │
│  - What's already built (modules, API, schema)  │
│  - What decisions are settled (don't re-debate) │
│  - What's in the backlog (already known)        │
│  - What is genuinely unknown → START HERE       │
└─────────────────────────────────────────────────┘
         │
         ▼
   /grill-me starts from the UNKNOWNS section
   — not from scratch
         │
         ▼
   Resolved questions move from UNKNOWNS → DECISIONS
   (agent updates the doc as part of closing the session)
         │
         ▼
   /write-a-prd, /prd-to-plan, /tdd proceed
   with full context already loaded
         │
         ▼
   After feature ships:
   New modules → added to CURRENT STATE
   New decisions → added to SETTLED DECISIONS
   New backlog items → added to OPEN BACKLOG
   UNKNOWNS that were resolved → moved to SETTLED DECISIONS
   (Section 7 never accumulates resolved items)
```

---

## The Document Structure

`PLATFORM_CONTEXT.md` has 7 sections. Each section serves a specific purpose for the agent reading it.

---

### Section 1: Platform Overview

2–3 sentences. What the platform is, who uses it, current status.

> Agents use this to calibrate the domain. A tag manager for an operations team is a different beast from a consumer marketplace. This section prevents the agent from making assumptions about scale, auth, or usage patterns that don't apply.

---

### Section 2: Knowledge Sources

A table pointing to where detailed knowledge lives.

| Source              | Location                | What it answers                                 |
| ------------------- | ----------------------- | ----------------------------------------------- |
| PRD                 | `docs/prd.md`           | User stories, acceptance criteria, API contract |
| Architecture        | `docs/plans/feature.md` | How modules fit together                        |
| Ubiquitous Language | PRD Section 4           | Canonical terms                                 |
| GitHub Issues       | repo/issues             | Feature history and open backlog                |

> Agents use this when they need more depth than the context doc provides. "The API contract is in the PRD" tells the agent exactly where to look instead of guessing.

---

### Section 3: Current Platform State

What is built. Module by module. With one-line descriptions.

Backend modules, frontend pages, DB schema, API contract, test coverage summary.

> This is the most important section for preventing redundant questions. The agent reads this and knows: "auth doesn't exist", "there's one tag per advertiser", "the file is an IIFE". It doesn't ask.

---

### Section 4: Infrastructure

Where things run. What the DB is. Where files go. What CI/CD exists (or doesn't).

> Agents proposing new features need to know the infrastructure constraints. "There's no CI/CD yet" changes what a deployment plan looks like. "The DB is ephemeral on Vercel" changes what persistence proposals are viable.

---

### Section 5: Settled Decisions

A table of decisions that were made and are not open for re-debate.

| Decision               | What was chosen | Why                              |
| ---------------------- | --------------- | -------------------------------- |
| Database library       | @libsql/client  | better-sqlite3 fails on Node v25 |
| One tag per advertiser | Yes             | Resolved in grill-me             |
| Auth                   | None            | Out of scope                     |

> This prevents agents from proposing alternatives to already-resolved decisions. Without this, every architecture session re-opens questions that took grill-me rounds to close.

---

### Section 6: Open Backlog

Known issues and planned work — with links to GitHub issues.

Also includes planned-but-not-yet-ticketed items.

> Agents reading this during a grill-me session will not surface these as new discoveries. Without this section, an agent doing `/improve-codebase-architecture` will flag the slug collision bug as a fresh finding — but it's already triaged and in the backlog. This section saves that round.

---

### Section 7: Genuine Unknowns

Things not yet decided. Not in the backlog. Not resolved anywhere.

These are the real grill-me questions.

> This is the payoff of the whole document. An agent that reads sections 1–6 and then reads section 7 knows exactly where the actual open questions are. Grill-me starts here — not from a blank slate.

---

## Maintenance Rules

The document is only useful if it stays current. These are the rules:

| Event                          | Action                                                 |
| ------------------------------ | ------------------------------------------------------ |
| New feature is built           | Add its modules to Section 3                           |
| Architectural decision is made | Add to Section 5                                       |
| GitHub issue is opened         | Add to Section 6                                       |
| GitHub issue is closed         | Remove from Section 6; move any decisions to Section 5 |
| Grill-me resolves an unknown   | Move from Section 7 → Section 5                        |
| Infrastructure changes         | Update Section 4                                       |

**The key rule:** Once something is resolved, it never stays in Section 7. Resolved items move to Section 5. Section 7 only contains things that are genuinely still open.

---

## Why This Fits Into the Existing Process

The current flow is:

```
Phase 1: Idea → /grill-me → /ubiquitous-language
Phase 4: PRD → /write-a-prd
...
```

This proposal inserts a **Phase 0** step before Phase 1:

```
Phase 0: Read PLATFORM_CONTEXT.md          ← NEW
Phase 1: Idea → /grill-me (from unknowns) → /ubiquitous-language
Phase 4: PRD → /write-a-prd
...
```

Phase 0 is not a skill. It has no output. It is just a pre-read.

The agent reads the document. Then grill-me asks only questions in Section 7. When a question is resolved, it moves to Section 5. The document gets updated. The next feature starts with a smarter context.

---

## What Changes Over Time

The document evolves with the platform.

At the start of a project, Section 7 (unknowns) is long and Section 5 (decisions) is short. Every grill-me session resolves unknowns and moves them to decisions. Every feature built populates Section 3. Every bug filed populates Section 6.

After 10 features, Section 7 is short and Section 3 is comprehensive. Grill-me sessions get faster because there's less unknown territory. The agent already knows the domain.

This is the compounding return: the longer the project runs, the less time is spent on re-discovery, and the more grill-me can focus on the genuinely hard questions.

---

## Proposed Next Step

Create `PLATFORM_CONTEXT.md` at the root of every new project at project start — before Phase 1.

Populate it with what you know from the initial idea. Section 7 (unknowns) starts long. Section 5 (decisions) starts empty. Run grill-me. Then populate.

As a future skill: `/load-platform-context` — a skill that reads `PLATFORM_CONTEXT.md`, summarises the current state to the agent, and identifies the genuine unknowns to feed into `/grill-me` as the starting question set.
