# Define Seam Contract

## Before running

Read `.claude/skill-config.yaml` to get project paths. Use those paths wherever this skill references `backend/src/domains`, `contracts`, `grill-me-docs`, or `CLAUDE.md`.

---

Before any code crosses a domain boundary, the contract must be written and agreed.

## When to run

During SETUP when a feature will cross a seam listed in `CLAUDE.md` with status
"Not yet established". Do NOT run if the seam is already Active.

## Step 1 — Identify the seam

Read:

1. `CLAUDE.md` — cross-domain seams table
2. `backend/src/domains/<provider>/AGENT_CONTEXT.md`
3. `backend/src/domains/<consumer>/AGENT_CONTEXT.md`

Confirm with the user:

- Which domain is the **provider** (owns the data/capability)
- Which domain is the **consumer** (calls the provider)
- What specific capability is being consumed

## Step 2 — Interview the user

Ask these questions before writing anything. Do not skip.

**Functional:**

1. What business capability is the consumer getting from the provider?
2. What happens to the user's experience if the provider is unavailable?
3. Are there business rules only the provider enforces, which the consumer must respect?
4. Does the consumer store a copy of the data, or always re-fetch?

**Architecture:** 5. How will the consumer call the provider — HTTP, event/message, shared interface, shared DB? 6. Who owns versioning? What is the breaking change protocol? 7. Rate limits or concurrency constraints?

**Data:** 8. What exact fields cross the boundary? List each one. 9. For each field: who is the source of truth? Can the consumer cache it? 10. Any fields the consumer receives but must never display or store?

Do not proceed until all 10 questions have clear answers.

## Step 3 — Create the contract folder and write CONTRACT.md

Folder: `contracts/<provider>-to-<consumer>/`
Use ASCII only — no Unicode arrows in folder names (they break shell commands).

Write `contracts/<provider>-to-<consumer>/CONTRACT.md`:

```markdown
---
established: <today>
established_prd: <PRD issue number if known, else TBD>
provider: <domain>
consumer: <domain>
---

# <Provider> → <Consumer> Contract

## Business reason

<Why does <consumer> need to call <provider>? One paragraph.>

## Capability consumed

<What specific capability or data the consumer gets.>

## Fields crossing the boundary

| Field | Type   | Required | Source of truth | Consumer may cache | Notes |
| ----- | ------ | -------- | --------------- | ------------------ | ----- |
| id    | string | yes      | provider        | yes                |       |

## Fields consumer must NOT store permanently

<List fields that must always be re-fetched, or "None">

## Fields consumer must NOT display

<List sensitive fields, or "None">

## Business rules at the boundary

<Rules the provider enforces that the consumer must not duplicate or override.>
| Rule | Owner | What consumer must do |
|---|---|---|

## Degraded state

<What happens to user experience if the provider is unavailable.>
- User-visible behavior: ...
- Consumer fallback: ...

## Integration method

<HTTP / shared interface / event bus / other>

Reference: `backend/src/domains/<provider>/openapi.yaml`

## Versioning

- Current version: v1
- Breaking change protocol: <how consumer is notified>
- Non-breaking additions: allowed with review

## Error handling

<How the consumer handles provider errors — retry, fallback, surface to user>
```

## Step 4 — Update CLAUDE.md

Use Edit tool to update the seam's status in the Cross-domain seams table:

```
Before: | <provider> | <consumer> | <capability> | Not yet established |
After:  | <provider> | <consumer> | <capability> | Active — established <today> |
```

## Step 5 — Confirm to user

State:

> Seam contract established: <provider> → <consumer>
> contracts/<provider>-to-<consumer>/CONTRACT.md written.
> CLAUDE.md seam status updated to Active.
> Next step: FEATURE cycle — /grill-me → /update-agent-context → /write-a-prd → /break-into-tickets.
