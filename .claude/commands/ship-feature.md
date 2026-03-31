# Ship Feature

## Before running

Read `.claude/skill-config.yaml` to get project paths. Use those paths wherever this skill references `backend/src/domains`, `contracts`, `grill-me-docs`, or `CLAUDE.md`.

---

After all tickets for a PRD are merged and tests pass, run this skill to update the
knowledge layer and close the feature loop.

## When to run

After every ticket PR for a PRD is merged. Run once per PRD.

## Step 0 — Pre-flight checks (HALT if any fail)

Read `AGENT_CONTEXT.md` and the PRD GitHub issue (`gh issue view <issue-number>`) and verify:

| Check                     | Condition                                                                             | Failure action                            |
| ------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------- |
| All rules have minted IDs | Every rule in the PRD's "Business Rules Affected" has a `RULE-<DOMAIN>-P<N>-<seq>` ID | HALT — run /write-a-prd to mint IDs first |
| All ticket PRs merged     | GitHub shows all checkboxes checked                                                   | HALT — see partial ship path below        |

**Partial ship path** — if one or more tickets are blocked (external dependency, deferred decision, indefinitely stalled):

You do not need to wait. Ask the user: "Ticket N is blocked. Do you want to partial-ship the merged tickets now?"

If yes:

1. Proceed with this skill using only the merged tickets in scope.
2. In Step 2, write only rules that belong to merged-ticket scope. Leave deferred rules in the PRD as-is.
3. In Step 5, do **not** close the issue — add label `status: partial-ship` instead.
4. Add a Known debt entry in AGENT_CONTEXT.md: "PRD #N partial-ship — Ticket X deferred: [reason]."
5. The deferred work is captured in a new PRD that references this one: "Continuation of PRD #N, Ticket X."

If no: HALT — merge remaining tickets first.

If all checks pass (or partial ship agreed): proceed.

## Step 1 — Gather context

Read:

1. The PRD GitHub issue: `gh issue view <issue-number>`
2. `backend/src/domains/<name>/AGENT_CONTEXT.md`
3. `backend/src/domains/<name>/domain-rules.yaml`
4. `CLAUDE.md`

Identify from the PRD:

- Feature name and issue number
- Business Rules Affected section (which rule IDs were changed)
- Domains involved

**Divergence check:** Compare the PRD's described feature scope with what the code actually implements. If they differ:

- Flag: "PRD says X, code does Y"
- Ask the user:
  - A) Update the PRD to reflect what was built — then proceed
  - B) Revert code to match PRD — do not ship until code matches
  - C) Ship as-built and note the divergence in the PRD issue
- Wait for user choice before continuing.

## Step 2 — Write rules to domain-rules.yaml

Read the PRD's "Business Rules Affected" section. For each rule:

**`action: add`** — stale conflict re-check before writing:

Run `/validate-knowledge` for this rule against the **current** domain-rules.yaml. Between PRD creation and now, other PRDs may have shipped overlapping rules. Use the same incoming rule text (plain_english + formula from the PRD).

- CLEAN → proceed to write.
- BLOCKED → surface the conflict to the user before writing. Do not write until resolved.

Once cleared, write the rule to domain-rules.yaml as `status: active`:

```yaml
- id: RULE-<DOMAIN>-P<N>-<seq> # from PRD "Business Rules Affected"
  status: active
  plain_english: > # copy from PRD, expand if needed
    <verbose description>
  formula: '<calculation or condition>'
  why: '<business rationale>'
  introduced_prd: <issue number>
```

**`action: supersede`** — run `/validate-knowledge` first (chain-impact check), then:

- Set old rule: `status: superseded`, `superseded_by: <new-rule-id>`
- Write new rule as `status: active`, `supersedes: <old-rule-id>`, `introduced_prd: <issue number>`

**`action: no_change`** — skip. Nothing to write.

Use Edit tool on domain-rules.yaml — never overwrite the file.

## Step 3 — Update AGENT_CONTEXT.md

For the domain(s) involved, use Edit tool to update:

- **Architecture patterns** — if new patterns were introduced
- **File locations** — if new files were added
- **Owned tables** — if schema changed
- **Known debt** — review the `## Known debt` section. Mark items resolved during this PRD's tickets (TDD surfaced debt or explicit resolution). Format:

  ```
  - ~~[debt description]~~ ← resolved in PRD #N
  ```

  Do not delete — strike-through preserves history. Only mark items explicitly addressed by this PRD's merged code.

- **Ticket handoffs** — before clearing, archive the handoff content:
  1. Copy the full `## Ticket handoffs` section content.
  2. Write it to `grill-me-docs/<prd-brief-name>/handoffs-PRD-<issue-number>.md` — this preserves the in-flight reasoning for post-ship debugging.
  3. Then clear the section in AGENT_CONTEXT.md: delete from `## Ticket handoffs` heading to end of that section (all `### Ticket N` entries). The live context is cleaned; the archive is in grill-me-docs.

Do not rewrite the whole file — only update sections that changed.

## Step 4 — Update CLAUDE.md

For any seam that was established during this feature:

- Update status from `Not yet established` to `Active — established in PRD #<N>`

For any capability or domain that changed status:

- Update the Domains table row if the purpose description changed

Use Edit tool.

## Step 5 — Close the PRD issue

```
gh issue edit <number> --add-label "status: shipped"
gh issue close <number> --comment "Shipped. All <N> tickets merged. Rules promoted to active."
```

## Step 6 — Create git commit

```
git add backend/src/domains/<name>/AGENT_CONTEXT.md
git add backend/src/domains/<name>/domain-rules.yaml
git add CLAUDE.md
git commit -m "Ship: <feature-name> — rules active, context updated"
```

## Step 7 — Confirm to user

State:

> Feature shipped: <name>
>
> - domain-rules.yaml: <N> rules promoted to active
> - AGENT_CONTEXT.md: updated (patterns, debt, tables)
> - CLAUDE.md: seam statuses updated
> - PRD #<N>: closed with label "status: shipped"
>   Next step: FEATURE cycle for next PRD.
