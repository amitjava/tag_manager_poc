# Break Into Tickets

Take a completed PRD GitHub issue and add a Task checklist to it.
Each checkbox = one focused unit of work = one Claude window = one PR.

## When to run

After `/write-a-prd` (the GitHub issue exists), before starting any `/tdd` session.

## Step 1 — Read the PRD

```
gh issue view <issue-number>
```

Read the full issue: Problem Statement, Solution, User Stories, Implementation Decisions, Business Rules Affected.

## Step 2 — Identify ticket boundaries

Good ticket boundaries:

- One migration or schema change
- One API endpoint (or a small group of tightly coupled endpoints)
- One business rule implementation
- One frontend component or page
- One integration point (seam)

Rules for a well-formed ticket:

- Can be built and tested independently
- Has a clear definition of done (tests passing, PR mergeable)
- Does not require another ticket to be finished before it starts (or explicitly notes the dependency)
- Fits in one TDD session (a few hours of focused work)

Bad boundaries: "backend work", "frontend work", "all the rules" — too broad.

## Step 3 — Map dependencies

For each ticket, determine whether it depends on another ticket being merged first. A ticket B depends on ticket A if:

- B calls a function, class, or endpoint created by A
- B runs a migration that assumes A's migration has already run
- B's tests import code that A writes

Write the dependency graph before writing the task list. Use this format:

```
Ticket 1: no dependencies
Ticket 2: requires Ticket 1 merged
Ticket 3: requires Ticket 1 + Ticket 2 merged
Ticket 4: requires Ticket 1 merged (independent of Ticket 2 and 3)
```

Tickets with no dependencies on each other CAN run in parallel windows.
Tickets with dependencies MUST run sequentially — the dependency must be merged first.

## Step 4 — Write the task list

Use `gh issue edit` to add a Task section to the PRD issue body:

```
gh issue edit <issue-number> --body "$(gh issue view <issue-number> --json body -q .body)

## Tasks
- [ ] Ticket 1: <description> | domain: <name> | no dependencies
- [ ] Ticket 2: <description> | domain: <name> | requires: Ticket 1 merged
- [ ] Ticket 3: <description> | domain: <name> | requires: Ticket 1 + 2 merged
..."
```

Each ticket description must include:

- What is being built (e.g. "OrderCalculator service — subtotal, tax, total")
- Which domain (e.g. "domain: billing")
- Explicit dependency tag (e.g. "requires: Ticket 1 merged" or "no dependencies")

The dependency tag is read by the next Claude window when it loads the PRD — it tells it whether to check for merged PRs before starting.

## Step 5 — Confirm to user

List each ticket with its dependency. State:

> PRD #<N> broken into <X> tickets.
> Dependency order: [show the graph]
> Tickets that can run in parallel: [list if any]
> Start with Ticket 1: <description>
> Command for each window: "Work on Ticket <N> from PRD #<issue>: <description>"
