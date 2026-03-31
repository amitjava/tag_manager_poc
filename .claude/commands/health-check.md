# Health Check

## Before running

Read `.claude/skill-config.yaml` to get project paths. Use those paths wherever this skill references `backend/src/domains`, `contracts`, `grill-me-docs`, or `CLAUDE.md`.

---

Validate consistency across the entire knowledge layer. Run this at any time, but especially before a major overhaul, after a brownfield import, or when a team suspects the knowledge files have drifted.

## When to run

- On demand: "run health-check on the billing domain"
- Before a batch supersede overhaul
- After a brownfield import
- Periodically (suggested: once per quarter or after every 5 shipped PRDs)

## Step 1 — Scan domain-rules.yaml files

For each domain with a `domain-rules.yaml`, check:

**ID uniqueness:**

- Collect all rule IDs across all domain-rules.yaml files.
- If any ID appears more than once (even across domains): flag as `DUPLICATE-ID`.

**introduced_prd integrity:**

- Collect all **unique** `introduced_prd` values across all rules (deduplicate — many rules share the same PRD).
- For small sets (≤ 50 unique PRD numbers): verify each with `gh issue view <number>`.
- For larger sets: batch-verify using the GitHub GraphQL API to avoid rate limits:
  ```
  gh api graphql -f query='{ repository(owner:"<owner>", name:"<repo>") {
    n1: issue(number: N1) { number state }
    n2: issue(number: N2) { number state }
    ...
  }}'
  ```
  If GraphQL is not available, sample-check 20 random PRD numbers and warn: "Full introduced_prd check skipped — too many unique values for sequential verification."
- If an issue is not found or returns 404: flag as `BROKEN-INTRODUCED-PRD`.

**superseded_by integrity:**

- For each `superseded_by` value, verify the referenced rule ID exists somewhere in any domain-rules.yaml.
- If not found: flag as `BROKEN-SUPERSEDED-BY`.

**depends_on integrity:**

- For each `depends_on` value, verify the referenced rule ID exists and is `status: active`.
- If the referenced rule is `superseded` or `retired`: flag as `STALE-DEPENDS-ON`.
- Walk the full `depends_on` chain for each rule. If any cycle is detected: flag as `CIRCULAR-DEPENDS-ON`.

**review_by dates:**

- For each rule with a `review_by` field, check if the date is in the past.
- If `review_by` < today: flag as `REVIEW-OVERDUE` with the rule ID and review_reason.

**Status consistency:**

- A rule with `status: active` must not have a `superseded_by` field.
- A rule with `status: superseded` must have a `superseded_by` field.
- A rule with `status: retired` must have a `retired_by` field.
- Flag any violation as `STATUS-FIELD-MISMATCH`.

## Step 2 — Scan CLAUDE.md

**Seam status consistency:**

- For each seam row with status `Active — established in PRD #N`: verify that `contracts/<provider>-to-<consumer>/CONTRACT.md` exists.
- If the CONTRACT.md file does not exist: flag as `SEAM-STATUS-MISMATCH`.

**Domain table completeness:**

- For each domain listed in CLAUDE.md's Domains table: verify that `backend/src/domains/<name>/AGENT_CONTEXT.md` and `backend/src/domains/<name>/domain-rules.yaml` both exist.
- If either is missing: flag as `DOMAIN-FILES-MISSING`.

**Rolled-back seams:**

- For each seam with status `Rolled back`: verify the corresponding CONTRACT.md file still exists (for audit purposes).

## Step 3 — Scan AGENT_CONTEXT.md files

For each domain's AGENT_CONTEXT.md:

**File location references:**

- For each path in the File locations section: verify the path exists. Flag missing paths as `STALE-FILE-LOCATION`.

**Owned tables:**

- For each table in Owned tables: search migration files for `CREATE TABLE "<table>"` or `rename_table.*"<table>"`. If not found: flag as `UNVERIFIED-TABLE`.

**Size:**

- Report line count for each AGENT_CONTEXT.md. Flag any > 500 lines as `CONTEXT-TOO-LARGE` with a recommendation to archive stale sections.

## Step 4 — Scan grill-me-docs

**INDEX.md completeness:**

- List all `grill-me-docs/<feature>/grill-me-NN.md` files.
- For each file, verify an entry exists in `grill-me-docs/INDEX.md`.
- Flag any missing entries as `MISSING-INDEX-ENTRY`.

## Step 5 — Report

Emit a structured report:

```
HEALTH CHECK REPORT — <date>
==============================

PASS: <N> checks passed
FAIL: <N> issues found

CRITICAL (data integrity):
  [DUPLICATE-ID] RULE-BILLING-P7-1 appears in billing and loyalty domains
  [CIRCULAR-DEPENDS-ON] RULE-LOYALTY-P4-2 → RULE-BILLING-P3-1 → RULE-LOYALTY-P4-2
  [BROKEN-SUPERSEDED-BY] RULE-BILLING-P10-3: superseded_by RULE-BILLING-P14-1 does not exist

WARNING (staleness):
  [REVIEW-OVERDUE] RULE-BILLING-P7-2: review_by 2025-06-01, reason: "Promotional rate expires"
  [STALE-FILE-LOCATION] billing/AGENT_CONTEXT.md: src/billing/OrderCalculator.ts not found
  [CONTEXT-TOO-LARGE] loyalty/AGENT_CONTEXT.md: 623 lines — consider archiving

INFO:
  [MISSING-INDEX-ENTRY] grill-me-docs/loyalty-restructure/grill-me-02.md has no INDEX.md entry
```

CRITICAL issues must be resolved before the next `/write-a-prd` or `/ship-feature` in the affected domain. These are enforced by convention — skills do not automatically block. Teams should run `/health-check` as part of their sprint kickoff or before any major overhaul, and treat CRITICAL items as blocking.
WARNING issues should be resolved before the next ship.
INFO issues are cleanup tasks.

## Step 6 — Fix guidance

For each CRITICAL issue, provide the exact edit needed:

- **DUPLICATE-ID**: show both occurrences; ask which domain owns the rule; the other domain's rule needs a new ID.
- **BROKEN-SUPERSEDED-BY / BROKEN-INTRODUCED-PRD**: show the broken field; ask whether to remove it or fix the reference.
- **CIRCULAR-DEPENDS-ON**: show the cycle; ask which `depends_on` to remove.
- **STATUS-FIELD-MISMATCH**: show the rule and which field needs adding or removing.

Apply fixes using the Edit tool after human confirmation.
