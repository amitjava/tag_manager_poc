# Brownfield Import

## Before running

Read `.claude/skill-config.yaml` to get project paths. Use those paths wherever this skill references `backend/src/domains`, `contracts`, `grill-me-docs`, or `CLAUDE.md`.

---

Onboard an existing codebase into the Knowledge Loop framework. Use when adopting the framework on a project that already has business logic, tests, and architecture — not starting from scratch.

## When to run

Once, at framework adoption time, per domain. Run `/scaffold-domain` first (creates folder structure), then run this skill to populate it with extracted knowledge.

## Step 0 — Scope one domain

Do not try to import all domains at once. Pick one domain:

1. Which existing folder or module maps to this domain? (e.g. `src/billing/`, `app/orders/`)
2. What is the domain name? (e.g. `billing`, `loyalty`, `fulfillment`)

Confirm with the user before extracting.

## Step 1 — Read the existing code

Read all files in the domain's source folder:

- Service classes, models, business logic
- Existing tests (these reveal intended behavior)
- Any existing comments, README, or inline documentation

Read the database schema for tables this domain owns (migration files, ORM models).

Read any existing API contracts or interface definitions for this domain's public surface.

## Step 2 — Extract business rules

From the code and tests, identify every business rule currently enforced. A business rule is:

- A calculation (e.g. "discount = subtotal × 0.15")
- A condition that gates behavior (e.g. "refunds only within 30 days")
- A policy applied to data (e.g. "loyalty points excluded from gift card orders")

For each rule found:

- Write `plain_english` at the verbose level required by the YAML spec (80+ words).
- Write `formula` if there is a calculation.
- Write `why` — infer from tests, comments, or ask the user if unclear.
- Assign a temporary ID: `RULE-<DOMAIN>-IMPORT-<seq>` (e.g. `RULE-BILLING-IMPORT-1`).
- Set `status: active`, `introduced_prd: brownfield-import`.

Show the full list to the user before writing. Ask: "Are these all the active rules? Any I missed or misunderstood?"

## Step 3 — Run validate-knowledge on extracted rules

For each extracted rule, run `/validate-knowledge` against itself (the other extracted rules) to detect intra-domain overlaps before writing. This catches cases where two code paths enforce contradictory behavior that no one noticed.

- CLEAN: proceed.
- CONFLICT-UNRESOLVABLE: surface to the user — the existing code may have a latent bug.

## Step 4 — Write domain-rules.yaml

Write all approved rules to `backend/src/domains/<name>/domain-rules.yaml`.

Use Edit tool if the file already has content. Use Write only if the file is empty.

## Step 5 — Extract AGENT_CONTEXT.md

From the same code read in Step 1, fill in the AGENT_CONTEXT.md sections:

**Domain summary** — one paragraph describing what this domain is responsible for.

**Architecture patterns** — patterns used in the existing code (e.g. "uses repository pattern", "event-driven via RabbitMQ", "REST endpoints only, no GraphQL").

**Owned tables** — tables this domain's code writes to.

**File locations** — key files: service layer, models, tests, migrations.

**Glossary** — domain-specific terms found in the code. For each: one-sentence definition.

**Known debt** — obvious debt visible in the code (TODOs, hacks, commented-out sections, test skips). List each item.

**Known seams** — integration points with other domains (function calls, events, HTTP calls crossing domain boundaries).

Show draft to the user before writing. Ask for corrections.

## Step 6 — Update CLAUDE.md

Add this domain to the Domains table in CLAUDE.md:

```
| <name> | <one-line purpose> | brownfield-import |
```

If CLAUDE.md doesn't exist yet, run `/initialize-knowledge-loop` first.

## Step 7 — Create a brownfield-import grill-me log

Write a summary of the import session to `grill-me-docs/<domain-name>/brownfield-import.md`:

```markdown
# Brownfield Import — <domain-name>

Date: <date>

## Rules extracted

<list of rule IDs and one-line summaries>

## Gaps and uncertainties

<rules where the "why" was inferred, not confirmed>
<business logic found in tests but missing from main code>

## Debt logged

<items added to Known debt>

## Open questions

<anything the import surfaced that needs human clarification>
```

## Step 8 — Confirm to user

State:

> Brownfield import complete for domain: <name>
>
> - domain-rules.yaml: <N> rules extracted and written
> - AGENT_CONTEXT.md: populated (architecture, tables, glossary, debt)
> - CLAUDE.md: domain added
> - Import log: grill-me-docs/<name>/brownfield-import.md
>
> Recommended next step: review the import log's "Open questions" section and run /grill-me for any area where the extracted "why" was inferred rather than confirmed.
