# Rollback PRD

## Before running

Read `.claude/skill-config.yaml` to get project paths. Use those paths wherever this skill references `backend/src/domains`, `contracts`, `grill-me-docs`, or `CLAUDE.md`.

---

Undo a shipped PRD. Use when a shipped feature must be reversed — incorrect business rule, critical bug, reversed product decision, or compliance requirement.

## When to run

After `/ship-feature` has been run and the PRD needs to be reversed. This covers rules, code, and context — not just one layer.

## Step 0 — Assess rollback scope

Read the PRD issue (`gh issue view <issue-number>`) and confirm:

1. Which rules were promoted to active? List them with their IDs.
2. Which rules were superseded? List old rule IDs and what superseded them.
3. What code was merged? List the PRs.
4. Was this a partial ship? (label: `status: partial-ship`)

State the full rollback scope to the user and get confirmation before proceeding. Rollback is irreversible in places (git revert creates new commits; rule status changes are permanent history).

## Step 1 — Revert code

For each merged PR in the PRD:

```
gh pr list --search "PRD #<issue-number>"
```

Create a revert PR for each merged PR:

```
git revert <merge-commit-sha> --no-edit
git push origin revert/prd-<issue-number>-ticket-<N>
gh pr create --title "Revert: PRD #<issue-number> Ticket N — <reason>" \
  --body "Reverting PRD #<issue-number>. Reason: <reason>"
```

Merge revert PRs in reverse dependency order (Ticket N last, Ticket 1 first).

## Step 2 — Roll back domain-rules.yaml

For each rule promoted to `status: active` by this PRD:

- Change `status: active` → `status: retired`
- Add: `retired_by: rollback-PRD-<issue-number>`
- Add: `retired_reason: "<why the rule was rolled back>"`

For each rule that was superseded by this PRD (old rule set to `status: superseded`):

- Change the old rule back to `status: active`
- Remove `superseded_by` field
- Change the new (replacing) rule to `status: retired`, `retired_by: rollback-PRD-<issue-number>`

Use Edit tool — never overwrite the file.

Show the full diff to the user before writing. Wait for explicit "yes".

## Step 3 — Restore AGENT_CONTEXT.md

Read the current AGENT_CONTEXT.md for the affected domain(s). Undo only what this PRD added:

- Remove architecture pattern entries added by this PRD (if still accurate from code revert).
- Remove file locations added by this PRD.
- Remove owned tables added by this PRD.
- Add a Known debt entry:
  ```
  - PRD #<N> was rolled back on <date>. Reason: <reason>. Rules retired: <list>.
  ```

Do not restore the `## Ticket handoffs` section — that was cleared at ship time and the archive is in `grill-me-docs/<name>/handoffs-PRD-<N>.md` if needed for reference.

## Step 4 — Restore CLAUDE.md

If this PRD established any seam, change its status back:

- `Active — established in PRD #<N>` → `Rolled back — PRD #<N> reverted`

## Step 5 — Reopen and relabel the PRD issue

```
gh issue reopen <issue-number>
gh issue edit <issue-number> --remove-label "status: shipped" --add-label "status: rolled-back"
gh issue comment <issue-number> --body "Rolled back on $(date +%Y-%m-%d). Reason: <reason>. Revert PRs: <list>."
```

## Step 6 — Git commit

```
git add backend/src/domains/<name>/domain-rules.yaml
git add backend/src/domains/<name>/AGENT_CONTEXT.md
git add CLAUDE.md
git commit -m "Rollback: PRD #<N> — <reason>"
```

## Step 7 — Confirm to user

State:

> Rollback complete for PRD #<N>: <feature-name>
>
> - Code: <N> revert PRs merged
> - Rules: <N> rules retired, <N> rules restored to active
> - AGENT_CONTEXT.md: context entries removed
> - CLAUDE.md: seam statuses reverted
> - PRD #<N>: reopened with label "status: rolled-back"
