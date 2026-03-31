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

   **Template selection:**
   - **Feature PRD** (default): use the template below. Covers new behavior being added.
   - **Refactor PRD**: use the template below but replace User Stories with:
     - "What is wrong now" — specific problems with the current implementation
     - "What is being removed or replaced" — exact modules/patterns being deleted
     - "Migration path" — sequence of steps from current to end state
     - "Rollback plan" — how to undo if the refactor is wrong
   - **Bug fix PRD**: use the template below but replace User Stories with:
     - "Reproduction steps" — exact steps to reproduce
     - "Root cause" — confirmed hypothesis with evidence
     - "Affected scope" — users, data, environments impacted
     - "Regression test" — the test that proves it's fixed and won't recur

6. **Immediately after the issue is submitted** — mint rule IDs and run conflict detection:

   a. **Mint rule IDs** for every rule with `action: add` in the "Business Rules Affected" section.
   Format: `RULE-<DOMAIN>-P<issue-number>-<seq>` where seq starts at 1.
   Example: PRD issue #10, first new billing rule → `RULE-BILLING-P10-1`.
   This format is collision-proof — the issue number is globally unique, no registry needed.

   b. **Edit the PRD issue body** to replace any placeholder descriptions with the minted IDs.
   Use `--body-file` to avoid shell injection from special characters in rule text (formulas with `$`, backticks, parentheses will corrupt `--body "$(...)"`):

   ```bash
   gh issue view <number> --json body -q .body > /tmp/prd-body.md
   # Edit /tmp/prd-body.md: replace placeholder rule descriptions with minted IDs
   gh issue edit <number> --body-file /tmp/prd-body.md
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
