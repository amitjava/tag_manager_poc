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

Before reverting, determine how the PRs were merged. Check the merge commit:

```bash
gh pr view <pr-number> --json mergeCommit -q .mergeCommit.oid
# If the merge strategy was squash: one commit per PR — use: git revert <sha> --no-edit
# If the merge strategy was merge commit: use: git revert -m 1 <sha> --no-edit
#   (-m 1 specifies "revert to first parent" = the base branch, not the PR branch)
```

Create a revert PR for each merged PR:

```bash
# For squash merges:
git revert <merge-commit-sha> --no-edit
# For merge commits:
git revert -m 1 <merge-commit-sha> --no-edit

git push origin revert/prd-<issue-number>-ticket-<N>
gh pr create --title "Revert: PRD #<issue-number> Ticket N — <reason>" \
  --body "Reverting PRD #<issue-number>. Reason: <reason>"
```

Merge revert PRs in reverse dependency order (Ticket N first, Ticket 1 last). The last-merged ticket has no dependents, so it is safe to revert first.

**Database migrations:** If any ticket added a database migration, `git revert` un-writes the migration file but does NOT roll back the database schema. For each migration file being reverted:

1. Write a new down-migration that undoes the schema change (e.g. `DROP COLUMN` for an `ADD COLUMN`, `DROP TABLE` for a `CREATE TABLE`).
2. Run the down-migration before merging the code revert PR.
3. Add the down-migration file to the same revert PR so schema and code stay in sync.

If a down-migration is risky (data loss), ask the user whether to proceed or defer the schema rollback to a future migration.

## Step 2 — Roll back domain-rules.yaml

For each rule promoted to `status: active` by this PRD:

First, create a GitHub issue to anchor the rollback (this issue number becomes the `retired_by_prd` reference — making it queryable like any other PRD reference):

```bash
gh issue create \
  --title "Rollback: PRD #<issue-number> — <reason>" \
  --body "Rolling back PRD #<issue-number>. Reason: <reason>. Revert PRs: <list>." \
  --label "rollback"
# Save the returned issue number as ROLLBACK_ISSUE
```

Then update rules using that issue number:

- Change `status: active` → `status: retired`
- Add: `retired_by_prd: <ROLLBACK_ISSUE>` (integer, not a string — keeps the same format as `introduced_prd`)
- Add: `retired_reason: "<why the rule was rolled back>"`

For each rule that was superseded by this PRD (old rule set to `status: superseded`):

- Change the old rule back to `status: active`
- Remove `superseded_by` field
- Change the new (replacing) rule to `status: retired`, `retired_by_prd: <ROLLBACK_ISSUE>`

Use Edit tool — never overwrite the file.

**Repair depends_on references:** After updating rule statuses, scan all domain-rules.yaml files for any rule with `depends_on` pointing to a rule that was just retired. For each found:

```
⚠ DEPENDS_ON REPAIR NEEDED
  Rule <ID> has depends_on: <retired-rule-id>
  Options:
    A) Point depends_on to the restored predecessor rule (the old rule now back to active)
    B) Remove the depends_on entirely — the dependency no longer makes sense
    C) Flag as DATA-INTEGRITY — human must decide
```

Surface each case to the user and apply their choice before writing. Do not leave a `depends_on` pointing at a `retired` rule.

Show the full diff (rule status changes + depends_on repairs) to the user before writing. Wait for explicit "yes".

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

## Step 6.5 — Data impact note

**Code rollback does not undo data already written by the shipped PRD.** If the PRD applied business rules to real production data (loyalty points earned, prices calculated, records created under new logic), reverting the code does not fix that data.

Explicitly ask the user:

> "PRD #<N> has been rolled back in code and rules. Were any business operations processed under this PRD's rules in production? If yes, a data correction task is needed separately. Should I create a GitHub issue to track the data remediation?"

If yes, create the issue:

```bash
gh issue create \
  --title "Data remediation: rollback of PRD #<N>" \
  --body "PRD #<N> was rolled back. Any data processed under its rules may need correction. Scope: <describe what data was affected>." \
  --label "data-remediation"
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
