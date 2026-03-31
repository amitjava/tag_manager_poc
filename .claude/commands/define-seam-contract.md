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

## Step 5 — Enforce the contract with a CODEOWNERS rule

A CONTRACT.md with a comment saying "never edit manually" is aspirational — it relies on humans reading and obeying the comment. Add a technical enforcement layer:

1. Open (or create) `.github/CODEOWNERS` in the repo root.
2. Add a line:
   ```
   contracts/<provider>-to-<consumer>/CONTRACT.md  @<provider-team> @<consumer-team>
   ```
   Replace `<provider-team>` and `<consumer-team>` with the GitHub team slugs that own each domain (e.g. `@acme/billing-team @acme/loyalty-team`). If teams are not set up, use individual GitHub handles.
3. This means any PR that touches CONTRACT.md requires a review approval from both domain owners — GitHub enforces it, not a comment.

If CODEOWNERS cannot be set up (no GitHub teams, non-GitHub VCS), note the gap explicitly:

```
⚠ CONTRACT ENFORCEMENT: CODEOWNERS not configured.
This contract relies on process only — no technical gate.
Flag in CLAUDE.md Known limitations section.
```

## Step 5b — Add contract change CI trigger

Contract tests written at seam establishment need to re-run automatically when the contract changes. Without this, a field addition or type change in CONTRACT.md silently breaks consumers until their next full CI run.

Create `.github/workflows/contract-<provider>-to-<consumer>.yml`:

```yaml
name: Contract test trigger — <provider> → <consumer>

on:
  push:
    paths:
      - 'contracts/<provider>-to-<consumer>/CONTRACT.md'
  pull_request:
    paths:
      - 'contracts/<provider>-to-<consumer>/CONTRACT.md'

jobs:
  consumer-contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run <consumer> contract tests
        run: |
          # Replace with the actual command to run contract tests for the consumer domain
          # e.g: npm test --testPathPattern="<consumer>/contract"
          echo "Run consumer contract tests here"
      - name: Notify on failure
        if: failure()
        run: echo "CONTRACT CHANGED — consumer tests failed. Review CONTRACT.md diff."
```

Fill in the actual test command for the consumer domain. The workflow name and path pattern are derived from the contract folder name — keep them in sync if the folder is ever renamed.

If CI is not GitHub Actions, adapt the trigger to your CI system. The key requirement: **any change to CONTRACT.md must automatically re-run the consumer's contract tests**.

## Step 6 — Confirm to user

State:

> Seam contract established: <provider> → <consumer>
> contracts/<provider>-to-<consumer>/CONTRACT.md written.
> CLAUDE.md seam status updated to Active.
> .github/CODEOWNERS updated — both domain owners must approve changes to this contract.
> Next step: FEATURE cycle — /grill-me → /update-agent-context → /write-a-prd → /break-into-tickets.
