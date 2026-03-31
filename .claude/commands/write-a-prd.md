## Before running

Read `.claude/skill-config.yaml` to get project paths. Use those paths wherever this skill references `backend/src/domains`, `contracts`, `grill-me-docs`, or `CLAUDE.md`.

---

This skill will be invoked when the user wants to create a PRD. Steps 1–4 are flexible — use judgment. Steps 5–6 are mandatory and must not be skipped: they mint rule IDs and run the conflict gate that the rest of the framework depends on.

1. Ask the user for a long, detailed description of the problem they want to solve and any potential ideas for solutions.

2. Explore the repo to verify their assertions and understand the current state of the codebase.

3. Interview the user relentlessly about every aspect of this plan until you reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.

4. Sketch out the major modules you will need to build or modify to complete the implementation. Actively look for opportunities to extract deep modules that can be tested in isolation.

A deep module (as opposed to a shallow module) is one which encapsulates a lot of functionality in a simple, testable interface which rarely changes.

Run /design-an-interface for any module where the API shape is unclear. Do not guess at interface shapes in the PRD — run the design skill first and reference the chosen design.

Check with the user that these modules match their expectations. Check with the user which modules they want tests written for.

5. Once you have a complete understanding of the problem and solution, choose the right PRD template and submit as a GitHub issue.

   **Template selection — use the matching template tag below:**
   - **Feature PRD** (new behavior): use `<prd-template>`
   - **Refactor PRD** (restructure without adding features): use `<refactor-prd-template>`
   - **Bug fix PRD**: use `<bugfix-prd-template>`
   - **Refactor + Feature** (restructure that also adds capability): use `<refactor-prd-template>` and append the User Stories section from `<prd-template>`

6. **Immediately after the issue is submitted** — mint rule IDs and run conflict detection:

   a. **Mint rule IDs** for every rule with `action: add` in the "Business Rules Affected" section.
   Format: `RULE-<DOMAIN>-P<issue-number>-<seq>` where seq starts at 1.
   Example: PRD issue #10, first new billing rule → `RULE-BILLING-P10-1`.
   This format is collision-proof — the issue number is globally unique, no registry needed.

   b. **Edit the PRD issue body** to replace any placeholder descriptions with the minted IDs.
   Use `--body-file` to avoid shell injection from special characters in rule text (formulas with `$`, backticks, parentheses will corrupt `--body "$(...)"`):

   ```bash
   TMPFILE=$(mktemp /tmp/prd-body-XXXXXX.md)
   trap "rm -f $TMPFILE" EXIT
   gh issue view <number> --json body -q .body > "$TMPFILE"
   # Edit $TMPFILE: replace placeholder rule descriptions with minted IDs
   gh issue edit <number> --body-file "$TMPFILE"
   ```

   **Verify the edit landed:** Immediately after editing, run `gh issue view <number>` and confirm the minted IDs appear in the issue body. If the IDs are missing, retry using the same `--body-file` approach. Do not continue until the IDs are visible — they are the single source of truth for the rule lifecycle.

   c. **Run `/validate-knowledge`** for each rule with `action: add` or `action: supersede`:
   - Incoming: the rule's plain_english + formula from the PRD
   - Scan: existing active rules in `domain-rules.yaml` for the same domain
   - If BLOCKED: stop, report the conflict to the user, do not proceed until resolved
   - If CLEAN / DECLARED-WRITE / INFERRED-WRITE: proceed — no write to YAML yet

   Rules are NOT written to domain-rules.yaml here. They live in the PRD until `/ship-feature` writes them as active after code is merged.

<prd-template>

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## Workflow Actors

Derived from the grill-me Workflow Actors branch. List every actor in this feature's workflows.

| Actor                      | Type     | What they own              | Autonomous decisions            | Escalates to human when                                |
| -------------------------- | -------- | -------------------------- | ------------------------------- | ------------------------------------------------------ |
| Example: Fulfillment Agent | AI agent | Routes orders to warehouse | Stock available + address valid | Ambiguous address, no stock anywhere, high-value order |
| Example: Customer          | Human    | Places and tracks orders   | —                               | —                                                      |

If no AI agents are involved, write: "No AI agents in this feature — all actors are humans or automated systems."

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

Actors may be human roles, automated systems, or AI agents surfaced in the Workflow Actors section above. Use the canonical agent name from the AGENT_CONTEXT.md Glossary section.

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
2. As a Fraud Detection Agent, I want to flag transactions over $5,000 for human review, so that suspicious activity is caught before funds are released
</user-story-example>

