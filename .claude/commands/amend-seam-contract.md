# Amend Seam Contract

## Before running

Read `.claude/skill-config.yaml` to get project paths. Use those paths wherever this skill references `backend/src/domains`, `contracts`, `grill-me-docs`, or `CLAUDE.md`.

Also verify GitHub CLI authentication before running: `gh auth status`

---

Amend an existing cross-domain seam contract. Use when a field needs to be added, a type changed, a field deprecated, or degraded-state behavior updated. This is not for new seams — use `/define-seam-contract` for those.

## When to run

When a feature requires a change to an existing `contracts/<provider>-to-<consumer>/CONTRACT.md`.

## Step 0 — Read the existing contract

```
cat contracts/<provider>-to-<consumer>/CONTRACT.md
```

Identify:

- What is currently in the contract (fields, types, degraded state, versioning)
- What change is needed (add field, change type, deprecate field, update degraded state)
- Current contract version

## Step 1 — Classify the change

| Change type                       | Breaking? | Action                                                          |
| --------------------------------- | --------- | --------------------------------------------------------------- |
| Add optional field                | No        | Minor amendment — consumer not required to use it               |
| Add required field                | **Yes**   | Breaking — consumer must handle new field before provider ships |
| Remove or rename field            | **Yes**   | Breaking — consumer must stop using field before it disappears  |
| Change field type                 | **Yes**   | Breaking — consumer must adapt before provider ships            |
| Add a new degraded-state behavior | No        | Minor amendment                                                 |
| Update versioning protocol        | Depends   | Assess case by case                                             |

Breaking changes require a migration sequence (see Step 3). Non-breaking changes can ship in one PR.

## Step 2 — Interview for the amendment

Ask:

1. Which field is changing and why?
2. For new fields: is this required or optional? What is the default if absent?
3. For removed fields: which consumer code reads this field? What replaces it?
4. For type changes: is the old type still accepted during a migration window?
5. What consumer contract tests need to be added or updated?
6. Which PR ships first — provider (adds the field) or consumer (reads it)?

## Step 3 — Migration sequence for breaking changes

Breaking changes require explicit sequencing to avoid runtime failures:

**Adding a required field:**

1. Provider PR: add field but keep it optional (backwards-compatible).
2. Consumer PR: update code to send/read the field. Merge first.
3. Provider PR 2: make the field required once all consumers are updated.

**Removing a field:**

1. Provider PR: mark field as deprecated in CONTRACT.md. Keep sending it.
2. Consumer PR: remove all reads of the deprecated field. Merge first.
3. Provider PR 2: stop sending the field once all consumers have updated.

Document the migration sequence in the amendment PR description so reviewers understand the ship order.

## Step 4 — Write the amendment

Edit `contracts/<provider>-to-<consumer>/CONTRACT.md`:

- Update the `Fields crossing the boundary` table with the new/changed/removed field.
- Increment the version: `Current version: v<N+1>`
- Add a version history entry:
  ```
  ## Version history
  - v<N+1> — <date>: <what changed and why>
  - v<N> — <date>: <previous change>
  ```
- Update `## Business rules at the boundary` if any rule changed.
- Update degraded state section if applicable.

Use Edit tool — never overwrite the file.

**CODEOWNERS gate:** This edit requires approval from both `@<provider-team>` and `@<consumer-team>` (defined in `.github/CODEOWNERS`). Open a PR — do not commit directly to main.

```bash
TMPFILE=$(mktemp /tmp/contract-amendment-XXXXXX.md)
trap "rm -f $TMPFILE" EXIT
# Write amendment notes to $TMPFILE
git add contracts/<provider>-to-<consumer>/CONTRACT.md
git commit -m "Amend contract: <provider>→<consumer> v<N+1> — <what changed>"
gh pr create \
  --title "Contract amendment: <provider>→<consumer> v<N+1>" \
  --body "$(cat $TMPFILE)"
```

## Step 5 — Trigger contract tests

The CI workflow at `.github/workflows/contract-<provider>-to-<consumer>.yml` fires automatically when CONTRACT.md changes. Confirm it ran and passed after the PR is merged:

```
gh run list --workflow=contract-<provider>-to-<consumer>.yml
```

If the workflow doesn't exist yet, run `/define-seam-contract` Step 5b to create it.

## Step 6 — Confirm to user

State:

> Seam contract amended: <provider> → <consumer>
> Version: v<N> → v<N+1>
> Change type: <breaking / non-breaking>
> CONTRACT.md updated — PR opened for CODEOWNERS review.
> Contract CI triggered — verify it passes before merging consumer-side code.
