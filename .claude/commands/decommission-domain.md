# Decommission Domain

## Before running

Read `.claude/skill-config.yaml` to get project paths. Use those paths wherever this skill references `backend/src/domains`, `contracts`, `grill-me-docs`, or `CLAUDE.md`.

Also verify GitHub CLI authentication before running: `gh auth status`

---

Retire a domain from the Knowledge Loop. Use when a product area is removed, merged into another domain, or no longer actively maintained.

**This is a high-impact operation.** Confirm scope with the user before any write.

## When to run

When a domain's purpose is permanently retired — not temporarily paused. If the domain is just not being worked on, do nothing. Run this only when the domain's code and responsibilities are being removed or absorbed.

## Step 0 — Confirm scope

Read:

1. `backend/src/domains/<name>/AGENT_CONTEXT.md`
2. `backend/src/domains/<name>/domain-rules.yaml`
3. `CLAUDE.md` — check all seam rows that involve this domain

State to the user:

> Decommissioning domain: <name>
>
> - Active rules: <N> (will be retired)
> - Seams as provider: <list> (will be marked inactive)
> - Seams as consumer: <list> (will be marked inactive)
> - Grill-me logs: grill-me-docs/<name>/ (will be archived)
>
> Confirm? (yes to proceed / no to cancel)

Do not proceed without explicit "yes."

## Step 1 — Retire all active rules

For each rule with `status: active` in `domain-rules.yaml`:

First, create a decommission GitHub issue:

```bash
gh issue create \
  --title "Decommission domain: <name>" \
  --body "Retiring domain <name>. All active rules retired in this issue." \
  --label "decommission"
# Save returned issue number as DECOMMISSION_ISSUE
```

Then for each active rule:

- Change `status: active` → `status: retired`
- Add: `retired_by_prd: <DECOMMISSION_ISSUE>`
- Add: `retired_reason: "Domain <name> decommissioned"`

Show the full diff before writing. Wait for "yes."

## Step 2 — Mark seam contracts inactive

For each seam in `CLAUDE.md` where this domain is provider or consumer:

1. Update the seam status in CLAUDE.md:
   - `Active — established in PRD #N` → `Inactive — domain <name> decommissioned`

2. Add a note to the top of `contracts/<provider>-to-<consumer>/CONTRACT.md`:

   ```
   > ⚠ INACTIVE — Domain <name> was decommissioned. This contract is archived for reference only.
   ```

3. Do NOT delete CONTRACT.md — it stays as an audit trail.

## Step 3 — Update CLAUDE.md domain table

Change the domain row:

```
Before: | <name> | <purpose> | active |
After:  | <name> | <purpose> — DECOMMISSIONED (PRD #<DECOMMISSION_ISSUE>) | inactive |
```

## Step 4 — Archive domain files

Move (do not delete) the domain folder to an archive location:

```bash
mkdir -p backend/src/domains/_archived
git mv backend/src/domains/<name> backend/src/domains/_archived/<name>
```

This preserves history in git while removing the domain from the active path. Future `/health-check` runs will skip folders under `_archived/`.

## Step 5 — Archive grill-me-docs

```bash
mkdir -p grill-me-docs/_archived
git mv grill-me-docs/<name> grill-me-docs/_archived/<name>
```

Update `grill-me-docs/INDEX.md`: add a comment above all entries for this domain:

```
<!-- Domain <name> decommissioned — entries below are archived -->
```

## Step 6 — Git commit

```bash
git add backend/src/domains/_archived/<name>/
git add grill-me-docs/_archived/<name>/
git add CLAUDE.md
git add contracts/
git commit -m "Decommission domain: <name> — rules retired, seams inactive, files archived"
```

## Step 7 — Confirm to user

State:

> Domain decommissioned: <name>
>
> - domain-rules.yaml: <N> rules retired (retired_by_prd: #<DECOMMISSION_ISSUE>)
> - CLAUDE.md: domain row marked inactive, <N> seams marked inactive
> - Contracts: <N> CONTRACT.md files marked inactive (not deleted)
> - Files: domain and grill-me-docs archived to \_archived/
> - Decommission issue: #<DECOMMISSION_ISSUE>
>
> The domain's history is fully preserved in git. Run /health-check to confirm no dangling references remain.