This list of user stories should be extremely extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Business Rules Affected

A structured list of business rules this PRD changes, adds, or leaves untouched.
Use rule IDs from `domain-rules.yaml`. This section is required — it is used by
`/validate-knowledge` and `/ship-feature` for deterministic conflict detection.

Format:

```
changes:
  - rule_id: RULE-<DOMAIN>-P<N>-1
    action: supersede
    new_rule: "<new rule in one sentence>"
    reason: "<why this rule is changing>"

  - rule_id: RULE-<DOMAIN>-P<N>-2
    action: add
    new_rule: "<new rule in one sentence>"
    entity: <entity>
    field: <field>
    operation: <operation>
    reason: "<why this rule is being added>"

  - rule_id: RULE-<DOMAIN>-P<N>-3
    action: no_change
    reason: "<confirm this rule is not affected>"
```

Rule IDs use the format `RULE-<DOMAIN>-P<issue-number>-<seq>` (e.g. `RULE-BILLING-P10-1`).
IDs are minted in step 6 above, immediately after the issue is created — use the returned
issue number. For rules with `action: no_change` or `action: supersede`, use the existing
rule ID from domain-rules.yaml.

## Out of Scope

A description of the things that are out of scope for this PRD.

## Further Notes

Any further notes about the feature.

</prd-template>

<refactor-prd-template>

## Problem Statement

The problem that the current implementation causes, from a developer or product perspective.

## What Is Wrong Now

Specific, concrete description of the current implementation's problems:

- Why it is fragile, slow, unmaintainable, or blocking future work
- Evidence (error rates, test failures, developer pain, performance data)
- Why previous fixes have been insufficient

## What Is Being Removed or Replaced

Exact list of modules, patterns, classes, or APIs being deleted or replaced:

- `ModuleA` — being deleted, replaced by `ModuleB`
- Pattern X — being removed; new code uses Pattern Y

## What Stays the Same

List all behavior, interfaces, and contracts that must not change:

- External API shapes (callers must not notice the refactor)
- Database schema (if not part of the refactor)
- Business rules (list rule IDs that are untouched)

## Migration Path

Step-by-step sequence from current state to end state:

1. Step 1: [what is done first, why]
2. Step 2: [what is done second]
   ...

Include whether this is a flag-day change (all at once) or incremental (parallel run, strangler fig).

## Rollback Plan

How to undo the refactor if it turns out to be wrong:

- What git operations are needed
- Whether any data migration needs reversal
- How long the rollback window is practical

## Testing Decisions

- Which existing tests are being deleted and why (implementation-coupled tests)
- Which existing tests are being rewritten
- Which new behavior tests are being written
- How to verify no behavior regression occurred

## Business Rules Affected

```
changes:
  - rule_id: RULE-<DOMAIN>-P<N>-1
    action: no_change
    reason: "<confirm this rule is not affected by the refactor>"
```

Refactors should rarely add or supersede rules. If the refactor reveals a rule that was wrong, use action: supersede with a clear reason.

## Out of Scope

What will not be changed in this refactor (scope creep boundary).

## Further Notes

Any further notes.

</refactor-prd-template>

<bugfix-prd-template>

## Problem Statement

The bug being fixed, from the user's perspective.

## Reproduction Steps

Exact steps to reproduce the bug:

1. Step 1
2. Step 2
3. Observed: [what happens]
4. Expected: [what should happen]

Environment: [prod only / staging / all envs / specific version]
Deterministic: [yes / intermittent — frequency if known]

## Root Cause

Confirmed hypothesis for root cause:

- Code location: [file, function, line if known]
- Evidence: [log output, test that reproduces it, data example]
- Type: code bug / data bug / design bug / configuration bug

## Affected Scope

- Users affected: [all / specific tier / specific region / specific flow]
- Data affected: [records impacted, estimate if possible]
- Duration: [when did this start, which deploy introduced it if known]
- Workarounds in use today: [yes/no, describe if yes]

## Fix

Description of the fix and why it addresses the root cause.

Similar patterns elsewhere in the codebase that may have the same bug: [list or "none checked"]

## Regression Test

The test that proves:

1. The bug is fixed (was failing before, passes after)
2. It won't silently recur (the test would catch a regression)

## Business Rules Affected

```
changes:
  - rule_id: RULE-<DOMAIN>-P<N>-1
    action: no_change | supersede
    reason: "<if the bug was caused by a wrong rule, supersede it; otherwise no_change>"
```

## Out of Scope

Related issues that are not being fixed in this PRD.

## Further Notes

Any further notes.

</bugfix-prd-template>
